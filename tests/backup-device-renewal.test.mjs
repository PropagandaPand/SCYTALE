import 'fake-indexeddb/auto';
import * as S from './.bundle/entry.js';

let pass = 0;
let fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};
const same = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
const throwsNamed = async (fn, name) => {
  try {
    await fn();
    return false;
  } catch (error) {
    return error?.name === name;
  }
};

function ownEntry(identity, prekeys) {
  return {
    signPub: identity.sign.publicKey,
    dhPub: identity.dh.publicKey,
    deviceCert: identity.deviceCert,
    signedPreKey: S.ownSpkPublic(prekeys),
    protocolVersion: S.PROTOCOL_VERSION,
  };
}

async function linkedDeviceFor(primary) {
  const seed = await S.generateIdentity();
  const identity = {
    ...seed,
    master: {
      publicKey: primary.master.publicKey,
      privateKey: new Uint8Array(0),
    },
    epoch: primary.epoch,
    deviceCert: await S.signDeviceCert(
      primary.master.privateKey,
      primary.epoch,
      seed.sign.publicKey,
      seed.dh.publicKey,
    ),
  };
  return {
    identity,
    prekeys: await S.createFreshPreKeyState(identity),
  };
}

console.log('\n[Backup restore renews every device-scoped secret]');

const source = await S.generateIdentity();
const sourcePrekeys = await S.createFreshPreKeyState(source);
const linked = await linkedDeviceFor(source);
const sourceList = await S.signDeviceList(
  source.master.privateKey,
  source.master.publicKey,
  source.epoch,
  7,
  [ownEntry(source, sourcePrekeys), ownEntry(linked.identity, linked.prekeys)],
);

const restored = await S.regenerateBackupCryptoForRestore(
  source,
  sourcePrekeys,
  sourceList,
);

ok('stabiler Master und Epoch bleiben der Recovery-Anker',
  same(restored.identity.master.publicKey, source.master.publicKey) &&
    same(restored.identity.master.privateKey, source.master.privateKey) &&
    restored.identity.epoch === source.epoch);
ok('Device-Sign- und Device-DH-Keypair sind frisch',
  !same(restored.identity.sign.publicKey, source.sign.publicKey) &&
    !same(restored.identity.sign.privateKey, source.sign.privateKey) &&
    !same(restored.identity.dh.publicKey, source.dh.publicKey) &&
    !same(restored.identity.dh.privateKey, source.dh.privateKey));
ok('frisches Device-Cert ist vom erhaltenen Master signiert',
  await S.verifyDeviceCert(
    restored.identity.master.publicKey,
    restored.identity.epoch,
    restored.identity.sign.publicKey,
    restored.identity.dh.publicKey,
    restored.identity.deviceCert,
  ));

const sourceOpks = new Set(
  await Promise.all(sourcePrekeys.oneTimePreKeys.map((opk) => S.b64encode(opk.keyPair.privateKey))),
);
const restoredOpks = await Promise.all(
  restored.prekeys.oneTimePreKeys.map((opk) => S.b64encode(opk.keyPair.privateKey)),
);
ok('SPK und alle OPKs werden neu erzeugt, Zähler starten im neuen Device-Namespace',
  !same(
    restored.prekeys.signedPreKey.keyPair.privateKey,
    sourcePrekeys.signedPreKey.keyPair.privateKey,
  ) &&
    restoredOpks.every((key) => !sourceOpks.has(key)) &&
    restored.prekeys.nextSpkId === 2 &&
    restored.prekeys.nextOpkId === 101);

const restoredOwn = restored.deviceList.devices.find((device) =>
  same(device.signPub, restored.identity.sign.publicKey));
ok('DeviceList ist exakt V+1, master-signiert und trägt den frischen SPK/PV',
  restored.deviceList.version === sourceList.version + 1 &&
    await S.verifyDeviceList(
      restored.deviceList,
      restored.identity.master.publicKey,
      restored.identity.epoch,
    ) &&
    restoredOwn?.protocolVersion === S.PROTOCOL_VERSION &&
    same(restoredOwn.signedPreKey.pub, restored.prekeys.signedPreKey.keyPair.publicKey));
ok('Restore widerruft alle Snapshot-Geräte und publiziert nur das frische Device',
  !S.deviceInList(restored.deviceList, source.sign.publicKey) &&
    !S.deviceInList(restored.deviceList, linked.identity.sign.publicKey) &&
    restored.deviceList.devices.length === 1 &&
    S.deviceInList(restored.deviceList, restored.identity.sign.publicKey));
ok('Negativkontrolle: Eingabe-Liste wurde nicht in-place verändert',
  S.deviceInList(sourceList, source.sign.publicKey) &&
    !S.deviceInList(sourceList, restored.identity.sign.publicKey) &&
    sourceList.version === 7);

let mismatchedPrekeyReason = '';
try {
  await S.regenerateBackupCryptoForRestore(source, linked.prekeys, sourceList);
} catch (error) {
  mismatchedPrekeyReason = error.message;
}
ok('inkonsistente Prekeys werden am Prekey/Identity-Guard abgelehnt',
  mismatchedPrekeyReason.includes('Prekeys gehören nicht zur Backup-Identität'));
const maxVersionList = await S.signDeviceList(
  source.master.privateKey,
  source.master.publicKey,
  source.epoch,
  Number.MAX_SAFE_INTEGER,
  sourceList.devices,
);
let maxVersionReason = '';
try {
  await S.regenerateBackupCryptoForRestore(source, sourcePrekeys, maxVersionList);
} catch (error) {
  maxVersionReason = error.message;
}
ok('Version MAX_SAFE_INTEGER wird fail-closed statt gerundet/recycelt',
  maxVersionReason.includes('nicht erhöht'));
ok('linked Device kann ohne Master-Priv keinen Clone-Restore erzwingen',
  await throwsNamed(
    () => S.regenerateBackupCryptoForRestore(
      linked.identity,
      linked.prekeys,
      sourceList,
    ),
    'LinkedDeviceBackupUnsupportedError',
  ));

console.log('\n[Restore sanitizes contacts and local device labels]');

const peer = await S.generateIdentity();
const peerPrekeys = await S.createFreshPreKeyState(peer);
const peerBundle = S.currentBundle(peer, peerPrekeys);
peerBundle.oneTimePreKey = {
  id: peerPrekeys.oneTimePreKeys[0].id,
  pub: peerPrekeys.oneTimePreKeys[0].keyPair.publicKey,
};
const contact = await S.makeContact(
  S.asMasterPub(source.master.publicKey),
  peerBundle,
);
contact.nickname = 'Peer';
contact.verified = true;
await S.fanoutDeliveries(
  source,
  contact,
  { kind: 'text', text: 'ratchet snapshot' },
  '11'.repeat(16),
);
const sanitized = S.sanitizeContactForRestore(contact, source.master.publicKey);
ok('alle Double-Ratchets und pending X3DH-Header werden verworfen',
  contact.sessions.size === 1 &&
    sanitized !== null &&
    sanitized.sessions.size === 0);
ok('verbrauchsgefährdeter Bundle-OPK fällt weg, öffentliche Pins/Trust bleiben',
  sanitized !== null &&
    sanitized.bundle?.oneTimePreKey === undefined &&
    sanitized.nickname === 'Peer' &&
    sanitized.verified === true &&
    same(sanitized.peerMasterPub, contact.peerMasterPub));
const selfContact = {
  ...contact,
  roomId: await S.computeMasterRoomId(
    S.asMasterPub(source.master.publicKey),
    S.asMasterPub(source.master.publicKey),
  ),
  peerMasterPub: source.master.publicKey,
  hidden: true,
};
ok('alter Self-Contact wird vollständig ausgelassen und später neu aufgebaut',
  S.sanitizeContactForRestore(selfContact, source.master.publicKey) === null);

const sourceNameKey = await S.b64encode(source.sign.publicKey);
const linkedNameKey = await S.b64encode(linked.identity.sign.publicKey);
const restoredNameKey = await S.b64encode(restored.identity.sign.publicKey);
const originalNames = {
  [sourceNameKey]: 'Dieses Telefon',
  [linkedNameKey]: 'Tablet',
};
const remappedNames = await S.remapDeviceNamesForRestore(
  originalNames,
  source.sign.publicKey,
  restored.identity.sign.publicKey,
);
ok('Source-Label wandert auf das neue Device; Snapshot-Device-Labels fallen weg',
  remappedNames[sourceNameKey] === undefined &&
    remappedNames[restoredNameKey] === 'Dieses Telefon' &&
    remappedNames[linkedNameKey] === undefined);
ok('Negativkontrolle: Namensquelle wird nicht in-place verändert',
  originalNames[sourceNameKey] === 'Dieses Telefon' &&
    originalNames[restoredNameKey] === undefined);

console.log('\n[Production import/export enforce the primary-only boundary]');

const targetDek = await crypto.subtle.importKey(
  'raw',
  crypto.getRandomValues(new Uint8Array(32)),
  'AES-GCM',
  false,
  ['encrypt', 'decrypt'],
);
await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
await S.saveRecord(
  'identity',
  await S.seal(
    targetDek,
    await S.serializeIdentity(linked.identity),
    S.utf8.encode('scytale:identity:v1'),
  ),
);
ok('exportBackup lehnt linked Device vor Attachment-Scan/KDF ab',
  await throwsNamed(
    () => S.exportBackup(targetDek, 'unused export password'),
    'LinkedDeviceBackupUnsupportedError',
  ));

// Build one authenticated legacy container. The metadata is intentionally
// incomplete after `identity`: linked-device rejection must happen before the
// restore fence and before any other snapshot field is trusted.
const exportPassphrase = 'linked restore must fail closed';
const params = { memorySize: 65536, iterations: 3, parallelism: 1 };
const salt = crypto.getRandomValues(new Uint8Array(16));
const keyBytes = await S.deriveKekBytes(exportPassphrase, salt, params);
const exportKey = await crypto.subtle.importKey(
  'raw',
  keyBytes,
  'AES-GCM',
  false,
  ['encrypt', 'decrypt'],
);
keyBytes.fill(0);
const iv = crypto.getRandomValues(new Uint8Array(12));
const linkedMeta = S.utf8.encode(JSON.stringify({
  v: 1,
  createdAt: Date.now(),
  identity: await S.b64encode(await S.serializeIdentity(linked.identity)),
}));
const linkedCiphertext = new Uint8Array(
  await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, exportKey, linkedMeta),
);
const linkedFile = new Blob([JSON.stringify({
  v: 1,
  argon2: params,
  salt: await S.b64encode(salt),
  iv: await S.b64encode(iv),
  ct: await S.b64encode(linkedCiphertext),
})]);

await S.saveRecord('live-before-linked-import', {
  iv: new Uint8Array(12),
  ct: new Uint8Array(16),
});
const linkedImportRejected = await throwsNamed(
  () => S.importBackup(targetDek, exportPassphrase, linkedFile),
  'LinkedDeviceBackupUnsupportedError',
);
const linkedImportLeftNoFence = await S.withVaultDb('scytale', async (db) =>
  (await db.get('records', 'live-before-linked-import')) !== undefined &&
    (await db.get('kv', 'account-restore-lock')) === undefined &&
    (await db.count('restore')) === 0);
ok('linked Import scheitert vor Account-Fence/Stage und lässt Live-Daten intakt',
  linkedImportRejected && linkedImportLeftNoFence);

console.log('\n[Full primary import stages only the renewed state]');

const validSelfContact = {
  roomId: await S.computeMasterRoomId(
    S.asMasterPub(source.master.publicKey),
    S.asMasterPub(source.master.publicKey),
  ),
  peerMasterPub: source.master.publicKey,
  peerEpoch: source.epoch,
  peerSignPub: source.sign.publicKey,
  peerDhPub: source.dh.publicKey,
  peerFingerprint: '',
  ownMasterPub: S.asMasterPub(source.master.publicKey),
  regime: 'master',
  verified: true,
  hidden: true,
  bundle: S.currentBundle(source, sourcePrekeys),
  sessions: new Map([
    [
      await S.b64encode(source.sign.publicKey),
      {
        ratchet: null,
        pendingHeader: null,
        deviceSignPub: source.sign.publicKey,
      },
    ],
  ]),
};
const primaryBlob = {
  v: 1,
  createdAt: Date.now(),
  identity: await S.b64encode(await S.serializeIdentity(source)),
  prekeys: await S.b64encode(await S.serializePreKeys(sourcePrekeys)),
  deviceList: await S.b64encode(await S.encodeDeviceList(sourceList)),
  deviceNames: originalNames,
  profile: { name: 'Restored profile' },
  contacts: [
    await S.b64encode(await S.serializeContact(contact)),
    await S.b64encode(await S.serializeContact(validSelfContact)),
  ],
  groups: [],
  groupTombstones: [],
  messages: {
    [contact.roomId]: [],
    [validSelfContact.roomId]: [],
  },
  stickers: [],
  retiredMasters: [],
  recalledMids: [],
  attMeta: {},
};
const primaryIv = crypto.getRandomValues(new Uint8Array(12));
const primaryCiphertext = new Uint8Array(
  await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: primaryIv },
    exportKey,
    S.utf8.encode(JSON.stringify(primaryBlob)),
  ),
);
const primaryFile = new Blob([JSON.stringify({
  v: 1,
  argon2: params,
  salt: await S.b64encode(salt),
  iv: await S.b64encode(primaryIv),
  ct: await S.b64encode(primaryCiphertext),
})]);
const importedAttachments = await S.importBackup(
  targetDek,
  exportPassphrase,
  primaryFile,
);
const installedIdentity = await S.loadOrCreateIdentity(targetDek);
const installedPrekeys = await S.loadOrCreatePreKeys(
  targetDek,
  installedIdentity,
);
const installedList = await S.loadOrCreateOwnDeviceList(
  targetDek,
  installedIdentity,
  S.ownSpkPublic(installedPrekeys),
);
const installedContacts = await S.loadContacts(targetDek);
const installedNames = await S.loadDeviceNames(targetDek);
const installedNameKey = await S.b64encode(installedIdentity.sign.publicKey);

ok('vollständiger Import installiert frische Identity/Prekeys statt Snapshot-Klon',
  importedAttachments === 0 &&
    !same(installedIdentity.sign.publicKey, source.sign.publicKey) &&
    !same(installedIdentity.dh.publicKey, source.dh.publicKey) &&
    !same(
      installedPrekeys.signedPreKey.keyPair.privateKey,
      sourcePrekeys.signedPreKey.keyPair.privateKey,
    ) &&
    same(installedIdentity.master.publicKey, source.master.publicKey));
ok('installierte Liste enthält nur das frische Restore-Device und ist V+1',
  installedList !== null &&
    installedList.version === sourceList.version + 1 &&
    installedList.devices.length === 1 &&
    !S.deviceInList(installedList, source.sign.publicKey) &&
    !S.deviceInList(installedList, linked.identity.sign.publicKey) &&
    S.deviceInList(installedList, installedIdentity.sign.publicKey) &&
    await S.verifyDeviceList(
      installedList,
      installedIdentity.master.publicKey,
      installedIdentity.epoch,
    ));
ok('produktiver Stage lässt Self-Contact aus und persistiert Peer ohne Session/OPK',
  installedContacts.length === 1 &&
    same(installedContacts[0].peerMasterPub, peer.master.publicKey) &&
    installedContacts[0].sessions.size === 0 &&
    installedContacts[0].bundle?.oneTimePreKey === undefined);
ok('produktiver Stage remappt Device-Label auf die wirklich installierte Identity',
  installedNames[sourceNameKey] === undefined &&
    installedNames[installedNameKey] === 'Dieses Telefon' &&
    installedNames[linkedNameKey] === undefined);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
