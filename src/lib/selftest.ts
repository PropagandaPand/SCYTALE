/**
 * Runtime crypto self-test — an AES-256-GCM round-trip run at startup. If the
 * platform's WebCrypto is broken or tampered with, we find out before trusting
 * it with the user's data.
 */
export async function cryptoSelfTest(): Promise<boolean> {
  try {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('scytale-selftest');
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const back = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
    return new TextDecoder().decode(back) === 'scytale-selftest';
  } catch {
    return false;
  }
}
