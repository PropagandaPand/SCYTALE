// Stage 3d — the simultaneous-init tie-break must order the two DEVICES actually
// racing (my device vs the peer's SENDING device), not the person-level primary
// (Review fund 2). Keys are chosen P.dh < M.dh < S.dh so that the OLD code (compare
// against contact.peerDhPub = the primary P) makes BOTH endpoints adopt → mismatched
// sessions → no convergence; the fix (compare against x3dh.identityDhPub = S) makes
// M keep its initiator and S adopt → they converge on one session.
import * as S_ from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S_.getSodium();
const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

// Three X25519 keys sorted low<mid<high → assign P=low (primary), M=mid, S=high.
const dhs = [sodium.crypto_box_keypair(), sodium.crypto_box_keypair(), sodium.crypto_box_keypair()]
  .sort((x, y) => cmp(x.publicKey, y.publicKey));
const [pDh, mDh, sDh] = dhs;

const mkDev = async (masterKp, dhKp) => {
  const sign = sodium.crypto_sign_keypair();
  const id = {
    master: { publicKey: new Uint8Array(masterKp.publicKey), privateKey: new Uint8Array(masterKp.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dhKp.publicKey), privateKey: new Uint8Array(dhKp.privateKey) },
    epoch: 1,
    deviceCert: await S_.signDeviceCert(masterKp.privateKey, 1, sign.publicKey, dhKp.publicKey),
  };
  const spk = await S_.generateSignedPreKey(id, 1);
  const entry = { signPub: id.sign.publicKey, dhPub: id.dh.publicKey, deviceCert: id.deviceCert,
    signedPreKey: { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature } };
  const bundle = S_.currentBundle(id, { signedPreKey: spk, oneTimePreKeys: [] });
  const lookup = { signedPreKey: (i) => (spk.id === i ? spk.keyPair : undefined), consumeOneTimePreKey: () => undefined };
  return { id, spk, entry, bundle, lookup };
};

const peerMaster = sodium.crypto_sign_keypair();
const myMaster = sodium.crypto_sign_keypair();
const P = await mkDev(peerMaster, pDh); // peer primary (low dh)
const S = await mkDev(peerMaster, sDh); // peer secondary (high dh)
const M = await mkDev(myMaster, mDh); // me, single device (middle dh)

console.log('\n[Multi-Device Sim-Init: konvergiert über das ECHTE Sender-Gerät (Fund 2)]');

// M's contact for the peer: pinned to primary P, but its device list has {P, S}.
const mContact = await S_.makeContact(S_.asMasterPub(myMaster.publicKey), P.bundle);
mContact.peerDeviceList = await S_.signDeviceList(peerMaster.privateKey, peerMaster.publicKey, 1, 1, [P.entry, S.entry]);

// M fans out 'hi M' to {P, S} → an in-flight initiator session to S (pendingHeader set).
const { deliveries } = await S_.fanoutDeliveries(M.id, mContact, { kind: 'text', text: 'hi M' }, S_.randomMid());
const sealedForS = deliveries.find((d) => cmp(d.deviceSignPub, S.id.sign.publicKey) === 0).sealed;

// S independently initiates to M ('hi S') → an in-flight initiator session to M.
const sContactForM = await S_.makeContact(S_.asMasterPub(peerMaster.publicKey), M.bundle);
const { deliveries: sDel } = await S_.fanoutDeliveries(S.id, sContactForM, { kind: 'text', text: 'hi S' }, S_.randomMid());
const sealedForM = sDel[0].sealed;

// The race resolves: M (mid dh < S high dh) KEEPS its initiator → throws on S's prekey.
const envS = await S_.decodeEnvelope((await S_.openPayload(M.id, sealedForM)).payload);
let mKept = false;
try { await S_.receiveEnvelope(M.id, mContact, envS, M.lookup); } catch { mKept = true; }
ok('M behält seinen Initiator (gewinnt den Tie-Break gegen S)', mKept === true);

// S (high dh > M mid dh) ADOPTS M's session → decrypts M's original 'hi M'.
const envM = await S_.decodeEnvelope((await S_.openPayload(S.id, sealedForS)).payload);
const rS = await S_.receiveEnvelope(S.id, sContactForM, envM, S.lookup);
ok('S adoptiert M-Session und entschlüsselt M-Nachricht', rS.content.kind === 'text' && rS.content.text === 'hi M');

// CONVERGENCE: M sends a follow-up over its kept initiator; S decrypts on the adopted
// session. With the OLD code both would have adopted → this decrypt would FAIL.
const { deliveries: d2 } = await S_.fanoutDeliveries(M.id, mContact, { kind: 'text', text: 'zweite' }, S_.randomMid());
const sealedForS2 = d2.find((d) => cmp(d.deviceSignPub, S.id.sign.publicKey) === 0).sealed;
const envM2 = await S_.decodeEnvelope((await S_.openPayload(S.id, sealedForS2)).payload);
const rS2 = await S_.receiveEnvelope(S.id, sContactForM, envM2, S.lookup);
ok('KONVERGENZ: M→S Folgenachricht entschlüsselt (kein Deadlock/Desync)', rS2.content.text === 'zweite');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
