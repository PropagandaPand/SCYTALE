import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Single source of truth for the app version: package.json "version". Baked in
// at build time so every device shows exactly the build its Service Worker runs
// — a stale (un-updated) SW is then obvious at a glance. SemVer bump rules:
//   x.0.0  großer Sprung   ·   0.x.0  Feature   ·   0.0.x  jeder Push
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      // TESTING PHASE: autoUpdate so clients self-update while the wire protocol
      // is still changing (a stale cached client can't talk to the new relay).
      // Revert to 'prompt' before release (no unattended code swap).
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'SCYTALE',
        short_name: 'SCYTALE',
        description: 'Ende-zu-Ende verschlüsselter Messenger.',
        theme_color: '#0b0c0e',
        background_color: '#0b0c0e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell so the installed PWA does NOT re-fetch JS on
        // every launch — our first line of defence against a malicious code push.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
