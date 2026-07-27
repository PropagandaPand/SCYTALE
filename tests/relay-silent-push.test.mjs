// A remote sender may not suppress an owner's wake-up by setting `silent`.
// Only an authenticated owner/self-sync receives silent semantics.
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const relay = readFileSync(new URL('../worker/relay.ts', import.meta.url), 'utf8');
const wire = readFileSync(new URL('../src/lib/relay.ts', import.meta.url), 'utf8');
const msgr = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');

console.log('\n[relay: only owner-authenticated silent frames suppress push]');

// The queue carries a silent column (migrated on existing mailboxes too).
ok('q gains a silent column', /ALTER TABLE q ADD COLUMN silent INTEGER DEFAULT 0/.test(relay));
ok('send stores the silent flag', /INSERT INTO q \(body, ts, silent\)/.test(relay));
ok('unauthenticated sender cannot assert silent',
  /const silent = att\.owner && m\.silent === true \? 1 : 0/.test(relay));
// A send only arms the coalescing alarm when it is NOT silent.
ok('scheduleWake gated by !silent', /!ownerOnline && !silent\)\s*this\.ctx\.waitUntil\(this\.scheduleWake\(\)\)/.test(relay));
// The alarm only pushes when a NON-silent message is actually pending.
ok('alarm counts only non-silent pending', /COUNT\(\*\) AS n FROM q WHERE silent = 0/.test(relay));
// NEGATIVE CONTROL: the alarm must NOT decide on an unfiltered total any more —
// that unconditional count was exactly what pushed for pure control-frame bursts.
ok('Negativkontrolle: kein ungefilterter FROM q im Alarm-Zähler', !/COUNT\(\*\) AS n FROM q'\)/.test(relay));

console.log('\n[client: the silent flag reaches the wire and the right frames set it]');
ok('wire send takes a silent arg', /send\(bytes: Bytes, mid\?: string, silent = false\)/.test(wire));
ok('silent frame carries silent:true', /silent: true/.test(wire));
// The user-invisible kinds are classified silent…
ok('isSilentFrame lists profile/devlist/sync/recall', /case 'profile':[\s\S]*case 'devlist':[\s\S]*case 'sync':[\s\S]*case 'recall':/.test(msgr));
// …but a real message kind must NOT be in that list (or we'd drop real notifications).
ok('Negativkontrolle: text/file NICHT als silent klassifiziert', !/case 'text':\s*\n\s*case/.test(msgr) && !/return true;[\s\S]*case 'text'/.test(msgr.match(/function isSilentFrame[\s\S]*?\n}/)[0]));
// Self-sync and profile refresh explicitly send silent.
ok('self-sync sent silent', /self-sync: never notify yourself/.test(msgr));
ok('profile refresh sent silent', /profile refresh — silent/.test(msgr));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
