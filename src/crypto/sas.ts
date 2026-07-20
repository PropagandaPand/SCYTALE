/**
 * SAS — Short Authentication String (Element/Matrix-style device & contact
 * verification).
 *
 * Both sides generate an ephemeral X25519 keypair and exchange the public keys
 * over the E2E channel. Each derives the same short value from
 *   HKDF-SHA256( ECDH(ephA, ephB),
 *                info = "SCYTALE-SAS-v1" ‖ min(eA,eB) ‖ max(eA,eB)
 *                                        ‖ min(idA,idB) ‖ max(idA,idB) )
 * and shows it as **7 emoji** (6 bits each → one of 64) or, as an alternative,
 * 6 decimal groups. If the two displays match, there is no MITM in the
 * verification channel — a man in the middle would have a different ECDH secret
 * with each side, so the emoji diverge. The identity keys being verified are
 * folded into `info`, so matching emoji also authenticate those keys.
 */
import { getSodium } from './sodium';
import { hkdfSha256 } from './kdf';
import { concatBytes, utf8 } from './codec';
import type { KeyPair } from './identity';
import type { Bytes, MasterPub } from './types';

const b = (x: Uint8Array): Bytes => new Uint8Array(x);

/** The 64 interoperable SAS emoji (index 0–63), with German names for a11y. */
export const SAS_EMOJI: { char: string; name: string }[] = [
  { char: '🐶', name: 'Hund' }, { char: '🐱', name: 'Katze' }, { char: '🦁', name: 'Löwe' },
  { char: '🐎', name: 'Pferd' }, { char: '🦄', name: 'Einhorn' }, { char: '🐷', name: 'Schwein' },
  { char: '🐘', name: 'Elefant' }, { char: '🐰', name: 'Hase' }, { char: '🐼', name: 'Panda' },
  { char: '🐓', name: 'Hahn' }, { char: '🐧', name: 'Pinguin' }, { char: '🐢', name: 'Schildkröte' },
  { char: '🐟', name: 'Fisch' }, { char: '🐙', name: 'Krake' }, { char: '🦋', name: 'Schmetterling' },
  { char: '🌷', name: 'Blume' }, { char: '🌳', name: 'Baum' }, { char: '🌵', name: 'Kaktus' },
  { char: '🍄', name: 'Pilz' }, { char: '🌏', name: 'Globus' }, { char: '🌙', name: 'Mond' },
  { char: '☁️', name: 'Wolke' }, { char: '🔥', name: 'Feuer' }, { char: '🍌', name: 'Banane' },
  { char: '🍎', name: 'Apfel' }, { char: '🍓', name: 'Erdbeere' }, { char: '🌽', name: 'Mais' },
  { char: '🍕', name: 'Pizza' }, { char: '🎂', name: 'Kuchen' }, { char: '❤️', name: 'Herz' },
  { char: '😀', name: 'Smiley' }, { char: '🤖', name: 'Roboter' }, { char: '🎩', name: 'Hut' },
  { char: '👓', name: 'Brille' }, { char: '🔧', name: 'Schraubenschlüssel' }, { char: '🎅', name: 'Weihnachtsmann' },
  { char: '👍', name: 'Daumen hoch' }, { char: '☂️', name: 'Regenschirm' }, { char: '⌛', name: 'Sanduhr' },
  { char: '⏰', name: 'Wecker' }, { char: '🎁', name: 'Geschenk' }, { char: '💡', name: 'Glühbirne' },
  { char: '📕', name: 'Buch' }, { char: '✏️', name: 'Bleistift' }, { char: '📎', name: 'Büroklammer' },
  { char: '✂️', name: 'Schere' }, { char: '🔒', name: 'Schloss' }, { char: '🔑', name: 'Schlüssel' },
  { char: '🔨', name: 'Hammer' }, { char: '☎️', name: 'Telefon' }, { char: '🏁', name: 'Flagge' },
  { char: '🚂', name: 'Zug' }, { char: '🚲', name: 'Fahrrad' }, { char: '✈️', name: 'Flugzeug' },
  { char: '🚀', name: 'Rakete' }, { char: '🏆', name: 'Pokal' }, { char: '⚽', name: 'Ball' },
  { char: '🎸', name: 'Gitarre' }, { char: '🎺', name: 'Trompete' }, { char: '🔔', name: 'Glocke' },
  { char: '⚓', name: 'Anker' }, { char: '🎧', name: 'Kopfhörer' }, { char: '📁', name: 'Ordner' },
  { char: '📌', name: 'Pinnnadel' },
];

export interface SasResult {
  emoji: { char: string; name: string }[]; // 7 emoji
  decimal: number[]; // 6 groups, 0000–9999
}

export async function generateSasEphemeral(): Promise<KeyPair> {
  const s = await getSodium();
  const kp = s.crypto_box_keypair(); // X25519
  return { publicKey: b(kp.publicKey), privateKey: b(kp.privateKey) };
}

function cmpBytes(a: Uint8Array, x: Uint8Array): number {
  for (let i = 0; i < Math.min(a.length, x.length); i++) if (a[i] !== x[i]) return a[i] - x[i];
  return a.length - x.length;
}

/** 7 emoji indices: 6 bits each (42 bits) read big-endian from the SAS bytes. */
function emojiIndices(sas: Bytes): number[] {
  const idx: number[] = [];
  let bit = 0;
  for (let i = 0; i < 7; i++) {
    let v = 0;
    for (let j = 0; j < 6; j++, bit++) v = (v << 1) | ((sas[bit >> 3] >> (7 - (bit & 7))) & 1);
    idx.push(v);
  }
  return idx;
}

/** 6 decimal groups (0000–9999), each from 16 bits of the SAS bytes. */
function decimals(sas: Bytes): number[] {
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    const hi = sas[6 + i * 2];
    const lo = sas[6 + i * 2 + 1];
    out.push(((hi << 8) | lo) % 10000);
  }
  return out;
}

/**
 * Compute the SAS both parties compare. `myIdPub` / `theirIdPub` are the
 * identity keys being verified (a contact's identity, or a device's key) — they
 * are bound into the derivation, so matching emoji authenticate them too.
 */
export async function computeSas(
  myEphPriv: Bytes,
  myEphPub: Bytes,
  theirEphPub: Bytes,
  myIdPub: Bytes,
  theirIdPub: Bytes,
): Promise<SasResult> {
  const s = await getSodium();
  const shared = b(s.crypto_scalarmult(myEphPriv, theirEphPub));
  const [e1, e2] = cmpBytes(myEphPub, theirEphPub) <= 0 ? [myEphPub, theirEphPub] : [theirEphPub, myEphPub];
  const [i1, i2] = cmpBytes(myIdPub, theirIdPub) <= 0 ? [myIdPub, theirIdPub] : [theirIdPub, myIdPub];
  const info = concatBytes(utf8.encode('SCYTALE-SAS-v1'), e1, e2, i1, i2);
  const sas = await hkdfSha256(shared, new Uint8Array(0), info, 18);
  return { emoji: emojiIndices(sas).map((i) => SAS_EMOJI[i]), decimal: decimals(sas) };
}

/**
 * The SAS for DEVICE LINKING — bound to the two MASTER keys, not the device keys.
 *
 * This is the single point where the emoji comparison gets its meaning.
 * `verifyLinkGrant` is necessarily self-referential: the new device has no
 * pinned master yet, it is *learning* one, so every check there is relative to
 * the master the grant asserts. A wholly forged grant passes all of them. The
 * only thing that actually authenticates the master is the human comparing
 * emoji — and that only works if the master is what the emoji are derived from.
 *
 * Hence `MasterPub` rather than `Bytes`: a UI that passed a device key here
 * would compile fine, produce matching emoji on both sides, and authenticate
 * nothing. The brand turns that from a silent hole into a compile error.
 */
export async function linkingSas(args: {
  myEph: KeyPair;
  theirEphPub: Bytes;
  myMasterPub: MasterPub;
  theirMasterPub: MasterPub;
}): Promise<SasResult> {
  return computeSas(
    args.myEph.privateKey,
    args.myEph.publicKey,
    args.theirEphPub,
    args.myMasterPub,
    args.theirMasterPub,
  );
}
