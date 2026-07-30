// N-side device-link recovery across reload/crash boundaries. The confirmed
// transcript is DEK-authenticated, but its SAS and confirmation capability are
// always reconstructed cryptographically from current Identity/SPK.
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const rejects = async (fn, pattern = /./) => {
  try {
    await fn();
    return false;
  } catch (error) {
    return pattern.test(String(error?.message));
  }
};
const same = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);
const publicSpk = (spk) => ({
  id: spk.id,
  pub: spk.keyPair.publicKey,
  signature: spk.signature,
});

console.log('\n[Link-Recovery: Confirmed Intent, Reload und Fake-vor-Valid]');

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.switchVaultDb('scytale');
const dek = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);

const primary = await S.generateIdentity();
const fresh = await S.generateIdentity();
const freshSpk = await S.generateSignedPreKey(fresh, 17);
const currentSpk = publicSpk(freshSpk);
const { session: nSession, qrToken } = await S.startLinkOnN(fresh, currentSpk);

let sealedOffer;
const { session: pSession } = await S.beginLinkOnP(
  primary,
  qrToken,
  async (_recipient, sealed) => {
    sealedOffer = sealed;
  },
);
const openedOffer = await S.openPayload(fresh, sealedOffer);
ok('P-Angebot erreicht N als LinkOffer', openedOffer?.type === S.SEALED_LINK_OFFER);
await S.offerReceivedOnN(nSession, openedOffer.payload);
S.confirmLinkSession(nSession);

const intent = await S.createConfirmedNewDeviceLinkIntent(
  nSession,
  fresh,
  currentSpk,
  1_700_000_000_000,
);
ok('Intent enthält weder gespeichertes confirmed-Flag noch gespeicherte SAS',
  !('confirmed' in intent) && !('sas' in intent));
await S.saveConfirmedNewDeviceLinkIntent(dek, intent);
const loaded = await S.loadConfirmedNewDeviceLinkIntent(dek);
ok('DEK-versiegelter Intent übersteht einen Reload-Roundtrip',
  loaded !== null &&
  loaded.requestToken === intent.requestToken &&
  same(loaded.offerBytes, intent.offerBytes));

const restored = await S.restoreConfirmedNewDeviceLinkSession(
  loaded,
  fresh,
  currentSpk,
);
ok('Boot rekonstruiert SAS aus Transcript statt Displaywert zu laden',
  restored.sas?.decimal.join(',') === nSession.sas?.decimal.join(',') &&
  restored.sas?.emoji.map((e) => e.char).join('') ===
    nSession.sas?.emoji.map((e) => e.char).join(''));

const primaryCert = await S.signDeviceCert(
  primary.master.privateKey,
  primary.epoch,
  primary.sign.publicKey,
  primary.dh.publicKey,
);
const initialList = await S.signDeviceList(
  primary.master.privateKey,
  primary.master.publicKey,
  primary.epoch,
  1,
  [{
    signPub: primary.sign.publicKey,
    dhPub: primary.dh.publicKey,
    deviceCert: primaryCert,
  }],
);
const { grant } = await S.createLinkGrant(
  primary.master.privateKey,
  primary.master.publicKey,
  primary.epoch,
  initialList,
  pSession.request,
  pSession.offer,
);
const fakeProof = new Uint8Array(grant.proof);
fakeProof[0] ^= 0x80;
const fakeGrant = { ...grant, proof: fakeProof };

ok('anonymer Fake-Grant verifiziert nicht gegen das bestätigte Transcript',
  !(await S.verifyConfirmedNewDeviceLinkGrant(fresh, restored, fakeGrant)));
ok('Fake-Grant verbraucht die rekonstruierte Bestätigung nicht',
  await rejects(
    () => S.completeLinkOnN(dek, fresh, restored, fakeGrant),
    /ungültig|unverändert/,
  ) &&
  await S.verifyConfirmedNewDeviceLinkGrant(fresh, restored, grant));

const candidateQueue = new Map([
  [41, new Uint8Array([0xfa])],
  [42, new Uint8Array([0x01])],
]);
const evaluated = [];
const retired = [];
const drained = await S.drainLinkGrantCandidates(
  candidateQueue,
  async (ackId) => {
    evaluated.push(ackId);
    return ackId === 41 ? 'invalid' : 'installed';
  },
  (ackId) => retired.push(ackId),
);
ok('dynamisch: Fake-vor-Valid ACKt nur die Fake-Zeile und prüft danach Valid',
  drained === true &&
  evaluated.join(',') === '41,42' &&
  retired.join(',') === '41' &&
  !candidateQueue.has(41) &&
  candidateQueue.has(42));
const retryQueue = new Map([[51, new Uint8Array([0x02])]]);
const retryRetired = [];
ok('dynamisch: Retry lässt seine exakte Grant-Zeile unbestätigt stehen',
  !(await S.drainLinkGrantCandidates(
    retryQueue,
    async () => 'retry',
    (ackId) => retryRetired.push(ackId),
  )) &&
  retryQueue.has(51) &&
  retryRetired.length === 0);

const discardCandidates = new Map([
  [61, await S.encodeLinkGrant(fakeGrant)],
  [62, await S.encodeLinkGrant(grant)],
]);
const discardAckIds = await S.confirmedLinkGrantRows(
  fresh,
  restored,
  discardCandidates,
);
ok('dynamisch: expliziter N-Abbruch selektiert nur Rows seines bestätigten Transcripts',
  discardAckIds.join(',') === '62' &&
  discardCandidates.size === 2);

await S.discardConfirmedNewDeviceLinkIntent(
  dek,
  loaded,
  1_700_000_000_100,
);
const discardedIntents = await S.loadDiscardedNewDeviceLinkIntents(dek);
ok('dynamisch: endgültiger Abbruch ersetzt aktive Recovery durch durable Tombstone',
  (await S.loadConfirmedNewDeviceLinkIntent(dek)) === null &&
  discardedIntents.length === 1 &&
  discardedIntents[0].discardedAt === 1_700_000_000_100);
const rejectionOnlySession = await S.restoreDiscardedNewDeviceLinkSession(
  discardedIntents[0],
  fresh,
);
ok('dynamisch: Reload-Tombstone erkennt nur den verspäteten eigenen Grant',
  await S.verifyDiscardedNewDeviceLinkGrant(fresh, rejectionOnlySession, grant) &&
  !(await S.verifyDiscardedNewDeviceLinkGrant(fresh, rejectionOnlySession, fakeGrant)));
ok('dynamisch: Tombstone rekonstruiert ausdrücklich keine Installations-Capability',
  await rejects(
    () => S.completeLinkOnN(dek, fresh, rejectionOnlySession, grant),
    /nicht ausdrücklich bestätigt/,
  ));
const tombstoneMatcher = async (payload) => {
  try {
    return S.verifyDiscardedNewDeviceLinkGrant(
      fresh,
      rejectionOnlySession,
      await S.decodeLinkGrant(payload),
    );
  } catch {
    return false;
  }
};
const latePayload = await S.encodeLinkGrant(grant);
const unmatchedPayload = await S.encodeLinkGrant(fakeGrant);
const lateDisposition = await S.classifyLinkGrantRelayRow(
  latePayload,
  false,
  tombstoneMatcher,
);
const staleDisposition = await S.classifyLinkGrantRelayRow(
  unmatchedPayload,
  false,
  tombstoneMatcher,
);
const activeDisposition = await S.classifyLinkGrantRelayRow(
  unmatchedPayload,
  true,
  tombstoneMatcher,
);
const exactRowsAcked = [];
if (lateDisposition !== 'active') exactRowsAcked.push(71);
if (staleDisposition !== 'active') exactRowsAcked.push(72);
if (activeDisposition !== 'active') exactRowsAcked.push(73);
ok('dynamisch: late Tombstone-Grant und unmatched Fake räumen nur ihre eigene Row',
  lateDisposition === 'discarded' &&
  staleDisposition === 'stale' &&
  exactRowsAcked.join(',') === '71,72');
ok('dynamisch: Kandidat einer anderen aktiven Session bleibt unACKed und deren Capability intakt',
  activeDisposition === 'active' &&
  await S.verifyConfirmedNewDeviceLinkGrant(fresh, restored, grant));

// The same restored session must still accept the real candidate queued behind
// the fake one. This dynamically locks the fake-before-valid regression.
const linked = await S.completeLinkOnN(dek, fresh, restored, grant);
ok('derselbe bestätigte Reload-Stand installiert danach den echten Grant',
  same(linked.master.publicKey, primary.master.publicKey) &&
  same(linked.previousMasterPub, fresh.master.publicKey));
ok('Post-commit Reload erkennt die bereits atomar installierte Identity/List',
  await S.confirmedLinkGrantAlreadyInstalled(linked, restored, grant));
const restoredAfterCommit = await S.restoreConfirmedNewDeviceLinkSession(
  loaded,
  linked,
  currentSpk,
);
ok('Recovery funktioniert auch im Crashfenster nach Identity/List-Commit',
  await S.confirmedLinkGrantAlreadyInstalled(linked, restoredAfterCommit, grant));

const otherIdentity = await S.generateIdentity();
ok('Intent einer anderen aktuellen Identity scheitert geschlossen',
  await rejects(
    () => S.restoreConfirmedNewDeviceLinkSession(loaded, otherIdentity, currentSpk),
    /Identität|Identity|SPK/,
  ));
const otherSpk = await S.generateSignedPreKey(fresh, 18);
ok('SPK-Mismatch scheitert geschlossen',
  await rejects(
    () => S.restoreConfirmedNewDeviceLinkSession(loaded, fresh, publicSpk(otherSpk)),
    /SPK/,
  ));
const brokenEph = {
  ...loaded,
  sasEphPrivate: new Uint8Array(loaded.sasEphPrivate),
};
brokenEph.sasEphPrivate[5] ^= 1;
ok('inkohärentes SAS-Ephemeral-Keypair scheitert geschlossen',
  await rejects(
    () => S.restoreConfirmedNewDeviceLinkSession(brokenEph, fresh, currentSpk),
    /Ephemeral|inkohärent/,
  ));

// Poison a coordination record, then prove cleanup is an atomic delete rather
// than a multi-transaction overwrite that could leave an undecryptable blocker.
await S.saveRecord(S.CONFIRMED_NEW_DEVICE_LINK_KEY, {
  iv: new Uint8Array(12),
  ct: new Uint8Array([1, 2, 3]),
});
ok('beschädigter N-Intent wird nicht als leer/stale toleriert',
  await rejects(
    () => S.loadConfirmedNewDeviceLinkIntent(dek),
    /beschädigt|authentisch/,
  ));
await S.clearConfirmedNewDeviceLinkIntent();
ok('atomarer N-Cleanup entfernt auch einen Poison-Record vollständig',
  (await S.loadRecord(S.CONFIRMED_NEW_DEVICE_LINK_KEY)) === undefined &&
  (await S.loadConfirmedNewDeviceLinkIntent(dek)) === null);

const primarySpk1 = await S.generateSignedPreKey(primary, 31);
const listBeforePoison = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk1),
);
const corruptPendingA = {
  iv: new Uint8Array(12),
  ct: new Uint8Array([9]),
};
await S.saveRecord(S.PENDING_LINK_GRANT_KEY, corruptPendingA);
ok('beschädigter P-Intent wird erkannt',
  await rejects(() => S.loadPendingLinkGrant(dek), /beschädigt/));
const validPendingB = await S.sealPendingLinkGrantRecord(dek, {
  recipientSignPub: primary.sign.publicKey,
  sealedPayload: new Uint8Array([7, 8, 9]),
  createdAt: 1_700_000_000_200,
});
await S.saveRecord(S.PENDING_LINK_GRANT_KEY, validPendingB);
const corruptCleanupResult = await S.clearPendingLinkGrantAndRecover(
  dek,
  corruptPendingA,
);
ok('dynamisch: stale Corrupt-Cleanup A darf ersetzten validen Pending B nicht löschen',
  corruptCleanupResult.status === 'replaced' &&
  corruptCleanupResult.pending.createdAt === 1_700_000_000_200 &&
  (await S.loadPendingLinkGrant(dek))?.createdAt === 1_700_000_000_200);
ok('dynamisch: exact-snapshot Cleanup entfernt danach nur B',
  await S.clearPendingLinkGrant(validPendingB) &&
  (await S.loadPendingLinkGrant(dek)) === null);
await S.saveRecord(S.PENDING_LINK_GRANT_KEY, corruptPendingA);
const primarySpk2 = await S.generateSignedPreKey(primary, 32);
ok('Poison-Präsenz blockiert zunächst eine autoritative DeviceList-CAS',
  await rejects(
    () => S.loadOrCreateOwnDeviceList(dek, primary, publicSpk(primarySpk2)),
    /gesperrt/,
  ));
const recoveredPrimaryIntent = await S.recoverPendingLinkGrantAtBoot(dek);
ok('P-Boot entfernt einen authentisch nicht mehr lesbaren Coordination-Record',
  recoveredPrimaryIntent.discardedCorrupt === true &&
  recoveredPrimaryIntent.pending === null);
ok('atomarer P-Cleanup entfernt den Poison-Record vollständig',
  (await S.loadRecord(S.PENDING_LINK_GRANT_KEY)) === undefined &&
  (await S.loadPendingLinkGrant(dek)) === null);
const listAfterPoison = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk2),
);
ok('nach P-Cleanup ist die DeviceList-CAS wieder möglich',
  listBeforePoison !== null &&
  listAfterPoison !== null &&
  listAfterPoison.version > listBeforePoison.version &&
  listAfterPoison.devices.some((device) =>
    device.signPub.every((value, index) => value === primary.sign.publicKey[index]) &&
    device.signedPreKey?.id === primarySpk2.id));

S.confirmLinkSession(pSession);
let publishedCommittedList = null;
let pendingDeliveryError = null;
const primaryCommitOrder = [];
try {
  await S.completeLinkOnP(
    dek,
    primary,
    pSession,
    async () => {
      primaryCommitOrder.push('send');
      throw new Error('relay receipt timeout');
    },
    async (committedList) => {
      primaryCommitOrder.push('publish');
      publishedCommittedList = committedList;
    },
  );
} catch (error) {
  pendingDeliveryError = error;
}
const durableCommittedList = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk2),
);
ok('dynamisch: P publiziert den durable DeviceList-Commit vor Grant-Zustellung',
  primaryCommitOrder.join(',') === 'publish,send' &&
  publishedCommittedList !== null &&
  durableCommittedList?.version === publishedCommittedList.version);
ok('dynamisch: sendConfirmed-Timeout bleibt als autorisierte Pending-Delivery unterscheidbar',
  pendingDeliveryError instanceof S.LinkGrantDeliveryPendingError &&
  pendingDeliveryError.committedList.version === publishedCommittedList.version &&
  (await S.loadPendingLinkGrant(dek)) !== null);
ok('dynamisch: Pending-Liste enthält vor Cancel genau das autorisierte neue Gerät',
  publishedCommittedList.devices.some((device) =>
    same(device.signPub, fresh.sign.publicKey)));
const cancelledPending = await S.cancelPendingLinkGrantAndRevokeDevice(
  dek,
  primary,
);
const listAfterPendingCancel = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk2),
);
ok('dynamisch: P-Cancel committed neuere Revocation und löscht Pending atomar',
  cancelledPending !== null &&
  cancelledPending.newList.version === publishedCommittedList.version + 1 &&
  same(cancelledPending.targetSignPub, fresh.sign.publicKey) &&
  !cancelledPending.newList.devices.some((device) =>
    same(device.signPub, fresh.sign.publicKey)) &&
  listAfterPendingCancel?.version === cancelledPending.newList.version &&
  (await S.loadPendingLinkGrant(dek)) === null);
ok('dynamisch: widerrufene Liste bleibt master-signiert und enthält P',
  await S.verifyDeviceList(
    cancelledPending.newList,
    primary.master.publicKey,
    primary.epoch,
  ) &&
  cancelledPending.newList.devices.some((device) =>
    same(device.signPub, primary.sign.publicKey)));
const primarySpk3 = await S.generateSignedPreKey(primary, 33);
const listAfterCancelMutation = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk3),
);
ok('dynamisch: P-Cancel löst den DeviceList-Mutationsblocker dauerhaft',
  listAfterCancelMutation !== null &&
  listAfterCancelMutation.version > cancelledPending.newList.version &&
  (await S.cancelPendingLinkGrantAndRevokeDevice(dek, primary)) === null);
let secondPendingError = null;
try {
  await S.completeLinkOnP(
    dek,
    primary,
    pSession,
    async () => {
      throw new Error('second relay receipt timeout');
    },
  );
} catch (error) {
  secondPendingError = error;
}
const pendingRecordA = await S.loadRecord(S.PENDING_LINK_GRANT_KEY);
const cancelledA = await S.cancelPendingLinkGrantAndRevokeDevice(
  dek,
  primary,
  fresh.sign.publicKey,
);
let thirdPendingError = null;
try {
  await S.completeLinkOnP(
    dek,
    primary,
    pSession,
    async () => {
      throw new Error('third relay receipt timeout');
    },
  );
} catch (error) {
  thirdPendingError = error;
}
const pendingRecordB = await S.loadRecord(S.PENDING_LINK_GRANT_KEY);
const staleReceiptCleanup = await S.clearPendingLinkGrantAndRecover(
  dek,
  pendingRecordA,
);
const pendingAfterStaleReceipt = await S.loadPendingLinkGrant(dek);
const cancelledB = await S.cancelPendingLinkGrantAndRevokeDevice(
  dek,
  primary,
  fresh.sign.publicKey,
);
const listAfterCancelClearRace = await S.loadOrCreateOwnDeviceList(
  dek,
  primary,
  publicSpk(primarySpk3),
);
ok('dynamisch: A→Cancel→B→spätes A-Receipt bewahrt Pending B',
  secondPendingError instanceof S.LinkGrantDeliveryPendingError &&
  thirdPendingError instanceof S.LinkGrantDeliveryPendingError &&
  pendingRecordA !== undefined &&
  pendingRecordB !== undefined &&
  cancelledA !== null &&
  staleReceiptCleanup.status === 'replaced' &&
  same(staleReceiptCleanup.pending.recipientSignPub, fresh.sign.publicKey) &&
  pendingAfterStaleReceipt !== null &&
  cancelledB !== null &&
  !listAfterCancelClearRace.devices.some((device) =>
    same(device.signPub, fresh.sign.publicKey)) &&
  (await S.loadPendingLinkGrant(dek)) === null);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const messenger = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');
const flow = readFileSync(join(root, 'src', 'lib', 'linkflow.ts'), 'utf8');
const recovery = readFileSync(join(root, 'src', 'lib', 'linkRecovery.ts'), 'utf8');
const primaryIntent = readFileSync(join(root, 'src', 'lib', 'linkIntent.ts'), 'utf8');
const devicesSource = readFileSync(join(root, 'src', 'lib', 'devices.ts'), 'utf8');
const databaseSource = readFileSync(join(root, 'src', 'lib', 'db.ts'), 'utf8');
const bootStart = messenger.indexOf('const id = await loadOrCreateIdentity(dek)');
const bootEnd = messenger.indexOf("const hashMatch = location.hash.match", bootStart);
const boot = messenger.slice(bootStart, bootEnd);
ok('Boot lädt und rekonstruiert Confirmed Intent strikt vor Inbox-Connect',
  boot.indexOf('loadConfirmedNewDeviceLinkIntent(dek)') >= 0 &&
  boot.indexOf('loadConfirmedNewDeviceLinkIntent(dek)') <
    boot.indexOf('restoreConfirmedNewDeviceLinkSession(') &&
  boot.indexOf('restoreConfirmedNewDeviceLinkSession(') <
    boot.indexOf('connectInbox(ownInbox)'));
const confirmStart = messenger.indexOf('async function onNConfirmSas');
const confirmEnd = messenger.indexOf('function installGrant', confirmStart);
const confirm = messenger.slice(confirmStart, confirmEnd);
const confirmSave = confirm.indexOf('await saveConfirmedNewDeviceLinkIntent(dek, intent)');
const confirmActivation = confirm.indexOf('linkConfirmedRef.current = true', confirmSave);
const confirmInstall = confirm.indexOf('await installGrant()', confirmActivation);
ok('N persistiert den Confirmed Intent vor Aktivierung/Installation',
  confirmSave >= 0 &&
  confirmSave < confirmActivation &&
  confirmActivation < confirmInstall);
const installStart = messenger.indexOf('async function performInstallGrant');
const installEnd = messenger.indexOf('// P scanned N', installStart);
const install = messenger.slice(installStart, installEnd);
ok('Intent wird erst nach Identity-, Contact- und Bootstrap-Durabilität gelöscht',
  install.indexOf('completeLinkOnN(') <
    install.indexOf('await saveContact(dek, c)') &&
  install.indexOf('await saveContact(dek, c)') <
    install.indexOf('await saveBootstrapRequest(dek') &&
  install.indexOf('await saveBootstrapRequest(dek') <
    install.indexOf('await clearConfirmedNewDeviceLinkIntent(dek)') &&
  install.indexOf('await clearConfirmedNewDeviceLinkIntent(dek)') <
    install.indexOf('acknowledgePendingLinkGrantRows()'));
ok('invalid/stale Grant resettiert keine bestätigte Session und ACKt nur sich selbst',
  messenger.includes('return drainLinkGrantCandidates(') &&
  messenger.includes('acknowledgeLinkGrantRow(ackId)') &&
  install.includes("return 'invalid'") &&
  !install.slice(install.indexOf('} catch (e)')).includes('resetLink();'));
ok('explizites Reset schützt bestätigte Recovery und ACKt sie nicht',
  messenger.includes('if (linkRecoveryProtectedRef.current)') &&
  messenger.includes("if (resetLink()) setLinkView('menu')"));
const discardStart = messenger.indexOf('async function discardConfirmedNewDeviceRecovery');
const discardEnd = messenger.indexOf('// N starts:', discardStart);
const discardSource = messenger.slice(discardStart, discardEnd);
ok('bewusster N-Abbruch warnt, persistiert zuerst und ACKt kein fremdes Geschwister-Row',
  discardSource.includes('window.confirm(') &&
  discardSource.indexOf('await discardConfirmedNewDeviceLinkIntent(dek, intent)') <
    discardSource.indexOf('for (const ackId of ownGrantRows)') &&
  discardSource.includes('confirmedLinkGrantRows(') &&
  discardSource.includes('linkPendingGrantsRef.current.clear()') &&
  !discardSource.includes('acknowledgePendingLinkGrantRows()'));
ok('Recovery-UI bietet nach Wiederöffnen einen ausdrücklichen endgültigen Abbruch',
  messenger.includes('Kopplungs-Recovery endgültig verwerfen') &&
  messenger.includes('discardConfirmedNewDeviceRecovery(),') &&
  messenger.includes('launchRuntimeOperation(() =>') &&
  messenger.includes('Diese bestätigte Recovery bleibt auch nach dem Schließen erhalten.'));
const discardedMatchStart = messenger.indexOf('async function matchesDiscardedLinkGrant');
const discardedMatchEnd = messenger.indexOf('// N confirmed the emoji', discardedMatchStart);
const discardedMatchSource = messenger.slice(discardedMatchStart, discardedMatchEnd);
ok('späte Grants werden nach Reload gegen rejection-only Tombstones klassifiziert',
  boot.includes('loadDiscardedNewDeviceLinkIntents(dek)') &&
  boot.includes('restoreDiscardedNewDeviceLinkSession(intent, id)') &&
  discardedMatchSource.includes('verifyDiscardedNewDeviceLinkGrant(') &&
  messenger.includes('classifyLinkGrantRelayRow(') &&
  flow.includes('Deliberately does not call requireConfirmed'));
const relayGrantStart = messenger.indexOf('if (opened.type === SEALED_LINK_GRANT)');
const relayGrantEnd = messenger.indexOf("if (opened.type !== SEALED_ENVELOPE)", relayGrantStart);
const relayGrantSource = messenger.slice(relayGrantStart, relayGrantEnd);
ok('unmatched Tombstone-Fake wird ohne aktive Session nicht als Poison behalten',
  relayGrantSource.includes("disposition === 'active'") &&
  !relayGrantSource.includes("disposition === 'stale'") &&
  relayGrantSource.includes('return;'));
const closeStart = messenger.indexOf('const closeLink = () =>');
const closeEnd = messenger.indexOf('const linkRole =', closeStart);
const closeSource = messenger.slice(closeStart, closeEnd);
ok('geschützter Recovery-Overlay darf schließen, ohne Session/Rows zu resetten',
  closeSource.indexOf('resetLink()') <
    closeSource.indexOf('setLinkView(null)') &&
  closeSource.includes('Settings can') &&
  messenger.includes("else setLinkView('sas')"));
ok('Recovery rekonstruiert SAS + X25519-Public-Key kryptographisch',
  flow.includes('crypto_scalarmult_base(intent.sasEphPrivate)') &&
  flow.includes('const sas = await linkingSas('));
ok('N-Poison und P-Pending-Cleanup verwenden atomare, zielgebundene Übergänge',
  recovery.includes('await deleteRecord(CONFIRMED_NEW_DEVICE_LINK_KEY)') &&
  primaryIntent.includes('compareAndSwapRecordsWithDeletes(') &&
  primaryIntent.includes('[[PENDING_LINK_GRANT_KEY, expected]]') &&
  !primaryIntent.includes('deleteRecord(PENDING_LINK_GRANT_KEY)') &&
  !recovery.includes('secureDeleteRecord') &&
  !primaryIntent.includes('secureDeleteRecord'));
ok('Boot warnt nach P-Corruption deutlich vor möglichem Ghost-Gerät',
  messenger.includes('const discardedCorruptGrant = await retryPendingLinkGrant(async () =>') &&
  messenger.includes('Prüfe jetzt unter Profil → Geräte') &&
  messenger.includes('widerrufe jedes unbekannte'));
ok('N-Corruption bleibt fail-closed und wird nicht vom P-Recovery-Pfad gelöscht',
  recovery.includes("throw new Error('Bestätigte Geräte-Kopplung ist beschädigt oder nicht authentisch.')") &&
  primaryIntent.includes("This policy is deliberately NOT used for N's confirmed transcript"));
const primarySyncStart = messenger.indexOf('async function synchronizeCommittedPrimaryLinkList');
const primarySyncEnd = messenger.indexOf('async function retryPrimaryLinkGrantDeliveryNow', primarySyncStart);
const primarySync = messenger.slice(primarySyncStart, primarySyncEnd);
const pConfirmStart = messenger.indexOf('async function onPConfirmSas');
const pConfirmEnd = messenger.indexOf('async function onInbox', pConfirmStart);
const pConfirmSource = messenger.slice(pConfirmStart, pConfirmEnd);
ok('P synchronisiert committed DeviceList und Selbstkontakt vor möglicher Grant-Zustellung',
  primarySync.indexOf('ownListRef.current = list') <
    primarySync.indexOf('await ensureSelfContact()') &&
  pConfirmSource.includes('synchronizeCommittedPrimaryLinkList') &&
  flow.indexOf('await publishCommitted?.(newList)') <
    flow.indexOf('await send(session.peerSignPub, sealedPayload)'));
ok('P hält einen sendConfirmed-Timeout sichtbar und wiederholbar',
  pConfirmSource.includes('e instanceof LinkGrantDeliveryPendingError') &&
  pConfirmSource.includes('setPrimaryLinkDeliveryPending(true)') &&
  messenger.includes('Ausstehende Zustellung erneut versuchen') &&
  messenger.includes('retryPendingLinkGrant(async () =>'));
ok('P-Receipt und Corrupt-Recovery löschen nur ihren exakten sealed Snapshot',
  flow.includes('pendingRecord } = await issueAndSaveLinkGrant(') &&
  flow.includes('await clearPendingLinkGrantAndRecover(dek, pendingRecord)') &&
  messenger.includes('const pendingRecord = recovered.record') &&
  messenger.includes('await clearPendingLinkGrantAndRecover(dek, pendingRecord)') &&
  primaryIntent.includes('if (await clearPendingLinkGrant(record))'));
ok('CAS-Miss hält Nachfolger B in RAM/UI sichtbar statt Pending fälschlich zu löschen',
  messenger.includes("if (cleanup.status === 'replaced')") &&
  messenger.includes('primaryPendingLinkTargetRef.current = cleanup.pending.recipientSignPub') &&
  messenger.includes('Eine neuere ausstehende Kopplung bleibt gespeichert') &&
  primaryIntent.includes("| { status: 'replaced'; pending: PendingLinkGrant; record: SealedRecord }"));
const pCancelStart = messenger.indexOf('async function cancelPrimaryPendingLinkGrant');
const pCancelEnd = messenger.indexOf('// Delivery tracking', pCancelStart);
const pCancelSource = messenger.slice(pCancelStart, pCancelEnd);
const atomicCancelStart = devicesSource.indexOf('export async function cancelPendingLinkGrantAndRevokeDevice');
const atomicCancelEnd = devicesSource.indexOf('/** Issue and persist a LinkGrant', atomicCancelStart);
const atomicCancelSource = devicesSource.slice(atomicCancelStart, atomicCancelEnd);
ok('P bietet bewussten Cancel+Revoke statt permanentem Delivery-Lock',
  pCancelSource.includes('window.confirm(') &&
  pCancelSource.indexOf('const self = await ensureSelfContact()') <
    pCancelSource.indexOf('const cancelled = await cancelPendingLinkGrantAndRevokeDevice(') &&
  pCancelSource.includes('primaryPendingLinkTargetRef.current ?? undefined') &&
  pCancelSource.includes('const authoritative = await reconcileOwnDeviceList(cancelled.newList)') &&
  pCancelSource.includes('await gossipDeviceList(authoritative)') &&
  messenger.includes('Autorisierung abbrechen und widerrufen'));
ok('P-Cancel signiert Revision+1 und löscht exakt den Pending-Intent im selben CAS',
  atomicCancelSource.includes('current.version + 1') &&
  atomicCancelSource.includes('compareAndSwapRecordsWithDeletes(') &&
  atomicCancelSource.includes('[PENDING_LINK_GRANT_KEY, pendingSnapshot]') &&
  atomicCancelSource.includes('[PENDING_LINK_GRANT_KEY]') &&
  databaseSource.includes('for (const key of deletions) await records.delete(key)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
