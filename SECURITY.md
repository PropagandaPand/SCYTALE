# Security & Threat Model

SCYTALE is built against **suspicionless mass surveillance** (the EU "Chatkontrolle" /
CSAR proposal). This document is the precise breakdown of every mechanism and states
honestly what is protected — and what is not. Status: current `main` — on top of Stage
3d multi-device (fan-out, per-device sessions, self-sync) and link initial-sync, it adds
**Face ID / Touch ID unlock**, an **attachment blob store**, and **streaming Backup v2**.

**Guiding principles:** never invent our own crypto (vetted primitives + established
protocols: X3DH, Double Ratchet); the server is a **dumb ciphertext mailbox** with no
knowledge; state is adopted **only after authentication succeeds** (commit discipline,
see §4).

**What is non-extractable — and what is not.** To be precise, because this line used to
overclaim: the **KEK, the DEK, and the per-message AES-GCM keys** are non-extractable
`CryptoKey`s; their raw bytes are unreachable from JavaScript. **Not** non-extractable are
the keys libsodium manages or that are needed as KDF input: the ratchet state (`RK`,
`CKs`, `CKr`, the whole `skipped` map with its message keys, `DHs.privateKey`) and the
identity/master private keys live as plain `Uint8Array` in memory. That is unavoidable
with libsodium-wrappers and irrelevant to at-rest protection — but it means **an XSS
foothold in a running, unlocked tab could read key material**. The defence there is the
CSP and the locked vault, not non-extractability.

---

## 1. Data at rest (the vault)

`src/crypto/vault.ts`, `argon2.ts` · `src/lib/vaultService.ts`, `deviceKey.ts`, `lockout.ts`, `biometric.ts`

**KEK/DEK envelope:**
```
passphrase --Argon2id--> KEK (non-extractable, RAM only)
KEK --AES-256-GCM wrap/unwrap--> DEK (non-extractable, random)
DEK --AES-256-GCM--> every record on disk
```
- **Argon2id** (memory-hard, GPU/side-channel resistant): 256 MiB, 3 passes, 32-byte
  output; a random 16-byte salt per vault (in the clear, not a secret). On-device
  calibration falls back to 128/64 MiB; the parameters live in the vault header. A
  **code-side floor** (`MIN_ARGON2` = 64 MiB / t=3): the header is not authenticated
  before the DEK unwrap, so weakened parameters (m=8 MiB, t=1) are **ignored** — never
  derived below the floor. **And a ceiling** (`MAX_ARGON2` = 1 GiB / t=16): the same
  unauthenticated header would otherwise permit `memorySize: 2000000`, which aborts every
  derivation via OOM and makes the vault **permanently unopenable**. A floor alone turns a
  weakening attack into a destruction attack.
- **KEK** imported with `wrapKey`/`unwrapKey` only; raw bytes overwritten with `fill(0)`
  afterwards.
- **DEK**: a random AES-256-GCM key, non-extractable. Changing the passphrase only re-wraps
  the DEK — **no** re-encryption of the whole database.
- **Per record**: AES-256-GCM with a **fresh 96-bit nonce** + **AAD** (binds type/id/version
  into the auth tag → no swapping/rollback between slots).
- **A wrong passphrase** is detected by the failing GCM tag on the DEK unwrap — **no
  separate verifier** (that would itself be an offline-attack oracle). A **corrupt header**
  instead reports `VaultCorruptError` rather than "wrong passphrase": someone retyping a
  correct passphrase for the fifth time while the record is actually broken is looking in the
  wrong place — the same diagnosability lesson as a silent handshake failure.

**Device binding.** A non-extractable AES-256-GCM key is generated once per device/browser
profile and kept in IndexedDB (raw bytes never JS-readable). It encrypts a random
*bindingSecret* that is mixed into the passphrase **before** Argon2id → an exfiltrated vault
is **worthless without this device**, even with the correct passphrase.

**Biometric unlock (Face ID / Touch ID) — opt-in.** A convenience door onto the *same* vault,
never a weaker copy of the key on disk. It is a **second wrap of the same random DEK** under a
KEK derived from a **WebAuthn PRF** secret:
```
Face ID / Touch ID (platform authenticator, user verification)
  --> PRF secret (32 B, only exists after a live biometric UV)
  --HKDF-SHA256, salted with the device-bound secret--> prfKEK (non-extractable)
prfKEK --AES-256-GCM wrap--> the SAME DEK  →  header.prf
```
- **At-rest is preserved.** Disk gains only one more GCM copy of the DEK. It is useless
  without **both** a live biometric UV on the passkey **and** this device's device key: the
  PRF secret cannot be derived from anything on disk, and the KEK is HKDF-salted with the
  device-bound secret. Platform passkeys can *sync* (iCloud Keychain, Google Password
  Manager), so the PRF secret alone is not strictly per-device — the device-key salt is what
  makes an exfiltrated `header.prf` open only on a device holding both factors.
- **Enrollment needs the passphrase once** — it is the only holder of the DEK in a
  re-wrappable form (the live DEK is non-extractable). Enrollment is gated by the **same
  brute-force lockout** as the passphrase path, so it cannot be used as an uncounted
  passphrase-guessing oracle.
- **Unlock runs no Argon2** (just PRF → KEK → unwrap) and is deliberately **not** lockout-gated:
  the authenticator is hardware-rate-limited, not offline-guessable. The `header.prf` record
  gets the same corrupt-record pre-checks as the passphrase path.
- **The passphrase always remains the primary path.** Biometrics is pure opt-in; anyone who
  doesn't want it never enables it. Disabling drops `header.prf` — but note this is **not
  secure erasure**: IndexedDB's log-structured store may keep the prior wrap in uncompacted
  logs until it compacts, and the OS passkey is left for the user to delete (it is inert
  without `header.prf`). See *Known limits*.

**Attachment blob store** (`src/lib/attachments.ts`). Attachments do **not** live inline in the
message log (a single per-room JSON blob) — a large file would make every message append
absurdly expensive and re-encrypt the whole log. Instead each attachment is stored **out of
band as per-chunk DEK-sealed records** (`att:<id>:<idx>`, AAD `scytale:att:v1:<id>:<idx>`),
never a single multi-MB `Uint8Array`; a message carries only a reference `{name, mime, attId,
size}`. Rendering decrypts chunk-by-chunk into a `Blob` (which the browser may spill to disk)
and hands out an object URL. GC/refcount and a boot sweep collect orphaned attachments; old
inline `dataB64` is still read (lazy migration). Stickers stay inline — they are tiny cropped
squares and the sticker library dedups on their bytes.

**Recovery backup (a deliberate trade-off, `src/lib/backup.ts`).** For multi-device / device
change there is an **encrypted file export** of the identity (incl. master private key),
contacts and history. This is the **first mechanism that deliberately relaxes device binding** —
a backup is by definition the exfiltratable path device binding otherwise forbids. So it is
tightly gated:
- **Opt-in and explicit**, never automatic.
- **Second authentication:** the vault passphrase is **re-prompted immediately before the
  export** (`unlockBoundVault`) — an unlocked vault + physical access is not a one-click exfil.
- **A separate export passphrase** encrypts the file with **full Argon2id**; the `MIN_ARGON2`
  floor is **not** bypassed (AES-256-GCM under the derived key).
- **Backup v2 streams.** The export is a length-prefixed binary container
  (`[u32 headerLen][header JSON][meta ciphertext][attachment ciphertext…]`) with **each
  section encrypted separately** and streamed as a `Blob`, so a large history (incl. videos)
  never has to be `JSON.stringify`'d and encrypted as one in-memory string. Import reads
  section by section; **one corrupt attachment no longer sinks the rest** — it is counted and
  skipped, the rest restores.
- **Rotation note:** a backup contains the master private key. After a master rotation an
  **old** backup still decrypts the *old* master (it can issue device certs of its epoch for
  not-yet-rotated contacts). **Old backups must be destroyed on rotation** (the rotation flow
  says so explicitly).
- **Ratchet-state fork (migration ≠ simultaneous):** the backup contains Double Ratchet
  sessions. If the source device keeps running after the restore and **both** send to the same
  contact, they share a ratchet state → same message numbers for different messages → the
  receiver discards them and the session dies (heals only via a fresh X3DH). Likewise an
  **old** restore resets chain counters and breaks live sessions. Migration (one active device)
  is safe; today only a **UI warning** enforces that, not a cryptographic lock — real
  simultaneous multi-device needs per-device sessions (Stage 3).

**Brute-force lockout:** after 5 failures an escalating cooldown (30 s · 2^(n−5), capped at
300 s), persisted in IndexedDB.

**Auto-lock:** after 5 minutes of inactivity the DEK is dropped from RAM and the app requires
the passphrase (or Face ID) again. A **runtime self-test** checks the primitives at startup.

---

## 2. Identity & verification

`src/crypto/identity.ts`

- **Ed25519** (signing) + **X25519** (DH) via libsodium.
- **Pairwise safety number** + **identicon** for out-of-band comparison against MITM; a contact
  can be marked *verified* (against the **master**, stable across devices).
- **A contact's identity change is never adopted automatically:** the claimed master is only
  recorded as a **suggestion** (and only if its device cert verifies under it) and requires a
  deliberate user action plus a **fresh safety-number comparison**.
- **Binding the claim to the conversation:** the `conv` field is pure routing — the sender picks
  it freely, and the relay accepts unauthenticated sends to any inbox. A device cert also proves
  **nothing about possession** of the keys inside it: anyone can generate a master keypair and
  self-issue a cert over *arbitrary* public keys. So before any state change we check that the
  claimed identity **derives the same `roomId`** (`computeRoomId(myDH, claimedDH)`). Without it, a
  group member who knows another's `dhPub` from the roster could inject an identity change for a
  *third-party* contact and get pinned into their place on accept. Rotation and device linking
  pass the check (the device keys stay, only the master changes); a peer with genuinely new device
  keys shows up as a **new contact** — the honest rendering, not a regression. The check sits **at
  the very top of `receiveEnvelope` and applies to every prekey**, not only in the master-change
  branch: if the master happens to match, that branch is skipped and the only remaining guard would
  be the cert check in `respondX3DH` — which catches a forgery, but only after we already accepted
  the envelope as belonging here. Defence must not depend on which branch a message takes.

### Stage 3c — master-based `roomId`, device revocation, two-sided door

- **`roomId` is master-based** (`computeMasterRoomId(myMaster, peerMaster)`, sorted, with a domain
  prefix against collision with the old device-DH scheme): a conversation is a property of the
  **people**, not the device pairs. A prekey's authorization is therefore `bytesEqual(claimedMaster,
  pinnedMaster)` — the peer `dhPub` is roster-visible and does not bind, only the master does,
  because only its devices hold a cert under it. Failure = **rejection, never** a fall into a door
  branch (that would be the v0.16.4 downgrade back).
- **Migration (device→master) is crash-safe:** it **re-encrypts** under the new roomId AAD (never
  rename — else `open()` throws and the contact vanishes silently), writes the new **before**
  deleting the old, and on a crash-interrupted duplicate merges by "live session wins" instead of
  blindly overwriting. A `regime` marker makes it idempotent. Every re-key site (boot,
  `acceptMasterChange`, `reconnectContact`, rotation) runs through **one** routine.
- **Device revocation (cert AND list presence):** a prekey from a device whose cert is valid under
  the pinned master but that is **not in the accepted, master-signed device list** is rejected
  (`RevokedDeviceError`). The list is never built implicitly from the verified device
  (self-referential); a second device is legitimized only by a **real devlist update** (E2E gossip,
  verified + rollback-checked). **Best-effort and documented as such:** revocation applies for a
  contact as soon as they have seen the newer list — the same property as Signal/Element. The guard
  sits **before** the sim-init branch, else a revoked device could destroy the live ratchet via the
  tie-break. The prekey guard blocks only **new** handshakes; so that a revoked device cannot keep
  sending `msg` envelopes over its **already established** ratchet, `applyDeviceListUpdate` **tears
  the ratchet down** as soon as the device behind the live session drops out of the accepted list.
- **A two-sided door, two trust labels — never merged:**
  - **Dual-signed rotation** (a chain from the pinned master, `verifyRotation`): cryptographically
    **proven** continuity → `acceptRotation` re-keys the room automatically and **keeps `verified`**.
  - **An unproven `previousMaster` hint** (unsigned, unsignable, **outside the AAD** — it
    authenticates nothing): only raises a **merge affordance** ("claims to be X — nothing proves it —
    compare the safety number"); only the deliberate `acceptMasterChange` re-pins and sets
    `verified=false`. A chain **proves** → re-key; a hint **claims** → only ask.
- **`verified` drops only by a user action**, never by anything inbound. A claim does **not** reset
  the flag; only `acceptMasterChange` — the deliberate re-pin — clears it. Otherwise anyone who can
  reach our inbox could burn down the verification flag of any contact at will: a verification DoS
  that trains away the MITM warning and thus manufactures the precondition for a later mis-accept.
- **Denylist of abandoned masters (deliberately final):** when the user accepts a change, the
  replaced master lands on the contact's denylist and is **never offered again**. Rationale: an
  abandoned master is the *most likely compromised key in the system* — it sits in old backups and
  on discarded devices, usually exactly why it was abandoned. A downgrade offer onto it would be an
  attacker's first move with old material, and the **old safety number reads as familiar rather than
  alarming** at comparison ("matches what I saw before") — the deliberate confirmation would confirm
  the wrong thing. A message under a denylisted master is **visibly rejected** (not silently dropped)
  and leaves `verified` **untouched**. The denylist is **globally indexed by master** (no longer on
  the contact) and **travels in the recovery export**; a restore **unions** it with the local set
  (never overwrites — an older backup must not revive an already-abandoned identifier). *Intended
  consequence:* the way back to an abandoned master is **permanently shut**, even for the legitimate
  user who changes their mind. The way back is a fresh identity build. That is the protection, not a
  bug.
- **Warn exactly once (against alert fatigue):** whoever holds the abandoned key can send at will. A
  warning *per message* would be a **harassment lever** — and worse, it would train the user to
  dismiss security notices until a real one goes unread. Alert fatigue is an attack on the *human*
  component, not the crypto. The hint therefore appears once at the transition and then becomes
  **contact state** (`retiredAttempt`), visible in the contact view.

### Stage 3d — multi-device: fan-out, per-device sessions, self-sync

- **One session PER peer device.** `Contact.sessions` is a map from `base64(deviceSignPub)` to its
  own Double Ratchet session. The person layer (`roomId`, `verified`, `peerDeviceList`, the identity
  door) stays **singular**; only the ratchet layer multiplies. **Invariant I holds PER session:** a
  message key exactly once *per session*, and a `RatchetState` is **never** shared/cloned across two
  map entries (that would join two chains into a two-time pad — an executable property with a
  negative control in `invariant-i-per-session`).
- **Fan-out.** A 1:1 message is encrypted for **every authorized device** of the master-signed
  `peerDeviceList` (`fanoutDeliveries`), each copy with the **same E2E `mid`** (16 random bytes,
  **inside** the AEAD → not forgeable to suppress a real message), so devices dedup. A device we
  cannot (yet) initiate to is **`stale`** and drops out of the delivery aggregate's denominator —
  correct behaviour never shows a permanent error. Every device is its own session (no aliasing); a
  per-device failure isolates that device.
- **Signed prekey in the devlist (v2).** So a peer can initiate to a **silent** second device, every
  list entry carries the stable signed prekey, **bound in the master-signed `listMsg`** → a stale SPK
  travels only with a lower-versioned list, which `isNewerDeviceList` rejects (rollback protection for
  free via list monotonicity, no second versioned channel).
- **Self-sync.** What I send is mirrored by a hidden `self` contact (`peerMaster == my master`,
  `peerDeviceList == my own device list`) as a `sent` copy to my **other** devices. The frame carries
  the **target peer master**: **decrypt room ≠ display room** — the copy authenticates under the self
  contact (only my own master-listed devices get through) but is shown in the conversation room with
  the peer. It is **terminal** (never re-fanned, re-synced, or re-dispatched as its inner effect) and
  deduped via the original `mid`. A prekey under **my** master is routed to the self contact, never
  auto-created as a visible contact. A revoked own device is pruned from the self contact.
- **Reachability is a property of the PERSON, not the device pair.** The aggregate status ("to N/M
  devices") and the reachability dot judge the **current** device set — the same inversion as the
  door: the identity-bearing entity is the person.

### Link initial-sync — the account snapshot a newly linked device receives

Linking establishes identity, not content. Until this stage a linked device was cryptographically the
same account but visually empty — indistinguishable from a failed pairing. It now receives a
**snapshot** (`bootstrap` frame) carrying the **profile** (name, avatar) and the **contact roster**.
Chat history does **not** travel yet (issue #1).

**PULL, not push.** The primary does not send the snapshot when the SAS is confirmed: at that moment
the new device has not installed its identity yet, so the message would be delivered, acked and lost.
Instead the new device mints a `requestId`, persists it as pending, and asks (`bootreq`); the primary —
and only the primary, so sibling devices do not all answer — replies to exactly that one device. The
request survives reloads and is retried until a snapshot lands, so a pairing done while the primary was
offline still completes later.

**What the snapshot deliberately does NOT contain.** A roster entry carries only
`peerMasterPub / peerEpoch / peerSignPub / peerDhPub / nickname / peerName` plus a verification *hint*.
It carries **no ratchet state, no prekey bundle, no peer device list, no roomId**. Consequences, all
intended:
- **No ratchet is ever cloned.** Two devices sharing one ratchet would both advance it and reuse a
  message key — a two-time pad. Every device builds its own X3DH session per peer device (the Stage 3d
  invariant is preserved).
- **Imported contacts are send-blocked** until the real peer learns this device and writes. A
  substituted or maliciously linked device therefore gains **no immediate ability to send into the
  whole contact graph** — it can only receive.
- **`roomId` and the fingerprint are always derived locally** from (my master, peer master), never
  taken from the wire, so a manipulated snapshot cannot steer a conversation into the wrong room.

**Trust never travels.** `verified` is a device-local flag and is never adopted from a snapshot. The
sender's flag arrives only as a **suggestion** that opens the normal safety-number comparison on the
receiving device; there is no one-tap "accept". A compromised primary therefore cannot plant false
trust on a device it links. Dismissing the hint is persistent, so a re-delivered snapshot cannot nag.

**Merging fills gaps, never overwrites.** A contact this device already pinned, verified or learned via
TOFU wins over the snapshot; only missing fields are filled. Entries for my own master, for a
denylisted (abandoned) master, or whose locally derived room is already occupied by a *different* peer
are skipped outright. A contact left over from the pre-link identity (`staleIdentity`) is **not**
silently reactivated.

**Gating and idempotency.** `bootstrap` and `bootreq` are accepted **only** from my own devices
(`peerMaster == my master`), enforced both at the source (`receiveEnvelope`) and again in the inbox
handler. Both are terminal: never rendered as a message, never re-fanned. Import is idempotent via the
snapshot id, whose marker is written **last**, so a crash mid-import simply replays the merge.

**Reachability (`listack`).** A newly linked device is useless if peers keep talking only to the
primary. Peers acknowledge which version of my device list they hold, and I re-offer it while their
acknowledgement lags — addressed to the device that offered it. `listack` is intentionally **not**
self-gated: an acknowledgement about *my* list is legitimate from any peer and can only move a
watermark forward; an acknowledgement naming a version I never published is ignored. Re-offers back off
exponentially (capped at an hour) so a peer that cannot acknowledge (an older build, or simply offline)
never turns into a flood that fills their relay mailbox. While a peer is still behind, messages I
receive from them are additionally mirrored to my own devices; that stops as soon as they acknowledge.

**Residual exposure.** The snapshot is end-to-end encrypted to the target device's key, so the relay
never sees its content — but its **size and timing** leak roughly how many contacts an account has, in
one burst right after a pairing. Padding and spreading that burst are not implemented.

### Device linking

The **master private key never leaves the primary device** (Signal model) — a linked device therefore
cannot sign further devices. The flow is deliberately **two-stage**:

1. **N → P (QR):** `LinkRequest { deviceSignPub, deviceDhPub, sasEphPub }`
2. **P → N (sealed):** `LinkOffer { sasEphPub }` — **only** the ephemeral
3. **Both show 7 emoji (SAS). The user compares and confirms.**
4. **Only then P → N:** `LinkGrant { masterPub, epoch, deviceCert(N), deviceList(v+1) }`
5. N installs, P advances the list.

**Why the offer exists:** a `deviceCert` is a **bearer credential**. Once signed it is in the world —
*not* publishing the new device list does **not** revoke it, and a peer checking a bundle cert against
the master would accept the holder as us. If P sent the grant just so N could show a SAS, an attacker
whose QR was scanned by mistake would hold a valid certificate of our master even after "the emoji don't
match". So **nothing bearer-valued leaves P before human confirmation**; an ephemeral alone grants
nothing.

*Consequence for the UI:* an abort before step 4 leaves **zero state on both sides** — no cert issued, no
list version bumped, nothing to roll back. The commit is the **last** action, never a step that must be
undone (a rollback path nobody tests is worse than none).

**Wire formats are versioned** (version byte at position 0, in both the QR and the offer) and the decoder
**branches on it before the length check** — otherwise a future v2 format on an old device reports "invalid
code" instead of "app too old", and the user hunts a scanner bug instead of updating.

---

## 3. Key exchange — X3DH

`src/crypto/x3dh.ts`

Asynchronous Signal handshake (the recipient need not be online):
```
DH1 = DH(IK_A, SPK_B)   DH2 = DH(EK_A, IK_B)
DH3 = DH(EK_A, SPK_B)   DH4 = DH(EK_A, OPK_B)   ← one-time prekey (forward secrecy)
SK  = HKDF-SHA256( 0xFF·32 || DH1||DH2||DH3||DH4 ,  info="SCYTALE_X3DH_v1" )
```
- **The signed-prekey signature is checked** — a server-substituted key aborts (MITM protection).
- **Associated data = IK_A ‖ IK_B** bound into the first AEAD → both identities authenticated.
- Simultaneous two-sided setup is resolved deterministically (a tie-break on identity order) so the
  ratchets converge.

### One-time prekeys: deliberately NOT in the shared code

X3DH's one-time prekey only works if a server hands out each OPK **exactly once** and deletes it. SCYTALE
has no prekey server — the code is generated once and **broadcast** (QR, link, group roster). Every
recipient would get the same OPK.

The consequence was measurable and long unexplained: the first initiator consumes the OPK; every later one
then computes DH1–DH4 while we can only form DH1–DH3 — **their first message won't decrypt.** Whoever used
the same code second never reached us. Keeping the OPK instead of consuming it would be worse: it would be
one-time in name only, shared by all, and its compromise would open the first message of *every* contact.

**Decision:** the shared code carries **no** OPK. First-message forward secrecy therefore rests on the
**signed prekey** (rotatable) and from message two on the ratchet. Real OPK freshness needs a **code per
contact** — then "one code, one OPK" holds again, at the cost of a code no longer being broadcastable. The
machinery stays in the code, and the recipient still accepts and consumes an OPK if an older client's code
brings one. Checked in `tests/opk-reuse.test.mjs`: two different people initiate against the same code,
both arrive.

---

## 4. Messages — Double Ratchet

`src/crypto/ratchet.ts`

- **Symmetric ratchet**: chain KDF = HMAC-SHA256 (`HMAC(CK,0x01)`=MK, `HMAC(CK,0x02)`=CK'). Message key =
  `HKDF(MK)` → 32-byte **AES-256-GCM** key + 12-byte IV. Each message its own key.
- **DH ratchet** (root KDF = HKDF-SHA256): **post-compromise security** — the session heals after a
  compromise.
- **Forward secrecy**: old keys discarded; a leaked current key decrypts no past.
- **Out-of-order / lost**: skipped keys buffered. Double-capped against DoS: **1000 per jump** (`MAX_SKIP`)
  **and 2000 total per session** (`MAX_SKIP_SESSION`, oldest discarded) — a stream of high-N messages cannot
  grow the vault without bound.

> ### Invariant I: **a message key is used exactly once.**
>
> Everything else in this section is enforcement of that one sentence. Deriving the IV from the message key
> is **not** a weak point — it is clean *as long as the invariant holds*, and it saves separate nonce
> bookkeeping. It becomes dangerous only when the invariant holds **in memory alone**: then any state loss
> turns a repeated key into a repeated nonce (the bug in the group send paths, v0.16.2). The invariant must
> therefore hold **across persistence**, not just within a session.
>
> Enforcement: `encryptAndPersist` (send) writes the advanced state **before** transmitting; the receive
> path writes it **immediately after decrypting**, before any content processing (including deleting the
> consumed skipped key — *that* is one-time use on the receive side). The commit copy protects only
> **sequential** processing; the whole receive path additionally runs through **one promise chain** (per
> client), so a relay delivering the same ciphertext under two ack IDs becomes an ordinary, rejected replay
> rather than two concurrent decrypts of the same uncommitted state. **Send** runs through that same chain
> too (v0.19.2): otherwise a send landing between a concurrent decrypt's clone and its commit would roll the
> `CKs` advance back and reuse (key, nonce) = a two-time pad.

- **Commit discipline on decrypt (critical, v0.17.1):** `ratchetDecrypt` works on a **copy** and adopts it
  only after the AEAD check passes. Before that, `skipMessageKeys`, `dhRatchet` and the `delete` in
  `trySkipped` mutated state directly, with the tag checked only afterwards — no rollback. Delivering into an
  inbox is deliberately **auth-less** (that is how someone who has our code reaches us), and the inbox id is
  derivable from public material — so a random 32-byte X25519 pubkey as `header.dh` plus 48 bytes of garbage
  was enough to advance the DH ratchet, overwrite `DHr`/`RK`/`CKr`/`CKs`, reset counters, and kill the session
  in **both** directions — without any key material. With the copy, the skipped-key consumption is protected
  too: a forgery bearing the header of a delayed real message used to delete its key for good.
- **Input validation as a choke point:** `decodeEnvelope` checks types, key lengths and counter ranges before
  any value reaches the ratchet or X3DH, and rejects uniformly with `EnvelopeError`. Previously hostile input
  produced five different exception types depending on where it hit, and a 2-byte DH key was silently accepted
  and passed through to `dhRatchet`.

> ### Invariant II: **a ratchet state transition is atomic.**
>
> Fully carried out **and persisted**, or not at all. No intermediate state leaves memory, none survives a
> failure. Not a collection of three incidents but one statement with (so far) five enforcement points:
>
> | Transition | Enforcement | Without it |
> |---|---|---|
> | Send | `encryptAndPersist` writes **before** transmit | Nonce reuse after reload (v0.16.2) |
> | Receive | Persist **immediately after** decrypt, before any content processing | Replay of a consumed skipped key (v0.16.3) |
> | Decrypt | Draft copy, commit **after** the AEAD check | Remote session destruction without key material (v0.17.1) |
> | X3DH reply | OPK consumption and session creation are **one** step | Either an unprocessable retransmit or a reusable OPK |
> | Sim-init tie-break | Commit `ratchet`/`pendingHeader` only **after** `respondX3DH` (cert) and AEAD — build on locals | A forged prekey (public master+signPub, junk cert) destroyed the in-flight session (v0.19.x) |

- **The IV is derived, not transmitted** (`HKDF(MK)` → key ‖ IV, 44 bytes). This saves bandwidth but makes
  chain-key persistence **security-critical**: the same message key yields the same key *and* the same nonce.
  A rollback of the send chain key is therefore not a harmless replay but a **two-time pad** — it leaks the XOR
  of both plaintexts and permits reconstruction of the GHASH authentication key, i.e. **forgery**. Hence every
  outgoing path goes through `encryptAndPersist`, which writes the advanced state **before** transmit. If the
  send fails, the chain is still advanced — the next message uses a fresh key and leaves only a gap the
  receiver's skipped-key mechanism catches. The reverse (send before persist) would roll back onto a key that
  **was already on the wire**. A lost message is recoverable; a reused (key, nonce) pair is not.

---

## 5. Transport & server

`worker/relay.ts`, `worker/index.ts` · `src/lib/relay.ts`, `session.ts`

- **A Durable Object = one mailbox per inbox.** Only ciphertext, no keys, no plaintext.
- **Sealed sender** (`src/crypto/seal.ts`): the whole wire envelope is wrapped in an **anonymous box to the
  recipient** (libsodium `crypto_box_seal` = ephemeral key, **no sender key in the ciphertext**). The relay no
  longer sees *who* delivers, and the former `conv` pair id and the sender's X3DH identity keys (first message)
  are **hidden** — they now sit *inside* the seal. The relay learns only: *which* inbox (recipient), *when*,
  *how large*. Sender **authenticity** is preserved — it comes from the X3DH/ratchet *inside*, which the
  recipient checks after opening. The seal is a pure anonymity wrapper, not the security boundary.
- **Inbox** = `SHA-256("scytale-inbox:" ‖ Ed25519-signPub)` — derivable from one's own identity; you listen
  without knowing anyone.
- **Owner auth via Ed25519 challenge-response**: the DO sends a nonce, the owner signs, the DO checks
  `hash(signPub)==inbox` **and** the signature. Only the owner drains their queue — not everyone who merely has
  the code.
- **Store-and-forward with an honest delivery receipt**: a SQLite queue. Both need **not** be online at once.
  Each send carries a `mid`; the DO replies after the insert with `{t:'sent', mid}`. The sender shows the tick
  **only after this ack** — pending (faint tick) until then. No ack within ~10 s **or** a `nack` (queue full) →
  **"not delivered"**. **Invariant: once `sent`, always `sent`** — a late `nack`/timeout cannot downgrade a
  confirmed delivery (only `failed → sent` recovery is allowed). The tick means "the relay has it", **not**
  "read".
- **Queue capped** (`MAX_QUEUE`=1000 per inbox): since sending is deliberately auth-less, the cap limits
  flooding; on full, `nack` (+ a `console.warn` **with a counter only, no inbox id** — Cloudflare logs must not
  accumulate metadata). Heals on drain. **Replays** inject no messages — the Double Ratchet rejects already-used
  message keys.
- **One-way onboarding**: passing the code suffices; the other writes first and the contact forms automatically
  from the prekey header.
- **A sender rate limit** against targeted flooding is still missing (the cap bounds only total queue depth).
- Only **ciphertext** ever transits.

---

## 6. Web / PWA hardening

`worker/index.ts`, `src/sw.ts`, `vite.config.ts`

- **CSP `default-src 'self'`**: no external scripts/styles/fonts/connections — even a successful XSS cannot ship
  a key to a foreign server. `script-src 'self' 'wasm-unsafe-eval'` (WASM only: libsodium/hash-wasm);
  `style-src 'self' 'unsafe-inline'`. The **one deliberate opening** is `connect-src 'self' https://gateway.umami.is`
  for the pinned, same-origin analytics beacon (see *Known limits*) — data-out only, never code-in.
- **Further headers**: HSTS (2 y, incl. subdomains), `nosniff`, `Referrer-Policy: no-referrer`,
  `X-Frame-Options: DENY` / `frame-ancestors 'none'`, COOP+CORP `same-origin`, a restrictive `Permissions-Policy`
  (camera/microphone same-origin only, geo/payment/USB off).
- **Self-hosted fonts** (no CDN — would break CSP and leak IPs).
- **Service-worker update mode is `prompt`** (`registerType: 'prompt'`): no unattended code swap on a security
  tool — the user confirms the reload that activates a new worker. The precached app shell loads from the SW
  cache.
- **Non-extractable CryptoKeys throughout** (KEK, DEK, device key, message keys, biometric KEK).

---

## 7. Metadata minimization

- **EXIF/GPS stripped**: images are re-encoded via canvas before sending, orientation baked into the pixels first
  (`imagecompress.ts`, `avatar.ts`).
- **Profile (name/picture)** is sent **E2E-encrypted** to contacts, not over the public code.
- **Push notifications are content-free**: a wake signal only, no sender/text. The SW holds no keys and cannot
  decrypt. VAPID/ES256-signed; subscriptions are registrable only over the **authenticated** owner socket; expired
  endpoints (404/410) are deleted; `pushsubscriptionchange` re-registers.

---

## Reproducible-build verification (for auditors, not end users)

A residual PWA risk: the server could ship tampered JS. **Honest framing:** the DevTools hash comparison is
realistic only for auditors/developers — not a protection a normal user performs. A real user mitigation would need
an **independent verifier that publishes signed hashes** (open, see limits). For auditors, the shipped bundle is
built exactly from the public source:

```bash
git checkout <commit>
npm ci --ignore-scripts
npm run build
find dist/assets -type f -name '*.js' -exec sha256sum {} \; | sort
# ... compare with the live files (DevTools → Network → Response).
```
If the hashes match, the running code equals the audited source. (Precondition: a deterministic build — same
Node/npm version.)

---

## Known limits

- **Analytics (third party):** the app loads a cookieless **umami** tracker for opt-in usage stats. Its script is
  *pinned and served same-origin*, so it can never execute injected code in the key-holding context (`script-src`
  stays `'self'`), and it sees no message content — but its anonymous page-view beacon goes to `gateway.umami.is`
  (allowed in `connect-src`), which therefore learns visitor **IP + timing**, including on the lock screen before
  unlock. A deliberate, bounded relaxation of the otherwise strict "no external destinations" stance; data-out
  only, not code-in.
- **Biometrics is more compellable than a passphrase.** Face ID / Touch ID can be coerced (a face/finger) more
  easily than a memorized passphrase. It is opt-in for exactly this reason — anyone who wants the stronger posture
  simply keeps using the passphrase. There is intentionally no cold-start passphrase requirement and no panic
  toggle.
- **Disabling biometrics is not secure erasure.** Dropping `header.prf` removes the active wrap, but IndexedDB's
  log-structured store may retain the prior header (with the old wrapped DEK) in uncompacted logs, and the OS
  passkey persists until the user deletes it (inert without `header.prf`). Durable removal would require rotating
  the DEK (re-encrypting every record) — not implemented.
- **Voice-message codec is device-dependent (cross-platform gap, issue #13).** `MediaRecorder` yields whatever
  container/codec the recording browser supports (Chrome: webm/opus; iOS Safari: mp4/aac), and iOS cannot play
  webm/opus — so an Android voice message may not play on iOS. To be fixed with the large-attachment work.
- **Large attachments are not yet on the wire (issue #9).** Attachments are stored out-of-band in the blob store,
  but sending is still capped at the ~600 KB inline path; videos and long audio don't transfer yet. The planned
  hybrid (small = auto-push, large = offer + pull) will require the sender to be online at pull time.
- **Residual metadata despite sealed sender**: *who* sends and the `conv` pair id are hidden. What remains is what
  addressing a recipient inherently reveals: **which inbox** (recipient pseudonym), **timing** and **size** — plus
  **network correlation** (sender IP → recipient inbox), which crypto does not cover (would need Tor/a mixnet). The
  same residual surface as Signal's sealed sender; traffic analysis stays hard.
- **Push timing** necessarily goes to Apple/Google (that a device got *some* message) → hence content-free + opt-in.
- **Groups v1/v2**: "soft" membership via pairwise fan-out without cryptographic re-keying — a removed member keeps
  old history. Real forward/post-compromise security on membership change would need sender keys / MLS (v3). The
  **sender display** of a group message is nonetheless **not** forgeable: it is derived from the cryptographically
  authenticated pairwise contact, **never** from the accompanying `senderName` field, and a message from a
  non/removed member is discarded. `ensureMemberContact` checks **denylist + device cert** when creating a member
  contact — a stale roster cannot re-pin an abandoned master over the group surface.
- **Device revocation does NOT apply in groups** (a 3c limit): the bearer guard checks the master-signed device
  list only for 1:1 contacts. Group members are created via `ensureMemberContact` without a `peerDeviceList`, so
  the guard is off for them. Kept as an executable target in `tests/group-revocation.xfail.test.mjs`.
- **Groups × devices (a 3e limit):** 3d fan-out + self-sync are **1:1-only**. A group message reaches **no second
  device** of a member, and my own second device never sees group messages from my other device. A visible in-chat
  hint says so rather than letting it read as message loss. Also open: **attachment cardinality** in groups (Σ
  devices × members is an availability lever). Both as executable targets in `tests/group-device-fanout.xfail.test.mjs`.
- **Self-sync covers SENT messages only** (receive-sync redundancy deferred): my other devices see what I send, and
  received messages via the peer's fan-out to my device list. If a peer does NOT reach my devices (a pre-3d client,
  or one that hasn't learned my list), the received message is missing on my second device until they see the list.
  **Ordering across devices** is arrival time, not compose time.
- **Endpoint**: against a compromised device (malware, OS-level client-side scanning, physical access to an unlocked
  vault) no E2E crypto helps — which is exactly the core of the critique of Chatkontrolle.
- **Bundle swap (MITM)**: a bundle carries only public keys, the channel need not be secret — but a swap is caught
  only by the **safety-number comparison**.
- **Recovery vs. device binding**: without a backup, losing the site's on-device data means the vault is
  **unrecoverable** (device binding). The **opt-in recovery export** (§1) lifts that deliberately — the consciously
  accepted, gated exfiltration path (second auth + separate passphrase). Whoever doesn't use it keeps full device
  binding; whoever does is responsible for the file **and** the export passphrase.
- **Prekey downgrade**: with no OPK in the bundle, X3DH runs on DH1–DH3 (only the *first* message then has reduced
  forward secrecy — as in the Signal standard). An active attacker *modifying* the bundle (stripping the OPK) is
  caught only by the safety-number comparison.
- **Code-delivery trust**: mitigated but not eliminated by the reproducible build; a real user-facing mitigation
  (an independent verifier publishing signed hashes) is open.

---

## Responsible disclosure

Please report security issues **not** via public issues, but directly to the repository operator.
