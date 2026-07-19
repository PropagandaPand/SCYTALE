import { useRef, useState } from 'react';
import { IconPlay, IconPause } from './icons';

function fmtDur(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Compact inline player for voice/audio messages. */
export function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  // MediaRecorder blobs (webm/opus) report duration Infinity until seeked.
  function onMeta() {
    const a = ref.current;
    if (!a) return;
    if (a.duration === Infinity || Number.isNaN(a.duration)) {
      a.currentTime = 1e101;
      const fix = () => {
        a.removeEventListener('timeupdate', fix);
        a.currentTime = 0;
        setDur(a.duration);
      };
      a.addEventListener('timeupdate', fix);
    } else {
      setDur(a.duration);
    }
  }

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;

  return (
    <div className="audio">
      <button className="audio-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Abspielen'}>
        {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
      </button>
      <div className="audio-bar">
        <div className="audio-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="audio-dur">{fmtDur(cur > 0 || playing ? cur : dur)}</span>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCur(0);
        }}
      />
    </div>
  );
}
