/**
 * Durable retry marker for owner-authored group roster mutations.
 *
 * The marker records which exact revision still has to be durably inserted into
 * every member inbox, plus masters that must receive a terminal `gremove`.
 * Roster state and marker are committed in one IndexedDB transaction. The
 * marker contains only public identifiers and is nevertheless sealed under the
 * vault DEK.
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
  compareAndSwapRecords,
  compareAndSwapRecordsWithDeletes,
  listRecordKeys,
  loadRecord,
  saveRecord,
  secureDeleteRecord,
} from './db';
import {
  openGroupPersistenceRecord,
  sealGroupPersistenceRecords,
  type Group,
} from './groups';

const PREFIX = 'group-mutation:';

export interface PendingGroupMutation {
  groupId: string;
  revision: number;
  stateHash: Bytes;
  removedMasters: Bytes[];
  deleteLocalAfterDispatch: boolean;
}

export interface PendingGroupMutationSnapshot {
  mutation: PendingGroupMutation;
  record: SealedRecord;
}

function validGroupId(value: unknown): value is string {
  return typeof value === 'string' && /^grp_[0-9a-f]{32}$/.test(value);
}

function mutationKey(groupId: string): string {
  if (!validGroupId(groupId)) throw new Error('Ungültige Gruppen-ID im Retry.');
  return `${PREFIX}${groupId}`;
}

function mutationAad(groupId: string): Bytes {
  return utf8.encode(`scytale:group-mutation:v2:${groupId}`);
}

function validateMutation(mutation: PendingGroupMutation): void {
  if (
    !validGroupId(mutation.groupId) ||
    !Number.isSafeInteger(mutation.revision) ||
    mutation.revision < 1 ||
    mutation.stateHash.length !== 32 ||
    typeof mutation.deleteLocalAfterDispatch !== 'boolean' ||
    mutation.removedMasters.length > 64 ||
    mutation.removedMasters.some((master) => master.length !== 32)
  ) {
    throw new Error('Ungültiger Gruppen-Mutations-Retry.');
  }
}

export async function sealPendingGroupMutationRecord(
  dek: CryptoKey,
  mutation: PendingGroupMutation,
): Promise<SealedRecord> {
  validateMutation(mutation);
  const body = {
    v: 2,
    g: mutation.groupId,
    r: mutation.revision,
    h: await b64encode(mutation.stateHash),
    d: mutation.deleteLocalAfterDispatch,
    m: await Promise.all(
      mutation.removedMasters.map((master) => b64encode(master)),
    ),
  };
  return seal(
    dek,
    utf8.encode(JSON.stringify(body)),
    mutationAad(mutation.groupId),
  );
}

/** Low-level marker writer used by storage tests. Production roster changes use
 * commitGroupMutation so a crash can never expose state without its outbox. */
export async function savePendingGroupMutation(
  dek: CryptoKey,
  mutation: PendingGroupMutation,
): Promise<PendingGroupMutationSnapshot> {
  const record = await sealPendingGroupMutationRecord(dek, mutation);
  await saveRecord(mutationKey(mutation.groupId), record);
  return { mutation, record };
}

/**
 * Atomically publish the local owner roster and its durable delivery marker.
 * Ciphertexts are prepared before the transaction; quota, abort or crash leaves
 * either the complete previous state or this complete new pair.
 */
export async function commitGroupMutation(
  dek: CryptoKey,
  group: Group,
  removedMasters: Bytes[],
  deleteLocalAfterDispatch = false,
): Promise<PendingGroupMutationSnapshot> {
  const mutation: PendingGroupMutation = {
    groupId: group.id,
    revision: group.revision,
    stateHash:
      group.stateHash ??
      (() => {
        throw new Error('Signierter Gruppen-State-Hash fehlt.');
      })(),
    removedMasters,
    deleteLocalAfterDispatch,
  };
  const record = await sealPendingGroupMutationRecord(dek, mutation);
  const groupKey = `group:${group.id}`;
  const markerKey = mutationKey(group.id);
  const [existingGroupRecord, existingMarkerRecord, existingIndexRecord] =
    await Promise.all([
      loadRecord(groupKey),
      loadRecord(markerKey),
      loadRecord('group-index'),
    ]);
  if (existingMarkerRecord) {
    throw new Error('Ein Gruppenstand wartet bereits auf Zustellung.');
  }
  if (group.revision === 1) {
    if (existingGroupRecord) {
      throw new Error('Gruppen-ID ist bereits belegt.');
    }
  } else {
    if (!existingGroupRecord || !group.previousStateHash) {
      throw new Error('Vorgänger des Gruppenstands fehlt.');
    }
    const previous = await openGroupPersistenceRecord(
      dek,
      group.id,
      existingGroupRecord,
    );
    if (
      !previous.stateHash ||
      group.revision !== previous.revision + 1 ||
      !bytesEqual(group.previousStateHash, previous.stateHash)
    ) {
      throw new Error('Gruppenstand schließt nicht atomar an den Vorgänger an.');
    }
  }
  const groupRecords = await sealGroupPersistenceRecords(dek, group);
  const expected: Array<readonly [string, SealedRecord | undefined]> = [
    [groupKey, existingGroupRecord],
    [markerKey, undefined],
  ];
  if (groupRecords.some(([key]) => key === 'group-index')) {
    expected.push(['group-index', existingIndexRecord]);
  }
  if (
    !(await compareAndSwapRecords(expected, [
      ...groupRecords,
      [markerKey, record],
    ]))
  ) {
    throw new Error('Gruppenstand wurde parallel verändert; nichts wurde gesendet.');
  }
  return { mutation, record };
}

/** Recover an older state-with-stale-marker shape without changing authority
 * state. The exact old ciphertext is CAS-replaced so a newer retry always wins. */
export async function replacePendingGroupMutation(
  dek: CryptoKey,
  group: Group,
  removedMasters: Bytes[],
  expected: SealedRecord,
  deleteLocalAfterDispatch = false,
): Promise<PendingGroupMutationSnapshot> {
  const mutation: PendingGroupMutation = {
    groupId: group.id,
    revision: group.revision,
    stateHash:
      group.stateHash ??
      (() => {
        throw new Error('Signierter Gruppen-State-Hash fehlt.');
      })(),
    removedMasters,
    deleteLocalAfterDispatch,
  };
  const record = await sealPendingGroupMutationRecord(dek, mutation);
  if (
    !(await compareAndSwapRecord(
      mutationKey(group.id),
      expected,
      record,
    ))
  ) {
    throw new Error('Gruppen-Mutations-Retry wurde parallel ersetzt.');
  }
  return { mutation, record };
}

export async function clearPendingGroupMutation(
  snapshot: PendingGroupMutationSnapshot,
): Promise<boolean> {
  const key = mutationKey(snapshot.mutation.groupId);
  return compareAndSwapRecordsWithDeletes(
    [[key, snapshot.record]],
    [],
    [key],
  );
}

/** Explicit local group deletion may discard any retry regardless of revision. */
export async function discardPendingGroupMutation(
  groupId: string,
): Promise<void> {
  await secureDeleteRecord(mutationKey(groupId));
}

async function openMutationRecord(
  dek: CryptoKey,
  groupId: string,
  record: SealedRecord,
): Promise<PendingGroupMutation> {
  const raw = JSON.parse(
    utf8.decode(await open(dek, record, mutationAad(groupId))),
  ) as {
    v?: unknown;
    g?: unknown;
    r?: unknown;
    h?: unknown;
    d?: unknown;
    m?: unknown;
  };
  if (
    raw.v !== 2 ||
    raw.g !== groupId ||
    !Number.isSafeInteger(raw.r) ||
    (raw.r as number) < 1 ||
    typeof raw.h !== 'string' ||
    typeof raw.d !== 'boolean' ||
    !Array.isArray(raw.m) ||
    raw.m.length > 64
  ) {
    throw new Error('shape');
  }
  const removedMasters = await Promise.all(
    raw.m.map(async (value) => {
      if (typeof value !== 'string') throw new Error('master');
      const master = await b64decode(value);
      if (master.length !== 32) throw new Error('master');
      return master;
    }),
  );
  const stateHash = await b64decode(raw.h as string);
  if (stateHash.length !== 32) throw new Error('hash');
  return {
    groupId,
    revision: raw.r as number,
    stateHash,
    removedMasters,
    deleteLocalAfterDispatch: raw.d,
  };
}

export async function loadPendingGroupMutationSnapshots(
  dek: CryptoKey,
): Promise<PendingGroupMutationSnapshot[]> {
  const out: PendingGroupMutationSnapshot[] = [];
  for (const key of await listRecordKeys(PREFIX)) {
    const groupId = key.slice(PREFIX.length);
    if (!validGroupId(groupId)) continue;
    const record = await loadRecord(key);
    if (!record) continue;
    try {
      out.push({
        mutation: await openMutationRecord(dek, groupId, record),
        record,
      });
    } catch {
      // A corrupt retry cannot be trusted or executed, but must not brick the
      // whole vault. Leave its sealed record in place for forensic recovery.
      console.warn('[group] Beschädigter Mutations-Retry ignoriert.');
    }
  }
  return out;
}

export async function loadPendingGroupMutations(
  dek: CryptoKey,
): Promise<PendingGroupMutation[]> {
  return (await loadPendingGroupMutationSnapshots(dek)).map(
    (snapshot) => snapshot.mutation,
  );
}
