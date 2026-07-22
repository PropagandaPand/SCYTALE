// Stage 3d step 6c — self-sync. A copy of a message I sent is mirrored to my OWN
// other devices via a hidden self-contact (peerMaster == my master). The copy
// carries the TARGET peer's master, so the receiving device files it under the
// right conversation room (decrypt-room ≠ display-room), plus the ORIGINAL mid so
// it dedups against the peer's own fan-out copy. A sync frame is terminal.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const eqh = (a, b) => sodium.to_hex(a) === sodium.to_hex(b);

const myMasterKp = sodium.crypto_sign_keypair();
const mkDev = async () => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: { publicKey: new Uint8Array(myMasterKp.publicKey), privateKey: new Uint8Array(myMasterKp.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(myMasterKp.privateKey, 1, sign.publicKey, dh.publicKey),
  };
  const spk = await S.generateSignedPreKey(id, 1);
  const entry = { signPub: id.sign.publicKey, dhPub: id.dh.publicKey, deviceCert: id.deviceCert,
    signedPreKey: { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature } };
  const lookup = { signedPreKey: (i) => (spk.id === i ? spk.keyPair : undefined), consumeOneTimePreKey: () => undefined };
  return { id, spk, entry, lookup };
};

const A = await mkDev(); // the device I'm sending from
const B = await mkDev(); // my OTHER device

// A's hidden self-contact: peerMaster == my master, peerDeviceList == {A, B}.
const bBundle = S.currentBundle(B.id, { signedPreKey: B.spk, oneTimePreKeys: [] });
const selfContact = await S.makeContact(S.asMasterPub(A.id.master.publicKey), bBundle);
selfContact.peerDeviceList = await S.signDeviceList(myMasterKp.privateKey, myMasterKp.publicKey, 1, 1, [A.entry, B.entry]);

console.log('\n[Schritt 6c: Self-Sync einer gesendeten Nachricht an mein anderes Gerät]');

const peerMaster = sodium.crypto_sign_keypair().publicKey; // the conversation the message belonged to
const origMid = S.randomMid();
const sync = { kind: 'sync', targetPeerMaster: new Uint8Array(peerMaster), origin: 'sent', innerMid: origMid, ts: 4242, inner: { kind: 'text', text: 'an mein Zweitgerät' } };

// A fans the sync to my devices, EXCLUDING A itself → exactly one copy, for B.
const { deliveries } = await S.fanoutDeliveries(A.id, selfContact, sync, S.randomMid(), A.id.sign.publicKey);
ok('genau eine Zustellung — an mein anderes Gerät (nicht an mich selbst)',
  deliveries.length === 1 && eqh(deliveries[0].deviceSignPub, B.id.sign.publicKey));

// B decrypts the sync copy.
const env = await S.decodeEnvelope((await S.openPayload(B.id, deliveries[0].sealed)).payload);
const bSelf = await S.makeContactFromHeader(S.asMasterPub(B.id.master.publicKey), env.x3dh);
const r = await S.receiveEnvelope(B.id, bSelf, env, B.lookup);
ok('B empfängt kind=sync', r.content.kind === 'sync');
ok('trägt den Ziel-Peer-Master (Anzeige-Raum ≠ Decrypt-Raum)', eqh(r.content.targetPeerMaster, peerMaster));
ok('trägt die ORIGINAL-mid (Dedup gegen Peer-Fan-out)', r.content.innerMid === origMid);
ok('innerer Inhalt + Zeitstempel erhalten', r.content.inner.kind === 'text' && r.content.inner.text === 'an mein Zweitgerät' && r.content.ts === 4242);

// The display room the receiver files it under is the PEER conversation, not the self-room.
const displayRoom = await S.computeMasterRoomId(S.asMasterPub(B.id.master.publicKey), S.asMasterPub(peerMaster));
const selfRoom = await S.computeMasterRoomId(S.asMasterPub(B.id.master.publicKey), S.asMasterPub(B.id.master.publicKey));
ok('Anzeige-Raum = Peer-Raum, NICHT der self-Raom (Negativkontrolle)', displayRoom !== selfRoom);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
