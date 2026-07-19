/**
 * Custom service worker (vite-plugin-pwa `injectManifest`). Hand-written and
 * dependency-free so the app shell — our first line of defence against a
 * malicious code push — stays fully auditable. Two jobs:
 *
 *   1. Precache the app shell (offline + no silent re-fetch of JS on launch).
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
      await cache.addAll(ASSETS);
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

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return; // never touch cross-origin
  if (url.pathname.startsWith('/api/')) return; // relay: always live network

  // Cache-first app shell; SPA navigations fall back to the precached index.
  event.respondWith(
    (async () => {
      const cache = await caches.open(PRECACHE);
      const cached = await cache.match(req.mode === 'navigate' ? '/index.html' : req);
      if (cached) return cached;
      try {
        return await fetch(req);
      } catch {
        const fallback = await cache.match('/index.html');
        if (fallback) return fallback;
        throw new Error('offline');
      }
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
