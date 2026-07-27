/**
 * Client transport for large R2-backed attachments. Both directions stream so a ~1 GB
 * file never sits in memory whole (works on iOS, which can't do streaming fetch upload
 * bodies): we read the File in 1 MiB slices, encrypt each, batch encrypted bytes into
 * R2 multipart parts, and on the way back decrypt chunk-by-chunk straight into the local
 * attachment store. R2/the Worker only ever see ciphertext.
 */
import {
  BLOB_CHUNK,
  ctChunkLen,
  newBlobKeyRaw,
  importBlobKey,
  encryptChunk,
  decryptChunk,
} from '../crypto/blob';
import { bytesToB64, b64ToBytes } from './bytes';
import { sealAndPutChunk, finalizeAttachment, deleteAttachment, type AttachmentMeta } from './attachments';

const PART_SIZE = 8 * 1024 * 1024; // ciphertext bytes per multipart part (R2 needs ≥5 MiB, except the last)

/** Thrown when the shared R2 storage budget is temporarily full (server 507). */
export class StorageFullError extends Error {
  constructor() {
    super('storage_full');
    this.name = 'StorageFullError';
  }
}

/** Thrown when a File slice can't be read — on iOS this usually means an iCloud-backed
 *  photo/video that hasn't finished downloading to the device yet. */
export class FileReadError extends Error {
  constructor(cause?: unknown) {
    super('file_read');
    this.name = 'FileReadError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/** Read a File slice, retrying a few times — an iCloud-offloaded file often fails the
 *  first read(s) while iOS is still fetching it from iCloud, then succeeds. */
export async function readSliceRetry(file: Blob, start: number, end: number, tries = 4): Promise<Uint8Array<ArrayBuffer>> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const buf = await file.slice(start, end).arrayBuffer();
      // A 0-byte read of a non-empty range means the bytes aren't materialised yet.
      if (buf.byteLength === 0 && end > start) throw new Error('empty read');
      return new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1))); // 0.5s, 1s, 1.5s backoff
    }
  }
  throw new FileReadError(lastErr);
}

export interface R2Ref {
  key: string; // R2 object key (the capability)
  keyB64: string; // Kf — the per-file key, carried E2E
  size: number; // plaintext byte length
  chunk: number; // plaintext chunk size
}

function concat(parts: Uint8Array[], len: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(len) as Uint8Array<ArrayBuffer>;
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Encrypt + multipart-upload a File to R2. Returns the E2E descriptor. `onProgress`
 *  gets a 0..1 fraction. Aborts the upload (freeing parts) on any failure.
 *
 *  `local` (optional) ALSO seals each plaintext slice into the local attachment store in
 *  the SAME pass, so the SENDER keeps a viewable copy without re-downloading — which lets
 *  the recipient delete the R2 object right after download (keeping R2 storage transient). */
export async function uploadFileToR2(
  file: File,
  onProgress?: (frac: number) => void,
  local?: { dek: CryptoKey; attId: string; name: string; mime: string },
): Promise<R2Ref> {
  const created = await fetch(`/api/blob/create?size=${file.size}`, { method: 'POST' });
  if (created.status === 507) throw new StorageFullError();
  if (!created.ok) throw new Error('Upload konnte nicht gestartet werden.');
  const { key, uploadId } = (await created.json()) as { key: string; uploadId: string };

  try {
    const raw = newBlobKeyRaw();
    const cryptoKey = await importBlobKey(raw);
    const size = file.size;
    const chunks = Math.max(1, Math.ceil(size / BLOB_CHUNK));
    const parts: { n: number; etag: string }[] = [];
    let buf: Uint8Array[] = [];
    let bufLen = 0;
    let partNum = 0;
    let donePlain = 0;

    const flush = async () => {
      if (bufLen === 0) return; // never upload an empty part
      partNum++;
      const body = concat(buf, bufLen);
      buf = [];
      bufLen = 0;
      const r = await fetch(`/api/blob/part?key=${key}&upload=${uploadId}&n=${partNum}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/octet-stream' },
        body,
      });
      if (!r.ok) throw new Error('Teil-Upload fehlgeschlagen.');
      const { etag } = (await r.json()) as { etag: string };
      parts.push({ n: partNum, etag });
    };

    for (let i = 0; i < chunks; i++) {
      const start = i * BLOB_CHUNK;
      const slice = await readSliceRetry(file, start, Math.min(start + BLOB_CHUNK, size)); // retries iCloud-backed reads
      if (local) await sealAndPutChunk(local.dek, local.attId, i, slice); // sender's local copy, same pass
      const framed = await encryptChunk(cryptoKey, i, slice);
      buf.push(framed);
      bufLen += framed.length;
      donePlain += slice.length;
      if (bufLen >= PART_SIZE) await flush();
      onProgress?.((donePlain / Math.max(1, size)) * 0.98);
    }
    await flush(); // final (any-size) part
    if (local) await finalizeAttachment(local.dek, local.attId, { name: local.name, mime: local.mime, size, chunks });

    const done = await fetch('/api/blob/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, upload: uploadId, parts }),
    });
    if (done.status === 507) throw new StorageFullError(); // budget re-checked authoritatively at complete
    if (!done.ok) throw new Error('Upload-Abschluss fehlgeschlagen.');
    onProgress?.(1);
    return { key, keyB64: bytesToB64(raw), size, chunk: BLOB_CHUNK };
  } catch (e) {
    await fetch('/api/blob/abort', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, upload: uploadId }),
    }).catch(() => undefined);
    throw e;
  }
}

/** Stream-download the ciphertext, decrypt chunk-by-chunk, and store the plaintext into
 *  the local attachment store under `attId` (reassembled later by getAttachmentBlob).
 *  Bounded memory: one ciphertext chunk at a time. */
export async function downloadR2ToStore(
  dek: CryptoKey,
  attId: string,
  ref: R2Ref,
  name: string,
  mime: string,
  onProgress?: (frac: number) => void,
): Promise<void> {
  const res = await fetch('/api/blob/' + ref.key);
  if (!res.ok || !res.body) throw new Error(res.status === 404 ? 'Datei nicht mehr verfügbar (abgelaufen?).' : 'Download fehlgeschlagen.');
  const cryptoKey = await importBlobKey(b64ToBytes(ref.keyB64) as Uint8Array<ArrayBuffer>);
  const totalChunks = Math.max(1, Math.ceil(ref.size / ref.chunk));
  const ctLenAt = (i: number) => ctChunkLen(Math.min(ref.chunk, ref.size - i * ref.chunk));

  const reader = res.body.getReader();
  let leftover = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
  let idx = 0;
  let donePlain = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value && value.length) {
        const merged = new Uint8Array(leftover.length + value.length) as Uint8Array<ArrayBuffer>;
        merged.set(leftover, 0);
        merged.set(value, leftover.length);
        leftover = merged;
      }
      while (idx < totalChunks && leftover.length >= ctLenAt(idx)) {
        const clen = ctLenAt(idx);
        const pt = await decryptChunk(cryptoKey, idx, leftover.subarray(0, clen) as Uint8Array<ArrayBuffer>);
        await sealAndPutChunk(dek, attId, idx, pt);
        leftover = leftover.subarray(clen) as Uint8Array<ArrayBuffer>;
        idx++;
        donePlain += pt.length;
        onProgress?.(donePlain / Math.max(1, ref.size));
      }
      if (done) break;
    }
    if (idx !== totalChunks) throw new Error('Übertragung unvollständig.');
    const meta: AttachmentMeta = { name, mime, size: ref.size, chunks: totalChunks };
    await finalizeAttachment(dek, attId, meta);
    // NB: we deliberately do NOT delete the R2 object here. The SAME descriptor is fanned
    // out to every recipient device, so a delete-after-download would 404 the object for the
    // recipient's OTHER devices (co-recipient data loss). The server-side lifecycle TTL
    // reclaims it instead; the storage brake bounds accumulation.
  } catch (e) {
    await deleteAttachment(attId).catch(() => undefined); // don't leave a half-written attachment
    throw e;
  }
}
