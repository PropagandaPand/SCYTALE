// Regression guards for two PRE-EXISTING bugs surfaced by the 2026-07-29 review (byte-identical at
// the prior HEAD, not introduced by the decoy work), fixed in the same batch:
//   • serveAttachment self-deadlock: onInbox (a serialized enqueueInbox task) AWAITed a nested
//     enqueueInbox inside serveAttachment → circular wait → the whole inbox queue bricked.
//   • receiveChunk tid-aliasing: an authenticated peer could send `chunk` frames under a tid equal
//     to one of MY OWN outbound attachments, overwriting/crypto-erasing my sent copy.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[Attachment-Serialisierung: serveAttachment-Deadlock + receiveChunk-Aliasing]');

// ── Behavioural: the enqueueInbox re-entrancy mechanic (faithful replica) ────────────────────────
// A queue promise chained as `run = queue.catch().then(task); queue = run.catch()`. Awaiting a
// NESTED enqueue from inside a task is a circular wait (deadlock); void-ing it is not.
const makeQueue = () => {
  let queue = Promise.resolve();
  const enqueue = (task) => {
    const run = queue.catch(() => undefined).then(task);
    queue = run.catch(() => undefined);
    return run;
  };
  return { enqueue, drain: () => queue };
};
const raceSettle = (p, ms) =>
  Promise.race([p.then(() => 'ok', () => 'ok'), new Promise((r) => setTimeout(() => r('timeout'), ms))]);

// THE FIX: void the nested enqueue → outer completes, inner chains after.
{
  const { enqueue, drain } = makeQueue();
  let innerRan = false;
  const outer = enqueue(async () => {
    void enqueue(async () => { innerRan = true; });
    return 'outer-done';
  });
  ok('Fix-Mechanik: void-genestetes enqueueInbox deadlockt NICHT', (await raceSettle(outer, 200)) === 'ok');
  await raceSettle(drain(), 200);
  ok('Fix-Mechanik: das innere (void) Task läuft nach dem äußeren', innerRan === true);
}
// NEGATIVE CONTROL: awaiting the nested enqueue reproduces the deadlock (the pre-fix bug).
{
  const { enqueue } = makeQueue();
  const outer = enqueue(async () => { await enqueue(async () => {}); });
  ok('Negativkontrolle: await-genestetes enqueueInbox deadlockt (Vor-Fix-Bug)', (await raceSettle(outer, 150)) === 'timeout');
}

// ── Structural: the real code applies both fixes ─────────────────────────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const msg = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');

ok('serveAttachment wird fire-and-forget aufgerufen (kein await → kein Selbst-Deadlock)',
  msg.includes('void serveAttachment(contact, content.tid).catch(() => undefined);') &&
  !msg.includes('await serveAttachment(contact, content.tid);'));
// serveAttachment runs detached now → it must bail if the account switched during prep, before its
// inner enqueueInbox writes (else a ratchet advance could land in the wrong DB on a decoy exit).
ok('serveAttachment bricht bei Kontowechsel während der Vorbereitung ab (kein Cross-Account-Write)',
  msg.indexOf('const servedOrigin = currentDbName();') <
    msg.indexOf('if (currentDbName() !== servedOrigin) return;') &&
  msg.indexOf('if (currentDbName() !== servedOrigin) return;') <
    msg.indexOf('name: meta.name, mime: meta.mime'));

ok('receiveChunk weist eine tid ab, die eine EIGENE ausgehende attId aliast',
  msg.includes('const aliasesExistingAttachment = Object.entries(messagesRef.current).some(') &&
  msg.includes('message.file?.attId === c.tid') &&
  msg.includes('(roomId !== contact.roomId || message.mine)') &&
  msg.includes('if (aliasesExistingAttachment) return;'));
// CRITICAL: the reject must precede EVERY destructive storage step — especially the recall-wipe —
// so a `recall(tid)`-then-`chunk(tid)` sequence can't crypto-erase my own outbound attachment.
ok('receiveChunk: Aliasing-Reject steht VOR dem Recall-Wipe (recall-zuerst-Angriff geschlossen)',
  msg.indexOf('if (aliasesExistingAttachment) return;') <
    msg.indexOf('if (recallRegistryHas(recalledMidsRef.current, contact.roomId, false, c.tid))'));

const chunkSend = msg.slice(
  msg.indexOf('async function sendChunkedAttachment('),
  msg.indexOf('async function sendOfferedAttachment('),
);
const offerSend = msg.slice(
  msg.indexOf('async function sendOfferedAttachment('),
  msg.indexOf('async function serveAttachment('),
);
ok('Chunk-Transfer nutzt dieselbe 128-bit ID für Storage, Sender-Bubble und Recall',
  chunkSend.includes('const tid = randomMid();') &&
  chunkSend.includes('mid: tid,') &&
  !chunkSend.includes('mid: randomMid(),'));
ok('Pull-Offer nutzt auf beiden Seiten tid == Message-MID (Recall trifft den Anhang)',
  offerSend.includes('const tid = randomMid();') &&
  offerSend.includes('mid: tid,') &&
  !offerSend.includes('mid: randomMid(),'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
