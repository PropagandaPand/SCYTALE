/**
 * Prekeys — the material a device publishes so others can start a conversation
 * with it while it is offline.
 *
 *   - Signed prekey (SPK): a medium-term X25519 key, signed by the device's
 *     Ed25519 identity key. Rotated periodically.
 *   - One-time prekeys (OPK): a batch of single-use X25519 keys. Each is
 *     consumed by exactly one incoming handshake, then destroyed — this is what
 *     gives X3DH its forward secrecy for the very first message.
 *
 * Only the PUBLIC halves ever go into a bundle for the server. The private
 * halves live in the encrypted vault.
 */
import { getSodium } from './sodium';
import { sign } from './identity';
import type { IdentityKeys, KeyPair } from './identity';
import type { Bytes } from './types';

const b = (x: Uint8Array): Bytes => new Uint8Array(x);

export interface SignedPreKey {
  id: number;
  keyPair: KeyPair;
  signature: Bytes; // Ed25519 signature over keyPair.publicKey
  createdAt: number;
}

export interface OneTimePreKey {
  id: number;
  keyPair: KeyPair;
}

/** Public, server-published bundle. Contains no private keys. */
export interface PreKeyBundle {
  identitySignPub: Bytes; // Ed25519
  identityDhPub: Bytes; // X25519
  signedPreKey: { id: number; pub: Bytes; signature: Bytes };
  oneTimePreKey?: { id: number; pub: Bytes };
}

async function newX25519(): Promise<KeyPair> {
  const s = await getSodium();
  const kp = s.crypto_box_keypair();
  return { publicKey: b(kp.publicKey), privateKey: b(kp.privateKey) };
}

export async function generateSignedPreKey(identity: IdentityKeys, id: number): Promise<SignedPreKey> {
  const keyPair = await newX25519();
  const signature = await sign(keyPair.publicKey, identity.sign.privateKey);
  return { id, keyPair, signature, createdAt: Date.now() };
}

export async function generateOneTimePreKeys(startId: number, count: number): Promise<OneTimePreKey[]> {
  const out: OneTimePreKey[] = [];
  for (let i = 0; i < count; i++) out.push({ id: startId + i, keyPair: await newX25519() });
  return out;
}

export function buildBundle(
  identity: IdentityKeys,
  spk: SignedPreKey,
  opk?: OneTimePreKey,
): PreKeyBundle {
  return {
    identitySignPub: identity.sign.publicKey,
    identityDhPub: identity.dh.publicKey,
    signedPreKey: { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature },
    oneTimePreKey: opk ? { id: opk.id, pub: opk.keyPair.publicKey } : undefined,
  };
}
