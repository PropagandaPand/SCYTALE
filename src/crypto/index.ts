export * from './argon2';
export * from './vault';

/**
 * ArrayBuffer-backed byte array. WebCrypto (post-TS-5.7 lib.dom) rejects the
 * generic `Uint8Array<ArrayBufferLike>` because it could alias a SharedArrayBuffer,
 * so all crypto-facing byte payloads are pinned to this concrete type.
 */
export type Bytes = Uint8Array<ArrayBuffer>;

const enc = new TextEncoder();
const dec = new TextDecoder();

export const utf8 = {
  encode: (s: string): Bytes => enc.encode(s),
  decode: (b: Bytes): string => dec.decode(b),
};
