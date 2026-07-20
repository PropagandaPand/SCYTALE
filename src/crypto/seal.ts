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

// NOTE: a former `openInbound()` fell back to the RAW bytes when unsealing
// failed, so that unsealed messages from a pre-sealed-sender rollout still
// worked. It had no callers left and is deleted: while such a fallback exists,
// Sealed Sender is optional rather than enforced — and the attacker, not the
// rollout, gets to pick which path a message takes. openPayload() below returns
// null instead, so a payload that is not sealed for us is simply dropped.

// --- Tagged sealed payloads -------------------------------------------------
//
// Not everything that arrives in an inbox is a ratchet Envelope: a device
// LINKING GRANT is sealed to a device that has no session with the sender (it's
// the same user's other device). So the sealed plaintext carries a 1-byte type
// tag, and the receiver dispatches on it.

export const SEALED_ENVELOPE = 0;
export const SEALED_LINK_GRANT = 1;
/** Primary's SAS ephemeral, sent BEFORE any credential exists — see linking.ts. */
export const SEALED_LINK_OFFER = 2;

export async function sealPayload(recipientDhPub: Bytes, type: number, payload: Bytes): Promise<Bytes> {
  const tagged = new Uint8Array(1 + payload.length);
  tagged[0] = type;
  tagged.set(payload, 1);
  return sealTo(recipientDhPub, tagged);
}

export interface OpenedPayload {
  type: number;
  payload: Bytes;
}

/** Open a tagged sealed payload; null if it isn't sealed for us or is empty. */
export async function openPayload(me: IdentityKeys, bytes: Bytes): Promise<OpenedPayload | null> {
  const opened = await unseal(me.dh, bytes);
  if (!opened || opened.length < 1) return null;
  return { type: opened[0], payload: opened.slice(1) };
}
