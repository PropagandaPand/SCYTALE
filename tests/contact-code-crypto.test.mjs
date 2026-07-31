// Short remote contact codes: the resolver may see an opaque locator and
// ciphertext, but never the contact bundle or the 128-bit code secret.
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
const rejects = async (operation) => {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
};

const bytes = (length, seed) =>
  Uint8Array.from({ length }, (_, index) => (seed + index * 29) & 0xff);
const realBundle = {
  masterPub: bytes(32, 1),
  epoch: 0x01020304,
  deviceCert: bytes(64, 2),
  identitySignPub: bytes(32, 3),
  identityDhPub: bytes(32, 4),
  signedPreKey: {
    id: 0x05060708,
    pub: bytes(32, 5),
    signature: bytes(64, 6),
  },
};
const bundleToken = await S.encodeBundle(realBundle);

const compactCode = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
const crockfordBody = (code) => {
  const compact = compactCode(code);
  return compact.startsWith('SK1') ? compact.slice(3) : '';
};
const mutateLastSymbol = (text) => {
  const chars = [...text];
  for (let index = chars.length - 1; index >= 0; index--) {
    if (!/[A-Z0-9]/i.test(chars[index])) continue;
    chars[index] = chars[index].toUpperCase() === '0' ? '1' : '0';
    return chars.join('');
  }
  return text + '0';
};
const mutatePayload = (payload) => {
  const chars = [...payload];
  const index = Math.max(0, Math.floor(chars.length / 2));
  chars[index] = chars[index] === 'A' ? 'B' : 'A';
  return chars.join('');
};
const stable = (value) => JSON.stringify(value, (_key, item) =>
  item instanceof Uint8Array ? [...item] : item);

console.log('\n[Kurzer Kontaktcode: Format, AEAD und Resolver-Trennung]');

const inviteCreatedAt = Date.now();
const invite = await S.createContactInvite(bundleToken);
const decoded = await S.decodeContactCode(invite.code);
const body = crockfordBody(invite.code);

ok('Kontaktcode trägt das versionierte SK1-Präfix',
  typeof invite.code === 'string' && invite.code.startsWith('SK1-'));
ok('128-Bit-Code nutzt 26 Crockford-Zeichen plus ein Prüfsymbol',
  body.length === 27 && /^[0-9A-HJKMNP-TV-Z]+$/.test(body));
ok('Decoder liefert die kanonische Schreibweise und exakt 128 Bit',
  decoded?.canonical === invite.code &&
  decoded?.codeBytes instanceof Uint8Array &&
  decoded.codeBytes.length === 16);
ok('Locator und verschlüsselter Payload sind getrennte, nichtleere Werte',
  typeof invite.locator === 'string' &&
  typeof invite.payload === 'string' &&
  invite.locator.length > 0 &&
  invite.payload.length > 0 &&
  invite.locator !== invite.payload);
ok('Ablaufzeit ist beim Erzeugen fest auf höchstens 24 Stunden gebunden',
  Number.isSafeInteger(invite.expiresAt) &&
  invite.expiresAt >= inviteCreatedAt + 24 * 60 * 60 * 1000 &&
  invite.expiresAt <= Date.now() + 24 * 60 * 60 * 1000);
ok('Resolver-Payload verrät das lange Kontaktbundle nicht im Klartext',
  !invite.payload.includes(bundleToken) &&
  !invite.locator.includes(bundleToken) &&
  !invite.locator.includes(body));

const opened = await S.openContactInvite(invite.code, invite.payload);
ok('AES-GCM-Payload öffnet sich mit dem zugehörigen Code verlustfrei',
  opened === bundleToken);
const openedBundle = await S.decodeBundle(opened);
ok('Roundtrip ergibt weiterhin ein gültiges kryptographisches Kontaktbundle',
  openedBundle.epoch === realBundle.epoch &&
  openedBundle.oneTimePreKey === undefined &&
  openedBundle.masterPub.every((byte, index) => byte === realBundle.masterPub[index]));
const realDateNow = Date.now;
let expiredReplayRejected = false;
try {
  Date.now = () => invite.expiresAt;
  expiredReplayRejected = await rejects(() =>
    S.openContactInvite(invite.code, invite.payload));
} finally {
  Date.now = realDateNow;
}
ok('authentifizierte Ablaufzeit blockiert Server-Replays nach 24 Stunden',
  expiredReplayRejected);

const secondInvite = await S.createContactInvite(bundleToken);
ok('erneutes Erzeugen verwendet einen frischen 128-Bit-Code und Locator',
  secondInvite.code !== invite.code &&
  secondInvite.locator !== invite.locator &&
  secondInvite.payload !== invite.payload);
ok('Payload-Substitution unter einem anderen Code scheitert authentifiziert',
  await rejects(() => S.openContactInvite(invite.code, secondInvite.payload)));
ok('derselbe Payload lässt sich mit einem falschen Code nicht öffnen',
  await rejects(() => S.openContactInvite(secondInvite.code, invite.payload)));
ok('ein einzelnes manipuliertes Ciphertext-Zeichen wird erkannt',
  await rejects(() => S.openContactInvite(invite.code, mutatePayload(invite.payload))));
ok('abgeschnittener Ciphertext wird nicht als Bundle akzeptiert',
  await rejects(() => S.openContactInvite(invite.code, invite.payload.slice(0, -1))));
ok('Locator kann nicht als Code oder Entschlüsselungsschlüssel missbraucht werden',
  await rejects(() => S.openContactInvite(invite.locator, invite.payload)));

const lowerCase = await S.decodeContactCode(invite.code.toLowerCase());
const prose = await S.decodeContactCode(
  `SKYTALE-Kontakt\n${invite.code}\nIn SKYTALE unter „Verbinden“ einfügen.`,
);
const spacedBody = body.match(/.{1,4}/g).join(' ');
const spaced = await S.decodeContactCode(`sk1-${spacedBody.toLowerCase()}`);
const smartDashes = await S.decodeContactCode(invite.code.replaceAll('-', '–'));
ok('Groß-/Kleinschreibung ändert den Code nicht',
  stable(lowerCase) === stable(decoded));
ok('Decoder findet den Code in der vollständigen geteilten Textnachricht',
  stable(prose) === stable(decoded));
ok('Leerzeichen und alternative Gruppierung werden normalisiert',
  stable(spaced) === stable(decoded) &&
  stable(smartDashes) === stable(decoded));

if (/[01]/.test(body)) {
  const ambiguousBody = body
    .replaceAll('0', 'o')
    .replaceAll('1', 'l');
  const ambiguous = await S.decodeContactCode(`sk1-${ambiguousBody}`);
  ok('Crockford-Verwechslungen O/0 und I/L/1 sind beim Einfügen tolerant',
    stable(ambiguous) === stable(decoded));
} else {
  // The code is random. Generate a bounded number of fresh values so this
  // usability property is still exercised without weakening production RNG.
  let ambiguityChecked = false;
  for (let attempt = 0; attempt < 16 && !ambiguityChecked; attempt++) {
    const candidate = await S.createContactInvite(bundleToken);
    const candidateBody = crockfordBody(candidate.code);
    if (!/[01]/.test(candidateBody)) continue;
    const ambiguousBody = candidateBody.replaceAll('0', 'o').replaceAll('1', 'i');
    const canonical = await S.decodeContactCode(candidate.code);
    const ambiguous = await S.decodeContactCode(`sk1-${ambiguousBody}`);
    ambiguityChecked = stable(ambiguous) === stable(canonical);
  }
  ok('Crockford-Verwechslungen O/0 und I/L/1 sind beim Einfügen tolerant',
    ambiguityChecked);
}

ok('verändertes Prüfsymbol wird vor jedem Netzwerkzugriff abgelehnt',
  await rejects(() => S.decodeContactCode(mutateLastSymbol(invite.code))));
ok('zu kurze und beliebige menschenlesbare Codes werden abgelehnt',
  await rejects(() => S.decodeContactCode('SK1-1234-5678')) &&
  await rejects(() => S.decodeContactCode('mein-kontakt-ist-alice')));

let capturedRequest;
const serverExpiresAt = invite.expiresAt + 60_000;
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input, init };
    return new Response(JSON.stringify({ expiresAt: serverExpiresAt }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };
  const controller = new AbortController();
  const publishedExpiry = await S.publishContactInvite(invite, controller.signal);
  const requestBody = JSON.parse(String(capturedRequest?.init?.body ?? '{}'));
  const requestUrl = typeof capturedRequest?.input === 'string'
    ? capturedRequest.input
    : capturedRequest?.input?.url;
  ok('Publizieren nutzt POST und der Server kann die authentifizierte Frist nicht verlängern',
    requestUrl === '/api/contact-code/create' &&
    capturedRequest?.init?.method === 'POST' &&
    publishedExpiry === invite.expiresAt);
  ok('beim Publizieren sieht der Server nur Locator und Ciphertext',
    Object.keys(requestBody).sort().join(',') === 'locator,payload' &&
    requestBody.locator === invite.locator &&
    requestBody.payload === invite.payload &&
    !JSON.stringify(requestBody).includes(invite.code) &&
    !JSON.stringify(requestBody).includes(bundleToken));
  ok('auch Publizieren reicht das Runtime-Abbruchsignal weiter',
    capturedRequest?.init?.signal === controller.signal);
} finally {
  globalThis.fetch = originalFetch;
}

try {
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input, init };
    return new Response(JSON.stringify({
      payload: invite.payload,
      expiresAt: serverExpiresAt,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const controller = new AbortController();
  const resolved = await S.resolveContactInvite(invite.code, controller.signal);
  const requestBody = JSON.parse(String(capturedRequest?.init?.body ?? '{}'));
  const requestUrl = typeof capturedRequest?.input === 'string'
    ? capturedRequest.input
    : capturedRequest?.input?.url;

  ok('Remote-Auflösung liefert Bundle, kanonischen Code und Ablaufzeit',
    resolved?.bundle === bundleToken &&
    resolved?.code === invite.code &&
    resolved?.expiresAt === invite.expiresAt);
  ok('Auflösung nutzt einen festen POST-Endpunkt statt eines Browserlinks',
    requestUrl === '/api/contact-code/resolve' &&
    capturedRequest?.init?.method === 'POST');
  ok('Server erhält ausschließlich den abgeleiteten Locator, nie Code oder Bundle',
    requestBody.locator === invite.locator &&
    !JSON.stringify(requestBody).includes(invite.code) &&
    !JSON.stringify(requestBody).includes(bundleToken));
  ok('Abbruchsignal wird bis zum Resolver-Fetch weitergereicht',
    capturedRequest?.init?.signal === controller.signal);
} finally {
  globalThis.fetch = originalFetch;
}

let substitutedResponseRejected = false;
try {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      payload: secondInvite.payload,
      expiresAt: serverExpiresAt,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  substitutedResponseRejected = await rejects(() => S.resolveContactInvite(invite.code));
} finally {
  globalThis.fetch = originalFetch;
}
ok('kompromittierter Resolver kann kein anderes Kontaktbundle unterschieben',
  substitutedResponseRejected);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
