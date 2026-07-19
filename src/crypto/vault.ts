/**
 * At-rest encryption vault — KEK/DEK envelope.
 *
 *   passphrase --Argon2id--> KEK (non-extractable, RAM only)
 *   KEK --wrap/unwrap (AES-256-GCM)--> DEK (non-extractable, random)
 *   DEK --AES-256-GCM--> every record on disk (identity keys, ratchet
 *   state, message history, contacts)
 *
 * Why the envelope: changing the passphrase only re-wraps the DEK — we never
 * have to re-encrypt the whole database. And because the DEK is imported as a
 * NON-EXTRACTABLE CryptoKey, its raw bytes never live in JS-reachable memory,
 * so an XSS foothold cannot exfiltrate the key.
 */
import { deriveKekBytes, DEFAULT_ARGON2, type Argon2Params } from './argon2';

const IV_LEN = 12; // 96-bit nonce, the GCM sweet spot

/** Persisted, non-secret vault header. Salt + IV + wrapped DEK are safe on disk. */
export interface VaultHeader {
  version: 1;
  argon2: Argon2Params;
  salt: Uint8Array<ArrayBuffer>;
  wrapIv: Uint8Array<ArrayBuffer>;
  wrappedDek: Uint8Array<ArrayBuffer>;
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Falsche Passphrase oder beschädigter Tresor.');
    this.name = 'WrongPassphraseError';
  }
}

async function importKek(kekBytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const kek = await crypto.subtle.importKey(
    'raw',
    kekBytes,
    { name: 'AES-GCM' },
    false, // non-extractable
    ['wrapKey', 'unwrapKey'],
  );
  kekBytes.fill(0); // best-effort scrub of the raw KEK material
  return kek;
}

/**
 * Create a brand-new vault: generate a random DEK and wrap it under the
 * passphrase-derived KEK. Returns the header to persist plus the live,
 * non-extractable DEK ready for use.
 */
export async function createVault(
  passphrase: string,
  argon2: Argon2Params = DEFAULT_ARGON2,
): Promise<{ header: VaultHeader; dek: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kekBytes = await deriveKekBytes(passphrase, salt, argon2);
  const kek = await importKek(kekBytes);

  // Generate the DEK extractable ONLY so we can wrap it once; the working copy
  // we hand back is the non-extractable result of unwrapping.
  const seedDek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const wrapIv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const wrappedDek = new Uint8Array(
    await crypto.subtle.wrapKey('raw', seedDek, kek, { name: 'AES-GCM', iv: wrapIv }),
  );

  const header: VaultHeader = { version: 1, argon2, salt, wrapIv, wrappedDek };
  const dek = await unwrapDek(kek, header); // non-extractable working key
  return { header, dek };
}

async function unwrapDek(kek: CryptoKey, header: VaultHeader): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    header.wrappedDek,
    kek,
    { name: 'AES-GCM', iv: header.wrapIv },
    { name: 'AES-GCM', length: 256 },
    false, // DEK is non-extractable
    ['encrypt', 'decrypt'],
  );
}

/**
 * Unlock an existing vault. A wrong passphrase makes the GCM auth tag on the
 * wrapped DEK fail — so we detect it WITHOUT storing any separate verifier
 * (which would itself be an offline-attack oracle).
 */
export async function unlockVault(passphrase: string, header: VaultHeader): Promise<CryptoKey> {
  const kekBytes = await deriveKekBytes(passphrase, header.salt, header.argon2);
  const kek = await importKek(kekBytes);
  try {
    return await unwrapDek(kek, header);
  } catch {
    throw new WrongPassphraseError();
  }
}

export interface SealedRecord {
  iv: Uint8Array<ArrayBuffer>;
  ct: Uint8Array<ArrayBuffer>;
}

/**
 * Encrypt a record under the DEK with a fresh random nonce. `aad` (Additional
 * Authenticated Data) binds context — record type, id, schema version — into
 * the auth tag, preventing an attacker from swapping ciphertexts between slots
 * or rolling back to an older format.
 */
export async function seal(
  dek: CryptoKey,
  plaintext: Uint8Array<ArrayBuffer>,
  aad: Uint8Array<ArrayBuffer>,
): Promise<SealedRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, dek, plaintext),
  );
  return { iv, ct };
}

/** Decrypt a record. Throws if the tag (or the AAD binding) does not verify. */
export async function open(
  dek: CryptoKey,
  record: SealedRecord,
  aad: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: record.iv, additionalData: aad },
    dek,
    record.ct,
  );
  return new Uint8Array(pt);
}
