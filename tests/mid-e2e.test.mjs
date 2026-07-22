// Stage 3d step 5 — the E2E dedup `mid`. The sender stamps a 16-byte id INTO the
// AEAD-protected plaintext; receiveEnvelope returns it. The same mid is reused
// across every fan-out + self-sync copy, so onInbox can dedup a message that
// arrives via more than one path. Authenticated (inside the ratchet AEAD) so an
// injected message can't forge a colliding mid to suppress a real one.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

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

const alice = await mkId();
const bob = await mkId();
const bobSpk = await S.generateSignedPreKey(bob, 1);
const bobBundle = S.currentBundle(bob, { signedPreKey: bobSpk, oneTimePreKeys: [] });
const bobLookup = {
  signedPreKey: (id) => (bobSpk.id === id ? bobSpk.keyPair : undefined),
  consumeOneTimePreKey: () => undefined,
};
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bobBundle);

console.log('\n[Schritt 5: E2E-mid trägt durch die AEAD und dedupt]');

// Alice stamps an explicit mid; Bob's receiveEnvelope returns exactly it.
const MID = S.randomMid();
const e1 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'hallo', MID))).payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), e1.x3dh);
const r1 = await S.receiveEnvelope(bob, bobContact, e1, bobLookup);
ok('E2E-mid trägt durch: Sender-mid == Empfänger-mid', r1.mid === MID);
ok('Inhalt unverändert neben dem mid', r1.content.kind === 'text' && r1.content.text === 'hallo');

// A second message with NO explicit mid gets a fresh 32-hex-char id (per message).
const e2 = await S.decodeEnvelope((await S.openPayload(bob, await S.sendMessage(alice, aliceContact, 'zwei'))).payload);
const r2 = await S.receiveEnvelope(bob, bobContact, e2, bobLookup);
ok('auto-mid ist gesetzt und 32 hex', typeof r2.mid === 'string' && /^[0-9a-f]{32}$/.test(r2.mid));
// NEGATIVE CONTROL: the mid is per-MESSAGE (a fresh random), not derived from the
// content — otherwise dedup would collapse two identical-text messages into one.
ok('verschiedene Nachrichten ⇒ verschiedene mids (Negativkontrolle)', r2.mid !== MID);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
