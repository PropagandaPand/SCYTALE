/**
 * Device key — a non-extractable AES-256-GCM CryptoKey generated once per
 * device/browser-profile and stored in IndexedDB. Its raw bytes cannot be
 * exported through WebCrypto. Hostile same-origin code can nevertheless USE
 * the key as a decrypt oracle, so this binds passive/copied vault data to the
 * browser profile but is not an XSS sandbox (see vaultService).
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
