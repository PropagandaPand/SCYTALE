import { useState } from 'react';
import { enableBiometricUnlock, WrongPassphraseError } from './lib/vaultService';
import { IconEye, IconEyeOff } from './icons';

/**
 * One-time enrollment for Face ID / Touch ID unlock. The passphrase is needed once
 * because it is the only holder of the DEK in a re-wrappable form; after this, the
 * biometric door and the passphrase both open the SAME vault. Prompts the
 * authenticator twice (register the credential, then evaluate PRF).
 */
export function BiometricEnroll({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function enable() {
    if (busy || !pass) return;
    setBusy(true);
    setErr('');
    try {
      await enableBiometricUnlock(pass);
      setPass('');
      onDone();
    } catch (e) {
      const x = e as { name?: string; message?: string };
      if (e instanceof WrongPassphraseError) setErr('Falsche Passphrase.');
      else if (x.name === 'NotAllowedError') setErr('Abgebrochen — Face ID / Touch ID nicht bestätigt.');
      else setErr('Aktivieren fehlgeschlagen: ' + (x.message ?? String(e)));
      setBusy(false);
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label="Face ID / Touch ID aktivieren">
      <div className="crop-head">Face ID / Touch ID aktivieren</div>
      <div className="backup-body">
        <p className="backup-warn">
          Bestätige einmal deine <b>Tresor-Passphrase</b> — danach entsperrt Face ID / Touch ID diesen Tresor auf
          diesem Gerät. Der Schlüssel bleibt derselbe, und die Passphrase funktioniert weiterhin. Gleich zweimal
          die Biometrie bestätigen (Anlegen + Ableiten).
        </p>
        <label className="backup-field">
          <span>Tresor-Passphrase</span>
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
              aria-label={showPass ? 'Passphrase verbergen' : 'Passphrase anzeigen'}
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
          Abbrechen
        </button>
        <button className="btn btn-primary" disabled={busy || !pass} onClick={() => void enable()}>
          {busy ? '…' : 'Aktivieren'}
        </button>
      </div>
    </div>
  );
}
