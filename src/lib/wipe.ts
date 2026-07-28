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
import { closeDb, secureOverwriteHeader } from './db';
import { disablePush, PUSH_CONTROL_CACHE } from './push';

const DB_NAMES = ['scytale', 'scytale-badge'];

/** A localStorage flag that SURVIVES a wipe. If deleteDB is blocked or fails (a service-worker-
 *  held connection, or a BFCache-frozen sibling tab — the flaky-mobile conditions this app
 *  defends against), a leftover or overwritten-garbage header could otherwise make the next boot
 *  show a permanently un-unlockable lock screen instead of fresh onboarding. Set BEFORE any
 *  destructive step, honoured by hasVault(), and cleared only when a fresh vault is created. */
export const RESET_MARKER = 'scytale-reset';
function markReset(): void {
  try {
    localStorage.setItem(RESET_MARKER, '1');
  } catch {
    /* ignore */
  }
}
export function wipedMarkerPresent(): boolean {
  try {
    return localStorage.getItem(RESET_MARKER) === '1';
  } catch {
    return false;
  }
}

export async function wipeAccount(options: { pushTeardownStarted?: boolean } = {}): Promise<void> {
  markReset(); // set the persistent onboarding flag before anything is torn down
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
    // Keep RESET_MARKER: it must outlive the wipe so a failed deleteDB still boots to onboarding.
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('scytale-') && k !== RESET_MARKER) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Duress wipe: the irreversible crypto-erase triggered when the DURESS password is entered at
 * unlock. Overwrites the vault header (the wrapped DEK) best-effort FIRST, then performs the
 * full account wipe. This is forensically sound for the duress case by construction: the DEK is
 * only ever derivable from the REAL passphrase, which a coercer holding the duress password does
 * NOT have — so once the header is destroyed, even a recovered device image is unrecoverable
 * ciphertext. The best-effort overwrite additionally hardens against a LATER coercion of the real
 * passphrase. Honest limit: on flash/SSD the overwrite cannot guarantee the original cells are
 * gone (FTL wear-levelling) — the guarantee is the key destruction, not the physical overwrite.
 * See SECURITY.md.
 */
export async function duressWipe(): Promise<void> {
  markReset(); // BEFORE overwriting the header, so a garbage header + failed deleteDB can't brick boot
  await secureOverwriteHeader().catch(() => undefined);
  await wipeAccount();
}
