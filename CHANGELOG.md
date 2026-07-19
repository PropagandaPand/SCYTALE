# Changelog

Alle nennenswerten Änderungen an SCYTALE. Format nach
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

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
