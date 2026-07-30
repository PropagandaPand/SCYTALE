import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';

/**
 * Cold-start splash: plays the branded Lottie once over the dark app background, then fades to reveal
 * whatever booted underneath (normally the lock screen). Everything is lazy-loaded — the ~1 MB
 * animation and the light Lottie player live in their own chunk — so first paint and the security
 * boot are never blocked; the splash only overlays, it never gates unlocking. The LIGHT player has no
 * expression engine, so it runs under our strict CSP (no 'unsafe-eval'). Tap anywhere to skip, and
 * prefers-reduced-motion skips straight through. A hard timeout guarantees it can never strand the
 * user behind a blank screen if the chunk is slow or the renderer fails.
 *
 * `onDone` MUST be stable (memoise it in the parent) — the play effect depends on it.
 */
export function BootSplash({ onDone }: { onDone: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true); // fade out, then unmount (timeout matches the CSS transition)
    window.setTimeout(onDone, 340);
  }, [onDone]);

  useEffect(() => {
    let anim: AnimationItem | null = null;
    let alive = true;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      finish();
      return;
    }

    const cap = window.setTimeout(finish, 4500); // never hang on the splash
    void (async () => {
      try {
        const [{ default: lottie }, mod] = await Promise.all([
          import('lottie-web/build/player/lottie_light'),
          import('./assets/bootSplash.json'),
        ]);
        if (!alive || !hostRef.current) return;
        anim = lottie.loadAnimation({
          container: hostRef.current,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          animationData: (mod as { default: unknown }).default ?? mod,
        });
        anim.addEventListener('complete', finish);
      } catch {
        finish(); // any load/render error must not leave the user staring at a blank splash
      }
    })();

    return () => {
      alive = false;
      window.clearTimeout(cap);
      anim?.destroy();
    };
  }, [finish]);

  return (
    <div
      className={`boot-splash${leaving ? ' boot-splash-leaving' : ''}`}
      onPointerDown={finish}
      role="img"
      aria-label="SKYTALE"
    >
      <div ref={hostRef} className="boot-splash-anim" />
    </div>
  );
}
