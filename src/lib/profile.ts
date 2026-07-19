/** My own profile (display name + avatar), sealed with the DEK in the vault. */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';

export interface MyProfile {
  name?: string;
  avatarB64?: string; // JPEG, base64
}

const AAD = utf8.encode('scytale:profile:v1');

export async function loadProfile(dek: CryptoKey): Promise<MyProfile> {
  const rec = await loadRecord('profile');
  if (!rec) return {};
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, AAD))) as MyProfile;
  } catch {
    return {};
  }
}

export async function saveProfile(dek: CryptoKey, p: MyProfile): Promise<void> {
  await saveRecord('profile', await seal(dek, utf8.encode(JSON.stringify(p)), AAD));
}
