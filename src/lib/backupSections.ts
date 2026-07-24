/**
 * AES-GCM section crypto for the encrypted backup container, kept in its own
 * dependency-free module (WebCrypto only, no IndexedDB) so the AAD binding is
 * unit-testable in isolation.
 *
 * Each section is bound to its ROLE via GCM additionalData (audit N-3): the
 * metadata section and every attachment section carry a DISTINCT aad, so a
 * section's auth tag authenticates not just its bytes but where it belongs.
 * Without this an attacker holding the export key could splice one attachment's
 * ciphertext in under a different id, or present an attachment section as the
 * metadata section — the per-section tag alone would not notice. Cross-file
 * splicing is already impossible (each file derives its own key from its own
 * random salt), so binding the in-file role is the missing piece.
 *
 * Backward compatibility: v2 backups were written WITHOUT aad, so the importer
 * passes `undefined` for them and this falls back to plain GCM.
 */
import { utf8, type Bytes } from '../crypto';

export const backupMetaAad = (): Bytes => utf8.encode('scytale:backup:v3:meta');
export const backupAttAad = (id: string): Bytes => utf8.encode('scytale:backup:v3:att:' + id);

export async function encSection(key: CryptoKey, plain: Bytes, aad?: Bytes): Promise<{ iv: Bytes; ct: Bytes }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const alg: AesGcmParams = aad ? { name: 'AES-GCM', iv, additionalData: aad } : { name: 'AES-GCM', iv };
  const ct = new Uint8Array(await crypto.subtle.encrypt(alg, key, plain));
  return { iv, ct };
}

export async function decSection(key: CryptoKey, iv: Bytes, ct: Bytes, aad?: Bytes): Promise<Bytes> {
  const alg: AesGcmParams = aad ? { name: 'AES-GCM', iv, additionalData: aad } : { name: 'AES-GCM', iv };
  return new Uint8Array(await crypto.subtle.decrypt(alg, key, ct));
}
