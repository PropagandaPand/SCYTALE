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
const deployPreflight = readFileSync(new URL('../scripts/deploy-preflight.mjs', import.meta.url), 'utf8');

console.log('\n[worker: beide produktiven Origins bleiben HTTPS-only]');
ok('Custom Domain und absichtlich unterstützter workers.dev-Origin sind fest allowgelistet',
  index.includes("'skytale.chat', 'scytale.illogical.workers.dev'") &&
  /PROD_HOSTS\.has\(url\.hostname\) && url\.protocol !== 'https:'/.test(index));
ok('workers.dev bleibt aktiviert und wird nicht als Migrationsrest dokumentiert',
  /workers_dev\s*=\s*true/.test(wrangler) &&
  wrangler.includes('intentionally supported') &&
  !wrangler.includes('AFTER every client has migrated'));
ok('HSTS wird auf beiden expliziten Produktionshosts gesetzt',
  /url\.protocol === 'https:' && PROD_HOSTS\.has\(url\.hostname\)/.test(index));
ok('CSP sperrt ungenutzte Base/Form/Frame/Eventhandler-Sinks ohne React-Styleattribute zu brechen',
  index.includes(`"base-uri 'none'"`) &&
  index.includes(`"form-action 'none'"`) &&
  index.includes(`"frame-src 'none'"`) &&
  index.includes(`"script-src-attr 'none'"`) &&
  index.includes(`"style-src-elem 'self'"`) &&
  index.includes(`"style-src-attr 'unsafe-inline'"`));
ok('persistente Invocation Logs sind aus Metadatenschutzgründen deaktiviert',
  /\[observability\.logs\][\s\S]*?invocation_logs\s*=\s*false/.test(wrangler));

console.log('\n[worker: relay trust boundaries]');
ok('outer Worker overwrites the internal actor header before DO routing',
  /relayHeaders\.set\('x-scytale-relay-actor', actor\)/.test(index) &&
  /stub\.fetch\(new Request\(request, \{ headers: relayHeaders \}\)\)/.test(index));
ok('client-spoofable x-real-ip is not an actor source',
  !/headers\.get\('x-real-ip'\)/.test(index));
ok('RelayRoom validates actor and persists it in socket attachments',
  /!ACTOR_RE\.test\(actor\)/.test(relay) &&
  /\{ room, owner: false, actor, connectedAt: Date\.now\(\) \}/.test(relay));
ok('unclaimed inboxes get a tighter backlog cap than claimed ones (audit F-08, non-breaking)',
  relay.includes('const maxRows = claimed ? MAX_QUEUE : MAX_QUEUE_UNCLAIMED') &&
  relay.includes('const maxBytes = claimed ? MAX_QUEUE_B64 : MAX_QUEUE_B64_UNCLAIMED') &&
  // the old hard gate that refused ALL sends to an unclaimed inbox must be gone
  !relay.includes("reason: 'unclaimed'"));
ok('durable room and global actor byte/frame budgets are both charged',
  /CREATE TABLE IF NOT EXISTS actor_window/.test(relay) &&
  /chargeRoomActor\(att\.actor, bytes\)/.test(relay) &&
  /RELAY_GUARD\.getByName\(att\.actor\)\.charge\(bytes\)/.test(relay));
const rawLengthGuard = relay.indexOf("if (typeof raw === 'string' && raw.length > MAX_FRAME_CHARS)");
const rawEncoding = relay.indexOf("const frameBytes = typeof raw === 'string' ? enc.encode(raw).byteLength");
ok('übergroße WS-Strings werden vor UTF-8-Allokation verworfen',
  rawLengthGuard >= 0 && rawEncoding > rawLengthGuard);
ok('owner slot protection evicts only unauthenticated sockets',
  /if \(!att\.owner\) guests\.push/.test(relay) &&
  /if \(!oldest\) return false/.test(relay));
// Send sockets are intentionally unauthenticated (sealed sender), so an `att.owner`
// gate would turn every user-invisible control frame into a phantom push. A sender
// may mark only its own frame silent; that path must not clear an already armed wake
// for another queued, visible frame.
ok('silent sender frame cannot cancel an armed push for visible traffic',
  /const silent = m\.silent === true \? 1 : 0/.test(relay) &&
  /if \(!ownerOnline && !silent\) this\.ctx\.waitUntil\(this\.scheduleWake\(\)\)/.test(relay) &&
  /if \(this\.pendingVisibleCount\(\) === 0\) \{\s*this\.ctx\.storage\.sql\.exec\('DELETE FROM alarm_state WHERE name = \?', PUSH_DUE_KEY\)/.test(relay));
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

console.log('\n[deploy: provenance preflight + separately controlled R2 lifecycle]');
const deploy = pkg.scripts.deploy;
ok('normal deploy never changes the R2 deletion lifecycle',
  !deploy.includes('cf:lifecycle:apply') &&
  deploy.includes('wrangler deploy'));
ok('deploy checks a clean published commit before and after the build',
  deploy.match(/deploy:preflight/g)?.length === 2 &&
  deploy.indexOf('deploy:preflight') < deploy.indexOf('npm run build') &&
  deploy.lastIndexOf('deploy:preflight') < deploy.indexOf('wrangler deploy'));
ok('preflight verifies worktree, attached upstream and current remote SHA',
  deployPreflight.includes("'status', '--porcelain=v1', '--untracked-files=all'") &&
  deployPreflight.includes("'symbolic-ref', '--quiet', '--short', 'HEAD'") &&
  deployPreflight.includes("'@{upstream}'") &&
  deployPreflight.includes("'ls-remote', '--exit-code'"));
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
