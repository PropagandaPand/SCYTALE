// Stage 3d step 6 — fan-out. A message is encrypted for EVERY authorised device of
// the peer, each over its OWN session, all sharing ONE mid so the peer's devices
// dedup. A device we can't initiate to (no session, no signed prekey in the list)
// is reported unreachable, not silently dropped — the caller marks it "no longer
// valid", never failed.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

// A device sharing a given master, with its own signed prekey + list entry + lookup.
const mkDevice = async (masterKp, withSpk = true) => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: { publicKey: new Uint8Array(masterKp.publicKey), privateKey: new Uint8Array(masterKp.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(masterKp.privateKey, 1, sign.publicKey, dh.publicKey),
  };
  const spk = withSpk ? await S.generateSignedPreKey(id, 1) : null;
  const entry = {
    signPub: id.sign.publicKey,
    dhPub: id.dh.publicKey,
    deviceCert: id.deviceCert,
    ...(spk ? { signedPreKey: { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature } } : {}),
  };
  const lookup = { signedPreKey: (i) => (spk && spk.id === i ? spk.keyPair : undefined), consumeOneTimePreKey: () => undefined };
  return { id, spk, entry, lookup };
};

const bobMaster = sodium.crypto_sign_keypair();
const B1 = await mkDevice(bobMaster); // primary
const B2 = await mkDevice(bobMaster); // silent secondary (reached via its list SPK)
const B3 = await mkDevice(bobMaster, false); // no signed prekey → unreachable to initiate
const alice = await mkDevice(sodium.crypto_sign_keypair());

// Alice makes contact via B1's bundle, then learns Bob's list {B1, B2, B3}.
const b1Bundle = S.currentBundle(B1.id, { signedPreKey: B1.spk, oneTimePreKeys: [] });
const aliceC = await S.makeContact(S.asMasterPub(alice.id.master.publicKey), b1Bundle);
const bobList = await S.signDeviceList(bobMaster.privateKey, bobMaster.publicKey, 1, 2, [B1.entry, B2.entry, B3.entry]);
await S.applyDeviceListUpdate(aliceC, bobList, new Set());

console.log('\n[Schritt 6: Fan-out an alle autorisierten Geräte, eine mid, unerreichbar getrennt]');

const mid = S.randomMid();
const { deliveries, unreachable } = await S.fanoutDeliveries(alice.id, aliceC, { kind: 'text', text: 'fanout hallo' }, mid);

ok('zwei erreichbare Zustellungen (B1 + B2)', deliveries.length === 2);
ok('B3 ohne SPK ist UNERREICHBAR (nicht fehlgeschlagen, nicht stumm)',
  unreachable.length === 1 && S.bytesEqual(unreachable[0], B3.id.sign.publicKey));

// Each of Bob's devices decrypts its own copy — same content, same mid.
const decodeFor = async (dev) => {
  const d = deliveries.find((x) => S.bytesEqual(x.deviceSignPub, dev.id.sign.publicKey));
  const env = await S.decodeEnvelope((await S.openPayload(dev.id, d.sealed)).payload);
  const contact = await S.makeContactFromHeader(S.asMasterPub(dev.id.master.publicKey), env.x3dh);
  return S.receiveEnvelope(dev.id, contact, env, dev.lookup);
};
const r1 = await decodeFor(B1);
const r2 = await decodeFor(B2);
ok('B1 (primär) entschlüsselt seine Kopie', r1.content.kind === 'text' && r1.content.text === 'fanout hallo');
ok('B2 (stilles Gerät, via list-SPK initiiert) entschlüsselt seine Kopie', r2.content.text === 'fanout hallo');
ok('beide Kopien tragen DIESELBE mid (Dedup über Geräte)', r1.mid === mid && r2.mid === mid);

// NEGATIVE CONTROL: the two devices got INDEPENDENT sessions, not a shared/cloned
// ratchet — Alice's session map has a distinct entry per device.
ok('Alice hält getrennte Sessions je Bob-Gerät (kein Aliasing)',
  S.sessionFor(aliceC, B1.id.sign.publicKey).ratchet !== S.sessionFor(aliceC, B2.id.sign.publicKey).ratchet);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
