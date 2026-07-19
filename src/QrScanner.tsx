import { useEffect, useRef, useState } from 'react';

/**
 * In-app QR scanner. Opens the rear camera, samples video frames onto a canvas
 * and decodes them with jsQR (lazy-loaded). On a hit it fires `onResult` once
 * and stops the camera. Needs a secure context (https / localhost) and the
 * camera Permissions-Policy (set in worker/index.ts).
 */
export function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let raf = 0;
    const canvas = document.createElement('canvas');

    (async () => {
      try {
        // High resolution matters: our share-link QR is dense (long token), so
        // a low-res frame can't resolve the modules. Fall back to any camera if
        // the rear one isn't available.
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const jsQR = (await import('jsqr')).default;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        const tick = () => {
          if (!active) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
            if (code?.data) {
              active = false;
              onResultRef.current(code.data);
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        const err = e as Error;
        setError(
          err.name === 'NotAllowedError'
            ? 'Kamerazugriff verweigert. Erlaube die Kamera in den Browser-Einstellungen.'
            : err.name === 'NotFoundError'
              ? 'Keine Kamera gefunden.'
              : 'Kamera nicht verfügbar: ' + err.message,
        );
      }
    })();

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="scanner">
      <video ref={videoRef} className="scanner-video" playsInline muted />
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <span className="c tl" />
          <span className="c tr" />
          <span className="c bl" />
          <span className="c br" />
        </div>
        <div className="scanner-hint">{error || 'QR-Code des Kontakts in den Rahmen halten'}</div>
      </div>
      <button className="btn btn-outline scanner-close" onClick={onClose}>
        Abbrechen
      </button>
    </div>
  );
}
