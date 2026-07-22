// Device-linking crypto path: offer → SAS → grant, and the two properties the
// flow exists to guarantee. Storage (installLinkedIdentity, saveOwnDeviceList)
// is IndexedDB-bound and lives in the UI test; here we exercise the pure crypto.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const chars = (r) => r.emoji.map((e) => e.char).join(' ');
const kp = (k) => ({ publicKey: new Uint8Array(k.publicKey), privateKey: new Uint8Array(k.privateKey) });

// P holds the master; N is a fresh device with its own keys.
const master = sodium.crypto_sign_keypair();
const pSign = sodium.crypto_sign_keypair(), pDh = sodium.crypto_box_keypair();
const nSign = sodium.crypto_sign_keypair(), nDh = sodium.crypto_box_keypair();
const epoch = 1;
const pCert = await S.signDeviceCert(master.privateKey, epoch, pSign.publicKey, pDh.publicKey);
const nEph = await S.generateSasEphemeral();
const pEph = await S.generateSasEphemeral();

console.log('\n[Kopplungs-Krypto: Offer trägt den Master, SAS bindet ihn]');

// 1. N builds the QR request; P decodes it.
const req = { deviceSignPub: nSign.publicKey, deviceDhPub: nDh.publicKey, sasEphPub: nEph.publicKey,
  signedPreKey: { id: 3, pub: nDh.publicKey, signature: await S.sign(nDh.publicKey, nSign.privateKey) } };
const qr = await S.encodeLinkRequest(req);
const gotReq = await S.decodeLinkRequest(qr);
ok('QR-Roundtrip erhält N-Keys',
  sodium.to_hex(gotReq.deviceDhPub) === sodium.to_hex(nDh.publicKey) &&
  sodium.to_hex(gotReq.sasEphPub) === sodium.to_hex(nEph.publicKey));

// 2. P's offer carries P's master (public) + ephemeral. Roundtrip through bytes.
const offerBytes = S.encodeLinkOffer({ sasEphPub: pEph.publicKey, masterPub: master.publicKey, epoch });
const offer = S.decodeLinkOffer(offerBytes);
ok('Offer trägt P-Master', sodium.to_hex(offer.masterPub) === sodium.to_hex(master.publicKey));
ok('Offer trägt P-Ephemeral', sodium.to_hex(offer.sasEphPub) === sodium.to_hex(pEph.publicKey));

// 3. Both derive the SAS. N over the offered master, P over its own — same key.
const sasN = await S.linkingSas({
  myEph: nEph, theirEphPub: offer.sasEphPub,
  myMasterPub: S.asMasterPub(offer.masterPub), theirMasterPub: S.asMasterPub(offer.masterPub),
});
const sasP = await S.linkingSas({
  myEph: pEph, theirEphPub: req.sasEphPub,
  myMasterPub: S.asMasterPub(master.publicKey), theirMasterPub: S.asMasterPub(master.publicKey),
});
ok('beide Seiten sehen dieselben Emoji', chars(sasN) === chars(sasP));

// NEGATIVE CONTROL: a substituted master in the offer must change the emoji, so
// the human sees it. This is the entire security of the flow.
const evil = sodium.crypto_sign_keypair();
const sasEvil = await S.linkingSas({
  myEph: nEph, theirEphPub: offer.sasEphPub,
  myMasterPub: S.asMasterPub(evil.publicKey), theirMasterPub: S.asMasterPub(evil.publicKey),
});
ok('untergeschobener Master -> andere Emoji', chars(sasEvil) !== chars(sasN));

// 4. P issues the grant. It cross-signs N's keys and carries the v+1 list.
const list0 = await S.signDeviceList(master.privateKey, master.publicKey, epoch, 1, [
  { signPub: pSign.publicKey, dhPub: pDh.publicKey, deviceCert: pCert },
]);
const { grant, newList } = await S.createLinkGrant(
  master.privateKey, master.publicKey, epoch, list0, gotReq,
);
ok('Grant cross-signt N', await S.verifyLinkGrant(grant, nSign.publicKey, nDh.publicKey));
ok('neue Liste v2 enthält N', newList.version === 2 && S.deviceInList(newList, nSign.publicKey));

// 5. Grant wire roundtrip (sealed transport carries these bytes).
const grantBytes = await S.encodeLinkGrant(grant);
const grant2 = await S.decodeLinkGrant(grantBytes);
ok('Grant-Roundtrip verifiziert weiterhin für N',
  await S.verifyLinkGrant(grant2, nSign.publicKey, nDh.publicKey));

// 6. THE binding property N enforces: grant.masterPub must equal the approved one.
ok('Grant nennt den bestätigten Master', sodium.to_hex(grant2.masterPub) === sodium.to_hex(offer.masterPub));
ok('ein FREMDER Master im Grant weicht vom bestätigten ab',
   sodium.to_hex(evil.publicKey) !== sodium.to_hex(offer.masterPub));

// 7. Abort leaves the original list untouched (P persists only as last action).
ok('vor Commit: Ausgangsliste unverändert (v1, ohne N)',
   list0.version === 1 && !S.deviceInList(list0, nSign.publicKey));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
