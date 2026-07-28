import { useState } from 'react';
import {
  setDuressPassword,
  removeDuressPassword,
  WrongPassphraseError,
  DuressEqualsRealError,
} from './lib/vaultService';
import { IconEye, IconEyeOff } from './icons';
import { t } from './lib/i18n';
import { tb } from './lib/tnodes';

/**
 * Set or remove the DURESS password: a second passphrase that, entered at the unlock screen,
 * does NOT unlock the vault but irreversibly crypto-erases it. Setting requires the real
 * passphrase once (proves ownership); the duress password must differ from it. Removing also
 * requires the real passphrase.
 */
export function DuressSetup({
  mode,
  onDone,
  onClose,
}: {
  mode: 'set' | 'remove';
  onDone: () => void;
  onClose: () => void;
}) {
  const [real, setReal] = useState('');
  const [duress, setDuress] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);

  const title = mode === 'set' ? t('Duress-Passwort einrichten') : t('Duress-Passwort entfernen');
  const ready = mode === 'set' ? !!real && !!duress && !!confirm : !!real;

  async function save() {
    if (busy || !ready) return;
    if (mode === 'set') {
      if (duress.length < 8) return setErr(t('Mindestens 8 Zeichen.'));
      if (duress !== confirm) return setErr(t('Die Duress-Passwörter stimmen nicht überein.'));
    }
    setBusy(true);
    setErr('');
    try {
      if (mode === 'set') await setDuressPassword(real, duress);
      else await removeDuressPassword(real);
      setReal('');
      setDuress('');
      setConfirm('');
      onDone();
    } catch (e) {
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
  ) => (
    <label className="backup-field">
      <span>{label}</span>
      <div className="pass-reveal">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
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
            ? tb('Ein **zweites Passwort für den Notfall**: Gibst du es beim Entsperren ein, wird der **gesamte Tresor sofort und unwiderruflich gelöscht** — statt geöffnet zu werden. Von außen sieht es aus wie ein normaler Entsperr-Versuch. Nutze es NUR, wenn du zur Eingabe gezwungen wirst. Es muss sich von deiner echten Passphrase unterscheiden.')
            : tb('Bestätige deine **echte Passphrase**, um das Duress-Passwort zu entfernen. Danach löscht keine zweite Eingabe mehr den Tresor.')}
        </p>
        {field(t('Echte Tresor-Passphrase'), real, setReal, 'current-password', true, mode === 'remove')}
        {mode === 'set' && (
          <>
            {field(t('Duress-Passwort'), duress, setDuress, 'new-password')}
            {field(t('Duress-Passwort wiederholen'), confirm, setConfirm, 'new-password', false, true)}
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
