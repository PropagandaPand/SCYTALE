// Stage 3d step 1 — Invariant I holds PER SESSION. A conversation is one person,
// but each peer DEVICE gets its OWN Double-Ratchet session in Contact.sessions.
// Each session must own an INDEPENDENT RatchetState — never aliased or cloned
// across two map entries, because a shared chain state re-derives the same message
// key = (key, nonce) reuse = two-time-pad (leaks plaintext XOR + the GHASH auth
// key → forgery). This suite proves independence for two devices AND demonstrates,
// as the negative control, that a cloned ratchet IS a two-time-pad.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

const mkDevice = async (masterKp) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return {
    master: { publicKey: new Uint8Array(masterKp.publicKey), privateKey: new Uint8Array(masterKp.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(masterKp.privateKey, 1, sign.publicKey, dh.publicKey),
  };
};

// Alice's TWO devices share ONE master; Bob is a separate person.
const aliceMaster = sodium.crypto_sign_keypair();
const A1 = await mkDevice(aliceMaster);
const A2 = await mkDevice(aliceMaster);
const bob = await mkDevice(sodium.crypto_sign_keypair());

const bobSpk = await S.generateSignedPreKey(bob, 1);
const bobBundle = S.currentBundle(bob, { signedPreKey: bobSpk, oneTimePreKeys: [] });
const bobLookup = {
  signedPreKey: (id) => (bobSpk.id === id ? bobSpk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};

console.log('\n[Invariante I pro Session: jeder Ratchet hat genau einen Besitzer]');

// A1 → Bob: establishes Bob's contact for Alice + session for device A1.
const a1c = await S.makeContact(S.asMasterPub(A1.master.publicKey), bobBundle);
const e1 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(A1, a1c, 'von A1'))).payload);
const bobC = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), e1.x3dh);
const c1 = await S.receiveEnvelope(bob, bobC, e1, bobLookup);

// Bob learns Alice's master-signed list {A1, A2}, so A2 becomes authorised.
const list = await S.signDeviceList(A1.master.privateKey, A1.master.publicKey, 1, 2, [
  { signPub: A1.sign.publicKey, dhPub: A1.dh.publicKey, deviceCert: A1.deviceCert },
  { signPub: A2.sign.publicKey, dhPub: A2.dh.publicKey, deviceCert: A2.deviceCert },
]);
await S.applyDeviceListUpdate(bobC, list, new Set());

// A2 → Bob: a SEPARATE device establishes its OWN session on the same contact.
const a2c = await S.makeContact(S.asMasterPub(A2.master.publicKey), bobBundle);
const e2 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(A2, a2c, 'von A2'))).payload);
const c2 = await S.receiveEnvelope(bob, bobC, e2, bobLookup);

const s1 = S.sessionFor(bobC, A1.sign.publicKey);
const s2 = S.sessionFor(bobC, A2.sign.publicKey);
ok('zwei Geräte → zwei Sessions in EINEM Personen-Kontakt', bobC.sessions.size === 2);
ok('beide Sessions haben einen eigenen Ratchet', !!s1?.ratchet && !!s2?.ratchet);
ok('die Ratchet-Objekte sind VERSCHIEDEN (kein Aliasing)', s1.ratchet !== s2.ratchet);
ok('beide Nachrichten unabhängig entschlüsselt', c1.kind === 'text' && c1.text === 'von A1' && c2.text === 'von A2');

console.log('\n[Negativkontrolle: geklonter Ratchet = Two-Time-Pad; Einzelbesitzer wiederholt nie]');

// A1's initiator ratchet has a sending chain (CKs). Clone it via the persistence
// round-trip and encrypt the SAME plaintext on the original and the clone: both
// start from the same CKs → same message key → same IV → byte-identical ciphertext.
const r = S.sessionFor(a1c, bob.sign.publicKey).ratchet;
const pt = new TextEncoder().encode('exakt derselbe Klartext');
const rClone = await S.deserializeState(await S.serializeState(r));
const m1 = await S.ratchetEncrypt(r, pt); // advances r
const m2 = await S.ratchetEncrypt(rClone, pt); // clone still at r's pre-m1 state
ok('geklonter Ratchet ⇒ IDENTISCHER Ciphertext = Two-Time-Pad (Negativkontrolle)',
  S.bytesEqual(m1.ciphertext, m2.ciphertext));

// The single-owner chain, in contrast, advanced past m1 and never repeats it.
const m3 = await S.ratchetEncrypt(r, pt);
ok('Einzelbesitzer-Chain wiederholt NIE (m1 ≠ m3 bei gleichem Klartext)',
  !S.bytesEqual(m1.ciphertext, m3.ciphertext));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
