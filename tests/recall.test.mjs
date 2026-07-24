// Message recall ("unsend") — the wire frame (byte 15) round-trips its target mid.
// The retract/tombstone logic is React + IndexedDB (exercised in the app, not here).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[recall frame round-trips its target mid]');

const framed = await S.frameContent({ kind: 'recall', targetMid: 'a1b2c3d4e5f6a1b2c3d4e5f6' });
ok('frame byte is 15', framed[0] === 15);
const back = await S.unframeContent(framed);
ok('decodes as kind recall with the target mid', back.kind === 'recall' && back.targetMid === 'a1b2c3d4e5f6a1b2c3d4e5f6');
// NEGATIVE CONTROL: a recall must not be misread as a text/file message.
ok('Negativkontrolle: nicht als text/file fehlinterpretiert', back.kind !== 'text' && back.kind !== 'file');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
