import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const throws = async (fn, pattern) => {
  try { await fn(); return false; } catch (e) { return pattern.test(String(e?.message)); }
};

console.log('\n[Linking: explizite SAS-Bestätigung ist eine Protokoll-Transition]');

const sodium = await S.getSodium();
const primary = await S.generateIdentity();
const fresh = await S.generateIdentity();
const freshSpk = await S.generateSignedPreKey(fresh, 1);
const { session: nSession, qrToken } = await S.startLinkOnN(fresh, {
  id: freshSpk.id,
  pub: freshSpk.keyPair.publicKey,
  signature: freshSpk.signature,
});

let sealedOffer;
const { session: pSession } = await S.beginLinkOnP(primary, qrToken, async (_to, sealed) => { sealedOffer = sealed; });
const opened = await S.openPayload(fresh, sealedOffer);
ok('P sendet ein echtes Offer', opened?.type === S.SEALED_LINK_OFFER);
await S.offerReceivedOnN(nSession, opened.payload);

const pCert = await S.signDeviceCert(
  primary.master.privateKey, primary.epoch, primary.sign.publicKey, primary.dh.publicKey,
);
const list = await S.signDeviceList(primary.master.privateKey, primary.master.publicKey, primary.epoch, 1, [{
  signPub: primary.sign.publicKey,
  dhPub: primary.dh.publicKey,
  deviceCert: pCert,
}]);

ok('P-Complete verweigert ohne Transition',
  await throws(
    () => S.completeLinkOnP(null, primary, pSession, list, async () => undefined),
    /nicht ausdrücklich bestätigt/,
  ));
ok('N-Complete verweigert ohne Transition',
  await throws(
    () => S.completeLinkOnN(null, fresh, nSession, {}),
    /nicht ausdrücklich bestätigt/,
  ));

ok('confirmLinkSession markiert P genau über die API', S.confirmLinkSession(pSession) === pSession);
ok('confirmLinkSession markiert N genau über die API', S.confirmLinkSession(nSession) === nSession);

let secondOffer;
await S.beginLinkOnP(primary, qrToken, async (_to, sealed) => { secondOffer = sealed; });
const openedSecond = await S.openPayload(fresh, secondOffer);
await S.offerReceivedOnN(nSession, openedSecond.payload);
ok('ein zweites Offer nach Bestätigung erzwingt einen neuen Vergleich',
  await throws(
    () => S.completeLinkOnN(null, fresh, nSession, {}),
    /nicht ausdrücklich bestätigt/,
  ));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
