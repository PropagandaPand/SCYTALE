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

console.log('\n[Contact persistence: UI metadata must not roll back ratchets]');

// Deterministic negative control for the real failure mode. A UI-only change
// serializes the complete Contact while its ratchet is still at generation 0.
// If that delayed whole-record write lands after a send committed generation 1,
// the next send derives generation 1 again: AEAD key/nonce reuse.
{
  let durable = { nickname: '', sendGeneration: 0 };
  const live = { ...durable };
  let releaseUiWrite;
  const uiWriteGate = new Promise((resolve) => {
    releaseUiWrite = resolve;
  });

  const staleUiSnapshot = { ...live, nickname: 'Alice' };
  const delayedUiWrite = (async () => {
    await uiWriteGate;
    durable = staleUiSnapshot;
  })();

  live.sendGeneration++;
  const firstWireGeneration = live.sendGeneration;
  durable = { ...live };
  releaseUiWrite();
  await delayedUiWrite;
  const nextWireGeneration = durable.sendGeneration + 1;

  ok(
    'Negativkontrolle reproduziert Ratchet-Rollback und Key/Nonce-Wiederverwendung',
    firstWireGeneration === 1 &&
      durable.sendGeneration === 0 &&
      nextWireGeneration === firstWireGeneration,
  );
}

// The required ordering: metadata mutation, whole-record serialization and the
// ratchet mutation all run on one serial Contact/inbox chain. The second task
// cannot snapshot generation 0 while generation 1 is being committed.
{
  const queue = S.createKeyedSerialQueue();
  let durable = { nickname: '', sendGeneration: 0 };
  const live = { ...durable };
  let releaseUi;
  const uiGate = new Promise((resolve) => {
    releaseUi = resolve;
  });

  const uiWrite = queue.run('contact', async () => {
    live.nickname = 'Alice';
    await uiGate;
    durable = { ...live };
  });
  const sendWrite = queue.run('contact', async () => {
    live.sendGeneration++;
    durable = { ...live };
    return live.sendGeneration;
  });

  releaseUi();
  const firstWireGeneration = await sendWrite;
  await uiWrite;
  const nextWireGeneration = durable.sendGeneration + 1;

  ok(
    'eine gemeinsame Schleuse erhält UI-Metadaten und den fortgeschrittenen Ratchet',
    durable.nickname === 'Alice' &&
      durable.sendGeneration === 1 &&
      firstWireGeneration === 1,
  );
  ok(
    'der nächste Send nach Reload verwendet eine neue Generation',
    nextWireGeneration === 2 && nextWireGeneration !== firstWireGeneration,
  );
}

// A receive task decrypts against an isolated candidate. Replacing the
// canonical object after that commit leaves an already-captured send callback
// pointing at the old ratchet. Its later whole-Contact write then erases the
// committed receive generation.
{
  const queue = S.createKeyedSerialQueue();
  let canonical = {
    roomId: 'room',
    peerMaster: 'peer',
    receiveGeneration: 0,
    sendGeneration: 0,
  };
  let durable = { ...canonical };
  const capturedBeforeReceiveCommit = canonical;

  const receive = queue.run('inbox', async () => {
    const candidate = {
      ...canonical,
      receiveGeneration: canonical.receiveGeneration + 1,
    };
    durable = { ...candidate };
    canonical = candidate; // the unsafe former map-replace publication
  });
  const staleSend = queue.run('inbox', async () => {
    capturedBeforeReceiveCommit.sendGeneration++;
    durable = { ...capturedBeforeReceiveCommit };
  });
  await Promise.all([receive, staleSend]);

  ok(
    'Negativkontrolle: Contact-Ersetzung lässt einen wartenden Send den Receive-Ratchet zurückrollen',
    canonical !== capturedBeforeReceiveCommit &&
      canonical.receiveGeneration === 1 &&
      durable.receiveGeneration === 0,
  );
}

// Publishing the durable candidate into the canonical object preserves the
// identity held by queued callbacks. Re-resolving inside the queue is an
// additional fail-closed defence for any future path that does replace objects.
{
  const queue = S.createKeyedSerialQueue();
  const canonical = {
    roomId: 'room',
    peerMaster: 'peer',
    receiveGeneration: 0,
    sendGeneration: 0,
  };
  const contacts = [canonical];
  let durable = { ...canonical };
  const capturedBeforeReceiveCommit = canonical;

  const receive = queue.run('inbox', async () => {
    const candidate = {
      ...canonical,
      receiveGeneration: canonical.receiveGeneration + 1,
    };
    durable = { ...candidate };
    Object.assign(canonical, candidate);
  });
  const safeSend = queue.run('inbox', async () => {
    const current =
      contacts.find((contact) => contact === capturedBeforeReceiveCommit) ??
      contacts.find(
        (contact) =>
          contact.roomId === capturedBeforeReceiveCommit.roomId &&
          contact.peerMaster === capturedBeforeReceiveCommit.peerMaster,
      );
    if (!current) throw new Error('stale contact');
    current.sendGeneration++;
    durable = { ...current };
  });
  await Promise.all([receive, safeSend]);

  ok(
    'in-place Publish erhält die kanonische Identität für bereits wartende Sends',
    contacts[0] === capturedBeforeReceiveCommit &&
      capturedBeforeReceiveCommit.receiveGeneration === 1,
  );
  ok(
    'queue-interne Live-Auflösung persistiert Receive- und Send-Fortschritt gemeinsam',
    durable.receiveGeneration === 1 && durable.sendGeneration === 1,
  );
}

const source = readFileSync(
  new URL('../src/Messenger.tsx', import.meta.url),
  'utf8',
);

function functionBody(name) {
  const start = source.indexOf(`async function ${name}(`);
  if (start < 0) return '';
  const nextAsync = source.indexOf('\n  async function ', start + 1);
  const nextPlain = source.indexOf('\n  function ', start + 1);
  const ends = [nextAsync, nextPlain].filter((at) => at >= 0);
  return source.slice(start, ends.length ? Math.min(...ends) : source.length);
}

function plainFunctionBody(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const nextAsync = source.indexOf('\n  async function ', start + 1);
  const nextPlain = source.indexOf('\n  function ', start + 1);
  const ends = [nextAsync, nextPlain].filter((at) => at >= 0);
  return source.slice(start, ends.length ? Math.min(...ends) : source.length);
}

// These paths already persist every ratchet advance inside fanoutSend or
// encryptAndPersist. A second full Contact write after leaving that queue is not
// only redundant: it can be the delayed stale writer which restores CKs/Ns.
const redundantPostQueueSaves = new Map([
  ['forwardTo', 0],
  // Chunk fan-out owns one legitimate persist-before-wire write inside its
  // enqueueInbox callback. The former second write after append is forbidden.
  ['sendChunkedAttachment', 1],
  ['sendOfferedAttachment', 0],
  ['sendMedia', 0],
  ['sendViaR2', 0],
  ['finishRecording', 0],
  ['ensureProfileSent', 0],
]);
for (const [name, allowedSaves] of redundantPostQueueSaves) {
  const body = functionBody(name);
  const saves = [...body.matchAll(/\bsaveContact\s*\(\s*dek\s*,/g)];
  const inboxAt = body.indexOf('enqueueInbox(');
  ok(
    `${name} besitzt keinen redundanten saveContact nach dem serialisierten Send`,
    body.length > 0 &&
      saves.length === allowedSaves &&
      (allowedSaves === 0 || (inboxAt >= 0 && saves[0].index > inboxAt)),
  );
}

// Merely putting saveContact in the queue is insufficient: mutating the shared
// Contact before queue entry lets an already-running inbox task observe a torn
// identity/trust state. The mutation itself must happen after the barrier.
const uiMutations = [
  ['saveNickname', 'c.nickname ='],
  ['markVerified', 'c.verified ='],
  ['dismissVerifiedSuggestion', 'c.verifiedSuggestion ='],
  ['dismissRetiredNotice', 'c.retiredAttempt ='],
  ['acceptNewIdentity', 'acceptMasterChange('],
  ['reconnectStaleContact', 'reconnectContact('],
];
for (const [name, mutation] of uiMutations) {
  const body = functionBody(name);
  const inboxAt = body.indexOf('enqueueInbox(');
  const mutationAt = body.indexOf(mutation);
  const saveAt = body.indexOf('saveContact(');
  ok(
    `${name} mutiert Contact erst innerhalb der Ratchet-/Inbox-Barriere`,
    body.length > 0 &&
      inboxAt >= 0 &&
      mutationAt > inboxAt &&
      (saveAt < 0 || saveAt > mutationAt),
  );
}

// Helpers used by both receive/control and UI flows must either be thin queued
// wrappers or be explicitly named/used as WithinInbox variants. The public
// helper itself may not contain an unbarriered whole-record write.
for (const name of ['ensureSelfContact', 'ensureMemberContact']) {
  const body = functionBody(name);
  const saveAt = body.indexOf('saveContact(');
  const inboxAt = body.indexOf('enqueueInbox(');
  ok(
    `${name} schreibt einen vollständigen Contact nicht außerhalb der Inbox-Schleuse`,
    body.length > 0 && (saveAt < 0 || (inboxAt >= 0 && saveAt > inboxAt)),
  );
}

const publishBody = plainFunctionBody('publishContactCandidate');
const inboxBody = functionBody('onInbox');
const receivePublishes = [
  ...inboxBody.matchAll(
    /publishContactCandidate\s*\(\s*liveContact\s*,\s*contact!?\s*\)/g,
  ),
];
ok(
  'Receive publiziert den durablen Kandidaten in-place in die kanonische Contact-Instanz',
  publishBody.includes('Object.assign(live, candidate)') &&
    publishBody.includes('return live') &&
    !publishBody.includes('contactsRef.current'),
);
ok(
  'alle Receive-Commit-/Identity-Fehler-/Rotation-Pfade verwenden den in-place Publisher',
  receivePublishes.length >= 4,
);
ok(
  'onInbox ersetzt den live Contact nicht mehr per contactsRef-map',
  !/contactsRef\.current\s*=\s*contactsRef\.current\.map\s*\([\s\S]{0,300}liveContact/.test(
    inboxBody,
  ) &&
    !inboxBody.includes('entry === liveContact ? contact : entry') &&
    !inboxBody.includes('candidate === liveContact ? contact : candidate'),
);

const liveResolveHelpers = [
  ['fanoutSend', 'fanoutFromThisDevice(id, current', 'saveContact(dek, current)'],
  ['silentFanout', 'fanoutFromThisDevice( id, current', 'saveContact(dek, current)'],
  ['encryptAndPersist', 'produce(current)', 'saveContact(dek, current)'],
  ['confirmedFanout', 'fanoutFromThisDevice( id, current', 'saveContact(dek, current)'],
];
for (const [name, mutation, persistence] of liveResolveHelpers) {
  const body = functionBody(name);
  const compact = body.replace(/\s+/g, ' ');
  const inboxAt = compact.indexOf('enqueueInbox(');
  const resolveAt = compact.indexOf('requireCurrentContact(');
  ok(
    `${name} löst den aktuellen Contact erst innerhalb der Inbox-Queue auf`,
    body.length > 0 &&
      inboxAt >= 0 &&
      resolveAt > inboxAt &&
      compact.includes(mutation) &&
      compact.includes(persistence),
  );
}

const groupSendBody = functionBody('groupSend');
const compactGroupSend = groupSendBody.replace(/\s+/g, ' ');
const groupQueueAt = compactGroupSend.indexOf('enqueueInbox(');
const groupResolveAt = compactGroupSend.indexOf(
  'const currentContacts = contacts.map(requireCurrentContact)',
);
ok(
  'groupSend löst alle Mitgliedskontakte innerhalb derselben Fanout-Queue neu auf',
  groupQueueAt >= 0 &&
    groupResolveAt > groupQueueAt &&
    compactGroupSend.includes('groupFanoutToDevices( id, currentContacts,') &&
    compactGroupSend.includes(
      'currentContacts.map((contact) => saveContact(dek, contact))',
    ),
);

const currentResolverBody = plainFunctionBody('requireCurrentContact');
ok(
  'requireCurrentContact bevorzugt kanonische Identität, prüft sonst Room+Master und verwirft fehlende Kontakte',
  currentResolverBody.includes('contact === captured') &&
    currentResolverBody.includes('contact.roomId === captured.roomId') &&
    currentResolverBody.includes(
      'bytesEqual(contact.peerMasterPub, captured.peerMasterPub)',
    ) &&
    currentResolverBody.includes('if (!current)') &&
    currentResolverBody.includes('throw new Error('),
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
