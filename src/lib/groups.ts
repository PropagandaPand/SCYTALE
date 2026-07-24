/**
 * Local group model. A group is a roster of members (each identified by their
 * keys + prekey bundle so anyone can reach anyone) plus a name and id. Messages
 * are fanned out over pairwise Double Ratchet sessions — no group crypto here.
 */
import {
  encodeBundle,
  decodeBundle,
  b64encode,
  b64decode,
  seal,
  open,
  utf8,
  type Bytes,
  type PreKeyBundle,
} from '../crypto';
import { loadRecord, saveRecord, deleteRecord } from './db';
import type { GroupInvite } from './session';

export interface GroupMember {
  signPub: Bytes;
  dhPub: Bytes;
  bundle?: PreKeyBundle; // needed so a member can initiate with another member
  name?: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[]; // excludes self
  createdAt: number;
}

export function randomGroupId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let h = '';
  for (const x of b) h += x.toString(16).padStart(2, '0');
  return 'grp_' + h;
}

export async function toInvite(g: Group): Promise<GroupInvite> {
  return {
    id: g.id,
    name: g.name,
    members: await Promise.all(
      g.members.map(async (m) => ({
        signPub: await b64encode(m.signPub),
        dhPub: await b64encode(m.dhPub),
        bundle: m.bundle ? await encodeBundle(m.bundle) : null,
        name: m.name ?? null,
      })),
    ),
  };
}

export async function fromInvite(inv: GroupInvite): Promise<Group> {
  return {
    id: inv.id,
    name: inv.name,
    createdAt: Date.now(),
    members: await Promise.all(
      inv.members.map(async (m) => ({
        signPub: await b64decode(m.signPub),
        dhPub: await b64decode(m.dhPub),
        bundle: m.bundle ? await decodeBundle(m.bundle) : undefined,
        name: m.name ?? undefined,
      })),
    ),
  };
}

// --- Membership authority ---------------------------------------------------
//
// A group has no group-level signature (pairwise fan-out), and membership is
// deliberately "soft": any CURRENT member may manage the roster/name. The one
// thing that must hold is that non-members and REMOVED members cannot touch a
// victim's group state — otherwise a stale/forged `ginvite` resurrects a removed
// member, or a stranger who learned the 128-bit group id deletes the group with a
// `gremove` (audit F-02). These pure helpers encode that authority check so it is
// unit-testable independent of the React receive path.

function sameKey(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** True if `dhPub` identifies a current member of `g` (by DH public key). */
export function isGroupMember(g: Group, dhPub: Bytes): boolean {
  return g.members.some((m) => sameKey(m.dhPub, dhPub));
}

export type InviteDecision =
  | { verdict: 'accept'; group: Group } // brand-new group — trust on first invite
  | { verdict: 'update'; group: Group } // authorized member update — apply reconciled roster
  | { verdict: 'reject'; reason: string }; // sender not authorized to touch this group

/**
 * Decide how to apply an incoming `ginvite`, authenticated as coming from
 * `senderDhPub`. Authority model = all current members may manage:
 *
 *  - No local group yet → ACCEPT (you are being invited; trust on first invite).
 *  - Local group exists → the sender MUST be a current local member, else REJECT.
 *    A removed member is no longer in the local roster, so their attempt to
 *    re-add themselves is rejected here — the roster cannot be resurrected.
 *
 * On an authorized update the incoming roster is applied (it legitimately carries
 * adds, removes and renames from a trusted member), but local-only state is
 * MERGED rather than clobbered: the group's original createdAt is preserved.
 */
export function decideInvite(
  local: Group | undefined,
  incoming: Group,
  senderDhPub: Bytes,
): InviteDecision {
  if (!local) return { verdict: 'accept', group: incoming };
  if (!isGroupMember(local, senderDhPub)) {
    return { verdict: 'reject', reason: 'Absender ist kein aktuelles Mitglied' };
  }
  return { verdict: 'update', group: { ...incoming, createdAt: local.createdAt } };
}

// --- Persistence (sealed with the DEK) -------------------------------------

const INDEX_AAD = utf8.encode('scytale:group-index:v1');
const aad = (id: string) => utf8.encode(`scytale:group:v1:${id}`);

async function loadIndex(dek: CryptoKey): Promise<string[]> {
  const rec = await loadRecord('group-index');
  if (!rec) return [];
  return JSON.parse(utf8.decode(await open(dek, rec, INDEX_AAD)));
}
async function saveIndex(dek: CryptoKey, ids: string[]): Promise<void> {
  await saveRecord('group-index', await seal(dek, utf8.encode(JSON.stringify(ids)), INDEX_AAD));
}

async function serialize(g: Group): Promise<Bytes> {
  return utf8.encode(JSON.stringify(await toInvite(g)));
}
async function deserialize(bytes: Bytes): Promise<Group> {
  return fromInvite(JSON.parse(utf8.decode(bytes)) as GroupInvite);
}

export async function saveGroup(dek: CryptoKey, g: Group): Promise<void> {
  await saveRecord(`group:${g.id}`, await seal(dek, await serialize(g), aad(g.id)));
  const ids = await loadIndex(dek);
  if (!ids.includes(g.id)) {
    ids.push(g.id);
    await saveIndex(dek, ids);
  }
}

export async function loadGroups(dek: CryptoKey): Promise<Group[]> {
  const out: Group[] = [];
  for (const id of await loadIndex(dek)) {
    const rec = await loadRecord(`group:${id}`);
    if (rec) out.push(await deserialize(await open(dek, rec, aad(id))));
  }
  return out;
}

export async function removeGroup(dek: CryptoKey, id: string): Promise<void> {
  await deleteRecord(`group:${id}`);
  await deleteRecord(`msgs:${id}`);
  const ids = (await loadIndex(dek)).filter((x) => x !== id);
  await saveIndex(dek, ids);
}
