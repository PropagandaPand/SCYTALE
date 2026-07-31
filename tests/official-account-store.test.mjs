import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

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
const rejectsAs = async (operation, name) => {
  try {
    await operation();
    return false;
  } catch (error) {
    return error?.name === name;
  }
};

console.log('\n[Official-Admin Trust-Cache: versiegelt, monoton und fail-closed]');

ok('Trust-Record ist für eine spätere Root-Rotation nach Root-Key-ID getrennt',
  S.OFFICIAL_ACCOUNT_TRUST_RECORD_KEY.endsWith(`:${S.OFFICIAL_ACCOUNT_ROOT_KEY_ID}`));

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
const dek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);
const root = await S.generateIdentity();
const admin = await S.generateIdentity();
const prekeys = await S.createFreshPreKeyState(admin);
const bundle = await S.encodeBundle(S.currentBundle(admin, prekeys));
const now = Date.now();

async function trusted(sequence, overrides = {}, verificationOverrides = {}) {
  const body = {
    schema: S.OFFICIAL_ACCOUNT_MANIFEST_SCHEMA,
    sequence,
    rootKeyId: S.OFFICIAL_ACCOUNT_ROOT_KEY_ID,
    alias: S.OFFICIAL_ACCOUNT_ALIAS,
    role: S.OFFICIAL_ACCOUNT_ROLE,
    displayName: S.OFFICIAL_ACCOUNT_DISPLAY_NAME,
    badge: S.OFFICIAL_ACCOUNT_BADGE,
    status: 'active',
    masterPub: S.base64urlEncode(admin.master.publicKey),
    bundle,
    deviceList: null,
    deviceEpoch: admin.epoch,
    deviceListVersion: 0,
    notBefore: now - 60_000,
    notAfter: now + 30 * 24 * 60 * 60 * 1000,
    revokedMasters: [],
    ...overrides,
  };
  const manifest = {
    ...body,
    signature: S.base64urlEncode(
      await S.sign(S.officialAccountSigningBytes(body), root.master.privateKey),
    ),
  };
  return S.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: root.master.publicKey,
    now,
    ...verificationOverrides,
  });
}

const verification = { rootPublicKey: root.master.publicKey, now };
const v1 = await trusted(1);
await S.saveOfficialAccountTrust(dek, v1, verification);
const loaded1 = await S.loadOfficialAccountTrust(dek, verification);
ok('vollständig geprüfter Stand überlebt versiegelten Cache-Roundtrip',
  loaded1?.sequence === 1 &&
  loaded1.current === true &&
  loaded1.digest === v1.digest &&
  S.isOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, loaded1));

const raw = await S.loadRecord(S.OFFICIAL_ACCOUNT_TRUST_RECORD_KEY);
ok('Cache liegt nicht als lesbares Manifest oder admin-Boolean in IndexedDB',
  raw?.ct instanceof Uint8Array &&
  !new TextDecoder().decode(raw.ct).includes('ThePhantomPuppet') &&
  !new TextDecoder().decode(raw.ct).includes('ADMIN'));

const v2 = await trusted(2);
await S.saveOfficialAccountTrust(dek, v2, verification);
const lowerResult = await S.saveOfficialAccountTrust(dek, v1, verification);
ok('niedrigere Sequenz kann einen gespeicherten Floor nicht zurückrollen',
  lowerResult.sequence === 2 &&
  (await S.loadOfficialAccountTrust(dek, verification))?.sequence === 2);

const v2Equivocation = await trusted(2, {
  notAfter: now + 31 * 24 * 60 * 60 * 1000,
});
ok('gleiche Sequenz mit anderem signierten Inhalt wird nicht überschrieben',
  await rejectsAs(
    () => S.saveOfficialAccountTrust(dek, v2Equivocation, verification),
    'OfficialAccountTrustCorruptError',
  ) &&
  (await S.loadOfficialAccountTrust(dek, verification))?.digest === v2.digest);

const v4 = await trusted(4);
const v5 = await trusted(5);
await Promise.all([
  S.saveOfficialAccountTrust(dek, v4, verification),
  S.saveOfficialAccountTrust(dek, v5, verification),
]);
ok('konkurrierende Tabs konvergieren per CAS auf den höchsten gültigen Stand',
  (await S.loadOfficialAccountTrust(dek, verification))?.sequence === 5);

const expiredFloor = await trusted(6, {
  notBefore: now - 2 * 24 * 60 * 60 * 1000,
  notAfter: now - 11 * 60 * 1000,
}, { requireCurrent: false });
await S.saveOfficialAccountTrust(dek, expiredFloor, verification);
const loadedExpiredFloor = await S.loadOfficialAccountTrust(dek, verification);
ok('abgelaufener höherer Stand bleibt als Rollback-Floor, autorisiert aber keinen Badge',
  loadedExpiredFloor?.sequence === 6 &&
  loadedExpiredFloor.current === false &&
  !S.isOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, loadedExpiredFloor));
ok('älterer noch gültiger Stand kann einen abgelaufenen höheren Floor nicht wiederbeleben',
  (await S.saveOfficialAccountTrust(dek, v5, verification)).sequence === 6);

const v7 = await trusted(7);
await S.saveOfficialAccountTrust(dek, v7, verification);
ok('ein gültiger Cache unter einem angehobenen Release-Floor wird nicht autorisiert',
  (await S.loadOfficialAccountTrust(dek, {
    ...verification,
    minimumSequence: 8,
  }))?.current === false);
const v8 = await trusted(8);
await S.saveOfficialAccountTrust(dek, v8, {
  ...verification,
  minimumSequence: 8,
});
ok('ein angehobener Release-Floor kann den alten Cache ohne Vault-Löschung ersetzen',
  (await S.loadOfficialAccountTrust(dek, {
    ...verification,
    minimumSequence: 8,
  }))?.sequence === 8);

ok('der Store re-verifiziert auch typisierte Kandidaten vor dem Schreiben',
  await rejectsAs(
    () => S.saveOfficialAccountTrust(dek, { ...v8, digest: v7.digest }, {
      ...verification,
      minimumSequence: 8,
    }),
    'OfficialAccountTrustCorruptError',
  ));

const revoked9 = await trusted(9, { status: 'revoked' });
await S.saveOfficialAccountTrust(dek, revoked9, verification);
const loadedRevoked = await S.loadOfficialAccountTrust(dek, verification);
ok('höherer Widerruf bleibt als Floor gespeichert und entfernt den Badge',
  loadedRevoked?.sequence === 9 &&
  loadedRevoked.manifest.status === 'revoked' &&
  !S.isOfficialAdminContact(
    { peerMasterPub: admin.master.publicKey },
    loadedRevoked,
  ) &&
  S.isRevokedOfficialAdminContact(
    { peerMasterPub: admin.master.publicKey },
    loadedRevoked,
  ));
const replacementAdmin = await S.generateIdentity();
const replacementPrekeys = await S.createFreshPreKeyState(replacementAdmin);
const replacementBundle = await S.encodeBundle(
  S.currentBundle(replacementAdmin, replacementPrekeys),
);
const replacement10 = await trusted(10, {
  masterPub: S.base64urlEncode(replacementAdmin.master.publicKey),
  bundle: replacementBundle,
  deviceEpoch: replacementAdmin.epoch,
});
await S.saveOfficialAccountTrust(dek, replacement10, verification);
const loadedReplacement = await S.loadOfficialAccountTrust(dek, verification);
ok('root-signierte Revoked-Master bleiben nach aktivem Ersatz dauerhaft erhalten',
  loadedReplacement?.sequence === 10 &&
  S.isOfficialAdminContact(
    { peerMasterPub: replacementAdmin.master.publicKey },
    loadedReplacement,
  ) &&
  S.isRevokedOfficialAdminContact(
    { peerMasterPub: admin.master.publicKey },
    loadedReplacement,
  ));
const forbiddenReactivation = await trusted(11);
ok('ein einmal widerrufener Master kann nicht still wieder active werden',
  await rejectsAs(
    () => S.saveOfficialAccountTrust(dek, forbiddenReactivation, verification),
    'OfficialAccountTrustCorruptError',
  ));

// Fix A: a foreign master that was NEVER a revoked head — its tombstone can only
// come from a successor's signed revokedMasters declaration (the back-fill path,
// covering a client that was offline for the transient revoked head).
const foreignW = await S.generateIdentity();
const byteCmp = (a, b) => {
  for (let i = 0; i < 32; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
const carriedSet = [admin.master.publicKey, foreignW.master.publicKey]
  .slice()
  .sort(byteCmp)
  .map(S.base64urlEncode);
const declaring12 = await trusted(12, {
  masterPub: S.base64urlEncode(replacementAdmin.master.publicKey),
  bundle: replacementBundle,
  deviceEpoch: replacementAdmin.epoch,
  revokedMasters: carriedSet,
});
await S.saveOfficialAccountTrust(dek, declaring12, verification);
const loadedDeclaring = await S.loadOfficialAccountTrust(dek, verification);
ok('ein nur per signierter revokedMasters deklarierter Fremd-Master wird dauerhaft getombstoned',
  loadedDeclaring?.sequence === 12 &&
  S.isRevokedOfficialAdminContact({ peerMasterPub: foreignW.master.publicKey }, loadedDeclaring) &&
  S.isRevokedOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, loadedDeclaring) &&
  S.isOfficialAdminContact({ peerMasterPub: replacementAdmin.master.publicKey }, loadedDeclaring));

const droppingW = await trusted(13, {
  masterPub: S.base64urlEncode(replacementAdmin.master.publicKey),
  bundle: replacementBundle,
  deviceEpoch: replacementAdmin.epoch,
  revokedMasters: [S.base64urlEncode(admin.master.publicKey)],
});
ok('ein Head, der einen bekannten deklarierten Tombstone fallen lässt, wird abgewiesen (Monotonie)',
  await rejectsAs(
    () => S.saveOfficialAccountTrust(dek, droppingW, verification),
    'OfficialAccountTrustCorruptError',
  ) &&
  S.isRevokedOfficialAdminContact(
    { peerMasterPub: foreignW.master.publicKey },
    await S.loadOfficialAccountTrust(dek, verification),
  ));

const backupSource = readFileSync(new URL('../src/lib/backup.ts', import.meta.url), 'utf8');
ok('Backup-Restore übernimmt nur den aktuellen lokalen Trust-Floor, nie einen Backup-Boolean',
  backupSource.includes('retainedOfficialAccountTrust') &&
  backupSource.includes('OFFICIAL_ACCOUNT_TRUST_RECORD_KEY') &&
  !/blob\.(?:admin|officialAccount|officialTrust)/.test(backupSource));

await S.saveRecord(S.OFFICIAL_ACCOUNT_TRUST_RECORD_KEY, {
  iv: crypto.getRandomValues(new Uint8Array(12)),
  ct: crypto.getRandomValues(new Uint8Array(64)),
});
ok('Cache-Korruption wird nicht still als leerer Rollback-Floor behandelt',
  await rejectsAs(
    () => S.loadOfficialAccountTrust(dek, verification),
    'OfficialAccountTrustCorruptError',
  ));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
