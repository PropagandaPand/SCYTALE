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
  createDuressGuard,
  matchesDuress,
  WrongPassphraseError,
  VaultCorruptError,
  type VaultHeader,
} from '../crypto';
import { getOrCreateDeviceKey } from './deviceKey';
import { loadHeader, saveHeader } from './db';
import { clearFailures, lockoutStatus, registerFailure, type LockoutInfo } from './lockout';
import { biometricAvailable, createBiometricCredential, evaluatePrf, derivePrfKek } from './biometric';
import { duressWipe, wipedMarkerPresent, RESET_MARKER } from './wipe';

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

/** Raised AFTER the duress password has irreversibly wiped the vault. The UI drops to a fresh
 *  onboarding state (the vault is gone) instead of showing a wrong-passphrase toast — the on-
 *  screen result is a clean, empty app, indistinguishable from a reset to anyone watching. */
export class DuressWipedError extends Error {
  constructor() {
    super('Tresor wurde gelöscht.');
    this.name = 'DuressWipedError';
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

/** Duress and biometric unlock are mutually exclusive: a Face ID / Touch ID unlock bypasses the
 *  passphrase field entirely, so a coercer could open the REAL vault and the panic wipe would
 *  never fire. Arming one requires the other to be off. */
export class DuressBiometricConflictError extends Error {
  constructor() {
    super('Duress-Passwort und Face ID / Touch ID schließen sich gegenseitig aus.');
    this.name = 'DuressBiometricConflictError';
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
 * Probe the duress guard at a cost INDEPENDENT of whether a duress password is configured — so a
 * wrong-passphrase attempt can never reveal (by timing) that one exists. With a guard: one Argon2
 * to test it. Without: one equal-cost throwaway Argon2, then no match.
 */
async function guardMatches(candidate: string, header: VaultHeader): Promise<boolean> {
  if (header.duress) return matchesDuress(candidate, header);
  await deriveHeaderKek(candidate, header); // equal-cost dummy derivation; result discarded
  return false;
}

export async function unlockBoundVault(passphrase: string): Promise<CryptoKey> {
  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');

  // Recover the device-binding suffix FIRST — a missing device key means neither the real unlock
  // nor the duress guard can be derived on this device (both need the KEK).
  const suffix = await recoverBindingSuffix(header);
  const candidate = header.deviceWrap ? augment(passphrase, suffix) : passphrase;

  // The duress guard is probed on EVERY attempt, INCLUDING while the brute-force lockout is
  // active: the coercion scenario is exactly a locked-out screen after fumbled guesses, and the
  // panic wipe MUST still fire then. `guardMatches` runs at a constant cost so a locked-out (or
  // ordinary wrong) attempt never reveals whether a duress password is configured.
  const status = await lockoutStatus();
  if (status.remainingMs > 0) {
    if (await guardMatches(candidate, header)) {
      await duressWipe();
      throw new DuressWipedError();
    }
    throw new LockedOutError(status.remainingMs);
  }

  try {
    const dek = await unlockVault(candidate, header);
    await clearFailures();
    return dek;
  } catch (e) {
    if (e instanceof WrongPassphraseError) {
      // A wrong passphrase — is it the DURESS password? If so, irreversibly crypto-erase the
      // vault and signal DuressWipedError so the UI drops to a fresh onboarding state.
      if (await guardMatches(candidate, header)) {
        await duressWipe();
        throw new DuressWipedError();
      }
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
  // Mutually exclusive with a duress password: a biometric door bypasses the passphrase field
  // where duress is typed, so enabling it while duress is armed would silently re-open the panic
  // wipe's bypass. Refuse — the user must remove the duress password first.
  if (header.duress) throw new DuressBiometricConflictError();

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

  header.prf = { credentialId, salt: prfSalt, wrapIv, wrappedDek };
  await saveHeader(header);
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
  delete header.prf;
  await saveHeader(header);
  // NOTE: this removes the ACTIVE wrap, but IndexedDB's log-structured backing store
  // may keep the prior header (with the old prf.wrappedDek) in uncompacted logs. A
  // forensic image + coerced biometric could recover it until the store compacts.
  // Durable removal would require rotating the DEK (re-encrypt every record); see
  // SECURITY.md "Bekannte Grenzen". The OS passkey is left for the user to delete —
  // it is inert without prf.wrappedDek.
}

// ── Duress password ─────────────────────────────────────────────────────────
// A SECOND passphrase that, entered at the unlock screen, does NOT unlock — it irreversibly
// crypto-erases the whole vault (see unlockBoundVault + duressWipe). Stored as an extra wrap of a
// random throwaway key in the header (crypto/vault.ts): the guard's VALUE is byte-shaped like any
// wrapped key, but its presence (the header carries the wrap only when armed) does mean a forensic
// image can tell a duress password is configured — the deniability is BEHAVIOURAL (entering it
// looks like a wrong passphrase; the wiped app looks fresh), not at-rest. See SECURITY.md.
// Setting it requires the REAL passphrase.

/** Is a duress password configured? (Reads the header's guard slot.) */
export async function duressEnabled(): Promise<boolean> {
  return !!(await loadHeader())?.duress;
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
 * Set (or replace) the duress password. Requires the REAL passphrase (proves vault ownership),
 * and the duress password must differ from it — otherwise a normal login would wipe the vault.
 * It is device-bound the SAME way as the real passphrase, so unlock recognises it identically.
 */
export async function setDuressPassword(realPassphrase: string, duressPassphrase: string): Promise<void> {
  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');
  // Mutually exclusive with biometric unlock: Face ID / Touch ID would open the real vault
  // without ever touching the passphrase field, bypassing the panic wipe. Refuse to arm duress
  // while biometric is enrolled — the user must turn Face ID / Touch ID off first.
  if (header.prf) throw new DuressBiometricConflictError();
  await assertRealPassphrase(realPassphrase, header);

  const suffix = await recoverBindingSuffix(header);
  const duressCandidate = header.deviceWrap ? augment(duressPassphrase, suffix) : duressPassphrase;
  // Refuse a duress password that ALSO unlocks the real vault (would make a normal login wipe it).
  const duressKek = await deriveHeaderKek(duressCandidate, header);
  let duressUnlocksReal = false;
  try {
    await verifyKek(duressKek, header);
    duressUnlocksReal = true;
  } catch {
    duressUnlocksReal = false;
  }
  if (duressUnlocksReal) throw new DuressEqualsRealError();

  header.duress = await createDuressGuard(duressCandidate, header.argon2);
  await saveHeader(header);
}

/** Remove the duress password. Requires the real passphrase. */
export async function removeDuressPassword(realPassphrase: string): Promise<void> {
  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');
  await assertRealPassphrase(realPassphrase, header);
  if (!header.duress) return;
  delete header.duress;
  await saveHeader(header);
}
