/**
 * Master identity & cross-signing (foundation for multi-device).
 *
 * A user is a long-term **master** Ed25519 key plus a monotonically increasing
 * **epoch**. The master signs each device's keys (a cross-signing certificate),
 * so contacts pin the *master* once (via SAS / safety number) and then trust any
 * device the master has signed. Three rules make this sound rather than
 * decorative:
 *
 *   1. Epoch is MONOTONIC — a rotation with epoch ≤ current is rejected even
 *      with a valid signature (no downgrade/rollback to a compromised master).
 *   2. Rotation binds BOTH keys — the statement is (oldMaster, newMaster, epoch)
 *      signed by old AND new. Possessing only the old key can't mint a
 *      competing rotation to an attacker's master at the same epoch.
 *   3. Device certs bind the EPOCH — the signature covers (epoch, deviceKeys),
 *      so a device removed at epoch N cannot keep running under epoch N+1; its
 *      old cert no longer verifies once the peer knows the newer epoch.
 */
import { getSodium } from './sodium';
import { sign, verify } from './identity';
import type { KeyPair } from './identity';
import { concatBytes, utf8, bytesEqual} from './codec';
import type { Bytes } from './types';

const b = (x: Uint8Array): Bytes => new Uint8Array(x);

export interface MasterIdentity {
  keyPair: KeyPair; // Ed25519 master signing key
  epoch: number; // monotonic; starts at 1
}

/** 8-byte big-endian epoch, so the signed context is unambiguous. Also used to
 *  bind the epoch into the X3DH associated data. */
export function epochBytes(epoch: number): Bytes {
  const out = new Uint8Array(8);
  let v = BigInt(Math.trunc(epoch));
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}


export async function generateMaster(): Promise<MasterIdentity> {
  const s = await getSodium();
  const kp = s.crypto_sign_keypair();
  return { keyPair: { publicKey: b(kp.publicKey), privateKey: b(kp.privateKey) }, epoch: 1 };
}

// ── Device cross-signing certificate: binds (epoch, deviceKeys) to the master ──
const DEVICE_CTX = utf8.encode('SCYTALE-DEVICE-CERT-v1');
function deviceCertMsg(epoch: number, deviceSignPub: Bytes, deviceDhPub: Bytes): Bytes {
  return concatBytes(DEVICE_CTX, epochBytes(epoch), deviceSignPub, deviceDhPub);
}
export async function signDeviceCert(
  masterPriv: Bytes,
  epoch: number,
  deviceSignPub: Bytes,
  deviceDhPub: Bytes,
): Promise<Bytes> {
  return sign(deviceCertMsg(epoch, deviceSignPub, deviceDhPub), masterPriv);
}
export async function verifyDeviceCert(
  masterPub: Bytes,
  epoch: number,
  deviceSignPub: Bytes,
  deviceDhPub: Bytes,
  cert: Bytes,
): Promise<boolean> {
  return verify(deviceCertMsg(epoch, deviceSignPub, deviceDhPub), cert, masterPub);
}

// ── Master rotation: (oldMaster, newMaster, epoch) signed by BOTH ──────────────
const ROTATE_CTX = utf8.encode('SCYTALE-MASTER-ROTATE-v1');
function rotateMsg(oldMasterPub: Bytes, newMasterPub: Bytes, epoch: number): Bytes {
  return concatBytes(ROTATE_CTX, epochBytes(epoch), oldMasterPub, newMasterPub);
}

export interface RotationStatement {
  oldMasterPub: Bytes;
  newMasterPub: Bytes;
  epoch: number; // the NEW epoch (must strictly exceed the current one)
  sigOld: Bytes;
  sigNew: Bytes;
}

export async function makeRotation(
  oldMaster: KeyPair,
  newMaster: KeyPair,
  newEpoch: number,
): Promise<RotationStatement> {
  const msg = rotateMsg(oldMaster.publicKey, newMaster.publicKey, newEpoch);
  return {
    oldMasterPub: oldMaster.publicKey,
    newMasterPub: newMaster.publicKey,
    epoch: newEpoch,
    sigOld: await sign(msg, oldMaster.privateKey),
    sigNew: await sign(msg, newMaster.privateKey),
  };
}

/** Accept a rotation iff: strictly higher epoch (no rollback), it rotates the
 *  CURRENTLY pinned master, and BOTH the old and new master signed it. */
export async function verifyRotation(
  currentMasterPub: Bytes,
  currentEpoch: number,
  r: RotationStatement,
): Promise<boolean> {
  if (!(r.epoch > currentEpoch)) return false; // monotonic: no downgrade/rollback
  if (!bytesEqual(r.oldMasterPub, currentMasterPub)) return false; // must rotate the pinned master
  const msg = rotateMsg(r.oldMasterPub, r.newMasterPub, r.epoch);
  return (await verify(msg, r.sigOld, r.oldMasterPub)) && (await verify(msg, r.sigNew, r.newMasterPub));
}
