// Group-v4 authority is a global owner-master-signed roster. Pairwise sender
// authentication determines who transported a state, while the signature,
// monotonic revision and previous-state hash determine whether it is admissible.
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
  return {
    name,
    id,
    deviceList,
    bundle: S.currentBundle(id, {
      signedPreKey: spk,
      oneTimePreKeys: [],
    }),
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
const Carol = await mkPerson('Carol');
const Dave = await mkPerson('Dave');
const Mallory = await mkPerson('Mallory');

const GROUP_ID = 'grp_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const CREATED_AT = 1_700_000_000_000;
const signState = async ({
  owner = Alice,
  roster,
  localSelf,
  revision,
  previous,
  name = 'Team',
}) => S.signGroupState({
  id: GROUP_ID,
  name,
  createdAt: CREATED_AT,
  revision,
  ownerMasterPub: owner.id.master.publicKey,
  roster: roster.map((person) => person.id.master.publicKey),
  previousStateHash: previous?.stateHash,
  members: roster
    .filter((person) => person !== localSelf)
    .map(asMember),
}, owner.id);

console.log('\n[Legacy-v1 bleibt ein enger Kompatibilitätspfad]');

const legacyAlice = {
  signPub: Alice.id.sign.publicKey,
  dhPub: Alice.id.dh.publicKey,
  name: Alice.name,
};
const legacyBob = {
  signPub: Bob.id.sign.publicKey,
  dhPub: Bob.id.dh.publicKey,
  name: Bob.name,
};
const legacy = {
  id: 'grp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Legacy',
  members: [legacyAlice, legacyBob],
  createdAt: 1234,
  revision: 0,
};
ok('Legacy-Mitglied wird erkannt',
  S.isGroupMember(legacy, Bob.id.dh.publicKey));
ok('Legacy-Fremder wird abgelehnt',
  !S.isGroupMember(legacy, Mallory.id.dh.publicKey));

const legacyWire = await S.toInvite(legacy);
const legacyRoundtrip = await S.fromInvite(legacyWire);
ok('ownerlose Revision 0 wird ausdrücklich als v1 serialisiert',
  legacyWire.v === 1 &&
  legacyWire.revision === 0 &&
  legacyWire.ownerMasterPub === null);
ok('v1 wird ownerlos mit Revision 0 wieder geladen',
  legacyRoundtrip.revision === 0 &&
  legacyRoundtrip.ownerMasterPub === undefined &&
  legacyRoundtrip.createdAt === legacy.createdAt);

let hybridRejected = false;
try {
  await S.toInvite({
    ...legacy,
    ownerMasterPub: Alice.id.master.publicKey,
  });
} catch {
  hybridRejected = true;
}
ok('Owner bei Revision 0 ist kein Legacy-Zustand', hybridRejected);

console.log('\n[Signierter v4-Genesisstand und Personalisierung]');

const signedGenesis = await signState({
  roster: [Alice, Bob, Carol],
  localSelf: Bob,
  revision: 1,
});
const genesisWire = await S.toInvite(signedGenesis);
const local = await S.fromInvite(genesisWire);

ok('v4-Codec prüft echte Owner-Signatur und State-Hash',
  genesisWire.v === 4 &&
  await S.verifyGroupState(local));
ok('globales Roster enthält auch den lokalen Bob',
  local.roster.length === 3 &&
  local.roster.some((master) =>
    S.bytesEqual(master, Bob.id.master.publicKey)));
ok('personalisierte Transport-Directory lässt nur Bob selbst aus',
  local.members.length === 2 &&
  local.members.some((member) =>
    S.bytesEqual(member.masterPub, Alice.id.master.publicKey)) &&
  local.members.some((member) =>
    S.bytesEqual(member.masterPub, Carol.id.master.publicKey)));
ok('Ersteinladung muss vom signierenden Owner transportiert werden',
  S.decideInvite(undefined, local, Alice.id.master.publicKey).verdict === 'accept' &&
  S.decideInvite(undefined, local, Mallory.id.master.publicKey).verdict === 'reject');
ok('Own-Device-Transport darf denselben Owner-Stand installieren',
  S.decideInvite(undefined, local, Bob.id.master.publicKey, true).verdict === 'accept');

const tamperedWire = structuredClone(genesisWire);
tamperedWire.name = 'Manipuliert';
let tamperedRejected = false;
try {
  await S.fromInvite(tamperedWire);
} catch {
  tamperedRejected = true;
}
ok('Änderung eines signierten Feldes wird schon im Codec verworfen',
  tamperedRejected);

console.log('\n[Owner-only, exakt sequenziell und hash-verkettet]');

const next = await signState({
  roster: [Alice, Bob, Carol, Dave],
  localSelf: Bob,
  revision: 2,
  previous: local,
  name: 'Team + Dave',
});
ok('Nicht-Owner darf auch einen echt owner-signierten Stand nicht einspielen',
  S.decideInvite(local, next, Carol.id.master.publicKey).verdict === 'reject');

const ownerUpdate = S.decideInvite(
  local,
  next,
  Alice.id.master.publicKey,
);
ok('Owner-Transport übernimmt exakt Revision N+1',
  ownerUpdate.verdict === 'update' &&
  ownerUpdate.group.revision === 2 &&
  S.isGroupMemberMaster(ownerUpdate.group, Dave.id.master.publicKey));
ok('Nachfolger ist an den gepinnten State-Hash gebunden',
  S.bytesEqual(next.previousStateHash, local.stateHash));

const fork = await signState({
  roster: [Alice, Bob, Carol],
  localSelf: Bob,
  revision: 1,
  name: 'Gültig signierter Parallel-Fork',
});
ok('abweichender gültiger Stand derselben Revision wird abgelehnt',
  S.decideInvite(local, fork, Alice.id.master.publicKey).verdict === 'reject');

const skipped = await signState({
  roster: [Alice, Bob, Carol, Dave],
  localSelf: Bob,
  revision: 3,
  previous: local,
  name: 'Übersprungene Revision',
});
ok('ein gültig signierter Sprung über N+1 wird abgelehnt',
  S.decideInvite(local, skipped, Alice.id.master.publicKey).verdict === 'reject');

const wrongLink = await signState({
  roster: [Alice, Bob, Carol, Dave],
  localSelf: Bob,
  revision: 2,
  previous: fork,
  name: 'Falscher Vorgänger',
});
ok('N+1 mit falschem Vorgänger-Hash wird abgelehnt',
  S.decideInvite(local, wrongLink, Alice.id.master.publicKey).verdict === 'reject');

const ownerSwap = await signState({
  owner: Mallory,
  roster: [Mallory, Bob, Carol],
  localSelf: Bob,
  revision: 2,
  previous: local,
  name: 'Owner-Swap',
});
ok('Own-Device-Transport darf den gepinnten Owner nicht ersetzen',
  S.decideInvite(
    local,
    ownerSwap,
    Bob.id.master.publicKey,
    true,
  ).verdict === 'reject');

ok('identischer Hash und identische Revision sind idempotent',
  S.decideInvite(local, structuredClone(local), Alice.id.master.publicKey)
    .verdict === 'noop');
ok('Own-Device-Transport akzeptiert nur den echten hash-verketteten Nachfolger',
  S.decideInvite(local, next, Bob.id.master.publicKey, true).verdict === 'update' &&
  S.decideInvite(local, wrongLink, Bob.id.master.publicKey, true).verdict === 'reject');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
