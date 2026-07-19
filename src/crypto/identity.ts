/**
 * Long-term device identity.
 *
 * Each device holds two long-term keypairs:
 *   - sign (Ed25519): signs the device's prekeys (Etappe 3) and anchors identity
 *   - dh   (X25519):  the Diffie-Hellman half of the X3DH handshake (Etappe 3)
 *
 * The private keys live ONLY inside the encrypted vault (sealed via the DEK).
 * The public keys are what a peer needs to start a conversation; their hash is
 * the human-verifiable safety number.
 */
import { getSodium } from './sodium';
import { b64encode, b64decode } from './codec';
import type { Bytes } from './types';

export interface KeyPair {
  publicKey: Bytes;
  privateKey: Bytes;
}

export interface IdentityKeys {
  sign: KeyPair; // Ed25519
  dh: KeyPair; // X25519
  createdAt: number;
}

// libsodium hands back plain Uint8Arrays; copy into ArrayBuffer-backed views.
const b = (x: Uint8Array): Bytes => new Uint8Array(x);

export async function generateIdentity(): Promise<IdentityKeys> {
  const s = await getSodium();
  const sign = s.crypto_sign_keypair();
  const dh = s.crypto_box_keypair();
  return {
    sign: { publicKey: b(sign.publicKey), privateKey: b(sign.privateKey) },
    dh: { publicKey: b(dh.publicKey), privateKey: b(dh.privateKey) },
    createdAt: Date.now(),
  };
}

/** Ed25519 detached signature. */
export async function sign(message: Bytes, privateKey: Bytes): Promise<Bytes> {
  const s = await getSodium();
  return b(s.crypto_sign_detached(message, privateKey));
}

export async function verify(message: Bytes, signature: Bytes, publicKey: Bytes): Promise<boolean> {
  const s = await getSodium();
  return s.crypto_sign_verify_detached(signature, message, publicKey);
}

/** X25519 Diffie-Hellman — the building block X3DH composes in Etappe 3. */
export async function dhAgree(privateKey: Bytes, publicKey: Bytes): Promise<Bytes> {
  const s = await getSodium();
  return b(s.crypto_scalarmult(privateKey, publicKey));
}

// --- Persistence (plaintext form is only ever handed to the vault's seal()) ---

interface IdentityWire {
  v: 1;
  createdAt: number;
  signPub: string;
  signPriv: string;
  dhPub: string;
  dhPriv: string;
}

export async function serializeIdentity(id: IdentityKeys): Promise<Bytes> {
  const wire: IdentityWire = {
    v: 1,
    createdAt: id.createdAt,
    signPub: await b64encode(id.sign.publicKey),
    signPriv: await b64encode(id.sign.privateKey),
    dhPub: await b64encode(id.dh.publicKey),
    dhPriv: await b64encode(id.dh.privateKey),
  };
  return utf8Encode(JSON.stringify(wire));
}

export async function deserializeIdentity(bytes: Bytes): Promise<IdentityKeys> {
  const wire = JSON.parse(utf8Decode(bytes)) as IdentityWire;
  return {
    createdAt: wire.createdAt,
    sign: { publicKey: await b64decode(wire.signPub), privateKey: await b64decode(wire.signPriv) },
    dh: { publicKey: await b64decode(wire.dhPub), privateKey: await b64decode(wire.dhPriv) },
  };
}

/**
 * Safety number: BLAKE2b-256 over (Ed25519 pub || X25519 pub), rendered as six
 * 5-digit groups. Two users read theirs aloud to detect a man-in-the-middle —
 * if the server ever swapped a key, the numbers diverge.
 */
export async function identityFingerprint(pubSign: Bytes, pubDh: Bytes): Promise<string> {
  const s = await getSodium();
  const material = new Uint8Array(pubSign.length + pubDh.length);
  material.set(pubSign, 0);
  material.set(pubDh, pubSign.length);
  const h = s.crypto_generichash(32, material, null);
  const groups: string[] = [];
  for (let i = 0; i + 5 <= h.length && groups.length < 6; i += 5) {
    let v = 0;
    for (let j = 0; j < 5; j++) v = v * 256 + h[i + j];
    groups.push((v % 100000).toString().padStart(5, '0'));
  }
  return groups.join(' ');
}

const _enc = new TextEncoder();
const _dec = new TextDecoder();
const utf8Encode = (s: string): Bytes => _enc.encode(s);
const utf8Decode = (b: Bytes): string => _dec.decode(b);
