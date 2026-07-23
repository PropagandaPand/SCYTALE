// #9 step 7c — the ratchet-critical send primitive. fanoutChunks encrypts a large
// attachment as an ordered stream of 'chunk' frames per capable peer device. This
// verifies the scary part end-to-end: every chunk is its own ratchet message, they
// all decrypt on the receiver, and reassemble byte-for-byte (a nonce reuse or a
// dropped/duplicated chain-key advance would corrupt or fail decryption). Plus the
// capability gate: a device we haven't learned pv>=2 for is NOT sent chunks.
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
const noLookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };
const bundleFor = async (p) => {
  const spk = await S.generateSignedPreKey(p, 1);
  return { bundle: S.currentBundle(p, { signedPreKey: spk, oneTimePreKeys: [] }), lookup: { signedPreKey: (id) => (spk.id === id ? spk.keyPair : undefined), consumeOneTimePreKey: () => undefined } };
};

const alice = await mkId();
const bob = await mkId();
const { bundle: bobBundle, lookup: bobLookup } = await bundleFor(bob);
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bobBundle);

console.log('\n[7c: fanoutChunks encrypts, peer reassembles byte-for-byte]');

// Bidirectional first exchange so BOTH sides learn each other's pv (>= 2).
const e1 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hi'))).payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), e1.x3dh);
await S.receiveEnvelope(bob, bobContact, e1, bobLookup); // Bob learns Alice
const eB = await S.decodeEnvelope((await S.openPayload(alice, await S.sendMessage(bob, bobContact, 'yo'))).payload);
await S.receiveEnvelope(alice, aliceContact, eB, noLookup); // Alice learns Bob (pv 2)
ok('Alice hat Bobs Geräte-pv gelernt (2)', S.deviceProtocolVersion(aliceContact, bob.sign.publicKey) === 2);

// A "large" attachment: 200 KB over 64 KB wire chunks → 4 chunks (last partial).
const CHUNK = 64 * 1024;
const data = new Uint8Array(200 * 1024);
for (let i = 0; i < data.length; i++) data[i] = (i * 131 + 7) & 0xff;
const total = Math.ceil(data.length / CHUNK);
const desc = { tid: 'transferABC', total, size: data.length, name: 'clip.bin', mime: 'application/octet-stream' };

const out = await S.fanoutChunks(alice, aliceContact, desc, data, CHUNK);
ok('an das eine fähige Gerät gefanned', out.perDevice.length === 1 && out.incapable.length === 0 && out.unreachable.length === 0);
ok('genau `total` sealed Chunks', out.perDevice[0].sealed.length === total);

// Bob receives every sealed chunk (deliver out of order to prove idx-independence).
const received = new Map();
const order = [...out.perDevice[0].sealed.keys()].reverse(); // reverse order
for (const i of order) {
  const env = await S.decodeEnvelope((await S.openPayload(bob, out.perDevice[0].sealed[i])).payload);
  const r = await S.receiveEnvelope(bob, bobContact, env, bobLookup);
  if (r.content.kind === 'chunk') received.set(r.content.idx, r.content);
}
ok('alle Chunks entschlüsselt', received.size === total);
ok('tid/total tragen auf jedem Chunk', [...received.values()].every((c) => c.tid === 'transferABC' && c.total === total));

// Reassemble by idx and compare byte-for-byte.
const parts = [];
for (let i = 0; i < total; i++) parts.push(received.get(i).data);
const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
let off = 0;
for (const p of parts) { joined.set(p, off); off += p.length; }
let same = joined.length === data.length;
if (same) for (let i = 0; i < data.length; i++) if (joined[i] !== data[i]) { same = false; break; }
ok('reassembliert byte-für-byte == Original (Ratchet korrekt, kein Nonce-Reuse)', same);

// NEGATIVE CONTROL: capability gate. A device we've never learned pv>=2 for must NOT
// be sent chunks — it goes to `incapable`, and no sealed stream is produced for it.
const carol = await mkId();
const { bundle: carolBundle } = await bundleFor(carol);
const carolContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), carolBundle);
// establish a session (so it's not merely 'unreachable') but never learn pv:
await S.sendMessage(alice, carolContact, 'seed');
const outC = await S.fanoutChunks(alice, carolContact, desc, data, CHUNK);
ok('Negativkontrolle: unbekanntes pv ⇒ incapable, keine Chunks gesendet',
  outC.perDevice.length === 0 && outC.incapable.length === 1);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
