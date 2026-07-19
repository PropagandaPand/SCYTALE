/**
 * Contact persistence — each contact (incl. its live ratchet state) is sealed
 * with the DEK before it touches IndexedDB. A small sealed index lists the
 * known room ids.
 */
import { seal, open, utf8 } from '../crypto';
import { serializeContact, deserializeContact, type Contact } from './session';
import { loadRecord, saveRecord, deleteRecord } from './db';

const INDEX_AAD = utf8.encode('scytale:contact-index:v1');
const contactAad = (roomId: string) => utf8.encode(`scytale:contact:v1:${roomId}`);

async function loadIndex(dek: CryptoKey): Promise<string[]> {
  const rec = await loadRecord('contact-index');
  if (!rec) return [];
  return JSON.parse(utf8.decode(await open(dek, rec, INDEX_AAD)));
}

async function saveIndex(dek: CryptoKey, ids: string[]): Promise<void> {
  await saveRecord('contact-index', await seal(dek, utf8.encode(JSON.stringify(ids)), INDEX_AAD));
}

export async function saveContact(dek: CryptoKey, c: Contact): Promise<void> {
  await saveRecord(`contact:${c.roomId}`, await seal(dek, await serializeContact(c), contactAad(c.roomId)));
  const ids = await loadIndex(dek);
  if (!ids.includes(c.roomId)) {
    ids.push(c.roomId);
    await saveIndex(dek, ids);
  }
}

export async function removeContact(dek: CryptoKey, roomId: string): Promise<void> {
  await deleteRecord(`contact:${roomId}`);
  await deleteRecord(`msgs:${roomId}`);
  const ids = (await loadIndex(dek)).filter((id) => id !== roomId);
  await saveIndex(dek, ids);
}

export async function loadContacts(dek: CryptoKey): Promise<Contact[]> {
  const ids = await loadIndex(dek);
  const out: Contact[] = [];
  for (const id of ids) {
    const rec = await loadRecord(`contact:${id}`);
    if (!rec) continue;
    try {
      out.push(await deserializeContact(await open(dek, rec, contactAad(id))));
    } catch {
      /* pre-master-format contact from before the multi-device break → skip */
    }
  }
  return out;
}
