// #9 step 7a — the per-device protocol-version capability gate (B1). Every envelope
// advertises the sender's pv; the receiver learns it ONLY from an authenticated
// message, so a sender can later gate a forward-compatible feature (chunked
// attachments) on `deviceProtocolVersion(...) >= N`. A stale/unknown device stays 0
// and keeps the backward-compatible path — which is what stops an old client from
// being sent a frame it would throw on and silently lose.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

const mkId = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return {
    master: { publicKey: new Uint8Array(master.publicKey), privateKey: new Uint8Array(master.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey),
  };
};

const alice = await mkId();
const bob = await mkId();
const bobSpk = await S.generateSignedPreKey(bob, 1);
const bobBundle = S.currentBundle(bob, { signedPreKey: bobSpk, oneTimePreKeys: [] });
const bobLookup = {
  signedPreKey: (id) => (bobSpk.id === id ? bobSpk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bobBundle);

console.log('\n[7a: pv rides the envelope and is learned per device]');

// Conservative default: a device we've never authenticated a message from is 0.
ok('nie gehört ⇒ Protokoll 0 (konservativer Default)', S.deviceProtocolVersion(aliceContact, bob.sign.publicKey) === 0);
ok('PROTOCOL_VERSION >= 1', typeof S.PROTOCOL_VERSION === 'number' && S.PROTOCOL_VERSION >= 1);

// Alice → Bob. The pv rides the (sealed) envelope and, once the message
// authenticates, Bob has learned Alice's device pv.
const e1 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hi'))).payload);
ok('pv reist im Envelope', e1.pv === S.PROTOCOL_VERSION);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), e1.x3dh);
ok('vor Empfang: Bob kennt Alices pv noch nicht (0)', S.deviceProtocolVersion(bobContact, alice.sign.publicKey) === 0);
await S.receiveEnvelope(bob, bobContact, e1, bobLookup);
ok('nach Auth: Bob lernt Alices pv', S.deviceProtocolVersion(bobContact, alice.sign.publicKey) === S.PROTOCOL_VERSION);

// Backward compatibility: a legacy envelope carries NO pv key; it must still decode,
// with pv undefined, and map to protocol 0 — never crash.
const legacyBytes = await S.encodeEnvelope({ ...e1, pv: undefined });
const legacyDecoded = await S.decodeEnvelope(legacyBytes);
ok('Alt-Envelope ohne pv decodet, pv undefined', legacyDecoded.pv === undefined);

// pv survives contact persistence (it's stored per session).
const round = await S.deserializeContact(await S.serializeContact(bobContact));
ok('pv überlebt Contact-(De)Serialisierung', S.deviceProtocolVersion(round, alice.sign.publicKey) === S.PROTOCOL_VERSION);

// NEGATIVE CONTROL: learning is PER DEVICE, not per contact — another device of the
// same person stays 0, so we never wrongly send it a gated frame.
const otherDevice = (await mkId()).sign.publicKey;
ok('Negativkontrolle: anderes Gerät bleibt 0 (per-Gerät)', S.deviceProtocolVersion(bobContact, otherDevice) === 0);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
