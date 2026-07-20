/**
 * ratchet-commit.test.ts — Zustands-Commit erst nach AEAD-Prüfung.
 *
 * EIGENSCHAFT (nicht Implementierung): eine Nachricht, die sich nicht
 * authentifizieren lässt, darf den Ratchet-Zustand NICHT verändern.
 *
 * Warum das zählt: Einliefern in eine Inbox ist bewusst auth-los. Wer die
 * Inbox-ID kennt (aus dem öffentlichen Code ableitbar), braucht kein
 * Schlüsselmaterial — ein zufälliger 32-Byte-X25519-Pubkey im Header plus
 * Müll-Ciphertext genügt, um den DH-Ratchet weiterzudrehen. Ohne Commit-
 * Disziplin ist das eine permanente, ferngesteuerte Session-Zerstörung.
 *
 * NEGATIVKONTROLLE: mit SCYTALE_NO_COMMIT_GUARD=1 läuft die ungeschützte
 * Variante — dann MÜSSEN die Fälschungs-Fälle rot sein. Wird der Test dort
 * grün, prüft er nichts.
 *
 *   node tests/run.mjs ratchet-commit
 *   SCYTALE_NO_COMMIT_GUARD=1 node tests/ratchet-commit.test.mjs
 */
import {
  initRatchetInitiator,
  initRatchetResponder,
  ratchetEncrypt,
  ratchetDecrypt,
  __decryptIntoUnsafeForTests,
  getSodium,
} from './.bundle/entry.js';

const GUARD_OFF = process.env.SCYTALE_NO_COMMIT_GUARD === '1';

const te = new TextEncoder();
const td = new TextDecoder();
const B = (x) => new Uint8Array(x);
const cp = (x) => new Uint8Array(x);

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`);
  }
}

/**
 * Der Guard sitzt jetzt IM Produktionscode (ratchetDecrypt). Die
 * Negativkontrolle ruft deshalb den ungeschützten Kern auf — sie darf den Fix
 * nicht im Test nachbauen, sonst prüfte sie den Test statt die Bibliothek.
 */
async function decrypt(state, msg) {
  return GUARD_OFF ? __decryptIntoUnsafeForTests(state, msg) : ratchetDecrypt(state, msg);
}

const enc = (s, t) => ratchetEncrypt(s, B(te.encode(t)));
const dec = async (s, m) => td.decode(await decrypt(s, m));
const hex = (x) => Array.from(x, (b) => b.toString(16).padStart(2, '0')).join('');

/** Wie `dec`, gibt aber '' zurück statt zu werfen — für Checks NACH einem
 *  Angriff, die in der Negativkontrolle fehlschlagen SOLLEN, ohne den Lauf
 *  abzubrechen. */
async function decOrEmpty(s, m) {
  try {
    return await dec(s, m);
  } catch {
    return '';
  }
}

/** Nicht authentifizierbare Nachricht — kein Schlüsselmaterial nötig. */
function forge(dh, pn = 0, n = 0) {
  return { header: { dh, pn, n }, ciphertext: B(crypto.getRandomValues(new Uint8Array(48))) };
}

async function freshPair() {
  const s = await getSodium();
  const SK = B(crypto.getRandomValues(new Uint8Array(32)));
  const AD = B(te.encode('SCYTALE-test-AD'));
  const spk = s.crypto_box_keypair();
  const alice = await initRatchetInitiator(SK, B(spk.publicKey), AD);
  const bob = await initRatchetResponder(
    SK,
    { publicKey: B(spk.publicKey), privateKey: B(spk.privateKey) },
    AD,
  );
  // Ein Round-Trip, damit beide Seiten in einem realistischen Zustand sind.
  await dec(bob, await enc(alice, 'hallo'));
  await dec(alice, await enc(bob, 'hallo zurueck'));
  return { s, alice, bob };
}

async function main() {
  console.log(GUARD_OFF ? '\n[NEGATIVKONTROLLE: Commit-Guard AUS]\n' : '\n[Commit-Guard AN]\n');

  // --- Vorbedingungen: das Szenario ist korrekt aufgebaut ----------------
  {
    const { alice, bob } = await freshPair();
    check('Vorbedingung: Round-Trip funktioniert', (await dec(bob, await enc(alice, 'x'))) === 'x');
    check('Vorbedingung: DHr ist gesetzt', bob.DHr !== null);
  }

  // --- 1. Zufälliger Ratchet-Key: Zustand muss unverändert bleiben ------
  {
    const { s, alice, bob } = await freshPair();
    const evil = s.crypto_box_keypair();
    const before = { RK: hex(bob.RK), DHr: hex(bob.DHr), Ns: bob.Ns, PN: bob.PN };

    let threw = false;
    try {
      await decrypt(bob, forge(B(evil.publicKey)));
    } catch {
      threw = true;
    }
    check('Fälschung wird abgelehnt', threw);
    check('RK unverändert', hex(bob.RK) === before.RK, `${before.RK.slice(0, 12)} -> ${hex(bob.RK).slice(0, 12)}`);
    check('DHr unverändert', hex(bob.DHr) === before.DHr);
    check('Ns/PN unverändert', bob.Ns === before.Ns && bob.PN === before.PN);
    check(
      'echte Folgenachricht kommt weiterhin an',
      (await decOrEmpty(bob, await enc(alice, 'noch da'))) === 'noch da',
    );
  }

  // --- 2. Missgebildeter DH-Key (2 statt 32 Byte) ------------------------
  {
    const { alice, bob } = await freshPair();
    const before = { RK: hex(bob.RK), DHr: hex(bob.DHr), Ns: bob.Ns, Nr: bob.Nr, PN: bob.PN };
    try {
      await decrypt(bob, forge(B(new Uint8Array([1, 2]))));
    } catch {
      /* erwartet */
    }
    // Hier wirft crypto_scalarmult, BEVOR RK fortgeschritten ist — der RK-Check
    // allein wäre also auch ohne Guard grün und würde nichts prüfen. DHr/Ns/Nr/PN
    // werden dagegen vor dem Wurf gesetzt: das ist der scharfe Detektor.
    check('kurzer DH-Key: RK unverändert', hex(bob.RK) === before.RK);
    check('kurzer DH-Key: DHr unverändert', hex(bob.DHr) === before.DHr);
    check(
      'kurzer DH-Key: Zähler unverändert',
      bob.Ns === before.Ns && bob.Nr === before.Nr && bob.PN === before.PN,
      `Ns/Nr/PN ${before.Ns}/${before.Nr}/${before.PN} -> ${bob.Ns}/${bob.Nr}/${bob.PN}`,
    );
    check('kurzer DH-Key: Session lebt', (await decOrEmpty(bob, await enc(alice, 'ok'))) === 'ok');
  }

  // --- 3. Übersprungener Key überlebt eine Fälschung ---------------------
  {
    const { alice, bob } = await freshPair();
    const m1 = await enc(alice, 'erste');
    const m2 = await enc(alice, 'zweite');
    await dec(bob, m2); // legt Message-Key für m1 in `skipped` ab

    try {
      // Gleicher Header wie m1, aber manipulierter Ciphertext.
      await decrypt(bob, { header: m1.header, ciphertext: B(crypto.getRandomValues(new Uint8Array(48))) });
    } catch {
      /* erwartet */
    }
    const got = await decOrEmpty(bob, m1);
    check('skipped-Key nicht durch Fälschung verbraucht', got === 'erste', `bekam "${got}"`);
  }

  console.log(`\n${pass} ok, ${fail} fail`);
  if (GUARD_OFF) {
    console.log(
      fail > 0
        ? '→ erwartet: ohne Guard rot. Der Test prüft wirklich etwas.'
        : '→ WARNUNG: ohne Guard grün — dieser Test prüft NICHTS.',
    );
    process.exit(fail > 0 ? 0 : 1);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Testlauf abgebrochen:', e);
  process.exit(1);
});
