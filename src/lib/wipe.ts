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

// A deliberate account delete/reset must destroy the decoy too — otherwise the next boot would
// find 'scytale-decoy' and "promote" it as if the real account had been duress-wiped.
const DB_NAMES = ['scytale', 'scytale-badge', 'scytale-decoy'];

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

/** Cross-tab signal. The per-module context id prevents the tab performing the
 * duress operation from reacting to its own BroadcastChannel message. */
export const DURESS_LOCKDOWN_CHANNEL = 'scytale-duress-lockdown-v1';
export const DURESS_LOCKDOWN_STORAGE_KEY = 'scytale-duress-lockdown';
export const DURESS_CONTEXT_ID = (() => {
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
})();

function broadcastDuressLockdown(): void {
  const message = { type: 'lockdown', source: DURESS_CONTEXT_ID, at: Date.now() };
  try {
    localStorage.setItem(DURESS_LOCKDOWN_STORAGE_KEY, JSON.stringify(message));
  } catch {
    /* the promotion journal itself still causes a storage event when available */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(DURESS_LOCKDOWN_CHANNEL);
      channel.postMessage(message);
      channel.close();
    }
  } catch {
    /* storage event remains the fallback */
  }
}

/**
 * Crash-recovery journal for a duress promotion. `sourceWitness` binds recovery
 * to the exact decoy envelope that the duress passphrase opened; `fenceToken`
 * binds the durable IndexedDB source fence. The phase is monotone: copied can
 * never regress to pending.
 */
export const PROMOTE_MARKER = 'scytale-promote-decoy';
export type DecoyPromotionPhase = 'pending' | 'copied';

export interface DecoyPromotionJournal {
  v: 1;
  phase: DecoyPromotionPhase;
  sourceWitness: string | null;
  fenceToken: string | null;
}

function validHex(value: unknown, length: number): value is string {
  return typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(value);
}

export function decoyPromotionJournal(): DecoyPromotionJournal | null {
  try {
    const raw = localStorage.getItem(PROMOTE_MARKER);
    if (!raw) return null;
    // Previous uncommitted builds used bare phases. `copied` is safe to clean
    // up without re-copying; legacy pending is retained but cannot authorize a wipe.
    if (raw === 'copied') return { v: 1, phase: 'copied', sourceWitness: null, fenceToken: null };
    if (raw === 'pending' || raw === '1') {
      return { v: 1, phase: 'pending', sourceWitness: null, fenceToken: null };
    }
    const parsed = JSON.parse(raw) as Partial<DecoyPromotionJournal>;
    if (
      parsed.v !== 1 ||
      (parsed.phase !== 'pending' && parsed.phase !== 'copied') ||
      !validHex(parsed.sourceWitness, 64) ||
      !validHex(parsed.fenceToken, 32)
    ) return null;
    return parsed as DecoyPromotionJournal;
  } catch {
    return null;
  }
}

function persistPromotionJournal(journal: DecoyPromotionJournal): void {
  const encoded = JSON.stringify(journal);
  localStorage.setItem(PROMOTE_MARKER, encoded);
  if (localStorage.getItem(PROMOTE_MARKER) !== encoded) throw new Error('readback failed');
}

export function markPromoteDecoy(sourceWitness: string, fenceToken: string): DecoyPromotionJournal {
  if (!validHex(sourceWitness, 64) || !validHex(fenceToken, 32)) {
    throw new Error('Tresor konnte nicht sicher geöffnet werden.');
  }
  try {
    const existing = decoyPromotionJournal();
    if (existing?.phase === 'copied') return existing; // monotone: never regress
    if (existing) {
      if (existing.sourceWitness !== sourceWitness || existing.fenceToken !== fenceToken) {
        throw new Error('conflicting promotion');
      }
      return existing;
    }
    const journal: DecoyPromotionJournal = {
      v: 1,
      phase: 'pending',
      sourceWitness,
      fenceToken,
    };
    persistPromotionJournal(journal);
    broadcastDuressLockdown();
    return journal;
  } catch {
    // Do not reveal on the lock screen that this was a duress path.
    throw new Error('Tresor konnte nicht sicher geöffnet werden.');
  }
}

/** Advance the journal only after the complete canonical copy is durable. */
export function markPromoteDecoyCopied(fenceToken: string): DecoyPromotionJournal {
  try {
    const existing = decoyPromotionJournal();
    if (
      !existing ||
      !existing.fenceToken ||
      existing.fenceToken !== fenceToken ||
      !existing.sourceWitness
    ) throw new Error('journal mismatch');
    if (existing.phase === 'copied') return existing;
    const copied = { ...existing, phase: 'copied' as const };
    persistPromotionJournal(copied);
    return copied;
  } catch {
    throw new Error('Tresor konnte nicht sicher geöffnet werden.');
  }
}

export function decoyPromotionPhase(): DecoyPromotionPhase | null {
  return decoyPromotionJournal()?.phase ?? null;
}

export function promoteMarkerPresent(): boolean {
  return decoyPromotionPhase() !== null;
}
export function clearPromoteDecoy(fenceToken?: string): void {
  try {
    const existing = decoyPromotionJournal();
    if (existing?.phase === 'pending') return;
    if (fenceToken && existing?.fenceToken && existing.fenceToken !== fenceToken) return;
    localStorage.removeItem(PROMOTE_MARKER);
  } catch {
    /* ignore */
  }
}

/** Separate idempotent journal for cross-database duress removal. */
export const DURESS_REMOVE_MARKER = 'scytale-remove-decoy';
export function markDuressRemoval(): void {
  localStorage.setItem(DURESS_REMOVE_MARKER, 'pending');
  if (localStorage.getItem(DURESS_REMOVE_MARKER) !== 'pending') {
    throw new Error('Duress-Entfernung konnte nicht sicher vorbereitet werden.');
  }
}
export function duressRemovalMarkerPresent(): boolean {
  try {
    return localStorage.getItem(DURESS_REMOVE_MARKER) === 'pending';
  } catch {
    return false;
  }
}
export function clearDuressRemoval(): void {
  try {
    localStorage.removeItem(DURESS_REMOVE_MARKER);
  } catch {
    /* boot retries the idempotent neutralisation */
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
 * Duress → DECOY wipe: crypto-erase the REAL account and leave the app running so the caller can
 * promote the decoy into the canonical 'scytale' slot (vaultService.openDecoyAndWipeReal →
 * migrateVaultDb). Unlike wipeAccount, this deliberately does NOT set the onboarding RESET_MARKER
 * (the app stays open on the decoy, not fresh onboarding) and does NOT unregister the service worker.
 * It overwrites the real header (the wrapped DEK) best-effort FIRST for forensic hardening; it does
 * NOT delete the 'scytale' DB — the promotion migration CLEARS + overwrites 'scytale' with the decoy
 * content next, which both erases the real records and avoids a deleteDB-blocked hang. Forensically
 * sound for duress by construction: the real DEK derives only from the REAL passphrase, which a
 * coercer holding the duress passphrase does not have, so once the header is destroyed/overwritten
 * the sealed records are unrecoverable ciphertext. Honest limit: on flash/SSD the overwrite cannot
 * guarantee the original cells are gone (FTL wear-levelling) — the guarantee is key destruction, not
 * the physical overwrite. See SECURITY.md.
 */
export async function wipeRealForDecoy(): Promise<void> {
  try {
    await navigator.clearAppBadge?.();
  } catch {
    /* ignore */
  }
  // Drop the REAL account's push subscription so the decoy (which re-subscribes for its own inbox)
  // never receives the real account's pushes. Best-effort, bounded — the SW itself stays alive.
  await Promise.race([
    disablePush(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
  ]).catch(() => undefined);

  // Overwrite the real header (the active DB is still 'scytale' at the lock screen) to harden the
  // wrapped-DEK bytes, and delete the real badge store. 'scytale' itself is left for the migration
  // to clear + overwrite with the decoy content.
  await secureOverwriteHeader().catch(() => undefined);
  await Promise.race([
    deleteDB('scytale-badge').catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  ]);
  try {
    indexedDB.deleteDatabase('scytale-badge');
  } catch {
    /* ignore */
  }

  // Clear the real account's local prefs so no plaintext tell (e.g. a stored display name) lingers,
  // keeping only harmless UI prefs (language/theme) and the promotion/reset markers.
  try {
    for (const k of Object.keys(localStorage)) {
      if (
        k.startsWith('scytale-') &&
        !/lang|theme|locale/i.test(k) &&
        k !== PROMOTE_MARKER &&
        k !== RESET_MARKER
      ) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}
