// R2 descriptor and exact-stream boundary. The attacker controls every descriptor
// field and (as an authorised contact) can point at a capability object with junk.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './.bundle/entry.js';

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

const keyB64 = Buffer.from(new Uint8Array(32).fill(0x42)).toString('base64');
const valid = {
  key: 'a'.repeat(32),
  keyB64,
  size: S.BLOB_CHUNK + 7,
  chunk: S.BLOB_CHUNK,
};

console.log('\n[R2: Deskriptor wird vor Netzwerk/Allokation strikt validiert]');
const parsed = S.validateR2Descriptor(valid);
ok('gültiger v4-Deskriptor passiert', parsed.totalChunks === 2 && parsed.keyBytes.length === 32);
ok('Ciphertextlänge bindet 28 Byte IV+Tag pro Chunk',
  parsed.ciphertextBytes === valid.size + 2 * 28);
ok('exakte Content-Length wird akzeptiert', (() => {
  try {
    S.assertExactR2ContentLength(String(parsed.ciphertextBytes), parsed.ciphertextBytes);
    return true;
  } catch {
    return false;
  }
})());

const invalid = [
  ['falsche Chunkgröße', { ...valid, chunk: 1 }],
  ['fraktionale Größe', { ...valid, size: 1.5 }],
  ['leere Datei', { ...valid, size: 0 }],
  ['zu großer Key-Identifier', { ...valid, key: 'a'.repeat(64) }],
  ['Kf ist nicht 32 Byte', { ...valid, keyB64: Buffer.alloc(31).toString('base64') }],
  ['Kf ist nicht kanonisches Base64', { ...valid, keyB64: keyB64.replace(/=$/, '') }],
];
for (const [name, value] of invalid) {
  ok(`${name} wird abgelehnt`, S.tryValidateR2Descriptor(value) === null);
}
// NEGATIVE CONTROL: all fields below passed the old size/key-only ingest guard.
const oldGuard = (r) => r.size >= 0 && r.size <= 1024 ** 3 && /^[a-f0-9]{16,64}$/.test(r.key);
ok('Negativkontrolle: alter Guard hätte chunk=1 akzeptiert',
  oldGuard({ ...valid, chunk: 1 }) && S.tryValidateR2Descriptor({ ...valid, chunk: 1 }) === null);

let lengthMismatchRejected = false;
try {
  S.assertExactR2ContentLength(String(parsed.ciphertextBytes + 1), parsed.ciphertextBytes);
} catch {
  lengthMismatchRejected = true;
}
ok('Content-Length mit einem Trailing Byte wird abgelehnt', lengthMismatchRejected);
ok('fehlende Content-Length wird abgelehnt', (() => {
  try {
    S.assertExactR2ContentLength(null, parsed.ciphertextBytes);
    return false;
  } catch {
    return true;
  }
})());

console.log('\n[R2: Stream konsumiert exakt und cancelt danach]');
function mockReader(chunks) {
  let i = 0;
  return {
    cancelled: false,
    async read() {
      if (i >= chunks.length) return { done: true, value: undefined };
      return { done: false, value: chunks[i++] };
    },
    async cancel() {
      this.cancelled = true;
    },
  };
}

const exactReader = mockReader([new Uint8Array(3), new Uint8Array(2)]);
let consumed = 0;
await S.consumeExactByteStream(exactReader, 5, (chunk) => { consumed += chunk.length; });
ok('exakt fünf Bytes werden konsumiert', consumed === 5);
ok('Reader wird am Authentizitäts-/Längenende aktiv gecancelt', exactReader.cancelled);

const trailingReader = mockReader([new Uint8Array(6)]);
let trailingRejected = false;
try {
  await S.consumeExactByteStream(trailingReader, 5, () => undefined);
} catch (e) {
  trailingRejected = e?.code === 'trailing-bytes';
}
ok('Trailing Byte im selben Netzwerkchunk wird verworfen', trailingRejected);
ok('Trailing-Stream wird sofort gecancelt', trailingReader.cancelled);

const truncatedReader = mockReader([new Uint8Array(4)]);
let truncatedRejected = false;
try {
  await S.consumeExactByteStream(truncatedReader, 5, () => undefined);
} catch (e) {
  truncatedRejected = e?.code === 'truncated';
}
ok('vorzeitiges EOF wird verworfen', truncatedRejected);
ok('abgebrochener Stream wird gecancelt', truncatedReader.cancelled);

console.log('\n[R2: Multipart-Upload trägt die serverseitige Capability]');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src', 'lib', 'blobtransfer.ts'), 'utf8');
ok('Part meldet die reale Bodylänge vorab', source.includes('&bytes=${body.byteLength}'));
ok('Bearer wird an Part, Complete und Abort gesendet',
  (source.match(/headers:\s*\{\s*authorization,/g) ?? []).length === 3);
ok('Upload-Token hat exakt das serverseitige 32-Byte-Base64url-Format', (() => {
  try {
    const session = S.validateR2UploadSession({
      key: 'b'.repeat(32),
      uploadId: 'upload/id==',
      token: 'A'.repeat(43),
    });
    return session.token.length === 43;
  } catch {
    return false;
  }
})());
ok('zu kurzes Bearer-Token wird verworfen', (() => {
  try {
    S.validateR2UploadSession({ key: 'b'.repeat(32), uploadId: 'u', token: 'A'.repeat(42) });
    return false;
  } catch {
    return true;
  }
})());

const messengerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'Messenger.tsx'),
  'utf8',
);
const sendMedia = messengerSource.slice(
  messengerSource.indexOf('async function sendMedia('),
  messengerSource.indexOf('async function sendViaR2('),
);
ok('jeder Anhang über der Auto-Push-Cap geht über R2 (offline abholbar), nicht Sender-gestreamt',
  sendMedia.includes('const r2Threshold = AUTOPUSH_CAP;') &&
  sendMedia.includes('await sendViaR2(') &&
  // Negativkontrolle: die R2-Schwelle ist NICHT mehr an MAX_BIG_ATTACH gekoppelt (die alte Offer/Pull-Stufe)
  !/r2Threshold = viewOnce \? AUTOPUSH_CAP : MAX_BIG_ATTACH/.test(sendMedia));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
