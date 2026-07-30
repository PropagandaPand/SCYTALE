import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const preflight = fileURLToPath(new URL('../scripts/deploy-preflight.mjs', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'scytale-deploy-preflight-'));
const remote = join(temp, 'remote.git');
const repo = join(temp, 'work');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function run(cwd = repo) {
  return spawnSync(process.execPath, [preflight], { cwd, encoding: 'utf8' });
}

console.log('\n[deploy preflight: clean + published provenance]');
try {
  git(temp, 'init', '--bare', '--initial-branch=main', remote);
  git(temp, 'clone', remote, repo);
  git(repo, 'config', 'user.name', 'SKYTALE Test');
  git(repo, 'config', 'user.email', 'test@invalid.example');
  git(repo, 'config', 'commit.gpgsign', 'false');
  writeFileSync(join(repo, 'app.txt'), 'v1\n');
  git(repo, 'add', 'app.txt');
  git(repo, 'commit', '-m', 'initial');
  git(repo, 'push', '-u', 'origin', 'main');

  ok('sauberer Branch auf exakt demselben Remote-Commit besteht', run().status === 0);

  appendFileSync(join(repo, 'app.txt'), 'dirty\n');
  ok('geänderte getrackte Datei blockiert Deployment', run().status !== 0);
  git(repo, 'checkout', '--', 'app.txt');

  writeFileSync(join(repo, 'untracked.txt'), 'untracked\n');
  ok('ungetrackte Datei blockiert Deployment', run().status !== 0);
  rmSync(join(repo, 'untracked.txt'));

  appendFileSync(join(repo, 'app.txt'), 'v2\n');
  git(repo, 'add', 'app.txt');
  git(repo, 'commit', '-m', 'local ahead');
  ok('lokaler, noch nicht gepushter Commit blockiert Deployment', run().status !== 0);
  git(repo, 'push', 'origin', 'main');
  ok('derselbe Commit besteht unmittelbar nach dem Push', run().status === 0);

  git(repo, 'checkout', '-b', 'local-only');
  ok('Branch ohne veröffentlichten Upstream blockiert Deployment', run().status !== 0);
  git(repo, 'checkout', 'main');

  const peer = join(temp, 'peer');
  git(temp, 'clone', remote, peer);
  git(peer, 'config', 'user.name', 'SKYTALE Test');
  git(peer, 'config', 'user.email', 'test@invalid.example');
  git(peer, 'config', 'commit.gpgsign', 'false');
  appendFileSync(join(peer, 'app.txt'), 'remote-v3\n');
  git(peer, 'add', 'app.txt');
  git(peer, 'commit', '-m', 'remote ahead');
  git(peer, 'push', 'origin', 'main');
  ok('aktueller Remote-Stand wird geprüft, nicht nur der stale Tracking-Ref', run().status !== 0);
} catch (error) {
  console.log('  FAIL Testaufbau:', error instanceof Error ? error.message : error);
  fail++;
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
