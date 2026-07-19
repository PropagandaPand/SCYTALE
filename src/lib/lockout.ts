/**
 * Brute-force lockout. After too many wrong passphrases the vault locks for an
 * escalating cooldown, persisted in IndexedDB so it survives a reload. Counters
 * hold no secrets, so they're stored in plaintext.
 */
import { kvGet, kvSet } from './db';

const KEY = 'lockout';
const MAX_ATTEMPTS = 5;
const STEP_SECONDS = 30;
const MAX_SECONDS = 300;

interface LockoutState {
  fails: number;
  until: number; // epoch ms
}

export interface LockoutInfo {
  remainingMs: number;
  fails: number;
  attemptsLeft: number;
}

function toInfo(st: LockoutState): LockoutInfo {
  return {
    remainingMs: Math.max(0, st.until - Date.now()),
    fails: st.fails,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - st.fails),
  };
}

export async function lockoutStatus(): Promise<LockoutInfo> {
  const st = (await kvGet<LockoutState>(KEY)) ?? { fails: 0, until: 0 };
  return toInfo(st);
}

export async function registerFailure(): Promise<LockoutInfo> {
  const st = (await kvGet<LockoutState>(KEY)) ?? { fails: 0, until: 0 };
  st.fails += 1;
  if (st.fails >= MAX_ATTEMPTS) {
    const lockSeconds = Math.min(MAX_SECONDS, STEP_SECONDS * 2 ** (st.fails - MAX_ATTEMPTS));
    st.until = Date.now() + lockSeconds * 1000;
  }
  await kvSet(KEY, st);
  return toInfo(st);
}

export async function clearFailures(): Promise<void> {
  await kvSet(KEY, { fails: 0, until: 0 } satisfies LockoutState);
}
