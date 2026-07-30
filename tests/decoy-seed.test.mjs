// Direct regression coverage for the believable decoy seed. Unlike the lifecycle
// suites, this decrypts the records produced by setDuressPassword itself. The
// production caller treats seeding as best-effort, so a lifecycle-only test would
// stay green even if buildDecoySeedRecords always threw and returned an empty vault.
import 'fake-indexeddb/auto';

const storage = new Map([['scytale-lang', 'de']]);
globalThis.localStorage = {
  getItem: (key) => storage.get(String(key)) ?? null,
  setItem: (key, value) => storage.set(String(key), String(value)),
  removeItem: (key) => storage.delete(String(key)),
  clear: () => storage.clear(),
  key: (index) => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};
globalThis.window = {};
globalThis.location = { origin: 'https://test.invalid', reload() {} };
globalThis.navigator.clearAppBadge = async () => {};

const S = await import('./.bundle/entry.js');
const enc = new TextEncoder();
const dec = new TextDecoder();

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

console.log('\n[Decoy-Seed: direkt entschlüsselt, kanonisch und monoton]');

await S.switchVaultDb('scytale');
await S.deleteVaultDb('scytale');
await S.deleteVaultDb('scytale-decoy');
await S.switchVaultDb('scytale');
await S.createBoundVault('echtes-passwort-fuer-seed-test');

// Deterministic regression input: with the old `k * independently-random-gap`
// formula the first conversation ran backwards between its first two messages.
// The cumulative implementation remains strictly monotone for any such sequence.
const originalRandom = Math.random;
let randomCall = 0;
Math.random = () => (randomCall++ % 3 === 2 ? 0.999999 : 0);
try {
  await S.setDuressPassword(
    'echtes-passwort-fuer-seed-test',
    'duress-passwort-fuer-seed-test',
  );
} finally {
  Math.random = originalRandom;
}

const decoyDek = await S.openDecoyForPopulate('duress-passwort-fuer-seed-test');
const records = await S.withVaultDb('scytale-decoy', async (db) => {
  const keys = await db.getAllKeys('records');
  return new Map(
    await Promise.all(
      keys.map(async (key) => [String(key), await db.get('records', key)]),
    ),
  );
});

ok(
  'Seed enthält Identität + Kontaktindex; Recordzahl im 7–15-Fenster (2 + 3×Kontakt)',
  records.has('identity') &&
    records.has('contact-index') &&
    records.size >= 2 + 3 * 7 &&
    records.size <= 2 + 3 * 15,
);

const identityPlain = await S.open(
  decoyDek,
  records.get('identity'),
  enc.encode('scytale:identity:v1'),
);
const identity = await S.deserializeIdentity(identityPlain);
ok(
  'mitgespeicherte Decoy-Identität ist eine gültige primäre Master-Identität',
  identity.master.privateKey.length > 0 &&
    await S.verifyDeviceCert(
      identity.master.publicKey,
      identity.epoch,
      identity.sign.publicKey,
      identity.dh.publicKey,
      identity.deviceCert,
    ),
);

const indexPlain = await S.open(
  decoyDek,
  records.get('contact-index'),
  enc.encode('scytale:contact-index:v1'),
);
const roomIds = JSON.parse(dec.decode(indexPlain));
ok(
  'deutscher Seed wählt 7–15 eindeutige Unterhaltungen aus dem Pool',
  roomIds.length >= 7 &&
    roomIds.length <= 15 &&
    new Set(roomIds).size === roomIds.length &&
    records.size === 2 + 3 * roomIds.length,
);

const contacts = [];
const histories = [];
for (const roomId of roomIds) {
  const contactPlain = await S.open(
    decoyDek,
    records.get(`contact:${roomId}`),
    enc.encode(`scytale:contact:v1:${roomId}`),
  );
  const contact = await S.deserializeContact(contactPlain);
  contacts.push(contact);

  const rawRoomKey = await S.open(
    decoyDek,
    records.get(`roomkey:${roomId}`),
    enc.encode(`scytale:room-key:v1:${roomId}`),
  );
  const roomKey = await crypto.subtle.importKey(
    'raw',
    rawRoomKey,
    'AES-GCM',
    false,
    ['decrypt'],
  );
  const historyPlain = await S.open(
    roomKey,
    records.get(`msgs:${roomId}`),
    enc.encode(`scytale:messages:v1:${roomId}`),
  );
  histories.push(JSON.parse(dec.decode(historyPlain)));
}

ok(
  'alle Kontakt- und Verlaufsdatensätze sind mit ihren Produktions-AADs lesbar',
  contacts.length === roomIds.length &&
    histories.length === roomIds.length &&
    histories.every((messages) => messages.length > 0),
);

const expectedRooms = await Promise.all(
  contacts.map((contact) =>
    S.computeMasterRoomId(
      S.asMasterPub(identity.master.publicKey),
      S.asMasterPub(contact.peerMasterPub),
    )),
);
ok(
  'jede roomId ist kanonisch aus Decoy-Master und Peer-Master abgeleitet',
  contacts.every(
    (contact, index) =>
      contact.regime === 'master' &&
      contact.roomId === roomIds[index] &&
      contact.roomId === expectedRooms[index],
  ),
);

ok(
  'jeder Kontakt bindet ownMasterPub an exakt dieselbe Decoy-Identität',
  contacts.every(
    (contact) =>
      contact.ownMasterPub &&
      S.bytesEqual(contact.ownMasterPub, identity.master.publicKey),
  ),
);

const expectedFingerprints = await Promise.all(
  contacts.map((contact) =>
    S.identityFingerprint(contact.peerMasterPub, contact.peerMasterPub)),
);
ok(
  'jeder sichtbare Sicherheitsfingerprint ist vollständig und aus dem Peer-Master abgeleitet',
  contacts.every(
    (contact, index) =>
      contact.peerFingerprint.length > 0 &&
      contact.peerFingerprint === expectedFingerprints[index],
  ),
);

ok(
  'Seed-Kontakte sind explizit lokal und kryptografisch inert',
  contacts.every(
    (contact) =>
      contact.localOnly === true &&
      contact.sessions.size === 0 &&
      contact.bundle === undefined,
  ),
);

const dePoolNames = new Set(S.DECOY_CONTENT.de.map((entry) => entry.name));
ok(
  'gewählte Kontakte stammen aus dem deutschen Pool (Lokalisierung folgt App-Sprache) und sind eindeutig',
  S.DECOY_CONTENT.de.length >= 90 &&
    contacts.every((contact) => dePoolNames.has(contact.peerName)) &&
    new Set(contacts.map((contact) => contact.peerName)).size === contacts.length,
);

const allMessages = histories.flat();
ok(
  'alle Seed-Verläufe haben strikt aufsteigende Zeitstempel',
  histories.every((messages) =>
    messages.every(
      (message, index) =>
        index === 0 || messages[index - 1].ts < message.ts,
    )),
);
ok(
  'jede Nachricht besitzt eine eindeutige MID im normalen 128-Bit-Format',
  allMessages.every((message) => /^[0-9a-f]{32}$/.test(message.mid)) &&
    new Set(allMessages.map((message) => message.mid)).size === allMessages.length,
);
ok(
  'gesendete Seed-Nachrichten tragen nur den lokalen, terminalen Sent-Status',
  allMessages.every(
    (message) =>
      message.mine ? message.status === 'sent' : message.status === undefined,
  ),
);

// Negative control: canonical rooms are identity-bound. Replacing the own
// master must derive different rooms; a merely random 32-hex room id cannot
// satisfy both the positive and this discriminator.
const foreignIdentity = await S.generateIdentity();
const foreignRooms = await Promise.all(
  contacts.map((contact) =>
    S.computeMasterRoomId(
      S.asMasterPub(foreignIdentity.master.publicKey),
      S.asMasterPub(contact.peerMasterPub),
    )),
);
ok(
  'Negativkontrolle: fremder Own-Master leitet keine der gespeicherten roomIds ab',
  foreignRooms.every((roomId, index) => roomId !== contacts[index].roomId),
);

let wrongAadRejected = false;
try {
  await S.open(
    decoyDek,
    records.get(`contact:${roomIds[0]}`),
    enc.encode(`scytale:contact:v1:${roomIds[1]}`),
  );
} catch {
  wrongAadRejected = true;
}
ok(
  'Negativkontrolle: ein Seed-Kontakt ist an seine konkrete roomId-AAD gebunden',
  wrongAadRejected,
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
