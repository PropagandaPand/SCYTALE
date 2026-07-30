/**
 * Group protocol v3.
 *
 * Group payloads remain pairwise E2EE: one authenticated X3DH/Double-Ratchet
 * copy is produced for every authorised device. That deliberately reuses the
 * application's reviewed 1:1 cryptography instead of inventing a shared group
 * cipher. A member is a PERSON (stable master key), not one device. The roster
 * carries the person's master-signed DeviceList so members that never saved one
 * another can still establish hidden pairwise sessions and revoked devices are
 * excluded by the same guard as normal chats.
 */
import {
  encodeBundle,
  decodeBundle,
  encodeDeviceList,
  decodeDeviceList,
  verifyDeviceList,
  verifyDeviceCert,
  sign,
  verify,
  compareDeviceList,
  bundleFromDeviceEntry,
  b64encode,
  b64decode,
  bytesEqual,
  concatBytes,
  seal,
  open,
  utf8,
  type Bytes,
  type DeviceList,
  type IdentityKeys,
  type PreKeyBundle,
  type SealedRecord,
} from '../crypto';
import {
  loadRecord,
  saveRecordsAtomically,
  secureDeleteRecord,
} from './db';
import { cryptoEraseRoom } from './messages';
import {
  fanoutDeliveries,
  type Contact,
  type GroupInvite,
  type GroupStateProof,
  type MessageContent,
} from './session';

export const GROUP_PROTOCOL_VERSION = 4;
export const MAX_GROUP_MEMBERS = 64;
export const MAX_GROUP_DEVICES_PER_MEMBER = 8;
export const MAX_GROUP_FANOUT_DEVICES = 128;
export const MAX_GROUP_NAME_BYTES = 160;
export const MAX_GROUP_INLINE_ATTACHMENT_BYTES = 600 * 1024;
export const MAX_GROUP_ATTACHMENT_FANOUT_BYTES = 16 * 1024 * 1024;

export interface GroupMember {
  /** Stable person identity. Optional only while loading a legacy v1/v2 group. */
  masterPub?: Bytes;
  /** Highest master/device-list epoch represented by this roster entry. */
  epoch?: number;
  signPub: Bytes;
  dhPub: Bytes;
  /** Primary-device bundle; no OPK because a group roster is broadcast. */
  bundle?: PreKeyBundle;
  /** Authoritative, master-signed current devices (each with a signed prekey). */
  deviceList?: DeviceList;
  name?: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[]; // excludes self
  createdAt: number;
  /** Monotonic roster/name state. Legacy groups start at zero. */
  revision: number;
  /** New v3 groups are managed by their creator's stable master identity. */
  ownerMasterPub?: Bytes;
  /**
   * Complete member set, including this local user. `members` remains the
   * personalized transport directory and excludes self; this global roster is
   * the owner-signed authority state shared byte-for-byte by every recipient.
   */
  roster?: Bytes[];
  /** Hash link to the immediately preceding owner state (zero hash at genesis). */
  previousStateHash?: Bytes;
  /** SHA-256 of the canonical global authority transcript. */
  stateHash?: Bytes;
  /** Terminal owner-authored state; no later revision or re-add is valid. */
  dissolved?: boolean;
  /** Ed25519 signature by the owner master over the global authority transcript. */
  stateSignature?: Bytes;
}

export function randomGroupId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let h = '';
  for (const x of b) h += x.toString(16).padStart(2, '0');
  return 'grp_' + h;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function exactKey(value: Bytes, what: string): Bytes {
  if (value.length !== 32) throw new Error(`Ungültiger ${what} im Gruppenroster.`);
  return value;
}

function safeRevision(value: unknown, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error('Ungültiger Gruppen-Rosterstand.');
  }
  return value as number;
}

function safeTimestamp(value: unknown): number {
  if (value === undefined || value === null) return Date.now();
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new Error('Ungültiger Gruppen-Zeitstempel.');
  }
  return value as number;
}

function validGroupId(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^grp_[0-9a-f]{32}$/.test(id)) {
    throw new Error('Ungültige Gruppen-ID.');
  }
}

function validGroupName(name: unknown): asserts name is string {
  if (typeof name !== 'string') throw new Error('Ungültiger Gruppenname.');
  const size = utf8.encode(name).length;
  if (size < 1 || size > MAX_GROUP_NAME_BYTES) {
    throw new Error('Gruppenname ist leer oder zu lang.');
  }
}

function rosterDeviceCount(members: GroupMember[]): number {
  return members.reduce(
    (sum, member) => sum + Math.max(1, member.deviceList?.devices.length ?? 1),
    0,
  );
}

function validateDeviceListShape(list: DeviceList): void {
  if (
    list.devices.length < 1 ||
    list.devices.length > MAX_GROUP_DEVICES_PER_MEMBER
  ) {
    throw new Error('Ungültige Geräteanzahl im Gruppenroster.');
  }
  const signKeys = new Set<string>();
  const dhKeys = new Set<string>();
  for (const device of list.devices) {
    exactKey(device.signPub, 'Device-Sign-Key');
    exactKey(device.dhPub, 'Device-DH-Key');
    const signKey = keyHex(device.signPub);
    const dhKey = keyHex(device.dhPub);
    if (signKeys.has(signKey) || dhKeys.has(dhKey)) {
      throw new Error('Doppeltes Gerät im Gruppenroster.');
    }
    signKeys.add(signKey);
    dhKeys.add(dhKey);
  }
}

/** Stable identity represented by a member, with a legacy fallback. */
export function memberMasterPub(member: GroupMember): Bytes {
  return (
    member.masterPub ??
    member.deviceList?.masterPub ??
    member.bundle?.masterPub ??
    member.signPub
  );
}

/** Highest trustworthy epoch carried by this member record. */
export function memberEpoch(member: GroupMember): number {
  return Math.max(
    member.epoch ?? 1,
    member.deviceList?.epoch ?? 1,
    member.bundle?.epoch ?? 1,
  );
}

function keyHex(key: Bytes): string {
  let out = '';
  for (const byte of key) out += byte.toString(16).padStart(2, '0');
  return out;
}

function canonicalState(group: Group): string {
  const members = (group.roster ?? group.members.map(memberMasterPub))
    .map(keyHex)
    .sort();
  return JSON.stringify({
    name: group.name,
    owner: group.ownerMasterPub ? keyHex(group.ownerMasterPub) : '',
    dissolved: group.dissolved === true,
    members,
  });
}

const GROUP_STATE_DOMAIN = utf8.encode('SCYTALE-GROUP-STATE-v4\0');
export const GROUP_STATE_HASH_BYTES = 32;
const ZERO_GROUP_STATE_HASH = new Uint8Array(GROUP_STATE_HASH_BYTES);

function isZeroHash(value: Bytes): boolean {
  return value.length === GROUP_STATE_HASH_BYTES &&
    value.every((byte) => byte === 0);
}

function u16be(value: number): Bytes {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff) {
    throw new Error('Gruppen-Transcript-Länge außerhalb des Bereichs.');
  }
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value);
  return out;
}

function u64be(value: number): Bytes {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Gruppen-Transcript-Zahl außerhalb des Bereichs.');
  }
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, BigInt(value));
  return out;
}

function groupIdBytes(id: string): Bytes {
  validGroupId(id);
  const out = new Uint8Array(16);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(id.slice(4 + i * 2, 6 + i * 2), 16);
  }
  return out;
}

function compareKeys(a: Bytes, b: Bytes): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

function groupStateTranscript(group: Group): Bytes {
  if (!group.ownerMasterPub || !group.roster || !group.previousStateHash) {
    throw new Error('Unvollständiger globaler Gruppenstand.');
  }
  validGroupName(group.name);
  const name = utf8.encode(group.name);
  const members = group.roster.map((master) =>
    exactKey(master, 'Roster-Master'),
  ).sort(compareKeys);
  return concatBytes(
    GROUP_STATE_DOMAIN,
    new Uint8Array([GROUP_PROTOCOL_VERSION]),
    groupIdBytes(group.id),
    u64be(group.revision),
    u64be(group.createdAt),
    exactKey(group.ownerMasterPub, 'Gruppen-Owner'),
    group.previousStateHash,
    new Uint8Array([group.dissolved === true ? 1 : 0]),
    u16be(name.length),
    name,
    u16be(members.length),
    ...members,
  );
}

async function hashGroupState(group: Group): Promise<Bytes> {
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', groupStateTranscript(group)),
  );
}

/**
 * Legacy groups have neither an owner nor a monotonic roster clock. Keep this
 * predicate narrow: an ownerless positive revision and an owner at revision
 * zero are malformed hybrids, not legacy compatibility states.
 */
export function isLegacyGroup(
  group: Pick<Group, 'revision' | 'ownerMasterPub'>,
): boolean {
  return !group.ownerMasterPub && (group.revision ?? 0) === 0;
}

function hasValidAuthorityState(group: Group): boolean {
  if (
    !(
    !!group.ownerMasterPub &&
    group.ownerMasterPub.length === 32 &&
    Number.isSafeInteger(group.revision) &&
    group.revision >= 1 &&
    !!group.previousStateHash &&
    group.previousStateHash.length === GROUP_STATE_HASH_BYTES &&
    !!group.stateHash &&
    group.stateHash.length === GROUP_STATE_HASH_BYTES &&
    !!group.stateSignature &&
    group.stateSignature.length === 64
    )
  ) {
    return false;
  }
  if (
    !group.roster ||
    group.roster.length < 1 ||
    group.roster.length > MAX_GROUP_MEMBERS ||
    group.roster.some((master) => master.length !== 32) ||
    (group.revision === 1
      ? !isZeroHash(group.previousStateHash)
      : isZeroHash(group.previousStateHash))
  ) {
    return false;
  }
  const roster = new Set(group.roster.map(keyHex));
  if (
    roster.size !== group.roster.length ||
    !roster.has(keyHex(group.ownerMasterPub))
  ) {
    return false;
  }
  if (group.dissolved === true && group.roster.length !== 1) return false;
  return true;
}

function hasValidV4State(group: Group): boolean {
  if (
    !hasValidAuthorityState(group) ||
    !group.roster ||
    group.members.length + 1 !== group.roster.length
  ) {
    return false;
  }
  const roster = new Set(group.roster.map(keyHex));
  if (
    group.members.some((member) => !roster.has(keyHex(memberMasterPub(member))))
  ) {
    return false;
  }
  return new Set(group.members.map((member) => keyHex(memberMasterPub(member)))).size ===
    group.members.length;
}

export async function verifyGroupState(group: Group): Promise<boolean> {
  if (!hasValidAuthorityState(group)) return false;
  const expectedHash = await hashGroupState(group);
  return (
    bytesEqual(expectedHash, group.stateHash!) &&
    (await verify(
      groupStateTranscript(group),
      group.stateSignature!,
      group.ownerMasterPub!,
    ))
  );
}

export async function toGroupStateProof(
  group: Group,
): Promise<GroupStateProof> {
  if (!(await verifyGroupState(group))) {
    throw new Error('Ungültiger signierter Gruppenstand.');
  }
  return {
    v: GROUP_PROTOCOL_VERSION,
    id: group.id,
    name: group.name,
    revision: group.revision,
    createdAt: group.createdAt,
    ownerMasterPub: await b64encode(group.ownerMasterPub!),
    stateSignature: await b64encode(group.stateSignature!),
    previousStateHash: await b64encode(group.previousStateHash!),
    stateHash: await b64encode(group.stateHash!),
    dissolved: group.dissolved === true,
    roster: await Promise.all(group.roster!.map(b64encode)),
  };
}

export async function fromGroupStateProof(
  proof: GroupStateProof,
): Promise<Group> {
  if (
    !isRecord(proof) ||
    proof.v !== GROUP_PROTOCOL_VERSION ||
    typeof proof.id !== 'string' ||
    typeof proof.name !== 'string' ||
    !Number.isSafeInteger(proof.revision) ||
    !Number.isSafeInteger(proof.createdAt) ||
    typeof proof.ownerMasterPub !== 'string' ||
    typeof proof.stateSignature !== 'string' ||
    typeof proof.previousStateHash !== 'string' ||
    typeof proof.stateHash !== 'string' ||
    typeof proof.dissolved !== 'boolean' ||
    !Array.isArray(proof.roster)
  ) {
    throw new Error('Ungültiger Gruppen-Entfernungsnachweis.');
  }
  const group: Group = {
    id: proof.id,
    name: proof.name,
    revision: proof.revision,
    createdAt: proof.createdAt,
    ownerMasterPub: await b64decode(proof.ownerMasterPub),
    stateSignature: await b64decode(proof.stateSignature),
    previousStateHash: await b64decode(proof.previousStateHash),
    stateHash: await b64decode(proof.stateHash),
    dissolved: proof.dissolved,
    roster: await Promise.all(
      proof.roster.map(async (master) => {
        if (typeof master !== 'string') throw new Error('Roster');
        return b64decode(master);
      }),
    ),
    members: [],
  };
  if (!(await verifyGroupState(group))) {
    throw new Error('Owner-Signatur des Entfernungsnachweises ist ungültig.');
  }
  return group;
}

/** Only an identity holding the owner-master private key can author a state.
 * Linked secondary devices deliberately cannot create competing revisions. */
export async function signGroupState(
  group: Group,
  identity: IdentityKeys,
): Promise<Group> {
  if (
    !group.ownerMasterPub ||
    !bytesEqual(group.ownerMasterPub, identity.master.publicKey) ||
    identity.master.privateKey.length !== 64 ||
    !Number.isSafeInteger(group.revision) ||
    group.revision < 1
  ) {
    throw new Error('Nur das primäre Owner-Gerät darf Gruppenstände signieren.');
  }
  const previousStateHash =
    group.previousStateHash ??
    (group.revision === 1 ? ZERO_GROUP_STATE_HASH : undefined);
  if (!previousStateHash || previousStateHash.length !== GROUP_STATE_HASH_BYTES) {
    throw new Error('Vorgänger-Hash des Gruppenstands fehlt.');
  }
  const unsigned = {
    ...group,
    previousStateHash,
    stateHash: undefined,
    stateSignature: undefined,
  };
  const stateHash = await hashGroupState(unsigned);
  return {
    ...unsigned,
    stateHash,
    stateSignature: await sign(
      groupStateTranscript(unsigned),
      identity.master.privateKey,
    ),
  };
}

function mergeMemberDirectory(local: GroupMember, incoming: GroupMember): GroupMember {
  const localList = local.deviceList;
  const incomingList = incoming.deviceList;
  const incomingEpoch = memberEpoch(incoming);
  if (
    localList &&
    // A DeviceList is authoritative only inside its own master epoch. If the
    // owner state advances this member to a higher epoch without carrying a
    // matching list, retaining the old local directory would authorise devices
    // certified under an epoch the incoming state has already left behind.
    localList.epoch >= incomingEpoch &&
    // Equal clocks deliberately keep the already-accepted local value. Two
    // different lists under the same (epoch, version) are master equivocation;
    // arrival order must not let an owner-roster replay replace local authority.
    (!incomingList || compareDeviceList(localList, incomingList) >= 0)
  ) {
    return chooseReachableAnchor({
      ...incoming,
      masterPub: memberMasterPub(local),
      epoch: Math.max(memberEpoch(local), memberEpoch(incoming)),
      signPub: local.signPub,
      dhPub: local.dhPub,
      bundle: local.bundle,
      deviceList: localList,
    });
  }
  return chooseReachableAnchor(incoming);
}

/**
 * Membership/name come from the owner state; each member's signed device
 * directory has its own independent monotonic clock and is merged by max
 * (epoch, version). A newer owner roster can therefore never roll a member's
 * locally newer revocation list backwards.
 */
export function mergeGroupDirectories(local: Group, incoming: Group): Group {
  const members = incoming.members.map((member) => {
    const held = local.members.find((candidate) =>
      bytesEqual(memberMasterPub(candidate), memberMasterPub(member)),
    );
    return held ? mergeMemberDirectory(held, member) : member;
  });
  return { ...incoming, members };
}

function chooseReachableAnchor(member: GroupMember): GroupMember {
  const list = member.deviceList;
  if (!list || list.devices.length === 0) return member;
  const current = list.devices.find((device) => bytesEqual(device.signPub, member.signPub));
  const bundleMatches = (device: DeviceList['devices'][number]): boolean =>
    !!member.bundle &&
    bytesEqual(member.bundle.masterPub, list.masterPub) &&
    bytesEqual(member.bundle.identitySignPub, device.signPub) &&
    bytesEqual(member.bundle.identityDhPub, device.dhPub);
  // DeviceLists reaching this helper have already passed verifyDeviceList, so a
  // present signedPreKey is both device-signed and master-bound. Preserve the
  // current anchor only when it is actually initiable; otherwise prefer another
  // authorised device with an SPK over a legacy receive-only entry.
  const chosen =
    (current && (bundleMatches(current) || current.signedPreKey) ? current : undefined) ??
    list.devices.find((device) => !!device.signedPreKey) ??
    current ??
    list.devices[0];
  const bundle =
    bundleMatches(chosen)
      ? member.bundle
      : (bundleFromDeviceEntry(list.masterPub, list.epoch, chosen) ?? undefined);
  return {
    ...member,
    masterPub: list.masterPub,
    epoch: list.epoch,
    signPub: chosen.signPub,
    dhPub: chosen.dhPub,
    bundle,
  };
}

/** A roster is broadcast to multiple members, therefore an OPK must never ride
 * in it. Shared "one-time" prekeys cause the second initiator's X3DH to fail. */
export function groupBroadcastBundle(bundle: PreKeyBundle): PreKeyBundle {
  return { ...bundle, oneTimePreKey: undefined };
}

export async function toInvite(g: Group): Promise<GroupInvite> {
  validGroupId(g.id);
  validGroupName(g.name);
  if (g.members.length > MAX_GROUP_MEMBERS) throw new Error('Zu viele Gruppenmitglieder.');
  if (rosterDeviceCount(g.members) > MAX_GROUP_FANOUT_DEVICES) {
    throw new Error('Zu viele Empfängergeräte im Gruppenroster.');
  }
  const revision = safeRevision(g.revision);
  const legacy = isLegacyGroup(g);
  if (!legacy && !hasValidV4State(g)) throw new Error('Unvollständiger Gruppen-v4-Stand.');
  if (!legacy && !(await verifyGroupState(g))) {
    throw new Error('Ungültige Owner-Signatur im Gruppenstand.');
  }
  for (const member of g.members) {
    if (member.deviceList) validateDeviceListShape(member.deviceList);
  }
  return {
    v: legacy ? 1 : GROUP_PROTOCOL_VERSION,
    id: g.id,
    name: g.name,
    revision,
    createdAt: safeTimestamp(g.createdAt),
    ownerMasterPub: g.ownerMasterPub ? await b64encode(exactKey(g.ownerMasterPub, 'Gruppen-Owner')) : null,
    stateSignature: g.stateSignature ? await b64encode(g.stateSignature) : null,
    previousStateHash: g.previousStateHash
      ? await b64encode(g.previousStateHash)
      : null,
    stateHash: g.stateHash ? await b64encode(g.stateHash) : null,
    dissolved: g.dissolved === true,
    roster: g.roster
      ? await Promise.all(
          g.roster.map((master) =>
            b64encode(exactKey(master, 'Roster-Master')),
          ),
        )
      : null,
    members: await Promise.all(
      g.members.map(async (m) => ({
        masterPub: await b64encode(exactKey(memberMasterPub(m), 'Mitglieder-Master')),
        epoch: memberEpoch(m),
        signPub: await b64encode(m.signPub),
        dhPub: await b64encode(m.dhPub),
        bundle: m.bundle ? await encodeBundle(groupBroadcastBundle(m.bundle)) : null,
        deviceList: m.deviceList
          ? await b64encode(await encodeDeviceList(m.deviceList))
          : null,
        name: m.name ?? null,
      })),
    ),
  };
}

export async function fromInvite(inv: GroupInvite): Promise<Group> {
  if (!isRecord(inv)) throw new Error('Ungültige Gruppeneinladung.');
  if (inv.v !== undefined && inv.v !== 1 && inv.v !== GROUP_PROTOCOL_VERSION) {
    throw new Error('Nicht unterstützte Gruppenprotokoll-Version.');
  }
  validGroupId(inv.id);
  validGroupName(inv.name);
  if (!Array.isArray(inv.members) || inv.members.length > MAX_GROUP_MEMBERS) {
    throw new Error('Ungültiges oder zu großes Gruppenroster.');
  }
  const ownerMasterPub = inv.ownerMasterPub
    ? exactKey(await b64decode(inv.ownerMasterPub), 'Gruppen-Owner')
    : undefined;
  const revision = safeRevision(inv.revision);
  const wireIsV4 = inv.v === GROUP_PROTOCOL_VERSION;
  const stateSignature =
    typeof inv.stateSignature === 'string' && inv.stateSignature.length > 0
      ? await b64decode(inv.stateSignature)
      : undefined;
  const previousStateHash =
    typeof inv.previousStateHash === 'string' &&
    inv.previousStateHash.length > 0
      ? await b64decode(inv.previousStateHash)
      : undefined;
  const stateHash =
    typeof inv.stateHash === 'string' && inv.stateHash.length > 0
      ? await b64decode(inv.stateHash)
      : undefined;
  const roster =
    wireIsV4 && Array.isArray(inv.roster)
      ? await Promise.all(
          inv.roster.map(async (value) => {
            if (typeof value !== 'string') {
              throw new Error('Ungültiger globaler Gruppenroster.');
            }
            return exactKey(await b64decode(value), 'Roster-Master');
          }),
        )
      : undefined;
  if (
    wireIsV4 &&
    (!ownerMasterPub ||
      revision < 1 ||
      !stateSignature ||
      stateSignature.length !== 64 ||
      !previousStateHash ||
      previousStateHash.length !== GROUP_STATE_HASH_BYTES ||
      !stateHash ||
      stateHash.length !== GROUP_STATE_HASH_BYTES ||
      !roster)
  ) {
    throw new Error('Unvollständiger Gruppen-v4-Stand.');
  }
  if (
    !wireIsV4 &&
    (ownerMasterPub ||
      stateSignature ||
      previousStateHash ||
      stateHash ||
      roster ||
      revision !== 0)
  ) {
    throw new Error('Ungültiger hybrider Legacy-Gruppenstand.');
  }
  const members: GroupMember[] = [];
  const masters = new Set<string>();
  for (const raw of inv.members) {
    if (!isRecord(raw) || typeof raw.signPub !== 'string' || typeof raw.dhPub !== 'string') {
      throw new Error('Ungültiges Gruppenmitglied.');
    }
    const signPub = exactKey(await b64decode(raw.signPub), 'Device-Sign-Key');
    const dhPub = exactKey(await b64decode(raw.dhPub), 'Device-DH-Key');
    const decodedBundle =
      typeof raw.bundle === 'string' && raw.bundle.length > 0
        ? await decodeBundle(raw.bundle)
        : undefined;
    const bundle = decodedBundle ? groupBroadcastBundle(decodedBundle) : undefined;
    const deviceList =
      typeof raw.deviceList === 'string' && raw.deviceList.length > 0
        ? await decodeDeviceList(await b64decode(raw.deviceList))
        : undefined;
    if (deviceList) validateDeviceListShape(deviceList);
    const explicitMaster =
      typeof raw.masterPub === 'string' && raw.masterPub.length > 0
        ? exactKey(await b64decode(raw.masterPub), 'Mitglieder-Master')
        : undefined;
    const masterPub =
      explicitMaster ?? deviceList?.masterPub ?? bundle?.masterPub ?? signPub;
    exactKey(masterPub, 'Mitglieder-Master');
    const epoch = Math.max(
      safeRevision(raw.epoch, 1),
      bundle?.epoch ?? 1,
      deviceList?.epoch ?? 1,
    );

    if (bundle) {
      if (
        !bytesEqual(bundle.masterPub, masterPub) ||
        !bytesEqual(bundle.identitySignPub, signPub) ||
        !bytesEqual(bundle.identityDhPub, dhPub) ||
        !(await verifyDeviceCert(
          masterPub,
          bundle.epoch,
          signPub,
          dhPub,
          bundle.deviceCert,
        )) ||
        !(await verify(
          bundle.signedPreKey.pub,
          bundle.signedPreKey.signature,
          signPub,
        ))
      ) {
        throw new Error('Ungültiges Prekey-Bundle im Gruppenroster.');
      }
    }
    if (
      deviceList &&
      (!(await verifyDeviceList(deviceList, masterPub, epoch)) ||
        deviceList.devices.length === 0)
    ) {
      throw new Error('Ungültige Geräteliste im Gruppenroster.');
    }
    if (
      wireIsV4 &&
      !bundle &&
      !deviceList?.devices.some((device) => !!device.signedPreKey)
    ) {
      throw new Error('Gruppenmitglied ist kryptographisch nicht erreichbar.');
    }
    const masterId = keyHex(masterPub);
    if (masters.has(masterId)) throw new Error('Doppeltes Gruppenmitglied.');
    masters.add(masterId);
    members.push(
      chooseReachableAnchor({
        masterPub,
        epoch,
        signPub,
        dhPub,
        bundle,
        deviceList,
        name: (() => {
          if (raw.name === null || raw.name === undefined || raw.name === '') {
            return undefined;
          }
          validGroupName(raw.name);
          return raw.name;
        })(),
      }),
    );
  }
  if (rosterDeviceCount(members) > MAX_GROUP_FANOUT_DEVICES) {
    throw new Error('Zu viele Empfängergeräte im Gruppenroster.');
  }
  const group: Group = {
    id: inv.id,
    name: inv.name,
    createdAt: safeTimestamp(inv.createdAt),
    revision,
    ownerMasterPub,
    roster,
    previousStateHash,
    stateHash,
    dissolved: inv.dissolved === true,
    stateSignature,
    members,
  };
  if (wireIsV4 && !(await verifyGroupState(group))) {
    throw new Error('Ungültige Owner-Signatur im Gruppenstand.');
  }
  return group;
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

/**
 * Backward-compatible member lookup. New code should pass a master public key;
 * legacy callers/tests that still hold a device DH key continue to resolve.
 */
export function isGroupMember(g: Group, identityPub: Bytes): boolean {
  return g.members.some(
    (member) =>
      sameKey(memberMasterPub(member), identityPub) ||
      sameKey(member.dhPub, identityPub),
  );
}

export function isGroupMemberMaster(g: Group, masterPub: Bytes): boolean {
  return g.members.some((member) => sameKey(memberMasterPub(member), masterPub));
}

export function isGroupOwner(g: Group, masterPub: Bytes): boolean {
  return !!g.ownerMasterPub && sameKey(g.ownerMasterPub, masterPub);
}

export type InviteDecision =
  | { verdict: 'accept'; group: Group } // brand-new group — trust on first invite
  | { verdict: 'update'; group: Group } // authorized member update — apply reconciled roster
  | { verdict: 'noop'; group: Group } // authenticated duplicate of current state
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
  senderIdentityPub: Bytes,
  fromOwnDevice = false,
): InviteDecision {
  const incomingLegacy = isLegacyGroup(incoming);
  const incomingV4 = hasValidV4State(incoming);
  if (!incomingLegacy && !incomingV4) {
    return { verdict: 'reject', reason: 'Ungültiger Gruppen-Protokollstand' };
  }
  if (
    incomingV4 &&
    incoming.ownerMasterPub &&
    !incoming.roster?.some((master) =>
      sameKey(master, incoming.ownerMasterPub!),
    )
  ) {
    return { verdict: 'reject', reason: 'Gruppen-Owner fehlt im Roster' };
  }
  if (!local) {
    if (
      incoming.ownerMasterPub &&
      !fromOwnDevice &&
      !sameKey(incoming.ownerMasterPub, senderIdentityPub)
    ) {
      return {
        verdict: 'reject',
        reason: 'Ersteinladung stammt nicht vom Gruppen-Owner',
      };
    }
    return { verdict: 'accept', group: incoming };
  }
  const localLegacy = isLegacyGroup(local);
  const localV4 = hasValidV4State(local);
  if (!localLegacy && !localV4) {
    return { verdict: 'reject', reason: 'Lokaler Gruppen-Protokollstand ist ungültig' };
  }
  if (local.dissolved === true) {
    return {
      verdict: 'reject',
      reason: 'Eine signiert aufgelöste Gruppe hat keinen Nachfolgestand',
    };
  }
  if (localLegacy !== incomingLegacy) {
    return {
      verdict: 'reject',
      reason: 'Legacy-Gruppen werden nicht unsicher in-place migriert',
    };
  }

  // Owner continuity is a state invariant, not sender authentication. A frame
  // from one of my own devices may skip the sender check below, but it may never
  // replace or erase an already-pinned group owner.
  if (local.ownerMasterPub) {
    if (
      !incoming.ownerMasterPub ||
      !sameKey(local.ownerMasterPub, incoming.ownerMasterPub)
    ) {
      return { verdict: 'reject', reason: 'Gruppen-Owner darf nicht ersetzt werden' };
    }
    if (!fromOwnDevice && !isGroupOwner(local, senderIdentityPub)) {
      return { verdict: 'reject', reason: 'Nur der Gruppen-Owner darf das Roster ändern' };
    }
  } else if (!fromOwnDevice) {
    // An ownerless legacy group may either receive another legacy update from a
    // current member or be explicitly upgraded to v4 by a current member.
    if (!isGroupMember(local, senderIdentityPub)) {
      return { verdict: 'reject', reason: 'Absender ist kein aktuelles Mitglied' };
    }
  }

  if (localLegacy && incomingLegacy) {
    if (canonicalState(local) === canonicalState(incoming)) {
      return {
        verdict: 'noop',
        group: { ...mergeGroupDirectories(local, incoming), createdAt: local.createdAt },
      };
    }
    return {
      verdict: 'update',
      group: {
        ...mergeGroupDirectories(local, incoming),
        createdAt: local.createdAt,
      },
    };
  }

  const localRevision = local.revision ?? 0;
  const incomingRevision = incoming.revision ?? 0;
  if (incomingRevision < localRevision) {
    return { verdict: 'reject', reason: 'Veralteter Gruppen-Rosterstand' };
  }
  if (
    incomingRevision === localRevision &&
    local.revision !== undefined &&
    incoming.revision !== undefined
  ) {
    if (
      canonicalState(local) === canonicalState(incoming) &&
      ((!local.stateHash && !incoming.stateHash) ||
        (!!local.stateHash &&
          !!incoming.stateHash &&
          bytesEqual(local.stateHash, incoming.stateHash)))
    ) {
      return {
        verdict: 'noop',
        group: { ...mergeGroupDirectories(local, incoming), createdAt: local.createdAt },
      };
    }
    return { verdict: 'reject', reason: 'Konfligierender Gruppen-Rosterstand' };
  }
  if (
    localV4 &&
    (incomingRevision !== localRevision + 1 ||
      !local.stateHash ||
      !incoming.previousStateHash ||
      !bytesEqual(incoming.previousStateHash, local.stateHash))
  ) {
    return {
      verdict: 'reject',
      reason: 'Gruppenstand schließt nicht an den gepinnten Vorgänger an',
    };
  }
  return {
    verdict: 'update',
    group: {
      ...mergeGroupDirectories(local, incoming),
      createdAt: local.createdAt,
    },
  };
}

export function nextGroupRevision(group: Group): number {
  if (group.dissolved === true) {
    throw new Error('Eine aufgelöste Gruppe hat keinen Nachfolgestand.');
  }
  const current = group.revision ?? 0;
  if (!Number.isSafeInteger(current) || current < 0 || current >= Number.MAX_SAFE_INTEGER) {
    throw new Error('Gruppen-Rosterstand kann nicht erhöht werden.');
  }
  return current + 1;
}

export type GroupFramePolicy = 'accept' | 'defer' | 'reject';

/**
 * Classify an authenticated pairwise group frame against the locally installed
 * roster. A sender that is still in the current roster may have authored the
 * frame under an older revision while owner-state fan-out was in flight or the
 * device was offline. Old content carries no authority mutation; a removed
 * sender is still rejected against the current roster.
 *
 * Exactly the next revision is deferred because it may introduce a new member
 * whose owner state has not arrived yet. Larger jumps and malformed clocks fail
 * closed instead of consuming transition-buffer capacity.
 */
export function classifyGroupFrame(
  group: Group,
  senderMasterPub: Bytes,
  incomingRevision: number | undefined,
  incomingStateHash?: Bytes,
): GroupFramePolicy {
  if (isLegacyGroup(group)) {
    return (incomingRevision === undefined || incomingRevision === 0) &&
      incomingStateHash === undefined &&
      isGroupMember(group, senderMasterPub)
      ? 'accept'
      : 'reject';
  }
  if (
    !hasValidV4State(group) ||
    !Number.isSafeInteger(incomingRevision) ||
    (incomingRevision as number) < 1 ||
    !incomingStateHash ||
    incomingStateHash.length !== GROUP_STATE_HASH_BYTES
  ) {
    return 'reject';
  }
  if ((incomingRevision as number) === group.revision + 1) return 'defer';
  if ((incomingRevision as number) > group.revision) return 'reject';
  if (!isGroupMember(group, senderMasterPub)) return 'reject';
  if ((incomingRevision as number) === group.revision) {
    return group.stateHash && bytesEqual(incomingStateHash, group.stateHash)
      ? 'accept'
      : 'reject';
  }
  // Old content changes no authority state. The current roster is therefore
  // the security boundary: a still-current authenticated member may have been
  // offline across several owner revisions, while a removed sender is already
  // rejected above. Hash equality remains strict for current/future states.
  return 'accept';
}

/**
 * Adopt a member's newer master-signed DeviceList into a group roster. This is
 * the group counterpart to applyDeviceListUpdate(Contact): signature, epoch and
 * rollback checks happen before the stored target set changes.
 */
export async function applyGroupMemberDeviceList(
  group: Group,
  list: DeviceList,
): Promise<{ group: Group; applied: boolean }> {
  const index = group.members.findIndex((member) =>
    bytesEqual(memberMasterPub(member), list.masterPub),
  );
  if (index < 0) return { group, applied: false };
  const current = group.members[index];
  try {
    validateDeviceListShape(list);
  } catch {
    return { group, applied: false };
  }
  if (!(await verifyDeviceList(list, memberMasterPub(current), memberEpoch(current)))) {
    return { group, applied: false };
  }
  if (
    current.deviceList &&
    compareDeviceList(list, current.deviceList) <= 0
  ) {
    return { group, applied: false };
  }
  if (
    list.devices.length < 1 ||
    list.devices.length > MAX_GROUP_DEVICES_PER_MEMBER
  ) {
    return { group, applied: false };
  }
  const members = [...group.members];
  members[index] = chooseReachableAnchor({
    ...current,
    masterPub: list.masterPub,
    epoch: list.epoch,
    deviceList: list,
  });
  return { group: { ...group, members }, applied: true };
}

/**
 * Encrypt one logical group message to every authorised device represented by
 * a member Contact. The caller persists the mutated per-device ratchets before
 * dispatching the returned ciphertexts, exactly like normal 1:1 fan-out.
 */
export interface GroupFanoutDelivery {
  contact: Contact;
  deviceSignPub: Bytes;
  sealed: Bytes;
}

export interface GroupFanoutUnreachable {
  contact: Contact;
  deviceSignPub: Bytes;
}

export interface GroupFanoutOptions {
  /**
   * Revision zero is accepted only when the caller supplies the actual,
   * ownerless legacy group it selected. This keeps v3's revision requirement
   * fail-closed instead of turning `revision === 0` into a universal bypass.
   */
  legacyGroup?: Pick<Group, 'id' | 'revision' | 'ownerMasterPub'>;
  /** Current own master-signed list, attached to fresh X3DH envelopes. */
  senderDeviceList?: DeviceList;
}

export async function groupFanoutToDevices(
  me: IdentityKeys,
  contacts: Contact[],
  groupId: string,
  revision: number,
  stateHash: Bytes | undefined,
  senderName: string | undefined,
  inner: MessageContent,
  mid: string,
  options: GroupFanoutOptions = {},
): Promise<{
  deliveries: GroupFanoutDelivery[];
  unreachable: GroupFanoutUnreachable[];
}> {
  validGroupId(groupId);
  const parsedRevision = safeRevision(revision);
  const explicitLegacy =
    parsedRevision === 0 &&
    !!options.legacyGroup &&
    options.legacyGroup.id === groupId &&
    isLegacyGroup(options.legacyGroup);
  if (parsedRevision < 1 && !explicitLegacy) {
    throw new Error('Ungültiger Gruppen-Rosterstand.');
  }
  if (parsedRevision >= 1 && options.legacyGroup) {
    throw new Error('Legacy-Fan-out-Option für v3-Gruppe abgelehnt.');
  }
  if (
    parsedRevision >= 1 &&
    (!stateHash || stateHash.length !== GROUP_STATE_HASH_BYTES)
  ) {
    throw new Error('Signierter Gruppen-State-Hash fehlt.');
  }
  if (explicitLegacy && stateHash) {
    throw new Error('Legacy-Gruppe darf keinen v4-State-Hash behaupten.');
  }
  const masters = new Set<string>();
  let targetCount = 0;
  for (const contact of contacts) {
    const master = keyHex(contact.peerMasterPub);
    if (masters.has(master)) throw new Error('Doppelter Gruppen-Fan-out-Kontakt.');
    masters.add(master);
    targetCount += Math.max(1, contact.peerDeviceList?.devices.length ?? 1);
  }
  if (targetCount > MAX_GROUP_FANOUT_DEVICES) {
    throw new Error('Zu viele Empfängergeräte für einen Gruppen-Fan-out.');
  }
  const deliveries: GroupFanoutDelivery[] = [];
  const unreachable: GroupFanoutUnreachable[] = [];
  for (const contact of contacts) {
    const result = await fanoutDeliveries(
      me,
      contact,
      { kind: 'group', groupId, revision, stateHash, senderName, inner },
      mid,
      undefined,
      undefined,
      explicitLegacy ? 0 : 6,
      options.senderDeviceList,
    );
    deliveries.push(
      ...result.deliveries.map((delivery) => ({ contact, ...delivery })),
    );
    unreachable.push(
      ...result.unreachable.map((deviceSignPub) => ({ contact, deviceSignPub })),
    );
  }
  return { deliveries, unreachable };
}

export interface GroupAttachmentPolicy {
  allowed: boolean;
  recipientDevices: number;
  aggregateBytes: number;
  reason?: 'invalid' | 'too-many-devices' | 'single-file-limit' | 'aggregate-limit';
}

/**
 * Bound the multiplicative availability cost of inline group attachments.
 * `ownDeviceCount` includes the sending device; only its siblings need a sync
 * copy, hence the `-1`.
 */
export function boundedGroupAttachmentPolicy(
  group: Group,
  byteLength: number,
  ownDeviceCount = 1,
): GroupAttachmentPolicy {
  if (
    !Number.isSafeInteger(byteLength) ||
    byteLength < 0 ||
    !Number.isSafeInteger(ownDeviceCount) ||
    ownDeviceCount < 1
  ) {
    return { allowed: false, recipientDevices: 0, aggregateBytes: 0, reason: 'invalid' };
  }
  const recipientDevices =
    group.members.reduce(
      (sum, member) => sum + Math.max(1, member.deviceList?.devices.length ?? 1),
      0,
    ) + Math.max(0, ownDeviceCount - 1);
  if (!Number.isSafeInteger(recipientDevices)) {
    return { allowed: false, recipientDevices: 0, aggregateBytes: 0, reason: 'invalid' };
  }
  if (recipientDevices > MAX_GROUP_FANOUT_DEVICES) {
    return {
      allowed: false,
      recipientDevices,
      aggregateBytes: Number.MAX_SAFE_INTEGER,
      reason: 'too-many-devices',
    };
  }
  if (byteLength > MAX_GROUP_INLINE_ATTACHMENT_BYTES) {
    return {
      allowed: false,
      recipientDevices,
      aggregateBytes: byteLength * Math.max(1, recipientDevices),
      reason: 'single-file-limit',
    };
  }
  if (
    recipientDevices > 0 &&
    byteLength > Math.floor(MAX_GROUP_ATTACHMENT_FANOUT_BYTES / recipientDevices)
  ) {
    return {
      allowed: false,
      recipientDevices,
      aggregateBytes: byteLength * recipientDevices,
      reason: 'aggregate-limit',
    };
  }
  return {
    allowed: true,
    recipientDevices,
    aggregateBytes: byteLength * recipientDevices,
  };
}

// --- Persistence (sealed with the DEK) -------------------------------------

const INDEX_AAD = utf8.encode('scytale:group-index:v1');
const aad = (id: string) => utf8.encode(`scytale:group:v1:${id}`);

async function loadIndex(dek: CryptoKey): Promise<string[]> {
  const rec = await loadRecord('group-index');
  if (!rec) return [];
  const parsed = JSON.parse(
    utf8.decode(await open(dek, rec, INDEX_AAD)),
  ) as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.some((value) => typeof value !== 'string')
  ) {
    throw new Error('Gruppenindex beschädigt.');
  }
  return [...new Set(parsed)];
}
async function saveIndex(dek: CryptoKey, ids: string[]): Promise<void> {
  await saveRecordsAtomically([
    ['group-index', await seal(dek, utf8.encode(JSON.stringify(ids)), INDEX_AAD)],
  ]);
}

async function serialize(g: Group): Promise<Bytes> {
  return utf8.encode(JSON.stringify(await toInvite(g)));
}
async function deserialize(bytes: Bytes): Promise<Group> {
  return fromInvite(JSON.parse(utf8.decode(bytes)) as GroupInvite);
}

export async function openGroupPersistenceRecord(
  dek: CryptoKey,
  id: string,
  record: SealedRecord,
): Promise<Group> {
  validGroupId(id);
  const group = await deserialize(await open(dek, record, aad(id)));
  if (group.id !== id) throw new Error('Gruppenrecord ist an den falschen Slot gebunden.');
  return group;
}

export async function saveGroup(dek: CryptoKey, g: Group): Promise<void> {
  await saveRecordsAtomically(await sealGroupPersistenceRecords(dek, g));
}

/**
 * Prepare the complete sealed record set for one group write. Callers that
 * coordinate a roster outbox append their marker and commit the returned set in
 * the same IndexedDB transaction, closing the state-without-retry crash window.
 */
export async function sealGroupPersistenceRecords(
  dek: CryptoKey,
  g: Group,
): Promise<Array<readonly [string, SealedRecord]>> {
  const entries: Array<readonly [string, SealedRecord]> = [
    [`group:${g.id}`, await seal(dek, await serialize(g), aad(g.id))],
  ];
  const ids = await loadIndex(dek);
  if (!ids.includes(g.id)) {
    entries.push([
      'group-index',
      await seal(
        dek,
        utf8.encode(JSON.stringify([...ids, g.id])),
        INDEX_AAD,
      ),
    ]);
  }
  return entries;
}

export async function loadGroups(dek: CryptoKey): Promise<Group[]> {
  const out: Group[] = [];
  for (const id of await loadIndex(dek)) {
    const rec = await loadRecord(`group:${id}`);
    if (!rec) continue;
    try {
      out.push(await deserialize(await open(dek, rec, aad(id))));
    } catch {
      // Older builds accepted arbitrary network group ids and weak roster
      // shapes. One such sealed record must not brick the entire vault after
      // upgrading; keep it untouched for recovery and skip it fail-closed.
      console.warn('[group] Ungültiger persistierter Gruppenstand übersprungen.');
    }
  }
  return out;
}

export async function removeGroup(dek: CryptoKey, id: string): Promise<void> {
  // Destroy the small per-room key first: even if IndexedDB retains old log
  // pages, the message ciphertext is no longer decryptable.
  await cryptoEraseRoom(id);
  await secureDeleteRecord(`group:${id}`);
  const ids = (await loadIndex(dek)).filter((x) => x !== id);
  await saveIndex(dek, ids);
}
