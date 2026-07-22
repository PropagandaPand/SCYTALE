// Der Device-Revocation-GUARD (Stufe 3c): gegeben eine peerDeviceList lehnt
// receiveEnvelope ein Gerät ab, das nicht darin steht, und lässt ein gelistetes
// durch. (War Teil der bearer-usage-Zielvorgabe; die "existiert ein Guard"-Hälfte
// ist erfüllt. Die "die Liste stammt aus einer master-signierten devlist, nicht
// implizit"-Hälfte lebt jetzt in bearer-list-source.xfail bis Schritt 8.)
//
// EIGENSCHAFT:
//   Ein gültiger deviceCert allein genügt NICHT zum Session-Aufbau. Nötig ist
//   Cert  UND  Präsenz in einer Geräteliste, die mindestens so aktuell ist wie
//   die gepinnte (epoch, version).
//
// NEU GESCHRIEBEN (Design-Pass 2026-07-21): die vorige Fassung modellierte Bobs
// zwei Geräte als ZWEI geräte-DH-Räume. Unter master-basiertem roomId (Spec 2)
// gehören beide Geräte zu Bobs EINEM Master und damit in EINEN Raum. Der Test
// bildet das jetzt korrekt ab: ein master-basierter Raum, zwei Geräte, eins
// widerrufen (nicht in der Liste). Sonst prüfte er ein Regime, das es nach dem
// Umbau nicht mehr gibt.
//
// ZIEL-API (Design-Lock, tests/bearer-usage sperrt sie):
//   Contact.peerDeviceList?: DeviceList  — die zuletzt akzeptierte Liste des Peers.
//   receiveEnvelope() lehnt ein Prekey ab, dessen Absendergerät NICHT in dieser
//   Liste steht, auch wenn sein Cert unter dem gepinnten Master gilt. Der Fehler
//   muss die Revocation BENENNEN (sonst schreibt ein grüner Test das Grün einem
//   unbeteiligten Wächter gut — die v0.16.4-Lektion).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

// Two distinct identities, each with its OWN master (master-based roomId needs both).
const meMaster = sodium.crypto_sign_keypair();
const bobMaster = sodium.crypto_sign_keypair();
const mkDevice = async (m) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { sign, dh, cert: await S.signDeviceCert(m.privateKey, 1, sign.publicKey, dh.publicKey) };
};

const myDev = await mkDevice(meMaster);
const me = { sign: myDev.sign, dh: myDev.dh, master: meMaster, epoch: 1, deviceCert: myDev.cert };

// Bob has ONE listed device and a second whose cert is valid under the same
// master but which was REVOKED (removed from the list).
const bobGood = await mkDevice(bobMaster);
const bobRevoked = await mkDevice(bobMaster);
const list = await S.signDeviceList(bobMaster.privateKey, bobMaster.publicKey, 1, 2, [
  { signPub: bobGood.sign.publicKey, dhPub: bobGood.dh.publicKey, deviceCert: bobGood.cert },
]);

const header = (d) => ({
  masterPub: bobMaster.publicKey,
  epoch: 1,
  identitySignPub: d.sign.publicKey,
  identityDhPub: d.dh.publicKey,
  deviceCert: d.cert,
  ephemeralPub: sodium.crypto_box_keypair().publicKey,
  signedPreKeyId: 1,
  oneTimePreKeyId: undefined,
});
const lookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };

console.log('\n[Zielvorgabe: Cert allein genügt nicht — Cert UND Listenpräsenz, ein Master-Raum]');

ok('computeMasterRoomId existiert', typeof S.computeMasterRoomId === 'function');

// Sanity: both certs are valid under Bob's master; only the good one is listed.
ok('Vorbedingung: Cert des widerrufenen Geräts ist kryptografisch gültig',
  await S.verifyDeviceCert(bobMaster.publicKey, 1, bobRevoked.sign.publicKey, bobRevoked.dh.publicKey, bobRevoked.cert));
ok('Vorbedingung: widerrufenes Gerät steht NICHT in der Liste',
  !S.deviceInList(list, bobRevoked.sign.publicKey));

if (typeof S.computeMasterRoomId === 'function') {
  // ONE master-based room for Bob; both devices resolve to it.
  const roomId = await S.computeMasterRoomId(meMaster.publicKey, bobMaster.publicKey);
  const contact = {
    roomId,
    ownMasterPub: meMaster.publicKey,
    peerMasterPub: bobMaster.publicKey,
    peerEpoch: 1,
    peerSignPub: bobGood.sign.publicKey,
    peerDhPub: bobGood.dh.publicKey,
    peerFingerprint: 'fp',
    peerDeviceList: list, // ← ZIEL-FELD, heute von receiveEnvelope ignoriert
    sessions: new Map(),
  };

  // A prekey from the REVOKED device: cert valid, master matches, room matches —
  // only the list check can stop it. The rejection must name the revocation.
  let err = null;
  try {
    await S.receiveEnvelope(me, { ...contact }, { type: 'prekey', conv: roomId, x3dh: header(bobRevoked), message: new Uint8Array(32) }, lookup);
  } catch (e) { err = e; }
  ok('widerrufenes Gerät wird abgelehnt, und zwar WEGEN fehlender Listenpräsenz',
    /nicht in der Ger(ä|ae)teliste|widerrufen|revoked/i.test(err?.message ?? ''));

  // The LISTED device must not be rejected as revoked (may still fail later for
  // unrelated reasons — assert only that it is not the revocation rejection).
  let err2 = null;
  try {
    await S.receiveEnvelope(me, { ...contact }, { type: 'prekey', conv: roomId, x3dh: header(bobGood), message: new Uint8Array(32) }, lookup);
  } catch (e) { err2 = e; }
  ok('gelistetes Gerät wird NICHT als widerrufen abgelehnt',
    !/nicht in der Ger(ä|ae)teliste|widerrufen|revoked/i.test(err2?.message ?? ''));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
