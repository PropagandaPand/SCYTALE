// End-to-end group-v4 membership lifecycle. The stable owner master is the sole
// roster writer and every accepted revision is signed over the previous hash.
// Removed members retain old pairwise keys, but current-roster authorization
// rejects their group content and future fan-out excludes all of their devices.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => {
  if (c) {
    pass++;
    console.log('  ok  ', n);
  } else {
    fail++;
    console.log('  FAIL', n);
  }
};
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

const Alice = await mkPerson('Alice (Owner)');
const Bob = await mkPerson('Bob');
const Carol = await mkPerson('Carol (lokales Gerät)');
const Dave = await mkPerson('Dave');

const GROUP_ID = 'grp_44444444444444444444444444444444';
const CREATED_AT = 1_700_000_000_000;
const stateForCarol = async ({
  roster,
  revision,
  previous,
  name = 'Mitgliedschaft',
}) => S.signGroupState({
  id: GROUP_ID,
  name,
  createdAt: CREATED_AT,
  revision,
  ownerMasterPub: Alice.id.master.publicKey,
  roster: roster.map((person) => person.id.master.publicKey),
  previousStateHash: previous?.stateHash,
  members: roster
    .filter((person) => person !== Carol)
    .map(asMember),
}, Alice.id);

const local = await stateForCarol({
  roster: [Alice, Bob, Carol],
  revision: 1,
});

console.log('\n[Owner-only Add/Remove mit signierter Hash-Kette]');

ok('Alice ist über ihren stabilen Master als Owner gebunden',
  S.isGroupOwner(local, Alice.id.master.publicKey) &&
  !S.isGroupOwner(local, Bob.id.master.publicKey));
ok('Genesisstand ist echt signiert und enthält Carol global, nicht im Overlay',
  await S.verifyGroupState(local) &&
  local.roster.length === 3 &&
  local.members.length === 2 &&
  !local.members.some((member) =>
    S.bytesEqual(member.masterPub, Carol.id.master.publicKey)));

const addRevision = S.nextGroupRevision(local);
const addDave = await stateForCarol({
  roster: [Alice, Bob, Carol, Dave],
  revision: addRevision,
  previous: local,
  name: 'Mitgliedschaft + Dave',
});
const nonOwnerAdd = S.decideInvite(local, addDave, Bob.id.master.publicKey);
ok('aktuelles Nicht-Owner-Mitglied darf Dave nicht hinzufügen',
  nonOwnerAdd.verdict === 'reject');

const ownerAdd = S.decideInvite(local, addDave, Alice.id.master.publicKey);
ok('Owner-Update fügt Dave bei exakt nächster Revision hinzu',
  addRevision === 2 &&
  ownerAdd.verdict === 'update' &&
  S.isGroupMemberMaster(ownerAdd.group, Dave.id.master.publicKey));
ok('Add ist an den Genesis-Hash gekettet und behält den Erstellzeitpunkt',
  ownerAdd.verdict === 'update' &&
  ownerAdd.group.createdAt === local.createdAt &&
  S.bytesEqual(addDave.previousStateHash, local.stateHash));

const afterAdd = ownerAdd.verdict === 'update' ? ownerAdd.group : addDave;
const removeRevision = S.nextGroupRevision(afterAdd);
const removeBob = await stateForCarol({
  roster: [Alice, Carol, Dave],
  revision: removeRevision,
  previous: afterAdd,
  name: afterAdd.name,
});
const nonOwnerRemove = S.decideInvite(
  afterAdd,
  removeBob,
  Bob.id.master.publicKey,
);
ok('Bob darf weder sich noch andere per eigenem Transport entfernen',
  nonOwnerRemove.verdict === 'reject');

const ownerRemove = S.decideInvite(
  afterAdd,
  removeBob,
  Alice.id.master.publicKey,
);
ok('Owner entfernt Bob bei der nächsten monotonen Revision',
  removeRevision === 3 &&
  ownerRemove.verdict === 'update' &&
  !S.isGroupMemberMaster(ownerRemove.group, Bob.id.master.publicKey) &&
  S.isGroupMemberMaster(ownerRemove.group, Dave.id.master.publicKey));
ok('Remove ist an den unmittelbar vorherigen Add-Stand gekettet',
  S.bytesEqual(removeBob.previousStateHash, afterAdd.stateHash));

const current = ownerRemove.verdict === 'update'
  ? ownerRemove.group
  : removeBob;

console.log('\n[Replay-, Konflikt- und Resurrection-Schutz]');

const staleReplay = S.decideInvite(current, addDave, Alice.id.master.publicKey);
ok('alte Owner-Revision kann Bob nicht per Replay zurückbringen',
  staleReplay.verdict === 'reject' &&
  !S.isGroupMemberMaster(current, Bob.id.master.publicKey));

const equalRevisionFork = await stateForCarol({
  roster: [Alice, Bob, Carol, Dave],
  revision: current.revision,
  previous: afterAdd,
  name: 'Konkurrierender gültiger Fork',
});
ok('gültig signiertes, aber abweichendes Roster derselben Revision wird abgelehnt',
  S.decideInvite(
    current,
    equalRevisionFork,
    Alice.id.master.publicKey,
  ).verdict === 'reject');

const resurrection = await stateForCarol({
  roster: [Alice, Bob, Carol, Dave],
  revision: S.nextGroupRevision(current),
  previous: current,
  name: 'Resurrection',
});
ok('entfernter Bob darf selbst einen echten Owner-Nachfolger nicht transportieren',
  S.decideInvite(current, resurrection, Bob.id.master.publicKey).verdict === 'reject' &&
  !S.isGroupMemberMaster(current, Bob.id.master.publicKey));

ok('identische authentifizierte Revision ist idempotent',
  S.decideInvite(
    current,
    structuredClone(current),
    Alice.id.master.publicKey,
  ).verdict === 'noop');

console.log('\n[Entfernter Master verschwindet aus dem ausgehenden Fanout]');

// Keep all three historical hidden contacts to prove selection is made from the
// current roster, not from whatever contacts happen to remain in local storage.
const historicalContacts = [];
for (const person of [Alice, Bob, Dave]) {
  const contact = await S.makeContact(
    S.asMasterPub(Carol.id.master.publicKey),
    person.bundle,
  );
  contact.hidden = true;
  await S.applyDeviceListUpdate(contact, person.deviceList, new Set());
  historicalContacts.push(contact);
}
const currentContacts = current.members.map((member) =>
  historicalContacts.find((contact) =>
    S.bytesEqual(contact.peerMasterPub, member.masterPub)));
const outbound = await S.groupFanoutToDevices(
  Carol.id,
  currentContacts,
  current.id,
  current.revision,
  current.stateHash,
  'Carol',
  { kind: 'text', text: 'Nur aktuelles Roster' },
  S.randomMid(),
  { senderDeviceList: Carol.deviceList },
);
ok('aktuelles Roster adressiert Alice und Dave, aber nicht Bob',
  outbound.deliveries.length === 2 &&
  outbound.deliveries.some((delivery) =>
    S.bytesEqual(delivery.deviceSignPub, Alice.id.sign.publicKey)) &&
  outbound.deliveries.some((delivery) =>
    S.bytesEqual(delivery.deviceSignPub, Dave.id.sign.publicKey)) &&
  !outbound.deliveries.some((delivery) =>
    S.bytesEqual(delivery.deviceSignPub, Bob.id.sign.publicKey)));
ok('Bobs alter versteckter Kontakt darf lokal fortbestehen, ohne Fanout-Ziel zu sein',
  historicalContacts.some((contact) =>
    S.bytesEqual(contact.peerMasterPub, Bob.id.master.publicKey)) &&
  !currentContacts.some((contact) =>
    S.bytesEqual(contact.peerMasterPub, Bob.id.master.publicKey)));

console.log('\n[Legacy-Fanout ist ein expliziter, ownerloser Sonderpfad]');

let implicitRevisionZeroRejected = false;
try {
  await S.groupFanoutToDevices(
    Carol.id,
    [],
    current.id,
    0,
    undefined,
    'Carol',
    { kind: 'text', text: 'Kein impliziter Downgrade' },
    S.randomMid(),
  );
} catch {
  implicitRevisionZeroRejected = true;
}
ok('Revision 0 öffnet den Fanout nicht pauschal',
  implicitRevisionZeroRejected);

const explicitLegacyFanout = await S.groupFanoutToDevices(
  Carol.id,
  [],
  current.id,
  0,
  undefined,
  'Carol',
  { kind: 'text', text: 'Explizites Legacy' },
  S.randomMid(),
  {
    legacyGroup: {
      id: current.id,
      revision: 0,
      ownerMasterPub: undefined,
    },
  },
);
ok('explizit ownerlose Legacy-Gruppe darf Revision 0 verwenden',
  explicitLegacyFanout.deliveries.length === 0 &&
  explicitLegacyFanout.unreachable.length === 0);

let ownerAtRevisionZeroRejected = false;
try {
  await S.groupFanoutToDevices(
    Carol.id,
    [],
    current.id,
    0,
    undefined,
    'Carol',
    { kind: 'text', text: 'Owner-Hybrid' },
    S.randomMid(),
    {
      legacyGroup: {
        id: current.id,
        revision: 0,
        ownerMasterPub: Alice.id.master.publicKey,
      },
    },
  );
} catch {
  ownerAtRevisionZeroRejected = true;
}
ok('Owner bei Revision 0 kann sich nicht als Legacy ausgeben',
  ownerAtRevisionZeroRejected);

console.log('\n[Eingehend: E2EE-Authentizität ersetzt keine Gruppen-Autorisierung]');

const sendGroupToCarol = async (sender, state, text) => {
  const toCarol = await S.makeContact(
    S.asMasterPub(sender.id.master.publicKey),
    Carol.bundle,
  );
  await S.applyDeviceListUpdate(toCarol, Carol.deviceList, new Set());
  const sealed = await S.sendGroupMessage(
    sender.id,
    toCarol,
    current.id,
    sender.name,
    { kind: 'text', text },
    state.revision,
    state.stateHash,
  );
  const opened = await S.openPayload(Carol.id, sealed);
  const envelope = await S.decodeEnvelope(opened.payload);
  const senderContact = await S.makeContactFromHeader(
    S.asMasterPub(Carol.id.master.publicKey),
    envelope.x3dh,
  );
  const received = await S.receiveEnvelope(
    Carol.id,
    senderContact,
    envelope,
    Carol.lookup,
  );
  return { senderContact, received };
};

const framePolicy = (senderMaster, received) =>
  received?.outcome === 'message' &&
  received.content.kind === 'group'
    ? S.classifyGroupFrame(
        current,
        senderMaster,
        received.content.revision,
        received.content.stateHash,
      )
    : 'reject';

const fromRemovedBob = await sendGroupToCarol(
  Bob,
  current,
  'Ich bin kryptographisch echt, aber nicht mehr Mitglied.',
);
ok('Bobs alte Schlüssel erzeugen weiterhin authentisches Pairwise-E2EE',
  fromRemovedBob.received.outcome === 'message' &&
  S.bytesEqual(
    fromRemovedBob.senderContact.peerMasterPub,
    Bob.id.master.publicKey,
  ));
ok('aktuelles Membership-Gate verwirft Bobs Nachricht',
  framePolicy(
    fromRemovedBob.senderContact.peerMasterPub,
    fromRemovedBob.received,
  ) === 'reject');

const staleFromOwner = await sendGroupToCarol(
  Alice,
  afterAdd,
  'Während der Roster-Fanout noch lief.',
);
ok('alter Inhalt eines weiterhin aktuellen Mitglieds bleibt sichtbar',
  framePolicy(
    staleFromOwner.senderContact.peerMasterPub,
    staleFromOwner.received,
  ) === 'accept');

const currentFromDave = await sendGroupToCarol(
  Dave,
  current,
  'Aktueller Stand',
);
ok('aktueller Master plus exakter State-Hash wird angenommen',
  framePolicy(
    currentFromDave.senderContact.peerMasterPub,
    currentFromDave.received,
  ) === 'accept');
ok('exakt nächste noch nicht installierte Revision wird zunächst deferiert',
  S.classifyGroupFrame(
    current,
    Dave.id.master.publicKey,
    current.revision + 1,
    new Uint8Array(32).fill(0x7a),
  ) === 'defer');
ok('gleiche Revision mit falschem Hash wird abgelehnt',
  S.classifyGroupFrame(
    current,
    Dave.id.master.publicKey,
    current.revision,
    new Uint8Array(32).fill(0x7b),
  ) === 'reject');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
