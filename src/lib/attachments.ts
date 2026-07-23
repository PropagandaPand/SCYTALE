/**
 * Large-attachment store. Attachments live OUTSIDE the message log, one DEK-sealed
 * record per chunk, for two reasons the inline `dataB64`-in-ChatMessage model can't
 * satisfy:
 *
 *  - A room is a single sealed JSON blob, so with an inline attachment EVERY later
 *    message re-serialises and re-encrypts the whole video. Out-of-band records
 *    make an append O(message), not O(room + attachments).
 *  - A 25 MB blob must never sit in memory as one array (nor be handed to
 *    `crypto.subtle.encrypt` whole). Chunks are sealed and read back one at a time
 *    and assembled into a `Blob`, which the browser may spill to disk.
 *
 * Records (in the `records` store, so they inherit the same at-rest sealing):
 *   att:<id>:<idx>  → one raw chunk, sealed, AAD scytale:att:v1:<id>:<idx>
 *   att:<id>:meta   → { name, mime, size, chunks }, sealed, AAD scytale:att-meta:v1:<id>
 *
 * The meta record is written LAST, so an interrupted put leaves chunks without a
 * meta — detectable as incomplete and collectable, never a half-readable file.
 * The per-chunk AAD binds each chunk to its id AND index, so a chunk cannot be
 * swapped between attachments or reordered under the seal.
 */
import { seal, open, utf8, type SealedRecord, type Bytes } from '../crypto';
import { loadRecord, saveRecord, deleteRecord, listRecordKeys } from './db';
import { bytesToB64 } from './bytes';

/** Raw bytes per stored chunk. Independent of the wire chunk size — this only
 *  bounds how much plaintext a single decrypt handles. */
const STORE_CHUNK = 256 * 1024;

export interface AttachmentMeta {
  name: string;
  mime: string;
  size: number; // total plaintext bytes
  chunks: number;
}

/** A marker that an INCOMING chunked transfer is in progress for `id`. Present from
 *  the first chunk until the message is appended, so (a) the orphan GC never collects
 *  a half-received attachment and (b) a reload can resume/finalise it. */
export interface RecvMarker {
  total: number; // expected wire-chunk count
  name: string;
  mime: string;
  size: number; // expected plaintext bytes (validated against the cap before storing)
  ts: number; // when the transfer started — a stale one (sender vanished) is swept
}

const metaKey = (id: string) => `att:${id}:meta`;
const chunkKey = (id: string, idx: number) => `att:${id}:${idx}`;
const recvKey = (id: string) => `attrecv:${id}`;
const metaAad = (id: string) => utf8.encode(`scytale:att-meta:v1:${id}`);
const chunkAad = (id: string, idx: number) => utf8.encode(`scytale:att:v1:${id}:${idx}`);
const recvAad = (id: string) => utf8.encode(`scytale:att-recv:v1:${id}`);

/** A fresh random attachment id (16 bytes, hex). */
export function newAttachmentId(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16))).replace(/[^A-Za-z0-9]/g, '').slice(0, 22);
}

/** Store an attachment from its full bytes, sealing one chunk at a time. The bytes
 *  are already in memory here (a just-selected or just-decrypted file); the win is
 *  that they never touch the message log and are read back incrementally. */
export async function putAttachment(dek: CryptoKey, id: string, bytes: Uint8Array, name: string, mime: string): Promise<AttachmentMeta> {
  const chunks = Math.max(1, Math.ceil(bytes.length / STORE_CHUNK));
  try {
    for (let i = 0; i < chunks; i++) {
      const slice = bytes.slice(i * STORE_CHUNK, (i + 1) * STORE_CHUNK);
      await saveRecord(chunkKey(id, i), await seal(dek, slice, chunkAad(id, i)));
    }
    const meta: AttachmentMeta = { name, mime, size: bytes.length, chunks };
    await saveRecord(metaKey(id), await seal(dek, utf8.encode(JSON.stringify(meta)), metaAad(id))); // LAST
    return meta;
  } catch (e) {
    // Clean up our own partial write (e.g. out of space mid-store) so a failed
    // put never leaves orphan chunks behind, then let the caller see the error.
    await deleteAttachment(id).catch(() => undefined);
    throw e;
  }
}

/** Store one already-sealed chunk (used by the incoming chunked-transfer path, which
 *  seals as it receives so a whole file is never assembled in memory to store it). */
export async function putAttachmentChunk(id: string, idx: number, sealed: SealedRecord): Promise<void> {
  await saveRecord(chunkKey(id, idx), sealed);
}

/** Seal + store one incoming WIRE chunk directly as attachment chunk `idx`. A wire
 *  chunk becomes a store chunk one-to-one, so a transfer is persisted as it arrives
 *  (crash-safe, never assembled whole in memory) and getAttachmentBlob reassembles
 *  it regardless of chunk sizes. Idempotent: a re-delivered chunk overwrites its key. */
export async function sealAndPutChunk(dek: CryptoKey, id: string, idx: number, bytes: Bytes): Promise<void> {
  await saveRecord(chunkKey(id, idx), await seal(dek, bytes, chunkAad(id, idx)));
}

/** How many distinct chunk records are stored for `id` (ignores the meta record).
 *  Drives completion detection for an incoming transfer: === total ⇒ all arrived. */
export async function storedChunkCount(id: string): Promise<number> {
  const keys = await listRecordKeys(`att:${id}:`);
  let n = 0;
  for (const k of keys) if (/^att:[^:]+:\d+$/.test(k)) n++;
  return n;
}

/** Finalise an incrementally-written attachment by committing its meta LAST. */
export async function finalizeAttachment(dek: CryptoKey, id: string, meta: AttachmentMeta): Promise<void> {
  await saveRecord(metaKey(id), await seal(dek, utf8.encode(JSON.stringify(meta)), metaAad(id)));
}

/** Mark an incoming transfer in progress (written on the first chunk). */
export async function putRecvMarker(dek: CryptoKey, id: string, m: RecvMarker): Promise<void> {
  await saveRecord(recvKey(id), await seal(dek, utf8.encode(JSON.stringify(m)), recvAad(id)));
}
export async function getRecvMarker(dek: CryptoKey, id: string): Promise<RecvMarker | null> {
  const rec = await loadRecord(recvKey(id));
  if (!rec) return null;
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, recvAad(id)))) as RecvMarker;
  } catch {
    return null;
  }
}
export async function clearRecvMarker(id: string): Promise<void> {
  await deleteRecord(recvKey(id));
}
/** Every id with an in-progress incoming-transfer marker — for boot-resume AND so the
 *  orphan sweep treats a half-received attachment as in-use, not collectable. */
export async function allRecvMarkerIds(): Promise<string[]> {
  return (await listRecordKeys('attrecv:')).map((k) => k.slice('attrecv:'.length));
}

export async function getAttachmentMeta(dek: CryptoKey, id: string): Promise<AttachmentMeta | null> {
  const rec = await loadRecord(metaKey(id));
  if (!rec) return null;
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, metaAad(id)))) as AttachmentMeta;
  } catch {
    return null;
  }
}

/** True once every chunk AND the meta are present (a completely stored attachment). */
export async function attachmentComplete(dek: CryptoKey, id: string): Promise<boolean> {
  const meta = await getAttachmentMeta(dek, id);
  if (!meta) return false;
  for (let i = 0; i < meta.chunks; i++) if (!(await loadRecord(chunkKey(id, i)))) return false;
  return true;
}

/** Reassemble the attachment as a Blob, decrypting one chunk at a time. Returns
 *  null if the meta or any chunk is missing (an incomplete or GC'd attachment). */
export async function getAttachmentBlob(dek: CryptoKey, id: string): Promise<Blob | null> {
  const meta = await getAttachmentMeta(dek, id);
  if (!meta) return null;
  const parts: BlobPart[] = [];
  for (let i = 0; i < meta.chunks; i++) {
    const rec = await loadRecord(chunkKey(id, i));
    if (!rec) return null;
    try {
      parts.push(await open(dek, rec, chunkAad(id, i)));
    } catch {
      return null;
    }
  }
  return new Blob(parts, { type: meta.mime });
}

/** Delete every record of an attachment. Enumeration-based, so it also cleans up a
 *  partially-written one whose meta (and thus chunk count) is missing. */
export async function deleteAttachment(id: string): Promise<void> {
  for (const k of await listRecordKeys(`att:${id}:`)) await deleteRecord(k);
}

/** Every attachment id currently in the store (distinct, from the chunk/meta keys).
 *  For garbage collection: an id no message references is an orphan. */
export async function allAttachmentIds(): Promise<string[]> {
  const ids = new Set<string>();
  for (const k of await listRecordKeys('att:')) {
    const m = /^att:([^:]+):/.exec(k);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}
