import { useEffect, useRef, useState } from 'react';
import { IconPlay, IconPause } from './icons';

const BARS = 34;
// Fallback shape when the browser can't decode this codec for analysis.
const DEFAULT_PEAKS = Array.from({ length: BARS }, (_, i) => 0.35 + 0.4 * Math.abs(Math.sin(i * 1.7)));

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

function computePeaks(buffer: AudioBuffer, n: number): number[] {
  const ch = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(ch.length / n));
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const start = i * block;
    for (let j = 0; j < block; j++) {
      const v = ch[start + j] || 0;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / block);
    peaks.push(rms);
    if (rms > max) max = rms;
  }
  return peaks.map((p) => (max > 0 ? p / max : 0));
}

function fmtDur(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
}

/** Voice/audio message player with a seekable WhatsApp-style RMS waveform. Takes a
 *  Blob so it works from either attachment store format (the caller resolves it). */
export function AudioPlayer({ blob, mime }: { blob: Blob; mime: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [url, setUrl] = useState('');
  const [peaks, setPeaks] = useState<number[]>(DEFAULT_PEAKS);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const objUrl = URL.createObjectURL(blob);
    setUrl(objUrl);
    let cancelled = false;
    void (async () => {
      try {
        const buf = await getCtx().decodeAudioData(await blob.arrayBuffer());
        if (!cancelled) {
          setPeaks(computePeaks(buf, BARS));
          setDur(buf.duration);
        }
      } catch {
        /* codec not decodable here — keep fallback peaks + <audio> duration */
      }
    })();
    return () => {
      cancelled = true;
      URL.revokeObjectURL(objUrl);
    };
  }, [blob, mime]);

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

  function seekAt(clientX: number) {
    const el = waveRef.current;
    const a = ref.current;
    if (!el || !a || !dur) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * dur;
    setCur(ratio * dur);
  }

  const played = dur > 0 ? cur / dur : 0;

  return (
    <div className="audio">
      <button className="audio-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Abspielen'}>
        {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
      </button>
      <div
        className="wave"
        ref={waveRef}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekAt(e.clientX);
        }}
        onPointerMove={(e) => draggingRef.current && seekAt(e.clientX)}
        onPointerUp={() => (draggingRef.current = false)}
      >
        {peaks.map((p, i) => (
          <span
            key={i}
            className={`wbar ${(i + 0.5) / peaks.length <= played ? 'on' : ''}`}
            style={{ height: `${Math.max(12, p * 100)}%` }}
          />
        ))}
      </div>
      <span className="audio-dur">{fmtDur(cur > 0 || playing ? cur : dur)}</span>
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (!dur && isFinite(e.currentTarget.duration)) setDur(e.currentTarget.duration);
        }}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCur(0);
        }}
      />
    </div>
  );
}
