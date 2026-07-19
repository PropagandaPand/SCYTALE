/**
 * X3DH (Extended Triple Diffie-Hellman) — Signal's asynchronous key agreement.
 *
 * The initiator (Alice) fetches the responder's (Bob's) prekey bundle and,
 * WITHOUT Bob being online, derives a shared secret from four DH computations:
 *
 *   DH1 = DH(IK_A, SPK_B)   binds Alice's identity to Bob's signed prekey
 *   DH2 = DH(EK_A, IK_B)    binds Alice's ephemeral to Bob's identity
 *   DH3 = DH(EK_A, SPK_B)   binds ephemeral to signed prekey
 *   DH4 = DH(EK_A, OPK_B)   consumes a one-time prekey (forward secrecy)
 *
 *   SK = HKDF-SHA256( 0xFF*32 || DH1 || DH2 || DH3 || DH4 )
 *
 * DH is commutative, so Bob recomputes the identical SK from his private keys.
 * SK becomes the Double Ratchet root key in Etappe 4.
 */
import { getSodium } from './sodium';
import { dhAgree, verify } from './identity';
import type { IdentityKeys } from './identity';
import type { PreKeyBundle } from './prekeys';
import { hkdfSha256 } from './kdf';
import { concatBytes, utf8 } from './codec';
import type { Bytes } from './types';

const b = (x: Uint8Array): Bytes => new Uint8Array(x);

// Per the X3DH spec: F is 32 bytes of 0xFF for Curve25519; salt is zero-filled.
const F = new Uint8Array(32).fill(0xff);
const SALT = new Uint8Array(32);
const INFO = utf8.encode('SCYTALE_X3DH_v1');

async function deriveSK(dhs: Bytes[]): Promise<Bytes> {
  return hkdfSha256(concatBytes(F, ...dhs), SALT, INFO, 32);
}

/** Sent alongside the first message so the responder can complete the handshake. */
export interface InitialMessageHeader {
  identitySignPub: Bytes;
  identityDhPub: Bytes;
  ephemeralPub: Bytes;
  signedPreKeyId: number;
  oneTimePreKeyId?: number;
}

export interface X3DHSession {
  sharedSecret: Bytes;
  associatedData: Bytes; // IK_A || IK_B — bound into the first AEAD, authenticates identities
}

export class X3DHError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'X3DHError';
  }
}

export async function initiateX3DH(
  me: IdentityKeys,
  bundle: PreKeyBundle,
): Promise<{ header: InitialMessageHeader; session: X3DHSession }> {
  // Authenticate the signed prekey against the claimed identity. If the server
  // tried to inject its own key, this fails.
  const validSig = await verify(bundle.signedPreKey.pub, bundle.signedPreKey.signature, bundle.identitySignPub);
  if (!validSig) {
    throw new X3DHError('Signed-Prekey-Signatur ungültig — Handshake abgebrochen (möglicher MITM).');
  }

  const s = await getSodium();
  const ek = s.crypto_box_keypair();
  const ekPriv = b(ek.privateKey);
  const ekPub = b(ek.publicKey);

  const dhs: Bytes[] = [
    await dhAgree(me.dh.privateKey, bundle.signedPreKey.pub), // DH1
    await dhAgree(ekPriv, bundle.identityDhPub), // DH2
    await dhAgree(ekPriv, bundle.signedPreKey.pub), // DH3
  ];
  if (bundle.oneTimePreKey) {
    dhs.push(await dhAgree(ekPriv, bundle.oneTimePreKey.pub)); // DH4
  }

  const sharedSecret = await deriveSK(dhs);
  const associatedData = concatBytes(me.dh.publicKey, bundle.identityDhPub);

  const header: InitialMessageHeader = {
    identitySignPub: me.sign.publicKey,
    identityDhPub: me.dh.publicKey,
    ephemeralPub: ekPub,
    signedPreKeyId: bundle.signedPreKey.id,
    oneTimePreKeyId: bundle.oneTimePreKey?.id,
  };

  return { header, session: { sharedSecret, associatedData } };
}

export async function respondX3DH(
  me: IdentityKeys,
  signedPreKeyPriv: Bytes,
  oneTimePreKeyPriv: Bytes | undefined,
  header: InitialMessageHeader,
): Promise<X3DHSession> {
  const dhs: Bytes[] = [
    await dhAgree(signedPreKeyPriv, header.identityDhPub), // DH1
    await dhAgree(me.dh.privateKey, header.ephemeralPub), // DH2
    await dhAgree(signedPreKeyPriv, header.ephemeralPub), // DH3
  ];
  if (oneTimePreKeyPriv) {
    dhs.push(await dhAgree(oneTimePreKeyPriv, header.ephemeralPub)); // DH4
  }

  const sharedSecret = await deriveSK(dhs);
  const associatedData = concatBytes(header.identityDhPub, me.dh.publicKey);

  return { sharedSecret, associatedData };
}
