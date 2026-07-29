// Der Emoji-Vergleich beim Koppeln authentifiziert den MASTER.
// (War bis v0.17.3 eine xfail-Zielvorgabe; seit linkingSas existiert, grün.)
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
// API (Design-Lock, jetzt implementiert):
//   linkingSas({ role, myEph, request, offer }): SasResult
//     — der kanonische Request→Offer-Transcript bindet Master UND alle Keys,
//       die P anschließend zertifiziert.
//
// Der Name allein trägt das aber NICHT: sind alle vier Parameter `Bytes`,
// kompiliert eine UI-Stelle, die einen Geräteschlüssel als `theirMasterPub`
// übergibt, weiterhin fehlerfrei — und die Emoji stimmen überein. Deshalb sind
// die Master-Parameter als `MasterPub` typisiert (Branded Type in
// crypto/types.ts): „Geräteschlüssel an Master-Parameter" ist dann ein
// Compile-Fehler statt ein bestandener Emoji-Vergleich. Dieser Test prüft
// danach die ABLEITUNG; die Verkabelung prüft der Compiler.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const chars = (r) => r.emoji.map((e) => e.char).join(' ');
const display = (r) => JSON.stringify({ emoji: r.emoji.map((e) => e.char), decimal: r.decimal });

console.log('\n[Zielvorgabe: SAS bindet den Master, nicht nur die Geräte-Keys]');

ok('linkingSas existiert', typeof S.linkingSas === 'function');
if (typeof S.linkingSas !== 'function') { console.log('\n0 ok, 1 fail'); process.exit(1); }

if (typeof S.linkingSas === 'function') {
  const pEph = sodium.crypto_box_keypair();
  const nEph = sodium.crypto_box_keypair();
  const pMaster = sodium.crypto_sign_keypair();
  const nMaster = sodium.crypto_sign_keypair();
  const evilMaster = sodium.crypto_sign_keypair();
  const nSign = sodium.crypto_sign_keypair();
  const nDh = sodium.crypto_box_keypair();
  const nSpk = sodium.crypto_box_keypair();

  const kp = (k) => ({ publicKey: new Uint8Array(k.publicKey), privateKey: new Uint8Array(k.privateKey) });

  const request = {
    deviceSignPub: nSign.publicKey,
    deviceDhPub: nDh.publicKey,
    sasEphPub: nEph.publicKey,
    protocolVersion: S.PROTOCOL_VERSION,
    signedPreKey: {
      id: 7,
      pub: nSpk.publicKey,
      signature: await S.sign(nSpk.publicKey, nSign.privateKey),
    },
  };
  const offer = { sasEphPub: pEph.publicKey, masterPub: pMaster.publicKey, epoch: 1 };
  const onN = await S.linkingSas({ role: 'new', myEph: kp(nEph), request, offer });
  const onP = await S.linkingSas({ role: 'primary', myEph: kp(pEph), request, offer });
  ok('beide Seiten sehen dieselben Emoji', chars(onN) === chars(onP));

  const changesOrRejects = async (changedRequest, changedOffer) => {
    try {
      const changed = await S.linkingSas({
        role: 'new',
        myEph: kp(nEph),
        request: changedRequest,
        offer: changedOffer,
      });
      return display(changed) !== display(onN);
    } catch {
      return true;
    }
  };
  const evilDh = sodium.crypto_box_keypair();
  const evilSign = sodium.crypto_sign_keypair();
  const evilEph = sodium.crypto_box_keypair();
  const evilSpk = sodium.crypto_box_keypair();
  const flippedSig = new Uint8Array(request.signedPreKey.signature);
  flippedSig[0] ^= 1;
  const cases = [
    ['Master-Key', request, { ...offer, masterPub: evilMaster.publicKey }],
    ['Epoch', request, { ...offer, epoch: offer.epoch + 1 }],
    ['Offer-Ephemeral', request, { ...offer, sasEphPub: evilEph.publicKey }],
    ['Device-Sign-Key', { ...request, deviceSignPub: evilSign.publicKey }, offer],
    ['Device-DH-Key', { ...request, deviceDhPub: evilDh.publicKey }, offer],
    ['Request-Ephemeral', { ...request, sasEphPub: evilEph.publicKey }, offer],
    ['Signed-Prekey-ID', { ...request, signedPreKey: { ...request.signedPreKey, id: 8 } }, offer],
    ['Signed-Prekey-Key', { ...request, signedPreKey: { ...request.signedPreKey, pub: evilSpk.publicKey } }, offer],
    ['Signed-Prekey-Signatur', { ...request, signedPreKey: { ...request.signedPreKey, signature: flippedSig } }, offer],
  ];
  for (const [name, changedRequest, changedOffer] of cases) {
    ok(`${name} ist im SAS-Transcript gebunden`, await changesOrRejects(changedRequest, changedOffer));
  }
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
