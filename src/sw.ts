/**
 * Custom service worker (vite-plugin-pwa `injectManifest`). Hand-written and
 * dependency-free so the app shell — our first line of defence against a
 * malicious code push — stays fully auditable. Two jobs:
 *
 *   1. Precache the app shell for offline use, and keep it CURRENT:
 *        - navigations → network-first (fresh index.html when online), so a
 *          deploy is picked up on the next online launch even if the SW itself
 *          hasn't updated yet — this is what stops iOS PWAs stranding on an old
 *          build. Hashed JS/CSS stay cache-first (immutable).
 *      NOTE: network-first HTML means the server controls the shell on every
 *      online launch. That's fine while we run `autoUpdate` (the server already
 *      pushes code silently in the testing phase). Before release — together
 *      with switching back to `prompt` — reconsider cache-first here so there's
 *      no silent code swap on a security tool.
 *   2. Wake on a CONTENT-FREE Web Push and show a generic "Neue Nachricht".
 *
 * The push payload never carries message content: the vault is passphrase-
 * locked and this worker holds no keys, so it *cannot* decrypt. A push is a
 * bare wake-up — nothing about who wrote or what they said ever leaves a device.
 */
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

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
      await sw.skipWaiting();
    })(),
  );
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

// Serve the freshest index.html the network can give us, but never hang: race
// the fetch against a timeout and fall back to the cached shell. Caching HTML
// cache-first is the "invisible update" trap that strands iOS PWAs on an old
// build — network-first here means a new deploy is live the next time the app
// opens online, regardless of when the service worker itself updates.
async function freshShell(cache: Cache): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    // Fetch '/' (200), NOT '/index.html' (which 307-redirects — a redirected
    // response can't be cached and would throw on cache.put).
    const fresh = await fetch('/', { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (fresh.ok) {
      try {
        await cache.put('/index.html', fresh.clone());
      } catch {
        /* keep serving even if caching fails */
      }
      return fresh;
    }
  } catch {
    clearTimeout(timer);
  }
  return (await cache.match('/index.html')) ?? Response.error();
}

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return; // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return; // relay: always live network

  // Navigations → network-first (with timeout + offline fallback).
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(PRECACHE).then(freshShell));
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
sw.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows.some((c) => c.visibilityState === 'visible')) return; // app already open
      await sw.registration.showNotification('SCYTALE', {
        body: 'Neue Nachricht',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'scytale-new-message',
      });
    })(),
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
