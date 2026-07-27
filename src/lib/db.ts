/**
 * IndexedDB access. Everything sensitive stored here is already sealed by the
 * vault (AES-256-GCM); the DB itself holds only ciphertext, the non-secret
 * vault header, the non-extractable device key, and small plaintext counters.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { VaultHeader, SealedRecord } from '../crypto';

interface ScytaleDB extends DBSchema {
  meta: { key: string; value: VaultHeader };
  records: { key: string; value: SealedRecord };
  restore: { key: string; value: { recordKey: string; record: SealedRecord } };
  device: { key: string; value: CryptoKey };
  kv: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<ScytaleDB>> | null = null;
let wiping = false; // set during an account wipe → refuse to (re)open so deleteDB isn't blocked
let accountWritesBlocked = false;
let observedAccountGeneration: string | null = null;
const ACCOUNT_GENERATION_KEY = 'account-generation';
const ACCOUNT_GENERATION_CHANNEL = 'scytale-account-generation-v1';

export class StaleAccountGenerationError extends Error {
  constructor() {
    super('Der lokale Account wurde in einem anderen Kontext ersetzt. Die App muss neu geladen werden.');
    this.name = 'StaleAccountGenerationError';
  }
}

function newAccountGeneration(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

const generationChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(ACCOUNT_GENERATION_CHANNEL)
    : null;

if (generationChannel) {
  generationChannel.onmessage = (event: MessageEvent<unknown>) => {
    if (
      typeof event.data !== 'string' ||
      observedAccountGeneration === null ||
      event.data === observedAccountGeneration
    ) {
      return;
    }
    // The durable generation check below already rejects every stale write.
    // Reload other live tabs as well so they cannot keep presenting old account
    // state indefinitely after a restore in a sibling tab.
    accountWritesBlocked = true;
    queueMicrotask(() => window.location.reload());
  };
}

function ensureWritable(): void {
  if (wiping) throw new Error('database is being wiped');
  if (accountWritesBlocked) throw new StaleAccountGenerationError();
}

async function db(): Promise<IDBPDatabase<ScytaleDB>> {
  if (wiping) throw new Error('database is being wiped');
  if (!dbp) {
    dbp = openDB<ScytaleDB>('scytale', 3, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('meta');
          d.createObjectStore('records');
        }
        if (oldVersion < 2) {
          d.createObjectStore('device');
          d.createObjectStore('kv');
        }
        if (oldVersion < 3) {
          // Restore data is written here while the live `records` generation
          // remains untouched. Only commitRestoreStage makes it visible.
          d.createObjectStore('restore');
        }
      },
      // The OS (notably older Android WebViews) can drop the connection under us.
      // Forget the cached handle so the next call reopens instead of using a dead one.
      terminated() {
        dbp = null;
      },
      // Another tab/instance wants to upgrade and we're in the way: close so it can
      // proceed; the next call reopens at the new version.
      blocking() {
        void dbp?.then((d) => d.close()).catch(() => undefined);
        dbp = null;
      },
    }).catch((e) => {
      dbp = null; // a failed open must not be cached, or every later call rejects
      throw e;
    });
  }
  const opened = await dbp;
  if (observedAccountGeneration === null) {
    const tx = opened.transaction('kv', 'readwrite');
    const storedGeneration = await tx.store.get(ACCOUNT_GENERATION_KEY);
    const generation =
      typeof storedGeneration === 'string' && /^[a-f0-9]{32}$/.test(storedGeneration)
        ? storedGeneration
        : newAccountGeneration();
    if (generation !== storedGeneration) {
      await tx.store.put(generation, ACCOUNT_GENERATION_KEY);
    }
    await tx.done;
    observedAccountGeneration = generation;
  }
  return opened;
}

async function assertCurrentGeneration(
  store: { get(key: string): Promise<unknown> },
): Promise<void> {
  const current = await store.get(ACCOUNT_GENERATION_KEY);
  if (
    observedAccountGeneration === null ||
    typeof current !== 'string' ||
    current !== observedAccountGeneration
  ) {
    accountWritesBlocked = true;
    throw new StaleAccountGenerationError();
  }
}

/** Block writes from the restoring tab while a replacement generation is staged. */
export function beginAccountRestore(): void {
  ensureWritable();
  accountWritesBlocked = true;
}

/** Re-open writes only when staging failed before a generation was committed. */
export function cancelAccountRestore(): void {
  if (!wiping) accountWritesBlocked = false;
}

/** Close the cached DB connection (so it can be deleted) and refuse further opens. Used
 *  by the account wipe; the app reloads right after, so the permanent block is fine. */
export async function closeDb(): Promise<void> {
  wiping = true;
  accountWritesBlocked = true;
  observedAccountGeneration = null;
  const p = dbp;
  dbp = null;
  try {
    (await p)?.close();
  } catch {
    /* already closed/terminated */
  }
}

/** True for the transient "the database connection is closing" / InvalidState error
 *  older Android Chrome throws when a cached connection was closed by the OS. */
function isConnectionClosing(e: unknown): boolean {
  return (
    (e instanceof DOMException && (e.name === 'InvalidStateError' || e.name === 'AbortError')) ||
    (e instanceof Error && /database connection is closing|connection is closing|closing/i.test(e.message))
  );
}

/** Run one IndexedDB op; if the connection was closing, drop it and retry ONCE on a
 *  fresh connection. Makes every store operation self-healing on flaky platforms. */
async function withDB<T>(op: (d: IDBPDatabase<ScytaleDB>) => Promise<T>): Promise<T> {
  try {
    return await op(await db());
  } catch (e) {
    if (!isConnectionClosing(e)) throw e;
    dbp = null; // discard the closing/closed connection
    return op(await db()); // reopen and try once more
  }
}

export async function loadHeader(): Promise<VaultHeader | undefined> {
  return withDB((d) => d.get('meta', 'vault'));
}

export async function saveHeader(header: VaultHeader): Promise<void> {
  ensureWritable();
  await withDB(async (d) => {
    const tx = d.transaction(['meta', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    await tx.objectStore('meta').put(header, 'vault');
    await tx.done;
  });
}

export async function loadRecord(key: string): Promise<SealedRecord | undefined> {
  return withDB((d) => d.get('records', key));
}

export async function saveRecord(key: string, record: SealedRecord): Promise<void> {
  ensureWritable();
  await withDB(async (d) => {
    const tx = d.transaction(['records', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    await tx.objectStore('records').put(record, key);
    await tx.done;
  });
}

/** Commit several sealed records in ONE IndexedDB transaction. Either every put
 * reaches disk or the transaction aborts; callers must prepare all ciphertexts
 * before entering this function. */
export async function saveRecordsAtomically(entries: ReadonlyArray<readonly [string, SealedRecord]>): Promise<void> {
  ensureWritable();
  await withDB(async (d) => {
    const tx = d.transaction(['records', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    const records = tx.objectStore('records');
    for (const [key, record] of entries) await records.put(record, key);
    await tx.done;
  });
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) if (a[i] !== b[i]) return false;
  return true;
}

function sameSealedRecord(a: SealedRecord | undefined, b: SealedRecord | undefined): boolean {
  if (!a || !b) return a === b;
  return sameBytes(a.iv, b.iv) && sameBytes(a.ct, b.ct);
}

/** Replace one sealed record iff its exact ciphertext is still the snapshot the
 * caller read. The comparison and write share one IndexedDB transaction, which
 * makes cryptographic read-modify-write operations safe across tabs/processes.
 */
export async function compareAndSwapRecord(
  key: string,
  expected: SealedRecord | undefined,
  replacement: SealedRecord,
): Promise<boolean> {
  ensureWritable();
  return withDB(async (d) => {
    const tx = d.transaction(['records', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    const records = tx.objectStore('records');
    const current = await records.get(key);
    if (!sameSealedRecord(current, expected)) {
      await tx.done;
      return false;
    }
    await records.put(replacement, key);
    await tx.done;
    return true;
  });
}

function restorePrefix(stageId: string): string {
  if (!/^[a-f0-9]{32}$/.test(stageId)) throw new Error('Ungültige Restore-Stage-ID.');
  return `${stageId}:`;
}

/** Add one already-sealed account record to an invisible restore generation. */
export async function stageRestoreRecord(stageId: string, recordKey: string, record: SealedRecord): Promise<void> {
  const key = restorePrefix(stageId) + recordKey;
  await withDB(async (d) => {
    const tx = d.transaction(['restore', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    await tx.objectStore('restore').put({ recordKey, record }, key);
    await tx.done;
  });
}

/** Remove an abandoned/incomplete restore generation without touching live state. */
export async function discardRestoreStage(stageId: string): Promise<void> {
  const prefix = restorePrefix(stageId);
  await withDB(async (d) => {
    const tx = d.transaction('restore', 'readwrite');
    let cursor = await tx.store.openCursor(IDBKeyRange.bound(prefix, prefix + '\uffff'));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  });
}

/**
 * Atomically replace the complete encrypted account-record generation.
 *
 * The cursor keeps only one staged value live at a time. IndexedDB rolls the
 * clear + every copy + stage deletion back together if any request fails, so
 * readers observe either the entire old account or the entire restored one.
 */
export async function commitRestoreStage(stageId: string): Promise<void> {
  const prefix = restorePrefix(stageId);
  const nextGeneration = newAccountGeneration();
  await withDB(async (d) => {
    const tx = d.transaction(['records', 'restore', 'kv'], 'readwrite');
    const records = tx.objectStore('records');
    const restore = tx.objectStore('restore');
    const kv = tx.objectStore('kv');
    await assertCurrentGeneration(kv);
    if (!(await restore.get(prefix + 'identity'))) {
      tx.abort();
      throw new Error('Restore-Stage enthält keine Identität.');
    }
    await records.clear();
    let cursor = await restore.openCursor(IDBKeyRange.bound(prefix, prefix + '\uffff'));
    while (cursor) {
      await records.put(cursor.value.record, cursor.value.recordKey);
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await kv.put(nextGeneration, ACCOUNT_GENERATION_KEY);
    await tx.done;
  });
  observedAccountGeneration = nextGeneration;
  generationChannel?.postMessage(nextGeneration);
}

export async function deleteRecord(key: string): Promise<void> {
  ensureWritable();
  await withDB(async (d) => {
    const tx = d.transaction(['records', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    await tx.objectStore('records').delete(key);
    await tx.done;
  });
}

/** getRandomValues caps at 65536 bytes per call — fill a larger buffer in blocks. */
function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(n);
  for (let o = 0; o < n; o += 65536) crypto.getRandomValues(out.subarray(o, Math.min(o + 65536, n)));
  return out as Uint8Array<ArrayBuffer>;
}

/**
 * Crypto-erase-friendly delete: overwrite a record with same-length random noise a
 * few times, then delete it. Used to destroy the SMALL per-item keys (attachment /
 * room keys) that gate the encrypted payload — once the key is gone the payload is
 * unrecoverable ciphertext regardless of what bytes linger physically. Honest limit:
 * on an SSD the overwrite does not reach the original flash cells (the FTL remaps and
 * wear-levels), so the guarantee is the KEY DESTRUCTION, not the physical overwrite —
 * the overwrite is a cheap best-effort gesture on a 44-byte record. See SECURITY.md.
 */
export async function secureDeleteRecord(key: string): Promise<void> {
  try {
    const rec = await loadRecord(key);
    if (rec) {
      const len = rec.ct.byteLength;
      for (let pass = 0; pass < 3; pass++) {
        await saveRecord(key, { iv: randomBytes(12), ct: randomBytes(len) });
      }
    }
  } catch {
    /* best-effort — fall through to the delete */
  }
  await deleteRecord(key);
}

/** Every record key starting with `prefix`. A real key-range scan, not a sealed
 *  index blob — an index blob would recreate exactly the "one growing blob" problem
 *  the attachment store exists to avoid. Used to enumerate an attachment's chunks
 *  and to garbage-collect orphaned ones. `￿` is the upper bound of the range. */
export async function listRecordKeys(prefix: string): Promise<string[]> {
  return withDB((d) => d.getAllKeys('records', IDBKeyRange.bound(prefix, prefix + '￿')));
}

// --- Device key (non-extractable CryptoKey, never leaves this device/profile) ---

export async function loadDeviceKey(): Promise<CryptoKey | undefined> {
  return withDB((d) => d.get('device', 'local_device_key'));
}

export async function saveDeviceKey(key: CryptoKey): Promise<void> {
  ensureWritable();
  await withDB(async (d) => {
    const tx = d.transaction(['device', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    await tx.objectStore('device').put(key, 'local_device_key');
    await tx.done;
  });
}

// --- Small plaintext key/value (lockout counters — no secrets) ---

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return withDB((d) => d.get('kv', key)) as Promise<T | undefined>;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  ensureWritable();
  if (key === ACCOUNT_GENERATION_KEY) throw new Error('Reservierter KV-Schlüssel.');
  await withDB(async (d) => {
    const tx = d.transaction('kv', 'readwrite');
    await assertCurrentGeneration(tx.store);
    await tx.store.put(value, key);
    await tx.done;
  });
}
