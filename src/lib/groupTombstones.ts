/**
 * Durable replay barrier for groups that were removed or deliberately left.
 *
 * Deleting only the live group record would make an old, still-valid owner
 * invite look like a first invitation after reload. This sealed monotonic
 * tombstone pins the owner and highest removed state so stale relay rows cannot
 * resurrect membership.
 */
import {
  b64decode,
  b64encode,
  bytesEqual,
  open,
  seal,
  utf8,
  type Bytes,
  type SealedRecord,
} from '../crypto';
import {
  compareAndSwapRecord,
  compareAndSwapRecordsWithDeletes,
  listRecordKeys,
  loadRecord,
} from './db';

const PREFIX = 'group-tombstone:';

export interface GroupRemovalTombstoneWire {
  v: 1;
  g: string;
  o: string;
  r: number;
  h: string;
  b: boolean;
}

export interface GroupRemovalTombstone {
  groupId: string;
  ownerMasterPub: Bytes;
  revision: number;
  stateHash: Bytes;
  /** Local leave/dissolve intent blocks every invite until signed removal proof. */
  blockReadd: boolean;
}

export interface GroupRemovalTombstoneSnapshot {
  tombstone: GroupRemovalTombstone;
  record: SealedRecord;
}

export function permitsGroupReadd(
  tombstone: GroupRemovalTombstone,
  incoming: {
    ownerMasterPub?: Bytes;
    revision: number;
    dissolved?: boolean;
    roster?: Bytes[];
  },
  ownMasterPub: Bytes,
): boolean {
  return (
    !tombstone.blockReadd &&
    !!incoming.ownerMasterPub &&
    bytesEqual(incoming.ownerMasterPub, tombstone.ownerMasterPub) &&
    Number.isSafeInteger(incoming.revision) &&
    incoming.revision > tombstone.revision &&
    incoming.dissolved !== true &&
    !!incoming.roster?.some((master) => bytesEqual(master, ownMasterPub))
  );
}

function validGroupId(value: unknown): value is string {
  return typeof value === 'string' && /^grp_[0-9a-f]{32}$/.test(value);
}

export function groupRemovalTombstoneRecordKey(groupId: string): string {
  if (!validGroupId(groupId)) throw new Error('Ungültige Tombstone-Gruppen-ID.');
  return `${PREFIX}${groupId}`;
}

function aad(groupId: string): Bytes {
  return utf8.encode(`scytale:group-tombstone:v1:${groupId}`);
}

function validate(tombstone: GroupRemovalTombstone): void {
  if (
    !validGroupId(tombstone.groupId) ||
    tombstone.ownerMasterPub.length !== 32 ||
    !Number.isSafeInteger(tombstone.revision) ||
    tombstone.revision < 1 ||
    tombstone.stateHash.length !== 32 ||
    typeof tombstone.blockReadd !== 'boolean'
  ) {
    throw new Error('Ungültiger Gruppen-Tombstone.');
  }
}

async function sealTombstone(
  dek: CryptoKey,
  tombstone: GroupRemovalTombstone,
): Promise<SealedRecord> {
  validate(tombstone);
  return seal(
    dek,
    utf8.encode(
      JSON.stringify({
        v: 1,
        g: tombstone.groupId,
        o: await b64encode(tombstone.ownerMasterPub),
        r: tombstone.revision,
        h: await b64encode(tombstone.stateHash),
        b: tombstone.blockReadd,
      }),
    ),
    aad(tombstone.groupId),
  );
}

export async function toGroupRemovalTombstoneWire(
  tombstone: GroupRemovalTombstone,
): Promise<GroupRemovalTombstoneWire> {
  validate(tombstone);
  return {
    v: 1,
    g: tombstone.groupId,
    o: await b64encode(tombstone.ownerMasterPub),
    r: tombstone.revision,
    h: await b64encode(tombstone.stateHash),
    b: tombstone.blockReadd,
  };
}

export async function fromGroupRemovalTombstoneWire(
  raw: GroupRemovalTombstoneWire,
): Promise<GroupRemovalTombstone> {
  if (
    !raw ||
    raw.v !== 1 ||
    !validGroupId(raw.g) ||
    typeof raw.o !== 'string' ||
    !Number.isSafeInteger(raw.r) ||
    raw.r < 1 ||
    typeof raw.h !== 'string' ||
    typeof raw.b !== 'boolean'
  ) {
    throw new Error('Ungültiger Gruppen-Tombstone.');
  }
  const tombstone: GroupRemovalTombstone = {
    groupId: raw.g,
    ownerMasterPub: await b64decode(raw.o),
    revision: raw.r,
    stateHash: await b64decode(raw.h),
    blockReadd: raw.b,
  };
  validate(tombstone);
  return tombstone;
}

export async function sealGroupRemovalTombstoneRecord(
  dek: CryptoKey,
  tombstone: GroupRemovalTombstone,
): Promise<SealedRecord> {
  return sealTombstone(dek, tombstone);
}

async function openTombstone(
  dek: CryptoKey,
  groupId: string,
  record: SealedRecord,
): Promise<GroupRemovalTombstone> {
  const raw = JSON.parse(
    utf8.decode(await open(dek, record, aad(groupId))),
  ) as {
    v?: unknown;
    g?: unknown;
    o?: unknown;
    r?: unknown;
    h?: unknown;
    b?: unknown;
  };
  if (
    raw.v !== 1 ||
    raw.g !== groupId ||
    typeof raw.o !== 'string' ||
    !Number.isSafeInteger(raw.r) ||
    (raw.r as number) < 1 ||
    typeof raw.h !== 'string' ||
    typeof raw.b !== 'boolean'
  ) {
    throw new Error('Ungültiger Gruppen-Tombstone.');
  }
  const tombstone: GroupRemovalTombstone = {
    groupId,
    ownerMasterPub: await b64decode(raw.o),
    revision: raw.r as number,
    stateHash: await b64decode(raw.h),
    blockReadd: raw.b,
  };
  validate(tombstone);
  return tombstone;
}

export async function loadGroupRemovalTombstone(
  dek: CryptoKey,
  groupId: string,
): Promise<GroupRemovalTombstoneSnapshot | null> {
  const record = await loadRecord(groupRemovalTombstoneRecordKey(groupId));
  if (!record) return null;
  return { tombstone: await openTombstone(dek, groupId, record), record };
}

export async function loadGroupRemovalTombstones(
  dek: CryptoKey,
): Promise<GroupRemovalTombstoneSnapshot[]> {
  const out: GroupRemovalTombstoneSnapshot[] = [];
  for (const recordKey of await listRecordKeys(PREFIX)) {
    const groupId = recordKey.slice(PREFIX.length);
    if (!validGroupId(groupId)) continue;
    const record = await loadRecord(recordKey);
    if (!record) continue;
    try {
      out.push({
        tombstone: await openTombstone(dek, groupId, record),
        record,
      });
    } catch {
      console.warn('[group] Beschädigter Removal-Tombstone ignoriert.');
    }
  }
  return out;
}

/**
 * Monotonic CAS update. A stale removal can never replace a newer barrier, and
 * a different owner can never reuse the same 128-bit group id.
 */
export async function saveGroupRemovalTombstone(
  dek: CryptoKey,
  candidate: GroupRemovalTombstone,
): Promise<GroupRemovalTombstoneSnapshot> {
  validate(candidate);
  for (let attempt = 0; attempt < 12; attempt++) {
    const currentRecord = await loadRecord(
      groupRemovalTombstoneRecordKey(candidate.groupId),
    );
    let replacementCandidate = candidate;
    if (currentRecord) {
      const current = await openTombstone(
        dek,
        candidate.groupId,
        currentRecord,
      );
      if (!bytesEqual(current.ownerMasterPub, candidate.ownerMasterPub)) {
        throw new Error('Gruppen-ID ist bereits an einen anderen Owner gebunden.');
      }
      if (current.revision > candidate.revision) {
        return { tombstone: current, record: currentRecord };
      }
      if (current.revision === candidate.revision) {
        if (!bytesEqual(current.stateHash, candidate.stateHash)) {
          throw new Error('Konfligierende Gruppen-Tombstones derselben Revision.');
        }
        // `blockReadd` is a local safety decision and therefore monotonic too:
        // false→true may strengthen the exact checkpoint; true→false must never
        // reopen a group after an explicit leave or terminal dissolution.
        if (current.blockReadd || !candidate.blockReadd) {
          return { tombstone: current, record: currentRecord };
        }
      } else if (current.blockReadd && !candidate.blockReadd) {
        replacementCandidate = { ...candidate, blockReadd: true };
      }
    }
    const replacement = await sealTombstone(dek, replacementCandidate);
    if (
      await compareAndSwapRecord(
        groupRemovalTombstoneRecordKey(candidate.groupId),
        currentRecord,
        replacement,
      )
    ) {
      return { tombstone: replacementCandidate, record: replacement };
    }
  }
  throw new Error('Gruppen-Tombstone wurde gleichzeitig zu oft verändert.');
}

export async function clearGroupRemovalTombstone(
  snapshot: GroupRemovalTombstoneSnapshot,
): Promise<boolean> {
  const recordKey = groupRemovalTombstoneRecordKey(snapshot.tombstone.groupId);
  return compareAndSwapRecordsWithDeletes(
    [[recordKey, snapshot.record]],
    [],
    [recordKey],
  );
}
