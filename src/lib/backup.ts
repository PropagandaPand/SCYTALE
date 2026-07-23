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
// v2 (current): a length-prefixed BINARY container assembled as a Blob, so nothing
//   is ever held as one giant array or base64 string and each section is encrypted
//   on its own:
//     [u32 headerLen][header JSON][meta ciphertext][att0 ciphertext][att1]…
//   header = {v:2, argon2, salt, meta:{iv,len}, atts:[{id, iv, len}]}. The metadata
//   blob carries the identity/contacts/messages plus a name/mime map for the
//   attachments; each attachment's bytes are a separate section. A v1 file starts
//   with '{' (0x7b); a v2 file starts with a 4-byte length whose first byte is 0.

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

async function encSection(key: CryptoKey, plain: Bytes): Promise<{ iv: Bytes; ct: Bytes }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  return { iv, ct };
}

async function decSection(key: CryptoKey, iv: Bytes, ct: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
}

interface V2Header {
  v: 2;
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

  const metaSec = await encSection(key, await gather(dek, attMeta));

  const atts: V2Header['atts'] = [];
  const attCts: Bytes[] = [];
  for (const id of ids) {
    const blob = await getAttachmentBlob(dek, id);
    if (!blob) continue; // incomplete/GC'd between listing and reading — skip
    const sec = await encSection(key, new Uint8Array(await blob.arrayBuffer()));
    atts.push({ id, iv: await b64encode(sec.iv), len: sec.ct.length });
    attCts.push(sec.ct);
  }

  const header: V2Header = {
    v: 2,
    argon2: DEFAULT_ARGON2,
    salt: await b64encode(salt),
    meta: { iv: await b64encode(metaSec.iv), len: metaSec.ct.length },
    atts,
  };
  const headerBytes = utf8.encode(JSON.stringify(header));
  const prefix = new Uint8Array(4);
  new DataView(prefix.buffer).setUint32(0, headerBytes.length);
  // A Blob of parts: the browser can back this with disk, so the whole backup is
  // never one contiguous array in RAM.
  return new Blob([prefix, headerBytes, metaSec.ct, ...attCts], { type: 'application/octet-stream' });
}

/** Restore an encrypted backup into the local vault (overwrites identity/state).
 *  Accepts both the v2 binary container and the legacy v1 JSON file. */
export async function importBackup(dek: CryptoKey, exportPassphrase: string, file: Bytes): Promise<void> {
  // v1 files are a JSON object → start with '{'. v2 starts with a 4-byte length.
  if (file[0] === 0x7b) {
    const c = JSON.parse(utf8.decode(file)) as V1Container;
    if (c.v !== 1) throw new Error('Unbekanntes Backup-Format.');
    const key = await deriveExportKey(exportPassphrase, await b64decode(c.salt), c.argon2);
    let plain: Bytes;
    try {
      plain = await decSection(key, await b64decode(c.iv), await b64decode(c.ct));
    } catch {
      throw new Error('Falsche Export-Passphrase oder beschädigtes Backup.');
    }
    await restoreMeta(dek, JSON.parse(utf8.decode(plain)) as BackupBlob);
    return;
  }

  // v2 binary container.
  const dv = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const headerLen = dv.getUint32(0);
  let off = 4;
  const header = JSON.parse(utf8.decode(new Uint8Array(file.slice(off, off + headerLen)))) as V2Header;
  if (header.v !== 2) throw new Error('Unbekanntes Backup-Format.');
  off += headerLen;
  const key = await deriveExportKey(exportPassphrase, await b64decode(header.salt), header.argon2);

  const metaCt = new Uint8Array(file.slice(off, off + header.meta.len));
  off += header.meta.len;
  let blob: BackupBlob;
  try {
    blob = JSON.parse(utf8.decode(await decSection(key, await b64decode(header.meta.iv), metaCt))) as BackupBlob;
  } catch {
    throw new Error('Falsche Export-Passphrase oder beschädigtes Backup.');
  }
  await restoreMeta(dek, blob);

  for (const a of header.atts) {
    const ct = new Uint8Array(file.slice(off, off + a.len));
    off += a.len;
    const bytes = await decSection(key, await b64decode(a.iv), ct);
    const nm = blob.attMeta?.[a.id];
    await putAttachment(dek, a.id, bytes, nm?.name ?? 'anhang', nm?.mime ?? 'application/octet-stream');
  }
}
