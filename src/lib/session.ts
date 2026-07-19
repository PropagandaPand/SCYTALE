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
  peerSignPub: Bytes;
  peerDhPub: Bytes;
  peerFingerprint: string;
  nickname?: string; // user-chosen local name for this peer (overrides everything)
  peerName?: string; // display name the peer shared via their profile
  peerAvatarB64?: string; // avatar the peer shared via their profile
  verified?: boolean; // local flag: safety number compared out-of-band
  hidden?: boolean; // group-member-only contact — kept out of the 1:1 list
  bundle?: PreKeyBundle; // present when WE hold their code (needed to initiate)
  ratchet: RatchetState | null; // null until the session is established
  pendingHeader: InitialMessageHeader | null; // initiator attaches until first reply arrives
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

/** Initiator side: we hold their code (bundle). */
export async function makeContact(myDhPub: Bytes, bundle: PreKeyBundle): Promise<Contact> {
  return {
    roomId: await computeRoomId(myDhPub, bundle.identityDhPub),
    peerSignPub: bundle.identitySignPub,
    peerDhPub: bundle.identityDhPub,
    peerFingerprint: await identityFingerprint(bundle.identitySignPub, bundle.identityDhPub),
    bundle,
    ratchet: null,
    pendingHeader: null,
  };
}

/** Responder side: a stranger who holds OUR code just messaged us. We learn
 *  their identity from the prekey header — no bundle of theirs required. */
export async function makeContactFromHeader(
  myDhPub: Bytes,
  header: InitialMessageHeader,
): Promise<Contact> {
  return {
    roomId: await computeRoomId(myDhPub, header.identityDhPub),
    peerSignPub: header.identitySignPub,
    peerDhPub: header.identityDhPub,
    peerFingerprint: await identityFingerprint(header.identitySignPub, header.identityDhPub),
    bundle: undefined,
    ratchet: null,
    pendingHeader: null,
  };
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
  | { kind: 'ginvite'; group: GroupInvite };

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
  return encodeEnvelope(envelope);
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

/** Decrypt an incoming envelope; establishes the responder session on first contact. */
export async function receiveMessage(
  me: IdentityKeys,
  contact: Contact,
  bytes: Bytes,
  lookup: PreKeyLookup,
): Promise<MessageContent> {
  return receiveEnvelope(me, contact, await decodeEnvelope(bytes), lookup);
}

export async function receiveEnvelope(
  me: IdentityKeys,
  contact: Contact,
  envelope: Envelope,
  lookup: PreKeyLookup,
): Promise<MessageContent> {
  if (!contact.ratchet) {
    if (envelope.type !== 'prekey') {
      throw new Error('Erste Nachricht ohne X3DH-Header — Session kann nicht aufgebaut werden.');
    }
    const spk = lookup.signedPreKey(envelope.x3dh.signedPreKeyId);
    if (!spk) throw new Error('Passender Signed Prekey nicht gefunden.');
    const opkPriv = lookup.consumeOneTimePreKey(envelope.x3dh.oneTimePreKeyId);
    const session = await respondX3DH(me, spk.privateKey, opkPriv, envelope.x3dh);
    contact.ratchet = await initRatchetResponder(session.sharedSecret, spk, session.associatedData);
  } else {
    // Any inbound message means the peer has our session → stop attaching the header.
    contact.pendingHeader = null;
  }

  return unframeContent(await ratchetDecrypt(contact.ratchet, envelope.message));
}

// --- Contact (de)serialisation for the vault (produces plaintext bytes only) ---

interface ContactWire {
  roomId: string;
  peerSignPub: string;
  peerDhPub: string;
  peerFingerprint: string;
  nickname: string | null;
  peerName: string | null;
  peerAvatarB64: string | null;
  verified: boolean;
  hidden: boolean;
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
    peerSignPub: await b64(c.peerSignPub),
    peerDhPub: await b64(c.peerDhPub),
    peerFingerprint: c.peerFingerprint,
    nickname: c.nickname ?? null,
    peerName: c.peerName ?? null,
    peerAvatarB64: c.peerAvatarB64 ?? null,
    verified: c.verified ?? false,
    hidden: c.hidden ?? false,
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
    peerSignPub: await unb64(wire.peerSignPub),
    peerDhPub: await unb64(wire.peerDhPub),
    peerFingerprint: wire.peerFingerprint,
    nickname: wire.nickname ?? undefined,
    peerName: wire.peerName ?? undefined,
    peerAvatarB64: wire.peerAvatarB64 ?? undefined,
    verified: wire.verified ?? false,
    hidden: wire.hidden || undefined,
    bundle: wire.bundle ? await decodeBundle(wire.bundle) : undefined,
    ratchet: wire.ratchet ? await deserializeState(await unb64(wire.ratchet)) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingHeader: wire.pendingHeader ? await decodeInitialHeader(wire.pendingHeader as any) : null,
  };
}
