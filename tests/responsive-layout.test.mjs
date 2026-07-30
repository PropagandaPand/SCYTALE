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
const html = readFileSync(join(root, 'index.html'), 'utf8');
const desktopCss = css.slice(css.indexOf('@media (min-width: 900px)'));

console.log('\n[responsive messenger master-detail layout]');

ok('conversation list is extracted into one reusable pane',
  (messenger.match(/const conversationListEl\s*=/g) ?? []).length === 1 &&
  messenger.includes('<aside className="messenger-sidebar"'));
ok('all detail views share the same messenger shell',
  messenger.includes('const renderMessengerShell =') &&
  (messenger.match(/return renderMessengerShell\(/g) ?? []).length >= 9);
ok('mobile list and detail panes are mutually exclusive',
  css.includes('.messenger-shell.list-view .messenger-pane') &&
  css.includes('.messenger-shell:not(.list-view) .messenger-sidebar') &&
  /list-view \.messenger-pane,[\s\S]*?not\(\.list-view\) \.messenger-sidebar\s*\{\s*display:\s*none/.test(css));
ok('wide breakpoint restores both panes as a master-detail layout',
  css.includes('@media (min-width: 900px)') &&
  desktopCss.includes('flex-direction: row') &&
  desktopCss.includes('flex: 0 0 clamp(330px, 29vw, 390px)'));
ok('wide app shell grows but remains bounded',
  desktopCss.includes('max-width: 1400px') &&
  desktopCss.includes('#app > .lock'));
ok('desktop list view has a purposeful empty detail state',
  messenger.includes('className="desktop-empty"') &&
  messenger.includes("t('Wähle links einen Chat aus.')"));
ok('active conversations are exposed visually and accessibly',
  messenger.includes("aria-current={selected ? 'page' : undefined}") &&
  desktopCss.includes('.conv-row.active'));
ok('conversation search is a real filter input',
  messenger.includes('type="search"') &&
  messenger.includes('setConversationQuery') &&
  messenger.includes('convItems.length === 0'));
ok('chat reading width and bubble width are capped on desktop',
  desktopCss.includes('width: min(100%, 860px)') &&
  desktopCss.includes('max-width: min(72%, 620px)'));
ok('detail forms keep a readable maximum width',
  desktopCss.includes('.subbody,') &&
  desktopCss.includes('width: min(100%, 760px)'));
ok('only the redundant chat back button is hidden on desktop',
  desktopCss.includes('.chat-back') &&
  !desktopCss.includes('.subhead .back {\n    display: none'));
ok('explainer is scoped to the desktop detail pane',
  desktopCss.includes('.messenger-pane > .xpl') &&
  desktopCss.includes('position: absolute'));
ok('browser zoom remains available for accessible reflow',
  !html.includes('user-scalable=no') &&
  !html.includes('maximum-scale=1'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
