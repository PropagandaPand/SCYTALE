// Stage 3d — the fan-out bubble status must be HONEST (Review fund 5/6). The
// aggregate over per-device deliveries: all sent → ✓; some sent → partial; NONE
// reached (all stale / zero live) → NOT delivered (⚠), never a false ✓; a stale
// device drops out of the denominator (the current device set).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const d = (status) => ({ device: 'x', deliveryId: 'y', status });

console.log('\n[aggregateDelivery: ehrlicher Zustell-Status]');

ok('alle sent ⇒ sent', S.aggregateDelivery([d('sent'), d('sent')]).label === 'sent');
ok('einige sent ⇒ partial (N/M)', (() => { const a = S.aggregateDelivery([d('sent'), d('pending')]); return a.label === 'partial' && a.sent === 1 && a.total === 2; })());
ok('keins sent, alle failed ⇒ failed', S.aggregateDelivery([d('failed'), d('failed')]).label === 'failed');
ok('noch pending ⇒ pending', S.aggregateDelivery([d('pending'), d('pending')]).label === 'pending');

// FUND 5: every device stale (zero reachable) must NOT show delivered.
ok('alle stale (null erreicht) ⇒ NICHT zugestellt, nie ✓ (Fund 5)', S.aggregateDelivery([d('stale'), d('stale')]).label === 'failed');
ok('leere Liste ⇒ NICHT zugestellt', S.aggregateDelivery([]).label === 'failed');

// A stale device drops OUT of the denominator: 1 sent + 1 stale reads as fully sent.
ok('stale fällt aus dem Nenner: 1 sent + 1 stale ⇒ sent (1/1)', (() => { const a = S.aggregateDelivery([d('sent'), d('stale')]); return a.label === 'sent' && a.total === 1; })());
// NEGATIVE CONTROL: without dropping stale it would read 1/2 partial — prove it doesn't.
ok('Negativkontrolle: stale zählt NICHT als Fehler (kein partial)', S.aggregateDelivery([d('sent'), d('stale')]).label !== 'partial');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
