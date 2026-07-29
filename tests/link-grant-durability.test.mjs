// Device-link grants are authoritative credentials. A local WebSocket write is
// not enough: the primary may clear its retry state only after the relay reports
// a durable mailbox INSERT.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

globalThis.location = { protocol: 'https:', host: 'relay.test' };

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];
  readyState = FakeWebSocket.CONNECTING;
  sent = [];
  constructor() {
    FakeWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.onopen?.();
    });
  }
  send(frame) { this.sent.push(frame); }
  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
  receive(message) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}
globalThis.WebSocket = FakeWebSocket;

console.log('\n[LinkGrant: Relay-Receipt + persistenter Retry-Intent]');

const client = new S.RelayClient('target-room', {});
client.connect();
await new Promise((resolve) => setTimeout(resolve, 0));
const ws = FakeWebSocket.instances.at(-1);

let settled = false;
const confirmed = client.sendConfirmed(new Uint8Array([1, 2, 3]), true).then(() => { settled = true; });
await new Promise((resolve) => setTimeout(resolve, 0));
const sentFrame = JSON.parse(ws.sent.at(-1));
ok('sendConfirmed erzeugt eine korrelierbare zufällige Request-ID',
  sentFrame.t === 'send' && typeof sentFrame.mid === 'string' && /^[a-f0-9]{32}$/.test(sentFrame.mid));
ok('bloßes WebSocket-send löst die Bestätigung noch nicht aus', settled === false);
ws.receive({ t: 'sent', mid: sentFrame.mid });
await confirmed;
ok('passendes Relay-sent löst die Bestätigung aus', settled === true);

let nackRejected = false;
const nacked = client.sendConfirmed(new Uint8Array([4]), true).catch(() => { nackRejected = true; });
await new Promise((resolve) => setTimeout(resolve, 0));
const nackFrame = JSON.parse(ws.sent.at(-1));
ws.receive({ t: 'nack', mid: nackFrame.mid, reason: 'full' });
await nacked;
ok('Relay-nack verwirft die bestätigte Zustellung', nackRejected);

let closeRejected = false;
const closing = client.sendConfirmed(new Uint8Array([5]), true).catch(() => { closeRejected = true; });
client.close();
await closing;
ok('explizites Schließen lässt keinen Receipt-Waiter hängen', closeRejected);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const devices = readFileSync(join(root, 'src', 'lib', 'devices.ts'), 'utf8');
const flow = readFileSync(join(root, 'src', 'lib', 'linkflow.ts'), 'utf8');
const messenger = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');
ok('Geräteliste und Retry-Intent teilen denselben Multi-Record-CAS',
  devices.includes('[KEY, listRecord]') &&
  devices.includes('[PENDING_LINK_GRANT_KEY, intentRecord]') &&
  devices.includes('compareAndSwapRecords'));
ok('Intent wird erst nach await send gelöscht',
  flow.indexOf('await send(session.peerSignPub, sealedPayload)') <
    flow.indexOf('await clearPendingLinkGrantAndRecover(dek, pendingRecord)') &&
  flow.includes('pendingRecord } = await issueAndSaveLinkGrant('));
ok('Boot bietet einen liegengebliebenen Grant erneut an',
  messenger.includes('await retryPendingLinkGrant(async () =>'));
const retryStart = messenger.indexOf('async function retryPendingLinkGrant(');
const retryEnd = messenger.indexOf('async function synchronizeCommittedPrimaryLinkList', retryStart);
const retrySource = messenger.slice(retryStart, retryEnd);
const bootRetryStart = messenger.indexOf('const discardedCorruptGrant = await retryPendingLinkGrant(async () =>');
const bootRetryEnd = messenger.indexOf('setPrimaryLinkDeliveryPending(false)', bootRetryStart);
const bootRetrySource = messenger.slice(bootRetryStart, bootRetryEnd);
ok('Boot synchronisiert den Selbstkontakt vor dem erneuten Grant-Send',
  retrySource.indexOf('await beforeSend?.()') <
    retrySource.indexOf('await sendToInbox(pending.recipientSignPub') &&
  bootRetrySource.includes('const self = await ensureSelfContact()'));
const installCatch = messenger.slice(
  messenger.indexOf('async function performInstallGrant'),
  messenger.indexOf('// P scanned N', messenger.indexOf('async function performInstallGrant')),
);
ok('transienter IndexedDB-Abbruch vor Identity-Commit hält Grant-Row und Session für Retry',
  installCatch.includes('isTransientStorageFailure(e)') &&
  installCatch.includes("return 'retry';") &&
  !installCatch.slice(installCatch.indexOf('} catch (e)')).includes('resetLink();'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
