// Whole-room message records must serialize the complete mutation, not merely
// their final put. Deliberately delay the first mutation to reproduce the
// ACK/append last-writer-wins race that used to lose the append on reload.
import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name); }
};

console.log('\n[per-room message mutation serialization]');
const queue = S.createKeyedSerialQueue();
const rooms = { a: [{ mid: '1', status: 'pending' }], b: [] };
const writes = [];
let releaseFirst;
const firstGate = new Promise((resolve) => { releaseFirst = resolve; });

const ack = queue.run('a', async () => {
  const next = rooms.a.map((message) => ({ ...message, status: 'sent' }));
  await firstGate;
  writes.push(next);
  rooms.a = next;
});
const append = queue.run('a', async () => {
  const next = [...rooms.a, { mid: '2', status: 'pending' }];
  writes.push(next);
  rooms.a = next;
});
let otherRoomRan = false;
const independent = queue.run('b', async () => { otherRoomRan = true; });
await independent;
ok('unabhängige Räume blockieren einander nicht', otherRoomRan);
releaseFirst();
await Promise.all([ack, append]);
ok('spätere Append-Mutation sieht den bestätigten Vorgänger',
  rooms.a.length === 2 && rooms.a[0].status === 'sent' && rooms.a[1].mid === '2');
ok('persistierte letzte Generation enthält beide Mutationen',
  writes.at(-1).length === 2 && writes.at(-1)[0].status === 'sent');
await queue.drain();
ok('Queue drain erreicht einen leeren Fixpunkt', queue.pending() === 0);

// A two-room move must be one queue entry for BOTH names. It waits for
// predecessors on both rooms, and later work on either room waits for the move.
const moveQueue = S.createKeyedSerialQueue();
const events = [];
let releaseOld;
let releaseNew;
const oldGate = new Promise((resolve) => { releaseOld = resolve; });
const newGate = new Promise((resolve) => { releaseNew = resolve; });
const oldMutation = moveQueue.run('old', async () => {
  events.push('old:start');
  await oldGate;
  events.push('old:end');
});
const newMutation = moveQueue.run('new', async () => {
  events.push('new:start');
  await newGate;
  events.push('new:end');
});
const move = moveQueue.runMany(['new', 'old', 'old'], async () => {
  events.push('move');
});
const afterOld = moveQueue.run('old', async () => {
  events.push('old:after');
});
const afterNew = moveQueue.run('new', async () => {
  events.push('new:after');
});
await Promise.resolve();
releaseOld();
await oldMutation;
await Promise.resolve();
ok('Mehrraum-Mutation wartet auch auf den zweiten Vorgänger',
  !events.includes('move'));
releaseNew();
await Promise.all([newMutation, move, afterOld, afterNew]);
const moveAt = events.indexOf('move');
ok('Mehrraum-Mutation läuft erst nach beiden Raum-Mutationen',
  moveAt > events.indexOf('old:end') && moveAt > events.indexOf('new:end'));
ok('spätere Mutation beider Raum-IDs sieht den Rekey als Barriere',
  events.indexOf('old:after') > moveAt && events.indexOf('new:after') > moveAt);
await moveQueue.drain();
ok('Mehrraum-Sperre räumt alle Alias-Tails auf', moveQueue.pending() === 0);

// Regression for clear/delete: an older RMW may already hold a stale snapshot,
// but the destructive operation is queued behind it and therefore remains the
// final durable generation. A later ACK sees the cleared live state and is a no-op.
const deleteQueue = S.createKeyedSerialQueue();
let history = [{ mid: 'old', status: 'pending' }];
let roomKeyAlive = true;
let releaseStaleAck;
const staleAckGate = new Promise((resolve) => { releaseStaleAck = resolve; });
const staleAck = deleteQueue.run('room', async () => {
  const stale = history.map((message) => ({ ...message, status: 'sent' }));
  await staleAckGate;
  history = stale;
});
const clear = deleteQueue.run('room', async () => {
  history = [];
  roomKeyAlive = false;
});
const lateAck = deleteQueue.run('room', async () => {
  const index = history.findIndex((message) => message.mid === 'old');
  if (index < 0) return;
  history = history.map((message, i) =>
    i === index ? { ...message, status: 'sent' } : message);
  roomKeyAlive = true;
});
releaseStaleAck();
await Promise.all([staleAck, clear, lateAck]);
ok('Clear/Delete bleibt nach laufendem stale RMW die letzte Generation',
  history.length === 0 && roomKeyAlive === false);

// Room-only locking is not sufficient when an older inbox task is still doing
// crypto/file work and enters the room queue only AFTER the user clicks delete.
// The inbox barrier must be outermost; it also orders the task's final
// saveContact before removeContact.
const delayedRoomQueue = S.createKeyedSerialQueue();
let inboxTail = Promise.resolve();
const enqueueInbox = (task) => {
  const run = inboxTail.catch(() => undefined).then(task);
  inboxTail = run.catch(() => undefined);
  return run;
};
let releaseDecrypt;
let markInboxStarted;
const decryptGate = new Promise((resolve) => { releaseDecrypt = resolve; });
const inboxStarted = new Promise((resolve) => { markInboxStarted = resolve; });
let delayedHistory = [];
let contactRecordAlive = true;
const order = [];
const olderInbox = enqueueInbox(async () => {
  order.push('inbox:start');
  markInboxStarted();
  await decryptGate; // appendMessage has deliberately NOT entered its queue yet
  await delayedRoomQueue.run('room', async () => {
    order.push('append');
    delayedHistory = [{ mid: 'late-old' }];
  });
  order.push('saveContact');
  contactRecordAlive = true;
});
await inboxStarted;
order.push('delete:requested');
const inboxBarrierDelete = enqueueInbox(() =>
  delayedRoomQueue.run('room', async () => {
    order.push('delete');
    delayedHistory = [];
    contactRecordAlive = false;
  }));
releaseDecrypt();
await Promise.all([olderInbox, inboxBarrierDelete]);
ok('Inbox-Barriere ordnet verspäteten Append vor Clear/Delete',
  order.indexOf('append') < order.indexOf('delete') && delayedHistory.length === 0);
ok('Inbox-Barriere ordnet saveContact vor removeContact',
  order.indexOf('saveContact') < order.indexOf('delete') && contactRecordAlive === false);

const messenger = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
ok('Messenger besitzt genau eine getestete per-room Mutationsschleuse',
  messenger.includes('createKeyedSerialQueue()') &&
  messenger.includes('return messageMutationQueueRef.current.runMany(roomIds, task);'));
ok('ACK/NACK persistiert nicht mehr fire-and-forget außerhalb der Schleuse',
  !messenger.includes('void saveMessages(dek, roomId, next);'));
ok('Chat-Leeren nutzt Inbox-Barriere außen und Message-Schleuse innen',
  /async function clearChatAction\(roomId[\s\S]*?await enqueueInbox\(\(\) =>\s*enqueueMessageMutation\(roomId,[\s\S]*?await clearMessages\(roomId\)/.test(messenger));
ok('Kontakt-Löschen ordnet auch den finalen Ratchet/Contact-Commit über Inbox',
  /async function deleteContactAction\(roomId[\s\S]*?await enqueueInbox\(\(\) =>\s*enqueueMessageMutation\(roomId,[\s\S]*?await removeContact\(dek, roomId\)/.test(messenger));
ok('interner Gruppen-Delete ist vollständig in der Message-Schleuse',
  /async function deleteGroupActionWithinInbox\([\s\S]*?await enqueueMessageMutation\(gid,[\s\S]*?await removeGroup\(dek, gid\)/.test(messenger));
ok('externer Gruppen-Delete nutzt die Inbox-Barriere ohne Selbstverschachtelung',
  /async function deleteGroupAction\([\s\S]*?await enqueueInbox\(\(\) =>\s*deleteGroupActionWithinInbox/.test(messenger) &&
  messenger.includes('await deleteGroupActionWithinInbox(legacy.id);'));
ok('Rekey sperrt alte und neue Room-ID gemeinsam',
  /async function reKeyContactInMemory[\s\S]*?await enqueueMessageMutations\(\[oldRoomId, newRoomId\],[\s\S]*?await moveContactStorage/.test(messenger));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
