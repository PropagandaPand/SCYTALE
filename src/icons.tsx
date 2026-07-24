/** Inline SVG glyphs (currentColor), copied from the redesign prototype. */

export function IconLock({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 17) / 15} viewBox="0 0 15 17" aria-hidden="true">
      <rect x="1" y="7" width="13" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 7V4.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconShield({ size = 13, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" aria-hidden="true">
      {filled && (
        <path
          d="M7.5 1 2 3.4v3.3c0 3.3 2.3 6.3 5.5 7.3 3.2-1 5.5-4 5.5-7.3V3.4L7.5 1Z"
          fill="currentColor"
          opacity=".16"
        />
      )}
      <path
        d="M7.5 1 2 3.4v3.3c0 3.3 2.3 6.3 5.5 7.3 3.2-1 5.5-4 5.5-7.3V3.4L7.5 1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="m5.2 7.4 1.7 1.7 3-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBack({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 19) / 11} viewBox="0 0 11 19" aria-hidden="true">
      <path d="M9.5 1 1.5 9.5l8 8.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 9 16 2.5 11 16l-2.5-5L2 9Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDoubleCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 9) / 13} viewBox="0 0 15 9" aria-hidden="true">
      <path d="m1 5 2.5 2.5L8 2M6.5 5 9 7.5 14 1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCamera({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 18" aria-hidden="true">
      <path
        d="M6.5 3 5.3 5H2.5A1.5 1.5 0 0 0 1 6.5v8A1.5 1.5 0 0 0 2.5 16h15a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 5h-2.8L13.5 3h-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconAttach({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M14.5 6.5 8.2 12.8a1.9 1.9 0 0 0 2.7 2.7l6.3-6.3a3.6 3.6 0 0 0-5.1-5.1l-6.5 6.5a5.3 5.3 0 0 0 7.5 7.5l5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMic({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor" />
      <path d="M4.5 9a5.5 5.5 0 0 0 11 0M10 14.5V18M7 18h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlay({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 3v10l9-5-9-5Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconTrash({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 5h12M7 5V3.5h4V5M4.5 5l.7 9.5A1 1 0 0 0 6.2 15.5h5.6a1 1 0 0 0 1-1L13.5 5M7.5 8v4.5M10.5 8v4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDots({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="3.5" r="1.5" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="9" cy="14.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconGroup({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 18" aria-hidden="true">
      <circle cx="7" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 16c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3.5a3 3 0 0 1 0 5.6M15 11c2.4.3 4 2.2 4 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconInfo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v4.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Sticker: a rounded square with a peeled corner — the conventional glyph. */
export function IconSticker({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M12.2 2.8H5.6A2.8 2.8 0 0 0 2.8 5.6v8.8a2.8 2.8 0 0 0 2.8 2.8h4.3l6.3-6.3V5.6a2.8 2.8 0 0 0-2.8-2.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 17.2v-4a2.3 2.3 0 0 1 2.3-2.3h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBell({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6.5a4 4 0 0 1 8 0c0 3 1 4 1.5 4.5H2.5C3 10.5 4 9.5 4 6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconDevices({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="3" width="9" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10.5" y="6" width="4" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 12.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconArchive({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3" width="12" height="3" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 6v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 8.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevron({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconEye({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconEyeOff({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.3 3.4A6.9 6.9 0 0 1 8 3.5c4.4 0 7 4.5 7 4.5a12.6 12.6 0 0 1-2.4 2.9M9.8 9.8A2 2 0 0 1 6.2 6.2M1 8s1.3-2.3 3.5-3.6M2 2l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconReply({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M7 4 3 8l4 4M3 8h7a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconForward({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M11 4l4 4-4 4M15 8H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCopy({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <rect x="6" y="6" width="9" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconKey({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="6" cy="6" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8.4 8.4 6 6M12.6 12.6l1.4-1.4M14.4 14.4l1.2-1.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconServer({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <rect x="2.5" y="3" width="13" height="5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="10" width="13" height="5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.4" cy="5.5" r="0.9" fill="currentColor" />
      <circle cx="5.4" cy="12.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconGraduation({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 3 1.5 6.3 9 9.6l7.5-3.3L9 3Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4.5 8v3.4c0 1 2 2.1 4.5 2.1s4.5-1.1 4.5-2.1V8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
