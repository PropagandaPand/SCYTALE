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
import { loadMessages, saveMessages, type ChatMessage } from './messages';

// --- Encryption container (the downloadable file) --------------------------

interface Container {
  v: 1;
  argon2: Argon2Params;
  salt: string;
  iv: string;
  ct: string;
}

async function encrypt(passphrase: string, plaintext: Bytes): Promise<Bytes> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  // Full Argon2id on the export passphrase; deriveKekBytes clamps to MIN_ARGON2.
  const keyBytes = await deriveKekBytes(passphrase, salt, DEFAULT_ARGON2);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  keyBytes.fill(0);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const container: Container = {
    v: 1,
    argon2: DEFAULT_ARGON2,
    salt: await b64encode(salt),
    iv: await b64encode(iv),
    ct: await b64encode(ct),
  };
  return utf8.encode(JSON.stringify(container));
}

async function decrypt(passphrase: string, file: Bytes): Promise<Bytes> {
  const c = JSON.parse(utf8.decode(file)) as Container;
  if (c.v !== 1) throw new Error('Unbekanntes Backup-Format.');
  const keyBytes = await deriveKekBytes(passphrase, await b64decode(c.salt), c.argon2);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  keyBytes.fill(0);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: await b64decode(c.iv) }, key, await b64decode(c.ct)),
    );
  } catch {
    throw new Error('Falsche Export-Passphrase oder beschädigtes Backup.');
  }
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
}

async function gather(dek: CryptoKey): Promise<Bytes> {
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
  };
  return utf8.encode(JSON.stringify(blob));
}

async function restore(dek: CryptoKey, plaintext: Bytes): Promise<void> {
  const blob = JSON.parse(utf8.decode(plaintext)) as BackupBlob;
  if (blob.v !== 1) throw new Error('Unbekanntes Backup-Format.');
  await saveIdentity(dek, await deserializeIdentity(await b64decode(blob.identity)));
  await savePreKeys(dek, await deserializePreKeys(await b64decode(blob.prekeys)));
  await saveProfile(dek, blob.profile);
  for (const cb of blob.contacts) await saveContact(dek, await deserializeContact(await b64decode(cb)));
  for (const inv of blob.groups) await saveGroup(dek, await fromInvite(inv));
  for (const roomId of Object.keys(blob.messages)) await saveMessages(dek, roomId, blob.messages[roomId]);
}

// --- Public API ------------------------------------------------------------

/** Produce an encrypted backup file of the whole vault state. */
export async function exportBackup(dek: CryptoKey, exportPassphrase: string): Promise<Bytes> {
  return encrypt(exportPassphrase, await gather(dek));
}

/** Restore an encrypted backup into the local vault (overwrites identity/state). */
export async function importBackup(dek: CryptoKey, exportPassphrase: string, file: Bytes): Promise<void> {
  await restore(dek, await decrypt(exportPassphrase, file));
}
