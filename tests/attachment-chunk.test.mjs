// #9 step 7b — the on-the-wire chunk frame (byte 14). Carries the full transfer
// descriptor plus a raw binary payload; must round-trip byte-for-byte (the bulk is
// NOT base64/JSON-encoded, so 0x00 and 0xff must survive), and must never be
// mistaken for a 'file' (byte 1). The reassembly STORE side is IndexedDB-bound and
// exercised via the receive path, not here.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[7b: chunk frame round-trips binary payload intact]');

const data = new Uint8Array(1000);
for (let i = 0; i < data.length; i++) data[i] = (i * 37 + 251) & 0xff; // spans 0x00..0xff
const c = { kind: 'chunk', tid: 'abc123XYZ_-', idx: 5, total: 42, size: 2_000_000, name: 'ein video.mp4', mime: 'video/mp4', data };

const framed = await S.frameContent(c);
ok('frame byte is 14', framed[0] === 14);

const back = await S.unframeContent(framed);
ok('decodes as kind chunk', back.kind === 'chunk');
ok('descriptor round-trips',
  back.tid === 'abc123XYZ_-' && back.idx === 5 && back.total === 42 &&
  back.size === 2_000_000 && back.name === 'ein video.mp4' && back.mime === 'video/mp4');
ok('data length preserved', back.data.length === data.length);
let same = true;
for (let i = 0; i < data.length; i++) if (back.data[i] !== data[i]) { same = false; break; }
ok('raw bytes byte-for-byte (no base64/JSON corruption of 0x00/0xff)', same);

// NEGATIVE CONTROL: a byte-14 frame must not be misread as a 'file' (byte 1).
ok('Negativkontrolle: nicht als file fehlinterpretiert', back.kind !== 'file');

// A zero-length payload (a legitimate empty tail chunk) still round-trips.
const b0 = await S.unframeContent(await S.frameContent(
  { kind: 'chunk', tid: 't', idx: 0, total: 1, size: 0, name: '', mime: '', data: new Uint8Array(0) },
));
ok('leerer Daten-Chunk round-trips', b0.kind === 'chunk' && b0.data.length === 0 && b0.total === 1);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
