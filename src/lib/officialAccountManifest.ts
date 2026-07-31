import { OFFICIAL_ACCOUNT_ROOT_KEY_ID } from './officialAccountConfig';

export { OFFICIAL_ACCOUNT_ROOT_KEY_ID } from './officialAccountConfig';

export const OFFICIAL_ACCOUNT_ALIAS = 'SKYTALE-SUPPORT';
export const OFFICIAL_ACCOUNT_ROUTE_ALIAS = 'skytale-support';
export const OFFICIAL_ACCOUNT_ROLE = 'admin';
export const OFFICIAL_ACCOUNT_DISPLAY_NAME = 'ThePhantomPuppet';
export const OFFICIAL_ACCOUNT_BADGE = 'ADMIN';

export const OFFICIAL_ACCOUNT_MANIFEST_SCHEMA = 1;
export const OFFICIAL_ACCOUNT_CLOCK_SKEW_MS = 10 * 60 * 1000;
// A fresh installation has no local sequence floor. Keeping root-authorised
// documents short-lived bounds how long a fully compromised directory could
// replay an archived, pre-revocation document to that new client. The permanent
// user-facing alias does not change when this operator-only lease is renewed.
export const OFFICIAL_ACCOUNT_MAX_LIFETIME_MS = 45 * 24 * 60 * 60 * 1000;
export const OFFICIAL_ACCOUNT_MAX_DEVICE_LIST_BYTES = 64 * 1024;
export const OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES = 96 * 1024;
// Every manifest carries the full set of root-revoked historical masters. A
// client that never saw the transient `revoked` head (the account rotated to a
// new active master while it was offline) still learns the tombstone from the
// next active head and keeps the former master send-blocked. Bounded so parsing
// and signature verification stay allocation-safe.
export const OFFICIAL_ACCOUNT_MAX_REVOKED_MASTERS = 16;

const ACTIVE_BUNDLE_CHARS = 355; // compact bundle v2, deliberately without an OPK
const MASTER_PUBLIC_KEY_BYTES = 32;
const ROOT_SIGNATURE_BYTES = 64;
const UINT32_MAX = 0xffff_ffff;
const SIGNING_DOMAIN = new TextEncoder().encode(
  'SKYTALE/OFFICIAL-ACCOUNT-MANIFEST/v1\0',
);
const textEncoder = new TextEncoder();

export interface OfficialAccountManifest {
  schema: 1;
  sequence: number;
  rootKeyId: string;
  alias: string;
  role: string;
  displayName: string;
  badge: string;
  status: 'active' | 'revoked';
  masterPub: string;
  bundle: string;
  deviceList: string | null;
  deviceEpoch: number;
  deviceListVersion: number;
  notBefore: number;
  notAfter: number;
  /** Canonical (strictly ascending, de-duped) 32-byte base64url master keys the
   * root declares revoked as of this manifest; never contains this manifest's
   * own `masterPub`. Part of the signed transcript. */
  revokedMasters: string[];
  signature: string;
}

export type UnsignedOfficialAccountManifest = Omit<
  OfficialAccountManifest,
  'signature'
>;

export type Ed25519Verifier = (
  message: Uint8Array<ArrayBuffer>,
  signature: Uint8Array<ArrayBuffer>,
  publicKey: Uint8Array<ArrayBuffer>,
) => Promise<boolean>;

export class OfficialAccountManifestError extends Error {
  constructor(
    readonly kind:
      | 'format'
      | 'configuration'
      | 'signature'
      | 'not-current'
      | 'revoked',
    message: string,
  ) {
    super(message);
    this.name = 'OfficialAccountManifestError';
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function uint32(value: number): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new OfficialAccountManifestError('format', 'Ungültiger Manifest-Zähler.');
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, false);
  return out;
}

function uint64(value: number): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new OfficialAccountManifestError('format', 'Ungültiger Manifest-Zeitwert.');
  }
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, BigInt(value), false);
  return out;
}

function framed(value: string): Uint8Array<ArrayBuffer> {
  const bytes = textEncoder.encode(value);
  return concatBytes(uint32(bytes.length), bytes);
}

export function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64urlDecode(
  value: string,
  maxBytes = OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES,
): Uint8Array<ArrayBuffer> {
  if (
    value.length < 1 ||
    value.length % 4 === 1 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new OfficialAccountManifestError('format', 'Nicht-kanonisches Base64url.');
  }
  const maximumEncodedLength = Math.ceil((maxBytes * 4) / 3) + 2;
  if (value.length > maximumEncodedLength) {
    throw new OfficialAccountManifestError('format', 'Manifest-Feld ist zu groß.');
  }
  let binary: string;
  try {
    binary = atob(
      value.replace(/-/g, '+').replace(/_/g, '/') +
        '='.repeat((4 - (value.length % 4)) % 4),
    );
  } catch {
    throw new OfficialAccountManifestError('format', 'Nicht-kanonisches Base64url.');
  }
  if (binary.length > maxBytes) {
    throw new OfficialAccountManifestError('format', 'Manifest-Feld ist zu groß.');
  }
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    out[index] = binary.charCodeAt(index);
  }
  if (base64urlEncode(out) !== value) {
    throw new OfficialAccountManifestError('format', 'Nicht-kanonisches Base64url.');
  }
  return out;
}

function exactBase64urlBytes(value: unknown, bytes: number): value is string {
  if (typeof value !== 'string') return false;
  try {
    return base64urlDecode(value, bytes).length === bytes;
  } catch {
    return false;
  }
}

export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const shared = Math.min(a.length, b.length);
  for (let index = 0; index < shared; index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

/**
 * The revoked-master list is part of the signed transcript, so it has exactly
 * one canonical byte form: each entry an exact 32-byte key, strictly ascending
 * (which also forbids duplicates), bounded, and never equal to the manifest's
 * own `masterPub` (a document conveys its own status via `status`, not here).
 */
function isCanonicalMasterList(
  value: unknown,
  ownMaster: Uint8Array,
): value is string[] {
  if (
    !Array.isArray(value) ||
    value.length > OFFICIAL_ACCOUNT_MAX_REVOKED_MASTERS
  ) {
    return false;
  }
  let previous: Uint8Array | null = null;
  for (const entry of value) {
    if (!exactBase64urlBytes(entry, MASTER_PUBLIC_KEY_BYTES)) return false;
    const bytes = base64urlDecode(entry, MASTER_PUBLIC_KEY_BYTES);
    if (compareBytes(bytes, ownMaster) === 0) return false;
    if (previous && compareBytes(previous, bytes) >= 0) return false;
    previous = bytes;
  }
  return true;
}

function safePositive(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function safeUint32(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= UINT32_MAX
  );
}

const MANIFEST_KEYS = [
  'schema',
  'sequence',
  'rootKeyId',
  'alias',
  'role',
  'displayName',
  'badge',
  'status',
  'masterPub',
  'bundle',
  'deviceList',
  'deviceEpoch',
  'deviceListVersion',
  'notBefore',
  'notAfter',
  'revokedMasters',
  'signature',
] as const;

/** Allocation-bounded structural validation before signature or crypto work. */
export function parseOfficialAccountManifest(
  value: unknown,
): OfficialAccountManifest {
  if (!isPlainRecord(value)) {
    throw new OfficialAccountManifestError('format', 'Ungültiges Admin-Manifest.');
  }
  const keys = Object.keys(value);
  if (
    keys.length !== MANIFEST_KEYS.length ||
    keys.some((key) => !(MANIFEST_KEYS as readonly string[]).includes(key))
  ) {
    throw new OfficialAccountManifestError('format', 'Ungültige Manifest-Felder.');
  }
  if (
    value.schema !== OFFICIAL_ACCOUNT_MANIFEST_SCHEMA ||
    !safePositive(value.sequence) ||
    value.rootKeyId !== OFFICIAL_ACCOUNT_ROOT_KEY_ID ||
    value.alias !== OFFICIAL_ACCOUNT_ALIAS ||
    value.role !== OFFICIAL_ACCOUNT_ROLE ||
    value.displayName !== OFFICIAL_ACCOUNT_DISPLAY_NAME ||
    value.badge !== OFFICIAL_ACCOUNT_BADGE ||
    (value.status !== 'active' && value.status !== 'revoked') ||
    !exactBase64urlBytes(value.masterPub, MASTER_PUBLIC_KEY_BYTES) ||
    typeof value.bundle !== 'string' ||
    value.bundle.length !== ACTIVE_BUNDLE_CHARS ||
    !/^[A-Za-z0-9_-]+$/.test(value.bundle) ||
    !safeUint32(value.deviceEpoch) ||
    value.deviceEpoch < 1 ||
    !safeUint32(value.deviceListVersion) ||
    !safePositive(value.notBefore) ||
    !safePositive(value.notAfter) ||
    value.notAfter <= value.notBefore ||
    value.notAfter - value.notBefore > OFFICIAL_ACCOUNT_MAX_LIFETIME_MS ||
    !exactBase64urlBytes(value.signature, ROOT_SIGNATURE_BYTES)
  ) {
    throw new OfficialAccountManifestError('format', 'Ungültige Manifest-Struktur.');
  }
  if (value.deviceList === null) {
    if (value.deviceListVersion !== 0) {
      throw new OfficialAccountManifestError('format', 'DeviceList-Floor ohne DeviceList.');
    }
  } else {
    if (
      typeof value.deviceList !== 'string' ||
      value.deviceListVersion < 1 ||
      base64urlDecode(
        value.deviceList,
        OFFICIAL_ACCOUNT_MAX_DEVICE_LIST_BYTES,
      ).length < 1
    ) {
      throw new OfficialAccountManifestError('format', 'Ungültige DeviceList.');
    }
  }
  // Bundle tokens are unpadded base64url too. Re-encoding catches unused tail bits.
  if (base64urlDecode(value.bundle, 266).length !== 266) {
    throw new OfficialAccountManifestError('format', 'Ungültiges Bootstrap-Bundle.');
  }
  if (
    !isCanonicalMasterList(
      value.revokedMasters,
      base64urlDecode(value.masterPub as string, MASTER_PUBLIC_KEY_BYTES),
    )
  ) {
    throw new OfficialAccountManifestError(
      'format',
      'Ungültige Widerrufsliste im Manifest.',
    );
  }
  return value as unknown as OfficialAccountManifest;
}

export function officialAccountSigningBytes(
  manifest: UnsignedOfficialAccountManifest,
): Uint8Array<ArrayBuffer> {
  return concatBytes(
    SIGNING_DOMAIN,
    uint32(manifest.schema),
    uint64(manifest.sequence),
    framed(manifest.rootKeyId),
    framed(manifest.alias),
    framed(manifest.role),
    framed(manifest.displayName),
    framed(manifest.badge),
    framed(manifest.status),
    framed(manifest.masterPub),
    framed(manifest.bundle),
    framed(manifest.deviceList ?? ''),
    uint32(manifest.deviceEpoch),
    uint32(manifest.deviceListVersion),
    uint64(manifest.notBefore),
    uint64(manifest.notAfter),
    uint32(manifest.revokedMasters.length),
    ...manifest.revokedMasters.map((entry) => framed(entry)),
  );
}

export function unsignedOfficialAccountManifest(
  manifest: OfficialAccountManifest,
): UnsignedOfficialAccountManifest {
  return {
    schema: manifest.schema,
    sequence: manifest.sequence,
    rootKeyId: manifest.rootKeyId,
    alias: manifest.alias,
    role: manifest.role,
    displayName: manifest.displayName,
    badge: manifest.badge,
    status: manifest.status,
    masterPub: manifest.masterPub,
    bundle: manifest.bundle,
    deviceList: manifest.deviceList,
    deviceEpoch: manifest.deviceEpoch,
    deviceListVersion: manifest.deviceListVersion,
    notBefore: manifest.notBefore,
    notAfter: manifest.notAfter,
    revokedMasters: manifest.revokedMasters,
  };
}

/** Stable JSON for storage and the public HTTP response. */
export function canonicalOfficialAccountManifestJson(
  manifest: OfficialAccountManifest,
): string {
  return JSON.stringify({
    ...unsignedOfficialAccountManifest(manifest),
    signature: manifest.signature,
  });
}

async function webCryptoVerify(
  message: Uint8Array<ArrayBuffer>,
  signature: Uint8Array<ArrayBuffer>,
  publicKey: Uint8Array<ArrayBuffer>,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      signature,
      message,
    );
  } catch {
    return false;
  }
}

export async function verifyOfficialAccountManifestSignature(
  manifest: OfficialAccountManifest,
  rootPublicKey: Uint8Array<ArrayBuffer>,
  verifier: Ed25519Verifier = webCryptoVerify,
): Promise<boolean> {
  if (rootPublicKey.length !== MASTER_PUBLIC_KEY_BYTES) return false;
  try {
    return await verifier(
      officialAccountSigningBytes(unsignedOfficialAccountManifest(manifest)),
      base64urlDecode(manifest.signature, ROOT_SIGNATURE_BYTES),
      rootPublicKey,
    );
  } catch {
    return false;
  }
}

export function assertTimelyOfficialAccountManifest(
  manifest: OfficialAccountManifest,
  now = Date.now(),
): void {
  if (!Number.isSafeInteger(now) || now < 1) {
    throw new OfficialAccountManifestError('not-current', 'Ungültige lokale Uhrzeit.');
  }
  if (
    manifest.notBefore > now + OFFICIAL_ACCOUNT_CLOCK_SKEW_MS ||
    manifest.notAfter <= now - OFFICIAL_ACCOUNT_CLOCK_SKEW_MS
  ) {
    throw new OfficialAccountManifestError(
      'not-current',
      'Die offizielle Admin-Beschreibung ist noch nicht oder nicht mehr gültig.',
    );
  }
}

export function assertCurrentOfficialAccountManifest(
  manifest: OfficialAccountManifest,
  now = Date.now(),
): void {
  assertTimelyOfficialAccountManifest(manifest, now);
  if (manifest.status === 'revoked') {
    throw new OfficialAccountManifestError(
      'revoked',
      'Der offizielle Admin-Account wurde widerrufen.',
    );
  }
}

export async function officialAccountManifestDigest(
  manifest: OfficialAccountManifest,
): Promise<string> {
  const bytes = textEncoder.encode(canonicalOfficialAccountManifestJson(manifest));
  return base64urlEncode(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
  );
}
