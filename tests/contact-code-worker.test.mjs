// Security contract for the short, server-rendezvous contact code.
//
// The code is a capability: it must travel only in a bounded POST body, never in
// a URL, and the Durable Object must be an immutable, expiring lookup.  These
// tests combine source/configuration checks with execution of the production DO
// against a tiny in-memory Durable Object storage implementation.
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

const index = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const contactSource = readFileSync(new URL('../worker/contact-code.ts', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

function balancedBlockAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return '';
  const open = source.indexOf('{', markerAt + marker.length);
  if (open < 0) return '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return '';
}

function routeBlock(path) {
  const quoted = [`'${path}'`, `"${path}"`].find((value) => index.includes(value));
  if (!quoted) return '';
  const literalAt = index.indexOf(quoted);
  const ifAt = index.lastIndexOf('if (', literalAt);
  return ifAt >= 0 ? balancedBlockAfter(index, index.slice(ifAt, literalAt + quoted.length)) : '';
}

function tomlBlocks(header) {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...wrangler.matchAll(new RegExp(
    `^\\[\\[${escaped}\\]\\][\\s\\S]*?(?=^\\[\\[|^\\[[^\\[]|\\Z)`,
    'gm',
  ))].map((match) => match[0]);
}

function bindingName(block) {
  return block.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1] ?? '';
}

const createRoute = routeBlock('/api/contact-code/create');
const resolveRoute = routeBlock('/api/contact-code/resolve');
const contactRouteSource = `${createRoute}\n${resolveRoute}`;
const contactRates = [...new Set(
  [...contactRouteSource.matchAll(/env\.([A-Z0-9_]*RATE[A-Z0-9_]*)/g)]
    .map((match) => match[1]),
)];
const createRate = contactRates.find((name) => /(?:CREATE|PUBLISH)/.test(name)) ?? '';
const resolveRate = contactRates.find((name) => /RESOLVE/.test(name)) ?? '';

console.log('\n[contact code: API trust boundary]');
ok('create and resolve are explicit routes rather than a secret-bearing path suffix',
  createRoute.length > 0 &&
  resolveRoute.length > 0 &&
  !index.includes("url.searchParams.get('locator')") &&
  !index.includes('url.searchParams.get("locator")') &&
  !/\/api\/contact-code\/['"`]\s*\+/.test(index));
ok('both capability operations are POST-only',
  /request\.method\s*(?:===|!==)\s*['"]POST['"]/.test(createRoute) &&
  /request\.method\s*(?:===|!==)\s*['"]POST['"]/.test(resolveRoute));
ok('both routes reject cross-origin requests',
  /sameOrigin\s*\(\s*request\s*,\s*url\s*\)/.test(createRoute) &&
  /sameOrigin\s*\(\s*request\s*,\s*url\s*\)/.test(resolveRoute));
ok('both routes use the streaming, content-type-aware bounded JSON reader',
  /readJsonLimited\s*\(\s*request\s*,/.test(createRoute) &&
  /readJsonLimited\s*\(\s*request\s*,/.test(resolveRoute));
ok('create accepts exactly locator + payload and resolve exactly locator',
  /Object\.keys\s*\(/.test(contactRouteSource) &&
  /(?:allowedKeys|validKeys|exactKeys)/.test(contactRouteSource) &&
  /\[\s*['"]locator['"]\s*,\s*['"]payload['"]\s*\]/.test(contactRouteSource) &&
  /\[\s*['"]locator['"]\s*\]/.test(contactRouteSource) &&
  /Object\.keys\s*\([^)]*\)\s*\.length/.test(contactRouteSource));
ok('locator and payload are independently anchored and length-bounded',
  /LOCATOR_RE\s*=\s*\/\^/.test(index) &&
  /PAYLOAD_RE\s*=\s*\/\^/.test(index) &&
  /\{427\}/.test(index.match(/CONTACT_PAYLOAD_RE[^\n]*/)?.[0] ?? '') &&
  /(?:length|PAYLOAD_(?:MAX|LENGTH))/.test(createRoute));
ok('successful capability responses use the no-store JSON response path',
  /jsonResponse\s*\(/.test(createRoute) &&
  /jsonResponse\s*\(/.test(resolveRoute) &&
  /function jsonResponse[\s\S]*?cache-control['"]?\s*:\s*['"]no-store['"]/.test(index));
ok('create and resolve have distinct edge rate-limit bindings',
  createRate.length > 0 &&
  resolveRate.length > 0 &&
  createRate !== resolveRate);

console.log('\n[contact code: Durable Object wiring]');
ok('AppEnv binds CONTACT_CODES to the ContactCode class',
  /CONTACT_CODES\s*:\s*DurableObjectNamespace\s*<\s*ContactCode\s*>/.test(index));
ok('the entry module exports ContactCode for Cloudflare',
  /export\s*\{[^}]*\bContactCode\b[^}]*\}/s.test(index));

const doBinding = tomlBlocks('durable_objects.bindings')
  .find((block) => bindingName(block) === 'CONTACT_CODES') ?? '';
const v4Migration = tomlBlocks('migrations')
  .find((block) => /\btag\s*=\s*"v4"/.test(block)) ?? '';
const rateBlocks = tomlBlocks('ratelimits');
const createRateBlock = rateBlocks.find((block) => bindingName(block) === createRate) ?? '';
const resolveRateBlock = rateBlocks.find((block) => bindingName(block) === resolveRate) ?? '';
const createRateId = createRateBlock.match(/namespace_id\s*=\s*"([^"]+)"/)?.[1];
const resolveRateId = resolveRateBlock.match(/namespace_id\s*=\s*"([^"]+)"/)?.[1];
const createRateLimit = Number(createRateBlock.match(/limit\s*=\s*(\d+)/)?.[1]);
const resolveRateLimit = Number(resolveRateBlock.match(/limit\s*=\s*(\d+)/)?.[1]);

ok('wrangler binds CONTACT_CODES and introduces it in the v4 SQLite migration',
  /class_name\s*=\s*"ContactCode"/.test(doBinding) &&
  /new_sqlite_classes\s*=\s*\[[^\]]*"ContactCode"[^\]]*\]/.test(v4Migration));
ok('both route-specific rate limits exist with separate namespaces',
  createRateBlock.length > 0 &&
  resolveRateBlock.length > 0 &&
  createRateId !== undefined &&
  resolveRateId !== undefined &&
  createRateId !== resolveRateId);
ok('edge limits bound creation and resolution without normal-user friction',
  createRateLimit === 10 && resolveRateLimit === 60);
ok('workers.dev remains active and both production hosts remain supported',
  /workers_dev\s*=\s*true/.test(wrangler) &&
  index.includes("'skytale.chat', 'scytale.illogical.workers.dev'"));

console.log('\n[contact code: immutable 24-hour record]');
const instrumented = contactSource.replace(
  /import\s*\{\s*DurableObject\s*\}\s*from\s*['"]cloudflare:workers['"]\s*;?/,
  'class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }',
);
const compiled = ts.transpileModule(instrumented, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { ContactCode } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function memoryContext() {
  const values = new Map();
  const mutations = [];
  let alarm = null;
  const storage = {
    async get(key) {
      return clone(values.get(key));
    },
    async put(key, value) {
      mutations.push({ type: 'put', key, value: clone(value) });
      values.set(key, clone(value));
    },
    async delete(key) {
      mutations.push({ type: 'delete', key });
      return values.delete(key);
    },
    async deleteAll() {
      mutations.push({ type: 'deleteAll' });
      values.clear();
    },
    async getAlarm() {
      return alarm;
    },
    async setAlarm(value) {
      mutations.push({ type: 'setAlarm', value: Number(value) });
      alarm = Number(value);
    },
    async deleteAlarm() {
      mutations.push({ type: 'deleteAlarm' });
      alarm = null;
    },
    async transaction(callback) {
      return callback(storage);
    },
    transactionSync(callback) {
      return callback();
    },
  };
  const ctx = {
    storage,
    values,
    mutations,
    get alarm() { return alarm; },
    blockConcurrencyWhile(callback) {
      return callback();
    },
  };
  return ctx;
}

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const TTL = DAY;
const epoch = 1_900_000_000_000;
const realNow = Date.now;
let now = epoch;
Date.now = () => now;

try {
  const ctx = memoryContext();
  const object = new ContactCode(ctx, {});
  // Canonical unpadded Base64URL at the exact production ciphertext length.
  const payloadA = 'A'.repeat(427);
  const payloadB = `${'A'.repeat(426)}Q`;
  const invalid = await object.publish('A'.repeat(426));
  ok('payload length is exact and malformed records allocate no storage',
    invalid?.ok === false &&
    ctx.values.size === 0 &&
    ctx.mutations.length === 0);
  const first = await object.publish(payloadA);
  const mutationCountAfterCreate = ctx.mutations.length;

  ok('first publish persists one record with an exact 24-hour expiry',
    first?.ok === true &&
    first.expiresAt === epoch + TTL &&
    [...ctx.values.values()].some((record) =>
      record?.payload === payloadA && record?.expiresAt === epoch + TTL) &&
    ctx.alarm === epoch + TTL);

  now += HOUR;
  const repeated = await object.publish(payloadA);
  ok('same-payload retry is idempotent and cannot slide the expiry',
    repeated?.ok === true &&
    repeated.expiresAt === epoch + TTL &&
    ctx.mutations.length === mutationCountAfterCreate &&
    ctx.alarm === epoch + TTL);

  const conflict = await object.publish(payloadB);
  ok('a locator record is immutable once a different payload exists',
    conflict?.ok === false &&
    conflict?.conflict === true &&
    [...ctx.values.values()].some((record) => record?.payload === payloadA) &&
    ![...ctx.values.values()].some((record) => record?.payload === payloadB) &&
    ctx.mutations.length === mutationCountAfterCreate);

  const resolved = await object.resolve();
  ok('resolve returns only the live immutable payload and original expiry',
    resolved?.payload === payloadA && resolved?.expiresAt === epoch + TTL);

  const emptyCtx = memoryContext();
  const empty = new ContactCode(emptyCtx, {});
  const emptyBefore = emptyCtx.mutations.length;
  const missing = await empty.resolve();
  ok('resolving a missing locator performs no storage mutation',
    missing === null && emptyCtx.mutations.length === emptyBefore);

  now = epoch + TTL;
  const expired = await object.resolve();
  ok('expiry is fail-closed and stale payload material is removed',
    expired === null &&
    ctx.values.size === 0 &&
    ctx.mutations.at(-1)?.type === 'deleteAll');

  now = epoch;
  await object.publish(payloadA);
  await object.alarm();
  ok('the expiry alarm deletes the complete Durable Object record',
    ctx.values.size === 0 &&
    ctx.mutations.at(-1)?.type === 'deleteAll');
} finally {
  Date.now = realNow;
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
