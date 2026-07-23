import { useState } from 'react';
import { exportBackup, importBackup } from './lib/backup';
import { unlockBoundVault } from './lib/vaultService';

/**
 * Encrypted recovery backup — export/import. SECURITY: export requires a SECOND
 * authentication (re-enter the vault passphrase, verified via unlockBoundVault)
 * so an unlocked vault + physical access can't be a one-click exfil, plus a
 * SEPARATE export passphrase that encrypts the file (full Argon2id). Import
 * overwrites the local identity/state, then reloads.
 */
export function BackupModal({
  mode,
  dek,
  onClose,
}: {
  mode: 'export' | 'import';
  dek: CryptoKey;
  onClose: () => void;
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
    if (exportPass.length < 8) return setErr('Export-Passphrase: mindestens 8 Zeichen.');
    if (exportPass !== exportPass2) return setErr('Export-Passphrasen stimmen nicht überein.');
    setBusy(true);
    try {
      // Second auth: an unlocked vault is not enough — prove the passphrase now.
      await unlockBoundVault(vaultPass); // throws on wrong passphrase / lockout
      const blob = await exportBackup(dek, exportPass); // already a Blob (streamed sections)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scytale-backup-${new Date().toISOString().slice(0, 10)}.scytale`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDone('Backup exportiert. Bewahre die Datei UND die Export-Passphrase getrennt und sicher auf.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    setErr('');
    if (!file) return setErr('Bitte eine Backup-Datei wählen.');
    setBusy(true);
    try {
      // Pass the File itself: importBackup reads it section by section, so a large
      // backup is never loaded into one array.
      const failed = await importBackup(dek, exportPass, file);
      setDone(
        failed > 0
          ? `Wiederhergestellt. ${failed} Anhang/Anhänge waren beschädigt und fehlen. Die App lädt gleich neu…`
          : 'Wiederhergestellt. Die App lädt gleich neu…',
      );
      setTimeout(() => location.reload(), 1600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Import fehlgeschlagen.');
      setBusy(false);
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label="Backup">
      <div className="crop-head">{mode === 'export' ? 'Backup exportieren' : 'Backup wiederherstellen'}</div>
      <div className="backup-body">
        {mode === 'export' ? (
          <>
            <p className="backup-warn">
              ⚠ Ein Backup enthält deine <b>Identität und Schlüssel</b>. Es verlässt bewusst die Geräte-Bindung —
              bewahre Datei und Passphrase <b>getrennt</b> und sicher auf.
            </p>
            <p className="backup-warn">
              Nach dem Wiederherstellen auf einem anderen Gerät: <b>dieses hier nicht weiterbenutzen</b>. Von
              beiden Geräten an denselben Kontakt zu senden zerlegt eure Chats (gemeinsamer Ratchet-Stand) —
              echtes Parallel-Multi-Device kommt erst mit Stufe 3.
            </p>
            <label className="backup-field">
              <span>Tresor-Passphrase (zur Bestätigung)</span>
              <input type="password" value={vaultPass} autoComplete="off" onChange={(e) => setVaultPass(e.target.value)} />
            </label>
            <label className="backup-field">
              <span>Neue Export-Passphrase (mind. 8)</span>
              <input type="password" value={exportPass} autoComplete="new-password" onChange={(e) => setExportPass(e.target.value)} />
            </label>
            <label className="backup-field">
              <span>Export-Passphrase wiederholen</span>
              <input type="password" value={exportPass2} autoComplete="new-password" onChange={(e) => setExportPass2(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <p className="backup-warn">
              Wiederherstellen <b>überschreibt</b> die Identität und alle Daten auf diesem Gerät.
            </p>
            <p className="backup-warn">
              Ein <b>älteres</b> Backup kann bestehende Sessions unbrauchbar machen (zurückgesetzte Zähler → der
              Empfänger lehnt sie ab). Betroffene Kontakte müssen dann per Code <b>neu verbunden</b> werden.
            </p>
            <label className="backup-field">
              <span>Backup-Datei</span>
              <input type="file" accept=".scytale,application/octet-stream" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="backup-field">
              <span>Export-Passphrase</span>
              <input type="password" value={exportPass} autoComplete="off" onChange={(e) => setExportPass(e.target.value)} />
            </label>
          </>
        )}
        {err && <div className="err-note">{err}</div>}
        {done && <div className="info-note" style={{ textAlign: 'left' }}><p>{done}</p></div>}
      </div>
      <div className="crop-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          {done && mode === 'export' ? 'Fertig' : 'Abbrechen'}
        </button>
        <button className="btn btn-primary" disabled={busy || !!done} onClick={() => void (mode === 'export' ? doExport() : doImport())}>
          {busy ? '…' : mode === 'export' ? 'Exportieren' : 'Wiederherstellen'}
        </button>
      </div>
    </div>
  );
}
