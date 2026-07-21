// The previousMaster origin hint (Stage 3c): survives the wire, authorises
// NOTHING. It exists only to offer a merge affordance; if it leaked into the
// AEAD's associated data it would authenticate the identity change, defeating
// the whole "hint behaves as claimed → only ask" separation.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const hex = (x) => sodium.to_hex(x);

const mkId = async (previousMasterPub) => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return {
    master: { publicKey: new Uint8Array(master.publicKey), privateKey: new Uint8Array(master.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey),
    previousMasterPub,
  };
};

// Bob's bundle to initiate against.
const bob = await mkId();
const spk = await S.generateSignedPreKey(bob, 1);
const bundle = S.currentBundle(bob, { signedPreKey: spk, oneTimePreKeys: [] });

console.log('\n[previousMaster: überlebt das Wire, autorisiert nichts]');

const oldMaster = sodium.crypto_sign_keypair();
const withHint = await mkId(new Uint8Array(oldMaster.publicKey));
const withoutHint = { ...withHint, previousMasterPub: undefined };

const { header: hHint, session: sHint } = await S.initiateX3DH(withHint, bundle);
const { session: sNone } = await S.initiateX3DH(withoutHint, bundle);

ok('Header trägt previousMaster', hHint.previousMaster && hex(hHint.previousMaster) === hex(oldMaster.publicKey));

// Wire roundtrip through a full envelope.
const env = { type: 'prekey', conv: 'r', x3dh: hHint, message: { header: { dh: withHint.dh.publicKey, pn: 0, n: 0 }, ciphertext: new Uint8Array(16) } };
const decoded = await S.decodeEnvelope(await S.encodeEnvelope(env));
ok('previousMaster überlebt encode/decode',
  decoded.x3dh.previousMaster && hex(decoded.x3dh.previousMaster) === hex(oldMaster.publicKey));

// THE security property: the associated data is IDENTICAL with and without the
// hint — so it cannot authenticate the identity change. (AD binds masters, dh
// keys, epochs — never previousMaster.)
ok('AAD ist mit UND ohne previousMaster identisch (autorisiert nichts)',
  hex(sHint.associatedData) === hex(sNone.associatedData));

// And an absent hint stays absent (null, not garbage).
const { header: hNone } = await S.initiateX3DH(withoutHint, bundle);
ok('ohne Hinweis: previousMaster undefined', hNone.previousMaster === undefined);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
