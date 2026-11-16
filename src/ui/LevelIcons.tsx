import { asset } from './common';

/**
 * Single-colour difficulty icons (PNG silhouettes cut from the author's sheet, `public/assets/ikony/trudnosc/`).
 * They are used as a CSS mask, so they take the colour of the text (`currentColor`) and stay sharp at any size.
 * The animal says how hard the computer plays: rabbit (easy), wolf (normal), bear (hard), dragon (very hard).
 */
export type LevelIconKind = 'rabbit' | 'wolf' | 'bear' | 'dragon';

/** Difficulty icon: one colour, the size is set by the `size` prop (px or CSS length) or by CSS on the element. */
export function LevelIcon({ kind, size = 36 }: { kind: LevelIconKind; size?: number | string }) {
  const url = `url(${asset(`ikony/trudnosc/${kind}.webp`)})`;
  return (
    <span
      className="level-icon"
      aria-hidden="true"
      style={{ width: size, height: size, WebkitMaskImage: url, maskImage: url }}
    />
  );
}
