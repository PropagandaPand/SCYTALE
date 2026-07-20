import { useEffect, useRef, useState } from 'react';

/**
 * Circular avatar cropper. The crop window is a fixed square (previewed as a
 * circle); the user pans the photo by dragging and zooms via the slider / wheel
 * / pinch. On confirm we draw the selected square to a 256×256 canvas → JPEG,
 * which also strips EXIF/GPS metadata. Orientation is baked via createImageBitmap
 * so display and crop always agree.
 */
const AVATAR = { out: 256, maxBytes: 48 * 1024, mime: 'image/jpeg' as const };
// Stickers are square, larger, and go out as WebP so transparency survives —
// a sticker on a JPEG background would carry a white box into every chat.
const STICKER = { out: 320, maxBytes: 64 * 1024, mime: 'image/webp' as const };

export function CropModal({
  file,
  shape = 'circle',
  onCancel,
  onDone,
}: {
  file: File;
  /** 'circle' = avatar (JPEG, EXIF stripped); 'square' = sticker (WebP, alpha kept). */
  shape?: 'circle' | 'square';
  onCancel: () => void;
  onDone: (bytes: Uint8Array, mime: string) => void;
}) {
  const spec = shape === 'square' ? STICKER : AVATAR;
  const OUT = spec.out;
  const MAX_BYTES = spec.maxBytes;
  const [url, setUrl] = useState('');
  const bmpRef = useRef<ImageBitmap | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [d, setD] = useState(0); // square viewport side (px)
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let dead = false;
    let objUrl = '';
    (async () => {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        if (dead) {
          bmp.close?.();
          return;
        }
        bmpRef.current = bmp;
        objUrl = URL.createObjectURL(file);
        setUrl(objUrl);
        setNat({ w: bmp.width, h: bmp.height });
      } catch {
        setErr('Bild konnte nicht geladen werden.');
      }
    })();
    return () => {
      dead = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
      bmpRef.current?.close?.();
    };
  }, [file]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setD(el.clientWidth);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [url]);

  const base = nat && d ? d / Math.min(nat.w, nat.h) : 1;
  const dispW = nat ? nat.w * base * zoom : 0;
  const dispH = nat ? nat.h * base * zoom : 0;

  // Center the image once we know both the image and the viewport size.
  useEffect(() => {
    if (!nat || !d) return;
    setZoom(1);
    setTx((d - nat.w * (d / Math.min(nat.w, nat.h))) / 2);
    setTy((d - nat.h * (d / Math.min(nat.w, nat.h))) / 2);
  }, [nat, d]);

  function clamp(nx: number, ny: number, w: number, h: number): [number, number] {
    return [Math.min(0, Math.max(d - w, nx)), Math.min(0, Math.max(d - h, ny))];
  }

  function applyZoom(z: number) {
    if (!nat) return;
    const nz = Math.min(5, Math.max(1, z));
    const oldW = nat.w * base * zoom;
    const oldH = nat.h * base * zoom;
    const newW = nat.w * base * nz;
    const newH = nat.h * base * nz;
    const cx = (d / 2 - tx) / oldW;
    const cy = (d / 2 - ty) / oldH;
    const [nx, ny] = clamp(d / 2 - cx * newW, d / 2 - cy * newH, newW, newH);
    setZoom(nz);
    setTx(nx);
    setTy(ny);
  }

  function onDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
    } else {
      drag.current = { x: e.clientX, y: e.clientY, tx, ty };
    }
  }
  function onMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(pinch.current.zoom * (dist / pinch.current.dist));
      return;
    }
    if (!drag.current) return;
    const [nx, ny] = clamp(drag.current.tx + (e.clientX - drag.current.x), drag.current.ty + (e.clientY - drag.current.y), dispW, dispH);
    setTx(nx);
    setTy(ny);
  }
  function onUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  async function confirm() {
    const bmp = bmpRef.current;
    if (!bmp || !nat || busy) return;
    setBusy(true);
    try {
      const scale = base * zoom;
      const sSize = d / scale;
      const sx = -tx / scale;
      const sy = -ty / scale;
      const canvas = document.createElement('canvas');
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bmp, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
      let blob: Blob | null = null;
      let mime: string = spec.mime;
      for (const q of [0.85, 0.7, 0.55, 0.4]) {
        blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, spec.mime, q));
        if (blob && blob.size <= MAX_BYTES) break;
      }
      // Safari only learned WebP encoding in 14; on anything older toBlob falls
      // back to PNG silently. Read the type back instead of assuming it, or the
      // receiver gets a data URL whose declared mime doesn't match the bytes.
      if (blob && blob.type) mime = blob.type;
      if (!blob) throw new Error('Kodierung fehlgeschlagen.');
      onDone(new Uint8Array(await blob.arrayBuffer()), mime);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-label={shape === 'square' ? 'Sticker zuschneiden' : 'Profilbild zuschneiden'}>
      <div className="crop-head">{shape === 'square' ? 'Sticker-Ausschnitt wählen' : 'Ausschnitt wählen'}</div>
      <div
        className="crop-stage"
        ref={stageRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92))}
      >
        {url && (
          <img
            src={url}
            alt=""
            className="crop-img"
            draggable={false}
            style={{ width: dispW, height: dispH, transform: `translate(${tx}px, ${ty}px)` }}
          />
        )}
        <div className={shape === 'square' ? 'crop-ring square' : 'crop-ring'} />
      </div>
      <input
        className="crop-zoom"
        type="range"
        min={1}
        max={5}
        step={0.01}
        value={zoom}
        onChange={(e) => applyZoom(parseFloat(e.target.value))}
        aria-label="Zoom"
      />
      {err && <div className="err-note">{err}</div>}
      <div className="crop-actions">
        <button className="btn btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button className="btn btn-primary" disabled={busy || !nat} onClick={() => void confirm()}>
          Übernehmen
        </button>
      </div>
    </div>
  );
}
