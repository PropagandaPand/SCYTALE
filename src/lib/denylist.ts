/**
 * Global RETIRED-MASTER denylist — cross-signing masters this user's contacts
 * have demonstrably left behind.
 *
 * Indexed by MASTER (base64 of the pub key), NOT by contact. Under master-based
 * roomId a per-contact list is circular: you need the contact to check the
 * master, and the master to find the contact — so a retired-master prekey lands
 * a different room, misses the contact, and auto-creates a fresh (abandoned-key)
 * contact whose old denylist is never consulted. A global, master-indexed set
 * answers "is this master abandoned?" without any contact lookup, which lets the
 * check sit structurally BEFORE any state touch (the rotation path, auto-create,
 * everywhere). The Trust-DoS protection then falls out for free: an abandoned
 * key can be rejected without touching `verified`.
 *
 * An abandoned master is the most likely compromised key in the system — it
 * lingers in old backups and on discarded devices, which is usually why it was
 * left. It is never accepted again on any path; the way back is a fresh identity.
 */
import { seal, open, utf8, b64decode, b64encode } from '../crypto';
import { loadRecord, saveRecord } from './db';

const AAD = utf8.encode('scytale:retired-masters:v1');
const KEY = 'retired-masters';

export class RetiredMasterListCorruptError extends Error {
  constructor() {
    super('Die lokale Liste aufgegebener Identitäten ist beschädigt.');
    this.name = 'RetiredMasterListCorruptError';
  }
}

/** Load the denylist as a Set of canonical base64 master pubs. */
export async function loadRetiredMasters(dek: CryptoKey): Promise<Set<string>> {
  const rec = await loadRecord(KEY);
  if (!rec) return new Set();
  try {
    const arr: unknown = JSON.parse(utf8.decode(await open(dek, rec, AAD)));
    if (!Array.isArray(arr) || arr.length > 10_000) throw new Error('schema');
    const result = new Set<string>();
    for (const value of arr) {
      if (typeof value !== 'string' || value.length > 128) throw new Error('schema');
      const bytes = await b64decode(value);
      if (bytes.length !== 32 || (await b64encode(bytes)) !== value) throw new Error('schema');
      result.add(value);
    }
    return result;
  } catch {
    throw new RetiredMasterListCorruptError();
  }
}

export async function saveRetiredMasters(dek: CryptoKey, set: Set<string>): Promise<void> {
  await saveRecord(KEY, await seal(dek, utf8.encode(JSON.stringify([...set])), AAD));
}

/** Add a master (base64) to the denylist and persist. Returns the updated set. */
export async function addRetiredMaster(dek: CryptoKey, masterB64: string): Promise<Set<string>> {
  const set = await loadRetiredMasters(dek);
  if (!set.has(masterB64)) {
    set.add(masterB64);
    await saveRetiredMasters(dek, set);
  }
  return set;
}
