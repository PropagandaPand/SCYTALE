// MIGRATION-PROOF PROPERTY TEST for the conversation-binding check.
//
// This file deliberately NEVER calls computeRoomId and never assumes how a
// roomId is derived. It asks the production path (makeContactFromHeader) which
// conversation a given identity belongs to, and derives its expectation from
// THAT. The property under test is:
//
//   receiveEnvelope may mutate a contact only if the claimed identity actually
//   belongs to that contact's conversation. Otherwise it must reject and leave
//   the contact byte-for-byte unchanged.
//
// When stage 3c re-bases roomId from device-DH onto the master, this test keeps
// testing the right thing without being edited — because it was never bound to
// the derivation. A test that hardcoded computeRoomId(dh, dh) would silently
// start checking the wrong thing instead.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();
const dec = new TextDecoder();

const mkId = async (masterOverride) => {
  const master = masterOverride ?? sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const cert = await S.signDeviceCert(master.privateKey, 1, sign.publicKey, dh.publicKey);
  return { master, sign, dh, epoch: 1, cert };
};
const header = (i) => ({
  masterPub: i.master.publicKey,
  epoch: i.epoch,
  identitySignPub: i.sign.publicKey,
  identityDhPub: i.dh.publicKey,
  deviceCert: i.cert,
  ephemeralPub: sodium.crypto_box_keypair().publicKey,
  signedPreKeyId: 1,
  oneTimePreKeyId: undefined,
});
const lookup = { signedPreKey: () => undefined, consumeOneTimePreKey: () => undefined };

const alice = await mkId();
const me = { sign: alice.sign, dh: alice.dh, master: alice.master, epoch: 1, deviceCert: alice.cert };
const snap = async (c) => dec.decode(await S.serializeContact(c));

/**
 * The property, stated once and applied to every case below.
 *
 * `belongsHere` is not asserted by the test author — it is ASKED of the
 * production path: build the contact this claimed identity would legitimately
 * get, and see whether that is the same conversation as the victim's.
 */
async function checkProperty(label, victimIdentity, claimIdentity) {
  const victim = await S.makeContactFromHeader(alice.dh.publicKey, header(victimIdentity));
  const wouldBe = await S.makeContactFromHeader(alice.dh.publicKey, header(claimIdentity));
  const belongsHere = wouldBe.roomId === victim.roomId;

  const before = await snap(victim);
  let err = null;
  try {
    await S.receiveEnvelope(me, victim, { type: 'prekey', conv: victim.roomId, x3dh: header(claimIdentity), message: new Uint8Array(32) }, lookup);
  } catch (e) { err = e; }
  const after = await snap(victim);
  const mutated = before !== after;

  console.log(`\n  [${label}]  gehoert zur Unterhaltung: ${belongsHere}`);
  if (belongsHere) {
    // A claim that legitimately concerns this conversation must be PROCESSED as
    // a claim — i.e. it may record a pending proposal. (It is still never
    // auto-accepted; that is acceptMasterChange's job, covered elsewhere.)
    ok(`${label}: wird als Behauptung verarbeitet, nicht wegen Bindung verworfen`,
      !/gehört nicht zu dieser Unterhaltung/.test(err?.message ?? ''));
  } else {
    // Assert on the REASON, not merely on rejection. A green that comes from a
    // different guard further down the path (e.g. the device-cert check inside
    // respondX3DH) credits this test's name to a mechanism it never exercised —
    // the same failure mode as an assertion that is true for unrelated reasons.
    // Discovered exactly that way: with the binding check disabled, the
    // "victim's master + own device keys" case stayed green because the cert
    // check caught it instead.
    const byBinding = /gehört nicht zu dieser Unterhaltung/.test(err?.message ?? '');
    ok(`${label}: wird abgelehnt`, err !== null);
    ok(`${label}: und zwar DURCH DIE BINDUNGSPRUEFUNG (nicht durch einen anderen Waechter)`, byBinding);
    ok(`${label}: Kontakt bleibt Byte-fuer-Byte unveraendert`, !mutated);
    ok(`${label}: kein pendingMaster eingeschleust`, victim.pendingMaster === undefined);
  }
}

console.log('\n[Eigenschaft: nur die eigene Unterhaltung darf einen Kontakt aendern]');

// 1. A complete stranger with their own master and own device keys.
await checkProperty('Fremder Master + fremde Device-Keys', await mkId(), await mkId());

// 2. The dangerous one: an attacker who reuses the VICTIM's master but their own
//    device keys — closer to a real group co-member than case 1.
{
  const bob = await mkId();
  await checkProperty('Opfer-Master, eigene Device-Keys', bob, await mkId(bob.master));
}

// 3. The legitimate identity change: same device keys, new master. Today this
//    stays in the same conversation; after the 3c master-based rebase it will
//    not — and the test adapts on its own, because `belongsHere` is asked, not
//    assumed.
{
  const bob = await mkId();
  const rotated = { ...bob, master: sodium.crypto_sign_keypair() };
  rotated.cert = await S.signDeviceCert(rotated.master.privateKey, 1, bob.sign.publicKey, bob.dh.publicKey);
  await checkProperty('Gleiche Device-Keys, neuer Master (Rotation/Kopplung)', bob, rotated);
}

// 4. Same master, same device keys — the ordinary case, must not be blocked.
{
  const bob = await mkId();
  await checkProperty('Identische Identitaet', bob, bob);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
