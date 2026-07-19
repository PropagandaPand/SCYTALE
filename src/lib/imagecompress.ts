/**
 * Downscale + re-encode an image to fit an inline size budget, so it can travel
 * through the E2E message pipeline. JPEG (universally encodable in canvas), max
 * 1600px on the long edge, quality stepped down until it fits.
 *
 * Re-encoding through a canvas also **strips all metadata (EXIF/GPS/timestamps)**
 * — the output blob carries only pixels. We bake the EXIF orientation into those
 * pixels first (`imageOrientation: 'from-image'`) so stripping it doesn't rotate
 * the photo.
 */
export interface Compressed {
  data: Uint8Array;
  mime: string;
}

const MAX_DIM = 1600;

export async function compressImage(file: File, maxBytes: number): Promise<Compressed> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const toBlob = (q: number) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));

  let last: Blob | null = null;
  for (const q of [0.85, 0.7, 0.55, 0.42, 0.3]) {
    last = await toBlob(q);
    if (last && last.size <= maxBytes) break;
  }
  if (!last) throw new Error('Bild konnte nicht kodiert werden.');
  return { data: new Uint8Array(await last.arrayBuffer()), mime: 'image/jpeg' };
}
