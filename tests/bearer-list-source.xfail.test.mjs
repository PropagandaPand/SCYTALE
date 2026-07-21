// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — die Liste stammt aus einer MASTER-SIGNIERTEN Quelle ║
// ║  HEUTE ROT: applyDeviceListUpdate existiert noch nicht (Schritt 8).        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Der Guard (bearer-guard.test) prüft ein Gerät GEGEN eine peerDeviceList. Diese
// Suite pinnt die zweite Hälfte der Eigenschaft: die Liste darf NICHT implizit
// aus dem gerade geprüften Gerät gebaut werden — das wäre selbstreferenziell
// (die v0.16.1-verifyLinkGrant-Klasse), grün ohne Substanz. Ein ZWEITES Gerät
// desselben Masters wird erst durch eine ECHTE, master-signierte devlist
// legitimiert, die über applyDeviceListUpdate gelernt wird (Stufe 3d, Schritt 8).
//
// ZIEL-API (Design-Lock):
//   applyDeviceListUpdate(contact, list: DeviceList, retired: Set<string>): boolean
//     — verifiziert list gegen den gepinnten Master + (epoch,version) ≥ gespeichert,
//       lehnt Rollback + gesperrte Master ab, setzt contact.peerDeviceList bei Erfolg.
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
const first = await mkDevice();
const second = await mkDevice();

console.log('\n[Zielvorgabe: nur eine master-signierte devlist legitimiert ein zweites Gerät]');

ok('applyDeviceListUpdate existiert', typeof S.applyDeviceListUpdate === 'function');

// The pinned-single-device contact: implicit list (peerDeviceList unset).
const contact = {
  roomId: 'r',
  ownMasterPub: sodium.crypto_sign_keypair().publicKey,
  peerMasterPub: master.publicKey,
  peerEpoch: 1,
  peerSignPub: first.sign.publicKey,
  peerDhPub: first.dh.publicKey,
  peerFingerprint: 'fp',
  regime: 'master',
  ratchet: null,
  pendingHeader: null,
};

// The implicit rule already holds (deviceAuthorized is built): only the pinned
// device passes; a second device is NOT authorised until a real list arrives.
ok('implizit: gepinntes Gerät erlaubt', S.deviceAuthorized(contact, first.sign.publicKey));
ok('implizit: zweites Gerät NICHT erlaubt', !S.deviceAuthorized(contact, second.sign.publicKey));

if (typeof S.applyDeviceListUpdate === 'function') {
  // A genuine master-signed list containing BOTH devices, version 2.
  const list = await S.signDeviceList(master.privateKey, master.publicKey, 1, 2, [
    { signPub: first.sign.publicKey, dhPub: first.dh.publicKey, deviceCert: first.cert },
    { signPub: second.sign.publicKey, dhPub: second.dh.publicKey, deviceCert: second.cert },
  ]);
  const applied = S.applyDeviceListUpdate(contact, list, new Set());
  ok('master-signierte Liste wird übernommen', applied === true);
  ok('danach ist das zweite Gerät legitimiert', S.deviceAuthorized(contact, second.sign.publicKey));

  // A self-made (unsigned / wrong-master) list must be rejected.
  const evil = sodium.crypto_sign_keypair();
  const forged = await S.signDeviceList(evil.privateKey, evil.publicKey, 1, 3, [
    { signPub: second.sign.publicKey, dhPub: second.dh.publicKey, deviceCert: second.cert },
  ]);
  ok('fremd-signierte Liste wird abgelehnt', S.applyDeviceListUpdate(contact, forged, new Set()) === false);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
