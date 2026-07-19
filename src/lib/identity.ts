/**
 * Identity service — ties the long-term identity keys to the encrypted vault.
 * The keys are sealed with the DEK before they ever touch IndexedDB.
 */
import {
  generateIdentity,
  serializeIdentity,
  deserializeIdentity,
  identityFingerprint,
  seal,
  open,
  utf8,
  type IdentityKeys,
} from '../crypto';
import { loadRecord, saveRecord } from './db';

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
