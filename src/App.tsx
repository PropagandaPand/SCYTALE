import { useCallback, useEffect, useState } from 'react';
import { createVault, unlockVault, WrongPassphraseError } from './crypto';
import { loadHeader, saveHeader } from './lib/db';
import { Messenger } from './Messenger';
import { ReloadPrompt } from './ReloadPrompt';

// Auto-lock after this much inactivity — the DEK is dropped from memory.
const IDLE_LOCK_MS = 5 * 60 * 1000;

type Phase = 'loading' | 'create' | 'unlock' | 'open';
type StatusKind = '' | 'ok' | 'err';

export function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<StatusKind>('');
  const [dek, setDek] = useState<CryptoKey | null>(null);

  useEffect(() => {
    void loadHeader().then((header) => setPhase(header ? 'unlock' : 'create'));
  }, []);

  function say(msg: string, kind: StatusKind = '') {
    setStatus(msg);
    setStatusKind(kind);
  }

  async function onCreate() {
    if (passphrase.length < 8) return say('Mindestens 8 Zeichen.', 'err');
    setBusy(true);
    say('Leite Schlüssel ab (Argon2id, 256 MiB)…');
    try {
      const { header, dek: newDek } = await createVault(passphrase);
      await saveHeader(header);
      setDek(newDek);
      setPassphrase('');
      setPhase('open');
      say('');
    } catch (e) {
      say('Fehler: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock() {
    setBusy(true);
    say('Entsperre (Argon2id)…');
    try {
      const header = await loadHeader();
      if (!header) throw new Error('Kein Tresor gefunden.');
      const newDek = await unlockVault(passphrase, header);
      setDek(newDek);
      setPassphrase('');
      setPhase('open');
      say('');
    } catch (e) {
      if (e instanceof WrongPassphraseError) say('Falsche Passphrase.', 'err');
      else say('Fehler: ' + (e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  const lock = useCallback(() => {
    setDek(null);
    setPhase('unlock');
    say('Gesperrt. DEK aus dem RAM entfernt.');
  }, []);

  // Auto-lock on inactivity while unlocked.
  useEffect(() => {
    if (phase !== 'open') return;
    let timer = window.setTimeout(lock, IDLE_LOCK_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = window.setTimeout(lock, IDLE_LOCK_MS);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    for (const e of events) window.addEventListener(e, reset, { passive: true });
    return () => {
      clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, reset);
    };
  }, [phase, lock]);

  if (phase === 'open' && dek) {
    return (
      <>
        <Messenger dek={dek} onLock={lock} />
        <ReloadPrompt />
      </>
    );
  }

  return (
    <>
      <h1>SCYTALE</h1>
      <p className="sub">Ende-zu-Ende verschlüsselt · Client-Side</p>

      {phase === 'loading' && <div className="panel">Lade Tresor…</div>}

      {phase === 'create' && (
        <div className="panel">
          <label htmlFor="pp">Neue Passphrase (min. 8 Zeichen)</label>
          <input
            id="pp"
            type="password"
            value={passphrase}
            autoComplete="new-password"
            onChange={(e) => setPassphrase(e.target.value)}
          />
          <button onClick={onCreate} disabled={busy}>
            Tresor erstellen
          </button>
          <div className={`status ${statusKind}`}>{status}</div>
        </div>
      )}

      {phase === 'unlock' && (
        <div className="panel">
          <label htmlFor="pp">Passphrase</label>
          <input
            id="pp"
            type="password"
            value={passphrase}
            autoComplete="current-password"
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
          />
          <button onClick={onUnlock} disabled={busy}>
            Entsperren
          </button>
          <div className={`status ${statusKind}`}>{status}</div>
        </div>
      )}
      <ReloadPrompt />
    </>
  );
}
