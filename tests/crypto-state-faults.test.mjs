import fs from 'node:fs';
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };
const throws = async (fn) => { try { await fn(); return false; } catch { return true; } };

console.log('\n[Crypto-State: fail-closed + atomare Commit-Struktur]');

const id = await S.generateIdentity();
const wire = JSON.parse(new TextDecoder().decode(await S.serializeIdentity(id)));
wire.signPub = wire.masterPub; // valid length/base64, but does not match signPriv/cert
ok('inkohärentes Identity-Keypair wird abgelehnt',
  await throws(() => S.deserializeIdentity(new TextEncoder().encode(JSON.stringify(wire)))));

ok('beschädigtes Identity-JSON wird abgelehnt',
  await throws(() => S.deserializeIdentity(new TextEncoder().encode('{'))));
const futureWire = { ...wire, signPub: JSON.parse(new TextDecoder().decode(await S.serializeIdentity(id))).signPub, v: 99 };
ok('unbekannte zukünftige Identity-Version regeneriert nicht still',
  await throws(() => S.deserializeIdentity(new TextEncoder().encode(JSON.stringify(futureWire)))));

const identitySrc = fs.readFileSync(new URL('../src/lib/identity.ts', import.meta.url), 'utf8');
const dbSrc = fs.readFileSync(new URL('../src/lib/db.ts', import.meta.url), 'utf8');
const linkSrc = fs.readFileSync(new URL('../src/lib/linkflow.ts', import.meta.url), 'utf8');
const devicesSrc = fs.readFileSync(new URL('../src/lib/devices.ts', import.meta.url), 'utf8');

ok('Linked Identity + DeviceList gehen durch EINEN Batch-Commit',
  identitySrc.includes('await saveRecordsAtomically([') &&
  !identitySrc.includes('await saveIdentity(dek, linked)'));
ok('Batch-Commit verwendet eine readwrite-Transaktion',
  dbSrc.includes("transaction(['records', 'kv'], 'readwrite')") && dbSrc.includes('await tx.done'));
ok('Grant wird vor send dauerhaft gespeichert',
  linkSrc.indexOf('await saveOwnDeviceList(dek, newList)') <
  linkSrc.indexOf('await send(session.peerSignPub, sealedGrant)'));
// F-21: a primary's stored own device list is authority ONLY if it verifies under the
// current master (storedTrusted). An unverified/foreign-but-decryptable stored list must
// NOT be re-signed into a fresh authority — the repair is fail-closed: it throws instead
// of adopting stored.devices/stored.version. (Linked devices already return null above.)
ok('DeviceList-Reparatur ist fail-closed: unverifizierte gespeicherte Liste wird verworfen (F-21)',
  /if \(stored && !storedTrusted\)[\s\S]{0,160}throw new Error/.test(devicesSrc));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
