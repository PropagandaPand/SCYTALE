#!/usr/bin/env node
/**
 * Test runner: bundles tests/entry.ts once, then runs every *.test.mjs.
 *
 * Suites are plain Node scripts that print "N ok, M fail" and exit non-zero on
 * failure. No framework — the value here is in what the assertions say, and a
 * framework would add a dependency to a project whose whole point is auditable
 * minimalism.
 *
 * XFAIL: a suite may declare itself an executable spec for something not built
 * yet by exporting nothing and printing "XFAIL" lines. Those suites are expected
 * to fail; the runner reports them separately and does NOT fail the run. They
 * turn green on their own when the feature lands — see tests/README.md.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2];

console.log('Bundling tests/entry.ts …');
execFileSync(
  'npx',
  ['esbuild', join(here, 'entry.ts'), '--bundle', '--format=esm', '--platform=node',
   `--outdir=${join(here, '.bundle')}`, '--splitting', '--log-level=error'],
  { stdio: 'inherit' },
);

const suites = readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort()
  .filter((f) => !only || f.includes(only));

let failed = 0, xfailed = 0, totalOk = 0;
for (const s of suites) {
  const isXfail = s.includes('.xfail.');
  const r = spawnSync('node', [join(here, s)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) ok, (\d+) fail/);
  const ok = m ? Number(m[1]) : 0;
  const bad = m ? Number(m[2]) : 1;
  totalOk += ok;

  if (isXfail) {
    xfailed++;
    console.log(`  XFAIL ${s.padEnd(34)} ${ok} ok, ${bad} offen  (Zielvorgabe — siehe tests/README.md)`);
    if (bad === 0) {
      console.log(`     ⚠ erfüllt sich jetzt — Datei umbenennen (.xfail. entfernen), sonst schützt sie nichts mehr.`);
    }
    continue;
  }
  if (r.status === 0 && bad === 0) {
    console.log(`  ok    ${s.padEnd(34)} ${ok} ok`);
  } else {
    failed++;
    console.log(`  FAIL  ${s.padEnd(34)} ${ok} ok, ${bad} fail`);
    console.log(out.split('\n').filter((l) => /FAIL|Error/.test(l)).map((l) => '        ' + l).join('\n'));
  }
}

console.log(`\n${totalOk} Assertions grün · ${failed} Suite(s) rot · ${xfailed} Zielvorgabe(n) offen`);
process.exit(failed ? 1 : 0);
