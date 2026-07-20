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
  encodeBundle,
  decodeBundle,
  encodeInitialHeader,
  decodeInitialHeader,
  identityFingerprint,
  getSodium,
  concatBytes,
  utf8,
  type IdentityKeys,
  type KeyPair,
  type PreKeyBundle,
  type RatchetState,
  type InitialMessageHeader,
  type Envelope,
  type Bytes,
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
  bundle?: PreKeyBundle; // present when WE hold their code (needed to initiate)
  ratchet: RatchetState | null; // null until the session is established
  pendingHeader: InitialMessageHeader | null; // initiator attaches until first reply arrives
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

/** Deterministic per-pair relay room: both sides derive the same id. */
export async function computeRoomId(a: Bytes, b: Bytes): Promise<string> {
  const s = await getSodium();
  const [x, y] = cmp(a, b) <= 0 ? [a, b] : [b, a];
  return s.to_hex(s.crypto_generichash(16, concatBytes(x, y), null));
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
 *  the master BEFORE trusting any of the bundle's keys, then pin the master. */
export async function makeContact(myDhPub: Bytes, bundle: PreKeyBundle): Promise<Contact> {
  const certOk = await verifyDeviceCert(
    bundle.masterPub,
    bundle.epoch,
    bundle.identitySignPub,
    bundle.identityDhPub,
    bundle.deviceCert,
  );
  if (!certOk) throw new Error('Device-Zertifikat ungültig — Gerät nicht vom Master signiert (möglicher MITM).');
  return {
    roomId: await computeRoomId(myDhPub, bundle.identityDhPub),
    peerMasterPub: bundle.masterPub,
    peerEpoch: bundle.epoch,
    peerSignPub: bundle.identitySignPub,
    peerDhPub: bundle.identityDhPub,
    peerFingerprint: await identityFingerprint(bundle.masterPub, bundle.masterPub),
    bundle,
    ratchet: null,
    pendingHeader: null,
  };
}

/** Responder side: a stranger who holds OUR code just messaged us. Verify their
 *  device cert against their master, then TOFU-pin the master. */
export async function makeContactFromHeader(
  myDhPub: Bytes,
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
    roomId: await computeRoomId(myDhPub, header.identityDhPub),
    peerMasterPub: header.masterPub,
    peerEpoch: header.epoch,
    peerSignPub: header.identitySignPub,
    peerDhPub: header.identityDhPub,
    peerFingerprint: await identityFingerprint(header.masterPub, header.masterPub),
    bundle: undefined,
    ratchet: null,
    pendingHeader: null,
  };
}

/**
 * PEER SIDE of the door: deliberately accept a claimed new identity for this
 * contact (explicit user action only). Re-pins the master, drops the session so
 * a fresh X3DH runs under the new identity, and clears `verified` — the safety
 * number MUST be compared again. Returns false if nothing was pending.
 */
export async function acceptMasterChange(contact: Contact): Promise<boolean> {
  const p = contact.pendingMaster;
  if (!p) return false;
  // The master we are replacing is now abandoned — remember it so it can never
  // be offered again (see Contact.retiredMasters).
  const retired = await b64(contact.peerMasterPub);
  contact.retiredMasters = [...(contact.retiredMasters ?? []), retired].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );
  contact.peerMasterPub = p.masterPub;
  contact.peerEpoch = p.epoch;
  contact.peerSignPub = p.signPub;
  contact.peerDhPub = p.dhPub;
  contact.peerFingerprint = await identityFingerprint(p.masterPub, p.masterPub);
  contact.bundle = undefined; // the stored bundle belonged to the old identity
  contact.ratchet = null; // force a fresh handshake
  contact.pendingHeader = null;
  contact.verified = false; // re-verification is mandatory
  contact.pendingMaster = undefined;
  return true;
}

/**
 * OUR SIDE of the door: leave the stale-identity state after a device linking
 * swap. Drops the session so the next message runs a fresh X3DH under our
 * CURRENT (linked) master and lifts the send block. The peer will see an
 * identity warning and must accept us — that is the pinning working, not a bug.
 */
export function reconnectContact(contact: Contact): void {
  contact.staleIdentity = undefined;
  contact.ratchet = null;
  contact.pendingHeader = null;
  // The stored bundle's ONE-TIME prekey was consumed by the session we are
  // resetting. Reusing it would make us derive DH1–DH4 while the peer (who no
  // longer holds that key) derives DH1–DH3 — different shared secrets, and the
  // handshake fails silently. Drop it and fall back to the standard no-OPK
  // X3DH, exactly as Signal does when a peer has no one-time prekeys left.
  if (contact.bundle?.oneTimePreKey) {
    contact.bundle = { ...contact.bundle, oneTimePreKey: undefined };
  }
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
  | { kind: 'gleave'; groupId: string }; // "I left this group"

function prefixed(type: number, body: Uint8Array): Bytes {
  const out = new Uint8Array(1 + body.length);
  out[0] = type;
  out.set(body, 1);
  return out;
}

// Frame: byte0 = 0 (text) | 1 (file) | 2 (profile).
//   file:    [nameLen(2)][name][mimeLen(2)][mime][data]
//   profile: [nameLen(2)][name][avatarLen(4)][avatar]
function frameContent(c: MessageContent): Bytes {
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
    const json = JSON.stringify({ g: c.groupId, s: c.senderName ?? '', i: bytesToB64(frameContent(c.inner)) });
    return prefixed(3, utf8.encode(json));
  }
  if (c.kind === 'gremove') return prefixed(5, utf8.encode(c.groupId));
  if (c.kind === 'gleave') return prefixed(6, utf8.encode(c.groupId));
  // ginvite
  return prefixed(4, utf8.encode(JSON.stringify(c.group)));
}

function unframeContent(bytes: Bytes): MessageContent {
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
    return { kind: 'group', groupId: j.g, senderName: j.s || undefined, inner: unframeContent(b64ToBytes(j.i)) };
  }
  if (bytes[0] === 4) {
    return { kind: 'ginvite', group: JSON.parse(utf8.decode(bytes.slice(1))) as GroupInvite };
  }
  if (bytes[0] === 5) return { kind: 'gremove', groupId: utf8.decode(bytes.slice(1)) };
  if (bytes[0] === 6) return { kind: 'gleave', groupId: utf8.decode(bytes.slice(1)) };

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
  if (!contact.ratchet) {
    if (!contact.bundle) {
      throw new Error('Für den ersten Schritt braucht ihr den Code dieses Kontakts.');
    }
    const { header, session } = await initiateX3DH(me, contact.bundle);
    contact.ratchet = await initRatchetInitiator(
      session.sharedSecret,
      contact.bundle.signedPreKey.pub,
      session.associatedData,
    );
    contact.pendingHeader = header;
  }
  const message = await ratchetEncrypt(contact.ratchet, frameContent(content));
  const conv = contact.roomId;
  const envelope = contact.pendingHeader
    ? ({ type: 'prekey', conv, x3dh: contact.pendingHeader, message } as const)
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
  // ── Bind the envelope to THIS conversation, for EVERY prekey ──────────────
  // `conv` is a pure routing field: the sender picks it freely and the relay
  // accepts unauthenticated sends into any inbox. So the fact that this envelope
  // was matched to `contact` proves nothing on its own. The device cert proves
  // nothing about *whose* keys these are either — anyone can generate a master
  // and self-sign a cert over arbitrary public keys (a cert carries no proof of
  // possession).
  //
  // What IS binding: our roomId is derived from our DH key and the peer's, so a
  // prekey that legitimately concerns this contact must re-derive exactly this
  // roomId from the identity it presents.
  //
  // This sits at the TOP, not inside the master-mismatch branch below, so that
  // the contact-selection is validated on every path rather than one. When the
  // masters happen to match, the mismatch branch is skipped entirely and the
  // only remaining guard would be the cert check inside respondX3DH — which
  // catches a forgery, but only after we have already accepted the envelope as
  // belonging here. Defence should not depend on which branch a message takes.
  //
  // Legitimate cases pass: an ordinary prekey, a master rotation and a
  // device-linking swap all keep the device keys. A peer whose device keys
  // really changed arrives as a NEW contact — the honest outcome. (That also
  // stops a second device of the peer from silently clobbering this session;
  // per-device sessions are stage 3c's job, not an accident of this path.)
  if (envelope.type === 'prekey') {
    const claimed = envelope.x3dh.identityDhPub;
    if ((await computeRoomId(me.dh.publicKey, claimed)) !== contact.roomId) {
      throw new Error('Nachricht gehört nicht zu dieser Unterhaltung — verworfen.');
    }
  }

  // Master pinning (TOFU): a prekey claiming a DIFFERENT master for an already-
  // pinned contact is rejected outright. A bare master change — without a valid,
  // dual-signed rotation chain from the pinned master — is a possible MITM, so a
  // higher epoch alone must never override the pin. Drop verified, Signal-style.
  // (Rotation-chain acceptance arrives with the rotation flow.)
  if (
    envelope.type === 'prekey' &&
    contact.peerMasterPub &&
    cmp(envelope.x3dh.masterPub, contact.peerMasterPub) !== 0
  ) {
    const x = envelope.x3dh;

    // (Conversation binding is enforced at the TOP of this function, for every
    // prekey — an identity-change claim that does not derive this roomId never
    // reaches this branch.)

    // Retired master? Refuse outright and — importantly — WITHOUT touching
    // `verified`. Otherwise anyone holding the abandoned key could degrade our
    // trust in the contact's CURRENT identity just by sending. This is a dead
    // end by design: the way back is a fresh identity setup, not this key.
    if (contact.retiredMasters?.includes(await b64(x.masterPub))) {
      // Record the attempt ONCE. The holder of the abandoned key can replay
      // indefinitely, so this must be a contact state the user can look at, not
      // a per-message alert — see Contact.retiredAttempt.
      const first = !contact.retiredAttempt;
      contact.retiredAttempt = true;
      throw new RetiredIdentityError(first);
    }

    // NOTE: `verified` is deliberately NOT cleared here — see acceptMasterChange,
    // which clears it at the moment the pin actually moves. Clearing it on
    // receipt would let anyone who can reach our inbox burn the flag of an
    // arbitrary contact, repeatedly and without holding any key: a verification
    // DoS that trains the user to click the MITM warning away — exactly the
    // precondition for a later false accept. `verified` describes the identity
    // we have PINNED, and an unaccepted claim has not moved that pin.
    //
    // Remember the claimed identity so the user can deliberately accept it, but
    // ONLY if it is internally consistent (device cert verifies under the
    // claimed master). An inconsistent claim isn't even worth offering.
    // A claim we are already showing must not alert again: it is replayable at
    // will, so one warning per delivered message is the same harassment lever as
    // the retired-master case. Dedup on CONTENT (this exact master), not on a
    // flag — a genuinely different claim deserves a fresh warning.
    const sameAsPending =
      !!contact.pendingMaster && cmp(contact.pendingMaster.masterPub, x.masterPub) === 0;
    if (await verifyDeviceCert(x.masterPub, x.epoch, x.identitySignPub, x.identityDhPub, x.deviceCert)) {
      contact.pendingMaster = {
        masterPub: x.masterPub,
        epoch: x.epoch,
        signPub: x.identitySignPub,
        dhPub: x.identityDhPub,
      };
    }
    throw new MasterChangedError(!sameAsPending);
  }

  // Simultaneous initiation: we started a session and haven't heard back
  // (pendingHeader set) AND the peer also sent a prekey. Both can't keep their
  // own session — pick one deterministically by identity order: the lower key
  // stays initiator, the higher adopts the peer's session. Both then converge.
  if (contact.ratchet && contact.pendingHeader && envelope.type === 'prekey') {
    if (cmp(me.dh.publicKey, contact.peerDhPub) < 0) {
      throw new Error('Gleichzeitiger Verbindungsaufbau — Peer-Prekey ignoriert (unsere Session gewinnt).');
    }
    contact.ratchet = null; // peer wins — drop our attempt and respond to theirs
    contact.pendingHeader = null;
  }

  // Did THIS call establish the session? Then the very next decrypt is the
  // handshake's proof — and its failure means the two sides derived different
  // shared secrets (e.g. a one-time prekey the peer already consumed). That must
  // be reported as such: a generic decrypt error here costs an evening to
  // diagnose, a named one costs five minutes.
  const freshHandshake = !contact.ratchet;

  if (!contact.ratchet) {
    if (envelope.type !== 'prekey') {
      throw new Error('Erste Nachricht ohne X3DH-Header — Session kann nicht aufgebaut werden.');
    }
    const spk = lookup.signedPreKey(envelope.x3dh.signedPreKeyId);
    if (!spk) throw new Error('Passender Signed Prekey nicht gefunden (vermutlich rotiert).');
    const opkPriv = lookup.consumeOneTimePreKey(envelope.x3dh.oneTimePreKeyId);
    const session = await respondX3DH(me, spk.privateKey, opkPriv, envelope.x3dh);
    contact.ratchet = await initRatchetResponder(session.sharedSecret, spk, session.associatedData);
  } else {
    // Any inbound message means the peer has our session → stop attaching the header.
    contact.pendingHeader = null;
  }

  try {
    return unframeContent(await ratchetDecrypt(contact.ratchet, envelope.message));
  } catch (e) {
    if (freshHandshake) {
      // The derived session is provably wrong — don't keep half a session around,
      // so the next prekey attempt can start clean.
      contact.ratchet = null;
      throw new HandshakeMismatchError();
    }
    throw e;
  }
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
  bundle: string | null; // bundle token (null if we only hold their identity)
  ratchet: string | null; // base64 of serializeState output
  pendingHeader: unknown | null;
}

async function b64(b: Bytes): Promise<string> {
  const s = await getSodium();
  return s.to_base64(b, s.base64_variants.ORIGINAL);
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
    bundle: c.bundle ? await encodeBundle(c.bundle) : null,
    ratchet: c.ratchet ? await b64(await serializeState(c.ratchet)) : null,
    pendingHeader: c.pendingHeader ? await encodeInitialHeader(c.pendingHeader) : null,
  };
  return utf8.encode(JSON.stringify(wire));
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
    bundle: wire.bundle ? await decodeBundle(wire.bundle) : undefined,
    ratchet: wire.ratchet ? await deserializeState(await unb64(wire.ratchet)) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingHeader: wire.pendingHeader ? await decodeInitialHeader(wire.pendingHeader as any) : null,
  };
}
