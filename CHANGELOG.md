# Changelog

Alle nennenswerten Änderungen an SCYTALE. Format nach
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

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
