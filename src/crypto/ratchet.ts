/**
 * Double Ratchet (Signal spec).
 *
 * Turns the single X3DH shared secret into an ever-advancing key schedule with
 * two guarantees:
 *   - Forward secrecy: every message gets a fresh message key derived by the
 *     symmetric-key ratchet (KDF_CK), then thrown away — a leaked current key
 *     can't decrypt past messages.
 *   - Post-compromise security: every round-trip mixes in a fresh DH output
 *     (the DH ratchet, KDF_RK) — the session heals itself after a compromise.
 *
 * Out-of-order and dropped messages are handled by stashing skipped message
 * keys until their message arrives (bounded by MAX_SKIP).
 *
 *   KDF_RK(RK, dh)  = HKDF-SHA256(salt=RK, ikm=dh) -> RK' (32) || CK (32)
 *   KDF_CK(CK)      = HMAC(CK,0x01)=MK ; HMAC(CK,0x02)=CK'
 *   message key     = HKDF(MK) -> AES-256-GCM key (32) || iv (12)
 */
import { getSodium } from './sodium';
import { hkdfSha256, hmacSha256 } from './kdf';
import { concatBytes, b64encode, b64decode, utf8 } from './codec';
import type { Bytes } from './types';
import type { KeyPair } from './identity';

const MAX_SKIP = 1000; // max keys derived in a single jump (one chain)
const MAX_SKIP_SESSION = 2000; // total skipped keys cached across the session
const b = (x: Uint8Array): Bytes => new Uint8Array(x);

const te = new TextEncoder();
const RK_INFO = te.encode('SCYTALE_ratchet_rk');
const MSG_INFO = te.encode('SCYTALE_ratchet_msg');
const ZERO32 = new Uint8Array(32);

async function generateDH(): Promise<KeyPair> {
  const s = await getSodium();
  const kp = s.crypto_box_keypair();
  return { publicKey: b(kp.publicKey), privateKey: b(kp.privateKey) };
}

async function dh(priv: Bytes, pub: Bytes): Promise<Bytes> {
  const s = await getSodium();
  return b(s.crypto_scalarmult(priv, pub));
}

async function kdfRk(rk: Bytes, dhOut: Bytes): Promise<{ rk: Bytes; ck: Bytes }> {
  const out = await hkdfSha256(dhOut, rk, RK_INFO, 64); // salt = rk, ikm = dhOut
  return { rk: out.slice(0, 32), ck: out.slice(32, 64) };
}

async function kdfCk(ck: Bytes): Promise<{ ck: Bytes; mk: Bytes }> {
  const mk = await hmacSha256(ck, new Uint8Array([0x01]));
  const nextCk = await hmacSha256(ck, new Uint8Array([0x02]));
  return { ck: nextCk, mk };
}

async function messageKeyMaterial(mk: Bytes): Promise<{ key: CryptoKey; iv: Bytes }> {
  const out = await hkdfSha256(mk, ZERO32, MSG_INFO, 44);
  const key = await crypto.subtle.importKey('raw', out.slice(0, 32), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return { key, iv: out.slice(32, 44) };
}

async function encryptMsg(mk: Bytes, plaintext: Bytes, ad: Bytes): Promise<Bytes> {
  const { key, iv } = await messageKeyMaterial(mk);
  return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: ad }, key, plaintext));
}

async function decryptMsg(mk: Bytes, ciphertext: Bytes, ad: Bytes): Promise<Bytes> {
  const { key, iv } = await messageKeyMaterial(mk);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: ad }, key, ciphertext));
}

export interface RatchetHeader {
  dh: Bytes; // sender's current ratchet public key
  pn: number; // length of the previous sending chain
  n: number; // message number in the current sending chain
}

export interface RatchetMessage {
  header: RatchetHeader;
  ciphertext: Bytes; // iv is re-derived from the message key, so it isn't sent
}

export interface RatchetState {
  DHs: KeyPair; // our current ratchet keypair
  DHr: Bytes | null; // their current ratchet public key
  RK: Bytes; // root key
  CKs: Bytes | null; // sending chain key
  CKr: Bytes | null; // receiving chain key
  Ns: number;
  Nr: number;
  PN: number;
  skipped: Map<string, Bytes>; // (ratchetPubHex:n) -> message key
  AD: Bytes; // X3DH associated data, bound into every message's AEAD
}

// Canonical header encoding for AEAD associated data: dh(32) || pn(4 BE) || n(4 BE)
function serializeHeader(h: RatchetHeader): Bytes {
  const out = new Uint8Array(h.dh.length + 8);
  out.set(h.dh, 0);
  const view = new DataView(out.buffer);
  view.setUint32(h.dh.length, h.pn, false);
  view.setUint32(h.dh.length + 4, h.n, false);
  return out;
}

function toHex(bytes: Uint8Array): string {
  let s = '';
  for (const x of bytes) s += x.toString(16).padStart(2, '0');
  return s;
}

function skipKey(dhPub: Bytes, n: number): string {
  return `${toHex(dhPub)}:${n}`;
}

function bytesEqual(a: Uint8Array, b2: Uint8Array): boolean {
  if (a.length !== b2.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b2[i];
  return diff === 0;
}

/** Initiator (Alice): already knows the responder's initial ratchet key (their signed prekey). */
export async function initRatchetInitiator(
  sharedSecret: Bytes,
  theirRatchetPub: Bytes,
  associatedData: Bytes,
): Promise<RatchetState> {
  const DHs = await generateDH();
  const { rk, ck } = await kdfRk(sharedSecret, await dh(DHs.privateKey, theirRatchetPub));
  return {
    DHs,
    DHr: theirRatchetPub,
    RK: rk,
    CKs: ck,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    skipped: new Map(),
    AD: associatedData,
  };
}

/** Responder (Bob): his initial ratchet keypair IS the signed prekey Alice used. */
export async function initRatchetResponder(
  sharedSecret: Bytes,
  ratchetKeyPair: KeyPair,
  associatedData: Bytes,
): Promise<RatchetState> {
  return {
    DHs: ratchetKeyPair,
    DHr: null,
    RK: sharedSecret,
    CKs: null,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    skipped: new Map(),
    AD: associatedData,
  };
}

export async function ratchetEncrypt(state: RatchetState, plaintext: Bytes): Promise<RatchetMessage> {
  if (!state.CKs) throw new Error('Sende-Chain noch nicht bereit (erst Nachricht empfangen).');
  const { ck, mk } = await kdfCk(state.CKs);
  state.CKs = ck;
  const header: RatchetHeader = { dh: state.DHs.publicKey, pn: state.PN, n: state.Ns };
  state.Ns += 1;
  const ad = concatBytes(state.AD, serializeHeader(header));
  const ciphertext = await encryptMsg(mk, plaintext, ad);
  return { header, ciphertext };
}

/**
 * Shallow clone of the ratchet state.
 *
 * Shallow is correct and deliberate: `skipped` values are never mutated in
 * place (only set/delete), so a fresh Map with the same message-key references
 * is enough, and `AD` is constant for the session. Byte arrays that DO get
 * replaced (RK, CK*, DH*) are copied so a discarded draft cannot alias them.
 */
function cloneState(s: RatchetState): RatchetState {
  const cp = (x: Bytes): Bytes => new Uint8Array(x);
  return {
    DHs: { publicKey: cp(s.DHs.publicKey), privateKey: cp(s.DHs.privateKey) },
    DHr: s.DHr ? cp(s.DHr) : null,
    RK: cp(s.RK),
    CKs: s.CKs ? cp(s.CKs) : null,
    CKr: s.CKr ? cp(s.CKr) : null,
    Ns: s.Ns,
    Nr: s.Nr,
    PN: s.PN,
    skipped: new Map(s.skipped),
    AD: s.AD,
  };
}

/**
 * Decrypt an inbound ratchet message.
 *
 * ⚠️ COMMIT DISCIPLINE — the state advances ONLY on a message that
 * authenticates. The work happens on a draft copy and is committed as the last
 * action; anything that throws leaves `state` untouched.
 *
 * Why this is not optional: delivery into an inbox is deliberately
 * unauthenticated (that is what lets a stranger holding our code reach us), and
 * the inbox id is derivable from public material. Without the draft, a random
 * 32-byte X25519 public key as `header.dh` plus 48 bytes of garbage is enough to
 * turn the DH ratchet — no key material required. `dhRatchet` would overwrite
 * DHr/RK/CKr/CKs and reset the counters, and only afterwards would the AEAD tag
 * check fail. The session would be permanently dead in both directions, the
 * damage would be written to disk by the next `encryptAndPersist`, and the
 * sender would still see full delivery ticks because the relay accepted
 * everything. A remote, unauthenticated, persistent session kill.
 *
 * It also closes the skipped-key case: a forgery replaying the header of a
 * delayed real message would otherwise consume (delete) that message's key for
 * good, so the genuine message could never be read.
 */
export async function ratchetDecrypt(state: RatchetState, msg: RatchetMessage): Promise<Bytes> {
  const draft = cloneState(state);
  const plaintext = await decryptInto(draft, msg); // throws → `state` untouched
  Object.assign(state, draft); // commit, last action
  return plaintext;
}

/**
 * The unguarded core. NOT for application code — it mutates as it goes and
 * leaves the state wrecked when a message fails to authenticate.
 *
 * Exported solely so the negative control in tests/ratchet-commit.test.mjs can
 * run the pre-fix behaviour and prove the guard is what makes the suite green.
 * `tests/no-unsafe-import.test.mjs` fails the build if src/ ever imports it.
 */
export async function __decryptIntoUnsafeForTests(
  state: RatchetState,
  msg: RatchetMessage,
): Promise<Bytes> {
  return decryptInto(state, msg);
}

async function decryptInto(state: RatchetState, msg: RatchetMessage): Promise<Bytes> {
  const fromSkipped = await trySkipped(state, msg);
  if (fromSkipped) return fromSkipped;

  if (!state.DHr || !bytesEqual(msg.header.dh, state.DHr)) {
    await skipMessageKeys(state, msg.header.pn);
    await dhRatchet(state, msg.header);
  }
  await skipMessageKeys(state, msg.header.n);

  if (!state.CKr) throw new Error('Empfangs-Chain nicht initialisiert.');
  const { ck, mk } = await kdfCk(state.CKr);
  state.CKr = ck;
  state.Nr += 1;
  const ad = concatBytes(state.AD, serializeHeader(msg.header));
  return decryptMsg(mk, msg.ciphertext, ad);
}

async function trySkipped(state: RatchetState, msg: RatchetMessage): Promise<Bytes | null> {
  const key = skipKey(msg.header.dh, msg.header.n);
  const mk = state.skipped.get(key);
  if (!mk) return null;
  state.skipped.delete(key);
  const ad = concatBytes(state.AD, serializeHeader(msg.header));
  return decryptMsg(mk, msg.ciphertext, ad);
}

async function skipMessageKeys(state: RatchetState, until: number): Promise<void> {
  if (state.Nr + MAX_SKIP < until) {
    throw new Error('Zu viele übersprungene Nachrichten — Verdacht auf Manipulation.');
  }
  if (state.CKr) {
    while (state.Nr < until) {
      const { ck, mk } = await kdfCk(state.CKr);
      state.CKr = ck;
      state.skipped.set(skipKey(state.DHr!, state.Nr), mk);
      // Bound the TOTAL cache, not just a single jump: evict the oldest key
      // (Map keeps insertion order) so a stream of high-N messages can't grow
      // the vault without limit — a DoS Signal also caps per session.
      if (state.skipped.size > MAX_SKIP_SESSION) {
        const oldest = state.skipped.keys().next().value;
        if (oldest !== undefined) state.skipped.delete(oldest);
      }
      state.Nr += 1;
    }
  }
}

async function dhRatchet(state: RatchetState, header: RatchetHeader): Promise<void> {
  state.PN = state.Ns;
  state.Ns = 0;
  state.Nr = 0;
  state.DHr = header.dh;

  let step = await kdfRk(state.RK, await dh(state.DHs.privateKey, state.DHr));
  state.RK = step.rk;
  state.CKr = step.ck;

  state.DHs = await generateDH();
  step = await kdfRk(state.RK, await dh(state.DHs.privateKey, state.DHr));
  state.RK = step.rk;
  state.CKs = step.ck;
}

// --- Persistence: the full ratchet state must survive a lock/reload ---

export async function serializeState(s: RatchetState): Promise<Bytes> {
  const skipped: Record<string, string> = {};
  for (const [k, v] of s.skipped) skipped[k] = await b64encode(v);
  const o = {
    DHs: { pub: await b64encode(s.DHs.publicKey), priv: await b64encode(s.DHs.privateKey) },
    DHr: s.DHr ? await b64encode(s.DHr) : null,
    RK: await b64encode(s.RK),
    CKs: s.CKs ? await b64encode(s.CKs) : null,
    CKr: s.CKr ? await b64encode(s.CKr) : null,
    Ns: s.Ns,
    Nr: s.Nr,
    PN: s.PN,
    skipped,
    AD: await b64encode(s.AD),
  };
  return utf8.encode(JSON.stringify(o));
}

export async function deserializeState(bytes: Bytes): Promise<RatchetState> {
  const o = JSON.parse(utf8.decode(bytes));
  const skipped = new Map<string, Bytes>();
  for (const k of Object.keys(o.skipped)) skipped.set(k, await b64decode(o.skipped[k]));
  return {
    DHs: { publicKey: await b64decode(o.DHs.pub), privateKey: await b64decode(o.DHs.priv) },
    DHr: o.DHr ? await b64decode(o.DHr) : null,
    RK: await b64decode(o.RK),
    CKs: o.CKs ? await b64decode(o.CKs) : null,
    CKr: o.CKr ? await b64decode(o.CKr) : null,
    Ns: o.Ns,
    Nr: o.Nr,
    PN: o.PN,
    skipped,
    AD: await b64decode(o.AD),
  };
}
