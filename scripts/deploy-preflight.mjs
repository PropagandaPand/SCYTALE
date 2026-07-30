#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export class DeployPreflightError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DeployPreflightError';
  }
}

function git(cwd, args, description) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new DeployPreflightError(`${description}: git konnte nicht gestartet werden.`);
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new DeployPreflightError(`${description}${detail ? `: ${detail}` : '.'}`);
  }
  return result.stdout.trim();
}

function optionalGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

/**
 * Refuse deployments whose bytes cannot be tied to the exact current remote
 * branch. The remote is queried read-only instead of trusting a possibly stale
 * local origin/* tracking ref.
 */
export function runDeployPreflight(cwd = process.cwd()) {
  if (optionalGit(cwd, ['rev-parse', '--is-inside-work-tree']) !== 'true') {
    throw new DeployPreflightError('Deployment nur aus einem Git-Worktree erlaubt.');
  }

  const dirty = git(
    cwd,
    ['status', '--porcelain=v1', '--untracked-files=all'],
    'Git-Status konnte nicht geprüft werden',
  );
  if (dirty) {
    throw new DeployPreflightError(
      'Deployment verweigert: Der Worktree enthält staged, geänderte oder ungetrackte Dateien.',
    );
  }

  const branch = optionalGit(cwd, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
  if (!branch) {
    throw new DeployPreflightError('Deployment verweigert: Detached HEAD ist nicht zulässig.');
  }

  const remote = optionalGit(cwd, ['config', '--get', `branch.${branch}.remote`]);
  const mergeRef = optionalGit(cwd, ['config', '--get', `branch.${branch}.merge`]);
  if (!remote || !mergeRef.startsWith('refs/heads/')) {
    throw new DeployPreflightError(
      `Deployment verweigert: Branch ${branch} besitzt keinen veröffentlichten Upstream.`,
    );
  }

  const head = git(cwd, ['rev-parse', '--verify', 'HEAD'], 'Lokaler HEAD fehlt');
  const trackedHead = optionalGit(cwd, ['rev-parse', '--verify', '@{upstream}']);
  if (!trackedHead || trackedHead !== head) {
    throw new DeployPreflightError(
      `Deployment verweigert: Branch ${branch} ist nicht exakt auf seinem lokalen Upstream-Stand.`,
    );
  }

  let remoteHead;
  if (remote === '.') {
    remoteHead = optionalGit(cwd, ['rev-parse', '--verify', mergeRef]);
  } else {
    const advertised = git(
      cwd,
      ['ls-remote', '--exit-code', remote, mergeRef],
      `Remote-Branch ${remote}/${mergeRef.slice('refs/heads/'.length)} ist nicht erreichbar`,
    );
    remoteHead = advertised
      .split('\n')
      .map((line) => line.split(/\s+/, 2))
      .find(([, ref]) => ref === mergeRef)?.[0];
  }

  if (!remoteHead || !/^[0-9a-f]{40,64}$/.test(remoteHead) || remoteHead !== head) {
    throw new DeployPreflightError(
      `Deployment verweigert: HEAD entspricht nicht dem aktuell veröffentlichten Remote-Branch ${remote}/${mergeRef.slice('refs/heads/'.length)}.`,
    );
  }

  return { branch, remote, head };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const state = runDeployPreflight();
    console.log(`Deploy-Preflight OK: ${state.branch} @ ${state.head.slice(0, 12)} ist sauber und veröffentlicht.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Deploy-Preflight fehlgeschlagen.');
    process.exitCode = 1;
  }
}
