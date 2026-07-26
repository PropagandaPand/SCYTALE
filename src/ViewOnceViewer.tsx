import { useEffect, useRef, useState } from 'react';
import { t } from './lib/i18n';
import { IconBomb } from './icons';

/**
 * Full-screen viewer for a view-once photo. By the time this mounts the stored bytes
 * are ALREADY securely wiped (see openViewOnce) — the `blob` here is the only remaining
 * copy, held in memory and dropped when the viewer closes. This is the single viewing.
 *
 * Hold-to-view: the image is only revealed while a pointer is held down, which makes a
 * one-handed screenshot awkward. Backgrounding closes it so nothing lingers in an
 * app-switcher snapshot. We are honest in the footer: a web app cannot actually block
 * screenshots — only a native app can.
 *
 * On close, the image DISINTEGRATES — a canvas particle burn that dramatises the message
 * destroying itself for good (the bytes are already gone; this is the send-off).
 */
export function ViewOnceViewer({ blob, onClose }: { blob: Blob; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [held, setHeld] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onClose();
  }

  // Play the disintegration on the canvas, then close. Falls back to an immediate close
  // if anything about the canvas/animation isn't available.
  function beginDestroy() {
    if (destroying) return;
    setDestroying(true);
    const img = imgRef.current;
    const canvas = canvasRef.current;
    try {
      if (!img || !canvas || !img.complete || !img.naturalWidth) return finish();
      runDisintegrate(img, canvas, finish);
    } catch {
      finish();
    }
  }

  // Backgrounding closes immediately (can't animate a hidden tab; nothing may linger).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') finish();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`vo-viewer${destroying ? ' destroying' : ''}`} role="dialog" aria-label={t('Einmal-Foto')}>
      {!destroying && (
        <button className="vo-close" onClick={beginDestroy} aria-label={t('Schließen')}>
          ×
        </button>
      )}
      <div
        className={`vo-stage${held ? ' held' : ''}`}
        onPointerDown={(e) => {
          if (destroying) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setHeld(true);
        }}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {url && <img ref={imgRef} className="vo-img" src={url} alt="" draggable={false} crossOrigin="anonymous" />}
        {!held && !destroying && (
          <div className="vo-cover">
            <IconBomb size={34} />
            <div className="vo-cover-title">{t('Zum Ansehen gedrückt halten')}</div>
            <div className="vo-cover-sub">{t('Das Foto ist bereits gelöscht — dies ist deine einzige Ansicht.')}</div>
          </div>
        )}
      </div>
      {/* The disintegration canvas — full-screen, above the stage while destroying. */}
      <canvas ref={canvasRef} className="vo-destroy-canvas" aria-hidden="true" />
      {!destroying && (
        <div className="vo-note">{t('Hinweis: Screenshots kann eine Web-App technisch nicht verhindern.')}</div>
      )}
    </div>
  );
}

/**
 * Slice the displayed image into a grid of tiles and blow them apart as glowing embers:
 * each tile rises, drifts, spins, scales down and fades. Runs ~1.1 s, then calls onDone.
 */
function runDisintegrate(img: HTMLImageElement, canvas: HTMLCanvasElement, onDone: () => void) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return onDone();
  ctx.scale(dpr, dpr);

  // "contain" fit of the image inside the viewport.
  const fit = Math.min(vw / img.naturalWidth, vh / img.naturalHeight);
  const iw = img.naturalWidth * fit;
  const ih = img.naturalHeight * fit;
  const ox = (vw - iw) / 2;
  const oy = (vh - ih) / 2;

  const cols = Math.max(10, Math.min(26, Math.round(iw / 26)));
  const tw = iw / cols;
  const rows = Math.max(1, Math.round(ih / tw));
  const th = ih / rows;
  const sTileW = img.naturalWidth / cols;
  const sTileH = img.naturalHeight / rows;

  type P = { sx: number; sy: number; x: number; y: number; vx: number; vy: number; rot: number; vr: number; delay: number };
  const parts: P[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      parts.push({
        sx: c * sTileW,
        sy: r * sTileH,
        x: ox + c * tw,
        y: oy + r * th,
        vx: (Math.random() - 0.5) * 220,
        vy: -70 - Math.random() * 220, // rise like embers
        rot: 0,
        vr: (Math.random() - 0.5) * 6,
        delay: (c / cols) * 160 + Math.random() * 130, // sweep left → right
      });
    }
  }

  const DUR = 1150;
  const start = performance.now();
  function frame(now: number) {
    const time = now - start;
    ctx!.clearRect(0, 0, vw, vh);
    let alive = false;
    for (const p of parts) {
      const pt = time - p.delay;
      if (pt <= 0) {
        // Not launched yet — still part of the intact image.
        ctx!.globalAlpha = 1;
        ctx!.drawImage(img, p.sx, p.sy, sTileW, sTileH, p.x, p.y, tw + 0.6, th + 0.6);
        alive = true;
        continue;
      }
      const s = pt / 1000;
      const a = 1 - pt / (DUR * 0.72);
      if (a <= 0) continue;
      alive = true;
      const px = p.x + p.vx * s;
      const py = p.y + p.vy * s + 160 * s * s; // gravity pulls the rise back down
      const sc = Math.max(0.1, 1 - 0.55 * s);
      ctx!.globalAlpha = Math.max(0, a);
      ctx!.save();
      ctx!.translate(px + tw / 2, py + th / 2);
      ctx!.rotate(p.rot + p.vr * s);
      ctx!.drawImage(img, p.sx, p.sy, sTileW, sTileH, (-tw / 2) * sc, (-th / 2) * sc, tw * sc + 0.6, th * sc + 0.6);
      ctx!.restore();
    }
    if (alive && time < DUR + 250) requestAnimationFrame(frame);
    else onDone();
  }
  requestAnimationFrame(frame);
}
