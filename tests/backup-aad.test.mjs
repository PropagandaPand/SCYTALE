// Backup section role-binding (audit N-3). Each backup section is AES-GCM sealed
// with a role-specific AAD (meta vs att:<id>), so a ciphertext cannot be spliced
// between roles or under a different attachment id. v2 backups carried no AAD, so
// the reader passes `undefined` for them — that path must still round-trip.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const enc = new TextEncoder();
const dec = new TextDecoder();
const throws = async (fn) => { try { await fn(); return false; } catch { return true; } };

const raw = new Uint8Array(32).fill(7);
const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

console.log('\n[backup section AAD binding]');

// Meta section round-trips under its own AAD.
const metaSec = await S.encSection(key, enc.encode('{"v":1}'), S.backupMetaAad());
ok('meta round-trips with its aad', dec.decode(await S.decSection(key, metaSec.iv, metaSec.ct, S.backupMetaAad())) === '{"v":1}');
// Role confusion blocked: a meta section must not decode as an attachment section…
ok('meta section refuses att aad', await throws(() => S.decSection(key, metaSec.iv, metaSec.ct, S.backupAttAad('x'))));
// …nor with no aad at all (a v3 writer bound it).
ok('meta section refuses missing aad', await throws(() => S.decSection(key, metaSec.iv, metaSec.ct)));

// Attachment splice blocked: id A's ciphertext must not decode under id B.
const attSec = await S.encSection(key, enc.encode('PHOTO-A'), S.backupAttAad('A'));
ok('att A round-trips under its id', dec.decode(await S.decSection(key, attSec.iv, attSec.ct, S.backupAttAad('A'))) === 'PHOTO-A');
ok('att A refuses id B (splice blocked)', await throws(() => S.decSection(key, attSec.iv, attSec.ct, S.backupAttAad('B'))));

// Backward compat: a v2 (no-aad) section round-trips both ways.
const v2Sec = await S.encSection(key, enc.encode('PHOTO-A'));
ok('v2 no-aad section round-trips', dec.decode(await S.decSection(key, v2Sec.iv, v2Sec.ct)) === 'PHOTO-A');
// NEGATIVE CONTROL: a no-aad ciphertext must fail if a reader wrongly supplies an aad.
ok('Negativkontrolle: no-aad ct + aad schlägt fehl', await throws(() => S.decSection(key, v2Sec.iv, v2Sec.ct, S.backupMetaAad())));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
