// Commit state only AFTER the message authenticates (Review F + Devil's-Advocate
// DA-4). receiveEnvelope must not mutate a live contact from UNAUTHENTICATED input:
//   • a forged 'prekey' (valid PUBLIC master + signPub, garbage device cert) must
//     not destroy an in-flight initiator session — the sim-init tie-break used to
//     null ratchet/pendingHeader BEFORE respondX3DH verified the cert (DA-4);
//   • a forged 'msg' must not clear pendingHeader before the AEAD decrypt (F).
// Both are the v0.17.1 "commit only after the AEAD check" discipline.
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

const cmpBytes = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

let alice = await mkId();
let bob = await mkId();
// Reach the DESTRUCTIVE sim-init branch (buildFresh → respondX3DH) we must ensure
// no longer nulls live state: it only fires when cmp(me.dh, peer.dh) >= 0. Order
// the identities so alice (the receiver under test) is the higher key.
if (cmpBytes(alice.dh.publicKey, bob.dh.publicKey) < 0) [alice, bob] = [bob, alice];

const aliceSpk = await S.generateSignedPreKey(alice, 1);
const aliceLookup = {
  signedPreKey: (id) => (aliceSpk.id === id ? aliceSpk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};
const bobSpk = await S.generateSignedPreKey(bob, 1);
const bobBundle = S.currentBundle(bob, { signedPreKey: bobSpk, oneTimePreKeys: [] });

// Alice initiates to Bob and is now the INITIATOR IN-FLIGHT (ratchet + pendingHeader).
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bobBundle);
await S.sendMessage(alice, aliceContact, 'hallo Bob');
const ratchetBefore = aliceContact.ratchet;
ok('Vorbedingung: in-flight-Initiator (Ratchet + pendingHeader gesetzt)',
  aliceContact.ratchet !== null && aliceContact.pendingHeader !== null);

console.log('\n[DA-4: gefälschtes Prekey zerstört die in-flight-Session NICHT]');
// Forged prekey: bob's PUBLIC master + signPub (pass the top guards), garbage cert.
const forgedPrekey = {
  type: 'prekey',
  conv: aliceContact.roomId,
  x3dh: {
    masterPub: bob.master.publicKey,
    epoch: 1,
    deviceCert: new Uint8Array(64), // garbage — verifyDeviceCert fails inside respondX3DH
    identitySignPub: bob.sign.publicKey,
    identityDhPub: new Uint8Array(sodium.crypto_box_keypair().publicKey),
    ephemeralPub: new Uint8Array(sodium.crypto_box_keypair().publicKey),
    signedPreKeyId: aliceSpk.id,
  },
  message: new Uint8Array(48),
};
let threwPrekey = false;
try {
  await S.receiveEnvelope(alice, aliceContact, forgedPrekey, aliceLookup);
} catch {
  threwPrekey = true;
}
// NEGATIVE CONTROL: if the forged cert were NOT rejected, the whole test is
// meaningless — assert it actually threw.
ok('gefälschtes Prekey wird abgewiesen (Negativkontrolle)', threwPrekey === true);
ok('Ratchet UNVERÄNDERT (nicht genullt)', aliceContact.ratchet !== null && aliceContact.ratchet === ratchetBefore);
ok('pendingHeader UNVERÄNDERT (nicht gelöscht)', aliceContact.pendingHeader !== null);

console.log('\n[F: gefälschtes msg löscht pendingHeader NICHT]');
const forgedMsg = { type: 'msg', conv: aliceContact.roomId, message: new Uint8Array(48) };
let threwMsg = false;
try {
  await S.receiveEnvelope(alice, aliceContact, forgedMsg, aliceLookup);
} catch {
  threwMsg = true;
}
ok('gefälschtes msg wird abgewiesen (Negativkontrolle)', threwMsg === true);
ok('pendingHeader nach gefälschtem msg noch gesetzt', aliceContact.pendingHeader !== null);
ok('Ratchet nach gefälschtem msg noch da', aliceContact.ratchet !== null);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
