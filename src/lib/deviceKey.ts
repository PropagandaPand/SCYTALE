/**
 * Device key — a non-extractable AES-256-GCM CryptoKey generated once per
 * device/browser-profile and stored in IndexedDB. Its raw bytes can never be
 * read by JavaScript, so it can't be exfiltrated. We use it to bind the vault
 * to this device (see vaultService).
 */
import { loadDeviceKey, saveDeviceKey } from './db';

export async function getOrCreateDeviceKey(createIfMissing = true): Promise<CryptoKey | null> {
  const existing = await loadDeviceKey().catch(() => null);
  if (existing || !createIfMissing) return existing ?? null;

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  await saveDeviceKey(key);
  return key;
}
