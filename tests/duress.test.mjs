// Duress password: a SECOND passphrase that is RECOGNISED (so the app can wipe) but never
// unlocks anything. These test the pure crypto guard (createDuressGuard / matchesDuress) —
// the device-binding + wipe wiring lives in vaultService and is exercised in the UI layer.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[Duress-Passwort: erkennen, aber niemals entsperren]');

const REAL = 'echte-tresor-passphrase-123';
const DURESS = 'notfall-duress-passwort-xyz';

const { header, dek } = await S.createVault(REAL);
ok('frischer Tresor hat noch keinen Duress-Guard', header.duress === undefined);
ok('matchesDuress ohne Guard ist false', (await S.matchesDuress(DURESS, header)) === false);

// Arm the duress guard for a DIFFERENT passphrase, using the header's Argon2 params.
header.duress = await S.createDuressGuard(DURESS, header.argon2);

ok('Duress-Passwort wird erkannt', (await S.matchesDuress(DURESS, header)) === true);

// NEGATIVE CONTROLS — the whole point is that ONLY the duress passphrase matches.
ok('echte Passphrase ist NICHT Duress (ein normaler Login darf nie wipen)',
  (await S.matchesDuress(REAL, header)) === false);
ok('eine dritte, bloß falsche Passphrase ist NICHT Duress',
  (await S.matchesDuress('irgendein-tippfehler', header)) === false);

// The real unlock path is UNAFFECTED by the presence of the duress guard: it still yields the
// SAME working DEK (seal with the create-time DEK, open with the freshly unlocked one).
const dek2 = await S.unlockVault(REAL, header);
const aad = new TextEncoder().encode('scytale:duress-test');
const sealed = await S.seal(dek, new TextEncoder().encode('geheim'), aad);
const opened = await S.open(dek2, sealed, aad);
ok('echte Passphrase entsperrt weiterhin DENSELBEN DEK (Guard ändert den echten Pfad nicht)',
  new TextDecoder().decode(opened) === 'geheim');

// The duress passphrase must NEVER unlock the real vault (unwrap of the real wrappedDek fails).
let duressUnlocked = false;
try { await S.unlockVault(DURESS, header); duressUnlocked = true; } catch { duressUnlocked = false; }
ok('Duress-Passwort entsperrt NIEMALS den echten Tresor', duressUnlocked === false);

// Deniability: on disk the guard is byte-shaped exactly like any other wrapped key.
ok('Duress-Guard ist strukturell wie ein Wrap (Salt 16, IV 12, wrappedDek == echte Wrap-Länge)',
  header.duress.salt.length === 16 &&
  header.duress.wrapIv.length === 12 &&
  header.duress.wrappedDek.length === header.wrappedDek.length);

// A corrupt/short guard reads as "no match", never a throw (mirrors unlockVault's corrupt-header
// handling — a mangled guard must not crash the unlock path).
const badHeader = {
  ...header,
  duress: { salt: new Uint8Array(4), wrapIv: new Uint8Array(12), wrappedDek: new Uint8Array(8) },
};
ok('beschädigter Guard wird nicht als Treffer gewertet (kein Throw)',
  (await S.matchesDuress(DURESS, badHeader)) === false);

// Two guards for the SAME passphrase use independent random salts → different bytes on disk
// (no fixed fingerprint that would reveal a duress password across vaults).
const g1 = await S.createDuressGuard(DURESS, header.argon2);
const g2 = await S.createDuressGuard(DURESS, header.argon2);
const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
ok('zwei Guards derselben Passphrase unterscheiden sich (frischer Salt/IV, kein Fingerprint)',
  hex(g1.salt) !== hex(g2.salt) && hex(g1.wrappedDek) !== hex(g2.wrappedDek));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
