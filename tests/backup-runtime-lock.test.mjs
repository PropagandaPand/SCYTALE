import { readFileSync } from 'node:fs';

let pass = 0;
let fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

const messenger = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../src/BackupModal.tsx', import.meta.url), 'utf8');
const backup = readFileSync(new URL('../src/lib/backup.ts', import.meta.url), 'utf8');

console.log('\n[Backup lifecycle: lock aborts and joins all long-running backup work]');

const runStart = messenger.indexOf('async function runTrackedRuntimeOperation');
const runEnd = messenger.indexOf('async function runRuntimeOperation', runStart);
const run = messenger.slice(runStart, runEnd);
const quiesceStart = messenger.indexOf('async function quiesceForUnmount');
const quiesceEnd = messenger.indexOf('/** Leave the decoy', quiesceStart);
const quiesce = messenger.slice(quiesceStart, quiesceEnd);
const exportStart = modal.indexOf('async function doExport');
const exportEnd = modal.indexOf('async function doImport', exportStart);
const exportUi = modal.slice(exportStart, exportEnd);
const restoreStart = backup.indexOf('async function commitStagedRestore');
const restoreEnd = backup.indexOf('function parseMeta', restoreStart);
const restore = backup.slice(restoreStart, restoreEnd);

ok('Operation wird synchron registriert, bevor ihr erstes Promise läuft',
  run.indexOf('runtimeOperationsRef.current.add(tracked)') <
    run.indexOf('return await operation(controller.signal, tracked)'));
ok('Lock invalidiert, abortet und wartet alle registrierten Operationen ab',
  quiesce.indexOf('lifecycleActiveRef.current = false') <
    quiesce.indexOf('operation.controller.abort()') &&
  quiesce.includes('const pendingOperations = [...runtimeOperationsRef.current].filter(') &&
  quiesce.includes('if (pendingOperations.length === 0) break;') &&
  quiesce.includes('operation.settled.catch(() => undefined)'));
ok('Export prüft den Abbruch nach Auth/KDF und unmittelbar vor dem Download',
  exportUi.includes('exportBackup(dek, exportPass, signal)') &&
  exportUi.indexOf('throwIfBackupUiAborted(signal);', exportUi.indexOf('document.body.appendChild(a)')) <
    exportUi.indexOf('a.click()'));
ok('Import erhält dasselbe AbortSignal bis in den Restore',
  modal.includes('importBackup(dek, exportPass, file, signal)') &&
  backup.includes('commitStagedRestore(dek, blob, async (stageId) => {') &&
  backup.includes('}, signal);'));
ok('Restore prüft das Signal direkt vor der einzigen atomaren Commit-Grenze',
  restore.indexOf('throwIfBackupAborted(signal);', restore.indexOf('await attachments(stageId)')) <
    restore.indexOf('await commitRestoreStage(stageId)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
