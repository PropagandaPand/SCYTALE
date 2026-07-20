// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — der Emoji-Vergleich muss den MASTER authentifizieren║
// ║  Dieser Test ist HEUTE ROT, weil der Linking-Flow noch nicht existiert.   ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// EIGENSCHAFT:
//   Im Kopplungs-Flow wird die SAS über den masterPub der Gegenseite gebildet.
//   Ein untergeschobener Master muss deshalb ANDERE Emoji erzeugen.
//
// WARUM DAS DER ANGELPUNKT IST:
//   verifyLinkGrant ist notwendigerweise selbstbezüglich — das neue Gerät hat
//   noch keinen gepinnten Master, es *lernt* einen. Jede Prüfung dort ist
//   relativ zu dem Master, den der Grant behauptet; ein vollständig gefälschter
//   Grant besteht sie alle. Das Einzige, was den Master tatsächlich
//   authentifiziert, ist der Emoji-Vergleich durch den Menschen.
//
//   Wird beim Bauen der 3b-UI versehentlich ein GERÄTE-Schlüssel statt des
//   Masters an computeSas übergeben, sieht der Flow identisch aus, die Emoji
//   stimmen überein — und die Selbstbezüglichkeit von verifyLinkGrant wird zu
//   einem echten Loch. Der Fehler wäre unsichtbar, weil nichts fehlschlägt.
//
// ZIEL-API, die dieser Test festschreibt (Design-Lock):
//   linkingSas({ myEph, theirEphPub, myMasterPub, theirMasterPub }): SasResult
//     — eine benannte Funktion für genau diesen Zweck, damit die Bindung nicht
//       davon abhängt, dass eine UI-Stelle die richtigen Argumente sortiert.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };
const sodium = await S.getSodium();
const chars = (r) => r.emoji.map((e) => e.char).join(' ');

console.log('\n[Zielvorgabe: SAS bindet den Master, nicht nur die Geräte-Keys]');

ok('linkingSas existiert', typeof S.linkingSas === 'function');

if (typeof S.linkingSas === 'function') {
  const pEph = sodium.crypto_box_keypair();
  const nEph = sodium.crypto_box_keypair();
  const pMaster = sodium.crypto_sign_keypair();
  const nMaster = sodium.crypto_sign_keypair();
  const evilMaster = sodium.crypto_sign_keypair();

  const kp = (k) => ({ publicKey: new Uint8Array(k.publicKey), privateKey: new Uint8Array(k.privateKey) });

  const onN = await S.linkingSas({
    myEph: kp(nEph), theirEphPub: new Uint8Array(pEph.publicKey),
    myMasterPub: nMaster.publicKey, theirMasterPub: pMaster.publicKey,
  });
  const onP = await S.linkingSas({
    myEph: kp(pEph), theirEphPub: new Uint8Array(nEph.publicKey),
    myMasterPub: pMaster.publicKey, theirMasterPub: nMaster.publicKey,
  });
  ok('beide Seiten sehen dieselben Emoji', chars(onN) === chars(onP));

  // THE property: swap only the master, keep every ephemeral identical.
  const swapped = await S.linkingSas({
    myEph: kp(nEph), theirEphPub: new Uint8Array(pEph.publicKey),
    myMasterPub: nMaster.publicKey, theirMasterPub: evilMaster.publicKey,
  });
  ok('untergeschobener Master -> ANDERE Emoji', chars(swapped) !== chars(onN));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
