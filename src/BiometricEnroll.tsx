import { useState } from 'react';
import { enableBiometricUnlock, WrongPassphraseError } from './lib/vaultService';
import { IconEye, IconEyeOff } from './icons';
import { t } from './lib/i18n';
import { tb } from './lib/tnodes';

/**
 * One-time enrollment for Face ID / Touch ID unlock. The passphrase is needed once
 * because it is the only holder of the DEK in a re-wrappable form; after this, the
 * biometric door and the passphrase both open the SAME vault. Prompts the
 * authenticator twice (register the credential, then evaluate PRF).
 */
export function BiometricEnroll({
  onDone,
  onClose,
  runRuntimeOperation,
}: {
  onDone: () => void;
  onClose: () => void;
  runRuntimeOperation: <T>(
    operation: (signal: AbortSignal) => Promise<T>,
  ) => Promise<T>;
}) {
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function enable() {
    if (busy || !pass) return;
    setBusy(true);
    setErr('');
    try {
      await runRuntimeOperation(async (signal) => {
        if (signal.aborted) {
          const error = new Error('Biometrie-Aktivierung abgebrochen.');
          error.name = 'AbortError';
          throw error;
        }
        await enableBiometricUnlock(pass);
        if (signal.aborted) {
          const error = new Error('Biometrie-Aktivierung abgebrochen.');
          error.name = 'AbortError';
          throw error;
        }
      });
      setPass('');
      onDone();
    } catch (e) {
      const x = e as { name?: string; message?: string };
      if (x.name === 'AbortError') return;
      if (e instanceof WrongPassphraseError) setErr(t('Falsche Passphrase.'));
      else if (x.name === 'NotAllowedError') setErr(t('Abgebrochen — Face ID / Touch ID nicht bestätigt.'));
      else setErr(t('Aktivieren fehlgeschlagen: {msg}', { msg: x.message ?? String(e) }));
      setBusy(false);
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label={t('Face ID / Touch ID aktivieren')}>
      <div className="crop-head">{t('Face ID / Touch ID aktivieren')}</div>
      <div className="backup-body">
        <p className="backup-warn">
          {tb('Bestätige einmal deine **Tresor-Passphrase** — danach entsperrt Face ID / Touch ID diesen Tresor auf diesem Gerät. Der Schlüssel bleibt derselbe, und die Passphrase funktioniert weiterhin. Gleich zweimal die Biometrie bestätigen (Anlegen + Ableiten).')}
        </p>
        <label className="backup-field">
          <span>{t('Tresor-Passphrase')}</span>
          <div className="pass-reveal">
            <input
              type={showPass ? 'text' : 'password'}
              value={pass}
              autoComplete="current-password"
              autoFocus
              disabled={busy}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void enable()}
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
        </label>
        {err && <div className="err-note">{err}</div>}
      </div>
      <div className="crop-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {t('Abbrechen')}
        </button>
        <button className="btn btn-primary" disabled={busy || !pass} onClick={() => void enable()}>
          {busy ? '…' : t('Aktivieren')}
        </button>
      </div>
    </div>
  );
}
