// Biometric (WebAuthn PRF) unlock is a SECOND wrap of the same random DEK under a
// PRF-derived KEK. WebAuthn itself can't run in Node, but the security-critical part
// — that the second wrap round-trips the SAME DEK, that a wrong KEK is rejected, and
// that the recovered working key is non-extractable (at-rest guarantee) — is pure
// Web Crypto and testable here. We fabricate the PRF KEK directly (exactly the shape
// derivePrfKek produces: a non-extractable AES-GCM wrapKey/unwrapKey key).
import { webcrypto } from 'node:crypto';
globalThis.crypto ??= webcrypto;
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const enc = new TextEncoder();

const randWrapKek = () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);

console.log('\n[biometric PRF wrap: a second door onto the SAME DEK]');

// Build a minimal vault envelope by hand (no Argon2): a random KEK wraps a random
// extractable DEK — the exact structure createVault produces.
const passKek = await randWrapKek();
const seedDek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
const wrapIv = crypto.getRandomValues(new Uint8Array(12));
const wrappedDek = new Uint8Array(await crypto.subtle.wrapKey('raw', seedDek, passKek, { name: 'AES-GCM', iv: wrapIv }));
const header = { version: 1, argon2: { memorySize: 65536, iterations: 3, parallelism: 1, hashLength: 32 }, salt: crypto.getRandomValues(new Uint8Array(16)), wrapIv, wrappedDek };

// Enrollment: unwrap the DEK extractable, then re-wrap it under the PRF KEK.
const extractableDek = await S.unwrapDekExtractable(passKek, header);
const prfKek = await randWrapKek();
const prfWrap = await S.wrapDekUnder(prfKek, extractableDek);
ok('wrapDekUnder liefert wrapIv (12 B) + wrappedDek', prfWrap.wrapIv.length === 12 && prfWrap.wrappedDek.length >= 16);

// Unlock via PRF: recover a working DEK and prove it's the SAME key as the original.
const prf = { credentialId: new Uint8Array(0), salt: new Uint8Array(0), wrapIv: prfWrap.wrapIv, wrappedDek: prfWrap.wrappedDek };
const dek2 = await S.unwrapDekWithPrf(prfKek, prf);

const aad = enc.encode('scytale:test:v1');
const msg = enc.encode('the vault opens the same way');
const sealed = await S.seal(seedDek, msg, aad); // sealed under the ORIGINAL dek
const opened = await S.open(dek2, sealed, aad); // opened by the PRF-recovered dek
ok('PRF-recovered DEK decrypts what the original DEK sealed (same key)', new TextDecoder().decode(opened) === 'the vault opens the same way');

// At-rest guarantee: the working key from the PRF path is NON-EXTRACTABLE, exactly
// like the passphrase path — its raw bytes never reach JS.
let extractable = true;
try { await crypto.subtle.exportKey('raw', dek2); } catch { extractable = false; }
ok('PRF-recovered DEK is non-extractable (raw export throws)', extractable === false);

// NEGATIVE CONTROL: a DIFFERENT PRF KEK (someone else's biometric / wrong secret)
// must NOT unwrap the DEK. Without this, the round-trip above proves nothing.
const wrongPrfKek = await randWrapKek();
let rejected = false;
try { await S.unwrapDekWithPrf(wrongPrfKek, prf); } catch { rejected = true; }
ok('Negativkontrolle: falscher PRF-KEK wird abgelehnt (GCM-Tag)', rejected === true);

// NEGATIVE CONTROL: the passphrase-path unwrap must likewise reject a wrong KEK, so
// a copied envelope alone (no KEK) yields nothing.
let extRejected = false;
try { await S.unwrapDekExtractable(await randWrapKek(), header); } catch { extRejected = true; }
ok('Negativkontrolle: unwrapDekExtractable mit falschem KEK wirft', extRejected === true);

// ── Device binding of the PRF KEK (MED-1 fix) ──────────────────────────────
// derivePrfKek is salted with the vault's device-bound secret, so a wrap made on one
// device's binding must NOT open under a different binding — even with the SAME PRF
// secret (the case of a cloud-synced passkey landing on another device).
console.log('\n[PRF KEK is device-bound via the HKDF salt]');
const prfSecret = crypto.getRandomValues(new Uint8Array(32));
const saltA = enc.encode('scytale:prf-bind:v1:deviceA');
const saltB = enc.encode('scytale:prf-bind:v1:deviceB');
const kekA = await S.derivePrfKek(prfSecret, saltA);
const kekB = await S.derivePrfKek(prfSecret, saltB);
const dekX = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
const wrapA = await S.wrapDekUnder(kekA, dekX);
const prfA = { credentialId: new Uint8Array(0), salt: new Uint8Array(0), wrapIv: wrapA.wrapIv, wrappedDek: wrapA.wrappedDek };

let crossRejected = false;
try { await S.unwrapDekWithPrf(kekB, prfA); } catch { crossRejected = true; }
ok('same PRF secret, DIFFERENT device binding ⇒ wrap does NOT open (MED-1)', crossRejected === true);

// Control: the SAME binding re-derives the same KEK and opens it.
const kekA2 = await S.derivePrfKek(prfSecret, saltA);
const dekBack = await S.unwrapDekWithPrf(kekA2, prfA);
const sealed2 = await S.seal(dekX, enc.encode('device-bound'), aad);
ok('Kontrolle: gleiche Geräte-Bindung öffnet den Wrap', new TextDecoder().decode(await S.open(dekBack, sealed2, aad)) === 'device-bound');

console.log(`\n${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
