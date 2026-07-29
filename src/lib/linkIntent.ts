/**
 * Durable primary-side delivery intent for a device LinkGrant.
 *
 * The device list and this sealed payload are committed in one CAS transaction.
 * A crash can therefore leave neither, or both. The primary clears the intent
 * only after the relay confirms its durable mailbox INSERT.
 */
import { open, seal, utf8, type Bytes, type SealedRecord } from '../crypto';
import { b64ToBytes, bytesToB64 } from './bytes';
import {
  compareAndSwapRecordsWithDeletes,
  loadRecord,
} from './db';

export const PENDING_LINK_GRANT_KEY = 'pending-link-grant';
const AAD = utf8.encode('scytale:pending-link-grant:v1');
const MAX_SEALED_GRANT_BYTES = 256 * 1024;

export interface PendingLinkGrant {
  recipientSignPub: Bytes;
  sealedPayload: Bytes;
  createdAt: number;
}

export class PendingLinkGrantCorruptionError extends Error {
  constructor(cause?: unknown) {
    super('Ausstehender Kopplungs-Nachweis ist beschädigt oder nicht authentisch.');
    this.name = 'PendingLinkGrantCorruptionError';
    (this as { cause?: unknown }).cause = cause;
  }
}

export interface PendingLinkGrantBootRecovery {
  pending: PendingLinkGrant | null;
  record: SealedRecord | null;
  discardedCorrupt: boolean;
}

export type PendingLinkGrantClearResult =
  | { status: 'cleared' }
  | { status: 'gone' }
  | { status: 'discarded-corrupt' }
  | { status: 'replaced'; pending: PendingLinkGrant; record: SealedRecord };

interface PendingLinkGrantWire {
  v: 1;
  recipientSignPub: string;
  sealedPayload: string;
  createdAt: number;
}

export async function sealPendingLinkGrantRecord(
  dek: CryptoKey,
  intent: PendingLinkGrant,
): Promise<SealedRecord> {
  if (
    intent.recipientSignPub.length !== 32 ||
    intent.sealedPayload.length < 1 ||
    intent.sealedPayload.length > MAX_SEALED_GRANT_BYTES ||
    !Number.isSafeInteger(intent.createdAt) ||
    intent.createdAt <= 0
  ) {
    throw new Error('Ungültiger ausstehender Kopplungs-Nachweis.');
  }
  const wire: PendingLinkGrantWire = {
    v: 1,
    recipientSignPub: bytesToB64(intent.recipientSignPub),
    sealedPayload: bytesToB64(intent.sealedPayload),
    createdAt: intent.createdAt,
  };
  return seal(dek, utf8.encode(JSON.stringify(wire)), AAD);
}

export async function loadPendingLinkGrant(dek: CryptoKey): Promise<PendingLinkGrant | null> {
  const record = await loadRecord(PENDING_LINK_GRANT_KEY);
  if (!record) return null;
  return openPendingLinkGrantRecord(dek, record);
}

/** Decode an exact CAS snapshot without re-reading a potentially newer row. */
export async function openPendingLinkGrantRecord(
  dek: CryptoKey,
  record: SealedRecord,
): Promise<PendingLinkGrant> {
  try {
    const wire = JSON.parse(
      utf8.decode(await open(dek, record, AAD)),
    ) as PendingLinkGrantWire;
    if (
      wire?.v !== 1 ||
      typeof wire.recipientSignPub !== 'string' ||
      typeof wire.sealedPayload !== 'string' ||
      !Number.isSafeInteger(wire.createdAt) ||
      wire.createdAt <= 0
    ) {
      throw new Error('format');
    }
    const recipientSignPub = b64ToBytes(wire.recipientSignPub);
    const sealedPayload = b64ToBytes(wire.sealedPayload);
    if (
      recipientSignPub.length !== 32 ||
      sealedPayload.length < 1 ||
      sealedPayload.length > MAX_SEALED_GRANT_BYTES
    ) {
      throw new Error('bounds');
    }
    return { recipientSignPub, sealedPayload, createdAt: wire.createdAt };
  } catch (cause) {
    throw new PendingLinkGrantCorruptionError(cause);
  }
}

export async function clearPendingLinkGrant(
  expected: SealedRecord,
): Promise<boolean> {
  // Compare and delete in ONE transaction. A late receipt/corruption cleanup
  // for A must never delete a newer pending B that reused the coordination key.
  return compareAndSwapRecordsWithDeletes(
    [[PENDING_LINK_GRANT_KEY, expected]],
    [],
    [PENDING_LINK_GRANT_KEY],
  );
}

/**
 * P-side boot policy: the authoritative DeviceList was committed separately
 * from this delivery coordination record. If the latter is already corrupt it
 * can never be retried and its mere presence would block every future
 * list/revocation CAS. Atomically delete that blocker and make the caller warn
 * the user to inspect/revoke a possible already-delivered ghost device.
 *
 * This policy is deliberately NOT used for N's confirmed transcript: deleting
 * that record would lose the human approval capability while a Grant may still
 * be queued, so N remains fail-closed with its inbox disconnected.
 */
export async function recoverPendingLinkGrantAtBoot(
  dek: CryptoKey,
): Promise<PendingLinkGrantBootRecovery> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const record = await loadRecord(PENDING_LINK_GRANT_KEY);
    if (!record) {
      return { pending: null, record: null, discardedCorrupt: false };
    }
    try {
      return {
        pending: await openPendingLinkGrantRecord(dek, record),
        record,
        discardedCorrupt: false,
      };
    } catch (error) {
      if (!(error instanceof PendingLinkGrantCorruptionError)) throw error;
      if (await clearPendingLinkGrant(record)) {
        return { pending: null, record: null, discardedCorrupt: true };
      }
      // The key changed between read and cleanup. Re-read and classify the new
      // exact snapshot; never delete it on behalf of the corrupt predecessor.
    }
  }
  throw new Error('Ausstehender Kopplungs-Nachweis wurde gleichzeitig zu oft ersetzt.');
}

/**
 * Finish one receipt against its exact snapshot and explicitly report what won
 * a CAS miss. Callers can keep successor B visible instead of treating A's late
 * receipt as if the pending slot were empty.
 */
export async function clearPendingLinkGrantAndRecover(
  dek: CryptoKey,
  expected: SealedRecord,
): Promise<PendingLinkGrantClearResult> {
  if (await clearPendingLinkGrant(expected)) return { status: 'cleared' };
  const replacement = await recoverPendingLinkGrantAtBoot(dek);
  if (replacement.discardedCorrupt) return { status: 'discarded-corrupt' };
  if (replacement.pending && replacement.record) {
    return {
      status: 'replaced',
      pending: replacement.pending,
      record: replacement.record,
    };
  }
  return { status: 'gone' };
}
