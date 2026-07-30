import { useEffect, useState } from 'react';
import {
  setDuressPassword,
  removeDuressPassword,
  biometricEnrolled,
  WrongPassphraseError,
  DuressEqualsRealError,
} from './lib/vaultService';
import { IconEye, IconEyeOff } from './icons';
import { t } from './lib/i18n';
import { tb } from './lib/tnodes';

/**
 * Set or remove the DURESS password: a second passphrase that, entered at the unlock screen,
 * opens a separately keyed decoy only after irreversibly crypto-erasing the real account.
 * Setting requires the real passphrase once (proves ownership); the duress password must
 * differ from it. Removing also requires the real passphrase.
 */
export function DuressSetup({
  mode,
  onDone,
  onClose,
  runRuntimeOperation,
}: {
  mode: 'set' | 'remove';
  onDone: () => void;
  onClose: () => void;
  runRuntimeOperation: <T>(
    operation: (signal: AbortSignal) => Promise<T>,
  ) => Promise<T>;
}) {
  const [real, setReal] = useState('');
  const [duress, setDuress] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  // An enrolled biometric is a coercible door to the REAL vault that voids duress protection. We
  // don't enforce exclusivity (per product decision), but we warn honestly at the point of arming.
  const [bioOn, setBioOn] = useState(false);
  useEffect(() => {
    if (mode === 'set') void biometricEnrolled().then(setBioOn).catch(() => undefined);
  }, [mode]);

  const title = mode === 'set' ? t('Duress-Passwort einrichten') : t('Duress-Passwort entfernen');
  // The duress word is a coercion trigger, not an authentication secret. It only
  // has to be non-empty, confirmed and different from the real passphrase.
  const ready = mode === 'set' ? !!real && !!duress && !!confirm : !!real;

  async function save() {
    if (busy || !ready) return;
    if (mode === 'set') {
      if (duress !== confirm) return setErr(t('Die Duress-Passwörter stimmen nicht überein.'));
    }
    setBusy(true);
    setErr('');
    try {
      await runRuntimeOperation(async (signal) => {
        if (signal.aborted) {
          const error = new Error('Duress-Änderung abgebrochen.');
          error.name = 'AbortError';
          throw error;
        }
        if (mode === 'set') await setDuressPassword(real, duress);
        else await removeDuressPassword(real);
        if (signal.aborted) {
          const error = new Error('Duress-Änderung abgebrochen.');
          error.name = 'AbortError';
          throw error;
        }
      });
      setReal('');
      setDuress('');
      setConfirm('');
      onDone();
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return;
      if (e instanceof WrongPassphraseError) setErr(t('Falsche Passphrase.'));
      else if (e instanceof DuressEqualsRealError) setErr(t('Das Duress-Passwort darf nicht deine echte Passphrase sein.'));
      else setErr(t('Speichern fehlgeschlagen: {msg}', { msg: (e as Error).message }));
      setBusy(false);
    }
  }

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    autoComplete: string,
    autoFocus = false,
    onEnter = false,
    passwordManagerIgnore = false,
  ) => (
    <label className="backup-field">
      <span>{label}</span>
      <div className="pass-reveal">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          data-1p-ignore={passwordManagerIgnore ? 'true' : undefined}
          data-lpignore={passwordManagerIgnore ? 'true' : undefined}
          data-bwignore={passwordManagerIgnore ? 'true' : undefined}
          autoFocus={autoFocus}
          disabled={busy}
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => onEnter && e.key === 'Enter' && void save()}
        />
        <button
          type="button"
          className="pass-eye"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t('Passphrase verbergen') : t('Passphrase anzeigen')}
          aria-pressed={show}
        >
          {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="crop-modal" role="dialog" aria-label={title}>
      <div className="crop-head">{title}</div>
      <div className="backup-body">
        <p className="backup-warn">
          {mode === 'set'
            ? tb('Ein **zweites Passwort für den Notfall**: Gibst du es beim Entsperren ein, wird dein **echtes Konto sofort und unwiderruflich gelöscht** und stattdessen ein **Schein-Konto** geöffnet. Von außen sieht es aus wie ein ganz normales Entsperren. Nutze es NUR, wenn du zur Eingabe gezwungen wirst. Es muss sich von deiner echten Passphrase unterscheiden. Danach kannst du das Schein-Konto in den Einstellungen mit glaubwürdigen Chats füllen.')
            : tb('Bestätige deine **echte Passphrase**, um das Duress-Passwort zu entfernen. Danach wird auch das Schein-Konto gelöscht und keine zweite Eingabe wechselt mehr das Konto.')}
        </p>
        {mode === 'set' && bioOn && (
          <p className="backup-warn">
            {tb('⚠ **Face ID / Touch ID ist aktiv.** Biometrie öffnet den **echten** Tresor direkt — ein erzwungenes Gesicht/Finger hebelt den Duress-Schutz komplett aus. Für echten Zwangsschutz schalte die Biometrie aus.')}
          </p>
        )}
        {field(t('Echte Tresor-Passphrase'), real, setReal, 'current-password', true, mode === 'remove')}
        {mode === 'set' && (
          <>
            {field(t('Duress-Passwort'), duress, setDuress, 'off', false, false, true)}
            {field(t('Duress-Passwort wiederholen'), confirm, setConfirm, 'off', false, true, true)}
          </>
        )}
        {err && <div className="err-note">{err}</div>}
      </div>
      <div className="crop-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {t('Abbrechen')}
        </button>
        <button
          className={mode === 'set' ? 'btn btn-primary' : 'btn btn-danger'}
          disabled={busy || !ready}
          onClick={() => void save()}
        >
          {busy ? '…' : mode === 'set' ? t('Aktivieren') : t('Entfernen')}
        </button>
      </div>
    </div>
  );
}
