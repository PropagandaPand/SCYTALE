/**
 * Argon2id key derivation.
 *
 * We derive the Key-Encryption-Key (KEK) from the user's passphrase using
 * Argon2id — the memory-hard KDF that resists both GPU and side-channel
 * attacks. The salt is random per vault and stored in the clear (a salt is
 * not a secret; its job is to defeat rainbow tables and make each vault's
 * derivation unique).
 */
export interface Argon2Params {
  /** Memory cost in KiB. 262144 KiB = 256 MiB. */
  memorySize: number;
  /** Time cost (number of passes). */
  iterations: number;
  /** Degree of parallelism. */
  parallelism: number;
}

/**
 * Sensible defaults targeting ~0.5–1 s on a modern device.
 * On low-end mobile, callers should fall back to a calibrated, lighter set.
 */
export const DEFAULT_ARGON2: Argon2Params = {
  memorySize: 262144, // 256 MiB
  iterations: 3,
  parallelism: 1,
};

/**
 * Hard floor enforced in code. The vault header (which carries the params) is
 * not authenticated until the DEK unwrap succeeds. Mutating the parameters of
 * an existing header cannot make that header easier to crack (the unwrap would
 * simply fail), but accepting policy-bypassing values from imported/crafted
 * envelopes would make the KDF contract ambiguous. The floor matches the
 * lightest value the calibrator writes, so legitimate vaults are unaffected.
 */
const MIN_ARGON2: Argon2Params = { memorySize: 65536, iterations: 3, parallelism: 1 };

/**
 * Ceilings, not just floors.
 *
 * The header is not authenticated before it is used to derive the KEK, so the
 * same attacker the floor defends against can also push the parameters UP. The
 * app currently writes only t=3, p=1 and at most 256 MiB (the calibrator may
 * choose less), so accepting anything higher adds no compatibility and only
 * creates a pre-authentication CPU/RAM denial of service.
 */
const MAX_ARGON2: Argon2Params = {
  memorySize: DEFAULT_ARGON2.memorySize,
  iterations: DEFAULT_ARGON2.iterations,
  parallelism: DEFAULT_ARGON2.parallelism,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(Number.isSafeInteger(v) ? v : lo, lo), hi);
}

/** Normalize untrusted, pre-authentication KDF parameters without 32-bit
 * coercions. Bitwise coercion is deliberately forbidden here: values above
 * 2^31 wrap and could turn an intended ceiling into an attacker-chosen low
 * value. Exported so the boundary can be tested without allocating Argon2 RAM. */
export function boundedArgon2Params(p: Argon2Params): Argon2Params {
  return {
    memorySize: clamp(p.memorySize, MIN_ARGON2.memorySize, MAX_ARGON2.memorySize),
    iterations: clamp(p.iterations, MIN_ARGON2.iterations, MAX_ARGON2.iterations),
    parallelism: clamp(p.parallelism, MIN_ARGON2.parallelism, MAX_ARGON2.parallelism),
  };
}

/**
 * Derive 32 raw bytes (256-bit KEK material) from a passphrase + salt.
 * The returned Uint8Array should be zeroed by the caller as soon as it has
 * been imported into a non-extractable CryptoKey.
 */
export async function deriveKekBytes(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  params: Argon2Params = DEFAULT_ARGON2,
): Promise<Uint8Array<ArrayBuffer>> {
  // Lazy-load hash-wasm — only needed at vault create/unlock, not on first paint.
  // Tolerate both ESM-named and CJS-default interop shapes.
  const wasm = (await import('hash-wasm')) as typeof import('hash-wasm') & {
    default?: typeof import('hash-wasm');
  };
  const argon2id = wasm.argon2id ?? wasm.default?.argon2id;
  if (!argon2id) throw new Error('hash-wasm konnte nicht geladen werden.');
  const p = boundedArgon2Params(params);
  const out = await argon2id({
    password: passphrase,
    salt,
    parallelism: p.parallelism,
    iterations: p.iterations,
    memorySize: p.memorySize,
    hashLength: 32,
    outputType: 'binary',
  });
  // Copy into a fresh ArrayBuffer-backed view for WebCrypto's BufferSource.
  return new Uint8Array(out);
}

/**
 * Rough on-device calibration: pick the largest memory cost whose derivation
 * stays under `targetMs`. Runs a few trial derivations. Result is persisted in
 * the vault header so future unlocks reuse the same (or stronger) parameters.
 */
export async function calibrateArgon2(targetMs = 750): Promise<Argon2Params> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const candidates = [262144, 131072, 65536]; // 256, 128, 64 MiB
  for (const memorySize of candidates) {
    const params: Argon2Params = { memorySize, iterations: 3, parallelism: 1 };
    const start = performance.now();
    await deriveKekBytes('calibration-probe', salt, params);
    const elapsed = performance.now() - start;
    if (elapsed <= targetMs) return params;
  }
  return { memorySize: 65536, iterations: 3, parallelism: 1 };
}
