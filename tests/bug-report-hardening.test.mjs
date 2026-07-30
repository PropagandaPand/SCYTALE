import { readFileSync } from 'node:fs';
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

const index = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/BugReport.tsx', import.meta.url), 'utf8');

console.log('\n[bug report: schema + delivery truthfulness]');
ok('nur die vier erlaubten Kategorien werden akzeptiert',
  ['bug', 'crash', 'idea', 'other'].every((value) => S.isBugReportCategory(value)) &&
  ['', 'BUG', 'security', 'other\nBcc:x', null, 1].every((value) => !S.isBugReportCategory(value)));
const clientCategories = [...client.matchAll(/\{\s*key:\s*'([^']+)'/g)].map((match) => match[1]);
ok('Client-Auswahl und serverseitige Allowlist bleiben deckungsgleich',
  clientCategories.length === S.BUG_REPORT_CATEGORIES.length &&
  clientCategories.every((value) => S.BUG_REPORT_CATEGORIES.includes(value)));

const payload = S.bugReportWebhookPayload('x'.repeat(4000));
ok('Discord-Mentions sind vollständig deaktiviert',
  Array.isArray(payload.allowed_mentions?.parse) &&
  payload.allowed_mentions.parse.length === 0);
ok('Discord- und Slack-Nutzlasten bleiben hart begrenzt',
  payload.content.length === 1900 && payload.text.length === 3500);

const categoryGuard = index.indexOf('if (!isBugReportCategory(body.category))');
const sinkCheck = index.indexOf('if (!sinkResponse.ok)');
const success = index.indexOf('status: 204', sinkCheck);
ok('Worker lehnt unbekannte Kategorien vor Zustellung ab',
  categoryGuard >= 0 &&
  index.indexOf("new Response('Bad category', { status: 400 })", categoryGuard) > categoryGuard);
ok('fehlender oder nicht erreichbarer Sink liefert 503 statt Scheinerfolg',
  index.includes("new Response('Bug report sink unavailable'") &&
  index.includes('status: 503') &&
  !/if \(!webhook\)[\s\S]{0,300}status:\s*204/.test(index));
ok('nur ein bestätigter 2xx-Sink darf den 204-Erfolg auslösen',
  sinkCheck >= 0 && success > sinkCheck);

// Negative control: the pre-fix path swallowed a network error and then fell
// through to 204, even though only length metadata had reached console.log.
ok('Negativkontrolle: Sinkfehler werden nicht mehr geschluckt',
  !index.includes('sink down — the console.log above still captured it'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
