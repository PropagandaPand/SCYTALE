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
  device: { key: string; value: CryptoKey };
  kv: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<ScytaleDB>> | null = null;
let wiping = false; // set during an account wipe → refuse to (re)open so deleteDB isn't blocked

function db(): Promise<IDBPDatabase<ScytaleDB>> {
  if (wiping) return Promise.reject(new Error('database is being wiped'));
  if (!dbp) {
    dbp = openDB<ScytaleDB>('scytale', 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('meta');
          d.createObjectStore('records');
        }
        if (oldVersion < 2) {
          d.createObjectStore('device');
          d.createObjectStore('kv');
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
  return dbp;
}

/** Close the cached DB connection (so it can be deleted) and refuse further opens. Used
 *  by the account wipe; the app reloads right after, so the permanent block is fine. */
export async function closeDb(): Promise<void> {
  wiping = true;
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
  await withDB((d) => d.put('meta', header, 'vault'));
}

export async function loadRecord(key: string): Promise<SealedRecord | undefined> {
  return withDB((d) => d.get('records', key));
}

export async function saveRecord(key: string, record: SealedRecord): Promise<void> {
  await withDB((d) => d.put('records', record, key));
}

export async function deleteRecord(key: string): Promise<void> {
  await withDB((d) => d.delete('records', key));
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
  await withDB((d) => d.put('device', key, 'local_device_key'));
}

// --- Small plaintext key/value (lockout counters — no secrets) ---

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return withDB((d) => d.get('kv', key)) as Promise<T | undefined>;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await withDB((d) => d.put('kv', value, key));
}
