// Full duress → decoy lifecycle against fake-indexeddb:
// arm from the real account, prove ordinary real unlock still works, populate
// isolated decoy state, enter the duress passphrase at the lock screen, then
// prove promotion erased real records and left one canonical decoy account.
import 'fake-indexeddb/auto';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(String(key)) ?? null,
  setItem: (key, value) => storage.set(String(key), String(value)),
  removeItem: (key) => storage.delete(String(key)),
  clear: () => storage.clear(),
  key: (index) => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};
globalThis.window = {};
globalThis.location = { origin: 'https://test.invalid', reload() {} };
globalThis.navigator.clearAppBadge = async () => {};

const S = await import('./.bundle/entry.js');

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};
const aok = async (name, fn) => {
  try {
    ok(name, await fn());
  } catch (error) {
    ok(`${name} [threw: ${error.message}]`, false);
  }
};

console.log('\n[Duress → Decoy E2E: armieren, befüllen, Real löschen, Decoy promoten]');

const REAL = 'echte-passphrase-fuer-e2e';
const DURESS = 'notfall-code-2026';
const aad = new TextEncoder().encode('scytale:decoy-e2e:v1');

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.deleteVaultDb('scytale-decoy');
await S.switchVaultDb('scytale');

const realDek = await S.createBoundVault(REAL);
await S.saveRecord(
  'proof-real',
  await S.seal(realDek, new TextEncoder().encode('REAL-SECRET'), aad),
);

// No length/strength policy on the duress word — it is a coercion trigger, not a secret; a short
// word arms fine. It only has to differ from the real passphrase.
await S.setDuressPassword(REAL, 'x');
ok('kurzes Duress-Passwort wird akzeptiert (keine Längen-Richtlinie)',
  (await S.duressEnabled()) && (await S.vaultDbExists('scytale-decoy')));

// NEGATIVE CONTROL — the one functional rule that stays: duress must differ from the real
// passphrase (else a normal login would fire the wipe). Rejected BEFORE the existing decoy is
// touched, so the 'x' decoy above survives this attempt.
let equalsRealRejected = false;
try { await S.setDuressPassword(REAL, REAL); } catch (e) { equalsRealRejected = e instanceof S.DuressEqualsRealError; }
ok('Negativkontrolle: Duress == echtes Passwort wird weiterhin abgewiesen',
  equalsRealRejected && (await S.vaultDbExists('scytale-decoy')));

await S.setDuressPassword(REAL, DURESS);
ok('Real-Header ist nach dem Armieren markiert', await S.duressEnabled());
ok('separate Decoy-Datenbank wurde angelegt', await S.vaultDbExists('scytale-decoy'));

// Removal must not use a blocked deleteDatabase request: such a request remains
// queued and can erase a new decoy long after remove() appeared to succeed.
const heldOpen = indexedDB.open('scytale-decoy');
const heldDecoyDb = await new Promise((resolve, reject) => {
  heldOpen.onsuccess = () => resolve(heldOpen.result);
  heldOpen.onerror = () => reject(heldOpen.error);
});
await S.removeDuressPassword(REAL);
ok('Removal neutralisiert den Decoy trotz fremder offener DB-Verbindung',
  !(await S.duressEnabled()) && (await S.loadVaultDbEnvelope('scytale-decoy')) === null);
ok('Removal-Journal ist erst nach vollständiger Neutralisierung gelöscht',
  !S.duressRemovalMarkerPresent());
await S.setDuressPassword(REAL, DURESS);
heldDecoyDb.close();
await new Promise((resolve) => setTimeout(resolve, 30));
ok('späteres Schließen des Blockers löscht einen neu armierten Decoy nicht',
  (await S.loadVaultDbEnvelope('scytale-decoy')) !== null && await S.duressEnabled());

const ordinaryRealDek = await S.unlockBoundVault(REAL);
await aok('normale echte Passphrase öffnet weiterhin den echten Datensatz', async () => {
  const record = await S.loadRecord('proof-real');
  return new TextDecoder().decode(await S.open(ordinaryRealDek, record, aad)) === 'REAL-SECRET';
});
ok('normales echtes Entsperren löst keine Promotion aus', !S.promoteMarkerPresent());

const decoyDek = await S.openDecoyForPopulate(DURESS);
await S.switchVaultDb('scytale-decoy');
await S.saveRecord(
  'proof-decoy',
  await S.seal(decoyDek, new TextEncoder().encode('DECOY-CONTENT'), aad),
);
await S.switchVaultDb('scytale');

const heldPromotionOpen = indexedDB.open('scytale-decoy');
const heldPromotionDb = await new Promise((resolve, reject) => {
  heldPromotionOpen.onsuccess = () => resolve(heldPromotionOpen.result);
  heldPromotionOpen.onerror = () => reject(heldPromotionOpen.error);
});
const promotedDek = await S.unlockBoundVault(DURESS);
ok('Duress-Passphrase endet auf der kanonischen Datenbank', S.currentDbName() === 'scytale');
ok('blockierte Source-Löschung behält das copied-Journal und gibt dennoch den kanonischen Decoy frei',
  S.decoyPromotionJournal()?.phase === 'copied');
ok('Real-Header-Marker wurde nicht in das promovierte Decoy übernommen', !(await S.duressEnabled()));
ok('echter Datensatz wurde durch die Promotion entfernt', (await S.loadRecord('proof-real')) === undefined);
await aok('promovierter Decoy-Datensatz ist mit dem zurückgegebenen DEK lesbar', async () => {
  const record = await S.loadRecord('proof-decoy');
  return new TextDecoder().decode(await S.open(promotedDek, record, aad)) === 'DECOY-CONTENT';
});

heldPromotionDb.close();
await S.completeDecoyPromotion();
ok('Recovery-Marker ist erst nach bestätigter Source-Löschung entfernt', !S.promoteMarkerPresent());
ok('Decoy-Namensraum ist nach bestätigter Löschung verschwunden', !(await S.vaultDbExists('scytale-decoy')));
await S.completeDecoyPromotion();
ok('Recovery-Abschluss ist nach vollständiger Promotion idempotent', !S.promoteMarkerPresent());

// Regression: if deletion of the already-copied source was blocked, recovery must only retry the
// delete. Re-copying the stale source would erase messages written to the canonical account after
// the successful duress unlock.
await S.saveRecord(
  'post-promotion-new',
  await S.seal(promotedDek, new TextEncoder().encode('NEW-CANONICAL-DATA'), aad),
);
await S.withVaultDb('scytale-decoy', async (d) => {
  await d.put('meta', { version: 1, tag: 'STALE-SOURCE' }, 'vault');
  await d.put(
    'records',
    { iv: new Uint8Array([3]), ct: new Uint8Array([3, 3]) },
    'stale-source-only',
  );
});
localStorage.setItem(S.PROMOTE_MARKER, 'copied');
await S.completeDecoyPromotion();
await aok('Recovery-Phase "copied" erhält neuere kanonische Daten', async () => {
  const record = await S.loadRecord('post-promotion-new');
  return new TextDecoder().decode(await S.open(promotedDek, record, aad)) === 'NEW-CANONICAL-DATA';
});
ok('Recovery-Phase "copied" kopiert veraltete Source-Daten NICHT erneut',
  (await S.loadRecord('stale-source-only')) === undefined);
ok('Recovery-Phase "copied" entfernt nur den verbliebenen Source-Namensraum',
  !(await S.vaultDbExists('scytale-decoy')));
ok('Recovery-Journal wird erst nach bestätigter Source-Löschung entfernt',
  !S.promoteMarkerPresent());

// A pending journal with an empty name-only source must fail closed and
// preserve the canonical vault. Mere IndexedDB name existence is not authority
// to overwrite the canonical account.
await S.withVaultDb('scytale-decoy', async () => undefined);
S.markPromoteDecoy('a'.repeat(64), 'b'.repeat(32));
let missingSourceRejected = false;
try {
  await S.completeDecoyPromotion();
} catch {
  missingSourceRejected = true;
}
ok('Recovery "pending" mit leerer Source bricht ab, statt den kanonischen Tresor zu leeren',
  missingSourceRejected && (await S.loadRecord('post-promotion-new')) !== undefined);
ok('fehlgeschlagene Recovery behält das Journal für eine explizite Reparatur',
  S.promoteMarkerPresent());
localStorage.removeItem(S.PROMOTE_MARKER);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
