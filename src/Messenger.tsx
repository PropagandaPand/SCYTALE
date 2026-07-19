import { useEffect, useReducer, useRef, useState } from 'react';
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
  pairwiseSafetyNumber,
  type Bytes,
  type IdentityKeys,
} from './crypto';
import {
  makeContact,
  makeContactFromHeader,
  sendMessage,
  receiveEnvelope,
  inboxRoom,
  type Contact,
  type PreKeyLookup,
} from './lib/session';
import { saveContact, loadContacts } from './lib/store';
import { loadMessages, saveMessages, type ChatMessage } from './lib/messages';
import { RelayClient, type RelayStatus } from './lib/relay';
import { makeQr } from './lib/qr';
import { Identicon } from './Identicon';
import { IconLock, IconShield, IconSearch, IconBack, IconPlus, IconSend, IconDoubleCheck, IconInfo } from './icons';

interface Props {
  dek: CryptoKey;
  onLock: () => void;
}

type View = 'list' | 'chat' | 'add' | 'verify';

const shortFp = (fp: string) => (fp ? fp.split(' ').slice(0, 3).join(' ') + ' …' : '…');
const displayName = (c: Contact) => c.nickname?.trim() || shortFp(c.peerFingerprint);

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
  const viewRef = useRef<View>('list');
  const activeRoomRef = useRef<string | null>(null);
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
  const [safetyNumber, setSafetyNumber] = useState('');
  const [safetyQr, setSafetyQr] = useState('');

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const commitMessages = () => setMessages({ ...messagesRef.current });

  async function appendMessage(roomId: string, msg: ChatMessage) {
    messagesRef.current[roomId] = [...(messagesRef.current[roomId] ?? []), msg];
    commitMessages();
    await saveMessages(dek, roomId, messagesRef.current[roomId]);
  }

  // Listen on our own inbox — derived from our identity, so no peer needed.
  function connectInbox(room: string) {
    if (relaysRef.current.has(room)) return;
    const client = new RelayClient(room, (bytes) => void onInbox(bytes), () => {});
    relaysRef.current.set(room, client);
    client.connect();
  }

  // A send channel to a contact's inbox (they hold no code of ours to reach us
  // here; we reach them). Its status is the reachability dot for that contact.
  async function connectSend(contact: Contact) {
    const room = await inboxRoom(contact.peerDhPub);
    sendRoomRef.current.set(contact.roomId, room);
    if (relaysRef.current.has(room)) return;
    const client = new RelayClient(
      room,
      () => {}, // send-only; inbound arrives on our own inbox
      (s) => setStatuses((prev) => ({ ...prev, [contact.roomId]: s })),
    );
    relaysRef.current.set(room, client);
    client.connect();
  }

  async function onInbox(bytes: Bytes) {
    const id = identityRef.current;
    const lookup = lookupRef.current;
    if (!id || !lookup) return;

    let env;
    try {
      env = await decodeEnvelope(bytes);
    } catch {
      return;
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

    try {
      const wasNew = contact.ratchet === null;
      const text = await receiveEnvelope(id, contact, env, lookup);
      await appendMessage(contact.roomId, { mine: false, text, ts: Date.now() });
      if (!(viewRef.current === 'chat' && activeRoomRef.current === contact.roomId)) {
        unreadRef.current[contact.roomId] = (unreadRef.current[contact.roomId] ?? 0) + 1;
      }
      await saveContact(dek, contact);
      if (wasNew && prekeysRef.current) await savePreKeys(dek, prekeysRef.current);
      bump();
    } catch (e) {
      setError('Empfang fehlgeschlagen: ' + (e as Error).message);
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

      const token = await encodeBundle(currentBundle(id, pre));
      const link = `${location.origin}/#add=${token}`;
      setShareLink(link);
      makeQr(link).then(setQrDataUrl).catch(() => undefined);

      connectInbox(await inboxRoom(id.dh.publicKey));

      const cs = await loadContacts(dek);
      contactsRef.current = cs;
      for (const c of cs) {
        messagesRef.current[c.roomId] = await loadMessages(dek, c.roomId);
        await connectSend(c);
      }
      commitMessages();
      bump();

      const hashMatch = location.hash.match(/[#&]add=([^&]+)/);
      if (hashMatch) {
        history.replaceState(null, '', location.pathname + location.search);
        await addBundle(decodeURIComponent(hashMatch[1]));
      }
    })();

    return () => {
      for (const r of relaysRef.current.values()) r.close();
      relaysRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = document.getElementById('msgs');
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeRoom, view]);

  useEffect(() => {
    setRenaming(false);
  }, [activeRoom]);

  function openChat(roomId: string) {
    setError('');
    setActiveRoom(roomId);
    activeRoomRef.current = roomId;
    unreadRef.current[roomId] = 0;
    setView('chat');
    bump();
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
    if (!text || !activeRoom || !id) return;
    const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
    if (!contact) return;
    try {
      const envelope = await sendMessage(id, contact, text);
      let room = sendRoomRef.current.get(contact.roomId);
      if (!room) {
        await connectSend(contact);
        room = sendRoomRef.current.get(contact.roomId);
      }
      const relay = room ? relaysRef.current.get(room) : undefined;
      relay?.send(envelope);
      await appendMessage(activeRoom, { mine: true, text, ts: Date.now() });
      setMsgInput('');
      await saveContact(dek, contact);
      bump();
    } catch (e) {
      setError('Senden fehlgeschlagen: ' + (e as Error).message);
    }
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

  async function openVerify() {
    const c = contactsRef.current.find((x) => x.roomId === activeRoom);
    const id = identityRef.current;
    setView('verify');
    if (!c || !id) return;
    const sn = await pairwiseSafetyNumber(id.sign.publicKey, id.dh.publicKey, c.peerSignPub, c.peerDhPub);
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

  const contacts = contactsRef.current;
  const activeContact = contacts.find((c) => c.roomId === activeRoom) ?? null;
  const st = (roomId: string) => statuses[roomId] ?? 'closed';

  // ── Contact list ──────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <>
        <div className="list">
          <div className="list-top">
            <div className="list-head">
              <div className="list-brand">
                <img src="/scytale-icon.svg" alt="" />
                <div>
                  <div className="t">SCYTALE</div>
                  <div className="fp">{shortFp(fingerprint)}</div>
                </div>
              </div>
              <div className="icon-btns">
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
            {contacts.length === 0 ? (
              <div className="list-empty">
                Noch keine Kontakte.<br />Tippe oben auf <b>+</b>, um dich zu teilen oder jemanden hinzuzufügen.
              </div>
            ) : (
              contacts.map((c) => {
                const last = messagesRef.current[c.roomId]?.at(-1);
                const unread = unreadRef.current[c.roomId] ?? 0;
                return (
                  <button key={c.roomId} className="conv-row" onClick={() => openChat(c.roomId)}>
                    <div className="avatar-wrap">
                      <div className="avatar">
                        <Identicon seed={c.roomId} />
                      </div>
                      <span className={`sdot ${st(c.roomId)}`} />
                    </div>
                    <div className="conv-main">
                      <div className="conv-line1">
                        <span className="conv-name">{displayName(c)}</span>
                        {c.verified && (
                          <span className="verified-badge">
                            <IconShield size={14} filled />
                          </span>
                        )}
                        <span className="conv-ts">{fmtListTs(last?.ts)}</span>
                      </div>
                      <div className="conv-line2">
                        <span className="conv-last">
                          {last ? last.text : c.ratchet ? 'Verbunden' : 'Neu — sag Hallo'}
                        </span>
                        {unread > 0 && <span className="unread">{unread}</span>}
                      </div>
                    </div>
                  </button>
                );
              })
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
      <div className="chat">
        <div className="chat-top">
          <button className="chat-back" onClick={() => setView('list')}>
            <IconBack />
          </button>
          <div className="avatar sm">
            <Identicon seed={activeContact.roomId} />
          </div>
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
        </div>

        <div id="msgs" className="msgs">
          <div className="enc-pill">
            <span className="g">
              <IconLock size={10} />
            </span>
            Verschlüsselt · nur ihr beide lest mit
          </div>
          {msgs.map((m, i) => (
            <div key={`${m.ts}-${i}`} className={`bubble ${m.mine ? 'mine' : 'theirs'}`}>
              {m.text}
              <span className="meta">
                {fmtClock(m.ts)}
                {m.mine && <IconDoubleCheck size={13} />}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="err-note">{error}</div>}

        <div className="composer">
          <div className="composer-pill">
            <input
              value={msgInput}
              placeholder="Verschlüsselte Nachricht…"
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void onSend()}
            />
          </div>
          <button className="send-btn" onClick={() => void onSend()}>
            <IconSend />
          </button>
        </div>
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
            <div className="qr-card">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR-Code deines Kontakt-Links" /> : <span className="ph">QR…</span>}
            </div>
            <p className="share-hint">
              Scannen lassen — oder Link teilen.
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

  return null;
}
