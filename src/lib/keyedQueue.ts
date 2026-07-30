/**
 * Small keyed serial queue for complete read/modify/write operations.
 *
 * Serialising only the final IndexedDB put is insufficient when callers build a
 * replacement from an older in-memory snapshot. `run` keeps the whole mutation
 * ordered per key while unrelated rooms continue in parallel; `runMany` makes
 * a move between two keys one deterministic barrier for both namespaces.
 */
export interface KeyedSerialQueue {
  run<T>(key: string, task: () => Promise<T>): Promise<T>;
  runMany<T>(keys: readonly string[], task: () => Promise<T>): Promise<T>;
  drain(): Promise<void>;
  pending(): number;
}

export function createKeyedSerialQueue(): KeyedSerialQueue {
  const tails = new Map<string, Promise<unknown>>();

  function runMany<T>(
    keys: readonly string[],
    task: () => Promise<T>,
  ): Promise<T> {
    // Scheduling is synchronous: after the unique, sorted key set is derived,
    // every key points at the SAME tail before another caller can enqueue. A
    // two-room migration therefore cannot deadlock with another migration that
    // names the rooms in reverse order, and a one-room mutation observes the
    // migration as one indivisible queue entry.
    const lockedKeys = [...new Set(keys)].sort();
    if (lockedKeys.length === 0) return Promise.resolve().then(task);

    const predecessors = [
      ...new Set(
        lockedKeys
          .map((key) => tails.get(key))
          .filter((tail): tail is Promise<unknown> => tail !== undefined),
      ),
    ];
    const run = Promise.all(
      predecessors.map((tail) => tail.catch(() => undefined)),
    ).then(task);
    const tail = run.catch(() => undefined);
    for (const key of lockedKeys) tails.set(key, tail);
    void tail.then(() => {
      for (const key of lockedKeys) {
        if (tails.get(key) === tail) tails.delete(key);
      }
    });
    return run;
  }

  return {
    run<T>(key: string, task: () => Promise<T>): Promise<T> {
      return runMany([key], task);
    },

    runMany,

    async drain(): Promise<void> {
      // A completing task may enqueue a successor. Drain to a fixed point.
      while (tails.size > 0) {
        const snapshot = [...tails.values()];
        await Promise.all(snapshot.map((tail) => tail.catch(() => undefined)));
      }
    },

    pending(): number {
      return tails.size;
    },
  };
}
