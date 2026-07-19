/** Sync base64 <-> bytes for attachment payloads (data: URLs, persistence). */
export function bytesToB64(b: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < b.length; i += chunk) {
    s += String.fromCharCode(...b.subarray(i, i + chunk));
  }
  return btoa(s);
}

export function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
