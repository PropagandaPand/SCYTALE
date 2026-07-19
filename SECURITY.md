# Sicherheit & Bedrohungsmodell

SCYTALE ist gegen **anlasslose Massenüberwachung** gebaut (Chatkontrolle /
CSAR). Dieses Dokument ist die genaue Aufschlüsselung aller Mechanismen und
sagt ehrlich, was geschützt ist — und was nicht. Stand: v0.11.5.

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
  Kontakt als *verifiziert* markierbar.

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

---

## 5. Transport & Server

`worker/relay.ts`, `worker/index.ts` · `src/lib/relay.ts`, `session.ts`

- **Durable Object = Briefkasten pro Inbox.** Nur Ciphertext, keine Schlüssel,
  kein Klartext; kennt nur Routing-Metadaten.
- **Inbox** = `SHA-256("scytale-inbox:" ‖ Ed25519-SignPub)` — aus der eigenen
  Identität ableitbar, man lauscht ohne jemanden zu kennen.
- **Owner-Auth per Ed25519-Challenge-Response**: DO schickt Nonce, Besitzer
  signiert, DO prüft `hash(signPub)==Inbox` **und** Signatur. Nur der Besitzer
  leert seine Queue — nicht jeder, der bloß den Code hat.
- **Store-and-Forward**: SQLite-Queue, Ack-basiert. Beide müssen **nicht**
  gleichzeitig online sein. **Queue gedeckelt** (`MAX_QUEUE`=1000 pro Inbox):
  da Senden bewusst ohne Auth ist, begrenzt der Cap Flooding; bei Voll wird
  verworfen, heilt beim Leeren. **Replays** injizieren keine Nachrichten — der
  Double Ratchet lehnt bereits verbrauchte Message-Keys ab.
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

- **Metadaten**: der Relay sieht *welche* Inbox *wann* Ciphertext bekommt
  (Timing, Größe, Routing/conv-IDs). Inhalt und Identitäts-Klartext nie. Sealed
  Sender ist geplant; Traffic-Analyse bleibt hart.
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
- **Kein Recovery (bewusst)**: der Device-Key liegt in IndexedDB. Löscht der
  Nutzer die Website-Daten (bzw. Safari räumt nach längerer Inaktivität auf),
  ist der Tresor auf demselben Gerät **unwiederbringlich** — das ist die gewollte
  Kehrseite von „keine Hintertür": ein exportierbares bindingSecret wäre ein
  Wiederherstellungs- *und* Exfiltrationspfad. Ein optionaler, unter separater
  Passphrase verschlüsselter Export bleibt eine mögliche spätere Wahl.
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
