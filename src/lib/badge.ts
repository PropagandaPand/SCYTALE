/**
 * App-icon badge (the little red number on the installed PWA icon), via the Badging
 * API. Shared by the window (authoritative unread count) and the service worker
 * (which only knows "one more arrived" on a content-free push). The count is kept in
 * a tiny dedicated IndexedDB so both contexts agree; raw IDB keeps this dependency-
 * free so the hand-written service worker can import it too.
 *
 * Everything is best-effort: on browsers without the Badging API (or when the PWA
 * isn't installed / lacks notification permission) it silently no-ops.
 */
const DB = 'scytale-badge';
const STORE = 'kv';
const KEY = 'count';

function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    };
  });
}

export async function getBadgeCount(): Promise<number> {
  try {
    return (await withStore<number>('readonly', (s) => s.get(KEY) as IDBRequest<number>)) ?? 0;
  } catch {
    return 0;
  }
}

async function putCount(n: number): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(n, KEY) as IDBRequest);
  } catch {
    /* storage unavailable — the icon still updated */
  }
}

function paint(n: number): void {
  try {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (n > 0) void nav.setAppBadge?.(n)?.catch(() => {});
    else void nav.clearAppBadge?.()?.catch(() => {});
  } catch {
    /* Badging API unsupported */
  }
}

/** Set the badge to an EXACT count — the running app is the source of truth. */
export async function applyBadge(n: number): Promise<void> {
  paint(n);
  await putCount(n);
}

/** Increment by one — used by the service worker on a content-free push, where the
 *  app is closed and the exact unread count isn't known. The app corrects it on
 *  next open via applyBadge(). */
export async function bumpBadge(): Promise<void> {
  const n = (await getBadgeCount()) + 1;
  paint(n);
  await putCount(n);
}
