import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const sodium = await S.getSodium();
const b64 = (x) => sodium.to_base64(x, sodium.base64_variants.ORIGINAL);

// Build A (us) and two identities for B: the old (to be retired) and the new one.
const mkIdentity = async () => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const epoch = 1;
  const cert = await S.signDeviceCert(master.privateKey, epoch, sign.publicKey, dh.publicKey);
  return { master, sign, dh, epoch, cert };
};

const bOld = await mkIdentity();
const bNew = await mkIdentity();
const me = await mkIdentity();

// A contact pinned to B's OLD master, with a pending proposal for the NEW one.
// roomId must be REALLY derived: the binding check in receiveEnvelope
// re-derives it from our DH key and the claimed identity DH key. A retired
// master keeps the old DEVICE keys, so it still binds to this same roomId —
// which is exactly why the denylist check stays reachable for it.
const contact = {
  roomId: await S.computeRoomId(me.dh.publicKey, bOld.dh.publicKey),
  peerMasterPub: bOld.master.publicKey,
  peerEpoch: 1,
  peerSignPub: bOld.sign.publicKey,
  peerDhPub: bOld.dh.publicKey,
  peerFingerprint: 'fp',
  verified: true,
  ratchet: null,
  pendingHeader: null,
  pendingMaster: {
    masterPub: bNew.master.publicKey,
    epoch: bNew.epoch,
    signPub: bOld.sign.publicKey,
    dhPub: bOld.dh.publicKey, // device keys survive an identity swap
  },
};

console.log('\n[Denylist wird beim Akzeptieren gefüllt]');
const accepted = await S.acceptMasterChange(contact);
ok('acceptMasterChange meldet Erfolg', accepted === true);
ok('alter Master steht auf der Denylist', contact.retiredMasters?.includes(b64(bOld.master.publicKey)));
ok('neuer Master ist gepinnt', b64(contact.peerMasterPub) === b64(bNew.master.publicKey));
ok('verified wurde zurückgesetzt', contact.verified === false);
ok('noch kein Ablehnungs-Hinweis', contact.retiredAttempt === undefined);

// --- The downgrade attempt --------------------------------------------------
console.log('\n[Downgrade-Versuch: sichtbar, aber nur einmal]');

// Craft a prekey envelope claiming the RETIRED master.
const makeRetiredEnvelope = async () => ({
  type: 'prekey',
  conv: contact.roomId,
  x3dh: {
    masterPub: bOld.master.publicKey,
    epoch: bOld.epoch,
    identitySignPub: bOld.sign.publicKey,
    identityDhPub: bOld.dh.publicKey,
    deviceCert: bOld.cert,
    ephemeralPub: sodium.crypto_box_keypair().publicKey,
    signedPreKeyId: 1,
    oneTimePreKeyId: undefined,
  },
  message: new Uint8Array(32),
});

const lookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };
const meKeys = { sign: me.sign, dh: me.dh, master: me.master, epoch: 1, deviceCert: me.cert };

const attempt = async () => {
  try {
    await S.receiveEnvelope(meKeys, contact, await makeRetiredEnvelope(), lookup);
    return null;
  } catch (e) { return e; }
};

const e1 = await attempt();
ok('erster Versuch -> RetiredIdentityError', e1?.name === 'RetiredIdentityError');
ok('erster Versuch ist firstOccurrence', e1?.firstOccurrence === true);
ok('Kontakt merkt sich den Versuch', contact.retiredAttempt === true);
ok('verified bleibt unangetastet (kein Trust-DoS)', contact.verified === false);
ok('kein pendingMaster aus dem alten Key', contact.pendingMaster === undefined);
ok('Master bleibt der neue', b64(contact.peerMasterPub) === b64(bNew.master.publicKey));

const e2 = await attempt();
ok('zweiter Versuch -> weiterhin abgelehnt', e2?.name === 'RetiredIdentityError');
ok('zweiter Versuch ist NICHT firstOccurrence (kein Toast)', e2?.firstOccurrence === false);

// Flood: 50 more attempts must not produce a single further alert.
let alerts = 0;
for (let i = 0; i < 50; i++) { const e = await attempt(); if (e?.firstOccurrence) alerts++; }
ok('50 weitere Versuche -> 0 zusätzliche Warnungen', alerts === 0);
ok('Ablehnung bleibt bei allen 50 bestehen', contact.retiredAttempt === true);

// --- Persistence ------------------------------------------------------------
console.log('\n[Zustand übersteht Serialisierung]');
const round = await S.deserializeContact(await S.serializeContact(contact));
ok('retiredAttempt überlebt', round.retiredAttempt === true);
ok('Denylist überlebt', round.retiredMasters?.includes(b64(bOld.master.publicKey)));

// Dismissing the notice must NOT clear the denylist.
round.retiredAttempt = undefined;
const round2 = await S.deserializeContact(await S.serializeContact(round));
ok('nach "Verstanden": Hinweis weg', round2.retiredAttempt === undefined);
ok('nach "Verstanden": Denylist BLEIBT', round2.retiredMasters?.includes(b64(bOld.master.publicKey)));

// And a new attempt after dismissal alerts again (state changed back).
const e3 = await (async () => { try { await S.receiveEnvelope(meKeys, round2, await makeRetiredEnvelope(), lookup); } catch (e) { return e; } })();
ok('nach Bestätigen warnt ein neuer Versuch wieder', e3?.firstOccurrence === true);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
