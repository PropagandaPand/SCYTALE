/**
 * Identity service — ties the long-term identity keys to the encrypted vault.
 * The keys are sealed with the DEK before they ever touch IndexedDB.
 */
import {
  generateIdentity,
  serializeIdentity,
  deserializeIdentity,
  identityFingerprint,
  verifyLinkGrant,
  seal,
  open,
  utf8,
  type IdentityKeys,
  type LinkGrant,
} from '../crypto';
import { loadRecord, saveRecord } from './db';
import { saveOwnDeviceList } from './devices';

const KEY = 'identity';
// AAD binds this ciphertext to the identity slot + schema version.
const AAD = utf8.encode('scytale:identity:v1');

/** Load the device identity, or generate + persist one on first run. A record
 *  in an older (pre-master) format is not upgradable in place — regenerate. */
export async function loadOrCreateIdentity(dek: CryptoKey): Promise<IdentityKeys> {
  const rec = await loadRecord(KEY);
  if (rec) {
    try {
      return await deserializeIdentity(await open(dek, rec, AAD));
    } catch {
      /* old format → fall through and regenerate */
    }
  }
  const id = await generateIdentity();
  await saveRecord(KEY, await seal(dek, await serializeIdentity(id), AAD));
  return id;
}

/** Own fingerprint over the MASTER (stable across this user's devices). */
export function fingerprintOf(id: IdentityKeys): Promise<string> {
  return identityFingerprint(id.master.publicKey, id.master.publicKey);
}

/** Persist an identity (used by backup restore to install the recovered one). */
export async function saveIdentity(dek: CryptoKey, id: IdentityKeys): Promise<void> {
  await saveRecord(KEY, await seal(dek, await serializeIdentity(id), AAD));
}

/**
 * Adopt a linking grant: this device keeps its OWN device keypair (so its inbox
 * and running sessions are unaffected) and swaps only its identity anchor — the
 * master public key, epoch and cross-signing cert — plus the granted device list.
 *
 * TRANSACTIONAL by construction: the grant is fully verified against our device
 * keys BEFORE anything is written, and the new identity is persisted BEFORE the
 * old master key is dropped from the returned object. A failed or mismatching
 * grant leaves the previous identity untouched — never a device with neither.
 */
export async function installLinkedIdentity(
  dek: CryptoKey,
  current: IdentityKeys,
  grant: LinkGrant,
): Promise<IdentityKeys> {
  if (!(await verifyLinkGrant(grant, current.sign.publicKey, current.dh.publicKey))) {
    throw new Error('Kopplungs-Nachweis ungültig — Identität unverändert.');
  }
  const linked: IdentityKeys = {
    ...current,
    // master PUBLIC only: the private key stays on the primary device.
    master: { publicKey: grant.masterPub, privateKey: new Uint8Array(0) },
    epoch: grant.epoch,
    deviceCert: grant.deviceCert,
  };
  await saveIdentity(dek, linked); // write new identity first …
  await saveOwnDeviceList(dek, grant.deviceList); // … then its device list
  return linked;
}
