// Group protocol v4: one logical message is pairwise-E2EE fanned out to every
// authorised device in the member's master-signed DeviceList. Each device owns
// an independent X3DH/Double-Ratchet session, while every copy carries one MID.
// Inline attachment policy is tested at the same multiplicative boundary.
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
    lookup: {
      signedPreKey: (keyId) => keyId === spk.id ? spk.keyPair : undefined,
      consumeOneTimePreKey: () => undefined,
    },
  };
};

const aliceMaster = sodium.crypto_sign_keypair();
const bobMaster = sodium.crypto_sign_keypair();
const Alice = await mkDevice(aliceMaster);
const B1 = await mkDevice(bobMaster);
const B2 = await mkDevice(bobMaster);
const aliceList = await S.signDeviceList(
  aliceMaster.privateKey,
  aliceMaster.publicKey,
  1,
  1,
  [Alice.entry],
);
const bobList = await S.signDeviceList(
  bobMaster.privateKey,
  bobMaster.publicKey,
  1,
  2,
  [B1.entry, B2.entry],
);
const bobBundle = S.currentBundle(B1.id, {
  signedPreKey: B1.spk,
  oneTimePreKeys: [],
});
const sourceGroup = await S.signGroupState({
  id: 'grp_11111111111111111111111111111111',
  name: 'Geräte-Fanout',
  createdAt: 1_700_000_000_000,
  revision: 1,
  ownerMasterPub: Alice.id.master.publicKey,
  roster: [
    Alice.id.master.publicKey,
    B1.id.master.publicKey,
  ],
  members: [{
    masterPub: B1.id.master.publicKey,
    epoch: 1,
    signPub: B1.id.sign.publicKey,
    dhPub: B1.id.dh.publicKey,
    bundle: bobBundle,
    deviceList: bobList,
    name: 'Bob',
  }],
}, Alice.id);

// Exercise the actual broadcast roster codec before deriving the hidden contact.
const decodedGroup = await S.fromInvite(await S.toInvite(sourceGroup));
const bobMember = decodedGroup.members[0];
const bobContact = await S.makeContact(
  S.asMasterPub(Alice.id.master.publicKey),
  bobMember.bundle,
);
bobContact.hidden = true;
await S.applyDeviceListUpdate(bobContact, bobMember.deviceList, new Set());

console.log('\n[Gruppen-Fanout: alle autorisierten Geräte, unabhängige Ratchets, eine MID]');

const mid = S.randomMid();
const fanout = await S.groupFanoutToDevices(
  Alice.id,
  [bobContact],
  decodedGroup.id,
  decodedGroup.revision,
  decodedGroup.stateHash,
  'Alice',
  { kind: 'text', text: 'Hallo auf allen Geräten' },
  mid,
  { senderDeviceList: aliceList },
);
ok('beide Bob-Geräte erhalten eine eigene Zustellung',
  fanout.deliveries.length === 2 && fanout.unreachable.length === 0);

const decryptFor = async (device) => {
  const delivery = fanout.deliveries.find((item) =>
    S.bytesEqual(item.deviceSignPub, device.id.sign.publicKey));
  const opened = delivery && await S.openPayload(device.id, delivery.sealed);
  if (!opened) return null;
  const envelope = await S.decodeEnvelope(opened.payload);
  const contact = await S.makeContactFromHeader(
    S.asMasterPub(device.id.master.publicKey),
    envelope.x3dh,
  );
  return S.receiveEnvelope(device.id, contact, envelope, device.lookup);
};

const onB1 = await decryptFor(B1);
const onB2 = await decryptFor(B2);
ok('B1 authentifiziert und entschlüsselt die Gruppennachricht',
  onB1?.outcome === 'message' &&
  onB1.content.kind === 'group' &&
  S.bytesEqual(onB1.content.stateHash, decodedGroup.stateHash) &&
  onB1.content.inner.kind === 'text' &&
  onB1.content.inner.text === 'Hallo auf allen Geräten');
ok('B2 authentifiziert und entschlüsselt dieselbe Gruppennachricht',
  onB2?.outcome === 'message' &&
  onB2.content.kind === 'group' &&
  S.bytesEqual(onB2.content.stateHash, decodedGroup.stateHash) &&
  onB2.content.inner.kind === 'text' &&
  onB2.content.inner.text === 'Hallo auf allen Geräten');
ok('beide Kopien tragen Gruppen-ID, Revision und dieselbe MID',
  onB1?.outcome === 'message' &&
  onB2?.outcome === 'message' &&
  onB1.mid === mid &&
  onB2.mid === mid &&
  onB1.content.kind === 'group' &&
  onB2.content.kind === 'group' &&
  onB1.content.groupId === decodedGroup.id &&
  onB2.content.groupId === decodedGroup.id &&
  onB1.content.revision === 1 &&
  onB2.content.revision === 1);
ok('Alice hält pro Bob-Gerät eine eigenständige Ratchet-Instanz',
  S.sessionFor(bobContact, B1.id.sign.publicKey).ratchet !==
  S.sessionFor(bobContact, B2.id.sign.publicKey).ratchet);

const b1Copy = fanout.deliveries.find((item) =>
  S.bytesEqual(item.deviceSignPub, B1.id.sign.publicKey));
ok('eine für B1 versiegelte Kopie ist für B2 nicht lesbar',
  await S.openPayload(B2.id, b1Copy.sealed) === null);

console.log('\n[Gruppen-Anhänge: replizierte Datenmenge ist hart begrenzt]');

const small = S.boundedGroupAttachmentPolicy(decodedGroup, 2_048, 2);
ok('kleiner Anhang ist erlaubt und zählt Zielgeräte plus eigenes Zweitgerät',
  small.allowed === true &&
  small.recipientDevices === 3 &&
  small.aggregateBytes === 6_144);

const oversized = S.boundedGroupAttachmentPolicy(decodedGroup, 600 * 1_024 + 1, 1);
ok('Einzeldatei oberhalb 600 KiB wird abgelehnt',
  oversized.allowed === false && oversized.reason === 'single-file-limit');

const policyMember = (n) => ({
  masterPub: new Uint8Array(32).fill(n + 1),
  signPub: new Uint8Array(32).fill(n + 65),
  dhPub: new Uint8Array(32).fill(n + 129),
});
const aggregateGroup = {
  ...decodedGroup,
  members: Array.from({ length: 30 }, (_, index) => policyMember(index)),
};
const aggregate = S.boundedGroupAttachmentPolicy(aggregateGroup, 600 * 1_024, 1);
ok('zulässige Einzeldatei wird bei mehr als 16 MiB Gesamt-Fanout abgelehnt',
  aggregate.allowed === false &&
  aggregate.recipientDevices === 30 &&
  aggregate.reason === 'aggregate-limit');

const tooManyGroup = {
  ...decodedGroup,
  members: Array.from({ length: 64 }, (_, index) => ({
    ...policyMember(index),
    deviceList: { devices: [{}, {}, {}] },
  })),
};
const tooMany = S.boundedGroupAttachmentPolicy(tooManyGroup, 1, 1);
ok('mehr als 128 Zielgeräte werden vor dem Upload abgelehnt',
  tooMany.allowed === false &&
  tooMany.recipientDevices === 192 &&
  tooMany.reason === 'too-many-devices');

const invalid = S.boundedGroupAttachmentPolicy(decodedGroup, -1, 1);
ok('ungültige Größen werden fail-closed abgelehnt',
  invalid.allowed === false && invalid.reason === 'invalid');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
