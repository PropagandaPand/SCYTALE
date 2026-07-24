import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[relay ack requires authenticated owner]');

const src = readFileSync(new URL('../worker/relay.ts', import.meta.url), 'utf8');
const ackCase = src.match(/case 'ack': \{([\s\S]*?)\n\s*}\n\s*case 'subscribe':/);

ok('ack branch exists', !!ackCase);
ok('ack refuses unauthenticated sockets before deleting', !!ackCase && /if \(!att\.owner\) return;[\s\S]*DELETE FROM q WHERE id = \?/.test(ackCase[1]));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
