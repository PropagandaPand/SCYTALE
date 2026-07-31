/**
 * Strongly-consistent directory for SKYTALE's official support identity.
 *
 * The Durable Object is deliberately not an authority by itself: a document is
 * accepted only when it carries a valid signature from the offline root public
 * key pinned in the application. The server stores public bootstrap material;
 * it never stores an administrative secret, private key, or trust override.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES,
  OfficialAccountManifestError,
  assertTimelyOfficialAccountManifest,
  base64urlDecode,
  canonicalOfficialAccountManifestJson,
  officialAccountManifestDigest,
  parseOfficialAccountManifest,
  verifyOfficialAccountManifestSignature,
} from '../src/lib/officialAccountManifest';
import { OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL } from '../src/lib/officialAccountConfig';

const ROOT_PUBLIC_KEY_BYTES = 32;
const SHA256_B64URL_CHARS = 43;
const textEncoder = new TextEncoder();

export type OfficialAccountDocumentFailure =
  | 'unconfigured'
  | 'format'
  | 'signature'
  | 'not_current';

export class OfficialAccountDocumentError extends Error {
  constructor(readonly reason: OfficialAccountDocumentFailure) {
    super('Official account document rejected.');
    this.name = 'OfficialAccountDocumentError';
  }
}

export interface VerifiedOfficialAccountDocument {
  document: string;
  digest: string;
  sequence: number;
}

export interface OfficialAccountStoredDocument
  extends VerifiedOfficialAccountDocument {
  publishedAt: number;
}

export type OfficialAccountPublishResult =
  | {
      ok: true;
      kind: 'created' | 'updated' | 'unchanged' | 'stale' | 'conflict';
      sequence: number;
    }
  | {
      ok: false;
      reason: OfficialAccountDocumentFailure;
    };

interface OfficialAccountRow extends Record<string, SqlStorageValue> {
  sequence: number;
  canonical_document: string;
  digest: string;
  published_at: number;
}

function configuredRootPublicKey(): Uint8Array<ArrayBuffer> {
  if (!OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL) {
    throw new OfficialAccountDocumentError('unconfigured');
  }
  try {
    const root = base64urlDecode(
      OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL,
      ROOT_PUBLIC_KEY_BYTES,
    );
    if (root.length !== ROOT_PUBLIC_KEY_BYTES) throw new Error('root-length');
    return root;
  } catch {
    throw new OfficialAccountDocumentError('unconfigured');
  }
}

function documentFailure(error: unknown): OfficialAccountDocumentFailure {
  if (error instanceof OfficialAccountDocumentError) return error.reason;
  if (error instanceof OfficialAccountManifestError) {
    if (error.kind === 'not-current') return 'not_current';
    if (error.kind === 'signature') return 'signature';
  }
  return 'format';
}

/**
 * Parse, time-check and independently verify a candidate before it may cross
 * the storage boundary. This runs both in the outer Worker (cheap rejection
 * before the singleton DO) and again inside the DO as a defense-in-depth gate.
 */
export async function verifyOfficialAccountDocument(
  value: unknown,
  now = Date.now(),
): Promise<VerifiedOfficialAccountDocument> {
  let manifest;
  try {
    manifest = parseOfficialAccountManifest(value);
    assertTimelyOfficialAccountManifest(manifest, now);
  } catch (error) {
    throw new OfficialAccountDocumentError(documentFailure(error));
  }

  const rootPublicKey = configuredRootPublicKey();
  if (!(await verifyOfficialAccountManifestSignature(manifest, rootPublicKey))) {
    throw new OfficialAccountDocumentError('signature');
  }

  const document = canonicalOfficialAccountManifestJson(manifest);
  if (textEncoder.encode(document).byteLength > OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES) {
    throw new OfficialAccountDocumentError('format');
  }
  return {
    document,
    digest: await officialAccountManifestDigest(manifest),
    sequence: manifest.sequence,
  };
}

export class OfficialAccountDirectory extends DurableObject<unknown> {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS official_account_manifest (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        sequence INTEGER NOT NULL CHECK (sequence >= 1),
        canonical_document TEXT NOT NULL
          CHECK (length(canonical_document) BETWEEN 1 AND ${OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES}),
        digest TEXT NOT NULL CHECK (length(digest) = ${SHA256_B64URL_CHARS}),
        published_at INTEGER NOT NULL CHECK (published_at >= 1)
      ) STRICT;
    `);
  }

  /** Read-only lookup. Reads never extend freshness or alter durable state. */
  resolve(): OfficialAccountStoredDocument | null {
    const rows = this.ctx.storage.sql
      .exec<OfficialAccountRow>(
        `SELECT sequence, canonical_document, digest, published_at
           FROM official_account_manifest WHERE id = 1`,
      )
      .toArray();
    if (rows.length === 0) return null;
    if (rows.length !== 1) throw new Error('Official account directory is corrupt.');
    const row = rows[0];
    if (
      !Number.isSafeInteger(row.sequence) ||
      row.sequence < 1 ||
      typeof row.canonical_document !== 'string' ||
      textEncoder.encode(row.canonical_document).byteLength >
        OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES ||
      typeof row.digest !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(row.digest) ||
      !Number.isSafeInteger(row.published_at) ||
      row.published_at < 1
    ) {
      throw new Error('Official account directory is corrupt.');
    }
    return {
      document: row.canonical_document,
      digest: row.digest,
      sequence: row.sequence,
      publishedAt: row.published_at,
    };
  }

  /**
   * Publish a root-authorised update. Equal documents are retry-safe, while a
   * lower sequence or different content at the current sequence can never move
   * the head. The compare and write happen in one synchronous SQLite transaction.
   */
  async publish(document: string): Promise<OfficialAccountPublishResult> {
    if (
      typeof document !== 'string' ||
      document.length < 1 ||
      textEncoder.encode(document).byteLength > OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES
    ) {
      return { ok: false, reason: 'format' };
    }

    // A byte-identical replay is already authenticated by the durable row. This
    // cheap path prevents public retries from forcing a second Ed25519 check in
    // the singleton DO (the outer Worker still applies actor limits first).
    const snapshot = this.resolve();
    if (snapshot?.document === document) {
      return { ok: true, kind: 'unchanged', sequence: snapshot.sequence };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(document) as unknown;
    } catch {
      return { ok: false, reason: 'format' };
    }

    let parsedSequence: number;
    try {
      const parsedManifest = parseOfficialAccountManifest(parsed);
      if (canonicalOfficialAccountManifestJson(parsedManifest) !== document) {
        return { ok: false, reason: 'format' };
      }
      parsedSequence = parsedManifest.sequence;
    } catch {
      return { ok: false, reason: 'format' };
    }
    // Rejecting a lower/equal candidate grants no authority and mutates no state,
    // so it is safe to avoid expensive verification here. A concurrent higher
    // update is checked again in the transaction after verification below.
    if (snapshot && parsedSequence <= snapshot.sequence) {
      return {
        ok: true,
        kind: parsedSequence < snapshot.sequence ? 'stale' : 'conflict',
        sequence: snapshot.sequence,
      };
    }

    let verified: VerifiedOfficialAccountDocument;
    try {
      verified = await verifyOfficialAccountDocument(parsed);
    } catch (error) {
      return { ok: false, reason: documentFailure(error) };
    }
    // The outer Worker always supplies this stable representation. Refusing a
    // non-canonical RPC input keeps idempotency byte-exact if another caller is
    // added in a future release.
    if (verified.document !== document) return { ok: false, reason: 'format' };

    const publishedAt = Date.now();
    return this.ctx.storage.transactionSync(() => {
      const current = this.ctx.storage.sql
        .exec<OfficialAccountRow>(
          `SELECT sequence, canonical_document, digest, published_at
             FROM official_account_manifest WHERE id = 1`,
        )
        .toArray()[0];

      if (current) {
        if (verified.sequence < current.sequence) {
          return { ok: true, kind: 'stale', sequence: current.sequence };
        }
        if (verified.sequence === current.sequence) {
          return verified.document === current.canonical_document &&
            verified.digest === current.digest
            ? { ok: true, kind: 'unchanged', sequence: current.sequence }
            : { ok: true, kind: 'conflict', sequence: current.sequence };
        }
      }

      this.ctx.storage.sql.exec(
        `INSERT INTO official_account_manifest
           (id, sequence, canonical_document, digest, published_at)
         VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           sequence = excluded.sequence,
           canonical_document = excluded.canonical_document,
           digest = excluded.digest,
           published_at = excluded.published_at`,
        verified.sequence,
        verified.document,
        verified.digest,
        publishedAt,
      );
      return {
        ok: true,
        kind: current ? 'updated' : 'created',
        sequence: verified.sequence,
      };
    });
  }
}
