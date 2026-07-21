// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — roomId-Migration von Geräte-DH auf Master          ║
// ║  Dieser Test ist HEUTE ROT. Das ist beabsichtigt.                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// EIGENSCHAFT:
//   Nach dem Umbau der roomId-Ableitung findet eine BESTEHENDE Konversation
//   ihren Verlauf wieder, und die neue ID ist die MASTER-basierte Ableitung
//   BEIDER Master — nicht ein master-unabhängiger Rehash der alten ID.
//
// WARUM DIESER TEST NEU GESCHRIEBEN WURDE (Design-Pass 2026-07-21):
//   Die vorige Fassung war nur durch eine SPEC-VERLETZENDE Ableitung erfüllbar:
//   migrateContactRoomId war einarmig, der Kontakt trug keinen eigenen Master,
//   und der „beide Seiten"-Check flippte nur peerMasterPub. Eine korrekte
//   sort(myMaster, peerMaster)-Ableitung ergab für den einen Aufruf
//   sort(alice,bob), für den anderen sort(alice,alice) → ungleich → rot. Nur
//   eine master-UNABHÄNGIGE Ableitung bestand beide Asserts — das exakte
//   Gegenteil von Spec 1/2 (Master MUSS im Schlüssel stecken, sonst trennt eine
//   Peer-Rotation die Session nicht). Ein Test, der nur durch die falsche
//   Implementierung grün wird, ist schlimmer als kein Test — er zieht aktiv in
//   die falsche Richtung. Siehe [[test-negative-control]].
//
// DIE REPARATUR: der Kontakt trägt jetzt `ownMasterPub` — den Master, unter dem
// DIESER Kontakt uns kennt (aktuell = eigener; bei staleIdentity = der alte,
// beim Linking gesnapshottete Master). Beide Seiten setzen ihn verschieden, und
// die entscheidende Assertion fordert newRoomId === computeMasterRoomId(beide),
// was eine Rehash-Ableitung strukturell nicht erfüllt.
//
// ZIEL-API (Design-Lock):
//   Contact.ownMasterPub: MasterPub
//   computeMasterRoomId(a: MasterPub, b: MasterPub): Promise<string>  (sortiert, domain-getrennt)
//   migrateContactRoomId(contact): Promise<{oldRoomId, newRoomId}>
//     newRoomId = computeMasterRoomId(contact.ownMasterPub, contact.peerMasterPub); idempotent.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };
const sodium = await S.getSodium();
const hex = (x) => sodium.to_hex(x);

const mkId = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { master, sign, dh, epoch: 1, cert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey) };
};

const alice = await mkId();
const bob = await mkId();

console.log('\n[Zielvorgabe: bestehende Konversation überlebt den roomId-Umbau — master-basiert]');

ok('computeMasterRoomId existiert', typeof S.computeMasterRoomId === 'function');
ok('migrateContactRoomId existiert', typeof S.migrateContactRoomId === 'function');

if (typeof S.migrateContactRoomId === 'function' && typeof S.computeMasterRoomId === 'function') {
  // A contact keyed by the OLD device-DH roomId, now carrying ownMasterPub.
  const contact = {
    roomId: await S.computeRoomId(alice.dh.publicKey, bob.dh.publicKey), // alte, geräte-DH-basierte ID
    ownMasterPub: alice.master.publicKey, // ← der Master, unter dem Bob uns kennt
    peerMasterPub: bob.master.publicKey,
    peerEpoch: 1,
    peerSignPub: bob.sign.publicKey,
    peerDhPub: bob.dh.publicKey,
    peerFingerprint: 'fp',
    ratchet: null,
    pendingHeader: null,
  };

  const oldId = contact.roomId;
  const expected = await S.computeMasterRoomId(alice.master.publicKey, bob.master.publicKey);
  const r = await S.migrateContactRoomId(contact);

  ok('gibt alte und neue ID zurück', r?.oldRoomId === oldId && typeof r?.newRoomId === 'string');
  // DIE entscheidende Assertion: die neue ID IST die master-basierte Ableitung
  // beider Master. Ein Rehash der alten (geräte-basierten) ID besteht das nicht.
  ok('neue ID = computeMasterRoomId(beide Master)', r.newRoomId === expected);
  ok('Kontakt trägt danach die neue ID', contact.roomId === r.newRoomId);
  ok('die ID hat sich tatsächlich geändert', r.newRoomId !== oldId);

  // Beide Seiten: Bob leitet aus (bob.own, alice.peer) ab — dieselbe sortierte ID.
  const bobContact = {
    ...contact,
    roomId: oldId,
    ownMasterPub: bob.master.publicKey,
    peerMasterPub: alice.master.publicKey,
  };
  const rb = await S.migrateContactRoomId(bobContact);
  ok('beide Seiten leiten dieselbe neue ID ab', rb.newRoomId === r.newRoomId);

  // Idempotenz: der zweite Lauf auf dem schon migrierten Kontakt verschiebt nicht.
  const again = await S.migrateContactRoomId(contact);
  ok('idempotent — zweiter Lauf gibt dieselbe neue ID', again.newRoomId === r.newRoomId);
  ok('idempotent — old===new auf bereits migriertem Kontakt', again.oldRoomId === again.newRoomId);

  // staleIdentity: ownMasterPub ist der ALTE (gesnapshottete) Master, unter dem
  // der Peer uns noch pinnt. Die neue ID MUSS daraus abgeleitet werden, sonst
  // adressieren beide Seiten verschiedene Räume und die Konversation ist stumm —
  // genau der Fund #1 des Design-Passes (alter Master darf beim Linking nicht weg).
  const staleOldMaster = sodium.crypto_sign_keypair();
  const stale = {
    ...contact,
    roomId: oldId,
    staleIdentity: true,
    ownMasterPub: staleOldMaster.publicKey,
  };
  const rs = await S.migrateContactRoomId(stale);
  ok(
    'staleIdentity: neue ID aus dem gepinnten (alten) Master',
    rs.newRoomId === (await S.computeMasterRoomId(staleOldMaster.publicKey, bob.master.publicKey)),
  );

  // Negativkontrolle als Assertion: eine master-UNABHÄNGIGE Ableitung (Rehash der
  // alten ID) würde „beide Seiten gleich" + „idempotent" bestehen, aber NICHT die
  // computeMasterRoomId-Gleichheit oben. Diese Zeile macht das explizit: die neue
  // ID darf gerade NICHT der alten gleichen und muss an den Mastern hängen.
  ok('negativ: neue ID hängt an Mastern, nicht an der alten ID',
    r.newRoomId !== oldId && r.newRoomId === expected && hex(alice.master.publicKey) !== hex(bob.master.publicKey));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
