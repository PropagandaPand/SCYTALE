/**
 * PWA install onboarding — a one-time bottom sheet that shows how to add SKYTALE to
 * the home screen. Auto-triggers when the app runs in a normal MOBILE browser (not
 * already installed/standalone) and hasn't been dismissed. On Android it captures
 * `beforeinstallprompt` and the CTA fires Chrome's real install; on iOS (no such API)
 * it shows the exact Share → Home-Screen steps for Safari or Chrome. Translated via
 * t(); complements the in-app-browser "open in your browser" screen in App.tsx.
 */
import { useEffect, useState } from 'react';
import { t } from './lib/i18n';
import { tb } from './lib/tnodes';

const SEEN_KEY = 'skytale-install-seen';

type Platform = 'ios' | 'android' | 'other';
type IosBrowser = 'safari' | 'chrome';

function isStandalone(): boolean {
  try {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}
function detectPlatform(): Platform {
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}
function detectIosBrowser(): IosBrowser {
  return /CriOS|EdgiOS|FxiOS|OPiOS|GSA/i.test(navigator.userAgent || '') ? 'chrome' : 'safari';
}

// A few inline OS glyphs (share sheet, add-to-home, kebab menu, chevron, install).
const Glyph = {
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m8 7 4-4 4 4" /><path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" /></svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>
  ),
  dots: (
    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
  ),
  install: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
  ),
};

function Step({ n, glyph, children }: { n: number; glyph: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inst-step">
      <span className="inst-num">{n}</span>
      <div className="inst-stext">{children}</div>
      <span className="inst-glyph">{glyph}</span>
    </li>
  );
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('ios');
  const [iosBrowser, setIosBrowser] = useState<IosBrowser>('safari');
  const [deferred, setDeferred] = useState<(Event & { prompt: () => void; userChoice: Promise<unknown> }) | null>(null);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Event & { prompt: () => void; userChoice: Promise<unknown> });
    };
    const onInstalled = () => {
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
      setShow(false);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    // Decide whether to show, once, shortly after mount.
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* ignore */
    }
    const p = detectPlatform();
    if (!seen && !isStandalone() && p !== 'other') {
      setPlatform(p);
      setIosBrowser(detectIosBrowser());
      const timer = window.setTimeout(() => setShow(true), 900);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', onBip);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show) return null;

  const dismissSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  const cta = () => {
    if (platform === 'android' && deferred) {
      const dp = deferred;
      setDeferred(null);
      dp.prompt();
      void Promise.resolve(dp.userChoice).finally(dismissSeen);
      return;
    }
    dismissSeen();
  };
  const label = platform === 'ios' ? (iosBrowser === 'chrome' ? 'iOS · Chrome' : 'iOS · Safari') : 'Android · Chrome';

  return (
    <div className="inst-scrim" onClick={() => setShow(false)}>
      <div className="inst-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="inst-grab" />
        <div className="inst-head">
          <img className="inst-logo" src="/scytale-icon.svg" alt="SKYTALE" />
          <div>
            <div className="inst-eyebrow">{t('SKYTALE installieren')}</div>
            <h2 className="inst-title">{t('Als App hinzufügen')}</h2>
            <p className="inst-sub">{t('In Sekunden auf dem Startbildschirm — offline & im Vollbild.')}</p>
          </div>
        </div>

        <div className="inst-seg" role="radiogroup">
          <button className={`inst-seg-btn${platform === 'ios' ? ' on' : ''}`} onClick={() => setPlatform('ios')}>
            iPhone · iPad
          </button>
          <button className={`inst-seg-btn${platform === 'android' ? ' on' : ''}`} onClick={() => setPlatform('android')}>
            Android
          </button>
        </div>

        {platform === 'ios' && (
          <div className="inst-subseg">
            <span className="inst-subseg-lbl">{t('Browser')}</span>
            <button className={`inst-sub-btn${iosBrowser === 'safari' ? ' on' : ''}`} onClick={() => setIosBrowser('safari')}>
              Safari
            </button>
            <button className={`inst-sub-btn${iosBrowser === 'chrome' ? ' on' : ''}`} onClick={() => setIosBrowser('chrome')}>
              Chrome
            </button>
          </div>
        )}

        <div className="inst-detected">
          <span className="dot" /> {t('Automatisch erkannt:')} <b>{label}</b>
        </div>

        {platform === 'ios' && iosBrowser === 'safari' && (
          <ol className="inst-steps">
            <Step n={1} glyph={Glyph.share}>{tb('Tippe unten auf **Teilen** — das Quadrat mit dem Pfeil nach oben.')}</Step>
            <Step n={2} glyph={Glyph.home}>{tb('Scrolle etwas und wähle **Zum Home-Bildschirm**.')}</Step>
            <Step n={3} glyph={Glyph.home}>{tb('Bestätige oben rechts mit **Hinzufügen**.')}</Step>
          </ol>
        )}
        {platform === 'ios' && iosBrowser === 'chrome' && (
          <ol className="inst-steps">
            <Step n={1} glyph={Glyph.share}>{tb('Tippe oben rechts auf **Teilen**.')}</Step>
            <Step n={2} glyph={Glyph.home}>{tb('Wähle **Zum Home-Bildschirm** (evtl. kurz scrollen).')}</Step>
            <Step n={3} glyph={Glyph.home}>{tb('Bestätige mit **Hinzufügen**.')}</Step>
          </ol>
        )}
        {platform === 'android' && (
          <ol className="inst-steps">
            <Step n={1} glyph={Glyph.dots}>{tb('Öffne oben rechts das **Menü (⋮)**.')}</Step>
            <Step n={2} glyph={Glyph.install}>{tb('Tippe auf **App installieren** (oder „Zum Startbildschirm").')}</Step>
            <Step n={3} glyph={Glyph.install}>{tb('Bestätige mit **Installieren**.')}</Step>
          </ol>
        )}

        <p className="inst-note">{t('Danach läuft SKYTALE im Vollbild, offline und aktualisiert sich von selbst.')}</p>

        <div className="inst-actions">
          <button className="btn btn-primary btn-tall" onClick={cta}>
            {platform === 'android' && deferred ? t('Jetzt installieren') : t('Alles klar')}
          </button>
          <button className="inst-later" onClick={() => setShow(false)}>
            {t('Später')}
          </button>
        </div>
      </div>
    </div>
  );
}
