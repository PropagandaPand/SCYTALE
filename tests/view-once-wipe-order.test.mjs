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

const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const start = source.indexOf('async function openViewOnce');
const end = source.indexOf('// Recall ("unsend")', start);
const viewOnce = source.slice(start, end);

console.log('\n[View-once: Crypto-Erase ist Teil der serialisierten Consume-Operation]');

ok('Consume läuft in derselben per-room Mutation wie andere Message-RMWs',
  viewOnce.includes('await enqueueMessageMutation(roomId, async () => {'));
ok('aktueller persistierter Eintrag muss noch exakt auf dieselbe Attachment-ID zeigen',
  viewOnce.includes('x.file.attId === attId') &&
  viewOnce.includes('!x.voSeen'));
ok('Attachment-Wipe wird vor Seen-Tombstone und Message-Commit awaited',
  viewOnce.indexOf('await secureWipeAttachment(attId)') <
    viewOnce.indexOf('const next = arr.map') &&
  viewOnce.indexOf('await secureWipeAttachment(attId)') <
    viewOnce.indexOf('await saveMessages(dek, roomId, next)'));
ok('Anzeige erfolgt ausschließlich nach erfolgreichem Wipe und durablem Tombstone',
  viewOnce.indexOf('await saveMessages(dek, roomId, next)') <
    viewOnce.indexOf('if (!consumed) return') &&
  viewOnce.indexOf('if (!consumed) return') <
    viewOnce.indexOf('setViewOnce({ blob, mime })') &&
  !viewOnce.includes('void secureWipeAttachment(attId)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
