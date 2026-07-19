/**
 * HKDF-SHA256 via WebCrypto — extract-then-expand, exactly what X3DH and the
 * Double Ratchet's root-key schedule need. Native, constant-time, no extra WASM.
 */
import type { Bytes } from './types';

export async function hkdfSha256(
  ikm: Bytes,
  salt: Bytes,
  info: Bytes,
  length = 32,
): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}
