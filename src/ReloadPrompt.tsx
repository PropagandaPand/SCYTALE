import { useRegisterSW } from 'virtual:pwa-register/react';
import { IconInfo } from './icons';

/**
 * Registers the service worker and shows a toast when a new version is ready.
 *
 * iOS is the problem child: a home-screen PWA resumed from the background does
 * NOT re-check for a new service worker on its own, so a deploy can sit unseen
 * for a long time. We therefore force `registration.update()` on a timer and
 * whenever the app returns to the foreground — that's what actually pulls a new
 * build onto an iOS device without a reinstall.
 */
export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => {
        if (document.visibilityState === 'visible') void registration.update();
      };
      void registration.update(); // check right away on load
      setInterval(check, 60_000); // and every minute while open
      document.addEventListener('visibilitychange', check);
      window.addEventListener('focus', check);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">
        <IconInfo size={15} />
      </span>
      <div className="toast-body">
        <div className="toast-title">Neue Version verfügbar</div>
        <div className="toast-sub">Beim Aktualisieren startet die App kurz neu.</div>
        <div className="toast-actions">
          <button className="toast-cta" onClick={() => void updateServiceWorker(true)}>
            Aktualisieren
          </button>
          <button className="toast-later" onClick={() => setNeedRefresh(false)}>
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
