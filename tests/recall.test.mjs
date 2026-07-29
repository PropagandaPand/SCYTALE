// Message recall ("unsend"): wire framing plus the direction/room-bound registry
// and recalled-attachment disposal used by the React receive coordinator.
import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[recall frame round-trips its target mid]');

const framed = await S.frameContent({ kind: 'recall', targetMid: 'a1b2c3d4e5f6a1b2c3d4e5f6' });
ok('frame byte is 15', framed[0] === 15);
const back = await S.unframeContent(framed);
ok('decodes as kind recall with the target mid', back.kind === 'recall' && back.targetMid === 'a1b2c3d4e5f6a1b2c3d4e5f6');
// NEGATIVE CONTROL: a recall must not be misread as a text/file message.
ok('Negativkontrolle: nicht als text/file fehlinterpretiert', back.kind !== 'text' && back.kind !== 'file');

console.log('\n[recall registry is room + direction scoped]');
const reflectedMid = '11111111111111111111111111111111';
const peerRecall = new Set([S.recallRegistryKey('room-a', false, reflectedMid)]);
ok('Peer-Original im selben Raum wird tombstoned',
  S.applyRecallRegistry(peerRecall, 'room-a', {
    mine: false, mid: reflectedMid, ts: 1, text: 'peer',
  }).message.recalled === true);
const ownSelfSync = S.applyRecallRegistry(peerRecall, 'room-a', {
  mine: true, mid: reflectedMid, ts: 1, text: 'mine',
}).message;
ok('reflektierter Peer-Recall unterdrückt mine=true Self-Sync nicht',
  ownSelfSync.recalled !== true && ownSelfSync.text === 'mine');
const otherRoom = S.applyRecallRegistry(peerRecall, 'room-b', {
  mine: false, mid: reflectedMid, ts: 1, text: 'other room',
}).message;
ok('gleiche MID in einem anderen Raum bleibt unberührt',
  otherRoom.recalled !== true && otherRoom.text === 'other room');

const ownRecall = new Set([S.recallRegistryKey('room-a', true, reflectedMid)]);
ok('eigener Recall trifft mine=true, aber nicht die empfangene Richtung',
  S.applyRecallRegistry(ownRecall, 'room-a', {
    mine: true, mid: reflectedMid, ts: 1, text: 'mine',
  }).message.recalled === true &&
  S.applyRecallRegistry(ownRecall, 'room-a', {
    mine: false, mid: reflectedMid, ts: 1, text: 'peer',
  }).message.recalled !== true);

console.log('\n[legacy recall migration fails safe]');
const legacyMid = '22222222222222222222222222222222';
const alreadyScoped = S.recallRegistryKey('room-c', true, '33333333333333333333333333333333');
const migrated = new Set(S.migrateLegacyRecalledMids(
  [legacyMid, alreadyScoped, 'v2:malformed'],
  {
    'room-a': [
      { mine: false, mid: legacyMid, ts: 1, recalled: true },
      // This could have been suppressed by the old peer-reflection bug. It must
      // never be promoted into the mine=true namespace.
      { mine: true, mid: legacyMid, ts: 1, recalled: true },
    ],
    'room-b': [{ mine: false, mid: legacyMid, ts: 1, text: 'not recalled' }],
  },
));
ok('Legacy-MID wird nur aus belegtem mine=false Tombstone rekonstruiert',
  S.recallRegistryHas(migrated, 'room-a', false, legacyMid));
ok('Legacy-MID wird weder mine=true noch raumübergreifend migriert',
  !S.recallRegistryHas(migrated, 'room-a', true, legacyMid) &&
  !S.recallRegistryHas(migrated, 'room-b', false, legacyMid));
ok('gültiger v2-Schlüssel bleibt erhalten, missgebildeter wird verworfen',
  migrated.has(alreadyScoped) && !migrated.has('v2:malformed'));

const beforeMove = [
  S.recallRegistryKey('room-old', false, reflectedMid),
  S.recallRegistryKey('room-old', true, legacyMid),
  S.recallRegistryKey('room-other', false, legacyMid),
];
const stagedMove = new Set(S.moveRecallRegistryRoom(beforeMove, 'room-old', 'room-new', true));
const completedMove = new Set(S.moveRecallRegistryRoom(stagedMove, 'room-old', 'room-new'));
ok('Room-Rekey hält während des Storage-Moves alte und neue Recall-Intents',
  S.recallRegistryHas(stagedMove, 'room-old', false, reflectedMid) &&
  S.recallRegistryHas(stagedMove, 'room-new', false, reflectedMid));
ok('Room-Rekey entfernt danach nur alte Aliase und bewahrt Richtung/Fremdräume',
  !S.recallRegistryHas(completedMove, 'room-old', false, reflectedMid) &&
  S.recallRegistryHas(completedMove, 'room-new', false, reflectedMid) &&
  S.recallRegistryHas(completedMove, 'room-new', true, legacyMid) &&
  S.recallRegistryHas(completedMove, 'room-other', false, legacyMid));

console.log('\n[recalled attachments leave no orphan]');
const recalledAttachmentMid = '44444444444444444444444444444444';
const attachmentRegistry = new Set([
  S.recallRegistryKey('room-attachments', false, recalledAttachmentMid),
]);
for (const [kind, message] of [
  ['inline', {
    mine: false, mid: recalledAttachmentMid, ts: 1,
    file: { name: 'inline.bin', mime: 'application/octet-stream', attId: 'att-inline', size: 1 },
  }],
  ['reply', {
    mine: false, mid: recalledAttachmentMid, ts: 1,
    reply: { mid: 'quoted', text: 'quote', mine: true },
    file: { name: 'reply.bin', mime: 'application/octet-stream', attId: 'att-reply', size: 1 },
  }],
  ['chunk', {
    mine: false, mid: recalledAttachmentMid, ts: 1,
    file: { name: 'chunk.bin', mime: 'application/octet-stream', attId: 'att-chunk', size: 1 },
  }],
]) {
  const stored = new Set([message.file.attId]);
  const prepared = await S.prepareRecalledMessageForAppend(
    attachmentRegistry,
    'room-attachments',
    message,
    async (id) => { stored.delete(id); },
  );
  ok(`${kind}: Blob wird vor dem Tombstone gewipet`,
    stored.size === 0 &&
    prepared.recalled === true &&
    prepared.file === undefined &&
    prepared.reply === undefined);
}

// Integration guards: the dynamically tested helper is the single append gate,
// while the chunk path additionally refuses storage before materialisation.
const messenger = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const appendStart = messenger.indexOf('async function appendMessage');
const appendEnd = messenger.indexOf('async function appendFreshInboundMessage', appendStart);
const chunkStart = messenger.indexOf('async function receiveChunk');
const chunkEnd = messenger.indexOf('// Serialize every inbox task', chunkStart);
ok('Messenger-Append nutzt den getesteten Wipe-vor-Tombstone-Helfer',
  messenger.slice(appendStart, appendEnd).includes('await prepareRecalledMessageForAppend'));
ok('Chunk-Pfad prüft den scoped Recall vor sealAndPutChunk',
  messenger.slice(chunkStart, chunkEnd).indexOf('recallRegistryHas') >= 0 &&
  messenger.slice(chunkStart, chunkEnd).indexOf('recallRegistryHas') <
    messenger.slice(chunkStart, chunkEnd).indexOf('sealAndPutChunk'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
