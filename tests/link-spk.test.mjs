// Stage 3d step 6c — after device linking the master-signed device list carries a
// signed prekey for BOTH devices, so peers can fan out X3DH to either. P's entry
// keeps its SPK (preserved from the current list); N's SPK arrives in the link
// request (QR v2) and P puts it in the new entry.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const eqh = (a, b) => sodium.to_hex(a) === sodium.to_hex(b);

const master = sodium.crypto_sign_keypair(); // shared master (P holds the private key)
const mkDev = async () => {
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: { publicKey: new Uint8Array(master.publicKey), privateKey: new Uint8Array(master.privateKey) },
    sign: { publicKey: new Uint8Array(sign.publicKey), privateKey: new Uint8Array(sign.privateKey) },
    dh: { publicKey: new Uint8Array(dh.publicKey), privateKey: new Uint8Array(dh.privateKey) },
    epoch: 1,
    deviceCert: await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey),
  };
  const spk = await S.generateSignedPreKey(id, 1);
  const spkPub = { id: spk.id, pub: spk.keyPair.publicKey, signature: spk.signature };
  return { id, spk, spkPub };
};

const P = await mkDev(); // primary
const N = await mkDev(); // newly linked

console.log('\n[Schritt 6c: Linking-Liste trägt Signed Prekeys für BEIDE Geräte]');

// P's current list already carries P's own signed prekey (loadOrCreateOwnDeviceList).
const currentList = await S.signDeviceList(master.privateKey, master.publicKey, 1, 1, [
  { signPub: P.id.sign.publicKey, dhPub: P.id.dh.publicKey, deviceCert: P.id.deviceCert, signedPreKey: P.spkPub },
]);
// N's link request carries N's signed prekey (QR v2).
const req = {
  deviceSignPub: N.id.sign.publicKey,
  deviceDhPub: N.id.dh.publicKey,
  sasEphPub: (sodium.crypto_box_keypair()).publicKey,
  signedPreKey: N.spkPub,
};
const { newList } = await S.createLinkGrant(master.privateKey, master.publicKey, 1, currentList, req);

ok('neue Liste verifiziert unter dem Master', (await S.verifyDeviceList(newList, master.publicKey, 1)) === true);
ok('neue Liste hat zwei Geräte', newList.devices.length === 2);
const pe = newList.devices.find((d) => eqh(d.signPub, P.id.sign.publicKey));
const ne = newList.devices.find((d) => eqh(d.signPub, N.id.sign.publicKey));
ok('P-Eintrag behält seinen SPK', pe?.signedPreKey?.id === P.spk.id && eqh(pe.signedPreKey.pub, P.spk.keyPair.publicKey));
ok('N-Eintrag bekommt seinen SPK aus dem Request', ne?.signedPreKey?.id === N.spk.id && eqh(ne.signedPreKey.pub, N.spk.keyPair.publicKey));

// Both entries yield an initiable bundle (a peer can fan out to either).
ok('bundleFromDeviceEntry(P) initiierbar', S.bundleFromDeviceEntry(master.publicKey, 1, pe) !== null);
ok('bundleFromDeviceEntry(N) initiierbar', S.bundleFromDeviceEntry(master.publicKey, 1, ne) !== null);

// NEGATIVE CONTROL: swap N's SPK pub in the finished list → master signature breaks.
const tampered = { ...newList, devices: newList.devices.map((d) => (eqh(d.signPub, N.id.sign.publicKey) ? { ...d, signedPreKey: { ...ne.signedPreKey, pub: (sodium.crypto_box_keypair()).publicKey } } : d)) };
ok('gefälschter N-SPK bricht die Master-Signatur (Negativkontrolle)', (await S.verifyDeviceList(tampered, master.publicKey, 1)) === false);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
