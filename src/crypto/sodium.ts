/**
 * Lazy, single-instance libsodium initialisation. Every consumer awaits
 * `getSodium()` — the WASM module is loaded and readied exactly once.
 */
import _sodium from 'libsodium-wrappers-sumo';

export type Sodium = typeof _sodium;

let readyP: Promise<Sodium> | null = null;

export function getSodium(): Promise<Sodium> {
  if (!readyP) readyP = _sodium.ready.then(() => _sodium);
  return readyP;
}
