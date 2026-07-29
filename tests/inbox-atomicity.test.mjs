// Source-level integration guards for the React/IndexedDB receive coordinator.
// The pure ratchet mutation guard is tested dynamically in ratchet-commit; these
// assertions pin the surrounding persistence order that a Node-only unit cannot
// mount without a browser.
import { readFileSync } from 'node:fs';

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

const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const inboxStart = source.indexOf('async function onInbox');
const inboxEnd = source.indexOf('\n  async function addBundle', inboxStart);
const inbox = source.slice(inboxStart, inboxEnd);
const appendStart = source.indexOf('async function appendMessage');
const appendEnd = source.indexOf('\n  /** Append a just-materialized', appendStart);
const append = source.slice(appendStart, appendEnd);
const bootstrapStart = source.indexOf('async function applyBootstrapIfNew');
const bootstrapEnd = source.indexOf('// When a peer device is revoked', bootstrapStart);
const bootstrap = source.slice(bootstrapStart, bootstrapEnd);

console.log('\n[Inbox-Atomizität: Anwendung vor Ratchet, Retry ohne Phantom-Dedup]');

ok('Entschlüsselung arbeitet auf einer isolierten Kontakt-Kopie',
  inbox.indexOf('deserializeContact(await serializeContact(liveContact))') <
    inbox.indexOf('receiveEnvelope(id, contact, env, lookup)'));
ok('Anwendungsdispatch liegt vor dem finalen Ratchet-Commit',
  inbox.indexOf("if (content.kind === 'profile')") <
    inbox.lastIndexOf('await commitReceiveState()'));
ok('Message-Log wird vor Veröffentlichung im RAM gespeichert',
  append.indexOf('await saveMessages(dek, roomId, next)') <
    append.indexOf('messagesRef.current[roomId] = next'));
ok('OPK-Verbrauch und Kontaktzustand bleiben atomar gekoppelt',
  inbox.includes('saveContactAndConsumeOneTimePreKey'));
ok('transiente Storage-/Restore-/Korruptionsfehler behalten den Relay-Eintrag',
  inbox.includes('isTransientStorageFailure(e)') &&
  inbox.includes('e instanceof StaleAccountGenerationError') &&
  inbox.includes('e instanceof MessageCorruptionError') &&
  inbox.includes('if (!retainRelayRow)'));
ok('unbekannte Gruppenframes werden verworfen und können die Relay-Inbox nicht blockieren',
  source.includes('Nachricht für unbekannte Gruppe verworfen') &&
  !source.includes('DeferredInboxApplicationError'));
ok('Gruppen-Dedup bindet die authentifizierte Sender-Identität',
  source.includes('const messageId = `g:${bytesToB64(contact.peerMasterPub)}:${wireMid}`'));
ok('Bootstrap-Profil wird erst nach erfolgreicher Persistenz im RAM veröffentlicht',
  bootstrap.indexOf('await saveProfile(dek, next)') <
    bootstrap.indexOf('myProfileRef.current = next'));
ok('Bootstrap-History mutiert keine Live-Liste vor erfolgreicher Persistenz',
  bootstrap.includes('const next = [...base]') &&
  bootstrap.indexOf('await saveMessages(dek, room, next)') <
    bootstrap.indexOf('messagesRef.current[room] = added ? next : base') &&
  !bootstrap.includes('arr.push('));
ok('Bootstrap-applied-Marker bleibt nach allen Profil-/History-Schreibvorgängen',
  bootstrap.lastIndexOf('await saveMessages') <
    bootstrap.indexOf('await saveBootstrapApplied'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
