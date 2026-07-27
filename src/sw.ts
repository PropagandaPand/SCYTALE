/**
 * Custom service worker (vite-plugin-pwa `injectManifest`). Hand-written and
 * dependency-free so the app shell — our first line of defence against a
 * malicious code push — stays fully auditable. Two jobs:
 *
 *   1. Precache the app shell and serve it CACHE-FIRST. The shell is our first
 *      line of defence against a malicious code push, so the code a user runs
 *      must change ONLY when they explicitly accept an update — the server must
 *      not be able to silently swap the shell on a live launch. Navigations and
 *      hashed JS/CSS therefore both come from the precache. A new deploy produces
 *      a new service worker that WAITS: ReloadPrompt forces registration.update()
 *      on a timer and on every foreground (so even a backgrounded iOS PWA notices)
 *      and surfaces "Neue Version" — tapping it posts SKIP_WAITING, the new SW
 *      activates, and its precache (fresh index.html + new hashed assets) takes
 *      over. Staleness is bounded by that prompt, not by a silent code swap.
 *   2. Wake on a CONTENT-FREE Web Push and show a generic "Neue Nachricht".
 *
 * The push payload never carries message content: the vault is passphrase-
 * locked and this worker holds no keys, so it *cannot* decrypt. A push is a
 * bare wake-up — nothing about who wrote or what they said ever leaves a device.
 */
/// <reference lib="webworker" />
import { bumpBadge } from './lib/badge';
import {
  isScytalePrecache,
  populateBuildPrecache,
  versionedPrecacheName,
  type PrecacheManifestEntry,
} from './lib/swPrecache';
import { PUSH_CONTROL_CACHE, PUSH_DISABLED_PATH, VAPID_PUBLIC } from './lib/push';

const sw = self as unknown as ServiceWorkerGlobalScope;
declare const __BUILD_HASH__: string;

function vapidKeyBytes(): Uint8Array {
  const s = VAPID_PUBLIC;
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// vite-plugin-pwa replaces `self.__WB_MANIFEST` with the precache list at build.
const manifest = (self as unknown as { __WB_MANIFEST: PrecacheManifestEntry[] }).__WB_MANIFEST;

const ASSETS = manifest.map((e) => new URL(e.url, sw.location.origin).pathname);
const ASSET_SET = new Set(ASSETS);
const PRECACHE = versionedPrecacheName(__BUILD_HASH__, manifest);

const fetchBuildAsset = (path: string) =>
  fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
  });

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cacheName = await PRECACHE;
      try {
        const cache = await caches.open(cacheName);
        await populateBuildPrecache(cache, manifest, fetchBuildAsset);
      } catch (error) {
        // Install is transactional at build granularity: never leave an incomplete
        // candidate around, and never activate it.
        await caches.delete(cacheName).catch(() => false);
        throw error;
      }
      // NOTE: no skipWaiting() here. In 'prompt' mode the new SW waits until the
      // user taps "Aktualisieren", which posts SKIP_WAITING (below). Activating
      // unconditionally here + autoUpdate caused an iOS reload loop.
    })(),
  );
});

// Activate immediately only on an explicit user request (prompt-mode update).
sw.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheName = await PRECACHE;
      // A successful install populated this exact cache. Refuse activation if it
      // vanished rather than claiming clients with an empty/broken shell.
      if (!(await caches.has(cacheName))) throw new Error('Precache fehlt bei Aktivierung.');
      // Only after the complete new build activates may old SKYTALE build caches go.
      for (const name of await caches.keys()) {
        if (isScytalePrecache(name) && name !== cacheName) await caches.delete(name);
      }
      await sw.clients.claim();
    })(),
  );
});

// Serve the app shell CACHE-FIRST: the running code changes only when the user
// accepts an update (which activates a new SW → a new precache). The server
// cannot swap the shell out from under a live session on a security tool. The
// A missing active cache fails closed. Fetching `/` here would silently execute
// the server's newer shell before the user accepted its waiting worker.
function cacheUnavailable(): Response {
  return new Response('SKYTALE-App-Cache fehlt. Bitte die App neu laden oder neu installieren.', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function cachedShell(): Promise<Response> {
  const cache = await caches.open(await PRECACHE);
  const cached = await cache.match('/index.html');
  if (cached) return cached;
  return cacheUnavailable();
}

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return; // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return; // relay: always live network

  // Navigations → cache-first (a new shell arrives only via an accepted update).
  if (req.mode === 'navigate') {
    event.respondWith(cachedShell());
    return;
  }

  // Only build-manifest assets belong to the immutable app shell. A miss fails
  // closed instead of fetching a possibly newer/mismatched script from the server.
  if (!ASSET_SET.has(url.pathname)) {
    // Executable build resources must never fall through to the live deployment:
    // that would combine a consented shell with unconsented script/style bytes.
    if (req.destination === 'script' || req.destination === 'style' || req.destination === 'worker') {
      event.respondWith(cacheUnavailable());
    }
    return;
  }
  event.respondWith(
    (async () => {
      const cache = await caches.open(await PRECACHE);
      return (await cache.match(req)) ?? cacheUnavailable();
    })(),
  );
});

// ── Content-free Web Push ─────────────────────────────────────────────
// iOS revokes push permission if a push event doesn't end in showNotification
// (no silent push allowed), so we ALWAYS show one — never bail out early. The
// server only pushes when the owner isn't connected, so notify-while-open is
// rare. Title omits "SKYTALE" (iOS already shows the app name as the source).
// Content-free by design — no sender, no text.
sw.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      // The app is closed (the relay only pushes an offline owner), so we don't know
      // the real unread count — bump the app-icon badge by one. The app corrects it
      // to the true count on next open. Best-effort; never block the notification.
      await bumpBadge().catch(() => undefined);
      await sw.registration.showNotification('Neue Nachricht', {
        body: 'Tippen zum Öffnen',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'scytale-new-message',
      });
    })(),
  );
});

// Browsers rotate push endpoints; without this the user is silently lost. Re-
// subscribe here so getSubscription() returns a valid one again — the app then
// re-registers it with the relay over its authenticated owner socket on next
// launch (currentSubscription → setPush).
sw.addEventListener('pushsubscriptionchange', (event) => {
  (event as ExtendableEvent).waitUntil(
    (async () => {
      // disablePush writes this intent marker BEFORE unsubscribing. Endpoint
      // rotation (or an unsubscribe-triggered change event) must never overturn
      // an explicit disable/account wipe by silently minting a new subscription.
      const control = await caches.open(PUSH_CONTROL_CACHE);
      const disabledKey = new URL(PUSH_DISABLED_PATH, sw.location.origin).toString();
      if (await control.match(disabledKey)) return;
      await sw.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes() as BufferSource,
      });
    })().catch(() => undefined),
  );
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of windows) {
        if ('focus' in c) {
          await c.focus();
          return;
        }
      }
      await sw.clients.openWindow('/');
    })(),
  );
});
