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
  wrapDekUnder,
  unwrapDekWithPrf,
  WrongPassphraseError,
  VaultCorruptError,
  type VaultHeader,
} from '../crypto';
import { getOrCreateDeviceKey } from './deviceKey';
import { loadHeader, saveHeader } from './db';
import { clearFailures, lockoutStatus, registerFailure, type LockoutInfo } from './lockout';
import { biometricAvailable, createBiometricCredential, evaluatePrf, derivePrfKek } from './biometric';

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

export async function unlockBoundVault(passphrase: string): Promise<CryptoKey> {
  const status = await lockoutStatus();
  if (status.remainingMs > 0) throw new LockedOutError(status.remainingMs);

  const header = await loadHeader();
  if (!header) throw new Error('Kein Tresor gefunden.');

  const suffix = await recoverBindingSuffix(header);
  const candidate = header.deviceWrap ? augment(passphrase, suffix) : passphrase;

  try {
    const dek = await unlockVault(candidate, header);
    await clearFailures();
    return dek;
  } catch (e) {
    if (e instanceof WrongPassphraseError) {
      const info = await registerFailure();
      if (info.remainingMs > 0) throw new LockedOutError(info.remainingMs);
    }
    throw e;
  }
}

export async function hasVault(): Promise<boolean> {
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

  // One Argon2 run: derive the KEK, then unwrap the DEK EXTRACTABLE. A wrong
  // passphrase makes the unwrap fail → count it against the lockout and surface it,
  // with no biometric prompt wasted on a bad passphrase.
  const passKek = await deriveHeaderKek(candidate, header);
  let extractableDek: CryptoKey;
  try {
    extractableDek = await unwrapDekExtractable(passKek, header);
  } catch {
    const info = await registerFailure();
    if (info.remainingMs > 0) throw new LockedOutError(info.remainingMs);
    throw new WrongPassphraseError();
  }
  await clearFailures();

  // Now bring in the authenticator: register the credential, evaluate PRF, derive
  // the KEK (salted with the device secret → device-bound), and add a second wrap of
  // the DEK. The DEK itself is unchanged.
  const bindingSalt = prfBindingSaltBytes(suffix);
  const { credentialId, prfSalt } = await createBiometricCredential();
  const prfSecret = await evaluatePrf(credentialId, prfSalt);
  const prfKek = await derivePrfKek(prfSecret, bindingSalt);
  prfSecret.fill(0); // best-effort scrub of the raw PRF secret
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
