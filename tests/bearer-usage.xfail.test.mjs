// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — Ende des Bearer-Charakters von deviceCert          ║
// ║  Dieser Test ist HEUTE ROT. Das ist beabsichtigt.                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// EIGENSCHAFT:
//   Ein gültiger deviceCert allein genügt NICHT zum Session-Aufbau. Nötig ist
//   Cert  UND  Präsenz in einer Geräteliste, die mindestens so aktuell ist wie
//   die gepinnte (epoch, version).
//
// WARUM ALS ROTER TEST STATT NUR ALS SPEC-ZEILE:
//   Ein Cert ist ein Inhaber-Ticket. v0.16.1 hat die *Ausstellung* geschlossen
//   (LinkOffer: nichts Bearer-Wertiges verlässt das primäre Gerät vor der
//   SAS-Bestätigung). Die *Verwendung* ist offen: receiveEnvelope/makeContact
//   prüfen den Cert gegen den Master, nie gegen die Listenmitgliedschaft.
//   Solange das so ist, existiert Revocation praktisch nicht — ein einmal
//   erlangtes Cert ist ein unbegrenzt gültiges Eintrittsticket.
//   Als roter Test bleibt die offene Eigenschaft in der Suite sichtbar statt
//   nur im Spec. Er wird von selbst grün, wenn Stufe 3c die Prüfung einführt.
//
// ZIEL-API, die dieser Test festschreibt (Design-Lock, nicht Vorschlag):
//   Contact.peerDeviceList?: DeviceList
//     — die zuletzt akzeptierte, master-signierte Liste des Peers.
//   receiveEnvelope() lehnt ein Prekey ab, dessen Absendergerät nicht in
//   dieser Liste steht, auch wenn sein Cert unter dem gepinnten Master gilt.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };
const sodium = await S.getSodium();

const master = sodium.crypto_sign_keypair();
const mkDevice = async () => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { sign, dh, cert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey) };
};

const alice = await mkDevice();
const me = { sign: alice.sign, dh: alice.dh, master, epoch: 1, deviceCert: alice.cert };

// Bob has ONE legitimate device, and a second one whose cert was issued under
// the same master but which was later REVOKED (i.e. removed from the list).
const bobGood = await mkDevice();
const bobRevoked = await mkDevice();

// The peer's authoritative list contains ONLY the good device.
const list = await S.signDeviceList(master.privateKey, master.publicKey, 1, 2, [
  { signPub: bobGood.sign.publicKey, dhPub: bobGood.dh.publicKey, deviceCert: bobGood.cert },
]);

const header = (d) => ({
  masterPub: master.publicKey,
  epoch: 1,
  identitySignPub: d.sign.publicKey,
  identityDhPub: d.dh.publicKey,
  deviceCert: d.cert,
  ephemeralPub: sodium.crypto_box_keypair().publicKey,
  signedPreKeyId: 1,
  oneTimePreKeyId: undefined,
});

console.log('\n[Zielvorgabe: Cert allein genügt nicht — Cert UND Listenpräsenz]');

// Sanity: both certs really are valid under the master. If this ever fails, the
// test is broken rather than the feature missing — keep it as a guard.
ok('Vorbedingung: Cert des widerrufenen Geraets ist kryptografisch gueltig',
  await S.verifyDeviceCert(master.publicKey, 1, bobRevoked.sign.publicKey, bobRevoked.dh.publicKey, bobRevoked.cert));
ok('Vorbedingung: widerrufenes Geraet steht NICHT in der Liste',
  !S.deviceInList(list, bobRevoked.sign.publicKey));

// The contact, pinned to Bob's master, carrying the list it last accepted.
const contact = {
  roomId: await S.computeRoomId(alice.dh.publicKey, bobRevoked.dh.publicKey),
  peerMasterPub: master.publicKey,
  peerEpoch: 1,
  peerSignPub: bobGood.sign.publicKey,
  peerDhPub: bobGood.dh.publicKey,
  peerFingerprint: 'fp',
  peerDeviceList: list, // ← ZIEL-FELD, heute von receiveEnvelope ignoriert
  ratchet: null,
  pendingHeader: null,
};

const lookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };
let err = null;
try {
  await S.receiveEnvelope(me, contact, { type: 'prekey', conv: contact.roomId, x3dh: header(bobRevoked), message: new Uint8Array(32) }, lookup);
} catch (e) { err = e; }

// THE property. Today this fails for the wrong reason (missing prekey), so the
// assertion demands the rejection name the REVOCATION — otherwise a green here
// would credit an unrelated guard, exactly the failure mode that the
// binding-property suite already caught once.
ok('widerrufenes Geraet wird abgelehnt, und zwar WEGEN fehlender Listenpraesenz',
  /nicht in der Ger(ä|ae)teliste|widerrufen|revoked/i.test(err?.message ?? ''));

// And the complement: the device that IS in the list must not be blocked by
// this check. (It may still fail later for unrelated reasons — so assert only
// that it is not rejected as revoked.)
const contact2 = { ...contact, ratchet: null,
  roomId: await S.computeRoomId(alice.dh.publicKey, bobGood.dh.publicKey) };
let err2 = null;
try {
  await S.receiveEnvelope(me, contact2, { type: 'prekey', conv: contact2.roomId, x3dh: header(bobGood), message: new Uint8Array(32) }, lookup);
} catch (e) { err2 = e; }
ok('gelistetes Geraet wird NICHT als widerrufen abgelehnt',
  !/nicht in der Ger(ä|ae)teliste|widerrufen|revoked/i.test(err2?.message ?? ''));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
