/**
 * Own device list — this user's master-signed, versioned set of devices.
 *
 * The PRIMARY device (the one holding the master private key) is the only one
 * that can create or extend the list. A LINKED device receives its list through
 * the linking grant and can only store/replace it with a strictly newer,
 * verified one.
 */
import {
  signDeviceList,
  verifyDeviceList,
  deviceInList,
  isNewerDeviceList,
  encodeDeviceList,
  decodeDeviceList,
  isPrimaryDevice,
  seal,
  open,
  utf8,
  type DeviceList,
  type IdentityKeys,
  type SignedPreKeyPublic,
} from '../crypto';
import { loadRecord, saveRecord } from './db';

const KEY = 'devicelist';
const AAD = utf8.encode('scytale:devicelist:v1');

export async function saveOwnDeviceList(dek: CryptoKey, list: DeviceList): Promise<void> {
  await saveRecord(KEY, await seal(dek, await encodeDeviceList(list), AAD));
}

async function loadStored(dek: CryptoKey): Promise<DeviceList | null> {
  const rec = await loadRecord(KEY);
  if (!rec) return null;
  try {
    return await decodeDeviceList(await open(dek, rec, AAD));
  } catch {
    return null;
  }
}

/**
 * The current own device list. On the primary device a missing/mismatched list
 * is (re)created as version 1 containing just this device. On a linked device
 * we can only return what was stored — it cannot mint one without the master key.
 */
export async function loadOrCreateOwnDeviceList(
  dek: CryptoKey,
  id: IdentityKeys,
  ownSpk?: SignedPreKeyPublic,
): Promise<DeviceList | null> {
  const stored = await loadStored(dek);
  // Pin against OUR master: a stored record is not trusted just because it is
  // stored — vault corruption or a restored foreign backup must not install a
  // list signed by somebody else's master. Also (Stage 3d) re-mint if the stored
  // list lacks our signed prekey, so peers can fan out to this device.
  if (
    stored &&
    (await verifyDeviceList(stored, id.master.publicKey, id.epoch)) &&
    deviceInList(stored, id.sign.publicKey) &&
    (!ownSpk || stored.devices.some((d) => d.signedPreKey && eqSign(d.signPub, id.sign.publicKey)))
  ) {
    return stored;
  }
  if (!isPrimaryDevice(id)) return stored; // linked device: whatever we were granted

  // Preserve any other devices already in the stored list — only add/refresh OUR
  // entry (with our signed prekey). A fresh install just gets a single-device list.
  const ours = { signPub: id.sign.publicKey, dhPub: id.dh.publicKey, deviceCert: id.deviceCert, signedPreKey: ownSpk };
  const devices = stored?.devices?.length
    ? stored.devices.map((d) => (eqSign(d.signPub, id.sign.publicKey) ? ours : d))
    : [ours];
  if (!devices.some((d) => eqSign(d.signPub, id.sign.publicKey))) devices.push(ours);
  const list = await signDeviceList(id.master.privateKey, id.master.publicKey, id.epoch, (stored?.version ?? 0) + 1, devices);
  await saveOwnDeviceList(dek, list);
  return list;
}

function eqSign(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Replace the stored list with a newer, verified one (e.g. from a linking grant
 * or a gossip update). Rejects rollbacks and lists that don't include us.
 */
export async function adoptDeviceList(
  dek: CryptoKey,
  id: IdentityKeys,
  incoming: DeviceList,
): Promise<boolean> {
  // Our own master and epoch are the anchor — an incoming list that names a
  // different master is not a newer version of ours, it is somebody else's.
  if (!(await verifyDeviceList(incoming, id.master.publicKey, id.epoch))) return false;
  if (!deviceInList(incoming, id.sign.publicKey)) return false;
  const stored = await loadStored(dek);
  if (stored && !isNewerDeviceList(incoming, stored)) return false; // no rollback
  await saveOwnDeviceList(dek, incoming);
  return true;
}

/**
 * Remove a device from the OWN list (revocation / unlink). Only the PRIMARY can re-sign.
 * The removed device is simply absent from a NEWER (version+1) list — its cert stays
 * epoch-valid, so revocation is "absence from a newer list", propagated via gossip and
 * protected from rollback by isNewerDeviceList on every receiver. Refuses to remove our
 * OWN entry (the primary can't revoke itself this way), a device not present, or the last
 * one. Returns the new signed+stored list, or null if the removal was refused.
 */
export async function revokeDevice(
  dek: CryptoKey,
  id: IdentityKeys,
  current: DeviceList,
  targetSignPub: Uint8Array,
): Promise<DeviceList | null> {
  if (!isPrimaryDevice(id)) return null;
  if (eqSign(targetSignPub, id.sign.publicKey)) return null; // never revoke self here
  const devices = current.devices.filter((d) => !eqSign(d.signPub, targetSignPub));
  if (devices.length === current.devices.length || devices.length === 0) return null; // not present / would empty
  const list = await signDeviceList(id.master.privateKey, id.master.publicKey, id.epoch, current.version + 1, devices);
  await saveOwnDeviceList(dek, list);
  return list;
}
