/**
 * Bridge between App's origin-wide Web Lock and the currently mounted Messenger.
 *
 * React effect cleanup cannot be awaited. Without this bridge App could release
 * the Web Lock after unmount while an old IndexedDB/ratchet continuation was
 * still running, then immediately mount a second writer. The lock screen still
 * renders synchronously; only lock ownership waits for the old generation to
 * become quiescent.
 */

type RuntimeQuiescer = () => Promise<void>;

let activeQuiescer: RuntimeQuiescer | null = null;

export function registerVaultRuntimeQuiescer(
  quiescer: RuntimeQuiescer,
): () => void {
  activeQuiescer = quiescer;
  return () => {
    if (activeQuiescer === quiescer) activeQuiescer = null;
  };
}

export function beginVaultRuntimeQuiesce(): Promise<void> {
  const quiescer = activeQuiescer;
  if (!quiescer) return Promise.resolve();
  try {
    return Promise.resolve(quiescer());
  } catch (error) {
    return Promise.reject(error);
  }
}
