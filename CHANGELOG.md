# Changelog

Alle nennenswerten Änderungen an SCYTALE. Format nach
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

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
