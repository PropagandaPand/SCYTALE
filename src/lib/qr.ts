/**
 * QR-code generation for the contact deep-link. Lazy-loaded so the qrcode
 * library isn't part of the initial app shell. Output is a data: URL (allowed
 * by our CSP's `img-src 'self' data:`).
 *
 * We only ever GENERATE codes — the recipient scans with their phone's native
 * camera, which opens the deep-link. So SCYTALE needs no camera permission.
 */
export async function makeQr(text: string): Promise<string> {
  const { toDataURL } = await import('qrcode');
  return toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512, // crisp enough to blow up full-screen for easy scanning
    color: { dark: '#0b0d10', light: '#ffffff' },
  });
}
