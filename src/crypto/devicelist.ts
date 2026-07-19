/**
 * Device directory — a master-signed, versioned list of a user's current
 * devices. Distributed E2E (no server directory): carried in the code at first
 * contact and gossiped as a signed list on every add/remove.
 *
 * Design (locked):
 *   listSig = sign(masterPriv, "SCYTALE-DEVLIST-v1" ‖ epoch ‖ version ‖ Σ(signPub‖dhPub))
 *   - epoch is signed IN, so a list from epoch N can't be replayed in N+1.
 *   - ordering is lexicographic (epoch, version): a higher epoch beats a higher
 *     version, so a stale high-version list from an old epoch can't win.
 *   - the list is AUTHORITATIVE for "which devices are current". Revocation =
 *     absence from a newer list. A valid deviceCert ALONE is not enough to trust
 *     a device — it must ALSO be present in a list at least as new as the one
 *     already stored, else a removed device (whose cert is still epoch-valid)
 *     would keep working.
 */
import { sign, verify } from './identity';
import { verifyDeviceCert, epochBytes } from './master';
import { concatBytes, utf8 } from './codec';
import type { Bytes } from './types';

export interface DeviceEntry {
  signPub: Bytes; // Ed25519 device
  dhPub: Bytes; // X25519 device
  deviceCert: Bytes; // master sig over (epoch, signPub, dhPub)
}

export interface DeviceList {
  masterPub: Bytes;
  epoch: number;
  version: number;
  devices: DeviceEntry[];
  listSig: Bytes;
}

const CTX = utf8.encode('SCYTALE-DEVLIST-v1');

function cmpBytes(a: Bytes, b: Bytes): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

/** Canonical signed message: order-independent in the device set. */
function listMsg(epoch: number, version: number, devices: DeviceEntry[]): Bytes {
  const sorted = [...devices].sort((x, y) => cmpBytes(x.signPub, y.signPub));
  const parts: Bytes[] = [CTX, epochBytes(epoch), epochBytes(version)];
  for (const d of sorted) parts.push(d.signPub, d.dhPub);
  return concatBytes(...parts);
}

export async function signDeviceList(
  masterPriv: Bytes,
  masterPub: Bytes,
  epoch: number,
  version: number,
  devices: DeviceEntry[],
): Promise<DeviceList> {
  return { masterPub, epoch, version, devices, listSig: await sign(listMsg(epoch, version, devices), masterPriv) };
}

/** Verify the list signature against the master AND every device's cert. */
export async function verifyDeviceList(list: DeviceList): Promise<boolean> {
  if (!(await verify(listMsg(list.epoch, list.version, list.devices), list.listSig, list.masterPub))) return false;
  for (const d of list.devices) {
    if (!(await verifyDeviceCert(list.masterPub, list.epoch, d.signPub, d.dhPub, d.deviceCert))) return false;
  }
  return true;
}

/** Lexicographic (epoch, version) ordering. */
export function compareDeviceList(a: { epoch: number; version: number }, b: { epoch: number; version: number }): number {
  if (a.epoch !== b.epoch) return a.epoch < b.epoch ? -1 : 1;
  if (a.version !== b.version) return a.version < b.version ? -1 : 1;
  return 0;
}

/** True iff `candidate` is strictly newer than `stored` (rollback protection). */
export function isNewerDeviceList(
  candidate: { epoch: number; version: number },
  stored: { epoch: number; version: number },
): boolean {
  return compareDeviceList(candidate, stored) > 0;
}

/** Is this device part of the (authoritative) list? Cert-validity is separate. */
export function deviceInList(list: DeviceList, deviceSignPub: Bytes): boolean {
  return list.devices.some((d) => cmpBytes(d.signPub, deviceSignPub) === 0);
}
