# Feature-Journal: offizieller SKYTALE-Admin-Account

## Dokumentstatus

- Feature-Branch: `feature/official-support-account`
- Basis: `main` bei Commit `2efe376` (`Fix owner inbox startup delivery`)
- Angelegt: 2026-07-31
- Letzte Aktualisierung: 2026-07-31, 14:58 CEST
- Arbeitsstatus: Kernimplementierung und erster Gesamttest sind fertig; adversariale Review-Funde werden unmittelbar behoben; noch nicht produktiv aktiviert
- Kanonischer Accountname: `ThePhantomPuppet`
- Sichtbarer Rollen-Badge: `ADMIN`
- Dauerhaft teilbarer Alias: `SKYTALE-SUPPORT`

Dieses Dokument ist Plan, Sicherheitsbegründung, Implementierungsprotokoll und
Betriebshandbuch für dieses Feature. Es wird während der Umsetzung fortlaufend
aktualisiert. Ein abgehakter Punkt bedeutet, dass der Code implementiert und in
mindestens der jeweils genannten Tiefe geprüft wurde. Nicht abgehakte Punkte sind
keine stillschweigenden Zusagen über den aktuellen Funktionsstand.

## 1. Ziel

SKYTALE bekommt genau eine offiziell erkennbare Admin-Identität. Nutzer sollen
den Account über einen kurzen, dauerhaft gültigen Textcode hinzufügen und dem
Account anschließend mit normaler Ende-zu-Ende-Verschlüsselung schreiben können.
Die Oberfläche zeigt den Account als `ThePhantomPuppet` und kennzeichnet ihn mit
einem roten `ADMIN`-Badge.

Der Badge darf nicht aus einem Serverfeld wie `admin: true`, aus dem Profil des
Gegenübers, aus einem Backup oder aus einer normalen Contact-Eigenschaft kommen.
Er wird nur angezeigt, wenn der installierte Client eine kryptografisch signierte
offizielle Account-Beschreibung gegen einen im Client fest eingebauten Offline-
Root-Public-Key geprüft hat und der darin gebundene Master-Key exakt dem gepinnten
Master-Key des Kontakts entspricht.

### Nutzerfluss

1. Ein Nutzer kopiert `SKYTALE-SUPPORT` von GitHub, einer Nachricht oder einer
   Supportseite.
2. Er öffnet SKYTALE und nutzt den bestehenden Verbinden-Dialog beziehungsweise
   „Aus Zwischenablage verbinden“.
3. Der Client erkennt den Alias, lädt die aktuelle signierte Beschreibung vom
   eigenen SKYTALE-Origin und prüft sie lokal.
4. Erst nach erfolgreicher Root-Signatur-, Zeit-, Rollback-, Master-, Zertifikats-
   und optionaler DeviceList-Prüfung wird der Kontakt angelegt.
5. In Kontaktliste, Chatkopf und Kontaktdetails steht `ThePhantomPuppet` mit dem
   textuellen Badge `ADMIN`. Das bestehende grüne Sicherheitsnummer-Häkchen bleibt
   davon vollständig getrennt.
6. Nachrichten benutzen unverändert X3DH/Double Ratchet, Relay-Inbox und die
   bestehende Geräteverwaltung. Der Worker sieht weiterhin keinen Klartext.

## 2. Nicht-Ziele und Sicherheitsgrenzen

- Kein globales Moderatoren- oder Superuser-Recht in Chats oder Gruppen.
- Kein serverseitiger Zugriff auf Nachrichten, Schlüssel, Vaults oder Profile.
- Kein spezieller Entschlüsselungsweg und keine Hintertür.
- Kein automatisch gesetztes `verified` für die Sicherheitsnummer. Der rote
  Rollen-Badge und die manuelle grüne Kontaktverifikation beantworten verschiedene
  Fragen und dürfen nicht vermischt werden.
- Kein privater Root-Key im Repository, Worker, Browser-Bundle, Cloudflare-Secret
  oder normalen SKYTALE-Vault.
- Kein Anspruch, einen vollständig kompromittierten App-Auslieferungskanal zu
  überleben: manipuliertes JavaScript könnte bei einer frischen Installation auch
  den eingebetteten Root-Key austauschen. Der Badge belegt die Identität relativ zu
  dem Vertrauensanker des installierten, unveränderten Clients.
- Der dauerhaft gültige Alias bedeutet nicht, dass ein einzelner Geräte-Prekey
  ewig benutzt wird. Der Alias bleibt konstant; die signierte Beschreibung und
  Geräteschlüssel können kontrolliert rotiert werden.

## 3. Bedrohungsmodell

### Zu verhindern

- Ein Relay-, Directory- oder CDN-Betreiber setzt selbst `admin: true`.
- Ein normaler Nutzer nennt sein Profil `ThePhantomPuppet` oder `ADMIN` und erhält
  dadurch den Badge.
- Ein Kontakt-Backup oder Gruppenmitglied schmuggelt einen Rollenstatus ein.
- Ein Angreifer ersetzt Bundle, Master-Key oder DeviceList auf dem Transportweg.
- Ein kompromittierter Directory-Worker spielt nach einer Rotation einen älteren,
  noch korrekt signierten Stand zurück.
- Zwei unterschiedliche Manifeste werden unter derselben Sequenz akzeptiert.
- Ein abgelaufenes oder noch nicht gültiges Manifest wird auf einer frischen
  Installation akzeptiert.
- Ein widerrufenes Gerät bleibt durch einen alten Bootstrap-Bundle-Eintrag der
  offizielle Einstiegspunkt.
- Ein übergroßes oder strukturell bösartiges JSON verursacht unbeschränkte Arbeit,
  Speicherverbrauch oder Signaturprüfungen.

### Weiterhin notwendige Betriebsannahmen

- Der Offline-Root-Private-Key bleibt offline und wird sicher verwahrt.
- Releases, welche den Root-Public-Key enthalten, werden aus vertrauenswürdigem
  Quellstand gebaut und ausgeliefert.
- Mindestens eine gültige, initiierbare Gerätebeschreibung des Admin-Accounts ist
  verfügbar und wird bei Gerätewechsel rechtzeitig neu signiert/veröffentlicht.
- `skytale.chat` und `scytale.illogical.workers.dev` bleiben beide aktive, gleich
  behandelte Produktionsorigins. Dieses Feature darf den workers.dev-Origin nicht
  entfernen oder als Altlast abschalten.

## 4. Vertrauenskette

Geplante Kette:

```text
im Client eingebetteter SKYTALE-Admin-Root-Public-Key
    -> Root-Signatur über kanonisches OfficialAccountManifest
        -> exakter Account-Master-Public-Key
        -> exakter Bootstrap-Bundle-Stand
        -> optional exakte master-signierte DeviceList
            -> Device-Zertifikat + signierter Prekey
                -> bestehendes X3DH + per-device Double Ratchet
```

Der Root-Key bestätigt ausschließlich die offizielle Rollenbindung. Der normale
Account-Master bleibt die stabile E2EE-Identität und signiert die Geräteliste.
Die Manifest-Signatur bindet den für den Erstkontakt verwendeten Stand exakt, damit
ein Directory keine beliebige alte Geräteliste für neue Nutzer auswählen kann.

**Festlegung für v1:** Bundle und optionale DeviceList sind nicht nur indirekt über
den Account-Master autorisiert, sondern ihre exakten kanonischen Bytes sind Teil
der Root-Signatur. Daher benötigt jede SPK-, Geräte- oder DeviceList-Rotation des
offiziellen Accounts eine höhere Manifestsequenz und eine neue Offline-Root-
Signatur. Das ist bewusst weniger bequem im Betrieb, schützt aber auch eine frische
Installation vor der Auswahl eines früher gültigen, inzwischen widerrufenen
Bootstrap-Geräts durch ein kompromittiertes Directory.

## 5. Geplantes Manifest

Das Drahtformat wird strikt versioniert und lässt keine unbekannten Felder zu.
Vorgesehene Felder:

| Feld | Bedeutung |
| --- | --- |
| `schema` | Formatversion, zunächst exakt `1` |
| `sequence` | strikt monotone, positive sichere Ganzzahl |
| `rootKeyId` | fest eingebettete Root-Key-Generation |
| `alias` | exakt `SKYTALE-SUPPORT` |
| `role` | exakt `admin` |
| `displayName` | exakt `ThePhantomPuppet` |
| `badge` | exakt `ADMIN` |
| `status` | `active` oder Notfallstatus `revoked` |
| `masterPub` | kanonisches Base64url eines 32-Byte-Ed25519-Master-Keys |
| `bundle` | selbstenthaltener, wiederverwendbarer Prekey-Bundle-Token ohne OPK |
| `deviceList` | optional: kanonisches Base64url der exakten DeviceList |
| `notBefore` | frühester akzeptierter Unix-Zeitpunkt in Millisekunden |
| `notAfter` | spätester akzeptierter Unix-Zeitpunkt in Millisekunden |
| `revokedMasters` | kanonische (strikt aufsteigende, de-duplizierte) Liste von 32-Byte-Master-Keys, die dieser Stand als widerrufen führt; nie der eigene `masterPub`. Jeder Nachfolger trägt sie fort, damit ein Client den Widerruf auch ohne den transienten `revoked`-Head lernt |
| `signature` | kanonisches Base64url einer 64-Byte-Ed25519-Root-Signatur |

Signiert wird nicht beliebig serialisiertes Objekt-JSON, sondern eine feste,
domänengetrennte Bytefolge aus einer positionsgebundenen Feldliste. Dadurch ändern
Objektreihenfolge, Whitespace oder Parserdetails nicht die signierte Bedeutung.

Geplante Domäne: `SKYTALE/OFFICIAL-ACCOUNT-MANIFEST/v1\0`.

## 6. Rollback- und Freshness-Schutz

- Der Worker nimmt nur eine höhere `sequence` an; ein identischer Retry derselben
  Sequenz darf idempotent sein, ein abweichender Inhalt derselben Sequenz nicht.
- Der Client hält den höchsten vollständig geprüften Stand samt Inhaltsdigest als
  lokalen Floor. Eine kleinere Sequenz oder ein anderer Inhalt unter gleicher
  Sequenz wird verworfen.
- Das Release enthält zusätzlich einen minimal akzeptierten Sequenz-Floor. Damit
  kann ein späteres Release bekannte alte Manifeste auch auf einer Neuinstallation
  sperren.
- `notBefore`/`notAfter` begrenzen Freshness für Neuinstallationen, die noch keinen
  lokalen Floor besitzen. Der Alias selbst bleibt dauerhaft; nur seine dahinter
  liegende Beschreibung wird vor Ablauf erneuert.
- Der lokale Cache enthält nur das signierte öffentliche Manifest. Vor jeder
  Verwendung wird die Signatur und Gültigkeit erneut geprüft; gecachte Boolean-
  Ergebnisse werden nicht vertraut.
- Ein Notfall-Widerruf benötigt eine neue, höhere, root-signierte Sequenz. Danach
  darf kein Badge mehr aus dem alten Stand entstehen.

## 7. Client-Implementierung

### Bibliotheksgrenzen

Geplant sind getrennte Module für:

- feste öffentliche Konfiguration und Root-Key-ID;
- streng typisiertes Manifest, kanonische Serialisierung und äußere Prüfung;
- browserseitige Auflösung, begrenztes Response-Lesen, Root-Signaturprüfung,
  Bundle-/DeviceList-Prüfung und Rollback-Cache;
- kleine reine Funktionen `isOfficialAdminContact` und kanonische Anzeigeableitung;
- versiegelte beziehungsweise originweite Persistenz des zuletzt geprüften
  öffentlichen Trust-Standes, ohne Änderung am `Contact`-Drahtformat.

### Kontaktimport

Der Alias wird am Anfang des bestehenden `addBundle`-Pfads erkannt. QR, manuelle
Eingabe und Clipboard benutzen bereits diesen Pfad; deshalb entsteht kein zweiter,
schwächerer Kontaktimport.

Nach der Alias-Auflösung gelten zusätzlich zum bestehenden `decodeBundle` und
`makeContact`:

1. eingebetteter Root-Key ist vorhanden und hat exakt 32 Byte;
2. Responsegröße und Content-Type sind korrekt;
3. Manifest hat ausschließlich erlaubte Felder und kanonische Encodings;
4. Root-Signatur, Zeitfenster und Sequenz-Floor sind gültig;
5. Bundle enthält keinen verbrauchbaren One-Time-Prekey;
6. Bundle-Master entspricht exakt `manifest.masterPub`;
7. Device-Zertifikat und Signed Prekey bestehen die existierenden Prüfungen;
8. falls vorhanden: DeviceList-Master/Epoch/Version/Signatur/Zertifikate stimmen,
   und das Bootstrap-Gerät ist mit exakt den gebundenen Schlüsseln enthalten;
9. eigener Master-Key wird weiterhin als Selbstkontakt abgewiesen;
10. erst nach erfolgreichem Speichern werden Chat und Relay-Verbindung geöffnet.

### Laufzeit-Vertrauen und UI

- `Contact` erhält bewusst kein Feld `admin`, `official`, `role` oder Ähnliches.
- Nach Start wird ein gecachtes Manifest vollständig neu geprüft und parallel ein
  aktueller Stand geladen. Bei Fehlern wird fail-closed kein Badge angezeigt.
- Ein Kontakt ist nur dann Admin, wenn sein gepinnter `peerMasterPub` bytegenau dem
  aktuell geprüften Manifest-Master entspricht.
- Für diesen Kontakt überschreibt der kanonische Name `ThePhantomPuppet` sowohl
  Peer-Profilname als auch lokalen Spitznamen in der Primäranzeige. Ein Angreifer
  darf den offiziellen Namen nicht durch Metadaten verdecken.
- Der rote Badge enthält immer den sichtbaren Text `ADMIN`; Farbe allein trägt
  keine Bedeutung. Screenreader erhalten eine eindeutige Rollenbezeichnung.
- Rendering in Kontaktliste, Chatkopf und Kontaktdetails; zusätzlich werden
  relevante Kontaktpicker/Gruppenlisten auf uneindeutige Darstellungen geprüft.
- Bestehender grüner `verified`-Badge bleibt unverändert und separat sichtbar.
- Keine dauerhafte, häufige Animation; Hover/Focus/Touch-Ziele und breite wie
  schmale Layouts werden geprüft.

## 8. Worker- und Durable-Object-Implementierung

### Route

Vorgesehen:

- `GET /api/official-accounts/skytale-support` löst den Alias auf;
- `PUT /api/official-accounts/skytale-support` veröffentlicht einen bereits
  root-signierten höheren Stand.

Der Alias steht in der URL, aber keine geheime Capability und kein Nachrichten-
oder Inbox-Identifier. Die Antwort wird trotzdem mit `no-store`, `nosniff`, den
allgemeinen SKYTALE-Sicherheitsheadern und ohne permissives CORS ausgeliefert.

### Autorisierung

Es gibt kein langlebiges API-Token und kein Admin-Passwort im Worker. Eine
Veröffentlichung ist nur gültig, wenn die Manifest-Signatur zum fest konfigurierten
Root-Public-Key passt. Die zu veröffentlichenden Daten sind ohnehin öffentlich;
Besitz der Offline-Root-Signatur ist die Autorisierung.

### Persistenz und Konkurrenz

- Ein SQLite-backed Durable Object pro kanonischem Alias über `getByName(alias)`.
- Eine atomare Tabelle mit Sequenz, kanonischem Manifest und Aktualisierungszeit.
- Strictly-higher-update; byteidentischer Retry derselben Sequenz ist idempotent.
- Kein globaler Directory-Singleton für unabhängige zukünftige Aliase.
- RPC-Aufrufe statt interner Fetch-Sonderprotokolle.
- Strikte Requestgrößen-, Method-, Content-Type-, Origin- und Rate-Limits vor
  Signaturprüfung beziehungsweise Persistenz.
- Neue Wrangler-Migration; `workers_dev = true` und beide Produktionsorigins
  bleiben ausdrücklich unangetastet.

## 9. Offline-Root und Betriebswerkzeuge

Implementiert ist ein kleines Node-Werkzeug mit diesen Operationen:

1. Root-Schlüsselpaar offline erzeugen;
2. Private-Key-Datei nur an einen expliziten Pfad schreiben und restriktive
   Dateirechte setzen;
3. ausschließlich den Public Key für die eingecheckte Client-/Worker-Konfiguration
   ausgeben;
4. aus einem aktuellen Admin-Bundle, optionaler DeviceList, Sequenz und
   Gültigkeitsfenster ein kanonisches Manifest erzeugen und signieren;
5. ein bestehendes Manifest lokal vollständig verifizieren;
6. optional den signierten öffentlichen Stand gegen die Worker-Route publizieren.

Das Tool darf niemals Root-Private-Key-Material ins Repository, in Logs, Shell-
Kommandozeilenargumente oder in die PWA schreiben. Wo möglich wird der Key über
eine Datei eingelesen und die Signatur lokal erzeugt. Aktivierungsschritte werden
in einer separaten Checkliste dokumentiert.

Wichtig: Während der Feature-Implementierung wird kein echter Produktions-Root-
Private-Key automatisch erzeugt oder eingecheckt. Die Aktivierung benötigt eine
bewusste, offline ausgeführte Zeremonie des Projektinhabers.

## 10. Testplan

### Kryptografie und Parser

- gültige Root-Signatur wird akzeptiert;
- falscher Root, Signaturbitflip und Feldänderung werden abgewiesen;
- unbekannte/fehlende/doppeldeutige Felder und nicht-kanonisches Base64url werden
  abgewiesen;
- Alias, Rolle, Name und Badge müssen exakt den festgelegten Werten entsprechen;
- Grenzwerte für Sequenz, Zeit und Größen;
- `notBefore`, Ablauf und Clock-Skew;
- Bundle-/Master-Mismatch, OPK, ungültiges Device-Zertifikat oder SPK;
- DeviceList-Master-Mismatch, alte Epoch/Version, ungültige Signatur, doppeltes
  Gerät und abweichender Bootstrap-Eintrag;
- kleinere Sequenz und Same-sequence-equivocation nach einem gespeicherten Floor;
- gecachter Stand wird bei jedem Laden erneut verifiziert;
- ein normaler Kontakt mit Name `ThePhantomPuppet` erhält keinen Badge.

### Worker/DO

- Binding, SQLite-Migration und Export sind korrekt;
- GET/PUT-Methoden und exakter Alias;
- same-origin Mutation, Content-Type und Bodylimit;
- Rate-Limit vor teurer Prüfung;
- ungültige Root-Signatur erreicht die Persistenz nicht;
- initialer Publish, strictly-higher Publish, idempotenter Retry, Konflikt bei
  gleicher Sequenz und anderer Nutzlast;
- parallele Updates enden deterministisch beim höchsten gültigen Stand;
- Resolver gibt nur kanonisch gespeicherte Daten und keine internen Metadaten aus;
- Fehlerantworten enthalten keine Schlüssel-/Manifestdetails;
- beide Produktionsorigins und `workers_dev = true` bleiben erhalten.

### UI und Regression

- Alias wird vor SK1-/URL-Bundle-Erkennung behandelt;
- Clipboard, Eingabefeld und QR nutzen denselben sicheren Importpfad;
- Name/Badge in Liste, Kopf und Detail;
- sichtbarer Text, ARIA-Beschreibung, Kontrast und schmale/breite Layouts;
- grüner Verifikationsstatus wird weder gesetzt noch versteckt;
- Rename-/Profilmetadaten können die offizielle Primäridentität nicht verdecken;
- bestehende Kontaktcodes bleiben auf 24 Stunden begrenzt;
- normale QR-/Link-Flows, Inbox-Empfang, Gruppen, Backups, Duress/Decoy und PWA-
  CSP bleiben grün.

### Abschlussprüfungen

- `npm test`
- `npm run check`
- `npm run build`
- gezielte Worker- und Manifesttests
- statische Suche nach unerwünschten `admin: true`-/Contact-Persistenzpfaden
- Review des finalen Diffs gegen Bedrohungsmodell und Cloudflare-Best-Practices

## 11. Implementierungsphasen

- [x] Isolierten Branch `feature/official-support-account` von aktuellem `main`
  in separatem Worktree angelegt.
- [x] Parallel laufenden, schmutzigen Gruppen-Branch als fremden Arbeitsstand
  erkannt und nicht gewechselt, bereinigt oder überschrieben.
- [x] Aktuelle Cloudflare Workers Types (`5.20260731.1`) und die installierte
  Wrangler-Konfigurationsschema-Struktur für Durable Objects/Rate Limits geprüft.
- [x] Relevante Cloudflare-, Durable-Object-, Workers-Best-Practices- und UI-
  Designregeln vollständig gelesen.
- [x] Produktvorgaben präzisiert: Badge `ADMIN`, Name `ThePhantomPuppet`, Alias
  `SKYTALE-SUPPORT`.
- [x] Manifest- und Konfigurationsmodule implementieren.
- [x] Clientseitige Signatur-/Zeit-/Rollback-/Bundle-/DeviceList-Prüfung
  implementieren.
- [x] Trust-Cache ohne Contact-Rollenfeld implementieren.
- [x] SQLite-Durable-Object, Worker-Routen, Bindings, Migration und Rate Limits
  implementieren.
- [x] Alias in den bestehenden Kontaktimport integrieren.
- [x] Laufzeitabgeleiteten Namen und `ADMIN`-Badge in Kontaktliste, Chatkopf und
  Kontaktdetail
  integrieren.
- [x] Offline-Key-/Signier-/Verifizierwerkzeug implementieren.
- [x] Public-only DeviceList-Exportpfad fertigstellen.
- [x] Kryptografie-, Worker-, UI- und Regressionstests ergänzen.
- [x] Ersten vollständigen Gesamttest, App-/Worker-Typecheck und Produktionsbuild
  erfolgreich ausführen.
- [x] Aktivierungs-, Rotations- und Widerrufsanleitung fertigstellen (§13/§14).
- [x] Adversariale Security-Diff-Reviews vollständig abarbeiten und alle Befunde
  hier samt Entscheidung/Fix ergänzen (drei Reviews; Funde A/B behoben, §16/§14).
- [x] Branch mit bewusst abgegrenztem Commit abschließen.

## 12. Getroffene Betriebsentscheidungen

1. **Produktions-Root-Key:** Er wird nicht durch diesen Branch erzeugt. Bis zur
   bewussten Offline-Zeremonie bleibt der eingecheckte Public-Key-Wert leer und
   Client wie Worker verhalten sich fail-closed. Der Private Key darf weder auf
   einem normalen Entwicklungsrechner noch auf einem Online-Publish-Host liegen.
2. **Dauerhafter Code, sehr lange signierte Lease:** `SKYTALE-SUPPORT` ändert sich
   nie und läuft als Nutzeradresse nicht ab. Das dahinterliegende root-signierte
   Manifest läuft bewusst mit einer sehr langen Lease (Obergrenze ~187 Jahre),
   damit der Operator nur bei einer echten Änderung (neues Gerät, Key-Rotation)
   neu signiert und nicht nach der Uhr. Der Replay-Schutz für frische Clients ruht
   damit auf dem Release-Floor (§14.3), nicht auf diesem Timer; Nutzer müssen weder
   neue Codes lernen noch etwas bestätigen.
3. **DeviceList:** Sequenz 1 darf zur Bootstrap-Aktivierung nur das OPK-freie
   Bundle enthalten. Sobald der Admin-Client den eigenen root-signierten Master
   erkennt, steht im Profil der public-only Deskriptor-Export bereit. Sequenz 2
   bindet anschließend die vollständige aktuelle, master-signierte DeviceList.
4. **Rotation:** Jede Änderung an Bootstrap-Gerät, SPK oder DeviceList benötigt
   einen neuen öffentlichen Deskriptor, eine strikt höhere Manifestsequenz und
   eine neue Offline-Root-Signatur. Der Alias bleibt dabei identisch.
5. **Revocation:** Ein Widerruf ist selbst ein höheres root-signiertes Manifest.
   Zusätzlich wird `OFFICIAL_ACCOUNT_MIN_SEQUENCE` in einem zeitnahen Release auf
   mindestens diese Sequenz gehoben. Damit können auch Installationen ohne lokalen
   Floor alte Stände nach dem Release nicht mehr akzeptieren.
6. **Branch-Veröffentlichung:** Implementierung und Dokumentation werden lokal
   geprüft und bewusst committed. Push, Merge und Produktionaktivierung sind
   getrennte externe Schritte und werden nur entsprechend Nutzeranweisung ausgeführt.
7. **Inbox-Availability:** Verpflichtendes Hashcash wird nicht in diesen Branch
   aufgenommen. Es verschlechtert Latenz und Akku schwacher Telefone stärker als
   es GPU-/Botnet-Angreifer bremst. Faire serverseitige Official-Inbox-Quoten sind
   der bevorzugte spätere Schutz und werden vor Aktivierung separat bewertet.

## 13. Exakter Aktivierungsablauf

Die folgenden Schritte sind bewusst in Offline-, Review-/Deploy- und Online-
Phasen getrennt. Ein Schritt darf erst fortgesetzt werden, wenn seine Prüfung
erfolgreich war. Die Beispielpfade außerhalb des Repositories müssen an das echte
verschlüsselte Offline-Medium angepasst werden.

### 13.1 Admin-Account vorbereiten

1. Einen normalen primären SKYTALE-Account anlegen und ausschließlich als
   offiziellen Admin-Kanal verwenden.
2. Optional den eigenen Profilnamen auf `ThePhantomPuppet` setzen. Für den Badge
   ist das nicht vertrauenswürdig und nicht erforderlich; die geprüfte UI erzwingt
   später den kanonischen Namen aus dem Manifest.
3. In „Kontakt teilen“ den selbstenthaltenen QR-Link beziehungsweise das Bundle
   kopieren. Es muss das aktuelle Bundle v2 ohne OPK sein.
4. Noch keine öffentliche GitHub-Dokumentation mit `SKYTALE-SUPPORT` veröffentlichen.

### 13.2 Root-Zeremonie vollständig offline

Voraussetzungen: geprüfter Quellstand, lokal vorhandene Abhängigkeiten, kein Netz,
verschlüsseltes Wechsellaufwerk und eine zweite verschlüsselte Offline-Sicherung.

```bash
npm run official-admin -- init-root \
  --private-key /media/OFFLINE-SKYTALE/skytale-admin-root-v1.json
```

1. Das Werkzeug gibt ausschließlich den Public Key aus. Der Private Key bleibt in
   seinem verschlüsselten Container auf dem Offline-Medium.
2. Den angezeigten unpadded Base64url-Public-Key über einen kontrollierten Kanal
   in `OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL` eintragen.
3. Private Root-Datei und Entsperrpassphrase getrennt sichern. Keine Cloud-Sync-
   Ordner, Screenshots, Shell-History, CI-Artefakte oder Passwortargumente benutzen.
4. Den Public Key über einen zweiten Kanal beziehungsweise eine zweite Person
   bytegenau gegenprüfen.
5. Sequenz 1 offline signieren:

```bash
npm run official-admin -- sign \
  --private-key /media/OFFLINE-SKYTALE/skytale-admin-root-v1.json \
  --bundle '<vollständiger SKYTALE-QR-Link oder 355-Zeichen-Bundle>' \
  --sequence 1 \
  --valid-days 30 \
  --output /media/TRANSFER/admin-manifest-seq-1.json
```

6. Das Werkzeug muss das Ergebnis über denselben Parser sowie Root-, Bundle-,
   Zertifikats- und SPK-Prüfpfad wie die PWA validieren. Nur das öffentliche
   Manifest darf auf das Online-System übertragen werden.

### 13.3 Public Root reviewen und ausrollen

1. Prüfen, dass ausschließlich der 32-Byte-Public-Key eingecheckt wurde und weder
   Root-Container, Passphrase noch privates PKCS#8 im Diff, Git-Index, Build oder
   CI-Log vorkommen.
2. App und Worker aus demselben geprüften Commit bauen. `workers_dev = true`,
   `skytale.chat` und `scytale.illogical.workers.dev` müssen aktiv bleiben.
3. Erst Client/Worker mit dem Public Root ausrollen. Die Directory-Route darf vor
   dem ersten Publish noch `404` liefern; sie darf niemals einen Badge ohne
   gültiges Manifest erzeugen.

### 13.4 Öffentliches Manifest online publizieren

Der Online-Host benötigt ausschließlich das öffentliche Manifest und den bereits
eingecheckten Public Key, niemals den Private Root:

```bash
npm run official-admin -- publish \
  --manifest /safe/online/admin-manifest-seq-1.json \
  --origin https://skytale.chat
```

Der Publish-Befehl muss nach dem PUT einen GET-Readback durchführen und den
kanonischen Inhalt samt Digest bytegenau bestätigen. Danach zusätzlich von beiden
aktiven Origins lesen und die Gleichheit prüfen:

```bash
curl --fail --silent --show-error \
  https://skytale.chat/api/official-accounts/skytale-support \
  --output /tmp/skytale-admin-custom.json
curl --fail --silent --show-error \
  https://scytale.illogical.workers.dev/api/official-accounts/skytale-support \
  --output /tmp/skytale-admin-workers-dev.json
cmp /tmp/skytale-admin-custom.json /tmp/skytale-admin-workers-dev.json
```

Die temporären Dateien enthalten nur öffentliche Daten und werden nach dem Review
entfernt. Ein Publish auf einem Origin aktualisiert bei der vorgesehenen gemeinsamen
Worker-/DO-Bereitstellung denselben Head; der Zwei-Origin-Vergleich bleibt Pflicht.

### 13.5 DeviceList binden

1. Den aktualisierten Admin-Account entsperren und den Hintergrund-Refresh abwarten
   beziehungsweise die PWA einmal in den Vordergrund holen.
2. Unter „Profil“ erscheint nur für den exakt root-bestätigten eigenen Master
   „Öffentlichen Admin-Deskriptor exportieren“.
3. Den JSON-Deskriptor auf das Transfermedium kopieren. Er enthält exakt `v`,
   OPK-freies `bundle` und öffentliche master-signierte `deviceList`.
4. Offline mit `--descriptor`, Sequenz 2 und 30 Tagen signieren; anschließend wie
   oben online publizieren und auf beiden Origins read-back-verifizieren.
5. Sequenz 2 ist der vorgesehene erste vollständig betriebsfähige Multi-Device-
   Stand. Erst danach darf der Alias öffentlich auf GitHub erscheinen.

### 13.6 Abnahmetest vor Veröffentlichung auf GitHub

- Frische reale PWA-Installation auf mindestens einem iPhone/iPad und einem
  Android-/Desktop-Gerät.
- `SKYTALE-SUPPORT` per Eingabe und Zwischenablage hinzufügen; der QR-Normalpfad
  bleibt separat unverändert funktionsfähig.
- Kontakt heißt exakt `ThePhantomPuppet`; rotes Schild plus sichtbarer Text
  `ADMIN` in Liste, Header, Detail und Kontaktpickern.
- Ein gewöhnlicher Account mit gleichem Namen/Avatar erhält niemals den Badge.
- Grüne Safety-Number-Verifikation bleibt unabhängig und zunächst ungesetzt.
- Nachricht an den Admin senden, Admin-PWA dabei zunächst offline lassen, danach
  öffnen und Empfang/Antwort/Delivery-Receipt prüfen.
- Test mit allen aktiven Admin-Geräten; jede DeviceList-Adresse muss erreichbar
  sein, entfernte Geräte dürfen nicht weiter als Ziel verwendet werden.
- Manifest-Widerruf in einer nichtproduktiven Testsequenz prüfen: sichtbare Warnung
  und Sendesperre müssen in einem geöffneten Tab spätestens beim Foreground-
  Refresh beziehungsweise innerhalb von 15 Minuten erscheinen.

Erst wenn alle Punkte grün sind, darf GitHub dauerhaft `SKYTALE-SUPPORT` und den
zugehörigen QR-Code veröffentlichen. Der QR-Code für den Remote-Fall sollte den
kurzen Alias kodieren, nicht das lange Bundle und keinen Origin-Link.

## 14. Laufender Betrieb

### 14.1 Erneuerung ohne Nutzeränderung

- Kalenderalarme 14, 7 und 2 Tage vor `notAfter` setzen.
- Aktuellen public-only Deskriptor exportieren.
- Offline mit nächster Sequenz für 30 Tage signieren.
- Öffentliches Manifest online publizieren und auf beiden Origins read-back-
  verifizieren.
- Alias, GitHub-Text und Nutzerkontakt bleiben unverändert.

Bestehende Kontakte können auch bei versäumter Lease-Erneuerung grundsätzlich über
ihre E2EE-Sessions kommunizieren; der Client entzieht jedoch den offiziellen Badge
und neue Alias-Auflösungen scheitern sicher. Eine abgelaufene Lease darf nicht durch
Zurückdrehen der Uhr oder Wiederveröffentlichen einer alten Sequenz „repariert“
werden; es ist immer eine höhere Sequenz zu signieren.

### 14.2 Geräteänderung, SPK-Wechsel oder Restore

1. Geräteverwaltung vollständig abschließen und kontrollieren, dass entfernte
   Geräte nicht mehr in der master-signierten DeviceList stehen.
2. Neuen public-only Deskriptor exportieren.
3. Offline nächste Sequenz signieren; Bundle und DeviceList müssen dasselbe
   Bootstrap-Gerät, dieselbe Epoch und denselben SPK enthalten.
4. Publizieren, Readback prüfen, dann erst das alte Gerät außer Betrieb nehmen.
5. Ein Recovery-Backup erzeugt absichtlich eine neue Geräteidentität. Der offizielle
   Alias muss deshalb unmittelbar danach mit neuem Deskriptor/Manifest aktualisiert
   werden, bevor Support wieder als verfügbar gilt.

### 14.3 Notfallwiderruf

1. Letzten bekannten öffentlichen Deskriptor auf dem Offline-System verwenden.
2. Mit strikt nächster Sequenz und `--status revoked` signieren. Beim späteren
   Wechsel auf einen sauberen Master trägt `--supersedes <letztes-Manifest>` den
   bisherigen Widerrufsatz automatisch fort, und `--revoke <alter-Master>` nimmt den
   kompromittierten Master dauerhaft in die signierte `revokedMasters`-Liste auf. So
   bleibt der frühere Master auch für Clients gesperrt, die den `revoked`-Head nie
   gesehen haben; ein Nachfolge-Head, der einen bekannten Tombstone fallen ließe,
   wird vom Client als beschädigt abgewiesen.
3. Sofort online publizieren und beide Origins prüfen.
4. `OFFICIAL_ACCOUNT_MIN_SEQUENCE` in einem Notfallrelease mindestens auf die
   Widerrufssequenz erhöhen und PWA/Worker ausrollen.
5. Ein widerrufener historischer Admin-Kontakt verliert nicht nur den Badge: Die
   UI muss persistent warnen und normales Senden blockieren, bis ein neuer aktiver
   root-signierter Stand über den Alias verbunden wurde.
6. Bei bloßem Gerätekompromiss anschließend sauberes Gerät/DeviceList mit höherer
   Sequenz aktivieren. Bei Root-Kompromiss keine weitere Signatur des alten Roots
   vertrauen; neue Root-Key-ID, neuer Public Root und geprüftes Release sind nötig.

Der Trust-Record ist nach `rootKeyId` getrennt, damit eine spätere Root-Generation
nicht durch einen Cache der alten Generation blockiert wird. Root-Rotation bleibt
trotzdem ein Release-/Migrationsereignis und kein normaler Manifest-Publish.

## 15. Verbleibende Sicherheitsgrenzen und Folgearbeiten

### Frischer Client ohne bekannten Sequenz-Floor

Der ehrliche SQLite-Durable-Object-Head ist monoton. Ein vollständig kompromittierter
Directory-/App-Worker könnte einem frischen Client ohne lokalen Stand jedoch ein
archiviertes, noch zeitgültiges und korrekt root-signiertes Manifest liefern. Ohne
unabhängigen aktuellen Witness kann der Client nicht mathematisch wissen, welches
von mehreren gültig signierten Dokumenten das neueste ist.

Mitigationen dieses Branches:

- die Lease-Obergrenze ist bewusst auf ~187 Jahre gesetzt und daher KEINE
  praktische Replay-Zeitschranke mehr — der Schutz frischer Clients ruht damit
  allein auf dem Release-Floor (nächster Punkt);
- lokaler monotoner Floor mit Same-sequence-Equivocation-Schutz;
- Release-Floor, der im Notfall sofort angehoben wird;
- Foreground-Refresh und 15-Minuten-Poll für bereits laufende Clients;
- Widerruf als höheres root-signiertes Dokument.

Für eine stärkere Garantie ist später ein unabhängiger Transparency-/Witness-Kanal
notwendig. Er muss Datenschutz, PWA-Offline-Verhalten, Zwei-Origin-Ausfall und
Supply-Chain-Bedrohungen separat modellieren; ein zweites Feld desselben Workers
wäre kein unabhängiger Witness.

### Öffentliche Admin-Inbox

Aus dem veröffentlichten Device-Sign-Key ist die Relay-Inbox-ID ableitbar. Inhalte
bleiben E2EE, aber ein verteilter Angreifer kann Offline-Queue, Push-Wakes und Admin-
Client-CPU belasten. Actor-/Room-Limits helfen gegen Einzelquellen, lösen Botnets
nicht vollständig.

Nicht gewählt: verpflichtendes SHA-256-Hashcash. Lokale Messung ergab bei 18 Bit
im Mittel etwa 0,64 Sekunden auf einem schnellen Desktop beziehungsweise etwa
2,62 Sekunden bei 100.000 Hashes/s; p95 liegt deutlich höher. Mobilgeräte tragen
damit die Kosten, GPU-/Botnet-Angreifer kaum.

Bevorzugte Folgearbeit ohne Nutzerinteraktion:

1. root-autorisierte Official-Inbox-IDs beim Publish dauerhaft im jeweiligen
   RelayRoom arming;
2. byte- und zeilenbasierte faire Queue-Anteile pro kurzlebigem, geheim gehashtem
   Actor-Tag;
3. strengere Official-Inbox-Tages-/Minutenlimits und aggregierte Metriken ohne
   Inbox-ID;
4. erst bei real gemessenem Missbrauch adaptive, socketgebundene PoW-Credits als
   zweite Stufe und nur nach Tests auf Low-End-iOS/Android.

Diese Availability-Härtung ist ein eigener Protokoll-/Worker-Branch. Sie darf nicht
unbemerkt normalen Relay-Traffic, Gruppen oder die zwei aktiven Origins verändern.

## 16. Arbeitsprotokoll

### 2026-07-31, 14:05–14:06 CEST

- Ausgangslage verifiziert: `main` und `origin/main` zeigen auf `2efe376`.
- Der vorhandene Checkout `feature/group-e2ee` enthält parallele Änderungen und
  blieb vollständig unangetastet.
- Separaten Worktree `/home/the_puppet/Dokumente/SCYTALE-official-support` mit
  neuem Branch `feature/official-support-account` angelegt.
- Abhängigkeiten reproduzierbar per `npm ci` installiert; Audit meldete zu diesem
  Zeitpunkt 0 bekannte npm-Schwachstellen.
- Neueste veröffentlichte `@cloudflare/workers-types`-Version abgefragt und die
  konkreten DO-RPC-, `getByName`, SQLite-Storage-, `transactionSync`- und RateLimit-
  Typen geprüft.
- Bestehende Kontaktcode-, Bundle-, DeviceList-, Contact-, Inbox-, Worker- und UI-
  Pfade kartiert. Zentrale Feststellung: Der sichere Import muss in `addBundle`
  vor der bisherigen SK1-/URL-Auflösung beginnen; ein Rollenfeld in `Contact`
  wäre eine unnötige und fälschbare zweite Vertrauensquelle.
- Nutzerpräzisierung eingearbeitet: kein „Support“-Badge, sondern exakt `ADMIN`;
  offizieller Anzeigename exakt `ThePhantomPuppet`.
- Dieses lebende Feature-Journal angelegt.

### 2026-07-31, 14:06–14:25 CEST

- Binäres, domänengetrenntes Manifest-Transcript implementiert. Parser akzeptiert
  ausschließlich exakte Felder, Werte, sichere Ganzzahlen und kanonisches Base64url;
  Antwort-, DeviceList- und Lebensdauergrenzen sind vor teurer Kryptografie aktiv.
- Öffentliche Root-Konfiguration fail-closed angelegt. Der Produktions-Public-Key
  bleibt absichtlich leer, bis der Projektinhaber die Offline-Zeremonie ausführt;
  ein echter Private-Key wurde weder erzeugt noch eingecheckt.
- Vollständigen Client-Verifier implementiert: Root-Signatur, Zeitfenster, Release-
  und Cache-Floor, Same-sequence-Equivocation, Bundle ohne OPK, exakter Master,
  Device-Zertifikat, SPK-Signatur sowie optionale kanonische master-signierte
  DeviceList samt exakt passendem Bootstrap-Gerät.
- Separaten DEK-versiegelten Trust-Record mit IndexedDB-CAS implementiert. Ein
  niedrigerer Stand kann ihn nicht ersetzen; ein höherer Widerruf bleibt als Floor;
  Korruption wird ausdrücklich gemeldet und nie als leerer Cache behandelt.
- SQLite-backed `OfficialAccountDirectory` implementiert. Der Worker prüft vor dem
  DO, das DO defensiv erneut; atomare Updates sind strictly-higher, identische
  Retries idempotent, gleiche Sequenz mit anderem Inhalt Konflikt.
- Exakte GET/PUT-Route, Body-/Origin-/Methodenlimits, getrennte Actor-Rate-Limits,
  Wrangler-Binding und neue v5-SQLite-Migration ergänzt. `workers_dev = true`,
  `skytale.chat` und `scytale.illogical.workers.dev` blieben unverändert aktiv.
- Offline-CLI `scripts/official-admin.mjs` implementiert. Root-Dateien werden neu
  mit Modus 0600 angelegt und nie überschrieben; Signieren verwendet die echten
  Produktions-Serializer und prüft das Ergebnis vor dem Schreiben über den vollen
  Produktionspfad. Verify und root-signaturautorisierter Publish sind enthalten.
- Gezielte Prüfungen zu diesem Zeitpunkt: 22 Trust-Assertions, 24 Worker-Assertions,
  7 Store-/CAS-Assertions und 8 CLI-Assertions grün. App- und Worker-Typecheck waren
  vor Beginn der parallelen UI-Integration grün; der finale Gesamtlauf steht aus.

### 2026-07-31, 14:25–14:58 CEST

- Alias-Auflösung in den gemeinsamen QR-/Clipboard-/Manuell-Pfad integriert. Der
  feste Alias wird vor Kurzcode und Raw-Bundle erkannt; erst der vollständig
  geprüfte und per CAS gespeicherte Stand darf einen Kontakt erzeugen.
- Kanonischen Namen `ThePhantomPuppet` sowie roten, textuellen `ADMIN`-Badge in
  Kontaktliste, Chatkopf und Kontaktdetail integriert. Der Status wird ausschließlich
  zur Laufzeit aus Root-Manifest plus gepinntem Master abgeleitet; `Contact` und
  `ContactWire` blieben ohne Rollenfeld. Umbenennen kann die offizielle Anzeige
  nicht verdecken, die grüne manuelle Safety-Number-Verifikation bleibt separat.
- Public-only Deskriptor-Export im Profil des tatsächlich root-bestätigten eigenen
  Admin-Masters ergänzt. Exportiert werden nur OPK-freies Bundle und signierte
  DeviceList, niemals private Identitäts-, Ratchet- oder Root-Schlüssel.
- Ablaufhärtung ergänzt: Ein abgelaufenes Manifest bleibt als Rollback-Floor
  erhalten, autorisiert aber keinen Badge. Ein lifecycle-gebundener Timer entzieht
  die Kennzeichnung auch in einem lange geöffneten Tab ohne weiteres Rendering.
- Backup-Restore behält den aktuellen lokalen Trust-Floor außerhalb des Backup-
  Inhalts atomar bei. Ein altes Backup kann daher keinen bereits beobachteten
  Widerruf durch einen niedrigeren Stand ersetzen.
- Online-Publish vom Offline-Signieren getrennt: `publish` akzeptiert keinen
  Private-Key-Pfad und prüft ausschließlich gegen den eingecheckten Public Key.
  Beide aktiven Origins sind explizit erlaubt; keine Origin wurde entfernt.
- Erster vollständiger Regressionslauf: 1.369 Assertions grün, 0 rote Suites.
  App-Typecheck, Worker-Typecheck, Produktionsbuild, Service-Worker-/CSP-Shell-
  Validierung und `git diff --check` grün. `npm audit --omit=dev` meldete 0 bekannte
  Schwachstellen. Bestehende Vite-Hinweise betreffen nur bekannte Chunkgrößen.
- Zwei unabhängige adversariale Reviews parallel zum Bauen gestartet. Bestätigte
  Funde werden nicht bis zum Abschluss gesammelt, sondern sofort abgearbeitet:
  - Revocations mussten in langlebigen Tabs zusätzlich bei Foreground und per
    Intervall aktualisiert werden. Implementiert: sofortiger Foreground-Refresh,
    15-Minuten-Poll bei sichtbarer PWA und Zusammenlegung paralleler Refreshes.
  - Ein angehobener Release-Floor konnte einen korrekt signierten alten Cache
    zunächst nicht ersetzen. Implementiert: alter Stand wird weiter kryptografisch
    als nicht autorisierender historischer Floor geprüft; eine höhere gültige
    Sequenz kann ihn atomar ersetzen, ohne den Vault zu löschen.
  - Das Replay-Fenster eines frischen Clients ohne lokalen Floor war mit 365 Tagen
    zu groß. Implementiert: Alias bleibt dauerhaft, aber root-signierte operative
    Leases laufen standardmäßig 30 und maximal 45 Tage; Nutzer müssen nichts tun.
  - Weitere laufende Review-Arbeit: explizite Warn-/Sendesperre nach Revocation,
    Badge in allen sicherheitsrelevanten Kontaktpickern, verschlüsselte Offline-
    Root-Ablage, Schutz aller Git-Worktrees und verifizierter Publish-Readback.
- Proof-of-Work für die öffentliche Admin-Inbox bewusst noch nicht eingebaut:
  Messungen und Protokollreview zeigen, dass leichtes Hashcash schwache Telefone
  stärker belastet als GPU-/Botnet-Angreifer. Eine faire serverseitige Official-
  Inbox-Quota ohne Nutzerinteraktion wird als separater, vor Aktivierung zu
  bewertender Availability-Härtungsschritt dokumentiert.

### 2026-07-31, unabhängige Review und Härtung der Funde A und B

- Drei unabhängige adversariale Reviews (Trust/Rollback/Revocation, Messenger-UI,
  Worker/CLI). Die Badge-Vergabe (Positiv-Property) hielt jedem konstruierten
  Angriff stand: kein abgelaufenes, widerrufenes, zurückgerolltes oder
  äquivozierendes Dokument erzeugt einen Badge; Transcript, Base64url-Kanonik,
  Cache-Fail-Closed und DO-Monotonie ohne Befund.
- Zwei bestätigte Funde auf der negativen Revocation-Seite behoben:
  - **A (mittel):** Der Widerruf-Tombstone war nur dauerhaft, wenn der Client den
    `revoked`-Head selbst beobachtet hatte; eine revoke-then-rotate-Sequenz oder ein
    spät eintreffender Widerruf konnte ihn verlieren, sodass ein kompromittierter
    Ex-Admin wieder gewöhnlicher, schreibbarer Kontakt wurde. Behoben: signierte
    `revokedMasters`-Liste im Manifest (Teil des Transcripts, kanonisch validiert);
    der Verifier vereinigt sie in den Tombstone-Satz; der Store erzwingt Monotonie
    (ein Head, der einen bekannten Tombstone fallen lässt, wird abgewiesen) und
    faltet späte Out-of-Order-Widerrufe ein; die CLI trägt via `--supersedes`
    automatisch fort und ergänzt via `--revoke`.
  - **B (niedrig–mittel):** Die Sendesperre war nur content-basiert; auto-emittierte
    Profil-/DeviceList-Frames (sowie recall/attreq/serve) erreichten einen
    widerrufenen Master und leakten Metadaten. Behoben: `fanoutSend` blockt jeden
    Content-Typ unbedingt; alle Hintergrund-Emitter (silentFanout, ensureProfileSent,
    ensureListGossiped, serveAttachment, pullAttachment, recallMessage) überspringen
    widerrufene Master.
- Als Minor dokumentiert, nicht als Vuln: `MAX_REVOKED_MASTERS`-Kappung des
  Proof-Vorrats, lokale At-rest-Tamper-Grenzen (fail-closed, badge-safe) und die
  CLI-KEK-Zeroize-Hygiene.
- Neue Negativkontroll-Tests: Manifest-Back-fill, Kanonik-Erzwingung und Signatur-
  Tamper der Widerrufsliste, Store-Back-fill-Persistenz und Monotonie-Abweisung,
  CLI-Carry-forward, sowie die Sendesperre über alle Ausgangs-Frames.
- Eine durch einen vorherigen Refactor veraltete UI-Suite (`official-account-ui`)
  ehrlich nachgezogen (Name-Lock jetzt gegen `officialAccountNameLocked`, Badge in
  ≥3 Flächen paarweise) inkl. stärkerer Krypto-Pins.

## 14. Abschlussprotokoll

- **Stand:** Adversariale Review abgeschlossen, Funde A und B vollständig behoben und
  getestet. Feature ist implementiert, unabhängig verifiziert und commit-fertig; noch
  nicht produktiv aktiviert (Offline-Root-Zeremonie durch den Projektinhaber offen).
- **Verifikation:** `tsc --noEmit` 0 Fehler; `node tests/run.mjs` 1400 Assertionen grün,
  0 rote Suiten; `vite build` + `validate-shell` grün. `workers_dev = true` und beide
  Produktionsorigins (`skytale.chat`, `scytale.illogical.workers.dev`) unverändert.
- **Schema:** Das Manifest trägt jetzt die signierte `revokedMasters`-Liste. Da kein
  Root provisioniert und kein Manifest veröffentlicht ist, besteht keine
  Kompatibilitätslast; `schema` bleibt `1`.
- **Verbleibende Betriebsaufgaben:** Offline-Root-Zeremonie, Sequenz-1-Aktivierung,
  DeviceList-Bindung ab Sequenz 2, Abnahmetest (§13.6). Die Availability-Härtung der
  öffentlichen Admin-Inbox bleibt ein separater Folge-Branch (§15).
- **Commit:** bewusst abgegrenzt. Push, Merge und Produktivaktivierung sind getrennte
  Schritte und erfolgen nur nach ausdrücklicher Anweisung.
