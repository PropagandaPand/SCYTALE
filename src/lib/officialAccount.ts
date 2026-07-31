import {
  bytesEqual,
  decodeBundle,
  decodeDeviceList,
  encodeDeviceList,
  verify,
  verifyDeviceCert,
  verifyDeviceList,
  type Bytes,
  type DeviceList,
  type PreKeyBundle,
} from '../crypto';
import {
  OFFICIAL_ACCOUNT_MIN_SEQUENCE,
  OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL,
} from './officialAccountConfig';
import {
  OFFICIAL_ACCOUNT_ALIAS,
  OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES,
  OFFICIAL_ACCOUNT_ROUTE_ALIAS,
  OfficialAccountManifestError,
  assertTimelyOfficialAccountManifest,
  base64urlDecode,
  base64urlEncode,
  canonicalOfficialAccountManifestJson,
  officialAccountManifestDigest,
  parseOfficialAccountManifest,
  verifyOfficialAccountManifestSignature,
  type OfficialAccountManifest,
} from './officialAccountManifest';

export interface OfficialAccountFloor {
  sequence: number;
  digest: string;
}

export interface TrustedOfficialAccountDocument extends OfficialAccountFloor {
  manifest: OfficialAccountManifest;
  /** False for an expired/future cached floor; such a record authorises no badge. */
  current: boolean;
  masterPub: Bytes;
  bundle: PreKeyBundle | null;
  deviceList: DeviceList | null;
  /** Root-signed revocation proofs retained monotonically by the sealed store. */
  revokedManifests: readonly OfficialAccountManifest[];
  /** Decoded convenience view of revokedManifests; never sourced from Contact. */
  revokedMasterPubs: readonly Bytes[];
}

export interface OfficialContactIdentity {
  peerMasterPub: Uint8Array;
}

export type OfficialAccountErrorKind =
  | 'format'
  | 'configuration'
  | 'signature'
  | 'not-current'
  | 'revoked'
  | 'rollback'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable';

export class OfficialAccountError extends Error {
  constructor(
    readonly kind: OfficialAccountErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'OfficialAccountError';
  }
}

export interface VerifyOfficialAccountOptions {
  rootPublicKey?: Uint8Array<ArrayBuffer>;
  minimumSequence?: number;
  floor?: OfficialAccountFloor | null;
  now?: number;
  /** Cache loads keep an expired signed document as a rollback floor. */
  requireCurrent?: boolean;
}

interface ResolveOfficialAccountOptions extends VerifyOfficialAccountOptions {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}

function configuredRootPublicKey(): Uint8Array<ArrayBuffer> {
  if (!OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL) {
    throw new OfficialAccountError(
      'configuration',
      'Der offizielle Admin-Account ist in diesem Release noch nicht aktiviert.',
    );
  }
  try {
    const root = base64urlDecode(OFFICIAL_ACCOUNT_ROOT_PUBLIC_KEY_B64URL, 32);
    if (root.length !== 32) throw new Error('length');
    return root;
  } catch {
    throw new OfficialAccountError(
      'configuration',
      'Der Admin-Vertrauensanker dieses Releases ist ungültig.',
    );
  }
}

export function officialAccountConfigured(): boolean {
  try {
    return configuredRootPublicKey().length === 32;
  } catch {
    return false;
  }
}

function translateManifestError(error: unknown): OfficialAccountError {
  if (error instanceof OfficialAccountError) return error;
  if (error instanceof OfficialAccountManifestError) {
    return new OfficialAccountError(error.kind, error.message);
  }
  return new OfficialAccountError(
    'format',
    error instanceof Error ? error.message : 'Ungültige Admin-Beschreibung.',
  );
}

function sameSignedPreKey(
  bundle: PreKeyBundle,
  entry: DeviceList['devices'][number],
): boolean {
  return (
    !!entry.signedPreKey &&
    entry.signedPreKey.id === bundle.signedPreKey.id &&
    bytesEqual(entry.signedPreKey.pub, bundle.signedPreKey.pub) &&
    bytesEqual(entry.signedPreKey.signature, bundle.signedPreKey.signature)
  );
}

async function verifyBootstrapCrypto(
  manifest: OfficialAccountManifest,
  masterPub: Bytes,
): Promise<{ bundle: PreKeyBundle; deviceList: DeviceList | null }> {
  let bundle: PreKeyBundle;
  try {
    bundle = await decodeBundle(manifest.bundle);
  } catch {
    throw new OfficialAccountError('format', 'Das offizielle Bootstrap-Bundle ist ungültig.');
  }
  if (
    bundle.oneTimePreKey ||
    bundle.epoch !== manifest.deviceEpoch ||
    !bytesEqual(bundle.masterPub, masterPub)
  ) {
    throw new OfficialAccountError(
      'signature',
      'Das offizielle Bootstrap-Bundle passt nicht zum signierten Admin-Stand.',
    );
  }
  const [certificateValid, signedPreKeyValid] = await Promise.all([
    verifyDeviceCert(
      masterPub,
      bundle.epoch,
      bundle.identitySignPub,
      bundle.identityDhPub,
      bundle.deviceCert,
    ),
    verify(
      bundle.signedPreKey.pub,
      bundle.signedPreKey.signature,
      bundle.identitySignPub,
    ),
  ]);
  if (!certificateValid || !signedPreKeyValid) {
    throw new OfficialAccountError(
      'signature',
      'Das offizielle Admin-Gerät konnte nicht kryptografisch bestätigt werden.',
    );
  }

  if (manifest.deviceList === null) return { bundle, deviceList: null };

  let list: DeviceList;
  try {
    const encoded = base64urlDecode(manifest.deviceList, 64 * 1024);
    list = await decodeDeviceList(encoded);
    // One canonical inner representation keeps root signatures and manifest
    // digests unique for one semantic device directory.
    if (base64urlEncode(await encodeDeviceList(list)) !== manifest.deviceList) {
      throw new Error('non-canonical');
    }
  } catch {
    throw new OfficialAccountError('format', 'Die offizielle Geräteliste ist ungültig.');
  }
  if (
    list.epoch !== manifest.deviceEpoch ||
    list.version !== manifest.deviceListVersion ||
    !(await verifyDeviceList(list, masterPub, manifest.deviceEpoch))
  ) {
    throw new OfficialAccountError(
      'signature',
      'Die offizielle Geräteliste passt nicht zum signierten Admin-Stand.',
    );
  }
  const bootstrapEntry = list.devices.find((entry) =>
    bytesEqual(entry.signPub, bundle.identitySignPub),
  );
  if (
    !bootstrapEntry ||
    !bytesEqual(bootstrapEntry.dhPub, bundle.identityDhPub) ||
    !bytesEqual(bootstrapEntry.deviceCert, bundle.deviceCert) ||
    !sameSignedPreKey(bundle, bootstrapEntry)
  ) {
    throw new OfficialAccountError(
      'signature',
      'Das Bootstrap-Gerät fehlt im signierten offiziellen Gerätestand.',
    );
  }
  return { bundle, deviceList: list };
}

/**
 * The complete tombstone set for a document: every master the head declares
 * revoked, its own master when the head itself is a revocation, and every master
 * covered by a retained full revocation proof. Deduped; order is not significant.
 */
export function collectRevokedMasterPubs(
  head: OfficialAccountManifest,
  proofs: readonly OfficialAccountManifest[],
): Bytes[] {
  const byKey = new Map<string, Bytes>();
  const add = (b64: string) => {
    if (!byKey.has(b64)) byKey.set(b64, base64urlDecode(b64, 32) as Bytes);
  };
  for (const entry of head.revokedMasters) add(entry);
  if (head.status === 'revoked') add(head.masterPub);
  for (const proof of proofs) add(proof.masterPub);
  return [...byKey.values()];
}

/**
 * Verify one untrusted document all the way to existing SKYTALE primitives.
 * This function mutates no cache and no Contact, so a caller can persist only
 * after every outer and inner signature check has completed.
 */
export async function verifyOfficialAccountDocument(
  value: unknown,
  options: VerifyOfficialAccountOptions = {},
): Promise<TrustedOfficialAccountDocument> {
  try {
    const manifest = parseOfficialAccountManifest(value);
    const rootPublicKey = options.rootPublicKey ?? configuredRootPublicKey();
    const rootSignatureValid = await verifyOfficialAccountManifestSignature(
      manifest,
      rootPublicKey,
      async (message, signature, publicKey) =>
        verify(message, signature, publicKey),
    );
    if (!rootSignatureValid) {
      throw new OfficialAccountError(
        'signature',
        'Die offizielle Admin-Signatur ist ungültig.',
      );
    }
    let current = true;
    try {
      assertTimelyOfficialAccountManifest(manifest, options.now);
    } catch (error) {
      current = false;
      if (options.requireCurrent !== false) throw error;
    }
    const minimumSequence = options.minimumSequence ?? OFFICIAL_ACCOUNT_MIN_SEQUENCE;
    if (
      !Number.isSafeInteger(minimumSequence) ||
      minimumSequence < 1 ||
      manifest.sequence < minimumSequence
    ) {
      throw new OfficialAccountError(
        'rollback',
        'Die Admin-Beschreibung liegt unter dem sicheren Release-Stand.',
      );
    }
    const digest = await officialAccountManifestDigest(manifest);
    if (options.floor) {
      if (manifest.sequence < options.floor.sequence) {
        throw new OfficialAccountError(
          'rollback',
          'Eine veraltete Admin-Beschreibung wurde zurückgewiesen.',
        );
      }
      if (
        manifest.sequence === options.floor.sequence &&
        digest !== options.floor.digest
      ) {
        throw new OfficialAccountError(
          'rollback',
          'Widersprüchliche Admin-Beschreibungen derselben Version wurden zurückgewiesen.',
        );
      }
    }
    const masterPub = base64urlDecode(manifest.masterPub, 32) as Bytes;
    if (manifest.status === 'revoked') {
      return {
        manifest,
        sequence: manifest.sequence,
        digest,
        current,
        masterPub,
        bundle: null,
        deviceList: null,
        revokedManifests: [manifest],
        revokedMasterPubs: collectRevokedMasterPubs(manifest, [manifest]),
      };
    }
    const { bundle, deviceList } = await verifyBootstrapCrypto(manifest, masterPub);
    return {
      manifest,
      sequence: manifest.sequence,
      digest,
      current,
      masterPub,
      bundle,
      deviceList,
      revokedManifests: [],
      revokedMasterPubs: collectRevokedMasterPubs(manifest, []),
    };
  } catch (error) {
    throw translateManifestError(error);
  }
}

/** Find the permanent alias in a bare value or an ordinary share sentence. */
export function extractOfficialAccountAlias(input: string): string | null {
  if (input.length > 4096) return null;
  const match = input
    .toUpperCase()
    .match(/(?:^|[^A-Z0-9])(SKYTALE[\s\-\u2010-\u2015]*SUPPORT)(?=$|[^A-Z0-9])/);
  return match ? OFFICIAL_ACCOUNT_ALIAS : null;
}

async function readJsonLimited(response: Response): Promise<unknown> {
  const contentType = response.headers
    .get('content-type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== 'application/json' || !response.body) {
    throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
  }
  const declared = response.headers.get('content-length');
  if (declared !== null) {
    const length = Number(declared);
    if (
      !Number.isSafeInteger(length) ||
      length < 1 ||
      length > OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES
    ) {
      throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
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
    if (total > OFFICIAL_ACCOUNT_MAX_DOCUMENT_BYTES) {
      await reader.cancel('response too large').catch(() => undefined);
      throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
  }
}

export async function resolveOfficialAccount(
  input: string,
  options: ResolveOfficialAccountOptions = {},
): Promise<TrustedOfficialAccountDocument> {
  if (!extractOfficialAccountAlias(input)) {
    throw new OfficialAccountError('format', 'Kein gültiger offizieller SKYTALE-Alias.');
  }
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      `/api/official-accounts/${OFFICIAL_ACCOUNT_ROUTE_ALIAS}`,
      {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: options.signal,
      },
    );
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
  }
  if (response.status === 404) {
    throw new OfficialAccountError('not-found', 'Der offizielle Admin-Account ist noch nicht verfügbar.');
  }
  if (response.status === 429) {
    throw new OfficialAccountError('rate-limited', 'Zu viele Anfragen — bitte kurz warten.');
  }
  if (!response.ok) {
    throw new OfficialAccountError('unavailable', 'Admin-Verzeichnis vorübergehend nicht verfügbar.');
  }
  return verifyOfficialAccountDocument(await readJsonLimited(response), options);
}

export function isOfficialAdminContact(
  contact: OfficialContactIdentity,
  trusted: TrustedOfficialAccountDocument | null | undefined,
): boolean {
  return isOfficialAdminMaster(contact.peerMasterPub, trusted);
}

export function isRevokedOfficialAdminContact(
  contact: OfficialContactIdentity,
  trusted: TrustedOfficialAccountDocument | null | undefined,
): boolean {
  return isRevokedOfficialAdminMaster(contact.peerMasterPub, trusted);
}

/**
 * A verified revocation is a permanent local tombstone, not a time-limited UI
 * badge. The sealed store retains the signed proof across later active heads so
 * an old compromised master never becomes an ordinary lookalike contact again.
 */
export function isRevokedOfficialAdminMaster(
  masterPub: Uint8Array,
  trusted: TrustedOfficialAccountDocument | null | undefined,
): boolean {
  return !!trusted?.revokedMasterPubs.some((revoked) =>
    bytesEqual(masterPub, revoked),
  );
}

export function isOfficialAdminMaster(
  masterPub: Uint8Array,
  trusted: TrustedOfficialAccountDocument | null | undefined,
): boolean {
  if (
    trusted?.current !== true ||
    trusted.manifest.status !== 'active' ||
    !bytesEqual(masterPub, trusted.masterPub)
  ) {
    return false;
  }
  // `current` records the result at verification time. A long-running unlocked
  // tab must still drop the badge when notAfter passes, without waiting for a
  // reload or a successful directory refresh.
  try {
    assertTimelyOfficialAccountManifest(trusted.manifest);
    return true;
  } catch {
    return false;
  }
}

export function canonicalOfficialAccountDocument(
  trusted: TrustedOfficialAccountDocument,
): string {
  return canonicalOfficialAccountManifestJson(trusted.manifest);
}
