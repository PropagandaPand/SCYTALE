// Worker security invariants that are easy to regress while changing the client.
// These assertions intentionally inspect the production Worker sources and deploy
// metadata; runtime frame behavior is covered by relay-frame-security.test.mjs.
import { readFileSync } from 'node:fs';

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
const relay = readFileSync(new URL('../worker/relay.ts', import.meta.url), 'utf8');
const quota = readFileSync(new URL('../worker/blob-quota.ts', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lifecycle = JSON.parse(readFileSync(new URL('../r2-lifecycle.json', import.meta.url), 'utf8'));

console.log('\n[worker: relay trust boundaries]');
ok('outer Worker overwrites the internal actor header before DO routing',
  /relayHeaders\.set\('x-scytale-relay-actor', actor\)/.test(index) &&
  /stub\.fetch\(new Request\(request, \{ headers: relayHeaders \}\)\)/.test(index));
ok('client-spoofable x-real-ip is not an actor source',
  !/headers\.get\('x-real-ip'\)/.test(index));
ok('RelayRoom validates actor and persists it in socket attachments',
  /!ACTOR_RE\.test\(actor\)/.test(relay) &&
  /\{ room, owner: false, actor, connectedAt: Date\.now\(\) \}/.test(relay));
ok('room claim gates durable queue insertion',
  relay.indexOf("reason: 'unclaimed'") >= 0 &&
  relay.indexOf("reason: 'unclaimed'") < relay.indexOf('INSERT INTO q (body, ts, silent)'));
ok('durable room and global actor byte/frame budgets are both charged',
  /CREATE TABLE IF NOT EXISTS actor_window/.test(relay) &&
  /chargeRoomActor\(att\.actor, bytes\)/.test(relay) &&
  /RELAY_GUARD\.getByName\(att\.actor\)\.charge\(bytes\)/.test(relay));
ok('owner slot protection evicts only unauthenticated sockets',
  /if \(!att\.owner\) guests\.push/.test(relay) &&
  /if \(!oldest\) return false/.test(relay));
ok('unauthenticated sender cannot suppress push',
  /const silent = att\.owner && m\.silent === true \? 1 : 0/.test(relay));
ok('new push subscriptions are restricted to browser services',
  /fcm\.googleapis\.com/.test(relay) &&
  /updates\.push\.services\.mozilla\.com/.test(relay) &&
  /\.push\.apple\.com/.test(relay) &&
  /\.notify\.windows\.com/.test(relay));
ok('global actor guard is bound and migration-backed',
  /name = "RELAY_GUARD"/.test(wrangler) &&
  /new_sqlite_classes = \["RelayActorGuard"\]/.test(wrangler));

console.log('\n[worker: R2 quota accounting and cleanup]');
ok('R2 multipart body keeps a known exact length',
  /body\.pipeThrough\(new FixedLengthStream\(expected\)\)/.test(index) &&
  /const ETAG_RE = \/\^\[A-Za-z0-9"_-\]\{1,256\}\$\//.test(index));
ok('completed actor ledger and byte/object ceilings are persistent',
  /CREATE TABLE IF NOT EXISTS completed_objects/.test(quota) &&
  /const MAX_ACTOR_OBJECTS = 256/.test(quota) &&
  /const MAX_GLOBAL_OBJECTS = 4096/.test(quota) &&
  /FROM completed_objects WHERE actor_hash = \?/.test(quota));
ok('commit requires exact reserved and uploaded byte counts',
  /actualBytes !== row\.reserved_bytes/.test(quota) &&
  /claimedPartBytes\(row\.object_key\) !== row\.reserved_bytes/.test(quota));
ok('commit moves reservation to completed accounting in one sync transaction',
  /async commit\([\s\S]*?transactionSync\(\(\) => \{[\s\S]*?promoteCompleted/.test(quota) &&
  /completed_objects = completed_objects \+ 1/.test(quota));
ok('lost commit RPC response is recoverable through an exact durable receipt',
  /upload_id TEXT NOT NULL,[\s\S]*token_hash TEXT NOT NULL,[\s\S]*op_version INTEGER NOT NULL/.test(quota) &&
  /if \(!row\) \{[\s\S]*FROM completed_objects WHERE object_key = \?/.test(quota) &&
  /async function commitBlobQuota/.test(index) &&
  /committed === null[\s\S]*Upload accounting unavailable/.test(index));
ok('reconcile uses a persistent lock and mutation-version fence',
  /reconcile_lock_until/.test(quota) &&
  /current\.mutation_version !== start\.version/.test(quota) &&
  /this\.unsettledCompletions\(\) > 0/.test(quota));
ok('truncated or oversized R2 scans fail closed and stay bounded',
  /page\.truncated && !page\.cursor/.test(quota) &&
  /objects > MAX_GLOBAL_OBJECTS/.test(quota) &&
  /return \{ bytes, objects, keys, complete: false \}/.test(quota));
ok('expiry transitions to retryable cleanup without deleting reservations',
  /SET state = 'abort_pending'/.test(quota) &&
  /SET state = 'completion_cleanup'/.test(quota) &&
  /retry_count = retry_count \+ 1/.test(quota));
ok('reservation cleanup follows successful external R2 operations',
  /resumeMultipartUpload\(row\.object_key, row\.upload_id\)\.abort\(\);\s*this\.finishCleanup\(row\)/.test(quota) &&
  /await this\.env\.BLOBS\.delete\(row\.object_key\);\s*this\.finishCleanup\(row\)/.test(quota));
ok('completion gets a dedicated grace lease and operation version',
  /const COMPLETING_GRACE_MS = 15 \* 60 \* 1000/.test(quota) &&
  /op_version = \?/.test(quota));
ok('ambiguous Worker abort/complete paths remain charged for DO retry',
  /quota\.deferAbort/.test(index) &&
  /quota\s*\.deferCompletionCleanup/.test(index) &&
  !/quota\.restoreActive\(key, uploadId, token\)/.test(index));

console.log('\n[deploy: repository-controlled R2 lifecycle]');
const deploy = pkg.scripts.deploy;
ok('deploy applies lifecycle before publishing Worker code',
  deploy.indexOf('cf:lifecycle:apply') >= 0 &&
  deploy.indexOf('cf:lifecycle:apply') < deploy.indexOf('wrangler deploy'));
ok('lifecycle application is non-interactive and repository-backed',
  pkg.scripts['cf:lifecycle:apply'] ===
    'wrangler r2 bucket lifecycle set skytale-blobs --file ./r2-lifecycle.json --force');
const rule = lifecycle.rules?.[0];
ok('lifecycle deletes ciphertext at 14d and aborts multipart at 1d',
  rule?.enabled === true &&
  rule?.deleteObjectsTransition?.condition?.maxAge === 1209600 &&
  rule?.abortMultipartUploadsTransition?.condition?.maxAge === 86400);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
