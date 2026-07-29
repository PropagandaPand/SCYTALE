/**
 * Encrypted recovery backup (local file export/import).
 *
 * ⚠️ THREAT-MODEL TRADE-OFF: this is the first feature that *reduces* the
 * guarantee device-binding gave — the whole point is a copy of the vault's
 * secrets (incl. the master private key) that leaves the device. It is therefore
 * strictly opt-in, explicit, and gated: the UI re-prompts the vault passphrase
 * immediately before export (an unlocked vault + physical access must not be a
 * one-click exfil), and the file is encrypted under a SEPARATE export passphrase
 * via full Argon2id (the same MIN_ARGON2 floor as the vault — the recovery
 * passphrase never bypasses it). See SECURITY.md.
 *
 * Note: the backup contains the master private key. After a master rotation an
 * old backup still decrypts the OLD master, which can issue device-certs for its
 * epoch to peers that haven't rotated — so old backups must be destroyed on
 * rotation (the rotation flow will say so explicitly).
 */
import {
  deriveKekBytes,
  DEFAULT_ARGON2,
  serializeIdentity,
  deserializeIdentity,
  encodeDeviceList,
  decodeDeviceList,
  signDeviceList,
  verifyDeviceList,
  deviceInList,
  isPrimaryDevice,
  verify,
  getSodium,
  bytesEqual,
  seal,
  open,
  b64encode,
  b64decode,
  utf8,
  type Argon2Params,
  type Bytes,
  type DeviceList,
} from '../crypto';
import { encSection, decSection, backupMetaAad, backupAttAad } from './backupSections';
import { serializeContact, deserializeContact, type GroupInvite } from './session';
import { loadOrCreateIdentity } from './identity';
import {
  loadOrCreatePreKeys,
  serializePreKeys,
  deserializePreKeys,
  ownSpkPublic,
  type PreKeyState,
} from './prekeys';
import { loadContacts } from './store';
import { loadGroups, toInvite, fromInvite, type Group } from './groups';
import { loadProfile, type MyProfile } from './profile';
import { loadStickers, MAX_STICKERS, type Sticker } from './stickers';
import {
  loadMessages,
  allMessageRoomIds,
  loadRecalledMids,
  type ChatMessage,
} from './messages';
import { getAttachmentMeta, allAttachmentIds, type AttachmentMeta } from './attachments';
import { loadRetiredMasters } from './denylist';
import { loadOrCreateOwnDeviceList } from './devices';
import { loadDeviceNames, type DeviceNames } from './devicenames';
import { loadPendingGroupMutationSnapshots } from './groupMutations';
import {
  fromGroupRemovalTombstoneWire,
  groupRemovalTombstoneRecordKey,
  loadGroupRemovalTombstones,
  sealGroupRemovalTombstoneRecord,
  toGroupRemovalTombstoneWire,
  type GroupRemovalTombstoneWire,
} from './groupTombstones';
import {
  loadRecord,
  stageRestoreRecord,
  discardRestoreStage,
  commitRestoreStage,
  beginAccountRestore,
  cancelAccountRestore,
} from './db';

// --- Encryption container -------------------------------------------------
//
// v1 (legacy, still importable): one JSON object {v:1, argon2, salt, iv, ct} with
//   the whole vault base64-encrypted as a single blob. Fine when attachments were
//   inline and ≤600 KB; unusable once attachments are large (one giant encrypt +
//   base64 = OOM).
//
// v2/v3 (legacy binary): a length-prefixed container with one ciphertext per
//   attachment. Import stays conservative because each section needs one full
//   allocation.
//
// v4 (current): the same outer framing, but attachment sections are arrays of
//   independently authenticated, bounded 4 MiB chunks:
//   nothing is ever held as one giant array or base64 string and each section is
//   encrypted on its own:
//     [u32 headerLen][header JSON][meta ciphertext][att0 ciphertext][att1]…
//   header = {v, argon2, salt, meta:{iv,len}, atts:[{id, iv, len}]}. The metadata
//   blob carries the identity/contacts/messages plus a name/mime map for the
//   attachments; each attachment's bytes are a separate section. A v1 file starts
//   with '{' (0x7b); a binary file starts with a 4-byte length whose first byte is 0.
//   v3 differs from v2 only by binding each section to its role via GCM AAD (meta
//   vs att:<id>) so ciphertexts cannot be spliced between roles/ids (audit N-3);
//   v2 metadata-only files still import. v2 attachment sections are refused:
//   without AAD their id-to-ciphertext mapping cannot be authenticated.

interface V1Container {
  v: 1;
  argon2: Argon2Params;
  salt: string;
  iv: string;
  ct: string;
}

async function deriveExportKey(passphrase: string, salt: Bytes, params: Argon2Params): Promise<CryptoKey> {
  // Full Argon2id on the export passphrase; deriveKekBytes clamps to MIN_ARGON2.
  const keyBytes = await deriveKekBytes(passphrase, salt, params);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  keyBytes.fill(0);
  return key;
}

interface LegacyBinaryHeader {
  v: 2 | 3; // v3 = v2 layout + per-section AAD role binding (audit N-3)
  argon2: Argon2Params;
  salt: string;
  meta: { iv: string; len: number };
  atts: { id: string; iv: string; len: number }[];
}

interface V4BinaryHeader {
  v: 4;
  argon2: Argon2Params;
  salt: string;
  meta: { iv: string; len: number };
  atts: { id: string; chunks: { iv: string; len: number }[] }[];
}

type BinaryHeader = LegacyBinaryHeader | V4BinaryHeader;

const BACKUP_CHUNK = 4 * 1024 * 1024;
const STORE_CHUNK = 256 * 1024;
const MAX_HEADER = 1024 * 1024;
const MAX_META_CT = 64 * 1024 * 1024;
const MAX_LEGACY_FILE = 64 * 1024 * 1024;
const MAX_LEGACY_SECTION = 64 * 1024 * 1024;
const MAX_ATTACHMENT = 1024 * 1024 * 1024;
const MAX_TOTAL_FILE = 8 * 1024 * 1024 * 1024;
const MAX_ATTACHMENTS = 4096;
const MAX_RECORDS_PER_KIND = 10_000;
const MAX_MESSAGES_PER_ROOM = 250_000;
const MAX_ID = 128;
const GCM_TAG = 16;

interface AttachmentManifest {
  name: string;
  mime: string;
  /** Required by v4; absent in legacy v2/v3 metadata. */
  size?: number;
  /** Number of bounded backup chunks, required by v4. */
  chunks?: number;
}

// --- Full-state gather / restore -------------------------------------------

interface BackupBlob {
  v: 1;
  createdAt: number;
  identity: string; // b64 serializeIdentity (incl. master private key)
  prekeys: string; // b64 serializePreKeys
  deviceList?: string; // b64 encodeDeviceList; optional only for legacy backups
  deviceNames?: DeviceNames;
  profile: MyProfile;
  contacts: string[]; // b64 serializeContact each (incl. ratchet state)
  groups: GroupInvite[];
  /** Monotonic barriers that prevent a removed group from being resurrected. */
  groupTombstones?: GroupRemovalTombstoneWire[];
  messages: Record<string, ChatMessage[]>;
  stickers?: Sticker[]; // optional: backups written before stickers existed
  // The GLOBAL retired-master denylist (base64 master pubs). MUST travel with the
  // backup: it is the only post-migration store of retirements (per-contact
  // retiredMasters are drained into it at boot), and a restore without it lands in
  // a fresh vault with an EMPTY denylist — re-opening the abandoned-key downgrade
  // the denylist exists to stop (a retired/compromised master would be accepted
  // again). Optional: backups written before this field carry none. See
  // Devil's-Advocate DA-3.
  retiredMasters?: string[];
  recalledMids?: string[];
  // Name/mime for each attachment whose bytes travel as their own section in a v2
  // file (the bytes are NOT in this blob). Absent in v1 backups.
  attMeta?: Record<string, AttachmentManifest>;
}

async function gather(dek: CryptoKey, attMeta: Record<string, AttachmentManifest>): Promise<Bytes> {
  const id = await loadOrCreateIdentity(dek);
  const pre = await loadOrCreatePreKeys(dek, id);
  let deviceList = await loadOrCreateOwnDeviceList(dek, id, ownSpkPublic(pre));
  if (!deviceList) throw new Error('Geräteliste fehlt — vollständiges Backup nicht möglich.');
  const currentSpk = ownSpkPublic(pre);
  const listedSelf = deviceList.devices.find((d) => bytesEqual(d.signPub, id.sign.publicKey));
  const spkCurrent =
    !!listedSelf?.signedPreKey &&
    listedSelf.signedPreKey.id === currentSpk.id &&
    bytesEqual(listedSelf.signedPreKey.pub, currentSpk.pub) &&
    bytesEqual(listedSelf.signedPreKey.signature, currentSpk.signature);
  if (!spkCurrent) {
    if (!isPrimaryDevice(id)) {
      throw new Error('Geräteliste und aktuelle Prekeys sind nicht sicher gemeinsam exportierbar.');
    }
    deviceList = await signDeviceList(
      id.master.privateKey,
      id.master.publicKey,
      id.epoch,
      deviceList.version + 1,
      deviceList.devices.map((d) =>
        bytesEqual(d.signPub, id.sign.publicKey) ? { ...d, signedPreKey: currentSpk } : d,
      ),
    );
  }
  const contacts = await loadContacts(dek);
  const groups = await loadGroups(dek);
  const messages: Record<string, ChatMessage[]> = {};
  const messageRoomIds = new Set<string>([
    ...contacts.map((contact) => contact.roomId),
    ...groups.map((group) => group.id),
    ...(await allMessageRoomIds()),
  ]);
  for (const roomId of messageRoomIds) messages[roomId] = await loadMessages(dek, roomId);
  const blob: BackupBlob = {
    v: 1,
    createdAt: Date.now(),
    identity: await b64encode(await serializeIdentity(id)),
    prekeys: await b64encode(await serializePreKeys(pre)),
    deviceList: await b64encode(await encodeDeviceList(deviceList)),
    deviceNames: await loadDeviceNames(dek),
    profile: await loadProfile(dek),
    contacts: await Promise.all(contacts.map(async (c) => b64encode(await serializeContact(c)))),
    groups: await Promise.all(groups.map((g) => toInvite(g))),
    groupTombstones: await Promise.all(
      (await loadGroupRemovalTombstones(dek)).map((snapshot) =>
        toGroupRemovalTombstoneWire(snapshot.tombstone),
      ),
    ),
    messages,
    stickers: await loadStickers(dek),
    retiredMasters: [...(await loadRetiredMasters(dek))],
    recalledMids: await loadRecalledMids(dek),
    attMeta,
  };
  return utf8.encode(JSON.stringify(blob));
}

const aad = {
  identity: utf8.encode('scytale:identity:v1'),
  prekeys: utf8.encode('scytale:prekeys:v1'),
  devices: utf8.encode('scytale:devicelist:v1'),
  deviceNames: utf8.encode('scytale:devicenames:v1'),
  profile: utf8.encode('scytale:profile:v1'),
  contacts: utf8.encode('scytale:contact-index:v1'),
  contact: (id: string) => utf8.encode(`scytale:contact:v1:${id}`),
  groups: utf8.encode('scytale:group-index:v1'),
  group: (id: string) => utf8.encode(`scytale:group:v1:${id}`),
  roomKey: (id: string) => utf8.encode(`scytale:room-key:v1:${id}`),
  messages: (id: string) => utf8.encode(`scytale:messages:v1:${id}`),
  stickers: utf8.encode('scytale:stickers:v1'),
  retired: utf8.encode('scytale:retired-masters:v1'),
  recalled: utf8.encode('scytale:recalled-mids:v1'),
  attKey: (id: string) => utf8.encode(`scytale:att-key:v1:${id}`),
  attChunk: (id: string, i: number) => utf8.encode(`scytale:att:v1:${id}:${i}`),
  attMeta: (id: string) => utf8.encode(`scytale:att-meta:v1:${id}`),
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function validId(id: unknown, what: string): asserts id is string {
  if (typeof id !== 'string' || id.length < 1 || id.length > MAX_ID || id.includes(':')) {
    throw new Error(`Ungültige ${what}-ID im Backup.`);
  }
}

function boundedArray(v: unknown, what: string, max = MAX_RECORDS_PER_KIND): asserts v is unknown[] {
  if (!Array.isArray(v) || v.length > max) throw new Error(`Ungültige oder zu große ${what}-Liste im Backup.`);
}

async function validatePreKeys(pre: PreKeyState, identitySignPub: Bytes): Promise<void> {
  boundedArray(pre.oneTimePreKeys, 'One-Time-Prekey');
  const opkIds = new Set<number>();
  if (
    !Number.isSafeInteger(pre.nextSpkId) ||
    !Number.isSafeInteger(pre.nextOpkId) ||
    !Number.isSafeInteger(pre.signedPreKey.id) ||
    !Number.isFinite(pre.signedPreKey.createdAt) ||
    pre.signedPreKey.keyPair.publicKey.length !== 32 ||
    pre.signedPreKey.keyPair.privateKey.length !== 32 ||
    pre.signedPreKey.signature.length !== 64 ||
    pre.oneTimePreKeys.some((p) => {
      if (
        !Number.isSafeInteger(p.id) ||
        opkIds.has(p.id) ||
        p.keyPair.publicKey.length !== 32 ||
        p.keyPair.privateKey.length !== 32
      ) {
        return true;
      }
      opkIds.add(p.id);
      return false;
    })
  ) {
    throw new Error('Ungültiger Prekey-Zustand im Backup.');
  }
  const maxOpkId = pre.oneTimePreKeys.reduce((max, p) => Math.max(max, p.id), 0);
  if (pre.nextSpkId <= pre.signedPreKey.id || pre.nextOpkId <= maxOpkId) {
    throw new Error('Prekey-Zähler würden Schlüssel-IDs wiederverwenden.');
  }
  const sodium = await getSodium();
  if (
    !bytesEqual(
      new Uint8Array(sodium.crypto_scalarmult_base(pre.signedPreKey.keyPair.privateKey)),
      pre.signedPreKey.keyPair.publicKey,
    ) ||
    pre.oneTimePreKeys.some(
      (p) =>
        !bytesEqual(
          new Uint8Array(sodium.crypto_scalarmult_base(p.keyPair.privateKey)),
          p.keyPair.publicKey,
        ),
    )
  ) {
    throw new Error('Prekey-Keypair ist inkohärent.');
  }
  if (!(await verify(pre.signedPreKey.keyPair.publicKey, pre.signedPreKey.signature, identitySignPub))) {
    throw new Error('Prekeys gehören nicht zur Backup-Identität.');
  }
}

async function putStaged(
  stageId: string,
  key: string,
  encryptionKey: CryptoKey,
  plain: Bytes,
  additionalData: Bytes,
): Promise<void> {
  await stageRestoreRecord(stageId, key, await seal(encryptionKey, plain, additionalData));
}

/**
 * Validate and stage every non-attachment record. Staging is deliberately
 * invisible: no live account state changes until commitRestoreStage().
 */
async function stageMetadata(dek: CryptoKey, stageId: string, blob: BackupBlob): Promise<void> {
  if (!isObject(blob) || blob.v !== 1 || !Number.isFinite(blob.createdAt)) {
    throw new Error('Unbekanntes oder beschädigtes Backup-Format.');
  }
  boundedArray(blob.contacts, 'Kontakt');
  boundedArray(blob.groups, 'Gruppen');
  const tombstoneWires = blob.groupTombstones ?? [];
  boundedArray(tombstoneWires, 'Gruppen-Tombstone');
  if (!isObject(blob.messages) || Object.keys(blob.messages).length > MAX_RECORDS_PER_KIND) {
    throw new Error('Ungültiger oder zu großer Nachrichtenindex im Backup.');
  }

  const identity = await deserializeIdentity(await b64decode(blob.identity));
  const prekeys = await deserializePreKeys(await b64decode(blob.prekeys));
  await validatePreKeys(prekeys, identity.sign.publicKey);

  let deviceList: DeviceList;
  if (blob.deviceList) {
    deviceList = await decodeDeviceList(await b64decode(blob.deviceList));
  } else {
    // Absence cannot prove that the snapshot predates multi-device use. Minting
    // version 1 would silently forget linked devices and be rejected as rollback
    // by peers while those old devices remain authorised there.
    throw new Error('Legacy-Backup ohne authentifizierte Geräteliste kann nicht sicher wiederhergestellt werden.');
  }
  if (
    !(await verifyDeviceList(deviceList, identity.master.publicKey, identity.epoch)) ||
    !deviceInList(deviceList, identity.sign.publicKey)
  ) {
    throw new Error('Geräteliste gehört nicht zur Backup-Identität.');
  }
  boundedArray(deviceList.devices, 'Geräte', 1000);
  const ownEntry = deviceList.devices.find((d) => bytesEqual(d.signPub, identity.sign.publicKey));
  const ownSpk = ownSpkPublic(prekeys);
  if (
    !ownEntry?.signedPreKey ||
    ownEntry.signedPreKey.id !== ownSpk.id ||
    !bytesEqual(ownEntry.signedPreKey.pub, ownSpk.pub) ||
    !bytesEqual(ownEntry.signedPreKey.signature, ownSpk.signature)
  ) {
    throw new Error('Geräteliste und Backup-Prekeys sind inkonsistent.');
  }

  const deviceNames = blob.deviceNames ?? {};
  if (!isObject(deviceNames) || Object.keys(deviceNames).length > 1000) {
    throw new Error('Ungültige Gerätenamen im Backup.');
  }
  for (const [device, name] of Object.entries(deviceNames)) {
    if (
      typeof name !== 'string' ||
      name.length > 40 ||
      device.length > 128 ||
      (await b64decode(device)).length !== 32
    ) {
      throw new Error('Ungültiger Gerätename im Backup.');
    }
  }

  if (!isObject(blob.profile)) throw new Error('Ungültiges Profil im Backup.');
  if (
    (blob.profile.name !== undefined && typeof blob.profile.name !== 'string') ||
    (blob.profile.avatarB64 !== undefined && typeof blob.profile.avatarB64 !== 'string')
  ) {
    throw new Error('Ungültiges Profil im Backup.');
  }

  const contacts = [];
  const roomIds = new Set<string>();
  for (const encoded of blob.contacts) {
    if (typeof encoded !== 'string') throw new Error('Ungültiger Kontakt im Backup.');
    const contact = await deserializeContact(await b64decode(encoded));
    validId(contact.roomId, 'Kontakt');
    if (
      roomIds.has(contact.roomId) ||
      contact.peerMasterPub.length !== 32 ||
      contact.peerSignPub.length !== 32 ||
      contact.peerDhPub.length !== 32
    ) {
      throw new Error('Inkonsistenter Kontakt im Backup.');
    }
    roomIds.add(contact.roomId);
    // A restored snapshot cannot know whether an advertised one-time prekey was
    // consumed after capture. Dropping it safely falls back to signed-prekey X3DH.
    if (contact.bundle?.oneTimePreKey) contact.bundle = { ...contact.bundle, oneTimePreKey: undefined };
    contacts.push(contact);
  }

  const groups: Group[] = [];
  for (const invite of blob.groups) {
    if (!isObject(invite)) throw new Error('Ungültige Gruppe im Backup.');
    const group = await fromInvite(invite as unknown as GroupInvite);
    validId(group.id, 'Gruppen');
    if (roomIds.has(group.id)) throw new Error('Doppelte Raum-ID im Backup.');
    boundedArray(group.members, 'Gruppenmitglieder');
    roomIds.add(group.id);
    groups.push(group);
  }

  const groupTombstones = [];
  const tombstoneIds = new Set<string>();
  for (const encoded of tombstoneWires) {
    if (!isObject(encoded)) {
      throw new Error('Ungültiger Gruppen-Tombstone im Backup.');
    }
    const tombstone = await fromGroupRemovalTombstoneWire(
      encoded as unknown as GroupRemovalTombstoneWire,
    );
    if (tombstoneIds.has(tombstone.groupId) || roomIds.has(tombstone.groupId)) {
      throw new Error('Inkonsistenter Gruppen-Tombstone im Backup.');
    }
    tombstoneIds.add(tombstone.groupId);
    groupTombstones.push(tombstone);
  }

  for (const [roomId, messages] of Object.entries(blob.messages)) {
    validId(roomId, 'Nachrichtenraum');
    boundedArray(messages, 'Nachrichten', MAX_MESSAGES_PER_ROOM);
  }

  const stickers = blob.stickers ?? [];
  boundedArray(stickers, 'Sticker', MAX_STICKERS);
  const recalled = blob.recalledMids ?? [];
  boundedArray(recalled, 'Recall');
  if (recalled.some((mid) => typeof mid !== 'string' || mid.length > MAX_ID)) {
    throw new Error('Ungültige Recall-ID im Backup.');
  }

  // The denylist is the one explicitly mergeable set: importing an old account
  // snapshot must never un-retire a master already rejected by this device.
  const retired = await loadRetiredMasters(dek);
  const importedRetired = blob.retiredMasters ?? [];
  boundedArray(importedRetired, 'Retired-Master');
  for (const master of importedRetired) {
    if (typeof master !== 'string' || master.length > 128 || (await b64decode(master)).length !== 32) {
      throw new Error('Ungültiger retired-master-Eintrag im Backup.');
    }
    retired.add(master);
  }

  await putStaged(stageId, 'identity', dek, await serializeIdentity(identity), aad.identity);
  await putStaged(stageId, 'prekeys', dek, await serializePreKeys(prekeys), aad.prekeys);
  await putStaged(stageId, 'devicelist', dek, await encodeDeviceList(deviceList), aad.devices);
  await putStaged(
    stageId,
    'devicenames',
    dek,
    utf8.encode(JSON.stringify(deviceNames)),
    aad.deviceNames,
  );
  await putStaged(stageId, 'profile', dek, utf8.encode(JSON.stringify(blob.profile)), aad.profile);

  for (const contact of contacts) {
    await putStaged(
      stageId,
      `contact:${contact.roomId}`,
      dek,
      await serializeContact(contact),
      aad.contact(contact.roomId),
    );
  }
  await putStaged(
    stageId,
    'contact-index',
    dek,
    utf8.encode(JSON.stringify(contacts.map((c) => c.roomId))),
    aad.contacts,
  );

  for (const group of groups) {
    await putStaged(
      stageId,
      `group:${group.id}`,
      dek,
      utf8.encode(JSON.stringify(await toInvite(group))),
      aad.group(group.id),
    );
  }
  await putStaged(
    stageId,
    'group-index',
    dek,
    utf8.encode(JSON.stringify(groups.map((g) => g.id))),
    aad.groups,
  );
  for (const tombstone of groupTombstones) {
    await stageRestoreRecord(
      stageId,
      groupRemovalTombstoneRecordKey(tombstone.groupId),
      await sealGroupRemovalTombstoneRecord(dek, tombstone),
    );
  }

  for (const [roomId, messages] of Object.entries(blob.messages)) {
    const raw = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
    const roomKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    await putStaged(stageId, `roomkey:${roomId}`, dek, raw, aad.roomKey(roomId));
    await putStaged(
      stageId,
      `msgs:${roomId}`,
      roomKey,
      utf8.encode(JSON.stringify(messages)),
      aad.messages(roomId),
    );
    raw.fill(0);
  }

  await putStaged(stageId, 'stickers', dek, utf8.encode(JSON.stringify(stickers)), aad.stickers);
  await putStaged(stageId, 'retired-masters', dek, utf8.encode(JSON.stringify([...retired])), aad.retired);
  await putStaged(stageId, 'recalled-mids', dek, utf8.encode(JSON.stringify(recalled)), aad.recalled);
}

// --- Public API ------------------------------------------------------------

const CORRUPT = 'Beschädigtes Backup — die Datei ist unvollständig oder kein SKYTALE-Backup.';
const WRONG_PASS = 'Falsche Export-Passphrase oder beschädigtes Backup.';

async function sliceBytes(file: Blob, start: number, end: number): Promise<Bytes> {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > file.size) {
    throw new Error(CORRUPT);
  }
  const bytes = new Uint8Array(await file.slice(start, end).arrayBuffer());
  if (bytes.length !== end - start) throw new Error(CORRUPT);
  return bytes;
}

const v4MetaAad = (): Bytes => utf8.encode('scytale:backup:v4:meta');
const v4AttAad = (id: string, index: number, chunks: number, size: number): Bytes =>
  utf8.encode(`scytale:backup:v4:att:${id}:${index}:${chunks}:${size}`);

function assertInt(v: unknown, min: number, max: number, what: string): asserts v is number {
  if (!Number.isSafeInteger(v) || (v as number) < min || (v as number) > max) {
    throw new Error(`Ungültige ${what} im Backup.`);
  }
}

function validateArgon2(v: unknown): asserts v is Argon2Params {
  if (!isObject(v)) throw new Error(CORRUPT);
  // Floors are still enforced by deriveKekBytes. These ceilings prevent a
  // hostile unauthenticated header from selecting an excessive KDF.
  assertInt(v.memorySize, 1, DEFAULT_ARGON2.memorySize, 'Argon2-Speichergröße');
  assertInt(v.iterations, 1, 6, 'Argon2-Iterationszahl');
  assertInt(v.parallelism, 1, 2, 'Argon2-Parallelität');
}

async function fixedB64(v: unknown, len: number, what: string): Promise<Bytes> {
  if (typeof v !== 'string' || v.length > 128) throw new Error(`Ungültige ${what} im Backup.`);
  let bytes: Bytes;
  try {
    bytes = await b64decode(v);
  } catch {
    throw new Error(`Ungültige ${what} im Backup.`);
  }
  if (bytes.length !== len) throw new Error(`Ungültige ${what} im Backup.`);
  return bytes;
}

function advance(off: number, len: unknown, fileSize: number, max: number): number {
  assertInt(len, GCM_TAG, max, 'Sektionslänge');
  if ((len as number) > fileSize - off) throw new Error(CORRUPT);
  return off + (len as number);
}

async function validateBinaryHeader(header: BinaryHeader, bodyStart: number, fileSize: number): Promise<void> {
  if (!isObject(header) || (header.v !== 2 && header.v !== 3 && header.v !== 4)) {
    throw new Error('Unbekanntes Backup-Format.');
  }
  validateArgon2(header.argon2);
  await fixedB64(header.salt, 16, 'Backup-Salt');
  if (!isObject(header.meta)) throw new Error(CORRUPT);
  await fixedB64(header.meta.iv, 12, 'Meta-IV');
  let off = advance(bodyStart, header.meta.len, fileSize, MAX_META_CT);
  boundedArray(header.atts, 'Attachment-Header', MAX_ATTACHMENTS);
  if (header.v === 2 && header.atts.length > 0) {
    throw new Error('Legacy-v2-Backups mit Attachments sind kryptografisch nicht sicher zuordenbar.');
  }
  const ids = new Set<string>();
  for (const attachment of header.atts) {
    if (!isObject(attachment)) throw new Error(CORRUPT);
    validId(attachment.id, 'Attachment');
    if (ids.has(attachment.id)) throw new Error('Doppelte Attachment-ID im Backup.');
    ids.add(attachment.id);
    if (header.v === 4) {
      const chunks = (attachment as V4BinaryHeader['atts'][number]).chunks;
      boundedArray(chunks, 'Attachment-Chunk', Math.ceil(MAX_ATTACHMENT / BACKUP_CHUNK));
      if (chunks.length < 1) throw new Error('Attachment ohne Chunks im Backup.');
      for (const chunk of chunks) {
        if (!isObject(chunk)) throw new Error(CORRUPT);
        await fixedB64(chunk.iv, 12, 'Attachment-IV');
        off = advance(off, chunk.len, fileSize, BACKUP_CHUNK + GCM_TAG);
      }
    } else {
      const legacy = attachment as LegacyBinaryHeader['atts'][number];
      await fixedB64(legacy.iv, 12, 'Attachment-IV');
      off = advance(off, legacy.len, fileSize, MAX_LEGACY_SECTION + GCM_TAG);
    }
  }
  // Exact consumption is part of the format. Truncation and trailing data both
  // fail before Argon2 or any section allocation.
  if (off !== fileSize) throw new Error(CORRUPT);
}

/**
 * Compare the authenticated metadata manifest with the untrusted binary header.
 * For v4, size/chunk count and every expected ciphertext length are fixed by the
 * encrypted metadata, making omission/truncation detectable.
 */
export function validateBackupManifest(blob: BackupBlob, header: BinaryHeader): void {
  const meta = blob.attMeta ?? {};
  if (!isObject(meta)) throw new Error('Ungültiges Attachment-Manifest im Backup.');
  const metaIds = Object.keys(meta);
  if (metaIds.length !== header.atts.length) throw new Error('Unvollständiges Attachment-Manifest im Backup.');
  const byId = new Map(header.atts.map((a) => [a.id, a]));
  for (const id of metaIds) {
    validId(id, 'Attachment');
    const manifest = Object.prototype.hasOwnProperty.call(meta, id) ? meta[id] : undefined;
    const entry = byId.get(id);
    if (!isObject(manifest) || !entry || typeof manifest.name !== 'string' || typeof manifest.mime !== 'string') {
      throw new Error('Unvollständiges Attachment-Manifest im Backup.');
    }
    if (manifest.name.length > 4096 || manifest.mime.length > 1024) {
      throw new Error('Attachment-Metadaten sind zu groß.');
    }
    if (header.v === 4) {
      assertInt(manifest.size, 0, MAX_ATTACHMENT, 'Attachment-Größe');
      const expectedChunks = Math.max(1, Math.ceil((manifest.size as number) / BACKUP_CHUNK));
      if (manifest.chunks !== expectedChunks || !('chunks' in entry) || entry.chunks.length !== expectedChunks) {
        throw new Error('Unvollständiges Attachment-Manifest im Backup.');
      }
      for (let i = 0; i < entry.chunks.length; i++) {
        const remaining = (manifest.size as number) - i * BACKUP_CHUNK;
        const plainLen = Math.max(0, Math.min(BACKUP_CHUNK, remaining));
        if (entry.chunks[i].len !== plainLen + GCM_TAG) {
          throw new Error('Attachment-Chunklänge stimmt nicht mit dem Manifest überein.');
        }
      }
    }
  }
}

async function sourceAttachmentKey(dek: CryptoKey, id: string): Promise<CryptoKey> {
  const rec = await loadRecord(`att:${id}:key`);
  if (!rec) return dek; // legacy attachment, sealed directly under the DEK
  const raw = await open(dek, rec, aad.attKey(id));
  if (raw.length !== 32) throw new Error('Attachment-Schlüssel beschädigt.');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function exportAttachment(
  dek: CryptoKey,
  exportKey: CryptoKey,
  id: string,
  source: AttachmentMeta,
  manifest: Required<Pick<AttachmentManifest, 'size' | 'chunks'>>,
  bodyParts: BlobPart[],
): Promise<V4BinaryHeader['atts'][number]> {
  const sourceKey = await sourceAttachmentKey(dek, id);
  const chunks: V4BinaryHeader['atts'][number]['chunks'] = [];
  let buffer = new Uint8Array(BACKUP_CHUNK);
  let used = 0;
  let total = 0;

  const flush = async (): Promise<void> => {
    const index = chunks.length;
    const plain = buffer.slice(0, used);
    const sec = await encSection(exportKey, plain, v4AttAad(id, index, manifest.chunks, manifest.size));
    chunks.push({ iv: await b64encode(sec.iv), len: sec.ct.length });
    bodyParts.push(new Blob([sec.ct]));
    buffer = new Uint8Array(BACKUP_CHUNK);
    used = 0;
  };

  for (let i = 0; i < source.chunks; i++) {
    const rec = await loadRecord(`att:${id}:${i}`);
    if (!rec) throw new Error(`Attachment ${id} ist unvollständig.`);
    const plain = await open(sourceKey, rec, aad.attChunk(id, i));
    total += plain.length;
    if (total > manifest.size) throw new Error(`Attachment ${id} ist größer als seine Metadaten.`);
    let pos = 0;
    while (pos < plain.length) {
      const n = Math.min(buffer.length - used, plain.length - pos);
      buffer.set(plain.subarray(pos, pos + n), used);
      used += n;
      pos += n;
      if (used === buffer.length) await flush();
    }
  }
  if (total !== manifest.size) throw new Error(`Attachment ${id} ist unvollständig.`);
  if (used > 0 || chunks.length === 0) await flush();
  if (chunks.length !== manifest.chunks) throw new Error(`Attachment ${id} hat eine inkonsistente Chunkzahl.`);
  return { id, chunks };
}

/**
 * Produce a v4 backup. Attachments are read and encrypted in bounded 4 MiB
 * chunks; the encrypted metadata carries their complete size/chunk manifest.
 */
export async function exportBackup(dek: CryptoKey, exportPassphrase: string): Promise<Blob> {
  if ((await loadPendingGroupMutationSnapshots(dek)).length > 0) {
    throw new Error(
      'Eine Gruppenänderung wartet noch auf bestätigte Zustellung. Backup danach erneut starten.',
    );
  }
  const source = new Map<string, AttachmentMeta>();
  const attMeta: Record<string, AttachmentManifest> = Object.create(null) as Record<string, AttachmentManifest>;
  let totalPlain = 0;
  const ids = await allAttachmentIds();
  if (ids.length > MAX_ATTACHMENTS) throw new Error('Zu viele Attachments für ein Backup.');
  for (const id of ids) {
    validId(id, 'Attachment');
    const meta = await getAttachmentMeta(dek, id);
    if (!meta) continue; // incomplete/orphaned local data is not a readable attachment
    assertInt(meta.size, 0, MAX_ATTACHMENT, 'Attachment-Größe');
    assertInt(meta.chunks, 1, Math.ceil(MAX_ATTACHMENT / STORE_CHUNK), 'Attachment-Chunkzahl');
    totalPlain += meta.size;
    if (!Number.isSafeInteger(totalPlain) || totalPlain > MAX_TOTAL_FILE) {
      throw new Error('Backup überschreitet die maximale Gesamtgröße.');
    }
    const chunks = Math.max(1, Math.ceil(meta.size / BACKUP_CHUNK));
    attMeta[id] = { name: meta.name, mime: meta.mime, size: meta.size, chunks };
    source.set(id, meta);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveExportKey(exportPassphrase, salt, DEFAULT_ARGON2);
  const metaPlain = await gather(dek, attMeta);
  if ((await loadPendingGroupMutationSnapshots(dek)).length > 0) {
    throw new Error(
      'Während des Backups wurde eine Gruppenänderung gestartet. Backup danach erneut starten.',
    );
  }
  if (metaPlain.length + GCM_TAG > MAX_META_CT) throw new Error('Backup-Metadaten sind zu groß.');
  const metaSec = await encSection(key, metaPlain, v4MetaAad());
  const bodyParts: BlobPart[] = [new Blob([metaSec.ct])];
  const atts: V4BinaryHeader['atts'] = [];
  for (const [id, meta] of source) {
    const manifest = attMeta[id] as Required<Pick<AttachmentManifest, 'size' | 'chunks'>>;
    atts.push(await exportAttachment(dek, key, id, meta, manifest, bodyParts));
  }

  const header: V4BinaryHeader = {
    v: 4,
    argon2: DEFAULT_ARGON2,
    salt: await b64encode(salt),
    meta: { iv: await b64encode(metaSec.iv), len: metaSec.ct.length },
    atts,
  };
  validateBackupManifest(JSON.parse(utf8.decode(metaPlain)) as BackupBlob, header);
  const headerBytes = utf8.encode(JSON.stringify(header));
  if (headerBytes.length > MAX_HEADER) throw new Error('Backup-Header ist zu groß.');
  const prefix = new Uint8Array(4);
  new DataView(prefix.buffer).setUint32(0, headerBytes.length);
  const out = new Blob([prefix, headerBytes, ...bodyParts], { type: 'application/octet-stream' });
  if (out.size > MAX_TOTAL_FILE) throw new Error('Backup überschreitet die maximale Gesamtgröße.');
  return out;
}

async function stageAttachmentPieces(
  dek: CryptoKey,
  stageId: string,
  id: string,
  manifest: AttachmentManifest,
  pieces: AsyncIterable<Bytes>,
): Promise<void> {
  validId(id, 'Attachment');
  const expected = manifest.size;
  if (expected !== undefined) assertInt(expected, 0, MAX_ATTACHMENT, 'Attachment-Größe');
  const raw = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  await putStaged(stageId, `att:${id}:key`, dek, raw, aad.attKey(id));
  raw.fill(0);
  let total = 0;
  let index = 0;
  for await (const piece of pieces) {
    total += piece.length;
    if (total > (expected ?? MAX_LEGACY_SECTION)) throw new Error('Attachment überschreitet seine deklarierte Größe.');
    for (let off = 0; off < piece.length; off += STORE_CHUNK) {
      await putStaged(
        stageId,
        `att:${id}:${index}`,
        key,
        piece.slice(off, off + STORE_CHUNK),
        aad.attChunk(id, index),
      );
      index++;
    }
  }
  if (expected !== undefined && total !== expected) throw new Error('Attachment ist unvollständig.');
  if (index === 0) {
    await putStaged(stageId, `att:${id}:0`, key, new Uint8Array(0), aad.attChunk(id, 0));
    index = 1;
  }
  const stored: AttachmentMeta = {
    name: manifest.name,
    mime: manifest.mime,
    size: total,
    chunks: index,
  };
  await putStaged(stageId, `att:${id}:meta`, key, utf8.encode(JSON.stringify(stored)), aad.attMeta(id));
}

function newStageId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function commitStagedRestore(
  dek: CryptoKey,
  blob: BackupBlob,
  attachments: (stageId: string) => Promise<void>,
): Promise<void> {
  const stageId = newStageId();
  await beginAccountRestore();
  let committed = false;
  try {
    await stageMetadata(dek, stageId, blob);
    await attachments(stageId);
    await commitRestoreStage(stageId);
    committed = true;
  } catch (error) {
    await discardRestoreStage(stageId).catch(() => undefined);
    throw error;
  } finally {
    // A successful replacement stays write-locked until BackupModal reloads.
    // On failure, no generation changed and ordinary app writes may resume.
    if (!committed) await cancelAccountRestore();
  }
}

function parseMeta(bytes: Bytes): BackupBlob {
  try {
    return JSON.parse(utf8.decode(bytes)) as BackupBlob;
  } catch {
    throw new Error(CORRUPT);
  }
}

/**
 * Restore by staging a complete replacement generation. Any parse, AEAD,
 * semantic, quota, or attachment error happens before the atomic commit.
 */
export async function importBackup(dek: CryptoKey, exportPassphrase: string, file: Blob): Promise<number> {
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_TOTAL_FILE) throw new Error(CORRUPT);
  const head = await sliceBytes(file, 0, Math.min(4, file.size));

  // Legacy v1 is deliberately capped because it requires one whole-file JSON
  // allocation and one whole ciphertext allocation.
  if (head[0] === 0x7b) {
    if (file.size > MAX_LEGACY_FILE) throw new Error('Legacy-Backup ist zu groß.');
    let container: V1Container;
    try {
      container = JSON.parse(utf8.decode(await sliceBytes(file, 0, file.size))) as V1Container;
    } catch {
      throw new Error(CORRUPT);
    }
    if (!isObject(container) || container.v !== 1) throw new Error('Unbekanntes Backup-Format.');
    validateArgon2(container.argon2);
    const salt = await fixedB64(container.salt, 16, 'Backup-Salt');
    const iv = await fixedB64(container.iv, 12, 'Meta-IV');
    if (typeof container.ct !== 'string' || container.ct.length > Math.ceil((MAX_LEGACY_FILE * 4) / 3) + 8) {
      throw new Error('Legacy-Backup ist zu groß.');
    }
    const ct = await b64decode(container.ct);
    if (ct.length < GCM_TAG || ct.length > MAX_LEGACY_FILE) throw new Error(CORRUPT);
    const key = await deriveExportKey(exportPassphrase, salt, container.argon2);
    let plain: Bytes;
    try {
      plain = await decSection(key, iv, ct);
    } catch {
      throw new Error(WRONG_PASS);
    }
    const blob = parseMeta(plain);
    await commitStagedRestore(dek, blob, async () => undefined);
    return 0;
  }

  if (head.length !== 4) throw new Error(CORRUPT);
  const headerLen = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(0);
  assertInt(headerLen, 2, MAX_HEADER, 'Headerlänge');
  if (headerLen > file.size - 4) throw new Error(CORRUPT);
  let header: BinaryHeader;
  try {
    header = JSON.parse(utf8.decode(await sliceBytes(file, 4, 4 + headerLen))) as BinaryHeader;
  } catch {
    throw new Error(CORRUPT);
  }
  const bodyStart = 4 + headerLen;
  await validateBinaryHeader(header, bodyStart, file.size);

  const salt = await fixedB64(header.salt, 16, 'Backup-Salt');
  const metaIv = await fixedB64(header.meta.iv, 12, 'Meta-IV');
  const key = await deriveExportKey(exportPassphrase, salt, header.argon2);
  let off = bodyStart;
  const metaCt = await sliceBytes(file, off, off + header.meta.len);
  off += header.meta.len;
  let metaPlain: Bytes;
  try {
    const metaAad = header.v === 4 ? v4MetaAad() : header.v === 3 ? backupMetaAad() : undefined;
    metaPlain = await decSection(key, metaIv, metaCt, metaAad);
  } catch {
    throw new Error(WRONG_PASS);
  }
  const blob = parseMeta(metaPlain);
  validateBackupManifest(blob, header);

  await commitStagedRestore(dek, blob, async (stageId) => {
    for (const attachment of header.atts) {
      const manifest =
        blob.attMeta && Object.prototype.hasOwnProperty.call(blob.attMeta, attachment.id)
          ? blob.attMeta[attachment.id]
          : undefined;
      if (!manifest) throw new Error('Attachment fehlt im authentifizierten Manifest.');
      if (header.v === 4) {
        const entry = attachment as V4BinaryHeader['atts'][number];
        const pieces = (async function* (): AsyncGenerator<Bytes> {
          for (let i = 0; i < entry.chunks.length; i++) {
            const chunk = entry.chunks[i];
            const start = off;
            off += chunk.len;
            try {
              yield await decSection(
                key,
                await fixedB64(chunk.iv, 12, 'Attachment-IV'),
                await sliceBytes(file, start, off),
                v4AttAad(entry.id, i, entry.chunks.length, manifest.size as number),
              );
            } catch {
              throw new Error(CORRUPT);
            }
          }
        })();
        await stageAttachmentPieces(dek, stageId, entry.id, manifest, pieces);
      } else {
        const entry = attachment as LegacyBinaryHeader['atts'][number];
        const start = off;
        off += entry.len;
        const pieces = (async function* (): AsyncGenerator<Bytes> {
          try {
            yield await decSection(
              key,
              await fixedB64(entry.iv, 12, 'Attachment-IV'),
              await sliceBytes(file, start, off),
              header.v === 3 ? backupAttAad(entry.id) : undefined,
            );
          } catch {
            throw new Error(CORRUPT);
          }
        })();
        await stageAttachmentPieces(dek, stageId, entry.id, manifest, pieces);
      }
    }
    if (off !== file.size) throw new Error(CORRUPT);
  });
  return 0;
}
