// Does the SECOND person who uses my shared code reach me?
//
// There is no prekey server: the code is built once from currentBundle() and
// handed out. This test establishes what actually happens when two different
// people initiate against the same code — a question the design docs left open.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const dec = new TextDecoder();

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

// Bob publishes ONE code. Alice and Carol both receive it.
const bob = await mkId();
// Built through the production helpers, so the test cannot drift from the
// real bundle shape.
const spk = await S.generateSignedPreKey(bob, 1);
const [opk] = await S.generateOneTimePreKeys(7, 1);
// THE production code path — currentBundle is what actually gets encoded into
// the QR/link. Asking it directly is the point: a test that assembled its own
// bundle would keep passing after currentBundle changed.
const store = { signedPreKey: spk, oneTimePreKeys: [opk] };
const bundle = S.currentBundle(bob, store);

const lookup = {
  signedPreKey: (id) => (store.signedPreKey.id === id ? store.signedPreKey.keyPair : undefined),
  consumeOneTimePreKey: (id) => {
    if (id === undefined) return undefined;
    const i = store.oneTimePreKeys.findIndex((o) => o.id === id);
    if (i === -1) return undefined;
    return store.oneTimePreKeys.splice(i, 1)[0].keyPair.privateKey;
  },
};

async function firstMessageFrom(who, text) {
  const contact = await S.makeContact(who.dh.publicKey, bundle);
  const sealed = await S.sendMessage(who, contact, text);
  const opened = await S.openPayload(bob, sealed);
  const env = await S.decodeEnvelope(opened.payload);
  const bobContact = await S.makeContactFromHeader(bob.dh.publicKey, env.x3dh);
  const content = await S.receiveEnvelope(bob, bobContact, env, lookup);
  return content.text;
}

console.log('\n[Zwei Personen, ein geteilter Code]');

ok('geteilter Code trägt KEINEN One-Time-Prekey', bundle.oneTimePreKey === undefined);
ok('Vorbedingung: Bob hätte lokal einen OPK vorrätig', store.oneTimePreKeys.length === 1);

const alice = await mkId();
let aliceText = '', aliceErr = null;
try { aliceText = await firstMessageFrom(alice, 'hallo von Alice'); } catch (e) { aliceErr = e; }
ok('Alice (erste) erreicht Bob', aliceText === 'hallo von Alice');
ok('kein OPK verbraucht — er war nie im Code', store.oneTimePreKeys.length === 1);

const carol = await mkId();
let carolText = '', carolErr = null;
try { carolText = await firstMessageFrom(carol, 'hallo von Carol'); } catch (e) { carolErr = e; }

console.log(`      Carol: ${carolErr ? carolErr.name + ' — ' + carolErr.message : '"' + carolText + '"'}`);
ok('Carol (zweite, GLEICHER Code) erreicht Bob ebenfalls', carolText === 'hallo von Carol');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
