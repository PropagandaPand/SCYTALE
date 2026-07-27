import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

console.log('\n[OPK: Verbrauch erst nach Cert + erster AEAD]');

const alice = await S.generateIdentity();
const bob = await S.generateIdentity();
const bobSpk = await S.generateSignedPreKey(bob, 1);
const [opk] = await S.generateOneTimePreKeys(9, 1);
const bundle = S.buildBundle(bob, bobSpk, opk);
const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);
const sealed = await S.sendMessage(alice, aliceContact, 'authentisch');
const opened = await S.openPayload(bob, sealed);
const env = await S.decodeEnvelope(opened.payload);
const bobContact = await S.makeContactFromHeader(S.asMasterPub(bob.master.publicKey), env.x3dh);

const lookup = {
  signedPreKey: (id) => id === bobSpk.id ? bobSpk.keyPair : undefined,
  oneTimePreKey: (id) => id === opk.id ? opk.keyPair.privateKey : undefined,
};

const forged = {
  ...env,
  message: { ...env.message, ciphertext: new Uint8Array(env.message.ciphertext).fill(0) },
};
try { await S.receiveEnvelope(bob, bobContact, forged, lookup); } catch {}
ok('gefälschte erste AEAD autorisiert keinen OPK-Commit', bobContact.sessions.size === 0);

const got = await S.receiveEnvelope(bob, bobContact, env, lookup);
ok('echte erste Nachricht entschlüsselt', got.content.kind === 'text' && got.content.text === 'authentisch');
ok('OPK-Commit wird erst nach Authentisierung an die atomare Speicherschicht delegiert', got.authenticatedOneTimePreKeyId === opk.id);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
