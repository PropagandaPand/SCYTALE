/**
 * Lazy, single-instance libsodium initialisation. The WASM module is loaded via
 * dynamic import(), so it lands in its own chunk and is NOT part of the initial
 * app shell — the lock screen paints before ~200 KB of crypto is fetched, and
 * libsodium loads in the background while the user types their passphrase.
 */
export type Sodium = typeof import('libsodium-wrappers-sumo').default;

let readyP: Promise<Sodium> | null = null;

export function getSodium(): Promise<Sodium> {
  if (!readyP) {
    readyP = import('libsodium-wrappers-sumo').then(async (m) => {
      await m.default.ready;
      return m.default;
    });
  }
  return readyP;
}
