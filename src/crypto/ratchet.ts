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
import { concatBytes } from './codec';
import type { Bytes } from './types';
import type { KeyPair } from './identity';

const MAX_SKIP = 1000;
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

export async function ratchetDecrypt(state: RatchetState, msg: RatchetMessage): Promise<Bytes> {
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
