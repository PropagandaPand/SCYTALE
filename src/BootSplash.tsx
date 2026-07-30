import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cold-start splash: shows the branded scytale-rod clip once over the dark app background, then fades
 * to reveal whatever booted underneath (normally the lock screen).
 *
 * It is an ANIMATED WEBP rendered as an <img> (~110 KB, dark background baked in, cropped to the logo).
 * An animated image plays on its own like a GIF — there is NO media autoplay policy to satisfy, so it
 * animates reliably on every browser and even in iOS Low Power Mode (a muted <video> does NOT: iOS
 * refuses gesture-less playback there, which left a native play button / an instant skip).
 *
 * The splash only OVERLAYS; it never gates the security boot: it self-dismisses after the clip has
 * played through once, on a tap, and on any image load error; prefers-reduced-motion shows the static
 * poster and skips sooner. `onDone` MUST be stable (memoise it in the parent).
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
    // Dismiss once the ~2.4 s clip has played through (reduced motion: hold the static poster briefly).
    const t = window.setTimeout(finish, reduce ? 700 : 2600);
    return () => window.clearTimeout(t);
  }, [finish, reduce]);

  return (
    <div
      className={`boot-splash${leaving ? ' boot-splash-leaving' : ''}`}
      onPointerDown={finish}
      role="img"
      aria-label="SKYTALE"
    >
      <img
        className="boot-splash-anim"
        src={reduce ? '/bootSplash-poster.png' : '/bootSplash.webp'}
        alt=""
        onError={finish}
      />
    </div>
  );
}
