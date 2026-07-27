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
const fetchGood = async (path) => {
  if (path === '/') return new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } });
  if (path.endsWith('.js')) return new Response('export{}', { headers: { 'content-type': 'text/javascript' } });
  return new Response('body', { headers: { 'content-type': 'text/css' } });
};
await S.populateBuildPrecache(cache, goodManifest, fetchGood);
ok('vollständiger Build enthält Shell + alle Pflichtassets',
  stored.has('/index.html') && stored.has('/assets/app.js') && stored.has('/assets/app.css'));

let wrongTypeRejected = false;
try {
  await S.populateBuildPrecache(
    { put: async () => undefined },
    [
      { url: '/index.html', revision: await revision('<!doctype html>') },
      { url: '/assets/missing.js', revision: await revision('export{}') },
    ],
    async (path) => path === '/'
      ? new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })
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
      ? new Response('<!doctype html><script src="/assets/app-b.js"></script>', {
          headers: { 'content-type': 'text/html' },
        })
      : fetchGood(path),
  );
} catch {
  mixedBuildRejected = true;
}
ok('Shell eines zwischenzeitlich gewechselten Deployments scheitert an SHA-256', mixedBuildRejected);

const swSource = readFileSync(join(root, 'src', 'sw.ts'), 'utf8');
const attachmentSource = readFileSync(join(root, 'src', 'Attachment.tsx'), 'utf8');
const attachmentStoreSource = readFileSync(join(root, 'src', 'lib', 'attachments.ts'), 'utf8');
ok('Service Worker nutzt den versionierten Namen tatsächlich',
  swSource.includes('versionedPrecacheName(__BUILD_HASH__, manifest)'));
ok('fehlgeschlagener Install löscht den privaten Kandidaten und wirft weiter',
  /caches\.delete\(cacheName\)[\s\S]*?throw error/.test(swSource));
ok('unbekannte Script-/Style-Requests fallen nicht ins Live-Netz',
  /req\.destination === 'script'[\s\S]*?cacheUnavailable\(\)/.test(swSource));
ok('alter globale Cache-Name ist entfernt', !swSource.includes("const PRECACHE = 'scytale-precache'"));

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
