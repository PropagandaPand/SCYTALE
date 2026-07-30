/**
 * Origin-wide single-writer lock for the unlocked vault runtime.
 *
 * The Double Ratchet state is persisted per contact. Two simultaneously unlocked tabs could both
 * load the same sending chain key and encrypt different plaintexts before either sees the other's
 * write. Because the message IV is deterministically derived from that key, this would reuse an
 * AES-GCM (key, nonce) pair and break confidentiality/authenticity.
 *
 * Web Locks are coordinated by the browser across every same-origin tab and worker. We therefore
 * fail CLOSED when the API is unavailable or another tab owns the lock: only the holder may mount
 * Messenger, open relay sockets, or mutate ratchets. The lock is released on app lock/unmount.
 */

const VAULT_RUNTIME_LOCK_NAME = 'scytale-vault-runtime-v1';

interface ExclusiveLockApi {
  request(
    name: string,
    options: { mode: 'exclusive'; ifAvailable: true },
    callback: (lock: unknown | null) => Promise<void>,
  ): Promise<unknown>;
}

export interface VaultRuntimeLockManager {
  acquire(): Promise<boolean>;
  release(): void;
  releaseAfter(quiescence: Promise<unknown>): void;
  held(): boolean;
}

export function createVaultRuntimeLockManager(
  api: ExclusiveLockApi | undefined,
): VaultRuntimeLockManager {
  let lockHeld = false;
  let releaseHold: (() => void) | null = null;
  let releasePending = false;
  let releaseFinished: Promise<void> | null = null;
  let finishRelease: (() => void) | null = null;
  let acquisition: Promise<boolean> | null = null;

  const acquire = (): Promise<boolean> => {
    if (lockHeld && !releasePending) return Promise.resolve(true);
    // A lock callback releases on a microtask after its hold promise resolves. Never let a rapid
    // lock→unlock→unlock sequence mistake that dying ownership for a new session's live lock.
    if (releasePending && releaseFinished) return releaseFinished.then(acquire);
    if (acquisition) return acquisition;
    if (!api) return Promise.resolve(false);

    let settle!: (value: boolean) => void;
    const result = new Promise<boolean>((resolve) => {
      settle = resolve;
    });
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Do not await the request here: on success its callback intentionally remains pending for the
    // whole unlocked session. `result` resolves as soon as ownership is known.
    try {
      void api
        .request(
          VAULT_RUNTIME_LOCK_NAME,
          { mode: 'exclusive', ifAvailable: true },
          async (lock) => {
            if (!lock) {
              settle(false);
              return;
            }
            lockHeld = true;
            releasePending = false;
            releaseHold = release;
            releaseFinished = new Promise<void>((resolve) => {
              finishRelease = resolve;
            });
            settle(true);
            await hold;
          },
        )
        .catch(() => settle(false))
        .finally(() => {
          // A Web Lock is not actually available to a new request until the
          // outer request promise has settled. Resolve rapid re-acquisition
          // waiters here, not merely when our callback's hold promise ends.
          releaseHold = null;
          lockHeld = false;
          releasePending = false;
          finishRelease?.();
          finishRelease = null;
          releaseFinished = null;
        });
    } catch {
      settle(false);
    }

    acquisition = result.finally(() => {
      acquisition = null;
    });
    return acquisition;
  };

  const releaseAfter = (quiescence: Promise<unknown>): void => {
    if (!releaseHold || releasePending) return;
    releasePending = true;
    const finish = releaseHold;
    void Promise.resolve(quiescence)
      .catch(() => undefined)
      .finally(finish);
  };

  return {
    acquire,
    release() {
      releaseAfter(Promise.resolve());
    },
    releaseAfter(quiescence) {
      releaseAfter(quiescence);
    },
    held() {
      return lockHeld;
    },
  };
}

const browserLockApi =
  typeof navigator !== 'undefined' && navigator.locks
    ? (navigator.locks as unknown as ExclusiveLockApi)
    : undefined;
const manager = createVaultRuntimeLockManager(browserLockApi);

export const acquireVaultRuntimeLock = (): Promise<boolean> => manager.acquire();
export const releaseVaultRuntimeLock = (): void => manager.release();
export const releaseVaultRuntimeLockAfter = (
  quiescence: Promise<unknown>,
): void => manager.releaseAfter(quiescence);
export const vaultRuntimeLockHeld = (): boolean => manager.held();
