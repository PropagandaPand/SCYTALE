import { DurableObject } from 'cloudflare:workers';

interface BlobQuotaEnv {
  BLOBS: R2Bucket;
}

interface ReservationRow {
  [column: string]: string | number;
  object_key: string;
  upload_id: string;
  token_hash: string;
  actor_hash: string;
  reserved_bytes: number;
  expires_at: number;
  state: string;
  op_version: number;
  retry_count: number;
}

interface QuotaStateRow {
  [column: string]: string | number | null;
  completed_bytes: number;
  completed_objects: number;
  reconciled_at: number;
  mutation_version: number;
  reconcile_token: string | null;
  reconcile_lock_until: number;
  baseline_ready: number;
}

interface BucketSnapshot {
  bytes: number;
  objects: number;
  keys: Set<string>;
  complete: boolean;
}

export interface ReservationResult {
  ok: boolean;
  reason?: 'actor_limit' | 'storage_full' | 'unavailable';
  expiresAt?: number;
}

export interface CompletionClaim {
  reservedBytes: number;
  operation: number;
}

const STORAGE_BUDGET = 9 * 1024 * 1024 * 1024;
const ACTOR_BUDGET = 2200 * 1024 * 1024;
const MAX_ACTOR_UPLOADS = 4;
const MAX_ACTOR_OBJECTS = 256;
const MAX_GLOBAL_UPLOADS = 64;
const MAX_GLOBAL_OBJECTS = 4096;
const RESERVATION_TTL_MS = 6 * 60 * 60 * 1000;
const COMPLETING_GRACE_MS = 15 * 60 * 1000;
const RECONCILE_INTERVAL_MS = 60 * 60 * 1000;
const RECONCILE_LOCK_MS = 5 * 60 * 1000;
const CLEANUP_RETRY_BASE_MS = 5000;
const CLEANUP_RETRY_MAX_MS = 60 * 60 * 1000;
const CLEANUP_BATCH = 8;
const LEDGER_VERIFY_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const KEY_RE = /^[a-f0-9]{32}$/;
const ACTOR_RE = /^[a-f0-9]{64}$/;

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

function hexToBytes(value: string): Uint8Array {
  if (!/^[a-f0-9]{64}$/.test(value)) return new Uint8Array(0);
  const out = new Uint8Array(32);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hashToken(token: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
}

function isMissingMultipart(error: unknown): boolean {
  return error instanceof Error && /\(10024\)\s*$/.test(error.message);
}

function retryDelay(attempt: number): number {
  return Math.min(CLEANUP_RETRY_MAX_MS, CLEANUP_RETRY_BASE_MS * 2 ** Math.min(attempt, 10));
}

/**
 * Strongly-consistent coordinator for account, actor, and object-count limits.
 *
 * Invariants:
 * - a reservation remains charged until an R2 abort/delete is confirmed;
 * - commit atomically moves it into the completed-object actor ledger;
 * - an R2 list snapshot is applied only if no completion crossed the scan;
 * - stale or ambiguous accounting fails closed.
 */
export class BlobQuota extends DurableObject<BlobQuotaEnv> {
  private reconcileInFlight: Promise<QuotaStateRow | null> | null = null;

  constructor(ctx: DurableObjectState, env: BlobQuotaEnv) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS upload_reservations (
        object_key TEXT PRIMARY KEY,
        upload_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        actor_hash TEXT NOT NULL,
        reserved_bytes INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'active',
        op_version INTEGER NOT NULL DEFAULT 0,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS upload_reservations_actor
        ON upload_reservations(actor_hash);
      CREATE INDEX IF NOT EXISTS upload_reservations_expiry
        ON upload_reservations(expires_at);
      CREATE TABLE IF NOT EXISTS upload_parts (
        object_key TEXT NOT NULL,
        part_number INTEGER NOT NULL,
        bytes INTEGER NOT NULL,
        PRIMARY KEY (object_key, part_number)
      );
      CREATE TABLE IF NOT EXISTS completed_objects (
        object_key TEXT PRIMARY KEY,
        actor_hash TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        completed_at INTEGER NOT NULL,
        verify_after INTEGER NOT NULL,
        upload_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        op_version INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS completed_objects_actor
        ON completed_objects(actor_hash);
      CREATE INDEX IF NOT EXISTS completed_objects_verify
        ON completed_objects(verify_after);
      CREATE TABLE IF NOT EXISTS quota_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        completed_bytes INTEGER NOT NULL,
        completed_objects INTEGER NOT NULL,
        reconciled_at INTEGER NOT NULL,
        mutation_version INTEGER NOT NULL,
        reconcile_token TEXT,
        reconcile_lock_until INTEGER NOT NULL,
        baseline_ready INTEGER NOT NULL
      );
    `);
    // Backward-compatible internal schema migration for already-created BlobQuota
    // objects. ALTER throws only when the column is already present.
    for (const statement of [
      "ALTER TABLE upload_reservations ADD COLUMN state TEXT NOT NULL DEFAULT 'active'",
      'ALTER TABLE upload_reservations ADD COLUMN op_version INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE upload_reservations ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE completed_objects ADD COLUMN upload_id TEXT',
      'ALTER TABLE completed_objects ADD COLUMN token_hash TEXT',
      'ALTER TABLE completed_objects ADD COLUMN op_version INTEGER',
    ]) {
      try {
        this.ctx.storage.sql.exec(statement);
      } catch {
        /* column already present */
      }
    }
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO quota_state
         (id, completed_bytes, completed_objects, reconciled_at, mutation_version,
          reconcile_token, reconcile_lock_until, baseline_ready)
       VALUES (1, 0, 0, 0, 0, NULL, 0, 0)`,
    );
    // Preserve the old global byte estimate, but force a fresh baseline because
    // the legacy table did not know object count or actor ownership.
    try {
      this.ctx.storage.sql.exec(
        `UPDATE quota_state
            SET completed_bytes = COALESCE(
              (SELECT completed_bytes FROM blob_quota_meta WHERE id = 1),
              completed_bytes
            ),
                reconciled_at = 0
          WHERE id = 1 AND baseline_ready = 0 AND completed_bytes = 0`,
      );
    } catch {
      /* fresh installs have no legacy blob_quota_meta table */
    }
  }

  private state(): QuotaStateRow {
    return this.ctx.storage.sql
      .exec<QuotaStateRow>(
        `SELECT completed_bytes, completed_objects, reconciled_at,
                mutation_version, reconcile_token, reconcile_lock_until,
                baseline_ready
           FROM quota_state WHERE id = 1`,
      )
      .one();
  }

  private unsettledCompletions(): number {
    return this.ctx.storage.sql
      .exec<{ n: number }>(
        `SELECT COUNT(*) AS n FROM upload_reservations
          WHERE state IN ('completing', 'completion_cleanup')`,
      )
      .one().n;
  }

  private validTokenHash(row: ReservationRow, tokenHash: Uint8Array): boolean {
    const expected = hexToBytes(row.token_hash);
    if (expected.length !== 32 || tokenHash.length !== 32) return false;
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ tokenHash[i];
    return difference === 0;
  }

  private reservation(objectKey: string, uploadId: string): ReservationRow | undefined {
    return this.ctx.storage.sql
      .exec<ReservationRow>(
        `SELECT object_key, upload_id, token_hash, actor_hash, reserved_bytes,
                expires_at, state, op_version, retry_count
           FROM upload_reservations
          WHERE object_key = ? AND upload_id = ?`,
        objectKey,
        uploadId,
      )
      .toArray()[0];
  }

  private bumpMutation(): void {
    this.ctx.storage.sql.exec(
      'UPDATE quota_state SET mutation_version = mutation_version + 1 WHERE id = 1',
    );
  }

  private markExpired(now: number): void {
    this.ctx.storage.transactionSync(() => {
      const active = this.ctx.storage.sql
        .exec<{ n: number }>(
          `SELECT COUNT(*) AS n FROM upload_reservations
            WHERE state = 'active' AND expires_at <= ?`,
          now,
        )
        .one().n;
      const completing = this.ctx.storage.sql
        .exec<{ n: number }>(
          `SELECT COUNT(*) AS n FROM upload_reservations
            WHERE state = 'completing' AND expires_at <= ?`,
          now,
        )
        .one().n;
      if (active > 0) {
        this.ctx.storage.sql.exec(
          `UPDATE upload_reservations
              SET state = 'abort_pending', expires_at = ?, retry_count = 0
            WHERE state = 'active' AND expires_at <= ?`,
          now,
          now,
        );
      }
      if (completing > 0) {
        this.ctx.storage.sql.exec(
          `UPDATE upload_reservations
              SET state = 'completion_cleanup', expires_at = ?, retry_count = 0
            WHERE state = 'completing' AND expires_at <= ?`,
          now,
          now,
        );
      }
      if (active + completing > 0) this.bumpMutation();
    });
  }

  private async scanBucket(): Promise<BucketSnapshot> {
    let bytes = 0;
    let objects = 0;
    let cursor: string | undefined;
    const keys = new Set<string>();
    do {
      const page = await this.env.BLOBS.list({ cursor, limit: 1000 });
      for (const object of page.objects) {
        if (!Number.isSafeInteger(object.size) || object.size < 0) throw new Error('invalid R2 size');
        bytes += object.size;
        objects++;
        if (!Number.isSafeInteger(bytes)) throw new Error('R2 size overflow');
        if (bytes > STORAGE_BUDGET || objects > MAX_GLOBAL_OBJECTS) {
          return { bytes, objects, keys, complete: false };
        }
        keys.add(object.key);
      }
      if (page.truncated && !page.cursor) throw new Error('truncated R2 listing without cursor');
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return { bytes, objects, keys, complete: true };
  }

  private async reconcile(now: number): Promise<QuotaStateRow | null> {
    const start = this.ctx.storage.transactionSync(() => {
      const current = this.state();
      if (
        current.baseline_ready === 1 &&
        now - current.reconciled_at < RECONCILE_INTERVAL_MS
      ) {
        return { current, token: null, version: current.mutation_version };
      }
      if (current.reconcile_lock_until > now || this.unsettledCompletions() > 0) return null;
      const token = crypto.randomUUID();
      this.ctx.storage.sql.exec(
        `UPDATE quota_state
            SET reconcile_token = ?, reconcile_lock_until = ?
          WHERE id = 1`,
        token,
        now + RECONCILE_LOCK_MS,
      );
      return { current: null, token, version: current.mutation_version };
    });
    if (!start) return null;
    if (start.current) return start.current;

    try {
      const snapshot = await this.scanBucket();
      return this.ctx.storage.transactionSync(() => {
        const current = this.state();
        if (
          current.reconcile_token !== start.token ||
          current.mutation_version !== start.version ||
          this.unsettledCompletions() > 0
        ) {
          if (current.reconcile_token === start.token) {
            this.ctx.storage.sql.exec(
              `UPDATE quota_state
                  SET reconcile_token = NULL, reconcile_lock_until = 0, reconciled_at = 0
                WHERE id = 1`,
            );
          }
          return null;
        }

        this.ctx.storage.sql.exec(
          `UPDATE quota_state
              SET completed_bytes = ?, completed_objects = ?, reconciled_at = ?,
                  reconcile_token = NULL, reconcile_lock_until = 0, baseline_ready = 1
            WHERE id = 1`,
          snapshot.bytes,
          snapshot.objects,
          now,
        );
        if (snapshot.complete) {
          const expired = this.ctx.storage.sql
            .exec<{ object_key: string }>(
              'SELECT object_key FROM completed_objects WHERE verify_after <= ?',
              now,
            )
            .toArray();
          for (const row of expired) {
            if (!snapshot.keys.has(row.object_key)) {
              this.ctx.storage.sql.exec(
                'DELETE FROM completed_objects WHERE object_key = ?',
                row.object_key,
              );
            }
          }
        }
        return this.state();
      });
    } catch {
      this.ctx.storage.transactionSync(() => {
        const current = this.state();
        if (current.reconcile_token === start.token) {
          this.ctx.storage.sql.exec(
            `UPDATE quota_state
                SET reconcile_token = NULL, reconcile_lock_until = 0, reconciled_at = 0
              WHERE id = 1`,
          );
        }
      });
      return null;
    }
  }

  private completedState(now: number): Promise<QuotaStateRow | null> {
    if (this.reconcileInFlight) return this.reconcileInFlight;
    const pending = this.reconcile(now);
    this.reconcileInFlight = pending;
    void pending.finally(() => {
      if (this.reconcileInFlight === pending) this.reconcileInFlight = null;
    });
    return pending;
  }

  private async scheduleNext(): Promise<void> {
    const next = this.ctx.storage.sql
      .exec<{ next_at: number | null }>('SELECT MIN(expires_at) AS next_at FROM upload_reservations')
      .one().next_at;
    const current = await this.ctx.storage.getAlarm();
    if (next === null) {
      if (current !== null) await this.ctx.storage.deleteAlarm();
      return;
    }
    if (current === null || current !== next) await this.ctx.storage.setAlarm(next);
  }

  async reserve(
    objectKey: string,
    uploadId: string,
    token: string,
    actorHash: string,
    bytes: number,
  ): Promise<ReservationResult> {
    if (
      !KEY_RE.test(objectKey) ||
      uploadId.length < 1 ||
      uploadId.length > 512 ||
      !TOKEN_RE.test(token) ||
      !ACTOR_RE.test(actorHash) ||
      !Number.isSafeInteger(bytes) ||
      bytes < 1 ||
      bytes > STORAGE_BUDGET
    ) {
      return { ok: false, reason: 'storage_full' };
    }

    const tokenHash = bytesToHex(await hashToken(token));
    const now = Date.now();
    this.markExpired(now);
    const completed = await this.completedState(now);
    if (!completed) {
      this.ctx.waitUntil(this.cleanupDue());
      await this.scheduleNext();
      return { ok: false, reason: 'unavailable' };
    }

    const result = this.ctx.storage.transactionSync<ReservationResult>(() => {
      // Recheck after the external R2 scan: a completion RPC may have interleaved.
      const current = this.state();
      if (
        current.baseline_ready !== 1 ||
        now - current.reconciled_at >= RECONCILE_INTERVAL_MS ||
        this.unsettledCompletions() > 0
      ) {
        return { ok: false, reason: 'unavailable' };
      }
      const global = this.ctx.storage.sql
        .exec<{ n: number; bytes: number }>(
          'SELECT COUNT(*) AS n, COALESCE(SUM(reserved_bytes), 0) AS bytes FROM upload_reservations',
        )
        .one();
      const actorReservations = this.ctx.storage.sql
        .exec<{ n: number; bytes: number }>(
          `SELECT COUNT(*) AS n, COALESCE(SUM(reserved_bytes), 0) AS bytes
             FROM upload_reservations WHERE actor_hash = ?`,
          actorHash,
        )
        .one();
      const actorCompleted = this.ctx.storage.sql
        .exec<{ n: number; bytes: number }>(
          `SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS bytes
             FROM completed_objects WHERE actor_hash = ?`,
          actorHash,
        )
        .one();

      if (
        global.n >= MAX_GLOBAL_UPLOADS ||
        current.completed_objects + global.n + 1 > MAX_GLOBAL_OBJECTS ||
        current.completed_bytes + global.bytes + bytes > STORAGE_BUDGET
      ) {
        return { ok: false, reason: 'storage_full' };
      }
      if (
        actorReservations.n >= MAX_ACTOR_UPLOADS ||
        actorCompleted.n + actorReservations.n + 1 > MAX_ACTOR_OBJECTS ||
        actorCompleted.bytes + actorReservations.bytes + bytes > ACTOR_BUDGET
      ) {
        return { ok: false, reason: 'actor_limit' };
      }

      const expiresAt = now + RESERVATION_TTL_MS;
      this.ctx.storage.sql.exec(
        `INSERT INTO upload_reservations
           (object_key, upload_id, token_hash, actor_hash, reserved_bytes,
            expires_at, state, op_version, retry_count)
         VALUES (?, ?, ?, ?, ?, ?, 'active', 0, 0)`,
        objectKey,
        uploadId,
        tokenHash,
        actorHash,
        bytes,
        expiresAt,
      );
      return { ok: true, expiresAt };
    });
    await this.scheduleNext();
    return result;
  }

  async reservePart(
    objectKey: string,
    uploadId: string,
    token: string,
    partNumber: number,
    bytes: number,
  ): Promise<boolean> {
    if (
      !TOKEN_RE.test(token) ||
      !Number.isSafeInteger(partNumber) ||
      partNumber < 1 ||
      partNumber > 256 ||
      !Number.isSafeInteger(bytes) ||
      bytes < 1 ||
      bytes > 32 * 1024 * 1024
    ) {
      return false;
    }
    const tokenHash = await hashToken(token);
    const now = Date.now();
    this.markExpired(now);
    const accepted = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'active' ||
        row.expires_at <= now ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      const existing = this.ctx.storage.sql
        .exec<{ bytes: number }>(
          'SELECT bytes FROM upload_parts WHERE object_key = ? AND part_number = ?',
          objectKey,
          partNumber,
        )
        .toArray()[0];
      if (existing) return false;
      const used = this.ctx.storage.sql
        .exec<{ bytes: number }>(
          'SELECT COALESCE(SUM(bytes), 0) AS bytes FROM upload_parts WHERE object_key = ?',
          objectKey,
        )
        .one().bytes;
      if (used + bytes > row.reserved_bytes) return false;
      this.ctx.storage.sql.exec(
        'INSERT INTO upload_parts (object_key, part_number, bytes) VALUES (?, ?, ?)',
        objectKey,
        partNumber,
        bytes,
      );
      this.ctx.storage.sql.exec(
        'UPDATE upload_reservations SET expires_at = ? WHERE object_key = ?',
        now + RESERVATION_TTL_MS,
        objectKey,
      );
      return true;
    });
    if (!accepted) this.ctx.waitUntil(this.cleanupDue());
    await this.scheduleNext();
    return accepted;
  }

  async claimComplete(
    objectKey: string,
    uploadId: string,
    token: string,
    partNumbers: number[],
  ): Promise<CompletionClaim | null> {
    if (
      !TOKEN_RE.test(token) ||
      !Array.isArray(partNumbers) ||
      partNumbers.length < 1 ||
      partNumbers.length > 256 ||
      partNumbers.some((part, index) => !Number.isSafeInteger(part) || part !== index + 1)
    ) {
      return null;
    }
    const tokenHash = await hashToken(token);
    const now = Date.now();
    this.markExpired(now);
    const claim = this.ctx.storage.transactionSync<CompletionClaim | null>(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'active' ||
        row.expires_at <= now ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return null;
      }
      const registered = this.ctx.storage.sql
        .exec<{ part_number: number; bytes: number }>(
          'SELECT part_number, bytes FROM upload_parts WHERE object_key = ? ORDER BY part_number',
          objectKey,
        )
        .toArray();
      if (
        registered.length !== partNumbers.length ||
        registered.some((part, index) => part.part_number !== partNumbers[index]) ||
        registered.reduce((sum, part) => sum + part.bytes, 0) !== row.reserved_bytes
      ) {
        return null;
      }
      const operation = row.op_version + 1;
      this.ctx.storage.sql.exec(
        `UPDATE upload_reservations
            SET state = 'completing', op_version = ?, expires_at = ?, retry_count = 0
          WHERE object_key = ? AND state = 'active'`,
        operation,
        now + COMPLETING_GRACE_MS,
        objectKey,
      );
      this.bumpMutation();
      return { reservedBytes: row.reserved_bytes, operation };
    });
    await this.scheduleNext();
    return claim;
  }

  async claimAbort(objectKey: string, uploadId: string, token: string): Promise<boolean> {
    if (!TOKEN_RE.test(token)) return false;
    const tokenHash = await hashToken(token);
    const now = Date.now();
    this.markExpired(now);
    const claimed = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'active' ||
        row.expires_at <= now ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      this.ctx.storage.sql.exec(
        `UPDATE upload_reservations
            SET state = 'abort_pending', expires_at = ?, retry_count = 0,
                op_version = op_version + 1
          WHERE object_key = ? AND state = 'active'`,
        now + 30_000,
        objectKey,
      );
      this.bumpMutation();
      return true;
    });
    await this.scheduleNext();
    return claimed;
  }

  async restoreActive(
    objectKey: string,
    uploadId: string,
    token: string,
    operation: number,
  ): Promise<boolean> {
    if (!TOKEN_RE.test(token) || !Number.isSafeInteger(operation) || operation < 1) return false;
    const tokenHash = await hashToken(token);
    const restored = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'completing' ||
        row.op_version !== operation ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      this.ctx.storage.sql.exec(
        `UPDATE upload_reservations
            SET state = 'active', expires_at = ?, retry_count = 0
          WHERE object_key = ? AND state = 'completing' AND op_version = ?`,
        Date.now() + RESERVATION_TTL_MS,
        objectKey,
        operation,
      );
      this.bumpMutation();
      return true;
    });
    await this.scheduleNext();
    return restored;
  }

  async deferAbort(objectKey: string, uploadId: string, token: string): Promise<boolean> {
    if (!TOKEN_RE.test(token)) return false;
    const tokenHash = await hashToken(token);
    const deferred = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'abort_pending' ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      this.ctx.storage.sql.exec(
        `UPDATE upload_reservations
            SET expires_at = ?, retry_count = retry_count + 1
          WHERE object_key = ? AND state = 'abort_pending'`,
        Date.now() + retryDelay(row.retry_count),
        objectKey,
      );
      return true;
    });
    await this.scheduleNext();
    return deferred;
  }

  async deferCompletionCleanup(
    objectKey: string,
    uploadId: string,
    token: string,
    operation: number,
  ): Promise<boolean> {
    if (!TOKEN_RE.test(token) || !Number.isSafeInteger(operation) || operation < 1) return false;
    const tokenHash = await hashToken(token);
    const deferred = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (
        !row ||
        row.state !== 'completing' ||
        row.op_version !== operation ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      this.ctx.storage.sql.exec(
        `UPDATE upload_reservations
            SET state = 'completion_cleanup', expires_at = ?, retry_count = 0
          WHERE object_key = ? AND state = 'completing' AND op_version = ?`,
        Date.now() + CLEANUP_RETRY_BASE_MS,
        objectKey,
        operation,
      );
      this.bumpMutation();
      return true;
    });
    await this.scheduleNext();
    return deferred;
  }

  /**
   * Called only after the Worker has successfully aborted or deleted the R2
   * resource. Expiry is intentionally irrelevant: successful cleanup is proof.
   */
  async release(objectKey: string, uploadId: string, token: string): Promise<boolean> {
    if (!TOKEN_RE.test(token)) return false;
    const tokenHash = await hashToken(token);
    const released = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (!row || !this.validTokenHash(row, tokenHash)) return false;
      this.ctx.storage.sql.exec('DELETE FROM upload_parts WHERE object_key = ?', objectKey);
      this.ctx.storage.sql.exec(
        'DELETE FROM upload_reservations WHERE object_key = ? AND upload_id = ?',
        objectKey,
        uploadId,
      );
      this.bumpMutation();
      return true;
    });
    await this.scheduleNext();
    return released;
  }

  private claimedPartBytes(objectKey: string): number {
    return this.ctx.storage.sql
      .exec<{ bytes: number }>(
        'SELECT COALESCE(SUM(bytes), 0) AS bytes FROM upload_parts WHERE object_key = ?',
        objectKey,
      )
      .one().bytes;
  }

  private promoteCompleted(row: ReservationRow, actualBytes: number, now: number): boolean {
    if (
      !Number.isSafeInteger(actualBytes) ||
      actualBytes !== row.reserved_bytes ||
      this.claimedPartBytes(row.object_key) !== row.reserved_bytes
    ) {
      return false;
    }
    const alreadyRecorded = this.ctx.storage.sql
      .exec<{ n: number }>(
        'SELECT COUNT(*) AS n FROM completed_objects WHERE object_key = ?',
        row.object_key,
      )
      .one().n;
    if (alreadyRecorded !== 0) return false;
    this.ctx.storage.sql.exec(
      `INSERT INTO completed_objects
         (object_key, actor_hash, bytes, completed_at, verify_after,
          upload_id, token_hash, op_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      row.object_key,
      row.actor_hash,
      actualBytes,
      now,
      now + LEDGER_VERIFY_AFTER_MS,
      row.upload_id,
      row.token_hash,
      row.op_version,
    );
    this.ctx.storage.sql.exec('DELETE FROM upload_parts WHERE object_key = ?', row.object_key);
    this.ctx.storage.sql.exec(
      'DELETE FROM upload_reservations WHERE object_key = ? AND upload_id = ?',
      row.object_key,
      row.upload_id,
    );
    this.ctx.storage.sql.exec(
      `UPDATE quota_state
          SET completed_bytes = completed_bytes + ?,
              completed_objects = completed_objects + 1,
              mutation_version = mutation_version + 1
        WHERE id = 1`,
      actualBytes,
    );
    return true;
  }

  async commit(
    objectKey: string,
    uploadId: string,
    token: string,
    operation: number,
    actualBytes: number,
  ): Promise<boolean> {
    if (
      !TOKEN_RE.test(token) ||
      !Number.isSafeInteger(operation) ||
      operation < 1 ||
      !Number.isSafeInteger(actualBytes) ||
      actualBytes < 1
    ) {
      return false;
    }
    const tokenHash = await hashToken(token);
    const tokenHex = bytesToHex(tokenHash);
    const now = Date.now();
    const committed = this.ctx.storage.transactionSync(() => {
      const row = this.reservation(objectKey, uploadId);
      if (!row) {
        // RPC responses can be lost after the atomic commit. The durable receipt
        // makes an exact retry idempotent instead of causing the Worker to delete
        // an already-accounted, successfully completed object.
        const receipt = this.ctx.storage.sql
          .exec<{ upload_id: string | null; token_hash: string | null; op_version: number | null; bytes: number }>(
            `SELECT upload_id, token_hash, op_version, bytes
               FROM completed_objects WHERE object_key = ?`,
            objectKey,
          )
          .toArray()[0];
        return !!receipt &&
          receipt.upload_id === uploadId &&
          receipt.token_hash === tokenHex &&
          receipt.op_version === operation &&
          receipt.bytes === actualBytes;
      }
      if (
        row.state !== 'completing' ||
        row.op_version !== operation ||
        row.expires_at <= now ||
        !this.validTokenHash(row, tokenHash)
      ) {
        return false;
      }
      return this.promoteCompleted(row, actualBytes, now);
    });
    await this.scheduleNext();
    return committed;
  }

  private finishCleanup(row: ReservationRow): void {
    this.ctx.storage.transactionSync(() => {
      const current = this.reservation(row.object_key, row.upload_id);
      if (
        !current ||
        current.op_version !== row.op_version ||
        (current.state !== 'abort_pending' && current.state !== 'completion_cleanup')
      ) {
        return;
      }
      this.ctx.storage.sql.exec('DELETE FROM upload_parts WHERE object_key = ?', row.object_key);
      this.ctx.storage.sql.exec(
        'DELETE FROM upload_reservations WHERE object_key = ? AND upload_id = ?',
        row.object_key,
        row.upload_id,
      );
      this.bumpMutation();
    });
  }

  private retryCleanup(row: ReservationRow): void {
    this.ctx.storage.sql.exec(
      `UPDATE upload_reservations
          SET retry_count = retry_count + 1, expires_at = ?
        WHERE object_key = ? AND upload_id = ? AND op_version = ? AND state = ?`,
      Date.now() + retryDelay(row.retry_count),
      row.object_key,
      row.upload_id,
      row.op_version,
      row.state,
    );
  }

  private promoteRecovered(row: ReservationRow, size: number): boolean {
    return this.ctx.storage.transactionSync(() => {
      const current = this.reservation(row.object_key, row.upload_id);
      if (
        !current ||
        current.state !== 'completion_cleanup' ||
        current.op_version !== row.op_version
      ) {
        return false;
      }
      return this.promoteCompleted(current, size, Date.now());
    });
  }

  private async settleCleanup(row: ReservationRow): Promise<void> {
    if (row.state === 'completion_cleanup') {
      let existing: R2Object | null;
      try {
        existing = await this.env.BLOBS.head(row.object_key);
      } catch {
        this.retryCleanup(row);
        return;
      }
      if (existing) {
        if (this.promoteRecovered(row, existing.size)) return;
        try {
          await this.env.BLOBS.delete(row.object_key);
          this.finishCleanup(row);
        } catch {
          this.retryCleanup(row);
        }
        return;
      }
    }

    try {
      await this.env.BLOBS.resumeMultipartUpload(row.object_key, row.upload_id).abort();
      this.finishCleanup(row);
    } catch (error) {
      if (isMissingMultipart(error)) {
        try {
          const existing = await this.env.BLOBS.head(row.object_key);
          if (existing && this.promoteRecovered(row, existing.size)) return;
          if (!existing) {
            this.finishCleanup(row);
            return;
          }
          if (row.state === 'abort_pending') {
            await this.env.BLOBS.delete(row.object_key);
            this.finishCleanup(row);
            return;
          }
        } catch {
          /* ambiguous: retain the charged row and retry */
        }
      }
      this.retryCleanup(row);
    }
  }

  private async cleanupDue(): Promise<void> {
    const now = Date.now();
    this.markExpired(now);
    const rows = this.ctx.storage.sql
      .exec<ReservationRow>(
        `SELECT object_key, upload_id, token_hash, actor_hash, reserved_bytes,
                expires_at, state, op_version, retry_count
           FROM upload_reservations
          WHERE state IN ('abort_pending', 'completion_cleanup') AND expires_at <= ?
          ORDER BY expires_at
          LIMIT ?`,
        now,
        CLEANUP_BATCH,
      )
      .toArray();
    await Promise.all(rows.map((row) => this.settleCleanup(row)));
  }

  async alarm(): Promise<void> {
    try {
      await this.cleanupDue();
    } finally {
      await this.scheduleNext();
    }
  }
}
