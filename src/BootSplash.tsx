import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cold-start splash: plays the branded scytale-rod clip once over the dark app background, then fades
 * to reveal whatever booted underneath (normally the lock screen). It is a tiny (~19 KB) muted,
 * inline H.264 clip with the dark background baked in, so it blends seamlessly and autoplays natively
 * on iOS — no animation library, no alpha video, no white matte.
 *
 * The splash only OVERLAYS; it never gates the security boot. It self-dismisses on `ended`, on a tap,
 * on a hard timeout, and on any playback/decode error; prefers-reduced-motion shows the static poster
 * and skips straight through. `onDone` MUST be stable (memoise it in the parent).
 */
export function BootSplash({ onDone }: { onDone: () => void }) {
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
    // Reduced motion: hold the static poster a beat, then reveal. Otherwise a hard cap so a stalled
    // decode can never strand the user behind the splash (the video also self-dismisses on `ended`).
    const t = window.setTimeout(finish, reduce ? 700 : 4500);
    return () => window.clearTimeout(t);
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
          className="boot-splash-anim"
          src="/bootSplash.mp4"
          poster="/bootSplash-poster.png"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={finish}
          onError={finish}
        />
      )}
    </div>
  );
}
