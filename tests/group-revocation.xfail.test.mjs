// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — Geräte-Revocation greift auch in GRUPPEN            ║
// ║  HEUTE ROT — bewusste, dokumentierte 3c-Grenze; wird mit v3/MLS grün.      ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// In 3c greift Geräte-Revocation für 1:1-Kontakte: der Guard prüft ein Gerät
// gegen die per Gossip gelernte, master-signierte peerDeviceList. Für GRUPPEN-
// Mitglieder NICHT: ensureMemberContact baut das Contact-Literal direkt, ohne
// peerDeviceList, und der Guard-Gate (contact.peerDeviceList && …) ist damit
// für Mitglieder immer false — ein Fan-out an ein widerrufenes Mitglied wird
// nicht blockiert. Das ist genau die Roster-Fläche, auf der master-basierte
// Bindung ohnehin nicht mehr gegen ein Zweitgerät verteidigt.
//
// Diese Suite ist die ausführbare Fassung des SECURITY.md-Eintrags „Bekannte
// Grenzen: Gruppen": sie hält die offene Eigenschaft sichtbar, statt sie nur in
// Prosa zu vermerken, und wird grün, wenn v3/MLS Gruppen-Geräte-Listen einführt.
//
// ZIEL-API (v3, Design-Lock): eine devlist-Aktualisierung eines Gruppen-
// Mitglieds wird auf dessen (versteckten) Kontakt angewandt, sodass
// deviceAuthorized denselben Revocation-Schutz liefert wie 1:1 —
// erreichbar über applyGroupMemberDeviceList(...) o.ä.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };

console.log('\n[Zielvorgabe: Gruppen-Fan-out schließt widerrufene Geräte aus (v3)]');

// The v3 mechanism does not exist yet. When group member contacts learn a
// master-signed device list (so deviceAuthorized gates them like 1:1), this
// hook lands and the suite is renamed to a regular test.
ok('applyGroupMemberDeviceList existiert (v3)', typeof S.applyGroupMemberDeviceList === 'function');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
