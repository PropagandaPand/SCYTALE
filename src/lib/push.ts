/**
 * Web Push (client side). Opt-in, content-free: we subscribe with the VAPID
 * public key and hand the resulting subscription to our own inbox relay. The
 * server later sends a bare wake-up push (no payload) when a message is queued
 * while we're offline — the service worker then shows a generic notice. No
 * message content and no keys are ever involved on the push path.
 */

// VAPID public key (application server key). Public by design — safe to embed.
// The matching private key lives only as a Cloudflare Worker secret (VAPID_JWK).
export const VAPID_PUBLIC =
  'BCvQuiivhlyNteecWKop_2Jh-cPdK_V8UeiSwgyt8_yPzbduj6dQf6fAJkqOTaVZXMaIsUCb0l8VLLJV8aVuzAo';

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

function b64urlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Installed to the home screen (required for Push on iOS). */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushState(): PushState {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission as PushState;
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms))]);
}

/** Ask permission (if needed) and subscribe. Throws a user-facing German error
 *  on any failure so the UI can show exactly why (iOS fails in many quiet ways). */
export async function enablePush(): Promise<PushSub> {
  if (!pushSupported()) {
    throw new Error('Dieses Gerät oder dieser Browser unterstützt keine Push-Benachrichtigungen.');
  }
  if (isIOS() && !isStandalone()) {
    throw new Error(
      'Auf dem iPhone gehen Benachrichtigungen nur in der installierten PWA (Teilen → „Zum Home-Bildschirm"), nicht im Safari-Tab.',
    );
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt.');

  const reg = await withTimeout(navigator.serviceWorker.ready, 8000, 'Service Worker nicht bereit (Timeout).');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // On iOS this call can hang forever if the push service is unreachable —
    // bound it so the UI never stays stuck in a spinning/greyed state.
    sub = await withTimeout(
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64urlToBytes(VAPID_PUBLIC) as BufferSource,
      }),
      12000,
      'Push-Dienst nicht erreichbar (Zeitüberschreitung). Auf iOS: PWA einmal ganz schließen und neu öffnen, dann erneut versuchen.',
    );
  }
  return sub.toJSON() as PushSub;
}

/** The current subscription, if the user already enabled push on this device. */
export async function currentSubscription(): Promise<PushSub | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? (sub.toJSON() as PushSub) : null;
}

/** Unsubscribe locally. Returns the endpoint that was removed (to tell the DO). */
export async function disablePush(): Promise<string | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}
