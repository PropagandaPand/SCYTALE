/**
 * Durable new-device-side recovery intent for an explicitly confirmed device
 * linking transcript.
 *
 * The record is an authenticated, DEK-sealed coordination intent. Its presence
 * means the user already confirmed this exact transcript; it does NOT store a
 * trusted `confirmed` flag or SAS result. linkflow reconstructs the session,
 * recomputes the SAS, and binds it to the current device identity/SPK at boot.
 */
import { open, seal, utf8, type Bytes, type SealedRecord } from '../crypto';
import { b64ToBytes, bytesToB64 } from './bytes';
import {
  compareAndSwapRecord,
  deleteRecord,
  loadRecord,
} from './db';

export const CONFIRMED_NEW_DEVICE_LINK_KEY = 'confirmed-new-device-link';
const AAD = utf8.encode('scytale:confirmed-new-device-link:v1');
const MAX_REQUEST_TOKEN_CHARS = 1024;
const MAX_OFFER_BYTES = 512;
const MAX_DISCARDED_TRANSCRIPTS = 32;
const MAX_CAS_RETRIES = 12;

export interface ConfirmedNewDeviceLinkIntent {
  createdAt: number;
  preLinkMasterPub: Bytes;
  sasEphPrivate: Bytes;
  requestToken: string;
  offerBytes: Bytes;
}

export type LinkGrantCandidateOutcome = 'installed' | 'invalid' | 'retry';
export type LinkGrantRelayDisposition = 'discarded' | 'active' | 'stale';

/**
 * Route one outer relay row without conflating three independent states:
 * a credential matching a durable discard tombstone is rejected, a candidate
 * for an active attempt is retained for transcript validation, and an
 * unmatched row with no active attempt is stale (ACK/drop this row only).
 */
export async function classifyLinkGrantRelayRow(
  payload: Bytes,
  hasActiveAttempt: boolean,
  matchesDiscarded: (payload: Bytes) => Promise<boolean>,
): Promise<LinkGrantRelayDisposition> {
  if (await matchesDiscarded(payload)) return 'discarded';
  return hasActiveAttempt ? 'active' : 'stale';
}

/**
 * Drain anonymous Grant candidates without letting one bad outer-sealed payload
 * consume a sibling row. Only `invalid` retires the candidate just evaluated;
 * `retry` preserves the whole queue, while `installed` lets the caller's durable
 * success path retire every remaining row.
 */
export async function drainLinkGrantCandidates(
  pending: Map<number, Bytes>,
  evaluate: (ackId: number, payload: Bytes) => Promise<LinkGrantCandidateOutcome>,
  retireInvalid: (ackId: number) => void,
): Promise<boolean> {
  while (pending.size > 0) {
    const candidate = pending.entries().next();
    if (candidate.done) return false;
    const [ackId, payload] = candidate.value;
    const outcome = await evaluate(ackId, payload);
    if (outcome === 'installed') return true;
    if (outcome === 'retry') return false;
    // Delete only the exact row evaluated. `retireInvalid` performs the relay
    // ACK; keeping that callback id-scoped prevents accidental ACK-all behavior.
    pending.delete(ackId);
    retireInvalid(ackId);
  }
  return false;
}

interface ConfirmedNewDeviceLinkWire {
  v: 1;
  createdAt: number;
  preLinkMasterPub: string;
  sasEphPrivate: string;
  requestToken: string;
  offerBytes: string;
}

interface ConfirmedNewDeviceLinkPayload {
  createdAt: number;
  preLinkMasterPub: string;
  sasEphPrivate: string;
  requestToken: string;
  offerBytes: string;
}

interface DiscardedNewDeviceLinkPayload extends ConfirmedNewDeviceLinkPayload {
  discardedAt: number;
}

interface NewDeviceLinkRecoveryJournalWire {
  v: 2;
  active: ConfirmedNewDeviceLinkPayload | null;
  discarded: DiscardedNewDeviceLinkPayload[];
}

export interface DiscardedNewDeviceLinkIntent extends ConfirmedNewDeviceLinkIntent {
  discardedAt: number;
}

interface NewDeviceLinkRecoveryState {
  active: ConfirmedNewDeviceLinkIntent | null;
  discarded: DiscardedNewDeviceLinkIntent[];
}

function validIntent(intent: ConfirmedNewDeviceLinkIntent): boolean {
  return (
    Number.isSafeInteger(intent.createdAt) &&
    intent.createdAt > 0 &&
    intent.preLinkMasterPub.length === 32 &&
    intent.sasEphPrivate.length === 32 &&
    intent.requestToken.length > 0 &&
    intent.requestToken.length <= MAX_REQUEST_TOKEN_CHARS &&
    intent.offerBytes.length > 0 &&
    intent.offerBytes.length <= MAX_OFFER_BYTES
  );
}

function sameIntent(
  a: ConfirmedNewDeviceLinkIntent,
  b: ConfirmedNewDeviceLinkIntent,
): boolean {
  return (
    a.createdAt === b.createdAt &&
    a.requestToken === b.requestToken &&
    a.preLinkMasterPub.length === b.preLinkMasterPub.length &&
    a.preLinkMasterPub.every((value, index) => value === b.preLinkMasterPub[index]) &&
    a.sasEphPrivate.length === b.sasEphPrivate.length &&
    a.sasEphPrivate.every((value, index) => value === b.sasEphPrivate[index]) &&
    a.offerBytes.length === b.offerBytes.length &&
    a.offerBytes.every((value, index) => value === b.offerBytes[index])
  );
}

function encodePayload(
  intent: ConfirmedNewDeviceLinkIntent,
): ConfirmedNewDeviceLinkPayload {
  return {
    createdAt: intent.createdAt,
    preLinkMasterPub: bytesToB64(intent.preLinkMasterPub),
    sasEphPrivate: bytesToB64(intent.sasEphPrivate),
    requestToken: intent.requestToken,
    offerBytes: bytesToB64(intent.offerBytes),
  };
}

function decodePayload(
  value: unknown,
  discarded: boolean,
): ConfirmedNewDeviceLinkIntent | DiscardedNewDeviceLinkIntent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('shape');
  const wire = value as Partial<DiscardedNewDeviceLinkPayload>;
  const expectedKeys = discarded
    ? 'createdAt,discardedAt,offerBytes,preLinkMasterPub,requestToken,sasEphPrivate'
    : 'createdAt,offerBytes,preLinkMasterPub,requestToken,sasEphPrivate';
  if (
    Object.keys(value).sort().join(',') !== expectedKeys ||
    !Number.isSafeInteger(wire.createdAt) ||
    (wire.createdAt as number) <= 0 ||
    typeof wire.preLinkMasterPub !== 'string' ||
    typeof wire.sasEphPrivate !== 'string' ||
    typeof wire.requestToken !== 'string' ||
    typeof wire.offerBytes !== 'string' ||
    (discarded &&
      (!Number.isSafeInteger(wire.discardedAt) ||
        (wire.discardedAt as number) <= 0))
  ) {
    throw new Error('shape');
  }
  const intent: ConfirmedNewDeviceLinkIntent = {
    createdAt: wire.createdAt as number,
    preLinkMasterPub: b64ToBytes(wire.preLinkMasterPub),
    sasEphPrivate: b64ToBytes(wire.sasEphPrivate),
    requestToken: wire.requestToken,
    offerBytes: b64ToBytes(wire.offerBytes),
  };
  if (!validIntent(intent)) throw new Error('bounds');
  return discarded
    ? { ...intent, discardedAt: wire.discardedAt as number }
    : intent;
}

async function decodeState(
  dek: CryptoKey,
  record: SealedRecord,
): Promise<NewDeviceLinkRecoveryState> {
  const parsed: unknown = JSON.parse(utf8.decode(await open(dek, record, AAD)));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
  const version = (parsed as { v?: unknown }).v;
  if (version === 1) {
    const wire = parsed as Partial<ConfirmedNewDeviceLinkWire>;
    if (
      Object.keys(parsed).sort().join(',') !==
        'createdAt,offerBytes,preLinkMasterPub,requestToken,sasEphPrivate,v'
    ) {
      throw new Error('shape');
    }
    return {
      active: decodePayload({
        createdAt: wire.createdAt,
        preLinkMasterPub: wire.preLinkMasterPub,
        sasEphPrivate: wire.sasEphPrivate,
        requestToken: wire.requestToken,
        offerBytes: wire.offerBytes,
      }, false),
      discarded: [],
    };
  }
  if (
    version !== 2 ||
    Object.keys(parsed).sort().join(',') !== 'active,discarded,v'
  ) {
    throw new Error('shape');
  }
  const journal = parsed as Partial<NewDeviceLinkRecoveryJournalWire>;
  if (
    (journal.active !== null &&
      (!journal.active || typeof journal.active !== 'object' || Array.isArray(journal.active))) ||
    !Array.isArray(journal.discarded) ||
    journal.discarded.length > MAX_DISCARDED_TRANSCRIPTS
  ) {
    throw new Error('shape');
  }
  const active = journal.active === null
    ? null
    : decodePayload(journal.active, false) as ConfirmedNewDeviceLinkIntent;
  const discarded = journal.discarded.map(
    (item) => decodePayload(item, true) as DiscardedNewDeviceLinkIntent,
  );
  if (
    discarded.some((intent, index) =>
      discarded.findIndex((candidate) => sameIntent(candidate, intent)) !== index)
  ) {
    throw new Error('duplicate');
  }
  return { active, discarded };
}

async function sealState(
  dek: CryptoKey,
  state: NewDeviceLinkRecoveryState,
): Promise<SealedRecord> {
  const wire: NewDeviceLinkRecoveryJournalWire = {
    v: 2,
    active: state.active ? encodePayload(state.active) : null,
    discarded: state.discarded.map((intent) => ({
      ...encodePayload(intent),
      discardedAt: intent.discardedAt,
    })),
  };
  return seal(dek, utf8.encode(JSON.stringify(wire)), AAD);
}

export async function saveConfirmedNewDeviceLinkIntent(
  dek: CryptoKey,
  intent: ConfirmedNewDeviceLinkIntent,
): Promise<void> {
  if (!validIntent(intent)) throw new Error('Bestätigte Geräte-Kopplung hat ungültige Grenzen.');
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
    let state: NewDeviceLinkRecoveryState = { active: null, discarded: [] };
    if (snapshot) {
      try {
        state = await decodeState(dek, snapshot);
      } catch {
        throw new Error('Bestätigte Geräte-Kopplung ist beschädigt oder nicht authentisch.');
      }
    }
    if (state.active && !sameIntent(state.active, intent)) {
      throw new Error('Eine andere bestätigte Geräte-Kopplung ist bereits aktiv.');
    }
    if (
      await compareAndSwapRecord(
        CONFIRMED_NEW_DEVICE_LINK_KEY,
        snapshot,
        await sealState(dek, { ...state, active: intent }),
      )
    ) {
      return;
    }
  }
  throw new Error('Bestätigte Geräte-Kopplung wurde gleichzeitig zu oft geändert.');
}

export async function loadConfirmedNewDeviceLinkIntent(
  dek: CryptoKey,
): Promise<ConfirmedNewDeviceLinkIntent | null> {
  const record = await loadRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
  if (!record) return null;
  try {
    return (await decodeState(dek, record)).active;
  } catch {
    throw new Error('Bestätigte Geräte-Kopplung ist beschädigt oder nicht authentisch.');
  }
}

export async function loadDiscardedNewDeviceLinkIntents(
  dek: CryptoKey,
): Promise<DiscardedNewDeviceLinkIntent[]> {
  const record = await loadRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
  if (!record) return [];
  try {
    return (await decodeState(dek, record)).discarded;
  } catch {
    throw new Error('Bestätigte Geräte-Kopplung ist beschädigt oder nicht authentisch.');
  }
}

/**
 * Atomically turn the exact active capability into a non-installable rejection
 * tombstone. No TTL: it remains available to classify a late Relay Grant.
 */
export async function discardConfirmedNewDeviceLinkIntent(
  dek: CryptoKey,
  expected: ConfirmedNewDeviceLinkIntent,
  discardedAt = Date.now(),
): Promise<void> {
  if (
    !validIntent(expected) ||
    !Number.isSafeInteger(discardedAt) ||
    discardedAt <= 0
  ) {
    throw new Error('Ungültiger endgültiger Kopplungs-Abbruch.');
  }
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
    if (!snapshot) throw new Error('Bestätigte Kopplungs-Recovery fehlt.');
    let state: NewDeviceLinkRecoveryState;
    try {
      state = await decodeState(dek, snapshot);
    } catch {
      throw new Error('Bestätigte Geräte-Kopplung ist beschädigt oder nicht authentisch.');
    }
    if (!state.active) {
      if (state.discarded.some((intent) => sameIntent(intent, expected))) return;
      throw new Error('Bestätigte Kopplungs-Recovery fehlt.');
    }
    if (!sameIntent(state.active, expected)) {
      throw new Error('Bestätigte Kopplungs-Recovery wurde zwischenzeitlich ersetzt.');
    }
    const alreadyDiscarded = state.discarded.some((intent) => sameIntent(intent, expected));
    if (!alreadyDiscarded && state.discarded.length >= MAX_DISCARDED_TRANSCRIPTS) {
      throw new Error('Zu viele offene Kopplungs-Abbrüche; keine Tombstone darf automatisch gelöscht werden.');
    }
    const discarded = alreadyDiscarded
      ? state.discarded
      : [...state.discarded, { ...expected, discardedAt }];
    if (
      await compareAndSwapRecord(
        CONFIRMED_NEW_DEVICE_LINK_KEY,
        snapshot,
        await sealState(dek, { active: null, discarded }),
      )
    ) {
      return;
    }
  }
  throw new Error('Kopplungs-Recovery wurde gleichzeitig zu oft geändert.');
}

/**
 * Clear the active install capability with one CAS while preserving every
 * explicit-discard tombstone. The no-DEK form is reserved for an already
 * unreadable poison record and performs one atomic deletion.
 */
export async function clearConfirmedNewDeviceLinkIntent(
  dek?: CryptoKey,
): Promise<void> {
  if (!dek) {
    // Used for poison-record recovery/tests where no authenticated journal can
    // be decoded. One atomic delete avoids leaving a presence blocker.
    await deleteRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
    return;
  }
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
    if (!snapshot) return;
    let state: NewDeviceLinkRecoveryState;
    try {
      state = await decodeState(dek, snapshot);
    } catch {
      await deleteRecord(CONFIRMED_NEW_DEVICE_LINK_KEY);
      return;
    }
    if (
      await compareAndSwapRecord(
        CONFIRMED_NEW_DEVICE_LINK_KEY,
        snapshot,
        await sealState(dek, { active: null, discarded: state.discarded }),
      )
    ) {
      return;
    }
  }
  throw new Error('Kopplungs-Recovery wurde gleichzeitig zu oft geändert.');
}
