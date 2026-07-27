/**
 * Irreversibly wipe ALL local account data from THIS device — the whole crypto container:
 * the vault header (wrapped DEK), every sealed record (contacts, messages, attachments,
 * device list), the non-extractable device key, the badge store, and local prefs. This is
 * a crypto-erase by removal: once the vault header is gone, the sealed records are
 * unrecoverable even if raw bytes linger, because the DEK is unwrapped only from the
 * passphrase-derived key that no longer has a header to unwrap.
 *
 * Used for BOTH account delete/reset and a revoked device's self-wipe. The caller reloads
 * afterwards; a vault-less boot lands on onboarding (hasVault() → false).
 *
 * Honest scope: this only affects this device. It does NOT reach your contacts or the
 * relay — there is no server-side account (the relay is a dumb mailbox).
 */
import { deleteDB } from 'idb';
import { closeDb } from './db';
import { disablePush } from './push';

const DB_NAMES = ['scytale', 'scytale-badge'];

export async function wipeAccount(): Promise<void> {
  try {
    await navigator.clearAppBadge?.();
  } catch {
    /* ignore */
  }
  // Tear down the push subscription and UNREGISTER the service worker BEFORE deleting the
  // stores — otherwise the SW stays live and a later content-free push re-creates the
  // scytale-badge DB (its raw open bypasses the db.ts wiping guard) and shows a notice.
  await disablePush().catch(() => undefined);
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.unregister();
  } catch {
    /* ignore */
  }
  await closeDb().catch(() => undefined);
  for (const name of DB_NAMES) {
    try {
      await deleteDB(name);
    } catch {
      try {
        indexedDB.deleteDatabase(name); // fire-and-forget fallback
      } catch {
        /* ignore */
      }
    }
  }
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('scytale-')) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
