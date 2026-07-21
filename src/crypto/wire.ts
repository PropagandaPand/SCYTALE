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
  mp: string; // masterPub
  ep: number; // epoch
  dc: string; // deviceCert
  isp: string;
  idp: string;
  ek: string;
  spk: number;
  opk: number | null;
  pm?: string | null; // previousMaster (unproven origin hint), optional
}

async function encHeader(h: RatchetHeader): Promise<RatchetHeaderWire> {
  return { dh: await b64encode(h.dh), pn: h.pn, n: h.n };
}
async function encMsg(m: RatchetMessage): Promise<RatchetMessageWire> {
  return { header: await encHeader(m.header), ct: await b64encode(m.ciphertext) };
}
export async function encodeInitialHeader(h: InitialMessageHeader): Promise<InitialHeaderWire> {
  return {
    mp: await b64encode(h.masterPub),
    ep: h.epoch,
    dc: await b64encode(h.deviceCert),
    isp: await b64encode(h.identitySignPub),
    idp: await b64encode(h.identityDhPub),
    ek: await b64encode(h.ephemeralPub),
    spk: h.signedPreKeyId,
    opk: h.oneTimePreKeyId ?? null,
    pm: h.previousMaster ? await b64encode(h.previousMaster) : null,
  };
}
export async function decodeInitialHeader(o: InitialHeaderWire): Promise<InitialMessageHeader> {
  return {
    masterPub: await b64decode(o.mp),
    epoch: o.ep,
    deviceCert: await b64decode(o.dc),
    identitySignPub: await b64decode(o.isp),
    identityDhPub: await b64decode(o.idp),
    ephemeralPub: await b64decode(o.ek),
    signedPreKeyId: o.spk,
    oneTimePreKeyId: o.opk ?? undefined,
    previousMaster: o.pm ? await b64decode(o.pm) : undefined,
  };
}

export type Envelope =
  | { type: 'prekey'; conv: string; x3dh: InitialMessageHeader; message: RatchetMessage }
  | { type: 'msg'; conv: string; message: RatchetMessage };

export async function encodeEnvelope(e: Envelope): Promise<Bytes> {
  const o =
    e.type === 'prekey'
      ? { t: 'prekey', c: e.conv, x: await encodeInitialHeader(e.x3dh), m: await encMsg(e.message) }
      : { t: 'msg', c: e.conv, m: await encMsg(e.message) };
  return utf8.encode(JSON.stringify(o));
}

/**
 * Everything reaching this function comes from an UNAUTHENTICATED sender —
 * delivery into an inbox is deliberately open. Without validation the decoder
 * produced a different exception type per malformation (SyntaxError, TypeError
 * on a missing field, "incomplete input" from base64, RangeError out of a
 * DataView, and a silently accepted 2-byte DH key that travelled all the way
 * into dhRatchet). Five exception shapes from hostile input is not error
 * handling — it is whatever the parser happened to do first.
 *
 * So: one validation stage, right here, at the single point every inbound
 * envelope passes. Rejection is uniform (EnvelopeError) and happens before any
 * value reaches the ratchet or X3DH.
 */
export class EnvelopeError extends Error {
  constructor(what: string) {
    super('Verworfen: fehlerhaftes Nachrichtenformat (' + what + ').');
    this.name = 'EnvelopeError';
  }
}

const KEY_LEN = 32;
const SIG_LEN = 64;

function reqStr(v: unknown, what: string): string {
  if (typeof v !== 'string' || v.length === 0) throw new EnvelopeError(what);
  return v;
}
/** Non-negative safe integer. Rejects floats, NaN, Infinity and negatives —
 *  epochBytes() would otherwise truncate a negative into 0xffffffffffffffff. */
function reqUint(v: unknown, what: string): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) throw new EnvelopeError(what);
  return v;
}
function reqBytes(b: Bytes, len: number, what: string): Bytes {
  if (b.length !== len) throw new EnvelopeError(what);
  return b;
}
async function reqB64(v: unknown, what: string): Promise<Bytes> {
  reqStr(v, what);
  try {
    return await b64decode(v as string);
  } catch {
    throw new EnvelopeError(what);
  }
}

export async function decodeEnvelope(bytes: Bytes): Promise<Envelope> {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(utf8.decode(bytes)) as Record<string, unknown>;
  } catch {
    throw new EnvelopeError('kein gültiges JSON');
  }
  if (!o || typeof o !== 'object') throw new EnvelopeError('kein Objekt');

  const conv = reqStr(o.c, 'conv');
  const message = await decMsgChecked(o.m);
  if (o.t !== 'prekey') return { type: 'msg', conv, message };
  return { type: 'prekey', conv, x3dh: await decodeInitialHeaderChecked(o.x), message };
}

async function decMsgChecked(m: unknown): Promise<RatchetMessage> {
  if (!m || typeof m !== 'object') throw new EnvelopeError('Nachrichtenteil fehlt');
  const w = m as Record<string, unknown>;
  const h = w.header;
  if (!h || typeof h !== 'object') throw new EnvelopeError('Header fehlt');
  const hw = h as Record<string, unknown>;
  return {
    header: {
      dh: reqBytes(await reqB64(hw.dh, 'header.dh'), KEY_LEN, 'header.dh Länge'),
      pn: reqUint(hw.pn, 'header.pn'),
      n: reqUint(hw.n, 'header.n'),
    },
    ciphertext: await reqB64(w.ct, 'ciphertext'),
  };
}

async function decodeInitialHeaderChecked(x: unknown): Promise<InitialMessageHeader> {
  if (!x || typeof x !== 'object') throw new EnvelopeError('X3DH-Header fehlt');
  const o = x as Record<string, unknown>;
  return {
    masterPub: reqBytes(await reqB64(o.mp, 'masterPub'), KEY_LEN, 'masterPub Länge'),
    epoch: reqUint(o.ep, 'epoch'),
    deviceCert: reqBytes(await reqB64(o.dc, 'deviceCert'), SIG_LEN, 'deviceCert Länge'),
    identitySignPub: reqBytes(await reqB64(o.isp, 'identitySignPub'), KEY_LEN, 'identitySignPub Länge'),
    identityDhPub: reqBytes(await reqB64(o.idp, 'identityDhPub'), KEY_LEN, 'identityDhPub Länge'),
    ephemeralPub: reqBytes(await reqB64(o.ek, 'ephemeralPub'), KEY_LEN, 'ephemeralPub Länge'),
    signedPreKeyId: reqUint(o.spk, 'signedPreKeyId'),
    oneTimePreKeyId: o.opk === null || o.opk === undefined ? undefined : reqUint(o.opk, 'oneTimePreKeyId'),
    // Optional, unproven, length-checked only. It authorises nothing, so a bad
    // value can at worst mean "no merge hint" — reject the wrong length rather
    // than truncate.
    previousMaster:
      o.pm === null || o.pm === undefined ? undefined : reqBytes(await reqB64(o.pm, 'previousMaster'), KEY_LEN, 'previousMaster Länge'),
  };
}

// --- Prekey bundle token: compact binary pack, base64url (short, URL-safe) ---
//
// Fixed layout (all keys are fixed length):
//   version(1) | masterPub(32) | epoch(4) | deviceCert(64)
//     | idSignPub(32) | idDhPub(32) | spkId(4) | spkPub(32) | spkSig(64)
//     | hasOpk(1) | [opkId(4) | opkPub(32)]

const BUNDLE_VERSION = 2;

export async function encodeBundle(bundle: PreKeyBundle): Promise<string> {
  const s = await getSodium();
  const hasOpk = bundle.oneTimePreKey ? 1 : 0;
  const size = 1 + 32 + 4 + 64 + 32 + 32 + 4 + 32 + 64 + 1 + (hasOpk ? 36 : 0);
  const buf = new Uint8Array(size);
  const view = new DataView(buf.buffer);
  let o = 0;
  buf[o++] = BUNDLE_VERSION;
  buf.set(bundle.masterPub, o);
  o += 32;
  view.setUint32(o, bundle.epoch, false);
  o += 4;
  buf.set(bundle.deviceCert, o);
  o += 64;
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
  if (buf[o++] !== BUNDLE_VERSION) throw new Error('Unbekanntes Bundle-Format (neue Version nötig).');
  const take = (n: number): Bytes => {
    const r = buf.slice(o, o + n);
    o += n;
    return r;
  };
  const masterPub = take(32);
  const epoch = view.getUint32(o, false);
  o += 4;
  const deviceCert = take(64);
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
    masterPub,
    epoch,
    deviceCert,
    identitySignPub,
    identityDhPub,
    signedPreKey: { id: spkId, pub: spkPub, signature: spkSig },
    oneTimePreKey,
  };
}
