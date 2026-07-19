/**
 * Sealed Sender.
 *
 * Without this, the wire Envelope the relay stores exposes metadata: on first
 * contact the X3DH header carries the SENDER's identity public keys in the
 * clear, and every envelope carries the per-pair `conv` routing id (which links
 * the two parties). We wrap the whole encoded Envelope in an ANONYMOUS box to
 * the recipient's X25519 key — libsodium `crypto_box_seal`: a fresh ephemeral
 * keypair does the ECDH, so NO sender key ends up in the ciphertext. The relay
 * then only ever learns the recipient (the inbox it delivers to) plus timing
 * and size — never who sent, nor which conversation.
 *
 * Sender AUTHENTICITY is unaffected: it comes from the X3DH / Double Ratchet
 * payload INSIDE the seal, which the recipient verifies after opening. The seal
 * is purely an anonymity wrapper, not the security boundary.
 *
 * Residual (honest): the recipient's inbox address, message timing and size
 * stay visible, and network-level correlation (sender IP → recipient inbox) is
 * out of scope here — same residual as Signal's sealed sender.
 */
import { getSodium } from './sodium';
import type { KeyPair, IdentityKeys } from './identity';
import type { Bytes } from './types';

/** Anonymously encrypt `plaintext` to a recipient's X25519 public key.
 *  (Named `sealTo` to avoid colliding with the at-rest vault `seal`.) */
export async function sealTo(recipientDhPub: Bytes, plaintext: Bytes): Promise<Bytes> {
  const s = await getSodium();
  return new Uint8Array(s.crypto_box_seal(plaintext, recipientDhPub));
}

/** Open a sealed blob with our X25519 keypair; null if it isn't a valid seal
 *  for us (used to tell sealed from legacy-unsealed bytes during rollout). */
export async function unseal(myDh: KeyPair, sealed: Bytes): Promise<Bytes | null> {
  const s = await getSodium();
  try {
    return new Uint8Array(s.crypto_box_seal_open(sealed, myDh.publicKey, myDh.privateKey));
  } catch {
    return null;
  }
}

/** Inbound bytes → inner envelope bytes. Falls back to the raw bytes for legacy
 *  (pre-sealed-sender) messages still in flight during a rollout. */
export async function openInbound(me: IdentityKeys, bytes: Bytes): Promise<Bytes> {
  return (await unseal(me.dh, bytes)) ?? bytes;
}
