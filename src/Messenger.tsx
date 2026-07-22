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
  SEALED_LINK_OFFER,
  SEALED_LINK_GRANT,
  masterSafetyNumber,
  identityFingerprint,
  isPrimaryDevice,
  verifyDeviceCert,
  bytesEqual,
  asMasterPub,
  decodeLinkGrant,
  sign,
  type Bytes,
  type IdentityKeys,
  type SasResult,
} from './crypto';
import {
  startLinkOnN,
  offerReceivedOnN,
  completeLinkOnN,
  beginLinkOnP,
  completeLinkOnP,
  type LinkSession,
} from './lib/linkflow';
import { loadOrCreateOwnDeviceList } from './lib/devices';
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
  resolveContactByConv,
  hasSession,
  acceptMasterChange,
  acceptRotation,
  reconnectContact,
  migrateContactRoomId,
  applyDeviceListUpdate,
  masterKeyB64,
  sendDeviceList,
  MasterChangedError,
  RetiredIdentityError,
  RevokedDeviceError,
  inboxRoom,
  computeRoomId,
  computeMasterRoomId,
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
import { moveContactStorage } from './lib/rekey';
import { loadRetiredMasters, addRetiredMaster } from './lib/denylist';
import { loadProfile, saveProfile, type MyProfile } from './lib/profile';
import {
  loadStickers,
  saveStickers,
  isSticker,
  STICKER_FILENAME,
  MAX_STICKERS,
  type Sticker,
} from './lib/stickers';
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
  IconSticker,
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
  // Serializes ALL inbox processing through one promise chain (see enqueueInbox).
  const inboxQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recStreamRef = useRef<MediaStream | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const sendOnStopRef = useRef(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const myProfileRef = useRef<MyProfile>({});
  const profileSentRef = useRef<Set<string>>(new Set());
  const retiredMastersRef = useRef<Set<string>>(new Set()); // global master denylist, loaded at boot
  const groupsRef = useRef<Group[]>([]);
  // Buffered group messages carry the AUTHENTICATED sender key so the membership
  // check can run on flush (once we have the roster from the invite).
  const pendingGroupMsgsRef = useRef<Map<string, { msg: ChatMessage; senderDhPub: Bytes }[]>>(new Map());
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
  const [shared, setShared] = useState(false); // feedback for the share button's copy fallback
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
  const [stickerFile, setStickerFile] = useState<File | null>(null); // image becoming a sticker
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [stickerPanel, setStickerPanel] = useState(false);
  const [backupMode, setBackupMode] = useState<'export' | 'import' | null>(null);
  // ── Device linking ────────────────────────────────────────────────
  // 'menu'  : choose join-as-new vs add-a-device
  // 'qr'    : N shows its QR, waits for the offer
  // 'scan'  : P scans N's QR
  // 'sas'   : both compare the 7 emoji
  // 'done'  : linked
  const [linkView, setLinkView] = useState<'menu' | 'qr' | 'scan' | 'sas' | 'done' | null>(null);
  const [linkQr, setLinkQr] = useState(''); // N's QR image
  const [linkSas, setLinkSas] = useState<SasResult | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const linkSessionRef = useRef<LinkSession | null>(null);
  // N holds a grant that arrived before the user confirmed the emoji. It is
  // installed only after confirmation — an unconfirmed grant is never applied.
  const linkPendingGrantRef = useRef<Bytes | null>(null);
  const linkConfirmedRef = useRef(false); // N confirmed the SAS locally
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

  // Serialize every inbox task (each queued/live message, and the boot migration
  // seeded as the chain's head) through ONE promise chain. Two decrypts on the
  // same ratchet can therefore never interleave at an await: a relay that replays
  // one ciphertext under two ack-ids no longer has both executions clone the same
  // uncommitted ratchet state and decrypt it twice — the second runs on the
  // committed state and is rejected as an ordinary replay. Also strictly orders
  // every message after the boot migration, closing the onInbox-vs-migration race.
  // A task's rejection is isolated so it can't break the chain for the next task.
  function enqueueInbox<T>(task: () => Promise<T>): Promise<T> {
    const run = inboxQueueRef.current.catch(() => undefined).then(task);
    inboxQueueRef.current = run.catch(() => undefined);
    return run;
  }

  // Listen on our own inbox and authenticate as its owner (Ed25519 sig over the
  // DO's challenge) so the relay hands us our queued + live messages.
  function connectInbox(room: string) {
    const id = identityRef.current;
    if (!id || relaysRef.current.has(room)) return;
    const client = new RelayClient(room, {
      onCipher: (bytes, ackId) => void enqueueInbox(() => onInbox(bytes, ackId)),
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

  // Send raw sealed bytes to an arbitrary inbox (derived from a device's sign
  // key). Used by the linking flow, whose recipient is our own other device and
  // has no Contact/roomId. Reuses an open relay for that room if one exists.
  async function sendToInbox(recipientSignPub: Bytes, sealed: Bytes): Promise<void> {
    const room = await inboxRoom(recipientSignPub);
    let client = relaysRef.current.get(room);
    if (!client) {
      client = new RelayClient(room, {});
      relaysRef.current.set(room, client);
      client.connect();
    }
    client.send(sealed);
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

  // ── roomId migration (device-DH → master) ──────────────────────────
  // Move one contact's storage AND its in-memory maps from oldRoomId to its
  // already-set contact.roomId. The single crash-safe routine every mutation
  // site funnels through (boot migration, acceptRotation, acceptMasterChange) —
  // so no site can orphan history or leave a dead map key. The caller sets the
  // new contact.roomId first (migrate for boot; the door functions themselves).
  async function reKeyContactInMemory(oldRoomId: string, contact: Contact): Promise<void> {
    const newRoomId = contact.roomId;
    if (oldRoomId === newRoomId) return;
    await moveContactStorage(dek, oldRoomId, contact); // re-seal storage old → new
    if (messagesRef.current[oldRoomId] !== undefined) {
      messagesRef.current[newRoomId] = messagesRef.current[oldRoomId];
      delete messagesRef.current[oldRoomId];
    }
    if (unreadRef.current[oldRoomId] !== undefined) {
      unreadRef.current[newRoomId] = unreadRef.current[oldRoomId];
      delete unreadRef.current[oldRoomId];
    }
    const room = sendRoomRef.current.get(oldRoomId);
    if (room !== undefined) {
      sendRoomRef.current.set(newRoomId, room);
      sendRoomRef.current.delete(oldRoomId);
    }
    if (profileSentRef.current.has(oldRoomId)) {
      profileSentRef.current.delete(oldRoomId);
      profileSentRef.current.add(newRoomId);
    }
    setStatuses((prev) => {
      if (prev[oldRoomId] === undefined) return prev;
      const n = { ...prev };
      n[newRoomId] = n[oldRoomId];
      delete n[oldRoomId];
      return n;
    });
  }

  // One-time boot migration of the whole vault to the master regime. Pulls each
  // contact's per-contact retiredMasters into the GLOBAL denylist, sets
  // ownMasterPub where missing, and re-keys every device-regime contact —
  // collapsing crash-interrupted duplicates (two records for one peer) by
  // keeping the one with a live ratchet / more messages, never blind-overwriting.
  async function migrateContactsToMaster() {
    const id = identityRef.current;
    if (!id) return;
    const myMaster = asMasterPub(id.master.publicKey);

    // Move per-contact retiredMasters into the global denylist (one-time).
    const retired = retiredMastersRef.current;
    for (const c of contactsRef.current) {
      if (c.retiredMasters?.length) {
        for (const rm of c.retiredMasters) if (!retired.has(rm)) await addRetiredMaster(dek, rm);
        c.retiredMasters = undefined;
      }
    }

    // Give un-migrated contacts an ownMasterPub. A staleIdentity contact without
    // one lost its pre-link master (pre-v0.18.7) → cannot derive the peer-
    // symmetric room; leave it device-regime, the user must reconnect.
    for (const c of contactsRef.current) {
      if (c.regime === 'master') continue;
      if (!c.ownMasterPub && !c.staleIdentity) c.ownMasterPub = myMaster;
    }

    // Group by the TARGET master-roomId to detect crash-interrupted duplicates.
    const score = (c: Contact) => (hasSession(c) ? 1_000_000 : 0) + (messagesRef.current[c.roomId]?.length ?? 0);
    const byTarget = new Map<string, Contact[]>();
    for (const c of contactsRef.current) {
      if (c.regime !== 'master' && !c.ownMasterPub) continue; // hard case, skip
      const target =
        c.regime === 'master'
          ? c.roomId
          : await computeMasterRoomId(asMasterPub(c.ownMasterPub!), asMasterPub(c.peerMasterPub));
      (byTarget.get(target) ?? byTarget.set(target, []).get(target)!).push(c);
    }

    const losers: Contact[] = [];
    const survivorIds = new Set<string>(); // final roomIds a winner occupies — never delete
    for (const group of byTarget.values()) {
      // Winner: highest score. On a TIE prefer the record ALREADY in the master
      // regime (already at the target roomId), so we never migrate a device copy
      // ONTO a live master record's key and then delete that same key as a
      // "loser" — the silent, permanent data loss a crash-interrupted duplicate
      // produced (the winner's freshly re-sealed contact+history would be wiped).
      let winner = group[0];
      for (const c of group) {
        const s = score(c);
        const w = score(winner);
        if (s > w || (s === w && winner.regime !== 'master' && c.regime === 'master')) winner = c;
      }
      for (const c of group) if (c !== winner) losers.push(c);
      if (winner.regime !== 'master') {
        try {
          const oldRoomId = winner.roomId;
          await migrateContactRoomId(winner); // sets winner.roomId + regime='master'
          await reKeyContactInMemory(oldRoomId, winner); // moves storage + maps
        } catch (e) {
          console.error('[migrate] Kontakt nicht migrierbar (bleibt device):', (e as Error).message);
        }
      }
      survivorIds.add(winner.roomId); // post-migration roomId
    }
    for (const l of losers) {
      // Never delete a storage key a migrated winner now owns: if a device winner
      // was re-keyed INTO a master loser's roomId, moveContactStorage already
      // re-sealed contact+messages there and reKeyContactInMemory moved the live
      // messages under that key — removeContact/delete would nuke the survivor.
      if (survivorIds.has(l.roomId)) continue;
      await removeContact(dek, l.roomId);
      delete messagesRef.current[l.roomId];
    }
    if (losers.length) contactsRef.current = contactsRef.current.filter((c) => !losers.includes(c));
  }

  // ── Device linking ──────────────────────────────────────────────────
  // Reset all transient linking state — the total abort. Nothing was persisted
  // before the grant is installed, so dropping these refs IS the rollback.
  function resetLink() {
    linkSessionRef.current = null;
    linkPendingGrantRef.current = null;
    linkConfirmedRef.current = false;
    setLinkSas(null);
    setLinkQr('');
    setLinkBusy(false);
  }

  // N starts: show our QR, then wait for P's offer on our inbox.
  async function startJoinAsNewDevice() {
    const id = identityRef.current;
    if (!id) return;
    setError('');
    const { session, qrToken } = await startLinkOnN(id);
    linkSessionRef.current = session;
    linkConfirmedRef.current = false;
    linkPendingGrantRef.current = null;
    setLinkQr(await makeQr(qrToken).catch(() => ''));
    setLinkView('qr');
  }

  // N received P's offer → derive and show the emoji.
  async function onLinkOffer(payload: Bytes) {
    const session = linkSessionRef.current;
    if (!session || session.role !== 'new') return; // not linking, or wrong role
    try {
      const sas = await offerReceivedOnN(session, payload);
      setLinkSas(sas);
      setLinkView('sas');
    } catch (e) {
      setError('Kopplung fehlgeschlagen: ' + (e as Error).message);
      resetLink();
      setLinkView(null);
    }
  }

  // N received P's grant. Held until the user confirms the emoji here too — an
  // unconfirmed grant is never installed.
  async function onLinkGrant(payload: Bytes) {
    const session = linkSessionRef.current;
    if (!session || session.role !== 'new') return;
    linkPendingGrantRef.current = payload;
    if (linkConfirmedRef.current) await installGrant();
  }

  // N confirmed the emoji. Install now if the grant already arrived, else mark
  // confirmed and show a waiting state until onLinkGrant installs it.
  async function onNConfirmSas() {
    linkConfirmedRef.current = true;
    if (linkPendingGrantRef.current) await installGrant();
    else setLinkBusy(true); // waiting for the primary device to confirm
  }

  async function installGrant() {
    const id = identityRef.current;
    const session = linkSessionRef.current;
    const payload = linkPendingGrantRef.current;
    if (!id || !session || !payload) return;
    setLinkBusy(true);
    try {
      const grant = await decodeLinkGrant(payload);
      // Farewell BEFORE the identity swap: our contacts still pin the OLD master,
      // and once we install, sending is blocked (staleIdentity). So the goodbye
      // must ride out over the still-valid old session, or never.
      const farewell = async () => {
        for (const c of contactsRef.current) {
          try {
            await sendEnvelopeTo(
              c,
              await encryptAndPersist(c, () =>
                sendMessage(id, c, '🔗 Ich habe ein neues Gerät gekoppelt — meine Identität ändert sich. Bitte bestätige die neue Identität, wenn du gefragt wirst.'),
              ),
            );
          } catch {
            /* one unreachable contact must not block the link */
          }
        }
      };
      // ⚠️ ORDERING (Design-Fund #1): snapshot the PRE-SWAP master onto every
      // contact BEFORE the identity changes. After linking, id.master becomes the
      // primary's master and our old one is gone — but every existing contact
      // still pins the OLD master, so once roomId is master-based their room
      // derives from it. Losing it makes each stale conversation permanently
      // un-addressable. `if (!ownMasterPub)` keeps the EARLIEST master a contact
      // knows us under (a second link must not overwrite it with a master we
      // never actually spoke to them under). Same discipline as the farewell.
      const preSwapMaster = asMasterPub(id.master.publicKey);
      const linked = await completeLinkOnN(dek, id, session, grant, farewell);
      identityRef.current = linked;
      setFingerprint(await fingerprintOf(linked));
      // Our shared code encoded the OLD master; regenerate it so anyone scanning
      // now reaches us under the identity we actually hold.
      const pre = prekeysRef.current;
      if (pre) {
        const token = await encodeBundle(currentBundle(linked, pre));
        const link = `${location.origin}/#add=${token}`;
        setShareLink(link);
        makeQr(link).then(setQrDataUrl).catch(() => undefined);
      }
      // Every existing contact still knows our old identity. Mark them stale so
      // we don't send over a session built under the old master; the user
      // reconnects each, which runs a fresh X3DH the peer then accepts.
      for (const c of contactsRef.current) {
        c.staleIdentity = true;
        if (!c.ownMasterPub) c.ownMasterPub = preSwapMaster; // the master the peer still pins us under
        await saveContact(dek, c);
      }
      resetLink();
      setLinkView('done');
      bump();
    } catch (e) {
      setError('Kopplung fehlgeschlagen: ' + (e as Error).message);
      resetLink();
      setLinkView(null);
    }
  }

  // P scanned N's QR → send the inert offer and show the emoji.
  async function onScanNewDevice(qrToken: string) {
    const id = identityRef.current;
    if (!id) return;
    setError('');
    setLinkBusy(true);
    try {
      const { session, sas } = await beginLinkOnP(id, qrToken, sendToInbox);
      linkSessionRef.current = session;
      setLinkSas(sas);
      setLinkView('sas');
    } catch (e) {
      setError('Kopplung fehlgeschlagen: ' + (e as Error).message);
      resetLink();
      setLinkView('menu');
    } finally {
      setLinkBusy(false);
    }
  }

  // P confirmed the emoji → issue the grant, send it, then persist the list.
  // Gossip our updated device list to every contact with an established session
  // (revocation transport). Only sendable sessions: not stale, not hidden group
  // members, and a ratchet must already exist. Best-effort per contact.
  async function gossipDeviceList(list: Parameters<typeof sendDeviceList>[2]) {
    const id = identityRef.current;
    if (!id) return;
    for (const c of contactsRef.current) {
      if (c.hidden || c.staleIdentity || !hasSession(c)) continue;
      try {
        await sendEnvelopeTo(c, await encryptAndPersist(c, () => sendDeviceList(id, c, list)));
      } catch {
        /* unreachable contact — best effort, they learn it next time */
      }
    }
  }

  async function onPConfirmSas() {
    const id = identityRef.current;
    const session = linkSessionRef.current;
    if (!id || !session) return;
    setLinkBusy(true);
    try {
      const currentList = await loadOrCreateOwnDeviceList(dek, id);
      if (!currentList) throw new Error('Geräteliste nicht verfügbar.');
      const newList = await completeLinkOnP(dek, id, session, currentList, sendToInbox);
      // Gossip the updated list so contacts learn the new device (and, later,
      // stop accepting a removed one). Best-effort: revocation takes effect for
      // a contact once it has seen this newer, master-signed list.
      await gossipDeviceList(newList);
      resetLink();
      setLinkView('done');
    } catch (e) {
      setError('Kopplung fehlgeschlagen: ' + (e as Error).message);
      resetLink();
      setLinkView(null);
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
        // Device-linking payloads (N side): the offer carries P's SAS ephemeral
        // + master so N can show the emoji; the grant arrives after P confirms.
        if (opened.type === SEALED_LINK_OFFER) {
          await onLinkOffer(opened.payload);
          return;
        }
        if (opened.type === SEALED_LINK_GRANT) {
          await onLinkGrant(opened.payload);
          return;
        }
        if (opened.type !== SEALED_ENVELOPE) return; // unknown tag — drop
        env = await decodeEnvelope(opened.payload);
      } catch {
        return; // handled in finally (ack + drop)
      }

      // RESOLVE (regime-robust): may use the legacy device-derivation for a
      // not-yet-migrated contact. Resolution only — authorisation happens in
      // receiveEnvelope against the master.
      const myMaster = asMasterPub(id.master.publicKey);
      let contact = await resolveContactByConv(contactsRef.current, env.conv, id.dh.publicKey, myMaster);
      if (!contact) {
        if (env.type !== 'prekey') return;
        // AUTO-CREATE only on a MASTER-based conv that matches the sender's own
        // claimed master. A device-based unknown conv is not a valid reason to
        // mint a contact post-flip (Stage 3c): resolution may use the legacy
        // derivation, creation may not — else the weaker path becomes a trust
        // decision (the openInbound-fallback shape).
        const masterConv = await computeMasterRoomId(myMaster, asMasterPub(env.x3dh.masterPub));
        if (env.conv !== masterConv) return;
        // DENYLIST before creation: a prekey under an abandoned master must not
        // mint a fresh contact (the retired-master replay the global denylist
        // exists to stop — under master-roomId it lands as a NEW conversation,
        // so the check must sit here, not only on the old contact).
        if (retiredMastersRef.current.has(await masterKeyB64(env.x3dh.masterPub))) {
          console.warn('[recv] Auto-Create unter verlassenem Master abgelehnt.');
          return;
        }
        // MERGE AFFORDANCE (unproven): the prekey carries a previousMaster hint,
        // and we still have a contact pinned to THAT master → the person may have
        // changed identity. Offer a merge (record pendingMaster on the origin) —
        // it PROVES nothing, so it only prompts; the user must compare the safety
        // number, and acceptMasterChange (verified=false) is the confirm.
        const prev = env.x3dh.previousMaster;
        if (prev) {
          // A retired master claimed as origin is an attack, not a merge.
          if (retiredMastersRef.current.has(await masterKeyB64(prev))) {
            console.warn('[recv] Herkunfts-Hinweis nennt verlassenen Master — abgelehnt.');
            return;
          }
          const origin = contactsRef.current.find((c) => bytesEqual(c.peerMasterPub, prev));
          if (origin && !bytesEqual(origin.peerMasterPub, env.x3dh.masterPub)) {
            // Fire the merge affordance AT MOST ONCE per origin, until the user
            // acts (accept via acceptMasterChange, or dismiss). previousMaster is
            // unsigned and attacker-chosen; gating the dedup on the exact claimed
            // master let a FRESH master per message defeat it and repeatedly
            // overwrite the pending claim + re-raise the alert — an unauthenticated
            // pendingMaster-overwrite + warning-fatigue lever (Review D). Once a
            // claim is pending we surface the FIRST one and ignore later hints;
            // the user must compare the safety number out-of-band regardless.
            const consistent =
              !origin.pendingMaster &&
              (await verifyDeviceCert(
                env.x3dh.masterPub, env.x3dh.epoch, env.x3dh.identitySignPub, env.x3dh.identityDhPub, env.x3dh.deviceCert,
              ));
            if (consistent) {
              origin.pendingMaster = {
                masterPub: env.x3dh.masterPub, epoch: env.x3dh.epoch,
                signPub: env.x3dh.identitySignPub, dhPub: env.x3dh.identityDhPub,
              };
              await saveContact(dek, origin);
              setError(`⚠ ${displayName(origin)} meldet sich mit einer neuen Identität (unbelegt). Prüfe sie in der Kontaktansicht und vergleiche die Sicherheitsnummer.`);
              bump();
            }
            return; // the merge affordance is the path — do NOT auto-create a stranger
          }
        }
        contact = await makeContactFromHeader(myMaster, env.x3dh);
        contactsRef.current = [...contactsRef.current, contact];
        messagesRef.current[contact.roomId] = [];
        await connectSend(contact);
        await saveContact(dek, contact);
      }

      const wasNew = !hasSession(contact);
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
        } else if (e instanceof RevokedDeviceError) {
          // Dropped silently (no toast): a revoked device can replay forever, so
          // per-message alerts would be the same fatigue lever as the retired
          // case. Logged for diagnosis. Full "delivered to a no-longer-valid
          // device" surfacing is the send-side status work (3d).
          console.warn(`[recv] Prekey von widerrufenem Gerät von ${displayName(contact)} verworfen.`);
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
      } else if (content.kind === 'devlist') {
        // Learn the peer's newer device list (revocation gossip). Verified +
        // rollback-checked + denylist-guarded inside applyDeviceListUpdate; on
        // success persist immediately (the list authorises future sends, so it
        // must not live only in RAM — the v0.17.1 lesson).
        if (await applyDeviceListUpdate(contact, content.list, retiredMastersRef.current)) {
          await saveContact(dek, contact);
        }
      } else if (content.kind === 'rotation') {
        // A dual-signed rotation PROVES the peer's master continuity → acceptRotation
        // re-pins to the new master and re-keys, KEEPING `verified` (unlike the
        // unproven previousMaster path, which clears it). Denylist-first and
        // reject-before-any-state-touch live inside acceptRotation; a forged or
        // rolled-back chain throws and changes nothing.
        try {
          const r = await acceptRotation(contact, content.statement, retiredMastersRef.current);
          await reKeyContactInMemory(r.oldRoomId, contact); // move storage + maps to the new room
          if (activeRoomRef.current === r.oldRoomId) setActiveRoom(r.newRoomId);
        } catch (e) {
          console.warn('[recv] Rotation abgelehnt:', (e as Error).message);
        }
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
      // Adding your OWN code would pass every check and silently create a "chat
      // with yourself". Compare MASTERS, not device keys: under master-based
      // rooms an own SECOND device (same master, different dh) must also be
      // caught, and it would slip a dhPub-only guard.
      if (bytesEqual(bundle.masterPub, id.master.publicKey)) {
        setError('Das ist dein eigener Verbindungscode.');
        return;
      }
      const contact = await makeContact(asMasterPub(id.master.publicKey), bundle);
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
      setStickers(await loadStickers(dek));
      setMyAvatarB64(prof.avatarB64 ?? '');
      setProfileName(prof.name ?? '');

      const token = await encodeBundle(currentBundle(id, pre));
      const link = `${location.origin}/#add=${token}`;
      setShareLink(link);
      makeQr(link).then(setQrDataUrl).catch(() => undefined);

      retiredMastersRef.current = await loadRetiredMasters(dek);
      contactsRef.current = await loadContacts(dek);
      // Seed the inbox queue with the whole vault load + one-time master migration,
      // so every queued/live message the relay delivers on connect is processed
      // strictly AFTER it (no onInbox-vs-migration race). Messages load FIRST, keyed
      // by the current roomIds, so the duplicate-collapse tiebreak compares real
      // history counts (not an empty map); reKeyContactInMemory relocates them.
      const bootLoad = enqueueInbox(async () => {
        for (const c of contactsRef.current) messagesRef.current[c.roomId] = await loadMessages(dek, c.roomId);
        await migrateContactsToMaster();
        for (const c of contactsRef.current) await connectSend(c);
        const gs = await loadGroups(dek);
        groupsRef.current = gs;
        for (const g of gs) messagesRef.current[g.id] = await loadMessages(dek, g.id);
        commitMessages();
        bump();
      });

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

      await bootLoad; // contacts are on their final master roomIds; messages loaded

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
    // Serialize the ratchet-mutating send through the SAME chain as onInbox.
    // ratchetEncrypt advances CKs/Ns IN PLACE on contact.ratchet; a CONCURRENT
    // onInbox ratchetDecrypt clones the whole state and commits it back via
    // Object.assign(state, draft) (ratchet.ts:226-228) — which would ROLL BACK
    // that CKs advance if the send landed between the clone and the commit. The
    // next send then re-derives the same message key → (key, nonce) reuse =
    // two-time-pad (leaks plaintext XOR + the GHASH auth key → forgery). The
    // keystone enqueueInbox covered receive-vs-receive only; send-vs-receive on the
    // same contact was still open. No awaited send runs inside an onInbox task
    // (ensureProfileSent is fire-and-forget), so this cannot self-deadlock.
    return enqueueInbox(async () => {
      const envelope = await produce();
      await saveContact(dek, contact);
      return envelope;
    });
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
    const myMaster = asMasterPub(id.master.publicKey);
    const memberMaster = m.bundle?.masterPub;
    // Master-based room when the roster entry carries a master (v2 bundles do);
    // a legacy member without one stays on the device-DH room — frozen, since
    // group device-revocation is v3 (it can't get a master room until re-invited
    // with a v2 bundle). Resolve regime-robustly so a pre-flip member contact is
    // found rather than duplicated.
    let contact: Contact;
    if (memberMaster) {
      const roomId = await computeMasterRoomId(myMaster, asMasterPub(memberMaster));
      const existing = await resolveContactByConv(contactsRef.current, roomId, id.dh.publicKey, myMaster);
      if (existing) return existing;
      // CREATION guards (Devil's-Advocate G2): a group roster is an unproven,
      // attacker-relayable list, and receiveEnvelope never consults the denylist —
      // so this is the choke point. Never mint a member contact for a RETIRED
      // master (the abandoned-key downgrade the denylist exists to stop, reached
      // here via the roster instead of 1:1 auto-create), and require the master to
      // actually vouch (device cert) for the exact keys we are about to pin — else
      // a stale/forged roster entry binds arbitrary device keys under a master.
      if (retiredMastersRef.current.has(await masterKeyB64(memberMaster))) {
        console.warn('[group] Mitglied unter verlassenem (widerrufenem) Master abgelehnt.');
        return null;
      }
      const bundle = m.bundle;
      const certOk =
        !!bundle && (await verifyDeviceCert(memberMaster, bundle.epoch, m.signPub, m.dhPub, bundle.deviceCert));
      if (!certOk) {
        console.warn('[group] Mitglied mit ungültigem Device-Zertifikat abgelehnt.');
        return null;
      }
      contact = {
        roomId,
        peerMasterPub: memberMaster,
        peerEpoch: m.bundle?.epoch ?? 1,
        peerSignPub: m.signPub,
        peerDhPub: m.dhPub,
        peerFingerprint: await identityFingerprint(memberMaster, memberMaster),
        peerName: m.name,
        ownMasterPub: myMaster,
        regime: 'master',
        bundle: m.bundle,
        hidden: true,
        sessions: new Map(),
      };
    } else {
      const roomId = await computeRoomId(id.dh.publicKey, m.dhPub);
      const existing = contactsRef.current.find((c) => c.roomId === roomId);
      if (existing) return existing;
      contact = {
        roomId,
        peerMasterPub: m.signPub, // legacy fallback (no master in the roster)
        peerEpoch: 1,
        peerSignPub: m.signPub,
        peerDhPub: m.dhPub,
        peerFingerprint: await identityFingerprint(m.signPub, m.dhPub),
        peerName: m.name,
        regime: 'device',
        bundle: m.bundle,
        hidden: true,
        sessions: new Map(),
      };
    }
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

  // AUTHENTICITY: a group has no group-level signature — it is pairwise fan-out,
  // so each message is authenticated only as coming from the pairwise `contact`.
  // The wire `senderName` is attacker-chosen and is therefore DISCARDED for
  // attribution; the displayed sender is derived from the authenticated sending
  // key, and a message whose sender is not a CURRENT member is dropped. Otherwise
  // any co-member (or a removed member still holding a pairwise session) could
  // post AS another member — a forgeable sender badge (Devil's-Advocate DA-2).
  async function applyGroupMessage(
    groupId: string,
    _senderName: string | undefined, // intentionally unused — never trust it
    inner: MessageContent,
    contact: Contact,
  ) {
    const buildMsg = (sender: string): ChatMessage =>
      inner.kind === 'file'
        ? { mine: false, ts: Date.now(), sender, file: { name: inner.name, mime: inner.mime, dataB64: bytesToB64(inner.data) } }
        : { mine: false, ts: Date.now(), sender, text: inner.kind === 'text' ? inner.text : '' };
    const g = groupsRef.current.find((x) => x.id === groupId);
    if (!g) {
      // Message arrived before the group invite — hold it, attributed to the
      // authenticated contact; membership is re-checked against the roster on
      // flush (applyGroupInvite), since we have no roster yet.
      const msg = buildMsg(contact.peerName || shortFp(contact.peerFingerprint));
      const buf = pendingGroupMsgsRef.current.get(groupId) ?? [];
      buf.push({ msg, senderDhPub: contact.peerDhPub });
      pendingGroupMsgsRef.current.set(groupId, buf);
      return;
    }
    const member = g.members.find((m) => eqBytes(m.dhPub, contact.peerDhPub));
    if (!member) {
      console.warn('[group] Nachricht von Nicht-/entferntem Mitglied verworfen.');
      return;
    }
    await appendMessage(g.id, buildMsg(member.name || contact.peerName || shortFp(contact.peerFingerprint)));
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

    // Flush any messages that arrived before this invite — but only from senders
    // the resolved roster actually lists (a non-member's buffered message is
    // dropped here, the membership check applyGroupMessage could not run yet).
    const pending = pendingGroupMsgsRef.current.get(g.id);
    if (pending?.length) {
      pendingGroupMsgsRef.current.delete(g.id);
      let added = 0;
      for (const { msg, senderDhPub } of pending) {
        if (!g.members.some((m) => eqBytes(m.dhPub, senderDhPub))) continue;
        await appendMessage(g.id, msg);
        added++;
      }
      if (added && !(viewRef.current === 'chat' && activeGroupRef.current === g.id)) {
        unreadRef.current[g.id] = (unreadRef.current[g.id] ?? 0) + added;
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
        const kb = Math.round(data.length / 1024);
        const cap = Math.round(MAX_ATTACH / 1024);
        // Videos deserve their own wording: "too big" alone leaves the user
        // guessing whether a shorter clip would help or the format is wrong.
        // There is no re-encoding step, so the honest answer is the duration.
        setError(
          mime.startsWith('video/')
            ? `Video zu groß (${Math.round(kb / 1024)} MB). Es gibt keine Umkodierung — es passen nur sehr kurze Clips bis ~${cap} KB, in der Praxis wenige Sekunden. Kürze oder verkleinere es vorher.`
            : `Zu groß (${kb} KB) — inline gehen ~${cap} KB.`,
        );
        return;
      }
      // A file literally named like our sticker marker would render chrome-free
      // on the other side. Harmless but confusing, so rename it.
      if (name === STICKER_FILENAME) name = 'datei';
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

  /** Turn a cropped square into a stored, reusable sticker. */
  async function onStickerCropped(bytes: Uint8Array, mime: string) {
    setStickerFile(null);
    if (stickers.length >= MAX_STICKERS) {
      setError(`Sticker-Grenze erreicht (${MAX_STICKERS}) — lösche erst einen.`);
      return;
    }
    const next: Sticker[] = [
      { id: crypto.randomUUID(), dataB64: bytesToB64(bytes), mime, ts: Date.now() },
      ...stickers,
    ];
    setStickers(next);
    await saveStickers(dek, next);
  }

  async function deleteSticker(id: string) {
    const next = stickers.filter((s) => s.id !== id);
    setStickers(next);
    await saveStickers(dek, next);
  }

  /**
   * Send a stored sticker. It goes out as an ordinary image attachment named
   * STICKER_FILENAME — see lib/stickers.ts for why a new frame type would make
   * stickers disappear on not-yet-updated devices instead of degrading.
   */
  async function sendSticker(st: Sticker) {
    const id = identityRef.current;
    if (!id || (!activeRoom && !activeGroup)) return;
    setStickerPanel(false);
    setError('');
    try {
      const data = b64ToBytes(st.dataB64);
      const mid = crypto.randomUUID();
      const localMsg: ChatMessage = {
        mine: true,
        ts: Date.now(),
        file: { name: STICKER_FILENAME, mime: st.mime, dataB64: st.dataB64 },
        mid,
      };
      if (activeGroup) {
        await groupSend({ kind: 'file', name: STICKER_FILENAME, mime: st.mime, data }, localMsg);
        return;
      }
      const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
      if (!contact) return;
      await sendEnvelopeTo(
        contact,
        await encryptAndPersist(contact, () => sendFile(id, contact, STICKER_FILENAME, st.mime, data)),
        mid,
      );
      await appendMessage(contact.roomId, { ...localMsg, status: 'pending' });
      startAckTimer(mid);
      bump();
    } catch (err) {
      setError('Sticker fehlgeschlagen: ' + (err as Error).message);
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
    if (!id || !hasSession(contact) || profileSentRef.current.has(contact.roomId)) return;
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
    for (const c of contactsRef.current) if (hasSession(c)) await ensureProfileSent(c);
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

  // The share text carries the link (which contains add=<token>). extractToken
  // finds the token even amid the surrounding instructions, so the SAME string
  // works whether the recipient taps the link (Android link-capture) or, on iOS
  // where a link only ever opens Safari, pastes it via "Aus Zwischenablage".
  function contactShareText(): string {
    return (
      'Verbinde dich mit mir auf SCYTALE 🔐\n\n' +
      shareLink +
      '\n\nFalls sich nur der Browser öffnet: In SCYTALE auf „Verbinden“ → „Aus Zwischenablage verbinden“.'
    );
  }

  // Sender affordance. navigator.share is the native sheet (works outgoing on
  // iOS standalone PWAs); where it's absent (most desktops) fall back to copying
  // the same text. A cancelled share sheet throws AbortError — swallowed, it is
  // not an error the user needs to see.
  async function shareContactCode() {
    const text = contactShareText();
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text }); // the native sheet is its own feedback
      } else {
        // No share sheet (most desktops): we copied instead — acknowledge on THIS
        // button, not the separate 'Kopieren' one the user didn't click.
        await navigator.clipboard.writeText(text);
        setShared(true);
        window.setTimeout(() => setShared(false), 1500);
      }
    } catch {
      /* share sheet cancelled, or share/clipboard unavailable — nothing to do */
    }
  }

  // Receiver affordance. Reading the clipboard needs a user gesture (this is one)
  // and may prompt on iOS — both fine. addBundle runs the SAME cert-verifying
  // path as the QR scan and the manual box, so pasting is not a weaker channel;
  // the bundle is public keys and the MitM backstop is the safety-number compare.
  async function pasteAndAdd() {
    setError('');
    try {
      if (!navigator.clipboard?.readText) {
        setError('Zwischenablage nicht verfügbar — füge den Code unten ins Feld ein.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError('Zwischenablage ist leer — kopiere zuerst den Verbindungscode deines Kontakts.');
        return;
      }
      await addBundle(text);
    } catch {
      setError('Zugriff auf die Zwischenablage nicht möglich — füge den Code stattdessen unten ins Feld ein.');
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

  // ── The door, peer side ─────────────────────────────────────────────
  // This contact presented a new master (pendingMaster) and the user chose to
  // accept it. Re-pins to the new identity, drops the session, forces a fresh
  // safety-number comparison. Deliberate user action only.
  async function acceptNewIdentity() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    if (!c || !c.pendingMaster) return;
    if (!confirm('Neue Identität dieses Kontakts übernehmen? Danach musst du die Sicherheitsnummer erneut vergleichen.'))
      return;
    const r = await acceptMasterChange(c); // sets new roomId + verified=false
    if (!r) return;
    // Commit the contact re-key BEFORE persisting the denylist entry (Review E): a
    // crash between the two must leave the milder, self-correcting state — the
    // contact already moved to the NEW master (off the denylist), only the
    // retirement not yet recorded — never the contact stranded on a master that is
    // already denylisted, which would silently reject all its future device-list
    // and rotation updates.
    await reKeyContactInMemory(r.oldRoomId, c); // move storage + maps to the new room
    retiredMastersRef.current = await addRetiredMaster(dek, r.retiredMaster); // global denylist
    if (activeRoom === r.oldRoomId) setActiveRoom(r.newRoomId);
    setError('');
    bump();
  }

  // ── The door, our side ──────────────────────────────────────────────
  // We linked a device, so this contact still pins our old master and sending
  // is blocked. Reconnecting resets the session; the next message runs a fresh
  // X3DH under our current identity, which the peer then has to accept.
  async function reconnectStaleContact() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    const id = identityRef.current;
    if (!c || !id) return;
    const r = await reconnectContact(c, asMasterPub(id.master.publicKey)); // sets new roomId
    await reKeyContactInMemory(r.oldRoomId, c); // move storage + maps
    if (activeRoom === r.oldRoomId) setActiveRoom(r.newRoomId);
    setError('');
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

  const closeLink = () => {
    resetLink();
    setLinkView(null);
  };
  const linkRole = linkSessionRef.current?.role;
  const linkOverlay = linkView === 'scan' ? (
    // Standalone full-screen scanner — deliberately NOT inside .link-card. That
    // card runs a transform animation, and a transformed ancestor becomes the
    // containing block for the scanner's position:fixed (especially sticky on
    // iOS via the animation fill-mode), collapsing the camera to a thin strip.
    // Rendered bare, its position:fixed resolves against the viewport as meant.
    <QrScanner
      onResult={(text) => {
        if (linkBusy || linkSessionRef.current) return;
        void onScanNewDevice(text.trim());
      }}
      onClose={closeLink}
    />
  ) : linkView ? (
    <div className="link-overlay" role="dialog" aria-label="Gerät koppeln">
      <div className="link-card">
        <button className="link-x" onClick={closeLink} aria-label="Schließen">
          ×
        </button>

        {linkView === 'menu' && (
          <>
            <div className="link-head">Gerät koppeln</div>
            <p className="link-sub">Welche Rolle hat dieses Gerät?</p>
            <button className="btn btn-primary btn-tall" onClick={() => void startJoinAsNewDevice()}>
              Dieses Gerät verbinden
              <span className="link-btn-note">Zeigt einen QR-Code, den das Hauptgerät scannt</span>
            </button>
            <button
              className="btn btn-outline btn-tall"
              style={{ marginTop: 12 }}
              onClick={() => {
                const id = identityRef.current;
                if (id && !isPrimaryDevice(id)) {
                  setError('Dieses Gerät ist selbst gekoppelt — nur das Hauptgerät kann weitere hinzufügen.');
                  return;
                }
                setLinkView('scan');
              }}
            >
              Neues Gerät hinzufügen
              <span className="link-btn-note">Scannt den QR-Code des neuen Geräts</span>
            </button>
          </>
        )}

        {linkView === 'qr' && (
          <>
            <div className="link-head">Auf dem Hauptgerät scannen</div>
            <p className="link-sub">
              Öffne auf deinem Hauptgerät <b>Profil → Gerät koppeln → Neues Gerät hinzufügen</b> und scanne diesen
              Code.
            </p>
            <div className="link-qr">{linkQr ? <img src={linkQr} alt="Kopplungs-QR" /> : <span className="ph">…</span>}</div>
            <p className="link-wait">
              <span className="rec-dot" /> Warte auf das Hauptgerät…
            </p>
          </>
        )}


        {linkView === 'sas' && linkSas && (
          <>
            <div className="link-head">Stimmen die Emojis überein?</div>
            <p className="link-sub">
              Vergleiche diese sieben Zeichen mit dem <b>anderen Gerät</b>. Nur wenn sie exakt gleich sind, ist die
              Verbindung frei von einem Angreifer in der Mitte.
            </p>
            <div className="sas-grid">
              {linkSas.emoji.map((e, i) => (
                <div key={i} className="sas-cell">
                  <span className="sas-emoji">{e.char}</span>
                  <span className="sas-name">{e.name}</span>
                </div>
              ))}
            </div>
            {linkBusy ? (
              <p className="link-wait">
                <span className="rec-dot" /> Warte auf Bestätigung des Hauptgeräts…
              </p>
            ) : (
              <div className="link-actions">
                <button className="btn btn-danger" onClick={closeLink}>
                  Stimmt nicht
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => (linkRole === 'primary' ? void onPConfirmSas() : void onNConfirmSas())}
                >
                  Stimmt überein
                </button>
              </div>
            )}
          </>
        )}

        {linkView === 'done' && (
          <>
            <div className="link-done-icon">
              <IconShield size={30} filled />
            </div>
            <div className="link-head">Gerät gekoppelt</div>
            <p className="link-sub">
              {linkRole === 'primary'
                ? 'Das neue Gerät gehört jetzt zu deiner Identität.'
                : 'Dieses Gerät nutzt jetzt deine bestehende Identität. Bestehende Kontakte müssen die neue Identität bestätigen — schreibe ihnen, um das auszulösen.'}
            </p>
            <button className="btn btn-primary btn-tall" onClick={() => setLinkView(null)}>
              Fertig
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;

  const contacts = contactsRef.current;
  const visibleContacts = contacts.filter((c) => !c.hidden);
  const groups = groupsRef.current;
  const activeContact = contacts.find((c) => c.roomId === activeRoom) ?? null;
  const activeGroupData = groups.find((g) => g.id === activeGroup) ?? null;
  const st = (roomId: string) => statuses[roomId] ?? 'closed';
  const lastPreview = (m?: ChatMessage) =>
    m
      ? m.text ||
        (m.file
          ? isSticker(m.file)
            ? 'Sticker'
            : m.file.mime.startsWith('video/')
              ? '🎬 Video'
              : m.file.mime.startsWith('image/')
                ? '📷 Bild'
                : m.file.mime.startsWith('audio/')
                  ? '🎤 Sprachnachricht'
                  : '📎 Anhang'
          : '')
      : '';

  // The sticker cropper is rendered next to the panel, not in the profile view:
  // the picker is reachable only from a chat, so the modal must live there too.
  const stickerCropEl = stickerFile ? (
    <CropModal
      file={stickerFile}
      shape="square"
      onCancel={() => setStickerFile(null)}
      onDone={(b, mime) => void onStickerCropped(b, mime)}
    />
  ) : null;

  const stickerPanelEl = stickerPanel ? (
    <div className="sticker-panel">
      {stickers.length === 0 && (
        <p className="sticker-empty">
          Noch keine Sticker. Mach aus einem Bild einen — er bleibt verschlüsselt auf deinem Gerät.
        </p>
      )}
      <div className="sticker-grid">
        {stickers.map((st) => (
          <div key={st.id} className="sticker-cell">
            <button className="sticker-btn" onClick={() => void sendSticker(st)} aria-label="Sticker senden">
              <img src={`data:${st.mime};base64,${st.dataB64}`} alt="" />
            </button>
            <button
              className="sticker-del"
              aria-label="Sticker löschen"
              onClick={() => void deleteSticker(st.id)}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="sticker-add"
          onClick={() => stickerInputRef.current?.click()}
          aria-label="Sticker hinzufügen"
        >
          +
        </button>
      </div>
    </div>
  ) : null;

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
      <input
        ref={stickerInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) setStickerFile(f);
        }}
      />
      <button className="attach-btn" title="Anhang" onClick={() => fileInputRef.current?.click()}>
        <IconAttach />
      </button>
      <button
        className={`attach-btn${stickerPanel ? ' active' : ''}`}
        title="Sticker"
        aria-expanded={stickerPanel}
        onClick={() => setStickerPanel((v) => !v)}
      >
        <IconSticker />
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
                            {item.last ? lastPreview(item.last) : hasSession(item.contact) ? 'Verbunden' : 'Neu — sag Hallo'}
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
              className={`bubble ${m.mine ? 'mine' : 'theirs'}${m.file && isSticker(m.file) ? ' is-sticker' : m.file && (m.file.mime.startsWith('image/') || m.file.mime.startsWith('video/')) ? ' has-file' : ''}`}
            >
              {m.file ? (
                isSticker(m.file) ? (
                  <img className="bubble-sticker" src={`data:${m.file.mime};base64,${m.file.dataB64}`} alt="Sticker" />
                ) : m.file.mime.startsWith('video/') ? (
                  <video
                    className="bubble-video"
                    src={`data:${m.file.mime};base64,${m.file.dataB64}`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : m.file.mime.startsWith('image/') ? (
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

        {stickerCropEl}
        {stickerPanelEl}
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
              className={`bubble ${m.mine ? 'mine' : 'theirs'}${m.file && isSticker(m.file) ? ' is-sticker' : m.file && (m.file.mime.startsWith('image/') || m.file.mime.startsWith('video/')) ? ' has-file' : ''}`}
            >
              {!m.mine && m.sender && <div className="bubble-sender">{m.sender}</div>}
              {m.file ? (
                isSticker(m.file) ? (
                  <img className="bubble-sticker" src={`data:${m.file.mime};base64,${m.file.dataB64}`} alt="Sticker" />
                ) : m.file.mime.startsWith('video/') ? (
                  <video
                    className="bubble-video"
                    src={`data:${m.file.mime};base64,${m.file.dataB64}`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : m.file.mime.startsWith('image/') ? (
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
        {stickerCropEl}
        {stickerPanelEl}
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
              <b>Persönlich:</b> Code antippen für Vollbild, der andere scannt ihn.
              <br />
              <b>Aus der Ferne:</b> teilen — der Kontakt fügt dich per „Aus Zwischenablage verbinden“ hinzu.
            </p>
            <div className="link-box">{shareLink}</div>
            <div className="share-actions">
              <button className="btn btn-primary" onClick={() => void shareContactCode()}>
                {shared ? 'Kopiert ✓' : 'Code teilen'}
              </button>
              <button className="btn btn-outline" onClick={() => void copyLink()}>
                {copied ? 'Kopiert ✓' : 'Kopieren'}
              </button>
            </div>
          </div>

          <div className="divider">
            <div className="l" />
            <span>ODER</span>
            <div className="l" />
          </div>

          <div className="sect-lbl">Kontakt hinzufügen</div>
          <div className="card pad16">
            <button className="btn btn-primary" onClick={() => void pasteAndAdd()}>
              Aus Zwischenablage verbinden
            </button>
            <button className="btn btn-outline scan-btn" style={{ marginTop: 10 }} onClick={() => setScanning(true)}>
              <IconCamera /> QR-Code scannen
            </button>
            <div className="or-tiny">oder Link / Token manuell einfügen</div>
            <textarea
              className="paste-box"
              placeholder="Link oder Bundle-Token einfügen"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
            />
            <button className="btn btn-ghost" onClick={() => void addBundle(addInput)}>
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

          {c.pendingMaster && (
            <div className="contact-warn door">
              <div className="cw-text">
                <b>Neue Identität behauptet</b>
                <span>
                  Dieser Kontakt meldet sich mit einem neuen Identitätsschlüssel — etwa nach einem Gerätewechsel.
                  Übernimm ihn nur, wenn du sicher bist, dass es wirklich diese Person ist. Danach ist ein neuer
                  Sicherheitsnummer-Vergleich fällig.
                </span>
              </div>
              <button className="btn btn-primary sm" onClick={() => void acceptNewIdentity()}>
                Neue Identität akzeptieren
              </button>
            </div>
          )}

          {c.staleIdentity && (
            <div className="contact-warn door">
              <div className="cw-text">
                <b>Verbindung veraltet</b>
                <span>
                  Du hast ein Gerät gekoppelt, seitdem hat sich deine Identität geändert. Dieser Kontakt kennt noch
                  die alte. „Neu verbinden“ baut die Sitzung frisch auf — die Gegenseite sieht dann eine
                  Identitätswarnung und muss dich neu bestätigen.
                </span>
              </div>
              <button className="btn btn-primary sm" onClick={() => void reconnectStaleContact()}>
                Neu verbinden
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

          <div className="sect-lbl" style={{ marginTop: 22 }}>Geräte</div>
          <div className="backup-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                resetLink();
                setLinkView('menu');
              }}
            >
              Gerät koppeln
            </button>
          </div>
          <div className="info-note" style={{ textAlign: 'left' }}>
            <span className="g">
              <IconInfo />
            </span>
            <p>
              Verbinde ein zweites Gerät mit deiner Identität — per QR-Code, mit einem <b>Emoji-Abgleich</b> gegen
              Man-in-the-Middle. Der Hauptschlüssel verlässt dabei nie dein Hauptgerät.
            </p>
          </div>

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
        {linkOverlay}
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
