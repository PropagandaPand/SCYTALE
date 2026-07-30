import * as L from './.bundle/entry.js';

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

const sodium = await L.getSodium();
const bytes = (length, seed) =>
  Uint8Array.from({ length }, (_, index) => (seed + index * 17) & 0xff);
const same = (left, right) => sodium.memcmp(left, right);
const encodeRaw = (raw) =>
  sodium.to_base64(raw, sodium.base64_variants.URLSAFE_NO_PADDING);
const decodeRaw = (token) =>
  new Uint8Array(sodium.from_base64(token, sodium.base64_variants.URLSAFE_NO_PADDING));
const appendByte = (raw) => {
  const result = new Uint8Array(raw.length + 1);
  result.set(raw);
  result[raw.length] = 0xa5;
  return result;
};
const isRejected = async (raw) => {
  try {
    await L.decodeBundle(encodeRaw(raw));
    return false;
  } catch {
    return true;
  }
};

const baseBundle = {
  masterPub: bytes(32, 1),
  epoch: 0x01020304,
  deviceCert: bytes(64, 2),
  identitySignPub: bytes(32, 3),
  identityDhPub: bytes(32, 4),
  signedPreKey: {
    id: 0x05060708,
    pub: bytes(32, 5),
    signature: bytes(64, 6),
  },
};

console.log('\n[Prekey-Bundle: kanonische Binärdecodierung]');

const baseToken = await L.encodeBundle(baseBundle);
const baseRaw = decodeRaw(baseToken);
const baseRoundtrip = await L.decodeBundle(baseToken);
ok('Bundle ohne OPK hat exakt 266 Bytes', baseRaw.length === 266);
ok(
  'kanonisches Bundle ohne OPK wird decodiert',
  baseRoundtrip.oneTimePreKey === undefined &&
    baseRoundtrip.epoch === baseBundle.epoch &&
    same(baseRoundtrip.masterPub, baseBundle.masterPub),
);

const opkBundle = {
  ...baseBundle,
  oneTimePreKey: { id: 0x090a0b0c, pub: bytes(32, 7) },
};
const opkToken = await L.encodeBundle(opkBundle);
const opkRaw = decodeRaw(opkToken);
const opkRoundtrip = await L.decodeBundle(opkToken);
ok('Bundle mit OPK hat exakt 302 Bytes', opkRaw.length === 302);
ok(
  'kanonisches Bundle mit OPK wird decodiert',
  opkRoundtrip.oneTimePreKey?.id === opkBundle.oneTimePreKey.id &&
    same(opkRoundtrip.oneTimePreKey.pub, opkBundle.oneTimePreKey.pub),
);

const invalidFlag = baseRaw.slice();
invalidFlag[265] = 2;
ok('OPK-Flag außerhalb 0/1 wird abgelehnt', await isRejected(invalidFlag));

const missingOpk = baseRaw.slice();
missingOpk[265] = 1;
ok('OPK-Flag 1 ohne OPK-Payload wird abgelehnt', await isRejected(missingOpk));

const hiddenOpk = opkRaw.slice();
hiddenOpk[265] = 0;
ok('OPK-Payload bei Flag 0 wird abgelehnt', await isRejected(hiddenOpk));

ok('trailing Byte ohne OPK wird abgelehnt', await isRejected(appendByte(baseRaw)));
ok('trailing Byte mit OPK wird abgelehnt', await isRejected(appendByte(opkRaw)));
ok('gekürztes Bundle wird abgelehnt', await isRejected(baseRaw.slice(0, -1)));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
