<script lang="ts">
  import { createVault, unlockVault, seal, open, utf8, WrongPassphraseError } from './crypto';
  import { loadHeader, saveHeader, loadRecord, saveRecord } from './lib/db';

  // Etappe-1-Demo: beweist den At-Rest-Kern (Argon2id + KEK/DEK + AES-256-GCM)
  // end-to-end. Der Messaging-Layer (X3DH + Double Ratchet) folgt in Etappe 3–4.

  type Phase = 'loading' | 'create' | 'unlock' | 'open';

  let phase = $state<Phase>('loading');
  let passphrase = $state('');
  let busy = $state(false);
  let status = $state('');
  let statusKind = $state<'' | 'ok' | 'err'>('');

  let dek: CryptoKey | null = null;
  let note = $state('');
  let sealedPreview = $state('');

  const DEMO_KEY = 'demo-note';
  // AAD bindet Record-Typ + Version an den Auth-Tag (Anti-Swapping).
  const DEMO_AAD = utf8.encode('scytale:demo-note:v1');

  (async () => {
    const header = await loadHeader();
    phase = header ? 'unlock' : 'create';
  })();

  function setStatus(msg: string, kind: '' | 'ok' | 'err' = '') {
    status = msg;
    statusKind = kind;
  }

  async function onCreate() {
    if (passphrase.length < 8) return setStatus('Mindestens 8 Zeichen.', 'err');
    busy = true;
    setStatus('Leite Schlüssel ab (Argon2id, 256 MiB)…');
    try {
      const { header, dek: newDek } = await createVault(passphrase);
      await saveHeader(header);
      dek = newDek;
      passphrase = '';
      phase = 'open';
      setStatus('Tresor erstellt & entsperrt.', 'ok');
    } catch (e) {
      setStatus('Fehler: ' + (e as Error).message, 'err');
    } finally {
      busy = false;
    }
  }

  async function onUnlock() {
    busy = true;
    setStatus('Entsperre (Argon2id)…');
    try {
      const header = await loadHeader();
      if (!header) throw new Error('Kein Tresor gefunden.');
      dek = await unlockVault(passphrase, header);
      passphrase = '';
      phase = 'open';
      setStatus('Entsperrt.', 'ok');
      await loadNote();
    } catch (e) {
      if (e instanceof WrongPassphraseError) setStatus('Falsche Passphrase.', 'err');
      else setStatus('Fehler: ' + (e as Error).message, 'err');
    } finally {
      busy = false;
    }
  }

  async function onSave() {
    if (!dek) return;
    busy = true;
    try {
      const record = await seal(dek, utf8.encode(note), DEMO_AAD);
      await saveRecord(DEMO_KEY, record);
      sealedPreview = [...record.ct.slice(0, 24)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
      setStatus('Verschlüsselt in IndexedDB gespeichert.', 'ok');
    } catch (e) {
      setStatus('Fehler: ' + (e as Error).message, 'err');
    } finally {
      busy = false;
    }
  }

  async function loadNote() {
    if (!dek) return;
    const record = await loadRecord(DEMO_KEY);
    if (!record) return;
    try {
      note = utf8.decode(await open(dek, record, DEMO_AAD));
      sealedPreview = [...record.ct.slice(0, 24)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
    } catch {
      setStatus('Entschlüsselung fehlgeschlagen (Tag ungültig).', 'err');
    }
  }

  function lock() {
    dek = null;
    note = '';
    sealedPreview = '';
    phase = 'unlock';
    setStatus('Gesperrt. DEK aus dem RAM entfernt.');
  }
</script>

<h1>SCYTALE</h1>
<p class="sub">Ende-zu-Ende verschlüsselt · Client-Side · Etappe 1: At-Rest-Kern</p>

{#if phase === 'loading'}
  <div class="panel">Lade Tresor…</div>
{:else if phase === 'create'}
  <div class="panel">
    <label for="pp">Neue Passphrase (min. 8 Zeichen)</label>
    <input id="pp" type="password" bind:value={passphrase} autocomplete="new-password" />
    <button onclick={onCreate} disabled={busy}>Tresor erstellen</button>
    <div class="status {statusKind}">{status}</div>
  </div>
{:else if phase === 'unlock'}
  <div class="panel">
    <label for="pp">Passphrase</label>
    <input
      id="pp"
      type="password"
      bind:value={passphrase}
      autocomplete="current-password"
      onkeydown={(e) => e.key === 'Enter' && onUnlock()}
    />
    <button onclick={onUnlock} disabled={busy}>Entsperren</button>
    <div class="status {statusKind}">{status}</div>
  </div>
{:else if phase === 'open'}
  <div class="panel">
    <label for="note">Geheime Notiz (wird AES-256-GCM verschlüsselt)</label>
    <textarea id="note" bind:value={note}></textarea>
    <button onclick={onSave} disabled={busy}>Verschlüsselt speichern</button>
    <button class="ghost" onclick={lock}>Sperren</button>
    <div class="status {statusKind}">{status}</div>
    {#if sealedPreview}
      <div class="mono-out">Ciphertext (erste 24 Byte): {sealedPreview}…</div>
    {/if}
  </div>
{/if}
