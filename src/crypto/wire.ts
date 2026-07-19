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

// --- Prekey bundle token (single base64 string, for copy-paste exchange) ---

interface BundleWire {
  isp: string;
  idp: string;
  spk: { id: number; pub: string; sig: string };
  opk: { id: number; pub: string } | null;
}

export async function encodeBundle(bundle: PreKeyBundle): Promise<string> {
  const wire: BundleWire = {
    isp: await b64encode(bundle.identitySignPub),
    idp: await b64encode(bundle.identityDhPub),
    spk: {
      id: bundle.signedPreKey.id,
      pub: await b64encode(bundle.signedPreKey.pub),
      sig: await b64encode(bundle.signedPreKey.signature),
    },
    opk: bundle.oneTimePreKey
      ? { id: bundle.oneTimePreKey.id, pub: await b64encode(bundle.oneTimePreKey.pub) }
      : null,
  };
  return b64encode(utf8.encode(JSON.stringify(wire)));
}

export async function decodeBundle(token: string): Promise<PreKeyBundle> {
  const wire = JSON.parse(utf8.decode(await b64decode(token.trim()))) as BundleWire;
  return {
    identitySignPub: await b64decode(wire.isp),
    identityDhPub: await b64decode(wire.idp),
    signedPreKey: {
      id: wire.spk.id,
      pub: await b64decode(wire.spk.pub),
      signature: await b64decode(wire.spk.sig),
    },
    oneTimePreKey: wire.opk ? { id: wire.opk.id, pub: await b64decode(wire.opk.pub) } : undefined,
  };
}
