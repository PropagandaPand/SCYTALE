/**
 * Client-side encryption for LARGE attachments stored in R2 (videos up to ~1 GB). The
 * whole point: R2 (and the Worker proxying it) only ever sees ciphertext. The file is
 * sealed under a fresh RANDOM per-file key `Kf`; that key travels end-to-end inside the
 * sealed message (never to the server). A recipient with the descriptor + Kf can fetch
 * the ciphertext and decrypt; nobody else can.
 *
 * Chunked format — the blob is a concatenation of independently-sealed chunks:
 *   [ iv(12) ][ AES-256-GCM ciphertext+tag ]   repeated, plaintext chunk = BLOB_CHUNK
 * Each chunk's AAD binds its index, so a holder of Kf cannot be fed re-ordered or
 * truncated chunks under the seal. The layout is fully derivable from (size, chunk):
 * chunk i's ciphertext length is 12 + plainLen(i) + 16 — so both the streaming uploader
 * and the streaming downloader can walk the stream with NO per-chunk length framing and
 * never hold the whole file in memory.
 */
import { bytesToB64, b64ToBytes } from '../lib/bytes';

export const BLOB_CHUNK = 1024 * 1024; // 1 MiB plaintext per crypto chunk
export const IV_LEN = 12;
export const TAG_LEN = 16;
/** Ciphertext byte length of a chunk whose plaintext is `plainLen` bytes. */
export const ctChunkLen = (plainLen: number) => IV_LEN + plainLen + TAG_LEN;
const aad = (i: number) => new TextEncoder().encode(`skytale:blob:v1:${i}`) as Uint8Array<ArrayBuffer>;

export function newBlobKeyRaw(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
}
export function importBlobKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Seal one plaintext chunk → [iv(12)][ct+tag]. */
export async function encryptChunk(key: CryptoKey, index: number, plaintext: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(index) }, key, plaintext));
  const out = new Uint8Array(IV_LEN + ct.length) as Uint8Array<ArrayBuffer>;
  out.set(iv, 0);
  out.set(ct, IV_LEN);
  return out;
}

/** Open one framed chunk ([iv(12)][ct+tag]) → plaintext. Throws on auth failure. */
export async function decryptChunk(key: CryptoKey, index: number, framed: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const iv = framed.subarray(0, IV_LEN);
  const ct = framed.subarray(IV_LEN);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad(index) }, key, ct)) as Uint8Array<ArrayBuffer>;
}

export interface BlobEnvelope {
  ciphertext: Uint8Array<ArrayBuffer>; // what gets uploaded to R2
  keyB64: string; // Kf — goes E2E, NEVER to the server
  size: number; // plaintext byte length
  chunk: number; // plaintext chunk size used
}

/** Whole-file encrypt (used by tests + small in-memory cases). The streaming uploader
 *  in blobtransfer.ts encrypts chunk-by-chunk instead, to bound memory for GB files. */
export async function encryptBlob(data: Uint8Array<ArrayBuffer>): Promise<BlobEnvelope> {
  const raw = newBlobKeyRaw();
  const key = await importBlobKey(raw);
  const chunks = Math.max(1, Math.ceil(data.length / BLOB_CHUNK));
  const parts: Uint8Array[] = [];
  let total = 0;
  for (let i = 0; i < chunks; i++) {
    const slice = data.subarray(i * BLOB_CHUNK, Math.min((i + 1) * BLOB_CHUNK, data.length)) as Uint8Array<ArrayBuffer>;
    const framed = await encryptChunk(key, i, slice);
    parts.push(framed);
    total += framed.length;
  }
  const ciphertext = new Uint8Array(total) as Uint8Array<ArrayBuffer>;
  let o = 0;
  for (const p of parts) {
    ciphertext.set(p, o);
    o += p.length;
  }
  return { ciphertext, keyB64: bytesToB64(raw), size: data.length, chunk: BLOB_CHUNK };
}

/** Whole-blob decrypt (tests + small cases). The streaming downloader decrypts as bytes
 *  arrive and stores chunks straight to the attachment store, never holding it all. */
export async function decryptBlob(ciphertext: Uint8Array<ArrayBuffer>, keyB64: string, size: number, chunk: number): Promise<Uint8Array<ArrayBuffer>> {
  const key = await importBlobKey(b64ToBytes(keyB64) as Uint8Array<ArrayBuffer>);
  const chunks = Math.max(1, Math.ceil(size / chunk));
  const out = new Uint8Array(size) as Uint8Array<ArrayBuffer>;
  let src = 0;
  let dst = 0;
  for (let i = 0; i < chunks; i++) {
    const plainLen = Math.min(chunk, size - i * chunk);
    const ctLen = ctChunkLen(plainLen);
    if (src + ctLen > ciphertext.length) throw new Error('blob truncated');
    const pt = await decryptChunk(key, i, ciphertext.subarray(src, src + ctLen) as Uint8Array<ArrayBuffer>);
    out.set(pt, dst);
    src += ctLen;
    dst += plainLen;
  }
  return out;
}
