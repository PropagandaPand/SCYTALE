import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createBoundVault,
  unlockBoundVault,
  hasVault,
  WrongPassphraseError,
  DeviceBindingMissingError,
  LockedOutError,
  lockoutStatus,
  unlockWithBiometric,
  biometricAvailable,
  biometricEnrolled,
} from './lib/vaultService';
import { cryptoSelfTest } from './lib/selftest';
import { Messenger } from './Messenger';
import { ReloadPrompt } from './ReloadPrompt';
import { IconLock, IconEye, IconEyeOff } from './icons';

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
  const [canBiometric, setCanBiometric] = useState(false); // enrolled AND supported on this device
  const [showPass, setShowPass] = useState(false); // reveal the passphrase via the eye toggle
  const lockTimer = useRef<number | null>(null);
  const autoBioTriedRef = useRef(false); // auto-launch Face ID at most once per unlock-screen entry

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

  // Whether to offer the biometric button must be re-checked every time the unlock
  // screen appears (initial load AND after each lock) — not once at boot — or the
  // button goes stale the moment the user enables/disables Face ID in-session. When
  // it IS enrolled, auto-launch Face ID / Touch ID once on entry (with a graceful
  // fallback: if the platform blocks a gesture-less prompt, the passphrase form and
  // a manual retry button are already there).
  useEffect(() => {
    if (phase !== 'unlock') {
      autoBioTriedRef.current = false; // re-arm for the next time the screen appears
      return;
    }
    let alive = true;
    void (async () => {
      const [avail, enrolled] = await Promise.all([biometricAvailable(), biometricEnrolled()]);
      if (!alive) return;
      const can = avail && enrolled;
      setCanBiometric(can);
      if (can && !autoBioTriedRef.current) {
        autoBioTriedRef.current = true;
        void unlockBiometric();
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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

  // Shared success transition for every unlock path (create, passphrase, biometric).
  function openWith(newDek: CryptoKey) {
    if (lockTimer.current) {
      // A biometric unlock can succeed DURING a passphrase lockout (the biometric
      // factor isn't lockout-gated) — stop the countdown so it can't fire post-open.
      clearInterval(lockTimer.current);
      lockTimer.current = null;
    }
    setLockState('unlocking');
    setPassphrase('');
    window.setTimeout(() => {
      setDek(newDek);
      setPhase('open');
      say('');
      setLockState('idle');
      setBusy(false); // clear on SUCCESS too — otherwise busy leaks true for the
      // whole session and disables the button after the next auto-lock.
    }, 260);
  }

  async function unlockBiometric() {
    // Not gated on lockState==='locked': the biometric factor isn't lockout-gated
    // (see unlockWithBiometric). Only re-entrancy is guarded.
    if (busy) return;
    setBusy(true);
    setLockState('busy');
    say('Warte auf Face ID / Touch ID…');
    try {
      openWith(await unlockWithBiometric());
    } catch (e) {
      const err = e as { name?: string };
      if (err.name === 'NotAllowedError') {
        // User cancelled or it timed out — no error, just fall back to the form.
        say('');
      } else {
        // Show the error, but DON'T use 'deny' — that reddens the passphrase field,
        // and no passphrase was even tried. Keep the form neutral and usable.
        say('Biometrie fehlgeschlagen — bitte Passphrase nutzen.', 'err');
      }
      setLockState('idle');
      setBusy(false);
    }
  }

  async function submit() {
    if (lockState === 'locked' || busy) return;
    if (phase === 'create' && passphrase.length < 8) return say('Mindestens 8 Zeichen.', 'err');
    setBusy(true);
    setLockState('busy');
    say(phase === 'create' ? 'Erzeuge Tresor (Argon2id · 256 MiB)…' : 'Entsperre (Argon2id)…');
    try {
      const newDek = phase === 'create' ? await createBoundVault(passphrase) : await unlockBoundVault(passphrase);
      openWith(newDek);
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
    setBusy(false); // a fresh lock screen must always be interactable, whatever
    // state we came from — never leave the unlock button disabled.
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
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                autoComplete={phase === 'create' ? 'new-password' : 'current-password'}
                placeholder="············"
                disabled={lockState === 'locked'}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submit()}
              />
              <button
                type="button"
                className="pass-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Passphrase verbergen' : 'Passphrase anzeigen'}
                aria-pressed={showPass}
              >
                {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
            <button
              className="btn btn-primary btn-tall"
              onClick={() => void submit()}
              disabled={busy || lockState === 'locked'}
            >
              {phase === 'create' ? 'Tresor erstellen' : 'Tresor entsperren'}
            </button>
            {phase === 'unlock' && canBiometric && (
              // Face ID auto-launches on entering this screen; this is the manual
              // retry if the user cancelled it. Ghost style so it stays on-scheme
              // and reads as secondary to the passphrase. Not lockout-gated — the
              // biometric factor is hardware-rate-limited, not brute-forceable.
              <button
                className="btn btn-ghost btn-tall"
                onClick={() => void unlockBiometric()}
                disabled={busy}
              >
                Mit Face ID / Touch ID entsperren
              </button>
            )}
            {lockState === 'locked' ? (
              <div className="lock-status err">Gesperrt — noch {seconds}s (zu viele Fehlversuche).</div>
            ) : (
              <div className={`lock-status ${statusKind}`} aria-live="polite">{status}</div>
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
