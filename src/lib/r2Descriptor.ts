import { BLOB_CHUNK, ctChunkLen } from '../crypto/blob';
import { b64ToBytes, bytesToB64 } from './bytes';

export const MAX_R2_PLAINTEXT_BYTES = 1024 * 1024 * 1024;
const R2_KEY = /^[a-f0-9]{32}$/;
const FILE_KEY_B64 = /^[A-Za-z0-9+/]{43}=$/;
const UPLOAD_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export interface R2Ref {
  key: string; // 32-char R2 object capability
  keyB64: string; // canonical base64 of the 32-byte per-file key
  size: number; // plaintext byte length
  chunk: number; // protocol-fixed plaintext chunk size
}

export interface ValidatedR2Ref extends R2Ref {
  keyBytes: Uint8Array<ArrayBuffer>;
  totalChunks: number;
  ciphertextBytes: number;
}

export interface R2UploadSession {
  key: string;
  uploadId: string;
  token: string;
}

export class InvalidR2DescriptorError extends Error {
  constructor(public readonly code: string) {
    super('Ungültiger Dateideskriptor.');
    this.name = 'InvalidR2DescriptorError';
  }
}

/** Exact ciphertext size for the protocol-fixed chunk layout. */
export function r2CiphertextLength(size: number): number {
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_R2_PLAINTEXT_BYTES) {
    throw new InvalidR2DescriptorError('size');
  }
  const fullChunks = Math.floor(size / BLOB_CHUNK);
  const tail = size % BLOB_CHUNK;
  const total = fullChunks * ctChunkLen(BLOB_CHUNK) + (tail ? ctChunkLen(tail) : 0);
  if (!Number.isSafeInteger(total)) throw new InvalidR2DescriptorError('ciphertext-size');
  return total;
}

export function validateR2Descriptor(
  ref: R2Ref,
  maxSize = MAX_R2_PLAINTEXT_BYTES,
): ValidatedR2Ref {
  if (!Number.isSafeInteger(maxSize) || maxSize < 1 || maxSize > MAX_R2_PLAINTEXT_BYTES) {
    throw new InvalidR2DescriptorError('max-size');
  }
  if (!R2_KEY.test(ref.key)) throw new InvalidR2DescriptorError('key');
  if (!Number.isSafeInteger(ref.size) || ref.size < 1 || ref.size > maxSize) {
    throw new InvalidR2DescriptorError('size');
  }
  if (ref.chunk !== BLOB_CHUNK) throw new InvalidR2DescriptorError('chunk');

  let keyBytes: Uint8Array<ArrayBuffer>;
  if (!FILE_KEY_B64.test(ref.keyB64)) throw new InvalidR2DescriptorError('key-material');
  try {
    keyBytes = b64ToBytes(ref.keyB64);
  } catch {
    throw new InvalidR2DescriptorError('key-material');
  }
  // Canonical encoding prevents alternate textual forms from becoming distinct
  // descriptors for the same key and also rejects whitespace/forgiving decoders.
  if (keyBytes.length !== 32 || bytesToB64(keyBytes) !== ref.keyB64) {
    throw new InvalidR2DescriptorError('key-material');
  }

  return {
    ...ref,
    keyBytes,
    totalChunks: Math.ceil(ref.size / BLOB_CHUNK),
    ciphertextBytes: r2CiphertextLength(ref.size),
  };
}

export function tryValidateR2Descriptor(
  ref: R2Ref,
  maxSize = MAX_R2_PLAINTEXT_BYTES,
): ValidatedR2Ref | null {
  try {
    return validateR2Descriptor(ref, maxSize);
  } catch {
    return null;
  }
}

/** The Worker always emits Content-Length for R2 GETs; absence is a protocol error. */
export function assertExactR2ContentLength(value: string | null, expected: number): void {
  if (!Number.isSafeInteger(expected) || expected < 1 || value === null || !/^[1-9]\d*$/.test(value)) {
    throw new InvalidR2DescriptorError('content-length');
  }
  const actual = Number(value);
  if (!Number.isSafeInteger(actual) || actual !== expected) {
    throw new InvalidR2DescriptorError('content-length');
  }
}

/** Validate the capability tuple returned by POST /api/blob/create. */
export function validateR2UploadSession(value: unknown): R2UploadSession {
  if (!value || typeof value !== 'object') throw new InvalidR2DescriptorError('upload-session');
  const { key, uploadId, token } = value as Record<string, unknown>;
  if (
    typeof key !== 'string' ||
    !R2_KEY.test(key) ||
    typeof uploadId !== 'string' ||
    uploadId.length < 1 ||
    uploadId.length > 512 ||
    !/^[\x21-\x7e]+$/.test(uploadId) ||
    typeof token !== 'string' ||
    !UPLOAD_TOKEN.test(token)
  ) {
    throw new InvalidR2DescriptorError('upload-session');
  }
  return { key, uploadId, token };
}
