import { useState } from 'react';
import { t, getLang } from './lib/i18n';

/**
 * Bug report / feedback. The form POSTs a short JSON report to the app's OWN origin
 * (/api/bug — allowed by `connect-src 'self'`); the Worker forwards it server-side to
 * a configured delivery sink and reports success only after that sink accepts it.
 * NOTHING end-to-end leaves the device: only the
 * description and, opt-in, non-sensitive diagnostics (version, browser) — never
 * messages, contacts or keys. If the send fails, a copy-to-clipboard fallback lets the
 * user paste it elsewhere.
 */
declare const __APP_VERSION__: string;
declare const __BUILD_HASH__: string;

const CATEGORIES: { key: string; label: () => string }[] = [
  { key: 'bug', label: () => t('Etwas funktioniert nicht') },
  { key: 'crash', label: () => t('Absturz / Fehler') },
  { key: 'idea', label: () => t('Vorschlag / Feedback') },
  { key: 'other', label: () => t('Sonstiges') },
];

function diagnostics(): string {
  const L: string[] = [];
  try {
    L.push(
      `Version: ${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'}${typeof __BUILD_HASH__ !== 'undefined' ? '+' + __BUILD_HASH__ : ''}`,
    );
    L.push(`App-Sprache: ${getLang()}`);
    L.push(`Browser: ${navigator.userAgent || '?'}`);
    L.push(`Plattform: ${navigator.platform || '?'}`);
    L.push(`System-Sprache: ${navigator.language || '?'}`);
    L.push(`Auflösung: ${window.screen?.width ?? '?'}x${window.screen?.height ?? '?'}`);
    L.push(`Standalone: ${window.matchMedia?.('(display-mode: standalone)').matches ? 'ja' : 'nein'}`);
    L.push(`Datum: ${new Date().toISOString()}`);
  } catch {
    /* best-effort */
  }
  return L.join('\n');
}

export function BugReport({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState('bug');
  const [msg, setMsg] = useState('');
  // Diagnostics are genuinely opt-in; opening the dialog must not preselect
  // device/browser metadata for transmission.
  const [diag, setDiag] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function send() {
    if (!msg.trim() || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/bug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category: cat, message: msg.trim(), diagnostics: diag ? diagnostics() : '' }),
      });
      if (!res.ok) throw new Error();
      setState('sent');
      window.setTimeout(onClose, 1400);
    } catch {
      setState('error');
    }
  }

  async function copyInstead() {
    const full = `[${cat}]\n${msg.trim()}${diag ? `\n\n${diagnostics()}` : ''}`;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label={t('Fehler melden')}>
      <div className="crop-head">{t('Fehler melden')}</div>
      <div className="backup-body">
        {state === 'sent' ? (
          <div className="info-note" style={{ textAlign: 'left' }}>
            <p>{t('Danke! Dein Bericht ist angekommen.')}</p>
          </div>
        ) : (
          <>
            <div className="bug-cats">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`bug-cat${cat === c.key ? ' on' : ''}`}
                  onClick={() => setCat(c.key)}
                >
                  {c.label()}
                </button>
              ))}
            </div>
            <label className="backup-field">
              <span>{t('Was ist passiert?')}</span>
              <textarea
                className="bug-text"
                value={msg}
                maxLength={4000}
                autoFocus
                placeholder={t('Beschreibe den Fehler oder deine Idee — je genauer, desto besser.')}
                onChange={(e) => setMsg(e.target.value)}
              />
            </label>
            <label className="bug-diag">
              <input type="checkbox" checked={diag} onChange={(e) => setDiag(e.target.checked)} />
              <span>{t('Geräte-Infos anhängen (Version, Browser) — nie Nachrichten, Kontakte oder Schlüssel.')}</span>
            </label>
            {state === 'error' && (
              <div className="err-note">
                {t('Senden fehlgeschlagen.')}{' '}
                <button type="button" className="linklike" onClick={() => void copyInstead()}>
                  {t('Stattdessen kopieren')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {state !== 'sent' && (
        <div className="crop-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={state === 'sending'}>
            {t('Abbrechen')}
          </button>
          <button className="btn btn-primary" disabled={!msg.trim() || state === 'sending'} onClick={() => void send()}>
            {state === 'sending' ? '…' : t('Senden')}
          </button>
        </div>
      )}
    </div>
  );
}
