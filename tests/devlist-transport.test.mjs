// End-to-end devlist gossip (Stage 3c): a master-signed device list travels the
// normal ratchet channel (frame byte 7) and, on receipt, is adopted via
// applyDeviceListUpdate — so a peer's second device becomes reachable.
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
// Alice's SECOND device — signed under ALICE's master (it belongs to her list).
const aliceSecondSign = sodium.crypto_sign_keypair();
const aliceSecondDh = sodium.crypto_box_keypair();
const aliceSecondCert = await S.signDeviceCert(alice.master.privateKey, 1, aliceSecondSign.publicKey, aliceSecondDh.publicKey);

// Bob publishes a bundle; Alice makes contact and sends the first message so Bob
// establishes a receive session.
const spk = await S.generateSignedPreKey(bob, 1);
const bundle = S.currentBundle(bob, { signedPreKey: spk, oneTimePreKeys: [] });
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);

const bobStore = { signedPreKey: spk, oneTimePreKeys: [] };
const bobLookup = {
  signedPreKey: (id) => (bobStore.signedPreKey.id === id ? bobStore.signedPreKey.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};

console.log('\n[devlist-Transport: Liste über den Ratchet-Kanal gelernt]');

// Alice → Bob: first message establishes Bob's session + contact.
const first = await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hallo'));
const firstEnv = await S.decodeEnvelope(first.payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), firstEnv.x3dh);
await S.receiveEnvelope(bob, bobContact, firstEnv, bobLookup);
ok('Vorbedingung: Bobs Kontakt für Alice etabliert', S.hasSession(bobContact));

// Alice's device list has TWO devices, signed under alice's master. Alice gossips.
const aliceList = await S.signDeviceList(alice.master.privateKey, alice.master.publicKey, 1, 2, [
  { signPub: alice.sign.publicKey, dhPub: alice.dh.publicKey, deviceCert: alice.deviceCert },
  { signPub: aliceSecondSign.publicKey, dhPub: aliceSecondDh.publicKey, deviceCert: aliceSecondCert },
]);
// (Bob's contact for Alice must be able to verify it → it's alice-master-signed.)
const gossip = await S.openPayload(bob, await S.sendDeviceList(alice, aliceContact, aliceList));
const gossipEnv = await S.decodeEnvelope(gossip.payload);
const content = (await S.receiveEnvelope(bob, bobContact, gossipEnv, bobLookup)).content;

ok('empfangen als kind=devlist', content.kind === 'devlist');
ok('devlist-Frame trägt die Liste (v2, 2 Geräte)',
  content.list?.version === 2 && content.list?.devices?.length === 2);

// Bob adopts it via applyDeviceListUpdate.
const adopted = await S.applyDeviceListUpdate(bobContact, content.list, new Set());
ok('Liste übernommen', adopted === true && bobContact.peerDeviceList?.version === 2);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
