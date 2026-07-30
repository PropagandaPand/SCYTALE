// Source-level integration locks for security boundaries that live in the
// Messenger orchestration layer and cannot be exercised through its React UI in
// the transport-agnostic Node bundle.
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const source = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const session = readFileSync(new URL('../src/lib/session.ts', import.meta.url), 'utf8');
const groups = readFileSync(new URL('../src/lib/groups.ts', import.meta.url), 'utf8');
const section = (startNeedle, endNeedle) => {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  return start >= 0 && end > start ? source.slice(start, end) : '';
};

console.log('\n[Hidden Contact: direkte Inhalte werden gedroppt, Gruppenframes bleiben erlaubt]');

const hiddenGate = section(
  'const hiddenDirectContent =',
  "} else if (content.kind === 'profile')",
);
const directKinds = [
  'text',
  'file',
  'reply',
  'chunk',
  'recall',
  'attoffer',
  'attreq',
  'r2',
];
ok('Hidden-Gate gilt nur für fremde versteckte Kontakte, nicht für Self-Sync',
  hiddenGate.includes('contact.hidden &&') &&
  hiddenGate.includes('!bytesEqual(contact.peerMasterPub, id.master.publicKey)'));
ok('alle speicher-/transferwirksamen direkten Inhaltsarten sind im Drop-Gate',
  directKinds.every((kind) =>
    hiddenGate.includes(`content.kind === '${kind}'`)));
ok('Gruppen- und Control-Frames sind nicht versehentlich im Direct-Drop',
  !hiddenGate.includes("content.kind === 'group'") &&
  !hiddenGate.includes("content.kind === 'ginvite'") &&
  !hiddenGate.includes("content.kind === 'devlist'"));
ok('Drop-Pfad rendert oder persistiert keinen unsichtbaren 1:1-Inhalt',
  hiddenGate.includes('if (hiddenDirectContent)') &&
  hiddenGate.includes('Direkter Inhalt eines versteckten Mitgliedskontakts verworfen') &&
  !hiddenGate.includes('appendMessage(') &&
  !hiddenGate.includes('retainRelayRow = true'));

console.log('\n[Hidden → Visible: gescannter Code promotet und erhält nutzbares Bundle]');

const addBundle = section(
  'async function addBundle(rawInput: string)',
  'useEffect(() => {',
);
const verifiedContactAt = addBundle.indexOf(
  'const candidate = await makeContact(',
);
const existingLookupAt = addBundle.indexOf(
  'const existing = contactsRef.current.find',
);
const verifiedBeforeLookup =
  verifiedContactAt >= 0 &&
  existingLookupAt >= 0 &&
  verifiedContactAt < existingLookupAt;
const promoteStart = addBundle.indexOf('existing.hidden = undefined;');
const promoteEnd = addBundle.indexOf('return existing;', promoteStart);
const promotion = promoteStart >= 0 && promoteEnd > promoteStart
  ? addBundle.slice(
      promoteStart,
      promoteEnd + 'return existing;'.length,
    )
  : '';
ok('Promotion nutzt erst das kryptographisch verifizierte makeContact-Ergebnis',
  addBundle.includes('const bundle = await decodeBundle(token)') &&
  verifiedBeforeLookup);
ok('falscher Master, Epoch-Rollback und widerrufenes Scan-Gerät werden abgewiesen',
  addBundle.includes('!bytesEqual(existing.peerMasterPub, bundle.masterPub)') &&
  addBundle.includes('bundle.epoch < existing.peerEpoch') &&
  addBundle.includes('!deviceInList(existing.peerDeviceList, bundle.identitySignPub)'));
ok('bestehender Hidden Contact wird sichtbar und erhält das frische Bundle',
  promotion.includes('existing.hidden = undefined;') &&
  promotion.includes('existing.bundle = bundle;') &&
  promotion.includes('existing.peerSignPub = bundle.identitySignPub;') &&
  promotion.includes('existing.peerDhPub = bundle.identityDhPub;'));
ok('Promotion wird vor Connect dauerhaft gespeichert',
  promotion.indexOf('await saveContact(dek, existing)') >= 0 &&
  promotion.indexOf('await saveContact(dek, existing)') <
    promotion.indexOf('return existing;') &&
  addBundle.indexOf('await connectSend(contact)') >
    addBundle.indexOf('const contact = await enqueueInbox('));

console.log('\n[DeviceList: Ack und Retry sind pro Zielgerät statt pro Person]');

const ackSender = section(
  'async function sendListAckTo(',
  'function peerAckForDevice(',
);
const ackLookup = section(
  'function peerAckForDevice(',
  'function peerHasAckedListOnEveryDevice(',
);
const ackAll = section(
  'function peerHasAckedListOnEveryDevice(',
  'async function ensureListGossiped(',
);
const retry = section(
  'async function ensureListGossiped(',
  'async function clearBootstrapPending(',
);
const inboundAck = section(
  "} else if (content.kind === 'listack')",
  "} else if (content.kind === 'unlinkreq')",
);
ok('Ack wird gezielt an das authentifizierte Absendergerät gefächert',
  ackSender.includes('if (toDevice)') &&
  ackSender.includes(
    "fanoutFromThisDevice(id, current, { kind: 'listack', epoch, version }, randomMid(), undefined, toDevice)",
  ));
ok('Watermark-Lookup ist per Device-Key; Legacy-Wert gilt nur für Primary',
  ackLookup.includes('contact.peerAckedListByDevice?.[bytesToB64(deviceSignPub)]') &&
  ackLookup.includes('bytesEqual(deviceSignPub, contact.peerSignPub)') &&
  ackLookup.includes('? contact.peerAckedListEV'));
ok('„vollständig bestätigt“ verlangt Ack von jedem autorisierten Zielgerät',
  ackAll.includes('contact.peerDeviceList?.devices.map') &&
  ackAll.includes('return targets.every((target) =>') &&
  ackAll.includes('const acked = peerAckForDevice(contact, target)'));
ok('Retry schleift pro Gerät, trennt Cooldown-Key und nutzt exponentielles Backoff',
  retry.includes('for (const target of targets)') &&
  retry.includes('const acked = peerAckForDevice(contact, target)') &&
  retry.includes('const attemptKey = `${contact.roomId}:${bytesToB64(target)}`') &&
  retry.includes('GOSSIP_COOLDOWN_MS * 2 ** tries') &&
  retry.includes("await silentFanout(contact, { kind: 'devlist', list }, target)"));
ok('eingehender Ack wird dem authentifizierten Envelope-Gerät zugeordnet',
  inboundAck.includes("env.type === 'prekey'") &&
  inboundAck.includes('(env.dev ?? contact.peerSignPub)') &&
  inboundAck.includes('contact.peerAckedListByDevice = {') &&
  inboundAck.includes('[key]: claimed'));
ok('per-device Watermarks überleben Contact-Serialisierung und Reload',
  session.includes('peerAckedListByDevice?: Record<string, { epoch: number; version: number }>') &&
  session.includes('peerAckedListByDevice: c.peerAckedListByDevice ?? null') &&
  session.includes('peerAckedListByDevice: wire.peerAckedListByDevice ?? undefined'));

console.log('\n[Gruppen-Text: genau eine logische MID für Wire, Self-Sync und lokalen Echo]');

const groupSend = section(
  'async function groupSend(inner: MessageContent, localMsg: ChatMessage)',
  'async function applyGroupMessage(',
);
const textSend = section(
  'async function onSend()',
  'async function onPickFile(',
);
ok('groupSend erzeugt bei Text ohne vorgegebene MID eine neue logische MID',
  groupSend.includes('const logicalMid = localMsg.mid ?? randomMid();') &&
  textSend.includes(
    'await groupSend(content, { mine: true, text, ts: Date.now(), reply: q ?? undefined });',
  ));
ok('dieselbe MID geht an Member-Fanout und eigene Geräte',
  groupSend.includes('groupFanoutToDevices(') &&
  /groupFanoutToDevices\([\s\S]*?inner,\s*logicalMid,/.test(groupSend) &&
  groupSend.includes('syncGroupMessageToOwnDevices(') &&
  /syncGroupMessageToOwnDevices\([\s\S]*?inner,\s*logicalMid,\s*localMsg\.ts,/.test(groupSend));
ok('lokaler Gruppen-Echo persistiert exakt dieselbe MID',
  groupSend.includes('await appendMessage(group.id, {') &&
  groupSend.includes('mid: logicalMid,'));

console.log('\n[Roster-Race: begrenzter, crashfester Übergang statt unbounded Inbox-Block]');

const transitionQueue = section(
  'function queueGroupTransitionFrame(',
  'async function flushGroupTransitionFrames(',
);
ok('Übergangspuffer hat globale ID-, Anzahl-, Byte- und TTL-Grenzen',
  source.includes('const GROUP_TRANSITION_MAX_IDS = 8') &&
  source.includes('const GROUP_TRANSITION_MAX_PER_GROUP = 12') &&
  source.includes('const GROUP_TRANSITION_MAX_BYTES = 2 * 1024 * 1024') &&
  source.includes('const GROUP_TRANSITION_TTL_MS = 2 * 60_000') &&
  transitionQueue.includes('GROUP_TRANSITION_MAX_PER_GROUP') &&
  transitionQueue.includes('GROUP_TRANSITION_MAX_BYTES') &&
  transitionQueue.includes('GROUP_TRANSITION_MAX_IDS'));
ok('nur angenommene Übergangsframes behalten ihren Relay-Row',
  source.includes('throw new DeferredGroupTransitionError()') &&
  source.includes('e instanceof DeferredGroupTransitionError') &&
  source.includes('retainRelayRow = true'));
ok('Transition-Frames sind an einen 32-Byte-State-Hash und den Relay-ackId gebunden',
  transitionQueue.includes('!stateHash ||') &&
  transitionQueue.includes('stateHash.length !== 32') &&
  transitionQueue.includes('stateHash,') &&
  transitionQueue.includes('ackId,'));
ok('Redelivery derselben Relay-Zeile bleibt erhalten, ein zweites Duplikat wird ACKed',
  transitionQueue.includes(
    "return duplicate.ackId === ackId ? 'retained' : 'duplicate';",
  ) &&
  source.includes("if (queued === 'queued' || queued === 'retained')") &&
  source.includes("if (queued === 'duplicate')") &&
  source.includes('throw new DuplicateGroupTransitionRowError()') &&
  source.includes('e instanceof DuplicateGroupTransitionRowError'));
ok('Duplicate-Pfad commitet den geklonten Ratchet nicht und behält nur die Originalzeile',
  source.includes('ACK this additional relay row but deliberately do NOT commit its') &&
  source.includes('The original stable ackId remains retained'));
ok('Owner-State flush’t alte/aktuelle Frames hashgebunden und lässt Zukunft begrenzt liegen',
  source.includes('if (frame.revision > group.revision) continue;') &&
  source.includes('frame.stateHash,') &&
  source.includes('(frame) => frame.revision > group.revision'));
ok('Classifier defer’t nur exakt N+1, größere Sprünge werden verworfen',
  groups.includes(
    "if ((incomingRevision as number) === group.revision + 1) return 'defer';",
  ) &&
  groups.includes(
    "if ((incomingRevision as number) > group.revision) return 'reject';",
  ));
ok('aktuelle Revision verlangt Hash-Gleichheit; alte Frames bleiben reine Content-Frames',
  groups.includes('bytesEqual(incomingStateHash, group.stateHash)') &&
  groups.includes('if (!isGroupMember(group, senderMasterPub)) return \'reject\';') &&
  groups.includes('return \'accept\';'));

console.log('\n[v4 Produktionsintegration: Fail-fast, Rotation, Sync und Retry]');

const preflight = section(
  'async function preflightGroupMutationWithinInbox(',
  'async function gcUnreferencedHiddenContacts(',
);
const commitMutation = section(
  'async function commitDurableGroupMutationWithinInbox(',
  'async function commitDurableGroupMutation(',
);
ok('jede Gruppenmutation prüft alle Peer- und eigenen Geräte vor dem atomaren CAS',
  preflight.includes('assertGroupContactReady(contact') &&
  preflight.includes('for (const device of self.peerDeviceList.devices)') &&
  preflight.includes('deviceProtocolVersion(self, device.signPub) < 6') &&
  commitMutation.indexOf('await preflightGroupMutationWithinInbox(group)') <
    commitMutation.indexOf('commitGroupMutation('));
ok('Gruppenmutation hält eine einzige Lockordnung inbox → group und Leave verschachtelt nicht',
  source.includes('return enqueueInbox(() =>') &&
  source.includes('commitDurableGroupMutationWithinInbox(') &&
  commitMutation.includes('return enqueueGroupMutation(async () =>') &&
  preflight.includes('ensureMemberContactWithinInbox(member)') &&
  preflight.includes('ensureSelfContactWithinInbox()') &&
  section(
    'async function applyGroupLeave(',
    'function openManage(',
  ).includes('await commitDurableGroupMutationWithinInbox('));
ok('PV6-Preflight verlangt Capability UND Ratchet/SPK-Erreichbarkeit',
  source.includes('deviceProtocolVersion(contact, device.signPub) < 6') &&
  source.includes('!!contact.sessions.get(bytesToB64(device.signPub))?.ratchet') &&
  source.includes('!!device.signedPreKey'));
ok('ein entferntes Mitglied kann seine Entfernung nicht über die eigene DeviceList blockieren',
  !preflight.includes('for (const master of removedMasters)') &&
  !section(
    'async function removeMemberFromGroup(',
    'async function leaveGroup(',
  ).includes('await ensureMemberContact(member)') &&
  source.includes('The signed removal proof is a courtesy/cleanup notification') &&
  source.includes("console.warn('[group] Entfernungsnachweis"));

const groupSync = section(
  'async function applyGroupSync(',
  'function masterReferencedByLiveGroup(',
);
ok('älterer echt signierter Own-Device-Sync rollt Authority nicht zurück, behält aber History',
  groupSync.includes('const incoming = await fromInvite(content.group)') &&
  groupSync.includes('incoming.revision < current.revision') &&
  groupSync.includes('group = safeOlderOwnHistory') &&
  groupSync.includes('? current') &&
  groupSync.includes('appendFreshInboundMessage(group.id, message)'));

const rotation = section(
  "} else if (content.kind === 'rotation')",
  "} else if (content.kind === 'sync'",
);
const manualRotation = section(
  'async function acceptNewIdentity()',
  'async function reconnectStaleContact()',
);
ok('Contact-Masterwechsel ist fail-closed, solange der alte Master in einer Gruppe steckt',
  rotation.indexOf('masterReferencedByLiveGroup(contact.peerMasterPub)') <
    rotation.indexOf('acceptRotation(contact') &&
  manualRotation.indexOf('masterReferencedByLiveGroup(c.peerMasterPub)') <
    manualRotation.indexOf('acceptMasterChange(c)'));

ok('durable Gruppen-Outbox retried bei Relay-open, Foreground und periodisch single-flight',
  source.includes('groupMutationRetryRef') &&
  source.includes('groupsBootReadyRef') &&
  source.includes("if (s === 'open')") &&
  source.includes('void schedulePendingGroupMutationRetry();') &&
  source.includes('if (groupMutationRetryRef.current) return groupMutationRetryRef.current'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
