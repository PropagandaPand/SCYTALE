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
import { IconLock } from './icons';

type Phase = 'loading' | 'create' | 'unlock' | 'open';
type StatusKind = '' | 'ok' | 'err';
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

  async function submit() {
    if (lockState === 'locked' || busy) return;
    if (phase === 'create' && passphrase.length < 8) return say('Mindestens 8 Zeichen.', 'err');
    setBusy(true);
    setLockState('busy');
    say(phase === 'create' ? 'Erzeuge Tresor (Argon2id · 256 MiB)…' : 'Entsperre (Argon2id)…');
    try {
      const newDek = phase === 'create' ? await createBoundVault(passphrase) : await unlockBoundVault(passphrase);
      setLockState('unlocking');
      setPassphrase('');
      window.setTimeout(() => {
        setDek(newDek);
        setPhase('open');
        say('');
        setLockState('idle');
      }, 260);
    } catch (e) {
      if (e instanceof LockedOutError) {
        beginLockoutCountdown(e.remainingMs);
        say('');
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
    say('Gesperrt.');
  }, []);

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
  const showForm = (phase === 'create' || phase === 'unlock') && lockState !== 'fatal';

  return (
    <>
      <div className="lock">
        <img className="lock-logo" src="/scytale-icon.svg" alt="SCYTALE" />
        <div className="lock-brand">SCYTALE</div>
        <p className="lock-sub">Ende-zu-Ende verschlüsselt · client-side</p>

        {showForm && (
          <div className="lock-form">
            <div className="field-lbl">Passphrase</div>
            <div className={`pass-field ${lockState === 'deny' ? 'deny' : ''}`}>
              <span className="glyph">
                <IconLock size={15} />
              </span>
              <input
                type="password"
                value={passphrase}
                autoComplete={phase === 'create' ? 'new-password' : 'current-password'}
                placeholder="············"
                disabled={lockState === 'locked'}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submit()}
              />
            </div>
            <button
              className="btn btn-primary btn-tall"
              onClick={() => void submit()}
              disabled={busy || lockState === 'locked'}
            >
              {phase === 'create' ? 'Tresor erstellen' : 'Tresor entsperren'}
            </button>
            {lockState === 'locked' ? (
              <div className="lock-status err">Gesperrt — noch {seconds}s (zu viele Fehlversuche).</div>
            ) : (
              <div className={`lock-status ${statusKind}`}>{status}</div>
            )}
          </div>
        )}

        {lockState === 'fatal' && <div className="lock-status err" style={{ marginTop: 24 }}>{status}</div>}

        <div className="lock-foot">
          <span className="d" />
          Argon2id · 256 MiB · non-extractable DEK
        </div>
      </div>
      <ReloadPrompt />
    </>
  );
}
