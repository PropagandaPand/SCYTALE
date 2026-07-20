/**
 * Device linking (Signal model) — the master private key NEVER leaves the
 * primary device.
 *
 *   N (new device)  --QR-->  P (primary, holds masterPriv)
 *     LinkRequest { deviceSignPub, deviceDhPub, sasEphPub }
 *
 *   P  --sealed to N's inbox-->  N
 *     LinkGrant { masterPub, epoch, deviceCert(N), deviceList(v+1, incl. N), sasEphPub }
 *
 * Both sides then derive the same 7-emoji SAS and the user compares them. Only
 * on a match does N accept the grant and P publish the new device list.
 *
 * Consequence of not shipping masterPriv: N cannot sign further devices — there
 * is always one PRIMARY device. Moving the master to another device happens only
 * through the deliberate recovery-export path (re-prompt + separate passphrase),
 * never over this QR channel.
 */
import { verifyDeviceCert, signDeviceCert } from './master';
import {
  signDeviceList,
  verifyDeviceList,
  deviceInList,
  type DeviceList,
  type DeviceEntry,
} from './devicelist';
import { getSodium } from './sodium';
import type { Bytes } from './types';

/** N → P, carried in a QR code. */
export interface LinkRequest {
  deviceSignPub: Bytes; // Ed25519 of the new device
  deviceDhPub: Bytes; // X25519 of the new device
  sasEphPub: Bytes; // new device's SAS ephemeral
}

/** P → N, sealed to the new device's X25519 key and dropped in its inbox. */
export interface LinkGrant {
  masterPub: Bytes;
  epoch: number;
  deviceCert: Bytes; // master sig over (epoch, N.signPub, N.dhPub)
  deviceList: DeviceList; // updated list (version+1) that INCLUDES N
  sasEphPub: Bytes; // primary device's SAS ephemeral
}

const REQ_VERSION = 1;

/** Compact QR payload: version(1) | signPub(32) | dhPub(32) | sasEphPub(32). */
export async function encodeLinkRequest(req: LinkRequest): Promise<string> {
  const s = await getSodium();
  const buf = new Uint8Array(1 + 32 + 32 + 32);
  buf[0] = REQ_VERSION;
  buf.set(req.deviceSignPub, 1);
  buf.set(req.deviceDhPub, 33);
  buf.set(req.sasEphPub, 65);
  return s.to_base64(buf, s.base64_variants.URLSAFE_NO_PADDING);
}

export async function decodeLinkRequest(token: string): Promise<LinkRequest> {
  const s = await getSodium();
  const buf = new Uint8Array(s.from_base64(token.trim(), s.base64_variants.URLSAFE_NO_PADDING));
  if (buf.length !== 97 || buf[0] !== REQ_VERSION) throw new Error('Ungültiger Kopplungs-Code.');
  return {
    deviceSignPub: buf.slice(1, 33),
    deviceDhPub: buf.slice(33, 65),
    sasEphPub: buf.slice(65, 97),
  };
}

/**
 * Primary side: cross-sign the new device and produce the updated device list.
 * Returns the grant to send AND the new list to persist/gossip (only after the
 * SAS has been confirmed).
 */
export async function createLinkGrant(
  masterPriv: Bytes,
  masterPub: Bytes,
  epoch: number,
  currentList: DeviceList,
  req: LinkRequest,
  primarySasEphPub: Bytes,
): Promise<{ grant: LinkGrant; newList: DeviceList }> {
  if (deviceInList(currentList, req.deviceSignPub)) {
    throw new Error('Dieses Gerät ist bereits gekoppelt.');
  }
  const deviceCert = await signDeviceCert(masterPriv, epoch, req.deviceSignPub, req.deviceDhPub);
  const entry: DeviceEntry = { signPub: req.deviceSignPub, dhPub: req.deviceDhPub, deviceCert };
  const newList = await signDeviceList(masterPriv, masterPub, epoch, currentList.version + 1, [
    ...currentList.devices,
    entry,
  ]);
  return { grant: { masterPub, epoch, deviceCert, deviceList: newList, sasEphPub: primarySasEphPub }, newList };
}

/**
 * New-device side: accept the grant only if it genuinely cross-signs OUR keys
 * and the accompanying list is master-signed, epoch-consistent and contains us.
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
  if (!(await verifyDeviceList(list))) return false;
  return deviceInList(list, myDeviceSignPub);
}
