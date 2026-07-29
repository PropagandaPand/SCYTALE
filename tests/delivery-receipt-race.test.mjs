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

console.log('\n[Delivery Receipt: sent/nack vor lokalem Bubble-Commit]');

const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const fanout = source.slice(
  source.indexOf('async function fanoutSend'),
  source.indexOf('// Auto-push a large attachment', source.indexOf('async function fanoutSend')),
);
const append = source.slice(
  source.indexOf('function consumeEarlyDeliveryReceipts'),
  source.indexOf('/** Append a just-materialized', source.indexOf('function consumeEarlyDeliveryReceipts')),
);
const status = source.slice(
  source.indexOf('function markStatus'),
  source.indexOf('// A relay to ONE peer device', source.indexOf('function markStatus')),
);

ok('Ack-Timer/Receipt-Erwartung wird vor dem potentiell synchronen send registriert',
  fanout.indexOf('startAckTimer(deliveryId)') < fanout.indexOf('.send(d.sealed, deliveryId'));
ok('Receipt ohne Bubble wird nur für einen erwarteten deliveryId gepuffert',
  status.includes('const expectedEarlyReceipt = ackTimers.current.has(id)') &&
  status.includes('if (expectedEarlyReceipt)') &&
  status.includes('earlyDeliveryReceiptsRef.current.set'));
ok('sent ist auch im Early-Puffer terminal und gewinnt gegen Timeout/Nack',
  status.includes("previous.status !== 'sent' || status === 'sent'"));
ok('Bubble konsumiert frühe Receipts vor dem ersten Persistieren',
  append.indexOf('consumeEarlyDeliveryReceipts(toAppend)') < append.indexOf('await saveMessages'));
ok('Receipt während IndexedDB-await erzwingt eine zweite persistierte Generation',
  append.indexOf('await saveMessages') < append.indexOf('const afterWrite = consumeEarlyDeliveryReceipts') &&
  append.includes('if (afterWrite !== toAppend)') &&
  append.includes('continue;'));
ok('Status-Update ersetzt das Message-Array unveränderlich, damit Append-Races sichtbar bleiben',
  status.includes('const next = [...arr]') &&
  !status.includes('arr[fi] =') &&
  !status.includes('arr[idx] ='));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
