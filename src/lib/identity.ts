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

/** Load the device identity, or generate + persist one on first run. */
export async function loadOrCreateIdentity(dek: CryptoKey): Promise<IdentityKeys> {
  const rec = await loadRecord(KEY);
  if (rec) return deserializeIdentity(await open(dek, rec, AAD));

  const id = await generateIdentity();
  await saveRecord(KEY, await seal(dek, await serializeIdentity(id), AAD));
  return id;
}

export function fingerprintOf(id: IdentityKeys): Promise<string> {
  return identityFingerprint(id.sign.publicKey, id.dh.publicKey);
}
