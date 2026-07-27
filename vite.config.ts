import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
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

// __APP_VERSION__ is the clean semver shown in the UI chip. __BUILD_HASH__ is the git
// short hash — kept OUT of the UI, surfaced only in bug-report diagnostics so a report
// still maps to an exact commit.
// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_HASH__: JSON.stringify(buildHash()),
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
      // on iOS.) Shell and executable assets stay pinned to the accepted build;
      // the update prompt is therefore the deliberate release transition.
      registerType: 'prompt',
      injectRegister: null,
      // Kept as a normal repository asset so it participates in the same
      // SHA-256 manifest transform as every other build file. The plugin's
      // generated manifest/icons are appended after Workbox transforms with
      // MD5 revisions and cannot satisfy the worker's byte-verification rule.
      manifest: false,
      injectManifest: {
        // Precache the app shell so the installed PWA does NOT re-fetch JS on
        // every launch — our first line of defence against a malicious code push.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Workbox normally emits MD5 (and may omit revisions for hashed URLs).
        // The hand-written worker verifies every fetched byte before accepting a
        // candidate build, so emit an explicit SHA-256 for every precache entry.
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.map((entry) => ({
              ...entry,
              revision: createHash('sha256')
                .update(
                  readFileSync(
                    resolve(process.cwd(), 'dist', entry.url.replace(/^\/+/, '')),
                  ),
                )
                .digest('hex'),
            })),
          }),
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
});
