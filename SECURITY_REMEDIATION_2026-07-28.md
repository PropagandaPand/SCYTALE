# Security Remediation & Re-Audit – SKYTALE

## Dokumentkontrolle

| Feld | Wert |
| --- | --- |
| Bericht-ID | `SKYTALE-REMEDIATION-2026-07-28` |
| Datum | 28. Juli 2026 |
| Ausgangsbericht | `SECURITY_AUDIT_2026-07-27.md` |
| Ausgangsstand dieser Arbeitsrunde | `23b3641e709a937579d5efccd660ee26800e6d6b` |
| Zielstand | Der Commit, der diesen Bericht enthält |
| Prüfmodus | Quellcode-/Konfigurations-Re-Audit, adversariales Zustandsreview, Fault-Injection, automatisierte Tests, Build/Dry-Run und niedrigvolumige Live-Probes |
| Produktionsänderungen | Keine; dieser Lauf ändert und pusht Quellcode, führt aber kein Cloudflare-Deployment aus |

## 1. Executive Summary

Die im Audit vom 27.07.2026 gefundenen kritischen und hohen Schwachstellen sind im
Quellcode weitgehend geschlossen. Zusätzlich wurden während des Re-Audits mehrere
nicht im Ausgangsbericht enthaltene Crash-, Cross-Tab- und Zustellrennen gefunden und
behoben. Besonders relevant sind:

- origin-weite Single-Writer-Sperre für den geöffneten Vault;
- absturzsichere, monotone Decoy-Promotion vor und nach dem realen Crypto-Erase;
- Cross-Tab-Fences für Restore und Duress;
- Application-first-Inbox-Commit ohne Ratchet-/OPK-Verlust bei Storagefehlern;
- crashfeste Linking- und Bootstrap-Übergänge;
- richtungs- und raumgebundene Recall-Namespaces samt Attachment-Crypto-Erase;
- vollständig geschlossene CSP-Prüfung und strukturelle Prüfung der ausgelieferten
  Service-Worker-Shell.

Das Urteil muss zwischen **Quellcodekandidat** und **aktuell ausgelieferter Produktion**
trennen:

1. Der Quellcodekandidat ist nach grünem Abschlusslauf für einen kontrollierten
   Beta-/Pilotbetrieb vertretbar.
2. Er ist nicht als formal verifizierter Hochsicherheits-Messenger einzustufen. Die
   in Abschnitt 8 genannten Architektur- und Funktionsgrenzen bleiben bestehen.
3. Die aktuell ausgelieferte Produktion ist noch nicht auf diesem Zielstand. Insbesondere
   lieferte `http://scytale.illogical.workers.dev/` beim Probezeitpunkt noch `200 OK`
   statt eines HTTPS-Redirects. Der Quellcode behebt dies, aber erst ein nachfolgendes
   Deployment plus Live-Verifikation schließt die Produktionslücke.

`scytale.illogical.workers.dev` ist ausdrücklich **kein veralteter Migrationsrest**.
Der Origin bleibt dauerhaft aktiviert und unterstützt; er erhält dieselben HTTPS- und
Security-Header-Anforderungen wie `skytale.chat`.

## 2. Umfang und Methodik

Geprüft wurden:

- Vault, Device-Binding, Lockout, Biometrics, Backup/Restore und lokale Datenbanken;
- Decoy-/Duress-Erkennung, Promotion, Wiederanlauf und Cross-Tab-Verhalten;
- X3DH, Double Ratchet, OPK-Verbrauch, Linking, DeviceLists und Geräte-Widerruf;
- Inbox-Verarbeitung, Zustellbelege, Recall, Bootstrap und Multi-Device-Fan-out;
- Attachments, R2-Deskriptoren, Quoten und Löschpfade;
- Service Worker, Build-Caches, CSP/Shell-Integrität und Mobile-Lifecycle;
- Worker, Durable Objects, Relay, Push, R2, Bugreport und Wrangler-Konfiguration;
- Dependencies, Lockfile, typische Secret-Muster und Dokumentationsaussagen;
- die beiden produktiven Origins `skytale.chat` und
  `scytale.illogical.workers.dev`.

Methoden:

- manueller Diff- und Datenflussreview;
- paralleles adversariales Review mit konkreten Reproduktionen;
- Fake-IndexedDB-Fault-Injection und Zwei-Tab-/Crash-Simulationen;
- negative Kontrollen für die früher verwundbare Variante;
- TypeScript-, Build-, Test- und Wrangler-Dry-Run-Prüfungen;
- Dependency-Audit und read-only R2-Lifecycle-Abfrage;
- niedrigvolumige HTTP-/HTTPS-/Header-Probes ohne Last- oder Abuse-Test.

Nicht durchgeführt wurden ein formaler Kryptobeweis, ein großvolumiger DDoS-/Kostenangriff,
eine vollständige reale iOS-/Android-Gerätematrix, ein produktives Deployment oder eine
Prüfung aller Cloudflare-Dashboard-/WAF-/Account-Einstellungen.

## 3. Status der Ausgangsbefunde F-01 bis F-26

Statusbedeutung:

- **Geschlossen:** Code und gezielte Regression sind vorhanden.
- **Deployment offen:** Quellcode geschlossen, aber die ausgelieferte Produktion enthält
  den Zielstand noch nicht oder wurde danach nicht erneut geprüft.
- **Teilweise/Restgrenze:** Der konkrete Exploit ist begrenzt, eine dokumentierte
  Architektur- oder Betriebsgrenze bleibt.

| ID | Befund | Re-Audit-Status | Wesentlicher Nachweis |
| --- | --- | --- | --- |
| F-01 | HTTP-Auslieferung | **Deployment offen** | `skytale.chat` redirectet live; beide absichtlich unterstützten Hosts stehen nun in derselben Worker-HTTPS-Allowlist. Der workers.dev-Redirect benötigt noch Deployment. |
| F-02 | Header umgehen PWA-Assets | **Geschlossen** | `run_worker_first = true`; CSP, HSTS, `nosniff`, Frame-, Referrer-, Permission- und Cross-Origin-Header wurden auf `skytale.chat` live für Shell/Asset/SW geprüft. Derselbe Quellcodepfad gilt für den workers.dev-Origin; dessen neuer HSTS-Stand bleibt bis zum Deployment unter F-01 offen. |
| F-03 | Gemeinsamer SW-Cache/Updatezustand | **Geschlossen** | Pro Build privater manifestgebundener Cache, SHA-256-Prüfung aller Manifest-Assets, atomare Aktivierung und fail-closed Asset-Miss. Der Update-Prompt ist korrekt nur UX, keine Trust Boundary. |
| F-04 | Linking-SAS bindet Geräteschlüssel nicht | **Geschlossen** | SAS/Bestätigung sind an den vollständigen Link-Transcript gebunden; bestätigter Zustand wird durch die Protokoll-API erzwungen. |
| F-05 | R2-Descriptor/OOM | **Geschlossen** | Strikte Descriptor-, Overflow-, Chunk- und exakte Ciphertextlängenprüfung; große Dateien werden nicht unbeschränkt materialisiert. |
| F-06 | Unbehandelte WebSocket-Frames | **Geschlossen** | Größen-/Formvalidatoren und socket-lokales fail-closed Verhalten mit negativen Runtime-Kontrollen. |
| F-07 | Malformed Base64 vergiftet Inbox | **Geschlossen** | Korrupte Queuezeilen werden begrenzt verworfen/gelöscht und blockieren nachfolgende Zeilen nicht. |
| F-08 | Fehlende Relay-/WS-Abuse-Grenzen | **Teilweise/Restgrenze** | Per-Room-/Actor-/Byte-/Socket-Grenzen und globaler Actor-DO sind vorhanden. Unter sealed sender bleibt per-sender Fairness bewusst unmöglich. |
| F-09 | Mailbox-TTL ohne Alarm | **Geschlossen** | Persistente Alarmplanung und TTL-Sweep auch für ruhende Inboxen. |
| F-10 | Offene R2-Multipart-Uploads | **Geschlossen** | Reservierungs-/Commit-Ledger, globale/Actor-Quoten, Recovery und Lifecycle. Live-Regel: Objekte 14 Tage, unvollständige Multipart-Uploads 1 Tag. |
| F-11 | Push-Storage/Outbound unbeschränkt | **Geschlossen** | Begrenzte/validierte Providerendpoints, owner-authentisierte Registrierung, Coalescing, Cleanup und begrenzte Fetches. |
| F-12 | Korrupte Identity erzeugt neue Identität | **Geschlossen** | Vorhandene korrupte Records scheitern explizit; Neuanlage nur bei nachgewiesener Abwesenheit. |
| F-13 | Linking/Grant nicht atomar | **Geschlossen** | Atomare DeviceList-/Grant-Intents, Relay-Receipt, persistente bestätigte N-Session, Boot-Recovery und attempt-spezifische Invalid-Grant-Behandlung. |
| F-14 | Bugreport puffert unbeschränkt | **Geschlossen** | Harte Body-/JSON-Feldgrenzen und Rate-Limit; Diagnostik ist echtes Opt-in. |
| F-15 | Mobile Hintergrundsperre | **Geschlossen** | Wall-clock-Ablauf, `visibilitychange`, `freeze`, `pagehide/pageshow`, synchroner blickdichter Curtain und Epoch-Invalidierung laufender Unlocks. |
| F-16 | Nicht atomarer Cross-Account-Restore | **Geschlossen** | Staging-Generation, atomarer Commit, Cross-Tab-Lease/Fence, Ablauf-Recovery und Quiesce laufender Inboxschreiber. |
| F-17 | Backup ohne harte Vollständigkeitsgrenzen | **Geschlossen** | Backup v4 mit gebundenen Abschnitten/Chunks, Manifest, Summen, exaktem EOF und Legacy-Grenzen. |
| F-18 | Keine Attachment-Gesamtquote | **Geschlossen** | Persistente per-contact Quoten, Origin-Headroom, Reservierungen sowie Inline-/Reply-/Chunk-Abdeckung. |
| F-19 | Wipe lässt Push-/Relay-Verknüpfung | **Teilweise/Restgrenze** | Normaler Account-Wipe versucht owner-authentisiertes Server-Unsubscribe, setzt lokalen Disable-Intent und entfernt Subscription/SW vor dem lokalen Wipe. Netzwerk-Cleanup bleibt bewusst zeitbegrenzt/best effort; Duress garantiert lokale Schlüsselzerstörung, nicht Löschung bereits ausgelieferter/remote gepufferter Kopien. |
| F-20 | OPK vor Auth verbraucht | **Geschlossen** | OPK-Verbrauch und authentisierter Kontakt-/Ratchet-Commit erfolgen atomar nach erfolgreicher Authentisierung. |
| F-21 | DeviceList-Reparatur autorisiert ungeprüft | **Geschlossen** | Master-Signatur, Epoch/Version, Zertifikate und Denylist werden vor Adoption geprüft. |
| F-22 | Nachrichtenkorruption als leerer Verlauf | **Geschlossen** | Authentisierte Storagekorruption ist ein eigener fail-closed Fehler; Inbox wird erst nach erfolgreicher Hydration verbunden. |
| F-23 | Gruppenlöschen ohne Room-Key-Erase | **Geschlossen** | Gruppen-/Nachrichten-/Attachment-Records werden inklusive Schlüsselmaterial entfernt; Recall-/Attachment-Pfade sind mitgehärtet. |
| F-24 | Peer-MIME löst großen Decode aus | **Geschlossen** | Größenbasierte Decode-/Waveform-/Blob-Grenzen unabhängig vom behaupteten MIME. |
| F-25 | High-Advisories in Buildkette | **Geschlossen** | Overrides/Updates; aktuelles `npm audit` und `npm audit --omit=dev` melden 0 bekannte Schwachstellen. |
| F-26 | Niedrige Hardening-/Privacy-Punkte | **Teilweise/akzeptiert** | Scanner-Track, Passphrase-Anzeige, Diagnose-Opt-in, Lifecycle-IaC und Lockfile-Version sind korrigiert. Recordnamen/Badge-Metadaten bleiben lokal sichtbar; Security-Observability bleibt datensparsam statt vollständig. Wipe/Revoke-Step-up bleibt ein empfohlenes Low-Risk-Hardening. `workers_dev = true` ist eine explizite Betriebsanforderung und kein Befund. |

## 4. Zusätzliche Befunde dieses Re-Audits

### R-01 – Same-Origin-Multi-Tab konnte denselben Ratchet-Zustand schreiben

**Ursprüngliches Risiko:** Zwei geöffnete Tabs konnten denselben lokalen Vault und dieselben
Sendeketten parallel benutzen. Daraus konnten Rollback, Nonce-/Message-Key-Wiederverwendung
oder eine bei paralleler Neuanlage inkonsistente Device-Bindung entstehen.

**Behebung:** Origin-weites Web Lock mit fail-closed Verhalten. Es wird vor Vault-Neuanlage
akquiriert, bei normalem Unlock vor dem Messenger-Open gehalten und über Real/Decoy-Switches
nicht freigegeben. Duress-Erkennung bleibt möglich, löst aber sofort Curtain, lokale Sperre,
Cross-Tab-Signal und den exklusiven destruktiven Pfad aus.

### R-02 – Decoy-Promotion konnte Real und Decoy verlieren oder zurückrollen

**Ursprüngliches Risiko:** Crash, parallele Tabs, verzögerte IndexedDB-Deletes oder ein
unvollständig validierter Source-Vault konnten den Canonical-Slot leeren, eine neuere
Promotion überschreiben oder den Marker zurück auf „pending“ setzen.

**Behebung:** Witness-gebundenes monotones Journal (`pending → copied`), Source-Fence vor dem
realen Wipe, Validierung eines vollständigen Decoy-Headers vor der Zerstörung, idempotente
Promotion, keine Rückkopie nach `copied`, nur nach Bestätigung abgeschlossene Quellenlöschung,
ein atomar neutralisierter Removal-Pfad ohne verzögerten Delete-Request und Cross-Tab-Lockdown.
Die Duress-Passphrase muss sich vom echten Passwort unterscheiden und wird bestätigt; eine Längen-/Stärke-Richtlinie gibt es bewusst NICHT (Nachtrag 2026-07-29: ursprünglich Mindestlänge 12 — entfernt, da das Duress-Wort ein Auslöser unter Zwang ist, kein Geheimnis, das echte Daten schützt).
Autofill/Password-Manager-Wiederverwendung wird soweit browserseitig möglich unterbunden.

**Ehrliche Grenze:** Flash-Wear-Leveling verhindert den Nachweis physischer Sektorüberschreibung.
Die Sicherheitsgarantie ist Crypto-Erase des realen DEK. Vor Auslösung sind ein
`decoyArmed`-Marker und eine zweite Datenbank forensisch erkennbar; die Funktion bietet
Verhaltensdeniability, keine perfekte At-Rest-Ununterscheidbarkeit. Die Quell-Datenbank und
das `copied`-Journal werden erst nach von IndexedDB bestätigter Löschung entfernt. Blockiert
ein anderer Browserkontext die Löschung, bleibt die kanonische Decoy-Kopie benutzbar, aber
Quelle und Journal können vorübergehend sichtbar bleiben; Re-Arming bleibt bis zur
erfolgreichen Boot-Recovery absichtlich gesperrt.

### R-03 – Restore-Lease und Cross-Tab-Generation

Ein abgestürzter Restore konnte einen anderen Tab dauerhaft blockieren oder ein fremder Tab
konnte während des Stage/Commit-Fensters alte Records schreiben. Die neue befristete,
tokengebundene Lease wird bei jeder Stage erneuert, beim Commit geprüft und nach Ablauf
atomar bereinigt. Generation-Fences verhindern Writes/Acks gegen den ausgetauschten Account.

### R-04 – Inbox-Anwendung, frühe Receipts und Bootstrap

- Receive entschlüsselt gegen eine Kopie, persistiert den idempotenten Anwendungseffekt und
  committet erst danach Ratchet/OPK; Relay-ACK ist der letzte Schritt.
- Relay-Receipts, die synchron vor dem lokalen Bubble-Commit eintreffen, werden gepuffert;
  `sent` ist monoton und gewinnt gegen späte Timeouts/NACKs.
- Profil/History werden vor RAM-Publikation gespeichert.
- Bootstrap-Frames zum neuen Gerät benötigen je Frame ein dauerhaftes Relay-Receipt; nach
  einem fehlgeschlagenen/fehlenden Ziel wird kein irreführender `done`-Frame erzeugt.

### R-05 – Crashfestes Geräte-Linking

Nach bestätigtem SAS konnte das Primärgerät N bereits autorisieren, während N bei Crash seine
nur im RAM gehaltene Session verlor. Der Grant wurde danach als stale geACKt und es blieb ein
„Ghost Device“. Der bestätigte N-Transcript wird nun unter dem Vault-DEK versiegelt, bei Boot
gegen lokale Identity/SPK und den kryptografisch neu berechneten Transcript validiert und bis
zum vollständigen Identity-/DeviceList-/Kontakt-/Bootstrap-Commit gehalten. Ein bewusster
N-Abbruch hinterlegt einen versiegelten, rein ablehnenden Transcript-Tombstone; ein exakt dazu
gehörender später Grant wird abgewiesen, fremde anonyme Relayzeilen werden unabhängig davon
beendet und können die Inbox nicht vergiften.

Auf P werden signierte DeviceList und exakter Retry-Grant gemeinsam per CAS gespeichert. Die
committete Liste wird vor Grant-Zustellung in RAM und Selbstkontakt veröffentlicht. Erst ein
bestätigtes Relay-Receipt darf den **exakten** gespeicherten Intent per Snapshot-CAS löschen;
ein spätes Receipt des Versuchs A kann dadurch keinen neueren Versuch B entfernen. Bei dauerhaft
fehlender Zustellung bietet die UI entweder denselben Retry oder einen atomaren Abbruch an, der
das Ziel in einer neueren master-signierten DeviceList widerruft und den zugehörigen Intent
im selben Übergang löscht. Korrupte P-Intents werden ebenfalls nur als exakter Snapshot entfernt
und lösen eine Ghost-Device-Warnung aus. Ein korrupter bestätigter N-Transcript bleibt dagegen
bewusst fail-closed statt still seine menschliche Bestätigung zu verlieren.

### R-06 – Recall-/Attachment-Namespace

Recall-Dedup ist jetzt an `(roomId, mine, mid)` gebunden. Ein Peer kann dadurch weder eine
eigene Self-Sync-Nachricht noch gleichnamige Nachrichten anderer Räume unterdrücken.
Legacy-Migration und Room-Rekey sind crashsicher. Inline-, Reply- und Chunk-Anhänge werden
vor dem Tombstone gewipet oder vor Speicherung verworfen, sodass keine unreferenzierten
Klartext-/Blobdaten zurückbleiben.

### R-07 – Edge-rewritten PWA-Shell

Weil Cloudflare JavaScript Detections die HTML-Shell pro Request verändert, kann ihr Bytehash
nicht stabil gepinnt werden. Die ausführbaren Buildassets bleiben SHA-256-gepinnt. Für die
Shell gilt zusätzlich:

- exakt eine geschlossene CSP-Direktivenmenge; zusätzliche sink-spezifische Overrides scheitern;
- CSP- und HTML-Tokenisierung verwenden ausschließlich die jeweiligen ASCII-Whitespace-Regeln;
  Unicode-Trennzeichen wie NBSP werden fail-closed abgelehnt;
- Shell- und aktive Asset-MIME-Essence werden exakt geprüft; nur kein Charset oder eindeutig
  `UTF-8` ist zulässig, `Content-Disposition` wird abgelehnt;
- kein `Refresh`-Response-Header und kein `meta[http-equiv]`;
- geschlossene HTML-Grammatik mit festem Body, Produkttitel und exakt einem unveränderten
  `#app`-Mount; sichtbarer Fremdtext und zusätzliche Style-/Navigationsattribute scheitern;
- nur kanonische root-relative, manifestverifizierte Script-, Style-, Icon- und
  Web-App-Manifest-Referenzen;
- mindestens ein verifiziertes App-Modul.

Damit bleiben bekannte CSP-inerte Cloudflare-Inline-Skripte tolerierbar, während
scriptlose Form-, Frame-, Image-Map- und Top-Level-Navigationsinjektionen fail-closed sind.

## 5. Automatisierte und dynamische Verifikation

Die endgültigen Zahlen in dieser Tabelle beziehen sich auf den Abschlusslauf direkt vor dem
Commit:

| Prüfung | Ergebnis |
| --- | --- |
| Client-TypeScript (`npm run check`) | 0 Fehler (exit 0) |
| Worker-TypeScript (`npx tsc -p worker/tsconfig.json --noEmit`) | 0 Fehler (exit 0) |
| Gesamtsuite (`npm test`) | 805 Assertions grün, 0 Suiten rot, 2 XFAIL-Zielvorgaben offen |
| Produktionsbuild (`npm run build`) | erfolgreich (exit 0) |
| Wrangler Dry Run | erfolgreich (exit 0) |
| `git diff --check` | sauber (exit 0) |
| `npm audit --omit=dev` | 0 bekannte Schwachstellen |
| vollständiges `npm audit` | 0 bekannte Schwachstellen |
| Dependency-Baum (`npm ls --all --omit=optional`) | konsistent |
| typische Secrets im Worktree/Tracking | keine bestätigten Secrets |
| R2-Lifecycle (read-only live) | 14 Tage Objektablauf; 1 Tag Multipart-Abbruch; aktiviert |

Fokussierte Zwischenläufe:

- PWA-/Shell-Härtung: 49/49 Assertions grün;
- Worker-Backend-Härtung: 26/26 Assertions grün;
- Recall: 17/17 Assertions grün;
- Storage-Quota: 26/26 Assertions grün;
- Inbox-Atomizität: 10/10 Assertions grün.

## 6. Live-Probes am 28.07.2026

Zeitfenster: ca. 20:04–20:08 CEST. Keine Last, keine mutierenden API-Aufrufe.

### `skytale.chat`

- `http://skytale.chat/` → `301` auf `https://skytale.chat/`;
- HTTPS-Shell → `200`, vollständige erwartete CSP, HSTS
  `max-age=63072000`, `nosniff`, `DENY`, COOP/CORP, Referrer- und Permissions-Policy;
- `/sw.js` → `200 text/javascript`, `no-cache, no-store, must-revalidate`, Security-Header;
- gehashtes JS-Asset → `200 text/javascript`, Security-Header;
- `/api/relay` ohne gültigen Raum/Upgrade → kontrolliertes `400`.

### `scytale.illogical.workers.dev`

- HTTPS-Shell und `/sw.js` → `200` mit CSP und den übrigen Security-Headern;
- zum Probezeitpunkt fehlte HSTS auf diesem Host;
- `http://scytale.illogical.workers.dev/` → zum Probezeitpunkt noch `200` statt Redirect.

Der Code dieses Zielstands setzt für **beide** expliziten Produktionshosts Redirect und HSTS.
Da in diesem Auftrag nicht deployed wird, müssen genau diese beiden Punkte nach dem nächsten
Cloudflare-Deployment erneut live geprüft werden. Der Origin selbst bleibt aktiviert.

## 7. Produktionsreife-Urteil

### Vertretbar

Nach vollständig grünem Abschlusslauf, Deployment des Zielstands und bestandener Live-Prüfung
beider Origins ist die PWA für einen **kontrollierten Beta-/Pilotbetrieb mit informierten
Nutzern** vertretbar. Die zentralen P0/P1-Pfade sind dann geschlossen oder klar begrenzt.

### Noch nicht vertretbar als uneingeschränkte Hochsicherheitsfreigabe

Für eine pauschale Aussage „produktionsreif für beliebig hochsensible Kommunikation“ fehlen:

1. reale Browser-/Geräte-E2E-Matrix für Decoy, Restore, SW-Upgrade und Linking-Crash-Recovery;
2. formale bzw. unabhängige Kryptoprotokollprüfung;
3. unabhängige, signierte Code-Delivery-/Build-Verifikation;
4. geschlossene Gruppen-Device-Fan-out- und Gruppen-Revocation-Zielvorgaben;
5. belastbare Betriebsnachweise für WAF/Accountlimits/Monitoring außerhalb des Repositories.

## 8. Verbleibende Grenzen und akzeptierte Risiken

- Ein kompromittierter Origin, Build-Runner, Browser oder entsperrtes Endgerät kann
  Klartext kompromittieren; E2EE schützt nicht vor dem Endpoint.
- Zwei **verschiedene Origins/Geräte** können weiterhin eine alte Backup-Ratchet-Generation
  parallel verwenden. Restore ist Migration, kein Mechanismus für paralleles Cloning.
- Duress löscht lokal kryptografisch; bereits zugestellte Nachrichten, exportierte Backups
  und remote Metadaten liegen außerhalb seiner Reichweite.
- Die Duress-Erkennung gleicht den dominanten Argon2-Aufwand bewaffneter und unbewaffneter
  Fehlversuche an. Browser-, IndexedDB- und Device-Binding-Laufzeiten sind keine
  strikte Constant-Time-Garantie.
- Relayadressierung leakt Empfänger-Pseudonym, Timing, Größe und Netzwerkbeziehung.
- Push bindet Inbox und providerseitigen Gerätetoken; Push bleibt opt-in.
- Recall ist kooperativ und kann Lesen, Screenshot oder modifizierte Clients nicht rückgängig machen.
- Gruppen besitzen noch kein MLS/Sender-Key-Rekeying; die zwei XFAIL-Suites zu
  Geräte-Fan-out und Revocation bleiben echte Freigabegrenzen für diese Funktionen.
- `workers_dev = true` bleibt absichtlich aktiv. Die zusätzliche Originfläche wird durch
  identische Worker-, HTTPS-, CSP- und Headerregeln begrenzt, nicht durch Abschaltung.
- Ein beschädigter versiegelter N-Linking-Transcript bleibt fail-closed und benötigt
  einen bewussten lokalen Recovery-/Neuaufsetzpfad; er wird nicht automatisch verworfen,
  solange noch ein bereits bestätigter Grant eintreffen könnte.
- Irreversible lokale Wipe-/Revoke-Aktionen besitzen weiterhin keine Passphrase-Step-up-
  Abfrage. Das ist ein verbleibendes Low-Risk-Verfügbarkeitshardening für bereits
  entsperrte Geräte, kein Vertraulichkeits-Bypass.

## 9. Verbindliche Schritte vor Produktionsfreigabe

1. Zielcommit deployen, ohne `workers_dev` zu deaktivieren.
2. HTTP→HTTPS, HSTS, CSP und SW-Cacheheader auf **beiden** Origins erneut prüfen.
3. Zwei reale Browserprofile für Link-Crash/Reload und Bootstrap-Abbruch testen.
4. Decoy/Duress mindestens auf Chromium und Safari/iOS mit Tab-Kill während
   `pending` und `copied` testen.
5. Restore-Abbruch, Quota-Fehler und Background/Freeze auf realen Mobilgeräten prüfen.
6. Offene Gruppen-XFAILs entweder schließen oder Gruppen für den betreffenden
   Sicherheitsanspruch sichtbar als eingeschränkt behandeln.

## 10. Schlussfolgerung

Der Stand ist gegenüber dem Ausgangsaudit substanziell gehärtet. Die größte verbleibende
kurzfristige Lücke ist nicht ein bekannter offener P0 im Zielcode, sondern die noch fehlende
Auslieferung und Live-Verifikation dieses Zielstands auf beiden bewusst unterstützten Origins.
Eine seriöse Freigabe ist deshalb **konditional**: grüner Abschlusslauf, Deployment, Live-Probe
und reale Geräte-Smoke-Tests. Ohne diese Bedingungen wäre die Bezeichnung „produktionsreif“
zu stark; mit ihnen ist ein kontrollierter Pilotbetrieb vertretbar.
