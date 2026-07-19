# Changelog

Alle nennenswerten Änderungen an SCYTALE. Format nach
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Feature: Sealed Sender (Absender-Metadaten verbergen)

- Der komplette Wire-Envelope wird vor dem Senden in einen **anonymen Box an den
  Empfänger** verpackt (libsodium `crypto_box_seal` — ephemerer Schlüssel, kein
  Absender-Key im Ciphertext). Der Relay sieht damit **nicht mehr, wer** an eine
  Inbox einliefert; auch die frühere `conv`-Paar-ID und die X3DH-Identitäts-
  schlüssel des Absenders (erste Nachricht) sind jetzt **verborgen** (innerhalb
  der Versiegelung).
- Absender-**Authentizität** bleibt: sie kommt aus dem X3DH/Ratchet innen, den
  der Empfänger nach dem Öffnen prüft. Neues Modul `src/crypto/seal.ts`.
- Empfänger-Fallback für Legacy-Nachrichten (unversiegelt) während des Rollouts.
- Rest-Metadaten (ehrlich): Empfänger-Inbox, Timing, Größe, IP-Korrelation —
  gleiche Fläche wie Signals Sealed Sender.


### Feature: Profilbild-Zuschnitt + QR-Vollbild + robusterer QR-Scan

- **Crop-Auswahl**: beim Setzen des Profilbilds wählt man jetzt den Ausschnitt —
  Foto im Kreis verschieben (Drag), zoomen (Slider/Pinch/Wheel). Ergebnis
  256×256 JPEG (EXIF entfernt, Orientierung via `createImageBitmap` gebacken).
- **Eigener QR im Vollbild**: antippen → großer Code auf weißem Grund
  (`image-rendering: pixelated`), damit der Kontakt ihn leicht scannt.
- **QR-Scanner robuster**: höhere Kameraauflösung (ideal 1920×1080) + Fallback
  auf beliebige Kamera + `attemptBoth`-Inversion → dichte Codes werden erkannt.
- **Push-Fehler sichtbar**: `enablePush` wirft klare Fehler (iOS-Standalone-Check,
  Timeouts) und der Profil-View zeigt sie an — kein still ausgegrauter Toggle mehr.

### Feature: Push-Benachrichtigungen (inhaltslos, opt-in)

- **Web Push**, wenn die App zu ist: der Relay-DO weckt das Gerät, sobald eine
  Nachricht ankommt und der Owner nicht verbunden ist.
- **Datensparsam by design**: der Push enthält **keinen** Inhalt, Absender oder
  Text — nur ein Wecksignal. Der Service Worker kann gar nicht entschlüsseln
  (Vault gesperrt, keine Schlüssel im SW) und zeigt generisch „Neue Nachricht".
- **Opt-in** über einen Schalter im Profil; Abo wird über den
  **authentifizierten** Owner-Socket registriert (nur der Inbox-Besitzer kann es
  setzen). VAPID/ES256-Signierung im Worker (WebCrypto), verifiziert per Test.
- Service Worker auf `injectManifest` umgestellt — **handgeschrieben und
  abhängigkeitsfrei** (auditierbare Precache-Logik + Push-Handler).
- iOS: funktioniert nur als installierte PWA (iOS 16.4+).
- **Setup nötig**: Secret `VAPID_JWK` im Cloudflare-Worker setzen (siehe README/
  Commit), sonst werden keine Pushes gesendet (Abos werden trotzdem gespeichert).

### Feature: Versionsanzeige im Header

- Neben „SCYTALE" wird die **SemVer-Version** (`v0.9.0`) angezeigt, zur
  Build-Zeit aus `package.json` eingebacken. So sieht man pro Gerät sofort, ob
  der Service Worker die neueste Version geladen hat — gleiche Nummer = gleicher
  Stand.
- Bump-Regel: `0.0.x` jeder Push · `0.x.0` Feature · `x.0.0` großer Sprung.
  Baseline auf `0.9.0` gesetzt (Stand nach den bisherigen Feature-Meilensteinen).

### Feature: Kontakt-Detail-Tab + Bild-Lightbox

- Neuer Kontakt-Tab (Tap auf das Avatar in der Chat-Kopfzeile): großes
  Profilbild, angezeigter Name, **dein** Nickname (bearbeitbar), der **von der
  Person selbst gesetzte** Name, Fingerprint und Verifikationsstatus mit
  Sprung zur Sicherheitsnummer. Chatverlauf/Kontakt löschen ebenfalls hier.
- Profilbilder und Chat-Bilder per Tap **bildschirmfüllend** ansehbar (Lightbox).

### Fix: iOS-Zuverlässigkeit (tote Sockets nach Hintergrund)

- App-Level Ping/Pong-Heartbeat erkennt von iOS eingefrorene „Zombie"-Sockets
  (readyState bleibt OPEN, Verbindung ist aber tot) und reconnectet.
- Rückkehr in den Vordergrund (visibilitychange/pageshow) erzwingt Reconnect
  aller Relays → Inbox wird zuverlässig neu geleert.

### Fix: Beschädigte Frames nicht mehr als Datei rendern

- `unframeContent` wirft bei unbekanntem Frame-Typ, statt ihn als Datei
  anzuzeigen — ein verstümmeltes Profil-Update erscheint nicht mehr als
  Junk-Datei im Chat.

### Fix: Gleichzeitiger Verbindungsaufbau (Ratchet-Desync)

- Wenn sich **beide** Seiten gegenseitig hinzufügen und **beide zuerst schreiben**,
  initiierte jeder eine eigene X3DH-Session → beide Double-Ratchets desynchron →
  keiner konnte den anderen entschlüsseln (Symptom: Profilbild ging durch, Text nicht).
- Fix in `receiveEnvelope`: bei gleichzeitigem Aufbau (eigene Session unbestätigt
  **und** eingehendes Prekey) wird **deterministisch nach Identitäts-Reihenfolge**
  entschieden — die niedrigere Identität bleibt Initiator, die höhere übernimmt
  deren Session. Beide konvergieren. Verifiziert per Test.
- Selbstheilend: bestehende kaputte Sessions konvergieren bei der nächsten
  Nachricht (beide senden noch Prekey-Envelopes bis zur Bestätigung).

### Fix: Gruppennachrichten an noch nicht verbundene Empfänger

- **Wurzel**: `RelayClient.send()` verwarf Frames, wenn der WebSocket noch nicht
  `OPEN` war. Bei Gruppen wird direkt nach `connectSend` (Socket verbindet noch)
  gesendet → Einladung/Nachricht an neue Mitglieder fiel ins Leere. Jetzt werden
  ausgehende Sends **gepuffert und beim `open` (auch nach Reconnect) geflusht**.
- **Absicherung**: Gruppennachrichten für eine noch unbekannte Gruppe (Einladung
  noch nicht verarbeitet) werden nun **gepuffert** und ausgespielt, sobald die
  Einladung eintrifft — statt verworfen zu werden.

### Gruppen v2 — Mitglieder-Verwaltung

#### Hinzugefügt
- **Gruppe verwalten** (Menü im Gruppenchat): Mitglieder **hinzufügen** (aus
  Kontakten), **entfernen**, Gruppe **umbenennen**, Gruppe **verlassen**.
- Änderungen werden per aktualisiertem **Roster-Push** (`ginvite`) an alle
  Mitglieder verteilt (Konvergenz). Neue Steuer-Nachrichten `gremove` (Empfänger
  verlässt die Gruppe lokal) und `gleave` (Absender wird aus dem Roster entfernt).
- Verifiziert: `gremove`/`gleave` Round-Trip.

#### Grenzen
- „Soft"-Membership ohne kryptografisches Re-Keying: ein entferntes Mitglied
  behält alte Schlüssel/Verlauf; echte Vorwärts-/Rückwärts-Sicherheit bei
  Mitgliederwechsel bräuchte Sender-Keys/MLS (v3).

### Gruppen (MVP)

#### Hinzugefügt
- **Gruppenchats** via **Pairwise Fan-out**: eine Gruppennachricht wird an jedes
  Mitglied einzeln über die 1:1-Double-Ratchet-Session verschickt — voll E2E, der
  Relay sieht nur Ciphertext. Text/Bilder/Dateien/Audio laufen mit (inneres
  Content-Framing wird gewrappt).
- **Roster-Verteilung**: der Ersteller schickt jedem Mitglied E2E die Mitgliederliste
  inkl. aller Bundles, sodass jeder jeden erreichen kann. Neue `MessageContent`-Typen
  `group`/`ginvite`; `lib/groups.ts` (Datenmodell + Speicher), `Contact.hidden` für
  Gruppen-only-Kontakte.
- **UI**: Gruppe erstellen (Name + Kontaktauswahl), Gruppen in der Chatliste,
  Gruppenchat mit Absendernamen, Gruppe löschen. Fan-out nutzt die Store-and-
  Forward-Mailbox → Offline-Mitglieder bekommen Nachrichten nach.
- Verifiziert: Gruppen-Nachricht (verschachtelter Text/Datei) + Roster-Einladung
  Round-Trip gegen echten Code.

#### Grenzen (v1)
- O(N)-Fan-out pro Nachricht; keine nachträgliche Mitglieder-Verwaltung / kein
  Re-Keying; nur Kontakte mit Bundle können hinzugefügt werden.

### Profilbilder + Kontakte/Chats löschen

#### Hinzugefügt
- **Profilbilder & Anzeigename**: Profil-Ansicht (Avatar antippen → Bild wählen,
  center-cropped 256px JPEG, EXIF entfernt). Bild + Name werden als **E2E-
  verschlüsselte `profile`-Nachricht** an Kontakte geschickt (neuer MessageContent-
  Typ), nicht über den öffentlichen Code. Kontakte zeigen Avatar + Name statt
  Identicon/Fingerprint (Priorität: lokaler Nickname > geteilter Name > Fingerprint).
  Eigenes/Kontakt-Profil im Header/Liste/Chat. Profil-Round-Trip verifiziert.
- **Löschen**: Kontextmenü im Chat-Header → „Chatverlauf löschen" (nur Nachrichten)
  oder „Kontakt löschen" (Kontakt + Chat + Session, Relay getrennt), jeweils mit
  Bestätigung. Storage-Löschung in `store.removeContact`/`messages.clearMessages`.

### Audionachrichten

#### Hinzugefügt
- **Sprachnachrichten**: Mikrofon-Button im Composer → Aufnahme (MediaRecorder,
  bestes verfügbares Format: mp4/aac oder webm/opus) → Stop/Senden oder Abbrechen,
  mit Timer + Auto-Stop bei 3 min. Verschickt als Audio-Anhang durch dieselbe
  E2E-Pipeline; Inline-Player (`AudioPlayer.tsx`) mit Play/Pause, Fortschritt,
  Dauer.
- **Waveform-Player** (WhatsApp-Stil): das Audio wird per Web Audio API dekodiert,
  RMS-Lautstärke pro Segment als Balkengraph gerendert; abgespielter Teil färbt
  sich ein. **Spulbar** per Tippen/Ziehen auf der Waveform (Pointer-Capture).
  Exakte Dauer aus dem dekodierten Buffer. Fallback-Waveform, wenn der Codec
  lokal nicht dekodierbar ist.
- **Permissions-Policy**: `microphone=(self)` ergänzt (nur same-origin).

#### Grenzen
- Volle Cross-Codec-Wiedergabe ist nicht garantiert (iOS nimmt mp4/aac auf,
  Android Chrome webm/opus — Safari dekodiert kein Opus). Transcoding wäre ein
  späteres Thema.

### Offline-Zustellung (Store-and-Forward-Mailbox)

Bisher mussten beide gleichzeitig online sein — sonst war die Nachricht weg.

#### Geändert
- **Relay-Durable-Object zur verschlüsselten Mailbox** ausgebaut: Nachrichten
  werden in SQLite zwischengespeichert und ausgeliefert, sobald der Empfänger
  online kommt. Ack-basiert → kein Verlust.
- **Inbox-Owner-Authentifizierung**: die Inbox = `SHA-256(Ed25519-Identity-Pub)`.
  Der Besitzer beweist sich per **Ed25519-Challenge-Response** (signiert die
  Nonce des DO); der DO prüft `hash(signPub) == Inbox` + Signatur. Nur so kann
  jemand die Warteschlange leeren — nicht jeder, der bloß deinen Code hat.
  (libsodium-Sig ↔ WebCrypto-Ed25519-Verify verifiziert.)
- JSON-Protokoll (hello/challenge/auth/send/msg/ack); Client mit Dedup gegen
  Doppel-Zustellung. `inboxRoom` von BLAKE2b(dhPub) auf SHA-256(signPub)
  umgestellt (Worker kann's nativ prüfen).

### Bilder & Dateien

#### Geändert
- Bilder werden vor dem Senden über einen Canvas re-enkodiert → **EXIF/GPS/
  Metadaten werden entfernt**; Orientierung wird vorher in die Pixel gebacken
  (`imageOrientation: 'from-image'`), damit nichts kippt.

#### Hinzugefügt
- **Anhänge im Chat**: Bilder und Dateien laufen durch dieselbe E2E-Pipeline
  (Double Ratchet) wie Text — der Relay sieht nur Ciphertext. Attach-Button im
  Composer, Bild-Vorschau inline, Dateien als Chip mit Download (Blob-URL).
- **Bild-Kompression** vor dem Senden (`imagecompress.ts`): Canvas, max 1600px,
  JPEG-Qualität stufenweise runter bis unter das Inline-Limit.
- Content-Framing in `session.ts` (`MessageContent` text|file, `sendFile`,
  `receiveEnvelope` liefert jetzt `MessageContent`); Verlauf speichert Anhänge
  verschlüsselt mit.
- Verifiziert: Datei-Round-Trip (Metadaten + Bytes unverändert) durch die
  echte Krypto-Pipeline.

#### Grenzen
- Inline-Limit ~600 KB (Cloudflare-WebSocket-Frame < 1 MiB). Größere Dateien via
  R2-Blobstore wären ein späteres Upgrade.

### QR-Scanner in der App

#### Hinzugefügt
- **In-App-QR-Scanner** (`QrScanner.tsx`, `jsQR` lazy-geladen): öffnet die
  Rückkamera, dekodiert Frames per Canvas, importiert bei Treffer den Kontakt
  (`addBundle`) — kein Umweg mehr über die native Kamera-App. Rahmen-Overlay +
  Fehlerbehandlung (Zugriff verweigert / keine Kamera).
- Button „QR-Code scannen" in der Verbinden-Ansicht.

#### Geändert
- **Permissions-Policy** im Worker: `camera=(self)` (vorher `camera=()`) — nur
  same-origin, alles andere bleibt gesperrt. getUserMedia braucht Secure Context
  (https/localhost), auf `workers.dev` gegeben.

### Einseitiges Onboarding (Inbox-Modell)

Bisher mussten **beide** ihren Code austauschen, damit Nachrichten durchgehen.
Jetzt reicht es, wenn eine Person den Code der anderen hat.

#### Geändert
- **Transport auf Inbox-Modell umgestellt**: statt eines gemeinsamen Raums
  `hash(beide Keys)` lauscht jeder auf seiner eigenen Inbox `hash(eigener Key)`
  (allein berechenbar). Wer schreiben will, sendet an die Inbox des Empfängers.
- Die erste (prekey-)Nachricht trägt die Absender-Identität + eine `conv`-Routing-ID.
  Der Empfänger **legt den Kontakt automatisch an** (`makeContactFromHeader`) und
  kann antworten — **ohne je den Code des Absenders gehabt zu haben**.
- `Contact.bundle` jetzt optional (Responder-Seite hat keins); `sendMessage` bindet
  `conv` ein und blockt „zuerst schreiben ohne Code" sauber ab.
- Verifiziert gegen echten Code: B hält A's Code, schreibt zuerst → A empfängt &
  antwortet, mehrere Round-Trips inkl. Persistenz-Reload der bundle-losen Seite.

### App-Icon: SVG + optimierte Install-Icons

#### Hinzugefügt
- **`scytale-icon.svg`** — flache Vektor-Version des Logos (Teal-Scytale-
  Silhouette per potrace getraced, Verlauf, 4,7 KB). Genutzt als Favicon und
  In-App-Logo (gestochen scharf, skaliert unendlich).

#### Geändert
- **PWA-Install-Icons** neu generiert: weiße Ecken des Quell-Logos per Floodfill
  entfernt, echte `pwa-192`/`pwa-512` + **`pwa-maskable-512` mit Safe-Zone** (80 %
  auf schwarzem Grund) — palette-komprimiert (959 KB → ~50 KB gesamt).
- **Fonts** auf Latin-Subset reduziert (34 → 6 woff2, 504 → 128 KB) → Precache
  1460 → 1140 KiB.

### UI-Redesign: „Vertraut" (Signal-artig, ruhig & vertrauenswürdig)

Vollständiger Presentation-Layer-Austausch nach externem Design-Handoff. Krypto,
Relay und Storage (`src/lib`, `src/crypto`, `worker`) **unverändert** — nur das
Rendering von `App.tsx`/`Messenger.tsx` und `app.css` neu.

#### Geändert
- Terminal-/Monospace-Look → **ruhiges, vertrautes Messenger-UI** (Dark, Teal
  `#12a488`, IBM Plex Sans/Mono **self-hosted** via `@fontsource` → CSP bleibt
  `default-src 'self'`). Light-Theme-Tokens vorbereitet.
- **Lockscreen** neu: Logo, Wordmark, Passphrase-Feld mit Schloss-Glyph,
  Footer-Chip; behält alle Zustände (busy/deny/locked/tamper/fatal).
- **Chatliste**: Identicon-Avatare + Status-Dot, Alias, Verified-Shield,
  Zeitstempel, letzte Nachricht, Unread-Pill, E2E-Zeile.
- **Chat**: Bubbles (mine/theirs, Doppel-Haken), Verschlüsselt-Pill,
  Pill-Composer, Verify-Affordance im Header.

#### Hinzugefügt
- **Teilen/Verbinden**-Screen (QR + Link + Bundle-Paste + Honesty-Note).
- **Safety-Number-Screen**: pairwise 60-stellige Safety Number (12×5 Ziffern,
  ordnungs-unabhängig, symmetrisch verifiziert) als QR + Grid, lokaler
  **Verified-Flag** pro Kontakt (verschlüsselt persistiert).
- Deterministische **Identicons**, IBM-Plex-Fonts, Logo als App-Icon/Favicon/
  PWA-Manifest.

### Nachrichtenverlauf persistent

#### Hinzugefügt
- **Persistenter Chat-Verlauf** (`lib/messages.ts`): der entschlüsselte Verlauf
  wird pro Chat mit dem DEK verschlüsselt (AES-256-GCM, AAD an den Raum gebunden)
  in IndexedDB gespeichert und beim Entsperren geladen. Gespräche überstehen jetzt
  Logout/Reload — vorher lagen sie nur im RAM.
- Messenger nutzt einen `messagesRef` als Quelle der Wahrheit; jedes Senden/
  Empfangen persistiert den Verlauf. Round-Trip + Raum-Bindung verifiziert.

### Kontakt-Nicknames + UI/UX-Politur

Design-Philosophie (Emil Kowalski) über die ganze App gezogen — inspiriert vom
AZIS-Projekt.

#### Hinzugefügt
- **Nicknames**: jeder Kontakt kann lokal benannt werden (im Tresor
  verschlüsselt); Name wird in Kontaktliste und Chat-Header statt der Safety
  Number angezeigt, umbenennbar über den Namen im Chat-Header.
- **CipherVault-Lockscreen** (`CipherVault.tsx`): animiertes Schloss + scrollende
  Chiffre-Tracks als State-Machine — das Schloss reagiert auf die Krypta
  (`busy`/`deny`/`locked`/`unlocking`/`tamper`/`fatal`): KDF läuft → Tracks
  beschleunigen; falsche Passphrase → rotes Shake; Unlock → Bügel öffnet + Burst;
  Device-Mismatch → amber; Self-Test-Fail → roter Jitter.

#### Geändert
- **Motion-System**: custom Easing-Curves (`--ease-out`/`--ease-in-out`),
  Buttons mit `:active`-Scale-Feedback, Panel-Stagger-Entrances, Nachrichten-
  Enter-Animation, pulsierende Verbindungs-Dots, Fokus-Glow — nur `transform`/
  `opacity`, alles `<300ms`, `prefers-reduced-motion` respektiert.
- Kontaktliste & Chat-Header neu gestaltet (Name + kleine Fingerprint-Zeile).

### Krypto-Härtung: Device-Binding + Lockout + Self-Test

Inspiriert von der At-Rest-Krypto des AZIS-Projekts, neu in SCYTALEs Architektur.

#### Hinzugefügt
- **Device-Binding**: ein **non-extractable** AES-256-GCM-Gerätekey (IndexedDB)
  verschlüsselt ein zufälliges `bindingSecret`, dessen Klartext vor Argon2id in
  die Passphrase gemischt wird. Ein exfiltrierter Tresor (kopierte IndexedDB,
  Geräte-Image) ist **ohne den Gerätekey nicht entsperrbar** — auch mit korrekter
  Passphrase. Verifiziert gegen echten Vault-Code.
- **Brute-Force-Lockout**: 5 Fehlversuche → eskalierender Cooldown (30 s → 300 s),
  persistent in IndexedDB, mit Countdown im Lockscreen.
- **Runtime-Self-Test**: AES-256-GCM-Roundtrip beim Start; schlägt er fehl →
  `CRYPT ERROR` und Login-Block.
- Vault-Header um optionales `deviceWrap` erweitert; `vault.ts` bleibt pure
  Krypto (Node-testbar), Binding/Lockout leben in `lib/vaultService.ts`.

### Onboarding-UX: QR-Code + Deep-Link + kompaktes Token

#### Geändert
- **Bundle-Token** von doppeltem Base64-JSON auf **kompakten Binär-Pack**
  (base64url) umgestellt → ~540 → **270 Zeichen**, URL-safe.

#### Hinzugefügt
- **Deep-Link** `…/#add=<token>`: ein Tap öffnet die App und importiert den
  Kontakt automatisch (Fragment wird nach dem Import aus der URL entfernt).
- **QR-Code** des Kontakt-Links (`qrcode`, lazy-geladen, als `data:`-Bild) —
  das Gegenüber scannt mit der normalen Handy-Kamera; SCYTALE braucht dafür
  keine Kamera-Berechtigung.
- „Kontakt hinzufügen" akzeptiert jetzt **Link *oder* rohes Token**.

### Etappe 6 — PWA-Härtung

#### Hinzugefügt
- **Content-Security-Policy** `default-src 'self'` + Security-Header (HSTS,
  `nosniff`, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy,
  COOP/CORP) auf allen Asset-Antworten im Worker → kein externes Nachladen oder
  Exfiltrieren, selbst bei XSS.
- **Update-Prompt**: Service Worker im `prompt`-Modus (`registerType: 'prompt'`,
  `ReloadPrompt.tsx`) — neue Version aktiviert sich nie ohne Bestätigung.
- **Auto-Lock**: DEK wird nach 5 Minuten Inaktivität aus dem RAM entfernt.
- **`SECURITY.md`**: Bedrohungsmodell, PWA-Härtung, Reproducible-Build-Verifikation.

#### Geändert
- **Lazy-Loading** von libsodium & hash-wasm via dynamischem `import()` → App-Shell
  von ~270 KB auf **~70 KB gzip**; libsodium (188 KB gzip) lädt als eigener Chunk
  erst bei Bedarf. Krypto-Round-Trip nach dem Umbau erneut verifiziert.

### UI-Migration: Svelte → React

#### Geändert
- View-Layer von Svelte 5 auf **React 19** umgestellt (`App.tsx`,
  `Messenger.tsx`, `main.tsx`); `@vitejs/plugin-react` statt Svelte-Plugin,
  Typecheck via `tsc --noEmit` statt `svelte-check`.
- **Die gesamte Krypto- und Lib-Schicht (`src/crypto/`, `src/lib/`) blieb
  unverändert** — framework-agnostisches TypeScript. Alle Krypto-/Plumbing-Tests
  weiterhin gültig.

### Etappe 5 — Relay + Chat-UI

#### Hinzugefügt
- **Wire-Format** (`wire.ts`): Envelope-Serialisierung — `prekey` (mit
  X3DH-Header für den Erstkontakt) und `msg` (normale Ratchet-Nachricht);
  Prekey-Bundle als Base64-Token für Copy-Paste-Austausch.
- **Session-Persistenz**: kompletter Ratchet-State + Kontakte verschlüsselt im
  Tresor (`serializeState`/`deserializeState`, `serializeContact`) — Gespräche
  überstehen Lock/Reload.
- **Konversations-Logik** (`session.ts`, transport-/storage-agnostisch):
  `makeContact`, `sendMessage`, `receiveMessage`; deterministischer Relay-Raum
  `hash(sortiert(beide Identity-Keys))`; Initiator/Responder-Rollen automatisch.
- **Relay-Client** (`relay.ts`): WebSocket zum Durable Object, nur Ciphertext,
  Auto-Reconnect.
- **Chat-UI** (`Messenger.svelte`): eigenes Bundle teilen, Kontakt per Token
  hinzufügen, Live-1:1-Chat mit Nachrichtenliste und Verbindungsstatus;
  `App.svelte` auf reinen Auth-Screen reduziert.
- Verifiziert gegen echten kompilierten Code: voller Zwei-Parteien-Ablauf über
  Wire-Envelopes **mit Serialisierungs-Round-Trip nach jeder Nachricht**
  (Persistenz), inkl. Out-of-Order. Worker + Durable Object via
  `wrangler --dry-run` validiert.

### Etappe 4 — Double Ratchet

#### Hinzugefügt
- **Double Ratchet** (Signal-Spec) auf dem X3DH-Geheimnis:
  - **Symmetric-key ratchet** (`KDF_CK` via HMAC-SHA256): frischer Message Key
    pro Nachricht → **Forward Secrecy**.
  - **DH ratchet** (`KDF_RK` via HKDF-SHA256): frischer DH-Output pro Roundtrip
    → **Post-Compromise Security** (Selbstheilung).
  - Pro Nachricht AES-256-GCM mit aus dem Message Key abgeleitetem Key+IV;
    Header (`dh || pn || n`) in die AEAD-AD gebunden.
  - **Skipped Message Keys** für Out-of-Order-/verlorene Nachrichten
    (begrenzt durch `MAX_SKIP = 1000`).
- Verifiziert gegen den **echten kompilierten Modul-Code** (esbuild-Bundle):
  Zwei-Wege-Konversation, 5 Round-Trips, Out-of-Order-Zustellung,
  Ciphertext-/Header-Tampering abgelehnt, gleicher Klartext → verschiedene
  Ciphertexte.

### Etappe 3 — Key Exchange (X3DH)

#### Hinzugefügt
- **Prekeys**: signierter Prekey (X25519, per Ed25519-Identität signiert) +
  Batch aus 100 Einmal-Prekeys. Private Hälften im Tresor verschlüsselt,
  öffentliches Bundle zum Verteilen.
- **X3DH-Handshake** (Signal-Spec): vier DHs (`DH1..DH4`) → HKDF-SHA256 mit
  `0xFF`-Präfix und Zero-Salt → gemeinsames Geheimnis, asynchron (Empfänger
  muss nicht online sein).
  - Initiator prüft die Signed-Prekey-Signatur → bricht bei Manipulation ab
    (MITM-Abwehr).
  - Associated Data (`IK_A || IK_B`) bindet die Identitäten.
  - HKDF via WebCrypto (nativ, keine zusätzliche WASM-Abhängigkeit).
- Prekey-Service: Erzeugung/Persistenz, Bundle-Bau, Einmal-Prekey-Verbrauch
  (nie wiederverwendet).
- Verifiziert: identisches Secret bei Alice/Bob (mit/ohne OPK), Abbruch bei
  vertauschtem Prekey, frische Ephemerals → frische Secrets.

### Etappe 2 — Identität

#### Hinzugefügt
- Langlebige Geräte-Identität: **Ed25519**-Keypair (Signieren) + **X25519**-Keypair
  (Diffie-Hellman), via libsodium (`libsodium-wrappers-sumo`).
- Private Schlüssel werden **im Tresor verschlüsselt** (DEK/AES-256-GCM) abgelegt;
  Erzeugung automatisch beim ersten Start.
- **Safety Number**: BLAKE2b-256 über die öffentlichen Schlüssel, als sechs
  5-Ziffern-Gruppen — Basis für spätere MITM-Verifikation.
- Krypto-Bausteine für X3DH/Double Ratchet vorbereitet: `sign`/`verify`
  (Ed25519), `dhAgree` (X25519).
- Krypto-Ordner umstrukturiert (Bytes-Typ, Codec, Sodium-Init ausgelagert).

### Etappe 1 — Scaffold + At-Rest-Kern

#### Hinzugefügt
- PWA-Grundgerüst: Vite + Svelte 5 + TypeScript, installierbar mit
  Service-Worker-Precache der App-Shell (erste Härtung gegen Code-Push).
- **At-Rest-Verschlüsselung (KEK/DEK-Envelope):**
  - Argon2id (`hash-wasm`) leitet aus Passphrase + zufälligem Salt den
    Key-Encryption-Key (KEK) ab — non-extractable, nur im RAM.
  - Zufälliger Data-Encryption-Key (DEK), unter dem KEK gewrappt; als
    non-extractable `CryptoKey` importiert (kein rohes Schlüsselmaterial in JS).
  - AES-256-GCM pro Record mit frischem 96-Bit-Nonce und AAD-Bindung
    (Record-Typ/Version → Anti-Record-Swapping).
  - Argon2-Kalibrierung: wählt die Speicherkosten passend zum Gerät.
- Cloudflare Worker + Durable Object als WebSocket-Relay (Hibernation API);
  ein Deploy serviert PWA und Relay.
- IndexedDB-Speicher — hält ausschließlich Ciphertext + den nicht-geheimen
  Tresor-Header.
- Krypto-Round-Trip verifiziert: Falsch-Passphrase-Erkennung über GCM-Tag
  (ohne separaten Verifier), AAD-/Ciphertext-Tamper-Erkennung, kein
  Klartext-Leak.
