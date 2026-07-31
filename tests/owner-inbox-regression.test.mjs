// Regression: the hidden self-contact must never reserve the current device's
// inbox with a sender-only RelayClient before the authenticated owner connects.
import { readFileSync } from 'node:fs';
import { prepareOwnerRelaySlot } from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name); }
};

const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');

function balancedBlockAfter(marker) {
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const open = source.indexOf('{', start + marker.length);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  return '';
}

console.log('\n[Owner inbox role cannot be shadowed by the hidden self-contact]');

const connectSend = balancedBlockAfter('async function connectSend(contact: Contact)');
const ownKeyGuard = connectSend.indexOf('bytesEqual(contact.peerSignPub, id.sign.publicKey)');
const senderRegistration = connectSend.indexOf('sendRoomRef.current.set(contact.roomId, room)');
ok('connectSend rejects the current device key before registering a sender route',
  ownKeyGuard >= 0 && senderRegistration > ownKeyGuard);

ok('the guard is key-based rather than skipping all hidden contacts',
  ownKeyGuard >= 0 && !/if\s*\(\s*contact\.hidden\s*\)/.test(connectSend));

const connectInbox = balancedBlockAfter('function connectInbox(room: string)');
const prepareSlot = connectInbox.indexOf('prepareOwnerRelaySlot(');
const ownerConstruction = connectInbox.indexOf('const client = new RelayClient(room, {');
ok('connectInbox reserves the authenticated owner role before construction',
  prepareSlot >= 0 && ownerConstruction > prepareSlot);

const sender = { closed: 0, close() { this.closed++; } };
const unrelated = { closed: 0, close() { this.closed++; } };
const relays = new Map([['own-inbox', sender], ['peer-inbox', unrelated]]);
const sendRooms = new Map([
  ['self-contact', 'own-inbox'],
  ['hostile-collision', 'own-inbox'],
  ['real-contact', 'peer-inbox'],
]);
ok('owner reservation dynamically evicts a sender-only collision',
  prepareOwnerRelaySlot('own-inbox', relays, sendRooms, null) &&
  sender.closed === 1 && !relays.has('own-inbox'));

ok('eviction removes only sender mappings for the owner inbox',
  !sendRooms.has('self-contact') && !sendRooms.has('hostile-collision') &&
  sendRooms.get('real-contact') === 'peer-inbox' && unrelated.closed === 0);

const owner = { closed: 0, close() { this.closed++; } };
relays.set('own-inbox', owner);
ok('an already installed owner remains idempotent',
  !prepareOwnerRelaySlot('own-inbox', relays, sendRooms, owner) &&
  relays.get('own-inbox') === owner && owner.closed === 0);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
