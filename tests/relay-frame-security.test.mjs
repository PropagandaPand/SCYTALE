// Relay trust-boundary regression tests. The Worker module is transpiled with a
// tiny DurableObject base stub so these tests execute the production validators
// and malformed-frame handler, rather than reimplementing either in the test.
import { readFileSync } from 'node:fs';
import ts from 'typescript';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

const relaySource = readFileSync(new URL('../worker/relay.ts', import.meta.url), 'utf8');
const instrumented = relaySource.replace(
  "import { DurableObject } from 'cloudflare:workers';",
  'class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }',
) + `
export {
  earliestTimestamp,
  isCanonicalBase64,
  isCanonicalBase64Url,
  isPlainRecord,
  isSafeAckId,
  isSafeMid,
  parsePushEndpoint,
  parsePushSubscription,
};`;
const compiled = ts.transpileModule(instrumented, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const relay = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function cursor(one = {}, rows = []) {
  return {
    one: () => one,
    toArray: () => rows,
    *[Symbol.iterator]() {
      yield* rows;
    },
  };
}

class MemorySql {
  calls = [];
  queue = [];
  pushDue = null;
  nextId = 1;
  claimed = true;
  actorWindows = new Map();

  exec(query, ...args) {
    const sql = query.replace(/\s+/g, ' ').trim();
    this.calls.push({ sql, args });
    if (sql.startsWith('UPDATE q SET ts')) {
      for (const row of this.queue) if (row.ts === null) row.ts = args[0];
    } else if (sql.startsWith('DELETE FROM q WHERE ts IS NOT NULL')) {
      this.queue = this.queue.filter((row) => row.ts === null || row.ts > args[0]);
    } else if (sql.startsWith('INSERT INTO q ')) {
      const row = { id: this.nextId++, body: args[0], ts: args[1], silent: args[2] };
      this.queue.push(row);
      return cursor({ id: row.id });
    } else if (sql === 'SELECT id, body FROM q ORDER BY id') {
      return cursor({}, [...this.queue].sort((a, b) => a.id - b.id));
    } else if (sql.startsWith('DELETE FROM q WHERE id =')) {
      this.queue = this.queue.filter((row) => row.id !== args[0]);
    } else if (sql.includes('COALESCE(SUM(LENGTH(body))')) {
      return cursor({
        n: this.queue.length,
        bytes: this.queue.reduce((sum, row) => sum + row.body.length, 0),
      });
    } else if (sql === 'SELECT COUNT(*) AS n FROM q WHERE silent = 0') {
      return cursor({ n: this.queue.filter((row) => row.silent === 0).length });
    } else if (sql.startsWith('INSERT OR IGNORE INTO alarm_state')) {
      if (this.pushDue === null) this.pushDue = args[1];
    } else if (sql.startsWith('DELETE FROM alarm_state')) {
      this.pushDue = null;
    } else if (sql.startsWith('SELECT MAX(value) AS value FROM alarm_state')) {
      return cursor({ value: this.pushDue });
    } else if (sql === 'SELECT MIN(ts) AS ts FROM q WHERE ts IS NOT NULL') {
      const timestamps = this.queue.map((row) => row.ts).filter((value) => value !== null);
      return cursor({ ts: timestamps.length ? Math.min(...timestamps) : null });
    } else if (sql === 'SELECT COUNT(*) AS n FROM room_state WHERE id = 1') {
      return cursor({ n: this.claimed ? 1 : 0 });
    } else if (sql.startsWith('INSERT OR IGNORE INTO room_state')) {
      this.claimed = true;
    } else if (sql === 'SELECT window_start, frames, bytes FROM actor_window WHERE actor = ?') {
      const row = this.actorWindows.get(args[0]);
      return cursor({}, row ? [row] : []);
    } else if (sql.startsWith('INSERT INTO actor_window')) {
      this.actorWindows.set(args[0], {
        window_start: args[1],
        frames: args[2],
        bytes: args[3],
      });
    } else if (sql.startsWith('DELETE FROM actor_window')) {
      // Windows are bounded in production; no-op is sufficient for this fixture.
    }
    return cursor({ n: 0, bytes: 0, value: null, ts: null, id: 1 });
  }
}

function makeCtx(openSockets = []) {
  const sql = new MemorySql();
  const waits = [];
  let alarm = null;
  const ctx = {
    sql,
    waits,
    init: Promise.resolve(),
    storage: {
      sql,
      getAlarm: async () => alarm,
      setAlarm: async (value) => { alarm = Number(value); },
      deleteAlarm: async () => { alarm = null; },
      transactionSync: (callback) => callback(),
    },
    getWebSockets: () => openSockets,
    acceptWebSocket: () => {},
    waitUntil: (promise) => { waits.push(Promise.resolve(promise)); },
    drain: async () => {
      while (waits.length) await Promise.all(waits.splice(0));
    },
  };
  ctx.blockConcurrencyWhile = (callback) => {
    ctx.init = Promise.resolve().then(callback);
    return ctx.init;
  };
  return ctx;
}

const actor = 'b'.repeat(64);
const relayGuard = {
  getByName: () => ({
    charge: async () => true,
    claimRoom: async () => true,
  }),
};

function socket(owner = false, room = 'a'.repeat(64)) {
  let attachment = { room, owner, actor, connectedAt: Date.now() };
  return {
    closed: [],
    sent: [],
    deserializeAttachment: () => attachment,
    serializeAttachment: (value) => { attachment = value; },
    close(code, reason) { this.closed.push({ code, reason }); },
    send(value) { this.sent.push(JSON.parse(value)); },
  };
}

console.log('\n[relay: strict validators]');
ok('plain object accepted', relay.isPlainRecord({ t: 'ping' }));
ok('null/array/primitive rejected', !relay.isPlainRecord(null) && !relay.isPlainRecord([]) && !relay.isPlainRecord('x'));
ok('canonical padded Base64 accepted', relay.isCanonicalBase64('AA==', 16, 1));
ok('invalid alphabet/padding/whitespace rejected',
  !relay.isCanonicalBase64('!', 16) &&
  !relay.isCanonicalBase64('A===', 16) &&
  !relay.isCanonicalBase64('AA==\n', 16));
ok('non-canonical unused Base64 bits rejected', !relay.isCanonicalBase64('AB==', 16, 1));
ok('ack id must be a positive safe integer',
  relay.isSafeAckId(1) &&
  !relay.isSafeAckId(0) &&
  !relay.isSafeAckId(1.5) &&
  !relay.isSafeAckId(Number.MAX_SAFE_INTEGER + 1));
ok('mid is bounded printable ASCII',
  relay.isSafeMid('0123456789abcdef0123456789abcdef') &&
  !relay.isSafeMid('x'.repeat(129)) &&
  !relay.isSafeMid('line\nbreak'));
ok('earliestTimestamp ignores null and selects the minimum',
  relay.earliestTimestamp(null, 300, 100, 200) === 100);

const p256 = new Uint8Array(65);
p256[0] = 0x04;
const auth = new Uint8Array(16);
const pushSub = {
  endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/test-token',
  expirationTime: null,
  keys: {
    p256dh: Buffer.from(p256).toString('base64url'),
    auth: Buffer.from(auth).toString('base64url'),
  },
};
ok('browser PushSubscription JSON accepted, expirationTime included',
  relay.parsePushSubscription(pushSub)?.endpoint === pushSub.endpoint);
ok('major browser push-provider hosts are accepted',
  relay.parsePushEndpoint('https://fcm.googleapis.com/fcm/send/token') !== null &&
  relay.parsePushEndpoint('https://web.push.apple.com/token') !== null &&
  relay.parsePushEndpoint('https://db3.notify.windows.com/w/?token=x') !== null);
ok('push parser strips non-required expirationTime before storage',
  !('expirationTime' in relay.parsePushSubscription(pushSub)));
ok('HTTP, credentials and oversized endpoints rejected',
  relay.parsePushEndpoint('http://push.example/token') === null &&
  relay.parsePushEndpoint('https://user:pass@push.example/token') === null &&
  relay.parsePushEndpoint(`https://push.example/${'x'.repeat(2100)}`) === null);
ok('non-browser HTTPS endpoint rejected',
  relay.parsePushEndpoint('https://example.com/push/token') === null);
ok('unknown push fields rejected',
  relay.parsePushSubscription({ ...pushSub, padding: 'x'.repeat(100) }) === null);
ok('malformed push keys rejected',
  relay.parsePushSubscription({ ...pushSub, keys: { ...pushSub.keys, auth: '!' } }) === null);
const wrongPoint = new Uint8Array(p256);
wrongPoint[0] = 0x03;
ok('non-uncompressed P-256 push key rejected',
  relay.parsePushSubscription({
    ...pushSub,
    keys: { ...pushSub.keys, p256dh: Buffer.from(wrongPoint).toString('base64url') },
  }) === null);

console.log('\n[relay: malformed frames close only the offender]');
const ctx = makeCtx();
const room = new relay.RelayRoom(ctx, { RELAY_GUARD: relayGuard });
await ctx.init;

const invalidJson = socket();
await room.webSocketMessage(invalidJson, '{');
ok('invalid JSON closes with 1007 and does not throw', invalidJson.closed[0]?.code === 1007);

const primitive = socket();
await room.webSocketMessage(primitive, 'null');
ok('JSON primitive closes with 1007 instead of crashing the DO', primitive.closed[0]?.code === 1007);

const binary = socket();
await room.webSocketMessage(binary, new ArrayBuffer(1));
ok('binary frame closes with 1003', binary.closed[0]?.code === 1003);

const poisoned = socket();
await room.webSocketMessage(poisoned, JSON.stringify({ t: 'send', b64: '!' }));
ok('invalid Base64 send closes with policy violation', poisoned.closed[0]?.code === 1008);
ok('invalid Base64 never reaches the queue', ctx.sql.queue.length === 0);

const nonCanonical = socket();
await room.webSocketMessage(nonCanonical, JSON.stringify({ t: 'send', b64: 'AB==' }));
ok('non-canonical Base64 never reaches the queue',
  nonCanonical.closed[0]?.code === 1008 && ctx.sql.queue.length === 0);

const oversizedMid = socket();
await room.webSocketMessage(oversizedMid, JSON.stringify({ t: 'send', b64: 'AA==', mid: 'x'.repeat(129) }));
ok('oversized mid closes before insertion',
  oversizedMid.closed[0]?.code === 1008 && ctx.sql.queue.length === 0);

const valid = socket();
await room.webSocketMessage(valid, JSON.stringify({
  t: 'send',
  b64: 'AA==',
  mid: '0123456789abcdef0123456789abcdef',
}));
await ctx.drain();
ok('negative control: a valid send is inserted', ctx.sql.queue.length === 1);
ok('valid send receives its durable sent receipt',
  valid.sent.some((frame) => frame.t === 'sent' && frame.mid === '0123456789abcdef0123456789abcdef'));

const freshCtx = makeCtx();
freshCtx.sql.claimed = false;
const freshRoom = new relay.RelayRoom(freshCtx, { RELAY_GUARD: relayGuard });
await freshCtx.init;
const beforeClaim = socket();
await freshRoom.webSocketMessage(beforeClaim, JSON.stringify({ t: 'send', b64: 'AA==', mid: 'first' }));
// Store-and-forward is NEVER hard-gated on a prior owner claim (that silently broke delivery
// to the whole fleet after a relay migration, and to anyone offline / behind a shared CGNAT IP
// that exhausted the per-IP claim budget). An unclaimed inbox still accepts a send.
ok('unclaimed inbox still ACCEPTS a send (delivery is never gated on a prior claim)',
  freshCtx.sql.queue.length === 1 &&
  beforeClaim.sent.some((frame) => frame.t === 'sent' && frame.mid === 'first') &&
  !beforeClaim.sent.some((frame) => frame.t === 'nack'));

const badAck = socket(true);
await room.webSocketMessage(badAck, JSON.stringify({ t: 'ack', id: 1.5 }));
ok('fractional ack id closes and cannot delete', badAck.closed[0]?.code === 1008 && ctx.sql.queue.length === 1);

const goodAck = socket(true);
await room.webSocketMessage(goodAck, JSON.stringify({ t: 'ack', id: 1 }));
await ctx.drain();
ok('negative control: authenticated safe ack deletes', goodAck.closed.length === 0 && ctx.sql.queue.length === 0);

const malformedAuth = socket();
await room.webSocketMessage(malformedAuth, JSON.stringify({ t: 'auth', signPub: '!', sig: '!' }));
ok('malformed auth Base64 closes without atob escaping', malformedAuth.closed[0]?.code === 1008);
ok('failed auth never emits authed', !malformedAuth.sent.some((frame) => frame.t === 'authed'));

const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
const signPub = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
const inboxMaterial = new Uint8Array(new TextEncoder().encode('scytale-inbox:').length + signPub.length);
inboxMaterial.set(new TextEncoder().encode('scytale-inbox:'), 0);
inboxMaterial.set(signPub, new TextEncoder().encode('scytale-inbox:').length);
const inbox = Buffer.from(await crypto.subtle.digest('SHA-256', inboxMaterial)).toString('hex');
const owner = socket(false, inbox);
await room.webSocketMessage(owner, JSON.stringify({ t: 'hello' }));
const challenge = owner.sent.find((frame) => frame.t === 'challenge');
const signature = new Uint8Array(
  await crypto.subtle.sign({ name: 'Ed25519' }, keyPair.privateKey, Buffer.from(challenge.nonce, 'base64')),
);
await room.webSocketMessage(owner, JSON.stringify({
  t: 'auth',
  signPub: Buffer.from(signPub).toString('base64'),
  sig: Buffer.from(signature).toString('base64'),
}));
await ctx.drain();
ok('successful owner proof emits explicit authed', owner.sent.some((frame) => frame.t === 'authed'));

const freshOwner = socket(false, inbox);
await freshRoom.webSocketMessage(freshOwner, JSON.stringify({ t: 'hello' }));
const freshChallenge = freshOwner.sent.find((frame) => frame.t === 'challenge');
const freshSignature = new Uint8Array(
  await crypto.subtle.sign(
    { name: 'Ed25519' },
    keyPair.privateKey,
    Buffer.from(freshChallenge.nonce, 'base64'),
  ),
);
await freshRoom.webSocketMessage(freshOwner, JSON.stringify({
  t: 'auth',
  signPub: Buffer.from(signPub).toString('base64'),
  sig: Buffer.from(freshSignature).toString('base64'),
}));
const afterClaim = socket(false, inbox);
await freshRoom.webSocketMessage(afterClaim, JSON.stringify({ t: 'send', b64: 'AA==', mid: 'after-claim' }));
await freshCtx.drain();
ok('owner auth still claims the inbox (best-effort, for per-room accounting) and never blocks delivery',
  freshCtx.sql.claimed &&
  freshOwner.sent.some((frame) => frame.t === 'authed') &&
  freshCtx.sql.queue.length === 2); // 'first' (pre-claim) + 'after-claim' both stored

// SECURITY (audit F-08): an inbox no owner ever claimed is still bounded — much tighter than a
// claimed one — so spraying random inbox ids can never accumulate meaningful storage. Fill the
// unclaimed cap and the next send is refused with an explicit 'full'.
freshCtx.sql.claimed = false; // simulate a never-claimed (e.g. attacker-sprayed) inbox
for (let i = 0; i < 256; i++) freshCtx.sql.queue.push({ id: 20000 + i, body: 'x', ts: null, silent: 0 });
const capSock = socket(false, inbox);
await freshRoom.webSocketMessage(capSock, JSON.stringify({ t: 'send', b64: 'AA==', mid: 'overflow' }));
ok('unclaimed inbox is bounded by the TIGHTER cap — overflow is nacked full',
  capSock.sent.some((frame) => frame.t === 'nack' && frame.reason === 'full'));
// Negative control: the SAME backlog on a CLAIMED inbox is still well under its (larger) cap.
freshCtx.sql.claimed = true;
const claimedSock = socket(false, inbox);
await freshRoom.webSocketMessage(claimedSock, JSON.stringify({ t: 'send', b64: 'AA==', mid: 'stillok' }));
ok('negative control: same backlog on a CLAIMED inbox is accepted (cap really is claim-dependent)',
  claimedSock.sent.some((frame) => frame.t === 'sent' && frame.mid === 'stillok'));

await room.webSocketMessage(owner, JSON.stringify({
  t: 'unsubscribe',
  endpoint: pushSub.endpoint,
  rid: 'wipe-request-1',
}));
ok('authenticated unsubscribe echoes bounded rid after DELETE',
  owner.sent.some((frame) => frame.t === 'unsubscribed' && frame.rid === 'wipe-request-1'));
const deleteIndex = ctx.sql.calls.findIndex((call) =>
  call.sql === 'DELETE FROM subs WHERE endpoint = ?' && call.args[0] === pushSub.endpoint);
const unsubscribeAckIndex = owner.sent.findIndex((frame) =>
  frame.t === 'unsubscribed' && frame.rid === 'wipe-request-1');
ok('unsubscribe negative control: deletion happened and confirmation was emitted',
  deleteIndex >= 0 && unsubscribeAckIndex >= 0);

await room.webSocketMessage(owner, JSON.stringify({ t: 'unsubscribe', endpoint: pushSub.endpoint }));
ok('legacy unsubscribe without rid remains compatible',
  owner.sent.some((frame) => frame.t === 'unsubscribed' && frame.rid === null));

await room.webSocketMessage(owner, JSON.stringify({
  t: 'unsubscribe',
  endpoint: 'https://legacy-push.example/token',
  rid: 'legacy-cleanup',
}));
ok('legacy foreign HTTPS endpoint can still be deleted without being fetchable',
  owner.sent.some((frame) => frame.t === 'unsubscribed' && frame.rid === 'legacy-cleanup') &&
  ctx.sql.calls.some((call) =>
    call.sql === 'DELETE FROM subs WHERE endpoint = ?' &&
    call.args[0] === 'https://legacy-push.example/token'));

const oversizedRid = socket(true, inbox);
await room.webSocketMessage(oversizedRid, JSON.stringify({
  t: 'unsubscribe',
  endpoint: pushSub.endpoint,
  rid: 'x'.repeat(129),
}));
ok('oversized unsubscribe rid is rejected', oversizedRid.closed[0]?.code === 1008);

const brokenAttachment = socket();
brokenAttachment.deserializeAttachment = () => { throw new Error('corrupt attachment'); };
await room.webSocketMessage(brokenAttachment, JSON.stringify({ t: 'ping' }));
ok('attachment failure is contained and requests a safe reconnect', brokenAttachment.closed[0]?.code === 1012);

const rateCtx = makeCtx();
const rateSocket = socket();
const firstRateRoom = new relay.RelayRoom(rateCtx, { RELAY_GUARD: relayGuard });
await rateCtx.init;
for (let i = 0; i < 400; i++) await firstRateRoom.webSocketMessage(rateSocket, '{"t":"ping"}');
const resumedRateRoom = new relay.RelayRoom(rateCtx, { RELAY_GUARD: relayGuard });
await rateCtx.init;
for (let i = 0; i < 401; i++) await resumedRateRoom.webSocketMessage(rateSocket, '{"t":"ping"}');
ok('room actor frame budget survives a new Durable Object instance',
  rateSocket.closed.some((entry) => entry.code === 1008 && entry.reason === 'actor rate limit'));

const cappedCtx = makeCtx(Array.from({ length: 128 }, () => socket(true)));
const cappedRoom = new relay.RelayRoom(cappedCtx, { RELAY_GUARD: relayGuard });
await cappedCtx.init;
const cappedResponse = await cappedRoom.fetch({
  method: 'GET',
  url: `https://skytale.chat/api/relay?room=${'a'.repeat(64)}`,
  headers: new Headers({ Upgrade: 'websocket', 'x-scytale-relay-actor': actor }),
});
ok('connection cap rejects the 129th socket with Retry-After',
  cappedResponse.status === 429 && cappedResponse.headers.get('retry-after') === '5');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
