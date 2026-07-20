# Sicherheit & Bedrohungsmodell

SCYTALE ist gegen **anlasslose Massenüberwachung** gebaut (Chatkontrolle /
CSAR). Dieses Dokument ist die genaue Aufschlüsselung aller Mechanismen und
sagt ehrlich, was geschützt ist — und was nicht. Stand: v0.16.0.

**Leitprinzipien:** niemals eigene Krypto erfinden (vetted Primitiven +
etablierte Protokolle: X3DH, Double Ratchet); der Server ist ein **dummer
Ciphertext-Briefkasten** ohne Wissen; alle Schlüssel sind **non-extractable
CryptoKeys**, ihre Rohbytes für JavaScript unerreichbar (selbst ein XSS-Fund
kann keinen Schlüssel exfiltrieren).

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
- **KEK** nur mit `wrapKey`/`unwrapKey` importiert; Rohbytes danach mit `fill(0)`
  überschrieben.
- **DEK**: zufälliger AES-256-GCM-Key, non-extractable. Passphrase-Wechsel =
  nur DEK neu wrappen, **keine** Neuverschlüsselung der ganzen DB.
- **Pro Datensatz**: AES-256-GCM mit **frischer 96-Bit-Nonce** + **AAD**
  (bindet Typ/ID/Version in den Auth-Tag → kein Vertauschen/Rollback).
- **Falsche Passphrase** wird am fehlschlagenden GCM-Tag beim DEK-Unwrap erkannt
  — **kein separater Verifier** (der wäre ein Offline-Angriffs-Orakel).

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
  die ehrliche Darstellung, kein Rückschritt.
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
  die aktuelle Identität nicht degradieren kann. Die Sperrliste ist Teil des
  Kontakt-Datensatzes und damit auch im Recovery-Export enthalten — ein Restore
  ohne sie würde den Downgrade-Pfad wieder öffnen.
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
- **Der IV wird abgeleitet, nicht übertragen** (`HKDF(MK)` → Key ‖ IV, 44 Byte).
  Das spart Bandbreite, macht die Persistenz des Chain-Keys aber
  **sicherheitskritisch**: derselbe Message-Key ergibt denselben Key *und*
  denselben Nonce. Ein Rollback des Sende-Chain-Keys ist damit kein harmloser
  Replay, sondern ein **Two-Time-Pad** — es leakt das XOR beider Klartexte und
  erlaubt die Rekonstruktion des GHASH-Authentifizierungsschlüssels, also auch
  **Fälschung**. `ratchetEncrypt` mutiert den Zustand in-place; deshalb läuft
  jeder ausgehende Pfad über `encryptAndPersist`, das den fortgeschrittenen
  Zustand **vor** dem Versand schreibt. Ein Absturz in der Lücke kostet dann
  höchstens eine ungesendete Nachricht, nie einen wiederverwendeten Nonce.

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
- **Sender-Rate-Limiting**: die Queue ist gedeckelt (`MAX_QUEUE`), aber ein
  echtes Pro-Sender-Rate-Limit gegen gezieltes Fluten fehlt noch.

---

## Verantwortungsvolle Offenlegung

Sicherheitslücken bitte **nicht** über öffentliche Issues melden, sondern direkt
an den Repo-Betreiber.
