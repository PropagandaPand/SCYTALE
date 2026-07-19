# Sicherheit & Bedrohungsmodell

SCYTALE ist gegen **anlasslose Massenüberwachung** gebaut (Chatkontrolle /
CSAR). Dieses Dokument sagt ehrlich, was geschützt ist — und was nicht.

## Kryptografischer Aufbau

| Schutz | Verfahren |
|---|---|
| Daten auf dem Gerät (at-rest) | Argon2id → KEK, AES-256-GCM (KEK/DEK-Envelope), DEK als non-extractable `CryptoKey` |
| Identität | Ed25519 (Signieren) + X25519 (DH) |
| Schlüsselaustausch | X3DH (asynchron, MITM-Abwehr über signierte Prekeys) |
| Nachrichten (in transit) | Double Ratchet — Forward Secrecy + Post-Compromise Security, AES-256-GCM pro Nachricht |

Der Relay (Cloudflare Durable Object) ist ein **dummer Ciphertext-Briefkasten**.
Er sieht nie Klartext und hält nie Schlüssel.

## PWA-Härtung

- **Content-Security-Policy** `default-src 'self'`: die App kann zu keinem
  externen Host verbinden — selbst ein erfolgreiches XSS kann keinen Schlüssel
  exfiltrieren. Dazu HSTS, `nosniff`, `frame-ancestors 'none'`, restriktive
  Permissions-Policy (siehe `worker/index.ts`).
- **Kein Silent-Update**: der Service Worker läuft im `prompt`-Modus. Eine neue
  Version aktiviert sich **nie ohne Bestätigung** — kein unbemerkter Code-Tausch.
- **Auto-Lock**: nach 5 Minuten Inaktivität wird der DEK aus dem RAM entfernt;
  die App verlangt erneut die Passphrase.
- **Precache**: die installierte PWA lädt die App-Shell aus dem SW-Cache, nicht
  bei jedem Start frisch vom Server.

## Reproducible-Build-Verifikation

Das Restrisiko einer PWA: der Server könnte manipuliertes JavaScript ausliefern.
Gegenmittel ist **Nachprüfbarkeit** — jeder kann zeigen, dass das ausgelieferte
Bundle exakt aus dem öffentlichen Quellcode entsteht:

```bash
git checkout <commit>
npm ci --ignore-scripts
npm run build
# Hash der ausgelieferten Assets bilden ...
find dist/assets -type f -name '*.js' -exec sha256sum {} \; | sort
# ... und mit den Hashes der live ausgelieferten Dateien vergleichen
# (z. B. per Browser-DevTools → Network → Response).
```

Stimmen die Hashes, entspricht der laufende Code dem geprüften Quellcode.
(Voraussetzung: deterministischer Build — gleiche Node-/npm-Version.)

## Bekannte Grenzen (ehrlich)

- **Metadaten**: der Relay sieht *wer-mit-wem-wann* (Raum-Zugehörigkeit,
  Zeitpunkte). Inhalt nie. Sealed Sender ist geplant; Traffic-Analyse bleibt hart.
- **Code-Delivery-Vertrauen**: siehe oben — mitigiert, nicht eliminiert.
- **Endpoint**: gegen ein kompromittiertes Gerät (Malware, Client-Side-Scanning
  im OS) hilft keine E2E-Verschlüsselung. Genau das ist der Kern der Kritik an
  der Chatkontrolle.
- **Bundle-Austausch**: aktuell out-of-band (Copy-Paste). Ein Prekey-Server für
  echtes Onboarding steht noch aus.

## Verantwortungsvolle Offenlegung

Sicherheitslücken bitte **nicht** über öffentliche Issues melden, sondern direkt
an den Repo-Betreiber.
