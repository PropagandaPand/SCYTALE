#!/usr/bin/env node
/**
 * Offline provisioning utility for SKYTALE's root-signed ADMIN identity.
 *
 * Private root material is read only from a passphrase-encrypted mode-0600 file
 * and is never printed, accepted as a command-line value, sent to the Worker,
 * or written into any worktree belonging to this repository.
 * Public manifests are produced with the exact production serializer and then
 * passed through the complete production verification path before being saved.
 */
import { build } from 'esbuild';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRealRoot = await realpath(repositoryRoot);
const execFile = promisify(execFileCallback);
const scrypt = promisify(scryptCallback);
const ROOT_FILE_MAX = 8192;
const MANIFEST_FILE_MAX = 96 * 1024;
const PUBLISH_RESPONSE_MAX = 512;
const PASSPHRASE_MIN_BYTES = 16;
const PASSPHRASE_MAX_BYTES = 1024;
const PIPED_SECRET_INPUT_MAX = 2 * (PASSPHRASE_MAX_BYTES + 2);
const ROOT_FILE_VERSION = 2;
const ROOT_KDF_N = 131_072;
const ROOT_KDF_R = 8;
const ROOT_KDF_P = 1;
const ROOT_KDF_MAXMEM = 160 * 1024 * 1024;
const ROOT_KDF_SALT_BYTES = 16;
const ROOT_CIPHER_NONCE_BYTES = 12;
const ROOT_CIPHER_TAG_BYTES = 16;
const ROOT_ENCRYPTION_KEY_BYTES = 32;
const ROOT_PRIVATE_KEY_MAX_BYTES = 512;
const ROOT_FILE_AAD_DOMAIN = 'SKYTALE/OFFICIAL-ADMIN-ROOT/v2\0';
const PRODUCTION_ORIGINS = new Set([
  'https://skytale.chat',
  'https://scytale.illogical.workers.dev',
]);

function usage() {
  return `SKYTALE Official Admin provisioning

Commands:
  npm run official-admin -- init-root --private-key /offline/path/admin-root.json
  npm run official-admin -- sign --private-key /offline/path/admin-root.json \\
    --bundle '<QR link or bundle>' --sequence 1 --valid-days 30 \\
    --output /safe/path/admin-manifest-v1.json
  npm run official-admin -- sign --private-key /offline/path/admin-root.json \\
    --descriptor /safe/path/public-admin-descriptor.json --sequence 2 \\
    --valid-days 30 --output /safe/path/admin-manifest-v2.json
  npm run official-admin -- verify --public-key '<base64url-public-key>' \\
    --manifest /safe/path/admin-manifest-v1.json
  npm run official-admin -- publish --manifest /safe/path/admin-manifest-v1.json \\
    --origin https://skytale.chat

Init asks twice and sign once for the root passphrase without terminal echo. The
root PRIVATE key is needed only for init/sign. Verify needs only the public key;
publish uses exclusively the public key already checked into this source tree.
Never put private key or passphrase bytes into an argument, environment variable,
repository, Worker, online deploy host, or PWA.`;
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const values = new Map();
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith('--') || value === undefined || value.startsWith('--')) {
      throw new Error(`Ungültiges Argument nahe ${flag ?? '(leer)'}.`);
    }
    if (values.has(flag)) throw new Error(`Argument ${flag} wurde doppelt angegeben.`);
    values.set(flag, value);
  }
  return { command, values };
}

function required(values, flag) {
  const value = values.get(flag);
  if (!value) throw new Error(`Pflichtargument fehlt: ${flag}`);
  return value;
}

function allowedOnly(values, allowed) {
  for (const flag of values.keys()) {
    if (!allowed.includes(flag)) throw new Error(`Unbekanntes Argument: ${flag}`);
  }
}

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function fromB64url(value, expectedBytes, maximumBytes = expectedBytes) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Nicht-kanonisches Base64url.');
  }
  const bytes = new Uint8Array(Buffer.from(value, 'base64url'));
  if (
    b64url(bytes) !== value ||
    (expectedBytes !== undefined && bytes.length !== expectedBytes) ||
    (maximumBytes !== undefined && bytes.length > maximumBytes)
  ) {
    throw new Error('Nicht-kanonisches Base64url oder falsche Länge.');
  }
  return bytes;
}

async function readSmallText(path, maximum) {
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maximum) {
    throw new Error(`Datei ${path} ist leer, kein reguläres File oder zu groß.`);
  }
  return readFile(path, 'utf8');
}

async function writeNewFile(path, value, mode) {
  await writeFile(path, value, { encoding: 'utf8', flag: 'wx', mode });
}

function pathIsInside(parent, candidate) {
  const rel = relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

let protectedGitRootsPromise;

async function protectedGitRoots() {
  if (!protectedGitRootsPromise) {
    protectedGitRootsPromise = (async () => {
      const [{ stdout: worktreeOutput }, { stdout: commonOutput }] = await Promise.all([
        execFile(
          'git',
          ['-C', repositoryRoot, 'worktree', 'list', '--porcelain', '-z'],
          { encoding: 'utf8', maxBuffer: 1024 * 1024 },
        ),
        execFile(
          'git',
          ['-C', repositoryRoot, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
          { encoding: 'utf8', maxBuffer: 16 * 1024 },
        ),
      ]);
      const roots = [repositoryRealRoot];
      for (const field of worktreeOutput.split('\0')) {
        if (!field.startsWith('worktree ')) continue;
        const path = field.slice('worktree '.length);
        if (!path) continue;
        try {
          roots.push(await realpath(path));
        } catch {
          // A stale/prunable registration is still rejected by its recorded path.
          roots.push(resolve(path));
        }
      }
      const commonPath = commonOutput.trim();
      if (!commonPath) throw new Error('Gemeinsames Git-Verzeichnis konnte nicht bestimmt werden.');
      roots.push(await realpath(isAbsolute(commonPath) ? commonPath : resolve(repositoryRoot, commonPath)));
      return [...new Set(roots)];
    })();
  }
  return protectedGitRootsPromise;
}

async function assertPrivateKeyOutsideRepository(path, existing) {
  const target = existing
    ? await realpath(path)
    : resolve(await realpath(dirname(path)), basename(path));
  if ((await protectedGitRoots()).some((root) => pathIsInside(root, target))) {
    throw new Error(
      'Root-Private-Key darf weder in einem SKYTALE-Git-Worktree noch im gemeinsamen Git-Verzeichnis liegen.',
    );
  }
}

let pipedSecretsPromise;

async function pipedSecrets() {
  if (!pipedSecretsPromise) {
    pipedSecretsPromise = (async () => {
      const chunks = [];
      let total = 0;
      for await (const chunk of process.stdin) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += bytes.length;
        if (total > PIPED_SECRET_INPUT_MAX) {
          for (const item of chunks) item.fill(0);
          bytes.fill(0);
          throw new Error('Passphrase-Eingabe ist zu groß.');
        }
        chunks.push(bytes);
      }
      const combined = Buffer.concat(chunks, total);
      for (const chunk of chunks) chunk.fill(0);
      const lines = [];
      let start = 0;
      for (let index = 0; index <= combined.length; index++) {
        if (index !== combined.length && combined[index] !== 0x0a) continue;
        let end = index;
        if (end > start && combined[end - 1] === 0x0d) end--;
        lines.push(Buffer.from(combined.subarray(start, end)));
        start = index + 1;
      }
      combined.fill(0);
      return lines;
    })();
  }
  return pipedSecretsPromise;
}

async function readTtySecret(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Interne TTY-Erkennung fehlgeschlagen.');
  }
  process.stderr.write(prompt);
  const storage = Buffer.alloc(PASSPHRASE_MAX_BYTES);
  let length = 0;
  let inEscapeSequence = false;
  return new Promise((resolveSecret, rejectSecret) => {
    const restore = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stderr.write('\n');
    };
    const fail = (error) => {
      storage.fill(0);
      restore();
      rejectSecret(error);
    };
    const finish = () => {
      const result = Buffer.from(storage.subarray(0, length));
      storage.fill(0);
      restore();
      resolveSecret(result);
    };
    const onData = (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      try {
        for (let index = 0; index < bytes.length; index++) {
          const byte = bytes[index];
          if (byte === 0x03) return fail(new Error('Abgebrochen.'));
          if (byte === 0x0d || byte === 0x0a) return finish();
          if (inEscapeSequence) {
            if (byte >= 0x40 && byte <= 0x7e) inEscapeSequence = false;
            continue;
          }
          if (byte === 0x1b) {
            inEscapeSequence = true;
            continue;
          }
          if (byte === 0x7f || byte === 0x08) {
            if (length > 0) {
              length--;
              while (length > 0 && (storage[length] & 0xc0) === 0x80) length--;
            }
            continue;
          }
          if (byte < 0x20) continue;
          if (length >= PASSPHRASE_MAX_BYTES) {
            return fail(new Error('Passphrase-Eingabe ist zu groß.'));
          }
          storage[length++] = byte;
        }
      } finally {
        bytes.fill(0);
      }
    };
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function readSecret(prompt) {
  if (process.stdin.isTTY) return readTtySecret(prompt);
  process.stderr.write(prompt);
  const lines = await pipedSecrets();
  const secret = lines.shift();
  if (!secret) throw new Error('Passphrase fehlt auf der Standardeingabe.');
  return secret;
}

async function wipePendingSecrets() {
  if (!pipedSecretsPromise) return;
  try {
    const lines = await pipedSecretsPromise;
    for (const line of lines) line.fill(0);
    lines.length = 0;
  } catch {
    // The bounded reader already wiped every chunk it retained before failing.
  }
}

function validatePassphrase(secret) {
  if (secret.length < PASSPHRASE_MIN_BYTES || secret.length > PASSPHRASE_MAX_BYTES) {
    throw new Error(
      `Root-Passphrase muss ${PASSPHRASE_MIN_BYTES} bis ${PASSPHRASE_MAX_BYTES} UTF-8-Bytes lang sein.`,
    );
  }
}

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}

function rootFileAad(value) {
  return Buffer.from(ROOT_FILE_AAD_DOMAIN + JSON.stringify({
    v: value.v,
    algorithm: value.algorithm,
    rootKeyId: value.rootKeyId,
    publicKey: value.publicKey,
    kdf: value.kdf,
    cipher: { name: value.cipher.name, nonce: value.cipher.nonce },
  }), 'utf8');
}

function parseEncryptedRootFile(value, runtime) {
  if (
    !exactKeys(value, ['v', 'algorithm', 'rootKeyId', 'publicKey', 'kdf', 'cipher']) ||
    value.v !== ROOT_FILE_VERSION ||
    value.algorithm !== 'Ed25519' ||
    value.rootKeyId !== runtime.OFFICIAL_ACCOUNT_ROOT_KEY_ID ||
    typeof value.publicKey !== 'string' ||
    !exactKeys(value.kdf, ['name', 'salt', 'N', 'r', 'p', 'maxmem']) ||
    value.kdf.name !== 'scrypt' ||
    value.kdf.N !== ROOT_KDF_N ||
    value.kdf.r !== ROOT_KDF_R ||
    value.kdf.p !== ROOT_KDF_P ||
    value.kdf.maxmem !== ROOT_KDF_MAXMEM ||
    !exactKeys(value.cipher, ['name', 'nonce', 'ciphertext', 'tag']) ||
    value.cipher.name !== 'aes-256-gcm'
  ) {
    throw new Error('Ungültiges oder unsicher parametrisiertes Root-Key-Dateiformat.');
  }
  return {
    value,
    publicKey: fromB64url(value.publicKey, 32),
    salt: fromB64url(value.kdf.salt, ROOT_KDF_SALT_BYTES),
    nonce: fromB64url(value.cipher.nonce, ROOT_CIPHER_NONCE_BYTES),
    ciphertext: fromB64url(value.cipher.ciphertext, undefined, ROOT_PRIVATE_KEY_MAX_BYTES),
    tag: fromB64url(value.cipher.tag, ROOT_CIPHER_TAG_BYTES),
  };
}

async function deriveRootEncryptionKey(passphrase, salt) {
  return Buffer.from(await scrypt(
    passphrase,
    salt,
    ROOT_ENCRYPTION_KEY_BYTES,
    { N: ROOT_KDF_N, r: ROOT_KDF_R, p: ROOT_KDF_P, maxmem: ROOT_KDF_MAXMEM },
  ));
}

async function loadRuntime() {
  const result = await build({
    stdin: {
      contents: [
        "export * from './src/lib/officialAccount.ts';",
        "export * from './src/lib/officialAccountManifest.ts';",
      ].join('\n'),
      resolveDir: repositoryRoot,
      sourcefile: 'official-admin-runtime.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  const source = Buffer.from(result.outputFiles[0].contents).toString('base64');
  return import(`data:text/javascript;base64,${source}`);
}

async function loadRoot(path, runtime) {
  await assertPrivateKeyOutsideRepository(path, true);
  const metadata = await stat(path);
  if (!metadata.isFile() || (metadata.mode & 0o077) !== 0) {
    throw new Error('Root-Key-Datei muss ein reguläres File ohne Gruppen-/Fremdrechte (0600) sein.');
  }
  const encrypted = parseEncryptedRootFile(
    JSON.parse(await readSmallText(path, ROOT_FILE_MAX)),
    runtime,
  );
  const passphrase = await readSecret('Root-Passphrase: ');
  let encryptionKey;
  let aad;
  let clearPart;
  let clearFinal;
  let privateBytes;
  let selfTestSignature;
  try {
    validatePassphrase(passphrase);
    encryptionKey = await deriveRootEncryptionKey(passphrase, encrypted.salt);
    aad = rootFileAad(encrypted.value);
    const decipher = createDecipheriv(
      encrypted.value.cipher.name,
      encryptionKey,
      encrypted.nonce,
      { authTagLength: ROOT_CIPHER_TAG_BYTES },
    );
    decipher.setAAD(aad);
    decipher.setAuthTag(encrypted.tag);
    clearPart = decipher.update(encrypted.ciphertext);
    clearFinal = decipher.final();
    privateBytes = Buffer.concat([clearPart, clearFinal]);
    if (privateBytes.length < 1 || privateBytes.length > ROOT_PRIVATE_KEY_MAX_BYTES) {
      throw new Error('private-key-size');
    }
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateBytes,
      { name: 'Ed25519' },
      false,
      ['sign'],
    );
    // Bind the decrypted private half to the authenticated public half before it
    // can be used for an operational signature.
    const challenge = new TextEncoder().encode('SKYTALE/OFFICIAL-ADMIN-ROOT-SELFTEST/v1\0');
    selfTestSignature = new Uint8Array(await crypto.subtle.sign('Ed25519', privateKey, challenge));
    const publicKey = await crypto.subtle.importKey(
      'raw',
      encrypted.publicKey,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    const matches = await crypto.subtle.verify('Ed25519', publicKey, selfTestSignature, challenge);
    if (!matches) throw new Error('root-key-mismatch');
    return { publicKey: encrypted.publicKey, privateKey };
  } catch {
    throw new Error('Root-Key konnte nicht entschlüsselt oder validiert werden.');
  } finally {
    passphrase.fill(0);
    encryptionKey?.fill(0);
    aad?.fill(0);
    clearPart?.fill(0);
    clearFinal?.fill(0);
    privateBytes?.fill(0);
    selfTestSignature?.fill(0);
  }
}

async function initRoot(values, runtime) {
  allowedOnly(values, ['--private-key']);
  const output = resolve(required(values, '--private-key'));
  await assertPrivateKeyOutsideRepository(output, false);
  const passphrase = await readSecret('Neue Root-Passphrase: ');
  const confirmation = await readSecret('Root-Passphrase wiederholen: ');
  let privateBytes;
  let encryptionKey;
  let aad;
  try {
    validatePassphrase(passphrase);
    validatePassphrase(confirmation);
    if (
      passphrase.length !== confirmation.length ||
      !timingSafeEqual(passphrase, confirmation)
    ) {
      throw new Error('Die Root-Passphrasen stimmen nicht überein.');
    }
    const pair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    );
    const [publicKey, privateKeyPkcs8] = await Promise.all([
      crypto.subtle.exportKey('raw', pair.publicKey),
      crypto.subtle.exportKey('pkcs8', pair.privateKey),
    ]);
    privateBytes = Buffer.from(privateKeyPkcs8);
    const publicEncoded = b64url(new Uint8Array(publicKey));
    const salt = randomBytes(ROOT_KDF_SALT_BYTES);
    const nonce = randomBytes(ROOT_CIPHER_NONCE_BYTES);
    const rootFile = {
      v: ROOT_FILE_VERSION,
      algorithm: 'Ed25519',
      rootKeyId: runtime.OFFICIAL_ACCOUNT_ROOT_KEY_ID,
      publicKey: publicEncoded,
      kdf: {
        name: 'scrypt',
        salt: b64url(salt),
        N: ROOT_KDF_N,
        r: ROOT_KDF_R,
        p: ROOT_KDF_P,
        maxmem: ROOT_KDF_MAXMEM,
      },
      cipher: {
        name: 'aes-256-gcm',
        nonce: b64url(nonce),
        ciphertext: '',
        tag: '',
      },
    };
    encryptionKey = await deriveRootEncryptionKey(passphrase, salt);
    aad = rootFileAad(rootFile);
    const cipher = createCipheriv(
      rootFile.cipher.name,
      encryptionKey,
      nonce,
      { authTagLength: ROOT_CIPHER_TAG_BYTES },
    );
    cipher.setAAD(aad);
    rootFile.cipher.ciphertext = b64url(Buffer.concat([
      cipher.update(privateBytes),
      cipher.final(),
    ]));
    rootFile.cipher.tag = b64url(cipher.getAuthTag());
    await writeNewFile(output, JSON.stringify(rootFile, null, 2) + '\n', 0o600);
    console.log(`Verschlüsselter Root-Key sicher neu angelegt: ${output}`);
    console.log('Private Datei offline sichern; sie darf niemals in Git oder zu Cloudflare.');
    console.log('Öffentlicher, einzucheckender Vertrauensanker:');
    console.log(publicEncoded);
  } finally {
    passphrase.fill(0);
    confirmation.fill(0);
    privateBytes?.fill(0);
    encryptionKey?.fill(0);
    aad?.fill(0);
  }
}

function extractBundle(value) {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{355}$/.test(trimmed)) return trimmed;
  const matches = [...trimmed.matchAll(/(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{355})(?=$|[^A-Za-z0-9_-])/g)];
  if (matches.length !== 1) {
    throw new Error('Bundle konnte nicht eindeutig aus Eingabe/QR-Link extrahiert werden.');
  }
  return matches[0][1];
}

async function descriptor(values) {
  const descriptorPath = values.get('--descriptor');
  const bundleArgument = values.get('--bundle');
  if (!!descriptorPath === !!bundleArgument) {
    throw new Error('Genau eines von --bundle oder --descriptor ist erforderlich.');
  }
  if (bundleArgument) return { bundle: extractBundle(bundleArgument), deviceList: null };
  const parsed = JSON.parse(await readSmallText(resolve(descriptorPath), MANIFEST_FILE_MAX));
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    parsed.v !== 1 ||
    typeof parsed.bundle !== 'string' ||
    (parsed.deviceList !== null && typeof parsed.deviceList !== 'string') ||
    Object.keys(parsed).some((key) => !['v', 'bundle', 'deviceList'].includes(key))
  ) {
    throw new Error('Ungültiger öffentlicher Admin-Deskriptor.');
  }
  return { bundle: extractBundle(parsed.bundle), deviceList: parsed.deviceList ?? null };
}

function bundleMetadata(token, runtime) {
  const bytes = runtime.base64urlDecode(token, 266);
  if (bytes.length !== 266 || bytes[0] !== 2 || bytes[265] !== 0) {
    throw new Error('Nur ein kanonisches Bundle v2 ohne One-Time-Prekey ist zulässig.');
  }
  return {
    masterPub: runtime.base64urlEncode(bytes.slice(1, 33)),
    epoch: new DataView(bytes.buffer, bytes.byteOffset + 33, 4).getUint32(0, false),
  };
}

function listMetadata(encoded, runtime) {
  if (encoded === null) return { epoch: null, version: 0 };
  const bytes = runtime.base64urlDecode(encoded, runtime.OFFICIAL_ACCOUNT_MAX_DEVICE_LIST_BYTES);
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('DeviceList ist kein gültiges UTF-8-JSON.');
  }
  if (!Number.isSafeInteger(value?.epoch) || value.epoch < 1 ||
      !Number.isSafeInteger(value?.version) || value.version < 1) {
    throw new Error('DeviceList besitzt keine gültige Epoch/Version.');
  }
  return { epoch: value.epoch, version: value.version };
}

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${name} muss eine positive Ganzzahl sein.`);
  return parsed;
}

/**
 * Build the canonical revoked-master list for a manifest: exact 32-byte base64url
 * keys, strictly ascending, de-duped, never the manifest's own master. The PWA
 * rejects any head that drops a previously-known tombstone, so carrying the prior
 * set forward (via --supersedes) is mandatory across a rotation.
 */
function canonicalRevokedMasters(entries, ownMasterB64, runtime) {
  const byKey = new Map();
  for (const raw of entries) {
    const entry = String(raw).trim();
    if (!entry) continue;
    const bytes = runtime.base64urlDecode(entry, 32);
    if (bytes.length !== 32) {
      throw new Error(`Ungültiger widerrufener Master-Key: ${entry}`);
    }
    byKey.set(runtime.base64urlEncode(bytes), bytes);
  }
  byKey.delete(ownMasterB64);
  const sorted = [...byKey.entries()].sort((left, right) =>
    runtime.compareBytes(left[1], right[1]),
  );
  if (sorted.length > runtime.OFFICIAL_ACCOUNT_MAX_REVOKED_MASTERS) {
    throw new Error(
      `Zu viele widerrufene Master (höchstens ${runtime.OFFICIAL_ACCOUNT_MAX_REVOKED_MASTERS}).`,
    );
  }
  return sorted.map(([key]) => key);
}

async function signManifest(values, runtime) {
  allowedOnly(values, [
    '--private-key', '--bundle', '--descriptor', '--sequence', '--valid-days',
    '--not-before', '--output', '--status', '--revoke', '--supersedes',
  ]);
  const root = await loadRoot(resolve(required(values, '--private-key')), runtime);
  const publicDescriptor = await descriptor(values);
  const bundle = bundleMetadata(publicDescriptor.bundle, runtime);
  const list = listMetadata(publicDescriptor.deviceList, runtime);
  if (list.epoch !== null && list.epoch !== bundle.epoch) {
    throw new Error('Bundle-Epoch und DeviceList-Epoch stimmen nicht überein.');
  }
  const sequence = parsePositiveInteger(required(values, '--sequence'), 'sequence');
  const validDays = parsePositiveInteger(values.get('--valid-days') ?? '30', 'valid-days');
  const maximumDays = Math.floor(
    runtime.OFFICIAL_ACCOUNT_MAX_LIFETIME_MS / (24 * 60 * 60 * 1000),
  );
  if (validDays > maximumDays) {
    throw new Error(`valid-days darf höchstens ${maximumDays} betragen.`);
  }
  const now = Date.now();
  const notBeforeArgument = values.get('--not-before');
  const notBefore = notBeforeArgument ? Date.parse(notBeforeArgument) : now - 5 * 60 * 1000;
  if (!Number.isSafeInteger(notBefore) || notBefore < 1) throw new Error('Ungültiger --not-before-Zeitpunkt.');
  const status = values.get('--status') ?? 'active';
  if (status !== 'active' && status !== 'revoked') throw new Error('--status muss active oder revoked sein.');
  // Carry the previous manifest's full revoked set forward automatically so a
  // rotation never silently loses a tombstone; --revoke adds newly compromised
  // masters. The signed list lets a client that never saw the transient revoked
  // head still keep the former master send-blocked.
  const carried = [];
  const supersedesPath = values.get('--supersedes');
  if (supersedesPath) {
    const previous = await readManifest(supersedesPath);
    const previousTrusted = await runtime.verifyOfficialAccountDocument(previous, {
      rootPublicKey: root.publicKey,
      minimumSequence: 1,
      requireCurrent: false,
    });
    if (previousTrusted.sequence >= sequence) {
      throw new Error('--supersedes muss eine kleinere Sequenz als --sequence besitzen.');
    }
    carried.push(...previousTrusted.manifest.revokedMasters);
    if (previousTrusted.manifest.status === 'revoked') {
      carried.push(previousTrusted.manifest.masterPub);
    }
  }
  const explicitRevokes = (values.get('--revoke') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const revokedMasters = canonicalRevokedMasters(
    [...carried, ...explicitRevokes],
    bundle.masterPub,
    runtime,
  );
  const unsigned = {
    schema: runtime.OFFICIAL_ACCOUNT_MANIFEST_SCHEMA,
    sequence,
    rootKeyId: runtime.OFFICIAL_ACCOUNT_ROOT_KEY_ID,
    alias: runtime.OFFICIAL_ACCOUNT_ALIAS,
    role: runtime.OFFICIAL_ACCOUNT_ROLE,
    displayName: runtime.OFFICIAL_ACCOUNT_DISPLAY_NAME,
    badge: runtime.OFFICIAL_ACCOUNT_BADGE,
    status,
    masterPub: bundle.masterPub,
    bundle: publicDescriptor.bundle,
    deviceList: publicDescriptor.deviceList,
    deviceEpoch: bundle.epoch,
    deviceListVersion: list.version,
    notBefore,
    notAfter: notBefore + validDays * 24 * 60 * 60 * 1000,
    revokedMasters,
  };
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'Ed25519' },
    root.privateKey,
    runtime.officialAccountSigningBytes(unsigned),
  ));
  const manifest = { ...unsigned, signature: runtime.base64urlEncode(signature) };
  // This is deliberately the same full parser/signature/bundle/devlist path the
  // PWA runs. A malformed descriptor cannot be blessed by the convenience tool.
  await runtime.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: root.publicKey,
    minimumSequence: sequence,
    now,
  });
  const output = resolve(required(values, '--output'));
  await writeNewFile(output, runtime.canonicalOfficialAccountManifestJson(manifest) + '\n', 0o644);
  console.log(`Signiertes Manifest ${sequence} lokal vollständig geprüft und geschrieben: ${output}`);
  console.log(`Gültig von ${new Date(notBefore).toISOString()} bis ${new Date(unsigned.notAfter).toISOString()}.`);
}

async function readManifest(path) {
  return JSON.parse(await readSmallText(resolve(path), MANIFEST_FILE_MAX));
}

async function verifyManifest(values, runtime) {
  allowedOnly(values, ['--public-key', '--manifest']);
  const publicKey = fromB64url(required(values, '--public-key'), 32);
  const manifest = await readManifest(required(values, '--manifest'));
  const trusted = await runtime.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: publicKey,
  });
  console.log(`Manifest ${trusted.sequence} ist vollständig gültig; Status: ${trusted.manifest.status}.`);
  console.log(`Master: ${trusted.manifest.masterPub}`);
}

function canonicalOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' || url.username || url.password || url.search ||
    url.hash || url.pathname !== '/' || url.origin !== value.replace(/\/$/, '')
  ) {
    throw new Error('--origin muss ein kanonischer HTTPS-Origin ohne Pfad/Query/Fragment sein.');
  }
  if (!PRODUCTION_ORIGINS.has(url.origin)) {
    throw new Error('--origin muss einer der beiden unterstützten SKYTALE-Produktionsorigins sein.');
  }
  return url.origin;
}

function requireJson(response, operation) {
  const mediaType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new Error(`${operation} lieferte keinen JSON-Inhalt.`);
  }
}

async function readResponseTextLimited(response, maximum, operation) {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > maximum)) {
    throw new Error(`${operation}-Antwort ist zu groß.`);
  }
  if (!response.body) throw new Error(`${operation}-Antwort ist leer.`);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) {
        await reader.cancel().catch(() => undefined);
        throw new Error(`${operation}-Antwort ist zu groß.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total < 1) throw new Error(`${operation}-Antwort ist leer.`);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${operation}-Antwort ist kein gültiges UTF-8.`);
  }
}

function validatePublishReceipt(value, expectedSequence, httpStatus) {
  if (
    !exactKeys(value, ['status', 'sequence']) ||
    !['created', 'updated', 'unchanged'].includes(value.status) ||
    value.sequence !== expectedSequence ||
    !Number.isSafeInteger(value.sequence) ||
    (value.status === 'created' ? httpStatus !== 201 : httpStatus !== 200)
  ) {
    throw new Error('Worker lieferte kein gültiges Publish-Bestätigungsschema.');
  }
}

export async function publishManifest(values, runtime) {
  allowedOnly(values, ['--manifest', '--origin']);
  const manifest = await readManifest(required(values, '--manifest'));
  // Publishing is an ONLINE operation and therefore must never touch the
  // offline private root. Verification uses the public key compiled from the
  // reviewed source configuration; an unprovisioned checkout fails closed.
  const trusted = await runtime.verifyOfficialAccountDocument(manifest);
  const origin = canonicalOrigin(required(values, '--origin'));
  const canonicalDocument = runtime.canonicalOfficialAccountManifestJson(trusted.manifest);
  const expectedDigest = await runtime.officialAccountManifestDigest(trusted.manifest);
  const endpoint = `${origin}/api/official-accounts/${runtime.OFFICIAL_ACCOUNT_ROUTE_ALIAS}`;
  const response = await fetch(
    endpoint,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: canonicalDocument,
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Worker hat Publish abgelehnt: HTTP ${response.status}.`);
  }
  requireJson(response, 'Publish');
  let receipt;
  try {
    receipt = JSON.parse(await readResponseTextLimited(response, PUBLISH_RESPONSE_MAX, 'Publish'));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Worker lieferte keine gültige Publish-Bestätigung.');
    }
    throw error;
  }
  validatePublishReceipt(receipt, trusted.sequence, response.status);

  const readback = await fetch(endpoint, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (readback.status !== 200) {
    throw new Error(`Publish-Readback fehlgeschlagen: HTTP ${readback.status}.`);
  }
  requireJson(readback, 'Publish-Readback');
  const readbackDocument = await readResponseTextLimited(
    readback,
    MANIFEST_FILE_MAX,
    'Publish-Readback',
  );
  if (readbackDocument !== canonicalDocument) {
    throw new Error('Publish-Readback stimmt nicht bytegenau mit dem kanonischen Manifest überein.');
  }
  let readbackValue;
  try {
    readbackValue = JSON.parse(readbackDocument);
  } catch {
    throw new Error('Publish-Readback enthält kein gültiges Manifest-JSON.');
  }
  const readbackTrusted = await runtime.verifyOfficialAccountDocument(readbackValue);
  const readbackCanonical = runtime.canonicalOfficialAccountManifestJson(readbackTrusted.manifest);
  const readbackDigest = await runtime.officialAccountManifestDigest(readbackTrusted.manifest);
  if (
    readbackCanonical !== canonicalDocument ||
    readbackDigest !== expectedDigest ||
    readbackTrusted.sequence !== trusted.sequence
  ) {
    throw new Error('Publish-Readback stimmt kryptografisch nicht mit dem lokalen Manifest überein.');
  }
  console.log(`Manifest ${trusted.sequence} veröffentlicht und bytegenau zurückgelesen: ${origin}`);
}

async function main() {
  const { command, values } = parseArguments(process.argv.slice(2));
  if (!command || command === 'help' || command === '--help') {
    console.log(usage());
    return;
  }
  const runtime = await loadRuntime();
  if (command === 'init-root') return initRoot(values, runtime);
  if (command === 'sign') return signManifest(values, runtime);
  if (command === 'verify') return verifyManifest(values, runtime);
  if (command === 'publish') return publishManifest(values, runtime);
  throw new Error(`Unbekannter Befehl: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Official-Admin-Werkzeug fehlgeschlagen.');
    process.exitCode = 1;
  } finally {
    await wipePendingSecrets();
  }
}
