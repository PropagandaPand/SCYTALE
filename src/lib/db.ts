/**
 * IndexedDB access. Everything sensitive stored here is already sealed by the
 * vault (AES-256-GCM); the DB itself holds only ciphertext + the non-secret
 * vault header.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { VaultHeader, SealedRecord } from '../crypto';

interface ScytaleDB extends DBSchema {
  meta: { key: string; value: VaultHeader };
  records: { key: string; value: SealedRecord };
}

let dbp: Promise<IDBPDatabase<ScytaleDB>> | null = null;

function db(): Promise<IDBPDatabase<ScytaleDB>> {
  if (!dbp) {
    dbp = openDB<ScytaleDB>('scytale', 1, {
      upgrade(d) {
        d.createObjectStore('meta');
        d.createObjectStore('records');
      },
    });
  }
  return dbp;
}

export async function loadHeader(): Promise<VaultHeader | undefined> {
  return (await db()).get('meta', 'vault');
}

export async function saveHeader(header: VaultHeader): Promise<void> {
  await (await db()).put('meta', header, 'vault');
}

export async function loadRecord(key: string): Promise<SealedRecord | undefined> {
  return (await db()).get('records', key);
}

export async function saveRecord(key: string, record: SealedRecord): Promise<void> {
  await (await db()).put('records', record, key);
}
