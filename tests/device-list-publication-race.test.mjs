import { readFileSync } from 'node:fs';

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

const source = readFileSync(
  new URL('../src/Messenger.tsx', import.meta.url),
  'utf8',
);

console.log('\n[Own DeviceList publication: delayed continuations cannot roll authority back]');

// Deterministic negative control for the exact race: CAS writer A commits v2
// and pauses in delivery, writer B commits/publishes v3, then A resumes.
const v2 = { epoch: 1, version: 2 };
const v3 = { epoch: 1, version: 3 };
let blind = v2;
blind = v3;
blind = v2;
ok('Negativkontrolle: blindes RAM-Publish rollt v3 auf v2 zurück',
  blind.version === 2);

let monotone = v2;
const publish = (candidate) => {
  if (
    candidate.epoch > monotone.epoch ||
    (candidate.epoch === monotone.epoch &&
      candidate.version > monotone.version)
  ) {
    monotone = candidate;
  }
};
publish(v3);
publish(v2);
ok('monotones Publish behält v3 trotz verspäteter v2-Fortsetzung',
  monotone.version === 3);

const helperStart = source.indexOf('function publishOwnDeviceList(');
const helperEnd = source.indexOf('async function reconcileOwnDeviceList(', helperStart);
const helper = source.slice(helperStart, helperEnd);
const reconcileEnd = source.indexOf('// Rename one of my devices', helperEnd);
const reconcile = source.slice(helperEnd, reconcileEnd);
ok('Produktionshelper vergleicht (epoch, version) und ersetzt nur strikt vorwärts',
  helper.includes('compareDeviceList(candidate, current) > 0') &&
  helper.includes('ownListRef.current = candidate'));
ok('nach CAS wird die aktuelle durable Liste erneut geladen und monoton publiziert',
  reconcile.includes('loadOrCreateOwnDeviceList(') &&
  reconcile.includes('return publishOwnDeviceList(durable);'));

const assignments = [...source.matchAll(/ownListRef\.current\s*=\s*([^;]+);/g)]
  .map((match) => match[1].trim());
ok('keine Caller-Fortsetzung schreibt ownListRef mehr blind zurück',
  assignments.length === 2 &&
  assignments.includes('candidate') &&
  assignments.includes('null'));

const removeStart = source.indexOf('async function removeDeviceAction(');
const removeEnd = source.indexOf('async function unlinkSelfAction(', removeStart);
const remove = source.slice(removeStart, removeEnd);
ok('manueller Widerruf versendet und gossipt nur die reconciled Authority',
  remove.includes('const authoritative = await reconcileOwnDeviceList(next);') &&
  remove.includes("{ kind: 'devlist', list: authoritative }") &&
  remove.includes('await gossipDeviceList(authoritative);'));

const syncStart = source.indexOf('async function synchronizeCommittedPrimaryLinkList(');
const syncEnd = source.indexOf('async function retryPrimaryLinkGrantDeliveryNow', syncStart);
const sync = source.slice(syncStart, syncEnd);
ok('Link-CAS-Publisher akzeptiert einen parallel neueren Stand statt Gleichheit zu erzwingen',
  sync.includes('const authoritative = await reconcileOwnDeviceList(list);') &&
  sync.includes('compareDeviceList(durable, list) < 0'));

const gossipStart = source.indexOf('async function gossipDeviceList(');
const gossipEnd = source.indexOf('async function onPConfirmSas()', gossipStart);
const gossip = source.slice(gossipStart, gossipEnd);
ok('Gossip reconciled vor jedem Peer-/Self-Fanout und nutzt denselben Stand',
  gossip.includes('const authoritative = await reconcileOwnDeviceList(list);') &&
  gossip.includes("{ kind: 'devlist', list: authoritative }"));

const ownReceiveStart = source.indexOf("} else if (content.kind === 'devlist') {");
const ownReceiveEnd = source.indexOf("} else if (content.kind === 'listack') {", ownReceiveStart);
const ownReceive = source.slice(ownReceiveStart, ownReceiveEnd);
ok('eigener verspäteter Sync kann weder RAM-Rollback noch falschen Self-Wipe auslösen',
  ownReceive.includes('const durableBefore = await reconcileOwnDeviceList();') &&
  ownReceive.indexOf('compareDeviceList(content.list, durableBefore) > 0') <
    ownReceive.indexOf('!deviceInList(content.list, id.sign.publicKey)') &&
  ownReceive.includes('acceptedList = await reconcileOwnDeviceList(content.list);') &&
  !ownReceive.includes('ownListRef.current = content.list'));

const unlinkStart = source.indexOf("} else if (content.kind === 'unlinkreq') {");
const unlinkEnd = source.indexOf("} else if (content.kind === 'rotation') {", unlinkStart);
const unlink = source.slice(unlinkStart, unlinkEnd);
ok('eingehender Unlink reconciled vor dem detached Gossip',
  unlink.includes('const authoritative = await reconcileOwnDeviceList(next);') &&
  unlink.includes('void gossipDeviceList(authoritative)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
