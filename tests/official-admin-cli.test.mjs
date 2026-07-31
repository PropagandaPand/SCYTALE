import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './.bundle/entry.js';
import { publishManifest } from '../scripts/official-admin.mjs';

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

console.log('\n[Official-Admin Offline-Werkzeug]');

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tool = join(repository, 'scripts', 'official-admin.mjs');
const temp = mkdtempSync(join(tmpdir(), 'skytale-admin-cli-'));
const rootPath = join(temp, 'root.json');
const manifestPath = join(temp, 'manifest.json');
const rootPassphrase = 'offline root passphrase with high entropy 2026';

function run(args, input = '') {
  return spawnSync(process.execPath, [tool, ...args], {
    cwd: repository,
    encoding: 'utf8',
    input,
  });
}

try {
  const help = run(['--help']);
  ok('Werkzeug dokumentiert Root-Erzeugung, Signatur, öffentliche Prüfung und Publish',
    help.status === 0 &&
    /init-root/.test(help.stdout) &&
    /sign/.test(help.stdout) &&
    /verify --public-key/.test(help.stdout) &&
    /publish/.test(help.stdout) &&
    /without terminal echo/.test(help.stdout));

  const initialized = run(
    ['init-root', '--private-key', rootPath],
    `${rootPassphrase}\n${rootPassphrase}\n`,
  );
  const rootText = readFileSync(rootPath, 'utf8');
  const rootFile = JSON.parse(rootText);
  ok('Root-Key wird exklusiv im expliziten Pfad mit Modus 0600 erzeugt',
    initialized.status === 0 &&
    (statSync(rootPath).mode & 0o777) === 0o600 &&
    rootFile.v === 2 &&
    rootFile.algorithm === 'Ed25519' &&
    /^[A-Za-z0-9_-]{43}$/.test(rootFile.publicKey));
  ok('Root-Datei nutzt fest begrenztes memory-hard scrypt und AES-256-GCM',
    rootFile.kdf?.name === 'scrypt' &&
    rootFile.kdf.N === 131072 &&
    rootFile.kdf.r === 8 &&
    rootFile.kdf.p === 1 &&
    rootFile.kdf.maxmem === 160 * 1024 * 1024 &&
    rootFile.cipher?.name === 'aes-256-gcm' &&
    /^[A-Za-z0-9_-]+$/.test(rootFile.cipher.ciphertext) &&
    /^[A-Za-z0-9_-]{22}$/.test(rootFile.cipher.tag));
  ok('Root-Datei und Ausgaben enthalten weder PKCS8-Klartext noch Passphrase',
    !rootText.includes('privateKeyPkcs8') &&
    !rootText.includes(rootPassphrase) &&
    !initialized.stdout.includes(rootPassphrase) &&
    !initialized.stderr.includes(rootPassphrase) &&
    !initialized.stdout.includes(rootFile.cipher.ciphertext) &&
    !initialized.stderr.includes(rootFile.cipher.ciphertext));

  const admin = await S.generateIdentity();
  const prekeys = await S.createFreshPreKeyState(admin);
  const bundle = await S.encodeBundle(S.currentBundle(admin, prekeys));
  const signed = run([
    'sign',
    '--private-key', rootPath,
    '--bundle', bundle,
    '--sequence', '1',
    '--valid-days', '30',
    '--output', manifestPath,
  ], `${rootPassphrase}\n`);
  const manifestText = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestText);
  ok('Entschlüsselter Signaturpfad erzeugt ein kanonisches ThePhantomPuppet/ADMIN-Manifest',
    signed.status === 0 &&
    manifest.displayName === 'ThePhantomPuppet' &&
    manifest.badge === 'ADMIN' &&
    manifest.alias === 'SKYTALE-SUPPORT' &&
    manifest.bundle === bundle &&
    manifestText.trim() === S.canonicalOfficialAccountManifestJson(manifest));
  ok('Manifest und Signaturausgaben leaken weder Root-Chiffrat noch Passphrase',
    !manifestText.includes(rootFile.cipher.ciphertext) &&
    !manifestText.includes(rootPassphrase) &&
    !signed.stdout.includes(rootPassphrase) &&
    !signed.stderr.includes(rootPassphrase));

  const revokedMaster = await S.generateIdentity();
  const revokedMasterB64 = S.base64urlEncode(revokedMaster.master.publicKey);
  const rotatedManifestPath = join(temp, 'manifest-seq2.json');
  const rotated = run([
    'sign',
    '--private-key', rootPath,
    '--bundle', bundle,
    '--sequence', '2',
    '--supersedes', manifestPath,
    '--revoke', revokedMasterB64,
    '--valid-days', '30',
    '--output', rotatedManifestPath,
  ], `${rootPassphrase}\n`);
  const rotatedManifest = existsSync(rotatedManifestPath)
    ? JSON.parse(readFileSync(rotatedManifestPath, 'utf8'))
    : null;
  ok('sign trägt den Vorgänger-Widerrufsatz fort und ergänzt --revoke kanonisch und signiert',
    rotated.status === 0 &&
    Array.isArray(rotatedManifest?.revokedMasters) &&
    rotatedManifest.revokedMasters.length === 1 &&
    rotatedManifest.revokedMasters[0] === revokedMasterB64 &&
    (await S.verifyOfficialAccountDocument(rotatedManifest, {
      rootPublicKey: S.base64urlDecode(rootFile.publicKey, 32),
    })).sequence === 2);

  const stalePath = join(temp, 'stale-supersede.json');
  const staleSupersede = run([
    'sign', '--private-key', rootPath, '--bundle', bundle,
    '--sequence', '1', '--supersedes', manifestPath, '--output', stalePath,
  ], `${rootPassphrase}\n`);
  ok('--supersedes verlangt eine kleinere Sequenz als das neue Manifest',
    staleSupersede.status !== 0 &&
    /kleinere Sequenz/.test(staleSupersede.stderr) &&
    !existsSync(stalePath));

  const verified = run([
    'verify',
    '--public-key', rootFile.publicKey,
    '--manifest', manifestPath,
  ]);
  ok('Verify benötigt ausschließlich Public Key und Manifest',
    verified.status === 0 &&
    /vollständig gültig/.test(verified.stdout) &&
    !/Root-Passphrase/.test(verified.stderr));
  const legacyPrivateVerify = run([
    'verify',
    '--private-key', rootPath,
    '--manifest', manifestPath,
  ]);
  ok('Verify verweigert jeden Private-Key-Parameter',
    legacyPrivateVerify.status !== 0 && /Unbekanntes Argument: --private-key/.test(legacyPrivateVerify.stderr));

  const wrongPassPath = join(temp, 'wrong-pass.json');
  const wrongPass = run([
    'sign', '--private-key', rootPath, '--bundle', bundle,
    '--sequence', '2', '--output', wrongPassPath,
  ], 'definitely the wrong root passphrase\n');
  ok('Falsche Passphrase scheitert generisch und erzeugt kein Manifest',
    wrongPass.status !== 0 &&
    !existsSync(wrongPassPath) &&
    /nicht entschlüsselt oder validiert/.test(wrongPass.stderr) &&
    !wrongPass.stderr.includes('definitely the wrong root passphrase'));

  const tamperedRootPath = join(temp, 'tampered-root.json');
  const tamperedRoot = structuredClone(rootFile);
  tamperedRoot.publicKey = `${tamperedRoot.publicKey[0] === 'A' ? 'B' : 'A'}${tamperedRoot.publicKey.slice(1)}`;
  writeFileSync(tamperedRootPath, JSON.stringify(tamperedRoot), { mode: 0o600 });
  const tampered = run([
    'sign', '--private-key', tamperedRootPath, '--bundle', bundle,
    '--sequence', '2', '--output', join(temp, 'tampered-manifest.json'),
  ], `${rootPassphrase}\n`);
  ok('AEAD-AAD bindet Public Key und sämtliche KDF-/Cipher-Metadaten',
    tampered.status !== 0 && /nicht entschlüsselt oder validiert/.test(tampered.stderr));

  const downgradedRootPath = join(temp, 'downgraded-root.json');
  const downgradedRoot = structuredClone(rootFile);
  downgradedRoot.kdf.N = 16384;
  writeFileSync(downgradedRootPath, JSON.stringify(downgradedRoot), { mode: 0o600 });
  const downgraded = run([
    'sign', '--private-key', downgradedRootPath, '--bundle', bundle,
    '--sequence', '2', '--output', join(temp, 'downgraded-manifest.json'),
  ]);
  ok('Manipulierte oder herabgesetzte KDF-Parameter werden vor Ableitung abgelehnt',
    downgraded.status !== 0 && /unsicher parametrisiert/.test(downgraded.stderr));

  const overwriteRoot = run(
    ['init-root', '--private-key', rootPath],
    `${rootPassphrase}\n${rootPassphrase}\n`,
  );
  const overwriteManifest = run([
    'sign',
    '--private-key', rootPath,
    '--bundle', bundle,
    '--sequence', '2',
    '--valid-days', '30',
    '--output', manifestPath,
  ], `${rootPassphrase}\n`);
  ok('Werkzeug überschreibt weder Root-Key noch bestehendes Manifest still',
    overwriteRoot.status !== 0 && overwriteManifest.status !== 0);

  const excessiveLifetime = run([
    'sign',
    '--private-key', rootPath,
    '--bundle', bundle,
    '--sequence', '2',
    '--valid-days', '46',
    '--output', join(temp, 'too-long.json'),
  ], `${rootPassphrase}\n`);
  ok('CLI begrenzt das Replay-Fenster für Frischinstallationen auf 45 Tage',
    excessiveLifetime.status !== 0 && /höchstens 45/.test(excessiveLifetime.stderr));

  const worktreeFields = execFileSync(
    'git', ['-C', repository, 'worktree', 'list', '--porcelain', '-z'], { encoding: 'utf8' },
  ).split('\0');
  const otherWorktree = worktreeFields
    .filter((field) => field.startsWith('worktree '))
    .map((field) => resolve(field.slice('worktree '.length)))
    .find((path) => path !== repository);
  const forbiddenWorktreePath = otherWorktree
    ? join(otherWorktree, `.official-admin-root-path-test-${process.pid}.json`)
    : null;
  const forbiddenWorktree = forbiddenWorktreePath
    ? run(['init-root', '--private-key', forbiddenWorktreePath])
    : null;
  const commonGitDir = execFileSync(
    'git', ['-C', repository, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
    { encoding: 'utf8' },
  ).trim();
  const forbiddenGitPath = join(commonGitDir, `.official-admin-root-path-test-${process.pid}.json`);
  const forbiddenGit = run(['init-root', '--private-key', forbiddenGitPath]);
  ok('Private Root-Pfade sind in jedem registrierten Worktree und im gemeinsamen Git-Verzeichnis gesperrt',
    !!otherWorktree &&
    forbiddenWorktree?.status !== 0 &&
    !existsSync(forbiddenWorktreePath) &&
    forbiddenGit.status !== 0 &&
    !existsSync(forbiddenGitPath) &&
    /Git-Worktree/.test(forbiddenWorktree.stderr) &&
    /Git-Worktree/.test(forbiddenGit.stderr));

  const publicKeyBytes = S.base64urlDecode(rootFile.publicKey, 32);
  let digestCalls = 0;
  const publishRuntime = {
    OFFICIAL_ACCOUNT_ROUTE_ALIAS: 'skytale-support',
    canonicalOfficialAccountManifestJson: S.canonicalOfficialAccountManifestJson,
    officialAccountManifestDigest: async (value) => {
      digestCalls++;
      return S.officialAccountManifestDigest(value);
    },
    verifyOfficialAccountDocument: (value) => S.verifyOfficialAccountDocument(value, {
      rootPublicKey: publicKeyBytes,
    }),
  };
  const publishValues = new Map([
    ['--manifest', manifestPath],
    ['--origin', 'https://skytale.chat'],
  ]);
  const originalFetch = globalThis.fetch;
  try {
    const methods = [];
    let storedDocument = '';
    globalThis.fetch = async (_url, options = {}) => {
      methods.push(options.method);
      if (options.method === 'PUT') {
        storedDocument = options.body;
        return new Response(JSON.stringify({ status: 'created', sequence: 1 }), {
          status: 201,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
      }
      return new Response(storedDocument, {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    };
    await publishManifest(publishValues, publishRuntime);
    ok('Publish akzeptiert exaktes Receipt und bestätigt per GET kanonisches Dokument plus Digest',
      methods.join(',') === 'PUT,GET' &&
      storedDocument === S.canonicalOfficialAccountManifestJson(manifest) &&
      digestCalls === 2);

    let readbackAttempted = false;
    globalThis.fetch = async (_url, options = {}) => {
      if (options.method === 'GET') readbackAttempted = true;
      return new Response(JSON.stringify({ status: 'created', sequence: 1, extra: true }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    };
    let badReceiptRejected = false;
    try {
      await publishManifest(publishValues, publishRuntime);
    } catch (error) {
      badReceiptRejected = /Bestätigungsschema/.test(String(error));
    }
    ok('Publish lehnt zusätzliche, fehlende oder semantisch falsche Receipt-Felder ab',
      badReceiptRejected && !readbackAttempted);

    globalThis.fetch = async (_url, options = {}) => {
      if (options.method === 'PUT') {
        return new Response(JSON.stringify({ status: 'created', sequence: 1 }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(`${S.canonicalOfficialAccountManifestJson(manifest)}\n`, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    let nonCanonicalRejected = false;
    try {
      await publishManifest(publishValues, publishRuntime);
    } catch (error) {
      nonCanonicalRejected = /bytegenau/.test(String(error));
    }
    ok('Publish lehnt einen semantisch gleichen, aber nicht bytegenau kanonischen Readback ab',
      nonCanonicalRejected);

    let digestInvocation = 0;
    const inconsistentDigestRuntime = {
      ...publishRuntime,
      officialAccountManifestDigest: async (value) => {
        digestInvocation++;
        return digestInvocation === 1
          ? S.officialAccountManifestDigest(value)
          : 'A'.repeat(43);
      },
    };
    globalThis.fetch = async (_url, options = {}) => {
      if (options.method === 'PUT') {
        return new Response(JSON.stringify({ status: 'created', sequence: 1 }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(S.canonicalOfficialAccountManifestJson(manifest), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    let digestMismatchRejected = false;
    try {
      await publishManifest(publishValues, inconsistentDigestRuntime);
    } catch (error) {
      digestMismatchRejected = /kryptografisch/.test(String(error));
    }
    ok('Publish vergleicht zusätzlich den kryptografischen Manifest-Digest',
      digestMismatchRejected && digestInvocation === 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const source = readFileSync(tool, 'utf8');
  ok('Passphrase und Private Root-Daten kommen nie aus env oder Argumentwerten',
    source.includes("required(values, '--private-key')") &&
    source.includes('readSecret(') &&
    source.includes('assertPrivateKeyOutsideRepository') &&
    !/process\.env\.[A-Z0-9_]*(?:ROOT|PRIVATE|KEY|PASS)/.test(source) &&
    !/--(?:passphrase|password|private-key-(?:bytes|value))/.test(source));
  const publishBlock = source.slice(
    source.indexOf('export async function publishManifest'),
    source.indexOf('async function main'),
  );
  ok('Online-Publish liest keinen privaten Root und nutzt PUT plus überprüften GET-Readback',
    !publishBlock.includes('loadRoot') &&
    !publishBlock.includes('--private-key') &&
    publishBlock.includes("method: 'PUT'") &&
    publishBlock.includes("method: 'GET'") &&
    publishBlock.includes('readbackDigest !== expectedDigest'));
  ok('Publish ist auf beide absichtlich aktiven Produktionsorigins begrenzt',
    source.includes("'https://skytale.chat'") &&
    source.includes("'https://scytale.illogical.workers.dev'") &&
    source.includes('PRODUCTION_ORIGINS.has(url.origin)'));
} finally {
  // Exact mkdtemp-owned path only; no user file can fall under this target.
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
