/**
 * Wire format — what actually travels over the relay (always ciphertext) and
 * how a prekey bundle is packed for out-of-band exchange.
 *
 * Envelopes:
 *   - 'prekey': the initiator's first message(s) — carries the X3DH header so
 *     the responder can complete the handshake, plus the first ratchet message.
 *   - 'msg': an ordinary Double Ratchet message.
 */
import { b64encode, b64decode, utf8 } from './codec';
import { getSodium } from './sodium';
import type { InitialMessageHeader } from './x3dh';
import type { RatchetHeader, RatchetMessage } from './ratchet';
import type { PreKeyBundle } from './prekeys';
import type { Bytes } from './types';

interface RatchetHeaderWire {
  dh: string;
  pn: number;
  n: number;
}
interface RatchetMessageWire {
  header: RatchetHeaderWire;
  ct: string;
}
interface InitialHeaderWire {
  isp: string;
  idp: string;
  ek: string;
  spk: number;
  opk: number | null;
}

async function encHeader(h: RatchetHeader): Promise<RatchetHeaderWire> {
  return { dh: await b64encode(h.dh), pn: h.pn, n: h.n };
}
async function decHeader(o: RatchetHeaderWire): Promise<RatchetHeader> {
  return { dh: await b64decode(o.dh), pn: o.pn, n: o.n };
}
async function encMsg(m: RatchetMessage): Promise<RatchetMessageWire> {
  return { header: await encHeader(m.header), ct: await b64encode(m.ciphertext) };
}
async function decMsg(o: RatchetMessageWire): Promise<RatchetMessage> {
  return { header: await decHeader(o.header), ciphertext: await b64decode(o.ct) };
}

export async function encodeInitialHeader(h: InitialMessageHeader): Promise<InitialHeaderWire> {
  return {
    isp: await b64encode(h.identitySignPub),
    idp: await b64encode(h.identityDhPub),
    ek: await b64encode(h.ephemeralPub),
    spk: h.signedPreKeyId,
    opk: h.oneTimePreKeyId ?? null,
  };
}
export async function decodeInitialHeader(o: InitialHeaderWire): Promise<InitialMessageHeader> {
  return {
    identitySignPub: await b64decode(o.isp),
    identityDhPub: await b64decode(o.idp),
    ephemeralPub: await b64decode(o.ek),
    signedPreKeyId: o.spk,
    oneTimePreKeyId: o.opk ?? undefined,
  };
}

export type Envelope =
  | { type: 'prekey'; x3dh: InitialMessageHeader; message: RatchetMessage }
  | { type: 'msg'; message: RatchetMessage };

export async function encodeEnvelope(e: Envelope): Promise<Bytes> {
  const o =
    e.type === 'prekey'
      ? { t: 'prekey', x: await encodeInitialHeader(e.x3dh), m: await encMsg(e.message) }
      : { t: 'msg', m: await encMsg(e.message) };
  return utf8.encode(JSON.stringify(o));
}

export async function decodeEnvelope(bytes: Bytes): Promise<Envelope> {
  const o = JSON.parse(utf8.decode(bytes));
  if (o.t === 'prekey') {
    return { type: 'prekey', x3dh: await decodeInitialHeader(o.x), message: await decMsg(o.m) };
  }
  return { type: 'msg', message: await decMsg(o.m) };
}

// --- Prekey bundle token: compact binary pack, base64url (short, URL-safe) ---
//
// Fixed layout (all keys are fixed length):
//   version(1) | idSignPub(32) | idDhPub(32) | spkId(4) | spkPub(32)
//     | spkSig(64) | hasOpk(1) | [opkId(4) | opkPub(32)]
// ~202 bytes -> ~270 base64url chars, roughly half the old JSON token.

const BUNDLE_VERSION = 1;

export async function encodeBundle(bundle: PreKeyBundle): Promise<string> {
  const s = await getSodium();
  const hasOpk = bundle.oneTimePreKey ? 1 : 0;
  const size = 1 + 32 + 32 + 4 + 32 + 64 + 1 + (hasOpk ? 36 : 0);
  const buf = new Uint8Array(size);
  const view = new DataView(buf.buffer);
  let o = 0;
  buf[o++] = BUNDLE_VERSION;
  buf.set(bundle.identitySignPub, o);
  o += 32;
  buf.set(bundle.identityDhPub, o);
  o += 32;
  view.setUint32(o, bundle.signedPreKey.id, false);
  o += 4;
  buf.set(bundle.signedPreKey.pub, o);
  o += 32;
  buf.set(bundle.signedPreKey.signature, o);
  o += 64;
  buf[o++] = hasOpk;
  if (bundle.oneTimePreKey) {
    view.setUint32(o, bundle.oneTimePreKey.id, false);
    o += 4;
    buf.set(bundle.oneTimePreKey.pub, o);
    o += 32;
  }
  return s.to_base64(buf, s.base64_variants.URLSAFE_NO_PADDING);
}

export async function decodeBundle(token: string): Promise<PreKeyBundle> {
  const s = await getSodium();
  const buf = new Uint8Array(s.from_base64(token.trim(), s.base64_variants.URLSAFE_NO_PADDING));
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let o = 0;
  if (buf[o++] !== BUNDLE_VERSION) throw new Error('Unbekanntes Bundle-Format.');
  const take = (n: number): Bytes => {
    const r = buf.slice(o, o + n);
    o += n;
    return r;
  };
  const identitySignPub = take(32);
  const identityDhPub = take(32);
  const spkId = view.getUint32(o, false);
  o += 4;
  const spkPub = take(32);
  const spkSig = take(64);
  const hasOpk = buf[o++];
  let oneTimePreKey: { id: number; pub: Bytes } | undefined;
  if (hasOpk) {
    const opkId = view.getUint32(o, false);
    o += 4;
    oneTimePreKey = { id: opkId, pub: take(32) };
  }
  return {
    identitySignPub,
    identityDhPub,
    signedPreKey: { id: spkId, pub: spkPub, signature: spkSig },
    oneTimePreKey,
  };
}
