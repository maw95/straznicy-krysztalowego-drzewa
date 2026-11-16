import { useId } from 'react';

/**
 * Single-colour difficulty icons drawn as SVG: they take the colour of the text (`currentColor`) and stay sharp at
 * any size. The animal says how hard the computer plays: rabbit (easy), wolf (normal), bear (hard), dragon (very hard).
 */
export type LevelIconKind = 'rabbit' | 'wolf' | 'bear' | 'dragon';

/** The shapes: `body` is the silhouette, `cut` is cut out of it (eyes, nose, inner ears), `extra` is drawn on top. */
const SHAPES: Record<LevelIconKind, { body: JSX.Element; cut: JSX.Element; extra?: JSX.Element }> = {
  rabbit: {
    body: (
      <>
        <ellipse cx="23" cy="17" rx="6.5" ry="16" transform="rotate(-8 23 17)" />
        <ellipse cx="41" cy="17" rx="6.5" ry="16" transform="rotate(8 41 17)" />
        <ellipse cx="32" cy="42" rx="17" ry="15" />
      </>
    ),
    cut: (
      <>
        <ellipse cx="23.4" cy="17" rx="2.4" ry="11" transform="rotate(-8 23.4 17)" />
        <ellipse cx="40.6" cy="17" rx="2.4" ry="11" transform="rotate(8 40.6 17)" />
        <circle cx="25" cy="40" r="2.6" />
        <circle cx="39" cy="40" r="2.6" />
        <path d="M29 47h6l-3 3.4z" />
      </>
    ),
  },
  wolf: {
    body: <path d="M9 6l16 11h14L55 6l-1 25-9 13-9 13h-8l-9-13-9-13z" />,
    cut: (
      <>
        <path d="M17 29l10 3.4-8 3z" />
        <path d="M47 29l-10 3.4 8 3z" />
        <path d="M28.5 52h7L32 57z" />
      </>
    ),
  },
  bear: {
    body: (
      <>
        <circle cx="13" cy="15" r="8.5" />
        <circle cx="51" cy="15" r="8.5" />
        <ellipse cx="32" cy="35" rx="23" ry="21" />
      </>
    ),
    cut: (
      <>
        <circle cx="13" cy="15" r="3.8" />
        <circle cx="51" cy="15" r="3.8" />
        <circle cx="23" cy="32" r="2.6" />
        <circle cx="41" cy="32" r="2.6" />
        <path d="M17.5 25.5l10 3.2M46.5 25.5l-10 3.2" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="32" cy="43" rx="4.6" ry="3.2" />
        <path d="M32 46v5M23 51q9 6 18 0" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
    extra: (
      <>
        <path d="M25.5 53.5l4-.6-2.4 8z" />
        <path d="M38.5 53.5l-4-.6 2.4 8z" />
      </>
    ),
  },
  dragon: {
    body: (
      <>
        {/* swept-back horns */}
        <path d="M22 24C10 22 3 14 4 2c6 6 13 9 21 10z" />
        <path d="M42 24c12-2 19-10 18-22-6 6-13 9-21 10z" />
        {/* head with spiked cheek frills */}
        <path d="M20 14h24l4 10 11 3-8 5 7 7-10 1 3 8-10 0-5 15h-8l-5-15-10 0 3-8-10-1 7-7-8-5 11-3z" />
      </>
    ),
    cut: (
      <>
        <path d="M17 30l12 3-9.4 4.6z" />
        <path d="M47 30l-12 3 9.4 4.6z" />
        <path d="M28 20l4 6 4-6z" />
        <ellipse cx="28" cy="50" rx="1.8" ry="2.8" />
        <ellipse cx="36" cy="50" rx="1.8" ry="2.8" />
        <path d="M24 56h16" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
};

/** Difficulty icon: one colour, the size is set by the `size` prop (px) or by CSS on the element. */
export function LevelIcon({ kind, size = 36 }: { kind: LevelIconKind; size?: number | string }) {
  const id = `lvl-${kind}-${useId().replace(/:/g, '')}`;
  const shape = SHAPES[kind];
  return (
    <svg className="level-icon" viewBox="0 0 64 64" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="#fff" />
        <g fill="#000">{shape.cut}</g>
      </mask>
      <g mask={`url(#${id}-cut)`}>{shape.body}</g>
      {shape.extra}
    </svg>
  );
}
