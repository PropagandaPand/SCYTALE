// Die zwei Vertrauenslabel der Tür (Stufe 3c): Kette beweist vs. Hinweis behauptet.
// (War xfail-Zielvorgabe bis acceptRotation gebaut war; jetzt regulär.)
//
// Der Flip macht einen Master-Wechsel zu einem NEUEN Raum. Wie der Kontakt
// wieder zusammenfindet, hängt an der BEWEISLAGE — und diese Unterscheidung
// muss VOR der Implementierung stehen, sonst formt der Code das Ziel (der
// Schritt-0-Befund, in die andere Richtung gedreht):
//
//   • KETTE BEWEISST Kontinuität (dual-signierte Rotation vom gepinnten Master)
//       → automatisch umschlüsseln, `verified` BLEIBT, kein Trennmarker.
//   • HINWEIS BEHAUPTET Kontinuität (unsigniertes previousMaster)
//       → nur fragen (Merge-Affordance), nach Accept `verified=false`, Trennmarker.
//
// Plus zwei harte Sicherheitsbedingungen aus Runde 3:
//   • DENYLIST ZUERST: ein Alt-/Neu-Master auf der globalen Sperrliste wird
//     verworfen, BEVOR irgendein Lookup oder Zustand passiert (sonst Downgrade
//     auf den verlassenen Master über den Rotationspfad).
//   • ABLEHNUNG VOR ZUSTANDSBERÜHRUNG: eine ungültige Kette lässt verified,
//     peerMasterPub, peerEpoch und roomId unangetastet (der v0.16.0-Trust-DoS,
//     drei Zeilen zu tief — der Pfad ist neu, also gilt die Regel neu).
//
// ZIEL-API (Design-Lock):
//   acceptRotation(contact, statement: RotationStatement, retired: Set<string>)
//     : Promise<{ oldRoomId, newRoomId }>
//   — retired enthält b64(master) für gesperrte Master; Prüfung ZUERST.
//   — verifyRotation(contact.peerMasterPub, contact.peerEpoch, statement) muss
//     halten, sonst throw OHNE Zustandsänderung.
//   — bei Erfolg: peerMasterPub/peerEpoch auf neu, roomId =
//     computeMasterRoomId(ownMasterPub, newMaster), verified UNVERÄNDERT.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const b64 = (b) => sodium.to_base64(b, sodium.base64_variants.ORIGINAL);
const hex = (x) => sodium.to_hex(x);
const kp = (k) => ({ publicKey: new Uint8Array(k.publicKey), privateKey: new Uint8Array(k.privateKey) });

const aliceMaster = kp(sodium.crypto_sign_keypair());
const bobMaster = kp(sodium.crypto_sign_keypair());
const bobNewMaster = kp(sodium.crypto_sign_keypair());
const bobSign = sodium.crypto_sign_keypair();
const bobDh = sodium.crypto_box_keypair();

const mkContact = async () => ({
  roomId: await S.computeMasterRoomId(aliceMaster.publicKey, bobMaster.publicKey),
  ownMasterPub: aliceMaster.publicKey,
  peerMasterPub: bobMaster.publicKey,
  peerEpoch: 1,
  peerSignPub: new Uint8Array(bobSign.publicKey),
  peerDhPub: new Uint8Array(bobDh.publicKey),
  peerFingerprint: 'fp',
  verified: true,
  regime: 'master',
  sessions: new Map(),
});

console.log('\n[Zielvorgabe: Tür — Kette beweist vs. Hinweis behauptet]');

ok('acceptRotation existiert', typeof S.acceptRotation === 'function');

if (typeof S.acceptRotation === 'function') {
  // ── KETTE BEWEISST → umschlüsseln, verified BLEIBT ──────────────────────
  {
    const c = await mkContact();
    const oldRoomId = c.roomId;
    const statement = await S.makeRotation(bobMaster, bobNewMaster, 2); // epoch 1 → 2
    const r = await S.acceptRotation(c, statement, new Set());
    ok('gültige Kette: neuer Master gepinnt', hex(c.peerMasterPub) === hex(bobNewMaster.publicKey));
    ok('gültige Kette: Epoch fortgeschritten', c.peerEpoch === 2);
    ok('gültige Kette: roomId umgeschlüsselt auf den neuen Master',
      c.roomId === (await S.computeMasterRoomId(aliceMaster.publicKey, bobNewMaster.publicKey)));
    ok('gültige Kette: verified BLEIBT (bewiesen, kein Neu-Vergleich erzwungen)', c.verified === true);
    ok('gültige Kette: gibt alte und neue roomId zurück', r?.oldRoomId === oldRoomId && r?.newRoomId === c.roomId);
  }

  // ── ABLEHNUNG VOR ZUSTANDSBERÜHRUNG: ungültige Kette ────────────────────
  {
    const c = await mkContact();
    const before = { room: c.roomId, master: hex(c.peerMasterPub), epoch: c.peerEpoch, verified: c.verified };
    // Rollback: same epoch, not strictly higher → verifyRotation rejects.
    const bad = await S.makeRotation(bobMaster, bobNewMaster, 1);
    let threw = false;
    try { await S.acceptRotation(c, bad, new Set()); } catch { threw = true; }
    ok('ungültige Kette: wird abgelehnt', threw);
    ok('ungültige Kette: KEINE Zustandsänderung',
      c.roomId === before.room && hex(c.peerMasterPub) === before.master &&
      c.peerEpoch === before.epoch && c.verified === before.verified);
  }

  // ── DENYLIST ZUERST: gesperrter Ziel-Master → harte Ablehnung ───────────
  {
    const c = await mkContact();
    const before = { room: c.roomId, master: hex(c.peerMasterPub), verified: c.verified };
    const statement = await S.makeRotation(bobMaster, bobNewMaster, 2); // otherwise VALID
    const retired = new Set([b64(bobNewMaster.publicKey)]); // but the target is retired
    let err = null;
    try { await S.acceptRotation(c, statement, retired); } catch (e) { err = e; }
    ok('gesperrter Ziel-Master: abgelehnt trotz gültiger Kette', err !== null);
    ok('gesperrter Ziel-Master: KEINE Zustandsänderung (Denylist vor allem)',
      c.roomId === before.room && hex(c.peerMasterPub) === before.master && c.verified === before.verified);
  }

  // ── HINWEIS BEHAUPTET → nach Accept verified=false (Kontrast zur Kette) ──
  {
    const c = await mkContact();
    c.pendingMaster = {
      masterPub: bobNewMaster.publicKey, epoch: 2,
      signPub: new Uint8Array(bobSign.publicKey), dhPub: new Uint8Array(bobDh.publicKey),
    };
    await S.acceptMasterChange(c);
    ok('Hinweis (acceptMasterChange): verified=false — Neu-Vergleich Pflicht', c.verified === false);
  }
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
