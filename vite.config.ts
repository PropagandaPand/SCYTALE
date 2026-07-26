import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// App version = package.json "version" (bump the minor for a feature, major for a big
// jump) + the short git commit hash of THIS build, appended automatically. The hash
// means every deploy shows a DISTINCT version even if the semver wasn't bumped — so the
// label can never silently freeze again, and a bug report maps straight to a commit.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Robust on shallow CI checkouts: prefer the CI-provided commit SHA, then local git,
// then a placeholder. Never throws — a missing hash must not break the build.
function buildHash(): string {
  const ci = process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA;
  if (ci) return ci.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

const APP_VERSION = `${pkg.version}+${buildHash()}`;

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    VitePWA({
      // Custom hand-written service worker (src/sw.ts) so we can add a push
      // handler; injectManifest bakes the precache list into our own SW code.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 'prompt': the new SW WAITS and only activates on an explicit user tap —
      // no unattended reload. (autoUpdate + our skipWaiting caused a reload loop
      // on iOS.) App CONTENT still stays fresh every load via network-first
      // navigation, so this barely affects iteration; only the SW logic itself
      // needs the one-tap update. Also the release-safe posture (no silent swap).
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'SKYTALE',
        short_name: 'SKYTALE',
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
      injectManifest: {
        // Precache the app shell so the installed PWA does NOT re-fetch JS on
        // every launch — our first line of defence against a malicious code push.
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
