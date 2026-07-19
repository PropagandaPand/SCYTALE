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
  type Bytes,
} from '../crypto';

export interface Contact {
  roomId: string;
  peerSignPub: Bytes;
  peerDhPub: Bytes;
  peerFingerprint: string;
  nickname?: string; // user-chosen local name for this peer
  verified?: boolean; // local flag: safety number compared out-of-band
  bundle: PreKeyBundle; // needed to run X3DH as initiator
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

/** Encrypt outgoing text into a wire envelope; establishes the session if needed. */
export async function sendMessage(me: IdentityKeys, contact: Contact, text: string): Promise<Bytes> {
  if (!contact.ratchet) {
    const { header, session } = await initiateX3DH(me, contact.bundle);
    contact.ratchet = await initRatchetInitiator(
      session.sharedSecret,
      contact.bundle.signedPreKey.pub,
      session.associatedData,
    );
    contact.pendingHeader = header;
  }
  const message = await ratchetEncrypt(contact.ratchet, utf8.encode(text));
  const envelope = contact.pendingHeader
    ? ({ type: 'prekey', x3dh: contact.pendingHeader, message } as const)
    : ({ type: 'msg', message } as const);
  return encodeEnvelope(envelope);
}

/** Decrypt an incoming envelope; establishes the responder session on first contact. */
export async function receiveMessage(
  me: IdentityKeys,
  contact: Contact,
  bytes: Bytes,
  lookup: PreKeyLookup,
): Promise<string> {
  const envelope = await decodeEnvelope(bytes);

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

  return utf8.decode(await ratchetDecrypt(contact.ratchet, envelope.message));
}

// --- Contact (de)serialisation for the vault (produces plaintext bytes only) ---

interface ContactWire {
  roomId: string;
  peerSignPub: string;
  peerDhPub: string;
  peerFingerprint: string;
  nickname: string | null;
  verified: boolean;
  bundle: string; // bundle token
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
    verified: c.verified ?? false,
    bundle: await encodeBundle(c.bundle),
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
    verified: wire.verified ?? false,
    bundle: await decodeBundle(wire.bundle),
    ratchet: wire.ratchet ? await deserializeState(await unb64(wire.ratchet)) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingHeader: wire.pendingHeader ? await decodeInitialHeader(wire.pendingHeader as any) : null,
  };
}
