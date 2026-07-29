// Three-person group E2EE without pre-saved 1:1 contacts. Bob learns Alice's and
// Carol's authenticated device bundles exclusively from Alice's personalised v4
// roster. He creates hidden pairwise sessions and sends one logical group message;
// both previously unknown recipients decrypt independently with the same MID.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const sodium = await S.getSodium();

const mkPerson = async (name) => {
  const master = sodium.crypto_sign_keypair();
  const sign = sodium.crypto_sign_keypair();
  const dh = sodium.crypto_box_keypair();
  const id = {
    master: {
      publicKey: new Uint8Array(master.publicKey),
      privateKey: new Uint8Array(master.privateKey),
    },
    sign: {
      publicKey: new Uint8Array(sign.publicKey),
      privateKey: new Uint8Array(sign.privateKey),
    },
    dh: {
      publicKey: new Uint8Array(dh.publicKey),
      privateKey: new Uint8Array(dh.privateKey),
    },
    epoch: 1,
    deviceCert: await S.signDeviceCert(
      master.privateKey,
      1,
      sign.publicKey,
      dh.publicKey,
    ),
  };
  const spk = await S.generateSignedPreKey(id, 1);
  const entry = {
    signPub: id.sign.publicKey,
    dhPub: id.dh.publicKey,
    deviceCert: id.deviceCert,
    signedPreKey: {
      id: spk.id,
      pub: spk.keyPair.publicKey,
      signature: spk.signature,
    },
    protocolVersion: S.PROTOCOL_VERSION,
  };
  const deviceList = await S.signDeviceList(
    master.privateKey,
    master.publicKey,
    1,
    1,
    [entry],
  );
  const bundle = S.currentBundle(id, {
    signedPreKey: spk,
    oneTimePreKeys: [],
  });
  return {
    name,
    id,
    spk,
    entry,
    deviceList,
    bundle,
    lookup: {
      signedPreKey: (keyId) => keyId === spk.id ? spk.keyPair : undefined,
      consumeOneTimePreKey: () => undefined,
    },
  };
};

const asMember = (person) => ({
  masterPub: person.id.master.publicKey,
  epoch: 1,
  signPub: person.id.sign.publicKey,
  dhPub: person.id.dh.publicKey,
  bundle: person.bundle,
  deviceList: person.deviceList,
  name: person.name,
});

const Alice = await mkPerson('Alice');
const Bob = await mkPerson('Bob');
const Carol = await mkPerson('Carol');
const Mallory = await mkPerson('Mallory');

// The owner signature covers one global roster including Bob. Only the device
// directory overlay is personalised: Bob himself is omitted there.
const signedState = await S.signGroupState({
  id: 'grp_33333333333333333333333333333333',
  name: 'Drei ohne Adressbuch',
  createdAt: 1_700_000_000_000,
  revision: 1,
  ownerMasterPub: Alice.id.master.publicKey,
  roster: [
    Alice.id.master.publicKey,
    Bob.id.master.publicKey,
    Carol.id.master.publicKey,
  ],
  members: [asMember(Alice), asMember(Carol)],
}, Alice.id);
const inviteForBob = await S.toInvite(signedState);

console.log('\n[Kontaktlose 3-Personen-Gruppe: authentifiziertes Schlüssel-Bootstrap]');

const installed = await S.fromInvite(inviteForBob);
ok('Bob installiert das signierte v4-Roster mit Owner, Revision und Original-Zeit',
  installed.revision === 1 &&
  installed.createdAt === 1_700_000_000_000 &&
  S.bytesEqual(installed.ownerMasterPub, Alice.id.master.publicKey) &&
  await S.verifyGroupState(installed));
ok('globaler Owner-Stand enthält alle drei Personen einschließlich Bob',
  installed.roster.length === 3 &&
  installed.roster.some((master) =>
    S.bytesEqual(master, Bob.id.master.publicKey)));
ok('Roster enthält Alice und Carol als stabile Master-Identitäten',
  installed.members.length === 2 &&
  installed.members.some((m) => S.bytesEqual(m.masterPub, Alice.id.master.publicKey)) &&
  installed.members.some((m) => S.bytesEqual(m.masterPub, Carol.id.master.publicKey)));
ok('jede fremde Person bringt eine verifizierte DeviceList und SPK-Reichweite mit',
  installed.members.every((m) =>
    m.deviceList?.devices.length === 1 &&
    m.bundle?.signedPreKey &&
    S.bytesEqual(m.deviceList.masterPub, m.masterPub)));
ok('Broadcast-Roster enthält keine wiederverwendbare One-Time-Prekey',
  installed.members.every((m) => m.bundle?.oneTimePreKey === undefined));

// Deliberately start with no address-book contacts. The only inputs to these
// hidden contacts are the cryptographically checked members in `installed`.
const savedContactsBefore = [];
const hiddenContacts = [];
for (const member of installed.members) {
  const contact = await S.makeContact(
    S.asMasterPub(Bob.id.master.publicKey),
    member.bundle,
  );
  contact.hidden = true;
  const adopted = await S.applyDeviceListUpdate(
    contact,
    member.deviceList,
    new Set(),
  );
  if (adopted) hiddenContacts.push(contact);
}
ok('kein vorher gespeicherter Kontakt war für den Schlüsselaustausch nötig',
  savedContactsBefore.length === 0 &&
  hiddenContacts.length === 2 &&
  hiddenContacts.every((contact) => contact.hidden === true));

console.log('\n[Kontaktlose 3-Personen-Gruppe: Bob sendet E2EE an Alice und Carol]');

const mid = S.randomMid();
const fanout = await S.groupFanoutToDevices(
  Bob.id,
  hiddenContacts,
  installed.id,
  installed.revision,
  installed.stateHash,
  'Bob',
  { kind: 'text', text: 'Wir sehen uns trotz leerem Adressbuch.' },
  mid,
  { senderDeviceList: Bob.deviceList },
);
ok('genau Alice und Carol erhalten je eine verschlüsselte Kopie',
  fanout.deliveries.length === 2 && fanout.unreachable.length === 0);

const receiveAsUnknownPeer = async (person) => {
  const delivery = fanout.deliveries.find((item) =>
    S.bytesEqual(item.deviceSignPub, person.id.sign.publicKey));
  const opened = delivery && await S.openPayload(person.id, delivery.sealed);
  if (!opened) return null;
  const envelope = await S.decodeEnvelope(opened.payload);
  const bobContact = await S.makeContactFromHeader(
    S.asMasterPub(person.id.master.publicKey),
    envelope.x3dh,
  );
  return S.receiveEnvelope(person.id, bobContact, envelope, person.lookup);
};

const aliceReceived = await receiveAsUnknownPeer(Alice);
const carolReceived = await receiveAsUnknownPeer(Carol);
const gotExpectedGroupText = (result) =>
  result?.outcome === 'message' &&
  result.content.kind === 'group' &&
  result.content.groupId === installed.id &&
  result.content.revision === installed.revision &&
  S.bytesEqual(result.content.stateHash, installed.stateHash) &&
  result.content.senderName === 'Bob' &&
  result.content.inner.kind === 'text' &&
  result.content.inner.text === 'Wir sehen uns trotz leerem Adressbuch.';

ok('Alice authentifiziert Bob und entschlüsselt den Gruppeninhalt',
  gotExpectedGroupText(aliceReceived));
ok('Carol authentifiziert Bob und entschlüsselt den Gruppeninhalt',
  gotExpectedGroupText(carolReceived));
ok('Alice und Carol sehen denselben authentifizierten Nachrichten-MID',
  aliceReceived?.outcome === 'message' &&
  carolReceived?.outcome === 'message' &&
  aliceReceived.mid === mid &&
  carolReceived.mid === mid);

const aliceCopy = fanout.deliveries.find((item) =>
  S.bytesEqual(item.deviceSignPub, Alice.id.sign.publicKey));
ok('Carol kann Alices paarweise versiegelte Kopie nicht öffnen',
  await S.openPayload(Carol.id, aliceCopy.sealed) === null);
ok('gruppenfremde Mallory kann keine der Kopien öffnen',
  (await Promise.all(
    fanout.deliveries.map((delivery) => S.openPayload(Mallory.id, delivery.sealed)),
  )).every((opened) => opened === null));

console.log('\n[Kontaktlose 3-Personen-Gruppe: manipulierte Schlüssel werden verworfen]');

const tampered = structuredClone(inviteForBob);
tampered.members[1].deviceList =
  tampered.members[1].deviceList.slice(0, -2) + 'AA';
let rejected = false;
try {
  await S.fromInvite(tampered);
} catch {
  rejected = true;
}
ok('manipulierte DeviceList lässt sich nicht als Gruppenroster installieren', rejected);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
