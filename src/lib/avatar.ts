/**
 * Turn a picked image into a small square avatar: center-crop, 256×256, JPEG.
 * The canvas re-encode also strips EXIF/GPS metadata (orientation baked first).
 */
const AVATAR_SIZE = 256;
const AVATAR_MAX_BYTES = 48 * 1024;

export async function makeAvatar(file: File): Promise<Uint8Array> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const s = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - s) / 2;
  const sy = (bmp.height - s) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, sx, sy, s, s, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bmp.close?.();

  const toBlob = (q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));
  let last: Blob | null = null;
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    last = await toBlob(q);
    if (last && last.size <= AVATAR_MAX_BYTES) break;
  }
  if (!last) throw new Error('Avatar konnte nicht kodiert werden.');
  return new Uint8Array(await last.arrayBuffer());
}
