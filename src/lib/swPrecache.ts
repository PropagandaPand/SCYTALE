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
type CacheReader = Pick<Cache, 'match'>;
type AssetFetcher = (path: string) => Promise<Response>;

function manifestPath(url: string): string {
  // Workbox emits canonical relative paths while tests/config may supply the
  // equivalent root-relative form. Accept those two path-only forms, but never
  // an authority, a scheme, a backslash URL, or dot-segment normalization.
  if (
    !url ||
    url.startsWith('//') ||
    url.includes('\\') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url)
  ) {
    throw new Error(`Ungültige Precache-URL: ${url}`);
  }
  const canonical = url.startsWith('/') ? url : `/${url}`;
  const parsed = new URL(canonical, 'https://local.invalid');
  if (
    parsed.origin !== 'https://local.invalid' ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== canonical
  ) {
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

function expectedContentTypes(path: string): readonly string[] | null {
  const clean = path.split(/[?#]/, 1)[0].toLowerCase();
  if (clean.endsWith('.js')) return ['text/javascript', 'application/javascript'];
  if (clean.endsWith('.css')) return ['text/css'];
  if (clean.endsWith('.html') || clean === '/') return ['text/html'];
  if (clean.endsWith('.svg')) return ['image/svg+xml'];
  if (clean.endsWith('.png')) return ['image/png'];
  if (clean.endsWith('.webp')) return ['image/webp'];
  if (clean.endsWith('.mp4')) return ['video/mp4'];
  if (clean.endsWith('.woff2')) return ['font/woff2'];
  if (clean.endsWith('.woff')) return ['font/woff', 'application/font-woff'];
  if (clean.endsWith('.webmanifest')) return ['application/manifest+json', 'application/json'];
  return null;
}

function contentTypeEssence(raw: string): string | null {
  // MIME/HTTP parsing uses ASCII OWS, not JavaScript's wider Unicode `trim`.
  // Reject combined/ambiguous header values and compare the exact type/subtype
  // before optional parameters; `text/html+evil` is not HTML.
  if (!raw || /[^\x09\x20-\x7e]/.test(raw) || raw.includes(',')) return null;
  const semicolon = raw.indexOf(';');
  if (
    semicolon >= 0 &&
    !/^[\t ]*charset[\t ]*=[\t ]*(?:utf-8|"utf-8")[\t ]*$/i.test(
      raw.slice(semicolon + 1),
    )
  ) {
    return null;
  }
  const essence = (semicolon < 0 ? raw : raw.slice(0, semicolon))
    .replace(/^[\t ]+|[\t ]+$/g, '')
    .toLowerCase();
  const token = "[!#$%&'*+.^_`|~0-9a-z-]+";
  return new RegExp(`^${token}/${token}$`).test(essence) ? essence : null;
}

async function assertCacheable(
  path: string,
  revision: string | null,
  response: Response,
): Promise<void> {
  if (!response.ok || response.redirected || response.type === 'error' || response.type === 'opaque') {
    throw new Error(`Precache-Abruf fehlgeschlagen: ${path}`);
  }
  if (response.headers.has('content-disposition')) {
    throw new Error(`Precache-Antwort erzwingt einen Download: ${path}`);
  }
  const expected = expectedContentTypes(path);
  const contentType = contentTypeEssence(response.headers.get('content-type') ?? '');
  if (expected && (!contentType || !expected.includes(contentType))) {
    throw new Error(`Unerwarteter Content-Type für ${path}`);
  }
  if (!revision || !/^[a-f0-9]{64}$/.test(revision)) {
    throw new Error(`Fehlende SHA-256-Revision für ${path}`);
  }
  if ((await sha256Hex(response)) !== revision) {
    throw new Error(`Precache-Revision stimmt nicht: ${path}`);
  }
}

const REQUIRED_SHELL_CSP = new Map<string, ReadonlySet<string>>([
  ['default-src', new Set(["'self'"])],
  ['base-uri', new Set(["'none'"])],
  ['object-src', new Set(["'none'"])],
  ['frame-ancestors', new Set(["'none'"])],
  ['frame-src', new Set(["'none'"])],
  ['form-action', new Set(["'none'"])],
  ['script-src', new Set(["'self'", "'wasm-unsafe-eval'"])],
  ['script-src-attr', new Set(["'none'"])],
  ['style-src', new Set(["'self'"])],
  ['style-src-elem', new Set(["'self'"])],
  ['style-src-attr', new Set(["'unsafe-inline'"])],
  ['img-src', new Set(["'self'", 'data:', 'blob:'])],
  ['media-src', new Set(["'self'", 'blob:'])],
  ['font-src', new Set(["'self'"])],
  ['connect-src', new Set(["'self'"])],
  ['worker-src', new Set(["'self'"])],
  ['manifest-src', new Set(["'self'"])],
]);

/**
 * The edge response, not merely the Worker source, is the security boundary for
 * an edge-rewritten HTML shell. Require one unambiguous, enforced policy whose
 * security-critical directives exactly match the narrow policy the application needs.
 */
function assertStrictShellCsp(response: Response): void {
  const raw = response.headers.get('content-security-policy');
  if (!raw) throw new Error('Shell hat keine erzwungene Content-Security-Policy.');

  // CSP's grammar uses ASCII whitespace. JavaScript `\s` additionally accepts
  // NBSP and other Unicode separators which Chromium does NOT treat as CSP
  // token boundaries. Accepting those here could make this validator see
  // `script-src 'self'` while the browser ignores the malformed directive and
  // executes an otherwise tolerated edge-injected inline script.
  if (/[^\x09\x20-\x7e]/.test(raw)) {
    throw new Error('Shell-CSP enthält Nicht-ASCII- oder Steuerzeichen.');
  }

  // Fetch combines repeated response headers with a comma. Multiple policies
  // are normally intersected by browsers, but rejecting the combined syntax
  // avoids relying on differing CSP/header parsers at this trust boundary.
  if (raw.includes(',')) throw new Error('Shell hat eine mehrdeutige Content-Security-Policy.');

  const directives = new Map<string, string[]>();
  for (const rawDirective of raw.split(';')) {
    const directive = rawDirective.replace(/^[\t ]+|[\t ]+$/g, '');
    if (!directive) continue;
    const [rawName, ...rawValues] = directive.split(/[\t ]+/);
    const name = rawName.toLowerCase();
    if (!/^[a-z0-9-]+$/.test(name) || directives.has(name)) {
      throw new Error('Shell hat eine ungültige Content-Security-Policy.');
    }
    directives.set(name, rawValues.map((value) => value.toLowerCase()));
  }

  for (const [name, expected] of REQUIRED_SHELL_CSP) {
    const actual = directives.get(name);
    if (
      !actual ||
      actual.length !== expected.size ||
      actual.some((source) => !expected.has(source))
    ) {
      throw new Error(`Shell-CSP muss ${name} in der erwarteten strikten Form erzwingen.`);
    }
  }

  // CSP has many sink-specific directives (frame-src, style-src-elem, …) which
  // override a checked fallback directive. Accepting arbitrary extras would let
  // an edge rewrite weaken exactly one phishing/execution sink while all required
  // directives still look strict. The production policy is deliberately closed,
  // so require that exact directive set.
  for (const name of directives.keys()) {
    if (!REQUIRED_SHELL_CSP.has(name)) {
      throw new Error(`Shell-CSP enthält die unerwartete Direktive ${name}.`);
    }
  }
}

interface NormalizedManifestEntry extends PrecacheManifestEntry {
  path: string;
}

function normalizeManifest(
  manifest: readonly PrecacheManifestEntry[],
): NormalizedManifestEntry[] {
  const entries = manifest.map((entry) => ({ ...entry, path: manifestPath(entry.url) }));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.path)) throw new Error(`Doppelter Precache-Pfad: ${entry.path}`);
    if (!entry.revision || !/^[a-f0-9]{64}$/.test(entry.revision)) {
      throw new Error(`Fehlende SHA-256-Revision für ${entry.path}`);
    }
    seen.add(entry.path);
  }
  return entries;
}

async function assertCacheableShell(
  response: Response,
  verifiedPaths: ReadonlySet<string>,
): Promise<void> {
  if (!response.ok || response.redirected || response.type === 'error' || response.type === 'opaque') {
    throw new Error('Shell-Abruf fehlgeschlagen.');
  }
  if (response.headers.has('content-disposition')) {
    throw new Error('Shell darf keinen Content-Disposition-Header enthalten.');
  }
  if (contentTypeEssence(response.headers.get('content-type') ?? '') !== 'text/html') {
    throw new Error('Shell hat unerwarteten Content-Type.');
  }
  // `Refresh` is a non-standard response-header equivalent of meta refresh and
  // can navigate a standalone PWA cross-origin; CSP does not constrain top-level
  // navigation. Never persist or serve an injected navigation instruction.
  if (response.headers.has('refresh')) {
    throw new Error('Shell darf keinen Refresh-Header enthalten.');
  }
  assertStrictShellCsp(response);
  assertShellReferencesOnlyVerified(await response.clone().text(), verifiedPaths);
}

/**
 * Read one manifest entry only from the caller-selected cache and authenticate
 * the exact bytes again. CacheStorage is origin-wide and page JavaScript can
 * write it, so install-time verification alone is not a trust boundary.
 */
export async function matchVerifiedManifestAsset(
  cache: CacheReader,
  request: Request | string,
  entry: PrecacheManifestEntry,
): Promise<Response | undefined> {
  try {
    const path = manifestPath(entry.url);
    const requestUrl = new URL(
      typeof request === 'string' ? request : request.url,
      'https://local.invalid',
    );
    if (requestUrl.search || requestUrl.hash || requestUrl.pathname !== path) return undefined;
    const hit = await cache.match(request);
    if (!hit) return undefined;
    await assertCacheable(path, entry.revision, hit);
    return hit;
  } catch {
    return undefined;
  }
}

/**
 * Read the active build's shell and re-run its complete CSP/HTML/reference
 * validation. The shell may contain a CSP-inert Cloudflare-injected inline
 * snippet, so its own edge-rewritten bytes are structurally authenticated while
 * every resource it can load remains bound to a SHA-256 manifest entry.
 */
export async function matchVerifiedShell(
  cache: CacheReader,
  manifest: readonly PrecacheManifestEntry[],
): Promise<Response | undefined> {
  try {
    const entries = normalizeManifest(manifest);
    if (!entries.some((entry) => entry.path === '/index.html')) return undefined;
    const hit = await cache.match('/index.html');
    if (!hit) return undefined;
    await assertCacheableShell(hit, new Set(entries.map((entry) => entry.path)));
    return hit;
  } catch {
    return undefined;
  }
}

/**
 * Populate one versioned build cache. This intentionally fails on the first
 * missing/wrong asset; the install handler then deletes the candidate cache and
 * rejects installation. Since callers use a versioned name, partial writes are
 * never visible to the old active worker.
 */
export async function populateBuildPrecache(
  cache: CacheWriter,
  manifest: readonly PrecacheManifestEntry[],
  fetchAsset: AssetFetcher,
): Promise<void> {
  const entries = normalizeManifest(manifest);
  const seen = new Set(entries.map((entry) => entry.path));
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
  // Integrity of the EXECUTABLE code does not rest on the shell's bytes: the delivered CSP
  // must exactly match the application's closed policy, which makes inline/cross-origin
  // scripts and injected phishing sinks inert, and this worker's fetch handler only ever
  // serves manifest-verified same-origin assets. So verify that header and the shell
  // STRUCTURALLY before caching the served shell as-is.
  const shell = await fetchAsset('/');
  await assertCacheableShell(shell, seen);
  await cache.put('/index.html', shell);
}

/**
 * Self-contained recovery document for a missing/corrupt active shell. It has
 * no network permissions and uses a fresh nonce instead of unsafe-inline or DOM
 * event attributes.
 */
export function navigationFallbackResponse(): Response {
  const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    `style-src 'nonce-${nonce}'`,
    "style-src-attr 'none'",
    `script-src 'nonce-${nonce}'`,
    "script-src-attr 'none'",
  ].join('; ');
  const html =
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>SKYTALE</title>' +
    `<style nonce="${nonce}">html,body{margin:0;height:100%;background:#0b0c0e;color:#e7e9ec;` +
    'font:15px/1.6 -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center}' +
    'main{text-align:center;padding:24px}b{color:#12a488}button{margin-top:14px;padding:10px 18px;border:0;' +
    'border-radius:10px;background:#12a488;color:#fff;font:inherit}</style>' +
    '<main><p><b>SKYTALE</b></p><p id="m">Lädt…</p><button id="retry" type="button">Neu laden</button></main>' +
    `<script nonce="${nonce}">document.getElementById("retry").addEventListener("click",function(){location.reload()});` +
    'function stop(){var el=document.getElementById("m");if(el)el.textContent=' +
    '"Konnte nicht laden — tippe Neu laden.";}try{var k="skytale-nav-retry";' +
    'if(sessionStorage.getItem(k)){stop();}else{sessionStorage.setItem(k,"1");' +
    'setTimeout(function(){location.reload()},1500);}}catch(e){stop();}</script>';
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'content-security-policy': csp,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'x-frame-options': 'DENY',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
    },
  });
}

interface ShellTag {
  name: string;
  closing: boolean;
  selfClosing: boolean;
  attributes: Map<string, string | null>;
}

/**
 * Parse only the deliberately tiny HTML subset emitted by our build. This is
 * intentionally not a forgiving browser parser: malformed/error-recovery syntax
 * is rejected so the validator and Chromium cannot disagree about active markup.
 */
function parseShellTag(raw: string): ShellTag {
  if (
    !raw.startsWith('<') ||
    !raw.endsWith('>') ||
    raw.slice(1, -1).includes('<') ||
    /^<[\t\n\f\r ]/.test(raw) ||
    /^<\/[\t\n\f\r ]/.test(raw)
  ) {
    throw new Error('Shell enthält mehrdeutige HTML-Syntax.');
  }
  // Browsers do not recognize whitespace between `<` (or `</`) and the tag
  // name. Never trim it into a valid tag: doing so would let this validator
  // close an element which Chromium keeps open, hiding the rest of the shell.
  let inner = raw.slice(1, -1).replace(/[\t\n\f\r ]+$/g, '');
  const closing = inner.startsWith('/');
  if (closing) {
    inner = inner.slice(1).replace(/[\t\n\f\r ]+$/g, '');
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(inner)) {
      throw new Error('Shell enthält einen ungültigen End-Tag.');
    }
    return {
      name: inner.toLowerCase(),
      closing: true,
      selfClosing: false,
      attributes: new Map(),
    };
  }

  let selfClosing = false;
  if (inner.endsWith('/')) {
    selfClosing = true;
    inner = inner.slice(0, -1).replace(/[\t\n\f\r ]+$/g, '');
  }
  const nameMatch = /^[A-Za-z][A-Za-z0-9]*/.exec(inner);
  if (!nameMatch) throw new Error('Shell enthält einen ungültigen Start-Tag.');
  const name = nameMatch[0].toLowerCase();
  const attributes = new Map<string, string | null>();
  let cursor = nameMatch[0].length;
  while (cursor < inner.length) {
    const spacing = /^[\t\n\f\r ]+/.exec(inner.slice(cursor));
    if (!spacing) throw new Error(`Shell enthält ungültige Attribute an ${name}.`);
    cursor += spacing[0].length;
    if (cursor === inner.length) break;
    const attrMatch = /^[A-Za-z][A-Za-z0-9-]*/.exec(inner.slice(cursor));
    if (!attrMatch) throw new Error(`Shell enthält ein ungültiges Attribut an ${name}.`);
    const attrName = attrMatch[0].toLowerCase();
    if (attributes.has(attrName)) throw new Error(`Shell enthält das Attribut ${attrName} mehrfach.`);
    cursor += attrMatch[0].length;
    const afterAttributeName = cursor;
    const afterName = /^[\t\n\f\r ]*/.exec(inner.slice(cursor))?.[0] ?? '';
    cursor += afterName.length;
    let value: string | null = null;
    if (inner[cursor] === '=') {
      cursor++;
      const afterEquals = /^[\t\n\f\r ]*/.exec(inner.slice(cursor))?.[0] ?? '';
      cursor += afterEquals.length;
      const quote = inner[cursor];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`Shell muss ${attrName} in Anführungszeichen setzen.`);
      }
      const end = inner.indexOf(quote, cursor + 1);
      if (end < 0) throw new Error(`Shell enthält einen offenen Attributwert an ${name}.`);
      value = inner.slice(cursor + 1, end);
      if (!value || /[&<>\u0000]/.test(value)) {
        throw new Error(`Shell enthält einen mehrdeutigen Attributwert an ${name}.`);
      }
      cursor = end + 1;
    } else {
      // Leave separating whitespace for the next loop iteration. Consuming it
      // here would make a boolean attribute followed by another attribute look
      // concatenated to this strict parser.
      cursor = afterAttributeName;
    }
    attributes.set(attrName, value);
  }
  return { name, closing: false, selfClosing, attributes };
}

function requireOnlyAttributes(
  tag: ShellTag,
  allowed: readonly string[],
): void {
  for (const name of tag.attributes.keys()) {
    if (!allowed.includes(name)) {
      throw new Error(`Shell enthält das unerwartete Attribut ${name} an ${tag.name}.`);
    }
  }
}

function requireVerifiedShellRef(ref: string | null | undefined, verified: ReadonlySet<string>): string {
  if (!ref) throw new Error('Shell enthält eine Ressource ohne Ziel.');
  // Accept only a canonical root-relative path. An absolute reference to the
  // parser's synthetic base (`https://local.invalid/...`) would otherwise look
  // same-origin here while being cross-origin in the real SKYTALE document.
  if (!ref.startsWith('/') || ref.startsWith('//') || ref.includes('\\')) {
    throw new Error(`Shell referenziert eine nicht verifizierte Ressource: ${ref}`);
  }
  const parsed = new URL(ref, 'https://local.invalid');
  if (
    parsed.origin !== 'https://local.invalid' ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== ref ||
    !verified.has(ref)
  ) {
    throw new Error(`Shell referenziert eine nicht verifizierte Ressource: ${ref}`);
  }
  return ref;
}

/**
 * Structural integrity of the app shell. Its bytes may be edge-rewritten because
 * Cloudflare injects a per-request inline JavaScript-Detections snippet. The
 * closed CSP makes that no-attribute inline script inert; everything that can
 * render, navigate, restyle, brand, or load a resource is checked against a
 * strict grammar and the byte-verified build manifest.
 */
export function assertShellReferencesOnlyVerified(html: string, verified: ReadonlySet<string>): void {
  if (html.includes('<!--')) throw new Error('Shell darf keine HTML-Kommentare enthalten.');
  if (html.includes('\u0000')) throw new Error('Shell darf keine NUL-Zeichen enthalten.');

  const doctype = /^[\t\n\f\r ]*<!doctype[\t\n\f\r ]+html[\t\n\f\r ]*>/i.exec(html);
  if (!doctype) throw new Error('Shell muss mit einem eindeutigen HTML-Doctype beginnen.');

  const stack: string[] = [];
  let cursor = doctype[0].length;
  let sawHtml = false;
  let sawHead = false;
  let closedHead = false;
  let sawBody = false;
  let closedBody = false;
  let sawApp = false;
  let closedApp = false;
  let sawTitle = false;
  let titleText = '';
  let bootsVerifiedModule = false;

  const parent = (): string | undefined => stack[stack.length - 1];
  while (cursor < html.length) {
    if (html[cursor] !== '<') {
      const next = html.indexOf('<', cursor);
      const end = next < 0 ? html.length : next;
      const text = html.slice(cursor, end);
      if (parent() === 'title') titleText += text;
      else if (/[^\t\n\f\r ]/.test(text)) {
        throw new Error('Shell enthält sichtbaren Text außerhalb des Titels.');
      }
      cursor = end;
      continue;
    }

    const tagEnd = html.indexOf('>', cursor + 1);
    if (tagEnd < 0) throw new Error('Shell enthält einen offenen HTML-Tag.');
    const raw = html.slice(cursor, tagEnd + 1);
    const tag = parseShellTag(raw);

    if (!tag.closing && tag.name === 'script') {
      if (tag.selfClosing || (parent() !== 'head' && parent() !== 'body')) {
        throw new Error('Shell enthält ein Script außerhalb von Head/Body.');
      }
      // Find the FIRST sequence a browser can treat as a script end tag. Do not
      // skip malformed forms such as `</script x>`: Chromium closes the raw-text
      // element there even though a narrower regex might hide subsequent active
      // markup inside the apparent script body.
      const closeStartPattern = /<\/script(?=[\t\n\f\r />])/gi;
      closeStartPattern.lastIndex = tagEnd + 1;
      const closeStart = closeStartPattern.exec(html);
      if (!closeStart) throw new Error('Shell enthält ein Script ohne eindeutigen End-Tag.');
      const closeEnd = html.indexOf('>', closeStart.index + closeStart[0].length);
      if (closeEnd < 0) throw new Error('Shell enthält einen offenen Script-End-Tag.');
      const closeRaw = html.slice(closeStart.index, closeEnd + 1);
      if (!/^<\/script[\t\n\f\r ]*>$/i.test(closeRaw)) {
        throw new Error('Shell enthält einen mehrdeutigen Script-End-Tag.');
      }
      const scriptBody = html.slice(tagEnd + 1, closeStart.index);
      const src = tag.attributes.get('src');
      if (src !== undefined) {
        requireOnlyAttributes(tag, ['type', 'crossorigin', 'src']);
        if (
          parent() !== 'head' ||
          tag.attributes.get('type') !== 'module' ||
          (tag.attributes.get('crossorigin') !== null &&
            tag.attributes.get('crossorigin') !== 'anonymous') ||
          /[^\t\n\f\r ]/.test(scriptBody)
        ) {
          throw new Error('Shell enthält ein nicht kanonisches externes App-Script.');
        }
        const path = requireVerifiedShellRef(src, verified);
        if (!path.endsWith('.js')) throw new Error('Shell-App-Script hat keinen JavaScript-Pfad.');
        bootsVerifiedModule = true;
      } else {
        // The only tolerated edge delta is the CSP-inert, no-attribute inline
        // JavaScript-Detections snippet observed on the production origin.
        if (tag.attributes.size !== 0) {
          throw new Error('Shell enthält ein unerwartet attributiertes Inline-Script.');
        }
      }
      cursor = closeEnd + 1;
      continue;
    }

    if (tag.closing) {
      if (stack.pop() !== tag.name) throw new Error('Shell enthält falsch verschachtelte HTML-Tags.');
      if (tag.name === 'head') closedHead = true;
      if (tag.name === 'body') closedBody = true;
      if (tag.name === 'div') closedApp = true;
      cursor = tagEnd + 1;
      continue;
    }

    switch (tag.name) {
      case 'html':
        if (sawHtml || stack.length !== 0 || tag.selfClosing) throw new Error('Shell enthält kein eindeutiges html-Element.');
        requireOnlyAttributes(tag, ['lang']);
        if (tag.attributes.get('lang') !== 'de') throw new Error('Shell enthält eine unerwartete Dokumentensprache.');
        sawHtml = true;
        stack.push('html');
        break;
      case 'head':
        if (!sawHtml || sawHead || parent() !== 'html' || tag.attributes.size || tag.selfClosing) {
          throw new Error('Shell enthält keinen eindeutigen Head.');
        }
        sawHead = true;
        stack.push('head');
        break;
      case 'body':
        if (!closedHead || sawBody || parent() !== 'html' || tag.attributes.size || tag.selfClosing) {
          throw new Error('Shell enthält keinen unveränderten Body.');
        }
        sawBody = true;
        stack.push('body');
        break;
      case 'title':
        if (parent() !== 'head' || sawTitle || tag.attributes.size || tag.selfClosing) {
          throw new Error('Shell enthält keinen eindeutigen Titel.');
        }
        sawTitle = true;
        stack.push('title');
        break;
      case 'div':
        if (
          parent() !== 'body' ||
          sawApp ||
          tag.selfClosing ||
          tag.attributes.size !== 1 ||
          tag.attributes.get('id') !== 'app'
        ) {
          throw new Error('Shell muss genau den unveränderten App-Mount enthalten.');
        }
        sawApp = true;
        stack.push('div');
        break;
      case 'meta': {
        if (parent() !== 'head') throw new Error('Shell enthält Meta-Daten außerhalb des Head.');
        requireOnlyAttributes(tag, ['charset', 'name', 'content']);
        const charset = tag.attributes.get('charset');
        const name = tag.attributes.get('name');
        const content = tag.attributes.get('content');
        const valid =
          (tag.attributes.size === 1 && charset?.toLowerCase() === 'utf-8') ||
          (tag.attributes.size === 2 &&
            name === 'viewport' &&
            content ===
              'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content') ||
          (tag.attributes.size === 2 && name === 'theme-color' && content === '#0b0c0e');
        if (!valid) throw new Error('Shell enthält unerwartete Meta-Daten.');
        break;
      }
      case 'link': {
        if (parent() !== 'head') throw new Error('Shell enthält eine Link-Ressource außerhalb des Head.');
        requireOnlyAttributes(tag, ['rel', 'href', 'type', 'crossorigin']);
        const rel = tag.attributes.get('rel');
        const href = tag.attributes.get('href');
        if (
          !rel ||
          !['stylesheet', 'modulepreload', 'icon', 'apple-touch-icon', 'manifest'].includes(rel)
        ) {
          throw new Error('Shell enthält eine unerwartete Link-Beziehung.');
        }
        if (
          tag.attributes.has('crossorigin') &&
          tag.attributes.get('crossorigin') !== null &&
          tag.attributes.get('crossorigin') !== 'anonymous'
        ) {
          throw new Error('Shell enthält eine unerwartete Cross-Origin-Einstellung.');
        }
        const type = tag.attributes.get('type');
        if (
          (rel === 'icon' && type !== 'image/svg+xml' && type !== 'image/png') ||
          (rel !== 'icon' && type !== undefined)
        ) {
          throw new Error('Shell enthält einen unerwarteten Link-Typ.');
        }
        requireVerifiedShellRef(href, verified);
        break;
      }
      default:
        throw new Error(`Shell enthält das unerwartete HTML-Element ${tag.name}.`);
    }
    if (tag.selfClosing && tag.name !== 'meta' && tag.name !== 'link') {
      throw new Error(`Shell enthält ein unerwartet selbstschließendes ${tag.name}-Element.`);
    }
    cursor = tagEnd + 1;
  }

  if (
    stack.length !== 0 ||
    !sawHtml ||
    !sawHead ||
    !closedHead ||
    !sawBody ||
    !closedBody ||
    !sawApp ||
    !closedApp
  ) {
    throw new Error('Shell ist strukturell unvollständig.');
  }
  if (
    !sawTitle ||
    titleText.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '') !== 'SKYTALE'
  ) {
    throw new Error('Shell enthält nicht den erwarteten Produkttitel.');
  }
  if (!bootsVerifiedModule) throw new Error('Shell lädt kein verifiziertes App-Modul.');
}
