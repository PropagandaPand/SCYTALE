/**
 * ArrayBuffer-backed byte array. WebCrypto (post-TS-5.7 lib.dom) rejects the
 * generic `Uint8Array<ArrayBufferLike>` because it could alias a SharedArrayBuffer,
 * so all crypto-facing byte payloads are pinned to this concrete type.
 */
export type Bytes = Uint8Array<ArrayBuffer>;

/**
 * A public key that has been established as a cross-signing MASTER key —
 * distinct from a device key at the type level.
 *
 * Why a brand: every key in this codebase is `Bytes`, so a UI wiring mistake
 * that passes a *device* key where a master is expected compiles cleanly and
 * fails silently. In the linking flow that is the worst possible silence: the
 * SAS emoji would still match on both sides, the user would confirm, and the
 * comparison would authenticate nothing — because `verifyLinkGrant` is
 * necessarily self-referential, the emoji are the ONLY thing binding the master.
 *
 * A required parameter tells you the call sites (see verifyDeviceList); a brand
 * tells you the ARGUMENT is wrong. Use `asMasterPub` only where the value
 * genuinely originates as a master: an identity's own master, a pinned
 * `peerMasterPub`, or a grant's `masterPub` after verification.
 */
export type MasterPub = Bytes & { readonly __masterPub: unique symbol };

/** Assert that these bytes are a master public key. Narrow, deliberate, rare. */
export function asMasterPub(b: Bytes): MasterPub {
  return b as MasterPub;
}
