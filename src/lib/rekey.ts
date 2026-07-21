/**
 * Crash-safe contact re-key (Stage 3c).
 *
 * Moving a contact from one roomId to another is NOT a rename. The contact
 * record and its messages are sealed with an AAD bound to the roomId (see
 * store.ts contactAad, messages.ts aad); renaming the storage key would leave
 * the sealed AAD pointing at the OLD id, `open()` would throw, and loadContacts
 * would drop the contact with no trace. So we RE-ENCRYPT under the new id's AAD.
 *
 * ORDER (Invariant II — commit before discard): write the NEW records first,
 * only then delete the OLD. A crash in the gap leaves a benign duplicate that
 * the boot merge collapses; the reverse order would lose the conversation.
 *
 * Two entry points, because roomId changes for two reasons:
 *  • migration (device-DH → master): migrateContactRoomId computes the new id.
 *  • a master change (acceptRotation / acceptMasterChange): those set the new
 *    contact.roomId themselves, so the caller just moves storage old → new.
 * Both share moveContactStorage, so re-encryption and ordering live in ONE place.
 */
import { saveContact, removeContact } from './store';
import { loadMessages, saveMessages } from './messages';
import { migrateContactRoomId, type Contact } from './session';

/** Move a contact's sealed records from oldRoomId to its (already-set) roomId. */
export async function moveContactStorage(dek: CryptoKey, oldRoomId: string, contact: Contact): Promise<void> {
  if (oldRoomId === contact.roomId) return;
  const msgs = await loadMessages(dek, oldRoomId);
  await saveMessages(dek, contact.roomId, msgs); // re-seal under the new AAD, committed first
  await saveContact(dek, contact); // contact:new + index+=new
  await removeContact(dek, oldRoomId); // discard old records + index entry
}

/**
 * Boot migration of one contact (device-DH → master). Returns {old,new}, or null
 * if already master-regime (no-op). Throws if it cannot migrate (no ownMasterPub
 * — the caller routes it to "reconnect").
 */
export async function reKeyContactStorage(
  dek: CryptoKey,
  contact: Contact,
): Promise<{ oldRoomId: string; newRoomId: string } | null> {
  const oldRoomId = contact.roomId;
  const r = await migrateContactRoomId(contact); // sets contact.roomId + regime='master'
  if (r.oldRoomId === r.newRoomId) return null;
  await moveContactStorage(dek, oldRoomId, contact);
  return r;
}
