// Finale Ship-Clean-Review (30-Agenten-Adversarial über den gemergten 3d-Stand):
// zwei MED-Funde, hier mit Negativkontrolle abgesichert. Der dritte (LOW) sitzt
// rein in addBundle (React/IndexedDB) und ist im Node-Bundle nicht erreichbar —
// der Fix (kartenlose Self-Sync-Historie via `?? loadMessages` nicht überschreiben)
// ist Code-Review-abgedeckt, kein Unit-Test möglich (dokumentiert, nicht kaschiert).
//
// MED-1  Self-Sync-mid-Reflexion: Self-Sync- und Peer-Dedup teilten EINEN
//        mid-only-Namespace. Ein autorisierter Peer lernt die AEAD-innere mid
//        seiner Fan-out-Kopie und reflektiert sie → meine EIGENE gesendete
//        Nachricht wird auf dem Zweitgerät still verworfen. Fix: hasMessage
//        dedupt nach (mid, RICHTUNG=mine).
// MED-2  acceptMasterChange ließ die unter dem ALTEN Master signierte
//        peerDeviceList gepinnt → jedes Gerät der frisch akzeptierten neuen
//        Identität galt als widerrufen (RevokedDeviceError, ggf. dauerhaft).
//        Fix: peerDeviceList = undefined, analog acceptRotation.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const eqh = (a, b) => sodium.to_hex(a) === sodium.to_hex(b);

// ── MED-1: hasMessage dedupt PRO RICHTUNG, nicht mid-only ──────────────────────
console.log('\n[MED-1: Self-Sync/Peer teilen KEINEN mid-Namespace mehr]');
const m = (mid, mine) => ({ mid, mine, ts: 1 });

// Meine gesendete (self-gesyncte) Kopie liegt bereits (mine=true).
const mySent = [m('X', true)];
// Der Peer reflektiert die mid X in einer EMPFANGENEN Nachricht (mine=false):
ok('reflektierte Peer-mid (mine=false) kollidiert NICHT mit meiner gesendeten (mine=true)',
  S.hasMessage(mySent, 'X', false) === false);
// … und meine eigene Self-Sync-Kopie derselben mid wird korrekt als Duplikat erkannt:
ok('meine Self-Sync-Kopie (mine=true) dedupt gegen meine gesendete',
  S.hasMessage(mySent, 'X', true) === true);

// Spiegelbildlich: eine empfangene Peer-Nachricht dedupt gegen eine empfangene.
const peerGot = [m('Y', false)];
ok('empfangene Peer-Kopie dedupt gegen empfangene (mine=false)', S.hasMessage(peerGot, 'Y', false) === true);
ok('meine gesendete (mine=true) wird NICHT von einer empfangenen unterdrückt',
  S.hasMessage(peerGot, 'Y', true) === false);

// NEGATIVKONTROLLE: genau das alte, verwundbare Verhalten (mid-only) muss FALSCH sein.
// Wäre der Namespace noch mid-only, liefe die Peer-Dedup-Prüfung gegen meine
// gesendete Nachricht positiv → Unterdrückung. Wir beweisen, dass sie es NICHT tut.
const midOnly = (msgs, mid) => msgs.some((x) => x.mid === mid); // die alte, kaputte Logik
ok('Negativkontrolle: alte mid-only-Logik HÄTTE unterdrückt (true) …', midOnly(mySent, 'X') === true);
ok('… der Fix tut es nicht (false) — Richtung trennt die Namespaces',
  S.hasMessage(mySent, 'X', false) !== midOnly(mySent, 'X'));
ok('leerer Verlauf ⇒ kein Duplikat', S.hasMessage([], 'X', false) === false);

// ── MED-2: acceptMasterChange klärt die tote peerDeviceList ────────────────────
console.log('\n[MED-2: acceptMasterChange verwirft die unter dem alten Master signierte Liste]');
const meMaster = sodium.crypto_sign_keypair();
const oldPeerMaster = sodium.crypto_sign_keypair();
const newPeerMaster = sodium.crypto_sign_keypair();
const mkDevice = async (masterPriv) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { sign, dh, cert: await S.signDeviceCert(masterPriv, 1, sign.publicKey, dh.publicKey) };
};
const oldDev = await mkDevice(oldPeerMaster.privateKey); // altes Primärgerät (unter M_old)
const newDev = await mkDevice(newPeerMaster.privateKey); // neues Primärgerät (unter M_new)

// Die peerDeviceList ist unter dem ALTEN Master signiert und listet nur oldDev.
const oldList = await S.signDeviceList(oldPeerMaster.privateKey, oldPeerMaster.publicKey, 1, 2, [
  { signPub: oldDev.sign.publicKey, dhPub: oldDev.dh.publicKey, deviceCert: oldDev.cert },
]);

const contact = {
  roomId: await S.computeMasterRoomId(meMaster.publicKey, oldPeerMaster.publicKey),
  ownMasterPub: meMaster.publicKey,
  peerMasterPub: oldPeerMaster.publicKey,
  peerEpoch: 1,
  peerSignPub: oldDev.sign.publicKey,
  peerDhPub: oldDev.dh.publicKey,
  peerFingerprint: 'fp',
  peerDeviceList: oldList,
  sessions: new Map(),
  pendingMaster: {
    masterPub: newPeerMaster.publicKey,
    epoch: 1,
    signPub: newDev.sign.publicKey,
    dhPub: newDev.dh.publicKey,
  },
};

// NEGATIVKONTROLLE (Vorzustand): mit der alten Liste noch gepinnt gilt das neue
// Primärgerät als NICHT autorisiert — genau der Defekt.
ok('Vorbedingung: neues Gerät ist unter der alten Liste NICHT autorisiert (der Bug)',
  S.deviceAuthorized(contact, newDev.sign.publicKey) === false);

const res = await S.acceptMasterChange(contact);
ok('acceptMasterChange liefert ein Ergebnis (etwas war pending)', res !== null);
ok('peerMasterPub ist neu gepinnt', eqh(contact.peerMasterPub, newPeerMaster.publicKey));
ok('peerDeviceList wurde verworfen (die tote M_old-Liste ist weg)', contact.peerDeviceList === undefined);
// Nach dem Fix: implizites Einzelgerät ⇒ das neue Primärgerät ist autorisiert.
ok('neues Primärgerät ist jetzt autorisiert (nicht mehr fälschlich widerrufen)',
  S.deviceAuthorized(contact, newDev.sign.publicKey) === true);
// Das alte Gerät der aufgegebenen Identität ist es nicht.
ok('altes Gerät der aufgegebenen Identität ist NICHT autorisiert',
  S.deviceAuthorized(contact, oldDev.sign.publicKey) === false);
ok('retiredMaster nennt den aufgegebenen (alten) Master',
  res.retiredMaster === sodium.to_base64(oldPeerMaster.publicKey, sodium.base64_variants.ORIGINAL));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
