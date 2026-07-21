// One-shot generator for the PRE-3c migration fixture.
//
// Must be run against the v0.18.8 (pre-flip) code: it produces contacts with
// DEVICE-DH roomIds and regime absent — a vault as it exists in the wild before
// the master-based switch. After the flip the app only ever mints regime:'master'
// contacts, so this shape is no longer producible through normal paths; capturing
// it now is the only way the migration + restore re-key routine (Step 7) is ever
// exercised against real old data before the branch merges.
//
// Output: tests/fixtures/pre3c-vault.json (checked in, static, reproducible).
// Covers: a plain contact, a staleIdentity contact WITH ownMasterPub (post-3.7
// snapshot present), a staleIdentity contact WITHOUT it (the hard Fund-#1 case:
// the pre-link master is gone), and a group.
import * as S from './.bundle/entry.js';
import { writeFileSync } from 'node:fs';

const sodium = await S.getSodium();
const b64 = (b) => sodium.to_base64(b, sodium.base64_variants.ORIGINAL);

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

// My identity (the vault owner). masterCurrent is what I hold now; masterOld is
// a pre-link master that a stale contact still pins me under.
const me = await mkId();
const masterOld = sodium.crypto_sign_keypair();

const peerA = await mkId(); // plain contact
const peerB = await mkId(); // stale, snapshot present
const peerC = await mkId(); // stale, snapshot MISSING (hard case)

// A pre-3c contact literal: DEVICE-DH roomId, NO regime field, NO peerDeviceList.
const mkContact = async (peer, extra = {}) => ({
  roomId: await S.computeRoomId(me.dh.publicKey, peer.dh.publicKey), // device-DH regime
  peerMasterPub: peer.master.publicKey,
  peerEpoch: 1,
  peerSignPub: peer.sign.publicKey,
  peerDhPub: peer.dh.publicKey,
  peerFingerprint: await S.identityFingerprint(peer.master.publicKey, peer.master.publicKey),
  ratchet: null,
  pendingHeader: null,
  ...extra,
});

const contacts = [
  await mkContact(peerA),
  await mkContact(peerB, { staleIdentity: true, ownMasterPub: new Uint8Array(masterOld.publicKey) }),
  await mkContact(peerC, { staleIdentity: true }), // ownMasterPub absent → the un-migratable case
];

const messages = {};
for (const c of contacts) {
  messages[c.roomId] = [
    { mine: false, ts: 1000, text: 'hallo' },
    { mine: true, ts: 2000, text: 'hi zurück', status: 'sent' },
  ];
}

const fixture = {
  note: 'PRE-3c migration fixture (device-DH roomIds, regime absent). See tests/make-fixture.mjs.',
  createdUnder: 'v0.18.8',
  me: {
    masterPub: b64(me.master.publicKey),
    masterOldPub: b64(masterOld.publicKey), // the master stale contacts pin us under
    signPub: b64(me.sign.publicKey),
    dhPub: b64(me.dh.publicKey),
  },
  peers: {
    A: { masterPub: b64(peerA.master.publicKey), dhPub: b64(peerA.dh.publicKey) },
    B: { masterPub: b64(peerB.master.publicKey), dhPub: b64(peerB.dh.publicKey) },
    C: { masterPub: b64(peerC.master.publicKey), dhPub: b64(peerC.dh.publicKey) },
  },
  contacts: await Promise.all(contacts.map(async (c) => b64(await S.serializeContact(c)))),
  messages,
};

writeFileSync(
  new URL('./fixtures/pre3c-vault.json', import.meta.url),
  JSON.stringify(fixture, null, 2) + '\n',
);
console.log('Fixture geschrieben:', fixture.contacts.length, 'Kontakte,', Object.keys(messages).length, 'Räume');
console.log('  Kontakt B: staleIdentity MIT ownMasterPub (Snapshot vorhanden)');
console.log('  Kontakt C: staleIdentity OHNE ownMasterPub (harter Fund-#1-Fall)');
