import { useRegisterSW } from 'virtual:pwa-register/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconInfo } from './icons';
import { t } from './lib/i18n';


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
  const mountedRef = useRef(true);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const onRegisteredSW = useCallback((
    _swUrl: string,
    next: ServiceWorkerRegistration | undefined,
  ) => {
    if (next && mountedRef.current) setRegistration(next);
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW,
  });

  useEffect(() => {
    if (!registration) return;
    const check = () => {
      if (
        mountedRef.current &&
        document.visibilityState === 'visible'
      ) {
        void registration.update();
      }
    };
    void registration.update(); // check right away on load
    const interval = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [registration]);

  if (!needRefresh) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">
        <IconInfo size={15} />
      </span>
      <div className="toast-body">
        <div className="toast-title">{t('Neue Version verfügbar')}</div>
        <div className="toast-sub">{t('Beim Aktualisieren startet die App kurz neu.')}</div>
        <div className="toast-actions">
          <button className="toast-cta" onClick={() => void updateServiceWorker(true)}>
            {t('Aktualisieren')}
          </button>
          <button className="toast-later" onClick={() => setNeedRefresh(false)}>
            {t('Später')}
          </button>
        </div>
      </div>
    </div>
  );
}
