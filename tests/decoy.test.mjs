// Duress passphrase → DECOY account. Entering the duress passphrase at the lock screen does NOT
// unlock the real vault: it crypto-erases the real account and opens a self-contained DECOY vault
// (its own DEK, sealed under the duress passphrase) that lives in a SEPARATE database. These test
// the pure-crypto invariants that make that safe: the two vaults are independent, neither
// passphrase opens the other, and the real DEK can never read decoy data (or vice-versa). The
// device-binding + DB-isolation + surgical-wipe wiring lives in vaultService/db and is exercised by
// the integration suite (decoy-integration) and the adversarial review.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[Duress → Decoy: zwei unabhängige Tresore, keiner öffnet den anderen]');

const REAL = 'echte-tresor-passphrase-123';
const DURESS = 'notfall-duress-passwort-xyz';

// The REAL vault, and a DECOY vault sealed under the DURESS passphrase — exactly what
// createDecoyVaultInDb builds (minus device binding, which is orthogonal and tested elsewhere).
const real = await S.createVault(REAL);
const decoy = await S.createVault(DURESS);

// ── The real path is completely normal ───────────────────────────────────────
const realDek2 = await S.unlockVault(REAL, real.header);
const aad = new TextEncoder().encode('scytale:decoy-test');
const sealedReal = await S.seal(real.dek, new TextEncoder().encode('echtes-geheimnis'), aad);
ok('echte Passphrase entsperrt den echten Tresor (derselbe DEK)',
  new TextDecoder().decode(await S.open(realDek2, sealedReal, aad)) === 'echtes-geheimnis');

// ── NEGATIVE CONTROL: the duress passphrase must NEVER open the real vault ─────
let duressOpenedReal = false;
try { await S.unlockVault(DURESS, real.header); duressOpenedReal = true; } catch { duressOpenedReal = false; }
ok('Duress-Passwort entsperrt NIEMALS den echten Tresor (ein Login damit darf nie das Echte zeigen)',
  duressOpenedReal === false);

// ── The decoy path: the duress passphrase opens the DECOY, and only the decoy ──
const decoyDek2 = await S.unlockVault(DURESS, decoy.header);
const sealedDecoy = await S.seal(decoy.dek, new TextEncoder().encode('schein-daten'), aad);
ok('Duress-Passwort entsperrt den Decoy-Tresor (eigener DEK)',
  new TextDecoder().decode(await S.open(decoyDek2, sealedDecoy, aad)) === 'schein-daten');

// NEGATIVE CONTROL: the real passphrase must NOT open the decoy either (fully separate secret).
let realOpenedDecoy = false;
try { await S.unlockVault(REAL, decoy.header); realOpenedDecoy = true; } catch { realOpenedDecoy = false; }
ok('echte Passphrase entsperrt NICHT den Decoy (Decoy ist ein eigenständiges Konto)',
  realOpenedDecoy === false);

// ── NEGATIVE CONTROL: the two DEKs are independent — neither can read the other's data ──
let crossOpened = false;
try { await S.open(decoyDek2, sealedReal, aad); crossOpened = true; } catch { crossOpened = false; }
ok('Decoy-DEK kann echte Daten NICHT entschlüsseln (unabhängige Schlüssel, kein Leak über die DB-Grenze)',
  crossOpened === false);

let crossOpened2 = false;
try { await S.open(realDek2, sealedDecoy, aad); crossOpened2 = true; } catch { crossOpened2 = false; }
ok('echter DEK kann Decoy-Daten NICHT entschlüsseln (Umkehrrichtung)', crossOpened2 === false);

// ── The decoyArmed marker is inert crypto-wise: setting it never changes the real unlock ──
const marked = { ...real.header, decoyArmed: true };
ok('decoyArmed-Marker ändert den echten Entsperr-Pfad nicht',
  new TextDecoder().decode(await S.open(await S.unlockVault(REAL, marked), sealedReal, aad)) === 'echtes-geheimnis');

// ── The "duress ≠ real" guard that setDuressPassword enforces, at the crypto level ──
// verifyKek(kek, realHeader) succeeds ONLY for the real passphrase's KEK. A candidate duress
// passphrase is ACCEPTED as a duress word iff it does NOT verify against the real header.
const realKek = await S.deriveHeaderKek(REAL, real.header);
let realVerifies = false;
try { await S.verifyKek(realKek, real.header); realVerifies = true; } catch { realVerifies = false; }
ok('verifyKek akzeptiert den echten KEK (Referenz für die „duress ≠ echt"-Prüfung)', realVerifies === true);

const duressKekVsRealHeader = await S.deriveHeaderKek(DURESS, real.header);
let duressVerifiesAsReal = false;
try { await S.verifyKek(duressKekVsRealHeader, real.header); duressVerifiesAsReal = true; } catch { duressVerifiesAsReal = false; }
ok('ein vom echten abweichendes Duress-Wort verifiziert NICHT als echt → wird als Duress zugelassen',
  duressVerifiesAsReal === false);

// NEGATIVE CONTROL for the same guard: if someone tried duress==real, it WOULD verify as real →
// setDuressPassword must reject it (DuressEqualsRealError). Confirm the check would fire.
const sameAsRealKek = await S.deriveHeaderKek(REAL, real.header);
let sameVerifies = false;
try { await S.verifyKek(sameAsRealKek, real.header); sameVerifies = true; } catch { sameVerifies = false; }
ok('duress==echt WÜRDE als echt verifizieren → der Gleichheits-Reject greift korrekt', sameVerifies === true);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
