/**
 * Message-history persistence. The decrypted chat log is sealed with the DEK
 * (AES-256-GCM) before it touches IndexedDB — at rest it's ciphertext, bound
 * per room via AAD. Loaded on unlock so conversations survive lock/reload.
 */
import { seal, open, utf8, type Bytes, type SealedRecord } from '../crypto';
import { loadRecord, saveRecord, deleteRecord, listRecordKeys, secureDeleteRecord } from './db';

/**
 * An attachment on a message. ONE write format going forward — a reference
 * (`attId`) into the out-of-band, per-chunk-sealed attachment store — and TWO read
 * formats: a reference, or a legacy/inline `dataB64`. Stickers stay inline (they are
 * tiny cropped squares, and the sticker library dedups on their bytes). Everything
 * else is stored by reference so the message log never re-encrypts a whole file on
 * each append. `attId` takes precedence when both are present.
 */
export interface FileRef {
  name: string;
  mime: string;
  dataB64?: string; // legacy/inline bytes (base64) — still read, and used for stickers
  attId?: string; // reference into the attachment store (src/lib/attachments.ts)
  size?: number; // plaintext byte size (for the reference case)
  // A large attachment OFFERED but not yet downloaded: the recipient sees a download
  // affordance and pulls it on demand (`total` = chunk count). The pull request fans
  // out to the contact; only the offering device (which holds the file) serves it.
  // Cleared once the bytes are reassembled into the store.
  pull?: { total: number };
  // View-once photo: shown as a covered placeholder, opened at most once, then the
  // stored bytes are securely wiped and the message becomes a tombstone. Set on the
  // RECIPIENT's copy (the sender keeps their own). See src/ViewOnceViewer.tsx.
  viewOnce?: boolean;
  // A LARGE attachment stored (encrypted) in R2: not downloaded yet. The recipient taps
  // to stream-download + decrypt into the local store (then `attId` is set, `r2` cleared).
  // Carries the R2 object key + the E2E per-file key. See src/lib/blobtransfer.ts.
  r2?: { key: string; keyB64: string; chunk: number };
}

/** A quoted message shown above a reply. Self-contained (a rendered preview + who
 *  wrote it), so it still renders if the original is gone; `mid` links back to it. */
export interface Quote {
  mid: string;
  text: string; // short preview of the quoted message
  sender?: string; // display name of its author (groups); undefined for 1:1
  mine: boolean; // was the quoted message mine
}

export interface ChatMessage {
  mine: boolean;
  ts: number;
  sender?: string; // display name of the sender, for group messages
  text?: string;
  file?: FileRef;
  reply?: Quote; // this message is a reply to another; shown as a quote above it
  mid?: string; // stable E2E/bubble id (Stage 3d: shared across fan-out + self-sync copies)
  // The message was recalled ("unsent") by its sender — shown as a tombstone on BOTH
  // sides, its text/file dropped. Cooperative, not a guarantee (see SECURITY.md): it
  // only asks the recipient's client to retract; it can't undo what was already read.
  recalled?: boolean;
  // A view-once photo (file.viewOnce) that has been opened once. The bytes are wiped
  // and file.attId is cleared; the bubble renders as an "angesehen" tombstone.
  voSeen?: boolean;
  // Delivery to the relay (not read-receipt): pending until the DO confirms the
  // SQLite insert, then 'sent'; 'failed' on nack (mailbox full) or ack timeout.
  // Undefined on old/received messages → rendered as delivered.
  status?: 'pending' | 'sent' | 'failed';
  // Stage 3d fan-out: one entry PER target device of the peer. The bubble status is
  // the honest AGGREGATE over these (see aggregateDelivery). `stale` = the device
  // was revoked mid-flight; it drops OUT of the denominator (the current device
  // set), never counted as failed — correct behaviour must not read as an error.
  deliveries?: DeviceDelivery[];
}

export interface DeviceDelivery {
  device: string; // base64 of the peer device's sign key
  deliveryId: string; // per-delivery relay id (ack/nack matches on this)
  status: 'pending' | 'sent' | 'failed' | 'stale';
}

/** Honest aggregate of a fan-out message's per-device deliveries. Denominator is
 *  the CURRENT device set (a `stale` device — revoked in flight — drops out), so a
 *  message the person actually received never shows a permanent partial-failure. */
export function aggregateDelivery(deliveries: DeviceDelivery[]): {
  label: 'pending' | 'sent' | 'partial' | 'failed';
  sent: number;
  total: number;
} {
  const live = deliveries.filter((d) => d.status !== 'stale');
  const total = live.length;
  const sent = live.filter((d) => d.status === 'sent').length;
  // total === 0 means EVERY target device was unreachable (all 'stale') — nothing
  // hit the wire, so the message was NOT delivered. It must render ⚠, never ✓✓.
  if (total === 0) return { label: 'failed', sent: 0, total: 0 };
  if (sent === total) return { label: 'sent', sent, total };
  if (sent > 0) return { label: 'partial', sent, total };
  if (live.every((d) => d.status === 'failed')) return { label: 'failed', sent, total };
  return { label: 'pending', sent, total };
}

/**
 * Dedup predicate for the message log. A message's identity is (mid, DIRECTION):
 * a copy I SENT (mine=true, self-synced from another of my devices) and a copy I
 * RECEIVED (mine=false, a peer's fan-out or a future receive-sync) are DISTINCT
 * streams even when they carry the same mid.
 *
 * Keeping both in ONE mid-only namespace let a malicious authorised peer — who
 * learns my fan-out mid by decrypting its own copy — REFLECT that mid onto my
 * second device and suppress my own sent message (Review fund: Self-Sync-mid-
 * Reflexion). The `mine` flag is assigned LOCALLY from provenance (a peer message
 * always arrives via incomingMessage with mine=false), so a peer cannot forge it
 * to force a cross-direction collision.
 */
export function hasMessage(messages: ChatMessage[], mid: string, mine: boolean): boolean {
  return messages.some((m) => m.mid === mid && m.mine === mine);
}

const aad = (roomId: string) => utf8.encode(`scytale:messages:v1:${roomId}`);
const recordKey = (roomId: string) => `msgs:${roomId}`;

// ── Per-room key (crypto-erase of a whole chat) ──────────────────────────────
// A room's message log is one sealed blob. It is sealed under a random per-room key K,
// stored sealed under the DEK at roomkey:<roomId>. Deleting the chat (or its contact)
// crypto-erases K — the whole history becomes unrecoverable ciphertext at once. LEGACY
// rooms (sealed directly under the DEK, no key record) still read via the DEK fallback.
// NB: deleting a SINGLE message re-seals the room under the SAME live K, so that text is
// not individually crypto-erased — it dies with K when the chat/contact is deleted. Any
// ATTACHMENT in a deleted message IS crypto-erased on its own (secureWipeAttachment).
const roomKeyKey = (roomId: string) => `roomkey:${roomId}`;
const roomKeyAad = (roomId: string) => utf8.encode(`scytale:room-key:v1:${roomId}`);
const corruptRooms = new Set<string>();

/** A stored ciphertext exists but cannot be authenticated/deserialized. Treating
 *  this as an empty history would let the next save destroy the only recoverable copy. */
export class MessageCorruptionError extends Error {
  constructor(readonly roomId: string) {
    super('Der gespeicherte Nachrichtenverlauf ist beschädigt und wurde nicht überschrieben.');
    this.name = 'MessageCorruptionError';
  }
}

function importRoomKey(raw: Bytes): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function roomKey(dek: CryptoKey, roomId: string): Promise<CryptoKey | null> {
  const rec = await loadRecord(roomKeyKey(roomId));
  if (!rec) return null;
  try {
    return await importRoomKey(await open(dek, rec, roomKeyAad(roomId)));
  } catch {
    return null;
  }
}
async function ensureRoomKey(dek: CryptoKey, roomId: string): Promise<CryptoKey> {
  const existing = await roomKey(dek, roomId);
  if (existing) return existing;
  const raw = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  await saveRecord(roomKeyKey(roomId), await seal(dek, raw, roomKeyAad(roomId)));
  return importRoomKey(raw);
}

/** Build the sealed `roomkey:<roomId>` + `msgs:<roomId>` records for a fresh room WITHOUT writing
 *  them (a new random per-room key each time), reusing the exact same AADs + layout as saveMessages.
 *  For seeding the decoy account into its own database at provision time — the caller writes the
 *  returned [key, record] pairs via a raw withVaultDb handle. Colocated with the real seal so the
 *  seed can never drift from the format the decoy will later read back. */
export async function sealRoomRecords(
  dek: CryptoKey,
  roomId: string,
  msgs: ChatMessage[],
): Promise<Array<[string, SealedRecord]>> {
  const raw = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  const rk = await importRoomKey(raw);
  return [
    [roomKeyKey(roomId), await seal(dek, raw, roomKeyAad(roomId))],
    [recordKey(roomId), await seal(rk, utf8.encode(JSON.stringify(msgs)), aad(roomId))],
  ];
}

/** Crypto-erase a whole room: destroy the per-room key (the guarantee), then delete the
 *  message blob. Even a crash between the two leaves the blob unreadable — i.e. gone.
 *  LEGACY case (a room still sealed under the DEK, no key record — e.g. an idle chat that
 *  got no new message since the per-room-key upgrade): there is no key to destroy, so
 *  overwrite the blob best-effort instead of a plain delete, mirroring secureWipeAttachment
 *  (audit M3 — a plain delete left it DEK-decryptable from an un-reclaimed page). */
export async function cryptoEraseRoom(roomId: string): Promise<void> {
  const legacy = !(await loadRecord(roomKeyKey(roomId)));
  await secureDeleteRecord(roomKeyKey(roomId));
  if (legacy) await secureDeleteRecord(recordKey(roomId));
  else await deleteRecord(recordKey(roomId));
  corruptRooms.delete(roomId);
}

async function openMessageRecord(
  dek: CryptoKey,
  roomId: string,
  rec: Awaited<ReturnType<typeof loadRecord>>,
): Promise<ChatMessage[]> {
  if (!rec) return [];
  // Try the room key first, then the DEK (legacy, or a crash between key-write and
  // blob-write left the blob still sealed under the DEK).
  const k = await roomKey(dek, roomId);
  for (const key of k ? [k, dek] : [dek]) {
    try {
      const parsed: unknown = JSON.parse(utf8.decode(await open(key, rec, aad(roomId))));
      if (!Array.isArray(parsed)) throw new Error('message record is not an array');
      corruptRooms.delete(roomId);
      return parsed as ChatMessage[];
    } catch {
      /* try the next candidate key */
    }
  }
  corruptRooms.add(roomId);
  throw new MessageCorruptionError(roomId);
}

export async function loadMessages(dek: CryptoKey, roomId: string): Promise<ChatMessage[]> {
  const rec = await loadRecord(recordKey(roomId));
  return openMessageRecord(dek, roomId, rec);
}

export async function saveMessages(
  dek: CryptoKey,
  roomId: string,
  messages: ChatMessage[],
): Promise<void> {
  if (corruptRooms.has(roomId)) throw new MessageCorruptionError(roomId);
  const existing = await loadRecord(recordKey(roomId));
  // Authenticate the previous generation before replacing it. This makes the
  // fail-closed rule hold even for callers that skipped an explicit load.
  if (existing) await openMessageRecord(dek, roomId, existing);
  const k = await ensureRoomKey(dek, roomId);
  await saveRecord(recordKey(roomId), await seal(k, utf8.encode(JSON.stringify(messages)), aad(roomId)));
}

export async function clearMessages(roomId: string): Promise<void> {
  await cryptoEraseRoom(roomId);
}

/** Every roomId that has a stored message log — including cardless self-sync rooms
 *  that boot does not otherwise load. Used to find every attachment reference for
 *  the orphan sweep, so no still-referenced attachment is ever collected. */
export async function allMessageRoomIds(): Promise<string[]> {
  return (await listRecordKeys(recordKey(''))).map((k) => k.slice(recordKey('').length));
}

// Recall registry: messages that were recalled but whose ORIGINAL had not arrived yet
// (out-of-order, or a re-delivery after the original was tombstoned+dropped). A MID is
// known to the peer and is therefore NOT a global namespace: it must be bound to both
// the local room and the locally assigned direction. The encrypted record stays an
// array of strings for backup compatibility; new entries carry their own v2 prefix.
const recalledKey = 'recalled-mids';
const recalledAad = utf8.encode('scytale:recalled-mids:v1');
const scopedRecallPrefix = 'v2:';

export function recallRegistryKey(roomId: string, mine: boolean, mid: string): string {
  // Room ids never contain ':' (the contact/group validators enforce this). MIDs
  // may contain it for group dedup ids, so parsing consumes only the first fields.
  return `${scopedRecallPrefix}${mine ? '1' : '0'}:${roomId}:${mid}`;
}

function parseRecallRegistryKey(
  value: string,
): { roomId: string; mine: boolean; mid: string } | null {
  if (!value.startsWith(scopedRecallPrefix)) return null;
  const directionAt = scopedRecallPrefix.length;
  if (
    (value[directionAt] !== '0' && value[directionAt] !== '1') ||
    value[directionAt + 1] !== ':'
  ) {
    return null;
  }
  const roomStart = directionAt + 2;
  const roomEnd = value.indexOf(':', roomStart);
  if (roomEnd <= roomStart || roomEnd === value.length - 1) return null;
  const roomId = value.slice(roomStart, roomEnd);
  const mid = value.slice(roomEnd + 1);
  if (roomId.includes(':') || !mid) return null;
  const mine = value[directionAt] === '1';
  return recallRegistryKey(roomId, mine, mid) === value ? { roomId, mine, mid } : null;
}

export function recallRegistryHas(
  registry: ReadonlySet<string>,
  roomId: string,
  mine: boolean,
  mid: string,
): boolean {
  return registry.has(recallRegistryKey(roomId, mine, mid));
}

/**
 * Safely migrate the old flat MID set after histories have loaded. Legacy data
 * did not retain room or direction, so an unmatched value cannot be scoped and
 * is discarded. Only existing received-direction tombstones are reconstructed:
 * carrying a legacy value into mine=true could preserve the peer-reflection bug
 * this migration closes. Existing own tombstones remain durable in their room
 * log and normal direction-scoped dedup still protects them.
 */
export function migrateLegacyRecalledMids(
  values: readonly string[],
  rooms: Readonly<Record<string, readonly ChatMessage[]>>,
): string[] {
  const migrated = new Set<string>();
  const legacy = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const parsed = parseRecallRegistryKey(value);
    if (parsed) migrated.add(recallRegistryKey(parsed.roomId, parsed.mine, parsed.mid));
    else if (!value.startsWith(scopedRecallPrefix) && value) legacy.add(value);
  }
  if (legacy.size) {
    for (const [roomId, messages] of Object.entries(rooms)) {
      for (const message of messages) {
        if (
          !message.mine &&
          message.recalled === true &&
          message.mid &&
          legacy.has(message.mid)
        ) {
          migrated.add(recallRegistryKey(roomId, false, message.mid));
        }
      }
    }
  }
  return [...migrated].sort();
}

/** Rebind scoped recall intents when a contact's authenticated room id changes.
 * `keepOld` stages both keys before storage is moved; a crash then leaves at
 * least one key matching whichever room generation survives. */
export function moveRecallRegistryRoom(
  values: Iterable<string>,
  oldRoomId: string,
  newRoomId: string,
  keepOld = false,
): string[] {
  const moved = new Set<string>();
  for (const value of values) {
    const parsed = parseRecallRegistryKey(value);
    if (!parsed || parsed.roomId !== oldRoomId) {
      moved.add(value);
      continue;
    }
    if (keepOld) moved.add(value);
    moved.add(recallRegistryKey(newRoomId, parsed.mine, parsed.mid));
  }
  return [...moved].sort();
}

export interface RecallApplication {
  message: ChatMessage;
  /** A locally materialized blob that lost its only message reference. */
  attachmentIdToWipe?: string;
}

export function applyRecallRegistry(
  registry: ReadonlySet<string>,
  roomId: string,
  message: ChatMessage,
): RecallApplication {
  if (!message.mid || !recallRegistryHas(registry, roomId, message.mine, message.mid)) {
    return { message };
  }
  const alreadyTombstoned =
    message.recalled === true &&
    message.text === undefined &&
    message.file === undefined &&
    message.reply === undefined;
  if (alreadyTombstoned) return { message };
  return {
    message: {
      ...message,
      recalled: true,
      text: undefined,
      file: undefined,
      reply: undefined,
    },
    // A pull/R2 descriptor has not materialized local bytes yet. Wiping its
    // attacker-controlled id could collide with an unrelated local attachment.
    attachmentIdToWipe:
      message.file?.attId && !message.file.pull && !message.file.r2
        ? message.file.attId
        : undefined,
  };
}

/**
 * Resolve a pending recall before the message log can drop the attachment
 * reference. Awaiting the injected wipe makes the operation crash-safe: a
 * failed wipe aborts the append and leaves the relay row retryable.
 */
export async function prepareRecalledMessageForAppend(
  registry: ReadonlySet<string>,
  roomId: string,
  message: ChatMessage,
  wipeAttachment: (id: string) => Promise<void>,
): Promise<ChatMessage> {
  const applied = applyRecallRegistry(registry, roomId, message);
  if (applied.attachmentIdToWipe) await wipeAttachment(applied.attachmentIdToWipe);
  return applied.message;
}

export async function loadRecalledMids(dek: CryptoKey): Promise<string[]> {
  const rec = await loadRecord(recalledKey);
  if (!rec) return [];
  try {
    const parsed: unknown = JSON.parse(utf8.decode(await open(dek, rec, recalledAad)));
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveRecalledMids(dek: CryptoKey, mids: string[]): Promise<void> {
  await saveRecord(recalledKey, await seal(dek, utf8.encode(JSON.stringify(mids)), recalledAad));
}
