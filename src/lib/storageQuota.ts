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
// Each encrypted IndexedDB chunk consumes substantially more than its plaintext:
// record key/indexing, IV/tag, structured-clone and transaction metadata. Charging
// a conservative fixed cost prevents a peer from representing thousands of tiny
// records as a zero-byte attachment and bypassing both quotas.
export const RECV_CHUNK_RECORD_OVERHEAD_BYTES = 4 * 1024;
export const RECV_TRANSFER_FIXED_OVERHEAD_BYTES = 8 * 1024;

export interface StorageEstimateLike {
  usage?: number;
  quota?: number;
}

export interface RecvReservationLike {
  size: number;
  receivedBytes: number;
  total?: number;
  reservedBytes?: number;
  roomId?: string;
  automatic?: boolean;
}

interface StoredMessageLike {
  mine: boolean;
  file?: {
    attId?: string;
    size?: number;
    storageBytes?: number;
    dataB64?: string;
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

/** Quota charge for one incoming chunked transfer, including record overhead. */
export function attachmentRecvReservationBytes(
  plaintextBytes: number,
  chunks: number,
): number {
  if (
    !validBytes(plaintextBytes) ||
    !Number.isSafeInteger(chunks) ||
    chunks < 1
  ) {
    return Number.MAX_SAFE_INTEGER;
  }
  const records =
    chunks > Math.floor(
      (Number.MAX_SAFE_INTEGER - RECV_TRANSFER_FIXED_OVERHEAD_BYTES) /
        RECV_CHUNK_RECORD_OVERHEAD_BYTES,
    )
      ? Number.MAX_SAFE_INTEGER
      : RECV_TRANSFER_FIXED_OVERHEAD_BYTES +
        chunks * RECV_CHUNK_RECORD_OVERHEAD_BYTES;
  return saturatingAdd(plaintextBytes, records);
}

function markerReservationBytes(marker: RecvReservationLike): number {
  if (marker.reservedBytes !== undefined) {
    if (
      !validBytes(marker.reservedBytes) ||
      marker.reservedBytes < marker.size
    ) {
      return Number.MAX_SAFE_INTEGER;
    }
    return marker.reservedBytes;
  }
  // Upgrade old persisted markers in-memory when their chunk count is known.
  // Generic legacy callers without `total` retain the historical size charge.
  return marker.total === undefined
    ? marker.size
    : attachmentRecvReservationBytes(marker.size, marker.total);
}

/** Bytes promised by persisted receive markers but not stored yet. */
export function remainingRecvReservationBytes(markers: ReadonlyArray<RecvReservationLike | null>): number {
  let total = 0;
  for (const marker of markers) {
    if (!marker) return Number.MAX_SAFE_INTEGER;
    if (!validBytes(marker.size) || !validBytes(marker.receivedBytes) || marker.receivedBytes > marker.size) {
      return Number.MAX_SAFE_INTEGER; // corrupt reservation state fails closed
    }
    const reserved = markerReservationBytes(marker);
    if (!validBytes(reserved) || reserved < marker.receivedBytes) {
      return Number.MAX_SAFE_INTEGER;
    }
    total = saturatingAdd(total, reserved - marker.receivedBytes);
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
    if (marker.automatic && marker.roomId === roomId) {
      total = saturatingAdd(total, markerReservationBytes(marker));
    }
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
    if (message.mine || !file || file.pull) continue;
    if (typeof file.dataB64 === 'string') {
      // Inline legacy/sticker bytes still consume the sealed message record.
      // Reject malformed/unbounded metadata rather than letting it disappear
      // from the automatic receive budget.
      if (
        file.dataB64.length > Number.MAX_SAFE_INTEGER / 3 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(file.dataB64)
      ) return Number.MAX_SAFE_INTEGER;
      total = saturatingAdd(total, Math.floor((file.dataB64.length * 3) / 4));
      continue;
    }
    if (!file.attId || seen.has(file.attId)) continue;
    // A referenced attachment without trustworthy size metadata must not turn
    // the cap into a fail-open policy for legacy/corrupt records.
    if (!validBytes(file.size)) return Number.MAX_SAFE_INTEGER;
    const charged =
      file.storageBytes === undefined ? file.size : file.storageBytes;
    if (!validBytes(charged) || charged < file.size) {
      return Number.MAX_SAFE_INTEGER;
    }
    seen.add(file.attId);
    total = saturatingAdd(total, charged);
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
