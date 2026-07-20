// Structural guard: the unguarded ratchet core exists ONLY for the negative
// control in ratchet-commit.test.mjs. If application code ever imports it, the
// commit discipline is bypassed on that path — and the whole point of putting
// the guard inside ratchetDecrypt was that no call site can opt out.
//
// A comment saying "do not use" is a wish. This is the enforcement.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(p)) files.push(p);
  }
})(root);

const NAME = '__decryptIntoUnsafeForTests';
const offenders = files.filter((f) => {
  const src = readFileSync(f, 'utf8');
  // The declaration itself lives in ratchet.ts — that one is expected.
  if (f.endsWith('ratchet.ts')) return src.split(NAME).length - 1 > 1;
  return src.includes(NAME);
});

console.log('\n[Struktur: ungeschützter Ratchet-Kern bleibt testexklusiv]');
ok(`kein Anwendungscode importiert ${NAME}`, offenders.length === 0);
if (offenders.length) console.log('        ' + offenders.join('\n        '));
ok('Quellbaum wurde tatsaechlich durchsucht', files.length > 10);

// Complement: the guarded entry point must actually be used by the app layer,
// otherwise this file would pass on a codebase that decrypts nowhere at all.
const usesGuarded = files.some((f) => readFileSync(f, 'utf8').includes('ratchetDecrypt('));
ok('ratchetDecrypt wird vom Anwendungscode benutzt', usesGuarded);

// --- Same guard on the ARTEFACT ------------------------------------------
// src/ is what we write; dist/ is what users execute. Guarding only the source
// checks our intent, not the thing that ships — and it answers a second
// question for free: whether the unused export is tree-shaken out at all.
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let bundles = [];
try {
  const walkDist = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walkDist(p);
      else if (p.endsWith('.js')) bundles.push(p);
    }
  };
  walkDist(dist);
} catch {
  bundles = [];
}

console.log('\n[Artefakt: dist/ enthält den unsicheren Kern nicht]');
if (bundles.length === 0) {
  console.log('  --    dist/ nicht gebaut — übersprungen (npm run build zuerst)');
} else {
  const hits = bundles.filter((f) => readFileSync(f, 'utf8').includes(NAME));
  ok(`kein dist/-Bundle enthält ${NAME}`, hits.length === 0);
  if (hits.length) console.log('        ' + hits.join('\n        '));
  ok('dist/ wurde tatsaechlich durchsucht', bundles.length > 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
