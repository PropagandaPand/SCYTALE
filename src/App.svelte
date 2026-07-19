<script lang="ts">
  import { createVault, unlockVault, WrongPassphraseError } from './crypto';
  import { loadHeader, saveHeader } from './lib/db';
  import Messenger from './Messenger.svelte';

  type Phase = 'loading' | 'create' | 'unlock' | 'open';

  let phase = $state<Phase>('loading');
  let passphrase = $state('');
  let busy = $state(false);
  let status = $state('');
  let statusKind = $state<'' | 'ok' | 'err'>('');
  let dek = $state<CryptoKey | null>(null);

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
      setStatus('');
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
      setStatus('');
    } catch (e) {
      if (e instanceof WrongPassphraseError) setStatus('Falsche Passphrase.', 'err');
      else setStatus('Fehler: ' + (e as Error).message, 'err');
    } finally {
      busy = false;
    }
  }

  function lock() {
    dek = null;
    phase = 'unlock';
    setStatus('Gesperrt. DEK aus dem RAM entfernt.');
  }
</script>

{#if phase === 'open' && dek}
  <Messenger {dek} onLock={lock} />
{:else}
  <h1>SCYTALE</h1>
  <p class="sub">Ende-zu-Ende verschlüsselt · Client-Side</p>

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
  {/if}
{/if}
