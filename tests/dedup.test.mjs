// Global retired-master denylist (Stage 3c). Under master-based roomId the old
// per-contact retiredMasters + per-message RetiredIdentityError branch is gone
// (a retired-master prekey lands a different room and never reaches the contact).
// The defence moved to a GLOBAL, master-indexed denylist, checked BEFORE any
// state on the two deliberate paths (acceptRotation, auto-create) and populated
// by acceptMasterChange. This suite pins that integration.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const hex = (x) => sodium.to_hex(x);

const mkId = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  return { master, sign, dh, epoch: 1, cert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey) };
};

const alice = await mkId();
const bobOld = await mkId();
const bobNew = await mkId();

const mkContact = async () => ({
  roomId: await S.computeMasterRoomId(alice.master.publicKey, bobOld.master.publicKey),
  ownMasterPub: alice.master.publicKey,
  peerMasterPub: bobOld.master.publicKey,
  peerEpoch: 1,
  peerSignPub: bobOld.sign.publicKey,
  peerDhPub: bobOld.dh.publicKey,
  peerFingerprint: 'fp',
  verified: true,
  regime: 'master',
  sessions: new Map(),
});

console.log('\n[acceptMasterChange füllt die globale Denylist]');
{
  const c = await mkContact();
  c.pendingMaster = { masterPub: bobNew.master.publicKey, epoch: 2, signPub: bobNew.sign.publicKey, dhPub: bobNew.dh.publicKey };
  const r = await S.acceptMasterChange(c);
  ok('gibt den ersetzten (alten) Master als retiredMaster zurück',
    r?.retiredMaster === (await S.masterKeyB64(bobOld.master.publicKey)));
  ok('neuer Master gepinnt', hex(c.peerMasterPub) === hex(bobNew.master.publicKey));
  ok('verified=false (TOFU-Bruch)', c.verified === false);
  ok('roomId auf den neuen Master umgeschlüsselt',
    c.roomId === (await S.computeMasterRoomId(alice.master.publicKey, bobNew.master.publicKey)));
}

console.log('\n[Denylist ZUERST: acceptRotation auf einen verlassenen Master wird verworfen]');
{
  // Contact pinned to bobNew; bobOld is retired. An attacker crafts a valid-
  // looking "rotation" from bobNew BACK to the abandoned bobOld.
  const c = await mkContact();
  c.peerMasterPub = bobNew.master.publicKey;
  c.peerEpoch = 2;
  c.roomId = await S.computeMasterRoomId(alice.master.publicKey, bobNew.master.publicKey);
  const retired = new Set([await S.masterKeyB64(bobOld.master.publicKey)]);

  const downgrade = await S.makeRotation(
    { publicKey: new Uint8Array(bobNew.master.publicKey), privateKey: new Uint8Array(bobNew.master.privateKey) },
    { publicKey: new Uint8Array(bobOld.master.publicKey), privateKey: new Uint8Array(bobOld.master.privateKey) },
    3,
  );
  const before = { room: c.roomId, master: hex(c.peerMasterPub), epoch: c.peerEpoch, verified: c.verified };
  let err = null;
  try { await S.acceptRotation(c, downgrade, retired); } catch (e) { err = e; }
  ok('Downgrade auf verlassenen Master abgelehnt', err?.name === 'RetiredIdentityError');
  ok('KEINE Zustandsänderung (Denylist vor allem)',
    c.roomId === before.room && hex(c.peerMasterPub) === before.master &&
    c.peerEpoch === before.epoch && c.verified === before.verified);
}

console.log('\n[masterKeyB64: kanonische Kodierung, konsistent für die Denylist]');
{
  const k1 = await S.masterKeyB64(bobOld.master.publicKey);
  const k2 = await S.masterKeyB64(new Uint8Array(bobOld.master.publicKey));
  ok('deterministisch', k1 === k2);
  ok('verschiedene Master → verschiedene Keys', k1 !== (await S.masterKeyB64(bobNew.master.publicKey)));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
