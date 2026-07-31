/**
 * Public trust anchor for SKYTALE's one official administrative identity.
 *
 * The private half must never enter this repository, a Worker secret, the PWA,
 * or an ordinary account vault. The public half is deliberately checked in so
 * a Cloudflare dashboard/config change cannot silently redefine who receives
 * the ADMIN badge in an already-reviewed release.
 *
 * Empty means "not provisioned yet" and makes every official-account operation
 * fail closed. The offline bootstrap ceremony replaces it with one canonical
 * unpadded base64url Ed25519 public key before activation.
 */
export const OFFICIAL_ACCOUNT_ROOT_KEY_ID = 'skytale-admin-root-v1';
export const OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL = '';

/** Raise this in a release after an emergency revocation or known stale replay. */
export const OFFICIAL_ACCOUNT_MIN_SEQUENCE = 1;

