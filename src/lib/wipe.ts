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
import { disablePush, PUSH_CONTROL_CACHE } from './push';

const DB_NAMES = ['scytale', 'scytale-badge'];

export async function wipeAccount(options: { pushTeardownStarted?: boolean } = {}): Promise<void> {
  try {
    await navigator.clearAppBadge?.();
  } catch {
    /* ignore */
  }
  // Tear down the push subscription and UNREGISTER the service worker BEFORE deleting the
  // stores — otherwise the SW stays live and a later content-free push re-creates the
  // scytale-badge DB (its raw open bypasses the db.ts wiping guard) and shows a notice.
  if (!options.pushTeardownStarted) {
    // Standalone callers still get a bounded best-effort teardown. The primary
    // UI path performs the server/local sequence itself and passes true.
    await Promise.race([
      disablePush(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]).catch(() => undefined);
  }
  let workerGone = false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    workerGone = !reg || (await reg.unregister());
  } catch {
    workerGone = false;
  }
  // Delete the opt-out marker only after confirmed unregister. If unregister
  // failed, the surviving worker must retain that marker and its complete cache;
  // otherwise push rotation could re-subscribe and navigations would fail closed
  // to a now-deleted shell.
  if (workerGone) {
    try {
      for (const name of await caches.keys()) {
        if (name === 'scytale-precache' || name.startsWith('scytale-precache-') || name === PUSH_CONTROL_CACHE) {
          await caches.delete(name);
        }
      }
    } catch {
      /* ignore */
    }
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
