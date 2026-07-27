/**
 * Best-effort video transcode to 720p (H.264 video + AAC audio in MP4) via WebCodecs, so
 * messenger videos stay small — longer clips, far less storage — without needing high
 * resolution. Uses mediabunny (WebCodecs demux/decode/scale/encode/mux under the hood),
 * imported LAZILY so its weight is only paid the first time a video is actually sent.
 *
 * Returns the transcoded Blob, or `null` on ANY reason to skip — no WebCodecs (old
 * browser), can't encode H.264, the video is already ≤720p, an unsupported input codec, or
 * any error. The caller then sends the ORIGINAL file untouched. Never throws.
 */
export async function transcodeVideoTo720p(file: File, onProgress?: (frac: number) => void): Promise<Blob | null> {
  try {
    // WebCodecs required; absent on old Safari/Firefox → caller sends the original.
    if (!('VideoEncoder' in globalThis) || !('VideoDecoder' in globalThis)) return null;

    const mb = await import('mediabunny');
    if (!(await mb.canEncodeVideo('avc', { width: 1280, height: 720 }))) return null;

    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    try {
      const vtrack = await input.getPrimaryVideoTrack();
      if (!vtrack) return null;
      // Never upscale, and don't waste time on something already small enough.
      const h = vtrack.displayHeight || vtrack.codedHeight;
      if (!h || h <= 720) return null;

      const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() });
      const conversion = await mb.Conversion.init({
        input,
        output,
        // height 720, width auto (keeps aspect). H.264 + AAC → plays on iOS and everywhere.
        video: { height: 720, codec: 'avc', bitrate: mb.QUALITY_MEDIUM },
        audio: { codec: 'aac', bitrate: mb.QUALITY_MEDIUM },
      });
      if (!conversion.isValid) return null;
      if (onProgress) conversion.onProgress = (p) => onProgress(p);
      await conversion.execute();

      const buf = output.target.buffer;
      if (!buf || buf.byteLength === 0) return null;
      // If "optimising" didn't actually shrink it, keep the original.
      if (buf.byteLength >= file.size) return null;
      return new Blob([buf], { type: 'video/mp4' });
    } finally {
      await input.dispose();
    }
  } catch {
    return null; // any failure → caller falls back to the original file
  }
}
