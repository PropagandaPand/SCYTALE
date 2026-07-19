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
import { createVault, unlockVault, WrongPassphraseError, type VaultHeader } from '../crypto';
import { getOrCreateDeviceKey } from './deviceKey';
import { loadHeader, saveHeader } from './db';
import { clearFailures, lockoutStatus, registerFailure, type LockoutInfo } from './lockout';

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
