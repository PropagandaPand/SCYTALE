#!/usr/bin/env node
// Post-build gate: run the EXACT install-time shell validation the service worker performs
// (assertShellReferencesOnlyVerified) against the emitted dist/index.html, and fail the build if it
// would be rejected. That validator forbids HTML comments, inline <style>, unexpected/mismatched
// meta tags (e.g. a viewport that no longer matches the pinned form), unexpected elements, and
// references to non-emitted assets. Any such shell makes populateBuildPrecache throw during the NEW
// worker's install — so it never activates and EVERY existing client is stuck on the old build with
// no way to update short of a reinstall. This has bitten us twice; wiring it into `build` means it
// can never deploy again (Cloudflare's build runs `npm run build`, not the git preflight).
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const shellPath = join(distDir, 'index.html');

if (!existsSync(shellPath)) {
  console.error('validate-shell: dist/index.html fehlt — bitte zuerst `vite build`.');
  process.exit(1);
}

// Bundle the production validator so there is zero drift between what deploys and what the SW accepts.
const bundled = await esbuild.build({
  entryPoints: [join(root, 'src/lib/swPrecache.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'error',
});
const tmp = join(mkdtempSync(join(tmpdir(), 'skytale-shell-')), 'swp.mjs');
writeFileSync(tmp, bundled.outputFiles[0].text);
const { assertShellReferencesOnlyVerified } = await import(pathToFileURL(tmp).href);

// Verified set = every file actually emitted into dist (root-relative) — the exact bytes the browser
// can load. A shell reference to anything not emitted is a hard failure, same as at SW install.
function collect(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = `${prefix}/${name}`;
    if (statSync(full).isDirectory()) out.push(...collect(full, rel));
    else out.push(rel);
  }
  return out;
}
const verified = new Set(collect(distDir));

try {
  assertShellReferencesOnlyVerified(readFileSync(shellPath, 'utf8'), verified);
  console.log('validate-shell OK: dist/index.html besteht die SW-Install-Shell-Validierung.');
} catch (error) {
  console.error(
    '\nvalidate-shell FEHLGESCHLAGEN — dieser Build würde den Service-Worker-Install brechen',
  );
  console.error('(neuer SW aktiviert nie → Clients hängen ohne Update-Möglichkeit fest):');
  console.error(`  → ${error?.message ?? error}\n`);
  process.exit(1);
}
