// Device revocation / two-sided unlink: the core CRYPTO GATING of the self-wipe path
// (a linked device destroys its container when its own master signs a NEWER list that
// omits it) + the unlinkreq wire frame. IDB-bound bits (revokeDevice's save, the actual
// wipe) are exercised on-device; here we prove the properties the safety hook relies on,
// each with a negative control (see MEMORY: "jede Assertion einmal absichtlich falsch füttern").
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
const entryOf = (id) => ({ signPub: id.sign.publicKey, dhPub: id.dh.publicKey, deviceCert: id.deviceCert });

console.log('\n[Device revocation → self-wipe gating: only a verified, newer, own-master list that omits me]');

// One master, two devices A (primary) + B (linked).
const A = await mkId();
const B = await mkId();
B.master = A.master; // same identity, second device
B.deviceCert = await S.signDeviceCert(A.master.privateKey, 1, B.sign.publicKey, B.dh.publicKey);
const master = A.master;

const listBoth = await S.signDeviceList(master.privateKey, master.publicKey, 1, 2, [entryOf(A), entryOf(B)]);
const revoked = await S.signDeviceList(master.privateKey, master.publicKey, 1, 3, [entryOf(A)]); // B removed

ok('revoked list verifies against the master (a receiver will adopt it)', (await S.verifyDeviceList(revoked, master.publicKey, 1)) === true);
ok('revoked list is strictly NEWER than the two-device list (no rollback)', S.isNewerDeviceList(revoked, listBoth) === true);
ok('the removed device B is NOT in the revoked list → B self-wipes', S.deviceInList(revoked, B.sign.publicKey) === false);
ok('the kept device A IS still in the list → A keeps working', S.deviceInList(revoked, A.sign.publicKey) === true);

// NEGATIVE CONTROL 1: a "revocation" signed by a FOREIGN key (claiming my master) must
// NOT verify — otherwise anyone could wipe my linked device.
const evil = sodium.crypto_sign_keypair();
const forged = await S.signDeviceList(new Uint8Array(evil.privateKey), master.publicKey, 1, 3, [entryOf(A)]);
ok('Negativkontrolle: fremd-signierte Revocation verifiziert NICHT (kein Wipe)', (await S.verifyDeviceList(forged, master.publicKey, 1)) === false);

// NEGATIVE CONTROL 2: an OLDER list that omits B (a rollback) is not newer → would be
// rejected by the receiver's isNewerDeviceList guard, so it can't force a stale wipe.
const older = await S.signDeviceList(master.privateKey, master.publicKey, 1, 1, [entryOf(A)]);
ok('Negativkontrolle: älterer B-loser Listenstand ist NICHT newer (Rollback blockiert)', S.isNewerDeviceList(older, listBoth) === false);

console.log('\n[unlinkreq wire frame (tag 20)]');
const framed = await S.frameContent({ kind: 'unlinkreq' });
ok('unlinkreq-Frame beginnt mit Byte 20', framed[0] === 20);
const back = await S.unframeContent(framed);
ok('Roundtrip: kind === unlinkreq', back.kind === 'unlinkreq');
// NEGATIVE CONTROL: a byte-20 frame must not be mistaken for anything else.
ok('Negativkontrolle: unlinkreq wird NICHT als text/file dekodiert', back.kind !== 'text' && back.kind !== 'file');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
