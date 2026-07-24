// #9 step 7d — the large-attachment offer/pull frames (bytes 16/17) round-trip.
// The serve/pull orchestration is React + IndexedDB (exercised in the app).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[offer/pull frames round-trip]');

const offer = await S.unframeContent(
  await S.frameContent({ kind: 'attoffer', tid: 'aB9xYz', name: 'clip.mp4', mime: 'video/mp4', size: 5_000_000, total: 105 }),
);
ok('attoffer (byte 16) round-trips its descriptor',
  offer.kind === 'attoffer' && offer.tid === 'aB9xYz' && offer.name === 'clip.mp4' &&
  offer.mime === 'video/mp4' && offer.size === 5_000_000 && offer.total === 105);

const req = await S.unframeContent(await S.frameContent({ kind: 'attreq', tid: 'aB9xYz' }));
ok('attreq (byte 17) round-trips its tid', req.kind === 'attreq' && req.tid === 'aB9xYz');
// NEGATIVE CONTROL: an offer must not be mistaken for a real (byte-1) file.
ok('Negativkontrolle: attoffer ist kein file', offer.kind !== 'file');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
