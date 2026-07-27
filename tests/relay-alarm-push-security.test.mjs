// Durable lifecycle regressions: one persisted alarm must service both the
// coalesced push deadline and autonomous queue expiry, and push fan-out stays
// bounded even for an authenticated abusive inbox owner.
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

const source = readFileSync(new URL('../worker/relay.ts', import.meta.url), 'utf8');
const instrumented = source.replace(
  "import { DurableObject } from 'cloudflare:workers';",
  'class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }',
);
const compiled = ts.transpileModule(instrumented, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { RelayRoom } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function cursor(one = {}, rows = []) {
  return {
    one: () => one,
    *[Symbol.iterator]() {
      yield* rows;
    },
  };
}

function alarmCtx() {
  const state = {
    pushDue: null,
    oldestTs: null,
    pending: 0,
    alarm: null,
    setCalls: [],
    deleteCalls: 0,
  };
  const sql = {
    exec(query, ...args) {
      const normalized = query.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT MAX(value) AS value FROM alarm_state')) {
        return cursor({ value: state.pushDue });
      }
      if (normalized === 'SELECT MIN(ts) AS ts FROM q WHERE ts IS NOT NULL') {
        return cursor({ ts: state.oldestTs });
      }
      if (normalized === 'SELECT COUNT(*) AS n FROM q WHERE silent = 0') {
        return cursor({ n: state.pending });
      }
      if (normalized.startsWith('DELETE FROM alarm_state')) {
        state.pushDue = null;
      }
      if (normalized.startsWith('DELETE FROM q WHERE ts IS NOT NULL') &&
          state.oldestTs !== null && state.oldestTs <= args[0]) {
        state.oldestTs = null;
        state.pending = 0;
      }
      return cursor({ n: 0, value: null, ts: null });
    },
  };
  const ctx = {
    state,
    init: Promise.resolve(),
    storage: {
      sql,
      getAlarm: async () => state.alarm,
      setAlarm: async (value) => {
        state.alarm = Number(value);
        state.setCalls.push(Number(value));
      },
      deleteAlarm: async () => {
        state.alarm = null;
        state.deleteCalls++;
      },
    },
    getWebSockets: () => [],
    waitUntil: () => {},
  };
  ctx.blockConcurrencyWhile = (callback) => {
    ctx.init = Promise.resolve().then(callback);
    return ctx.init;
  };
  return ctx;
}

console.log('\n[relay: one durable alarm owns push + TTL]');
const ctx = alarmCtx();
const room = new RelayRoom(ctx, {});
await ctx.init;
const ttl = 30 * 24 * 60 * 60 * 1000;
const now = Date.now();

ctx.state.pushDue = now + 3000;
ctx.state.oldestTs = now;
await room.scheduleNextAlarm();
ok('push deadline wins when earlier than oldest queue expiry', ctx.state.alarm === ctx.state.pushDue);

ctx.state.pushDue = null;
ctx.state.oldestTs = now;
await room.scheduleNextAlarm();
ok('queue-only mailbox gets autonomous 30-day expiry alarm', ctx.state.alarm === now + ttl);

ctx.state.oldestTs = null;
await room.scheduleNextAlarm();
ok('no durable work removes a stale alarm', ctx.state.alarm === null && ctx.state.deleteCalls > 0);

ctx.state.pushDue = Date.now() - 1;
ctx.state.oldestTs = Date.now();
ctx.state.pending = 1;
ctx.state.alarm = ctx.state.pushDue;
await room.alarm();
ok('due push deadline is consumed exactly once', ctx.state.pushDue === null);
ok('alarm finally-block reschedules remaining queue expiry',
  ctx.state.alarm !== null && Math.abs(ctx.state.alarm - (ctx.state.oldestTs + ttl)) < 20);

ctx.state.pushDue = null;
ctx.state.oldestTs = Date.now() - ttl - 1;
ctx.state.pending = 1;
ctx.state.alarm = Date.now() - 1;
await room.alarm();
ok('TTL alarm deletes expired queue and leaves no alarm behind',
  ctx.state.oldestTs === null && ctx.state.pending === 0 && ctx.state.alarm === null);

console.log('\n[relay: bounded push and connection resources]');
ok('schedule computes min(pushDue, oldest expiry)',
  /earliestTimestamp\(this\.pushDueAt\(\), this\.oldestExpiryAt\(\)\)/.test(source));
ok('alarm always reschedules, including error paths',
  /finally\s*\{\s*await this\.scheduleNextAlarm\(\)/.test(source));
ok('legacy NULL queue timestamps receive a finite grace period',
  /UPDATE q SET ts = \? WHERE ts IS NULL/.test(source));
ok('silent/online sends still schedule the TTL alarm',
  /if \(!ownerOnline && !silent\)[\s\S]*else this\.ctx\.waitUntil\(this\.scheduleNextAlarm\(\)\)/.test(source));
ok('subscription count is capped and oldest is evicted',
  /const MAX_SUBSCRIPTIONS = 16/.test(source) &&
  /total >= MAX_SUBSCRIPTIONS/.test(source) &&
  /ORDER BY ts, endpoint LIMIT 1/.test(source));
ok('push requests cannot follow redirects or hang indefinitely',
  /redirect: 'manual'/.test(source) &&
  /signal: AbortSignal\.timeout\(PUSH_TIMEOUT_MS\)/.test(source));
ok('push endpoints are strict HTTPS URLs with a length ceiling',
  /value\.length > MAX_PUSH_ENDPOINT_CHARS/.test(source) &&
  /url\.protocol !== 'https:'/.test(source) &&
  /isBrowserPushHost\(url\.hostname\)/.test(source));
ok('push fan-out runs only across the capped subscription set',
  /Promise\.all\(rows\.map/.test(source));
ok('connection caps reserve a slot by evicting only unauthenticated peers',
  /const MAX_CONNECTIONS = 128/.test(source) &&
  /const MAX_UNAUTH_CONNECTIONS = 32/.test(source) &&
  /private makeConnectionSlot\(\)/.test(source) &&
  /if \(!oldest\) return false/.test(source) &&
  /owner slot reserved/.test(source) &&
  /status: 429/.test(source));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
