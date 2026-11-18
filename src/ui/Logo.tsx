// The game logo in the language of the game: Polish "Strażnicy Kryształowego Drzewa" or English "Wardens of the Crystal Tree" under GLEAMROOT.
import type { CSSProperties } from 'react';
import { useLang } from '../i18n/lang';
import { asset } from './common';

export function Logo({ style }: { style?: CSSProperties }) {
  const [lang] = useLang();
  return lang === 'en' ? (
    <img className="logo-glow" src={asset('ui/logo_en.png')} alt="Gleamroot: Wardens of the Crystal Tree" style={style} />
  ) : (
    <img className="logo-glow" src={asset('ui/logo.png')} alt="Gleamroot: Strażnicy Kryształowego Drzewa" style={style} />
  );
}
