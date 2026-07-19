import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Shows a toast when a new app version is available. Because the SW is
 * registered with `registerType: 'prompt'`, nothing updates until the user
 * clicks — there is no silent code swap.
 */
export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="toast">
      <span>Neue Version verfügbar.</span>
      <button className="slim" onClick={() => void updateServiceWorker(true)}>
        Aktualisieren
      </button>
      <button className="ghost slim" onClick={() => setNeedRefresh(false)}>
        Später
      </button>
    </div>
  );
}
