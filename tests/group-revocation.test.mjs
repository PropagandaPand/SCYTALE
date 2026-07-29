// Group protocol v4 device revocation. A newer master-signed DeviceList must
// update both the persistent group directory and the hidden pairwise contact.
// The removed device loses its session and disappears from subsequent fan-out;
// stale and forged lists may not change either target set.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

const mkDevice = async (masterKp) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: {
      publicKey: new Uint8Array(masterKp.publicKey),
      privateKey: new Uint8Array(masterKp.privateKey),
    },
    sign: {
      publicKey: new Uint8Array(sign.publicKey),
      privateKey: new Uint8Array(sign.privateKey),
    },
    dh: {
      publicKey: new Uint8Array(dh.publicKey),
      privateKey: new Uint8Array(dh.privateKey),
    },
    epoch: 1,
    deviceCert: await S.signDeviceCert(
      masterKp.privateKey,
      1,
      sign.publicKey,
      dh.publicKey,
    ),
  };
  const spk = await S.generateSignedPreKey(id, 1);
  return {
    id,
    spk,
    entry: {
      signPub: id.sign.publicKey,
      dhPub: id.dh.publicKey,
      deviceCert: id.deviceCert,
      signedPreKey: {
        id: spk.id,
        pub: spk.keyPair.publicKey,
        signature: spk.signature,
      },
      protocolVersion: S.PROTOCOL_VERSION,
    },
  };
};

const alice = await mkDevice(sodium.crypto_sign_keypair());
const bobMaster = sodium.crypto_sign_keypair();
const B1 = await mkDevice(bobMaster);
const B2 = await mkDevice(bobMaster);
const evilMaster = sodium.crypto_sign_keypair();

const initialList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  2,
  [B1.entry, B2.entry],
);
const revokedList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  3,
  [B2.entry],
);
const staleList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  1,
  [B1.entry],
);
const forgedList = await S.signDeviceList(
  evilMaster.privateKey,
  bobMaster.publicKey,
  1,
  4,
  [B1.entry, B2.entry],
);
const b1Bundle = S.currentBundle(B1.id, {
  signedPreKey: B1.spk,
  oneTimePreKeys: [],
});
const aliceList = await S.signDeviceList(
  alice.id.master.privateKey,
  alice.id.master.publicKey,
  1,
  1,
  [alice.entry],
);

const group = await S.signGroupState({
  id: 'grp_22222222222222222222222222222222',
  name: 'Revocation',
  createdAt: 1_700_000_000_000,
  revision: 1,
  ownerMasterPub: alice.id.master.publicKey,
  roster: [
    alice.id.master.publicKey,
    B1.id.master.publicKey,
  ],
  members: [{
    masterPub: B1.id.master.publicKey,
    epoch: 1,
    signPub: B1.id.sign.publicKey,
    dhPub: B1.id.dh.publicKey,
    bundle: b1Bundle,
    deviceList: initialList,
    name: 'Bob',
  }],
}, alice.id);
const bobContact = await S.makeContact(
  S.asMasterPub(alice.id.master.publicKey),
  b1Bundle,
);
bobContact.hidden = true;
await S.applyDeviceListUpdate(bobContact, initialList, new Set());

console.log('\n[Gruppen-Revocation: vor Widerruf beide Geräte erreichbar]');

const before = await S.groupFanoutToDevices(
  alice.id,
  [bobContact],
  group.id,
  group.revision,
  group.stateHash,
  'Alice',
  { kind: 'text', text: 'vorher' },
  S.randomMid(),
  { senderDeviceList: aliceList },
);
ok('vor dem Widerruf werden B1 und B2 adressiert',
  before.deliveries.length === 2 &&
  before.deliveries.some((item) => S.bytesEqual(item.deviceSignPub, B1.id.sign.publicKey)) &&
  before.deliveries.some((item) => S.bytesEqual(item.deviceSignPub, B2.id.sign.publicKey)));
ok('pro Gerät existiert eine getrennte Session',
  !!S.sessionFor(bobContact, B1.id.sign.publicKey) &&
  !!S.sessionFor(bobContact, B2.id.sign.publicKey));

console.log('\n[Gruppen-Revocation: signierte neue Liste wird atomar übernommen]');

const groupUpdate = await S.applyGroupMemberDeviceList(group, revokedList);
ok('neuere echt signierte Liste aktualisiert das Gruppenroster',
  groupUpdate.applied === true &&
  groupUpdate.group.members[0].deviceList.version === 3);
ok('Roster-Anker rotiert auf das verbleibende B2',
  S.bytesEqual(groupUpdate.group.members[0].signPub, B2.id.sign.publicKey) &&
  S.bytesEqual(groupUpdate.group.members[0].dhPub, B2.id.dh.publicKey));

const contactApplied = await S.applyDeviceListUpdate(
  bobContact,
  revokedList,
  new Set(),
);
ok('dieselbe Liste aktualisiert den versteckten Kontakt',
  contactApplied === true && bobContact.peerDeviceList.version === 3);
ok('B1-Session wird beim Listentausch sofort verworfen',
  S.sessionFor(bobContact, B1.id.sign.publicKey) === undefined &&
  !!S.sessionFor(bobContact, B2.id.sign.publicKey));
ok('B1 ist nicht länger autorisiert, B2 bleibt autorisiert',
  !S.deviceAuthorized(bobContact, B1.id.sign.publicKey) &&
  S.deviceAuthorized(bobContact, B2.id.sign.publicKey));

const after = await S.groupFanoutToDevices(
  alice.id,
  [bobContact],
  groupUpdate.group.id,
  groupUpdate.group.revision,
  groupUpdate.group.stateHash,
  'Alice',
  { kind: 'text', text: 'nachher' },
  S.randomMid(),
  { senderDeviceList: aliceList },
);
ok('nach Widerruf wird ausschließlich B2 adressiert',
  after.deliveries.length === 1 &&
  after.unreachable.length === 0 &&
  S.bytesEqual(after.deliveries[0].deviceSignPub, B2.id.sign.publicKey));
ok('die neue B2-Kopie kann vom widerrufenen B1 nicht geöffnet werden',
  await S.openPayload(B1.id, after.deliveries[0].sealed) === null);

console.log('\n[Gruppen-Revocation: Rollback und Fälschung bleiben wirkungslos]');

const staleGroup = await S.applyGroupMemberDeviceList(groupUpdate.group, staleList);
ok('ältere gültige Liste wird als Rollback abgewiesen',
  staleGroup.applied === false &&
  staleGroup.group === groupUpdate.group &&
  staleGroup.group.members[0].deviceList.version === 3);

const forgedGroup = await S.applyGroupMemberDeviceList(groupUpdate.group, forgedList);
ok('fremd signierte Liste mit behauptetem Bob-Master wird abgewiesen',
  forgedGroup.applied === false &&
  forgedGroup.group === groupUpdate.group &&
  forgedGroup.group.members[0].deviceList.version === 3);

const contactVersion = bobContact.peerDeviceList.version;
ok('1:1-Guard weist denselben Rollback zurück',
  await S.applyDeviceListUpdate(bobContact, staleList, new Set()) === false &&
  bobContact.peerDeviceList.version === contactVersion);
ok('1:1-Guard weist dieselbe Fälschung zurück',
  await S.applyDeviceListUpdate(bobContact, forgedList, new Set()) === false &&
  bobContact.peerDeviceList.version === contactVersion);

console.log('\n[Directory-Merge: Clock-Tie, Epoch-Grenze und erreichbarer Anchor]');

// Two differently signed directory payloads can carry the same clock. That is
// master equivocation, not "newer"; arrival order must not replace the directory
// already accepted locally.
const equalClockDifferentList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  2,
  [B2.entry],
);
const equalClockIncoming = {
  ...group,
  members: [{
    ...group.members[0],
    signPub: B2.id.sign.publicKey,
    dhPub: B2.id.dh.publicKey,
    bundle: undefined,
    deviceList: equalClockDifferentList,
  }],
};
const equalClockMerged = S.mergeGroupDirectories(group, equalClockIncoming);
ok('bei identischer DeviceList-Clock gewinnt die bereits akzeptierte lokale Liste',
  equalClockMerged.members[0].deviceList === initialList &&
  equalClockMerged.members[0].deviceList.devices.length === 2);

// A member epoch is an authority floor. A directory from epoch 1 must not be
// retained when an authenticated owner state advances the member to epoch 2.
const epoch2Sign = new Uint8Array(32).fill(0xa1);
const epoch2Dh = new Uint8Array(32).fill(0xb2);
const higherEpochIncoming = {
  ...group,
  members: [{
    ...group.members[0],
    epoch: 2,
    signPub: epoch2Sign,
    dhPub: epoch2Dh,
    bundle: undefined,
    deviceList: undefined,
  }],
};
const higherEpochMerged = S.mergeGroupDirectories(group, higherEpochIncoming);
ok('höherer Incoming-Epoch verwirft die lokale Liste aus dem alten Epoch',
  higherEpochMerged.members[0].deviceList === undefined &&
  S.bytesEqual(higherEpochMerged.members[0].signPub, epoch2Sign) &&
  S.bytesEqual(higherEpochMerged.members[0].dhPub, epoch2Dh));

// The current B1 anchor has neither a carried bundle nor an SPK in this newer
// list. B2 does have a verified SPK, so the roster anchor must move to B2 and
// derive an initiator bundle from that entry.
const mixedReachabilityList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  5,
  [
    {
      signPub: B1.entry.signPub,
      dhPub: B1.entry.dhPub,
      deviceCert: B1.entry.deviceCert,
    },
    B2.entry,
  ],
);
const receiveOnlyAnchorGroup = {
  ...group,
  members: [{
    ...group.members[0],
    bundle: undefined,
  }],
};
const reachableAnchor = await S.applyGroupMemberDeviceList(
  receiveOnlyAnchorGroup,
  mixedReachabilityList,
);
ok('nicht initiierbarer Anchor wechselt auf ein Gerät mit verifiziertem SPK',
  reachableAnchor.applied === true &&
  S.bytesEqual(reachableAnchor.group.members[0].signPub, B2.id.sign.publicKey) &&
  S.bytesEqual(reachableAnchor.group.members[0].dhPub, B2.id.dh.publicKey) &&
  S.bytesEqual(
    reachableAnchor.group.members[0].bundle.identitySignPub,
    B2.id.sign.publicKey,
  ));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
