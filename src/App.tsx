import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createBoundVault,
  unlockBoundVault,
  hasVault,
  WrongPassphraseError,
  DeviceBindingMissingError,
  LockedOutError,
  lockoutStatus,
} from './lib/vaultService';
import { cryptoSelfTest } from './lib/selftest';
import { Messenger } from './Messenger';
import { ReloadPrompt } from './ReloadPrompt';
import { CipherVault } from './CipherVault';

type Phase = 'loading' | 'create' | 'unlock' | 'open';
type StatusKind = '' | 'ok' | 'err';
// Vault state machine — drives the (upcoming) animated lock as well.
type LockState = 'idle' | 'busy' | 'deny' | 'locked' | 'unlocking' | 'tamper' | 'fatal';

const IDLE_LOCK_MS = 5 * 60 * 1000;

export function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<StatusKind>('');
  const [lockState, setLockState] = useState<LockState>('idle');
  const [lockRemaining, setLockRemaining] = useState(0);
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const lockTimer = useRef<number | null>(null);

  function say(msg: string, kind: StatusKind = '') {
    setStatus(msg);
    setStatusKind(kind);
  }

  // Startup: crypto self-test, then decide create vs unlock.
  useEffect(() => {
    void (async () => {
      if (!(await cryptoSelfTest())) {
        setLockState('fatal');
        say('CRYPT ERROR — WebCrypto-Selbsttest fehlgeschlagen. Aus Sicherheitsgründen gesperrt.', 'err');
        return;
      }
      setPhase((await hasVault()) ? 'unlock' : 'create');
      const lk = await lockoutStatus();
      if (lk.remainingMs > 0) beginLockoutCountdown(lk.remainingMs);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginLockoutCountdown(ms: number) {
    setLockState('locked');
    setLockRemaining(ms);
    if (lockTimer.current) clearInterval(lockTimer.current);
    lockTimer.current = window.setInterval(async () => {
      const lk = await lockoutStatus();
      setLockRemaining(lk.remainingMs);
      if (lk.remainingMs <= 0) {
        if (lockTimer.current) clearInterval(lockTimer.current);
        lockTimer.current = null;
        setLockState('idle');
        say('');
      }
    }, 500);
  }

  async function onCreate() {
    if (passphrase.length < 8) return say('Mindestens 8 Zeichen.', 'err');
    setBusy(true);
    setLockState('busy');
    say('Leite Schlüssel ab (Argon2id, 256 MiB) & binde an dieses Gerät…');
    try {
      const newDek = await createBoundVault(passphrase);
      setLockState('unlocking');
      setPassphrase('');
      window.setTimeout(() => {
        setDek(newDek);
        setPhase('open');
        say('');
      }, 500);
    } catch (e) {
      setLockState('deny');
      say('Fehler: ' + (e as Error).message, 'err');
      setBusy(false);
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock() {
    if (lockState === 'locked') return;
    setBusy(true);
    setLockState('busy');
    say('Entsperre (Argon2id)…');
    try {
      const newDek = await unlockBoundVault(passphrase);
      setLockState('unlocking');
      setPassphrase('');
      window.setTimeout(() => {
        setDek(newDek);
        setPhase('open');
        say('');
      }, 500);
    } catch (e) {
      if (e instanceof LockedOutError) {
        beginLockoutCountdown(e.remainingMs);
        say('', 'err');
      } else if (e instanceof DeviceBindingMissingError) {
        setLockState('tamper');
        say(e.message, 'err');
      } else if (e instanceof WrongPassphraseError) {
        setLockState('deny');
        say('Falsche Passphrase.', 'err');
      } else {
        setLockState('deny');
        say('Fehler: ' + (e as Error).message, 'err');
      }
      setBusy(false);
    }
  }

  const lock = useCallback(() => {
    setDek(null);
    setPhase('unlock');
    setLockState('idle');
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

  const seconds = Math.ceil(lockRemaining / 1000);

  return (
    <>
      <h1>SCYTALE</h1>
      <p className="sub">Ende-zu-Ende verschlüsselt · Client-Side</p>

      <CipherVault state={lockState} />

      {lockState === 'fatal' ? (
        <div className="panel">
          <div className="status err">{status}</div>
        </div>
      ) : (
        (phase === 'create' || phase === 'unlock') && (
          <div className="panel">
            <label htmlFor="pp">
              {phase === 'create' ? 'Neue Passphrase (min. 8 Zeichen)' : 'Passphrase'}
            </label>
            <input
              id="pp"
              type="password"
              value={passphrase}
              autoComplete={phase === 'create' ? 'new-password' : 'current-password'}
              disabled={lockState === 'locked'}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (phase === 'create' ? onCreate() : onUnlock())}
            />
            <button
              onClick={phase === 'create' ? onCreate : onUnlock}
              disabled={busy || lockState === 'locked'}
            >
              {phase === 'create' ? 'Tresor erstellen' : 'Entsperren'}
            </button>
            {lockState === 'locked' ? (
              <div className="status err">Gesperrt — noch {seconds}s (zu viele Fehlversuche).</div>
            ) : (
              <div className={`status ${statusKind}`}>{status}</div>
            )}
          </div>
        )
      )}
      <ReloadPrompt />
    </>
  );
}
