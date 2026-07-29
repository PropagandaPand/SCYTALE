import 'fake-indexeddb/auto';
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
const throws = async (fn) => {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
};
const bytes = (value) => new Uint8Array(32).fill(value);
const groupId = (hex) => `grp_${hex.repeat(32)}`;

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
const dek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);

console.log('\n[Gruppen-Tombstones: monotone Replay-Barriere + Re-add]');

const owner = bytes(1);
const self = bytes(2);
const base = {
  groupId: groupId('a'),
  ownerMasterPub: owner,
  revision: 4,
  stateHash: bytes(4),
  blockReadd: false,
};
const first = await S.saveGroupRemovalTombstone(dek, base);
const loaded = await S.loadGroupRemovalTombstone(dek, base.groupId);
ok(
  'versiegelter Tombstone roundtript vollständig',
  loaded?.tombstone.revision === 4 &&
    S.bytesEqual(loaded.tombstone.ownerMasterPub, owner) &&
    S.bytesEqual(loaded.tombstone.stateHash, bytes(4)) &&
    loaded.tombstone.blockReadd === false,
);

const strengthened = await S.saveGroupRemovalTombstone(dek, {
  ...base,
  blockReadd: true,
});
ok(
  'gleiche Revision kann nur false→true zu einer lokalen Sperre verstärken',
  strengthened.tombstone.blockReadd === true,
);
const downgrade = await S.saveGroupRemovalTombstone(dek, base);
ok(
  'gleiche Revision kann eine lokale Sperre nicht wieder öffnen',
  downgrade.tombstone.blockReadd === true,
);
const later = await S.saveGroupRemovalTombstone(dek, {
  ...base,
  revision: 7,
  stateHash: bytes(7),
  blockReadd: false,
});
ok(
  'blockReadd bleibt auch über höhere Checkpoints hinweg sticky',
  later.tombstone.revision === 7 && later.tombstone.blockReadd === true,
);
ok(
  'Owner-Equivocation unter gleicher Revision wird nicht still geschluckt',
  await throws(() =>
    S.saveGroupRemovalTombstone(dek, {
      ...later.tombstone,
      stateHash: bytes(8),
    }),
  ),
);

const readdBarrier = {
  ...base,
  groupId: groupId('b'),
  blockReadd: false,
};
ok(
  'legitimes Re-add darf mehrere während der Abwesenheit verpasste Revisionen überspringen',
  S.permitsGroupReadd(
    readdBarrier,
    {
      ownerMasterPub: owner,
      revision: 10,
      roster: [owner, self],
    },
    self,
  ),
);
ok(
  'alte/gleiche Revision, fremder Owner und Roster ohne Self bleiben gesperrt',
  !S.permitsGroupReadd(
    readdBarrier,
    { ownerMasterPub: owner, revision: 4, roster: [owner, self] },
    self,
  ) &&
    !S.permitsGroupReadd(
      readdBarrier,
      { ownerMasterPub: bytes(9), revision: 10, roster: [owner, self] },
      self,
    ) &&
    !S.permitsGroupReadd(
      readdBarrier,
      { ownerMasterPub: owner, revision: 10, roster: [owner] },
      self,
    ),
);
ok(
  'lokaler Leave/Dissolve-Tombstone und terminaler Nachfolger sind nie re-addbar',
  !S.permitsGroupReadd(
    { ...readdBarrier, blockReadd: true },
    { ownerMasterPub: owner, revision: 10, roster: [owner, self] },
    self,
  ) &&
    !S.permitsGroupReadd(
      readdBarrier,
      {
        ownerMasterPub: owner,
        revision: 10,
        roster: [owner, self],
        dissolved: true,
      },
      self,
    ),
);

const exactId = groupId('c');
const oldSnapshot = await S.saveGroupRemovalTombstone(dek, {
  ...base,
  groupId: exactId,
  revision: 1,
  stateHash: bytes(11),
});
await S.saveGroupRemovalTombstone(dek, {
  ...base,
  groupId: exactId,
  revision: 2,
  stateHash: bytes(12),
});
ok(
  'alter compare-delete kann einen neueren Tombstone nicht löschen',
  (await S.clearGroupRemovalTombstone(oldSnapshot)) === false &&
    (await S.loadGroupRemovalTombstone(dek, exactId))?.tombstone.revision === 2,
);

const wire = await S.toGroupRemovalTombstoneWire(readdBarrier);
const wireRoundtrip = await S.fromGroupRemovalTombstoneWire(wire);
ok(
  'Backup/Bootstrap-Wire bindet Owner, Revision, Hash und Re-add-Policy',
  wireRoundtrip.groupId === readdBarrier.groupId &&
    wireRoundtrip.revision === readdBarrier.revision &&
    wireRoundtrip.blockReadd === false &&
    S.bytesEqual(wireRoundtrip.ownerMasterPub, owner) &&
    S.bytesEqual(wireRoundtrip.stateHash, readdBarrier.stateHash),
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
