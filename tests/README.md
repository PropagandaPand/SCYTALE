# Tests

`npm test` — bündelt `entry.ts` und führt alle `*.test.mjs` aus.
`node tests/run.mjs <fragment>` — nur passende Suites.

Kein Framework: die Aussagekraft liegt in dem, was die Assertions behaupten, und
eine Abhängigkeit mehr steht einem Projekt schlecht, dessen Sinn prüfbare
Minimalität ist.

## Zwei Regeln, die aus echten Fehlern stammen

**1. Negativkontrolle.** Jede neue sicherheitsrelevante Assertion muss einmal
absichtlich falsch gefüttert werden. Wird sie dann nicht rot, prüft sie nichts.

*Herkunft:* ein SAS-Test verglich `emoji.join(' ')` über ein Array von
`{char,name}`-Objekten — das ergibt für **jede** Eingabe `"[object Object] …"`.
Der Test war grün und wertlos. Die schärfere Frage lautet nicht „ist der Test
richtig geschrieben", sondern **„wäre die geprüfte Eigenschaft im Bug-Zustand
verletzt?"** — sonst testet man etwas Wahres, das mit dem Bug nichts zu tun hat.
`exploit.test.mjs` hat dafür den Schalter `SCYTALE_NO_PERSIST=1`, der das
Vor-Fix-Verhalten reproduziert; eine Negativkontrolle, die man nach einmaligem
Gebrauch wegwirft, schützt den nächsten Refactor nicht.

**2. Auf den Ablehnungs-GRUND prüfen, nicht nur auf Ablehnung.** Ein Grün, das
von einem anderen Wächter weiter unten im Pfad kommt, schreibt dem Test einen
Mechanismus gut, den er nie ausgeführt hat.

*Herkunft:* mit deaktivierter Bindungsprüfung blieb der Fall „Opfer-Master,
eigene Device-Keys" grün — abgelehnt, aber vom Cert-Check in `respondX3DH`. Die
Bindungsprüfung saß nur in einem Zweig; das aufzudecken war der eigentliche
Gewinn des Tests (behoben in v0.16.4).

## Eigenschaftsgebundene Tests statt implementierungsgebundene

`binding-property.test.mjs` ruft **nie** `computeRoomId` und nimmt keine
Ableitung an. Es fragt den Produktionspfad (`makeContactFromHeader`), zu welcher
Unterhaltung eine Identität gehört, und leitet die Erwartung daraus ab. Stellt
Stufe 3c `roomId` von Geräte-DH auf Master um, prüft der Test weiter das
Richtige, **ohne bearbeitet zu werden**.

Ein Test, der `computeRoomId(dh, dh)` fest verdrahtet, würde nach der Migration
still das Falsche prüfen — und grün bleiben. Das ist die gefährlichste
Regression, die es gibt, weil nichts sie meldet.

## `*.xfail.test.mjs` — ausführbare Zielvorgaben

Diese Suites sind **absichtlich rot**. Sie schreiben eine Eigenschaft fest,
deren Mechanismus noch nicht gebaut ist. Der Runner meldet sie getrennt und
lässt den Lauf **nicht** fehlschlagen.

Der Sinn: eine Spec-Zeile wird ausführbar. Wenn 3c beginnt, lautet die Frage
nicht mehr „erfüllt der Code die Spec" (Lesearbeit, fehleranfällig), sondern
„ist der Test grün" (mechanisch). Das ist die schärfste Form von Design-Lock —
sie hält auch dann, wenn niemand mehr weiß, warum die Zeile im Spec stand.

| Datei | Offene Eigenschaft | Wird grün mit |
|---|---|---|
| `bearer-usage.xfail` | Ein `deviceCert` allein genügt nicht — nötig ist Cert **und** Präsenz in einer aktuellen Geräteliste. Bis dahin existiert Revocation praktisch nicht. | 3c, Listenprüfung auf dem Empfangspfad |
| `migration-roomid.xfail` | Nach dem `roomId`-Umbau findet eine bestehende Konversation ihren Verlauf wieder (Round-Trip, idempotent, beide Seiten leiten dieselbe ID ab). | 3c, `migrateContactRoomId` |

**Wird eine xfail-Suite grün, muss die Datei umbenannt werden** (`.xfail.`
entfernen) — sonst schützt sie nichts mehr, weil der Runner ihr Scheitern
weiterhin toleriert. Der Runner warnt in diesem Fall.

Die Ziel-APIs in diesen Dateien sind **Design-Lock, kein Vorschlag**:
`Contact.peerDeviceList` und `migrateContactRoomId(contact)`.
