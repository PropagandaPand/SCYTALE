// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — roomId-Migration von Geräte-DH auf Master          ║
// ║  Dieser Test ist HEUTE ROT. Das ist beabsichtigt.                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// EIGENSCHAFT:
//   Nach dem Umbau der roomId-Ableitung findet eine BESTEHENDE Konversation
//   ihren Verlauf wieder. Formuliert als Round-Trip:
//     Konversation unter der alten Ableitung anlegen
//       → Migration anwenden
//         → dieselbe Konversation wird adressiert, der Verlauf hängt daran.
//
// WARUM DAS EIN EIGENER TEST IST:
//   Heute ist roomId geräte-DH-basiert. Stufe 3c stellt sie auf den Master um
//   (Konversation = Eigenschaft der Personen, nicht der Gerätepaare). Damit
//   ändert sich die ID für JEDEN bestehenden Kontakt — Verlauf, Nachrichten und
//   Relay-Room hängen aber daran. Ohne Umschlüsselung hängt der Verlauf still
//   am alten Schlüssel: kein Fehler, keine Meldung, nur weg.
//
// ZIEL-API, die dieser Test festschreibt (Design-Lock):
//   migrateContactRoomId(contact): Promise<{ oldRoomId, newRoomId }>
//     — berechnet die neue ID, gibt beide zurück, damit der Aufrufer
//       Nachrichten und Ungelesen-Zähler mitziehen kann. Idempotent: zweimal
//       angewandt ändert nichts mehr.
//
// SONDERFALL, DER IM MIGRATIONSPFAD VORKOMMEN MUSS (nicht wegoptimieren):
//   Ein Kontakt mit staleIdentity — er kennt noch unseren VORIGEN Master. Seine
//   neue roomId muss aus dem Master abgeleitet werden, den er tatsächlich
//   gepinnt hat, sonst adressieren beide Seiten nach der Migration verschiedene
//   Räume und die Konversation ist stumm statt sichtbar kaputt.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };
const sodium = await S.getSodium();

const mkId = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { master, sign, dh, epoch: 1, cert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey) };
};

const alice = await mkId();
const bob = await mkId();

const contact = {
  roomId: await S.computeRoomId(alice.dh.publicKey, bob.dh.publicKey), // alte Ableitung
  peerMasterPub: bob.master.publicKey,
  peerEpoch: 1,
  peerSignPub: bob.sign.publicKey,
  peerDhPub: bob.dh.publicKey,
  peerFingerprint: 'fp',
  ratchet: null,
  pendingHeader: null,
};

console.log('\n[Zielvorgabe: bestehende Konversation überlebt den roomId-Umbau]');

ok('migrateContactRoomId existiert', typeof S.migrateContactRoomId === 'function');

if (typeof S.migrateContactRoomId === 'function') {
  const oldId = contact.roomId;
  const r = await S.migrateContactRoomId(contact);

  ok('gibt alte und neue ID zurueck', r?.oldRoomId === oldId && typeof r?.newRoomId === 'string');
  ok('Kontakt traegt danach die neue ID', contact.roomId === r.newRoomId);
  ok('die ID hat sich tatsaechlich geaendert', r.newRoomId !== oldId);

  // Beide Seiten müssen unabhängig dieselbe neue ID ableiten — sonst reden sie
  // nach der Migration in verschiedene Räume.
  const bobSide = { ...contact, peerMasterPub: alice.master.publicKey, roomId: oldId };
  const rb = await S.migrateContactRoomId(bobSide);
  ok('beide Seiten leiten dieselbe neue ID ab', rb.newRoomId === r.newRoomId);

  // Idempotenz: ein zweiter Lauf (z.B. nach Absturz mitten in der Migration)
  // darf nicht erneut verschieben.
  const again = await S.migrateContactRoomId(contact);
  ok('idempotent — zweiter Lauf verschiebt nicht erneut', again.newRoomId === r.newRoomId);

  // Der Sonderfall aus dem Spec.
  const stale = { ...contact, roomId: oldId, staleIdentity: true };
  const rs = await S.migrateContactRoomId(stale);
  ok('staleIdentity-Kontakt bekommt eine definierte neue ID', typeof rs?.newRoomId === 'string');
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
