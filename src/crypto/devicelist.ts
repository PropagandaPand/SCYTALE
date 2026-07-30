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
import { concatBytes, utf8, b64encode, b64decode } from './codec';
import type { Bytes } from './types';
import type { PreKeyBundle } from './prekeys';

/** A device's SIGNED prekey, public half — the ONE stable prekey (Signal cadence,
 *  rotates rarely). Carried in the device list so a peer can INITIATE X3DH to a
 *  device it never heard from (Stage 3d fan-out). There are no one-time prekeys
 *  for a silent device (no prekey server), so the no-OPK X3DH is used. `pub` is
 *  bound into the master-signed listMsg → a stale SPK travels only with a stale
 *  (lower-version) list, which isNewerDeviceList rejects (rollback protection). */
export interface SignedPreKeyPublic {
  id: number;
  pub: Bytes; // X25519 signed-prekey public
  signature: Bytes; // device identity-sign key's signature over pub
}

export interface DeviceEntry {
  signPub: Bytes; // Ed25519 device
  dhPub: Bytes; // X25519 device
  deviceCert: Bytes; // master sig over (epoch, signPub, dhPub)
  signedPreKey?: SignedPreKeyPublic; // present on 3d lists → enables initiating to a silent device
  /** Master-signed receive capability; absent/0 means legacy or unknown. */
  protocolVersion?: number;
}

export interface DeviceList {
  masterPub: Bytes;
  epoch: number;
  version: number;
  devices: DeviceEntry[];
  listSig: Bytes;
}

const CTX = utf8.encode('SCYTALE-DEVLIST-v1');
const CTX_CAPABILITIES = utf8.encode('SCYTALE-DEVLIST-v3');
/** Deliberately above the group limit (8), but small enough that an
 * authenticated peer cannot turn one directory update into hundreds of
 * signature verifications and fan-out targets on a phone. */
export const MAX_DEVICE_LIST_DEVICES = 32;
export const MAX_DEVICE_LIST_WIRE_BYTES = 64 * 1024;
const UINT32_MAX = 0xffff_ffff;

function cmpBytes(a: Bytes, b: Bytes): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

function exactBytes(value: unknown, length: number): value is Bytes {
  return value instanceof Uint8Array && value.length === length;
}

function safePositive(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function validDeviceEntries(devices: unknown): devices is DeviceEntry[] {
  if (
    !Array.isArray(devices) ||
    devices.length < 1 ||
    devices.length > MAX_DEVICE_LIST_DEVICES
  ) {
    return false;
  }
  const signKeys = new Set<string>();
  const dhKeys = new Set<string>();
  for (const device of devices) {
    if (
      typeof device !== 'object' ||
      device === null ||
      Array.isArray(device)
    ) {
      return false;
    }
    const d = device as Partial<DeviceEntry>;
    if (
      !exactBytes(d.signPub, 32) ||
      !exactBytes(d.dhPub, 32) ||
      !exactBytes(d.deviceCert, 64)
    ) {
      return false;
    }
    const signKey = Array.from(d.signPub, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const dhKey = Array.from(d.dhPub, (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (signKeys.has(signKey) || dhKeys.has(dhKey)) return false;
    signKeys.add(signKey);
    dhKeys.add(dhKey);
    if (
      d.protocolVersion !== undefined &&
      (!Number.isSafeInteger(d.protocolVersion) ||
        d.protocolVersion < 0 ||
        d.protocolVersion > 0xffff)
    ) {
      return false;
    }
    if (d.signedPreKey !== undefined) {
      const spk = d.signedPreKey;
      if (
        typeof spk !== 'object' ||
        spk === null ||
        !Number.isSafeInteger(spk.id) ||
        spk.id < 0 ||
        spk.id > UINT32_MAX ||
        !exactBytes(spk.pub, 32) ||
        !exactBytes(spk.signature, 64)
      ) {
        return false;
      }
    }
  }
  return true;
}

/** Cheap, allocation-bounded structural validation before any signature work. */
export function hasValidDeviceListShape(value: unknown): value is DeviceList {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const list = value as Partial<DeviceList>;
  return (
    exactBytes(list.masterPub, 32) &&
    safePositive(list.epoch) &&
    safePositive(list.version) &&
    validDeviceEntries(list.devices) &&
    exactBytes(list.listSig, 64)
  );
}

/** Canonical signed message: order-independent in the device set. */
function listMsg(masterPub: Bytes, epoch: number, version: number, devices: DeviceEntry[]): Bytes {
  const sorted = [...devices].sort((x, y) => cmpBytes(x.signPub, y.signPub));
  const carriesCapabilities = sorted.some(
    (device) => device.protocolVersion !== undefined,
  );
  // masterPub is signed along: it costs nothing and removes a whole class of
  // confusion where a signature verifies under a key the message never named.
  const parts: Bytes[] = [
    carriesCapabilities ? CTX_CAPABILITIES : CTX,
    masterPub,
    epochBytes(epoch),
    epochBytes(version),
  ];
  // The SIGNED-prekey public is bound in too (when present), so the master vouches
  // for it and it can't be spliced/rolled back independently of the list version.
  // A device WITHOUT a signed prekey (legacy/v1 list) pushes nothing extra → the
  // signed message is byte-identical to the old format, so old lists still verify.
  for (const d of sorted) {
    parts.push(d.signPub, d.dhPub);
    if (d.signedPreKey) parts.push(d.signedPreKey.pub);
    if (carriesCapabilities) {
      parts.push(epochBytes(d.protocolVersion ?? 0));
    }
  }
  return concatBytes(...parts);
}

export async function signDeviceList(
  masterPriv: Bytes,
  masterPub: Bytes,
  epoch: number,
  version: number,
  devices: DeviceEntry[],
): Promise<DeviceList> {
  if (
    !exactBytes(masterPub, 32) ||
    !safePositive(epoch) ||
    !safePositive(version) ||
    !validDeviceEntries(devices)
  ) {
    throw new Error('Ungültige Geräteliste kann nicht signiert werden.');
  }
  return { masterPub, epoch, version, devices, listSig: await sign(listMsg(masterPub, epoch, version, devices), masterPriv) };
}

/** Verify the list signature against the master AND every device's cert. */
/**
 * Verify a device list AGAINST A PINNED MASTER.
 *
 * ⚠️ `pinnedMasterPub` is required on purpose. Verifying a list against the key
 * the list itself carries is self-referential: an attacker generates a master,
 * signs whatever list they like, and it verifies perfectly. The pinning check
 * is the entire security of this function, so it must not be something a caller
 * can forget — the same structural mistake that put the conversation-binding
 * check inside a single branch (v0.16.4). Make it impossible, not unlikely.
 *
 * `pinnedEpoch`, when given, additionally refuses a list from an older epoch:
 * a master rotation must not be undone by replaying a pre-rotation list.
 */
export async function verifyDeviceList(
  list: DeviceList,
  pinnedMasterPub: Bytes,
  pinnedEpoch?: number,
): Promise<boolean> {
  try {
    if (
      !hasValidDeviceListShape(list) ||
      !exactBytes(pinnedMasterPub, 32) ||
      (pinnedEpoch !== undefined && !safePositive(pinnedEpoch))
    ) {
      return false;
    }
    if (cmpBytes(list.masterPub, pinnedMasterPub) !== 0) return false;
    if (pinnedEpoch !== undefined && list.epoch < pinnedEpoch) return false;
    if (
      !(await verify(
        listMsg(list.masterPub, list.epoch, list.version, list.devices),
        list.listSig,
        list.masterPub,
      ))
    ) {
      return false;
    }
    for (const d of list.devices) {
      if (!(await verifyDeviceCert(list.masterPub, list.epoch, d.signPub, d.dhPub, d.deviceCert))) return false;
      // A carried signed prekey must be self-signed by the device it belongs to, so a
      // spliced/forged SPK is rejected everywhere the list is verified (Review fund 3).
      if (d.signedPreKey && !(await verify(d.signedPreKey.pub, d.signedPreKey.signature, d.signPub))) return false;
    }
    return true;
  } catch {
    // Malformed attacker-controlled key material must be a normal rejection,
    // never an exception that tears down an authenticated receive pipeline.
    return false;
  }
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

// --- (de)serialisation — used for vault storage AND for wire distribution ---

interface WireSpk {
  id: number;
  pub: string;
  signature: string;
}
interface DeviceListWire {
  v: 1 | 2 | 3; // v3 adds master-signed per-device protocol capability
  masterPub: string;
  epoch: number;
  version: number;
  devices: {
    signPub: string;
    dhPub: string;
    deviceCert: string;
    signedPreKey?: WireSpk;
    protocolVersion?: number;
  }[];
  listSig: string;
}

export async function encodeDeviceList(list: DeviceList): Promise<Bytes> {
  if (!hasValidDeviceListShape(list)) {
    throw new Error('Ungültige Geräteliste kann nicht serialisiert werden.');
  }
  const wire: DeviceListWire = {
    v: list.devices.some((device) => device.protocolVersion !== undefined)
      ? 3
      : 2,
    masterPub: await b64encode(list.masterPub),
    epoch: list.epoch,
    version: list.version,
    devices: await Promise.all(
      list.devices.map(async (d) => ({
        signPub: await b64encode(d.signPub),
        dhPub: await b64encode(d.dhPub),
        deviceCert: await b64encode(d.deviceCert),
        ...(d.protocolVersion !== undefined
          ? { protocolVersion: d.protocolVersion }
          : {}),
        ...(d.signedPreKey
          ? {
              signedPreKey: {
                id: d.signedPreKey.id,
                pub: await b64encode(d.signedPreKey.pub),
                signature: await b64encode(d.signedPreKey.signature),
              },
            }
          : {}),
      })),
    ),
    listSig: await b64encode(list.listSig),
  };
  return utf8.encode(JSON.stringify(wire));
}

export async function decodeDeviceList(bytes: Bytes): Promise<DeviceList> {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.length < 1 ||
    bytes.length > MAX_DEVICE_LIST_WIRE_BYTES
  ) {
    throw new Error('Geräteliste ist leer oder zu groß.');
  }
  const parsed: unknown = JSON.parse(utf8.decode(bytes));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Ungültiges DeviceList-Format.');
  }
  const wire = parsed as DeviceListWire;
  if (wire.v !== 1 && wire.v !== 2 && wire.v !== 3) {
    throw new Error('Unbekanntes DeviceList-Format.');
  }
  if (
    typeof wire.masterPub !== 'string' ||
    typeof wire.listSig !== 'string' ||
    !safePositive(wire.epoch) ||
    !safePositive(wire.version) ||
    !Array.isArray(wire.devices) ||
    wire.devices.length < 1 ||
    wire.devices.length > MAX_DEVICE_LIST_DEVICES
  ) {
    throw new Error('Ungültige Gerätelisten-Struktur.');
  }
  for (const device of wire.devices) {
    if (
      typeof device !== 'object' ||
      device === null ||
      typeof device.signPub !== 'string' ||
      typeof device.dhPub !== 'string' ||
      typeof device.deviceCert !== 'string' ||
      (device.signedPreKey !== undefined &&
        (typeof device.signedPreKey !== 'object' ||
          device.signedPreKey === null ||
          !Number.isSafeInteger(device.signedPreKey.id) ||
          device.signedPreKey.id < 0 ||
          device.signedPreKey.id > UINT32_MAX ||
          typeof device.signedPreKey.pub !== 'string' ||
          typeof device.signedPreKey.signature !== 'string')) ||
      (wire.v === 3 &&
        device.protocolVersion !== undefined &&
        (!Number.isSafeInteger(device.protocolVersion) ||
          (device.protocolVersion as number) < 0 ||
          (device.protocolVersion as number) > 0xffff)) ||
      (wire.v !== 3 && device.protocolVersion !== undefined)
    ) {
      throw new Error('Ungültiger Gerätelisten-Eintrag.');
    }
  }
  const list: DeviceList = {
    masterPub: await b64decode(wire.masterPub),
    epoch: wire.epoch,
    version: wire.version,
    devices: await Promise.all(
      wire.devices.map(async (d) => ({
        signPub: await b64decode(d.signPub),
        dhPub: await b64decode(d.dhPub),
        deviceCert: await b64decode(d.deviceCert),
        ...(wire.v === 3 &&
        Number.isSafeInteger(d.protocolVersion) &&
        (d.protocolVersion as number) >= 0
          ? { protocolVersion: d.protocolVersion }
          : {}),
        ...(d.signedPreKey
          ? {
              signedPreKey: {
                id: d.signedPreKey.id,
                pub: await b64decode(d.signedPreKey.pub),
                signature: await b64decode(d.signedPreKey.signature),
              },
            }
          : {}),
      })),
    ),
    listSig: await b64decode(wire.listSig),
  };
  if (!hasValidDeviceListShape(list)) {
    throw new Error('Ungültige Schlüssel oder doppelte Geräte in der Geräteliste.');
  }
  return list;
}

/** Build a PreKeyBundle for INITIATING X3DH to a specific device from its list
 *  entry, so we can fan out to a device we have no session with. Returns null if
 *  the entry carries no signed prekey (a legacy/v1 device we can't initiate to —
 *  we can still RECEIVE from it). No one-time prekey: silent devices have none. */
export function bundleFromDeviceEntry(masterPub: Bytes, epoch: number, entry: DeviceEntry): PreKeyBundle | null {
  if (!entry.signedPreKey) return null;
  return {
    masterPub,
    epoch,
    deviceCert: entry.deviceCert,
    identitySignPub: entry.signPub,
    identityDhPub: entry.dhPub,
    signedPreKey: { id: entry.signedPreKey.id, pub: entry.signedPreKey.pub, signature: entry.signedPreKey.signature },
    oneTimePreKey: undefined,
    protocolVersion: entry.protocolVersion,
  };
}
