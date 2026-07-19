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
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushState(): PushState {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission as PushState;
}

/** Ask permission (if needed) and subscribe. Returns the subscription or null. */
export async function enablePush(): Promise<PushSub | null> {
  if (!pushSupported()) return null;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64urlToBytes(VAPID_PUBLIC) as BufferSource,
    });
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
