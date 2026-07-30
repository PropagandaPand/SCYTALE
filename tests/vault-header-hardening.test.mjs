import { readFileSync } from 'node:fs';
import * as S from './.bundle/entry.js';

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
const rejects = async (fn) => {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
};

console.log('\n[Vault header: pre-auth KDF and WebCrypto allocation boundaries]');

const bounded = S.boundedArgon2Params({
  memorySize: Number.MAX_SAFE_INTEGER,
  iterations: Number.MAX_SAFE_INTEGER,
  parallelism: Number.MAX_SAFE_INTEGER,
});
ok('aufwärts manipulierte KDF-Werte werden auf den real geschriebenen Maximalwert begrenzt',
  bounded.memorySize === 262144 &&
  bounded.iterations === 3 &&
  bounded.parallelism === 1);

const base = {
  version: 1,
  argon2: { memorySize: 65536, iterations: 3, parallelism: 1 },
  salt: new Uint8Array(16),
  wrapIv: new Uint8Array(12),
  wrappedDek: new Uint8Array(48),
};
ok('übergroßer Salt wird vor Argon2 abgelehnt',
  await rejects(() => S.unlockVault('x', { ...base, salt: new Uint8Array(17) })));
ok('übergroßes Wrapped-DEK wird vor Argon2/WebCrypto abgelehnt',
  await rejects(() => S.unlockVault('x', { ...base, wrappedDek: new Uint8Array(49) })));
ok('nicht-ganzzahlige KDF-Felder werden vor Argon2 abgelehnt',
  await rejects(() => S.unlockVault('x', {
    ...base,
    argon2: { ...base.argon2, memorySize: 65536.5 },
  })));

const vault = readFileSync(new URL('../src/crypto/vault.ts', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/lib/vaultService.ts', import.meta.url), 'utf8');
ok('Create persistiert ausschließlich die normalisierten KDF-Parameter',
  vault.includes('const boundedArgon2 = boundedArgon2Params(argon2);') &&
  vault.includes('argon2: boundedArgon2,'));
ok('Device-Binding akzeptiert nur 12-Byte-IV und 48-Byte-Ciphertext',
  service.includes('header.deviceWrap.iv.length !== 12') &&
  service.includes('header.deviceWrap.ciphertext.length !== 48'));
const decoyUnlock = service.slice(
  service.indexOf('async function unlockDecoyVault'),
  service.indexOf('/**\n * Probe the decoy', service.indexOf('async function unlockDecoyVault')),
);
ok('auch ein Decoy-Device-Wrap wird vor WebCrypto exakt begrenzt',
  decoyUnlock.indexOf('header.deviceWrap.iv.length !== 12') <
    decoyUnlock.indexOf('crypto.subtle.decrypt') &&
  decoyUnlock.indexOf('header.deviceWrap.ciphertext.length !== 48') <
    decoyUnlock.indexOf('crypto.subtle.decrypt'));
ok('Biometrie begrenzt Credential-ID und verlangt exakte PRF-Wrap-Längen',
  service.includes('p.credentialId.length > 1024') &&
  service.includes('p.salt.length !== 32') &&
  service.includes('p.wrappedDek.length !== 48'));
ok('rohe PRF-Ausgaben werden auch bei fehlgeschlagener KEK-Ableitung genullt',
  (service.match(/finally \{[\s\S]{0,220}?prfSecret\.fill\(0\);[\s\S]{0,20}?\}/g) || []).length === 2);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
