import { open, seal, utf8, type Bytes, type SealedRecord } from '../crypto';
import { compareAndSwapRecord, loadRecord } from './db';
import {
  canonicalOfficialAccountDocument,
  collectRevokedMasterPubs,
  verifyOfficialAccountDocument,
  type OfficialAccountFloor,
  type VerifyOfficialAccountOptions,
  type TrustedOfficialAccountDocument,
} from './officialAccount';
import { OFFICIAL_ACCOUNT_MIN_SEQUENCE } from './officialAccountConfig';
import {
  OFFICIAL_ACCOUNT_ROOT_KEY_ID,
  base64urlEncode,
  canonicalOfficialAccountManifestJson,
  type OfficialAccountManifest,
} from './officialAccountManifest';

// Namespace the floor by root generation. A future emergency root rotation ships
// a new checked-in key id and therefore cannot be wedged by an old-root record
// that the new parser correctly refuses to authenticate.
export const OFFICIAL_ACCOUNT_TRUST_RECORD_KEY =
  `official-account:skytale-support:${OFFICIAL_ACCOUNT_ROOT_KEY_ID}`;
const AAD = utf8.encode('scytale:official-account-trust:v1');
const MAX_CAS_ATTEMPTS = 4;
const MAX_REVOKED_MASTERS = 8;
const MAX_REVOKED_DOCUMENT_BYTES = 512 * 1024;

interface OfficialAccountTrustWire {
  v: 2;
  sequence: number;
  digest: string;
  manifest: string;
  revocations: string[];
}

export class OfficialAccountTrustCorruptError extends Error {
  constructor() {
    super('Der lokale Admin-Vertrauensstand ist beschädigt.');
    this.name = 'OfficialAccountTrustCorruptError';
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

async function decodeStoredTrust(
  dek: CryptoKey,
  record: SealedRecord,
  options: VerifyOfficialAccountOptions,
  ignoreReleaseMinimum = false,
): Promise<TrustedOfficialAccountDocument> {
  try {
    const parsed: unknown = JSON.parse(utf8.decode(await open(dek, record, AAD)));
    const legacy = isPlainRecord(parsed) && parsed.v === 1;
    const expectedKeys = legacy
      ? ['v', 'sequence', 'digest', 'manifest']
      : ['v', 'sequence', 'digest', 'manifest', 'revocations'];
    if (
      !isPlainRecord(parsed) ||
      Object.keys(parsed).length !== expectedKeys.length ||
      Object.keys(parsed).some((key) => !expectedKeys.includes(key)) ||
      (parsed.v !== 1 && parsed.v !== 2) ||
      !Number.isSafeInteger(parsed.sequence) ||
      (parsed.sequence as number) < 1 ||
      typeof parsed.digest !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(parsed.digest) ||
      typeof parsed.manifest !== 'string' ||
      (!legacy && !Array.isArray(parsed.revocations))
    ) {
      throw new Error('shape');
    }
    const manifestValue: unknown = JSON.parse(parsed.manifest);
    const trusted = await verifyOfficialAccountDocument(manifestValue, {
      ...options,
      ...(ignoreReleaseMinimum ? { minimumSequence: 1 } : {}),
      requireCurrent: false,
    });
    if (
      trusted.sequence !== parsed.sequence ||
      trusted.digest !== parsed.digest ||
      canonicalOfficialAccountDocument(trusted) !== parsed.manifest
    ) {
      throw new Error('mismatch');
    }
    const encodedRevocations: unknown[] = legacy
      ? []
      : parsed.revocations as unknown[];
    if (
      encodedRevocations.length > MAX_REVOKED_MASTERS ||
      encodedRevocations.some((value) => typeof value !== 'string') ||
      encodedRevocations.reduce<number>(
        (total, value) => total + utf8.encode(value as string).length,
        0,
      ) > MAX_REVOKED_DOCUMENT_BYTES
    ) {
      throw new Error('revocation-bounds');
    }
    const revokedManifests: OfficialAccountManifest[] = [];
    const revokedMasters = new Set<string>();
    for (const encoded of encodedRevocations as string[]) {
      const value: unknown = JSON.parse(encoded);
      const revoked = await verifyOfficialAccountDocument(value, {
        ...options,
        minimumSequence: 1,
        floor: null,
        requireCurrent: false,
      });
      if (
        revoked.manifest.status !== 'revoked' ||
        revoked.sequence > trusted.sequence ||
        canonicalOfficialAccountDocument(revoked) !== encoded ||
        revokedMasters.has(revoked.manifest.masterPub)
      ) {
        throw new Error('revocation-proof');
      }
      revokedMasters.add(revoked.manifest.masterPub);
      revokedManifests.push(revoked.manifest);
    }
    // Legacy v1 records predate history but a revoked head itself is still a
    // complete signed tombstone and is migrated on the next successful save.
    if (
      trusted.manifest.status === 'revoked' &&
      !revokedMasters.has(trusted.manifest.masterPub)
    ) {
      revokedManifests.push(trusted.manifest);
    }
    // The tombstone set unions the head's signed revokedMasters declaration with
    // every retained proof, so a client that only ever saw the rotated-to active
    // head still learns the historical revocations it was offline for.
    return {
      ...trusted,
      revokedManifests,
      revokedMasterPubs: collectRevokedMasterPubs(trusted.manifest, revokedManifests),
    };
  } catch {
    throw new OfficialAccountTrustCorruptError();
  }
}

function releaseMinimum(options: VerifyOfficialAccountOptions): number {
  const minimum = options.minimumSequence ?? OFFICIAL_ACCOUNT_MIN_SEQUENCE;
  if (!Number.isSafeInteger(minimum) || minimum < 1) {
    throw new OfficialAccountTrustCorruptError();
  }
  return minimum;
}

async function verifyCandidate(
  candidate: TrustedOfficialAccountDocument,
  options: VerifyOfficialAccountOptions,
): Promise<TrustedOfficialAccountDocument> {
  try {
    const verified = await verifyOfficialAccountDocument(candidate.manifest, {
      ...options,
      floor: null,
      requireCurrent: false,
    });
    if (
      verified.sequence !== candidate.sequence ||
      verified.digest !== candidate.digest ||
      canonicalOfficialAccountDocument(verified) !==
        canonicalOfficialAccountDocument(candidate)
    ) {
      throw new Error('candidate-mismatch');
    }
    return verified;
  } catch {
    throw new OfficialAccountTrustCorruptError();
  }
}

function trustWire(trusted: TrustedOfficialAccountDocument): OfficialAccountTrustWire {
  return {
    v: 2,
    sequence: trusted.sequence,
    digest: trusted.digest,
    manifest: canonicalOfficialAccountDocument(trusted),
    revocations: trusted.revokedManifests.map((manifest) =>
      canonicalOfficialAccountManifestJson(manifest),
    ),
  };
}

/**
 * Union existing + new revocation proofs (highest sequence per master), then
 * compute the full tombstone set for `head` (its signed revokedMasters
 * declaration plus every retained proof) and enforce the two invariants that
 * keep the negative tombstone durable and honest.
 */
function combineRevocations(
  head: OfficialAccountManifest,
  existing: TrustedOfficialAccountDocument | null,
  newProofs: readonly OfficialAccountManifest[],
): { revokedManifests: OfficialAccountManifest[]; revokedMasterPubs: Bytes[] } {
  const byMaster = new Map<string, OfficialAccountManifest>();
  for (const manifest of existing?.revokedManifests ?? []) {
    byMaster.set(manifest.masterPub, manifest);
  }
  for (const manifest of newProofs) {
    const previous = byMaster.get(manifest.masterPub);
    if (!previous || manifest.sequence > previous.sequence) {
      byMaster.set(manifest.masterPub, manifest);
    }
  }
  const revokedManifests = [...byMaster.values()].sort(
    (left, right) => left.sequence - right.sequence,
  );
  const totalBytes = revokedManifests.reduce(
    (total, manifest) =>
      total + utf8.encode(canonicalOfficialAccountManifestJson(manifest)).length,
    0,
  );
  if (
    revokedManifests.length > MAX_REVOKED_MASTERS ||
    totalBytes > MAX_REVOKED_DOCUMENT_BYTES
  ) {
    throw new OfficialAccountTrustCorruptError();
  }
  const revokedMasterPubs = collectRevokedMasterPubs(head, revokedManifests);
  const revokedKeys = new Set(revokedMasterPubs.map((pub) => base64urlEncode(pub)));
  // Once a root-signed revocation has named a compromised master, recovery must
  // use a fresh master. Re-authorising the same active key would erase the only
  // durable warning attached to existing contacts.
  if (head.status === 'active' && revokedKeys.has(head.masterPub)) {
    throw new OfficialAccountTrustCorruptError();
  }
  // Tombstones are monotone: a head may never drop a master the client already
  // knows revoked. A head that fails to carry a known revocation forward is
  // rejected, so the client keeps its last honest state instead of silently
  // un-blocking a compromised former admin.
  for (const previous of existing?.revokedMasterPubs ?? []) {
    if (!revokedKeys.has(base64urlEncode(previous))) {
      throw new OfficialAccountTrustCorruptError();
    }
  }
  return { revokedManifests, revokedMasterPubs };
}

function mergeRevocations(
  existing: TrustedOfficialAccountDocument | null,
  candidate: TrustedOfficialAccountDocument,
): TrustedOfficialAccountDocument {
  return {
    ...candidate,
    ...combineRevocations(candidate.manifest, existing, candidate.revokedManifests),
  };
}

/**
 * A late/out-of-order revocation (a `revoked` proof below the retained head's
 * sequence) is not a newer head but is still a durable tombstone. Fold its proof
 * into the retained head so a revocation that arrives after a rotation is never
 * silently dropped. Returns `existing` unchanged when nothing new is added.
 */
function foldLateRevocations(
  existing: TrustedOfficialAccountDocument,
  candidate: TrustedOfficialAccountDocument,
): TrustedOfficialAccountDocument {
  if (candidate.revokedManifests.length === 0) return existing;
  const known = new Map(
    existing.revokedManifests.map((manifest) => [manifest.masterPub, manifest.sequence]),
  );
  const addsProof = candidate.revokedManifests.some((manifest) => {
    const seen = known.get(manifest.masterPub);
    return seen === undefined || manifest.sequence > seen;
  });
  if (!addsProof) return existing;
  return {
    ...existing,
    ...combineRevocations(existing.manifest, existing, candidate.revokedManifests),
  };
}

export async function loadOfficialAccountTrust(
  dek: CryptoKey,
  options: VerifyOfficialAccountOptions = {},
): Promise<TrustedOfficialAccountDocument | null> {
  const record = await loadRecord(OFFICIAL_ACCOUNT_TRUST_RECORD_KEY);
  if (!record) return null;
  // A release-floor bump deliberately supersedes an older, otherwise valid
  // record. Decode it against sequence 1 so corruption still fails closed, then
  // hide it from the UI. A subsequent current candidate can replace it without
  // requiring the user to erase their vault.
  const trusted = await decodeStoredTrust(dek, record, options, true);
  return trusted.sequence < releaseMinimum(options)
    ? { ...trusted, current: false }
    : trusted;
}

/**
 * Monotone cross-tab cache update. A corrupt existing floor is never treated as
 * an empty cache, and same-sequence equivocation can never replace it.
 */
export async function saveOfficialAccountTrust(
  dek: CryptoKey,
  candidate: TrustedOfficialAccountDocument,
  options: VerifyOfficialAccountOptions = {},
): Promise<TrustedOfficialAccountDocument> {
  const verifiedCandidate = await verifyCandidate(candidate, options);
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const existingRecord = await loadRecord(OFFICIAL_ACCOUNT_TRUST_RECORD_KEY);
    const existing = existingRecord
      ? await decodeStoredTrust(dek, existingRecord, options, true)
      : null;
    const floor: OfficialAccountFloor | null = existing
      ? { sequence: existing.sequence, digest: existing.digest }
      : null;
    if (floor && verifiedCandidate.sequence <= floor.sequence) {
      if (
        verifiedCandidate.sequence === floor.sequence &&
        verifiedCandidate.digest !== floor.digest
      ) {
        throw new OfficialAccountTrustCorruptError();
      }
      // Not a newer head, but a late/out-of-order revocation still carries a
      // durable tombstone. Fold its proof into the retained head and persist
      // only when it adds something new.
      const folded = foldLateRevocations(
        existing as TrustedOfficialAccountDocument,
        verifiedCandidate,
      );
      if (folded === (existing as TrustedOfficialAccountDocument)) {
        return existing as TrustedOfficialAccountDocument;
      }
      const foldedRecord = await seal(
        dek,
        utf8.encode(JSON.stringify(trustWire(folded))),
        AAD,
      );
      if (
        await compareAndSwapRecord(
          OFFICIAL_ACCOUNT_TRUST_RECORD_KEY,
          existingRecord,
          foldedRecord,
        )
      ) {
        return folded;
      }
      continue;
    }
    const mergedCandidate = mergeRevocations(existing, verifiedCandidate);
    const replacement = await seal(
      dek,
      utf8.encode(JSON.stringify(trustWire(mergedCandidate))),
      AAD,
    );
    if (
      await compareAndSwapRecord(
        OFFICIAL_ACCOUNT_TRUST_RECORD_KEY,
        existingRecord,
        replacement,
      )
    ) {
      return mergedCandidate;
    }
  }
  throw new Error('Admin-Vertrauensstand wurde gleichzeitig zu oft geändert.');
}
