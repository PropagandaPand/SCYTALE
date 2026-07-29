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
  duressEnabled,
  completeDecoyPromotion,
  completeDuressRemoval,
} from './lib/vaultService';
import { switchVaultDb, type VaultDbName } from './lib/db';
import {
  promoteMarkerPresent,
  duressRemovalMarkerPresent,
  PROMOTE_MARKER,
  DURESS_LOCKDOWN_CHANNEL,
  DURESS_LOCKDOWN_STORAGE_KEY,
  DURESS_CONTEXT_ID,
} from './lib/wipe';
import { cryptoSelfTest } from './lib/selftest';
import { hasWebCrypto, isInAppBrowser, isInstagram } from './lib/environment';
import { backgroundLockExpired } from './lib/backgroundLock';
import {
  acquireVaultRuntimeLock,
  releaseVaultRuntimeLock,
  vaultRuntimeLockHeld,
} from './lib/runtimeLock';
import { t, useLang } from './lib/i18n';
import { Messenger } from './Messenger';
import { ReloadPrompt } from './ReloadPrompt';
import { InstallPrompt } from './InstallPrompt';
import { IconLock, IconEye, IconEyeOff } from './icons';

type Phase = 'loading' | 'create' | 'unlock' | 'open' | 'unsupported';
type StatusKind = '' | 'ok' | 'err';
type LockState = 'idle' | 'busy' | 'deny' | 'locked' | 'unlocking' | 'tamper' | 'fatal';

const IDLE_LOCK_MS = 5 * 60 * 1000;
const BACKGROUND_LOCK_GRACE_MS = 30 * 1000; // lock this long after the app is backgrounded (audit N-4)
const RUNTIME_LOCK_HANDOFF_MS = 1200;

class RuntimeLockUnavailableError extends Error {}

async function acquireRuntimeLockForOpen(waitForHandoff: boolean): Promise<boolean> {
  const deadline = performance.now() + (waitForHandoff ? RUNTIME_LOCK_HANDOFF_MS : 0);
  do {
    if (await acquireVaultRuntimeLock()) return true;
    if (performance.now() >= deadline) return false;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 40));
  } while (true);
}

function PrivacyCurtain() {
  return (
    <div className="privacy-curtain" aria-hidden="true">
      <IconLock size={24} />
      <span>SKYTALE</span>
    </div>
  );
}

export function App() {
  useLang(); // re-render this whole tree when the language changes
  const [phase, setPhase] = useState<Phase>('loading');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<StatusKind>('');
  const [lockState, setLockState] = useState<LockState>('idle');
  const [lockRemaining, setLockRemaining] = useState(0);
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [populatingDecoy, setPopulatingDecoy] = useState(false); // in an in-app "fill the decoy" session
  const [accountKey, setAccountKey] = useState(0); // bumped on every account switch → force a Messenger remount
  const [pendingSwitch, setPendingSwitch] = useState<{
    db: VaultDbName;
    dek: CryptoKey;
    populating: boolean;
    epoch: number;
  } | null>(null);
  const realDekRef = useRef<CryptoKey | null>(null); // the real account's DEK, stashed while populating the decoy
  const switchEpochRef = useRef(0); // invalidates an account switch superseded by lock/another switch
  const [canBiometric, setCanBiometric] = useState(false); // enrolled AND supported on this device
  const [showPass, setShowPass] = useState(false); // reveal the passphrase via the eye toggle
  const [copied, setCopied] = useState(false); // "copy link" feedback on the unsupported screen
  const lockTimer = useRef<number | null>(null);
  const autoBioTriedRef = useRef(false); // auto-launch Face ID at most once per unlock-screen entry
  // Invalidates an in-flight Argon2/WebAuthn result across hide/freeze/resume.
  const lifecycleEpochRef = useRef(0);
  const duressReloadingRef = useRef(false);

  function say(msg: string, kind: StatusKind = '') {
    setStatus(msg);
    setStatusKind(kind);
  }

  useEffect(() => {
    void (async () => {
      // Distinguish "wrong environment" (an app's embedded preview browser with no
      // usable WebCrypto — e.g. the Instagram in-app browser) from a genuine crypto
      // failure. The former gets a friendly "open in your browser" screen instead of
      // a scary CRYPT ERROR — it's the first thing a tester coming from a link sees.
      const ok = hasWebCrypto() && (await cryptoSelfTest());
      if (!ok) {
        if (!hasWebCrypto() || isInAppBrowser()) {
          setPhase('unsupported');
        } else {
          setLockState('fatal');
          say(t('CRYPT ERROR — WebCrypto-Selbsttest fehlgeschlagen. Aus Sicherheitsgründen gesperrt.'), 'err');
        }
        return;
      }
      // Finish an interrupted, authenticated removal before exposing settings or
      // the lock screen. Its journal is idempotent and never deletes a live DB.
      if (duressRemovalMarkerPresent()) {
        await completeDuressRemoval();
      }
      // If a duress promotion was interrupted (kill / blocked delete mid-wipe), finish it
      // idempotently BEFORE deciding what to show — so the decoy always ends up as the canonical
      // 'scytale' account and the device never strands on a half-erased real one.
      if (promoteMarkerPresent()) {
        await completeDecoyPromotion();
      }
      setPhase((await hasVault()) ? 'unlock' : 'create');
      const lk = await lockoutStatus();
      if (lk.remainingMs > 0) beginLockoutCountdown(lk.remainingMs);
    })().catch((e) => {
      setLockState('fatal');
      say(t('Sicherer Start fehlgeschlagen: {msg}', { msg: (e as Error).message }), 'err');
    });
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
      const [avail, enrolled, duressArmed] = await Promise.all([
        biometricAvailable(),
        biometricEnrolled(),
        duressEnabled(),
      ]);
      if (!alive) return;
      const can = avail && enrolled;
      setCanBiometric(can);
      // When a duress password is armed, do NOT auto-launch Face ID / Touch ID: a coerced
      // biometric would open the REAL vault before the user could type the duress word. The
      // passphrase field must be the first thing reachable. The manual biometric button stays
      // available for a voluntary unlock.
      if (can && !duressArmed && !autoBioTriedRef.current) {
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
  function openWith(newDek: CryptoKey, expectedLifecycleEpoch: number) {
    if (!vaultRuntimeLockHeld()) {
      throw new RuntimeLockUnavailableError();
    }
    if (lockTimer.current) {
      // A biometric unlock can succeed DURING a passphrase lockout (the biometric
      // factor isn't lockout-gated) — stop the countdown so it can't fire post-open.
      clearInterval(lockTimer.current);
      lockTimer.current = null;
    }
    setLockState('unlocking');
    setPassphrase('');
    setShowPass(false);
    window.setTimeout(() => {
      // Visibility alone is not enough: Argon2/WebAuthn may finish after the
      // document was hidden and became visible again. Discard that stale result.
      if (
        document.visibilityState !== 'visible' ||
        lifecycleEpochRef.current !== expectedLifecycleEpoch
      ) {
        setDek(null);
        setPhase('unlock');
        setLockState('idle');
        setBusy(false);
        releaseVaultRuntimeLock();
        say(t('Entsperrung nach App-Wechsel abgebrochen — bitte erneut entsperren.'));
        return;
      }
      document.documentElement.classList.remove('privacy-curtain-on');
      setDek(newDek);
      setPhase('open');
      say('');
      setLockState('idle');
      setBusy(false); // clear on SUCCESS too — otherwise busy leaks true for the
      // whole session and disables the button after the next auto-lock.
    }, 260);
  }

  // Account switch (real ↔ decoy) for the in-app "fill the decoy" flow. Driven through
  // `pendingSwitch` so the Messenger fully UNMOUNTS (its render is gated on !pendingSwitch below)
  // BEFORE switchVaultDb repoints the active database — only one account's UI is ever live, so no
  // stray write can land in the wrong DB across the switch.
  useEffect(() => {
    if (!pendingSwitch) return;
    let alive = true;
    void (async () => {
      await switchVaultDb(pendingSwitch.db);
      if (!alive || pendingSwitch.epoch !== switchEpochRef.current) {
        // Superseded mid-switch (e.g. auto-lock). switchVaultDb repoints its
        // target synchronously, so the newer operation already owns the active
        // database; this stale completion must publish no React state.
        return;
      }
      setDek(pendingSwitch.dek);
      setPopulatingDecoy(pendingSwitch.populating);
      setAccountKey((k) => k + 1);
      setPendingSwitch(null);
    })().catch(async (e) => {
      await switchVaultDb('scytale').catch(() => undefined);
      if (!alive) return;
      realDekRef.current = null;
      setPendingSwitch(null);
      setPopulatingDecoy(false);
      setDek(null);
      setPhase('unlock');
      setBusy(false);
      say(t('Kontowechsel abgebrochen: {msg}', { msg: (e as Error).message }), 'err');
    });
    return () => {
      alive = false;
    };
  }, [pendingSwitch]);

  // Enter the decoy account to populate it (from the unlocked REAL account). Stash the real DEK so
  // we can switch back without a passphrase; `decoyDek` came from openDecoyForPopulate.
  const enterDecoy = useCallback(
    (decoyDek: CryptoKey) => {
      realDekRef.current = dek;
      const epoch = ++switchEpochRef.current;
      setPendingSwitch({ db: 'scytale-decoy', dek: decoyDek, populating: true, epoch });
    },
    [dek],
  );

  // Leave the decoy populate session and return to the real account (no wipe, no passphrase).
  const exitDecoy = useCallback(() => {
    const real = realDekRef.current;
    if (!real) return;
    realDekRef.current = null;
    const epoch = ++switchEpochRef.current;
    setPendingSwitch({ db: 'scytale', dek: real, populating: false, epoch });
  }, []);

  async function unlockBiometric() {
    // Not gated on lockState==='locked': the biometric factor isn't lockout-gated
    // (see unlockWithBiometric). Only re-entrancy is guarded.
    if (busy) return;
    setBusy(true);
    setLockState('busy');
    say(t('Warte auf Face ID / Touch ID…'));
    const lifecycleEpoch = lifecycleEpochRef.current;
    try {
      const newDek = await unlockWithBiometric();
      // Biometric unlocks cannot be the duress trigger, so ownership is acquired
      // only after successful local authentication and before Messenger mounts.
      if (!(await acquireRuntimeLockForOpen(true))) throw new RuntimeLockUnavailableError();
      openWith(newDek, lifecycleEpoch);
    } catch (e) {
      const err = e as { name?: string };
      if (e instanceof RuntimeLockUnavailableError) {
        say(
          t('Der Tresor ist bereits in einem anderen Tab geöffnet. Schließe ihn dort und versuche es erneut.'),
          'err',
        );
      } else if (err.name === 'NotAllowedError') {
        // User cancelled or it timed out — no error, just fall back to the form.
        say('');
      } else {
        // Show the error, but DON'T use 'deny' — that reddens the passphrase field,
        // and no passphrase was even tried. Keep the form neutral and usable.
        say(t('Biometrie fehlgeschlagen — bitte Passphrase nutzen.'), 'err');
      }
      setLockState('idle');
      setBusy(false);
    }
  }

  async function submit() {
    // NOTE: deliberately NOT gated on lockState==='locked'. A submit during the brute-force
    // countdown must still reach unlockBoundVault so the DURESS passphrase can fire (wipe the real
    // account + open the decoy) even while locked out (the coercion case). A non-duress wrong
    // attempt simply re-throws LockedOutError and the countdown re-appears — nothing is unlocked.
    if (busy) return;
    if (phase === 'create' && passphrase.length < 8) return say(t('Mindestens 8 Zeichen.'), 'err');
    setBusy(true);
    setLockState('busy');
    say(phase === 'create' ? t('Erzeuge Tresor (Argon2id · 256 MiB)…') : t('Entsperre (Argon2id)…'));
    const lifecycleEpoch = lifecycleEpochRef.current;
    let runtimeLockAcquired = false;
    try {
      // On a duress passphrase, unlockBoundVault has already crypto-erased the real account and
      // switched onto the decoy DB; the returned DEK opens the decoy. Externally this is a normal
      // unlock into a plausible account — nothing signals that duress was used.
      let newDek: CryptoKey;
      if (phase === 'create') {
        // Creation writes the canonical vault, so it must not begin until this tab
        // owns the same origin-wide lock used by an unlocked Messenger runtime.
        runtimeLockAcquired = await acquireRuntimeLockForOpen(false);
        if (!runtimeLockAcquired) throw new RuntimeLockUnavailableError();
        newDek = await createBoundVault(passphrase);
      } else {
        // Authentication must run first: a duress passphrase has to trigger its
        // durable wipe and cross-tab lockdown even while another tab owns the
        // Messenger lock. Only the resulting account is opened after ownership.
        newDek = await unlockBoundVault(passphrase);
        runtimeLockAcquired = await acquireRuntimeLockForOpen(true);
        if (!runtimeLockAcquired) throw new RuntimeLockUnavailableError();
      }
      openWith(newDek, lifecycleEpoch);
    } catch (e) {
      if (runtimeLockAcquired) releaseVaultRuntimeLock();
      // A failure after the durable promotion marker was written must resume via
      // the boot recovery path; never leave the user retrying against a partially
      // overwritten canonical header in the same runtime.
      if (promoteMarkerPresent()) {
        location.reload();
        return;
      }
      if (e instanceof LockedOutError) {
        beginLockoutCountdown(e.remainingMs);
        say('');
      } else if (e instanceof DeviceBindingMissingError) {
        setLockState('tamper');
        say(e.message, 'err');
      } else if (e instanceof WrongPassphraseError) {
        setLockState('deny');
        say(t('Falsche Passphrase.'), 'err');
      } else if (e instanceof RuntimeLockUnavailableError) {
        setLockState('deny');
        say(
          t('Der Tresor ist bereits in einem anderen Tab geöffnet. Schließe ihn dort und versuche es erneut.'),
          'err',
        );
      } else {
        setLockState('deny');
        say(t('Fehler: {msg}', { msg: (e as Error).message }), 'err');
      }
      setBusy(false);
    }
  }

  const lock = useCallback(() => {
    switchEpochRef.current++;
    if (populatingDecoy || realDekRef.current) {
      // A populate session that got auto-locked returns to the REAL account: reset the active DB to
      // 'scytale' so the lock screen unlocks the real vault, not the decoy. `realDekRef` is set
      // synchronously in enterDecoy BEFORE populatingDecoy commits, so gating on it too catches an
      // auto-lock during the brief switch transient (finding: stranded on the decoy DB). The decoy
      // stays intact in 'scytale-decoy'. (The stashed real DEK is dropped — re-unlock with the real
      // passphrase.)
      realDekRef.current = null;
      setPopulatingDecoy(false);
      void switchVaultDb('scytale');
    }
    setPendingSwitch(null);
    setDek(null);
    setPhase('unlock');
    setLockState('idle');
    setShowPass(false);
    setBusy(false); // a fresh lock screen must always be interactable, whatever
    // state we came from — never leave the unlock button disabled.
    say(t('Gesperrt.'));
  }, [populatingDecoy]);

  // Release only after React has committed the locked tree and unmounted
  // Messenger. Account switches deliberately keep phase/dek open and therefore
  // retain ownership across real ↔ decoy transitions.
  useEffect(() => {
    if (phase === 'open' && dek) return;
    if (vaultRuntimeLockHeld()) releaseVaultRuntimeLock();
  }, [phase, dek]);

  // A duress promotion in any sibling tab must immediately hide this tab's real
  // account and discard all in-memory keys, even while this tab owns the runtime
  // lock. BroadcastChannel is the primary path; storage events cover browsers
  // where it is unavailable and visibility/pageshow closes suspension gaps.
  useEffect(() => {
    const lockdown = () => {
      if (duressReloadingRef.current) return;
      duressReloadingRef.current = true;
      document.documentElement.classList.add('privacy-curtain-on');
      lifecycleEpochRef.current++;
      lock();
      window.setTimeout(() => {
        releaseVaultRuntimeLock();
        void switchVaultDb('scytale')
          .catch(() => undefined)
          .finally(() => location.reload());
      }, 0);
    };
    const isForeignLockdown = (data: unknown) => {
      if (!data || typeof data !== 'object') return false;
      const message = data as { type?: unknown; source?: unknown };
      return message.type === 'lockdown' && message.source !== DURESS_CONTEXT_ID;
    };
    const onBroadcast = (event: MessageEvent<unknown>) => {
      if (isForeignLockdown(event.data)) lockdown();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROMOTE_MARKER && event.newValue) {
        lockdown();
        return;
      }
      if (event.key !== DURESS_LOCKDOWN_STORAGE_KEY || !event.newValue) return;
      try {
        if (isForeignLockdown(JSON.parse(event.newValue))) lockdown();
      } catch {
        // The promotion-journal storage event remains the authenticated signal.
      }
    };
    const onResume = () => {
      if (promoteMarkerPresent()) lockdown();
    };
    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(DURESS_LOCKDOWN_CHANNEL)
        : null;
    channel?.addEventListener('message', onBroadcast);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => {
      channel?.removeEventListener('message', onBroadcast);
      channel?.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [lock]);

  // A real component teardown / navigation releases ownership. Do not release
  // directly on `pagehide`: the open-page lifecycle handler first calls lock()
  // and the phase/dek effect releases after Messenger unmount; during a slow
  // create/unlock, ownership must survive BFCache pagehide until the async path
  // finishes and its lifecycle-epoch guard rejects the stale result.
  useEffect(() => {
    const release = () => releaseVaultRuntimeLock();
    window.addEventListener('beforeunload', release);
    return () => {
      window.removeEventListener('beforeunload', release);
      release();
    };
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

  // The lifecycle guard must exist before the vault is open as well: the
  // passphrase eye can expose input, and slow Argon2/WebAuthn work can otherwise
  // complete after a hidden→visible round trip. Any such boundary invalidates
  // the in-flight result captured above.
  useEffect(() => {
    if (phase === 'open') return;
    let hidden = false;
    const concealAndInvalidate = () => {
      document.documentElement.classList.add('privacy-curtain-on');
      if (!hidden) {
        hidden = true;
        lifecycleEpochRef.current++;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') concealAndInvalidate();
      else {
        hidden = false;
        document.documentElement.classList.remove('privacy-curtain-on');
      }
    };
    const onPageHide = () => concealAndInvalidate();
    const onFreeze = () => concealAndInvalidate();
    const onPageShow = () => onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('freeze', onFreeze);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    onVisibility();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('freeze', onFreeze);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      if (document.visibilityState === 'visible') {
        document.documentElement.classList.remove('privacy-curtain-on');
      }
    };
  }, [phase]);

  // Lock when the app goes to the background. Mobile PWAs suspend timers, so the
  // timer is only an eager path: the visible/pageshow path ALWAYS compares the
  // wall clock against hiddenAt before it may reveal the app again.
  useEffect(() => {
    if (phase !== 'open') return;
    let grace: number | null = null;
    let hiddenAt: number | null = null;
    const clearGrace = () => {
      if (grace !== null) {
        clearTimeout(grace);
        grace = null;
      }
    };
    const conceal = () => document.documentElement.classList.add('privacy-curtain-on');
    const reveal = () => document.documentElement.classList.remove('privacy-curtain-on');
    const lockFromBackground = () => {
      hiddenAt = null;
      clearGrace();
      lock();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        conceal(); // synchronous class toggle: hide content before an OS snapshot
        hiddenAt = Date.now();
        clearGrace();
        grace = window.setTimeout(() => {
          grace = null;
          if (backgroundLockExpired(hiddenAt, Date.now(), BACKGROUND_LOCK_GRACE_MS)) {
            lockFromBackground();
          }
        }, BACKGROUND_LOCK_GRACE_MS);
      } else {
        const expired = backgroundLockExpired(hiddenAt, Date.now(), BACKGROUND_LOCK_GRACE_MS);
        hiddenAt = null;
        clearGrace();
        if (expired) lock();
        else reveal();
      }
    };
    const onPageHide = () => {
      conceal();
      lockFromBackground();
    };
    // Page Lifecycle freeze is the last reliable callback on Android/Chromium.
    // Lock immediately: timers will not run while the document is frozen.
    const onFreeze = () => {
      conceal();
      lockFromBackground();
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('freeze', onFreeze);
    window.addEventListener('pagehide', onPageHide);
    onVisibility(); // cover an app that became hidden before this effect mounted
    return () => {
      clearGrace();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('freeze', onFreeze);
      window.removeEventListener('pagehide', onPageHide);
      if (document.visibilityState === 'visible') reveal();
    };
  }, [phase, lock]);

  if (phase === 'open' && dek && !pendingSwitch) {
    return (
      <>
        <Messenger
          key={accountKey}
          dek={dek}
          onLock={lock}
          populatingDecoy={populatingDecoy}
          onEnterDecoy={enterDecoy}
          onExitDecoy={exitDecoy}
        />
        <ReloadPrompt />
        <InstallPrompt />
        <PrivacyCurtain />
      </>
    );
  }

  // Brief account switch (real ↔ decoy): the previous Messenger has unmounted and the effect is
  // repointing the active database. A neutral splash — never expose either account's UI here.
  if (phase === 'open' && pendingSwitch) {
    return (
      <>
        <div className="lock">
          <img className="lock-logo" src="/scytale-icon.svg" alt="SKYTALE" />
          <div className="lock-brand">SKYTALE</div>
          <p className="lock-sub">{t('Konto wird gewechselt…')}</p>
        </div>
        <PrivacyCurtain />
      </>
    );
  }

  if (phase === 'unsupported') {
    const copyLink = () => {
      void navigator.clipboard
        ?.writeText(location.href)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2200);
        })
        .catch(() => undefined);
    };
    return (
      <>
        <div className="lock">
          <img className="lock-logo" src="/scytale-icon.svg" alt="SKYTALE" />
          <div className="lock-brand">SKYTALE</div>
          <div className="unsupported">
            <h2 className="unsupported-h">{t('Fast geschafft — im Browser öffnen')}</h2>
            <p className="unsupported-p">
              {isInstagram()
                ? t('Du bist gerade im In-App-Browser von Instagram. Der kann die Verschlüsselung nicht ausführen.')
                : t('Du bist gerade im Vorschau-Browser einer App. Der kann die Verschlüsselung nicht ausführen.')}
            </p>
            <ol className="unsupported-steps">
              <li>{t('Tippe oben rechts auf ⋯ (oder ⋮).')}</li>
              <li>{t('Wähle „Im Browser öffnen“ — Safari, Chrome oder Firefox.')}</li>
            </ol>
            <button className="btn btn-primary btn-tall" onClick={copyLink}>
              {copied ? t('Link kopiert ✓') : t('Link kopieren')}
            </button>
            <p className="unsupported-foot">
              {t('SKYTALE verschlüsselt alles direkt auf deinem Gerät — dafür braucht es einen echten Browser.')}
            </p>
          </div>
        </div>
        <PrivacyCurtain />
      </>
    );
  }

  const seconds = Math.ceil(lockRemaining / 1000);
  const showForm = (phase === 'create' || phase === 'unlock') && lockState !== 'fatal';

  return (
    <>
      <div className="lock">
        <img className="lock-logo" src="/scytale-icon.svg" alt="SKYTALE" />
        <div className="lock-brand">SKYTALE</div>
        <p className="lock-sub">{t('Ende-zu-Ende verschlüsselt · client-side')}</p>

        {showForm && (
          <div className="lock-form">
            <div className="field-lbl">{t('Passphrase')}</div>
            <div className={`pass-field ${lockState === 'deny' ? 'deny' : ''}`}>
              <span className="glyph">
                <IconLock size={15} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                autoComplete={phase === 'create' ? 'new-password' : 'current-password'}
                placeholder="············"
                disabled={lockState === 'busy'}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submit()}
              />
              <button
                type="button"
                className="pass-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? t('Passphrase verbergen') : t('Passphrase anzeigen')}
                aria-pressed={showPass}
              >
                {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
            <button
              className="btn btn-primary btn-tall"
              onClick={() => void submit()}
              disabled={busy}
            >
              {phase === 'create' ? t('Tresor erstellen') : t('Tresor entsperren')}
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
                {t('Mit Face ID / Touch ID entsperren')}
              </button>
            )}
            {lockState === 'locked' ? (
              <div className="lock-status err">{t('Gesperrt — noch {seconds}s (zu viele Fehlversuche).', { seconds })}</div>
            ) : (
              <div className={`lock-status ${statusKind}`} aria-live="polite">{status}</div>
            )}
          </div>
        )}

        {lockState === 'fatal' && <div className="lock-status err" style={{ marginTop: 24 }}>{status}</div>}

        <div className="lock-foot">
          <span className="d" />
          {t('Argon2id · 256 MiB · non-extractable DEK')}
        </div>
      </div>
      <ReloadPrompt />
      <InstallPrompt />
      <PrivacyCurtain />
    </>
  );
}
