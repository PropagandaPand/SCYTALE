/**
 * Vault service — wraps the pure vault crypto with two hardening layers:
 *
 *   1. Device binding: a random 32-byte secret is encrypted under the device
 *      key and mixed into the passphrase before Argon2id. An exfiltrated vault
 *      (copied IndexedDB, seized device image) is useless without the device
 *      key — whose bytes JavaScript cannot read.
 *   2. Brute-force lockout: wrong passphrases trip an escalating cooldown.
 *
 * The pure `vault.ts` stays crypto-only and Node-testable; all
 * device/storage/lockout concerns live here.
 */
import {
  createVault,
  unlockVault,
  deriveHeaderKek,
  unwrapDekExtractable,
  verifyKek,
  wrapDekUnder,
  unwrapDekWithPrf,
  WrongPassphraseError,
  VaultCorruptError,
  type VaultHeader,
  type SealedRecord,
} from '../crypto';
import { getOrCreateDeviceKey } from './deviceKey';
import { buildDecoySeedRecords } from './decoySeed';
import {
  loadHeader,
  saveHeader,
  compareAndSwapHeader,
  withVaultDb,
  switchVaultDb,
  deleteVaultDb,
  loadVaultDbEnvelope,
  neutralizeVaultDb,
  migrateVaultDb,
  fenceVaultDbWrites,
  currentDbName,
  DURESS_MUTATION_LEASE_KEY,
  type VaultPromotionFence,
} from './db';
import { clearFailures, lockoutStatus, registerFailure, type LockoutInfo } from './lockout';
import { biometricAvailable, createBiometricCredential, evaluatePrf, derivePrfKek } from './biometric';
import {
  wipeRealForDecoy,
  wipedMarkerPresent,
  RESET_MARKER,
  markPromoteDecoy,
  markPromoteDecoyCopied,
  decoyPromotionJournal,
  clearPromoteDecoy,
  markDuressRemoval,
  duressRemovalMarkerPresent,
  clearDuressRemoval,
  promoteMarkerPresent,
} from './wipe';

/**
 * The decoy account is provisioned + populated in its OWN IndexedDB ('scytale-decoy'), isolated from
 * the real vault ('scytale'). On a duress unlock it is PROMOTED into the canonical 'scytale' slot
 * (migrateVaultDb) so a seized post-duress device shows a single ordinary account with no database
 * literally named '…-decoy'. The real account always lives in 'scytale'.
 */
const REAL_DB = 'scytale' as const;
const DECOY_DB = 'scytale-decoy' as const;
const DURESS_MUTATION_LOCK = 'scytale-duress-mutation-v1';
const DURESS_MUTATION_LEASE_MS = 60_000;

export class DeviceBindingMissingError extends Error {
  constructor() {
    super('Tresor an ein anderes Gerät gebunden — auf diesem Gerät nicht entsperrbar.');
    this.name = 'DeviceBindingMissingError';
  }
}

export class LockedOutError extends Error {
  constructor(public remainingMs: number) {
    super('Zu viele Fehlversuche — vorübergehend gesperrt.');
    this.name = 'LockedOutError';
  }
}

/** The chosen duress password must differ from the real passphrase — otherwise a normal login
 *  would trigger the wipe. */
export class DuressEqualsRealError extends Error {
  constructor() {
    super('Das Duress-Passwort darf nicht die echte Passphrase sein.');
    this.name = 'DuressEqualsRealError';
  }
}

/** Re-export so the UI can show the wrong-passphrase state without a second import. */
export { WrongPassphraseError, lockoutStatus };
export type { LockoutInfo };

function hex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

const augment = (passphrase: string, secretHex: string) => `${passphrase}::${secretHex}`;

function randomToken(): string {
  return hex(crypto.getRandomValues(new Uint8Array(16)));
}

function requireBytes(value: Uint8Array | undefined, label: string, exact?: number): Uint8Array {
  if (!(value instanceof Uint8Array) || (exact ? value.byteLength !== exact : value.byteLength < 16)) {
    throw new VaultCorruptError(label);
  }
  return value;
}

/** Stable, non-secret identifier for the immutable envelope wrapping one DEK. */
async function vaultHeaderWitness(header: VaultHeader): Promise<string> {
  const material = JSON.stringify({
    version: header.version,
    argon2: {
      memorySize: header.argon2?.memorySize,
      iterations: header.argon2?.iterations,
      parallelism: header.argon2?.parallelism,
    },
    salt: hex(requireBytes(header.salt, 'Salt')),
    wrapIv: hex(requireBytes(header.wrapIv, 'IV', 12)),
    wrappedDek: hex(requireBytes(header.wrappedDek, 'Wrapped-DEK')),
    deviceIv: hex(requireBytes(header.deviceWrap?.iv, 'Device-IV', 12)),
    deviceCiphertext: hex(requireBytes(header.deviceWrap?.ciphertext, 'Device-Wrap')),
  });
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))));
}

/** Merge one mutable header setting without overwriting a concurrent setting
 * from another tab. The immutable vault envelope is bound once and every full
 * header replacement is guarded by an IndexedDB compare-and-swap. */
async function updateVaultHeaderCas(
  mutate: (current: VaultHeader) => VaultHeader,
  expectedWitness?: string,
): Promise<void> {
  let boundWitness = expectedWitness;
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await loadHeader();
    if (!current) throw new Error('Kein Tresor gefunden.');
    const currentWitness = await vaultHeaderWitness(current);
    if (boundWitness === undefined) boundWitness = currentWitness;
    else if (currentWitness !== boundWitness) {
      throw new Error('Der Tresor wurde während der Einstellungsänderung ersetzt.');
    }
    if (await compareAndSwapHeader(current, mutate(current))) return;
  }
  throw new Error('Tresor-Einstellungen wurden gleichzeitig in einem anderen Tab geändert.');
}

interface DuressMutationLease {
  token: string;
  expiresAt: number;
}

function parseMutationLease(value: unknown): DuressMutationLease | null {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof (value as Partial<DuressMutationLease>).token !== 'string' ||
    !/^[a-f0-9]{32}$/.test((value as DuressMutationLease).token) ||
    !Number.isFinite((value as Partial<DuressMutationLease>).expiresAt)
  ) return null;
  return value as DuressMutationLease;
}

async function tryAcquireMutationLease(token: string): Promise<boolean> {
  return withVaultDb(REAL_DB, async (d) => {
    const tx = d.transaction('kv', 'readwrite');
    const current = parseMutationLease(await tx.store.get(DURESS_MUTATION_LEASE_KEY));
    if (current && current.token !== token && current.expiresAt > Date.now()) {
      await tx.done;
      return false;
    }
    await tx.store.put(
      { token, expiresAt: Date.now() + DURESS_MUTATION_LEASE_MS } satisfies DuressMutationLease,
      DURESS_MUTATION_LEASE_KEY,
    );
    await tx.done;
    return true;
  });
}

async function renewMutationLease(token: string): Promise<void> {
  await withVaultDb(REAL_DB, async (d) => {
    const tx = d.transaction('kv', 'readwrite');
    const current = parseMutationLease(await tx.store.get(DURESS_MUTATION_LEASE_KEY));
    if (current?.token === token) {
      await tx.store.put(
        { token, expiresAt: Date.now() + DURESS_MUTATION_LEASE_MS } satisfies DuressMutationLease,
        DURESS_MUTATION_LEASE_KEY,
      );
    }
    await tx.done;
  });
}

async function releaseMutationLease(token: string): Promise<void> {
  await withVaultDb(REAL_DB, async (d) => {
    const tx = d.transaction('kv', 'readwrite');
    if (parseMutationLease(await tx.store.get(DURESS_MUTATION_LEASE_KEY))?.token === token) {
      await tx.store.delete(DURESS_MUTATION_LEASE_KEY);
    }
    await tx.done;
  });
}

async function withPersistentMutationLease<T>(fn: () => Promise<T>): Promise<T> {
  const token = randomToken();
  const deadline = Date.now() + DURESS_MUTATION_LEASE_MS * 2;
  while (!(await tryAcquireMutationLease(token))) {
    if (Date.now() >= deadline) throw new Error('Eine andere Duress-Operation ist noch aktiv.');
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  const heartbeat = globalThis.setInterval(() => {
    void renewMutationLease(token).catch(() => undefined);
  }, Math.floor(DURESS_MUTATION_LEASE_MS / 3));
  try {
    return await fn();
  } finally {
    globalThis.clearInterval(heartbeat);
    await releaseMutationLease(token).catch(() => undefined);
  }
}

async function withDuressMutationLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (locks) {
    return locks.request(DURESS_MUTATION_LOCK, { mode: 'exclusive' }, () =>
      withPersistentMutationLease(fn));
  }
  return withPersistentMutationLease(fn);
}

// HKDF salt that binds the biometric KEK to THIS device's device-bound secret, so a
// (possibly cloud-synced) passkey alone can't unwrap an exfiltrated envelope. `suffix`
// is the same hex the passphrase path mixes in — '' when the vault has no deviceWrap.
const prfBindingSaltBytes = (suffix: string) => new TextEncoder().encode(`scytale:prf-bind:v1:${suffix}`);

export async function createBoundVault(passphrase: string): Promise<CryptoKey> {
  const deviceKey = await getOrCreateDeviceKey(true);
  const bindingSecret = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, deviceKey!, bindingSecret),
  );

  const { header, dek } = await createVault(augment(passphrase, hex(bindingSecret)));
  header.deviceWrap = { iv, ciphertext };
  await saveHeader(header);
  await clearFailures();
  try {
    localStorage.removeItem(RESET_MARKER); // a fresh vault clears any prior wipe/reset flag
  } catch {
    /* ignore */
  }
  return dek;
}

async function recoverBindingSuffix(header: VaultHeader): Promise<string> {
  if (!header.deviceWrap) return '';
  const deviceKey = await getOrCreateDeviceKey(false);
  if (!deviceKey) throw new DeviceBindingMissingError();
  try {
    const secret = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: header.deviceWrap.iv },
        deviceKey,
        header.deviceWrap.ciphertext,
      ),
    );
    return hex(secret);
  } catch {
    throw new DeviceBindingMissingError();
  }
}

/**
 * Create the self-contained DECOY vault in its own database ('scytale-decoy'): a fresh
 * non-extractable device key + a vault whose DEK is sealed under the DURESS passphrase and bound to
 * THAT device key. Isolated via withVaultDb so provisioning never touches the live real DB. A
 * canonical identity plus local-only cover contacts/history are seeded atomically while arming.
 */
async function createDecoyVaultInDb(
  duressPassphrase: string,
  argon2: VaultHeader['argon2'],
): Promise<string> {
  const deviceKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  const bindingSecret = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, deviceKey, bindingSecret),
  );
  // Match the real header's KDF cost exactly; otherwise an older/calibrated
  // real vault and a default-cost decoy would disclose the armed state by time.
  const { header, dek } = await createVault(augment(duressPassphrase, hex(bindingSecret)), argon2);
  header.deviceWrap = { iv, ciphertext };
  const witness = await vaultHeaderWitness(header);
  // Seed the decoy with believable fake contacts + chats (sealed under the decoy DEK) so it looks
  // lived-in when opened under coercion. Best-effort — a seed failure still leaves a working (empty)
  // decoy. Built BEFORE the transaction (async crypto), written inside it so provisioning is atomic.
  const seed = await buildDecoySeedRecords(dek).catch(() => [] as Array<[string, SealedRecord]>);
  await withVaultDb(DECOY_DB, async (d) => {
    // Replace the complete decoy generation atomically. Relying on deleteDB
    // leaves a blocked deletion request racing this open and can retain records
    // sealed under the previous DEK, making the freshly re-armed decoy fail boot.
    const tx = d.transaction(['meta', 'records', 'restore', 'device', 'kv'], 'readwrite');
    await tx.objectStore('meta').clear();
    await tx.objectStore('records').clear();
    await tx.objectStore('restore').clear();
    await tx.objectStore('device').clear();
    await tx.objectStore('kv').clear();
    await tx.objectStore('device').put(deviceKey, 'local_device_key');
    await tx.objectStore('meta').put(header, 'vault');
    for (const [key, record] of seed) await tx.objectStore('records').put(record, key);
    await tx.done;
  });
  return witness;
}

/**
 * Try to unlock the DECOY vault with `rawPassphrase` (device-bound to the decoy DB's OWN device
 * key — never the real suffix). Returns the decoy DEK on success, null on any failure (no decoy,
 * wrong passphrase, missing/again-corrupt key). One Argon2 — the dominant cost, matched by
 * probeDecoy's no-decoy dummy so timing never reveals whether a decoy exists.
 */
interface UnlockedDecoy {
  dek: CryptoKey;
  sourceWitness: string;
}

async function unlockDecoyVault(
  rawPassphrase: string,
  dummyHeader?: VaultHeader,
): Promise<UnlockedDecoy | null> {
  const equalCostMiss = async () => {
    if (dummyHeader) await deriveHeaderKek(rawPassphrase, dummyHeader);
    return null;
  };
  // Do not create an empty, forensically visible decoy database merely by
  // probing a stale marker after external deletion/corruption.
  const data = await loadVaultDbEnvelope(DECOY_DB).catch(() => null);
  if (!data) return equalCostMiss();
  const { header, deviceKey } = data;
  let candidate = rawPassphrase;
  if (header.deviceWrap) {
    if (!deviceKey) return equalCostMiss();
    try {
      const secret = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: header.deviceWrap.iv },
          deviceKey,
          header.deviceWrap.ciphertext,
        ),
      );
      candidate = augment(rawPassphrase, hex(secret));
    } catch {
      return equalCostMiss();
    }
  }
  try {
    const dek = await unlockVault(candidate, header);
    return { dek, sourceWitness: await vaultHeaderWitness(header) };
  } catch (error) {
    // WrongPassphraseError means unlockVault already paid the Argon2 cost.
    // A corrupt header can fail validation before Argon2, so equalise that path.
    if (!(error instanceof WrongPassphraseError)) await equalCostMiss();
    return null;
  }
}

/**
 * Probe the decoy at a cost INDEPENDENT of whether one is armed — a wrong real-passphrase attempt
 * must never reveal (by timing) that a duress passphrase exists. Armed → try to unlock the decoy
 * (one Argon2). Not armed → one equal-cost throwaway Argon2 on the real header, then no match.
 * Takes the RAW passphrase (the decoy uses its OWN device suffix), never the real-augmented one.
 */
async function probeDecoy(rawPassphrase: string, realHeader: VaultHeader): Promise<UnlockedDecoy | null> {
  if (realHeader.decoyArmed) return unlockDecoyVault(rawPassphrase, realHeader);
  await deriveHeaderKek(rawPassphrase, realHeader); // equal-cost dummy derivation; result discarded
  return null;
}

/**
 * DURESS fired: the entered passphrase unlocked the decoy. Crypto-erase the REAL account and PROMOTE
 * the decoy into the canonical 'scytale' slot, returning the decoy DEK (which unlocks the migrated
 * 'scytale') so the caller opens it. Only ever called from the lock screen, where no account UI is
 * mounted — so switching the active DB races nothing. Ordering is crash-safe via the PROMOTE marker:
 * a kill/blocked-delete anywhere in here is finished idempotently by completeDecoyPromotion at boot.
 * From outside, the app just opened a single, plausible, ordinary account.
 */
async function validateAndFencePromotionSource(
  sourceWitness: string | null,
  fenceToken: string | null,
): Promise<{ fence: VaultPromotionFence; header: VaultHeader }> {
  // A legacy/malformed pending marker is not authority to destroy a valid
  // canonical vault. It remains visible for explicit recovery, but fails closed.
  if (!sourceWitness || !fenceToken) {
    throw new Error('Decoy-Promotion besitzt keinen vertrauenswürdigen Quellnachweis.');
  }
  const source = await loadVaultDbEnvelope(DECOY_DB);
  if (!source?.deviceKey || !source.header.deviceWrap) {
    throw new Error('Decoy-Promotion kann ohne vollständigen Quelltresor nicht fortgesetzt werden.');
  }
  if ((await vaultHeaderWitness(source.header)) !== sourceWitness) {
    throw new Error('Decoy-Quelle stimmt nicht mit dem Promotion-Journal überein.');
  }
  const fence = { token: fenceToken, sourceWitness } satisfies VaultPromotionFence;
  await fenceVaultDbWrites(DECOY_DB, fence, source.header);
  return { fence, header: source.header };
}

async function completeDecoyPromotionUnlocked(): Promise<void> {
  const journal = decoyPromotionJournal();
  if (!journal) return;
  // A promotion in progress SUPERSEDES any pending duress removal: both target the same decoy DB,
  // and the promotion consumes it (source deletion + a promoted header without decoyArmed), which
  // already achieves the removal's goal. Clear the moot removal marker instead of deadlocking boot.
  if (duressRemovalMarkerPresent()) clearDuressRemoval();

  if (journal.phase === 'pending') {
    // This is the decisive precondition: a source with the expected immutable
    // envelope and device key is validated + persistently fenced BEFORE the
    // real header is overwritten.
    const { fence, header: sourceHeader } = await validateAndFencePromotionSource(
      journal.sourceWitness,
      journal.fenceToken,
    );
    await wipeRealForDecoy();
    await migrateVaultDb(DECOY_DB, REAL_DB, fence, sourceHeader);
    markPromoteDecoyCopied(fence.token);
  }

  // In `copied`, NEVER re-copy or re-wipe: the canonical account may already
  // contain newer data, and a delayed second duress submit must be harmless.
  const sourceDeletionConfirmed = await deleteVaultDb(DECOY_DB);
  await switchVaultDb(REAL_DB);
  if (sourceDeletionConfirmed) {
    clearPromoteDecoy(journal.fenceToken ?? undefined);
  }
}

async function openDecoyAndWipeReal(unlocked: UnlockedDecoy): Promise<CryptoKey> {
  return withDuressMutationLock(async () => {
    // A duress fire supersedes a half-finished duress REMOVAL: the entered passphrase just unlocked
    // the decoy (so it is provably intact) and we are about to promote it, which consumes it anyway.
    // Clear any stale removal marker up front so markPromoteDecoy + promotion can never be blocked
    // by it (defence in depth alongside completeDecoyPromotionUnlocked's own clear).
    if (duressRemovalMarkerPresent()) clearDuressRemoval();
    let journal = decoyPromotionJournal();
    if (!journal) {
      // Re-read and bind the source while holding the cross-tab lock. A slow
      // Argon2 result from a tab that lost the race cannot authorize a wipe.
      const source = await loadVaultDbEnvelope(DECOY_DB);
      if (
        !source?.deviceKey ||
        !source.header.deviceWrap ||
        (await vaultHeaderWitness(source.header)) !== unlocked.sourceWitness
      ) {
        throw new Error('Tresor konnte nicht sicher geöffnet werden.');
      }
      journal = markPromoteDecoy(unlocked.sourceWitness, randomToken());
    } else if (
      journal.sourceWitness &&
      journal.sourceWitness !== unlocked.sourceWitness
    ) {
      throw new Error('Tresor konnte nicht sicher geöffnet werden.');
    }

    await completeDecoyPromotionUnlocked();
    const canonical = await loadHeader();
    if (!canonical || (await vaultHeaderWitness(canonical)) !== unlocked.sourceWitness) {
      throw new Error('Tresor konnte nicht sicher geöffnet werden.');
    }
    return unlocked.dek;
  });
}

/**
 * Finish an interrupted duress promotion (called at boot when
 * promoteMarkerPresent()). `pending` validates/fences the exact witnessed
 * source, wipes, and copies. `copied` can only retry source deletion; it NEVER
 * re-wipes or re-copies because the canonical account may already contain newer
 * data. Runs before hasVault() and clears the journal only after deletion was
 * durably confirmed.
 */
export async function completeDecoyPromotion(): Promise<void> {
  await withDuressMutationLock(completeDecoyPromotionUnlocked);
}

export async function unlockBoundVault(passphrase: string): Promise<CryptoKey> {
  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');

  // Recover the REAL device-binding suffix. If the real device key is gone the real vault can't be
  // unlocked on this device — but the decoy has its OWN device key, so a duress passphrase must
  // still open it. Probe the decoy before surfacing the binding-missing error.
  let candidate: string;
  try {
    const suffix = await recoverBindingSuffix(header);
    candidate = header.deviceWrap ? augment(passphrase, suffix) : passphrase;
  } catch (e) {
    const decoyDek = await probeDecoy(passphrase, header);
    if (decoyDek) return openDecoyAndWipeReal(decoyDek);
    throw e; // DeviceBindingMissingError
  }

  // The decoy is probed on EVERY attempt, INCLUDING while the brute-force lockout is active: the
  // coercion scenario is exactly a locked-out screen after fumbled guesses, and the duress switch
  // MUST still fire then. probeDecoy runs at a constant cost so a locked-out (or ordinary wrong)
  // attempt never reveals by timing whether a duress passphrase is configured.
  const status = await lockoutStatus();
  if (status.remainingMs > 0) {
    const decoyDek = await probeDecoy(passphrase, header);
    if (decoyDek) return openDecoyAndWipeReal(decoyDek);
    throw new LockedOutError(status.remainingMs);
  }

  try {
    const dek = await unlockVault(candidate, header);
    await clearFailures();
    return dek;
  } catch (e) {
    if (e instanceof WrongPassphraseError) {
      // A wrong REAL passphrase — is it the DURESS passphrase? If so, crypto-erase the real
      // account and open the decoy instead of surfacing a wrong-passphrase error.
      const decoyDek = await probeDecoy(passphrase, header);
      if (decoyDek) return openDecoyAndWipeReal(decoyDek);
      const info = await registerFailure();
      if (info.remainingMs > 0) throw new LockedOutError(info.remainingMs);
    }
    throw e;
  }
}

export async function hasVault(): Promise<boolean> {
  // A wipe (account delete, revoked-device self-wipe, or a duress erase) sets a persistent flag
  // that outlives the wipe. Honour it even if a header record survived a blocked/failed deleteDB,
  // so boot lands on fresh onboarding instead of a stale or garbage lock screen.
  if (wipedMarkerPresent()) return false;
  return (await loadHeader()) !== undefined;
}

// ── Biometric (Face ID / Touch ID) unlock ───────────────────────────────────
// Opt-in convenience door onto the SAME vault. The passphrase always remains the
// primary way in; anyone who doesn't want the biometric door simply never enables
// it. See biometric.ts + crypto/vault.ts for the PRF-wraps-the-DEK design.

/** Re-export so the UI can gate the toggle on hardware support. */
export { biometricAvailable };

/** Is biometric unlock currently set up for this vault on this device? */
export async function biometricEnrolled(): Promise<boolean> {
  return !!(await loadHeader())?.prf;
}

/**
 * Turn on biometric unlock. Requires the passphrase once — it is the only holder
 * of the DEK in a form we can re-wrap under the PRF KEK. Prompts the authenticator
 * twice (create the credential, then evaluate PRF). Throws WrongPassphraseError on
 * a bad passphrase, or a biometric error if enrollment is declined/unsupported.
 */
export async function enableBiometricUnlock(passphrase: string): Promise<void> {
  // Gate on the SAME lockout as unlockBoundVault — otherwise this second passphrase
  // check would be an un-counted brute-force oracle around the cooldown.
  const status = await lockoutStatus();
  if (status.remainingMs > 0) throw new LockedOutError(status.remainingMs);

  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');

  // Reproduce the exact passphrase the vault was sealed with (device-binding suffix).
  const suffix = await recoverBindingSuffix(header);
  const candidate = header.deviceWrap ? augment(passphrase, suffix) : passphrase;

  // One Argon2 run: derive the KEK, then VALIDATE the passphrase without producing an
  // extractable key (audit N-2). A wrong passphrase → count it against the lockout and
  // surface it, with no biometric prompt wasted on a bad passphrase.
  const passKek = await deriveHeaderKek(candidate, header);
  try {
    await verifyKek(passKek, header);
  } catch {
    const info = await registerFailure();
    if (info.remainingMs > 0) throw new LockedOutError(info.remainingMs);
    throw new WrongPassphraseError();
  }
  await clearFailures();

  // Do the authenticator rounds and derive the PRF KEK FIRST (two interactive WebAuthn
  // prompts, ~seconds each). Only THEN mint the extractable DEK, immediately before the
  // wrap — so the exportable key exists for one synchronous step, not across the prompts
  // (audit N-2: an XSS hooking exportKey would otherwise have a multi-second window).
  const bindingSalt = prfBindingSaltBytes(suffix);
  const { credentialId, prfSalt } = await createBiometricCredential();
  const prfSecret = await evaluatePrf(credentialId, prfSalt);
  const prfKek = await derivePrfKek(prfSecret, bindingSalt);
  prfSecret.fill(0); // best-effort scrub of the raw PRF secret

  const extractableDek = await unwrapDekExtractable(passKek, header);
  const { wrapIv, wrappedDek } = await wrapDekUnder(prfKek, extractableDek);

  const prf = { credentialId, salt: prfSalt, wrapIv, wrappedDek };
  await updateVaultHeaderCas(
    (current) => ({ ...current, prf }),
    await vaultHeaderWitness(header),
  );
}

/**
 * Unlock via Face ID / Touch ID. No passphrase, no Argon2 — just PRF → KEK →
 * unwrap the DEK. Not gated by the passphrase lockout: the authenticator is a
 * separate, un-brute-forceable factor.
 */
export async function unlockWithBiometric(): Promise<CryptoKey> {
  const header = await loadHeader();
  if (!header?.prf) throw new Error('Keine Biometrie eingerichtet.');
  // Corrupt-header pre-checks, mirroring unlockVault: a mangled prf record must read
  // as "beschädigt", not as a biometric failure or a raw WebAuthn TypeError.
  const p = header.prf;
  if (!p.credentialId || p.credentialId.length === 0) throw new VaultCorruptError('PRF-Credential');
  if (!p.salt || p.salt.length === 0) throw new VaultCorruptError('PRF-Salt');
  if (!p.wrapIv || p.wrapIv.length !== 12) throw new VaultCorruptError('PRF-IV');
  if (!p.wrappedDek || p.wrappedDek.length < 16) throw new VaultCorruptError('PRF-Wrapped-DEK');

  // Recover the same device-bound salt enrollment used (needs THIS device's key —
  // throws DeviceBindingMissingError if it's gone, exactly like the passphrase path).
  const suffix = await recoverBindingSuffix(header);
  const bindingSalt = prfBindingSaltBytes(suffix);

  const prfSecret = await evaluatePrf(p.credentialId, p.salt);
  const prfKek = await derivePrfKek(prfSecret, bindingSalt);
  prfSecret.fill(0);
  try {
    const dek = await unwrapDekWithPrf(prfKek, p);
    await clearFailures(); // a legitimate unlock — reset any passphrase-fail cooldown
    return dek;
  } catch {
    // Not a wrong-passphrase (none was typed): the stored wrap no longer matches
    // (credential deleted in OS settings, or a corrupt header).
    throw new Error('Biometrisches Entsperren fehlgeschlagen.');
  }
}

/** Turn biometric unlock off: drop the PRF wrap. The platform passkey is left for
 *  the user to delete in OS settings — it is inert without header.prf. */
export async function disableBiometricUnlock(): Promise<void> {
  const header = await loadHeader();
  if (!header?.prf) return;
  await updateVaultHeaderCas((current) => {
    const next = { ...current };
    delete next.prf;
    return next;
  }, await vaultHeaderWitness(header));
  // NOTE: this removes the ACTIVE wrap, but IndexedDB's log-structured backing store
  // may keep the prior header (with the old prf.wrappedDek) in uncompacted logs. A
  // forensic image + coerced biometric could recover it until the store compacts.
  // Durable removal would require rotating the DEK (re-encrypt every record); see
  // SECURITY.md "Bekannte Grenzen". The OS passkey is left for the user to delete —
  // it is inert without prf.wrappedDek.
}

// ── Duress passphrase → DECOY account ────────────────────────────────────────
// A SECOND passphrase that, entered at the unlock screen, does NOT unlock the real vault: it
// crypto-erases the real account ('scytale') and opens a self-contained DECOY account — a full
// second vault (own identity, contacts, messages) in 'scytale-decoy' (see unlockBoundVault +
// openDecoyAndWipeReal). The real header carries only a `decoyArmed` marker so the lock screen
// knows to probe the decoy at constant cost; recognition itself is unlocking the decoy vault, never
// a value stored in the real header. The marker's presence means a forensic image CAN tell a duress
// passphrase is configured — the deniability is BEHAVIOURAL (entering it looks like a wrong
// passphrase; afterwards a plausible working account is shown), not at-rest. See SECURITY.md.
// Arming requires the REAL passphrase.

/** Is a duress passphrase + decoy account armed? (Reads the real header's marker.) */
export async function duressEnabled(): Promise<boolean> {
  return !!(await loadHeader())?.decoyArmed;
}

/** Verify the real passphrase (device-bound) against the header, counting failures against the
 *  lockout — shared by duress set/remove. Returns the augmented real candidate on success. */
async function assertRealPassphrase(realPassphrase: string, header: VaultHeader): Promise<string> {
  const status = await lockoutStatus();
  if (status.remainingMs > 0) throw new LockedOutError(status.remainingMs);
  const suffix = await recoverBindingSuffix(header);
  const candidate = header.deviceWrap ? augment(realPassphrase, suffix) : realPassphrase;
  const passKek = await deriveHeaderKek(candidate, header);
  try {
    await verifyKek(passKek, header);
  } catch {
    const info = await registerFailure();
    if (info.remainingMs > 0) throw new LockedOutError(info.remainingMs);
    throw new WrongPassphraseError();
  }
  await clearFailures();
  return candidate;
}

/**
 * Verify the REAL passphrase only (counts against the lockout), WITHOUT the decoy path — for
 * in-account re-authentication (e.g. the backup export). The duress escape is deliberately lock-
 * screen only: a duress passphrase entered here is treated as a wrong passphrase, never a wipe, so
 * the destructive switch can't fire while the real account's UI is mounted. Throws
 * WrongPassphraseError / LockedOutError.
 */
export async function verifyRealPassphrase(realPassphrase: string): Promise<void> {
  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');
  await assertRealPassphrase(realPassphrase, header);
}

async function updateDecoyArmedFlag(
  armed: boolean,
  expectedRealWitness?: string,
): Promise<void> {
  await updateVaultHeaderCas((current) => {
    const next = { ...current };
    if (armed) next.decoyArmed = true;
    else delete next.decoyArmed;
    return next;
  }, expectedRealWitness);
}

async function completeDuressRemovalUnlocked(): Promise<void> {
  if (!duressRemovalMarkerPresent()) return;
  if (promoteMarkerPresent()) {
    // A duress promotion is in progress and takes priority (it consumes the decoy anyway). DEFER
    // rather than throw: at boot this runs BEFORE completeDecoyPromotion, and throwing here would
    // deadlock every boot (promotion never reached, marker never cleared). Returning lets boot
    // proceed to the promotion, which clears this now-moot removal marker (see
    // completeDecoyPromotionUnlocked). A later boot re-runs this harmlessly if anything remains.
    return;
  }
  // No deleteDatabase request: clear every key/header/device atomically and
  // leave a fresh generation tombstone. There is therefore no delayed request
  // that can erase a later, newly armed decoy.
  await neutralizeVaultDb(DECOY_DB);
  await updateDecoyArmedFlag(false);
  clearDuressRemoval();
}

/** Boot recovery for a crash between neutralising the decoy and clearing the
 * real header marker. Idempotent and serialized with every promotion/set/remove. */
export async function completeDuressRemoval(): Promise<void> {
  await withDuressMutationLock(completeDuressRemovalUnlocked);
}

/**
 * Arm (or re-arm) the duress passphrase + decoy account. Requires the REAL passphrase (proves
 * ownership); the duress passphrase must differ from it — otherwise a normal login would trigger
 * the wipe. Provisions a fresh, self-contained decoy vault in its own database, then marks the real
 * header. Re-arming replaces the decoy vault with a fresh one (any previously populated decoy
 * content becomes unreadable — a new decoy DEK); re-arming is rare and the decoy can be repopulated.
 */
export async function setDuressPassword(realPassphrase: string, duressPassphrase: string): Promise<void> {
  // Only ever mutate the decoy from the REAL account. An in-app populate
  // session has the decoy as its live active database and must never replace it
  // underneath the mounted account UI.
  if (currentDbName() !== REAL_DB) throw new Error('Duress kann nur im echten Konto geändert werden.');
  // No length/strength policy on the duress word by design: it is a coercion TRIGGER that must be
  // easy to type under stress, not a secret protecting real data (the decoy it opens is a facade).
  // It only has to be non-empty (UI button-gated) and differ from the real passphrase (below).
  await withDuressMutationLock(async () => {
    if (promoteMarkerPresent()) {
      throw new Error('Duress kann während einer laufenden Decoy-Promotion nicht geändert werden.');
    }
    if (duressRemovalMarkerPresent()) await completeDuressRemovalUnlocked();

    const header = await loadHeader();
    if (!header) throw new Error('Kein Tresor gefunden.');
    const realWitness = await vaultHeaderWitness(header);
    await assertRealPassphrase(realPassphrase, header);

    // Refuse a duress passphrase that ALSO unlocks the REAL vault (a normal login would wipe it).
    const suffix = await recoverBindingSuffix(header);
    const duressAsReal = header.deviceWrap ? augment(duressPassphrase, suffix) : duressPassphrase;
    const duressKek = await deriveHeaderKek(duressAsReal, header);
    let duressUnlocksReal = false;
    try {
      await verifyKek(duressKek, header);
      duressUnlocksReal = true;
    } catch {
      duressUnlocksReal = false;
    }
    if (duressUnlocksReal) throw new DuressEqualsRealError();

    await createDecoyVaultInDb(duressPassphrase, header.argon2);
    try {
      // Merge into the latest header with CAS so a sibling biometric change is
      // preserved instead of being overwritten by this slow Argon2 operation.
      await updateDecoyArmedFlag(true, realWitness);
    } catch (error) {
      await neutralizeVaultDb(DECOY_DB).catch(() => undefined);
      throw error;
    }
  });
}

/** Remove the duress passphrase and delete the decoy account. Requires the real passphrase. */
export async function removeDuressPassword(realPassphrase: string): Promise<void> {
  if (currentDbName() !== REAL_DB) throw new Error('Duress kann nur im echten Konto geändert werden.');
  await withDuressMutationLock(async () => {
    if (promoteMarkerPresent()) {
      throw new Error('Duress kann während einer laufenden Decoy-Promotion nicht entfernt werden.');
    }
    const header = await loadHeader();
    if (!header) throw new Error('Kein Tresor gefunden.');
    await assertRealPassphrase(realPassphrase, header);
    // Journal BEFORE the cross-database mutation. A crash at any following
    // point is completed at boot without ever reviving a valid decoy.
    markDuressRemoval();
    await completeDuressRemovalUnlocked();
  });
}

/**
 * Open the decoy account for POPULATING it, from the unlocked REAL account (Settings → "fill the
 * decoy"). Unlocks the decoy vault with the duress passphrase and returns the decoy DEK — it NEVER
 * wipes (that path is the lock screen only). The caller MUST unmount the real account's UI, then
 * `switchVaultDb('scytale-decoy')`, then mount the decoy account with this DEK; and keep the real
 * DEK in memory to switch back. Throws WrongPassphraseError if the passphrase doesn't open the decoy.
 */
export async function openDecoyForPopulate(duressPassphrase: string): Promise<CryptoKey> {
  if (promoteMarkerPresent() || duressRemovalMarkerPresent()) {
    throw new Error('Decoy-Konto wird gerade sicher umgestellt.');
  }
  const decoyDek = await unlockDecoyVault(duressPassphrase);
  if (!decoyDek) throw new WrongPassphraseError();
  if (promoteMarkerPresent() || duressRemovalMarkerPresent()) {
    throw new Error('Decoy-Konto wird gerade sicher umgestellt.');
  }
  return decoyDek.dek;
}
