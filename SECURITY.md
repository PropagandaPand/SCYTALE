# Sicherheit & Bedrohungsmodell

SCYTALE ist gegen **anlasslose Massenüberwachung** gebaut (Chatkontrolle /
CSAR). Dieses Dokument ist die genaue Aufschlüsselung aller Mechanismen und
sagt ehrlich, was geschützt ist — und was nicht. Stand: v0.20.1 (Stufe 3d
Multi-Device: Fan-out + Per-Device-Sessions + Self-Sync).

**Leitprinzipien:** niemals eigene Krypto erfinden (vetted Primitiven +
etablierte Protokolle: X3DH, Double Ratchet); der Server ist ein **dummer
Ciphertext-Briefkasten** ohne Wissen; Zustand wird **erst nach bestandener
Authentifizierung** übernommen (Commit-Disziplin, siehe Abschnitt 4).

**Was non-extractable ist — und was nicht.** Diese Zeile hat hier lange zu viel
behauptet, deshalb präzise: **KEK, DEK und die pro Nachricht importierten
AES-GCM-Keys** sind non-extractable `CryptoKey`s; ihre Rohbytes sind für
JavaScript unerreichbar. **Nicht** non-extractable sind alle Schlüssel, die
libsodium verwaltet oder die als KDF-Eingabe gebraucht werden: der
Ratchet-Zustand (`RK`, `CKs`, `CKr`, die gesamte `skipped`-Map mit ihren
Message-Keys, `DHs.privateKey`) sowie die Identitäts- und Master-Privatschlüssel
liegen als schlichte `Uint8Array` im Speicher. Das ist mit libsodium-wrappers
unvermeidbar und für den At-Rest-Schutz auch irrelevant — es heisst aber, dass
**ein XSS-Fund im laufenden, entsperrten Tab sehr wohl Schlüsselmaterial
auslesen könnte**. Der Schutz dagegen ist die CSP und der gesperrte Tresor, nicht
die Nicht-Extrahierbarkeit.

---

## 1. Daten auf dem Gerät (At-Rest, „der Tresor")

`src/crypto/vault.ts`, `argon2.ts` · `src/lib/vaultService.ts`, `deviceKey.ts`, `lockout.ts`

**KEK/DEK-Envelope:**
```
Passphrase --Argon2id--> KEK (non-extractable, nur RAM)
KEK --AES-256-GCM wrap/unwrap--> DEK (non-extractable, zufällig)
DEK --AES-256-GCM--> jeder Datensatz auf Platte
```
- **Argon2id** (memory-hard, GPU-/Seitenkanal-resistent): 256 MiB, 3 Durchläufe,
  32-Byte-Ausgabe; zufälliger 16-Byte-Salt pro Tresor (im Klartext, kein
  Geheimnis). On-Device-Kalibrierung fällt auf 128/64 MiB zurück; die Parameter
  stehen im Tresor-Header. **Code-seitiger Floor** (`MIN_ARGON2` = 64 MiB / t=3):
  der Header ist vor dem DEK-Unwrap nicht authentifiziert, also werden geschwächte
  Parameter (m=8 MiB, t=1) **ignoriert** — nie unter dem Floor abgeleitet.
  **Und ein Deckel** (`MAX_ARGON2` = 1 GiB / t=16): derselbe unauthentifizierte
  Header erlaubt sonst `memorySize: 2000000`, was jede Ableitung per OOM
  abbrechen lässt und den Tresor **dauerhaft unöffenbar** macht. Ein reiner
  Floor verwandelt einen Schwächungs- in einen Zerstörungsangriff.
- **KEK** nur mit `wrapKey`/`unwrapKey` importiert; Rohbytes danach mit `fill(0)`
  überschrieben.
- **DEK**: zufälliger AES-256-GCM-Key, non-extractable. Passphrase-Wechsel =
  nur DEK neu wrappen, **keine** Neuverschlüsselung der ganzen DB.
- **Pro Datensatz**: AES-256-GCM mit **frischer 96-Bit-Nonce** + **AAD**
  (bindet Typ/ID/Version in den Auth-Tag → kein Vertauschen/Rollback).
- **Falsche Passphrase** wird am fehlschlagenden GCM-Tag beim DEK-Unwrap erkannt
  — **kein separater Verifier** (der wäre ein Offline-Angriffs-Orakel).
  **Beschädigter Header** meldet dagegen `VaultCorruptError` statt „falsche
  Passphrase": wer eine korrekte Passphrase zum fünften Mal eintippt, während in
  Wahrheit der Datensatz kaputt ist, sucht an der falschen Stelle — dieselbe
  Diagnostizierbarkeitslücke wie beim stillen Handshake-Fehlschlag.

**Device-Binding:** ein non-extractable AES-256-GCM-Schlüssel wird einmal pro
Gerät/Browser-Profil erzeugt und in IndexedDB gehalten (Rohbytes nie JS-lesbar).
Er verschlüsselt ein zufälliges *bindingSecret*, das **vor** Argon2id in die
Passphrase gemischt wird → ein exfiltrierter Tresor ist **ohne dieses Gerät
wertlos**, selbst mit korrekter Passphrase.

**Recovery-Backup (bewusster Trade-off, `src/lib/backup.ts`):** für Multi-Device
/ Gerätewechsel gibt es einen **verschlüsselten Datei-Export** der Identität
(inkl. Master-Privkey), Kontakte und Verlauf. Das ist der **erste Mechanismus,
der die Geräte-Bindung bewusst aufweicht** — ein Backup ist per Definition der
exfiltrierbare Pfad, den Device-Binding sonst ausschließt. Deshalb streng
gegated:
- **Opt-in & explizit**, nie automatisch.
- **Zweite Authentifizierung:** die Tresor-Passphrase wird **unmittelbar vor dem
  Export erneut abgefragt** (`unlockBoundVault`) — ein entsperrter Tresor +
  physischer Zugriff ist damit **kein Ein-Klick-Exfil**.
- **Separate Export-Passphrase** verschlüsselt die Datei mit **vollem Argon2id**;
  der `MIN_ARGON2`-Floor wird **nicht** umgangen (AES-256-GCM über den daraus
  abgeleiteten Schlüssel).
- **Rotations-Hinweis:** ein Backup enthält den Master-Privkey. Nach einer
  Master-Rotation entschlüsselt ein **altes** Backup weiter den *alten* Master —
  er kann Device-Certs seiner Epoch für noch nicht rotierte Kontakte ausstellen.
  **Alte Backups sind bei Rotation zu vernichten** (der Rotations-Flow weist
  explizit darauf hin).
- **Ratchet-State-Fork (Migration ≠ simultan):** das Backup enthält Double-
  Ratchet-Sessions. Läuft das Quellgerät nach dem Restore **weiter** und senden
  **beide** an denselben Kontakt, teilen sie einen Ratchet-Stand → gleiche
  Message-Nummern für verschiedene Nachrichten → der Empfänger verwirft sie, die
  Session stirbt (heilt nur per neuem X3DH). Ebenso setzt ein **alter** Restore
  Chain-Zähler zurück und macht laufende Sessions unbrauchbar. Migration (ein
  aktives Gerät) ist sicher; das erzwingt aber bislang nur ein **UI-Hinweis**,
  keine kryptografische Sperre — echtes simultanes Multi-Device braucht
  Per-Device-Sessions (Stufe 3).

**Brute-Force-Lockout:** nach 5 Fehlversuchen eskalierende Sperre
(30 s · 2^(n−5), gedeckelt bei 300 s), in IndexedDB persistiert.

**Auto-Lock:** nach 5 Minuten Inaktivität wird der DEK aus dem RAM entfernt;
die App verlangt erneut die Passphrase. **Runtime-Self-Test** prüft die
Primitiven beim Start.

---

## 2. Identität & Verifikation

`src/crypto/identity.ts`

- **Ed25519** (Signatur) + **X25519** (DH) via libsodium.
- **Pairwise Safety Number** + **Identicon** zum Out-of-Band-Abgleich gegen MITM;
  Kontakt als *verifiziert* markierbar (über den **Master**, stabil über Geräte).
- **Identitätswechsel eines Kontakts** wird nie automatisch übernommen: der
  behauptete Master wird nur als **Vorschlag** festgehalten (und nur, wenn sein
  Device-Cert unter ihm verifiziert) und braucht eine bewusste Nutzeraktion plus
  **erneuten Safety-Number-Vergleich**.
- **Bindung der Behauptung an die Unterhaltung:** das `conv`-Feld ist reines
  Routing — der Absender wählt es frei, und das Relay nimmt unauthentifizierte
  Sends an jede Inbox an. Ein Device-Cert beweist ebenfalls **nichts über den
  Besitz** der enthaltenen Keys: jeder kann sich ein Master-Keypair erzeugen und
  ein Cert über *beliebige* Public Keys selbst ausstellen. Deshalb wird vor jeder
  Zustandsänderung geprüft, dass die behauptete Identität **dieselbe `roomId`
  ableitet** (`computeRoomId(eigenerDH, behaupteterDH)`). Ohne das könnte ein
  Gruppen-Mitglied, das `dhPub` eines anderen aus dem Roster kennt, einen
  Identitätswechsel für einen *fremden* Kontakt einschleusen und sich beim
  Akzeptieren auf dessen Platz pinnen lassen. Rotation und Geräte-Kopplung
  passieren die Prüfung (die Device-Keys bleiben, nur der Master wechselt); ein
  Peer mit wirklich neuen Device-Keys erscheint als **neuer Kontakt** — das ist
  die ehrliche Darstellung, kein Rückschritt. Die Prüfung steht **ganz oben in
  `receiveEnvelope` und gilt für jedes Prekey**, nicht nur im Zweig für
  Master-Wechsel: passt der Master zufällig, wird dieser Zweig übersprungen und
  einziger verbleibender Wächter wäre die Cert-Prüfung in `respondX3DH` — die
  fängt zwar eine Fälschung, aber erst nachdem wir das Envelope bereits als
  hierher gehörend akzeptiert haben. Verteidigung darf nicht davon abhängen,
  welchen Zweig eine Nachricht nimmt. Nebeneffekt: ein Zweitgerät des Peers kann
  die Session nicht mehr stillschweigend überschreiben — Per-Device-Sessions
  sind Aufgabe von Stufe 3c, kein Zufallsprodukt dieses Pfads.

### Stufe 3c — master-basierter `roomId`, Geräte-Revocation, zweiseitige Tür

- **`roomId` ist master-basiert** (`computeMasterRoomId(eigenerMaster, peerMaster)`,
  sortiert, mit Domain-Präfix gegen Kollision mit dem alten Geräte-DH-Schema): eine
  Konversation ist Eigenschaft der **Personen**, nicht der Gerätepaare. Die
  Autorisierung eines Prekeys ist damit `bytesEqual(behaupteterMaster, gepinnter
  Master)` — der Peer-`dhPub` ist rostersichtbar und bindet nicht, nur der Master,
  weil nur seine Geräte einen Cert darunter halten. Fehlschlag = **Ablehnung, nie**
  in einen Tür-Zweig (das wäre der v0.16.4-Downgrade zurück).
- **Migration (device→master) ist crash-sicher:** re-**verschlüsselt** unter der
  neuen roomId-AAD (nie umbenennen — sonst wirft `open()` und der Kontakt
  verschwände still), schreibt das Neue **vor** dem Löschen des Alten, und mischt
  bei einer crash-unterbrochenen Doppelung nach „lebende Session gewinnt" statt
  blind zu überschreiben. Ein `regime`-Marker macht sie idempotent. Alle Re-Key-
  Stellen (Boot, `acceptMasterChange`, `reconnectContact`, Rotation) laufen durch
  **eine** Routine.
- **Geräte-Revocation (Cert UND Listenpräsenz):** ein Prekey von einem Gerät, dessen
  Cert unter dem gepinnten Master gilt, das aber **nicht in der akzeptierten,
  master-signierten Geräteliste** steht, wird abgelehnt (`RevokedDeviceError`). Die
  Liste wird nie implizit aus dem geprüften Gerät gebaut (selbstreferenziell); ein
  zweites Gerät wird nur durch eine **echte devlist-Aktualisierung** (E2E-Gossip,
  verifiziert + rollback-geprüft) legitimiert. **Best-effort und so dokumentiert:**
  Revocation greift für einen Kontakt, sobald er die neuere Liste gesehen hat —
  dieselbe Eigenschaft wie bei Signal/Element. Der Guard sitzt **vor** dem
  sim-init-Zweig, sonst zerstörte ein widerrufenes Gerät über den Tie-Break den
  Live-Ratchet. Der Prekey-Guard blockiert nur **neue** Handshakes; damit ein
  widerrufenes Gerät nicht über seinen **bereits etablierten** Ratchet weiter
  `msg`-Envelopes senden kann, reisst `applyDeviceListUpdate` den Ratchet **ab**,
  sobald das Gerät hinter der Live-Session aus der akzeptierten Liste fällt
  (`ratchetDeviceSignPub` merkt sich dieses Gerät, weil es ein Zweitgerät sein kann,
  das `peerSignPub` nicht ersetzt hat) — jeder weitere Verkehr muss dann durch den
  Prekey-Guard, der ihn abweist.
- **Zweiseitige Tür, zwei Vertrauenslabel — nie verschmolzen:**
  - **Dual-signierte Rotation** (Kette vom gepinnten Master, `verifyRotation`):
    kryptografisch **bewiesene** Kontinuität → `acceptRotation` schlüsselt den Raum
    automatisch um und **behält `verified`**.
  - **Unbewiesener `previousMaster`-Hinweis** (nicht signiert, nicht signierbar,
    **ausserhalb der AAD** — er authentifiziert nichts): löst nur eine **Merge-
    Affordance** aus („gibt an, X zu sein — nichts belegt das — Sicherheitsnummer
    vergleichen"); erst der bewusste `acceptMasterChange` pinnt um und setzt
    `verified=false`. Kette **beweist** → umschlüsseln; Hinweis **behauptet** → nur
    fragen.
- **Denylist global nach Master indiziert** (nicht mehr am Kontakt): löst die
  Zirkularität (Kontakt aus Master ableiten, aber Master am Kontakt) und sitzt damit
  strukturell **vor** jeder Zustandsberührung — auf dem Rotations- **und** dem
  Auto-Create-Pfad. Ein behaupteter Alt-Master auf der Sperrliste wird verworfen,
  bevor irgendein Lookup passiert; so bleibt kein Downgrade-Pfad neben dem
  bewachten.

- **`verified` fällt nur durch eine Nutzeraktion**, nie durch Eingehendes. Eine
  Behauptung setzt das Flag **nicht** zurück; erst `acceptMasterChange` — also
  das bewusste Umpinnen — löscht es. Andernfalls könnte jeder, der unsere Inbox
  erreicht, das Verifikations-Flag beliebiger Kontakte beliebig oft abbrennen:
  ein Verifikations-DoS, der die MITM-Warnung abtrainiert und damit genau die
  Vorbedingung für ein späteres Fehl-Akzept schafft. `verified` beschreibt die
  Identität, die wir **gepinnt** haben — eine unangenommene Behauptung hat daran
  nichts geändert. Auch hier warnt die UI nur bei einer **neuen** Behauptung
  (Dedup auf den Inhalt, nicht auf ein Flag).
- **Denylist verlassener Master (bewusst endgültig):** akzeptiert der Nutzer
  einen Wechsel, landet der ersetzte Master auf einer Sperrliste des Kontakts und
  wird **nie wieder angeboten**. Begründung: ein verlassener Master ist der
  *wahrscheinlichste kompromittierte Schlüssel im System* — er liegt in alten
  Backups und auf verworfenen Geräten, meist genau deshalb wurde er verlassen.
  Ein Downgrade-Angebot darauf wäre der erste Versuch eines Angreifers mit
  Altbeständen, und die **alte Safety Number wirkt beim Vergleich vertraut
  statt alarmierend** („stimmt doch mit früher überein") — die bewusste
  Bestätigung würde also gerade das Falsche bestätigen. Eine Nachricht unter
  einem gesperrten Master wird **sichtbar abgelehnt** (nicht still verworfen)
  und lässt `verified` **unberührt**, damit ein alter Schlüssel das Vertrauen in
  die aktuelle Identität nicht degradieren kann. Die Sperrliste ist **global nach
  Master indiziert** (nicht mehr am Kontakt) und reist **ausdrücklich im Recovery-
  Export** mit; ein Restore **vereinigt** sie mit der lokalen Menge (nie
  überschreiben — ein älteres Backup darf keine bereits verlassene Kennung
  wiederbeleben). Ohne diese explizite Aufnahme öffnete ein Restore in einen
  frischen Tresor den Downgrade-Pfad wieder — die globale Denylist ist der
  einzige Post-Migrations-Speicher der Verlassungen.
  *Gewollte Konsequenz:* der Weg zurück zu einem verlassenen Master ist
  **endgültig zu**, auch für den legitimen Nutzer, der es sich anders überlegt.
  Der Rückweg ist ein frischer Identitätsaufbau. Das ist der Schutz, kein Bug.
- **Warnung genau einmal (Schutz vor Warnmüdigkeit):** wer den verlassenen
  Schlüssel besitzt, kann beliebig oft senden. Eine Warnung *pro Nachricht* wäre
  damit ein **Belästigungs-Hebel** — und schlimmer als lästig: sie würde den
  Nutzer darauf trainieren, Sicherheitshinweise wegzuklicken, bis eine echte
  Warnung ungelesen bleibt. Warnmüdigkeit ist ein Angriff auf die *menschliche*
  Komponente des Systems, nicht auf die Kryptografie. Der Hinweis erscheint
  deshalb einmal beim Übergang und wird danach zu **Kontakt-Zustand**
  (`retiredAttempt`), sichtbar in der Kontaktansicht. Bestätigt der Nutzer ihn,
  verschwindet nur der *Hinweis* — die Sperrliste selbst bleibt unverändert.

### Stufe 3d — Multi-Device: Fan-out, Per-Device-Sessions, Self-Sync

- **Eine Session PRO Peer-Gerät.** `Contact.sessions` ist eine Map von
  `base64(deviceSignPub)` auf eine eigene Double-Ratchet-Session. Die Person-Ebene
  (`roomId`, `verified`, `peerDeviceList`, die Identitätstür) bleibt **singulär**;
  nur die Ratchet-Schicht vervielfacht sich. **Invariante I gilt PRO Session:** ein
  Message-Key genau einmal *pro Session*, und eine `RatchetState` wird **nie** über
  zwei Map-Einträge geteilt/geklont (das verbände zwei Ketten zu einem Two-Time-Pad
  — als ausführbare Eigenschaft mit Negativkontrolle in `invariant-i-per-session`).
- **Fan-out.** Eine 1:1-Nachricht wird für **jedes autorisierte Gerät** der
  master-signierten `peerDeviceList` verschlüsselt (`fanoutDeliveries`), jede Kopie
  mit **derselben E2E-`mid`** (16 Zufallsbytes, **innerhalb** der AEAD → nicht
  fälschbar zur Unterdrückung einer echten Nachricht), sodass die Geräte dedupen.
  Ein Gerät, an das wir (noch) nicht initiieren können, ist **„nicht mehr gültig"**
  (`stale`) und fällt aus dem Nenner des Zustell-Aggregats — korrektes Verhalten
  zeigt nie einen Dauerfehler. Jedes Gerät ist eine eigene Session (kein Aliasing);
  ein Pro-Gerät-Fehler isoliert dieses Gerät.
- **Signed Prekey in der devlist (v2).** Damit ein Peer an ein **stilles**
  Zweitgerät initiieren kann, trägt jeder Listen-Eintrag den stabilen Signed Prekey,
  **im master-signierten `listMsg` gebunden** → ein veralteter SPK reist nur mit
  einer niedriger-versionierten Liste, die `isNewerDeviceList` abweist (Rollback-
  Schutz gratis über die Listen-Monotonie, kein zweiter versionierter Kanal). N's
  SPK fließt über die Kopplungs-QR (v2) und wird von P in die master-signierte Liste
  gelegt.
- **Self-Sync.** Was ich sende, spiegelt ein verstecktes `self`-Kontakt
  (`peerMaster == mein Master`, `peerDeviceList == meine eigene Geräteliste`) als
  `sent`-Kopie an meine **anderen** Geräte. Der Frame trägt den **Ziel-Peer-Master**:
  **Decrypt-Raum ≠ Anzeige-Raum** — die Kopie authentifiziert unter dem self-Kontakt
  (nur meine eigenen, master-gelisteten Geräte kommen durch), wird aber im
  Gesprächsraum mit dem Peer angezeigt. Sie ist **terminal** (nie re-fanned,
  re-synced oder als ihr innerer Effekt re-dispatcht) und über die Original-`mid`
  dedupliziert. Ein Prekey unter **meinem** Master wird zum self-Kontakt geroutet,
  nie als sichtbarer Kontakt auto-erzeugt. Ein widerrufenes Eigengerät wird aus dem
  self-Kontakt geprunt (keine Historie mehr dorthin).
- **Erreichbarkeit ist eine Eigenschaft der PERSON, nicht des Gerätepaars.** Der
  Aggregat-Status („an N/M Geräten") und der Erreichbarkeits-Punkt bewerten das
  **aktuelle** Geräteset. Das ist dieselbe Umkehrung wie bei der Tür: die
  identitätsstiftende Größe ist die Person.

### Gerätekopplung (Device-Linking)

Der **Master-Privatschlüssel verlässt das primäre Gerät nie** (Signal-Modell) —
ein gekoppeltes Gerät kann folglich keine weiteren Geräte signieren. Der Ablauf
ist bewusst **zweistufig**:

1. **N → P (QR):** `LinkRequest { deviceSignPub, deviceDhPub, sasEphPub }`
2. **P → N (versiegelt):** `LinkOffer { sasEphPub }` — **nur** das Ephemeral
3. **Beide zeigen 7 Emoji (SAS). Der Nutzer vergleicht und bestätigt.**
4. **Erst danach P → N:** `LinkGrant { masterPub, epoch, deviceCert(N), deviceList(v+1) }`
5. N installiert, P schreibt die neue Liste fort.

**Warum das Offer existiert:** ein `deviceCert` ist ein **Bearer-Credential**.
Einmal signiert, ist es in der Welt — die neue Geräteliste *nicht* zu
veröffentlichen widerruft es **nicht**, und ein Peer, der ein Bundle-Cert gegen
den Master prüft, würde den Inhaber als uns akzeptieren. Würde P den Grant nur
verschicken, damit N überhaupt ein SAS anzeigen kann, hielte ein Angreifer,
dessen QR versehentlich gescannt wurde, auch nach „die Emojis stimmen nicht"
ein gültiges Zertifikat unseres Masters in der Hand. Deshalb verlässt **nichts
Bearer-Wertiges P vor der menschlichen Bestätigung**; ein Ephemeral allein
gewährt nichts.

*Folge für die UI:* ein Abbruch vor Schritt 4 hinterlässt auf **beiden Seiten
null Zustand** — kein Zertifikat ausgestellt, keine Listenversion erhöht, nichts
zurückzurollen. Der Commit ist die **letzte** Aktion, nie ein Schritt, der
rückgängig gemacht werden muss (ein Rollback-Pfad, den niemand testet, ist
schlechter als gar keiner).

**Wire-Formate sind versioniert** (Versions-Byte an Position 0, bei QR *und*
Offer) und der Decoder **verzweigt darauf vor der Längenprüfung** — sonst meldet
ein künftiges v2-Format auf einem Altgerät „ungültiger Code" statt „App zu alt",
und der Nutzer sucht einen Scanner-Fehler statt zu aktualisieren.

---

## 3. Schlüsselaustausch — X3DH

`src/crypto/x3dh.ts`

Asynchrones Signal-Handshake (Empfänger muss nicht online sein):
```
DH1 = DH(IK_A, SPK_B)   DH2 = DH(EK_A, IK_B)
DH3 = DH(EK_A, SPK_B)   DH4 = DH(EK_A, OPK_B)   ← One-Time-Prekey (Forward Secrecy)
SK  = HKDF-SHA256( 0xFF·32 || DH1||DH2||DH3||DH4 ,  info="SCYTALE_X3DH_v1" )
```
- **Signed-Prekey-Signatur wird geprüft** — untergeschobener Server-Key → Abbruch
  (MITM-Schutz).
- **Associated Data = IK_A ‖ IK_B** in den ersten AEAD gebunden → beide
  Identitäten authentifiziert.
- Gleichzeitiger beidseitiger Aufbau wird deterministisch aufgelöst (Tie-Break
  nach Identitäts-Reihenfolge), damit die Ratchets konvergieren.

### One-Time-Prekeys: bewusst NICHT im geteilten Code

X3DHs One-Time-Prekey funktioniert nur, wenn ein Server jeden OPK **genau
einmal** herausgibt und löscht. SCYTALE hat keinen Prekey-Server — der Code wird
einmal erzeugt und **broadcast** (QR, Link, Gruppen-Roster). Jeder Empfänger
bekäme also denselben OPK.

Die Folge war messbar und lange unerklärt: der erste Initiator verbraucht den
OPK, jeder spätere rechnet dann DH1–DH4, während wir nur DH1–DH3 bilden können —
**seine erste Nachricht lässt sich nicht entschlüsseln.** Wer als Zweiter
denselben Code benutzt, erreichte uns nie. Das erklärt vermutlich das lange
rätselhafte „mal geht es, mal nicht" beim Austausch von Codes.

Die Gegenrichtung — den OPK behalten statt verbrauchen — wäre schlimmer: er
wäre einmalig nur dem Namen nach, von allen geteilt, und seine Kompromittierung
öffnete die Erstnachricht **jedes** Kontakts. Gegenüber dem Signed Prekey
gewinnt das nichts und behauptet eine Eigenschaft, die es nicht hat.

**Entscheidung:** der geteilte Code trägt **keinen** OPK. Forward Secrecy der
ersten Nachricht ruht damit auf dem **Signed Prekey** (rotierbar) und ab
Nachricht zwei auf dem Ratchet. Echte OPK-Frische verlangt einen **Code pro
Kontakt** — dann stimmt „ein Code, ein OPK" wieder, um den Preis, dass ein Code
nicht mehr broadcast-fähig ist. Die Mechanik dafür bleibt im Code, und der
Empfänger akzeptiert und verbraucht weiterhin einen OPK, falls der Code eines
älteren Clients einen mitbringt.

Geprüft in `tests/opk-reuse.test.mjs`: zwei verschiedene Personen initiieren
gegen denselben Code, beide kommen an.

---

## 4. Nachrichten — Double Ratchet

`src/crypto/ratchet.ts`

- **Symmetrischer Ratchet**: Chain-KDF = HMAC-SHA256 (`HMAC(CK,0x01)`=MK,
  `HMAC(CK,0x02)`=CK'). Message-Key = `HKDF(MK)` → 32-Byte-**AES-256-GCM**-Key +
  12-Byte-IV. Jede Nachricht ein eigener Schlüssel.
- **DH-Ratchet** (Root-KDF = HKDF-SHA256): **Post-Compromise-Security** — die
  Sitzung heilt nach einer Kompromittierung.
- **Forward Secrecy**: alte Keys verworfen; ein geleakter aktueller Schlüssel
  entschlüsselt keine Vergangenheit.
- **Out-of-Order/verloren**: übersprungene Keys zwischengelagert. Doppelt
  gedeckelt gegen DoS: **1000 pro Sprung** (`MAX_SKIP`) **und 2000 gesamt pro
  Session** (`MAX_SKIP_SESSION`, älteste werden verworfen) — ein Strom von
  Hoch-N-Nachrichten kann den Tresor nicht unbegrenzt wachsen lassen.
> ### Invariante I: **ein Message-Key wird genau einmal verwendet.**
>
> Alles Weitere in diesem Abschnitt ist Durchsetzung dieses einen Satzes. Die
> Ableitung des IV aus dem Message-Key ist **kein** Schwachpunkt — sie ist
> sauber, *solange die Invariante hält*, und erspart eine separate
> Nonce-Buchführung. Gefährlich wird sie erst, wenn die Invariante **nur im
> Arbeitsspeicher** gilt: dann macht jeder Zustandsverlust aus einem
> wiederholten Key einen wiederholten Nonce. Genau das war der Fehler in den
> Gruppen-Sendepfaden (v0.16.2). Die Invariante muss deshalb **über die
> Persistenz hinweg** gelten, nicht nur innerhalb einer Sitzung.
>
> Durchsetzung: `encryptAndPersist` (Senden) schreibt den fortgeschrittenen
> Zustand **vor** dem Versand; der Empfangspfad schreibt ihn **unmittelbar nach
> dem Entschlüsseln**, vor jeder Inhaltsverarbeitung. Beim Empfang zählt dazu
> das Löschen des verbrauchten Skipped-Keys — *das* ist die Einmal-Verwendung
> auf der Empfangsseite.
>
> Die Commit-Kopie schützt nur die **sequenzielle** Verarbeitung. Liefert der
> Relay **denselben** Ciphertext gleichzeitig unter zwei Ack-IDs, klonten zwei
> nebenläufige `onInbox`-Läufe denselben *noch nicht committeten* Zustand und
> entschlüsselten ihn **beide** — ein Replay, den der Ratchet sonst per
> Konstruktion abweist. Deshalb läuft der gesamte Empfang jetzt durch **eine
> Promise-Kette** (pro Client serialisiert): kein zweiter Decrypt setzt auf,
> bevor der erste committet hat, und die Doppel-Zustellung wird zum gewöhnlichen,
> abgewiesenen Replay. Dieselbe Kette ordnet jede Nachricht **hinter** die
> Boot-Migration, die als ihr Kopf läuft.
>
> Auch **Senden** läuft durch dieselbe Kette (v0.19.2). `ratchetEncrypt` rückt
> `CKs`/`Ns` in-place vor; ein NEBENLÄUFIGER `ratchetDecrypt` klont den ganzen
> Zustand und committet ihn per `Object.assign` zurück — landete ein Send zwischen
> Klon und Commit, würde dieser Rücklauf den `CKs`-Vorlauf **zurückrollen**, und
> die nächste Nachricht nutzte (Key, Nonce) erneut = Two-Time-Pad. Die
> Empfangs-Serialisierung deckte anfangs nur receive-vs-receive; erst mit dem
> Send-Pfad in derselben Kette ist die Einmal-Verwendung auch send-vs-receive auf
> demselben Kontakt garantiert.

- **Commit-Disziplin beim Entschlüsseln (kritisch, v0.17.1):** `ratchetDecrypt`
  arbeitet auf einer **Kopie** und übernimmt sie erst, wenn die AEAD-Prüfung
  bestanden ist. Vorher mutierten `skipMessageKeys`, `dhRatchet` und das
  `delete` in `trySkipped` den Zustand direkt, und der Tag wurde erst danach
  geprüft — ohne Rollback. Einliefern in eine Inbox ist bewusst **auth-los**
  (nur so erreicht uns jemand, der unseren Code hat), und die Inbox-ID ist aus
  öffentlichem Material ableitbar. Ein zufälliger 32-Byte-X25519-Pubkey als
  `header.dh` plus 48 Byte Müll genügte damit, um den DH-Ratchet
  weiterzudrehen: `DHr`/`RK`/`CKr`/`CKs` überschrieben, Zähler zurückgesetzt,
  Session in **beiden** Richtungen dauerhaft tot — ohne jedes Schlüsselmaterial.
  Verschärft dadurch, dass `encryptAndPersist` den kaputten Zustand beim
  nächsten Senden auf Platte schrieb und der Absender **volle Haken** sah, weil
  der Relay alles angenommen hatte. Mit der Kopie ist zugleich der
  Skipped-Key-Verbrauch geschützt: eine Fälschung mit dem Header einer
  verzögerten echten Nachricht löschte bisher deren Message-Key endgültig.
- **Eingangsvalidierung als Choke-Point:** `decodeEnvelope` prüft jetzt Typen,
  Schlüssellängen und Zählerbereiche, bevor irgendein Wert Ratchet oder X3DH
  erreicht, und lehnt einheitlich mit `EnvelopeError` ab. Vorher erzeugte
  feindliche Eingabe je nach Stelle fünf verschiedene Exception-Typen
  (`SyntaxError`, `TypeError`, Base64-Fehler, `RangeError`) — und ein 2-Byte-
  DH-Key wurde stillschweigend akzeptiert und bis in `dhRatchet` durchgereicht.
  Nicht-Ganzzahlen werden abgewiesen statt truncated: `epochBytes(-1)` ergäbe
  `ffffffffffffffff`, die Abbildung wäre also nicht injektiv.
> ### Invariante II: **ein Ratchet-Zustandsübergang ist atomar.**
>
> Vollständig durchgeführt **und persistiert**, oder gar nicht. Kein
> Zwischenzustand verlässt den Speicher, keiner überlebt einen Fehlschlag.
>
> Das ist keine Sammlung von drei Vorfällen, sondern eine Aussage mit bisher
> vier Durchsetzungspunkten:
>
> | Übergang | Durchsetzung | Ohne sie |
> |---|---|---|
> | Senden | `encryptAndPersist` schreibt **vor** dem Versand | Nonce-Reuse nach Reload (v0.16.2) |
> | Empfangen | Persist **unmittelbar nach** dem Entschlüsseln, vor jeder Inhaltsverarbeitung | Replay eines verbrauchten Skipped-Keys (v0.16.3) |
> | Entschlüsseln | Draft-Kopie, Commit **nach** der AEAD-Prüfung | Ferngesteuerte Session-Zerstörung ohne Schlüsselmaterial (v0.17.1) |
> | X3DH-Antwort | OPK-Verbrauch und Session-Erzeugung sind **ein** Schritt | Entweder unbearbeitbares Retransmit oder wiederverwendbarer OPK |
> | Sim-Init-Tie-Break | `ratchet`/`pendingHeader` erst **nach** `respondX3DH` (Cert) und AEAD committen — auf Locals bauen | Ein gefälschter Prekey (öffentl. Master+signPub, Müll-Cert) zerstörte die in-flight-Session; ein gefälschtes `msg` löschte `pendingHeader` (v0.19.x) |
>
> Der Prüfauftrag für jeden künftigen Zustandsübergang — auch die, die Stufe 3c
> mitbringt — ist damit mechanisch: *Wo genau wird committet, und was passiert,
> wenn zwischen Mutation und Commit etwas fehlschlägt?*

- **Der IV wird abgeleitet, nicht übertragen** (`HKDF(MK)` → Key ‖ IV, 44 Byte).
  Das spart Bandbreite, macht die Persistenz des Chain-Keys aber
  **sicherheitskritisch**: derselbe Message-Key ergibt denselben Key *und*
  denselben Nonce. Ein Rollback des Sende-Chain-Keys ist damit kein harmloser
  Replay, sondern ein **Two-Time-Pad** — es leakt das XOR beider Klartexte und
  erlaubt die Rekonstruktion des GHASH-Authentifizierungsschlüssels, also auch
  **Fälschung**. `ratchetEncrypt` mutiert den Zustand in-place; deshalb läuft
  jeder ausgehende Pfad über `encryptAndPersist`, das den fortgeschrittenen
  Zustand **vor** dem Versand schreibt. Die Reihenfolge ist keine Präferenz,
  sondern die einzig korrekte, und die Asymmetrie ist total: schlägt der Versand
  fehl, ist die Chain trotzdem fortgeschritten — die nächste Nachricht nutzt
  einen frischen Key und hinterlässt nur eine Lücke, die der Skipped-Key-
  Mechanismus des Empfängers genau dafür auffängt. Umgekehrt (Send vor Persist)
  rollt ein Absturz auf einen Key zurück, der **schon auf der Leitung war**.
  Eine verlorene Nachricht ist heilbar, ein wiederverwendetes (Key, Nonce)-Paar
  nicht.
- **Empfangsseite ebenso:** `ratchetDecrypt` verbraucht einen Empfangs-Key
  (`CKr`/`Nr` wandern, und `trySkipped` **löscht** den benutzten Skipped-Key).
  Der Zustand wird daher **sofort nach dem Entschlüsseln** geschrieben, vor
  jeder Inhaltsverarbeitung — sonst stellt ein Reload den gelöschten Key wieder
  her und dieselbe Nachricht entschlüsselt ein zweites Mal: ein Replay-Fenster,
  das der Ratchet per Konstruktion schliesst. Milder als Nonce-Reuse, gleiche
  Ursache.

---

## 5. Transport & Server

`worker/relay.ts`, `worker/index.ts` · `src/lib/relay.ts`, `session.ts`

- **Durable Object = Briefkasten pro Inbox.** Nur Ciphertext, keine Schlüssel,
  kein Klartext.
- **Sealed Sender** (`src/crypto/seal.ts`): der komplette Wire-Envelope wird in
  einen **anonymen Box an den Empfänger** verpackt (libsodium `crypto_box_seal`
  = ephemerer Schlüssel, **kein Absender-Key im Ciphertext**). Damit sieht der
  Relay **nicht mehr**, *wer* einliefert, und auch die frühere `conv`-Paar-ID
  sowie die X3DH-Identitätsschlüssel des Absenders (erste Nachricht) sind
  **verborgen** — sie liegen jetzt *innerhalb* der Versiegelung. Der Relay
  lernt nur noch: *welche* Inbox (Empfänger), *wann*, *wie groß*. Absender-
  **Authentizität** bleibt erhalten — sie kommt aus dem X3DH/Ratchet *innen*,
  den der Empfänger nach dem Öffnen prüft. Die Versiegelung ist reiner
  Anonymitäts-Wrapper, nicht die Sicherheitsgrenze.
- **Inbox** = `SHA-256("scytale-inbox:" ‖ Ed25519-SignPub)` — aus der eigenen
  Identität ableitbar, man lauscht ohne jemanden zu kennen.
- **Owner-Auth per Ed25519-Challenge-Response**: DO schickt Nonce, Besitzer
  signiert, DO prüft `hash(signPub)==Inbox` **und** Signatur. Nur der Besitzer
  leert seine Queue — nicht jeder, der bloß den Code hat.
- **Store-and-Forward mit ehrlicher Zustell-Quittung**: SQLite-Queue. Beide
  müssen **nicht** gleichzeitig online sein. Jeder Send trägt eine `mid`; der DO
  antwortet nach dem Insert mit `{t:'sent', mid}`. Der Absender zeigt den Haken
  **erst nach diesem Ack** — bis dahin *pending* (blasser Haken). Kein Ack
  innerhalb ~10 s **oder** ein `nack` (Queue voll) → **„nicht zugestellt"**. Ein
  zwischen `send()` und DO-Verarbeitung verlorener Socket erzeugt so **keinen**
  falschen Haken mehr. **Invariante: einmal `sent`, immer `sent`** — ein spätes
  `nack`/Timeout kann eine bestätigte Zustellung nicht mehr zurückstufen (nur
  `failed → sent` als Recovery ist erlaubt), damit der Haken auch in die andere
  Richtung nicht lügt. Der Haken heißt „Relay hat's", **nicht** „gelesen".
- **Queue gedeckelt** (`MAX_QUEUE`=1000 pro Inbox): da Senden bewusst ohne Auth
  ist, begrenzt der Cap Flooding; bei Voll `nack` (+ `console.warn` **nur mit
  Zähler, ohne Inbox-ID** — Cloudflare-Logs sollen keine Metadaten sammeln).
  Heilt beim Leeren. **Replays** injizieren keine Nachrichten — der Double
  Ratchet lehnt bereits verbrauchte Message-Keys ab.
- **Ein-Richtungs-Onboarding**: Code weitergeben reicht; der andere schreibt
  zuerst, der Kontakt entsteht automatisch aus dem Prekey-Header.
- Es transitiert **ausschließlich Ciphertext**.

---

## 6. Web-/PWA-Härtung

`worker/index.ts`, `src/sw.ts`, `vite.config.ts`

- **CSP `default-src 'self'`**: keine externen Skripte/Styles/Fonts/Verbindungen —
  selbst ein erfolgreicher XSS kann keinen Schlüssel an einen fremden Server
  schicken. `script-src 'self' 'wasm-unsafe-eval'` (nur WASM: libsodium/hash-wasm);
  `connect-src 'self'`.
- **Weitere Header**: HSTS (2 J., inkl. Subdomains), `nosniff`, `Referrer-Policy:
  no-referrer`, `X-Frame-Options: DENY` / `frame-ancestors 'none'`, COOP+CORP
  `same-origin`, restriktive `Permissions-Policy` (Kamera/Mikrofon nur
  same-origin, Geo/Payment/USB aus).
- **Selbst gehostete Fonts** (kein CDN — bräche CSP und leakt IPs).
- **Precache**: die installierte PWA lädt die App-Shell aus dem SW-Cache.
- **Service-Worker-Update-Modus**: *Testphase* auf `autoUpdate` + network-first
  (schnelle Iteration, da ein veralteter Client nicht mit dem neuen Relay reden
  kann). **Vor Release zurück auf `prompt`** → kein unbeaufsichtigter Code-Tausch
  auf einem Security-Tool. *(Dieser Punkt ist bewusst noch offen, siehe Grenzen.)*
- **Non-extractable CryptoKeys durchgängig** (KEK, DEK, Device-Key, Message-Keys).

---

## 7. Metadaten-Sparsamkeit

- **EXIF/GPS entfernt**: Bilder vor dem Senden per Canvas neu kodiert,
  Orientierung vorher in die Pixel gebacken (`imagecompress.ts`, `avatar.ts`).
- **Profil (Name/Bild)** wird **E2E-verschlüsselt** an Kontakte geschickt, nicht
  über den öffentlichen Code.
- **Push-Benachrichtigungen inhaltslos**: nur Wecksignal, kein Absender/Text. Der
  SW hält keine Schlüssel und kann nicht entschlüsseln. VAPID/ES256-signiert;
  Abos nur über den **authentifizierten** Owner-Socket registrierbar; abgelaufene
  Endpoints (404/410) gelöscht; `pushsubscriptionchange` re-registriert.

---

## Reproducible-Build-Verifikation (für Auditoren, nicht Endnutzer)

Restrisiko einer PWA: der Server könnte manipuliertes JS ausliefern.
**Ehrliche Einordnung:** der Hash-Abgleich per DevTools ist realistisch nur für
Auditor:innen/Entwickler:innen — kein Schutz, den ein normaler Nutzer selbst
ausübt. Als echte Nutzer-Mitigation bräuchte es einen **unabhängigen Verifier,
der signierte Hashes veröffentlicht** (offen, siehe Grenzen). Für Prüfer gilt:
das ausgelieferte Bundle entsteht exakt aus dem öffentlichen Quellcode:

```bash
git checkout <commit>
npm ci --ignore-scripts
npm run build
find dist/assets -type f -name '*.js' -exec sha256sum {} \; | sort
# ... mit den live ausgelieferten Dateien vergleichen (DevTools → Network → Response).
```
Stimmen die Hashes, entspricht der laufende Code dem geprüften Quellcode.
(Voraussetzung: deterministischer Build — gleiche Node-/npm-Version.) Die im
Header angezeigte **Versionsnummer** hilft beim Abgleich, welcher Build läuft.

---

## Bekannte Grenzen 

- **Rest-Metadaten trotz Sealed Sender**: *wer* sendet und die `conv`-Paar-ID
  sind jetzt verborgen. Übrig bleibt, was das Empfänger-Adressieren zwangsläufig
  offenlegt: **welche Inbox** (Empfänger-pseudonym), **Timing** und **Größe** —
  plus **Netzwerk-Korrelation** (Absender-IP → Empfänger-Inbox), die kryptografie
  nicht abdeckt (bräuchte Tor/Mixnet). Gleiche Rest-Fläche wie Signals Sealed
  Sender; Traffic-Analyse bleibt hart.
- **Push-Timing** geht zwangsläufig an Apple/Google (dass ein Gerät *irgendeine*
  Nachricht bekam) → deshalb inhaltslos + opt-in.
- **Gruppen v1/v2**: „Soft"-Membership per Pairwise-Fan-out ohne kryptografisches
  Re-Keying — ein entferntes Mitglied behält alten Verlauf. Echte Forward-/
  Post-Compromise-Sicherheit bei Mitgliederwechsel bräuchte Sender-Keys/MLS (v3).
  Die **Absender-Anzeige** einer Gruppennachricht ist dennoch **nicht** fälschbar:
  sie wird aus dem kryptografisch authentifizierten Pairwise-Kontakt abgeleitet,
  **nie** aus dem mitgesendeten `senderName`-Feld, und eine Nachricht von einem
  Nicht-/entfernten Mitglied wird verworfen. Und `ensureMemberContact` prüft beim
  Anlegen eines Mitglied-Kontakts **Denylist + Device-Cert** — ein veralteter
  Roster kann keinen verlassenen Master über die Gruppen-Fläche wieder-pinnen.
- **Geräte-Revocation greift NICHT in Gruppen** (3c-Grenze): der Bearer-Guard
  prüft die master-signierte Geräteliste nur für 1:1-Kontakte. Gruppen-Mitglieder
  entstehen über `ensureMemberContact` ohne `peerDeviceList`, also ist der Guard
  für sie aus — ein Fan-out an ein widerrufenes Gerät eines Mitglieds wird nicht
  blockiert. Dieselbe Roster-Fläche, auf der master-basierte Bindung ohnehin nicht
  mehr gegen ein Zweitgerät verteidigt. Kommt mit v3/MLS; als ausführbare
  Zielvorgabe festgehalten in `tests/group-revocation.xfail.test.mjs`.
- **Gruppen × Geräte (3e-Grenze):** 3d-Fan-out + Self-Sync sind **1:1-only**.
  Eine Gruppennachricht erreicht **kein Zweitgerät** eines Mitglieds, und mein
  eigenes Zweitgerät sieht nie Gruppennachrichten von meinem anderen Gerät
  (`ensureMemberContact` ohne `peerDeviceList`, `gossipDeviceList` überspringt
  versteckte Kontakte, Self-Sync ist 1:1). Ein sichtbarer Hinweis im Gruppen-Chat
  sagt das, statt es als Nachrichtenverlust lesen zu lassen. Zweite offene
  Eigenschaft: die **Attachment-Kardinalität** in Gruppen (Σ Geräte × Mitglieder
  ist ein Verfügbarkeits-Hebel). Beide als ausführbare Zielvorgabe in
  `tests/group-device-fanout.xfail.test.mjs`; kommt mit 3e.
- **Self-Sync nur für GESENDETE Nachrichten** (Receive-Sync-Redundanz aufgeschoben):
  meine anderen Geräte sehen, was ich sende (sent-Kopie), und empfangene
  Nachrichten des Peers direkt über dessen Fan-out an meine Geräteliste. Erreicht
  ein Peer meine Geräte NICHT (pre-3d-Client, oder er hat meine Liste noch nicht
  gelernt), fehlt die empfangene Nachricht auf meinem Zweitgerät, bis der Peer die
  Liste sieht. **Reihenfolge über Geräte** ist Ankunfts-, nicht Compose-Zeit —
  eine offline nachgeladene Kopie kann out-of-order einsortiert werden (echte
  chronologische Konvergenz bräuchte einen autor-gestempelten Zeitstempel im Frame).
- **Zustell-Banner vs. Bubble (kosmetische 3d-Restkanten)**: der Zustell-Status
  jeder Nachricht ist die *Bubble* (`aggregateDelivery` über die aktuelle
  Geräteliste — stale/widerrufene Geräte fallen aus dem Nenner, siehe Test).
  Das globale Fehler-Banner ist nur ein zusätzlicher Hinweis und feuert seit
  v0.20.1 ausschließlich bei einem echten `pending→failed`-Übergang, nie für eine
  terminale (`sent`/`stale`) Zustellung. Zwei benigne Restkanten bleiben, beide
  ohne Krypto- oder Bubble-Auswirkung: (a) ein **missgebildeter Relay-Nack ohne
  `mid`** kann das Banner heben, obwohl keine Nachricht zuzuordnen ist — der echte
  Fehlschlag wird vom per-Zustellung armierten 10s-Timeout ohnehin *mit* Zuordnung
  gefangen; (b) feuert dieser Timeout (echter Timeout) *bevor* ein >10s später
  eintreffender Geräte-Widerruf die Zeile auf `stale` kippt, bleibt das Banner
  sichtbar, während die Bubble am Ende „zugestellt" aggregiert. Beides betrifft nur
  den Hinweis-Text, nicht den authentifizierten Zustell-Zustand.
- **Code-Delivery-Vertrauen**: in der Testphase `autoUpdate` (Server kann Code
  still aktualisieren) → vor Release auf `prompt`. Mitigiert per Reproducible
  Build, nicht eliminiert.
- **Endpoint**: gegen ein kompromittiertes Gerät (Malware, Client-Side-Scanning
  im OS, physischer Zugriff bei entsperrtem Tresor) hilft keine E2E-Krypto —
  genau das ist der Kern der Kritik an der Chatkontrolle.
- **Bundle-Austausch (MITM)**: das Bundle enthält nur öffentliche Schlüssel, der
  Kanal muss nicht geheim sein — aber ein Vertausch wird nur durch den
  **Safety-Number-Vergleich** erkannt.
- **Recovery vs. Device-Binding**: ohne Backup ist der Tresor bei Verlust der
  Website-Daten auf dem Gerät **unwiederbringlich** (Device-Binding). Der
  **opt-in Recovery-Export** (oben, §1) hebt das gezielt auf — er ist der
  bewusst akzeptierte, gegatete Exfiltrationspfad (zweite Auth + separate
  Passphrase). Wer ihn nicht nutzt, behält die volle Device-Bindung; wer ihn
  nutzt, ist für die Sicherheit von Datei **und** Export-Passphrase selbst
  verantwortlich.
- **Prekey-Downgrade**: fehlt im Bundle ein One-Time-Prekey, läuft X3DH regulär
  auf DH1–DH3 (nur die *erste* Nachricht hat dann reduzierte Forward Secrecy —
  wie im Signal-Standard). Ein aktiver Angreifer, der das Bundle *modifiziert*
  (OPK strippt), wird nur durch den Safety-Number-Vergleich erkannt.
- **Simultan-Aufbau-Tie-Break**: kryptografisch sind Initiator/Responder
  symmetrisch (gleiches SK, gleiche Ratchet-Sicherheit) — „Gewinnen" bringt
  keinen Vorteil außer, welche in-flight Erst-Nachricht das Rennen überlebt.
  Grinden auf einen kleinen Schlüssel ist damit nutzlos.
- **Bewiesene Tür — Producer bewusst verworfen (Design-Lock)**: der **Empfangspfad**
  der dual-signierten Rotation ist vorhanden (`acceptRotation` behält `verified`,
  über `kind:'rotation'` erreichbar, e2e-getestet), aber **dormant** — es gibt
  keinen automatischen **Producer**, der eine echte Rotations-Kette erzeugt. Der
  Producer (Co-Signatur beim Device-Linking) wurde nach einem Design-Lock
  **verworfen**: das gelinkte Gerät hält den neuen Master-Privkey nie (Signal-
  Modell), die Epoche müsste `> e_alt` **und** `≤ e_shared` sein (im Normalfall
  unerfüllbar → P müsste seine persistente Identität bumpen + die ganze
  Kontaktliste re-gossippen), und der bewiesene Re-Key kollidiert mit dem
  bewusst auf den Alt-Master gepinnten `ownMasterPub` (die „erfolgreiche" Rotation
  würde Kontakt und Gerät in **verschiedene Räume** stranden). Kosten und Ripple
  überwiegen den seltenen Nutzen (eine gesparte Safety-Number-Neuprüfung) klar.
  Jede reale Master-Rotation läuft daher über den sicheren **TOFU-Bruch**
  (`acceptMasterChange`, `verified` gelöscht, Safety Number neu vergleichen) —
  dieselbe eine Neuprüfung, ohne die Bruchgefahr.
- **Sender-Rate-Limiting**: die Queue ist gedeckelt (`MAX_QUEUE`), aber ein
  echtes Pro-Sender-Rate-Limit gegen gezieltes Fluten fehlt noch.

---

## Verantwortungsvolle Offenlegung

Sicherheitslücken bitte **nicht** über öffentliche Issues melden, sondern direkt
an den Repo-Betreiber.
