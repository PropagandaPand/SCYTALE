import { useEffect, useState } from 'react';
import { t } from './lib/i18n';
import { IconBomb } from './icons';

/**
 * Full-screen viewer for a view-once photo. By the time this mounts the stored bytes
 * are ALREADY securely wiped (see openViewOnce) — the `blob` here is the only remaining
 * copy, held in memory and dropped when the viewer closes. This is the single viewing.
 *
 * Hold-to-view: the image is only revealed while a finger/pointer is held down, which
 * makes a one-handed screenshot awkward (you need a second device). Backgrounding the
 * app closes the viewer so nothing lingers in an app-switcher snapshot. We are honest
 * in the footer: a web app cannot actually block screenshots — only a native app can.
 */
export function ViewOnceViewer({ blob, onClose }: { blob: Blob; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  // Backgrounding (task switcher, screen off) closes the viewer — the photo must not
  // survive in an OS app-switcher snapshot.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') onClose();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [onClose]);

  return (
    <div className="vo-viewer" role="dialog" aria-label={t('Einmal-Foto')}>
      <button className="vo-close" onClick={onClose} aria-label={t('Schließen')}>
        ×
      </button>
      <div
        className={`vo-stage${held ? ' held' : ''}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setHeld(true);
        }}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {url && <img className="vo-img" src={url} alt="" draggable={false} />}
        {!held && (
          <div className="vo-cover">
            <IconBomb size={30} />
            <div className="vo-cover-title">{t('Zum Ansehen gedrückt halten')}</div>
            <div className="vo-cover-sub">{t('Das Foto ist bereits gelöscht — dies ist deine einzige Ansicht.')}</div>
          </div>
        )}
      </div>
      <div className="vo-note">{t('Hinweis: Screenshots kann eine Web-App technisch nicht verhindern.')}</div>
    </div>
  );
}
