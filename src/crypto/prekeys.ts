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

/** Public, shared bundle. Contains no private keys. Carries the cross-signing
 *  master + epoch + device cert so a peer can pin the master and verify that
 *  this device belongs to it BEFORE using any of its DH material. */
export interface PreKeyBundle {
  masterPub: Bytes; // Ed25519 cross-signing master
  epoch: number;
  deviceCert: Bytes; // master sig over (epoch, identitySignPub, identityDhPub)
  identitySignPub: Bytes; // Ed25519 device
  identityDhPub: Bytes; // X25519 device
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
    masterPub: identity.master.publicKey,
    epoch: identity.epoch,
    deviceCert: identity.deviceCert,
    identitySignPub: identity.sign.publicKey,
    identityDhPub: identity.dh.publicKey,
    signedPreKey: { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature },
    oneTimePreKey: opk ? { id: opk.id, pub: opk.keyPair.publicKey } : undefined,
  };
}
