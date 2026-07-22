// The PROVEN door, end to end (G3 receive path). A dual-signed rotation chain
// travels the normal ratchet channel (frame byte 8), and on receipt acceptRotation
// re-pins the contact to the new master while KEEPING `verified` — unlike the
// unproven previousMaster hint, which clears it. A forged or rolled-back chain
// changes nothing.
//
// (The PRODUCER — a co-signed chain from device linking — is a separate, design-
// locked step; here the statement is constructed directly, as the linking flow
// eventually will.)
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

const mkId = async (master) => {
  const m = master ?? sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return {
    master: { publicKey: new Uint8Array(m.publicKey), privateKey: new Uint8Array(m.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(m.privateKey, 1, sign.publicKey, dh.publicKey),
  };
};

const alice = await mkId();          // alice on her OLD master, epoch 1
const bob = await mkId();
const aliceNewMaster = sodium.crypto_sign_keypair(); // the master alice rotates INTO

// Bob learns alice (pinning her OLD master); mark the contact verified.
const spk = await S.generateSignedPreKey(bob, 1);
const bundle = S.currentBundle(bob, { signedPreKey: spk, oneTimePreKeys: [] });
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);
const bobLookup = {
  signedPreKey: (id) => (spk.id === id ? spk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};

const first = await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hallo'));
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), (await S.decodeEnvelope(first.payload)).x3dh);
await S.receiveEnvelope(bob, bobContact, await S.decodeEnvelope(first.payload), bobLookup);
bobContact.verified = true;
const roomBefore = bobContact.roomId;
ok('Vorbedingung: bob pinnt alices ALTEN Master, verified', bobContact.verified && S.bytesEqual(bobContact.peerMasterPub, alice.master.publicKey));

console.log('\n[Rotations-Empfang: bewiesene Kette behält verified + schlüsselt um]');

// NEGATIVE CONTROL: a chain the OLD master did NOT sign (forged sigOld) must be rejected.
const forged = await S.makeRotation(
  { publicKey: alice.master.publicKey, privateKey: sodium.crypto_sign_keypair().privateKey }, // wrong old priv
  { publicKey: aliceNewMaster.publicKey, privateKey: aliceNewMaster.privateKey },
  2,
);
const forgedEnv = await S.openPayload(bob, await S.sendRotation(alice, aliceContact, forged));
const forgedContent = await S.receiveEnvelope(bob, bobContact, await S.decodeEnvelope(forgedEnv.payload), bobLookup);
ok('gefälschte Kette dekodiert als kind=rotation (Wire funktioniert)', forgedContent.kind === 'rotation');
let forgedRejected = false;
try {
  await S.acceptRotation(bobContact, forgedContent.statement, new Set());
} catch {
  forgedRejected = true;
}
ok('gefälschte Kette abgelehnt (Negativkontrolle)', forgedRejected === true);
ok('Kontakt nach Ablehnung UNVERÄNDERT', bobContact.verified === true && S.bytesEqual(bobContact.peerMasterPub, alice.master.publicKey) && bobContact.roomId === roomBefore);

// GENUINE dual-signed rotation alice_old → alice_new at epoch 2 (> peerEpoch 1).
const statement = await S.makeRotation(
  { publicKey: alice.master.publicKey, privateKey: alice.master.privateKey },
  { publicKey: aliceNewMaster.publicKey, privateKey: aliceNewMaster.privateKey },
  2,
);
const env = await S.openPayload(bob, await S.sendRotation(alice, aliceContact, statement));
const content = await S.receiveEnvelope(bob, bobContact, await S.decodeEnvelope(env.payload), bobLookup);
ok('echte Kette als kind=rotation empfangen', content.kind === 'rotation');
ok('Statement über den Draht unverändert (byte-8-Frame)',
  S.bytesEqual(content.statement.newMasterPub, aliceNewMaster.publicKey) && content.statement.epoch === 2);

const r = await S.acceptRotation(bobContact, content.statement, new Set());
ok('re-gepinnt auf den NEUEN Master', S.bytesEqual(bobContact.peerMasterPub, aliceNewMaster.publicKey));
ok('verified BEHALTEN (bewiesene Kontinuität)', bobContact.verified === true);
ok('roomId umgeschlüsselt', r.newRoomId === bobContact.roomId && r.newRoomId !== roomBefore);
ok('Alle Sessions geleert (frisches X3DH unter neuem Master)', !S.hasSession(bobContact) && bobContact.sessions.size === 0);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
