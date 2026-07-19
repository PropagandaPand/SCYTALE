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

/** HMAC-SHA256 — the symmetric-key ratchet's chain-key KDF is built on this. */
export async function hmacSha256(key: Bytes, data: Bytes): Promise<Bytes> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
