import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

let pass = 0;
let fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};
const bytes = (value) => new Uint8Array(32).fill(value);
const gid = 'grp_' + 'd'.repeat(32);

console.log('\n[Gruppen-Replaybarrieren in Erst-Sync und Backup]');

const part = {
  t: 'gtombstones',
  tombstones: [
    {
      groupId: gid,
      ownerMasterPub: bytes(1),
      revision: 9,
      stateHash: bytes(2),
      blockReadd: true,
    },
  ],
};
const framed = await S.frameContent({
  kind: 'bootstrap',
  bid: 'group-barrier',
  parts: [part],
});
const decoded = await S.unframeContent(framed);
const roundtrip = decoded.parts?.[0]?.t === 'gtombstones'
  ? decoded.parts[0].tombstones[0]
  : undefined;
ok(
  'Bootstrap-Frame roundtript die komplette Removal-Barriere',
  decoded.kind === 'bootstrap' &&
    roundtrip?.groupId === gid &&
    roundtrip.revision === 9 &&
    roundtrip.blockReadd === true &&
    S.bytesEqual(roundtrip.ownerMasterPub, bytes(1)) &&
    S.bytesEqual(roundtrip.stateHash, bytes(2)),
);

const oversized = await S.frameContent({
  kind: 'bootstrap',
  bid: 'too-many',
  parts: [
    {
      t: 'gtombstones',
      tombstones: Array.from({ length: 65 }, (_, revision) => ({
        groupId: 'grp_' + revision.toString(16).padStart(32, '0'),
        ownerMasterPub: bytes(3),
        revision: revision + 1,
        stateHash: bytes(4),
        blockReadd: false,
      })),
    },
  ],
});
let bounded = false;
try {
  await S.unframeContent(oversized);
} catch {
  bounded = true;
}
ok('ein Bootstrap-Frame ist auf 64 Tombstones begrenzt', bounded);

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
const dek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);
await S.savePendingGroupMutation(dek, {
  groupId: gid,
  revision: 1,
  stateHash: bytes(5),
  removedMasters: [],
  deleteLocalAfterDispatch: false,
});
let exportBlocked = false;
try {
  await S.exportBackup(dek, 'not-used-because-preflight-fails');
} catch (error) {
  exportBlocked = /Gruppenänderung/.test(String(error?.message));
}
ok(
  'Backup startet nicht während einer unvollständig zugestellten Roster-Mutation',
  exportBlocked,
);

const messenger = readFileSync(
  new URL('../src/Messenger.tsx', import.meta.url),
  'utf8',
);
const backup = readFileSync(
  new URL('../src/lib/backup.ts', import.meta.url),
  'utf8',
);
const sendStart = messenger.indexOf('async function sendBootstrapTo');
const sendEnd = messenger.indexOf('async function requestBootstrap', sendStart);
const send = messenger.slice(sendStart, sendEnd);
ok(
  'Erst-Sync sendet Tombstones bestätigt vor jedem live Gruppenstand',
  send.indexOf('loadGroupRemovalTombstones(dek)') >= 0 &&
    send.indexOf('`${bid}-gt-') <
      send.indexOf('`${bid}-g-${group.id}`'),
);
ok(
  'Empfang speichert Tombstone vor möglicher lokaler Gruppenlöschung',
  messenger.indexOf('const installed = await saveGroupRemovalTombstone') <
    messenger.indexOf('await deleteGroupAction(', messenger.indexOf('const installed = await saveGroupRemovalTombstone')),
);
ok(
  'Backup exportiert und Restore staged versiegelte Gruppen-Tombstones',
  backup.includes('groupTombstones: await Promise.all') &&
    backup.includes('sealGroupRemovalTombstoneRecord(dek, tombstone)') &&
    backup.includes('groupRemovalTombstoneRecordKey(tombstone.groupId)'),
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
