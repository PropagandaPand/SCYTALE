// Stage 3d step 4 — a device's SIGNED prekey travels IN the master-signed device
// list, so we can INITIATE X3DH to a device we never heard from (fan-out to a
// silent secondary). The signed-prekey public is bound into the master signature,
// so it cannot be spliced or rolled back independently of the list version.
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

const bob = await mkId();
const alice = await mkId();
const bobSpk = await S.generateSignedPreKey(bob, 1);
const bobEntry = {
  signPub: bob.sign.publicKey,
  dhPub: bob.dh.publicKey,
  deviceCert: bob.deviceCert,
  signedPreKey: { id: bobSpk.id, pub: bobSpk.keyPair.publicKey, signature: bobSpk.signature },
};
const bobList = await S.signDeviceList(bob.master.privateKey, bob.master.publicKey, 1, 1, [bobEntry]);

console.log('\n[Schritt 4: Signed Prekey in der devlist → an ein stilles Gerät initiieren]');

// A) A bundle built purely from the list entry lets Alice initiate, and Bob (who
//    holds the SPK private) completes the handshake — a device that never wrote to us.
const bundle = S.bundleFromDeviceEntry(bob.master.publicKey, 1, bobEntry);
ok('bundleFromDeviceEntry liefert ein Bundle', bundle !== null);
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);
const env = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hallo stilles Gerät'))).payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), env.x3dh);
const bobLookup = {
  signedPreKey: (id) => (bobSpk.id === id ? bobSpk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};
const content = await S.receiveEnvelope(bob, bobContact, env, bobLookup);
ok('stilles Gerät initiiert + Handshake vollzogen', content.kind === 'text' && content.text === 'hallo stilles Gerät');

// B) Wire round-trip preserves the SPK (v2).
const decoded = await S.decodeDeviceList(await S.encodeDeviceList(bobList));
ok('Wire-Roundtrip (v2) erhält den SPK',
  decoded.devices[0].signedPreKey?.id === bobSpk.id &&
  S.bytesEqual(decoded.devices[0].signedPreKey.pub, bobSpk.keyPair.publicKey));

console.log('\n[SPK ist master-gebunden — Splicing bricht die Listen-Signatur]');
// C) The valid list verifies …
ok('gültige v2-Liste verifiziert', (await S.verifyDeviceList(bobList, bob.master.publicKey, 1)) === true);
// … but swapping the SPK pub (keeping the master signature) must be rejected,
//    because the pub is part of the signed listMsg. NEGATIVE CONTROL.
const foreign = sodium.crypto_box_keypair();
const tampered = {
  ...bobList,
  devices: [{ ...bobEntry, signedPreKey: { ...bobEntry.signedPreKey, pub: new Uint8Array(foreign.publicKey) } }],
};
ok('gefälschter SPK bricht die Master-Signatur (Negativkontrolle)',
  (await S.verifyDeviceList(tampered, bob.master.publicKey, 1)) === false);

// D) A legacy device (no signed prekey) cannot be initiated to → null (receive still works).
const legacy = { signPub: bob.sign.publicKey, dhPub: bob.dh.publicKey, deviceCert: bob.deviceCert };
ok('DeviceEntry ohne SPK ⇒ bundleFromDeviceEntry === null', S.bundleFromDeviceEntry(bob.master.publicKey, 1, legacy) === null);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
