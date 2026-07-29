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
  createLinkGrant,
  encodeLinkGrant,
  sealPayload,
  SEALED_LINK_GRANT,
  seal,
  open,
  utf8,
  PROTOCOL_VERSION,
  type Bytes,
  type DeviceList,
  type IdentityKeys,
  type LinkGrant,
  type LinkOffer,
  type LinkRequest,
  type SignedPreKeyPublic,
  type SealedRecord,
} from '../crypto';
import {
  compareAndSwapRecords,
  compareAndSwapRecordsWithDeletes,
  loadRecord,
} from './db';
import {
  PENDING_LINK_GRANT_KEY,
  openPendingLinkGrantRecord,
  sealPendingLinkGrantRecord,
} from './linkIntent';

const KEY = 'devicelist';
const AAD = utf8.encode('scytale:devicelist:v1');

/** Prepare the exact sealed record used by the atomic identity+list install. */
export async function sealOwnDeviceListRecord(dek: CryptoKey, list: DeviceList): Promise<SealedRecord> {
  return seal(dek, await encodeDeviceList(list), AAD);
}

interface DeviceListSnapshot {
  record: SealedRecord | undefined;
  list: DeviceList | null;
}

async function loadSnapshot(dek: CryptoKey): Promise<DeviceListSnapshot> {
  const record = await loadRecord(KEY);
  if (!record) return { record: undefined, list: null };
  try {
    return { record, list: await decodeDeviceList(await open(dek, record, AAD)) };
  } catch (cause) {
    throw new DeviceListCorruptError(cause);
  }
}

async function commitSnapshot(
  dek: CryptoKey,
  snapshot: DeviceListSnapshot,
  list: DeviceList,
): Promise<boolean> {
  if (await loadRecord(PENDING_LINK_GRANT_KEY)) {
    throw new Error('Geräteliste ist bis zur Zustellung des Kopplungs-Nachweises gesperrt.');
  }
  return compareAndSwapRecords(
    [
      [KEY, snapshot.record],
      [PENDING_LINK_GRANT_KEY, undefined],
    ],
    [[KEY, await sealOwnDeviceListRecord(dek, list)]],
  );
}

const MAX_CAS_RETRIES = 12;

export class DeviceListCorruptError extends Error {
  constructor(cause?: unknown) {
    super('Gespeicherte Geräteliste ist beschädigt oder nicht authentifizierbar.');
    this.name = 'DeviceListCorruptError';
    (this as { cause?: unknown }).cause = cause;
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
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadSnapshot(dek);
    const stored = snapshot.list;
    // Pin against OUR master: a stored record is not trusted just because it is
    // stored — vault corruption or a restored foreign backup must not install a
    // list signed by somebody else's master.
    const storedTrusted =
      !!stored &&
      (await verifyDeviceList(stored, id.master.publicKey, id.epoch)) &&
      deviceInList(stored, id.sign.publicKey);
    const ownEntry = storedTrusted
      ? stored.devices.find((d) => eqSign(d.signPub, id.sign.publicKey))
      : undefined;
    const spkCurrent =
      !ownSpk ||
      (!!ownEntry?.signedPreKey && sameSpk(ownEntry.signedPreKey, ownSpk));
    const capabilityCurrent =
      ownEntry?.protocolVersion === PROTOCOL_VERSION;
    if (storedTrusted && spkCurrent && capabilityCurrent) {
      return stored;
    }
    // A linked device cannot repair a foreign/unverified list and must never
    // return it as authority merely because it was decryptable. It may keep
    // using an otherwise-current verified legacy list, but only the primary can
    // bump its version and master-sign the missing receive capability.
    if (!isPrimaryDevice(id)) return storedTrusted && spkCurrent ? stored : null;
    if (stored && !storedTrusted) {
      throw new Error('Gespeicherte Geräteliste gehört nicht zur aktuellen Identität.');
    }

    // Preserve every device from the latest CAS snapshot and only refresh ours.
    const ours = {
      signPub: id.sign.publicKey,
      dhPub: id.dh.publicKey,
      deviceCert: id.deviceCert,
      signedPreKey: ownSpk,
      protocolVersion: PROTOCOL_VERSION,
    };
    const devices = stored?.devices.length
      ? stored.devices.map((d) => (eqSign(d.signPub, id.sign.publicKey) ? ours : d))
      : [ours];
    if (!devices.some((d) => eqSign(d.signPub, id.sign.publicKey))) devices.push(ours);
    const list = await signDeviceList(
      id.master.privateKey,
      id.master.publicKey,
      id.epoch,
      (stored?.version ?? 0) + 1,
      devices,
    );
    if (await commitSnapshot(dek, snapshot, list)) return list;
  }
  throw new Error('Geräteliste wurde gleichzeitig zu oft geändert — bitte erneut versuchen.');
}

function eqSign(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function sameSpk(a: SignedPreKeyPublic, b: SignedPreKeyPublic): boolean {
  return (
    a.id === b.id &&
    eqSign(a.pub, b.pub) &&
    eqSign(a.signature, b.signature)
  );
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
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadSnapshot(dek);
    const stored = snapshot.list;
    // Only a list verified under our current identity is a rollback anchor. A
    // decryptable foreign list is not allowed to block a valid replacement.
    if (
      stored &&
      (await verifyDeviceList(stored, id.master.publicKey, id.epoch)) &&
      !isNewerDeviceList(incoming, stored)
    ) {
      return false;
    }
    if (await commitSnapshot(dek, snapshot, incoming)) return true;
  }
  throw new Error('Geräteliste wurde gleichzeitig zu oft geändert — bitte erneut versuchen.');
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
  if (!(await verifyDeviceList(current, id.master.publicKey, id.epoch))) {
    throw new Error('Geräteliste ungültig — Widerruf abgebrochen.');
  }
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const snapshot = await loadSnapshot(dek);
    const base = snapshot.list ?? current;
    if (!(await verifyDeviceList(base, id.master.publicKey, id.epoch))) {
      throw new Error('Gespeicherte Geräteliste ungültig — Widerruf abgebrochen.');
    }
    const devices = base.devices.filter((d) => !eqSign(d.signPub, targetSignPub));
    if (devices.length === base.devices.length || devices.length === 0) return null;
    const list = await signDeviceList(
      id.master.privateKey,
      id.master.publicKey,
      id.epoch,
      base.version + 1,
      devices,
    );
    if (await commitSnapshot(dek, snapshot, list)) return list;
  }
  throw new Error('Geräteliste wurde gleichzeitig zu oft geändert — bitte erneut versuchen.');
}

export interface CancelledPendingLinkGrant {
  newList: DeviceList;
  targetSignPub: Bytes;
}

/**
 * Explicit P-side cancellation after DeviceList + delivery intent already
 * committed. The only safe rollback is a NEWER master-signed list without the
 * target. Commit that revocation and delete the exact pending payload in one
 * CAS transaction, so neither a crash nor another tab can leave a ghost entry
 * paired with an absent retry (or a permanent coordination blocker).
 */
export async function cancelPendingLinkGrantAndRevokeDevice(
  dek: CryptoKey,
  id: IdentityKeys,
  expectedTargetSignPub?: Bytes,
): Promise<CancelledPendingLinkGrant | null> {
  if (!isPrimaryDevice(id)) {
    throw new Error('Nur das Hauptgerät kann eine ausstehende Kopplung widerrufen.');
  }
  if (expectedTargetSignPub && expectedTargetSignPub.length !== 32) {
    throw new Error('Ungültiges erwartetes Kopplungs-Ziel.');
  }
  let targetSignPub: Bytes | null = expectedTargetSignPub
    ? new Uint8Array(expectedTargetSignPub)
    : null;
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const [snapshot, pendingSnapshot] = await Promise.all([
      loadSnapshot(dek),
      loadRecord(PENDING_LINK_GRANT_KEY),
    ]);
    if (pendingSnapshot) {
      const pending = await openPendingLinkGrantRecord(dek, pendingSnapshot);
      if (targetSignPub && !eqSign(targetSignPub, pending.recipientSignPub)) {
        throw new Error('Eine neuere ausstehende Kopplung hat den Widerruf überholt.');
      }
      targetSignPub = pending.recipientSignPub;
    } else if (!targetSignPub) {
      return null;
    }

    const current = snapshot.list;
    if (
      !current ||
      !(await verifyDeviceList(current, id.master.publicKey, id.epoch)) ||
      !deviceInList(current, id.sign.publicKey)
    ) {
      throw new Error('Aktuelle Geräteliste ungültig — Kopplungs-Widerruf abgebrochen.');
    }
    if (!targetSignPub || eqSign(targetSignPub, id.sign.publicKey)) {
      throw new Error('Ausstehende Kopplung nennt unzulässig das Hauptgerät.');
    }
    const devices = current.devices.filter(
      (device) => !eqSign(device.signPub, targetSignPub as Bytes),
    );
    if (devices.length === current.devices.length) {
      // A concurrent confirmed delivery + revoke may already have produced the
      // newer authority. Remove only the exact stale coordination blocker.
      if (
        !pendingSnapshot ||
        await compareAndSwapRecordsWithDeletes(
          [
            [KEY, snapshot.record],
            [PENDING_LINK_GRANT_KEY, pendingSnapshot],
          ],
          [],
          [PENDING_LINK_GRANT_KEY],
        )
      ) {
        return { newList: current, targetSignPub };
      }
      continue;
    }
    if (devices.length === 0) {
      throw new Error('Kopplungs-Widerruf würde die Geräteliste leeren.');
    }
    const newList = await signDeviceList(
      id.master.privateKey,
      id.master.publicKey,
      id.epoch,
      current.version + 1,
      devices,
    );
    const listRecord = await sealOwnDeviceListRecord(dek, newList);
    const committed = pendingSnapshot
      ? await compareAndSwapRecordsWithDeletes(
          [
            [KEY, snapshot.record],
            [PENDING_LINK_GRANT_KEY, pendingSnapshot],
          ],
          [[KEY, listRecord]],
          [PENDING_LINK_GRANT_KEY],
        )
      : await compareAndSwapRecords(
          [
            [KEY, snapshot.record],
            [PENDING_LINK_GRANT_KEY, undefined],
          ],
          [[KEY, listRecord]],
        );
    if (committed) return { newList, targetSignPub };
  }
  throw new Error('Ausstehende Kopplung wurde gleichzeitig zu oft geändert.');
}

/** Issue and persist a LinkGrant against the latest durable own-list snapshot.
 * A concurrent link/revoke/adopt causes the CAS to miss; the operation then
 * reloads and recomputes so equal-version forks cannot be published.
 */
export async function issueAndSaveLinkGrant(
  dek: CryptoKey,
  id: IdentityKeys,
  request: LinkRequest,
  offer: LinkOffer,
): Promise<{
  grant: LinkGrant;
  newList: DeviceList;
  sealedPayload: Bytes;
  pendingRecord: SealedRecord;
}> {
  if (!isPrimaryDevice(id)) {
    throw new Error('Nur das Hauptgerät kann weitere Geräte koppeln.');
  }
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const [snapshot, pendingSnapshot] = await Promise.all([
      loadSnapshot(dek),
      loadRecord(PENDING_LINK_GRANT_KEY),
    ]);
    if (pendingSnapshot) {
      throw new Error('Ein bestätigter Kopplungs-Nachweis wartet noch auf Relay-Zustellung.');
    }
    const current = snapshot.list;
    if (!current || !(await verifyDeviceList(current, id.master.publicKey, id.epoch))) {
      throw new Error('Aktuelle Geräteliste ungültig — Kopplung abgebrochen.');
    }
    const issued = await createLinkGrant(
      id.master.privateKey,
      id.master.publicKey,
      id.epoch,
      current,
      request,
      offer,
    );
    const sealedPayload = await sealPayload(
      request.deviceDhPub,
      SEALED_LINK_GRANT,
      await encodeLinkGrant(issued.grant),
    );
    const [listRecord, intentRecord] = await Promise.all([
      sealOwnDeviceListRecord(dek, issued.newList),
      sealPendingLinkGrantRecord(dek, {
        recipientSignPub: request.deviceSignPub,
        sealedPayload,
        createdAt: Date.now(),
      }),
    ]);
    // Linearize the authoritative list and its retry payload together. The
    // second precondition serializes linking across tabs and prevents a revoke
    // from racing ahead while an older grant is still awaiting delivery.
    if (
      await compareAndSwapRecords(
        [
          [KEY, snapshot.record],
          [PENDING_LINK_GRANT_KEY, pendingSnapshot],
        ],
        [
          [KEY, listRecord],
          [PENDING_LINK_GRANT_KEY, intentRecord],
        ],
      )
    ) {
      return { ...issued, sealedPayload, pendingRecord: intentRecord };
    }
  }
  throw new Error('Geräteliste wurde gleichzeitig zu oft geändert — Kopplung neu starten.');
}
