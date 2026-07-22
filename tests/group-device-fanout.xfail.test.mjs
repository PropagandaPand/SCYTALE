// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ZIELVORGABE (xfail) — Gruppen fächern auf die GERÄTE der Mitglieder auf   ║
// ║  (Stufe 3e). HEUTE ROT — bewusste, dokumentierte 3d-Grenze.                ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// In 3d fächert eine 1:1-Nachricht über fanoutDeliveries an ALLE autorisierten
// Geräte des Peers auf, und Self-Sync spiegelt sie an meine eigenen Geräte.
// GRUPPEN nicht: ensureMemberContact baut einen Ein-Geräte-Mitglied-Kontakt ohne
// peerDeviceList, gossipDeviceList überspringt versteckte Kontakte, und Self-Sync
// ist 1:1-only. Damit erreicht eine Gruppennachricht KEIN Zweitgerät eines
// Mitglieds, und mein eigenes Gerät B sieht nie Gruppennachrichten von Gerät A.
//
// ZWEITE 3e-Grenze im selben Spec: die Attachment-KARDINALITÄT. Ein großer Anhang
// an eine Gruppe repliziert in 3e über Σ(Geräte über alle Mitglieder) — ein
// Verfügbarkeits-Hebel (10 MB × 20 Mitglieder × 2–3 Geräte = 40–60 Uploads). 3e
// braucht dafür eine bewusste Strategie (Referenz statt Bytes, Deckel o.ä.).
//
// Diese Suite ist die ausführbare Fassung der SECURITY.md-Grenze „Gruppen ×
// Geräte": sie hält beide offenen Eigenschaften sichtbar, statt sie in Prosa zu
// vergraben, und wird grün, wenn 3e/MLS Gruppen-Geräte-Listen + eine Attachment-
// Strategie einführt.
//
// ZIEL-API (v3, Design-Lock): eine Gruppennachricht fächert über die (versteckten)
// Mitglied-Kontakte an deren master-signierte Geräte auf — erreichbar über
// groupFanoutToDevices(...); und ein bewusster Attachment-Kardinalitäts-Deckel
// über boundedGroupAttachmentPolicy(...).
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  OFFEN', n); } };

console.log('\n[Zielvorgabe: Gruppen-Fan-out auf Mitglieder-Geräte + Attachment-Kardinalität (3e)]');

// The v3 mechanisms do not exist yet. When group messages fan out over member
// device lists and a per-group attachment policy lands, these hooks appear and the
// suite is renamed to a regular test.
ok('groupFanoutToDevices existiert (3e)', typeof S.groupFanoutToDevices === 'function');
ok('boundedGroupAttachmentPolicy existiert (3e)', typeof S.boundedGroupAttachmentPolicy === 'function');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
