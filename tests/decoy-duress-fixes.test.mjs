// Regression guards for the 5 findings from the 2026-07-29 re-review of the decoy/duress work:
//   HIGH-1 duress removal ↔ promotion deadlock (promotion always supersedes; no throw-forever boot)
//   HIGH-3 in-flight inbox write crossing an account switch (quiesce before switch + onInbox guard)
//   LOW-4  sticky accountWritesBlocked latch for a transient foreign restore lease
//   LOW-5  recall of an in-flight pull attachment leaving chunks + per-item key un-erased
// The marker state machine is exercised behaviourally against wipe.ts; the wiring of each guard is
// pinned structurally (the repo's established style — see link-grant-durability.test.mjs).
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// wipe.ts persists journals to localStorage with a readback check. Provide a minimal mock BEFORE
// any marker call (module init touches crypto, not storage, so setting it here is in time).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: (k) => void store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};

const S = await import('./.bundle/entry.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[Decoy/Duress-Fixes: Marker-Statemachine + Guard-Verdrahtung]');

const WITNESS = 'a'.repeat(64); // 64-hex source witness
const TOKEN = 'b'.repeat(32);   // 32-hex fence token

// ── HIGH-1 behavioural: the crash-safe promotion journal ─────────────────────
store.clear();
S.markPromoteDecoy(WITNESS, TOKEN);
ok('markPromoteDecoy → Journal-Phase "pending" mit Witness+Token', (() => {
  const j = S.decoyPromotionJournal();
  return j && j.phase === 'pending' && j.sourceWitness === WITNESS && j.fenceToken === TOKEN;
})());

// NEGATIVE CONTROL: clearing must be refused while still 'pending' (copy not durable → boot must
// still recover). This is the crash-safety invariant.
S.clearPromoteDecoy(TOKEN);
ok('clearPromoteDecoy räumt "pending" NICHT weg (Crash-Safety)', S.promoteMarkerPresent() === true);

S.markPromoteDecoyCopied(TOKEN);
ok('markPromoteDecoyCopied → Phase "copied"', S.decoyPromotionJournal()?.phase === 'copied');

// NEGATIVE CONTROL: monotone — a second markPromoteDecoy must never regress copied→pending.
S.markPromoteDecoy(WITNESS, TOKEN);
ok('markPromoteDecoy regressiert "copied" nicht zurück auf "pending" (monoton)',
  S.decoyPromotionJournal()?.phase === 'copied');

S.clearPromoteDecoy(TOKEN);
ok('clearPromoteDecoy(Token) räumt "copied" weg', S.promoteMarkerPresent() === false);

// NEGATIVE CONTROL: a foreign fence token must not clear someone else's copied journal.
store.clear();
S.markPromoteDecoy(WITNESS, TOKEN);
S.markPromoteDecoyCopied(TOKEN);
S.clearPromoteDecoy('c'.repeat(32));
ok('clearPromoteDecoy mit fremdem Token räumt NICHT weg', S.promoteMarkerPresent() === true);
S.clearPromoteDecoy(TOKEN);

// Duress-removal marker is an independent idempotent journal.
store.clear();
S.markDuressRemoval();
ok('markDuressRemoval → Removal-Marker gesetzt', S.duressRemovalMarkerPresent() === true);
S.clearDuressRemoval();
ok('clearDuressRemoval → Removal-Marker weg', S.duressRemovalMarkerPresent() === false);

// ── Structural guards (fail if a fix is reverted) ────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vs = readFileSync(join(root, 'src', 'lib', 'vaultService.ts'), 'utf8');
const db = readFileSync(join(root, 'src', 'lib', 'db.ts'), 'utf8');
const msg = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');

// HIGH-1: removal recovery DEFERS (returns) instead of throwing when a promotion is in progress,
// and promotion clears any pending removal marker. The old throw message must be gone.
ok('HIGH-1: completeDuressRemovalUnlocked wirft nicht mehr bei laufender Promotion',
  !vs.includes('Eine laufende Decoy-Promotion hat Vorrang vor der Entfernung'));
ok('HIGH-1: Promotion räumt einen moot Removal-Marker (kein Deadlock)',
  (vs.match(/if \(duressRemovalMarkerPresent\(\)\) clearDuressRemoval\(\)/g) || []).length >= 2);

// HIGH-3: the populate ENTER/EXIT drain the inbox to a fixed point before the switch; every inbox
// task is pinned to its origin account so any switch under it makes DB ops fail closed.
const populateSource = msg.slice(
  msg.indexOf('async function doPopulate()'),
  msg.indexOf('/** Quiesce every relay', msg.indexOf('async function doPopulate()')),
);
ok('HIGH-3: doPopulate ist vor Argon2 registriert und prüft einen Lock vor dem Wechsel',
  populateSource.indexOf('runTrackedRuntimeOperation(async (signal, trackedOperation)') <
    populateSource.indexOf('openDecoyForPopulate(populatePass)') &&
  (populateSource.match(/if \(signal\.aborted\) throw new MessengerInactiveError\(\);/g) || []).length === 2);
ok('HIGH-3: doPopulate drainiert ohne Self-Join und prüft Abort direkt vor onEnterDecoy',
  populateSource.indexOf('await quiesceForUnmount(trackedOperation);') <
    populateSource.lastIndexOf('if (signal.aborted)') &&
  populateSource.lastIndexOf('if (signal.aborted)') <
    populateSource.indexOf('onEnterDecoy?.(decoyDek)') &&
  msg.includes('async function quiesceInbox'));
const quiesceSource = msg.slice(
  msg.indexOf('async function quiesceForUnmount('),
  msg.indexOf('/** Leave the decoy', msg.indexOf('async function quiesceForUnmount(')),
);
ok('HIGH-3: nur der absichtliche Switch ist ausgenommen; externer Lock abortet und joint ihn',
  quiesceSource.includes('if (operation === exemptOperation) continue;') &&
  quiesceSource.includes('(operation) => operation !== exemptOperation') &&
  quiesceSource.includes('operation.controller.abort()') &&
  quiesceSource.includes('operation.settled.catch(() => undefined)'));
ok('HIGH-3: handleExitDecoy drainiert vor onExitDecoy',
  msg.includes('async function handleExitDecoy') &&
  msg.indexOf('await quiesceForUnmount(exemptOperation);\n    onExitDecoy?.();') > 0);
ok('HIGH-3: quiesceInbox drainiert bis zum Fixpunkt (Tail-Tasks)',
  msg.includes('for (;;) {\n      const inboxTail = inboxQueueRef.current;') &&
  msg.includes('messageMutationQueueRef.current.drain()') &&
  msg.includes('groupMutationRetryRef.current === groupRetry') &&
  msg.includes('messageMutationQueueRef.current.pending() === 0'));
ok('HIGH-3: Inbox-Tasks sind an ihr Herkunfts-Konto gepinnt (fail-closed bei Switch)',
  msg.includes('pinTaskAccount(origin)') &&
  msg.includes('clearTaskAccount()') &&
  db.includes('let pinnedTaskDb') &&
  db.includes('if (pinnedTaskDb !== null && activeDbName !== pinnedTaskDb) throw new StaleAccountGenerationError();'));

// LOW-4: a transient foreign restore lease must NOT latch the write-block flag.
ok('LOW-4: accountWritesBlocked wird nur bei permanenten Blockern gelatcht',
  db.includes('if (generationChanged || fenced) accountWritesBlocked = true;') &&
  db.includes('const foreignRestore = restoreLockBlocks(restoreLock);'));

// LOW-5: recall of an in-flight pull crypto-erases the local chunks + per-item key, gated on OUR
// recvMarker for exactly THIS room (no cross-room erase of an id-colliding transfer).
ok('LOW-5: retractMessage crypto-erased laufende Pull-Chunks (recvMarker + roomId-gated)',
  msg.includes('const inflight = await getRecvMarker(dek, targetMid)') &&
  msg.includes('inflight && inflight.roomId === roomId') &&
  msg.indexOf('clearRecvMarker(targetMid)') > 0 &&
  msg.indexOf('secureWipeAttachment(targetMid)') > 0);

// ── Behavioural (fake-indexeddb): discriminating tests the structural greps can't provide ────────
const REC = (n) => ({ iv: new Uint8Array([n]), ct: new Uint8Array([n, n]) });

// HIGH-3 task pin: a write issued while a task is pinned to a DIFFERENT account fails closed.
await S.switchVaultDb('scytale');
await S.saveRecord('tp-prime', REC(1)); // prime observedAccountGeneration for 'scytale'
S.pinTaskAccount('scytale-decoy'); // simulate an in-flight decoy task after a switch to 'scytale'
let pinThrew = false;
try { await S.saveRecord('tp-x', REC(2)); } catch { pinThrew = true; }
ok('HIGH-3 (verhalten): Write ins falsche Konto wirft, solange die Task gepinnt ist', pinThrew);
S.clearTaskAccount();
await S.saveRecord('tp-ok', REC(3));
ok('HIGH-3 (verhalten): nach clearTaskAccount wieder schreibbar', (await S.loadRecord('tp-ok')) !== undefined);
// NEGATIVE CONTROL: a pin to the CURRENT account must never block.
S.pinTaskAccount('scytale');
let sameOk = false;
try { await S.saveRecord('tp-same', REC(4)); sameOk = true; } catch { sameOk = false; }
ok('HIGH-3 (verhalten): Pin aufs AKTUELLE Konto blockiert nicht (Negativkontrolle)', sameOk);
S.clearTaskAccount();

// LOW-4 discriminating: a transient foreign restore lease blocks, then RECOVERS once expired —
// WITHOUT switchVaultDb / reload / BroadcastChannel. A sticky latch would keep failing here.
const LOCK_KEY = 'account-restore-lock';
await S.saveRecord('l4-prime', REC(1)); // generation already primed above; keep active on 'scytale'
await S.withVaultDb('scytale', (d) => d.put('kv', { token: 'f'.repeat(32), expiresAt: Date.now() + 60000 }, LOCK_KEY));
let leaseBlocked = false;
try { await S.saveRecord('l4-blocked', REC(2)); } catch { leaseBlocked = true; }
ok('LOW-4 (verhalten): gültige fremde Restore-Lease blockiert den Write', leaseBlocked);
// Expire the lease in place (no switch/reload) and confirm the NEXT write recovers on its own.
await S.withVaultDb('scytale', (d) => d.put('kv', { token: 'f'.repeat(32), expiresAt: Date.now() - 1000 }, LOCK_KEY));
let leaseRecovered = false;
try { await S.saveRecord('l4-recovered', REC(3)); leaseRecovered = true; } catch { leaseRecovered = false; }
ok('LOW-4 (verhalten): nach Ablauf ohne reload/switch wieder schreibbar (nicht sticky)', leaseRecovered);
await S.withVaultDb('scytale', (d) => d.delete('kv', LOCK_KEY));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
