/**
 * Remote contact exchange without a browser-opening URL.
 *
 * A contact code is a 128-bit, human-copyable commitment to a fresh random salt
 * and the canonical public pre-key bundle. The rendezvous Worker receives only a
 * domain-separated locator and AES-GCM ciphertext. It cannot read the identity
 * keys or replace one contact with another; at worst it can withhold the record.
 *
 * The in-person QR remains self-contained and does not use this service.
 */

const CODE_PREFIX = 'SK1';
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_BYTES = 16;
const CODE_DIGITS = 26;
const CHECK_DIGITS = 1;
const SALT_BYTES = 16;
const EXPIRY_BYTES = 8;
const IV_BYTES = 12;
const PAYLOAD_VERSION = 1;
const BUNDLE_BASE_BYTES = 266;
const BUNDLE_OPK_BYTES = 302;
const MAX_RESPONSE_BYTES = 2048;
const CONTACT_CODE_TTL_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 15 * 60 * 1000;
export const MAX_CONTACT_INPUT_CHARS = 4096;

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

const CODE_HASH_DOMAIN = enc.encode('SKYTALE/contact-code/hash/v1\0');
const CHECK_DOMAIN = enc.encode('SKYTALE/contact-code/check/v1\0');
const LOCATOR_DOMAIN = enc.encode('SKYTALE/contact-code/locator/v1\0');
const KEY_DOMAIN = enc.encode('SKYTALE/contact-code/key/v1\0');
const AAD_DOMAIN = enc.encode('SKYTALE/contact-code/aad/v1\0');

export type ContactCodeErrorKind =
  | 'format'
  | 'not-found'
  | 'integrity'
  | 'rate-limited'
  | 'unavailable';

export class ContactCodeError extends Error {
  constructor(
    readonly kind: ContactCodeErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ContactCodeError';
  }
}

export interface ContactInviteDraft {
  code: string;
  locator: string;
  payload: string;
  expiresAt: number;
}

export interface DecodedContactCode {
  canonical: string;
  codeBytes: Uint8Array<ArrayBuffer>;
}

export interface ResolvedContactInvite {
  bundle: string;
  code: string;
  expiresAt: number;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  let length = 0;
  for (const part of parts) length += part.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hash(domain: Uint8Array, ...parts: Uint8Array[]): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', concat(domain, ...parts)));
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    if (b64urlEncode(out) !== value) {
      throw new Error('non-canonical');
    }
    return out;
  } catch (error) {
    if (error instanceof ContactCodeError) throw error;
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
}

function base32Encode(bytes: Uint8Array): string {
  let buffer = 0;
  let bits = 0;
  let out = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(buffer >>> bits) & 31];
      buffer &= (1 << bits) - 1;
    }
  }
  if (bits > 0) out += CROCKFORD[(buffer << (5 - bits)) & 31];
  return out;
}

function base32Decode(value: string): Uint8Array<ArrayBuffer> {
  let buffer = 0;
  let bits = 0;
  const bytes: number[] = [];
  for (const char of value) {
    const digit = CROCKFORD.indexOf(char);
    if (digit < 0) {
      throw new ContactCodeError('format', 'Kein gültiger SKYTALE-Kontaktcode.');
    }
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  if (bytes.length !== CODE_BYTES || bits !== 2 || buffer !== 0) {
    throw new ContactCodeError('format', 'Kein gültiger SKYTALE-Kontaktcode.');
  }
  return Uint8Array.from(bytes);
}

function normalizeCrockford(value: string): string {
  return value
    .toUpperCase()
    .replaceAll('O', '0')
    .replace(/[IL]/g, '1');
}

function formatCodeDigits(digits: string): string {
  return `${CODE_PREFIX}-${digits.match(/.{1,4}/g)?.join('-') ?? digits}`;
}

/**
 * Extract a code from either the bare value or an entire share message.
 * Whitespace/hyphens and Crockford's O/I/L aliases are tolerated.
 */
export function extractContactCode(input: string): string | null {
  if (input.length > MAX_CONTACT_INPUT_CHARS) return null;
  const match = input
    .toUpperCase()
    .match(/(?:^|[^A-Z0-9])(SK1(?:[\s\-\u2010-\u2015]*[0-9A-Z]){27})(?=$|[^A-Z0-9])/);
  if (!match) return null;
  const compact = normalizeCrockford(match[1]).replace(/[\s\-\u2010-\u2015]/g, '');
  if (!compact.startsWith(CODE_PREFIX) || compact.length !== CODE_PREFIX.length + CODE_DIGITS + CHECK_DIGITS) {
    return null;
  }
  const digits = compact.slice(CODE_PREFIX.length);
  if ([...digits].some((char) => !CROCKFORD.includes(char))) return null;
  return formatCodeDigits(digits);
}

async function checksum(codeBytes: Uint8Array): Promise<string> {
  const digest = await hash(CHECK_DOMAIN, codeBytes);
  return CROCKFORD[digest[0] >>> 3];
}

export async function decodeContactCode(input: string): Promise<DecodedContactCode> {
  const canonical = extractContactCode(input);
  if (!canonical) {
    throw new ContactCodeError('format', 'Kein gültiger SKYTALE-Kontaktcode.');
  }
  const compact = canonical.replaceAll('-', '').slice(CODE_PREFIX.length);
  const encoded = compact.slice(0, CODE_DIGITS);
  const codeBytes = base32Decode(encoded);
  if ((await checksum(codeBytes)) !== compact.slice(CODE_DIGITS)) {
    throw new ContactCodeError('format', 'Der SKYTALE-Kontaktcode enthält einen Tippfehler.');
  }
  return { canonical, codeBytes };
}

function validateBundleToken(bundleToken: string): Uint8Array<ArrayBuffer> {
  const token = bundleToken.trim();
  const raw = b64urlDecode(token);
  if (
    b64urlEncode(raw) !== token ||
    (raw.length !== BUNDLE_BASE_BYTES && raw.length !== BUNDLE_OPK_BYTES)
  ) {
    throw new ContactCodeError('format', 'Ungültiges Bundle-Format.');
  }
  return raw;
}

async function deriveInviteSecrets(codeBytes: Uint8Array): Promise<{
  locatorBytes: Uint8Array<ArrayBuffer>;
  locator: string;
  key: CryptoKey;
}> {
  const [locatorBytes, keyBytes] = await Promise.all([
    hash(LOCATOR_DOMAIN, codeBytes),
    hash(KEY_DOMAIN, codeBytes),
  ]);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return { locatorBytes, locator: b64urlEncode(locatorBytes), key };
}

function inviteAad(locatorBytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return concat(AAD_DOMAIN, Uint8Array.of(PAYLOAD_VERSION), locatorBytes);
}

function encodeExpiry(expiresAt: number): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const bytes = new Uint8Array(EXPIRY_BYTES);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(expiresAt), false);
  return bytes;
}

function decodeExpiry(bytes: Uint8Array): number {
  if (bytes.length !== EXPIRY_BYTES) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const value = Number(
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(0, false),
  );
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  return value;
}

/** Create a fresh immutable encrypted rendezvous record. No network call occurs. */
export async function createContactInvite(bundleToken: string): Promise<ContactInviteDraft> {
  const bundle = validateBundleToken(bundleToken);
  // Reusable rendezvous codes must never carry a consumable one-time pre-key.
  if (bundle.length !== BUNDLE_BASE_BYTES) {
    throw new ContactCodeError('format', 'Dieser Verbindungscode ist nicht für einen wiederverwendbaren Kontaktcode geeignet.');
  }
  const expiresAt = Date.now() + CONTACT_CODE_TTL_MS;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const plaintext = concat(
    Uint8Array.of(PAYLOAD_VERSION),
    encodeExpiry(expiresAt),
    salt,
    bundle,
  );
  const codeDigest = await hash(CODE_HASH_DOMAIN, plaintext);
  const codeBytes = codeDigest.slice(0, CODE_BYTES);
  const codeDigits = base32Encode(codeBytes);
  const code = formatCodeDigits(codeDigits + (await checksum(codeBytes)));
  const { locatorBytes, locator, key } = await deriveInviteSecrets(codeBytes);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: inviteAad(locatorBytes) },
      key,
      plaintext,
    ),
  );
  return {
    code,
    locator,
    payload: b64urlEncode(concat(Uint8Array.of(PAYLOAD_VERSION), iv, ciphertext)),
    expiresAt,
  };
}

async function openContactInvitePayload(
  codeText: string,
  payload: string,
): Promise<{ bundle: string; expiresAt: number }> {
  const { codeBytes } = await decodeContactCode(codeText);
  const sealed = b64urlDecode(payload);
  if (sealed.length < 1 + IV_BYTES + 16 || sealed[0] !== PAYLOAD_VERSION) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const iv = sealed.slice(1, 1 + IV_BYTES);
  const ciphertext = sealed.slice(1 + IV_BYTES);
  const { locatorBytes, key } = await deriveInviteSecrets(codeBytes);
  let plaintext: Uint8Array<ArrayBuffer>;
  try {
    plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: inviteAad(locatorBytes) },
        key,
        ciphertext,
      ),
    );
  } catch {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  if (
    plaintext[0] !== PAYLOAD_VERSION ||
    (plaintext.length !== 1 + EXPIRY_BYTES + SALT_BYTES + BUNDLE_BASE_BYTES &&
      plaintext.length !== 1 + EXPIRY_BYTES + SALT_BYTES + BUNDLE_OPK_BYTES)
  ) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const committed = (await hash(CODE_HASH_DOMAIN, plaintext)).slice(0, CODE_BYTES);
  let different = 0;
  for (let i = 0; i < CODE_BYTES; i++) different |= committed[i] ^ codeBytes[i];
  if (different !== 0) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const expiresAt = decodeExpiry(plaintext.slice(1, 1 + EXPIRY_BYTES));
  const now = Date.now();
  if (expiresAt <= now) {
    throw new ContactCodeError('not-found', 'Kontaktcode nicht gefunden oder abgelaufen.');
  }
  if (expiresAt > now + CONTACT_CODE_TTL_MS + CLOCK_SKEW_MS) {
    throw new ContactCodeError('integrity', 'Kontaktcode konnte nicht sicher geprüft werden.');
  }
  const bundle = plaintext.slice(1 + EXPIRY_BYTES + SALT_BYTES);
  // Encoding the authenticated binary form gives the exact token expected by
  // decodeBundle(), which performs the remaining certificate/signature checks.
  return { bundle: b64urlEncode(bundle), expiresAt };
}

/** Authenticate/decrypt a resolver payload and recover the canonical bundle. */
export async function openContactInvite(codeText: string, payload: string): Promise<string> {
  return (await openContactInvitePayload(codeText, payload)).bundle;
}

async function readJsonLimited(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json' || !response.body) {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
  const declared = response.headers.get('content-length');
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_RESPONSE_BYTES) {
      throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
    }
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;
    total += value.length;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel('response too large').catch(() => undefined);
      throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
    }
    chunks.push(value);
  }
  const bytes = concat(...chunks);
  try {
    return JSON.parse(dec.decode(bytes)) as unknown;
  } catch {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

async function postJson(path: string, body: Record<string, string>, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
}

export async function publishContactInvite(
  invite: ContactInviteDraft,
  signal?: AbortSignal,
): Promise<number> {
  const now = Date.now();
  if (
    !Number.isSafeInteger(invite.expiresAt) ||
    invite.expiresAt <= now ||
    invite.expiresAt > now + CONTACT_CODE_TTL_MS + CLOCK_SKEW_MS
  ) {
    throw new ContactCodeError('not-found', 'Kontaktcode nicht gefunden oder abgelaufen.');
  }
  const response = await postJson(
    '/api/contact-code/create',
    { locator: invite.locator, payload: invite.payload },
    signal,
  );
  if (response.status === 429) {
    throw new ContactCodeError('rate-limited', 'Zu viele Kontaktcodes erstellt — bitte kurz warten.');
  }
  if (!response.ok) {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
  const value = await readJsonLimited(response);
  if (
    !isPlainRecord(value) ||
    Object.keys(value).some((key) => key !== 'expiresAt') ||
    !Number.isSafeInteger(value.expiresAt) ||
    (value.expiresAt as number) <= now
  ) {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
  // The server may shorten availability but cannot extend the authenticated
  // deadline embedded in the code and ciphertext.
  return Math.min(value.expiresAt as number, invite.expiresAt);
}

export async function resolveContactInvite(
  codeText: string,
  signal?: AbortSignal,
): Promise<ResolvedContactInvite> {
  const decoded = await decodeContactCode(codeText);
  const { locator } = await deriveInviteSecrets(decoded.codeBytes);
  const response = await postJson('/api/contact-code/resolve', { locator }, signal);
  if (response.status === 404) {
    throw new ContactCodeError('not-found', 'Kontaktcode nicht gefunden oder abgelaufen.');
  }
  if (response.status === 429) {
    throw new ContactCodeError('rate-limited', 'Zu viele Versuche — bitte kurz warten.');
  }
  if (!response.ok) {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
  const value = await readJsonLimited(response);
  if (
    !isPlainRecord(value) ||
    Object.keys(value).some((key) => key !== 'payload' && key !== 'expiresAt') ||
    typeof value.payload !== 'string' ||
    !Number.isSafeInteger(value.expiresAt) ||
    (value.expiresAt as number) <= 0
  ) {
    throw new ContactCodeError('unavailable', 'Kurzcode-Dienst vorübergehend nicht verfügbar.');
  }
  const opened = await openContactInvitePayload(decoded.canonical, value.payload);
  return {
    bundle: opened.bundle,
    code: decoded.canonical,
    expiresAt: opened.expiresAt,
  };
}
