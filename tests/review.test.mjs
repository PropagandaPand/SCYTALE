import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const hex = (x) => sodium.to_hex(x);

const mkId = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const cert = await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey);
  return { master, sign, dh, epoch: 1, cert };
};

const alice = await mkId();
const bob = await mkId();
const mallory = await mkId();

const meKeys = (i) => ({ sign: i.sign, dh: i.dh, master: i.master, epoch: 1, deviceCert: i.cert });
const lookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };

// Alice's contact for Bob, verified.
const mkContact = async () => ({
  roomId: await S.computeMasterRoomId(alice.master.publicKey, bob.master.publicKey),
  ownMasterPub: alice.master.publicKey,
  peerMasterPub: bob.master.publicKey,
  peerEpoch: 1,
  peerSignPub: bob.sign.publicKey,
  peerDhPub: bob.dh.publicKey,
  peerFingerprint: 'fp',
  verified: true,
  regime: 'master',
  sessions: new Map(),
});

const envelope = (conv, idty, masterPub, cert) => ({
  type: 'prekey',
  conv,
  x3dh: {
    masterPub,
    epoch: 1,
    identitySignPub: idty.sign.publicKey,
    identityDhPub: idty.dh.publicKey,
    deviceCert: cert,
    ephemeralPub: sodium.crypto_box_keypair().publicKey,
    signedPreKeyId: 1,
    oneTimePreKeyId: undefined,
  },
  message: new Uint8Array(32),
});

const recv = async (contact, env) => {
  try { await S.receiveEnvelope(meKeys(alice), contact, env, lookup); return null; }
  catch (e) { return e; }
};

// ── Fund 3: conv-Injektion ──────────────────────────────────────────────────
console.log('\n[conv-Injektion: fremde Device-Keys auf fremden Kontakt]');
{
  const c = await mkContact();
  // Mallory knows roomId(alice,bob) from the group roster and forges a claim
  // using HER OWN device keys, self-signed under her own master.
  const e = await recv(c, envelope(c.roomId, mallory, mallory.master.publicKey, mallory.cert));
  ok('Injektion wird verworfen', e !== null);
  ok('mit Bindungs-Fehler, nicht MasterChanged', /gehört nicht zu dieser Unterhaltung/.test(e?.message ?? ''));
  ok('KEIN pendingMaster gesetzt', c.pendingMaster === undefined);
  ok('verified unberührt', c.verified === true);
  ok('Pin unverändert (zeigt weiter auf Bob)', hex(c.peerMasterPub) === hex(bob.master.publicKey));
  ok('peerDhPub NICHT auf Mallory umgebogen', hex(c.peerDhPub) === hex(bob.dh.publicKey));
}

// Under master-based binding a prekey claiming a DIFFERENT master — even with
// the SAME device keys — is REJECTED, not turned into a pendingMaster. The old
// "prekey opens the door" mechanism is gone: a legitimate master change is
// handled deliberately via acceptRotation (proven chain) or the merge affordance
// (unproven previousMaster hint), never off an unauthenticated prekey. This is
// the injection defence: an attacker who knows bob's rostered dhPub still can't
// forge a chain or a cert under bob's master.
console.log('\n[Master-Wechsel per Prekey: abgelehnt, keine Tür]');
{
  const c = await mkContact();
  const bobNewMaster = sodium.crypto_sign_keypair();
  const newCert = await S.signDeviceCert(bobNewMaster.privateKey, 1, bob.sign.publicKey, bob.dh.publicKey);
  // conv = the pinned room; claimed master differs → rejected as not-this-conv.
  const e = await recv(c, envelope(c.roomId, bob, bobNewMaster.publicKey, newCert));
  ok('fremder Master (gleiche Device-Keys) -> abgelehnt', /gehört nicht zu dieser Unterhaltung/.test(e?.message ?? ''));
  ok('KEIN pendingMaster von einem Prekey', c.pendingMaster === undefined);
  ok('verified unberührt', c.verified === true);
  ok('Pin unverändert', hex(c.peerMasterPub) === hex(bob.master.publicKey));
}

// ── Fund 4: verified-DoS ────────────────────────────────────────────────────
console.log('\n[verified-DoS: verified überlebt jede Behauptung]');
{
  const c = await mkContact();
  const junkMaster = new Uint8Array(32).fill(7); // not even a real key
  await recv(c, envelope(c.roomId, bob, junkMaster, new Uint8Array(64)));
  ok('unsinnige Behauptung setzt verified NICHT zurück', c.verified === true);
  ok('unsinnige Behauptung erzeugt kein pendingMaster', c.pendingMaster === undefined);

  const bobNew = sodium.crypto_sign_keypair();
  const cert = await S.signDeviceCert(bobNew.privateKey, 1, bob.sign.publicKey, bob.dh.publicKey);
  for (let i = 0; i < 20; i++) await recv(c, envelope(c.roomId, bob, bobNew.publicKey, cert));
  ok('auch 20 Prekeys mit fremdem Master lassen verified stehen', c.verified === true);

  // verified falls only when the user deliberately accepts a pending claim.
  c.pendingMaster = { masterPub: bobNew.publicKey, epoch: 2, signPub: bob.sign.publicKey, dhPub: bob.dh.publicKey };
  const r = await S.acceptMasterChange(c);
  ok('erst acceptMasterChange löscht verified', c.verified === false);
  ok('und pinnt den neuen Master', hex(c.peerMasterPub) === hex(bobNew.publicKey));
  ok('acceptMasterChange gibt retiredMaster + neue roomId zurück', typeof r?.retiredMaster === 'string' && r?.newRoomId !== r?.oldRoomId);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
