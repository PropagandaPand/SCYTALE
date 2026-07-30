import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name); }
};

const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const backup = readFileSync(new URL('../src/BackupModal.tsx', import.meta.url), 'utf8');
const biometric = readFileSync(new URL('../src/BiometricEnroll.tsx', import.meta.url), 'utf8');
const duress = readFileSync(new URL('../src/DuressSetup.tsx', import.meta.url), 'utf8');

console.log('\n[Messenger lifecycle fence: lock/unmount cannot create a zombie writer]');

ok('inbox work is rejected both when queued and when its turn begins',
  source.includes('if (!lifecycleActiveRef.current || runtimeSuspendedRef.current) {\n      return Promise.reject(new MessengerInactiveError());') &&
  source.includes('inboxQueueRef.current.catch(() => undefined).then(async () => {\n      assertMessengerActive();'));

ok('every relay constructor path has an active-generation fence',
  /!lifecycleActiveRef\.current \|\|\s*runtimeSuspendedRef\.current \|\|\s*!id \|\|\s*relaysRef\.current\.has\(room\)/.test(source) &&
  /!lifecycleActiveRef\.current \|\|\s*runtimeSuspendedRef\.current \|\|\s*contact\.localOnly/.test(source) &&
  /!lifecycleActiveRef\.current \|\|\s*runtimeSuspendedRef\.current \|\|\s*relaysRef\.current\.has\(room\)/.test(source) &&
  source.includes('async function sendToInbox(recipientSignPub: Bytes, sealed: Bytes): Promise<void> {\n    assertRuntimeAvailable();'));

ok('late relay callbacks cannot mutate state after lock',
  source.includes('if (!lifecycleActiveRef.current || runtimeSuspendedRef.current) return;\n        void enqueueInbox(() => onInbox(bytes, ackId)).catch(() => undefined);') &&
  source.includes('if (lifecycleActiveRef.current && !runtimeSuspendedRef.current) {\n          markStatus('));

ok('restore fence closes relays, aborts old operations and jointly drains every writer queue',
  source.includes('async function suspendForRestore(): Promise<void>') &&
  source.includes('runtimeSuspendedRef.current = true;') &&
  source.includes('operation.controller.abort();') &&
  source.includes('await quiesceInbox();') &&
  source.includes('await bootTaskRef.current?.catch(() => undefined);') &&
  source.includes('messageMutationQueueRef.current.drain()') &&
  source.includes('groupMutationRetryRef.current === groupRetry') &&
  source.includes('messageMutationQueueRef.current.pending() === 0'));

const importStart = backup.indexOf('async function doImport()');
const importSource = backup.slice(importStart, backup.indexOf('return (', importStart));
ok('restore suspends before its own tracked operation and resumes only on failure',
  importSource.indexOf('await onBeforeImport?.();') <
    importSource.indexOf('runRuntimeOperation(async (signal)') &&
  source.includes('onBeforeImport={suspendForRestore}') &&
  source.includes('onImportFailed={resumeAfterFailedRestore}') &&
  source.includes('runtimeSuspendedRef.current = false;'));

ok('security-setting writers participate in the runtime join fence',
  biometric.includes('await runRuntimeOperation(async (signal) =>') &&
  duress.includes('await runRuntimeOperation(async (signal) =>') &&
  source.includes('<BiometricEnroll\n              runRuntimeOperation={runRuntimeOperation}') &&
  source.includes('mode={duressModal}\n              runRuntimeOperation={runRuntimeOperation}'));

ok('event-driven storage and group writers are lifetime-tracked',
  source.includes('launchRuntimeOperation(() => applyBadge(totalUnread))') &&
  source.includes('launchRuntimeOperation(() => togglePush())') &&
  source.includes('launchRuntimeOperation(() => createGroup())') &&
  source.includes('launchRuntimeOperation(() => leaveGroup(g))') &&
  source.includes('if (m.file?.attId) await secureWipeAttachment(m.file.attId);'));

ok('microphone callbacks are detached and the capture stream is stopped before writer drain',
  source.includes('recorder.ondataavailable = null;') &&
  source.includes('recorder.onstop = null;') &&
  source.includes('stream.getTracks().forEach((track) => track.stop());') &&
  source.includes('launchRuntimeOperation((signal) => startRecording(signal))') &&
  source.indexOf('cleanupRecording();', source.indexOf('async function quiesceForUnmount')) <
    source.indexOf('await quiesceInbox();', source.indexOf('async function quiesceForUnmount')));

const cleanup = source.indexOf('// Invalidate first:');
const invalidate = source.indexOf('lifecycleActiveRef.current = false;', cleanup);
const close = source.indexOf('for (const r of relaysRef.current.values()) r.close();', cleanup);
ok('cleanup invalidates before it closes sockets', cleanup >= 0 && invalidate > cleanup && close > invalidate);

ok('Quiesce-Bridge bleibt bis zum gestarteten Unmount-Drain registriert',
  source.includes('const unregister = registerVaultRuntimeQuiescer(quiesceForUnmount);') &&
  source.includes('void quiesceForUnmount()') &&
  source.includes('.finally(unregister);'));

ok('cleanup drops strong references to vault secrets and sessions',
  source.includes('identityRef.current = null;') &&
  source.includes('prekeysRef.current = null;') &&
  source.includes('lookupRef.current = null;') &&
  source.includes('contactsRef.current = [];'));

ok('boot checks activity after crypto/storage awaits and before inbox connect',
  source.includes('const id = await loadOrCreateIdentity(dek);\n      assertMessengerActive();') &&
  source.includes('const ownInbox = await inboxRoom(id.sign.publicKey);\n      assertMessengerActive();\n      connectInbox(ownInbox);'));

ok('a cancelled boot never writes an error into the replacement UI',
  source.includes('if (e instanceof MessengerInactiveError || !lifecycleActiveRef.current) return;'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
