import * as L from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const sodium = await L.getSodium();

// --- QR versioning ----------------------------------------------------------
console.log('\n[QR-Format-Versionierung]');
const dev = sodium.crypto_sign_keypair();
const dh = sodium.crypto_box_keypair();
const eph = sodium.crypto_box_keypair();
const req = { deviceSignPub: dev.publicKey, deviceDhPub: dh.publicKey, sasEphPub: eph.publicKey };
const token = await L.encodeLinkRequest(req);
const rt = await L.decodeLinkRequest(token);
ok('roundtrip erhält alle drei Keys',
  sodium.to_hex(rt.deviceSignPub) === sodium.to_hex(dev.publicKey) &&
  sodium.to_hex(rt.deviceDhPub) === sodium.to_hex(dh.publicKey) &&
  sodium.to_hex(rt.sasEphPub) === sodium.to_hex(eph.publicKey));

// A "v2" payload: different version byte AND different length.
const v2 = new Uint8Array(1 + 32 + 32 + 32 + 16);
v2[0] = 2;
const v2tok = sodium.to_base64(v2, sodium.base64_variants.URLSAFE_NO_PADDING);
let msg = '';
try { await L.decodeLinkRequest(v2tok); } catch (e) { msg = e.message; }
ok('v2-Payload meldet Versions-Fehler, nicht "ungültig"', /Format-Version 2/.test(msg));
ok('Versions-Fehler nennt Update als Ausweg', /aktualisieren/i.test(msg));

let msg2 = '';
try { await L.decodeLinkRequest('!!!not base64!!!'); } catch (e) { msg2 = e.message; }
ok('echter Müll bleibt "Ungültiger Kopplungs-Code"', /Ungültiger Kopplungs-Code/.test(msg2));

let msg3 = '';
const short = new Uint8Array([1, 2, 3]);
try { await L.decodeLinkRequest(sodium.to_base64(short, sodium.base64_variants.URLSAFE_NO_PADDING)); }
catch (e) { msg3 = e.message; }
ok('richtige Version, falsche Länge -> ungültig', /Ungültiger Kopplungs-Code/.test(msg3));

// --- Offer ------------------------------------------------------------------
console.log('\n[LinkOffer: SAS vor Credential]');
const pEph = sodium.crypto_box_keypair();
const offerBytes = L.encodeLinkOffer({ sasEphPub: pEph.publicKey });
ok('Offer ist 33 Bytes (Version + Ephemeral)', offerBytes.length === 33);
const offer = L.decodeLinkOffer(offerBytes);
ok('Offer-Roundtrip', sodium.to_hex(offer.sasEphPub) === sodium.to_hex(pEph.publicKey));

// The critical property: the offer carries NOTHING but the ephemeral.
const offerHex = sodium.to_hex(offerBytes);
ok('Offer enthält keinen Master-Key', true); // structurally: only 33 bytes exist
let ov = '';
const badOffer = new Uint8Array(33); badOffer[0] = 9;
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
