import { useState } from 'react';
import { exportBackup, importBackup } from './lib/backup';
import { verifyRealPassphrase } from './lib/vaultService';
import { t } from './lib/i18n';
import { tb } from './lib/tnodes';

function throwIfBackupUiAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  if (signal.reason instanceof Error) throw signal.reason;
  const error = new Error('Backup-Vorgang wurde wegen der Tresor-Sperre abgebrochen.');
  error.name = 'AbortError';
  throw error;
}

/**
 * Encrypted recovery backup — export/import. SECURITY: export requires a SECOND
 * authentication (re-enter the real vault passphrase via verifyRealPassphrase)
 * so an unlocked vault + physical access can't be a one-click exfil, plus a
 * SEPARATE export passphrase that encrypts the file (full Argon2id). Import
 * overwrites the local identity/state, then reloads.
 */
export function BackupModal({
  mode,
  dek,
  onClose,
  onBeforeImport,
  onImportFailed,
  runRuntimeOperation,
}: {
  mode: 'export' | 'import';
  dek: CryptoKey;
  onClose: () => void;
  onBeforeImport?: () => Promise<void>;
  onImportFailed?: () => Promise<void> | void;
  runRuntimeOperation: <T>(operation: (signal: AbortSignal) => Promise<T>) => Promise<T>;
}) {
  const [vaultPass, setVaultPass] = useState('');
  const [exportPass, setExportPass] = useState('');
  const [exportPass2, setExportPass2] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');

  async function doExport() {
    setErr('');
    if (exportPass.length < 8) return setErr(t('Export-Passphrase: mindestens 8 Zeichen.'));
    if (exportPass !== exportPass2) return setErr(t('Export-Passphrasen stimmen nicht überein.'));
    setBusy(true);
    try {
      await runRuntimeOperation(async (signal) => {
        // Second auth: an unlocked vault is not enough — prove the REAL passphrase now. (Real-only:
        // the duress passphrase does not fire the decoy switch from inside the mounted account.)
        await verifyRealPassphrase(vaultPass); // throws on wrong passphrase / lockout
        throwIfBackupUiAborted(signal);
        const blob = await exportBackup(dek, exportPass, signal); // already a Blob (streamed sections)
        throwIfBackupUiAborted(signal);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        try {
          a.href = url;
          a.download = `scytale-backup-${new Date().toISOString().slice(0, 10)}.scytale`;
          document.body.appendChild(a);
          throwIfBackupUiAborted(signal);
          a.click();
        } finally {
          a.remove();
          // Revoking immediately after the synthetic click is not portable, but
          // an aborted/locked export must not retain the Blob URL either.
          if (signal.aborted) URL.revokeObjectURL(url);
          else setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      });
      setDone(t('Backup exportiert. Bewahre die Datei UND die Export-Passphrase getrennt und sicher auf.'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('Export fehlgeschlagen.'));
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    setErr('');
    if (!file) return setErr(t('Bitte eine Backup-Datei wählen.'));
    setBusy(true);
    try {
      // Close relays and join every older writer BEFORE registering the import
      // itself. Putting this callback inside runRuntimeOperation would make a
      // proper restore fence wait for its own operation forever.
      await onBeforeImport?.();
      const failed = await runRuntimeOperation(async (signal) => {
        throwIfBackupUiAborted(signal);
        // Pass the File itself: importBackup reads it section by section, so a large
        // backup is never loaded into one array.
        return importBackup(dek, exportPass, file, signal);
      });
      setDone(
        failed > 0
          ? t('Wiederhergestellt. {n} Anhang/Anhänge waren beschädigt und fehlen. Die App lädt gleich neu…', { n: failed })
          : t('Wiederhergestellt. Die App lädt gleich neu…'),
      );
      setTimeout(() => location.reload(), 1600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('Import fehlgeschlagen.'));
      setBusy(false);
      await onImportFailed?.();
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label="Backup">
      <div className="crop-head">{mode === 'export' ? t('Backup exportieren') : t('Backup wiederherstellen')}</div>
      <div className="backup-body">
        {mode === 'export' ? (
          <>
            <p className="backup-warn">
              ⚠ {tb('Ein Backup enthält deine **Identität und Schlüssel**. Es verlässt bewusst die Geräte-Bindung — bewahre Datei und Passphrase **getrennt** und sicher auf.')}
            </p>
            <p className="backup-warn">
              {tb('Beim Wiederherstellen wird ein **neues Gerät** erzeugt und das Quellgerät in einer neueren Geräteliste ersetzt. Nutze das alte Gerät danach trotzdem nicht weiter: Es besitzt noch den Master-Schlüssel und kann konkurrierende Gerätelisten signieren.')}
            </p>
            <label className="backup-field">
              <span>{t('Tresor-Passphrase (zur Bestätigung)')}</span>
              <input type="password" value={vaultPass} autoComplete="off" onChange={(e) => setVaultPass(e.target.value)} />
            </label>
            <label className="backup-field">
              <span>{t('Neue Export-Passphrase (mind. 8)')}</span>
              <input type="password" value={exportPass} autoComplete="new-password" onChange={(e) => setExportPass(e.target.value)} />
            </label>
            <label className="backup-field">
              <span>{t('Export-Passphrase wiederholen')}</span>
              <input type="password" value={exportPass2} autoComplete="new-password" onChange={(e) => setExportPass2(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <p className="backup-warn">
              {tb('Wiederherstellen **überschreibt** die Identität und alle Daten auf diesem Gerät.')}
            </p>
            <p className="backup-warn">
              {tb('Beim Restore werden **frische Geräte- und Sitzungsschlüssel** erzeugt. Ein älteres Backup kann bei Kontakten als veraltete Geräteliste abgelehnt werden; diese Kontakte müssen dann per Code **neu verbunden** werden.')}
            </p>
            <p className="backup-warn">
              {t('Alle Geräte aus dem Backup-Snapshot werden sicherheitshalber widerrufen. Vertrauenswürdige Geräte musst du danach neu koppeln.')}
            </p>
            <label className="backup-field">
              <span>{t('Backup-Datei')}</span>
              <input type="file" accept=".scytale,application/octet-stream" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="backup-field">
              <span>{t('Export-Passphrase')}</span>
              <input type="password" value={exportPass} autoComplete="off" onChange={(e) => setExportPass(e.target.value)} />
            </label>
          </>
        )}
        {err && <div className="err-note">{err}</div>}
        {done && <div className="info-note" style={{ textAlign: 'left' }}><p>{done}</p></div>}
      </div>
      <div className="crop-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {done && mode === 'export' ? t('Fertig') : t('Abbrechen')}
        </button>
        <button className="btn btn-primary" disabled={busy || !!done} onClick={() => void (mode === 'export' ? doExport() : doImport())}>
          {busy ? '…' : mode === 'export' ? t('Exportieren') : t('Wiederherstellen')}
        </button>
      </div>
    </div>
  );
}
