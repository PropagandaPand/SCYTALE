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
export function ViewOnceViewer({ blob, mime, onClose }: { blob: Blob; mime: string; onClose: () => void }) {
  const isVideo = mime.startsWith('video/');
  const [url, setUrl] = useState('');
  const [held, setHeld] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null); // hidden decode source (never shown → not saveable)
  const videoRef = useRef<HTMLVideoElement>(null); // the video element (view-once video)
  const dispRef = useRef<HTMLCanvasElement>(null); // the VISIBLE image, drawn on a canvas
  const canvasRef = useRef<HTMLCanvasElement>(null); // the disintegration overlay
  const doneRef = useRef(false);

  // Draw the photo onto a canvas rather than an <img>: a canvas offers no "Save Image"
  // long-press menu, so a view-once photo can't be trivially saved to the camera roll.
  function drawDisplay() {
    const img = imgRef.current;
    const c = dispRef.current;
    if (!img || !c || !img.naturalWidth) return;
    const cap = 1600;
    const s = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
  }

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
    const src: HTMLImageElement | HTMLVideoElement | null = isVideo ? videoRef.current : imgRef.current;
    const canvas = canvasRef.current;
    try {
      const w = src ? ('naturalWidth' in src ? src.naturalWidth : src.videoWidth) : 0;
      if (!src || !canvas || !w) return finish();
      runDisintegrate(src, canvas, finish);
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
      {isVideo ? (
        // View-once VIDEO: plays once, then disintegrates. (A web app can't fully block
        // saving a <video> the way it can a canvas image — best-effort attrs + the note.)
        <div className="vo-stage" onContextMenu={(e) => e.preventDefault()}>
          {url && (
            <video
              ref={videoRef}
              className="vo-img"
              src={url}
              autoPlay
              playsInline
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noremoteplayback"
              onEnded={beginDestroy}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>
      ) : (
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
          <canvas ref={dispRef} className="vo-img" />
          {url && (
            <img ref={imgRef} src={url} alt="" draggable={false} crossOrigin="anonymous" style={{ display: 'none' }} onLoad={drawDisplay} />
          )}
          {!held && !destroying && (
            <div className="vo-cover">
              <IconBomb size={34} />
              <div className="vo-cover-title">{t('Zum Ansehen gedrückt halten')}</div>
              <div className="vo-cover-sub">{t('Das Foto ist bereits gelöscht — dies ist deine einzige Ansicht.')}</div>
            </div>
          )}
        </div>
      )}
      {/* The disintegration canvas — full-screen, above the stage while destroying. */}
      <canvas ref={canvasRef} className="vo-destroy-canvas" aria-hidden="true" />
      {!destroying && (
        <div className="vo-note">{t('Hinweis: Screenshots kann eine Web-App technisch nicht verhindern.')}</div>
      )}
    </div>
  );
}

/**
 * Cinematic burn: an organic noise front eats the photo away (destination-out through a
 * moving threshold mask), the burning edge glows orange, and glowing ash rises off it
 * with additive light. No chunky tiles. Runs ~1.5 s, then calls onDone.
 */
function runDisintegrate(img: HTMLImageElement | HTMLVideoElement, canvas: HTMLCanvasElement, onDone: () => void) {
  const nw = 'naturalWidth' in img ? img.naturalWidth : img.videoWidth;
  const nh = 'naturalHeight' in img ? img.naturalHeight : img.videoHeight;
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
  const fit = Math.min(vw / nw, vh / nh);
  const iw = nw * fit;
  const ih = nh * fit;
  const ox = (vw - iw) / 2;
  const oy = (vh - ih) / 2;

  // Sample the image's actual colours (same-origin blob → not tainted) for the ash.
  const nat = document.createElement('canvas');
  nat.width = nw;
  nat.height = nh;
  const nctx = nat.getContext('2d');
  let pix: Uint8ClampedArray | null = null;
  if (nctx) {
    nctx.drawImage(img, 0, 0);
    try {
      pix = nctx.getImageData(0, 0, nat.width, nat.height).data;
    } catch {
      pix = null;
    }
  }

  // Low-res burn field: a smoothed noise blended with a diagonal sweep (bottom-left →
  // top-right), so the front is directional but wavy, not a straight wipe.
  const mw = Math.max(48, Math.min(150, Math.round(iw / 4)));
  const mh = Math.max(1, Math.round((mw * ih) / iw));
  const rnd = new Float32Array(mw * mh);
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  const noise = new Float32Array(mw * mh); // 2 box-blur passes → coherent blobs
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? rnd : noise;
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        let s = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= mw || yy >= mh) continue;
            s += src[yy * mw + xx];
            n++;
          }
        noise[y * mw + x] = s / n;
      }
    }
  }
  const thr = new Float32Array(mw * mh);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const dir = (x / (mw - 1)) * 0.5 + ((mh - 1 - y) / (mh - 1)) * 0.5;
      thr[y * mw + x] = Math.max(0, Math.min(1, dir * 0.62 + noise[y * mw + x] * 0.55 - 0.08));
    }
  }

  // Ash particles, each igniting when the front reaches it.
  type E = { x: number; y: number; ig: number; life: number; drift: number; vx: number; r: number; g: number; b: number };
  const embers: E[] = [];
  const step = Math.max(5, Math.min(60, Math.round(nat.width / 34)));
  for (let ny = 0; ny < nat.height; ny += step) {
    for (let nx = 0; nx < nat.width; nx += step) {
      let r = 255;
      let g = 210;
      let b = 150;
      if (pix) {
        const o = (ny * nat.width + nx) * 4;
        if (pix[o + 3] < 24) continue;
        r = pix[o];
        g = pix[o + 1];
        b = pix[o + 2];
      }
      const mmx = Math.min(mw - 1, Math.floor((nx / nat.width) * mw));
      const mmy = Math.min(mh - 1, Math.floor((ny / nat.height) * mh));
      embers.push({
        x: ox + (nx / nat.width) * iw,
        y: oy + (ny / nat.height) * ih,
        ig: thr[mmy * mw + mmx],
        life: 0.42 + Math.random() * 0.5,
        drift: Math.random() * 6.283,
        vx: (Math.random() - 0.5) * 46,
        r,
        g,
        b,
      });
    }
  }

  // Two tiny reusable buffers: an erase mask + a glowing burn-edge.
  const eraseC = document.createElement('canvas');
  eraseC.width = mw;
  eraseC.height = mh;
  const eraseCtx = eraseC.getContext('2d')!;
  const eraseImg = eraseCtx.createImageData(mw, mh);
  const glowC = document.createElement('canvas');
  glowC.width = mw;
  glowC.height = mh;
  const glowCtx = glowC.getContext('2d')!;
  const glowImg = glowCtx.createImageData(mw, mh);

  const DUR = 1500;
  const BAND = 0.1; // width of the glowing burn front
  const start = performance.now();
  function frame(now: number) {
    const raw = (now - start) / DUR;
    if (raw >= 1.28) return onDone();
    const e = Math.min(1, raw);
    const p = (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2) * 1.08; // ease-in-out, slight overshoot

    ctx!.clearRect(0, 0, vw, vh);

    // Build the erase mask + the hot edge in one low-res pass.
    const ed = eraseImg.data;
    const gd = glowImg.data;
    for (let i = 0; i < thr.length; i++) {
      const tv = thr[i];
      const o = i * 4;
      ed[o] = 0;
      ed[o + 1] = 0;
      ed[o + 2] = 0;
      ed[o + 3] = tv < p ? 255 : 0; // burned → erase
      const edge = 1 - Math.min(1, Math.abs(tv - p) / BAND);
      const on = tv < p + BAND * 0.5 ? edge : 0;
      gd[o] = 255;
      gd[o + 1] = 150;
      gd[o + 2] = 40;
      gd[o + 3] = Math.round(on * 230);
    }
    eraseCtx.putImageData(eraseImg, 0, 0);
    glowCtx.putImageData(glowImg, 0, 0);

    // 1. the intact photo
    ctx!.globalCompositeOperation = 'source-over';
    ctx!.globalAlpha = 1;
    ctx!.drawImage(img, ox, oy, iw, ih);
    // 2. glowing burn edge over it
    ctx!.imageSmoothingEnabled = true;
    ctx!.globalCompositeOperation = 'lighter';
    ctx!.drawImage(glowC, ox, oy, iw, ih);
    // 3. erase everything already burned
    ctx!.globalCompositeOperation = 'destination-out';
    ctx!.drawImage(eraseC, ox, oy, iw, ih);
    // 4. rising ash, additive
    ctx!.globalCompositeOperation = 'lighter';
    for (const em of embers) {
      const local = p - em.ig;
      if (local <= 0) continue;
      const l = local / em.life;
      if (l >= 1) continue;
      const x = em.x + Math.sin(em.drift + l * 6) * 13 + em.vx * l;
      const y = em.y - (70 + 150 * l) * l; // accelerating rise
      const a = (1 - l) * 0.85;
      const sz = 1.7 * (1 - 0.35 * l);
      ctx!.globalAlpha = a;
      ctx!.fillStyle = `rgb(${Math.min(255, (em.r >> 1) + 150)},${Math.min(255, (em.g * 0.45) | 0) + 90},${(em.b * 0.28) | 0})`;
      ctx!.fillRect(x - sz, y - sz, sz * 2, sz * 2);
    }

    ctx!.globalAlpha = 1;
    ctx!.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
