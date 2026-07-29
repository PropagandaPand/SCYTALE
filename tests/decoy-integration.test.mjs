// Decoy STORAGE isolation — the plumbing that makes the decoy safe, exercised against a real (fake)
// IndexedDB. The pure-crypto invariants are in decoy.test.mjs; here we prove the database-level
// guarantees the duress flow depends on:
//   • withVaultDb('scytale-decoy', …) is ISOLATED — a write there is invisible to the active real
//     DB, and vice-versa (no cross-DB leak while both exist during arming/populating).
//   • switchVaultDb repoints the active database (real ↔ decoy).
//   • deleteVaultDb is SURGICAL — deleting one named vault leaves the other intact.
// The production duress path uses migrateVaultDb to clear/replace the canonical
// real slot without depending on a potentially blocked delete.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

// db.ts calls window.location.reload() only from a generation-conflict callback; shim it so a stray
// trigger can't crash the run. Never expected to fire in this suite.
globalThis.window = globalThis.window || { location: { reload() {} } };
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(String(key)) ?? null,
  setItem: (key, value) => storage.set(String(key), String(value)),
  removeItem: (key) => storage.delete(String(key)),
  clear: () => storage.clear(),
  key: (index) => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const aok = async (n, fn) => { try { ok(n, await fn()); } catch (e) { ok(`${n} [threw: ${e.message}]`, false); } };

console.log('\n[Decoy-Speicher-Isolation: withVaultDb / switchVaultDb / deleteVaultDb auf echtem IndexedDB]');

// Structurally valid stand-in envelopes. Promotion deliberately refuses a
// name-only/partial source, so the migration fixture includes every key-bearing
// field and a non-extractable device key.
const H = (tag) => ({
  version: 1,
  tag,
  argon2: { memorySize: 65536, iterations: 3, parallelism: 1 },
  salt: new Uint8Array(16).fill(tag.charCodeAt(0)),
  wrapIv: new Uint8Array(12).fill(tag.charCodeAt(tag.length - 1)),
  wrappedDek: new Uint8Array(48).fill(tag.length),
  deviceWrap: {
    iv: new Uint8Array(12).fill(tag.length + 1),
    ciphertext: new Uint8Array(48).fill(tag.length + 2),
  },
});
const decoyHeader = () => S.withVaultDb('scytale-decoy', (d) => d.get('meta', 'vault'));
const makeDeviceKey = () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

ok('aktive DB ist anfangs die echte (scytale)', S.currentDbName() === 'scytale');

// Write a REAL header into the active DB and a DISTINCT header into the ISOLATED decoy DB.
await S.saveHeader(H('REAL'));
await S.withVaultDb('scytale-decoy', async (d) => { await d.put('meta', H('DECOY'), 'vault'); });

// ── ISOLATION: neither database sees the other's write ────────────────────────
await aok('aktive (echte) DB liefert den ECHTEN Header, nicht den Decoy', async () => (await S.loadHeader())?.tag === 'REAL');
await aok('withVaultDb(decoy) liefert den DECOY-Header, nicht den echten', async () => (await decoyHeader())?.tag === 'DECOY');
await aok('beide DBs existieren nebeneinander (scytale)', () => S.vaultDbExists('scytale'));
await aok('beide DBs existieren nebeneinander (scytale-decoy)', () => S.vaultDbExists('scytale-decoy'));

// ── SWITCH: the active database follows switchVaultDb ─────────────────────────
await S.switchVaultDb('scytale-decoy');
ok('currentDbName ist nach dem Switch der Decoy', S.currentDbName() === 'scytale-decoy');
await aok('die aktive DB liest jetzt den DECOY-Header', async () => (await S.loadHeader())?.tag === 'DECOY');
await S.switchVaultDb('scytale'); // back to real for the wipe test

// ── SURGICAL WIPE: delete ONLY the real DB; the decoy must survive ────────────
// Low-level negative control for named deletion. The production promotion is
// exercised separately below and end-to-end in decoy-e2e.test.mjs.
await S.deleteVaultDb('scytale');
await aok('nach deleteVaultDb(scytale): die echte DB ist WEG', async () => (await S.vaultDbExists('scytale')) === false);
await aok('nach deleteVaultDb(scytale): der Decoy ÜBERLEBT (Header intakt)', async () => (await decoyHeader())?.tag === 'DECOY');
await S.switchVaultDb('scytale-decoy');
await aok('die aktive DB ist jetzt der Decoy und lesbar', async () => (await S.loadHeader())?.tag === 'DECOY');

// ── NEGATIVE CONTROL: the delete is real, not a no-op — deleting the decoy removes it too ──
await S.deleteVaultDb('scytale-decoy');
await aok('Negativkontrolle: deleteVaultDb(scytale-decoy) entfernt auch den Decoy', async () => (await S.vaultDbExists('scytale-decoy')) === false);

// ── PROMOTION MIGRATION: the decoy is moved into the canonical 'scytale' slot (no '…-decoy' name
//    survives a duress unlock), the real content is erased, and re-running is idempotent. ──
console.log('\n[Decoy-Promotion: migrateVaultDb kopiert Decoy → kanonisches "scytale", löscht Echtes]');
await S.switchVaultDb('scytale');
await S.saveHeader(H('REAL2'));
await S.saveRecord('r-real', { iv: new Uint8Array([9]), ct: new Uint8Array([9, 9]) });
const promotionDeviceKey = await makeDeviceKey();
await S.withVaultDb('scytale-decoy', async (d) => {
  await d.put('meta', H('DECOY2'), 'vault');
  await d.put('device', promotionDeviceKey, 'local_device_key');
  await d.put('records', { iv: new Uint8Array([7]), ct: new Uint8Array([7, 7]) }, 'r-decoy');
  for (let i = 0; i < 19; i++) {
    await d.put(
      'records',
      { iv: new Uint8Array([i]), ct: new Uint8Array([i, i]) },
      `batch-${i.toString().padStart(2, '0')}`,
    );
  }
});

const sourceEnvelope = await S.loadVaultDbEnvelope('scytale-decoy');
const promotionFence = {
  token: 'a'.repeat(32),
  sourceWitness: 'b'.repeat(64),
};
await S.fenceVaultDbWrites('scytale-decoy', promotionFence, sourceEnvelope.header);

await S.switchVaultDb('scytale-decoy');
let fencedWriteRejected = false;
try {
  await S.saveRecord('late-decoy-write', { iv: new Uint8Array([1]), ct: new Uint8Array([2]) });
} catch {
  fencedWriteRejected = true;
}
ok('persistenter Source-Fence blockiert normale Decoy-Writes vor dem Batch-Copy',
  fencedWriteRejected);
await S.switchVaultDb('scytale');

await S.migrateVaultDb('scytale-decoy', 'scytale', promotionFence, sourceEnvelope.header);
await aok('nach Migration trägt "scytale" den DECOY-Header (nicht mehr den echten)', async () => (await S.loadHeader())?.tag === 'DECOY2');
await aok('nach Migration hat "scytale" den DECOY-Record', async () => (await S.loadRecord('r-decoy')) !== undefined);
await aok('gepoolte Promotion überspringt auch über mehrere 8er-Batches keinen Record', async () => {
  for (let i = 0; i < 19; i++) {
    if (!(await S.loadRecord(`batch-${i.toString().padStart(2, '0')}`))) return false;
  }
  return true;
});
await aok('nach Migration ist der ECHTE Record aus "scytale" WEG (Store wurde geleert = Erase)', async () => (await S.loadRecord('r-real')) === undefined);
await aok('Migration lässt die Quelle (scytale-decoy) intakt — der Aufrufer löscht sie danach', async () => (await S.withVaultDb('scytale-decoy', (d) => d.get('meta', 'vault')))?.tag === 'DECOY2');

// Idempotent re-run (an interrupted promotion re-runs at boot): same canonical result, no error.
await S.migrateVaultDb('scytale-decoy', 'scytale', promotionFence, sourceEnvelope.header);
await aok('Migration ist idempotent (erneuter Lauf → gleicher kanonischer Zustand)', async () => (await S.loadHeader())?.tag === 'DECOY2');

// After the caller deletes the source, only the canonical 'scytale' remains — no '…-decoy' tell.
await S.deleteVaultDb('scytale-decoy');
await aok('nach vollständiger Promotion existiert KEINE "scytale-decoy" mehr (kein at-rest-Tell)', async () => (await S.vaultDbExists('scytale-decoy')) === false);
await aok('das kanonische "scytale" trägt weiterhin den Decoy-Inhalt', async () => (await S.loadHeader())?.tag === 'DECOY2');
await S.switchVaultDb('scytale');
await aok('Source-Fence wird nicht in den kanonischen Tresor kopiert', async () => {
  await S.saveRecord('post-promotion-write', { iv: new Uint8Array([1]), ct: new Uint8Array([2]) });
  return (await S.loadRecord('post-promotion-write')) !== undefined;
});

// Header settings are whole-record updates. A stale biometric/duress tab must
// lose its CAS instead of silently removing the other setting.
const staleHeaderA = await S.loadHeader();
const staleHeaderB = await S.loadHeader();
ok('erster Header-CAS setzt Decoy-Flag', await S.compareAndSwapHeader(
  staleHeaderA,
  { ...staleHeaderA, decoyArmed: true },
));
ok('zweiter Header-CAS mit altem Snapshot wird abgewiesen',
  !(await S.compareAndSwapHeader(staleHeaderB, {
    ...staleHeaderB,
    prf: {
      credentialId: new Uint8Array([1]),
      salt: new Uint8Array([2]),
      wrapIv: new Uint8Array(12),
      wrappedDek: new Uint8Array(48),
    },
  })));
const mergedHeader = await S.loadHeader();
ok('CAS-Merge bewahrt Decoy-Flag beim Hinzufügen des Biometrie-Wraps',
  await S.compareAndSwapHeader(mergedHeader, {
    ...mergedHeader,
    prf: {
      credentialId: new Uint8Array([1]),
      salt: new Uint8Array([2]),
      wrapIv: new Uint8Array(12),
      wrappedDek: new Uint8Array(48),
    },
  }) &&
  (await S.loadHeader()).decoyArmed === true &&
  !!(await S.loadHeader()).prf);
const cleanupHeader = await S.loadHeader();
const cleanedHeader = { ...cleanupHeader };
delete cleanedHeader.decoyArmed;
delete cleanedHeader.prf;
await S.compareAndSwapHeader(cleanupHeader, cleanedHeader);

const dbSource = readFileSync(new URL('../src/lib/db.ts', import.meta.url), 'utf8');
const migrationSource = dbSource.slice(
  dbSource.indexOf('export async function migrateVaultDb'),
  dbSource.indexOf('/** True for the transient', dbSource.indexOf('export async function migrateVaultDb')),
);
ok('Promotion kopiert große Tresore gebatcht statt per Store-getAll in den RAM',
  dbSource.includes('const VAULT_COPY_BATCH = 8') &&
  dbSource.includes('async function copyVaultStore') &&
  !migrationSource.includes('.getAll('));
ok('Promotion setzt vor dem Batch-Copy einen persistenten Source-Write-Fence',
  migrationSource.includes('ACCOUNT_PROMOTION_FENCE_KEY') &&
  !migrationSource.includes('ACCOUNT_RESTORE_LOCK_KEY'));

// A named but empty/corrupt source shell must never clear a good canonical target.
await S.withVaultDb('scytale-decoy', async () => undefined);
let emptySourceRejected = false;
try {
  await S.migrateVaultDb('scytale-decoy', 'scytale', promotionFence, sourceEnvelope.header);
} catch {
  emptySourceRejected = true;
}
await aok('leere Source wird vor dem Löschen des kanonischen Ziels abgewiesen', async () =>
  emptySourceRejected &&
  (await S.loadHeader())?.tag === 'DECOY2' &&
  (await S.loadRecord('post-promotion-write')) !== undefined);

// Header-aware probing must neither treat a schema-only shell as a vault nor
// queue a destructive delete behind another connection. The latter used to
// erase a freshly re-armed decoy as soon as the blocker eventually closed.
const heldOpen = indexedDB.open('scytale-decoy');
const heldDb = await new Promise((resolve, reject) => {
  heldOpen.onsuccess = () => resolve(heldOpen.result);
  heldOpen.onerror = () => reject(heldOpen.error);
});
ok('schema-only Decoy-Shell zählt nicht als vorhandener Tresor',
  (await S.loadVaultDbEnvelope('scytale-decoy')) === null);
await new Promise((resolve, reject) => {
  const tx = heldDb.transaction(['meta', 'device'], 'readwrite');
  tx.objectStore('meta').put(H('REARMED'), 'vault');
  tx.objectStore('device').put(promotionDeviceKey, 'local_device_key');
  tx.oncomplete = resolve;
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
});
heldDb.close();
await new Promise((resolve) => setTimeout(resolve, 20));
await aok('Header-Probe hinterlässt keinen verzögerten Delete, der Re-Arming zerstört', async () =>
  (await S.loadVaultDbEnvelope('scytale-decoy'))?.header.tag === 'REARMED');
await S.deleteVaultDb('scytale-decoy');

// The recovery phase is monotone. A delayed second submit may observe `copied`,
// but can never push it back to `pending` and authorize another canonical wipe.
const journalWitness = 'c'.repeat(64);
const journalToken = 'd'.repeat(32);
S.markPromoteDecoy(journalWitness, journalToken);
S.markPromoteDecoyCopied(journalToken);
S.markPromoteDecoy('e'.repeat(64), 'f'.repeat(32));
ok('Promotion-Journal kann von copied nicht auf pending zurückfallen',
  S.decoyPromotionJournal()?.phase === 'copied' &&
  S.decoyPromotionJournal()?.fenceToken === journalToken);
S.clearPromoteDecoy(journalToken);

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const wipeSource = readFileSync(new URL('../src/lib/wipe.ts', import.meta.url), 'utf8');
const setupSource = readFileSync(new URL('../src/DuressSetup.tsx', import.meta.url), 'utf8');
const markSource = wipeSource.slice(
  wipeSource.indexOf('export function markPromoteDecoy'),
  wipeSource.indexOf('/** Advance the journal', wipeSource.indexOf('export function markPromoteDecoy')),
);
ok('Duress-Journal signalisiert sofort Cross-Tab-Lockdown und App hört auf Broadcast+Storage',
  markSource.indexOf('persistPromotionJournal(journal)') <
  markSource.indexOf('broadcastDuressLockdown()') &&
  appSource.includes('DURESS_LOCKDOWN_CHANNEL') &&
  appSource.includes("window.addEventListener('storage', onStorage)") &&
  appSource.includes("document.documentElement.classList.add('privacy-curtain-on')"));
ok('Duress-Felder werden nicht als Passwortänderung an Passwortmanager angeboten',
  setupSource.includes("autoComplete={autoComplete}") &&
  setupSource.includes("data-1p-ignore=") &&
  setupSource.includes("data-lpignore=") &&
  setupSource.includes("data-bwignore=") &&
  setupSource.includes("duress, setDuress, 'off'"));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
