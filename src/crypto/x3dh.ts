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
import { verifyDeviceCert, epochBytes } from './master';
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

/** Sent alongside the first message so the responder can complete the handshake.
 *  Carries the sender's master + epoch + device cert so the responder can pin
 *  the master and verify the device before using any DH material. */
export interface InitialMessageHeader {
  masterPub: Bytes;
  epoch: number;
  deviceCert: Bytes;
  identitySignPub: Bytes;
  identityDhPub: Bytes;
  ephemeralPub: Bytes;
  signedPreKeyId: number;
  oneTimePreKeyId?: number;
  /**
   * UNPROVEN origin hint: "I was previously master X". Not signed, not signable
   * (a signed one would be the rotation chain). Carried so the recipient can
   * offer a merge affordance when this contact re-appears under a new master —
   * it authorises NOTHING and is DELIBERATELY excluded from the AEAD's AD (see
   * respondX3DH). It may only ever prompt a question, never a state change.
   */
  previousMaster?: Bytes;
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
  // Verification order (nothing touches DH material until all checks pass):
  //   1. device cert against the master  2. signed-prekey signature
  // (master pinning itself is enforced one level up, in makeContact.)
  const certOk = await verifyDeviceCert(
    bundle.masterPub,
    bundle.epoch,
    bundle.identitySignPub,
    bundle.identityDhPub,
    bundle.deviceCert,
  );
  if (!certOk) {
    throw new X3DHError('Device-Zertifikat ungültig — Gerät nicht vom Master signiert (möglicher MITM).');
  }
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
  // AD binds BOTH masters + device DH keys + epochs (initiator A first) so the
  // first AEAD authenticates the master context, not just the device identities.
  const associatedData = concatBytes(
    me.master.publicKey,
    me.dh.publicKey,
    bundle.masterPub,
    bundle.identityDhPub,
    epochBytes(me.epoch),
    epochBytes(bundle.epoch),
  );

  const header: InitialMessageHeader = {
    masterPub: me.master.publicKey,
    epoch: me.epoch,
    deviceCert: me.deviceCert,
    identitySignPub: me.sign.publicKey,
    identityDhPub: me.dh.publicKey,
    ephemeralPub: ekPub,
    signedPreKeyId: bundle.signedPreKey.id,
    oneTimePreKeyId: bundle.oneTimePreKey?.id,
    // Unproven origin hint — see InitialMessageHeader.previousMaster. Outside the
    // AD above ON PURPOSE: it must not authenticate anything, only prompt a merge.
    previousMaster: me.previousMasterPub,
  };

  return { header, session: { sharedSecret, associatedData } };
}

export async function respondX3DH(
  me: IdentityKeys,
  signedPreKeyPriv: Bytes,
  oneTimePreKeyPriv: Bytes | undefined,
  header: InitialMessageHeader,
): Promise<X3DHSession> {
  // Verify the sender's device cert against their master BEFORE any DH.
  const certOk = await verifyDeviceCert(
    header.masterPub,
    header.epoch,
    header.identitySignPub,
    header.identityDhPub,
    header.deviceCert,
  );
  if (!certOk) {
    throw new X3DHError('Device-Zertifikat des Absenders ungültig — nicht vom Master signiert (möglicher MITM).');
  }

  const dhs: Bytes[] = [
    await dhAgree(signedPreKeyPriv, header.identityDhPub), // DH1
    await dhAgree(me.dh.privateKey, header.ephemeralPub), // DH2
    await dhAgree(signedPreKeyPriv, header.ephemeralPub), // DH3
  ];
  if (oneTimePreKeyPriv) {
    dhs.push(await dhAgree(oneTimePreKeyPriv, header.ephemeralPub)); // DH4
  }

  const sharedSecret = await deriveSK(dhs);
  // Same AD as the initiator computed (initiator/A first, responder/B second).
  const associatedData = concatBytes(
    header.masterPub,
    header.identityDhPub,
    me.master.publicKey,
    me.dh.publicKey,
    epochBytes(header.epoch),
    epochBytes(me.epoch),
  );

  return { sharedSecret, associatedData };
}
