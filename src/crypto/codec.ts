/**
 * Text and base64 codecs. base64 goes through libsodium so we share one
 * constant-time implementation across the app.
 */
import { getSodium } from './sodium';
import type { Bytes } from './types';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const utf8 = {
  encode: (s: string): Bytes => enc.encode(s),
  decode: (b: Bytes): string => dec.decode(b),
};

export async function b64encode(b: Bytes): Promise<string> {
  const s = await getSodium();
  return s.to_base64(b, s.base64_variants.ORIGINAL);
}

export async function b64decode(str: string): Promise<Bytes> {
  const s = await getSodium();
  return new Uint8Array(s.from_base64(str, s.base64_variants.ORIGINAL));
}

/** Concatenate byte arrays into a fresh ArrayBuffer-backed view. */
export function concatBytes(...parts: Uint8Array[]): Bytes {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
