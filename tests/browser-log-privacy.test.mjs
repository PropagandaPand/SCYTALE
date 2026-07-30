import { readFileSync } from 'node:fs';

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

const messenger = readFileSync(new URL('../src/Messenger.tsx', import.meta.url), 'utf8');
const store = readFileSync(new URL('../src/lib/store.ts', import.meta.url), 'utf8');
const groups = readFileSync(new URL('../src/lib/groups.ts', import.meta.url), 'utf8');

console.log('\n[browser logs: identity minimisation]');
ok('Receive-Diagnostik schreibt keine Kontaktnamen in die Konsole',
  !/console\.(?:warn|error|info|log)\([^\n;]*displayName\(/.test(messenger));
ok('Kontakt-Storagefehler schreibt keinen Room-ID-Präfix in die Konsole',
  !/console\.(?:warn|error|info|log)\([^\n;]*id\.slice/.test(store));
ok('Gruppen-Storagefehler schreibt keine Gruppen-ID in die Konsole',
  !/console\.(?:warn|error|info|log)\(`[^`]*\$\{id\}/.test(groups));
ok('Gruppenfehler reichen keine potentiell identitätshaltigen Error-Objekte weiter',
  !/console\.warn\(\s*'\[group\][^']*'\s*,\s*error\s*\)/.test(messenger));

// Negative controls: these are the exact privacy regressions the assertions
// above are meant to reject.
const oldContactLog = 'console.warn(`[recv] von ${displayName(contact)}`);';
const oldGroupLog = 'console.warn(`[group] ${id}`);';
ok('Negativkontrolle: frühere dynamische Identitätslogs würden erkannt',
  /console\.(?:warn|error|info|log)\([^\n;]*displayName\(/.test(oldContactLog) &&
  /console\.(?:warn|error|info|log)\(`[^`]*\$\{id\}/.test(oldGroupLog));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
