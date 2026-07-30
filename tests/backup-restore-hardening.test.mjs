import 'fake-indexeddb/auto';
import fs from 'node:fs';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const throws = async (fn) => { try { await fn(); return false; } catch { return true; } };
const b64 = (n) => Buffer.alloc(n).toString('base64');
const CHUNK = 4 * 1024 * 1024;

function fileWith(header, bodyBytes) {
  const encoded = new TextEncoder().encode(JSON.stringify(header));
  const prefix = new Uint8Array(4);
  new DataView(prefix.buffer).setUint32(0, encoded.length);
  return new Blob([prefix, encoded, new Uint8Array(bodyBytes)]);
}

const common = {
  argon2: { memorySize: 65536, iterations: 3, parallelism: 1 },
  salt: b64(16),
  meta: { iv: b64(12), len: 16 },
};

console.log('\n[Backup/Restore: Grenzen, Vollständigkeit, atomarer Ersatz]');

const goodBlob = {
  attMeta: {
    photo: { name: 'photo.jpg', mime: 'image/jpeg', size: CHUNK + 5, chunks: 2 },
  },
};
const goodHeader = {
  v: 4,
  ...common,
  atts: [{ id: 'photo', chunks: [{ iv: b64(12), len: CHUNK + 16 }, { iv: b64(12), len: 21 }] }],
};
ok('v4-Manifest bindet ID, Größe, Chunkzahl und Längen',
  !await throws(() => Promise.resolve(S.validateBackupManifest(goodBlob, goodHeader))));
ok('entfernter Header-Eintrag wird als unvollständig abgelehnt',
  await throws(() => Promise.resolve(S.validateBackupManifest(goodBlob, { ...goodHeader, atts: [] }))));
ok('manipulierte letzte Chunklänge wird abgelehnt',
  await throws(() => Promise.resolve(S.validateBackupManifest(goodBlob, {
    ...goodHeader,
    atts: [{ ...goodHeader.atts[0], chunks: [goodHeader.atts[0].chunks[0], { iv: b64(12), len: 22 }] }],
  }))));

const exactHeader = { v: 4, ...common, atts: [] };
ok('zusätzliche Bytes am Dateiende scheitern vor KDF',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(exactHeader, 17))));
ok('abgeschnittene Meta-Sektion scheitert vor KDF',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(exactHeader, 15))));

const hugePrefix = new Uint8Array(4);
new DataView(hugePrefix.buffer).setUint32(0, 1024 * 1024 + 1);
ok('übergroßer Header wird vor Lesen/KDF abgelehnt',
  await throws(() => S.importBackup({}, 'irrelevant', new Blob([hugePrefix]))));

const emptyChunks = {
  v: 4,
  ...common,
  atts: [{ id: 'photo', chunks: [] }],
};
ok('Attachment ohne Chunk wird vor KDF abgelehnt',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(emptyChunks, 16))));

const duplicate = {
  v: 4,
  ...common,
  atts: [
    { id: 'same', chunks: [{ iv: b64(12), len: 16 }] },
    { id: 'same', chunks: [{ iv: b64(12), len: 16 }] },
  ],
};
ok('doppelte Attachment-ID wird vor KDF abgelehnt',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(duplicate, 48))));

const hostileKdf = {
  ...exactHeader,
  argon2: { memorySize: 262145, iterations: 3, parallelism: 1 },
};
ok('überteure unauthentifizierte KDF-Parameter werden vor KDF abgelehnt',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(hostileKdf, 16))));

const unsafeV2 = {
  v: 2,
  ...common,
  atts: [{ id: 'photo', iv: b64(12), len: 16 }],
};
ok('v2-Attachments ohne kryptografische ID-Bindung werden konservativ abgelehnt',
  await throws(() => S.importBackup({}, 'irrelevant', fileWith(unsafeV2, 32))));

ok('Datei über Gesamtlimit wird abgelehnt, ohne sie zu lesen',
  await throws(() => S.importBackup({}, 'irrelevant', {
    size: 8 * 1024 * 1024 * 1024 + 1,
    slice() { throw new Error('darf nicht lesen'); },
  })));

const backupSrc = fs.readFileSync(new URL('../src/lib/backup.ts', import.meta.url), 'utf8');
const dbSrc = fs.readFileSync(new URL('../src/lib/db.ts', import.meta.url), 'utf8');
const messengerSrc = fs.readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const bootSrc = messengerSrc.slice(messengerSrc.indexOf('const bootLoad = enqueueInbox'));

ok('Restore staged alles vor dem einzigen Commit',
  backupSrc.indexOf('await attachments(stageId)') < backupSrc.indexOf('await commitRestoreStage(stageId)') &&
  !backupSrc.includes('await saveIdentity(dek'));
ok('Commit ersetzt records atomar aus separatem Restore-Store',
  dbSrc.includes("transaction(['records', 'restore', 'kv'], 'readwrite')") &&
  dbSrc.indexOf("restore.get(prefix + 'identity')") < dbSrc.indexOf('await records.clear()') &&
  dbSrc.includes('await records.put(cursor.value.record, cursor.value.recordKey)') &&
  dbSrc.includes('await tx.done'));
ok('Restore wechselt eine persistente Account-Generation gegen alte Tab-Writer',
  dbSrc.includes("kv.put(nextGeneration, ACCOUNT_GENERATION_KEY)") &&
  dbSrc.includes('throw new StaleAccountGenerationError()') &&
  backupSrc.includes('beginAccountRestore()'));
ok('Restore-Fence ist vor dem Staging persistent und wird im Commit atomar entfernt',
  dbSrc.includes("const ACCOUNT_RESTORE_LOCK_KEY = 'account-restore-lock'") &&
  dbSrc.includes('await kv.put(lock, ACCOUNT_RESTORE_LOCK_KEY)') &&
  dbSrc.includes('await kv.delete(ACCOUNT_RESTORE_LOCK_KEY)') &&
  backupSrc.includes('await beginAccountRestore()') &&
  backupSrc.includes('await cancelAccountRestore()'));
ok('Restore-Fence nutzt eine erneuerte Lease statt eines nach Crash permanenten RAM-Tokens',
  dbSrc.includes('ACCOUNT_RESTORE_LEASE_MS') &&
  dbSrc.includes('freshRestoreLock(activeRestoreToken)') &&
  dbSrc.includes("tx.objectStore('restore').clear()"));
ok('Live-Relay wird vor Restore pausiert und erst nach authentifiziertem Boot geöffnet',
  messengerSrc.includes('async function quiesceInbox') &&
  messengerSrc.includes('async function suspendForRestore(): Promise<void>') &&
  messengerSrc.includes('onBeforeImport={suspendForRestore}') &&
  messengerSrc.includes('runtimeSuspendedRef.current = true;') &&
  bootSrc.indexOf('await bootLoad; // contacts are on their final master roomIds') <
    bootSrc.indexOf('connectInbox(ownInbox)') &&
  bootSrc.indexOf('assertMessengerActive();', bootSrc.indexOf('const ownInbox')) <
    bootSrc.indexOf('connectInbox(ownInbox)'));
ok('unsichere Legacy-Restores ohne DeviceList werden abgelehnt',
  backupSrc.includes('Legacy-Backup ohne authentifizierte Geräteliste'));
ok('Gerätenamen und auch cardless Message-Räume reisen im Backup mit',
  backupSrc.includes('deviceNames: await loadDeviceNames(dek)') &&
  backupSrc.includes('...(await allMessageRoomIds())'));
ok('v4 exportiert bounded chunks statt Attachment-arrayBuffer',
  backupSrc.includes('const BACKUP_CHUNK = 4 * 1024 * 1024') &&
  backupSrc.includes('v4AttAad') &&
  !backupSrc.includes('blob.arrayBuffer()'));
ok('Binärformat verlangt exakten EOF',
  backupSrc.includes('if (off !== fileSize) throw new Error(CORRUPT)'));

// Dynamic crash simulation: start + stage a restore, lose every RAM token by switching the DB
// context, then advance beyond the lease. Reopening must discard only the invisible stage and allow
// a normal write; the live generation must remain intact.
await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
await S.saveRecord('live-before-crash', { iv: new Uint8Array(12), ct: new Uint8Array(16) });
await S.beginAccountRestore();
await S.stageRestoreRecord(
  '11111111111111111111111111111111',
  'identity',
  { iv: new Uint8Array(12), ct: new Uint8Array(16) },
);
const realNow = Date.now;
const crashedAt = realNow();
Date.now = () => crashedAt + S.ACCOUNT_RESTORE_LEASE_MS + 1;
await S.switchVaultDb('scytale-decoy');
await S.switchVaultDb('scytale');
let recovered = false;
try {
  await S.saveRecord('live-after-crash', { iv: new Uint8Array(12), ct: new Uint8Array(16) });
  recovered = await S.withVaultDb('scytale', async (d) =>
    (await d.get('records', 'live-before-crash')) !== undefined &&
    (await d.get('records', 'live-after-crash')) !== undefined &&
    (await d.count('restore')) === 0 &&
    (await d.get('kv', 'account-restore-lock')) === undefined);
} finally {
  Date.now = realNow;
}
ok('Crash nach Restore-Beginn wird nach Lease-Ablauf ohne Verlust der Live-Generation geborgen',
  recovered);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
