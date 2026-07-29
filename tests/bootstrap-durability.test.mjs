// Erst-Sync is a recovery stream: "done" may only follow frames whose durable
// mailbox INSERT was confirmed, and every frame must target exactly one device.
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
const throws = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

console.log('\n[Bootstrap: exaktes Ziel + durable Relay-Receipts]');

const target = new Uint8Array(32).fill(7);
const other = new Uint8Array(32).fill(8);
const delivery = { deviceSignPub: target, sealed: new Uint8Array([1, 2]) };
ok('exakt ein passendes Bootstrap-Ziel wird akzeptiert',
  S.requireExactBootstrapDelivery(target, [delivery]) === delivery);
ok('zero delivery ist ein harter Fehler',
  throws(() => S.requireExactBootstrapDelivery(target, [])));
ok('mehr als ein Delivery ist ein harter Fehler',
  throws(() => S.requireExactBootstrapDelivery(target, [delivery, delivery])));
ok('substituiertes Einzelziel ist ein harter Fehler',
  throws(() => S.requireExactBootstrapDelivery(target, [{
    deviceSignPub: other,
    sealed: new Uint8Array([3]),
  }])));

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
  send(frame) {
    this.sent.push(frame);
  }
  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
  receive(message) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}
globalThis.WebSocket = FakeWebSocket;

const client = new S.RelayClient('bootstrap-target', {});
client.connect();
await new Promise((resolve) => setTimeout(resolve, 0));
const ws = FakeWebSocket.instances.at(-1);
let confirmed = false;
const pending = client
  .sendConfirmed(new Uint8Array([4, 5]), true)
  .then(() => { confirmed = true; });
await new Promise((resolve) => setTimeout(resolve, 0));
const frame = JSON.parse(ws.sent.at(-1));
ok('Bootstrap-Transport markiert den Relay-Frame silent',
  frame.t === 'send' && frame.silent === true);
ok('lokaler WebSocket-write gilt noch nicht als durable',
  confirmed === false);
ws.receive({ t: 'sent', mid: frame.mid });
await pending;
ok('erst korreliertes Relay-sent bestätigt die Zustellung',
  confirmed === true);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const messenger = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');
const dispatcherStart = messenger.indexOf('async function dispatchConfirmedBootstrapDelivery');
const dispatcherEnd = messenger.indexOf('/**', dispatcherStart + 20);
const dispatcher = messenger.slice(dispatcherStart, dispatcherEnd);
ok('Bootstrap besitzt einen eigenen confirmed Dispatcher',
  dispatcher.includes('requireExactBootstrapDelivery(targetSignPub, deliveries)') &&
  dispatcher.includes('await client.sendConfirmed(delivery.sealed, true)') &&
  !dispatcher.includes('?.send('));
const frameStart = messenger.indexOf('async function sendBootstrapFrame');
const frameEnd = messenger.indexOf('/**', frameStart + 20);
const frameSource = messenger.slice(frameStart, frameEnd);
ok('unreachable/zero wird geworfen statt als erfolgreiche Frame-Sendung zu gelten',
  frameSource.includes('if (unreachable.length > 0)') &&
  frameSource.includes("throw new Error('Bootstrap-Ziel ist kryptographisch nicht erreichbar.')") &&
  frameSource.includes('await dispatchConfirmedBootstrapDelivery(targetSignPub, deliveries)'));
const historyStart = messenger.indexOf('async function sendHistoryTo');
const historyEnd = messenger.indexOf('async function sendBootstrapTo', historyStart);
const history = messenger.slice(historyStart, historyEnd);
const chunkSend = history.indexOf('await sendBootstrapFrame(targetSignPub, `${baseBid}-h-');
const doneSend = history.indexOf('await sendBootstrapFrame(targetSignPub, `${baseBid}-done`');
ok('done wird erst nach allen awaited History-Frames bestätigt',
  chunkSend >= 0 && doneSend > chunkSend);
const bootstrapStart = messenger.indexOf('async function sendBootstrapTo');
const bootstrapEnd = messenger.indexOf('/**', bootstrapStart + 20);
const bootstrap = messenger.slice(bootstrapStart, bootstrapEnd);
ok('History/done startet erst nach bestätigtem Profil/Roster-Frame',
  bootstrap.indexOf('await sendBootstrapFrame(targetSignPub, bid, parts)') <
    bootstrap.indexOf('await sendHistoryTo(targetSignPub, bid)'));
ok('Fehler erzeugen kein synthetisches done; N behält den Pull für Retry',
  messenger.includes('void sendBootstrapTo(requester, content.requestId).catch') &&
  messenger.includes('No synthetic \"done\": N keeps its durable pull pending and retries.'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
