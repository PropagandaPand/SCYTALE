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
  roomId: await S.computeRoomId(alice.dh.publicKey, bob.dh.publicKey),
  peerMasterPub: bob.master.publicKey,
  peerEpoch: 1,
  peerSignPub: bob.sign.publicKey,
  peerDhPub: bob.dh.publicKey,
  peerFingerprint: 'fp',
  verified: true,
  ratchet: null,
  pendingHeader: null,
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

// The legitimate case must still pass: same device keys, NEW master (rotation
// or a device-linking swap both look like this).
console.log('\n[legitimer Fall: gleiche Device-Keys, neuer Master]');
{
  const c = await mkContact();
  const bobNewMaster = sodium.crypto_sign_keypair();
  const newCert = await S.signDeviceCert(bobNewMaster.privateKey, 1, bob.sign.publicKey, bob.dh.publicKey);
  const e = await recv(c, envelope(c.roomId, bob, bobNewMaster.publicKey, newCert));
  ok('meldet MasterChangedError', e?.name === 'MasterChangedError');
  ok('pendingMaster wird angeboten', hex(c.pendingMaster?.masterPub) === hex(bobNewMaster.publicKey));
  ok('erste Meldung ist firstOccurrence', e?.firstOccurrence === true);

  // Fund 4: repeated identical claim must NOT re-alert.
  const e2 = await recv(c, envelope(c.roomId, bob, bobNewMaster.publicKey, newCert));
  ok('Wiederholung derselben Behauptung: kein neuer Alarm', e2?.firstOccurrence === false);
  let alerts = 0;
  for (let i = 0; i < 30; i++) { const r = await recv(c, envelope(c.roomId, bob, bobNewMaster.publicKey, newCert)); if (r?.firstOccurrence) alerts++; }
  ok('30 Wiederholungen -> 0 zusätzliche Alarme', alerts === 0);

  // A genuinely DIFFERENT claim deserves a fresh warning.
  const thirdMaster = sodium.crypto_sign_keypair();
  const cert3 = await S.signDeviceCert(thirdMaster.privateKey, 1, bob.sign.publicKey, bob.dh.publicKey);
  const e3 = await recv(c, envelope(c.roomId, bob, thirdMaster.publicKey, cert3));
  ok('andere Behauptung -> wieder Alarm', e3?.firstOccurrence === true);
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
  ok('auch 20 konsistente Behauptungen lassen verified stehen', c.verified === true);

  // verified must fall exactly when the user accepts — not before.
  await S.acceptMasterChange(c);
  ok('erst acceptMasterChange löscht verified', c.verified === false);
  ok('und pinnt den neuen Master', hex(c.peerMasterPub) === hex(bobNew.publicKey));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
