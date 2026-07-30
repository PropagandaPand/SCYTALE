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
import { loadRecord, saveRecord, deleteRecord, listRecordKeys, secureDeleteRecord } from './db';
import { bytesToB64 } from './bytes';

/** Raw bytes per stored chunk. Independent of the wire chunk size — this only
 *  bounds how much plaintext a single decrypt handles. */
const STORE_CHUNK = 256 * 1024;
const MAX_ATTACHMENT_BYTES = 1024 * 1024 * 1024;
const MAX_ATTACHMENT_CHUNKS = Math.ceil(MAX_ATTACHMENT_BYTES / STORE_CHUNK);

/** Creating one JS Blob from more than this is not safe on memory-constrained PWAs. */
export const MAX_MATERIALIZED_ATTACHMENT_BYTES = 32 * 1024 * 1024;

export class AttachmentMaterializationLimitError extends Error {
  constructor() {
    super('Anhang ist zu groß für eine sichere In-Memory-Darstellung.');
    this.name = 'AttachmentMaterializationLimitError';
  }
}

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
  receivedIdx: number[]; // distinct chunk indices stored so far (completion = length === total)
  receivedBytes: number; // bytes stored so far — bounded by `size` so a peer can't over-store
  reservedBytes?: number; // plaintext + conservative per-record storage charge
  roomId: string; // quota owner; binds the transfer to the admitting contact
  automatic: boolean; // true consumes the per-contact automatic receive budget
  viewOnce?: boolean; // a view-once video/photo — the completed message self-destructs on first open
}

const metaKey = (id: string) => `att:${id}:meta`;
const chunkKey = (id: string, idx: number) => `att:${id}:${idx}`;
const recvKey = (id: string) => `attrecv:${id}`;
const metaAad = (id: string) => utf8.encode(`scytale:att-meta:v1:${id}`);
const chunkAad = (id: string, idx: number) => utf8.encode(`scytale:att:v1:${id}:${idx}`);

// ── Per-attachment key (crypto-erase) ────────────────────────────────────────
// Each attachment's chunks + meta are sealed under a random 32-byte key K, and K is
// itself stored sealed under the DEK at att:<id>:key. Destroying the attachment means
// overwriting+deleting that tiny key (secureWipeAttachment): every chunk then becomes
// unrecoverable ciphertext instantly, independent of whether the physical bytes linger.
// LEGACY attachments (written before this, no key record) are sealed directly under the
// DEK — reads fall back to the DEK so they keep working.
const keyKey = (id: string) => `att:${id}:key`;
const keyAad = (id: string) => utf8.encode(`scytale:att-key:v1:${id}`);

function importAttKey(raw: Bytes): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function attKey(dek: CryptoKey, id: string): Promise<CryptoKey | null> {
  const rec = await loadRecord(keyKey(id));
  if (!rec) return null;
  try {
    return await importAttKey(await open(dek, rec, keyAad(id)));
  } catch {
    return null;
  }
}
/** The per-attachment key, creating + persisting it on first use. */
async function ensureAttKey(dek: CryptoKey, id: string): Promise<CryptoKey> {
  const existing = await attKey(dek, id);
  if (existing) return existing;
  const raw = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  await saveRecord(keyKey(id), await seal(dek, raw, keyAad(id)));
  return importAttKey(raw);
}
/** Ordered keys to TRY when opening: the attachment key first (if any), then the DEK
 *  (legacy attachment, or a crash between key-write and chunk-write). */
async function attKeys(dek: CryptoKey, id: string): Promise<CryptoKey[]> {
  const k = await attKey(dek, id);
  return k ? [k, dek] : [dek];
}
async function openUnder(keys: CryptoKey[], rec: SealedRecord, aad: Bytes): Promise<Bytes | null> {
  for (const k of keys) {
    try {
      return await open(k, rec, aad);
    } catch {
      /* try the next candidate key */
    }
  }
  return null;
}
const recvAad = (id: string) => utf8.encode(`scytale:att-recv:v1:${id}`);

/** A fresh storage-only attachment id derived from 16 random bytes. Transfer
 * ids that must also be message MIDs use randomMid() at the protocol layer. */
export function newAttachmentId(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16))).replace(/[^A-Za-z0-9]/g, '').slice(0, 22);
}

/** Store an attachment from its full bytes, sealing one chunk at a time. The bytes
 *  are already in memory here (a just-selected or just-decrypted file); the win is
 *  that they never touch the message log and are read back incrementally. */
export async function putAttachment(dek: CryptoKey, id: string, bytes: Uint8Array, name: string, mime: string): Promise<AttachmentMeta> {
  const chunks = Math.max(1, Math.ceil(bytes.length / STORE_CHUNK));
  try {
    const ck = await ensureAttKey(dek, id);
    for (let i = 0; i < chunks; i++) {
      const slice = bytes.slice(i * STORE_CHUNK, (i + 1) * STORE_CHUNK);
      await saveRecord(chunkKey(id, i), await seal(ck, slice, chunkAad(id, i)));
    }
    const meta: AttachmentMeta = { name, mime, size: bytes.length, chunks };
    await saveRecord(metaKey(id), await seal(ck, utf8.encode(JSON.stringify(meta)), metaAad(id))); // LAST
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
  const ck = await ensureAttKey(dek, id);
  await saveRecord(chunkKey(id, idx), await seal(ck, bytes, chunkAad(id, idx)));
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
  const ck = await ensureAttKey(dek, id);
  await saveRecord(metaKey(id), await seal(ck, utf8.encode(JSON.stringify(meta)), metaAad(id)));
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
  const pt = await openUnder(await attKeys(dek, id), rec, metaAad(id));
  if (!pt) return null;
  try {
    const meta: unknown = JSON.parse(utf8.decode(pt));
    if (
      !meta ||
      typeof meta !== 'object' ||
      typeof (meta as AttachmentMeta).name !== 'string' ||
      typeof (meta as AttachmentMeta).mime !== 'string' ||
      !Number.isSafeInteger((meta as AttachmentMeta).size) ||
      (meta as AttachmentMeta).size < 0 ||
      (meta as AttachmentMeta).size > MAX_ATTACHMENT_BYTES ||
      !Number.isSafeInteger((meta as AttachmentMeta).chunks) ||
      (meta as AttachmentMeta).chunks < 1 ||
      (meta as AttachmentMeta).chunks > MAX_ATTACHMENT_CHUNKS
    ) {
      return null;
    }
    return meta as AttachmentMeta;
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
export async function getAttachmentBlob(
  dek: CryptoKey,
  id: string,
  maxBytes = MAX_MATERIALIZED_ATTACHMENT_BYTES,
): Promise<Blob | null> {
  const meta = await getAttachmentMeta(dek, id);
  if (!meta) return null;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || meta.size > maxBytes) {
    throw new AttachmentMaterializationLimitError();
  }
  const keys = await attKeys(dek, id); // resolve once, reuse for every chunk
  const parts: BlobPart[] = [];
  let total = 0;
  for (let i = 0; i < meta.chunks; i++) {
    const rec = await loadRecord(chunkKey(id, i));
    if (!rec) return null;
    const pt = await openUnder(keys, rec, chunkAad(id, i));
    if (!pt) return null;
    total += pt.length;
    if (total > meta.size || total > maxBytes) throw new AttachmentMaterializationLimitError();
    parts.push(pt);
  }
  if (total !== meta.size) return null;
  return new Blob(parts, { type: meta.mime });
}

interface WritableAttachmentFile {
  write(data: Uint8Array<ArrayBuffer>): Promise<void>;
  close(): Promise<void>;
  abort(reason?: unknown): Promise<void>;
}

interface AttachmentFileHandle {
  createWritable(): Promise<WritableAttachmentFile>;
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: { suggestedName: string }) => Promise<AttachmentFileHandle>;
};

export function supportsStreamingAttachmentSave(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as SavePickerWindow).showSaveFilePicker === 'function'
  );
}

/**
 * Explicitly export a large plaintext attachment straight to a user-selected
 * file. Only one decrypted chunk exists in JS memory at a time; plaintext is
 * written nowhere until the user grants a destination.
 */
export async function saveAttachmentToDisk(
  dek: CryptoKey,
  id: string,
  suggestedName: string,
): Promise<void> {
  const picker = typeof window === 'undefined' ? undefined : (window as SavePickerWindow).showSaveFilePicker;
  if (!picker) throw new Error('Dieser Browser unterstützt keinen sicheren Streaming-Export großer Anhänge.');
  const meta = await getAttachmentMeta(dek, id);
  if (!meta) throw new Error('Anhang ist unvollständig oder beschädigt.');
  const handle = await picker.call(window, { suggestedName: suggestedName || meta.name || 'anhang' });
  const writable = await handle.createWritable();
  const keys = await attKeys(dek, id);
  let total = 0;
  try {
    for (let i = 0; i < meta.chunks; i++) {
      const rec = await loadRecord(chunkKey(id, i));
      if (!rec) throw new Error('Anhang ist unvollständig.');
      const plain = await openUnder(keys, rec, chunkAad(id, i));
      if (!plain) throw new Error('Anhang ist beschädigt.');
      total += plain.length;
      if (total > meta.size) throw new Error('Anhang ist größer als seine Metadaten.');
      await writable.write(plain);
    }
    if (total !== meta.size) throw new Error('Anhang ist unvollständig.');
    await writable.close();
  } catch (error) {
    await writable.abort(error).catch(() => undefined);
    throw error;
  }
}

/** Delete every record of an attachment. Enumeration-based, so it also cleans up a
 *  partially-written one whose meta (and thus chunk count) is missing. */
export async function deleteAttachment(id: string): Promise<void> {
  for (const k of await listRecordKeys(`att:${id}:`)) await deleteRecord(k);
}

/**
 * Crypto-erase an attachment (view-once photos, deleted messages/chats/contacts). The
 * REAL guarantee is destroying the per-attachment key: once att:<id>:key is gone, every
 * chunk is unrecoverable AES-GCM ciphertext, instantly, no matter what bytes linger in
 * the log-structured store or on the SSD's flash cells (which the FTL never lets us
 * overwrite in place anyway). See db.secureDeleteRecord + SECURITY.md for the honest
 * limits. A LEGACY attachment (no key record) has no key to destroy, so its chunks fall
 * back to the same-length overwrite-then-delete best-effort the DEK-at-rest already backs.
 */
export async function secureWipeAttachment(id: string): Promise<void> {
  const hadKey = !!(await loadRecord(keyKey(id)));
  await secureDeleteRecord(keyKey(id)); // ← crypto-erase: the whole guarantee is here
  for (const k of await listRecordKeys(`att:${id}:`)) {
    // Keyed chunks are already unrecoverable → a plain delete just reclaims space.
    // Legacy chunks (sealed under the DEK) still get the best-effort overwrite.
    if (hadKey) await deleteRecord(k);
    else await secureDeleteRecord(k);
  }
  await deleteRecord(recvKey(id));
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
