// Static UI regression contract for contact sharing:
// - nearby contacts keep the self-contained QR flow (including old #add links);
// - remote sharing sends a short, non-link contact code so an installed PWA is
//   not bypassed by the operating system opening an HTTPS URL in the browser.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0;
let fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const messenger = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');
const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');

// Extract a function/conditional body without being confused by JSX callbacks,
// strings, template literals or comments inside it.
function balancedBlockAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return '';
  const open = source.indexOf('{', markerAt + marker.length);
  if (open < 0) return '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return source.slice(open + 1, index);
  }
  return '';
}

const updateShareBundle = balancedBlockAfter(
  messenger,
  'function updateShareBundle(token: string)',
);
const addBundle = balancedBlockAfter(
  messenger,
  'async function addBundle(rawInput: string, signal?: AbortSignal)',
);
const contactShareText = balancedBlockAfter(
  messenger,
  'function contactShareText(): string',
);
const shareContactCode = balancedBlockAfter(
  messenger,
  'async function shareContactCode()',
);
const pasteAndAdd = balancedBlockAfter(
  messenger,
  'async function pasteAndAdd(signal?: AbortSignal)',
);
const addView = balancedBlockAfter(messenger, "if (view === 'add')");
const readyCodeCss =
  css.match(/\.contact-code-box\.ready\s*\{([\s\S]*?)\}/)?.[1] ?? '';

console.log('\n[Kontakt teilen: persönlicher QR bleibt offline/self-contained]');

ok('QR-Bundle bleibt der vollständige rückwärtskompatible #add-Link',
  updateShareBundle.includes('const link = `${location.origin}/#add=${token}`;') &&
  updateShareBundle.includes('return link;'));
ok('Boot und Schlüsselwechsel rendern diesen vollständigen Link mit makeQr',
  (messenger.match(/makeQr\(updateShareBundle\(token\)\)/g) ?? []).length >= 2);
ok('der sichtbare QR und der kurze Ferncode bleiben zwei getrennte UI-Werte',
  addView.includes('<img src={qrDataUrl}') &&
  addView.includes('contact-code-box') &&
  addView.includes('{contactCodeLabel}'));

console.log('\n[Kontakt teilen: Fernfreigabe ist bewusst kein Browserlink]');

ok('normaler Sharetext enthält den kurzen Kontaktcode',
  contactShareText.includes('contactCode'));
ok('normaler Sharetext enthält weder alten Link-State noch URL-Bestandteile',
  contactShareText.length > 0 &&
  !/\bshareLink\b/.test(contactShareText) &&
  !/\blocation(?:\.origin)?\b/.test(contactShareText) &&
  !/https?:|#add=|www\./i.test(contactShareText));
ok('native Share-Sheet und Fallback versenden ausschließlich denselben Text',
  shareContactCode.includes('const text = contactShareText();') &&
  /navigator\.share\s*\(\s*\{\s*text\s*\}\s*\)/.test(shareContactCode) &&
  shareContactCode.includes('navigator.clipboard.writeText(text)') &&
  !/\burl\s*:/.test(shareContactCode) &&
  !/\bshareLink\b/.test(shareContactCode));

console.log('\n[Kontakt teilen: Ready/Retry-UX und einheitlicher Importpfad]');

ok('Teilen wartet auf Ready und ein Fehlschlag wird zum expliziten Retry',
  addView.includes("disabled={contactCodeStatus === 'publishing' || contactCodeStatus === 'idle'}") &&
  addView.includes("if (contactCodeStatus === 'failed')") &&
  addView.includes('launchRuntimeOperation((signal) => ensureContactInvite(signal))') &&
  addView.includes("t('Erneut versuchen')"));
ok('separates Kopieren ist erst mit einem fertigen Kurzcode aktiv',
  addView.includes('disabled={!contactCodeReady}') &&
  addView.includes('void copyContactCode()'));
ok('Clipboard, manuelle Eingabe und Scanner reichen ein Runtime-Abbruchsignal weiter',
  addView.includes('launchRuntimeOperation((signal) => pasteAndAdd(signal))') &&
  addView.includes('launchRuntimeOperation((signal) => addBundle(addInput, signal))') &&
  addView.includes('launchRuntimeOperation((signal) => addBundle(text, signal))') &&
  pasteAndAdd.includes('await addBundle(text, signal)'));

const extractCodeAt = addBundle.indexOf('extractContactCode(rawInput)');
const resolveAt = addBundle.indexOf('resolveContactInvite(shortCode, signal)');
const decodeAt = addBundle.indexOf('decodeBundle(token)');
ok('addBundle löst einen Kurzcode vor der bestehenden Bundle-Prüfung auf',
  extractCodeAt >= 0 &&
  resolveAt > extractCodeAt &&
  decodeAt > resolveAt);

console.log('\n[Kontakt teilen: bestehende Links und lesbarer Code bleiben erhalten]');

const legacyHashAt = messenger.indexOf(
  "const hashMatch = location.hash.match(/[#&]add=([^&]+)/);",
);
const legacyAddAt = messenger.indexOf(
  'await addBundle(decodeURIComponent(hashMatch[1]));',
  legacyHashAt,
);
ok('bereits geteilte #add-Links werden beim Boot weiterhin importiert',
  legacyHashAt >= 0 &&
  legacyAddAt > legacyHashAt &&
  messenger.slice(legacyHashAt, legacyAddAt).includes(
    "history.replaceState(null, '', location.pathname + location.search)",
  ));
ok('der Kurzcode ist selektierbar, monospace und ausreichend groß/kontrastreich',
  /font-family:\s*var\(--font-mono\)/.test(readyCodeCss) &&
  /font-size:\s*clamp\(12px,\s*3\.4vw,\s*15px\)/.test(readyCodeCss) &&
  /font-weight:\s*600/.test(readyCodeCss) &&
  /color:\s*var\(--text\)/.test(readyCodeCss) &&
  /user-select:\s*all/.test(readyCodeCss));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
