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
  b64encode,
  b64decode,
  utf8,
  type Argon2Params,
  type Bytes,
} from '../crypto';
import { encSection, decSection, backupMetaAad, backupAttAad } from './backupSections';
import { serializeContact, deserializeContact, type GroupInvite } from './session';
import { loadOrCreateIdentity, saveIdentity } from './identity';
import { loadOrCreatePreKeys, savePreKeys, serializePreKeys, deserializePreKeys } from './prekeys';
import { loadContacts, saveContact } from './store';
import { loadGroups, saveGroup, toInvite, fromInvite } from './groups';
import { loadProfile, saveProfile, type MyProfile } from './profile';
import { loadStickers, saveStickers, type Sticker } from './stickers';
import { loadMessages, saveMessages, type ChatMessage } from './messages';
import { getAttachmentBlob, getAttachmentMeta, putAttachment, allAttachmentIds } from './attachments';
import { loadRetiredMasters, saveRetiredMasters } from './denylist';

// --- Encryption container -------------------------------------------------
//
// v1 (legacy, still importable): one JSON object {v:1, argon2, salt, iv, ct} with
//   the whole vault base64-encrypted as a single blob. Fine when attachments were
//   inline and ≤600 KB; unusable once attachments are large (one giant encrypt +
//   base64 = OOM).
//
// v2/v3 (current): a length-prefixed BINARY container assembled as a Blob, so
//   nothing is ever held as one giant array or base64 string and each section is
//   encrypted on its own:
//     [u32 headerLen][header JSON][meta ciphertext][att0 ciphertext][att1]…
//   header = {v, argon2, salt, meta:{iv,len}, atts:[{id, iv, len}]}. The metadata
//   blob carries the identity/contacts/messages plus a name/mime map for the
//   attachments; each attachment's bytes are a separate section. A v1 file starts
//   with '{' (0x7b); a binary file starts with a 4-byte length whose first byte is 0.
//   v3 differs from v2 only by binding each section to its role via GCM AAD (meta
//   vs att:<id>) so ciphertexts cannot be spliced between roles/ids (audit N-3);
//   v2 files (no AAD) still import — the reader passes no aad for them.

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

interface BinaryHeader {
  v: 2 | 3; // v3 = v2 layout + per-section AAD role binding (audit N-3)
  argon2: Argon2Params;
  salt: string;
  meta: { iv: string; len: number };
  atts: { id: string; iv: string; len: number }[];
}

// --- Full-state gather / restore -------------------------------------------

interface BackupBlob {
  v: 1;
  createdAt: number;
  identity: string; // b64 serializeIdentity (incl. master private key)
  prekeys: string; // b64 serializePreKeys
  profile: MyProfile;
  contacts: string[]; // b64 serializeContact each (incl. ratchet state)
  groups: GroupInvite[];
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
  // Name/mime for each attachment whose bytes travel as their own section in a v2
  // file (the bytes are NOT in this blob). Absent in v1 backups.
  attMeta?: Record<string, { name: string; mime: string }>;
}

async function gather(dek: CryptoKey, attMeta: Record<string, { name: string; mime: string }>): Promise<Bytes> {
  const id = await loadOrCreateIdentity(dek);
  const pre = await loadOrCreatePreKeys(dek, id);
  const contacts = await loadContacts(dek);
  const groups = await loadGroups(dek);
  const messages: Record<string, ChatMessage[]> = {};
  for (const c of contacts) messages[c.roomId] = await loadMessages(dek, c.roomId);
  for (const g of groups) messages[g.id] = await loadMessages(dek, g.id);
  const blob: BackupBlob = {
    v: 1,
    createdAt: Date.now(),
    identity: await b64encode(await serializeIdentity(id)),
    prekeys: await b64encode(await serializePreKeys(pre)),
    profile: await loadProfile(dek),
    contacts: await Promise.all(contacts.map(async (c) => b64encode(await serializeContact(c)))),
    groups: await Promise.all(groups.map((g) => toInvite(g))),
    messages,
    stickers: await loadStickers(dek),
    retiredMasters: [...(await loadRetiredMasters(dek))],
    attMeta,
  };
  return utf8.encode(JSON.stringify(blob));
}

/** Restore everything EXCEPT attachment bytes (those are separate v2 sections). */
async function restoreMeta(dek: CryptoKey, blob: BackupBlob): Promise<void> {
  if (blob.v !== 1) throw new Error('Unbekanntes Backup-Format.');
  await saveIdentity(dek, await deserializeIdentity(await b64decode(blob.identity)));
  await savePreKeys(dek, await deserializePreKeys(await b64decode(blob.prekeys)));
  await saveProfile(dek, blob.profile);
  for (const cb of blob.contacts) {
    const c = await deserializeContact(await b64decode(cb));
    // A backup captures a bundle whose ONE-TIME prekey may have been consumed
    // after the snapshot was taken. Restoring it verbatim would let a later
    // handshake compute DH1–DH4 while the peer computes DH1–DH3 — the same
    // silent mismatch reconnectContact() guards against, except the restore path
    // never passes through it. We cannot know whether it was used, so drop it:
    // falling back to the no-OPK X3DH is always safe.
    if (c.bundle?.oneTimePreKey) c.bundle = { ...c.bundle, oneTimePreKey: undefined };
    await saveContact(dek, c);
  }
  for (const inv of blob.groups) await saveGroup(dek, await fromInvite(inv));
  for (const roomId of Object.keys(blob.messages)) await saveMessages(dek, roomId, blob.messages[roomId]);
  // Restore the retired-master denylist by UNION (never overwrite): a restore may
  // only ADD retirements, never drop an existing local one — otherwise importing
  // an older backup would silently un-retire a master this device already
  // abandoned. A missing field (pre-DA-3 backup) leaves the local set untouched.
  if (blob.retiredMasters?.length) {
    const merged = await loadRetiredMasters(dek);
    for (const m of blob.retiredMasters) merged.add(m);
    await saveRetiredMasters(dek, merged);
  }
  // Optional: a backup taken before stickers existed has no field. Restoring
  // an empty array over an existing set would silently delete it, so only
  // write when the backup actually carried one.
  if (blob.stickers) await saveStickers(dek, blob.stickers);
}

// --- Public API ------------------------------------------------------------

/**
 * Produce an encrypted backup FILE (v2) of the whole vault state, as a Blob. The
 * metadata and every attachment are encrypted as separate sections, so a large
 * video never sits in memory as one array nor goes through one giant encrypt.
 */
export async function exportBackup(dek: CryptoKey, exportPassphrase: string): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveExportKey(exportPassphrase, salt, DEFAULT_ARGON2);

  // Name/mime for every stored attachment (its bytes become a separate section).
  const attMeta: Record<string, { name: string; mime: string }> = {};
  const ids: string[] = [];
  for (const id of await allAttachmentIds()) {
    const m = await getAttachmentMeta(dek, id);
    if (m) {
      attMeta[id] = { name: m.name, mime: m.mime };
      ids.push(id);
    }
  }

  const metaSec = await encSection(key, await gather(dek, attMeta), backupMetaAad());

  // Each section is wrapped in its own Blob immediately, so its ciphertext array can
  // be released and the browser may back the growing file with disk — peak memory is
  // ~one attachment (its plaintext + ciphertext while it encrypts), not the whole set.
  // Each attachment section is AAD-bound to its own id so its ciphertext cannot be
  // spliced under a different id on import (audit N-3).
  const atts: BinaryHeader['atts'] = [];
  const bodyParts: BlobPart[] = [new Blob([metaSec.ct])];
  for (const id of ids) {
    const blob = await getAttachmentBlob(dek, id);
    if (!blob) continue; // incomplete/GC'd between listing and reading — skip
    const sec = await encSection(key, new Uint8Array(await blob.arrayBuffer()), backupAttAad(id));
    atts.push({ id, iv: await b64encode(sec.iv), len: sec.ct.length });
    bodyParts.push(new Blob([sec.ct]));
  }

  const header: BinaryHeader = {
    v: 3,
    argon2: DEFAULT_ARGON2,
    salt: await b64encode(salt),
    meta: { iv: await b64encode(metaSec.iv), len: metaSec.ct.length },
    atts,
  };
  const headerBytes = utf8.encode(JSON.stringify(header));
  const prefix = new Uint8Array(4);
  new DataView(prefix.buffer).setUint32(0, headerBytes.length);
  return new Blob([prefix, headerBytes, ...bodyParts], { type: 'application/octet-stream' });
}

const CORRUPT = 'Beschädigtes Backup — die Datei ist unvollständig oder kein SCYTALE-Backup.';
const WRONG_PASS = 'Falsche Export-Passphrase oder beschädigtes Backup.';

async function sliceBytes(file: Blob, start: number, end: number): Promise<Bytes> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}

/**
 * Restore an encrypted backup into the local vault (overwrites identity/state).
 * Accepts both the v2 binary container and the legacy v1 JSON file. Reads the file
 * SECTION BY SECTION (never the whole thing into one array). Returns the number of
 * attachments that could not be restored: the account and all readable data come
 * back even if a single attachment section is damaged — one bad section never
 * discards the intact ones.
 */
export async function importBackup(dek: CryptoKey, exportPassphrase: string, file: Blob): Promise<number> {
  const head = await sliceBytes(file, 0, 4);
  if (head.length === 0) throw new Error(CORRUPT);

  // v1 files are a JSON object → start with '{'. v2 starts with a 4-byte length.
  if (head[0] === 0x7b) {
    let c: V1Container;
    try {
      c = JSON.parse(utf8.decode(await sliceBytes(file, 0, file.size))) as V1Container;
    } catch {
      throw new Error(CORRUPT);
    }
    if (c.v !== 1) throw new Error('Unbekanntes Backup-Format.');
    const key = await deriveExportKey(exportPassphrase, await b64decode(c.salt), c.argon2);
    let plain: Bytes;
    try {
      plain = await decSection(key, await b64decode(c.iv), await b64decode(c.ct));
    } catch {
      throw new Error(WRONG_PASS);
    }
    await restoreMeta(dek, JSON.parse(utf8.decode(plain)) as BackupBlob);
    return 0;
  }

  // v2 binary container.
  if (head.length < 4) throw new Error(CORRUPT);
  const headerLen = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(0);
  let header: BinaryHeader;
  try {
    header = JSON.parse(utf8.decode(await sliceBytes(file, 4, 4 + headerLen))) as BinaryHeader;
  } catch {
    throw new Error(CORRUPT);
  }
  if (header.v !== 2 && header.v !== 3) throw new Error('Unbekanntes Backup-Format.');
  // v3 binds each section to its role via AAD; v2 files were written without it.
  const bindAad = header.v === 3;
  let off = 4 + headerLen;
  const key = await deriveExportKey(exportPassphrase, await b64decode(header.salt), header.argon2);

  // Metadata FIRST: a wrong passphrase fails its auth tag here, before anything is
  // written — so a bad passphrase never leaves a half-restored vault.
  const metaCt = await sliceBytes(file, off, off + header.meta.len);
  off += header.meta.len;
  let blob: BackupBlob;
  try {
    blob = JSON.parse(
      utf8.decode(await decSection(key, await b64decode(header.meta.iv), metaCt, bindAad ? backupMetaAad() : undefined)),
    ) as BackupBlob;
  } catch {
    throw new Error(WRONG_PASS);
  }
  await restoreMeta(dek, blob);

  // Attachments: each isolated. Advance the offset BEFORE decrypting, so a damaged
  // section is skipped without desyncing the ones after it.
  let failed = 0;
  for (const a of header.atts) {
    const start = off;
    off += a.len;
    try {
      const bytes = await decSection(
        key,
        await b64decode(a.iv),
        await sliceBytes(file, start, start + a.len),
        bindAad ? backupAttAad(a.id) : undefined,
      );
      const nm = blob.attMeta?.[a.id];
      await putAttachment(dek, a.id, bytes, nm?.name ?? 'anhang', nm?.mime ?? 'application/octet-stream');
    } catch {
      failed++; // damaged/undecryptable attachment — the rest still restore
    }
  }
  return failed;
}
