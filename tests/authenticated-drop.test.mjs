import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

const MID = new Uint8Array(16).fill(0x2a);

async function fixture(frame) {
  const alice = await S.generateIdentity();
  const bob = await S.generateIdentity();
  const spk = await S.generateSignedPreKey(bob, 1);
  const [opk] = await S.generateOneTimePreKeys(41, 1);
  const bundle = S.buildBundle(bob, spk, opk);
  const aliceContact = await S.makeContact(S.asMasterPub(alice.master.publicKey), bundle);
  const x3dh = await S.initiateX3DH(alice, bundle);
  const ratchet = await S.initRatchetInitiator(
    x3dh.session.sharedSecret,
    bundle.signedPreKey.pub,
    x3dh.session.associatedData,
  );
  const message = await S.ratchetEncrypt(ratchet, S.concatBytes(MID, frame));
  const envelope = {
    type: 'prekey',
    conv: aliceContact.roomId,
    x3dh: x3dh.header,
    message,
    pv: S.PROTOCOL_VERSION,
  };
  const bobContact = await S.makeContactFromHeader(
    S.asMasterPub(bob.master.publicKey),
    x3dh.header,
  );
  const lookup = {
    signedPreKey: (id) => (id === spk.id ? spk.keyPair : undefined),
    oneTimePreKey: (id) => (id === opk.id ? opk.keyPair.privateKey : undefined),
  };
  return { alice, bob, bobContact, envelope, lookup, opk };
}

console.log('\n[Post-AEAD-Drops committen Ratchet + OPK weiter]');

{
  const f = await fixture(new Uint8Array([0xff]));
  const result = await S.receiveEnvelope(f.bob, f.bobContact, f.envelope, f.lookup);
  ok('authentischer unbekannter Frame wird als Drop zurückgegeben',
    result.outcome === 'authenticated-drop' && result.reason === 'invalid-frame');
  ok('Drop delegiert die OPK-ID an die atomare Speicherschicht',
    result.authenticatedOneTimePreKeyId === f.opk.id);
  ok('authentischer Drop hält die neue Session fest', f.bobContact.sessions.size === 1);
}

{
  const targetMaster = new Uint8Array(32).fill(7);
  const sync = await S.frameContent({
    kind: 'sync',
    targetPeerMaster: targetMaster,
    origin: 'sent',
    innerMid: '11'.repeat(16),
    ts: 1,
    inner: { kind: 'text', text: 'nicht erlaubt' },
  });
  const f = await fixture(sync);
  const result = await S.receiveEnvelope(f.bob, f.bobContact, f.envelope, f.lookup);
  ok('authentischer Self-Frame eines Fremdkontakts wird als Drop zurückgegeben',
    result.outcome === 'authenticated-drop' && result.reason === 'unauthorised-self-frame');
  ok('auch der unauthorisierte Drop trägt die authentisierte OPK-ID',
    result.authenticatedOneTimePreKeyId === f.opk.id);
}

{
  const valid = await S.frameContent({ kind: 'text', text: 'authentisch' });
  const f = await fixture(valid);
  const forged = {
    ...f.envelope,
    message: {
      ...f.envelope.message,
      ciphertext: new Uint8Array(f.envelope.message.ciphertext).fill(0),
    },
  };
  let threw = false;
  try {
    await S.receiveEnvelope(f.bob, f.bobContact, forged, f.lookup);
  } catch {
    threw = true;
  }
  ok('AEAD-Fehler vor Authentisierung bleibt ein Throw', threw);
  ok('prä-AEAD-Fehler committen keine Session', f.bobContact.sessions.size === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
