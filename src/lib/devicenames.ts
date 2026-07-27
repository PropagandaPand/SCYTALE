/**
 * Human-friendly names for the user's own linked devices, kept in a LOCAL sealed record
 * — deliberately NOT inside the master-signed device list, which is gossiped to every
 * contact (that would leak "Leonard's iPhone" to them and make every rename a signed,
 * re-gossiped crypto op). Keyed by base64(device signPub). A missing entry falls back to
 * a generated label in the UI. Held on the device that manages the list (the primary).
 */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';
import { bytesToB64 } from './bytes';

const KEY = 'devicenames';
const AAD = utf8.encode('scytale:devicenames:v1') as Uint8Array<ArrayBuffer>;

export type DeviceNames = Record<string, string>; // b64(signPub) → name

export async function loadDeviceNames(dek: CryptoKey): Promise<DeviceNames> {
  const rec = await loadRecord(KEY);
  if (!rec) return {};
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, AAD))) as DeviceNames;
  } catch {
    return {};
  }
}

export async function saveDeviceNames(dek: CryptoKey, names: DeviceNames): Promise<void> {
  await saveRecord(KEY, await seal(dek, utf8.encode(JSON.stringify(names)) as Uint8Array<ArrayBuffer>, AAD));
}

/** Set (or clear, with an empty name) one device's name; returns the updated map. */
export async function setDeviceName(dek: CryptoKey, signPub: Uint8Array, name: string): Promise<DeviceNames> {
  const names = await loadDeviceNames(dek);
  const key = bytesToB64(signPub);
  if (name.trim()) names[key] = name.trim().slice(0, 40);
  else delete names[key];
  await saveDeviceNames(dek, names);
  return names;
}
