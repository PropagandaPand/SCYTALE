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

const DB_VERSION = 3;
function upgradeVaultDb(d: IDBPDatabase<ScytaleDB>, oldVersion: number): void {
  if (oldVersion < 1) {
    d.createObjectStore('meta');
    d.createObjectStore('records');
  }
  if (oldVersion < 2) {
    d.createObjectStore('device');
    d.createObjectStore('kv');
  }
  if (oldVersion < 3) {
    // Restore data is written here while the live `records` generation remains untouched.
    d.createObjectStore('restore');
  }
}

// Which IndexedDB the vault is bound to. Normally the real account ('scytale'); a fully self-
// contained DECOY account lives in 'scytale-decoy' and the app switches to it after a duress
// unlock. Both databases have the identical schema.
export type VaultDbName = 'scytale' | 'scytale-decoy';
let activeDbName: VaultDbName = 'scytale';
let dbp: Promise<IDBPDatabase<ScytaleDB>> | null = null;
let wiping = false; // set during an account wipe → refuse to (re)open so deleteDB isn't blocked
let accountWritesBlocked = false;
let observedAccountGeneration: string | null = null;
let activeRestoreToken: string | null = null;
const ACCOUNT_GENERATION_KEY = 'account-generation';
const ACCOUNT_RESTORE_LOCK_KEY = 'account-restore-lock';
const ACCOUNT_PROMOTION_FENCE_KEY = 'account-promotion-fence';
const DECOY_SOURCE_WITNESS_KEY = 'decoy-source-witness-v1';
// Raw coordination metadata owned by vaultService. Promotion preserves the
// current target lease while replacing every account-owned byte.
export const DURESS_MUTATION_LEASE_KEY = 'duress-mutation-lease-v1';
export const ACCOUNT_RESTORE_LEASE_MS = 2 * 60 * 1000;
const ACCOUNT_GENERATION_CHANNEL = 'scytale-account-generation-v1';

interface AccountRestoreLock {
  token: string;
  expiresAt: number;
}

export interface VaultPromotionFence {
  token: string;
  sourceWitness: string;
}

type AccountGenerationMessage =
  | { type: 'restore-start'; db: VaultDbName; token: string; expiresAt: number }
  | { type: 'restore-cancel'; db: VaultDbName; token: string }
  | { type: 'generation'; db: VaultDbName; generation: string };

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

function parseRestoreLock(value: unknown): AccountRestoreLock | null {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof (value as Partial<AccountRestoreLock>).token !== 'string' ||
    !/^[a-f0-9]{32}$/.test((value as AccountRestoreLock).token) ||
    !Number.isFinite((value as Partial<AccountRestoreLock>).expiresAt)
  ) {
    return null;
  }
  return value as AccountRestoreLock;
}

function freshRestoreLock(token: string): AccountRestoreLock {
  return { token, expiresAt: Date.now() + ACCOUNT_RESTORE_LEASE_MS };
}

/**
 * A foreign, unexpired lease blocks writes. An expired/malformed legacy lock is ignored by an
 * ordinary writer so a tab/browser crash cannot brick the vault forever. The restore owner itself
 * fails closed once its lease expired: another tab may already have resumed ordinary writes, so
 * committing that stale snapshot would no longer be safe.
 */
function restoreLockBlocks(value: unknown): boolean {
  if (value === undefined) return false;
  const lock = parseRestoreLock(value);
  if (!lock) return activeRestoreToken !== null;
  if (lock.expiresAt <= Date.now()) return activeRestoreToken !== null;
  return lock.token !== activeRestoreToken;
}

function parsePromotionFence(value: unknown): VaultPromotionFence | null {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof (value as Partial<VaultPromotionFence>).token !== 'string' ||
    !/^[a-f0-9]{32}$/.test((value as VaultPromotionFence).token) ||
    typeof (value as Partial<VaultPromotionFence>).sourceWitness !== 'string' ||
    !/^[a-f0-9]{64}$/.test((value as VaultPromotionFence).sourceWitness)
  ) {
    return null;
  }
  return value as VaultPromotionFence;
}

function sameBytesOptional(a: Uint8Array | undefined, b: Uint8Array | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Compare the immutable envelope that identifies one vault DEK. Mutable flags
 * (decoyArmed / biometric convenience wrap) deliberately do not participate. */
function sameVaultEnvelope(a: VaultHeader | undefined, b: VaultHeader | undefined): boolean {
  if (!a || !b) return a === b;
  return (
    a.version === b.version &&
    a.argon2?.memorySize === b.argon2?.memorySize &&
    a.argon2?.iterations === b.argon2?.iterations &&
    a.argon2?.parallelism === b.argon2?.parallelism &&
    sameBytesOptional(a.salt, b.salt) &&
    sameBytesOptional(a.wrapIv, b.wrapIv) &&
    sameBytesOptional(a.wrappedDek, b.wrappedDek) &&
    sameBytesOptional(a.deviceWrap?.iv, b.deviceWrap?.iv) &&
    sameBytesOptional(a.deviceWrap?.ciphertext, b.deviceWrap?.ciphertext)
  );
}

function sameVaultHeader(a: VaultHeader | undefined, b: VaultHeader | undefined): boolean {
  if (!sameVaultEnvelope(a, b) || !a || !b) return a === b;
  return (
    a.decoyArmed === b.decoyArmed &&
    sameBytesOptional(a.prf?.credentialId, b.prf?.credentialId) &&
    sameBytesOptional(a.prf?.salt, b.prf?.salt) &&
    sameBytesOptional(a.prf?.wrapIv, b.prf?.wrapIv) &&
    sameBytesOptional(a.prf?.wrappedDek, b.prf?.wrappedDek)
  );
}

function structurallyValidVaultHeader(header: VaultHeader | undefined): header is VaultHeader {
  return !!(
    header &&
    header.version === 1 &&
    header.argon2 &&
    Number.isFinite(header.argon2.memorySize) &&
    Number.isFinite(header.argon2.iterations) &&
    Number.isFinite(header.argon2.parallelism) &&
    header.salt instanceof Uint8Array &&
    header.salt.byteLength >= 16 &&
    header.wrapIv instanceof Uint8Array &&
    header.wrapIv.byteLength === 12 &&
    header.wrappedDek instanceof Uint8Array &&
    header.wrappedDek.byteLength >= 16
  );
}

const generationChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(ACCOUNT_GENERATION_CHANNEL)
    : null;

if (generationChannel) {
  generationChannel.onmessage = (event: MessageEvent<unknown>) => {
    const message = event.data as Partial<AccountGenerationMessage> | null;
    if (!message || typeof message !== 'object' || message.db !== activeDbName) return;
    if (
      message.type === 'restore-start' &&
      typeof message.token === 'string' &&
      typeof message.expiresAt === 'number'
    ) {
      // The durable lease is checked in the SAME IndexedDB transaction as every write. Do not set a
      // sticky RAM flag here: if the owner crashes, no cancel broadcast arrives and that flag would
      // otherwise brick this tab even after the persisted lease expires.
      return;
    }
    if (message.type === 'restore-cancel' && typeof message.token === 'string') {
      if (activeRestoreToken === null) accountWritesBlocked = false;
      return;
    }
    if (
      message.type !== 'generation' ||
      typeof message.generation !== 'string' ||
      observedAccountGeneration === null ||
      message.generation === observedAccountGeneration
    ) return;
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
    dbp = openDB<ScytaleDB>(activeDbName, DB_VERSION, {
      upgrade: upgradeVaultDb,
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
    const tx = opened.transaction(['kv', 'restore'], 'readwrite');
    const kv = tx.objectStore('kv');
    const storedGeneration = await kv.get(ACCOUNT_GENERATION_KEY);
    const generation =
      typeof storedGeneration === 'string' && /^[a-f0-9]{32}$/.test(storedGeneration)
        ? storedGeneration
        : newAccountGeneration();
    if (generation !== storedGeneration) {
      await kv.put(generation, ACCOUNT_GENERATION_KEY);
    }
    // Safe crash recovery: staging is invisible until commit. If its lease expired (or is the
    // pre-lease legacy string format), discard only that invisible stage and release the fence.
    const storedRestoreLock = await kv.get(ACCOUNT_RESTORE_LOCK_KEY);
    const parsedRestoreLock = parseRestoreLock(storedRestoreLock);
    if (
      storedRestoreLock !== undefined &&
      (!parsedRestoreLock || parsedRestoreLock.expiresAt <= Date.now())
    ) {
      await tx.objectStore('restore').clear();
      await kv.delete(ACCOUNT_RESTORE_LOCK_KEY);
    }
    await tx.done;
    observedAccountGeneration = generation;
  }
  return opened;
}

async function assertCurrentGeneration(
  store: { get(key: string): Promise<unknown> },
): Promise<void> {
  const [current, restoreLock, promotionFence] = await Promise.all([
    store.get(ACCOUNT_GENERATION_KEY),
    store.get(ACCOUNT_RESTORE_LOCK_KEY),
    store.get(ACCOUNT_PROMOTION_FENCE_KEY),
  ]);
  const generationChanged =
    observedAccountGeneration === null ||
    typeof current !== 'string' ||
    current !== observedAccountGeneration;
  const fenced = promotionFence !== undefined;
  const foreignRestore = restoreLockBlocks(restoreLock);
  if (generationChanged || fenced || foreignRestore) {
    // A generation mismatch or a promotion fence is PERMANENT for this tab (the account was replaced
    // or is being promoted) — latch so every later write fails closed without re-reading. A foreign
    // restore lease is only TRANSIENT: once it is cancelled or expires, ordinary writes are safe
    // again. Do NOT latch on that alone — otherwise a crashed restore whose cancel broadcast never
    // arrives (or a tab with no BroadcastChannel) would brick this tab's writes until manual reload
    // even after the durable lease is long gone. Throwing without latching lets the very next write
    // re-derive the block state from the durable generation + lease and recover automatically. (This
    // is exactly the trap the restore-start handler at line ~193 already avoids.)
    if (generationChanged || fenced) accountWritesBlocked = true;
    throw new StaleAccountGenerationError();
  }
}

/** Persist a cross-tab restore fence before staging. Every ordinary write checks
 * this key in the same transaction as its generation and therefore fails closed
 * even if BroadcastChannel delivery is delayed or unavailable. */
export async function beginAccountRestore(): Promise<void> {
  ensureWritable();
  const token = newAccountGeneration();
  await withDB(async (d) => {
    const tx = d.transaction(['kv', 'restore'], 'readwrite');
    const kv = tx.objectStore('kv');
    await assertCurrentGeneration(kv);
    // An active foreign lease was rejected above. Anything still in the invisible
    // stage is therefore abandoned (including a lock-less stage left by a prior
    // discard abort) and must not accumulate forever.
    await tx.objectStore('restore').clear();
    const lock = freshRestoreLock(token);
    await kv.put(lock, ACCOUNT_RESTORE_LOCK_KEY);
    await tx.done;
  });
  activeRestoreToken = token;
  accountWritesBlocked = true;
  generationChannel?.postMessage({
    type: 'restore-start',
    db: activeDbName,
    token,
    expiresAt: Date.now() + ACCOUNT_RESTORE_LEASE_MS,
  } satisfies AccountGenerationMessage);
}

/** Re-open writes only when staging failed before a generation was committed. */
export async function cancelAccountRestore(): Promise<void> {
  const token = activeRestoreToken;
  if (!token) {
    if (!wiping) accountWritesBlocked = false;
    return;
  }
  await withDB(async (d) => {
    const tx = d.transaction(['kv', 'restore'], 'readwrite');
    const kv = tx.objectStore('kv');
    const lock = await kv.get(ACCOUNT_RESTORE_LOCK_KEY);
    if (parseRestoreLock(lock)?.token === token || lock === token) {
      // Releasing the lease and deleting every invisible staged byte are one
      // atomic action; a crash cannot leave a large lock-less stage behind.
      await tx.objectStore('restore').clear();
      await kv.delete(ACCOUNT_RESTORE_LOCK_KEY);
    }
    await tx.done;
  });
  activeRestoreToken = null;
  if (!wiping) accountWritesBlocked = false;
  generationChannel?.postMessage({
    type: 'restore-cancel',
    db: activeDbName,
    token,
  } satisfies AccountGenerationMessage);
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

/** The IndexedDB the vault is currently bound to ('scytale' or 'scytale-decoy'). */
export function currentDbName(): VaultDbName {
  return activeDbName;
}

/** Switch the active vault database (real ↔ decoy). Closes the current connection, drops the
 *  cached handle + per-DB generation, and clears the wipe/write-block flags so the target DB is
 *  usable. The caller MUST have unmounted the previous account's UI first (only one account is
 *  ever live at a time) — so nothing writes to the wrong database across the switch. Used after a
 *  duress unlock (switch to the decoy once the real DB is deleted) and by the in-app decoy flow. */
export async function switchVaultDb(name: VaultDbName): Promise<void> {
  const p = dbp;
  dbp = null;
  // Repoint synchronously before awaiting the old handle. A lock/account-switch
  // caller may render the next screen immediately; no operation issued from that
  // screen may still target the outgoing database during this await.
  activeDbName = name;
  observedAccountGeneration = null;
  activeRestoreToken = null;
  wiping = false;
  accountWritesBlocked = false;
  try {
    (await p)?.close();
  } catch {
    /* already closed/terminated */
  }
}

/** Open a SPECIFIC vault database in isolation (its own short-lived connection, NOT the global
 *  active handle), run `fn`, then close it. Used to provision / probe / unlock the DECOY database
 *  while the REAL database stays the live active one — so a concurrent write from the live account
 *  can never land in the wrong database. No generation bookkeeping: these are one-off operations. */
export async function withVaultDb<T>(
  name: VaultDbName,
  fn: (d: IDBPDatabase<ScytaleDB>) => Promise<T>,
): Promise<T> {
  const d = await openDB<ScytaleDB>(name, DB_VERSION, { upgrade: upgradeVaultDb });
  try {
    return await fn(d);
  } finally {
    d.close();
  }
}

export interface VaultDbEnvelope {
  header: VaultHeader;
  deviceKey?: CryptoKey;
}

/**
 * Read a named vault without confusing a schema-only IndexedDB shell with a real vault.
 *
 * `indexedDB.databases()` is only an existence hint; a stale tab can recreate an empty database
 * after a delete. We therefore always verify the header. Storage/API errors deliberately propagate:
 * destructive recovery must distinguish "confirmed absent" from "could not inspect".
 */
export async function loadVaultDbEnvelope(name: VaultDbName): Promise<VaultDbEnvelope | null> {
  const list = await indexedDB.databases?.();
  if (list && !list.some((candidate) => candidate.name === name)) return null;

  const d = await openDB<ScytaleDB>(name, DB_VERSION, {
    upgrade(opened, oldVersion) {
      upgradeVaultDb(opened, oldVersion);
    },
  });
  try {
    const tx = d.transaction(['meta', 'device'], 'readonly');
    const [header, deviceKey] = await Promise.all([
      tx.objectStore('meta').get('vault'),
      tx.objectStore('device').get('local_device_key'),
    ]);
    await tx.done;
    if (!header) return null;
    return { header, deviceKey };
  } finally {
    d.close();
  }
}

/** Confirmed header-bearing existence; throws when the storage state could not be inspected. */
export async function vaultDbExists(name: VaultDbName): Promise<boolean> {
  return (await loadVaultDbEnvelope(name)) !== null;
}

/**
 * Bind a non-expiring promotion fence to the exact source envelope already unlocked by the caller.
 * Every ordinary write checks this dedicated key in its own transaction. It intentionally does NOT
 * reuse the expiring restore lease: a large decoy migration must never resume writes halfway through.
 */
export async function fenceVaultDbWrites(
  name: VaultDbName,
  fence: VaultPromotionFence,
  expectedHeader: VaultHeader,
): Promise<void> {
  if (!parsePromotionFence(fence)) throw new Error('Ungültiger Promotion-Fence.');
  await withVaultDb(name, async (d) => {
    const tx = d.transaction(['meta', 'device', 'kv'], 'readwrite');
    const meta = tx.objectStore('meta');
    const device = tx.objectStore('device');
    const kv = tx.objectStore('kv');
    const [storedHeader, storedDeviceKey] = await Promise.all([
      meta.get('vault'),
      device.get('local_device_key'),
    ]);
    if (
      !structurallyValidVaultHeader(storedHeader) ||
      !storedHeader.deviceWrap ||
      !storedDeviceKey ||
      !sameVaultEnvelope(storedHeader, expectedHeader)
    ) {
      tx.abort();
      throw new Error('Decoy-Quelle ist nicht der zuvor entsperrte Tresor.');
    }
    await kv.put(fence.sourceWitness, DECOY_SOURCE_WITNESS_KEY);
    await kv.put(fence, ACCOUNT_PROMOTION_FENCE_KEY);
    await tx.done;
  });
}

/** Surgically delete ONE vault database. Returns true only when deletion was
 * durably confirmed. A timed-out request may remain queued in IndexedDB; callers
 * performing promotion MUST retain their recovery journal and forbid re-arming
 * until a later retry confirms completion. Never enqueue a redundant fallback:
 * multiple delayed deletes could otherwise target a freshly recreated vault. */
export async function deleteVaultDb(name: VaultDbName): Promise<boolean> {
  if (activeDbName === name) {
    const p = dbp;
    dbp = null;
    try {
      (await p)?.close();
    } catch {
      /* already closed */
    }
  }
  const { deleteDB } = await import('idb');
  return Promise.race([
    deleteDB(name, { blocked: () => undefined }).then(
      () => true,
      () => false,
    ),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 2000)),
  ]);
}

type VaultStoreName = 'meta' | 'records' | 'restore' | 'device' | 'kv';
const VAULT_STORE_NAMES: VaultStoreName[] = ['meta', 'records', 'restore', 'device', 'kv'];
const VAULT_COPY_BATCH = 8;

/**
 * Irreversibly neutralize a named vault without issuing a deleteDatabase request.
 * This is the safe remove-duress primitive: it cannot leave a queued delete that
 * later destroys a freshly re-armed decoy after another tab finally closes.
 */
export async function neutralizeVaultDb(name: VaultDbName): Promise<void> {
  const list = await indexedDB.databases?.();
  if (list && !list.some((candidate) => candidate.name === name)) return;
  await withVaultDb(name, async (d) => {
    const tx = d.transaction(VAULT_STORE_NAMES, 'readwrite');
    for (const storeName of VAULT_STORE_NAMES) await tx.objectStore(storeName).clear();
    // Keep a fresh generation tombstone. Stale tabs that still hold the old
    // generation fail closed instead of recreating records in the empty shell.
    await tx.objectStore('kv').put(newAccountGeneration(), ACCOUNT_GENERATION_KEY);
    await tx.done;
  });
}

async function copyVaultStore<Name extends VaultStoreName>(
  src: IDBPDatabase<ScytaleDB>,
  dst: IDBPDatabase<ScytaleDB>,
  storeName: Name,
): Promise<void> {
  let after: string | undefined;
  for (;;) {
    const readTx = src.transaction(storeName, 'readonly');
    const rows: Array<{
      key: ScytaleDB[Name]['key'];
      value: ScytaleDB[Name]['value'];
    }> = [];
    let cursor = await readTx.store.openCursor(
      after === undefined ? undefined : IDBKeyRange.lowerBound(after, true),
    );
    while (cursor && rows.length < VAULT_COPY_BATCH) {
      if (typeof cursor.key !== 'string') throw new Error('Ungültiger Tresor-Schlüssel bei der Promotion.');
      const key = cursor.key as ScytaleDB[Name]['key'];
      rows.push({ key, value: cursor.value });
      after = cursor.key;
      if (rows.length < VAULT_COPY_BATCH) cursor = await cursor.continue();
    }
    await readTx.done;
    if (rows.length === 0) return;

    const writeTx = dst.transaction(storeName, 'readwrite');
    for (const row of rows) {
      // Source-only coordination metadata must not become a permanent lock or
      // an at-rest "decoy" label in the canonical target.
      if (
        storeName === 'kv' &&
        (row.key === ACCOUNT_RESTORE_LOCK_KEY ||
          row.key === ACCOUNT_PROMOTION_FENCE_KEY ||
          row.key === DECOY_SOURCE_WITNESS_KEY ||
          row.key === DURESS_MUTATION_LEASE_KEY)
      ) continue;
      await writeTx.store.put(row.value, row.key);
    }
    await writeTx.done;
    if (rows.length < VAULT_COPY_BATCH) return;
  }
}

/** Move an ENTIRE vault database into another slot: fence source writes, CLEAR
 * the target's stores, then copy every record in small bounded batches.
 *
 * Used to promote the decoy into the canonical 'scytale' name after a duress
 * wipe. A single getAll() would materialize every encrypted attachment and can
 * OOM precisely when the decoy is realistically populated. The source fence is
 * checked by every normal write transaction, so the batches form one stable
 * snapshot even if another tab still displays the decoy. The external promotion
 * marker makes the multi-transaction target copy idempotently crash-recoverable.
 * `from` stays intact until the caller confirms and deletes it. */
export async function migrateVaultDb(
  from: VaultDbName,
  to: VaultDbName,
  expectedFence: VaultPromotionFence,
  expectedHeader: VaultHeader,
): Promise<void> {
  if (from === to) throw new Error('Quell- und Ziel-Tresor dürfen nicht identisch sein.');
  if (!parsePromotionFence(expectedFence)) throw new Error('Ungültiger Promotion-Fence.');
  await withVaultDb(from, async (src) => {
    const assertStableSource = async (): Promise<void> => {
      const tx = src.transaction(['meta', 'device', 'kv'], 'readonly');
      const [header, deviceKey, fence, witness] = await Promise.all([
        tx.objectStore('meta').get('vault'),
        tx.objectStore('device').get('local_device_key'),
        tx.objectStore('kv').get(ACCOUNT_PROMOTION_FENCE_KEY),
        tx.objectStore('kv').get(DECOY_SOURCE_WITNESS_KEY),
      ]);
      await tx.done;
      if (
        !structurallyValidVaultHeader(header) ||
        !header.deviceWrap ||
        !deviceKey ||
        !sameVaultEnvelope(header, expectedHeader) ||
        parsePromotionFence(fence)?.token !== expectedFence.token ||
        parsePromotionFence(fence)?.sourceWitness !== expectedFence.sourceWitness ||
        witness !== expectedFence.sourceWitness
      ) {
        throw new Error('Decoy-Quelle wurde während der Promotion verändert.');
      }
    };
    // Validate the exact, persistently fenced source before touching a single
    // byte of the canonical target.
    await assertStableSource();

    await withVaultDb(to, async (dst) => {
      // One transaction removes the whole previous target generation. From this
      // point stale real-account tabs see a missing/mismatched generation and
      // fail closed on their next write.
      const clearTx = dst.transaction(VAULT_STORE_NAMES, 'readwrite');
      const targetKv = clearTx.objectStore('kv');
      const mutationLease = await targetKv.get(DURESS_MUTATION_LEASE_KEY);
      for (const storeName of VAULT_STORE_NAMES) await clearTx.objectStore(storeName).clear();
      if (mutationLease !== undefined) {
        await targetKv.put(mutationLease, DURESS_MUTATION_LEASE_KEY);
      }
      await clearTx.done;

      for (const storeName of VAULT_STORE_NAMES) {
        await copyVaultStore(src, dst, storeName);
      }
    });
    // Raw/legacy cross-tab code does not use the ordinary write helpers. If it
    // replaced the decoy despite the fence, never declare the mixed copy done.
    await assertStableSource();
  });
}

/** True for the transient "the database connection is closing" / InvalidState error
 *  older Android Chrome throws when a cached connection was closed by the OS. */
function isConnectionClosing(e: unknown): boolean {
  return (
    (e instanceof DOMException && (e.name === 'InvalidStateError' || e.name === 'AbortError')) ||
    (e instanceof Error && /database connection is closing|connection is closing|closing/i.test(e.message))
  );
}

// A serialized inbox/ratchet task pins itself to the account it was ENQUEUED under (see
// Messenger.enqueueInbox). While a pin is set, EVERY db op fails closed if the active DB was
// switched (real ↔ decoy) underneath — closing the gap the per-op pin below leaves: an op ISSUED
// after the switch completes would otherwise capture the NEW db as `issued` and see no mismatch, so
// a task that straddles an auto-lock/background switch could persist the outgoing account's DEK-
// sealed records into the incoming database at any await point past the first. Inbox tasks are
// serialized (one queue), so a single module slot is sufficient.
let pinnedTaskDb: VaultDbName | null = null;
export function pinTaskAccount(name: VaultDbName): void {
  pinnedTaskDb = name;
}
export function clearTaskAccount(): void {
  pinnedTaskDb = null;
}

/** Run one IndexedDB op; if the connection was closing, drop it and retry ONCE on a
 *  fresh connection. Makes every store operation self-healing on flaky platforms.
 *
 *  ACCOUNT-SWITCH SAFETY: two layers. (1) The task pin (pinnedTaskDb): while an inbox/ratchet task
 *  is running, an op whose active DB no longer matches the account the task was enqueued under fails
 *  closed — covers a switch that completed BEFORE this op was issued, at any await point. (2) The
 *  per-op pin (`issued`): covers a switch that lands DURING this op. Either way the op FAILS CLOSED
 *  (StaleAccountGenerationError) instead of silently retargeting the other DB — otherwise a record
 *  sealed under the previous account's DEK could land in the new account's database. */
async function withDB<T>(op: (d: IDBPDatabase<ScytaleDB>) => Promise<T>): Promise<T> {
  if (pinnedTaskDb !== null && activeDbName !== pinnedTaskDb) throw new StaleAccountGenerationError();
  const issued = activeDbName;
  const pinned = (d: IDBPDatabase<ScytaleDB>): IDBPDatabase<ScytaleDB> => {
    if (activeDbName !== issued) throw new StaleAccountGenerationError();
    return d;
  };
  try {
    return await op(pinned(await db()));
  } catch (e) {
    if (activeDbName !== issued) throw new StaleAccountGenerationError();
    if (!isConnectionClosing(e)) throw e;
    dbp = null; // discard the closing/closed connection
    return op(pinned(await db())); // reopen (same active DB) and try once more
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

/** Replace the header only if no sibling tab changed any field since `expected`
 * was read. This prevents duress/biometric settings from silently clobbering
 * one another with stale whole-header snapshots. */
export async function compareAndSwapHeader(
  expected: VaultHeader,
  replacement: VaultHeader,
): Promise<boolean> {
  ensureWritable();
  return withDB(async (d) => {
    const tx = d.transaction(['meta', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    const meta = tx.objectStore('meta');
    if (!sameVaultHeader(await meta.get('vault'), expected)) {
      await tx.done;
      return false;
    }
    await meta.put(replacement, 'vault');
    await tx.done;
    return true;
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
  return compareAndSwapRecords([[key, expected]], [[key, replacement]]);
}

/** Multi-record CAS. Every expected ciphertext is checked before any
 * replacement is written, in the same transaction. */
export async function compareAndSwapRecords(
  expected: ReadonlyArray<readonly [string, SealedRecord | undefined]>,
  replacements: ReadonlyArray<readonly [string, SealedRecord]>,
): Promise<boolean> {
  return compareAndSwapRecordsWithDeletes(expected, replacements, []);
}

/**
 * Multi-record CAS that may also delete named records in the same transaction.
 * Used for protocol transitions where leaving either the new authority or the
 * old coordination blocker behind would deadlock or fork state.
 */
export async function compareAndSwapRecordsWithDeletes(
  expected: ReadonlyArray<readonly [string, SealedRecord | undefined]>,
  replacements: ReadonlyArray<readonly [string, SealedRecord]>,
  deletions: ReadonlyArray<string>,
): Promise<boolean> {
  const replacementKeys = new Set(replacements.map(([key]) => key));
  const expectedKeys = new Set(expected.map(([key]) => key));
  if (deletions.some((key) => replacementKeys.has(key))) {
    throw new Error('Ein CAS-Key darf nicht gleichzeitig ersetzt und gelöscht werden.');
  }
  if (deletions.some((key) => !expectedKeys.has(key))) {
    throw new Error('Jeder gelöschte CAS-Key braucht einen exakten Erwartungswert.');
  }
  ensureWritable();
  return withDB(async (d) => {
    const tx = d.transaction(['records', 'kv'], 'readwrite');
    await assertCurrentGeneration(tx.objectStore('kv'));
    const records = tx.objectStore('records');
    for (const [key, snapshot] of expected) {
      if (!sameSealedRecord(await records.get(key), snapshot)) {
        await tx.done;
        return false;
      }
    }
    for (const [key, replacement] of replacements) await records.put(replacement, key);
    for (const key of deletions) await records.delete(key);
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
    const kv = tx.objectStore('kv');
    await assertCurrentGeneration(kv);
    await tx.objectStore('restore').put({ recordKey, record }, key);
    if (!activeRestoreToken) {
      tx.abort();
      throw new StaleAccountGenerationError();
    }
    await kv.put(freshRestoreLock(activeRestoreToken), ACCOUNT_RESTORE_LOCK_KEY);
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
  const restoreToken = activeRestoreToken;
  if (!restoreToken) throw new StaleAccountGenerationError();
  await withDB(async (d) => {
    const tx = d.transaction(['records', 'restore', 'kv'], 'readwrite');
    const records = tx.objectStore('records');
    const restore = tx.objectStore('restore');
    const kv = tx.objectStore('kv');
    await assertCurrentGeneration(kv);
    if (parseRestoreLock(await kv.get(ACCOUNT_RESTORE_LOCK_KEY))?.token !== restoreToken) {
      tx.abort();
      throw new StaleAccountGenerationError();
    }
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
    await kv.delete(ACCOUNT_RESTORE_LOCK_KEY);
    await tx.done;
  });
  observedAccountGeneration = nextGeneration;
  activeRestoreToken = null;
  generationChannel?.postMessage({
    type: 'generation',
    db: activeDbName,
    generation: nextGeneration,
  } satisfies AccountGenerationMessage);
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

/** Best-effort secure overwrite of the vault header (meta/'vault' — the wrapped DEK) before an
 *  irreversible wipe. Overwrites it with random bytes a few times so a flash-recovered image is
 *  less likely to still hold the real wrapped DEK. Same honest SSD caveat as secureDeleteRecord:
 *  the guarantee is the KEY DESTRUCTION (the header is then deleted with the DB), the overwrite
 *  is only a cheap best-effort gesture. Used by the duress wipe. */
export async function secureOverwriteHeader(): Promise<void> {
  try {
    const cur = await loadHeader();
    const len = cur?.wrappedDek?.byteLength ?? 48;
    for (let pass = 0; pass < 3; pass++) {
      const garbage = {
        version: 1,
        argon2: cur?.argon2 ?? { memorySize: 65536, iterations: 3, parallelism: 1 },
        salt: randomBytes(16),
        wrapIv: randomBytes(12),
        wrappedDek: randomBytes(len),
      } as unknown as VaultHeader;
      await withDB(async (d) => {
        const tx = d.transaction('meta', 'readwrite');
        await tx.objectStore('meta').put(garbage, 'vault');
        await tx.done;
      });
    }
  } catch {
    /* best-effort */
  }
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
  if (
    key === ACCOUNT_GENERATION_KEY ||
    key === ACCOUNT_RESTORE_LOCK_KEY ||
    key === ACCOUNT_PROMOTION_FENCE_KEY ||
    key === DECOY_SOURCE_WITNESS_KEY ||
    key === DURESS_MUTATION_LEASE_KEY
  ) throw new Error('Reservierter KV-Schlüssel.');
  await withDB(async (d) => {
    const tx = d.transaction('kv', 'readwrite');
    await assertCurrentGeneration(tx.store);
    await tx.store.put(value, key);
    await tx.done;
  });
}
