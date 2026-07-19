<script lang="ts">
  import { loadOrCreateIdentity, fingerprintOf } from './lib/identity';
  import {
    loadOrCreatePreKeys,
    savePreKeys,
    currentBundle,
    findSignedPreKey,
    consumeOneTimePreKey,
    type PreKeyState,
  } from './lib/prekeys';
  import { encodeBundle, decodeBundle, type IdentityKeys } from './crypto';
  import {
    makeContact,
    sendMessage,
    receiveMessage,
    type Contact,
    type PreKeyLookup,
  } from './lib/session';
  import { saveContact, loadContacts } from './lib/store';
  import { RelayClient, type RelayStatus } from './lib/relay';

  interface Props {
    dek: CryptoKey;
    onLock: () => void;
  }
  let { dek, onLock }: Props = $props();

  interface ChatMessage {
    mine: boolean;
    text: string;
    ts: number;
  }

  let identity: IdentityKeys | null = null;
  let prekeys: PreKeyState | null = null;

  let fingerprint = $state('');
  let bundleToken = $state('');
  let contacts = $state<Contact[]>([]);
  let activeRoom = $state<string | null>(null);
  let messages = $state<Record<string, ChatMessage[]>>({});
  let statuses = $state<Record<string, RelayStatus>>({});
  let showBundle = $state(false);
  let addInput = $state('');
  let msgInput = $state('');
  let error = $state('');

  const relays = new Map<string, RelayClient>();

  let lookup: PreKeyLookup;

  $effect(() => {
    // Auto-scroll the active message list to the bottom on new messages.
    if (activeRoom && messages[activeRoom]) {
      queueMicrotask(() => {
        const el = document.getElementById('msglist');
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  });

  (async () => {
    identity = await loadOrCreateIdentity(dek);
    prekeys = await loadOrCreatePreKeys(dek, identity);
    fingerprint = await fingerprintOf(identity);
    bundleToken = await encodeBundle(currentBundle(identity, prekeys));

    lookup = {
      signedPreKey: (id) => findSignedPreKey(prekeys!, id)?.keyPair,
      consumeOneTimePreKey: (id) => {
        if (id == null) return undefined;
        return consumeOneTimePreKey(prekeys!, id)?.keyPair.privateKey;
      },
    };

    contacts = await loadContacts(dek);
    for (const c of contacts) {
      messages[c.roomId] ??= [];
      connectRelay(c);
    }
  })();

  function connectRelay(c: Contact) {
    if (relays.has(c.roomId)) return;
    const client = new RelayClient(
      c.roomId,
      (bytes) => void onCipher(c.roomId, bytes),
      (s) => {
        statuses[c.roomId] = s;
      },
    );
    relays.set(c.roomId, client);
    client.connect();
  }

  async function onCipher(roomId: string, bytes: Uint8Array) {
    const contact = contacts.find((c) => c.roomId === roomId);
    if (!contact || !identity) return;
    try {
      const wasNew = contact.ratchet === null;
      const text = await receiveMessage(identity, contact, bytes as Uint8Array<ArrayBuffer>, lookup);
      messages[roomId] = [...(messages[roomId] ?? []), { mine: false, text, ts: Date.now() }];
      contacts = [...contacts]; // trigger reactivity on the mutated contact
      await saveContact(dek, contact);
      if (wasNew && prekeys) await savePreKeys(dek, prekeys); // a one-time prekey was consumed
    } catch (e) {
      error = 'Empfang fehlgeschlagen: ' + (e as Error).message;
    }
  }

  async function onAddContact() {
    error = '';
    if (!identity) return;
    try {
      const bundle = await decodeBundle(addInput);
      const contact = await makeContact(identity.dh.publicKey, bundle);
      if (contacts.some((c) => c.roomId === contact.roomId)) {
        error = 'Kontakt existiert bereits.';
        activeRoom = contact.roomId;
        return;
      }
      contacts = [...contacts, contact];
      messages[contact.roomId] = [];
      await saveContact(dek, contact);
      connectRelay(contact);
      activeRoom = contact.roomId;
      addInput = '';
    } catch (e) {
      error = 'Ungültiges Bundle: ' + (e as Error).message;
    }
  }

  async function onSend() {
    error = '';
    const text = msgInput.trim();
    if (!text || !activeRoom || !identity) return;
    const contact = contacts.find((c) => c.roomId === activeRoom);
    const relay = relays.get(activeRoom);
    if (!contact || !relay) return;
    try {
      const envelope = await sendMessage(identity, contact, text);
      relay.send(envelope);
      messages[activeRoom] = [...(messages[activeRoom] ?? []), { mine: true, text, ts: Date.now() }];
      msgInput = '';
      contacts = [...contacts];
      await saveContact(dek, contact);
    } catch (e) {
      error = 'Senden fehlgeschlagen: ' + (e as Error).message;
    }
  }

  async function copyBundle() {
    try {
      await navigator.clipboard.writeText(bundleToken);
    } catch {
      /* clipboard may be blocked; the textarea is selectable anyway */
    }
  }

  const activeContact = $derived(contacts.find((c) => c.roomId === activeRoom) ?? null);
  const shortFp = (fp: string) => fp.split(' ').slice(0, 3).join(' ') + ' …';
</script>

<header class="bar">
  <div>
    <div class="brand">SCYTALE</div>
    <div class="mono-out">Ich: {fingerprint ? shortFp(fingerprint) : '…'}</div>
  </div>
  <button class="ghost slim" onclick={onLock}>Sperren</button>
</header>

{#if error}<div class="status err">{error}</div>{/if}

{#if !activeContact}
  <div class="panel">
    <button class="ghost" onclick={() => (showBundle = !showBundle)}>
      {showBundle ? 'Mein Bundle verbergen' : 'Mein Bundle zeigen (zum Teilen)'}
    </button>
    {#if showBundle}
      <textarea readonly rows="4" class="token">{bundleToken}</textarea>
      <button onclick={copyBundle}>Kopieren</button>
    {/if}
  </div>

  <div class="panel">
    <div class="field-label">Kontakt hinzufügen (Bundle einfügen)</div>
    <textarea bind:value={addInput} rows="4" class="token" placeholder="Bundle-Token des Kontakts…"></textarea>
    <button onclick={onAddContact}>Hinzufügen</button>
  </div>

  {#if contacts.length}
    <div class="panel">
      <div class="field-label">Kontakte</div>
      {#each contacts as c (c.roomId)}
        <button class="contact" onclick={() => (activeRoom = c.roomId)}>
          <span class="dot {statuses[c.roomId] ?? 'closed'}"></span>
          <span class="mono-out">{shortFp(c.peerFingerprint)}</span>
          <span class="badge">{c.ratchet ? 'aktiv' : 'neu'}</span>
        </button>
      {/each}
    </div>
  {/if}
{:else}
  <div class="panel chat">
    <div class="chat-head">
      <button class="ghost slim" onclick={() => (activeRoom = null)}>← Zurück</button>
      <span class="mono-out">{shortFp(activeContact.peerFingerprint)}</span>
      <span class="dot {statuses[activeContact.roomId] ?? 'closed'}"></span>
    </div>
    <div id="msglist" class="msglist">
      {#each messages[activeContact.roomId] ?? [] as m (m.ts)}
        <div class="msg {m.mine ? 'mine' : 'theirs'}">{m.text}</div>
      {/each}
      {#if !(messages[activeContact.roomId]?.length)}
        <div class="mono-out empty">Noch keine Nachrichten. Sag Hallo — verschlüsselt.</div>
      {/if}
    </div>
    <div class="composer">
      <input
        bind:value={msgInput}
        placeholder="Nachricht…"
        onkeydown={(e) => e.key === 'Enter' && onSend()}
      />
      <button class="send" onclick={onSend}>➤</button>
    </div>
  </div>
{/if}
