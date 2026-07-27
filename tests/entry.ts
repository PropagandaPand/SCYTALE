/**
 * Bundle entry for the Node test suites.
 *
 * The app code is browser-oriented (IndexedDB, Web Crypto, React), but the
 * crypto and conversation layers are deliberately transport- and
 * storage-agnostic, so they run under Node once bundled. `tests/run.mjs` bundles
 * this file with esbuild and each suite imports the result.
 *
 * Everything security-relevant that a suite needs must be re-exported here.
 */
export * from '../src/crypto/index';
export * from '../src/crypto/sodium';
export * from '../src/lib/session';
export {
  findSignedPreKey,
  findOneTimePreKey,
  consumeOneTimePreKey,
  currentBundle,
  ownSpkPublic,
} from '../src/lib/prekeys';
export {
  startLinkOnN,
  offerReceivedOnN,
  beginLinkOnP,
  confirmLinkSession,
  completeLinkOnN,
  completeLinkOnP,
  abortLink,
} from '../src/lib/linkflow';
export { aggregateDelivery, hasMessage } from '../src/lib/messages';
export { derivePrfKek } from '../src/lib/biometric';
export { isGroupMember, decideInvite } from '../src/lib/groups';
export { encSection, decSection, backupMetaAad, backupAttAad } from '../src/lib/backupSections';
export { importBackup, validateBackupManifest } from '../src/lib/backup';
export { encryptBlob, decryptBlob, BLOB_CHUNK } from '../src/crypto/blob';
export { backgroundLockExpired } from '../src/lib/backgroundLock';
export { consumeExactByteStream, ExactStreamLengthError } from '../src/lib/exactStream';
export {
  MAX_AUDIO_ANALYSIS_BYTES,
  MAX_INLINE_IMAGE_BYTES,
  mayAnalyzeAudio,
  mayRenderInlineImage,
} from '../src/lib/mediaPolicy';
export {
  MAX_R2_PLAINTEXT_BYTES,
  InvalidR2DescriptorError,
  assertExactR2ContentLength,
  r2CiphertextLength,
  tryValidateR2Descriptor,
  validateR2Descriptor,
  validateR2UploadSession,
} from '../src/lib/r2Descriptor';
export {
  PRECACHE_PREFIX,
  isScytalePrecache,
  populateBuildPrecache,
  versionedPrecacheName,
} from '../src/lib/swPrecache';
export {
  AUTO_RECEIVE_CONTACT_CAP_BYTES,
  MIN_ORIGIN_HEADROOM_BYTES,
  MIN_ORIGIN_HEADROOM_FRACTION,
  automaticRecvReservationBytes,
  hasOriginStorageHeadroom,
  mayAutoReceiveAttachment,
  remainingRecvReservationBytes,
  storedReceivedAttachmentBytes,
} from '../src/lib/storageQuota';
