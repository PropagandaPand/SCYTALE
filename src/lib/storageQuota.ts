/**
 * Admission policy for received attachments.
 *
 * The browser's origin quota is shared by the encrypted message log, ratchet
 * state, attachment chunks, and assorted metadata. Incoming attachment bytes
 * therefore must leave a meaningful reserve instead of consuming every byte the
 * browser reports as available.
 */

export const AUTO_RECEIVE_CONTACT_CAP_BYTES = 32 * 1024 * 1024;
export const MIN_ORIGIN_HEADROOM_BYTES = 64 * 1024 * 1024;
export const MIN_ORIGIN_HEADROOM_FRACTION = 0.2;

export interface StorageEstimateLike {
  usage?: number;
  quota?: number;
}

export interface RecvReservationLike {
  size: number;
  receivedBytes: number;
  roomId?: string;
  automatic?: boolean;
}

interface StoredMessageLike {
  mine: boolean;
  file?: {
    attId?: string;
    size?: number;
    pull?: unknown;
  };
}

function validBytes(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function saturatingAdd(a: number, b: number): number {
  if (!validBytes(a) || !validBytes(b) || a > Number.MAX_SAFE_INTEGER - b) {
    return Number.MAX_SAFE_INTEGER;
  }
  return a + b;
}

/** Bytes promised by persisted receive markers but not stored yet. */
export function remainingRecvReservationBytes(markers: ReadonlyArray<RecvReservationLike | null>): number {
  let total = 0;
  for (const marker of markers) {
    if (!marker) return Number.MAX_SAFE_INTEGER;
    if (!validBytes(marker.size) || !validBytes(marker.receivedBytes) || marker.receivedBytes > marker.size) {
      return Number.MAX_SAFE_INTEGER; // corrupt reservation state fails closed
    }
    total = saturatingAdd(total, marker.size - marker.receivedBytes);
  }
  return total;
}

/** Full bytes promised by in-flight automatic transfers for one contact. */
export function automaticRecvReservationBytes(
  markers: ReadonlyArray<RecvReservationLike | null>,
  roomId: string,
): number {
  if (!roomId) return Number.MAX_SAFE_INTEGER;
  let total = 0;
  for (const marker of markers) {
    // Old/corrupt markers have no trustworthy quota owner. Until they finish or
    // are swept, another automatic admission would be fail-open.
    if (
      !marker ||
      typeof marker.roomId !== 'string' ||
      typeof marker.automatic !== 'boolean' ||
      !validBytes(marker.size)
    ) {
      return Number.MAX_SAFE_INTEGER;
    }
    if (marker.automatic && marker.roomId === roomId) total = saturatingAdd(total, marker.size);
  }
  return total;
}

/**
 * True only if the requested and already-reserved bytes still leave both the
 * percentage reserve and the absolute 64 MiB reserve. Missing/untrustworthy
 * estimates fail closed because this function gates automatic remote writes.
 */
export function hasOriginStorageHeadroom(
  estimate: StorageEstimateLike | null | undefined,
  requestedBytes: number,
  reservedBytes = 0,
): boolean {
  const usage = estimate?.usage;
  const quota = estimate?.quota;
  if (
    typeof usage !== 'number' ||
    typeof quota !== 'number' ||
    !Number.isFinite(usage) ||
    !Number.isFinite(quota) ||
    usage < 0 ||
    quota <= 0 ||
    usage > quota ||
    !validBytes(requestedBytes) ||
    !validBytes(reservedBytes)
  ) {
    return false;
  }
  const headroom = Math.max(MIN_ORIGIN_HEADROOM_BYTES, quota * MIN_ORIGIN_HEADROOM_FRACTION);
  const required = requestedBytes + reservedBytes + headroom;
  return Number.isFinite(required) && required <= quota - usage;
}

/** Bytes of distinct, fully stored inbound attachments in one contact's log. */
export function storedReceivedAttachmentBytes(messages: ReadonlyArray<StoredMessageLike>): number {
  const seen = new Set<string>();
  let total = 0;
  for (const message of messages) {
    const file = message.file;
    if (message.mine || !file?.attId || file.pull || seen.has(file.attId)) continue;
    // A referenced attachment without trustworthy size metadata must not turn
    // the cap into a fail-open policy for legacy/corrupt records.
    if (!validBytes(file.size)) return Number.MAX_SAFE_INTEGER;
    seen.add(file.attId);
    total = saturatingAdd(total, file.size);
  }
  return total;
}

export function mayAutoReceiveAttachment(
  messages: ReadonlyArray<StoredMessageLike>,
  incomingBytes: number,
  capBytes = AUTO_RECEIVE_CONTACT_CAP_BYTES,
  reservedBytes = 0,
): boolean {
  if (!validBytes(incomingBytes) || !validBytes(capBytes) || !validBytes(reservedBytes)) return false;
  const stored = storedReceivedAttachmentBytes(messages);
  if (stored > capBytes || reservedBytes > capBytes - stored) return false;
  return incomingBytes <= capBytes - stored - reservedBytes;
}
