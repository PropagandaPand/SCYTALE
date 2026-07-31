// Worker-side trust boundary for the permanent official-account alias.
//
// The client performs the complete root -> master -> device verification. These
// tests prove the server cannot mint that authority, cannot roll the signed head
// backwards, and exposes the directory through one bounded same-origin route.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as S from './.bundle/entry.js';

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
const directorySource = readFileSync(
  new URL('../worker/official-account.ts', import.meta.url),
  'utf8',
);
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

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

console.log('\n[official account worker: HTTP trust boundary]');
ok('one fixed route serves the permanent alias without a user-controlled DO name',
  /OFFICIAL_ACCOUNT_PATH\s*=\s*`\/api\/official-accounts\/\$\{OFFICIAL_ACCOUNT_ROUTE_ALIAS\}`/.test(index) &&
  /getByName\(OFFICIAL_ACCOUNT_ALIAS\)/.test(index) &&
  !/getByName\([^)]*(?:pathname|searchParams|body\.)/.test(index));
ok('only GET and PUT are accepted and query variants are rejected',
  /if \(url\.search\)/.test(index) &&
  /request\.method !== 'GET' && request\.method !== 'PUT'/.test(index) &&
  /allow: 'GET, PUT'/.test(index));
ok('browser calls are same-origin while an origin-less offline publisher remains possible',
  /const origin = request\.headers\.get\('origin'\)/.test(index) &&
  /if \(origin && !sameOrigin\(request, url\)\)/.test(index));
ok('PUT uses the streaming bounded JSON reader and verifies before durable publish',
  /readJsonLimited\(request, OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES\)/.test(index) &&
  /verified = await verifyOfficialAccountDocument\(body\)[\s\S]*?\.publish\(verified\.document\)/.test(index));
ok('GET and PUT use separate actor rate limits',
  /env\.OFFICIAL_ACCOUNT_READ_RATE/.test(index) &&
  /env\.OFFICIAL_ACCOUNT_PUBLISH_RATE/.test(index) &&
  /allowRate\(limiter, `actor:\$\{actor\}`\)/.test(index));
ok('public documents and every error path remain no-store',
  /'content-type': 'application\/json; charset=utf-8'[\s\S]*?'cache-control': 'no-store'/.test(index) &&
  /function officialAccountFailureResponse[\s\S]*?'cache-control': 'no-store'/.test(index));
ok('the Worker never accepts a server-side admin override',
  !/\badmin\s*:/.test(`${index}\n${directorySource}`) &&
  !/\badmin\s*=/.test(`${index}\n${directorySource}`));

console.log('\n[official account worker: DO and deployment wiring]');
ok('AppEnv and module export are typed to the production DO class',
  /OFFICIAL_ACCOUNTS\s*:\s*DurableObjectNamespace\s*<\s*OfficialAccountDirectory\s*>/.test(index) &&
  /export\s*\{[^}]*\bOfficialAccountDirectory\b[^}]*\}/s.test(index));
ok('the DO repeats root verification before its storage transaction',
  /verified = await verifyOfficialAccountDocument\(parsed\)/.test(directorySource) &&
  directorySource.indexOf('verifyOfficialAccountDocument(parsed)') <
    directorySource.indexOf('storage.transactionSync'));
ok('byte-identical and stale public retries short-circuit before the DO signature check',
  directorySource.indexOf('snapshot?.document === document') >= 0 &&
  directorySource.indexOf('snapshot?.document === document') <
    directorySource.indexOf('verifyOfficialAccountDocument(parsed)') &&
  directorySource.indexOf('parsedSequence <= snapshot.sequence') <
    directorySource.indexOf('verifyOfficialAccountDocument(parsed)'));
ok('monotone compare and write are one synchronous SQLite transaction',
  /storage\.transactionSync\(\(\) => \{/.test(directorySource) &&
  /verified\.sequence < current\.sequence/.test(directorySource) &&
  /verified\.sequence === current\.sequence/.test(directorySource) &&
  /ON CONFLICT\(id\) DO UPDATE SET/.test(directorySource));
ok('the trust root is imported from checked-in config, never from Worker env or a secret',
  /OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL[^]*?from '\.\.\/src\/lib\/officialAccountConfig'/.test(directorySource) &&
  !/env\.[A-Z0-9_]*ROOT/.test(directorySource));

const officialBinding = tomlBlocks('durable_objects.bindings')
  .find((block) => bindingName(block) === 'OFFICIAL_ACCOUNTS') ?? '';
const v5Migration = tomlBlocks('migrations')
  .find((block) => /\btag\s*=\s*"v5"/.test(block)) ?? '';
const rateBlocks = tomlBlocks('ratelimits');
const readRate = rateBlocks.find(
  (block) => bindingName(block) === 'OFFICIAL_ACCOUNT_READ_RATE',
) ?? '';
const publishRate = rateBlocks.find(
  (block) => bindingName(block) === 'OFFICIAL_ACCOUNT_PUBLISH_RATE',
) ?? '';
ok('wrangler adds one SQLite-backed v5 directory namespace',
  /class_name\s*=\s*"OfficialAccountDirectory"/.test(officialBinding) &&
  /new_sqlite_classes\s*=\s*\["OfficialAccountDirectory"\]/.test(v5Migration));
ok('read and publish limits have distinct namespaces and usable ceilings',
  /namespace_id\s*=\s*"290006"/.test(readRate) &&
  /limit\s*=\s*60/.test(readRate) &&
  /namespace_id\s*=\s*"290007"/.test(publishRate) &&
  /limit\s*=\s*10/.test(publishRate));
ok('both supported production origins remain enabled',
  /workers_dev\s*=\s*true/.test(wrangler) &&
  index.includes("'skytale.chat', 'scytale.illogical.workers.dev'"));

console.log('\n[official account worker: signed monotone state machine]');

const root = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const rootPublic = new Uint8Array(await crypto.subtle.exportKey('raw', root.publicKey));
const rootPublicB64 = S.base64urlEncode(rootPublic);

// Execute the production class with only its platform base class and checked-in
// root constant replaced. Shared parsing/signing code remains the production code.
globalThis.__scytaleOfficialManifestForWorkerTest = S;
const instrumented = directorySource
  .replace(
    /import\s*\{\s*DurableObject\s*\}\s*from\s*['"]cloudflare:workers['"]\s*;?/,
    'class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }',
  )
  .replace(
    /import\s*\{[\s\S]*?\}\s*from\s*['"]\.\.\/src\/lib\/officialAccountManifest['"]\s*;?/,
    `const {
      OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES,
      OfficialAccountManifestError,
      assertTimelyOfficialAccountManifest,
      base64urlDecode,
      canonicalOfficialAccountManifestJson,
      officialAccountManifestDigest,
      parseOfficialAccountManifest,
      verifyOfficialAccountManifestSignature,
    } = globalThis.__scytaleOfficialManifestForWorkerTest;`,
  )
  .replace(
    /import\s*\{\s*OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL\s*\}\s*from\s*['"]\.\.\/src\/lib\/officialAccountConfig['"]\s*;?/,
    `const OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL = '${rootPublicB64}';`,
  );
const compiled = ts.transpileModule(instrumented, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { OfficialAccountDirectory } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

function cursor(rows) {
  return {
    toArray: () => structuredClone(rows),
    one: () => {
      if (rows.length !== 1) throw new Error('expected one row');
      return structuredClone(rows[0]);
    },
  };
}

function memoryContext() {
  let row = null;
  let writes = 0;
  const sql = {
    exec(query, ...bindings) {
      const normalized = query.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('CREATE TABLE')) return cursor([]);
      if (normalized.startsWith('SELECT sequence')) {
        return cursor(row ? [row] : []);
      }
      if (normalized.startsWith('INSERT INTO official_account_manifest')) {
        row = {
          sequence: bindings[0],
          canonical_document: bindings[1],
          digest: bindings[2],
          published_at: bindings[3],
        };
        writes++;
        return cursor([]);
      }
      throw new Error(`unexpected SQL: ${normalized}`);
    },
  };
  return {
    storage: {
      sql,
      transactionSync(callback) { return callback(); },
    },
    get row() { return structuredClone(row); },
    get writes() { return writes; },
  };
}

const now = Date.now();
const masterPub = S.base64urlEncode(new Uint8Array(32).fill(7));
const reusableBundle = S.base64urlEncode(new Uint8Array(266).fill(11));

function unsigned(sequence, overrides = {}) {
  return {
    schema: S.OFFICIAL_ACCOUNT_MANIFEST_SCHEMA,
    sequence,
    rootKeyId: S.OFFICIAL_ACCOUNT_ROOT_KEY_ID,
    alias: S.OFFICIAL_ACCOUNT_ALIAS,
    role: S.OFFICIAL_ACCOUNT_ROLE,
    displayName: S.OFFICIAL_ACCOUNT_DISPLAY_NAME,
    badge: S.OFFICIAL_ACCOUNT_BADGE,
    status: 'active',
    masterPub,
    bundle: reusableBundle,
    deviceList: null,
    deviceEpoch: 1,
    deviceListVersion: 0,
    notBefore: now - 60_000,
    notAfter: now + 24 * 60 * 60 * 1000,
    revokedMasters: [],
    ...overrides,
  };
}

async function signed(sequence, overrides = {}) {
  const candidate = unsigned(sequence, overrides);
  const signature = new Uint8Array(await crypto.subtle.sign(
    'Ed25519',
    root.privateKey,
    S.officialAccountSigningBytes(candidate),
  ));
  return { ...candidate, signature: S.base64urlEncode(signature) };
}

const ctx = memoryContext();
const directory = new OfficialAccountDirectory(ctx, {});
const manifest1 = await signed(1);
const document1 = S.canonicalOfficialAccountManifestJson(manifest1);
const first = await directory.publish(document1);
ok('first valid root-signed document creates the durable head',
  first.ok === true && first.kind === 'created' && first.sequence === 1 && ctx.writes === 1);
const resolved1 = directory.resolve();
ok('resolve is read-only and returns the exact canonical document',
  resolved1?.document === document1 && resolved1.sequence === 1 && ctx.writes === 1);

const retry = await directory.publish(document1);
ok('byte-identical retry is idempotent and performs no write',
  retry.ok === true && retry.kind === 'unchanged' && ctx.writes === 1);

const conflicting1 = await signed(1, { notAfter: now + 2 * 24 * 60 * 60 * 1000 });
const conflict = await directory.publish(
  S.canonicalOfficialAccountManifestJson(conflicting1),
);
ok('different valid content at the current sequence cannot equivocate',
  conflict.ok === true && conflict.kind === 'conflict' && ctx.row.sequence === 1 && ctx.writes === 1);

const manifest2 = await signed(2);
const document2 = S.canonicalOfficialAccountManifestJson(manifest2);
const update = await directory.publish(document2);
ok('a strictly higher valid sequence atomically replaces the head',
  update.ok === true && update.kind === 'updated' && ctx.row.sequence === 2 && ctx.writes === 2);

const stale = await directory.publish(document1);
ok('a lower valid sequence is stale and cannot roll the head back',
  stale.ok === true && stale.kind === 'stale' && ctx.row.sequence === 2 && ctx.writes === 2);

const forged = { ...await signed(3), signature: manifest1.signature };
const forgedResult = await directory.publish(
  S.canonicalOfficialAccountManifestJson(forged),
);
ok('a forged signature is rejected before any storage mutation',
  forgedResult.ok === false && forgedResult.reason === 'signature' &&
  ctx.row.sequence === 2 && ctx.writes === 2);

const expired = await signed(3, {
  notBefore: now - 48 * 60 * 60 * 1000,
  notAfter: now - 24 * 60 * 60 * 1000,
});
const expiredResult = await directory.publish(
  S.canonicalOfficialAccountManifestJson(expired),
);
ok('an expired but correctly signed document is not publishable',
  expiredResult.ok === false && expiredResult.reason === 'not_current' && ctx.writes === 2);

const prettyPrinted = JSON.stringify(manifest2, null, 2);
const nonCanonical = await directory.publish(prettyPrinted);
ok('non-canonical RPC JSON cannot create a second idempotency representation',
  nonCanonical.ok === false && nonCanonical.reason === 'format' && ctx.writes === 2);

const [race3, race4] = await Promise.all([
  signed(3).then((manifest) => directory.publish(
    S.canonicalOfficialAccountManifestJson(manifest),
  )),
  signed(4).then((manifest) => directory.publish(
    S.canonicalOfficialAccountManifestJson(manifest),
  )),
]);
ok('concurrent valid updates converge on the highest sequence',
  race3.ok === true && race4.ok === true && ctx.row.sequence === 4);

delete globalThis.__scytaleOfficialManifestForWorkerTest;

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
