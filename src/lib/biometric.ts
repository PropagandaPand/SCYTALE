/**
 * WebAuthn PRF glue for biometric (Face ID / Touch ID) vault unlock.
 *
 * The platform authenticator, after a user-verification gesture, returns a stable
 * 32-byte PRF secret bound to a specific credential + salt. We HKDF that (salted
 * with the vault's device-bound secret, see vaultService) into an AES-GCM KEK and
 * use it to wrap/unwrap the SAME random DEK the passphrase path wraps — so
 * biometrics is a convenience door onto the existing vault, never a weaker copy of
 * the key on disk. The PRF secret exists only after a live biometric UV; note that
 * platform passkeys can SYNC (iCloud Keychain, Google Password Manager), so the PRF
 * secret alone is not strictly per-device — that is exactly why the KEK is also
 * salted with the device key, so an exfiltrated wrap opens only on a device that
 * holds BOTH the synced passkey and this device's non-extractable device key.
 *
 * Kept out of crypto/vault.ts because navigator.credentials is browser-only; the
 * vault crypto stays Node-testable.
 */

// PRF extension shapes aren't in every lib.dom version — keep the casts local.
type PrfOutputs = { enabled?: boolean; results?: { first?: ArrayBuffer } };

const PRF_INFO = new TextEncoder().encode('scytale:prf-kek:v1');

/** Is a user-verifying platform authenticator (Face ID / Touch ID / Hello) present? */
export async function biometricAvailable(): Promise<boolean> {
  if (typeof PublicKeyCredential === 'undefined') return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a throwaway-identity platform credential with the PRF extension enabled,
 * and return its id plus a fresh per-vault PRF salt. The credential carries no server
 * meaning — it exists only so PRF can derive a stable secret on this device.
 */
export async function createBiometricCredential(): Promise<{
  credentialId: Uint8Array<ArrayBuffer>;
  prfSalt: Uint8Array<ArrayBuffer>;
}> {
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));
  const opts = {
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'SCYTALE' }, // rp.id defaults to this exact origin
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'SCYTALE',
        displayName: 'SCYTALE',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      extensions: { prf: {} },
    },
  } as unknown as CredentialCreationOptions;
  const cred = (await navigator.credentials.create(opts)) as PublicKeyCredential | null;
  if (!cred) throw new Error('BIOMETRIC_CREATE_FAILED');
  return { credentialId: new Uint8Array(cred.rawId), prfSalt };
}

/** Evaluate PRF for a stored credential + salt → the 32-byte secret (after UV). */
export async function evaluatePrf(
  credentialId: Uint8Array<ArrayBuffer>,
  prfSalt: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const opts = {
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  } as unknown as CredentialRequestOptions;
  const assertion = (await navigator.credentials.get(opts)) as PublicKeyCredential | null;
  const prf = assertion?.getClientExtensionResults() as { prf?: PrfOutputs } | undefined;
  const first = prf?.prf?.results?.first;
  if (!first) throw new Error('BIOMETRIC_PRF_UNAVAILABLE');
  return new Uint8Array(first);
}

/**
 * HKDF-SHA256 the PRF secret into a non-extractable AES-GCM wrap/unwrap KEK.
 * `bindingSalt` carries the vault's device-bound secret so the KEK — and thus the
 * ability to unwrap the DEK — depends on THIS device's device key too, not just the
 * (possibly cloud-synced) passkey. Enrollment and unlock must pass the same salt.
 */
export async function derivePrfKek(
  prfSecret: Uint8Array<ArrayBuffer>,
  bindingSalt: BufferSource,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', prfSecret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: bindingSalt, info: PRF_INFO },
    material,
    { name: 'AES-GCM', length: 256 },
    false, // KEK is non-extractable
    ['wrapKey', 'unwrapKey'],
  );
}
