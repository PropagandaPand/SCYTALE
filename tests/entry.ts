/**
 * Bundle entry for the Node test suites.
 *
 * The app code is browser-oriented (IndexedDB, Web Crypto, React), but the
 * crypto and conversation layers are deliberately transport- and
 * storage-agnostic, so they run under Node once bundled. `tests/run.mjs` bundles
 * this file with esbuild and each suite imports the result.
 *
 * Everything security-relevant that a suite needs must be re-exported here.
 */
export * from '../src/crypto/index';
export * from '../src/crypto/sodium';
export * from '../src/lib/session';
export { findSignedPreKey, consumeOneTimePreKey, currentBundle, ownSpkPublic } from '../src/lib/prekeys';
export { aggregateDelivery, hasMessage } from '../src/lib/messages';
