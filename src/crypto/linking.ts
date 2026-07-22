/**
 * Device linking (Signal model) — the master private key NEVER leaves the
 * primary device.
 *
 *   1. N (new device)  --QR-->  P (primary, holds masterPriv)
 *        LinkRequest { deviceSignPub, deviceDhPub, sasEphPub }
 *
 *   2. P  --sealed LinkOffer-->  N        ← NO credential, only P's SAS ephemeral
 *        LinkOffer { sasEphPub }
 *
 *   3. Both derive the same 7-emoji SAS. THE USER COMPARES AND CONFIRMS.
 *
 *   4. Only then: P  --sealed LinkGrant-->  N
 *        LinkGrant { masterPub, epoch, deviceCert(N), deviceList(v+1, incl. N) }
 *
 *   5. N installs, P persists the new list.
 *
 * WHY THE OFFER EXISTS (this is the whole point of the two-message shape):
 * a deviceCert is a BEARER CREDENTIAL. Once P signs one, it is in the world —
 * refusing to publish the device list afterwards does NOT revoke it, and a peer
 * that validates a bundle's cert against the master (see makeContact) would
 * accept the holder as us. So if P sent the grant merely to *display* a SAS,
 * an attacker whose QR the user scanned by mistake would walk away with a valid
 * cert even after the user answered "the emojis don't match".
 *
 * Therefore: nothing bearer-grade leaves P before human confirmation. The offer
 * carries only an ephemeral public key, which grants nothing on its own.
 *
 * The corollary for the UI: an abort at any point before step 4 must leave ZERO
 * state on BOTH sides — no cert issued, no list version bumped, nothing to roll
 * back. Commit is the last action, never a step that has to be undone.
 *
 * Consequence of not shipping masterPriv: N cannot sign further devices — there
 * is always one PRIMARY device. Moving the master to another device happens only
 * through the deliberate recovery-export path (re-prompt + separate passphrase),
 * never over this QR channel.
 */
import { verifyDeviceCert, signDeviceCert } from './master';
import { verify } from './identity';
import {
  signDeviceList,
  verifyDeviceList,
  deviceInList,
  encodeDeviceList,
  decodeDeviceList,
  type DeviceList,
  type DeviceEntry,
  type SignedPreKeyPublic,
} from './devicelist';
import { getSodium } from './sodium';
import { utf8 } from './codec';
import type { Bytes } from './types';

/** N → P, carried in a QR code. */
export interface LinkRequest {
  deviceSignPub: Bytes; // Ed25519 of the new device
  deviceDhPub: Bytes; // X25519 of the new device
  sasEphPub: Bytes; // new device's SAS ephemeral
  // N's signed prekey (Stage 3d v2): so P can put it in the master-signed device
  // list and peers can fan out X3DH to this new device without it writing first.
  signedPreKey: SignedPreKeyPublic;
}

/**
 * P → N, sealed. Carries ONLY inert public material: P's SAS ephemeral and P's
 * master PUBLIC key. It travels BEFORE the user compares the emoji, so it must
 * grant nothing to a device that turns out to be an attacker's — and neither of
 * these does. A master *public* key is not a credential; issuing certs needs the
 * private half, which never leaves P.
 *
 * `masterPub` is here out of necessity, not convenience: the SAS is derived over
 * it (see linkingSas), so N cannot compute the emoji without it. Deferring it to
 * the grant would mean the emoji were compared *before* the master was known —
 * i.e. they would authenticate nothing, and a substituted master would sail
 * through. With it in the offer, a wrong master produces different emoji and the
 * human sees it, which is the entire security of this flow.
 */
export interface LinkOffer {
  sasEphPub: Bytes;
  masterPub: Bytes;
  epoch: number;
}

/** P → N, sealed — sent ONLY after both users confirmed the SAS matches. */
export interface LinkGrant {
  masterPub: Bytes;
  epoch: number;
  deviceCert: Bytes; // master sig over (epoch, N.signPub, N.dhPub)
  deviceList: DeviceList; // updated list (version+1) that INCLUDES N
}

const REQ_VERSION = 2; // v2 (Stage 3d): the QR gained N's signed prekey
const REQ_LEN = 1 + 32 + 32 + 32 + 4 + 32 + 64; // version | signPub | dhPub | sasEph | spkId | spkPub | spkSig
// v2: gained masterPub + epoch, because the SAS must commit to the master
// before the user confirms. A v1 decoder sees the new length and reports a
// version mismatch ("update both devices") rather than a bogus parse.
const OFFER_VERSION = 2;
const OFFER_LEN = 1 + 32 + 32 + 4;

/** Offer wire: version(1) | sasEphPub(32) | masterPub(32) | epoch(4, BE). */
export function encodeLinkOffer(offer: LinkOffer): Bytes {
  const buf = new Uint8Array(OFFER_LEN);
  buf[0] = OFFER_VERSION;
  buf.set(offer.sasEphPub, 1);
  buf.set(offer.masterPub, 33);
  new DataView(buf.buffer).setUint32(65, offer.epoch);
  return buf;
}

export function decodeLinkOffer(bytes: Bytes): LinkOffer {
  if (bytes.length < 1) throw new Error('Ungültige Kopplungs-Antwort.');
  if (bytes[0] !== OFFER_VERSION) {
    throw new Error(
      `Kopplungs-Antwort hat Format-Version ${bytes[0]}, diese App versteht nur ${OFFER_VERSION} — bitte beide Geräte aktualisieren.`,
    );
  }
  if (bytes.length !== OFFER_LEN) throw new Error('Ungültige Kopplungs-Antwort.');
  return {
    sasEphPub: bytes.slice(1, 33),
    masterPub: bytes.slice(33, 65),
    epoch: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(65),
  };
}

/** Compact QR: version(1) | signPub(32) | dhPub(32) | sasEphPub(32) | spkId(4, BE)
 *  | spkPub(32) | spkSig(64). */
export async function encodeLinkRequest(req: LinkRequest): Promise<string> {
  const s = await getSodium();
  const buf = new Uint8Array(REQ_LEN);
  buf[0] = REQ_VERSION;
  buf.set(req.deviceSignPub, 1);
  buf.set(req.deviceDhPub, 33);
  buf.set(req.sasEphPub, 65);
  new DataView(buf.buffer).setUint32(97, req.signedPreKey.id);
  buf.set(req.signedPreKey.pub, 101);
  buf.set(req.signedPreKey.signature, 133);
  return s.to_base64(buf, s.base64_variants.URLSAFE_NO_PADDING);
}

export async function decodeLinkRequest(token: string): Promise<LinkRequest> {
  const s = await getSodium();
  let buf: Uint8Array;
  try {
    buf = new Uint8Array(s.from_base64(token.trim(), s.base64_variants.URLSAFE_NO_PADDING));
  } catch {
    throw new Error('Ungültiger Kopplungs-Code.');
  }
  if (buf.length < 1) throw new Error('Ungültiger Kopplungs-Code.');
  // Dispatch on the version byte BEFORE the length check. A future v2 payload
  // will have a different length, so checking length first would report "invalid
  // code" for what is really "your app is too old" — the user would hunt a
  // scanner bug instead of updating. The version byte only pays off if the
  // decoder actually branches on it; this is that branch.
  if (buf[0] !== REQ_VERSION) {
    throw new Error(
      `Kopplungs-Code hat Format-Version ${buf[0]}, diese App versteht nur ${REQ_VERSION} — bitte beide Geräte aktualisieren.`,
    );
  }
  if (buf.length !== REQ_LEN) throw new Error('Ungültiger Kopplungs-Code.');
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    deviceSignPub: buf.slice(1, 33),
    deviceDhPub: buf.slice(33, 65),
    sasEphPub: buf.slice(65, 97),
    signedPreKey: { id: dv.getUint32(97), pub: buf.slice(101, 133), signature: buf.slice(133, 197) },
  };
}

/**
 * Primary side: cross-sign the new device and produce the updated device list.
 *
 * ⚠️ CALL ORDER IS SECURITY-RELEVANT: this issues a bearer credential. It must
 * run only AFTER the user confirmed the SAS match (step 4 above), never to
 * produce something to display. It deliberately persists nothing — the caller
 * commits `newList` as its last action, so an abort before this call leaves no
 * state to roll back.
 */
export async function createLinkGrant(
  masterPriv: Bytes,
  masterPub: Bytes,
  epoch: number,
  currentList: DeviceList,
  req: LinkRequest,
): Promise<{ grant: LinkGrant; newList: DeviceList }> {
  if (deviceInList(currentList, req.deviceSignPub)) {
    throw new Error('Dieses Gerät ist bereits gekoppelt.');
  }
  // Verify N's signed-prekey self-signature BEFORE the master vouches for it. The
  // linking SAS binds only the two masters + ephemerals, not the SPK, so a QR-tamper
  // could otherwise splice an attacker's SPK into a master-signed list (peers would
  // then fail to initiate to N → silent inbound reachability DoS). (Review fund 3.)
  if (!(await verify(req.signedPreKey.pub, req.signedPreKey.signature, req.deviceSignPub))) {
    throw new Error('Signed-Prekey-Signatur des neuen Geräts ungültig — Kopplung abgebrochen.');
  }
  const deviceCert = await signDeviceCert(masterPriv, epoch, req.deviceSignPub, req.deviceDhPub);
  const entry: DeviceEntry = {
    signPub: req.deviceSignPub,
    dhPub: req.deviceDhPub,
    deviceCert,
    signedPreKey: req.signedPreKey, // so peers can fan out to the newly linked device
  };
  const newList = await signDeviceList(masterPriv, masterPub, epoch, currentList.version + 1, [
    ...currentList.devices,
    entry,
  ]);
  return { grant: { masterPub, epoch, deviceCert, deviceList: newList }, newList };
}

/**
 * New-device side: accept the grant only if it genuinely cross-signs OUR keys
 * and the accompanying list is master-signed, epoch-consistent and contains us.
 *
 * ⚠️ THIS FUNCTION IS DELIBERATELY SELF-REFERENTIAL AND THAT IS ONLY SAFE
 * BECAUSE OF THE SAS. The new device has no pinned master yet — it is *learning*
 * one — so every check here is relative to the master the grant asserts. A
 * wholly forged grant passes all of them.
 *
 * The thing that actually authenticates the master is the emoji comparison, and
 * therefore: **the SAS MUST be computed over P's masterPub.** If the linking UI
 * ever passes a device key instead, the emoji stop authenticating the identity
 * and this function's self-reference becomes a real hole. Locked as a
 * requirement for the stage-3b UI; see tests/sas-binds-master.test.mjs.
 */
export async function verifyLinkGrant(
  grant: LinkGrant,
  myDeviceSignPub: Bytes,
  myDeviceDhPub: Bytes,
): Promise<boolean> {
  // The cert must cover exactly our keys, under the claimed master + epoch.
  if (!(await verifyDeviceCert(grant.masterPub, grant.epoch, myDeviceSignPub, myDeviceDhPub, grant.deviceCert))) {
    return false;
  }
  // The list must be the same master + epoch, fully valid, and include us.
  const list = grant.deviceList;
  if (list.epoch !== grant.epoch) return false;
  if (list.masterPub.length !== grant.masterPub.length) return false;
  for (let i = 0; i < list.masterPub.length; i++) if (list.masterPub[i] !== grant.masterPub[i]) return false;
  // Anchored on the master the grant claims. That is NOT self-sufficient — a
  // forged grant carries a forged master and would pass this check. What makes
  // it sound is the SAS the user compares BEFORE the grant is even requested:
  // the emoji must be derived over P's masterPub, so a substituted master
  // produces different emoji. See the SAS requirement in verifyLinkGrant's doc.
  if (!(await verifyDeviceList(list, grant.masterPub, grant.epoch))) return false;
  return deviceInList(list, myDeviceSignPub);
}

// --- Grant wire format ------------------------------------------------------

const GRANT_VERSION = 1;

interface GrantWire {
  v: number;
  masterPub: string;
  epoch: number;
  deviceCert: string;
  deviceList: string; // b64 of encodeDeviceList
}

/** Sealed to the new device's X25519 key and dropped in its inbox. */
export async function encodeLinkGrant(grant: LinkGrant): Promise<Bytes> {
  const s = await getSodium();
  const b64 = (b: Bytes) => s.to_base64(b, s.base64_variants.ORIGINAL);
  const wire: GrantWire = {
    v: GRANT_VERSION,
    masterPub: b64(grant.masterPub),
    epoch: grant.epoch,
    deviceCert: b64(grant.deviceCert),
    deviceList: b64(await encodeDeviceList(grant.deviceList)),
  };
  return utf8.encode(JSON.stringify(wire));
}

export async function decodeLinkGrant(bytes: Bytes): Promise<LinkGrant> {
  const s = await getSodium();
  const unb64 = (x: string) => new Uint8Array(s.from_base64(x, s.base64_variants.ORIGINAL));
  let wire: GrantWire;
  try {
    wire = JSON.parse(utf8.decode(bytes)) as GrantWire;
  } catch {
    throw new Error('Kopplungs-Nachweis unlesbar.');
  }
  // Version before shape, same reason as the QR decoder: a future v2 must say
  // "app too old", not "invalid" — otherwise the user hunts the wrong bug.
  if (wire?.v !== GRANT_VERSION) {
    throw new Error(
      `Kopplungs-Nachweis hat Format-Version ${wire?.v}, diese App versteht nur ${GRANT_VERSION} — bitte beide Geräte aktualisieren.`,
    );
  }
  return {
    masterPub: unb64(wire.masterPub),
    epoch: wire.epoch,
    deviceCert: unb64(wire.deviceCert),
    deviceList: await decodeDeviceList(unb64(wire.deviceList)),
  };
}
