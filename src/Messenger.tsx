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
import { encodeBundle, decodeBundle, type Bytes, type IdentityKeys } from './crypto';
import {
  makeContact,
  sendMessage,
  receiveMessage,
  type Contact,
  type PreKeyLookup,
} from './lib/session';
import { saveContact, loadContacts } from './lib/store';
import { RelayClient, type RelayStatus } from './lib/relay';
import { makeQr } from './lib/qr';

interface Props {
  dek: CryptoKey;
  onLock: () => void;
}

interface ChatMessage {
  mine: boolean;
  text: string;
  ts: number;
}

const shortFp = (fp: string) => (fp ? fp.split(' ').slice(0, 3).join(' ') + ' …' : '…');

// Accept either a raw bundle token or a full deep-link containing #add=<token>.
function extractToken(input: string): string {
  const m = input.match(/[#?&]add=([^&\s]+)/);
  return (m ? m[1] : input).trim();
}

export function Messenger({ dek, onLock }: Props) {
  const identityRef = useRef<IdentityKeys | null>(null);
  const prekeysRef = useRef<PreKeyState | null>(null);
  const lookupRef = useRef<PreKeyLookup | null>(null);
  const relaysRef = useRef<Map<string, RelayClient>>(new Map());
  const contactsRef = useRef<Contact[]>([]);
  const initedRef = useRef(false);

  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [fingerprint, setFingerprint] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [statuses, setStatuses] = useState<Record<string, RelayStatus>>({});
  const [showShare, setShowShare] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function connectRelay(c: Contact) {
    if (relaysRef.current.has(c.roomId)) return;
    const client = new RelayClient(
      c.roomId,
      (bytes) => void onCipher(c.roomId, bytes),
      (s) => setStatuses((prev) => ({ ...prev, [c.roomId]: s })),
    );
    relaysRef.current.set(c.roomId, client);
    client.connect();
  }

  async function onCipher(roomId: string, bytes: Bytes) {
    const contact = contactsRef.current.find((c) => c.roomId === roomId);
    const id = identityRef.current;
    const lookup = lookupRef.current;
    if (!contact || !id || !lookup) return;
    try {
      const wasNew = contact.ratchet === null;
      const text = await receiveMessage(id, contact, bytes, lookup);
      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), { mine: false, text, ts: Date.now() }],
      }));
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
        setActiveRoom(contact.roomId);
        setError('Kontakt existiert bereits.');
        return;
      }
      contactsRef.current = [...contactsRef.current, contact];
      setMessages((prev) => ({ ...prev, [contact.roomId]: [] }));
      await saveContact(dek, contact);
      connectRelay(contact);
      setActiveRoom(contact.roomId);
      setAddInput('');
      bump();
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

      const cs = await loadContacts(dek);
      contactsRef.current = cs;
      const msgInit: Record<string, ChatMessage[]> = {};
      for (const c of cs) {
        msgInit[c.roomId] = [];
        connectRelay(c);
      }
      setMessages(msgInit);
      bump();

      // Auto-import a contact from a deep-link (#add=<token>), then clean the URL.
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
    const el = document.getElementById('msglist');
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeRoom]);

  async function onSend() {
    setError('');
    const text = msgInput.trim();
    const id = identityRef.current;
    if (!text || !activeRoom || !id) return;
    const contact = contactsRef.current.find((c) => c.roomId === activeRoom);
    const relay = relaysRef.current.get(activeRoom);
    if (!contact || !relay) return;
    try {
      const envelope = await sendMessage(id, contact, text);
      relay.send(envelope);
      setMessages((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] ?? []), { mine: true, text, ts: Date.now() }],
      }));
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
      /* clipboard may be blocked; the textarea is selectable anyway */
    }
  }

  const contacts = contactsRef.current;
  const activeContact = contacts.find((c) => c.roomId === activeRoom) ?? null;

  return (
    <>
      <header className="bar">
        <div>
          <div className="brand">SCYTALE</div>
          <div className="mono-out">Ich: {shortFp(fingerprint)}</div>
        </div>
        <button className="ghost slim" onClick={onLock}>
          Sperren
        </button>
      </header>

      {error && <div className="status err">{error}</div>}

      {!activeContact ? (
        <>
          <div className="panel">
            <button className="ghost" onClick={() => setShowShare((v) => !v)}>
              {showShare ? 'Meinen Link verbergen' : 'Mich teilen (QR / Link)'}
            </button>
            {showShare && (
              <>
                <p className="hint">
                  Lass dein Gegenüber den QR mit der Handy-Kamera scannen — oder schick den Link.
                  Ein Tap fügt dich hinzu.
                </p>
                {qrDataUrl && (
                  <img className="qr" src={qrDataUrl} alt="QR-Code deines Kontakt-Links" />
                )}
                <textarea readOnly rows={3} className="token" value={shareLink} />
                <button onClick={copyLink}>{copied ? 'Kopiert ✓' : 'Link kopieren'}</button>
              </>
            )}
          </div>

          <div className="panel">
            <div className="field-label">Kontakt hinzufügen (Link oder Bundle einfügen)</div>
            <textarea
              rows={3}
              className="token"
              placeholder="Link oder Bundle-Token des Kontakts…"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
            />
            <button onClick={() => void addBundle(addInput)}>Hinzufügen</button>
          </div>

          {contacts.length > 0 && (
            <div className="panel">
              <div className="field-label">Kontakte</div>
              {contacts.map((c) => (
                <button key={c.roomId} className="contact" onClick={() => setActiveRoom(c.roomId)}>
                  <span className={`dot ${statuses[c.roomId] ?? 'closed'}`} />
                  <span className="mono-out">{shortFp(c.peerFingerprint)}</span>
                  <span className="badge">{c.ratchet ? 'aktiv' : 'neu'}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="panel chat">
          <div className="chat-head">
            <button className="ghost slim" onClick={() => setActiveRoom(null)}>
              ← Zurück
            </button>
            <span className="mono-out">{shortFp(activeContact.peerFingerprint)}</span>
            <span className={`dot ${statuses[activeContact.roomId] ?? 'closed'}`} />
          </div>
          <div id="msglist" className="msglist">
            {(messages[activeContact.roomId] ?? []).map((m) => (
              <div key={m.ts} className={`msg ${m.mine ? 'mine' : 'theirs'}`}>
                {m.text}
              </div>
            ))}
            {!(messages[activeContact.roomId]?.length) && (
              <div className="mono-out empty">Noch keine Nachrichten. Sag Hallo — verschlüsselt.</div>
            )}
          </div>
          <div className="composer">
            <input
              value={msgInput}
              placeholder="Nachricht…"
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <button className="send" onClick={onSend}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
