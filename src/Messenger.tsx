import { useEffect, useReducer, useRef, useState, type ChangeEvent } from 'react';
import { loadOrCreateIdentity, fingerprintOf } from './lib/identity';
import {
  loadOrCreatePreKeys,
  savePreKeys,
  currentBundle,
  findSignedPreKey,
  consumeOneTimePreKey,
  type PreKeyState,
} from './lib/prekeys';
import {
  encodeBundle,
  decodeBundle,
  decodeEnvelope,
  openPayload,
  SEALED_ENVELOPE,
  masterSafetyNumber,
  identityFingerprint,
  sign,
  type Bytes,
  type IdentityKeys,
} from './crypto';
import {
  makeContact,
  makeContactFromHeader,
  sendMessage,
  sendFile,
  sendProfile,
  sendGroupMessage,
  sendGroupInvite,
  sendGroupRemove,
  sendGroupLeave,
  receiveEnvelope,
  MasterChangedError,
  RetiredIdentityError,
  inboxRoom,
  computeRoomId,
  type Contact,
  type MessageContent,
  type GroupInvite,
  type PreKeyLookup,
} from './lib/session';
import {
  randomGroupId,
  toInvite,
  fromInvite,
  saveGroup,
  loadGroups,
  removeGroup,
  type Group,
  type GroupMember,
} from './lib/groups';
import { saveContact, loadContacts, removeContact } from './lib/store';
import { loadProfile, saveProfile, type MyProfile } from './lib/profile';
import { pushSupported, enablePush, disablePush, currentSubscription } from './lib/push';
import { loadMessages, saveMessages, clearMessages, type ChatMessage } from './lib/messages';
import { RelayClient, type RelayStatus } from './lib/relay';
import { makeQr } from './lib/qr';
import { bytesToB64, b64ToBytes } from './lib/bytes';
import { compressImage } from './lib/imagecompress';
import { Identicon } from './Identicon';
import { QrScanner } from './QrScanner';
import { CropModal } from './CropModal';
import { BackupModal } from './BackupModal';
import { AudioPlayer } from './AudioPlayer';
import {
  IconLock, IconShield, IconSearch, IconBack, IconPlus, IconSend, IconDoubleCheck, IconInfo, IconCamera, IconAttach, IconMic, IconTrash, IconDots, IconGroup,
} from './icons';

const MAX_ATTACH = 600 * 1024; // inline cap — keeps the WS frame under Cloudflare's ~1 MiB limit
const MAX_REC_SECONDS = 180;

function pickAudioMime(): string {
  const cands = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
}

const fmtRec = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

function eqBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function hexOf(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += x.toString(16).padStart(2, '0');
  return s;
}

function incomingMessage(content: MessageContent): ChatMessage {
  if (content.kind === 'file') {
    return {
      mine: false,
      ts: Date.now(),
      file: { name: content.name, mime: content.mime, dataB64: bytesToB64(content.data) },
    };
  }
  // text (profile is handled separately and never reaches here)
  return { mine: false, text: content.kind === 'text' ? content.text : '', ts: Date.now() };
}

function downloadFile(f: { name: string; mime: string; dataB64: string }) {
  const blob = new Blob([b64ToBytes(f.dataB64)], { type: f.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

interface Props {
  dek: CryptoKey;
  onLock: () => void;
}

type View = 'list' | 'chat' | 'add' | 'verify' | 'contact' | 'profile' | 'newgroup' | 'gmanage';

const shortFp = (fp: string) => (fp ? fp.split(' ').slice(0, 3).join(' ') + ' …' : '…');
const displayName = (c: Contact) =>
  c.nickname?.trim() || c.peerName?.trim() || shortFp(c.peerFingerprint);
const avatarSrc = (b64: string) => `data:image/jpeg;base64,${b64}`;

function extractToken(input: string): string {
  const m = input.match(/[#?&]add=([^&\s]+)/);
  return (m ? m[1] : input).trim();
}

function fmtListTs(ts: number | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

const fmtClock = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export function Messenger({ dek, onLock }: Props) {
  const identityRef = useRef<IdentityKeys | null>(null);
  const prekeysRef = useRef<PreKeyState | null>(null);
  const lookupRef = useRef<PreKeyLookup | null>(null);
  const relaysRef = useRef<Map<string, RelayClient>>(new Map());
  const contactsRef = useRef<Contact[]>([]);
  const messagesRef = useRef<Record<string, ChatMessage[]>>({});
  const unreadRef = useRef<Record<string, number>>({});
  const sendRoomRef = useRef<Map<string, string>>(new Map());
  const inboxClientRef = useRef<RelayClient | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recStreamRef = useRef<MediaStream | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const sendOnStopRef = useRef(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const myProfileRef = useRef<MyProfile>({});
  const profileSentRef = useRef<Set<string>>(new Set());
  const groupsRef = useRef<Group[]>([]);
  const pendingGroupMsgsRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const viewRef = useRef<View>('list');
  const activeRoomRef = useRef<string | null>(null);
  const activeGroupRef = useRef<string | null>(null);
  const initedRef = useRef(false);

  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [fingerprint, setFingerprint] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [view, setView] = useState<View>('list');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [statuses, setStatuses] = useState<Record<string, RelayStatus>>({});
  const [addInput, setAddInput] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [chatMenu, setChatMenu] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [myAvatarB64, setMyAvatarB64] = useState('');
  const [profileName, setProfileName] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupRenameInput, setGroupRenameInput] = useState('');
  const [groupSel, setGroupSel] = useState<Set<string>>(new Set());
  const [safetyNumber, setSafetyNumber] = useState('');
  const [safetyQr, setSafetyQr] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null); // full-screen image viewer
  const [notifOn, setNotifOn] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [qrFull, setQrFull] = useState(false); // own QR blown up full-screen for scanning
  const [cropFile, setCropFile] = useState<File | null>(null); // avatar being cropped
  const [backupMode, setBackupMode] = useState<'export' | 'import' | null>(null);
  const [swipeDx, setSwipeDx] = useState(0); // edge-swipe-back drag distance
  const [swiping, setSwiping] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const ackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  const commitMessages = () => setMessages({ ...messagesRef.current });

  async function appendMessage(roomId: string, msg: ChatMessage) {
    messagesRef.current[roomId] = [...(messagesRef.current[roomId] ?? []), msg];
    commitMessages();
    await saveMessages(dek, roomId, messagesRef.current[roomId]);
  }

  // Listen on our own inbox and authenticate as its owner (Ed25519 sig over the
  // DO's challenge) so the relay hands us our queued + live messages.
  function connectInbox(room: string) {
    const id = identityRef.current;
    if (!id || relaysRef.current.has(room)) return;
    const client = new RelayClient(room, {
      onCipher: (bytes, ackId) => void onInbox(bytes, ackId),
      auth: {
        signPub: id.sign.publicKey,
        sign: (nonce) => sign(nonce, id.sign.privateKey),
      },
    });
    relaysRef.current.set(room, client);
    inboxClientRef.current = client;
    client.connect();
  }

  // A send channel to a contact's inbox. Status = reachability dot for them.
  async function connectSend(contact: Contact) {
    const room = await inboxRoom(contact.peerSignPub);
    sendRoomRef.current.set(contact.roomId, room);
    if (relaysRef.current.has(room)) return;
    const client = new RelayClient(room, {
      onStatus: (s) => setStatuses((prev) => ({ ...prev, [contact.roomId]: s })),
      onAck: (mid) => markStatus(mid, 'sent'),
      onNack: (mid) => markStatus(mid, 'failed', 'Nicht zugestellt — das Postfach des Empfängers ist voll.'),
    });
    relaysRef.current.set(room, client);
    client.connect();
  }

  // Delivery tracking. A 1:1 message is 'pending' until the relay acks the insert
  // ('sent'); a nack or an ack timeout flips it to 'failed'. So the checkmark
  // never claims delivery the relay didn't confirm.
  function clearAckTimer(mid: string) {
    const t = ackTimers.current.get(mid);
    if (t) {
      clearTimeout(t);
      ackTimers.current.delete(mid);
    }
  }
  function startAckTimer(mid: string) {
    clearAckTimer(mid);
    ackTimers.current.set(
      mid,
      setTimeout(() => {
        ackTimers.current.delete(mid);
        markStatus(mid, 'failed', 'Keine Bestätigung vom Relay — noch nicht zugestellt (evtl. offline).');
      }, 10_000),
    );
  }
  function markStatus(mid: string | null, status: 'sent' | 'failed', errorMsg?: string) {
    if (status === 'failed' && errorMsg) setError(errorMsg);
    if (!mid) return;
    clearAckTimer(mid);
    for (const roomId of Object.keys(messagesRef.current)) {
      const arr = messagesRef.current[roomId];
      const idx = arr.findIndex((m) => m.mid === mid);
      if (idx >= 0) {
        const cur = arr[idx].status;
        if (cur === status) return;
        // INVARIANT: once 'sent' (relay durably has it), always 'sent'. A late
        // nack/timeout must never downgrade a confirmed delivery — that would
        // make the checkmark lie in the other direction. Only failed → sent
        // (recovery after a reconnect flush) is allowed.
        if (cur === 'sent') return;
        arr[idx] = { ...arr[idx], status };
        void saveMessages(dek, roomId, arr);
        commitMessages();
        bump();
        return;
      }
    }
  }

  async function onInbox(bytes: Bytes, ackId: number) {
    const id = identityRef.current;
    const lookup = lookupRef.current;
    if (!id || !lookup) return; // not ready — leave queued (no ack), retry on reconnect

    if (seenIdsRef.current.has(ackId)) {
      inboxClientRef.current?.ack(ackId);
      return;
    }

    try {
      let env;
      try {
        // Sealed Sender: open the anonymous outer box, then dispatch on the
        // payload tag — an inbox also receives non-envelope payloads (a device
        // linking grant, which has no ratchet session behind it).
        const opened = await openPayload(id, bytes);
        if (!opened) return; // not sealed for us
        if (opened.type !== SEALED_ENVELOPE) return; // e.g. link grant — handled by the linking flow
        env = await decodeEnvelope(opened.payload);
      } catch {
        return; // handled in finally (ack + drop)
      }

      let contact = contactsRef.current.find((c) => c.roomId === env.conv);
      if (!contact) {
        // First contact from someone who holds our code — auto-create it.
        if (env.type !== 'prekey') return;
        contact = await makeContactFromHeader(id.dh.publicKey, env.x3dh);
        contactsRef.current = [...contactsRef.current, contact];
        messagesRef.current[contact.roomId] = [];
        await connectSend(contact);
        await saveContact(dek, contact);
      }

      const wasNew = contact.ratchet === null;
      let content;
      try {
        content = await receiveEnvelope(id, contact, env, lookup);
      } catch (e) {
        if (e instanceof MasterChangedError) {
          // Persist the pending claim; the message itself is dropped. `verified`
          // stays as it was — the pin has NOT moved, and only a user-confirmed
          // accept moves it. Alert only on a NEW claim (see firstOccurrence):
          // the same claim can be replayed at will by anyone who can reach our
          // inbox, and a warning per copy would blunt the user against it.
          await saveContact(dek, contact);
          if (e.firstOccurrence) {
            setError(`⚠ Sicherheit: Für ${displayName(contact)} wird eine neue Identität behauptet — nicht übernommen. Prüfe sie in der Kontaktansicht, bevor du sie akzeptierst.`);
          }
          bump();
        } else if (e instanceof RetiredIdentityError) {
          // Persist the attempt flag, but alert ONLY on the first one. Whoever
          // holds the abandoned key can replay endlessly; a toast per message
          // would be a harassment lever and would blunt the user against real
          // warnings. The state stays visible in the contact view.
          await saveContact(dek, contact);
          if (e.firstOccurrence) {
            setError(`⚠ Sicherheit: Jemand hat sich als ${displayName(contact)} mit einer bereits ersetzten Identität gemeldet — abgelehnt.`);
          }
          bump();
        }
        throw e; // drop the message (don't process the unpinned master)
      }
      // Persist the ADVANCED receive state immediately — before any content
      // handling. `ratchetDecrypt` consumed a receive key: it advanced CKr/Nr,
      // and `trySkipped` DELETED the skipped key it used. That deletion is what
      // enforces "a message key is used exactly once" on the receive side. If a
      // group handler below throws (the outer catch swallows it) or the app dies
      // first, a reload restores the old state — the deleted key is back and the
      // same message decrypts a second time. That reopens a replay window the
      // ratchet closes by construction. Milder than the send-side nonce reuse,
      // but the same root cause: the invariant held only in RAM.
      await saveContact(dek, contact);
      if (content.kind === 'profile') {
        contact.peerName = content.name;
        contact.peerAvatarB64 = content.avatar ? bytesToB64(content.avatar) : undefined;
      } else if (content.kind === 'ginvite') {
        await applyGroupInvite(content.group);
      } else if (content.kind === 'group') {
        await applyGroupMessage(content.groupId, content.senderName, content.inner, contact);
      } else if (content.kind === 'gremove') {
        await deleteGroupAction(content.groupId);
      } else if (content.kind === 'gleave') {
        await applyGroupLeave(content.groupId, contact);
      } else {
        await appendMessage(contact.roomId, incomingMessage(content));
        if (!(viewRef.current === 'chat' && activeRoomRef.current === contact.roomId)) {
          unreadRef.current[contact.roomId] = (unreadRef.current[contact.roomId] ?? 0) + 1;
        }
      }
      await saveContact(dek, contact);
      if (wasNew && prekeysRef.current) await savePreKeys(dek, prekeysRef.current);
      void ensureProfileSent(contact);
      bump();
    } catch {
      // Decrypt failure (e.g. a duplicate re-delivery) — drop it, don't spam UI.
    } finally {
      seenIdsRef.current.add(ackId);
      inboxClientRef.current?.ack(ackId);
    }
  }

  async function addBundle(rawInput: string) {
    setError('');
    const id = identityRef.current;
    const token = extractToken(rawInput);
    if (!id || !token) return;
    try {
      const bundle = await decodeBundle(token);
      const contact = await makeContact(id.dh.publicKey, bundle);
      if (contactsRef.current.some((c) => c.roomId === contact.roomId)) {
        openChat(contact.roomId);
        return;
      }
      contactsRef.current = [...contactsRef.current, contact];
      messagesRef.current[contact.roomId] = [];
      commitMessages();
      await saveContact(dek, contact);
      await connectSend(contact);
      setAddInput('');
      openChat(contact.roomId);
    } catch (e) {
      setError('Ungültiges Bundle: ' + (e as Error).message);
    }
  }

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    void (async () => {
      const id = await loadOrCreateIdentity(dek);
      const pre = await loadOrCreatePreKeys(dek, id);
      identityRef.current = id;
      prekeysRef.current = pre;
      lookupRef.current = {
        signedPreKey: (i) => findSignedPreKey(pre, i)?.keyPair,
        consumeOneTimePreKey: (i) =>
          i == null ? undefined : consumeOneTimePreKey(pre, i)?.keyPair.privateKey,
      };
      setFingerprint(await fingerprintOf(id));

      const prof = await loadProfile(dek);
      myProfileRef.current = prof;
      setMyAvatarB64(prof.avatarB64 ?? '');
      setProfileName(prof.name ?? '');

      const token = await encodeBundle(currentBundle(id, pre));
      const link = `${location.origin}/#add=${token}`;
      setShareLink(link);
      makeQr(link).then(setQrDataUrl).catch(() => undefined);

      connectInbox(await inboxRoom(id.sign.publicKey));
      // Restore an existing push subscription so the DO keeps waking this device.
      if (pushSupported()) {
        currentSubscription()
          .then((sub) => {
            if (sub) {
              inboxClientRef.current?.setPush(sub);
              setNotifOn(true);
            }
          })
          .catch(() => undefined);
      }

      const cs = await loadContacts(dek);
      contactsRef.current = cs;
      for (const c of cs) {
        messagesRef.current[c.roomId] = await loadMessages(dek, c.roomId);
        await connectSend(c);
      }
      const gs = await loadGroups(dek);
      groupsRef.current = gs;
      for (const g of gs) messagesRef.current[g.id] = await loadMessages(dek, g.id);
      commitMessages();
      bump();

      const hashMatch = location.hash.match(/[#&]add=([^&]+)/);
      if (hashMatch) {
        history.replaceState(null, '', location.pathname + location.search);
        await addBundle(decodeURIComponent(hashMatch[1]));
      }
    })();

    // iOS freezes PWAs in the background and silently kills their sockets. When
    // we come back to the foreground, force every relay to reconnect so the
    // inbox re-drains — otherwise the app looks "connected" but receives nothing.
    const onForeground = () => {
      if (document.visibilityState === 'visible') {
        for (const r of relaysRef.current.values()) r.reconnect();
      }
    };
    document.addEventListener('visibilitychange', onForeground);
    window.addEventListener('pageshow', onForeground);

    return () => {
      document.removeEventListener('visibilitychange', onForeground);
      window.removeEventListener('pageshow', onForeground);
      for (const r of relaysRef.current.values()) r.close();
      relaysRef.current.clear();
      for (const t of ackTimers.current.values()) clearTimeout(t);
      ackTimers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = document.getElementById('msgs');
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeRoom, view]);

  useEffect(() => {
    setRenaming(false);
    setChatMenu(false);
  }, [activeRoom, activeGroup]);

  async function deleteContactAction(roomId: string) {
    setChatMenu(false);
    const sendRoom = sendRoomRef.current.get(roomId);
    if (sendRoom) {
      relaysRef.current.get(sendRoom)?.close();
      relaysRef.current.delete(sendRoom);
      sendRoomRef.current.delete(roomId);
    }
    contactsRef.current = contactsRef.current.filter((c) => c.roomId !== roomId);
    delete messagesRef.current[roomId];
    delete unreadRef.current[roomId];
    profileSentRef.current.delete(roomId);
    await removeContact(dek, roomId);
    if (activeRoom === roomId) {
      setActiveRoom(null);
      setView('list');
    }
    commitMessages();
    bump();
  }

  async function clearChatAction(roomId: string) {
    setChatMenu(false);
    messagesRef.current[roomId] = [];
    await clearMessages(roomId);
    commitMessages();
    bump();
  }

  /**
   * Encrypt through the ratchet and persist the advanced state BEFORE the bytes
   * go anywhere. Every outgoing path must go through here.
   *
   * ⚠️ WHY THIS IS NOT OPTIONAL: `ratchetEncrypt` mutates the sending chain in
   * place (`state.CKs = ck; state.Ns += 1`). If the app dies before the contact
   * is written — an iOS PWA freeze, a service-worker reload, a crash — the next
   * load restores the OLD chain key, and the next send derives the SAME message
   * key. The AES-GCM IV is derived from that message key rather than transmitted
   * (see messageKeyMaterial), so an identical key comes with an identical IV:
   * two different plaintexts under one (key, nonce) pair. That is a two-time pad
   * — it leaks the XOR of both plaintexts and lets an attacker recover the GHASH
   * authentication key, i.e. it breaks confidentiality AND lets them forge.
   *
   * ⚠️ DO NOT "OPTIMISE" THE ORDER. Persist-before-send is not a preference,
   * it is the only correct order, and the asymmetry is total:
   *   - persist → send:  if the send fails, the chain has still advanced. The
   *     next message uses a FRESH key and simply leaves a gap, which is exactly
   *     what the recipient's skipped-key mechanism exists to absorb. Cost: at
   *     most one message that never arrives.
   *   - send → persist:  a crash in the gap rolls the chain back to a key that
   *     has ALREADY been used on the wire. Cost: nonce reuse — the original bug,
   *     merely with a narrower window.
   * A lost message is recoverable. A reused (key, nonce) pair is not.
   */
  async function encryptAndPersist(contact: Contact, produce: () => Promise<Bytes>): Promise<Bytes> {
    const envelope = await produce();
    await saveContact(dek, contact);
    return envelope;
  }

  // ── Groups ────────────────────────────────────────────────────────
  async function sendEnvelopeTo(contact: Contact, envelope: Bytes, mid?: string) {
    let room = sendRoomRef.current.get(contact.roomId);
    if (!room) {
      await connectSend(contact);
      room = sendRoomRef.current.get(contact.roomId);
    }
    (room ? relaysRef.current.get(room) : undefined)?.send(envelope, mid);
  }

  // A hidden pairwise contact for a group member, so we can fan messages to them.
  async function ensureMemberContact(m: GroupMember): Promise<Contact | null> {
    const id = identityRef.current;
    if (!id) return null;
    const roomId = await computeRoomId(id.dh.publicKey, m.dhPub);
    const existing = contactsRef.current.find((c) => c.roomId === roomId);
    if (existing) return existing;
    const contact: Contact = {
      roomId,
      // Group rosters carry v2 bundles (with the master); fall back to the device
      // sign key if a legacy member has none (bundle-less members can't be messaged).
      peerMasterPub: m.bundle?.masterPub ?? m.signPub,
      peerEpoch: m.bundle?.epoch ?? 1,
      peerSignPub: m.signPub,
      peerDhPub: m.dhPub,
      peerFingerprint: await identityFingerprint(m.signPub, m.dhPub),
      peerName: m.name,
      bundle: m.bundle,
      hidden: true,
      ratchet: null,
      pendingHeader: null,
    };
    contactsRef.current = [...contactsRef.current, contact];
    await connectSend(contact);
    await saveContact(dek, contact);
    return contact;
  }

  async function sendGroupInvites(group: Group) {
    const id = identityRef.current;
    const pre = prekeysRef.current;
    if (!id || !pre) return;
    const me: GroupMember = {
      signPub: id.sign.publicKey,
      dhPub: id.dh.publicKey,
      bundle: currentBundle(id, pre),
      name: myProfileRef.current.name,
    };
    for (const m of group.members) {
      const contact = await ensureMemberContact(m);
      if (!contact) continue;
      const roster = [me, ...group.members.filter((x) => !eqBytes(x.dhPub, m.dhPub))];
      const invite: GroupInvite = await toInvite({ ...group, members: roster });
      try {
        await sendEnvelopeTo(contact, await encryptAndPersist(contact, () => sendGroupInvite(id, contact, invite)));
      } catch {
        /* retry when they come online */
      }
    }
  }

  async function createGroup() {
    const id = identityRef.current;
    const pre = prekeysRef.current;
    if (!id || !pre) return;
    const members: GroupMember[] = [];
    for (const c of contactsRef.current) {
      if (!groupSel.has(c.roomId) || !c.bundle) continue;
      members.push({ signPub: c.peerSignPub, dhPub: c.peerDhPub, bundle: c.bundle, name: displayName(c) });
    }
    if (members.length === 0) {
      setError('Wähle mindestens einen Kontakt.');
      return;
    }
    const group: Group = { id: randomGroupId(), name: groupNameInput.trim() || 'Gruppe', members, createdAt: Date.now() };
    groupsRef.current = [group, ...groupsRef.current];
    messagesRef.current[group.id] = [];
    await saveGroup(dek, group);
    await sendGroupInvites(group);
    setGroupSel(new Set());
    setGroupNameInput('');
    openGroup(group.id);
  }

  function openGroup(gid: string) {
    setError('');
    setActiveGroup(gid);
    setActiveRoom(null);
    activeRoomRef.current = null;
    unreadRef.current[gid] = 0;
    setView('chat');
    bump();
  }

  async function groupSend(inner: MessageContent, localMsg: ChatMessage) {
    const id = identityRef.current;
    const g = groupsRef.current.find((x) => x.id === activeGroup);
    if (!id || !g) return;
    // Per-member error handling: one unreachable member (stale identity, no
    // bundle yet, ratchet not ready) must not silently cut off everyone behind
    // them in the list — and must not swallow the local copy of a message the
    // earlier members already received.
    const failed: string[] = [];
    for (const m of g.members) {
      try {
        const contact = await ensureMemberContact(m);
        if (!contact) continue;
        await sendEnvelopeTo(
          contact,
          await encryptAndPersist(contact, () =>
            sendGroupMessage(id, contact, g.id, myProfileRef.current.name, inner),
          ),
        );
      } catch (e) {
        failed.push(`${m.name || 'Unbekannt'}: ${(e as Error).message}`);
      }
    }
    await appendMessage(g.id, localMsg);
    if (failed.length) setError(`An ${failed.length} Mitglied(er) nicht zugestellt — ${failed.join(' · ')}`);
    bump();
  }

  async function deleteGroupAction(gid: string) {
    setChatMenu(false);
    groupsRef.current = groupsRef.current.filter((g) => g.id !== gid);
    delete messagesRef.current[gid];
    delete unreadRef.current[gid];
    await removeGroup(dek, gid);
    if (activeGroup === gid) {
      setActiveGroup(null);
      setView('list');
    }
    commitMessages();
    bump();
  }

  async function applyGroupMessage(
    groupId: string,
    senderName: string | undefined,
    inner: MessageContent,
    contact: Contact,
  ) {
    const sender = senderName || contact.peerName || shortFp(contact.peerFingerprint);
    const msg: ChatMessage =
      inner.kind === 'file'
        ? { mine: false, ts: Date.now(), sender, file: { name: inner.name, mime: inner.mime, dataB64: bytesToB64(inner.data) } }
        : { mine: false, ts: Date.now(), sender, text: inner.kind === 'text' ? inner.text : '' };
    const g = groupsRef.current.find((x) => x.id === groupId);
    if (!g) {
      // Message arrived before the group invite — hold it until we join.
      const buf = pendingGroupMsgsRef.current.get(groupId) ?? [];
      buf.push(msg);
      pendingGroupMsgsRef.current.set(groupId, buf);
      return;
    }
    await appendMessage(g.id, msg);
    if (!(viewRef.current === 'chat' && activeGroupRef.current === g.id)) {
      unreadRef.current[g.id] = (unreadRef.current[g.id] ?? 0) + 1;
    }
  }

  async function applyGroupInvite(invite: GroupInvite) {
    const g = await fromInvite(invite);
    const had = messagesRef.current[g.id];
    groupsRef.current = [g, ...groupsRef.current.filter((x) => x.id !== g.id)];
    messagesRef.current[g.id] = had ?? [];
    await saveGroup(dek, g);
    for (const m of g.members) await ensureMemberContact(m);

    // Flush any messages that arrived before this invite.
    const pending = pendingGroupMsgsRef.current.get(g.id);
    if (pending?.length) {
      pendingGroupMsgsRef.current.delete(g.id);
      for (const msg of pending) await appendMessage(g.id, msg);
      if (!(viewRef.current === 'chat' && activeGroupRef.current === g.id)) {
        unreadRef.current[g.id] = (unreadRef.current[g.id] ?? 0) + pending.length;
      }
    }
    bump();
  }

  async function updateGroup(group: Group, sync: boolean) {
    groupsRef.current = groupsRef.current.map((x) => (x.id === group.id ? group : x));
    await saveGroup(dek, group);
    if (sync) await sendGroupInvites(group);
    bump();
  }

  async function addMembersToGroup(group: Group, roomIds: string[]) {
    const additions: GroupMember[] = [];
    for (const c of contactsRef.current) {
      if (!roomIds.includes(c.roomId) || !c.bundle) continue;
      if (group.members.some((m) => eqBytes(m.dhPub, c.peerDhPub))) continue;
      additions.push({ signPub: c.peerSignPub, dhPub: c.peerDhPub, bundle: c.bundle, name: displayName(c) });
    }
    if (additions.length === 0) return;
    await updateGroup({ ...group, members: [...group.members, ...additions] }, true);
  }

  async function removeMemberFromGroup(group: Group, member: GroupMember) {
    const id = identityRef.current;
    if (!id) return;
    const newGroup = { ...group, members: group.members.filter((m) => !eqBytes(m.dhPub, member.dhPub)) };
    await updateGroup(newGroup, true);
    const removed = await ensureMemberContact(member);
    if (removed) {
      try {
        await sendEnvelopeTo(removed, await encryptAndPersist(removed, () => sendGroupRemove(id, removed, group.id)));
      } catch {
        /* they'll just stop receiving; roster already dropped them */
      }
    }
  }

  async function leaveGroup(group: Group) {
    const id = identityRef.current;
    if (id) {
      for (const m of group.members) {
        const c = await ensureMemberContact(m);
        if (c) {
          try {
            await sendEnvelopeTo(c, await encryptAndPersist(c, () => sendGroupLeave(id, c, group.id)));
          } catch {
            /* best effort */
          }
        }
      }
    }
    await deleteGroupAction(group.id);
  }

  async function renameGroup(group: Group, name: string) {
    const n = name.trim();
    if (!n || n === group.name) return;
    await updateGroup({ ...group, name: n }, true);
  }

  async function applyGroupLeave(groupId: string, contact: Contact) {
    const g = groupsRef.current.find((x) => x.id === groupId);
    if (!g) return;
    const newGroup = { ...g, members: g.members.filter((m) => !eqBytes(m.dhPub, contact.peerDhPub)) };
    groupsRef.current = groupsRef.current.map((x) => (x.id === groupId ? newGroup : x));
    await saveGroup(dek, newGroup);
    bump();
  }

  function openManage(g: Group) {
    setChatMenu(false);
    setGroupRenameInput(g.name);
    setGroupSel(new Set());
    setView('gmanage');
  }

  function openChat(roomId: string) {
    setError('');
    setActiveGroup(null);
    setActiveRoom(roomId);
    activeRoomRef.current = roomId;
    unreadRef.current[roomId] = 0;
    setView('chat');
    bump();
  }

  // Edge-swipe back: drag from the left screen edge toward the middle to leave a
  // chat (iOS-style). Live-follows the finger; past a threshold it goes to the list.
  function onSwipeDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' || e.clientX > 30) return; // touch/pen, from the edge
    swipeStart.current = { x: e.clientX, y: e.clientY };
  }
  function onSwipeMove(e: React.PointerEvent) {
    const s = swipeStart.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (dx <= 0) {
      setSwipeDx(0);
      return;
    }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
      swipeStart.current = null; // vertical intent → let the chat scroll
      setSwipeDx(0);
      return;
    }
    setSwiping(true);
    setSwipeDx(Math.min(dx, window.innerWidth));
  }
  function onSwipeUp() {
    const triggered = !!swipeStart.current && swipeDx > 90;
    swipeStart.current = null;
    setSwiping(false);
    setSwipeDx(0);
    if (triggered) setView('list');
  }

  function startRename() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    setRenameInput(c?.nickname ?? '');
    setRenaming(true);
  }

  async function saveNickname() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    if (!c) return;
    const name = renameInput.trim();
    c.nickname = name || undefined;
    setRenaming(false);
    await saveContact(dek, c);
    bump();
  }

  async function onSend() {
    setError('');
    const text = msgInput.trim();
    const id = identityRef.current;
    if (!text || !id) return;
    if (activeGroup) {
      setMsgInput('');
      await groupSend({ kind: 'text', text }, { mine: true, text, ts: Date.now() });
      return;
    }
    if (!activeRoom) return;
    const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
    if (!contact) return;
    try {
      const envelope = await encryptAndPersist(contact, () => sendMessage(id, contact, text));
      let room = sendRoomRef.current.get(contact.roomId);
      if (!room) {
        await connectSend(contact);
        room = sendRoomRef.current.get(contact.roomId);
      }
      const relay = room ? relaysRef.current.get(room) : undefined;
      const mid = crypto.randomUUID();
      relay?.send(envelope, mid);
      await appendMessage(activeRoom, { mine: true, text, ts: Date.now(), mid, status: 'pending' });
      startAckTimer(mid);
      setMsgInput('');
      await saveContact(dek, contact);
      void ensureProfileSent(contact);
      bump();
    } catch (e) {
      setError('Senden fehlgeschlagen: ' + (e as Error).message);
    }
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    const id = identityRef.current;
    if (!file || !id || (!activeRoom && !activeGroup)) return;
    setError('');
    try {
      let data: Uint8Array<ArrayBuffer>;
      let mime = file.type || 'application/octet-stream';
      let name = file.name || 'datei';
      if (mime.startsWith('image/')) {
        const c = await compressImage(file, MAX_ATTACH);
        data = c.data as Uint8Array<ArrayBuffer>;
        mime = c.mime;
        name = name.replace(/\.[^.]+$/, '') + '.jpg';
      } else {
        data = new Uint8Array(await file.arrayBuffer());
      }
      if (data.length > MAX_ATTACH) {
        setError(`Zu groß (${Math.round(data.length / 1024)} KB) — inline gehen ~${Math.round(MAX_ATTACH / 1024)} KB.`);
        return;
      }
      const mid = crypto.randomUUID();
      const localMsg: ChatMessage = { mine: true, ts: Date.now(), file: { name, mime, dataB64: bytesToB64(data) }, mid };
      if (activeGroup) {
        await groupSend({ kind: 'file', name, mime, data }, localMsg);
        return;
      }
      const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
      if (!contact) return;
      await sendEnvelopeTo(contact, await encryptAndPersist(contact, () => sendFile(id, contact, name, mime, data)), mid);
      await appendMessage(contact.roomId, { ...localMsg, status: 'pending' });
      startAckTimer(mid);
      await saveContact(dek, contact);
      bump();
    } catch (err) {
      setError('Anhang fehlgeschlagen: ' + (err as Error).message);
    }
  }

  function cleanupRecording() {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    recStreamRef.current?.getTracks().forEach((t) => t.stop());
    recStreamRef.current = null;
    mediaRecorderRef.current = null;
    setRecording(false);
    setRecSeconds(0);
  }

  async function startRecording() {
    if (!activeRoom) return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      const mime = pickAudioMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recChunksRef.current = [];
      sendOnStopRef.current = true;
      rec.ondataavailable = (e) => {
        if (e.data.size) recChunksRef.current.push(e.data);
      };
      rec.onstop = () => void finishRecording(rec.mimeType || mime || 'audio/webm');
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = window.setInterval(() => {
        setRecSeconds((s) => {
          if (s + 1 >= MAX_REC_SECONDS) stopAndSend();
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      setError('Mikrofon nicht verfügbar: ' + (e as Error).message);
      cleanupRecording();
    }
  }

  function stopAndSend() {
    sendOnStopRef.current = true;
    mediaRecorderRef.current?.stop();
  }

  function cancelRecording() {
    sendOnStopRef.current = false;
    mediaRecorderRef.current?.stop();
  }

  async function finishRecording(rawMime: string) {
    const chunks = recChunksRef.current;
    const send = sendOnStopRef.current;
    cleanupRecording();
    if (!send || chunks.length === 0) return;
    const id = identityRef.current;
    if (!id || (!activeRoom && !activeGroup)) return;

    const mime = rawMime.startsWith('audio/') ? rawMime.split(';')[0] : 'audio/webm';
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    const data = new Uint8Array(await new Blob(chunks, { type: mime }).arrayBuffer());
    if (data.length > MAX_ATTACH) {
      setError(`Aufnahme zu groß (${Math.round(data.length / 1024)} KB).`);
      return;
    }
    const name = `sprachnachricht.${ext}`;
    const mid = crypto.randomUUID();
    const localMsg: ChatMessage = { mine: true, ts: Date.now(), file: { name, mime, dataB64: bytesToB64(data) }, mid };
    try {
      if (activeGroup) {
        await groupSend({ kind: 'file', name, mime, data }, localMsg);
        return;
      }
      const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
      if (!contact) return;
      await sendEnvelopeTo(contact, await encryptAndPersist(contact, () => sendFile(id, contact, name, mime, data)), mid);
      await appendMessage(contact.roomId, { ...localMsg, status: 'pending' });
      startAckTimer(mid);
      await saveContact(dek, contact);
      bump();
    } catch (e) {
      setError('Senden fehlgeschlagen: ' + (e as Error).message);
    }
  }

  async function ensureProfileSent(contact: Contact) {
    const id = identityRef.current;
    const p = myProfileRef.current;
    if (!id || !contact.ratchet || profileSentRef.current.has(contact.roomId)) return;
    if (!p.name && !p.avatarB64) return;
    try {
      const envelope = await encryptAndPersist(contact, () =>
        sendProfile(id, contact, p.name, p.avatarB64 ? b64ToBytes(p.avatarB64) : undefined),
      );
      let room = sendRoomRef.current.get(contact.roomId);
      if (!room) {
        await connectSend(contact);
        room = sendRoomRef.current.get(contact.roomId);
      }
      (room ? relaysRef.current.get(room) : undefined)?.send(envelope);
      profileSentRef.current.add(contact.roomId);
      await saveContact(dek, contact);
    } catch {
      /* retry next session */
    }
  }

  async function broadcastProfile() {
    profileSentRef.current.clear();
    for (const c of contactsRef.current) if (c.ratchet) await ensureProfileSent(c);
  }

  async function togglePush() {
    if (notifBusy) return;
    setNotifBusy(true);
    setError('');
    try {
      if (notifOn) {
        const endpoint = await disablePush();
        if (endpoint) inboxClientRef.current?.unsubscribePush(endpoint);
        setNotifOn(false);
      } else {
        const sub = await enablePush(); // throws a user-facing reason on failure
        inboxClientRef.current?.setPush(sub);
        setNotifOn(true);
      }
    } catch (e) {
      setError('Benachrichtigungen fehlgeschlagen: ' + (e as Error).message);
    } finally {
      setNotifBusy(false);
    }
  }

  function onPickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setError('');
    setCropFile(file); // open the cropper; saving happens in onCropDone
  }

  async function onCropDone(bytes: Uint8Array) {
    try {
      const b64 = bytesToB64(bytes as Uint8Array<ArrayBuffer>);
      myProfileRef.current = { ...myProfileRef.current, avatarB64: b64 };
      setMyAvatarB64(b64);
      setCropFile(null);
      await saveProfile(dek, myProfileRef.current);
      await broadcastProfile();
      bump();
    } catch (err) {
      setError('Avatar fehlgeschlagen: ' + (err as Error).message);
      setCropFile(null);
    }
  }

  async function saveProfileMeta() {
    myProfileRef.current = { ...myProfileRef.current, name: profileName.trim() || undefined };
    await saveProfile(dek, myProfileRef.current);
    await broadcastProfile();
    setView('list');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the box is selectable anyway */
    }
  }

  function openContact() {
    setChatMenu(false);
    setRenaming(false);
    setView('contact');
  }

  async function openVerify() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    const id = identityRef.current;
    setView('verify');
    if (!c || !id) return;
    const sn = await masterSafetyNumber(id.master.publicKey, c.peerMasterPub);
    setSafetyNumber(sn);
    makeQr('SCYTALE-SN:' + sn.replace(/ /g, '')).then(setSafetyQr).catch(() => undefined);
  }

  async function markVerified() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    if (!c) return;
    c.verified = true;
    await saveContact(dek, c);
    bump();
  }

  /** Acknowledge the retired-identity notice. Clears only the *notice*, never
   *  the denylist itself — the rejection stays permanent, the banner does not. */
  async function dismissRetiredNotice() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    if (!c) return;
    c.retiredAttempt = undefined;
    await saveContact(dek, c);
    bump();
  }

  // Full-screen image viewer (avatars, later chat images). Tap anywhere closes.
  const lightbox = zoomImg ? (
    <div className="lightbox" onClick={() => setZoomImg(null)} role="dialog" aria-label="Bild">
      <img src={zoomImg} alt="" />
      <button className="lightbox-close" onClick={() => setZoomImg(null)} aria-label="Schließen">
        ×
      </button>
    </div>
  ) : null;

  const contacts = contactsRef.current;
  const visibleContacts = contacts.filter((c) => !c.hidden);
  const groups = groupsRef.current;
  const activeContact = contacts.find((c) => c.roomId === activeRoom) ?? null;
  const activeGroupData = groups.find((g) => g.id === activeGroup) ?? null;
  const st = (roomId: string) => statuses[roomId] ?? 'closed';
  const lastPreview = (m?: ChatMessage) =>
    m ? m.text || (m.file ? '📎 Anhang' : '') : '';

  const composerEl = recording ? (
    <div className="composer recording">
      <button className="attach-btn danger" onClick={cancelRecording} aria-label="Abbrechen">
        <IconTrash />
      </button>
      <div className="rec-indicator">
        <span className="rec-dot" />
        Aufnahme… {fmtRec(recSeconds)}
      </div>
      <button className="send-btn" onClick={stopAndSend} aria-label="Senden">
        <IconSend />
      </button>
    </div>
  ) : (
    <div className="composer">
      <input ref={fileInputRef} type="file" hidden onChange={(e) => void onPickFile(e)} />
      <button className="attach-btn" title="Anhang" onClick={() => fileInputRef.current?.click()}>
        <IconAttach />
      </button>
      <div className="composer-pill">
        <input
          value={msgInput}
          placeholder="Verschlüsselte Nachricht…"
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void onSend()}
        />
      </div>
      {msgInput.trim() ? (
        <button className="send-btn" onClick={() => void onSend()} aria-label="Senden">
          <IconSend />
        </button>
      ) : (
        <button className="send-btn mic" onClick={() => void startRecording()} aria-label="Sprachnachricht">
          <IconMic />
        </button>
      )}
    </div>
  );

  // ── Contact list ──────────────────────────────────────────────────
  if (view === 'list') {
    // WhatsApp-style: groups and contacts in one list, most recent activity on
    // top. Chats without messages (ts 0) sink to the bottom until they get one.
    const convItems = [
      ...groups.map((g) => {
        const last = messagesRef.current[g.id]?.at(-1);
        return { kind: 'group' as const, group: g, last, unread: unreadRef.current[g.id] ?? 0, ts: last?.ts ?? 0 };
      }),
      ...visibleContacts.map((c) => {
        const last = messagesRef.current[c.roomId]?.at(-1);
        return { kind: 'contact' as const, contact: c, last, unread: unreadRef.current[c.roomId] ?? 0, ts: last?.ts ?? 0 };
      }),
    ].sort((a, b) => b.ts - a.ts);
    return (
      <>
        <div className="list">
          <div className="list-top">
            <div className="list-head">
              <button className="list-brand" onClick={() => setView('profile')} title="Profil">
                {myAvatarB64 ? (
                  <img className="brand-avatar" src={avatarSrc(myAvatarB64)} alt="Profil" />
                ) : (
                  <img src="/scytale-icon.svg" alt="" />
                )}
                <div>
                  <div className="t">
                    SCYTALE <span className="ver">v{__APP_VERSION__}</span>
                  </div>
                  <div className="fp">{shortFp(fingerprint)}</div>
                </div>
              </button>
              <div className="icon-btns">
                <button
                  className="icon-btn"
                  title="Neue Gruppe"
                  onClick={() => {
                    setError('');
                    setGroupSel(new Set());
                    setGroupNameInput('');
                    setView('newgroup');
                  }}
                >
                  <IconGroup />
                </button>
                <button className="icon-btn" title="Teilen / Kontakt" onClick={() => { setError(''); setView('add'); }}>
                  <IconPlus />
                </button>
                <button className="icon-btn" title="Sperren" onClick={onLock}>
                  <IconLock size={15} />
                </button>
              </div>
            </div>
            <div className="search-bar">
              <span className="g">
                <IconSearch />
              </span>
              Suchen
            </div>
          </div>

          <div className="enc-line">
            <IconShield size={13} />
            Alle Nachrichten Ende-zu-Ende verschlüsselt
          </div>

          <div className="conv-scroll">
            {groups.length === 0 && visibleContacts.length === 0 ? (
              <div className="list-empty">
                Noch keine Chats.<br />Oben: <b>+</b> für Kontakte, das Gruppen-Symbol für eine Gruppe.
              </div>
            ) : (
              <>
                {convItems.map((item) =>
                  item.kind === 'group' ? (
                    <button key={item.group.id} className="conv-row" onClick={() => openGroup(item.group.id)}>
                      <div className="avatar-wrap">
                        <div className="avatar group">
                          <IconGroup size={22} />
                        </div>
                      </div>
                      <div className="conv-main">
                        <div className="conv-line1">
                          <span className="conv-name">{item.group.name}</span>
                          <span className="conv-ts">{fmtListTs(item.last?.ts)}</span>
                        </div>
                        <div className="conv-line2">
                          <span className="conv-last">
                            {item.last
                              ? (item.last.mine ? '' : item.last.sender ? `${item.last.sender}: ` : '') +
                                lastPreview(item.last)
                              : `${item.group.members.length + 1} Mitglieder`}
                          </span>
                          {item.unread > 0 && <span className="unread">{item.unread}</span>}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button key={item.contact.roomId} className="conv-row" onClick={() => openChat(item.contact.roomId)}>
                      <div className="avatar-wrap">
                        {item.contact.peerAvatarB64 ? (
                          <img className="avatar-img" src={avatarSrc(item.contact.peerAvatarB64)} alt="" />
                        ) : (
                          <div className="avatar">
                            <Identicon seed={item.contact.roomId} />
                          </div>
                        )}
                        <span className={`sdot ${st(item.contact.roomId)}`} />
                      </div>
                      <div className="conv-main">
                        <div className="conv-line1">
                          <span className="conv-name">{displayName(item.contact)}</span>
                          {item.contact.verified && (
                            <span className="verified-badge">
                              <IconShield size={14} filled />
                            </span>
                          )}
                          <span className="conv-ts">{fmtListTs(item.last?.ts)}</span>
                        </div>
                        <div className="conv-line2">
                          <span className="conv-last">
                            {item.last ? lastPreview(item.last) : item.contact.ratchet ? 'Verbunden' : 'Neu — sag Hallo'}
                          </span>
                          {item.unread > 0 && <span className="unread">{item.unread}</span>}
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────
  if (view === 'chat' && activeContact) {
    const msgs = messages[activeContact.roomId] ?? [];
    const verified = !!activeContact.verified;
    return (
      <div
        className="chat"
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeUp}
        onPointerCancel={onSwipeUp}
        style={{
          transform: swipeDx ? `translateX(${swipeDx}px)` : undefined,
          transition: swiping ? 'none' : 'transform 0.22s ease',
        }}
      >
        <div className="chat-top">
          <button className="chat-back" onClick={() => setView('list')}>
            <IconBack />
          </button>
          <button className="chat-avatar-btn" onClick={openContact} aria-label="Kontaktinfo">
            {activeContact.peerAvatarB64 ? (
              <img className="avatar-img sm" src={avatarSrc(activeContact.peerAvatarB64)} alt="" />
            ) : (
              <div className="avatar sm">
                <Identicon seed={activeContact.roomId} />
              </div>
            )}
          </button>
          {renaming ? (
            <div className="rename-row">
              <input
                autoFocus
                value={renameInput}
                placeholder="Name für diesen Kontakt…"
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void saveNickname()}
              />
              <button className="btn btn-primary" onClick={() => void saveNickname()}>
                ✓
              </button>
            </div>
          ) : (
            <div className="chat-peer">
              <button className="n" onClick={startRename} title="Umbenennen">
                {displayName(activeContact)} <span className="pencil">✎</span>
              </button>
              <button
                className="verify-line"
                style={{ color: verified ? 'var(--verified)' : 'var(--muted)' }}
                onClick={() => void openVerify()}
              >
                <IconLock size={10} />
                {verified ? 'verifiziert' : 'nicht verifiziert · antippen'}
              </button>
            </div>
          )}
          <span className={`sdot ${st(activeContact.roomId)}`} style={{ position: 'static', border: 0, width: 9, height: 9 }} />
          <button className="chat-menu-btn" onClick={() => setChatMenu((v) => !v)} aria-label="Menü">
            <IconDots />
          </button>
          {chatMenu && (
            <div className="chat-menu">
              <button
                onClick={() => {
                  setChatMenu(false);
                  if (confirm('Chatverlauf wirklich löschen?')) void clearChatAction(activeContact.roomId);
                }}
              >
                Chatverlauf löschen
              </button>
              <button
                className="danger"
                onClick={() => {
                  setChatMenu(false);
                  if (confirm('Kontakt und Chat wirklich löschen?')) void deleteContactAction(activeContact.roomId);
                }}
              >
                Kontakt löschen
              </button>
            </div>
          )}
        </div>

        <div id="msgs" className="msgs">
          <div className="enc-pill">
            <span className="g">
              <IconLock size={10} />
            </span>
            Verschlüsselt · nur ihr beide lest mit
          </div>
          {msgs.map((m, i) => (
            <div
              key={`${m.ts}-${i}`}
              className={`bubble ${m.mine ? 'mine' : 'theirs'}${m.file?.mime.startsWith('image/') ? ' has-file' : ''}`}
            >
              {m.file ? (
                m.file.mime.startsWith('image/') ? (
                  <img
                    className="bubble-img"
                    src={`data:${m.file.mime};base64,${m.file.dataB64}`}
                    alt={m.file.name}
                    onClick={() => setZoomImg(`data:${m.file!.mime};base64,${m.file!.dataB64}`)}
                  />
                ) : m.file.mime.startsWith('audio/') ? (
                  <AudioPlayer dataB64={m.file.dataB64} mime={m.file.mime} />
                ) : (
                  <button className="file-chip" onClick={() => downloadFile(m.file!)}>
                    <IconAttach size={16} />
                    <span className="fn">{m.file.name}</span>
                  </button>
                )
              ) : (
                m.text
              )}
              <span className="meta">
                {fmtClock(m.ts)}
                {m.mine &&
                  (m.status === 'failed' ? (
                    <span className="msg-failed" title="Nicht zugestellt">
                      ⚠ nicht zugestellt
                    </span>
                  ) : (
                    <span className="msg-check" style={{ opacity: m.status === 'pending' ? 0.35 : 1 }}>
                      <IconDoubleCheck size={13} />
                    </span>
                  ))}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="err-note">{error}</div>}

        {composerEl}
        {lightbox}
      </div>
    );
  }

  // ── Group chat ────────────────────────────────────────────────────
  if (view === 'chat' && activeGroupData) {
    const msgs = messages[activeGroupData.id] ?? [];
    return (
      <div
        className="chat"
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeUp}
        onPointerCancel={onSwipeUp}
        style={{
          transform: swipeDx ? `translateX(${swipeDx}px)` : undefined,
          transition: swiping ? 'none' : 'transform 0.22s ease',
        }}
      >
        <div className="chat-top">
          <button className="chat-back" onClick={() => { setActiveGroup(null); setView('list'); }}>
            <IconBack />
          </button>
          <div className="avatar sm group">
            <IconGroup size={18} />
          </div>
          <div className="chat-peer">
            <div className="n">{activeGroupData.name}</div>
            <span className="peer-fp">{activeGroupData.members.length + 1} Mitglieder</span>
          </div>
          <button className="chat-menu-btn" onClick={() => setChatMenu((v) => !v)} aria-label="Menü">
            <IconDots />
          </button>
          {chatMenu && (
            <div className="chat-menu">
              <button onClick={() => openManage(activeGroupData)}>Gruppe verwalten</button>
              <button
                onClick={() => {
                  setChatMenu(false);
                  if (confirm('Chatverlauf wirklich löschen?')) void clearChatAction(activeGroupData.id);
                }}
              >
                Chatverlauf löschen
              </button>
              <button
                className="danger"
                onClick={() => {
                  setChatMenu(false);
                  if (confirm('Gruppe wirklich verlassen?')) void leaveGroup(activeGroupData);
                }}
              >
                Gruppe verlassen
              </button>
            </div>
          )}
        </div>
        <div id="msgs" className="msgs">
          <div className="enc-pill">
            <span className="g">
              <IconLock size={10} />
            </span>
            Verschlüsselt · Ende-zu-Ende
          </div>
          {msgs.map((m, i) => (
            <div
              key={`${m.ts}-${i}`}
              className={`bubble ${m.mine ? 'mine' : 'theirs'}${m.file?.mime.startsWith('image/') ? ' has-file' : ''}`}
            >
              {!m.mine && m.sender && <div className="bubble-sender">{m.sender}</div>}
              {m.file ? (
                m.file.mime.startsWith('image/') ? (
                  <img className="bubble-img" src={`data:${m.file.mime};base64,${m.file.dataB64}`} alt={m.file.name} />
                ) : m.file.mime.startsWith('audio/') ? (
                  <AudioPlayer dataB64={m.file.dataB64} mime={m.file.mime} />
                ) : (
                  <button className="file-chip" onClick={() => downloadFile(m.file!)}>
                    <IconAttach size={16} />
                    <span className="fn">{m.file.name}</span>
                  </button>
                )
              ) : (
                m.text
              )}
              <span className="meta">
                {fmtClock(m.ts)}
                {m.mine &&
                  (m.status === 'failed' ? (
                    <span className="msg-failed" title="Nicht zugestellt">
                      ⚠ nicht zugestellt
                    </span>
                  ) : (
                    <span className="msg-check" style={{ opacity: m.status === 'pending' ? 0.35 : 1 }}>
                      <IconDoubleCheck size={13} />
                    </span>
                  ))}
              </span>
            </div>
          ))}
        </div>
        {error && <div className="err-note">{error}</div>}
        {composerEl}
      </div>
    );
  }

  // ── Share / Add ───────────────────────────────────────────────────
  if (view === 'add') {
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('list')}>
            <IconBack />
          </button>
          <div className="h">Verbinden</div>
        </div>
        <div className="subbody">
          <div className="sect-lbl">Mich teilen</div>
          <div className="card share-card">
            <button
              className="qr-card tappable"
              onClick={() => qrDataUrl && setQrFull(true)}
              aria-label="QR-Code groß anzeigen"
            >
              {qrDataUrl ? <img src={qrDataUrl} alt="QR-Code deines Kontakt-Links" /> : <span className="ph">QR…</span>}
            </button>
            <p className="share-hint">
              Antippen für Vollbild zum Scannen — oder Link teilen.
              <br />
              Ein Tap fügt dich hinzu.
            </p>
            <div className="link-box">{shareLink}</div>
            <button className="btn btn-primary" onClick={() => void copyLink()}>
              {copied ? 'Kopiert ✓' : 'Link kopieren'}
            </button>
          </div>

          <div className="divider">
            <div className="l" />
            <span>ODER</span>
            <div className="l" />
          </div>

          <div className="sect-lbl">Kontakt hinzufügen</div>
          <div className="card pad16">
            <button className="btn btn-primary scan-btn" onClick={() => setScanning(true)}>
              <IconCamera /> QR-Code scannen
            </button>
            <div className="or-tiny">oder Link / Token einfügen</div>
            <textarea
              className="paste-box"
              placeholder="scy://add?… — Link oder Bundle-Token einfügen"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
            />
            <button className="btn btn-outline" onClick={() => void addBundle(addInput)}>
              Hinzufügen
            </button>
          </div>

          {error && <div className="err-note">{error}</div>}

          {scanning && (
            <QrScanner
              onResult={(text) => {
                setScanning(false);
                void addBundle(text);
              }}
              onClose={() => setScanning(false)}
            />
          )}

          {qrFull && qrDataUrl && (
            <div className="qr-full" onClick={() => setQrFull(false)} role="dialog" aria-label="QR-Code Vollbild">
              <img src={qrDataUrl} alt="QR-Code deines Kontakt-Links" />
              <p>Halte den Code vor die Kamera des Kontakts · tippen zum Schließen</p>
            </div>
          )}

          <div className="info-note">
            <span className="g">
              <IconInfo />
            </span>
            <p>
              Enthält <b>nur öffentliche Schlüssel</b>. Über jeden Kanal teilbar — gegen MITM danach die Safety
              Number vergleichen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Verify / Safety Number ────────────────────────────────────────
  if (view === 'verify' && activeContact) {
    const verified = !!activeContact.verified;
    const groups = safetyNumber ? safetyNumber.split(' ') : [];
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('chat')}>
            <IconBack />
          </button>
          <div className="h">Safety Number</div>
        </div>
        <div className="verify-body">
          <div className="qr-card sm">
            {safetyQr ? <img src={safetyQr} alt="Safety-Number-QR" /> : <span className="ph">…</span>}
          </div>
          <p className="verify-expl">
            Vergleicht diese Zahl mit <b>{displayName(activeContact)}</b> — persönlich oder über einen anderen Kanal.
          </p>
          <div className="sn-grid">
            {groups.map((g, i) => (
              <span key={i}>{g}</span>
            ))}
          </div>
          {verified ? (
            <div className="verified-banner">
              <IconShield size={17} />
              Als verifiziert markiert
            </div>
          ) : (
            <button className="btn btn-primary" style={{ height: 50 }} onClick={() => void markVerified()}>
              Als verifiziert markieren
            </button>
          )}
          <p className="verify-foot">Stimmen die Zahlen überein, ist die Leitung frei von Man-in-the-Middle.</p>
        </div>
      </div>
    );
  }

  // ── Contact detail ────────────────────────────────────────────────
  if (view === 'contact' && activeContact) {
    const c = activeContact;
    const verified = !!c.verified;
    const hasAvatar = !!c.peerAvatarB64;
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('chat')}>
            <IconBack />
          </button>
          <div className="h">Kontakt</div>
        </div>
        <div className="contact-body">
          <button
            className="contact-avatar"
            onClick={() => hasAvatar && setZoomImg(avatarSrc(c.peerAvatarB64!))}
            aria-label={hasAvatar ? 'Profilbild groß ansehen' : undefined}
          >
            {hasAvatar ? (
              <img src={avatarSrc(c.peerAvatarB64!)} alt="Profilbild" />
            ) : (
              <div className="contact-identicon">
                <Identicon seed={c.roomId} />
              </div>
            )}
          </button>

          <div className="contact-name">{displayName(c)}</div>
          <button
            className="contact-verify-chip"
            style={{ color: verified ? 'var(--verified)' : 'var(--muted)' }}
            onClick={() => void openVerify()}
          >
            <IconLock size={12} />
            {verified ? 'verifiziert' : 'nicht verifiziert · zum Prüfen antippen'}
          </button>

          {c.retiredAttempt && (
            <div className="contact-warn">
              <div className="cw-text">
                <b>Abgelehnter Anmeldeversuch</b>
                <span>
                  Es kamen Nachrichten unter einer früheren, bereits ersetzten Identität dieses Kontakts an. Sie
                  wurden verworfen. Das ist normal, wenn ein altes Gerät noch läuft — kann aber auch bedeuten, dass
                  jemand einen alten Schlüssel besitzt.
                </span>
              </div>
              <button className="btn btn-ghost sm" onClick={() => void dismissRetiredNotice()}>
                Verstanden
              </button>
            </div>
          )}

          <div className="contact-fields">
            {renaming ? (
              <div className="contact-field">
                <span className="cf-label">Dein Name für den Kontakt</span>
                <div className="rename-row">
                  <input
                    autoFocus
                    value={renameInput}
                    placeholder="Nickname…"
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void saveNickname()}
                  />
                  <button className="btn btn-primary" onClick={() => void saveNickname()}>
                    ✓
                  </button>
                </div>
              </div>
            ) : (
              <button className="contact-field tappable" onClick={startRename}>
                <span className="cf-label">
                  Dein Name für den Kontakt <span className="pencil">✎</span>
                </span>
                <span className="cf-value">{c.nickname?.trim() || <em>nicht gesetzt</em>}</span>
              </button>
            )}

            <div className="contact-field">
              <span className="cf-label">Name, den die Person selbst gesetzt hat</span>
              <span className="cf-value">{c.peerName?.trim() || <em>keiner</em>}</span>
            </div>

            <div className="contact-field">
              <span className="cf-label">Sicherheitsnummer (Fingerprint)</span>
              <span className="cf-value mono">{c.peerFingerprint}</span>
            </div>
          </div>

          <div className="contact-actions">
            <button
              className="btn btn-ghost"
              onClick={() => confirm('Chatverlauf wirklich löschen?') && void clearChatAction(c.roomId)}
            >
              Chatverlauf löschen
            </button>
            <button
              className="btn btn-danger"
              onClick={() => confirm('Kontakt und Chat wirklich löschen?') && void deleteContactAction(c.roomId)}
            >
              Kontakt löschen
            </button>
          </div>
        </div>
        {lightbox}
      </div>
    );
  }

  // ── Profile ───────────────────────────────────────────────────────
  if (view === 'profile') {
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('list')}>
            <IconBack />
          </button>
          <div className="h">Profil</div>
        </div>
        <div className="verify-body">
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
          {cropFile && (
            <CropModal file={cropFile} onCancel={() => setCropFile(null)} onDone={(b) => void onCropDone(b)} />
          )}
          <button className="profile-avatar" onClick={() => avatarInputRef.current?.click()}>
            {myAvatarB64 ? <img src={avatarSrc(myAvatarB64)} alt="Dein Avatar" /> : <span className="ph">＋</span>}
            <span className="edit-badge">
              <IconCamera size={14} />
            </span>
          </button>
          <p className="share-hint">Antippen, um dein Bild zu ändern.</p>
          <div style={{ textAlign: 'left', marginTop: 6 }}>
            <div className="field-lbl">Anzeigename</div>
            <input
              className="name-input"
              value={profileName}
              placeholder="Wie du angezeigt wirst"
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => void saveProfileMeta()}>
            Speichern &amp; teilen
          </button>

          {pushSupported() && (
            <button
              className={`notif-row${notifOn ? ' on' : ''}`}
              onClick={() => void togglePush()}
              disabled={notifBusy}
            >
              <div className="notif-txt">
                <span className="notif-title">Benachrichtigungen</span>
                <span className="notif-sub">
                  {notifOn ? 'aktiv — du wirst bei neuen Nachrichten geweckt' : 'bei neuen Nachrichten wecken lassen'}
                </span>
              </div>
              <span className={`switch${notifOn ? ' on' : ''}`}>
                <span className="knob" />
              </span>
            </button>
          )}

          {error && <div className="err-note">{error}</div>}

          <div className="info-note" style={{ textAlign: 'left' }}>
            <span className="g">
              <IconInfo />
            </span>
            <p>
              Bild und Name werden <b>Ende-zu-Ende verschlüsselt</b> an deine Kontakte geschickt — nicht über
              den öffentlichen Code.
            </p>
          </div>
          {notifOn && (
            <div className="info-note" style={{ textAlign: 'left' }}>
              <span className="g">
                <IconLock size={13} />
              </span>
              <p>
                Push-Nachrichten sind <b>inhaltslos</b> — sie enthalten nur ein Wecksignal, keinen Absender und
                keinen Text. Erst beim Öffnen der App wird entschlüsselt.
              </p>
            </div>
          )}

          <div className="sect-lbl" style={{ marginTop: 22 }}>Backup &amp; Wiederherstellung</div>
          <div className="backup-actions">
            <button className="btn btn-ghost" onClick={() => setBackupMode('export')}>
              Backup exportieren
            </button>
            <button className="btn btn-ghost" onClick={() => setBackupMode('import')}>
              Wiederherstellen
            </button>
          </div>
          <div className="info-note" style={{ textAlign: 'left' }}>
            <span className="g">
              <IconInfo />
            </span>
            <p>
              Verschlüsseltes Backup deiner Identität als Datei — für Gerätewechsel/Recovery. Braucht eine
              <b> eigene Passphrase</b> und fragt vorher die Tresor-Passphrase erneut ab.
            </p>
          </div>

          {backupMode && <BackupModal mode={backupMode} dek={dek} onClose={() => setBackupMode(null)} />}
        </div>
      </div>
    );
  }

  // ── New group ─────────────────────────────────────────────────────
  if (view === 'newgroup') {
    const selectable = visibleContacts.filter((c) => c.bundle);
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('list')}>
            <IconBack />
          </button>
          <div className="h">Neue Gruppe</div>
        </div>
        <div className="subbody">
          <div className="field-lbl">Gruppenname</div>
          <input
            className="name-input"
            value={groupNameInput}
            placeholder="z. B. Redaktion"
            onChange={(e) => setGroupNameInput(e.target.value)}
          />
          <div className="sect-lbl" style={{ marginTop: 18 }}>
            Mitglieder wählen
          </div>
          {selectable.length === 0 ? (
            <p className="share-hint" style={{ textAlign: 'left' }}>
              Du brauchst zuerst Kontakte (über deren Code), um sie in eine Gruppe zu holen.
            </p>
          ) : (
            <div className="card pad16">
              {selectable.map((c) => {
                const on = groupSel.has(c.roomId);
                return (
                  <button
                    key={c.roomId}
                    className={`member-row${on ? ' on' : ''}`}
                    onClick={() => {
                      const s = new Set(groupSel);
                      if (on) s.delete(c.roomId);
                      else s.add(c.roomId);
                      setGroupSel(s);
                    }}
                  >
                    {c.peerAvatarB64 ? (
                      <img className="avatar-img sm" src={avatarSrc(c.peerAvatarB64)} alt="" />
                    ) : (
                      <div className="avatar sm">
                        <Identicon seed={c.roomId} />
                      </div>
                    )}
                    <span className="conv-name">{displayName(c)}</span>
                    <span className={`check${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
          {error && <div className="err-note">{error}</div>}
          <button
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            disabled={groupSel.size === 0}
            onClick={() => void createGroup()}
          >
            Gruppe erstellen ({groupSel.size})
          </button>
        </div>
      </div>
    );
  }

  // ── Manage group ──────────────────────────────────────────────────
  if (view === 'gmanage' && activeGroupData) {
    const g = activeGroupData;
    const addable = visibleContacts.filter(
      (c) => c.bundle && !g.members.some((m) => eqBytes(m.dhPub, c.peerDhPub)),
    );
    return (
      <div className="subview">
        <div className="subhead">
          <button className="back" onClick={() => setView('chat')}>
            <IconBack />
          </button>
          <div className="h">Gruppe verwalten</div>
        </div>
        <div className="subbody">
          <div className="field-lbl">Gruppenname</div>
          <div className="rename-row" style={{ marginBottom: 18 }}>
            <input className="name-input" value={groupRenameInput} onChange={(e) => setGroupRenameInput(e.target.value)} />
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => void renameGroup(g, groupRenameInput)}>
              ✓
            </button>
          </div>

          <div className="sect-lbl">Mitglieder ({g.members.length + 1})</div>
          <div className="card pad16">
            <div className="member-row">
              {myAvatarB64 ? (
                <img className="avatar-img sm" src={avatarSrc(myAvatarB64)} alt="" />
              ) : (
                <div className="avatar sm">
                  <Identicon seed={'me-' + fingerprint} />
                </div>
              )}
              <span className="conv-name">Du</span>
            </div>
            {g.members.map((m, i) => (
              <div key={i} className="member-row">
                <div className="avatar sm">
                  <Identicon seed={hexOf(m.dhPub)} />
                </div>
                <span className="conv-name">{m.name || '…'}</span>
                <button
                  className="icon-mini danger"
                  aria-label="Entfernen"
                  onClick={() => {
                    if (confirm(`${m.name || 'Mitglied'} entfernen?`)) void removeMemberFromGroup(g, m);
                  }}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ))}
          </div>

          {addable.length > 0 && (
            <>
              <div className="sect-lbl" style={{ marginTop: 18 }}>
                Hinzufügen
              </div>
              <div className="card pad16">
                {addable.map((c) => {
                  const on = groupSel.has(c.roomId);
                  return (
                    <button
                      key={c.roomId}
                      className={`member-row${on ? ' on' : ''}`}
                      onClick={() => {
                        const s = new Set(groupSel);
                        if (on) s.delete(c.roomId);
                        else s.add(c.roomId);
                        setGroupSel(s);
                      }}
                    >
                      {c.peerAvatarB64 ? (
                        <img className="avatar-img sm" src={avatarSrc(c.peerAvatarB64)} alt="" />
                      ) : (
                        <div className="avatar sm">
                          <Identicon seed={c.roomId} />
                        </div>
                      )}
                      <span className="conv-name">{displayName(c)}</span>
                      <span className={`check${on ? ' on' : ''}`}>{on ? '✓' : ''}</span>
                    </button>
                  );
                })}
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  disabled={groupSel.size === 0}
                  onClick={async () => {
                    await addMembersToGroup(g, [...groupSel]);
                    setGroupSel(new Set());
                  }}
                >
                  {groupSel.size} hinzufügen
                </button>
              </div>
            </>
          )}

          {error && <div className="err-note">{error}</div>}
          <button
            className="btn btn-outline danger-btn"
            style={{ marginTop: 18 }}
            onClick={() => {
              if (confirm('Gruppe wirklich verlassen?')) void leaveGroup(g);
            }}
          >
            Gruppe verlassen
          </button>
        </div>
      </div>
    );
  }

  return null;
}
