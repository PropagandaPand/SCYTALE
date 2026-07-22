import * as L from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const sodium = await L.getSodium();

// --- QR versioning ----------------------------------------------------------
console.log('\n[QR-Format-Versionierung]');
const dev = sodium.crypto_sign_keypair();
const dh = sodium.crypto_box_keypair();
const eph = sodium.crypto_box_keypair();
const spk = { id: 7, pub: dh.publicKey, signature: await L.sign(dh.publicKey, dev.privateKey) }; // v2 (Stage 3d) carries N's signed prekey
const req = { deviceSignPub: dev.publicKey, deviceDhPub: dh.publicKey, sasEphPub: eph.publicKey, signedPreKey: spk };
const token = await L.encodeLinkRequest(req);
const rt = await L.decodeLinkRequest(token);
ok('roundtrip erhält alle Keys + Signed Prekey',
  sodium.to_hex(rt.deviceSignPub) === sodium.to_hex(dev.publicKey) &&
  sodium.to_hex(rt.deviceDhPub) === sodium.to_hex(dh.publicKey) &&
  sodium.to_hex(rt.sasEphPub) === sodium.to_hex(eph.publicKey) &&
  rt.signedPreKey.id === 7 && sodium.to_hex(rt.signedPreKey.pub) === sodium.to_hex(dh.publicKey));

// A future "v3" payload: different version byte → version error, not "invalid".
const v3 = new Uint8Array(1 + 32 + 32 + 32 + 16);
v3[0] = 3;
const v3tok = sodium.to_base64(v3, sodium.base64_variants.URLSAFE_NO_PADDING);
let msg = '';
try { await L.decodeLinkRequest(v3tok); } catch (e) { msg = e.message; }
ok('v3-Payload meldet Versions-Fehler, nicht "ungültig"', /Format-Version 3/.test(msg));
ok('Versions-Fehler nennt Update als Ausweg', /aktualisieren/i.test(msg));

let msg2 = '';
try { await L.decodeLinkRequest('!!!not base64!!!'); } catch (e) { msg2 = e.message; }
ok('echter Müll bleibt "Ungültiger Kopplungs-Code"', /Ungültiger Kopplungs-Code/.test(msg2));

let msg3 = '';
const short = new Uint8Array([2, 1, 2, 3]); // current version byte, wrong length
try { await L.decodeLinkRequest(sodium.to_base64(short, sodium.base64_variants.URLSAFE_NO_PADDING)); }
catch (e) { msg3 = e.message; }
ok('richtige Version, falsche Länge -> ungültig', /Ungültiger Kopplungs-Code/.test(msg3));

// --- Offer ------------------------------------------------------------------
console.log('\n[LinkOffer: SAS vor Credential]');
const pEph = sodium.crypto_box_keypair();
// v2 offer: ephemeral + master public + epoch. The master is here on purpose —
// the SAS is derived over it, so N needs it BEFORE the human confirms. It is
// public material, not a credential (issuing certs needs the private half).
const pMaster = sodium.crypto_sign_keypair();
const offerBytes = L.encodeLinkOffer({ sasEphPub: pEph.publicKey, masterPub: pMaster.publicKey, epoch: 1 });
ok('Offer ist 69 Bytes (Version + Ephemeral + Master + Epoch)', offerBytes.length === 69);
const offer = L.decodeLinkOffer(offerBytes);
ok('Offer-Roundtrip Ephemeral', sodium.to_hex(offer.sasEphPub) === sodium.to_hex(pEph.publicKey));
ok('Offer-Roundtrip Master', sodium.to_hex(offer.masterPub) === sodium.to_hex(pMaster.publicKey));

// The critical property: the offer carries NOTHING but the ephemeral.
// The offer carries a master PUBLIC key but never anything bearer-grade: no
// cert, no signature, nothing that lets the holder act as us.
ok('Offer enthält KEIN Credential (nur Public-Material)', offerBytes.length === 69);
let ov = '';
const badOffer = new Uint8Array(69); badOffer[0] = 9;
try { L.decodeLinkOffer(badOffer); } catch (e) { ov = e.message; }
ok('Offer-Version wird geprüft', /Format-Version 9/.test(ov));

// --- Grant no longer carries a SAS ephemeral --------------------------------
console.log('\n[Grant: kein SAS-Ephemeral mehr, Reihenfolge erzwungen]');
const master = sodium.crypto_sign_keypair();
const pDev = sodium.crypto_sign_keypair();
const pDh = sodium.crypto_box_keypair();
const epoch = 1;
const cert0 = await L.signDeviceCert(master.privateKey, epoch, pDev.publicKey, pDh.publicKey);
const list0 = await L.signDeviceList(master.privateKey, master.publicKey, epoch, 1, [
  { signPub: pDev.publicKey, dhPub: pDh.publicKey, deviceCert: cert0 },
]);

const { grant, newList } = await L.createLinkGrant(
  master.privateKey, master.publicKey, epoch, list0, req,
);
ok('createLinkGrant nimmt kein SAS-Ephemeral mehr entgegen', L.createLinkGrant.length === 5);
ok('Grant hat kein sasEphPub-Feld', grant.sasEphPub === undefined);
ok('Grant verifiziert für N', await L.verifyLinkGrant(grant, dev.publicKey, dh.publicKey));
ok('neue Liste hat Version 2', newList.version === 2);
ok('neue Liste enthält N', L.deviceInList(newList, dev.publicKey));

// Abort-before-commit leaves nothing: the ORIGINAL list is untouched.
ok('Abbruch vor Commit: alte Liste unverändert (v1, ohne N)',
  list0.version === 1 && !L.deviceInList(list0, dev.publicKey));

// --- SAS agreement over the two-message flow --------------------------------
console.log('\n[SAS beidseitig gleich über Offer-Flow]');
const nId = sodium.crypto_sign_keypair();
const pId = sodium.crypto_sign_keypair();
// N side: has own eph priv + P's eph pub (from the offer)
const sasN = await L.computeSas(eph.privateKey, eph.publicKey, pEph.publicKey, nId.publicKey, pId.publicKey);
// P side: has own eph priv + N's eph pub (from the QR)
const sasP = await L.computeSas(pEph.privateKey, pEph.publicKey, eph.publicKey, pId.publicKey, nId.publicKey);
ok('beide Seiten leiten dieselben 7 Emoji ab', sasN.emoji.map(x=>x.char).join(" ") === sasP.emoji.map(x=>x.char).join(" "));
ok('SAS hat 7 Emoji', sasN.emoji.length === 7);

// MITM: attacker substitutes its own ephemeral -> SAS must differ
const mEph = sodium.crypto_box_keypair();
const sasMitm = await L.computeSas(mEph.privateKey, mEph.publicKey, eph.publicKey, pId.publicKey, nId.publicKey);
ok('untergeschobenes Ephemeral -> andere Emoji (MITM sichtbar)', sasMitm.emoji.map(x=>x.char).join(" ") !== sasN.emoji.map(x=>x.char).join(" "));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
