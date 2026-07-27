/**
 * Small, dependency-free helpers for the hand-written service worker.
 *
 * A waiting worker must never write into the active worker's cache. The cache
 * name therefore commits to both the release id and the injected precache
 * manifest. The manifest digest also separates dirty/local builds whose git hash
 * did not change but whose emitted app shell did.
 */
export interface PrecacheManifestEntry {
  url: string;
  revision: string | null;
}

export const PRECACHE_PREFIX = 'scytale-precache-';

function hex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export async function versionedPrecacheName(
  buildId: string,
  entries: readonly PrecacheManifestEntry[],
): Promise<string> {
  const canonical = JSON.stringify(
    entries
      .map(({ url, revision }) => ({ url, revision }))
      .sort((a, b) => a.url.localeCompare(b.url) || String(a.revision).localeCompare(String(b.revision))),
  );
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)));
  const safeBuild = buildId.trim().replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 48) || 'unknown';
  return `${PRECACHE_PREFIX}${safeBuild}-${hex(digest).slice(0, 32)}`;
}

export function isScytalePrecache(name: string): boolean {
  // One-time cleanup for releases that used the old build-shared name.
  return name === 'scytale-precache' || name.startsWith(PRECACHE_PREFIX);
}

type CacheWriter = Pick<Cache, 'put'>;
type AssetFetcher = (path: string) => Promise<Response>;

function manifestPath(url: string): string {
  const parsed = new URL(url, 'https://local.invalid');
  if (parsed.origin !== 'https://local.invalid' || parsed.search || parsed.hash) {
    throw new Error(`Ungültige Precache-URL: ${url}`);
  }
  return parsed.pathname;
}

async function sha256Hex(response: Response): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer()),
  );
  return hex(digest);
}

function expectedContentType(path: string): RegExp | null {
  const clean = path.split(/[?#]/, 1)[0].toLowerCase();
  if (clean.endsWith('.js')) return /^(?:text|application)\/javascript\b/;
  if (clean.endsWith('.css')) return /^text\/css\b/;
  if (clean.endsWith('.html') || clean === '/') return /^text\/html\b/;
  if (clean.endsWith('.svg')) return /^image\/svg\+xml\b/;
  if (clean.endsWith('.png')) return /^image\/png\b/;
  if (clean.endsWith('.woff2')) return /^font\/woff2\b/;
  if (clean.endsWith('.woff')) return /^(?:font\/woff|application\/font-woff)\b/;
  if (clean.endsWith('.webmanifest')) return /^(?:application\/manifest\+json|application\/json)\b/;
  return null;
}

async function assertCacheable(
  path: string,
  revision: string | null,
  response: Response,
): Promise<void> {
  if (!response.ok || response.redirected || response.type === 'error' || response.type === 'opaque') {
    throw new Error(`Precache-Abruf fehlgeschlagen: ${path}`);
  }
  const expected = expectedContentType(path);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (expected && !expected.test(contentType)) {
    throw new Error(`Unerwarteter Content-Type für ${path}`);
  }
  if (!revision || !/^[a-f0-9]{64}$/.test(revision)) {
    throw new Error(`Fehlende SHA-256-Revision für ${path}`);
  }
  if ((await sha256Hex(response)) !== revision) {
    throw new Error(`Precache-Revision stimmt nicht: ${path}`);
  }
}

/**
 * Populate one PRIVATE build cache. This intentionally fails on the first
 * missing/wrong asset; the install handler then deletes the private cache and
 * rejects installation. Since callers use a versioned name, partial writes are
 * never visible to the old active worker.
 */
export async function populateBuildPrecache(
  cache: CacheWriter,
  manifest: readonly PrecacheManifestEntry[],
  fetchAsset: AssetFetcher,
): Promise<void> {
  const entries = manifest.map((entry) => ({ ...entry, path: manifestPath(entry.url) }));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.path)) throw new Error(`Doppelter Precache-Pfad: ${entry.path}`);
    seen.add(entry.path);
  }
  const shellEntry = entries.find((entry) => entry.path === '/index.html');
  if (!shellEntry) throw new Error('Precache-Manifest enthält keine index.html.');

  const assets = entries
    .filter((entry) => entry.path !== '/index.html')
    .sort((a, b) => a.path.localeCompare(b.path));
  for (const entry of assets) {
    const path = entry.path;
    const response = await fetchAsset(path);
    await assertCacheable(path, entry.revision, response);
    await cache.put(path, response);
  }

  // The app shell is HTML and — unlike the immutable, hash-named assets — can be rewritten
  // in flight by a CDN. Cloudflare's "JavaScript Detections" (and any managed challenge)
  // injects a PER-REQUEST inline script into the document, so the shell's bytes differ on
  // every fetch and can NEVER match a build-time hash. Byte-verifying it therefore bricks
  // every client the instant the edge injects — a fleet-wide update freeze.
  //
  // Integrity of the EXECUTABLE code does not rest on the shell's bytes: the response CSP
  // (script-src 'self', no 'unsafe-inline') makes any inline or cross-origin script inert,
  // and this worker's fetch handler only ever serves manifest-verified same-origin assets.
  // So verify the shell STRUCTURALLY instead — every same-origin script/stylesheet it pulls
  // must be a byte-verified precache entry, and it must boot a verified module — then cache
  // the served shell as-is (an injected inline challenge script is inert under the CSP).
  const shell = await fetchAsset('/');
  if (!shell.ok || shell.redirected || shell.type === 'error' || shell.type === 'opaque') {
    throw new Error('Shell-Abruf fehlgeschlagen: /');
  }
  if (!/^text\/html\b/.test(shell.headers.get('content-type')?.toLowerCase() ?? '')) {
    throw new Error('Shell hat unerwarteten Content-Type.');
  }
  assertShellReferencesOnlyVerified(await shell.clone().text(), seen);
  await cache.put('/index.html', shell);
}

/**
 * Structural integrity of the app shell. The HTML document may be edge-rewritten (a CDN can
 * inject bot-detection / challenge scripts), so its bytes cannot be pinned. What still holds:
 * the shell must not pull any same-origin script or stylesheet we did not byte-verify, and it
 * must boot a verified module. Inline and cross-origin scripts are independently neutralised by
 * the response CSP (script-src 'self', no 'unsafe-inline') — an injected inline challenge script
 * is inert and needs no policing here. This is defence in depth over the fetch handler, which
 * already refuses to serve any non-manifest script/style at runtime.
 */
export function assertShellReferencesOnlyVerified(html: string, verified: ReadonlySet<string>): void {
  const refs: string[] = [];
  // <script …> that carries a src attribute (inline scripts have none — and are CSP-inert).
  // `[^>]*?` cannot cross the tag's own '>', so an inline script body's `s.src=…` is ignored.
  for (const m of html.matchAll(/<script\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
  // <link rel="stylesheet"|"modulepreload" … href="…">, attribute order-independent.
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["']?(?:stylesheet|modulepreload)\b/i.test(m[0])) continue;
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(m[0]);
    if (href) refs.push(href[1]);
  }
  let bootsVerifiedModule = false;
  for (const ref of refs) {
    const parsed = new URL(ref, 'https://local.invalid');
    if (parsed.origin !== 'https://local.invalid') throw new Error(`Shell zieht eine fremde Ressource: ${ref}`);
    if (!verified.has(parsed.pathname)) throw new Error(`Shell referenziert nicht verifizierte Ressource: ${parsed.pathname}`);
    if (parsed.pathname.endsWith('.js')) bootsVerifiedModule = true;
  }
  if (!bootsVerifiedModule) throw new Error('Shell lädt kein verifiziertes App-Modul.');
}
