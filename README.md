# SCYTALE

Ein Ende-zu-Ende verschlüsselter Messenger als **PWA** — gebaut gegen anlasslose
Massenüberwachung (Stichwort *Chatkontrolle* / CSAR-Verordnung).

Benannt nach der [Skytale](https://de.wikipedia.org/wiki/Skytale), der
spartanischen Transpositions-Chiffre.

## Prinzip

Der Server ist ein **dummer Ciphertext-Briefkasten**. Er sieht *niemals*
Klartext. Alle Ver- und Entschlüsselung passiert ausschließlich auf dem Gerät.

### Zwei unabhängige Verschlüsselungsschichten

**1. At-Rest (auf dem Gerät)** — implementiert in Etappe 1:

```
passphrase --Argon2id(salt, 256 MiB)--> KEK  (non-extractable, nur RAM)
KEK        --wrap/unwrap AES-256-GCM--> DEK  (non-extractable, zufällig)
DEK        --AES-256-GCM (frischer 96-bit Nonce + AAD)--> alle Records
```

Der DEK ist ein **non-extractable `CryptoKey`** → rohes Schlüsselmaterial ist
für JS/XSS nicht auslesbar. Falsche Passphrase wird über den fehlschlagenden
GCM-Auth-Tag erkannt — ohne separaten Verifier.

**2. Transport (E2E über das Netz)** — Etappe 3–4:
X3DH-Handshake + Double Ratchet (Signal-Stil, via libsodium-Primitive) für
Forward Secrecy und Post-Compromise Security.

## Stack

- **Frontend:** Vite + React 19 + TypeScript, als installierbare PWA
- **Krypto:** `hash-wasm` (Argon2id) + WebCrypto (AES-256-GCM)
- **Backend:** Cloudflare Worker + **Durable Object** (WebSocket-Relay,
  Hibernation API) + D1 (Mailbox, später)
- **Storage:** IndexedDB (nur Ciphertext)

## Roadmap

- [x] **Etappe 1** — Scaffold + At-Rest-Kern (Argon2id / KEK-DEK / AES-256-GCM)
- [x] **Etappe 2** — Identität: Ed25519 + X25519 Keys, im Tresor verschlüsselt, Safety Number
- [x] **Etappe 3** — Key Exchange: Prekey-Bundles + X3DH (HKDF-SHA256, MITM-Abwehr)
- [x] **Etappe 4** — Double Ratchet (Forward Secrecy + Post-Compromise Security, Out-of-Order)
- [x] **Etappe 5** — Relay + Chat-UI: Wire-Format, Session-Persistenz, Live-Chat über Durable Object
- [x] **Etappe 6** — PWA-Härtung: CSP + Security-Header, Update-Prompt (kein Silent-Swap), Auto-Lock, Lazy-Load, [SECURITY.md](SECURITY.md)
- [ ] **Später** — Metadaten-Schutz (Sealed Sender), Gruppen (MLS?)

## Entwicklung

```bash
npm install        # .npmrc setzt ignore-scripts (umgeht miniflares sharp-Build)
npm run dev        # Vite-Dev-Server (nur Frontend, ohne Relay)
npm run build && npm run cf:dev  # Worker + Durable Object lokal (inkl. Relay)
npm run deploy     # Build + wrangler deploy
```

### Zu zweit testen (1:1-Chat)

1. `npm run build && npm run cf:dev` starten → zwei Browser-Fenster auf die
   lokale Worker-URL öffnen (oder die App deployen und auf zwei Geräten öffnen).
2. In jedem Fenster einen Tresor anlegen (eigene Passphrase).
3. In Fenster A **„Mich teilen (QR / Link)"** → den **QR mit der Handy-Kamera
   scannen** lassen oder den **Link schicken** (ein Tap fügt hinzu). Alternativ
   Link/Token unter **„Kontakt hinzufügen"** einfügen. Umgekehrt genauso.
4. Einer schreibt zuerst — er wird X3DH-Initiator, der andere antwortet. Ab da
   läuft der Double Ratchet.

Das Kontakt-Bundle enthält **nur öffentliche Schlüssel** — der Link darf über
jeden Kanal (auch unsicher) geteilt werden. Gegen Man-in-the-Middle vergleicht
ihr danach eure **Safety Number**.

## Ehrliche Grenzen

- **Metadaten:** Der Relay sieht *wer-mit-wem-wann*. Inhalt nie. Sealed Sender
  ist geplant, aber Traffic-Analyse bleibt schwer.
- **Code-Delivery:** Eine PWA lädt JS vom Server — ein kompromittierter Server
  könnte backdoored Code ausliefern. Gegenmittel: Service-Worker-Pinning der
  installierten App + reproducible builds. Wird dokumentiert, nicht versteckt.
- **Endpoint:** Gegen ein kompromittiertes Gerät hilft keine Verschlüsselung.
