// Durable owner-roster mutation retry records: encrypted at rest, AAD-bound to
// their group slot, independently clearable, and fault-isolated while loading.
import 'fake-indexeddb/auto';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const same = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const DB = 'scytale-group-mutations-test';
await S.switchVaultDb(DB);
await S.deleteVaultDb(DB);
await S.switchVaultDb(DB);
const dek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);
const wrongDek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);

const A = 'grp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'grp_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const C = 'grp_cccccccccccccccccccccccccccccccc';
const master1 = new Uint8Array(32).fill(0x11);
const master2 = new Uint8Array(32).fill(0x22);
const master3 = new Uint8Array(32).fill(0x33);
const hashA7 = new Uint8Array(32).fill(0xa7);
const hashA20 = new Uint8Array(32).fill(0x20);
const hashA21 = new Uint8Array(32).fill(0x21);
const hashB13 = new Uint8Array(32).fill(0xb3);
const hashC34 = new Uint8Array(32).fill(0xc4);

console.log('\n[Gruppen-Mutations-Retry: versiegelter Roundtrip]');

const snapshotA7 = await S.savePendingGroupMutation(dek, {
  groupId: A,
  revision: 7,
  stateHash: hashA7,
  removedMasters: [master1, master2],
  deleteLocalAfterDispatch: true,
});
await S.savePendingGroupMutation(dek, {
  groupId: B,
  revision: 13,
  stateHash: hashB13,
  removedMasters: [],
  deleteLocalAfterDispatch: false,
});

const rawA = await S.loadRecord(`group-mutation:${A}`);
const rawCiphertextText = rawA
  ? new TextDecoder().decode(rawA.ct)
  : '';
ok('Retry liegt als AES-GCM-Record mit frischem 96-Bit-IV vor',
  rawA?.iv.length === 12 && rawA.ct.length > 16);
ok('Revision und entfernte Master liegen nicht als lesbares JSON im Record',
  !rawCiphertextText.includes('"r":7') &&
  !rawCiphertextText.includes('ERERERERERERERER'));
ok('v2-Zustands-Hash und lokale Löschabsicht liegen ebenfalls nur versiegelt vor',
  !rawCiphertextText.includes('"h":') &&
  !rawCiphertextText.includes('"d":true'));

const roundtrip = await S.loadPendingGroupMutations(dek);
const loadedA = roundtrip.find((entry) => entry.groupId === A);
const loadedB = roundtrip.find((entry) => entry.groupId === B);
ok('korrekter DEK öffnet beide unabhängigen Retry-Records',
  roundtrip.length === 2 && !!loadedA && !!loadedB);
ok('Roundtrip bewahrt Revision und entfernte Master bytegenau',
  loadedA?.revision === 7 &&
  loadedA.removedMasters.length === 2 &&
  same(loadedA.removedMasters[0], master1) &&
  same(loadedA.removedMasters[1], master2));
ok('Roundtrip bindet Marker an exakten State-Hash und Finalisierungsmodus',
  same(loadedA?.stateHash ?? [], hashA7) &&
  loadedA?.deleteLocalAfterDispatch === true &&
  same(loadedB?.stateHash ?? [], hashB13) &&
  loadedB?.deleteLocalAfterDispatch === false);
ok('leere Removal-Liste bleibt leer',
  loadedB?.revision === 13 && loadedB.removedMasters.length === 0);

let warnings = 0;
const originalWarn = console.warn;
console.warn = () => { warnings++; };
const wrongKeyResult = await S.loadPendingGroupMutations(wrongDek);
console.warn = originalWarn;
ok('falscher DEK kann keinen Retry entschlüsseln',
  wrongKeyResult.length === 0 && warnings === 2);

console.log('\n[Gruppen-Mutations-Retry: Clear löscht nur den gewählten Slot]');

const clearedA7 = await S.clearPendingGroupMutation(snapshotA7);
const afterClear = await S.loadPendingGroupMutations(dek);
ok('Exact-Clear bestätigt und entfernt den gewählten Retry vollständig',
  clearedA7 === true &&
  (await S.loadRecord(`group-mutation:${A}`)) === undefined &&
  !afterClear.some((entry) => entry.groupId === A));
ok('Clear lässt Retry einer anderen Gruppe unverändert',
  afterClear.length === 1 &&
  afterClear[0].groupId === B &&
  afterClear[0].revision === 13);

console.log('\n[Gruppen-Mutations-Retry: veralteter Clear löscht keinen Nachfolger]');

const staleSnapshot = await S.savePendingGroupMutation(dek, {
  groupId: A,
  revision: 20,
  stateHash: hashA20,
  removedMasters: [master1],
  deleteLocalAfterDispatch: false,
});
const currentSnapshot = await S.savePendingGroupMutation(dek, {
  groupId: A,
  revision: 21,
  stateHash: hashA21,
  removedMasters: [master3],
  deleteLocalAfterDispatch: true,
});
const staleClear = await S.clearPendingGroupMutation(staleSnapshot);
const rawAfterStaleClear = await S.loadRecord(`group-mutation:${A}`);
const loadedAfterStaleClear = (await S.loadPendingGroupMutations(dek))
  .find((entry) => entry.groupId === A);
ok('Compare-Delete verweigert den Clear eines ersetzten Ciphertexts',
  staleClear === false);
ok('ein neuerer Marker bleibt nach verspätetem Clear bytegenau erhalten',
  !!rawAfterStaleClear &&
  same(rawAfterStaleClear.iv, currentSnapshot.record.iv) &&
  same(rawAfterStaleClear.ct, currentSnapshot.record.ct) &&
  loadedAfterStaleClear?.revision === 21 &&
  same(loadedAfterStaleClear.stateHash, hashA21) &&
  loadedAfterStaleClear.deleteLocalAfterDispatch === true);
ok('der exakte aktuelle Snapshot darf anschließend gelöscht werden',
  await S.clearPendingGroupMutation(currentSnapshot) === true &&
  (await S.loadRecord(`group-mutation:${A}`)) === undefined);

console.log('\n[Gruppen-Mutations-Retry: beschädigter Record ist isoliert]');

await S.savePendingGroupMutation(dek, {
  groupId: A,
  revision: 21,
  stateHash: hashA21,
  removedMasters: [master3],
  deleteLocalAfterDispatch: true,
});
await S.savePendingGroupMutation(dek, {
  groupId: C,
  revision: 34,
  stateHash: hashC34,
  removedMasters: [master1],
  deleteLocalAfterDispatch: false,
});
const sealedA = await S.loadRecord(`group-mutation:${A}`);
const corruptCt = new Uint8Array(sealedA.ct);
corruptCt[corruptCt.length - 1] ^= 0x80;
await S.saveRecord(`group-mutation:${A}`, {
  iv: sealedA.iv,
  ct: corruptCt,
});

warnings = 0;
console.warn = () => { warnings++; };
const afterCorruption = await S.loadPendingGroupMutations(dek);
console.warn = originalWarn;
ok('ein gebrochener AEAD-Tag wird ignoriert und gemeldet',
  warnings === 1 &&
  !afterCorruption.some((entry) => entry.groupId === A));
ok('Beschädigung eines Slots versteckt keine anderen gültigen Retries',
  afterCorruption.length === 2 &&
  afterCorruption.some((entry) => entry.groupId === B && entry.revision === 13) &&
  afterCorruption.some((entry) => entry.groupId === C && entry.revision === 34));
ok('beschädigter Record bleibt für forensische Analyse erhalten',
  (await S.loadRecord(`group-mutation:${A}`)) !== undefined);

// A valid ciphertext copied into a different group's key must fail because the
// group id is part of the AES-GCM AAD and also checked inside the plaintext.
const sealedB = await S.loadRecord(`group-mutation:${B}`);
await S.saveRecord(`group-mutation:${A}`, sealedB);
warnings = 0;
console.warn = () => { warnings++; };
const afterSwap = await S.loadPendingGroupMutations(dek);
console.warn = originalWarn;
ok('Ciphertext-Slot-Swap scheitert an der groupId-AAD-Bindung',
  warnings === 1 &&
  !afterSwap.some((entry) => entry.groupId === A) &&
  afterSwap.some((entry) => entry.groupId === B) &&
  afterSwap.some((entry) => entry.groupId === C));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
