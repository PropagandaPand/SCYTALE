/**
 * Conversation logic — pure, transport- and storage-agnostic (no IndexedDB
 * import, so it runs in Node tests too). Ties X3DH + Double Ratchet + wire
 * format together into "send this text" / "here's a received envelope".
 */
import {
  initiateX3DH,
  respondX3DH,
  initRatchetInitiator,
  initRatchetResponder,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeState,
  deserializeState,
  encodeEnvelope,
  decodeEnvelope,
  sealPayload,
  openPayload,
  SEALED_ENVELOPE,
  verifyDeviceCert,
  verifyRotation,
  encodeRotation,
  decodeRotation,
  deviceInList,
  verifyDeviceList,
  isNewerDeviceList,
  encodeDeviceList,
  decodeDeviceList,
  encodeBundle,
  decodeBundle,
  encodeInitialHeader,
  decodeInitialHeader,
  identityFingerprint,
  getSodium,
  concatBytes,
  bytesEqual,
  asMasterPub,
  utf8,
  type IdentityKeys,
  type KeyPair,
  type PreKeyBundle,
  type RatchetState,
  type InitialMessageHeader,
  type Envelope,
  type Bytes,
  type MasterPub,
  type DeviceList,
  type RotationStatement,
} from '../crypto';
import { bytesToB64, b64ToBytes } from './bytes';

export interface Contact {
  roomId: string;
  peerMasterPub: Bytes; // pinned cross-signing master (the stable identity)
  peerEpoch: number; // highest master epoch seen for this contact
  peerSignPub: Bytes; // current device sign key
  peerDhPub: Bytes; // current device DH key
  peerFingerprint: string;
  nickname?: string; // user-chosen local name for this peer (overrides everything)
  peerName?: string; // display name the peer shared via their profile
  peerAvatarB64?: string; // avatar the peer shared via their profile
  verified?: boolean; // local flag: safety number compared out-of-band
  hidden?: boolean; // group-member-only contact — kept out of the 1:1 list
  /**
   * This contact predates a device-linking identity swap: they still have our
   * OLD master pinned. Sending is blocked (see sendContent) because anything we
   * send over the surviving session would implicitly claim an identity we no
   * longer hold — the peer would attribute it to the old, *verified* master.
   * Receiving stays open: their identity is unchanged, their messages are real.
   */
  staleIdentity?: boolean;
  /**
   * A DIFFERENT identity was claimed for this contact and rejected by the
   * pinning rule. Kept here so the user can deliberately accept it — a block
   * without a path to acceptance would make the door one-sided. Only recorded
   * when the claim is internally consistent (its device cert verifies under the
   * claimed master); never applied automatically.
   */
  pendingMaster?: { masterPub: Bytes; epoch: number; signPub: Bytes; dhPub: Bytes };
  /**
   * Masters this contact has DEMONSTRABLY left behind (base64 of the pub key),
   * appended whenever we accept a replacement. An abandoned master is the most
   * likely compromised key in the whole system — it lingers in old backups and
   * on discarded devices, which is usually why it was abandoned. So it is never
   * offered again: a downgrade back to it is the first thing an attacker with
   * access to old material would try, and the safety number would look
   * *familiar* to the user rather than alarming. Growth is one entry per real
   * identity change of this contact.
   */
  retiredMasters?: string[];
  /**
   * A message under a retired master was rejected for this contact at least
   * once. Persistent CONTACT STATE, not an event — whoever holds the abandoned
   * key can replay forever, and one warning per delivered message would be a
   * harassment lever: it either annoys the user or, worse, trains them to wave
   * warnings away until a real one goes unread. Warning fatigue is an attack on
   * the human part of the system. So the notice fires once, then lives here.
   */
  retiredAttempt?: boolean;
  /**
   * The MASTER under which THIS contact knows us — the local half of the
   * master-based conversation key: roomId = computeMasterRoomId(ownMasterPub,
   * peerMasterPub). Normally our current master; for a staleIdentity contact it
   * is our PRE-LINK master (snapshotted at installGrant BEFORE the identity
   * swap, because the peer still pins that one — losing it makes the stale
   * conversation permanently un-addressable). Optional only on pre-3c records;
   * the boot migration fills it.
   */
  ownMasterPub?: MasterPub;
  /**
   * The peer's most recently accepted, master-signed device list. The device-
   * revocation guard checks presence here: a device whose cert verifies under
   * the pinned master but which is absent from this list is refused. Absent on
   * pre-3c records and at first contact (an implicit single-device list is
   * synthesized until a devlist update arrives). Kept current via gossip.
   */
  peerDeviceList?: DeviceList;
  /**
   * Which roomId regime this record's `roomId` was derived under. Absent means
   * the pre-3c device-DH regime (the migration default: "no marker = old"), so
   * the boot migration knows to re-key it; 'master' means already migrated, so a
   * second run is a no-op. This is the idempotency anchor — without it, an
   * already-migrated contact cannot be told apart from an unmigrated one.
   */
  regime?: 'device' | 'master';
  bundle?: PreKeyBundle; // present when WE hold their code (needed to initiate)
  /**
   * Per-DEVICE Double-Ratchet sessions, keyed by the peer device's sign key
   * (base64). A conversation is one PERSON (roomId/verified/peerDeviceList stay
   * singular), but each of the peer's authorised devices gets its OWN X3DH+ratchet
   * session — Stage 3d fan-out. INVARIANT I HOLDS PER SESSION: each Session owns
   * its own RatchetState (and skipped-key map); a message key is used exactly once
   * PER session. A RatchetState is NEVER shared/aliased across two map entries —
   * that would join two chains and turn a key-reuse into a two-time-pad. In Stage
   * 3d step 1 there is at most ONE entry (the primary/pinned device), so behaviour
   * is identical to the old single `ratchet` field.
   */
  sessions: Map<string, Session>;
}

/** One peer device's Double-Ratchet session. Keyed in Contact.sessions by
 *  base64(deviceSignPub). Each carries its OWN ratchet state — never shared. */
export interface Session {
  ratchet: RatchetState | null; // null until this device's session is established
  pendingHeader: InitialMessageHeader | null; // initiator attaches until first reply
  deviceSignPub: Bytes; // the peer device behind this session (prune/route key)
}

// ── Per-device session helpers (Stage 3d) ───────────────────────────────
/** Map key for a peer device's session (base64 of its sign key). */
export function deviceKey(deviceSignPub: Bytes): string {
  return bytesToB64(deviceSignPub);
}
/** Does this contact have ANY established (ratchet-bearing) session? Replaces the
 *  old `contact.ratchet !== null` test now that sessions are per-device. */
export function hasSession(contact: Contact): boolean {
  for (const s of contact.sessions.values()) if (s.ratchet) return true;
  return false;
}
/** The session for a specific peer device, if present. */
export function sessionFor(contact: Contact, deviceSignPub: Bytes): Session | undefined {
  return contact.sessions.get(deviceKey(deviceSignPub));
}

/** Sending to a contact that still pins our pre-linking master is refused: the
 *  message would claim an identity we no longer hold. Re-connect first. */
export class StaleIdentityError extends Error {
  constructor() {
    super('Dieser Kontakt kennt noch deine frühere Identität — bitte neu verbinden, bevor du schreibst.');
    this.name = 'StaleIdentityError';
  }
}

/**
 * The X3DH handshake completed but its FIRST message would not decrypt — both
 * sides derived different shared secrets. Typical cause: a one-time prekey the
 * peer already consumed (so we computed DH1–DH4 and they DH1–DH3), or a stale
 * signed prekey. Named explicitly because this class of bug otherwise surfaces
 * as an anonymous decryption failure with no diagnostic trail.
 */
export class HandshakeMismatchError extends Error {
  constructor() {
    super(
      'Handshake passt nicht zusammen (vermutlich verbrauchter oder veralteter Prekey) — Verbindung muss neu aufgebaut werden.',
    );
    this.name = 'HandshakeMismatchError';
  }
}

/**
 * A prekey arrived from a device whose cert verifies under the pinned master but
 * which is NOT in the contact's accepted device list — a REVOKED device. This is
 * the receive half of device revocation (Stage 3c). Distinct from a "not my
 * conversation" rejection: the master is right, the device is retired.
 */
export class RevokedDeviceError extends Error {
  constructor() {
    super('Nachricht von einem Gerät, das nicht in der Geräteliste dieses Kontakts steht (widerrufen) — abgelehnt.');
    this.name = 'RevokedDeviceError';
  }
}

/**
 * A message arrived under a master this contact has already left behind. Never
 * offered for acceptance again: the abandoned key is the most likely
 * compromised one, and its old safety number would look reassuringly familiar
 * to the user. Surfaced (not swallowed) — it is either an attack worth knowing
 * about, or the contact must learn that only a fresh identity setup works.
 */
export class RetiredIdentityError extends Error {
  /** False for every repeat — the UI must alert only on the transition, never
   *  once per delivered message (see Contact.retiredAttempt). */
  readonly firstOccurrence: boolean;
  constructor(firstOccurrence: boolean) {
    super('Nachricht einer früheren, bereits ersetzten Identität dieses Kontakts — abgelehnt.');
    this.name = 'RetiredIdentityError';
    this.firstOccurrence = firstOccurrence;
  }
}

/** A pinned contact presented a different master without a valid rotation chain
 *  — a possible MITM. The message is dropped and the contact drops verified. */
export class MasterChangedError extends Error {
  /** False when this exact claim is already pending — the alert must fire on a
   *  NEW claim, not once per delivered copy of the same one. */
  readonly firstOccurrence: boolean;
  constructor(firstOccurrence: boolean) {
    super('Master-Schlüssel dieses Kontakts hat sich geändert — möglicher MITM. Nicht automatisch übernommen.');
    this.name = 'MasterChangedError';
    this.firstOccurrence = firstOccurrence;
  }
}

/** Responder-side lookup into the local prekey store. */
export interface PreKeyLookup {
  signedPreKey(id: number): KeyPair | undefined;
  consumeOneTimePreKey(id: number | undefined): Bytes | undefined;
}

function cmp(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

/** Deterministic per-pair relay room: both sides derive the same id.
 *  DEVICE-DH based (the pre-3c regime). Kept because migration must recompute the
 *  old id from device keys, and group/member rooms still use it until 3d. */
export async function computeRoomId(a: Bytes, b: Bytes): Promise<string> {
  const s = await getSodium();
  const [x, y] = cmp(a, b) <= 0 ? [a, b] : [b, a];
  return s.to_hex(s.crypto_generichash(16, concatBytes(x, y), null));
}

/**
 * Master-based conversation id (Stage 3c). A conversation is a property of the
 * two PERSONS, so it is derived from both Ed25519 MASTER keys, sorted so both
 * sides land on the same value — never from the device pair (which would
 * fragment n×m across devices).
 *
 * `MasterPub` (not `Bytes`) on purpose: passing a device key here would compile
 * cleanly and silently key the conversation off the wrong material. The brand
 * turns that into a compile error — same guard as linkingSas.
 *
 * DOMAIN SEPARATION is not cosmetic: the old device-DH id and the new master id
 * share one IndexedDB keyspace during migration. Without the context prefix a
 * master id could (however improbably) collide with a not-yet-migrated device id
 * and cross-link two conversations' history and ratchet state. The prefix makes
 * the two derivations disjoint by construction.
 */
const MASTER_ROOM_CTX = utf8.encode('SCYTALE-master-room-v1');
export async function computeMasterRoomId(a: MasterPub, b: MasterPub): Promise<string> {
  const s = await getSodium();
  const [x, y] = cmp(a, b) <= 0 ? [a, b] : [b, a];
  return s.to_hex(s.crypto_generichash(16, concatBytes(MASTER_ROOM_CTX, x, y), null));
}

/**
 * Is this SENDER device allowed to reach this contact? — the device-revocation
 * check (Stage 3c).
 *
 * With an accepted master-signed device list, presence in it is the answer:
 * a device whose cert is valid under the pinned master but which was removed
 * from the list is REVOKED. Without a list (first contact, or a pre-3c record),
 * the rule is "implicit single-device": only the pinned device is allowed.
 *
 * ⚠️ The list is NEVER synthesized from the device under test — that would be a
 * self-referential guard (the v0.16.1 verifyLinkGrant class), green while
 * checking nothing. A second device can only be admitted by a real, master-
 * signed devlist update (Stage 8). Until then the implicit rule holds.
 */
export function deviceAuthorized(contact: Contact, deviceSignPub: Bytes): boolean {
  if (contact.peerDeviceList) return deviceInList(contact.peerDeviceList, deviceSignPub);
  return bytesEqual(deviceSignPub, contact.peerSignPub);
}

/**
 * Learn a peer's newer, MASTER-SIGNED device list (Stage 3c/3d gossip). This is
 * the ONLY way a second device of a peer becomes authorised — never by an
 * implicit list synthesized from the device itself (that would be
 * self-referential; see deviceAuthorized). Returns true if adopted.
 *
 * Refuses, in order: a master that isn't the pinned one; a RETIRED master
 * (denylist first); a list that doesn't verify against the pinned master + epoch
 * floor; and a ROLLBACK (not strictly newer than the stored list). Only then is
 * the list stored — so a downgrade or a forged list can never widen the set.
 */
export async function applyDeviceListUpdate(
  contact: Contact,
  list: DeviceList,
  retired: Set<string>,
): Promise<boolean> {
  if (!bytesEqual(list.masterPub, contact.peerMasterPub)) return false;
  if (retired.has(await masterKeyB64(list.masterPub))) return false;
  if (!(await verifyDeviceList(list, contact.peerMasterPub, contact.peerEpoch))) return false;
  if (contact.peerDeviceList && !isNewerDeviceList(list, contact.peerDeviceList)) return false;
  contact.peerDeviceList = list;
  // Device revocation on the MESSAGE path (Review C): the guard in receiveEnvelope
  // only gates PREKEY envelopes, so a revoked device could keep sending accepted
  // 'msg' over its already-established session indefinitely. Prune EVERY session
  // whose peer device is no longer in the accepted list — that device's ratchet
  // stops receiving, and it drops out of the fan-out target set. Any further
  // traffic from it re-handshakes through the prekey gate, where deviceAuthorized
  // rejects it (RevokedDeviceError).
  for (const [key, s] of contact.sessions) {
    if (!deviceInList(list, s.deviceSignPub)) contact.sessions.delete(key);
  }
  return true;
}

/**
 * Resolve which contact an inbound envelope's `conv` refers to, tolerant of the
 * DUAL REGIME during migration (Stage 3c). A migrated sender routes with a
 * master-based conv, a not-yet-migrated one with a device-based conv, and the
 * receiver may be in either state — so a direct `roomId === conv` match misses
 * exactly when the two sides are out of step. This also tries the OTHER regime's
 * derivation for each contact. Domain separation (computeMasterRoomId's prefix)
 * makes a hit unambiguous: a device id can never equal a master id.
 *
 * ⚠️ RESOLUTION ONLY, NEVER AUTHORISATION. Identifying the contact does not
 * authorise the envelope — receiveEnvelope re-checks the master afterwards. A
 * legacy (device-derivation) match must never become a trust decision; that
 * would be the v0.16.4 downgrade, a second weaker path an attacker would pick.
 *
 * TODO(stage-3c-cleanup): once the boot migration guarantees every contact has
 * regime==='master', the legacy branch is dead code and pure attack surface —
 * remove it. `legacy-resolve.test` goes red the moment it is no longer
 * exercised, forcing that removal to be a deliberate commit.
 */
export async function resolveContactByConv(
  contacts: Contact[],
  conv: string,
  myDhPub: Bytes,
  myMasterPub: MasterPub,
): Promise<Contact | undefined> {
  const direct = contacts.find((c) => c.roomId === conv);
  if (direct) return direct;
  for (const c of contacts) {
    if (c.regime === 'master') {
      // stored master, sender may still be on device-DH
      if ((await computeRoomId(myDhPub, c.peerDhPub)) === conv) return c;
    } else {
      // stored device (or pre-3c), sender may have migrated to master
      if ((await computeMasterRoomId(myMasterPub, asMasterPub(c.peerMasterPub))) === conv) return c;
    }
  }
  return undefined;
}

/** Our inbox room: SHA-256 of our Ed25519 identity pub. Derived from our OWN
 *  identity, so we can listen without knowing anyone else; whoever holds our
 *  code can send here. The relay verifies inbox ownership by checking this hash
 *  and an Ed25519 signature — so only we can drain our own queue. SHA-256 (not
 *  BLAKE2b) so the Worker can recompute it natively. */
export async function inboxRoom(signPub: Bytes): Promise<string> {
  const material = concatBytes(utf8.encode('scytale-inbox:'), signPub);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', material));
  let hex = '';
  for (const b of digest) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** Initiator side: we hold their code (bundle). Verify the device cert against
 *  the master BEFORE trusting any of the bundle's keys, then pin the master.
 *  `myMasterPub` (branded) anchors the master-based roomId — see computeMasterRoomId. */
export async function makeContact(myMasterPub: MasterPub, bundle: PreKeyBundle): Promise<Contact> {
  const certOk = await verifyDeviceCert(
    bundle.masterPub,
    bundle.epoch,
    bundle.identitySignPub,
    bundle.identityDhPub,
    bundle.deviceCert,
  );
  if (!certOk) throw new Error('Device-Zertifikat ungültig — Gerät nicht vom Master signiert (möglicher MITM).');
  return {
    roomId: await computeMasterRoomId(myMasterPub, asMasterPub(bundle.masterPub)),
    peerMasterPub: bundle.masterPub,
    peerEpoch: bundle.epoch,
    peerSignPub: bundle.identitySignPub,
    peerDhPub: bundle.identityDhPub,
    peerFingerprint: await identityFingerprint(bundle.masterPub, bundle.masterPub),
    ownMasterPub: myMasterPub,
    regime: 'master',
    // peerDeviceList intentionally UNSET → implicit single-device (only the
    // pinned device is allowed) until a real master-signed devlist arrives. We
    // never synthesize a list from the very device we are about to trust.
    bundle,
    sessions: new Map(),
  };
}

/** Responder side: a stranger who holds OUR code just messaged us. Verify their
 *  device cert against their master, then TOFU-pin the master. */
export async function makeContactFromHeader(
  myMasterPub: MasterPub,
  header: InitialMessageHeader,
): Promise<Contact> {
  const certOk = await verifyDeviceCert(
    header.masterPub,
    header.epoch,
    header.identitySignPub,
    header.identityDhPub,
    header.deviceCert,
  );
  if (!certOk) throw new Error('Device-Zertifikat des Absenders ungültig (möglicher MITM).');
  return {
    roomId: await computeMasterRoomId(myMasterPub, asMasterPub(header.masterPub)),
    peerMasterPub: header.masterPub,
    peerEpoch: header.epoch,
    peerSignPub: header.identitySignPub,
    peerDhPub: header.identityDhPub,
    peerFingerprint: await identityFingerprint(header.masterPub, header.masterPub),
    ownMasterPub: myMasterPub,
    regime: 'master',
    bundle: undefined,
    sessions: new Map(),
  };
}

/**
 * PEER SIDE of the door: deliberately accept a claimed new identity for this
 * contact (explicit user action only). Re-pins the master, drops the session so
 * a fresh X3DH runs under the new identity, and clears `verified` — the safety
 * number MUST be compared again. Returns false if nothing was pending.
 */
/**
 * The "hint BEHAVES as claimed" half of the door: the user deliberately accepts
 * a claimed new identity (from an unproven previousMaster merge affordance).
 * Unlike acceptRotation (chain-proven, keeps verified), this is a TOFU break —
 * `verified` is cleared, a fresh safety-number compare is mandatory.
 *
 * Returns {oldRoomId, newRoomId, retiredMaster} so the caller can move storage
 * + maps AND add the abandoned master to the GLOBAL denylist (no longer a
 * per-contact field). Null if nothing was pending.
 */
export async function acceptMasterChange(
  contact: Contact,
): Promise<{ oldRoomId: string; newRoomId: string; retiredMaster: string } | null> {
  const p = contact.pendingMaster;
  if (!p) return null;
  if (!contact.ownMasterPub) throw new Error('Identitätswechsel ohne ownMasterPub — roomId nicht ableitbar.');
  const retiredMaster = await b64(contact.peerMasterPub); // now abandoned → global denylist
  const oldRoomId = contact.roomId;
  contact.peerMasterPub = p.masterPub;
  contact.peerEpoch = p.epoch;
  contact.peerSignPub = p.signPub;
  contact.peerDhPub = p.dhPub;
  contact.peerFingerprint = await identityFingerprint(p.masterPub, p.masterPub);
  contact.bundle = undefined; // the stored bundle belonged to the old identity
  contact.sessions.clear(); // drop ALL per-device sessions — fresh handshake under the new identity
  contact.verified = false; // TOFU break — re-verification is mandatory
  contact.pendingMaster = undefined;
  contact.roomId = await computeMasterRoomId(contact.ownMasterPub, asMasterPub(p.masterPub));
  contact.regime = 'master';
  return { oldRoomId, newRoomId: contact.roomId, retiredMaster };
}

/**
 * OUR SIDE of the door: leave the stale-identity state after a device linking
 * swap. Drops the session so the next message runs a fresh X3DH under our
 * CURRENT (linked) master and lifts the send block. The peer will see an
 * identity warning and must accept us — that is the pinning working, not a bug.
 */
export async function reconnectContact(
  contact: Contact,
  myMasterPub: MasterPub,
): Promise<{ oldRoomId: string; newRoomId: string }> {
  contact.staleIdentity = undefined;
  contact.sessions.clear(); // drop ALL per-device sessions — the next send runs a fresh X3DH
  // The stored bundle's ONE-TIME prekey was consumed by the session we are
  // resetting. Reusing it would make us derive DH1–DH4 while the peer (who no
  // longer holds that key) derives DH1–DH3 — different shared secrets, and the
  // handshake fails silently. Drop it and fall back to the standard no-OPK
  // X3DH, exactly as Signal does when a peer has no one-time prekeys left.
  if (contact.bundle?.oneTimePreKey) {
    contact.bundle = { ...contact.bundle, oneTimePreKey: undefined };
  }
  // We changed identity (device linking), so this contact now knows us under
  // our CURRENT master — update the local half of the room key and re-derive it.
  const oldRoomId = contact.roomId;
  contact.ownMasterPub = myMasterPub;
  contact.roomId = await computeMasterRoomId(myMasterPub, asMasterPub(contact.peerMasterPub));
  contact.regime = 'master';
  return { oldRoomId, newRoomId: contact.roomId };
}

/**
 * Re-derive a contact's roomId under the master-based regime (Stage 3c). PURE
 * and IDEMPOTENT: `regime` is the anchor — a contact already 'master' is
 * returned unchanged, which the crash-safe re-key routine relies on to resume a
 * half-done migration without double-applying. Needs `ownMasterPub` (the master
 * THIS contact knows us under); the boot migration fills it before calling. A
 * staleIdentity contact whose old master was never snapshotted (pre-v0.18.7)
 * has none and cannot be migrated — the caller routes it to "reconnect".
 *
 * This only computes and re-labels; moving the stored record, messages and
 * in-memory maps under the new id is the caller's crash-safe routine (it must
 * RE-ENCRYPT under the new AAD, never rename — see store.ts contactAad).
 */
export async function migrateContactRoomId(
  contact: Contact,
): Promise<{ oldRoomId: string; newRoomId: string }> {
  const oldRoomId = contact.roomId;
  if (contact.regime === 'master') return { oldRoomId, newRoomId: oldRoomId };
  if (!contact.ownMasterPub) {
    throw new Error('Migration ohne ownMasterPub — der Master, unter dem uns dieser Kontakt kennt, fehlt.');
  }
  const newRoomId = await computeMasterRoomId(contact.ownMasterPub, asMasterPub(contact.peerMasterPub));
  contact.roomId = newRoomId;
  contact.regime = 'master';
  return { oldRoomId, newRoomId };
}

/**
 * The "chain PROVES continuity" half of the door (Stage 3c): accept a
 * dual-signed master ROTATION on an existing contact. Unlike acceptMasterChange
 * (a user-confirmed TOFU break that clears `verified`), a valid rotation chain
 * is cryptographic proof that the new master succeeds the pinned one — so
 * `verified` is KEPT and the room re-keys automatically.
 *
 * ⚠️ ORDER IS SECURITY-CRITICAL (Runde-3 conditions):
 *  1. DENYLIST FIRST — a claimed master on the global retired-set is refused
 *     BEFORE any lookup or state touch. Otherwise the rotation path is a
 *     downgrade onto an abandoned key, and the denylist would guard only
 *     auto-create while the attacker takes this path.
 *  2. REJECT BEFORE ANY STATE TOUCH — an invalid chain leaves verified,
 *     peerMasterPub, peerEpoch and roomId untouched (the v0.16.0 trust-DoS, a
 *     rule that applies afresh because this path is new).
 *
 * The contact is resolved elsewhere by the CLAIMED old master; authorisation is
 * the chain's two signatures (verifyRotation), never the match.
 */
export async function acceptRotation(
  contact: Contact,
  statement: RotationStatement,
  retired: Set<string>,
): Promise<{ oldRoomId: string; newRoomId: string }> {
  if (retired.has(await b64(statement.oldMasterPub)) || retired.has(await b64(statement.newMasterPub))) {
    throw new RetiredIdentityError(true);
  }
  if (!(await verifyRotation(contact.peerMasterPub, contact.peerEpoch, statement))) {
    throw new Error('Rotations-Kette ungültig — Kontakt unverändert.');
  }
  if (!contact.ownMasterPub) {
    throw new Error('Rotation ohne ownMasterPub — roomId nicht ableitbar.');
  }
  const oldRoomId = contact.roomId;
  contact.peerMasterPub = statement.newMasterPub;
  contact.peerEpoch = statement.epoch;
  contact.bundle = undefined;
  contact.sessions.clear(); // drop ALL per-device sessions — fresh X3DH under the new master
  // The old device list was signed under the OLD master; keeping it would make
  // deviceAuthorized revoke every real device of the NEW master (RevokedDeviceError)
  // until fresh gossip. Drop it → implicit single-device until a new master-signed
  // list arrives. NOTE: this receive path is currently DORMANT — no automatic
  // producer creates a real rotation chain (the co-signed linking producer was
  // dropped after the design-lock; every rotation collapses to acceptMasterChange).
  // Full post-rotation device REACHABILITY (which device backs the new session)
  // is producer-dependent and intentionally out of scope here.
  contact.peerDeviceList = undefined;
  const newRoomId = await computeMasterRoomId(contact.ownMasterPub, asMasterPub(statement.newMasterPub));
  contact.roomId = newRoomId;
  contact.regime = 'master';
  // verified DELIBERATELY unchanged — the chain proved continuity.
  return { oldRoomId, newRoomId };
}

/** Encrypt outgoing text into a wire envelope; establishes the session if needed. */
/** A group's roster, shared E2E so every member can reach every other member. */
export interface GroupInvite {
  id: string;
  name: string;
  members: { signPub: string; dhPub: string; bundle: string | null; name: string | null }[];
}

/** Message payload framed into the ratchet plaintext. */
export type MessageContent =
  | { kind: 'text'; text: string }
  | { kind: 'file'; name: string; mime: string; data: Bytes }
  | { kind: 'profile'; name?: string; avatar?: Bytes }
  | { kind: 'group'; groupId: string; senderName?: string; inner: MessageContent }
  | { kind: 'ginvite'; group: GroupInvite }
  | { kind: 'gremove'; groupId: string } // "you were removed from this group"
  | { kind: 'gleave'; groupId: string } // "I left this group"
  | { kind: 'devlist'; list: DeviceList } // E2E gossip of my updated device list
  | { kind: 'rotation'; statement: RotationStatement }; // dual-signed master rotation (proven door)

function prefixed(type: number, body: Uint8Array): Bytes {
  const out = new Uint8Array(1 + body.length);
  out[0] = type;
  out.set(body, 1);
  return out;
}

// Frame: byte0 = 0 (text) | 1 (file) | 2 (profile).
//   file:    [nameLen(2)][name][mimeLen(2)][mime][data]
//   profile: [nameLen(2)][name][avatarLen(4)][avatar]
async function frameContent(c: MessageContent): Promise<Bytes> {
  if (c.kind === 'text') {
    const t = utf8.encode(c.text);
    const out = new Uint8Array(1 + t.length);
    out[0] = 0;
    out.set(t, 1);
    return out;
  }
  if (c.kind === 'file') {
    const name = utf8.encode(c.name);
    const mime = utf8.encode(c.mime);
    const out = new Uint8Array(1 + 2 + name.length + 2 + mime.length + c.data.length);
    const dv = new DataView(out.buffer);
    let o = 0;
    out[o++] = 1;
    dv.setUint16(o, name.length);
    o += 2;
    out.set(name, o);
    o += name.length;
    dv.setUint16(o, mime.length);
    o += 2;
    out.set(mime, o);
    o += mime.length;
    out.set(c.data, o);
    return out;
  }
  if (c.kind === 'profile') {
    const name = utf8.encode(c.name ?? '');
    const avatar = c.avatar ?? new Uint8Array(0);
    const out = new Uint8Array(1 + 2 + name.length + 4 + avatar.length);
    const dv = new DataView(out.buffer);
    let o = 0;
    out[o++] = 2;
    dv.setUint16(o, name.length);
    o += 2;
    out.set(name, o);
    o += name.length;
    dv.setUint32(o, avatar.length);
    o += 4;
    out.set(avatar, o);
    return out;
  }
  if (c.kind === 'group') {
    const json = JSON.stringify({ g: c.groupId, s: c.senderName ?? '', i: bytesToB64(await frameContent(c.inner)) });
    return prefixed(3, utf8.encode(json));
  }
  if (c.kind === 'gremove') return prefixed(5, utf8.encode(c.groupId));
  if (c.kind === 'gleave') return prefixed(6, utf8.encode(c.groupId));
  if (c.kind === 'devlist') return prefixed(7, await encodeDeviceList(c.list));
  if (c.kind === 'rotation') return prefixed(8, encodeRotation(c.statement));
  // ginvite
  return prefixed(4, utf8.encode(JSON.stringify(c.group)));
}

async function unframeContent(bytes: Bytes): Promise<MessageContent> {
  if (bytes[0] === 0) return { kind: 'text', text: utf8.decode(bytes.slice(1)) };
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (bytes[0] === 2) {
    let o = 1;
    const nameLen = dv.getUint16(o);
    o += 2;
    const name = utf8.decode(bytes.slice(o, o + nameLen));
    o += nameLen;
    const avLen = dv.getUint32(o);
    o += 4;
    return { kind: 'profile', name: name || undefined, avatar: avLen > 0 ? bytes.slice(o, o + avLen) : undefined };
  }
  if (bytes[0] === 3) {
    const j = JSON.parse(utf8.decode(bytes.slice(1)));
    return { kind: 'group', groupId: j.g, senderName: j.s || undefined, inner: await unframeContent(b64ToBytes(j.i)) };
  }
  if (bytes[0] === 4) {
    return { kind: 'ginvite', group: JSON.parse(utf8.decode(bytes.slice(1))) as GroupInvite };
  }
  if (bytes[0] === 5) return { kind: 'gremove', groupId: utf8.decode(bytes.slice(1)) };
  if (bytes[0] === 6) return { kind: 'gleave', groupId: utf8.decode(bytes.slice(1)) };
  if (bytes[0] === 7) return { kind: 'devlist', list: await decodeDeviceList(bytes.slice(1)) };
  if (bytes[0] === 8) return { kind: 'rotation', statement: decodeRotation(bytes.slice(1)) };

  // Only type 1 is a real file. Anything else is a corrupt/unknown frame — throw
  // so it's dropped, never rendered as a junk "file" in the chat (e.g. a mangled
  // profile update must not surface as a downloadable attachment).
  if (bytes[0] !== 1) throw new Error('Unbekannter Frame-Typ: ' + bytes[0]);

  let o = 1;
  const nameLen = dv.getUint16(o);
  o += 2;
  const name = utf8.decode(bytes.slice(o, o + nameLen));
  o += nameLen;
  const mimeLen = dv.getUint16(o);
  o += 2;
  const mime = utf8.decode(bytes.slice(o, o + mimeLen));
  o += mimeLen;
  return { kind: 'file', name, mime, data: bytes.slice(o) };
}

async function sendContent(me: IdentityKeys, contact: Contact, content: MessageContent): Promise<Bytes> {
  // Enforced HERE, not in the UI: after a device-linking identity swap the peer
  // still has our OLD master pinned, so any message over the surviving session
  // would assert an identity we no longer hold — a false authenticity claim, not
  // just a stale label. Receiving remains allowed.
  if (contact.staleIdentity) {
    throw new StaleIdentityError();
  }
  // Send over the PRIMARY/pinned device's session. Stage 3d step 1: at most one
  // session (keyed by peerSignPub), so behaviour is identical to the old single
  // ratchet. Step 6 fans out over every authorised device's own session.
  const key = deviceKey(contact.peerSignPub);
  let session = contact.sessions.get(key);
  if (!session?.ratchet) {
    if (!contact.bundle) {
      throw new Error('Für den ersten Schritt braucht ihr den Code dieses Kontakts.');
    }
    const { header, session: x3dh } = await initiateX3DH(me, contact.bundle);
    const ratchet = await initRatchetInitiator(x3dh.sharedSecret, contact.bundle.signedPreKey.pub, x3dh.associatedData);
    // We initiate to the pinned device, so that device backs this session.
    session = { ratchet, pendingHeader: header, deviceSignPub: contact.peerSignPub };
    contact.sessions.set(key, session);
  }
  const message = await ratchetEncrypt(session.ratchet!, await frameContent(content));
  const conv = contact.roomId;
  const envelope = session.pendingHeader
    ? ({ type: 'prekey', conv, x3dh: session.pendingHeader, message } as const)
    : ({ type: 'msg', conv, message } as const);
  // Sealed Sender: wrap the whole envelope in an anonymous box to the recipient,
  // so the relay never sees the sender's X3DH identity keys or the conv id.
  // Tagged, because an inbox can also receive non-envelope payloads (link grants).
  return sealPayload(contact.peerDhPub, SEALED_ENVELOPE, await encodeEnvelope(envelope));
}

export async function sendMessage(me: IdentityKeys, contact: Contact, text: string): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'text', text });
}

export async function sendFile(
  me: IdentityKeys,
  contact: Contact,
  name: string,
  mime: string,
  data: Bytes,
): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'file', name, mime, data });
}

export async function sendProfile(
  me: IdentityKeys,
  contact: Contact,
  name: string | undefined,
  avatar: Bytes | undefined,
): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'profile', name, avatar });
}

export async function sendGroupMessage(
  me: IdentityKeys,
  contact: Contact,
  groupId: string,
  senderName: string | undefined,
  inner: MessageContent,
): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'group', groupId, senderName, inner });
}

export async function sendGroupInvite(me: IdentityKeys, contact: Contact, group: GroupInvite): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'ginvite', group });
}

export async function sendGroupRemove(me: IdentityKeys, contact: Contact, groupId: string): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'gremove', groupId });
}

export async function sendGroupLeave(me: IdentityKeys, contact: Contact, groupId: string): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'gleave', groupId });
}

/** Gossip our updated, master-signed device list to a contact (revocation). */
export async function sendDeviceList(me: IdentityKeys, contact: Contact, list: DeviceList): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'devlist', list });
}

/** Gossip a dual-signed master rotation to a contact that still pins our OLD
 *  master. Unlike the unproven previousMaster hint, this PROVES continuity, so
 *  the receiver's acceptRotation keeps `verified`. The producer (a co-signed
 *  chain from device linking) is separate; this is the transport. */
export async function sendRotation(me: IdentityKeys, contact: Contact, statement: RotationStatement): Promise<Bytes> {
  return sendContent(me, contact, { kind: 'rotation', statement });
}

/** Decrypt an incoming envelope; establishes the responder session on first contact. */
export async function receiveMessage(
  me: IdentityKeys,
  contact: Contact,
  bytes: Bytes,
  lookup: PreKeyLookup,
): Promise<MessageContent> {
  const opened = await openPayload(me, bytes);
  if (!opened || opened.type !== SEALED_ENVELOPE) {
    throw new Error('Kein Nachrichten-Envelope (falscher Nutzlast-Typ).');
  }
  return receiveEnvelope(me, contact, await decodeEnvelope(opened.payload), lookup);
}

export async function receiveEnvelope(
  me: IdentityKeys,
  contact: Contact,
  envelope: Envelope,
  lookup: PreKeyLookup,
): Promise<MessageContent> {
  // ── AUTHORISE every prekey — master-based, at the TOP, before any mutation ──
  // `conv` is a pure routing field: the sender picks it freely and the relay
  // accepts unauthenticated sends into any inbox, so being matched to `contact`
  // proves nothing. The peer's device DH key is public (it travels in group
  // rosters), so it CANNOT bind — only the MASTER can, because only the peer's
  // own devices hold a cert under it (respondX3DH re-checks that cert).
  //
  // (1) MASTER binding: the claimed master must be the pinned one. Regime-
  //     independent — it compares the masters directly, so it works whether this
  //     contact's roomId is still device-DH (pre-migration) or already master.
  //     A mismatch is REJECTED here, never routed into the master-change branch
  //     below: routing it there would reopen the v0.16.4 injection — an attacker
  //     with a victim's rostered dhPub could otherwise smuggle in a pendingMaster.
  //     Legitimate master changes are handled deliberately (Stage 3c door), not
  //     off an unauthenticated prekey.
  //
  // (2) DEVICE revocation: the sending device must be authorised for this
  //     contact (present in an accepted master-signed list, or the pinned device
  //     when none exists). This sits BEFORE the simultaneous-init tie-break that
  //     nulls our ratchet — otherwise a revoked device could destroy a live
  //     session via that path before the guard ever runs.
  if (envelope.type === 'prekey') {
    const x = envelope.x3dh;
    if (!bytesEqual(x.masterPub, contact.peerMasterPub)) {
      throw new Error('Nachricht gehört nicht zu dieser Unterhaltung — verworfen.');
    }
    if (!deviceAuthorized(contact, x.identitySignPub)) {
      throw new RevokedDeviceError();
    }
  }

  // (The old master-mismatch branch that recorded pendingMaster and threw
  // MasterChangedError/RetiredIdentityError from a bare prekey is GONE. Under
  // master-based roomId the top-of-function authorisation already rejects any
  // envelope whose master isn't the pinned one — a different master derives a
  // different room and never reaches here as this contact. A legitimate master
  // change is now handled deliberately, off two explicit paths, not off an
  // unauthenticated prekey:
  //   • a dual-signed ROTATION chain proves continuity → acceptRotation (keeps
  //     verified, re-keys); and
  //   • an UNPROVEN previousMaster hint surfaces a merge affordance the user
  //     confirms → acceptMasterChange (clears verified).
  // The retired-master defence moved to the GLOBAL, master-indexed denylist,
  // checked before those paths and before auto-create — see lib/denylist.ts.)

  // We DECIDE the path and BUILD any new session into LOCALS, mutating live
  // contact state only AFTER the message authenticates (respondX3DH's cert check
  // and the AEAD decrypt both pass) — the v0.17.1 "commit only after the AEAD
  // check" discipline. The prekey guards above compare only PUBLIC roster values;
  // the secret-binding check lives inside respondX3DH. If we nulled the live
  // ratchet/pendingHeader before it, an attacker who copied a peer's public
  // master + signPub could destroy an in-flight session with a garbage prekey
  // (Devil's-Advocate DA-4), and a forged 'msg' could clear pendingHeader and
  // stall a handshake (Review F). Committing last closes both.

  // Simultaneous initiation: we started a session and haven't heard back
  // (pendingHeader set) AND the peer also sent a prekey. Both can't keep their
  // own session — pick one deterministically by identity order: the lower key
  // stays initiator, the higher adopts the peer's session. Both then converge.
  // Select the session by the SENDER DEVICE. A prekey names it (x3dh.identitySignPub);
  // a 'msg' has no device field yet (Stage 3d step 1 → the primary/pinned device;
  // step 6 adds envelope.dev). Everything below operates on THIS device's session,
  // so Invariant I holds per session — no other device's chain is touched.
  const sessKey = envelope.type === 'prekey' ? deviceKey(envelope.x3dh.identitySignPub) : deviceKey(contact.peerSignPub);
  const existing = contact.sessions.get(sessKey);
  const simInitAdopt = !!existing?.ratchet && !!existing.pendingHeader && envelope.type === 'prekey';
  if (simInitAdopt && cmp(me.dh.publicKey, contact.peerDhPub) < 0) {
    throw new Error('Gleichzeitiger Verbindungsaufbau — Peer-Prekey ignoriert (unsere Session gewinnt).');
  }

  // Build a fresh responder session iff THIS device has no live ratchet, OR we lost
  // the sim-init tie-break and must adopt the peer's (without yet dropping ours).
  // freshHandshake drives the "provably wrong on first decrypt" reporting.
  const buildFresh = !existing?.ratchet || simInitAdopt;
  const freshHandshake = buildFresh;

  let ratchet = existing?.ratchet ?? null;
  if (buildFresh) {
    if (envelope.type !== 'prekey') {
      throw new Error('Erste Nachricht ohne X3DH-Header — Session kann nicht aufgebaut werden.');
    }
    const spk = lookup.signedPreKey(envelope.x3dh.signedPreKeyId);
    if (!spk) throw new Error('Passender Signed Prekey nicht gefunden (vermutlich rotiert).');
    const opkPriv = lookup.consumeOneTimePreKey(envelope.x3dh.oneTimePreKeyId);
    // respondX3DH verifies the sender's device cert — throws X3DHError on a forgery
    // BEFORE we touch any live state.
    const x3dh = await respondX3DH(me, spk.privateKey, opkPriv, envelope.x3dh);
    ratchet = await initRatchetResponder(x3dh.sharedSecret, spk, x3dh.associatedData);
  }
  if (!ratchet) {
    // Unreachable: buildFresh either set ratchet or threw. Kept as a type guard.
    throw new Error('Kein Ratchet-Zustand nach Handshake.');
  }

  let plaintext: Bytes;
  try {
    plaintext = await ratchetDecrypt(ratchet, envelope.message);
  } catch (e) {
    if (freshHandshake) {
      // The derived session is provably wrong — leave the session map untouched (we
      // never committed the fresh ratchet), so the next prekey attempt starts clean
      // AND a forged prekey cannot have destroyed a pre-existing in-flight session.
      throw new HandshakeMismatchError();
    }
    throw e;
  }

  // COMMIT: the message authenticated, so it is now safe to mutate live state. Store
  // it under THIS device's session key — a fresh ratchet replaces our in-flight one
  // for that device (sim-init loss / first contact), and any inbound message means
  // the peer has our session, so we stop attaching the X3DH header.
  const deviceSignPub = envelope.type === 'prekey' ? envelope.x3dh.identitySignPub : contact.peerSignPub;
  contact.sessions.set(sessKey, { ratchet, pendingHeader: null, deviceSignPub });
  return await unframeContent(plaintext);
}

// --- Contact (de)serialisation for the vault (produces plaintext bytes only) ---

interface ContactWire {
  roomId: string;
  peerMasterPub: string;
  peerEpoch: number;
  peerSignPub: string;
  peerDhPub: string;
  peerFingerprint: string;
  nickname: string | null;
  peerName: string | null;
  peerAvatarB64: string | null;
  verified: boolean;
  hidden: boolean;
  staleIdentity: boolean;
  pendingMaster: { masterPub: string; epoch: number; signPub: string; dhPub: string } | null;
  retiredMasters: string[];
  retiredAttempt: boolean;
  ownMasterPub: string | null;
  peerDeviceList: string | null; // b64 of encodeDeviceList
  regime: 'device' | 'master' | null; // null = pre-3c device-DH regime
  bundle: string | null; // bundle token (null if we only hold their identity)
  // Per-device sessions (Stage 3d), keyed by base64(deviceSignPub).
  sessions?: { [devB64: string]: { ratchet: string | null; pendingHeader: unknown | null; deviceSignPub: string } };
  // LEGACY (pre-3d) — a record written before 3d has these flat fields and NO
  // `sessions`; deserialize synthesizes a single-entry map from them (one-way).
  ratchet?: string | null;
  pendingHeader?: unknown | null;
  ratchetDeviceSignPub?: string | null;
}

async function b64(b: Bytes): Promise<string> {
  const s = await getSodium();
  return s.to_base64(b, s.base64_variants.ORIGINAL);
}

/** Canonical base64 of a master pub — THE key format of the global denylist.
 *  Exported so every denylist check uses the same encoding as what acceptMaster-
 *  Change/acceptRotation store; a mismatched encoding would silently miss. */
export async function masterKeyB64(masterPub: Bytes): Promise<string> {
  return b64(masterPub);
}
async function unb64(str: string): Promise<Bytes> {
  const s = await getSodium();
  return new Uint8Array(s.from_base64(str, s.base64_variants.ORIGINAL));
}

export async function serializeContact(c: Contact): Promise<Bytes> {
  const wire: ContactWire = {
    roomId: c.roomId,
    peerMasterPub: await b64(c.peerMasterPub),
    peerEpoch: c.peerEpoch,
    peerSignPub: await b64(c.peerSignPub),
    peerDhPub: await b64(c.peerDhPub),
    peerFingerprint: c.peerFingerprint,
    nickname: c.nickname ?? null,
    peerName: c.peerName ?? null,
    peerAvatarB64: c.peerAvatarB64 ?? null,
    verified: c.verified ?? false,
    hidden: c.hidden ?? false,
    staleIdentity: c.staleIdentity ?? false,
    pendingMaster: c.pendingMaster
      ? {
          masterPub: await b64(c.pendingMaster.masterPub),
          epoch: c.pendingMaster.epoch,
          signPub: await b64(c.pendingMaster.signPub),
          dhPub: await b64(c.pendingMaster.dhPub),
        }
      : null,
    retiredMasters: c.retiredMasters ?? [],
    retiredAttempt: c.retiredAttempt ?? false,
    ownMasterPub: c.ownMasterPub ? await b64(c.ownMasterPub) : null,
    peerDeviceList: c.peerDeviceList ? await b64(await encodeDeviceList(c.peerDeviceList)) : null,
    regime: c.regime ?? null,
    bundle: c.bundle ? await encodeBundle(c.bundle) : null,
    sessions: await serializeSessions(c.sessions),
  };
  return utf8.encode(JSON.stringify(wire));
}

async function serializeSessions(
  sessions: Map<string, Session>,
): Promise<{ [devB64: string]: { ratchet: string | null; pendingHeader: unknown | null; deviceSignPub: string } }> {
  const out: { [k: string]: { ratchet: string | null; pendingHeader: unknown | null; deviceSignPub: string } } = {};
  for (const [k, s] of sessions) {
    out[k] = {
      ratchet: s.ratchet ? await b64(await serializeState(s.ratchet)) : null,
      pendingHeader: s.pendingHeader ? await encodeInitialHeader(s.pendingHeader) : null,
      deviceSignPub: await b64(s.deviceSignPub),
    };
  }
  return out;
}

/** Rebuild the per-device session map, migrating a pre-3d record (flat ratchet
 *  fields, no `sessions`) into a single-entry map keyed by the device that backed
 *  the live ratchet — the same fallback (ratchetDeviceSignPub ?? peerSignPub) the
 *  revocation guard used. Idempotent: presence of `sessions` skips migration. */
async function deserializeSessions(wire: ContactWire): Promise<Map<string, Session>> {
  const map = new Map<string, Session>();
  if (wire.sessions) {
    for (const [k, s] of Object.entries(wire.sessions)) {
      map.set(k, {
        ratchet: s.ratchet ? await deserializeState(await unb64(s.ratchet)) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pendingHeader: s.pendingHeader ? await decodeInitialHeader(s.pendingHeader as any) : null,
        deviceSignPub: await unb64(s.deviceSignPub),
      });
    }
    return map;
  }
  if (wire.ratchet) {
    const deviceSignPub = await unb64(wire.ratchetDeviceSignPub ?? wire.peerSignPub);
    map.set(deviceKey(deviceSignPub), {
      ratchet: await deserializeState(await unb64(wire.ratchet)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pendingHeader: wire.pendingHeader ? await decodeInitialHeader(wire.pendingHeader as any) : null,
      deviceSignPub,
    });
  }
  return map;
}

export async function deserializeContact(bytes: Bytes): Promise<Contact> {
  const wire = JSON.parse(utf8.decode(bytes)) as ContactWire;
  return {
    roomId: wire.roomId,
    peerMasterPub: await unb64(wire.peerMasterPub),
    peerEpoch: wire.peerEpoch ?? 1,
    peerSignPub: await unb64(wire.peerSignPub),
    peerDhPub: await unb64(wire.peerDhPub),
    peerFingerprint: wire.peerFingerprint,
    nickname: wire.nickname ?? undefined,
    peerName: wire.peerName ?? undefined,
    peerAvatarB64: wire.peerAvatarB64 ?? undefined,
    verified: wire.verified ?? false,
    hidden: wire.hidden || undefined,
    staleIdentity: wire.staleIdentity || undefined,
    pendingMaster: wire.pendingMaster
      ? {
          masterPub: await unb64(wire.pendingMaster.masterPub),
          epoch: wire.pendingMaster.epoch,
          signPub: await unb64(wire.pendingMaster.signPub),
          dhPub: await unb64(wire.pendingMaster.dhPub),
        }
      : undefined,
    retiredMasters: wire.retiredMasters?.length ? wire.retiredMasters : undefined,
    retiredAttempt: wire.retiredAttempt || undefined,
    ownMasterPub: wire.ownMasterPub ? ((await unb64(wire.ownMasterPub)) as MasterPub) : undefined,
    peerDeviceList: wire.peerDeviceList ? await decodeDeviceList(await unb64(wire.peerDeviceList)) : undefined,
    regime: wire.regime ?? undefined,
    bundle: wire.bundle ? await decodeBundle(wire.bundle) : undefined,
    sessions: await deserializeSessions(wire),
  };
}
