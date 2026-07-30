/**
 * Device linking (Signal model) — the master private key NEVER leaves the
 * primary device.
 *
 *   1. N (new device)  --QR-->  P (primary, holds masterPriv)
 *        LinkRequest { deviceSignPub, deviceDhPub, sasEphPub, protocolVersion }
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
import { sign, verify } from './identity';
import {
  signDeviceList,
  verifyDeviceList,
  encodeDeviceList,
  decodeDeviceList,
  MAX_DEVICE_LIST_DEVICES,
  type DeviceList,
  type DeviceEntry,
  type SignedPreKeyPublic,
} from './devicelist';
import { getSodium } from './sodium';
import { concatBytes, utf8 } from './codec';
import { linkingTranscriptBytes } from './sas';
import { asMasterPub, type Bytes } from './types';

/** N → P, carried in a QR code. */
export interface LinkRequest {
  deviceSignPub: Bytes; // Ed25519 of the new device
  deviceDhPub: Bytes; // X25519 of the new device
  sasEphPub: Bytes; // new device's SAS ephemeral
  /** Receive capability of the new device. Bound into the QR, grant proof and
   * master-signed DeviceList entry; it is never inferred by the primary. */
  protocolVersion: number;
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
  /** Master signature over this exact request+offer and issued cert/list.
   * Prevents a captured grant from an older, separately confirmed attempt from
   * being replayed into a fresh attempt with the same long-term device keys. */
  proof: Bytes;
}

// v4 appends the new device's receive capability. It is carried by the QR and
// subsequently bound into both the master-signed DeviceList and grant proof.
const REQ_VERSION = 4;
const REQ_LEN = 1 + 32 + 32 + 32 + 4 + 32 + 64 + 4; // version | signPub | dhPub | sasEph | spkId | spkPub | spkSig | protocolVersion
// v2 gained masterPub + epoch; v3 makes the complete offer/request pair the
// canonical SAS transcript. Older decoders report a version mismatch instead
// of accepting a payload with weaker semantics.
const OFFER_VERSION = 3;
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

const MAX_PROTOCOL_VERSION = 0xffff;

function assertProtocolVersion(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > MAX_PROTOCOL_VERSION
  ) {
    throw new Error('Ungültige Protokoll-Version im Kopplungs-Code.');
  }
}

function protocolVersionBytes(value: number): Bytes {
  assertProtocolVersion(value);
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, false);
  return out;
}

/** Compact QR: version(1) | signPub(32) | dhPub(32) | sasEphPub(32) | spkId(4, BE)
 *  | spkPub(32) | spkSig(64) | protocolVersion(4, BE). */
export async function encodeLinkRequest(req: LinkRequest): Promise<string> {
  assertProtocolVersion(req.protocolVersion);
  const s = await getSodium();
  const buf = new Uint8Array(REQ_LEN);
  buf[0] = REQ_VERSION;
  buf.set(req.deviceSignPub, 1);
  buf.set(req.deviceDhPub, 33);
  buf.set(req.sasEphPub, 65);
  new DataView(buf.buffer).setUint32(97, req.signedPreKey.id);
  buf.set(req.signedPreKey.pub, 101);
  buf.set(req.signedPreKey.signature, 133);
  new DataView(buf.buffer).setUint32(197, req.protocolVersion, false);
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
  // Dispatch on the version byte BEFORE the length check. A future payload
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
  const protocolVersion = dv.getUint32(197, false);
  assertProtocolVersion(protocolVersion);
  return {
    deviceSignPub: buf.slice(1, 33),
    deviceDhPub: buf.slice(33, 65),
    sasEphPub: buf.slice(65, 97),
    signedPreKey: { id: dv.getUint32(97), pub: buf.slice(101, 133), signature: buf.slice(133, 197) },
    protocolVersion,
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
  offer: LinkOffer,
): Promise<{ grant: LinkGrant; newList: DeviceList }> {
  assertProtocolVersion(req.protocolVersion);
  if (!sameBytes(offer.masterPub, masterPub) || offer.epoch !== epoch) {
    throw new Error('Kopplungs-Angebot gehört nicht zur aktuellen Hauptidentität.');
  }
  if (!(await verifyDeviceList(currentList, masterPub, epoch))) {
    throw new Error('Aktuelle Geräteliste ungültig — Kopplung abgebrochen.');
  }
  // Verify N's signed-prekey self-signature before the master vouches for it.
  // The SAS binds the SPK bytes, but this signature proves that the requested
  // device signing key actually authorized them.
  if (!(await verify(req.signedPreKey.pub, req.signedPreKey.signature, req.deviceSignPub))) {
    throw new Error('Signed-Prekey-Signatur des neuen Geräts ungültig — Kopplung abgebrochen.');
  }
  // Idempotent retry after persist-before-send: if the first delivery failed, the
  // durable list already contains exactly this request. Reuse its cert and version
  // rather than minting a duplicate entry or bumping the version again.
  const existing = currentList.devices.find((d) => sameBytes(d.signPub, req.deviceSignPub));
  if (existing) {
    const sameRequest =
      sameBytes(existing.dhPub, req.deviceDhPub) &&
      existing.protocolVersion === req.protocolVersion &&
      !!existing.signedPreKey &&
      existing.signedPreKey.id === req.signedPreKey.id &&
      sameBytes(existing.signedPreKey.pub, req.signedPreKey.pub) &&
      sameBytes(existing.signedPreKey.signature, req.signedPreKey.signature);
    if (!sameRequest) throw new Error('Geräte-ID ist bereits mit anderen Schlüsseln gekoppelt.');
    const grantBase = {
      masterPub,
      epoch,
      deviceCert: existing.deviceCert,
      deviceList: currentList,
    };
    return {
      grant: {
        ...grantBase,
        proof: await sign(await linkGrantProofMessage(req, offer, grantBase), masterPriv),
      },
      newList: currentList,
    };
  }
  if (currentList.devices.length >= MAX_DEVICE_LIST_DEVICES) {
    throw new Error(
      `Maximal ${MAX_DEVICE_LIST_DEVICES} Geräte können mit einer Identität verknüpft werden.`,
    );
  }
  const deviceCert = await signDeviceCert(masterPriv, epoch, req.deviceSignPub, req.deviceDhPub);
  const entry: DeviceEntry = {
    signPub: req.deviceSignPub,
    dhPub: req.deviceDhPub,
    deviceCert,
    signedPreKey: req.signedPreKey, // so peers can fan out to the newly linked device
    protocolVersion: req.protocolVersion,
  };
  const newList = await signDeviceList(masterPriv, masterPub, epoch, currentList.version + 1, [
    ...currentList.devices,
    entry,
  ]);
  const grantBase = { masterPub, epoch, deviceCert, deviceList: newList };
  return {
    grant: {
      ...grantBase,
      proof: await sign(await linkGrantProofMessage(req, offer, grantBase), masterPriv),
    },
    newList,
  };
}

function sameBytes(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const LINK_GRANT_PROOF_CTX = utf8.encode('SCYTALE-LINK-GRANT-PROOF-v3');

async function linkGrantProofMessage(
  request: LinkRequest,
  offer: LinkOffer,
  grant: Pick<LinkGrant, 'masterPub' | 'epoch' | 'deviceCert' | 'deviceList'>,
): Promise<Bytes> {
  if (
    !sameBytes(offer.masterPub, grant.masterPub) ||
    offer.epoch !== grant.epoch ||
    grant.deviceCert.length !== 64
  ) {
    throw new Error('Kopplungs-Nachweis und bestätigtes Transcript widersprechen sich.');
  }
  const encodedList = await encodeDeviceList(grant.deviceList);
  const listDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', encodedList));
  return concatBytes(
    LINK_GRANT_PROOF_CTX,
    linkingTranscriptBytes(request, {
      ...offer,
      masterPub: asMasterPub(offer.masterPub),
    }),
    protocolVersionBytes(request.protocolVersion),
    grant.deviceCert,
    listDigest,
  );
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
  expectedSpk: SignedPreKeyPublic | undefined,
  request: LinkRequest,
  offer: LinkOffer,
): Promise<boolean> {
  if (
    !sameBytes(request.deviceSignPub, myDeviceSignPub) ||
    !sameBytes(request.deviceDhPub, myDeviceDhPub) ||
    !sameBytes(offer.masterPub, grant.masterPub) ||
    offer.epoch !== grant.epoch ||
    grant.proof.length !== 64
  ) {
    return false;
  }
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
  const mine = list.devices.find((d) => sameBytes(d.signPub, myDeviceSignPub));
  if (
    !mine ||
    mine.protocolVersion !== request.protocolVersion ||
    !sameBytes(mine.dhPub, myDeviceDhPub) ||
    !sameBytes(mine.deviceCert, grant.deviceCert)
  ) {
    return false;
  }
  if (
    expectedSpk &&
    (!mine.signedPreKey ||
      mine.signedPreKey.id !== expectedSpk.id ||
      !sameBytes(mine.signedPreKey.pub, expectedSpk.pub) ||
      !sameBytes(mine.signedPreKey.signature, expectedSpk.signature))
  ) {
    return false;
  }
  try {
    return verify(
      await linkGrantProofMessage(request, offer, grant),
      grant.proof,
      grant.masterPub,
    );
  } catch {
    return false;
  }
}

// --- Grant wire format ------------------------------------------------------

const GRANT_VERSION = 2;

interface GrantWire {
  v: number;
  masterPub: string;
  epoch: number;
  deviceCert: string;
  deviceList: string; // b64 of encodeDeviceList
  proof: string;
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
    proof: b64(grant.proof),
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
    proof: unb64(wire.proof),
  };
}
