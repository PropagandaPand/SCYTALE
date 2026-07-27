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

/** The complete credential subject carried by N's QR. Kept structural here to
 * avoid a runtime import cycle with linking.ts. */
export interface LinkingRequestTranscript {
  deviceSignPub: Bytes;
  deviceDhPub: Bytes;
  sasEphPub: Bytes;
  signedPreKey: { id: number; pub: Bytes; signature: Bytes };
}

/** The inert offer P sends before either side confirms. */
export interface LinkingOfferTranscript {
  sasEphPub: Bytes;
  masterPub: MasterPub;
  epoch: number;
}

const LINK_SAS_CTX = utf8.encode('SCYTALE-LINK-SAS-v2');

function uint32(v: number, what: string): Bytes {
  if (!Number.isSafeInteger(v) || v < 0 || v > 0xffffffff) {
    throw new Error(`Ungültiger ${what} im Kopplungs-Transcript.`);
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, v, false);
  return out;
}

function exact(b2: Bytes, len: number, what: string): Bytes {
  if (b2.length !== len) throw new Error(`Ungültige ${what}-Länge im Kopplungs-Transcript.`);
  return b2;
}

/** Canonical, role-independent bytes for one complete linking attempt.
 *
 * This is shared by the human SAS and the master-signed LinkGrant proof. Keeping
 * one encoder prevents a field from being shown to the human but omitted from
 * the credential that is issued after confirmation (or vice versa).
 */
export function linkingTranscriptBytes(
  r: LinkingRequestTranscript,
  o: LinkingOfferTranscript,
): Bytes {
  exact(r.deviceSignPub, 32, 'Device-Sign-Key');
  exact(r.deviceDhPub, 32, 'Device-DH-Key');
  exact(r.sasEphPub, 32, 'Request-Ephemeral');
  exact(r.signedPreKey.pub, 32, 'Signed-Prekey');
  exact(r.signedPreKey.signature, 64, 'Signed-Prekey-Signatur');
  exact(o.sasEphPub, 32, 'Offer-Ephemeral');
  exact(o.masterPub, 32, 'Master-Key');
  return concatBytes(
    LINK_SAS_CTX,
    r.deviceSignPub,
    r.deviceDhPub,
    r.sasEphPub,
    uint32(r.signedPreKey.id, 'Signed-Prekey-ID'),
    r.signedPreKey.pub,
    r.signedPreKey.signature,
    o.sasEphPub,
    o.masterPub,
    uint32(o.epoch, 'Epoch'),
  );
}

/**
 * Device-linking SAS over one canonical, role-ordered transcript:
 *
 *   request(N sign, N dh, N eph, SPK id/pub/signature)
 *   offer(P eph, P master, epoch)
 *
 * Both endpoints encode N first and P second, so no caller-controlled sorting can
 * accidentally omit or reinterpret a credential field. In particular, keeping
 * the ephemerals/master fixed while replacing N's certified keys now changes the
 * SAS the human sees.
 */
export async function linkingSas(args: {
  role: 'new' | 'primary';
  myEph: KeyPair;
  request: LinkingRequestTranscript;
  offer: LinkingOfferTranscript;
}): Promise<SasResult> {
  const r = args.request;
  const o = args.offer;
  exact(args.myEph.publicKey, 32, 'eigenes SAS-Ephemeral');
  exact(args.myEph.privateKey, 32, 'privates SAS-Ephemeral');

  const expectedMine = args.role === 'new' ? r.sasEphPub : o.sasEphPub;
  if (cmpBytes(args.myEph.publicKey, expectedMine) !== 0) {
    throw new Error('Kopplungs-Session und Transcript gehören nicht zusammen.');
  }
  const theirEph = args.role === 'new' ? o.sasEphPub : r.sasEphPub;
  const s = await getSodium();
  const shared = b(s.crypto_scalarmult(args.myEph.privateKey, theirEph));
  const info = linkingTranscriptBytes(r, o);
  const sas = await hkdfSha256(shared, new Uint8Array(0), info, 18);
  return { emoji: emojiIndices(sas).map((i) => SAS_EMOJI[i]), decimal: decimals(sas) };
}
