/**
 * Contact persistence — each contact (incl. its live ratchet state) is sealed
 * with the DEK before it touches IndexedDB. A small sealed index lists the
 * known room ids.
 */
import { seal, open, utf8, type SealedRecord } from '../crypto';
import { serializeContact, deserializeContact, type Contact } from './session';
import { loadRecord, saveRecord, saveRecordsAtomically, secureDeleteRecord } from './db';
import { cryptoEraseRoom } from './messages';
import { sealPreKeysRecord, type PreKeyState } from './prekeys';

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

/**
 * Persist a newly authenticated OPK-backed session and remove that OPK in one
 * IndexedDB transaction. Mutate the in-memory prekey state only after the
 * transaction commits, so a crash leaves either both old records or both new.
 */
export async function saveContactAndConsumeOneTimePreKey(
  dek: CryptoKey,
  c: Contact,
  prekeys: PreKeyState,
  opkId: number,
): Promise<void> {
  const index = prekeys.oneTimePreKeys.findIndex((opk) => opk.id === opkId);
  if (index < 0) throw new Error('Authentisierter One-Time-Prekey ist nicht mehr verfügbar.');
  const remaining = prekeys.oneTimePreKeys.filter((_, i) => i !== index);
  const nextPrekeys: PreKeyState = { ...prekeys, oneTimePreKeys: remaining };
  const ids = await loadIndex(dek);
  const entries: Array<readonly [string, Awaited<ReturnType<typeof seal>>]> = [
    [
      `contact:${c.roomId}`,
      await seal(dek, await serializeContact(c), contactAad(c.roomId)),
    ],
    ['prekeys', await sealPreKeysRecord(dek, nextPrekeys)],
  ];
  if (!ids.includes(c.roomId)) {
    entries.push([
      'contact-index',
      await seal(dek, utf8.encode(JSON.stringify([...ids, c.roomId])), INDEX_AAD),
    ]);
  }
  await saveRecordsAtomically(entries);
  prekeys.oneTimePreKeys = remaining;
}

export async function removeContact(dek: CryptoKey, roomId: string): Promise<void> {
  // Crypto-erase the whole room (per-room key → the message history is unrecoverable),
  // and overwrite+delete the contact record itself (it holds the live ratchet state).
  await cryptoEraseRoom(roomId);
  await secureDeleteRecord(`contact:${roomId}`);
  const ids = (await loadIndex(dek)).filter((id) => id !== roomId);
  await saveIndex(dek, ids);
}

/** Build the sealed `contact:<roomId>` record WITHOUT writing it, reusing the exact same AAD +
 *  serialization as saveContact. For seeding the decoy account into its own database at provision
 *  time (the caller writes the returned [key, record] via a raw withVaultDb handle, not the active
 *  DB). Keeping this next to saveContact means the seed can never drift from the real seal format. */
export async function sealContactRecord(dek: CryptoKey, c: Contact): Promise<[string, SealedRecord]> {
  return [`contact:${c.roomId}`, await seal(dek, await serializeContact(c), contactAad(c.roomId))];
}

/** Build the sealed `contact-index` record (list of roomIds) WITHOUT writing it. Decoy-seed helper. */
export async function sealContactIndexRecord(dek: CryptoKey, ids: string[]): Promise<[string, SealedRecord]> {
  return ['contact-index', await seal(dek, utf8.encode(JSON.stringify(ids)), INDEX_AAD)];
}

export async function loadContacts(dek: CryptoKey): Promise<Contact[]> {
  const ids = await loadIndex(dek);
  const out: Contact[] = [];
  for (const id of ids) {
    const rec = await loadRecord(`contact:${id}`);
    if (!rec) continue;
    try {
      out.push(await deserializeContact(await open(dek, rec, contactAad(id))));
    } catch (e) {
      // Do NOT swallow silently. An open() failure here means a contact record
      // whose storage key and sealed AAD have diverged — e.g. a re-key that
      // renamed the key instead of re-encrypting under the new roomId's AAD. In
      // the dual-regime migration window (Stage 3c) that is a LIKELY, not
      // theoretical, failure, and a contact that vanishes with no trace is
      // exactly the diagnosability gap HandshakeMismatchError was named to close.
      console.error('[store] Kontakt nicht ladbar (AAD/Format):', (e as Error).name);
    }
  }
  return out;
}
