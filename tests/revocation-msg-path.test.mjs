// Device revocation on the MESSAGE path (Review C). The prekey guard only gates
// NEW handshakes; a revoked device could keep sending accepted 'msg' over its
// already-established ratchet. applyDeviceListUpdate must therefore tear the
// ratchet DOWN when the device that established it leaves the accepted list — so
// any further traffic from it is forced back through the prekey gate, where
// deviceAuthorized rejects it.
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
// Alice's SECOND device (signed under alice's master).
const aliceSecondSign = sodium.crypto_sign_keypair();
const aliceSecondDh = sodium.crypto_box_keypair();
const aliceSecondCert = await S.signDeviceCert(alice.master.privateKey, 1, aliceSecondSign.publicKey, aliceSecondDh.publicKey);

// Bob publishes a bundle; Alice makes contact and sends the first message so Bob
// establishes a RECEIVE session bound to alice's PRIMARY device.
const spk = await S.generateSignedPreKey(bob, 1);
const bundle = S.currentBundle(bob, { signedPreKey: spk, oneTimePreKeys: [] });
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);
const bobLookup = {
  signedPreKey: (id) => (spk.id === id ? spk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};

console.log('\n[Revocation auf dem msg-Pfad: Liste, die das Ratchet-Gerät widerruft, reißt den Ratchet ab]');

const first = await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hallo'));
const firstEnv = await S.decodeEnvelope(first.payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), firstEnv.x3dh);
await S.receiveEnvelope(bob, bobContact, firstEnv, bobLookup);
ok('Vorbedingung: Session etabliert', S.hasSession(bobContact));
ok('Vorbedingung: Session hängt an alices Primärgerät',
  !!S.sessionFor(bobContact, alice.sign.publicKey)?.ratchet);

// v2 list still CONTAINS the ratchet's device (primary) → ratchet must SURVIVE.
const listKeepsPrimary = await S.signDeviceList(alice.master.privateKey, alice.master.publicKey, 1, 2, [
  { signPub: alice.sign.publicKey, dhPub: alice.dh.publicKey, deviceCert: alice.deviceCert },
  { signPub: aliceSecondSign.publicKey, dhPub: aliceSecondDh.publicKey, deviceCert: aliceSecondCert },
]);
const adopted2 = await S.applyDeviceListUpdate(bobContact, listKeepsPrimary, new Set());
// NEGATIVE CONTROL: the teardown must be CONDITIONAL — a list that still lists the
// ratchet's device must NOT null the ratchet (else the guard is unconditional and
// the real test below would pass vacuously).
ok('Liste v2 übernommen', adopted2 === true);
ok('Session BLEIBT, solange ihr Gerät gelistet ist (Negativkontrolle)', S.hasSession(bobContact));

// v3 list REVOKES the primary (only the second device remains) → the device behind
// the live ratchet is gone → ratchet must be torn down.
const listRevokesPrimary = await S.signDeviceList(alice.master.privateKey, alice.master.publicKey, 1, 3, [
  { signPub: aliceSecondSign.publicKey, dhPub: aliceSecondDh.publicKey, deviceCert: aliceSecondCert },
]);
const adopted3 = await S.applyDeviceListUpdate(bobContact, listRevokesPrimary, new Set());
ok('Liste v3 übernommen', adopted3 === true);
ok('Session ABGERISSEN, weil ihr Gerät widerrufen wurde', !S.hasSession(bobContact));
ok('Session des widerrufenen Geräts entfernt', !S.sessionFor(bobContact, alice.sign.publicKey));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
