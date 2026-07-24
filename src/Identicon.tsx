/**
 * Deterministic mirrored identicon derived from a seed (the contact's room id).
 * Ported verbatim from the redesign prototype — same hash + PRNG, so a contact
 * always gets the same avatar.
 */
import type { ReactElement } from 'react';

function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: string): () => number {
  let a = fnv(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Identicon({ seed }: { seed: string }) {
  const r = mulberry('idn-' + seed);
  // Colour comes from a SEPARATE hash stream ('hue-' + seed) so the pattern bits
  // (mulberry above) are untouched — existing contacts keep their exact shape and
  // only gain a deterministic per-seed colour. Fixed S/L keeps every avatar
  // legible on both the light and dark neutral tile; only the hue varies.
  const hue = fnv('hue-' + seed) % 360;
  const fill = `hsl(${hue} 58% 52%)`;
  const rects: ReactElement[] = [];
  const N = 5;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < 3; x++) {
      if (r() > 0.5) {
        rects.push(<rect key={`${x}-${y}`} x={x * 20} y={y * 20} width={20} height={20} fill={fill} />);
        if (x < 2) {
          rects.push(<rect key={`m${x}-${y}`} x={(4 - x) * 20} y={y * 20} width={20} height={20} fill={fill} />);
        }
      }
    }
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true">
      {rects}
    </svg>
  );
}
