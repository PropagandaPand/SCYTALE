// A newly linked device may send before ordinary DeviceList gossip reaches the
// peer. Its first X3DH envelope therefore carries the current master-signed list:
// the receiver verifies/adopts it before the device-revocation gate, but commits
// it only together with an authenticated first message. A revoked device cannot
// use the same mechanism to roll an older list back.
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

const sodium = await S.getSodium();

const device = async (master, spkId) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: {
      publicKey: new Uint8Array(master.publicKey),
      privateKey: new Uint8Array(master.privateKey),
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
      master.privateKey,
      1,
      sign.publicKey,
      dh.publicKey,
    ),
  };
  const spk = await S.generateSignedPreKey(id, spkId);
  const entry = {
    signPub: id.sign.publicKey,
    dhPub: id.dh.publicKey,
    deviceCert: id.deviceCert,
    signedPreKey: {
      id: spk.id,
      pub: spk.keyPair.publicKey,
      signature: spk.signature,
    },
    protocolVersion: S.PROTOCOL_VERSION,
  };
  return {
    id,
    spk,
    entry,
    bundle: S.currentBundle(id, {
      signedPreKey: spk,
      oneTimePreKeys: [],
    }),
    lookup: {
      signedPreKey: (id) => (id === spk.id ? spk.keyPair : undefined),
      oneTimePreKey: () => undefined,
    },
  };
};

const aliceMaster = sodium.crypto_sign_keypair();
const bobMaster = sodium.crypto_sign_keypair();
const A1 = await device(aliceMaster, 1);
const A2 = await device(aliceMaster, 2);
const B = await device(bobMaster, 3);

const aliceOld = await S.signDeviceList(
  aliceMaster.privateKey,
  aliceMaster.publicKey,
  1,
  1,
  [A1.entry],
);
const aliceCurrent = await S.signDeviceList(
  aliceMaster.privateKey,
  aliceMaster.publicKey,
  1,
  2,
  [A1.entry, A2.entry],
);

// Bob still knows only A1. A2 nevertheless has Bob's ordinary bundle and may
// initiate independently.
const bobForAliceA2 = await S.makeContact(
  S.asMasterPub(A2.id.master.publicKey),
  B.bundle,
);
const aliceForBob = await S.makeContact(
  S.asMasterPub(B.id.master.publicKey),
  A1.bundle,
);
await S.applyDeviceListUpdate(aliceForBob, aliceOld, new Set());

ok(
  'Vorbedingung: das frisch verknüpfte A2 ist in Bobs altem Directory nicht autorisiert',
  S.deviceAuthorized(aliceForBob, A2.id.sign.publicKey) === false,
);

const delivery = (
  await S.fanoutDeliveries(
    A2.id,
    bobForAliceA2,
    { kind: 'text', text: 'direkt nach dem Link' },
    S.randomMid(),
    undefined,
    undefined,
    0,
    aliceCurrent,
  )
).deliveries[0];
const opened = await S.openPayload(B.id, delivery.sealed);
const envelope = await S.decodeEnvelope(opened.payload);

ok(
  'frischer Prekey-Header trägt den master-signierten aktuellen Gerätecheckpoint',
  envelope.type === 'prekey' &&
    envelope.x3dh.senderDeviceList?.version === 2,
);
const received = await S.receiveEnvelope(
  B.id,
  aliceForBob,
  envelope,
  B.lookup,
);
ok(
  'A2s erste Nachricht wird trotz Gossip-Reordering authentifiziert',
  received.outcome === 'message' &&
    received.content.kind === 'text' &&
    received.content.text === 'direkt nach dem Link',
);
ok(
  'der verifizierte neuere Checkpoint autorisiert A2 und wird übernommen',
  aliceForBob.peerDeviceList?.version === 2 &&
    S.deviceAuthorized(aliceForBob, A2.id.sign.publicKey),
);

// Revocation control: Bob already holds v3 with only A2. A1 cannot replay v1
// in its own prekey header to get back into the directory.
const aliceRevoked = await S.signDeviceList(
  aliceMaster.privateKey,
  aliceMaster.publicKey,
  1,
  3,
  [A2.entry],
);
const revokedContact = await S.makeContact(
  S.asMasterPub(B.id.master.publicKey),
  A2.bundle,
);
await S.applyDeviceListUpdate(revokedContact, aliceRevoked, new Set());
const bobForAliceA1 = await S.makeContact(
  S.asMasterPub(A1.id.master.publicKey),
  B.bundle,
);
const replay = (
  await S.fanoutDeliveries(
    A1.id,
    bobForAliceA1,
    { kind: 'text', text: 'replay' },
    S.randomMid(),
    undefined,
    undefined,
    0,
    aliceOld,
  )
).deliveries[0];
const replayEnvelope = await S.decodeEnvelope(
  (await S.openPayload(B.id, replay.sealed)).payload,
);
let revoked = false;
try {
  await S.receiveEnvelope(B.id, revokedContact, replayEnvelope, B.lookup);
} catch (error) {
  revoked = error instanceof S.RevokedDeviceError;
}
ok('älterer gültiger Checkpoint kann ein widerrufenes Gerät nicht reaktivieren', revoked);
ok(
  'Rollback-Versuch lässt den gepinnten Directory-Stand unverändert',
  revokedContact.peerDeviceList?.version === 3 &&
    !S.deviceAuthorized(revokedContact, A1.id.sign.publicKey),
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
