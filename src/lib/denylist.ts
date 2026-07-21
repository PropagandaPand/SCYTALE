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
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';

const AAD = utf8.encode('scytale:retired-masters:v1');
const KEY = 'retired-masters';

/** Load the denylist as a Set of base64 master pubs (empty if none/undecodable). */
export async function loadRetiredMasters(dek: CryptoKey): Promise<Set<string>> {
  const rec = await loadRecord(KEY);
  if (!rec) return new Set();
  try {
    const arr = JSON.parse(utf8.decode(await open(dek, rec, AAD))) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
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
