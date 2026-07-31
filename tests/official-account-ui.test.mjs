// Static UI security contract for the root-signed official support account.
// Cryptographic verification/store behavior is covered by the runtime trust and
// store suites; this file ensures the Messenger never turns peer/profile data
// into ADMIN UI and keeps every entry path on the verified resolver.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const messenger = readFileSync(join(root, 'src', 'Messenger.tsx'), 'utf8');
const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');
const locales = readFileSync(join(root, 'src', 'lib', 'locales.ts'), 'utf8');
const session = readFileSync(join(root, 'src', 'lib', 'session.ts'), 'utf8');

// Extract a TS/TSX block while ignoring braces in strings and comments.
function balancedBlockAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return '';
  const open = source.indexOf('{', markerAt + marker.length);
  if (open < 0) return '';
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return source.slice(open + 1, index);
  }
  return '';
}

const addBundle = balancedBlockAfter(
  messenger,
  'async function addBundle(rawInput: string, signal?: AbortSignal)',
);
const refreshTrust = balancedBlockAfter(
  messenger,
  'async function refreshOfficialAccountTrust(signal: AbortSignal)',
);
const adoptList = balancedBlockAfter(
  messenger,
  'async function adoptOfficialDeviceList(',
);
const displayName = balancedBlockAfter(
  messenger,
  'function displayName(contact: Contact): string',
);
const nameLocked = balancedBlockAfter(
  messenger,
  'function officialAccountNameLocked(contact: Contact): boolean',
);
const startRename = balancedBlockAfter(messenger, 'function startRename()');
const saveNickname = balancedBlockAfter(messenger, 'async function saveNickname()');
const expiryTimer = balancedBlockAfter(
  messenger,
  'function scheduleOfficialTrustExpiryRerender(',
);
const exportDescriptor = balancedBlockAfter(
  messenger,
  'async function exportOfficialAdminDescriptor(',
);
const profileView = balancedBlockAfter(messenger, "if (view === 'profile')");
const contactInterface = balancedBlockAfter(session, 'export interface Contact');
const contactWire = balancedBlockAfter(session, 'interface ContactWire');
const badgeCss = css.match(/\.official-admin-badge\s*\{([\s\S]*?)\}/)?.[1] ?? '';

console.log('\n[Offizieller Account: Alias und Trust-State]');

const aliasAt = addBundle.indexOf('extractOfficialAccountAlias(rawInput)');
const contactCodeAt = addBundle.indexOf('extractContactCode(rawInput)');
const bundleDecodeAt = addBundle.indexOf('decodeBundle(token)');
ok('der feste Alias wird vor Kurzcode und gewöhnlichem Bundle erkannt',
  aliasAt >= 0 && contactCodeAt > aliasAt && bundleDecodeAt > contactCodeAt);
ok('Alias-Auflösung übernimmt den bisherigen signierten Stand als Rollback-Floor',
  addBundle.includes('resolveOfficialAccount(officialAlias') &&
  addBundle.includes('sequence: officialAccountTrustRef.current.sequence') &&
  addBundle.includes('digest: officialAccountTrustRef.current.digest'));
ok('nur der monoton gespeicherte Rückgabewert wird installiert und benutzt',
  addBundle.includes('const stored = await saveOfficialAccountTrust(') &&
  addBundle.includes('installOfficialAccountTrust(stored)') &&
  addBundle.includes('return stored;') &&
  addBundle.includes("trustedOfficial.manifest.status !== 'active'"));
ok('der explizite Alias ist auch ohne stillen Boot-Fetch ein klarer Fehlerpfad',
  !addBundle.includes('officialAccountConfigured()') &&
  messenger.includes('error instanceof ContactCodeError || error instanceof OfficialAccountError'));

console.log('\n[Offizieller Account: Cache, Refresh und Ablauf]');

ok('Boot lädt und Hintergrund-Refresh startet nur bei konfiguriertem Root',
  /if \(officialAccountConfigured\(\)\) \{\s*try \{\s*const cachedOfficial = await loadOfficialAccountTrust\(dek\)/.test(messenger) &&
  /if \(officialAccountConfigured\(\)\) \{\s*launchRuntimeOperation\(\(signal\) =>\s*refreshOfficialAccountTrust\(signal\)/.test(messenger));
ok('Netzwerk- oder Formatfehler im Hintergrund löschen den letzten guten Cache nicht',
  refreshTrust.includes('catch {') &&
  !refreshTrust.includes('officialAccountTrustRef.current = null') &&
  !refreshTrust.includes('saveOfficialAccountTrust(dek, null)'));
ok('eine gültige Revocation wird vor der Statusprüfung dauerhaft installiert',
  refreshTrust.indexOf('saveOfficialAccountTrust(dek, candidate)') >= 0 &&
  refreshTrust.indexOf('installOfficialAccountTrust(trusted)') >
    refreshTrust.indexOf('saveOfficialAccountTrust(dek, candidate)') &&
  refreshTrust.indexOf("trusted.manifest.status !== 'active'") >
    refreshTrust.indexOf('installOfficialAccountTrust(trusted)'));
ok('der Badge-Ablauf wird am notAfter+Skew in höchstens 24h-Etappen neu gerendert',
  expiryTimer.includes('trusted.manifest.notAfter + OFFICIAL_ACCOUNT_CLOCK_SKEW_MS') &&
  expiryTimer.includes('Math.min(remaining, OFFICIAL_TRUST_TIMER_STEP_MS)') &&
  expiryTimer.includes('bump();') &&
  messenger.includes('const OFFICIAL_TRUST_TIMER_STEP_MS = 24 * 60 * 60_000'));
ok('Expiry-Timer ist an Trust-Wechsel, Foreground und Component-Lifecycle gebunden',
  messenger.includes('scheduleOfficialTrustExpiryRerender(trusted);') &&
  messenger.includes('if (officialTrust) scheduleOfficialTrustExpiryRerender(officialTrust);') &&
  (messenger.match(/clearTimeout\(officialTrustExpiryTimerRef\.current\)/g) ?? []).length >= 3);
ok('Revocations werden bei Foreground und in langlebigen Tabs ohne Reload nachgeladen',
  messenger.includes('const OFFICIAL_TRUST_REFRESH_INTERVAL_MS = 15 * 60_000') &&
  messenger.includes('const officialTrustRefreshInterval = window.setInterval(') &&
  messenger.includes('window.clearInterval(officialTrustRefreshInterval)') &&
  (messenger.match(/refreshOfficialAccountTrust\(signal\)/g) ?? []).length >= 3);
ok('parallele Boot-, Foreground- und Intervall-Refreshes werden zusammengelegt',
  refreshTrust.includes('officialTrustRefreshRunningRef.current') &&
  refreshTrust.includes('finally {') &&
  refreshTrust.includes('officialTrustRefreshRunningRef.current = false'));

console.log('\n[Offizieller Account: DeviceList und Identitätsbindung]');

ok('Manifest-Gerätelisten gehen ausschließlich durch die normale Signatur-/Rollback-Gate',
  adoptList.includes('applyDeviceListUpdate(contact, list, retiredMastersRef.current)') &&
  adoptList.includes('!isNewerDeviceList(list, contact.peerDeviceList)') &&
  !adoptList.includes('contact.peerDeviceList ='));
ok('der kanonische Name hängt nur an kryptografisch erkanntem Trust',
  displayName.includes('officialAccountNameLocked(contact)') &&
  displayName.includes('OFFICIAL_ACCOUNT_DISPLAY_NAME') &&
  displayName.includes('ordinaryDisplayName(contact)') &&
  // Der Namens-Lock ist rein kryptografisch abgeleitet (aktiv verifiziert ODER
  // signiert widerrufen) und zieht KEIN peer-kontrollierbares Feld heran.
  nameLocked.includes('trustedOfficialAccountFor(contact)') &&
  nameLocked.includes('revokedOfficialAccountFor(contact)') &&
  !/peerName|nickname|peerProfile/i.test(nameLocked));
ok('weder Start noch persistierender Rename-Pfad kann den offiziellen Namen ändern',
  startRename.includes('officialAccountNameLocked(c)') &&
  saveNickname.includes('officialAccountNameLocked(c)'));
ok('Contact und sein Wire-Format tragen kein peer-kontrollierbares Admin-/Role-Flag',
  contactInterface.length > 0 && contactWire.length > 0 &&
  !/\b(?:admin|official|role)\??\s*:/i.test(contactInterface) &&
  !/\b(?:admin|official|role)\??\s*:/i.test(contactWire));

console.log('\n[Offizieller Account: sichtbare, zugängliche Kennzeichnung]');

ok('Badge enthält rotes Schild, exakten ADMIN-Text und zugänglichen Namen',
  messenger.includes("const label = t('Offizieller SKYTALE-Administrator')") &&
  messenger.includes('<IconShield size={12} filled />') &&
  messenger.includes('<span>{OFFICIAL_ACCOUNT_BADGE}</span>') &&
  messenger.includes('aria-label={label}'));
const officialBadgeSites = (messenger.match(/<OfficialAdminBadge \/>/g) ?? []).length;
const revokedBadgeSites = (messenger.match(/<RevokedOfficialAdminBadge \/>/g) ?? []).length;
ok('Badge erscheint getrennt in Liste, Chat-Header, Kontaktdetail und Kontaktpickern',
  officialBadgeSites >= 3 &&
  // Jeder aktive Badge-Ort rendert paarweise auch die Widerruf-Variante, damit ein
  // (kompromittierter) Ex-Admin nirgends unmarkiert als gewöhnlicher Kontakt erscheint.
  officialBadgeSites === revokedBadgeSites &&
  messenger.includes('className="chat-trust-row"') &&
  messenger.includes('className="contact-name-row"'));
ok('ADMIN ist nicht nur eine Farbe und bewegt sich bei häufigen Updates nicht',
  badgeCss.includes('color: var(--official-admin)') &&
  badgeCss.includes('font-family: var(--font-mono)') &&
  badgeCss.includes('white-space: nowrap') &&
  !/animation|transition/.test(badgeCss));
ok('manuelle Safety-Number-Verifikation bleibt ein separates grünes Signal',
  messenger.includes('className="verified-badge"') &&
  messenger.includes("aria-label={t('Safety Number manuell verifiziert')}") &&
  css.includes('color: var(--verified)'));
ok('Suche findet den Supportkontakt auch über den festen Alias',
  messenger.includes('`${displayName(item.contact)} ${OFFICIAL_ACCOUNT_ALIAS}`'));

console.log('\n[Offizieller Account: öffentlicher Admin-Deskriptor]');

ok('Export wird sowohl in der Funktion als auch in der UI über den eigenen Master autorisiert',
  exportDescriptor.includes('isOfficialAdminMaster(identity.master.publicKey, trusted)') &&
  profileView.includes('isOfficialAdminMaster(') &&
  profileView.includes('identityRef.current.master.publicKey') &&
  profileView.includes('officialAccountTrustRef.current'));
ok('Export enthält exakt Version, OPK-freies aktuelles Bundle und signierte DeviceList',
  /const descriptor\s*=\s*\{\s*v:\s*1,\s*bundle:\s*await encodeBundle\(currentBundle\(identity, prekeys\)\),\s*deviceList:\s*base64urlEncode\(await encodeDeviceList\(deviceList\)\),\s*\}/s.test(exportDescriptor));
ok('der Admin-Menüpunkt existiert nur einmal innerhalb des bedingten Profilblocks',
  profileView.includes("t('Öffentlichen Admin-Deskriptor exportieren')") &&
  (messenger.match(/Öffentlichen Admin-Deskriptor exportieren/g) ?? []).length === 1);
ok('alle unterstützten nicht-deutschen Sprachen enthalten die neuen UI-Texte',
  (locales.match(/"Offizieller SKYTALE-Administrator"\s*:/g) ?? []).length === 11 &&
  (locales.match(/"Öffentlichen Admin-Deskriptor exportieren"\s*:/g) ?? []).length === 11 &&
  (locales.match(/"Nur öffentliche Schlüssel für die Offline-Signatur"\s*:/g) ?? []).length === 11);

console.log('\n[Offizieller Account: Widerruf-Sendesperre deckt ALLE ausgehenden Frames]');

const fanoutSend = balancedBlockAfter(
  messenger,
  'async function fanoutSend(contact: Contact, content: MessageContent, mid: string, minPv = 0)',
);
const silentFanout = balancedBlockAfter(messenger, 'async function silentFanout(');
const ensureProfileSent = balancedBlockAfter(
  messenger,
  'async function ensureProfileSent(contact: Contact)',
);
const ensureListGossiped = balancedBlockAfter(
  messenger,
  'async function ensureListGossiped(contact: Contact)',
);
const serveAttachment = balancedBlockAfter(
  messenger,
  'async function serveAttachment(contact: Contact, tid: string)',
);
const pullAttachment = balancedBlockAfter(
  messenger,
  'async function pullAttachment(roomId: string, m: ChatMessage',
);
const recallMessage = balancedBlockAfter(
  messenger,
  'async function recallMessage(roomId: string, m: ChatMessage)',
);

ok('Inhalts-/Recall-/Attreq-Sendepfad blockt jeden widerrufenen Master unbedingt',
  fanoutSend.includes('assertNormalSendAllowed(contact)') &&
  // Negativkontrolle: nicht mehr nur an "normalen" Content gekoppelt; der Selektor ist entfernt
  !fanoutSend.includes('isNormalOutboundContent') &&
  !messenger.includes('function isNormalOutboundContent'));
ok('Hintergrund-Gossip (Profil + DeviceList) erreicht einen widerrufenen Master nie',
  silentFanout.includes('revokedOfficialAccountFor(contact)') &&
  ensureProfileSent.includes('revokedOfficialAccountFor(contact)') &&
  ensureListGossiped.includes('revokedOfficialAccountFor(contact)'));
ok('Attachment-Serve/-Pull und Recall senden einem widerrufenen Master keine neuen Frames',
  serveAttachment.includes('revokedOfficialAccountFor(contact)') &&
  pullAttachment.includes('revokedOfficialAccountFor(contact)') &&
  recallMessage.includes('revokedOfficialAccountFor(contact)'));

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
