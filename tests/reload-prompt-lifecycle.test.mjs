import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (name, condition) => {
  if (condition) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name); }
};

const source = readFileSync(new URL('../src/ReloadPrompt.tsx', import.meta.url), 'utf8');

console.log('\n[service-worker update polling lifecycle]');
ok('registration callback only stores the registration',
  source.includes('if (next && mountedRef.current) setRegistration(next);') &&
  !/onRegisteredSW[\\s\\S]{0,500}setInterval/.test(source));
ok('poll interval has an explicit disposer',
  source.includes('const interval = window.setInterval(check, 60_000);') &&
  source.includes('window.clearInterval(interval);'));
ok('visibility and focus listeners are both removed',
  source.includes("document.removeEventListener('visibilitychange', check);") &&
  source.includes("window.removeEventListener('focus', check);"));
ok('late registration callbacks cannot update an unmounted prompt',
  source.includes('mountedRef.current = false;') &&
  source.includes('mountedRef.current &&'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
