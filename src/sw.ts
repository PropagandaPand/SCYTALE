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

const sw = self as unknown as ServiceWorkerGlobalScope;

// VAPID public key (public by design) — needed to re-subscribe from the SW when
// the browser rotates the endpoint (pushsubscriptionchange).
const VAPID_PUBLIC =
  'BCvQuiivhlyNteecWKop_2Jh-cPdK_V8UeiSwgyt8_yPzbduj6dQf6fAJkqOTaVZXMaIsUCb0l8VLLJV8aVuzAo';
function vapidKeyBytes(): Uint8Array {
  const s = VAPID_PUBLIC;
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// vite-plugin-pwa replaces `self.__WB_MANIFEST` with the precache list at build.
const manifest = (self as unknown as { __WB_MANIFEST: { url: string; revision: string | null }[] })
  .__WB_MANIFEST;

const PRECACHE = 'scytale-precache';
const ASSETS = manifest.map((e) => new URL(e.url, sw.location.origin).pathname);
const ASSET_SET = new Set(ASSETS);

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Best-effort, per asset: a single failing request must NOT abort the whole
      // install (that would leave the SW forever un-activated). Skip index.html
      // here — it 307-redirects to '/', and the Cache API refuses to store a
      // redirected response, which is exactly what broke activation before.
      await Promise.all(
        ASSETS.filter((u) => u !== '/index.html').map((u) => cache.add(u).catch(() => undefined)),
      );
      // Cache the app shell under '/index.html' by fetching '/' (200, no redirect)
      // and storing a fresh, non-redirected Response ourselves.
      try {
        const shell = await fetch('/', { cache: 'no-store' });
        if (shell.ok) await cache.put('/index.html', new Response(await shell.blob(), { headers: shell.headers }));
      } catch {
        /* offline during install — navigation will fall back to network later */
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
      const cache = await caches.open(PRECACHE);
      // Drop entries from previous builds (hashed filenames change each deploy).
      for (const req of await cache.keys()) {
        if (!ASSET_SET.has(new URL(req.url).pathname)) await cache.delete(req);
      }
      for (const name of await caches.keys()) if (name !== PRECACHE) await caches.delete(name);
      await sw.clients.claim();
    })(),
  );
});

// Serve the app shell CACHE-FIRST: the running code changes only when the user
// accepts an update (which activates a new SW → a new precache). The server
// cannot swap the shell out from under a live session on a security tool. The
// network is touched only on a COLD cache — the very first launch, where the
// install couldn't reach the network — so we still bootstrap offline capability.
async function cachedShell(cache: Cache): Promise<Response> {
  const cached = await cache.match('/index.html');
  if (cached) return cached;
  try {
    // Cold cache only. Fetch '/' (200), NOT '/index.html' (which 307-redirects —
    // a redirected response can't be cached and would throw on cache.put).
    const fresh = await fetch('/', { cache: 'no-store' });
    if (fresh.ok) {
      try {
        await cache.put('/index.html', fresh.clone());
      } catch {
        /* keep serving even if caching fails */
      }
      return fresh;
    }
  } catch {
    /* offline with an empty cache — nothing we can serve */
  }
  return (await cache.match('/index.html')) ?? Response.error();
}

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return; // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return; // relay: always live network

  // Navigations → cache-first (a new shell arrives only via an accepted update).
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(PRECACHE).then(cachedShell));
    return;
  }

  // Hashed static assets are immutable → cache-first; cache on first network hit
  // so the app also works fully offline after it's been loaded once online.
  event.respondWith(
    (async () => {
      const cache = await caches.open(PRECACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') await cache.put(req, res.clone());
      return res;
    })(),
  );
});

// ── Content-free Web Push ─────────────────────────────────────────────
// iOS revokes push permission if a push event doesn't end in showNotification
// (no silent push allowed), so we ALWAYS show one — never bail out early. The
// server only pushes when the owner isn't connected, so notify-while-open is
// rare. Title omits "SCYTALE" (iOS already shows the app name as the source).
// Content-free by design — no sender, no text.
sw.addEventListener('push', (event) => {
  event.waitUntil(
    sw.registration.showNotification('Neue Nachricht', {
      body: 'Tippen zum Öffnen',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'scytale-new-message',
    }),
  );
});

// Browsers rotate push endpoints; without this the user is silently lost. Re-
// subscribe here so getSubscription() returns a valid one again — the app then
// re-registers it with the relay over its authenticated owner socket on next
// launch (currentSubscription → setPush).
sw.addEventListener('pushsubscriptionchange', (event) => {
  (event as ExtendableEvent).waitUntil(
    sw.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: vapidKeyBytes() as BufferSource })
      .then(() => undefined)
      .catch(() => undefined),
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
