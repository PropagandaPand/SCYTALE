// R2 large-attachment crypto: the file is sealed CLIENT-SIDE under a random per-file
// key before it ever reaches R2, and only that key (carried E2E) can decrypt it. This
// suite proves round-trip fidelity across chunk boundaries AND that the ciphertext is
// useless without the exact key / order (negative controls — see test-negative-control).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

console.log('\n[R2 blob crypto: encrypt → (upload) → decrypt round-trips]');

// Sizes spanning: tiny, exactly one chunk, just over a chunk, several chunks + tail.
const CHUNK = S.BLOB_CHUNK;
for (const size of [0, 1, 1000, CHUNK - 1, CHUNK, CHUNK + 1, CHUNK * 3 + 12345]) {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = (i * 131 + 7) & 0xff; // spans 0x00..0xff
  const env = await S.encryptBlob(data);
  ok(`size ${size}: descriptor sane`, env.size === size && env.chunk === CHUNK && typeof env.keyB64 === 'string');
  ok(`size ${size}: ciphertext is NOT plaintext`, size === 0 || !eq(env.ciphertext.subarray(0, size), data));
  const back = await S.decryptBlob(env.ciphertext, env.keyB64, env.size, env.chunk);
  ok(`size ${size}: decrypts byte-for-byte`, eq(back, data));
}

// NEGATIVE CONTROL 1: the WRONG key must NOT decrypt (AES-GCM tag fails).
{
  const data = new Uint8Array(CHUNK + 500).fill(0xab);
  const env = await S.encryptBlob(data);
  const other = await S.encryptBlob(new Uint8Array(4)); // a different random key
  let threw = false;
  try {
    await S.decryptBlob(env.ciphertext, other.keyB64, env.size, env.chunk);
  } catch {
    threw = true;
  }
  ok('Negativkontrolle: falscher Schlüssel entschlüsselt NICHT', threw);
}

// NEGATIVE CONTROL 2: swapping two chunks breaks the per-chunk AAD binding.
{
  const data = new Uint8Array(CHUNK * 2 + 10);
  for (let i = 0; i < data.length; i++) data[i] = (i * 17) & 0xff;
  const env = await S.encryptBlob(data);
  const cLen = 12 + CHUNK + 16; // ciphertext length of a full chunk
  const swapped = new Uint8Array(env.ciphertext); // clone
  swapped.set(env.ciphertext.subarray(cLen, 2 * cLen), 0); // chunk1 → slot0
  swapped.set(env.ciphertext.subarray(0, cLen), cLen); // chunk0 → slot1
  let threw = false;
  try {
    await S.decryptBlob(swapped, env.keyB64, env.size, env.chunk);
  } catch {
    threw = true;
  }
  ok('Negativkontrolle: vertauschte Chunks werden abgelehnt (AAD-Index)', threw);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
