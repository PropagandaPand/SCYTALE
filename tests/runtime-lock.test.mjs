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
let finishQuiescence;
const quiescence = new Promise((resolve) => { finishQuiescence = resolve; });
tabA.releaseAfter(quiescence);
let reacquiredBeforeQuiescence = false;
const fencedReacquire = tabA.acquire().then((value) => {
  reacquiredBeforeQuiescence = true;
  return value;
});
await Promise.resolve();
ok('Lock-Freigabe wartet auf alte Messenger-/IDB-Writer',
  tabA.held() && locks.held && !reacquiredBeforeQuiescence);
finishQuiescence();
ok('derselbe Tab kann erst nach Quieszenz wieder Writer werden', await fencedReacquire);
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

let finishMessenger;
let quiescerCalled = false;
const unregister = S.registerVaultRuntimeQuiescer(() => {
  quiescerCalled = true;
  return new Promise((resolve) => { finishMessenger = resolve; });
});
let bridgeFinished = false;
const bridge = S.beginVaultRuntimeQuiesce().then(() => { bridgeFinished = true; });
await Promise.resolve();
ok('App↔Messenger-Bridge wartet auf die registrierte Quieszenz',
  quiescerCalled && !bridgeFinished);
finishMessenger();
await bridge;
unregister();
await S.beginVaultRuntimeQuiesce();
ok('Unmount-Disposer entfernt nur seine eigene Quiesce-Generation', bridgeFinished);

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
ok('Messenger-Mount ist an acquire/release des Runtime-Locks gebunden',
  app.includes('acquireVaultRuntimeLock') &&
  app.includes('releaseVaultRuntimeLock') &&
  app.indexOf('acquireVaultRuntimeLock') < app.indexOf("setPhase('open')"));
ok('App rendert die Sperre sofort, hält den Web Lock aber bis Messenger quieszent ist',
  app.includes('beginVaultRuntimeQuiesce()') &&
  app.includes('releaseVaultRuntimeLockAfter(lockQuiescenceRef.current)'));
const lockSource = app.slice(
  app.indexOf('const lock = useCallback'),
  app.indexOf('// Release only after React', app.indexOf('const lock = useCallback')),
);
ok('Auto-Lock im Decoy repointet die aktive DB erst nach vollständiger Runtime-Quieszenz',
  lockSource.includes("messengerQuiescence.then(() =>\n        switchVaultDb('scytale')") &&
  !lockSource.includes("void switchVaultDb('scytale')"));
ok('Passphrase und manueller Biometrie-Unlock warten auf den sicheren Decoy-DB-Reset',
  (app.match(/await lockQuiescenceRef\.current;/g) || []).length >= 2);
const autoBiometricPolicy = app.slice(
  app.indexOf('// Whether to offer the biometric button'),
  app.indexOf('function beginLockoutCountdown'),
);
ok('Auto-Biometrie und Duress-Policy lesen den Header erst nach der aktuellen Quieszenz',
  autoBiometricPolicy.indexOf('await quiescence;') <
    autoBiometricPolicy.indexOf('biometricEnrolled()') &&
  autoBiometricPolicy.indexOf('await quiescence;') <
    autoBiometricPolicy.indexOf('duressEnabled()') &&
  autoBiometricPolicy.includes('lifecycleEpochRef.current !== expectedLifecycleEpoch') &&
  autoBiometricPolicy.includes('if (lockQuiescenceRef.current !== quiescence) continue;'));
const messenger = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
ok('Messenger registriert eine permanente Unmount-Fence und wartet auf den Boot-Task',
  messenger.includes('registerVaultRuntimeQuiescer(quiesceForUnmount)') &&
  messenger.includes('await bootTaskRef.current?.catch(() => undefined);'));
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
const appTeardownStart = app.indexOf('// Navigation must NOT resolve our Web-Lock hold');
const appTeardownEffectStart = app.indexOf('useEffect(() => {', appTeardownStart);
const appTeardown = app.slice(
  appTeardownStart,
  app.indexOf('useEffect(() => {', appTeardownEffectStart + 1),
);
ok('Navigation gibt den Web Lock nie vorzeitig aus beforeunload frei',
  !app.includes("window.addEventListener('beforeunload'") &&
  appTeardown.includes('beginVaultRuntimeQuiesce()') &&
  appTeardown.includes('releaseVaultRuntimeLockAfter(') &&
  appTeardown.includes('lockQuiescenceRef.current.catch(() => undefined)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
