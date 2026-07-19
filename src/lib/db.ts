/**
 * IndexedDB access. Everything sensitive stored here is already sealed by the
 * vault (AES-256-GCM); the DB itself holds only ciphertext, the non-secret
 * vault header, the non-extractable device key, and small plaintext counters.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { VaultHeader, SealedRecord } from '../crypto';

interface ScytaleDB extends DBSchema {
  meta: { key: string; value: VaultHeader };
  records: { key: string; value: SealedRecord };
  device: { key: string; value: CryptoKey };
  kv: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<ScytaleDB>> | null = null;

function db(): Promise<IDBPDatabase<ScytaleDB>> {
  if (!dbp) {
    dbp = openDB<ScytaleDB>('scytale', 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('meta');
          d.createObjectStore('records');
        }
        if (oldVersion < 2) {
          d.createObjectStore('device');
          d.createObjectStore('kv');
        }
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

// --- Device key (non-extractable CryptoKey, never leaves this device/profile) ---

export async function loadDeviceKey(): Promise<CryptoKey | undefined> {
  return (await db()).get('device', 'local_device_key');
}

export async function saveDeviceKey(key: CryptoKey): Promise<void> {
  await (await db()).put('device', key, 'local_device_key');
}

// --- Small plaintext key/value (lockout counters — no secrets) ---

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await db()).get('kv', key) as Promise<T | undefined>;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await (await db()).put('kv', value, key);
}
