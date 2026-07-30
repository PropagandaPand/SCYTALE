import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cold-start splash: plays the branded scytale-rod clip once over the dark app background, then fades
 * to reveal whatever booted underneath (normally the lock screen). It is a tiny (~40 KB) muted, inline
 * H.264 clip with the dark background baked in — no animation library, no alpha video, no white matte.
 *
 * The splash only OVERLAYS; it never gates the security boot. It self-dismisses on `ended`, on a tap,
 * on a hard timeout, and on any playback/decode error; prefers-reduced-motion shows the static poster
 * and skips straight through.
 *
 * Autoplay is driven imperatively: React's `muted` attribute does NOT reliably set the muted PROPERTY,
 * and iOS only autoplays a genuinely muted, playsinline video — so we set `video.muted = true` on a
 * ref and call play() ourselves. If autoplay is still blocked (e.g. iOS Low Power Mode), we DON'T
 * leave a native play button sitting there: we just skip straight to the app. `onDone` MUST be stable.
 */
export function BootSplash({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [reduce] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  );

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true); // fade out, then unmount (timeout matches the CSS transition)
    window.setTimeout(onDone, 340);
  }, [onDone]);

  useEffect(() => {
    if (reduce) {
      const t = window.setTimeout(finish, 700); // hold the static poster a beat, then reveal
      return () => window.clearTimeout(t);
    }
    const cap = window.setTimeout(finish, 4500); // never hang on the splash
    const v = videoRef.current;
    if (v) {
      v.muted = true; // the PROPERTY — the JSX attribute alone is unreliable and blocks iOS autoplay
      v.defaultMuted = true;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(finish); // autoplay blocked → skip, never show a play button
    }
    return () => window.clearTimeout(cap);
  }, [finish, reduce]);

  return (
    <div
      className={`boot-splash${leaving ? ' boot-splash-leaving' : ''}`}
      onPointerDown={finish}
      role="img"
      aria-label="SKYTALE"
    >
      {reduce ? (
        <img className="boot-splash-anim" src="/bootSplash-poster.png" alt="" />
      ) : (
        <video
          ref={videoRef}
          className="boot-splash-anim"
          src="/bootSplash.mp4"
          poster="/bootSplash-poster.png"
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onEnded={finish}
          onError={finish}
        />
      )}
    </div>
  );
}
