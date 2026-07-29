import { readFileSync } from 'node:fs';
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

console.log('\n[Cross-Tab: genau ein entsperrter Ratchet-Writer]');

class FakeWebLocks {
  held = false;

  async request(_name, options, callback) {
    if (options.ifAvailable && this.held) return callback(null);
    this.held = true;
    try {
      return await callback({ name: 'scytale-vault-runtime-v1', mode: 'exclusive' });
    } finally {
      this.held = false;
    }
  }
}

const locks = new FakeWebLocks();
const tabA = S.createVaultRuntimeLockManager(locks);
const tabB = S.createVaultRuntimeLockManager(locks);

ok('erster Tab erhält den exklusiven Runtime-Lock', await tabA.acquire());
ok('erster Tab hält den Lock bis zum expliziten App-Lock/Unmount', tabA.held() && locks.held);
ok('zweiter Tab failt sofort geschlossen statt parallel Ratchets zu benutzen',
  (await tabB.acquire()) === false && !tabB.held());
tabA.release();
const rapidReacquire = tabA.acquire();
ok('schnelles Re-Unlock wartet auf die echte Freigabe statt sterbenden Besitz wiederzuverwenden',
  await rapidReacquire);
tabA.release();
await new Promise((resolve) => setTimeout(resolve, 0));
ok('nach Sperren des ersten Tabs kann der zweite sicher übernehmen', await tabB.acquire());
tabB.release();
await new Promise((resolve) => setTimeout(resolve, 0));

const noApi = S.createVaultRuntimeLockManager(undefined);
ok('Browser ohne Web Locks wird fail-closed abgewiesen', (await noApi.acquire()) === false);

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
ok('Messenger-Mount ist an acquire/release des Runtime-Locks gebunden',
  app.includes('acquireVaultRuntimeLock') &&
  app.includes('releaseVaultRuntimeLock') &&
  app.indexOf('acquireVaultRuntimeLock') < app.indexOf("setPhase('open')"));
const submitSource = app.slice(
  app.indexOf('async function submit()'),
  app.indexOf('const lock = useCallback', app.indexOf('async function submit()')),
);
ok('Create erwirbt den Runtime-Lock vor dem ersten kanonischen Vault-Write',
  submitSource.indexOf('acquireRuntimeLockForOpen(false)') <
  submitSource.indexOf('createBoundVault(passphrase)'));
ok('Passphrase/Duress wird vor Lock-Erwerb entschieden, Messenger aber erst danach geöffnet',
  submitSource.indexOf('unlockBoundVault(passphrase)') <
  submitSource.indexOf('acquireRuntimeLockForOpen(true)') &&
  submitSource.indexOf('acquireRuntimeLockForOpen(true)') <
  submitSource.indexOf('openWith(newDek, lifecycleEpoch)'));
ok('pagehide gibt während Create/Unlock nicht vorzeitig frei (BFCache-Race-Guard)',
  !app.includes("window.addEventListener('pagehide', release)") &&
  app.includes("window.addEventListener('beforeunload', release)"));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
