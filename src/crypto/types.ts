/**
 * ArrayBuffer-backed byte array. WebCrypto (post-TS-5.7 lib.dom) rejects the
 * generic `Uint8Array<ArrayBufferLike>` because it could alias a SharedArrayBuffer,
 * so all crypto-facing byte payloads are pinned to this concrete type.
 */
export type Bytes = Uint8Array<ArrayBuffer>;
