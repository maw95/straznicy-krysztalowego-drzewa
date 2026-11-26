// Markers of the board game (docs/grafika/ikony/znaczniki.png and single znacznik_*.png, by scripts/assets/markers.py):
// the same tokens the players put on the table, shown on the screen.

import { useLang } from '../i18n/lang';
import { translate } from '../i18n/translate';
import { scaleText, UNITS } from '../engine/data';
import type { AttackRoll, BattleState } from '../engine/types';
import { asset } from './common';
import { useScales } from './statScale';

export type MarkerName = 'ability_used' | 'rooted' | 'slowed' | 'cursed' | 'attack_up' | 'attack_3' | 'speed_up' | 'shield' | 'vitality' | 'damage_empty' | 'free_mark';

export function Marker({ name, size = 22, title }: { name: MarkerName; size?: number; title?: string }) {
  return <img src={asset(`markers/${name}.png`)} alt={title ?? ''} title={title} style={{ width: size, height: size, objectFit: 'contain', flex: 'none', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))' }} />;
}

/** Damage as one empty drop with the number written on it. */
export function DamageDrop({ amount, size = 34 }: { amount: number; size?: number }) {
  // The drop (115 × 160) fills the square's height; its round belly, where the number goes, is
  // centred at 62% of the height and about 0.7 of the size wide.
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none' }} aria-label={`−${amount} Życia`}>
      <Marker name="damage_empty" size={size} />
      <span
        style={{
          position: 'absolute', left: 0, right: 0, top: '63%', transform: 'translateY(-50%)', textAlign: 'center', lineHeight: 1,
          fontSize: size * (amount >= 10 ? 0.38 : 0.5), fontWeight: 700, color: '#F7E9C4', fontStyle: 'normal', fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: amount >= 10 ? '-0.03em' : undefined,
          textShadow: '0 0 2px #2A0705, 0 1px 2px #2A0705, 1px 0 2px #2A0705, -1px 0 2px #2A0705',
        }}
      >
        {amount}
      </span>
    </span>
  );
}

/** The −1 / 0 / +1 die as a small ivory cube with the result on top. */
export function DieFace({ value, size = 30 }: { value: number; size?: number }) {
  const label = value > 0 ? '+1' : value < 0 ? '−1' : '0';
  return (
    <span
      title={`Rzut kością: ${label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        width: size, height: size, borderRadius: size * 0.22, verticalAlign: 'middle',
        background: 'linear-gradient(145deg, #FFF8E6, #DCCAA2)',
        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.18), 0 0 0 2px #1E1204, 0 3px 6px rgba(0,0,0,0.6)',
        color: value > 0 ? '#2E7D32' : value < 0 ? '#A2241A' : '#4A3A22',
        fontWeight: 900, fontSize: size * 0.5, lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

/** One line about the latest attack: who hit whom, the attack, the die and the damage that landed. */
export function LastAttack({ roll, units, size = 22 }: { roll: AttackRoll; units: BattleState['units']; size?: number }) {
  const name = (id: string) => UNITS[units[id].defId].name;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span>{name(roll.attackerId)} → {name(roll.targetId)}:</span>
      <span><StatIcon stat="A" /> {roll.attack}</span>
      {roll.die !== null && (
        <>
          <span>+ kość</span>
          <DieFace value={roll.die} size={size} />
        </>
      )}
      <span>=</span>
      <DamageDrop amount={roll.damage} size={size + 6} />
    </span>
  );
}

const STAT_ICONS = { Ż: 'hp', A: 'attack', S: 'speed' } as const;
const STAT_NAMES = { Ż: 'Życie', A: 'Atak', S: 'Szybkość' } as const;
type StatLetter = keyof typeof STAT_ICONS;

/**
 * A stat symbol (heart, swords, bolt), sized to the surrounding text and drawn in its colour: the picture is only the shape (a mask), filled with `currentColor`,
 * so it is dark in dark text and light in light text. (`light` is kept for old callers; the colour of the text decides now.)
 */
export function StatIcon({ stat, size = '1.05em' }: { stat: StatLetter; size?: string | number; light?: boolean }) {
  const url = `url(${asset(`cards/stats/${STAT_ICONS[stat]}.png`)})`;
  return (
    <span
      role="img"
      aria-label={STAT_NAMES[stat]}
      title={STAT_NAMES[stat]}
      style={{ display: 'inline-block', width: size, height: size, verticalAlign: '-0.18em', margin: '0 0.06em', backgroundColor: 'currentColor', WebkitMask: `${url} center / contain no-repeat`, mask: `${url} center / contain no-repeat` }}
    />
  );
}

/** Gold and resources as the icons the bottom bar uses; keyed by the word as the text (Polish or English) says it. */
const THING_ICON: Array<[RegExp, string, string]> = [
  [/^(zł|złot\w*|gold)$/i, 'ikony/mapa/zloto.webp', 'Złoto'],
  [/^(drewn\w*|wood)$/i, 'ikony/mapa/drewno.webp', 'Drewno'],
  [/^(rud\w*|ore)$/i, 'ikony/mapa/ruda.webp', 'Ruda'],
  [/^(gwiezdn\w* pył\w*|pył\w*|star dust|dust)$/i, 'ikony/mapa/pyl.webp', 'Gwiezdny Pył'],
];

/** A gold or resource symbol, sized to the surrounding text (the same pictures as `CostIcons` and the bottom bar). */
export function ThingIcon({ word, size = '1.2em' }: { word: string; size?: string | number }) {
  const t = THING_ICON.find(([re]) => re.test(word));
  if (!t) return <>{word}</>;
  return <img src={asset(t[1])} alt={t[2]} title={t[2]} style={{ width: size, height: size, objectFit: 'contain', verticalAlign: '-0.28em', margin: '0 0.06em' }} />;
}

/**
 * Text with "+1 A", "−2 S", "Ż 9", "3 zł", "2× drewno", "+1 złota"… written with the stat, gold and resource symbols
 * instead of the words or letters (the pieces of a sentence stay text).
 */
export function StatText({ text: plain, rule = false }: { text: string; /** A rule text of the board game's numbers: shown as the game being played reads it (`statScale`). */ rule?: boolean }) {
  const [k, hpK] = useScales();
  const scaled = rule ? scaleText(plain, k, hpK) : plain;
  // English: the whole text is translated first (the pieces between the symbols are no sentences), and its HP / ATK / SPD become the symbols too.
  const [lang] = useLang();
  const text = lang === 'en' ? translate(scaled) ?? scaled : scaled;
  // "+1 A" (number, symbol) or "Ż 9" (symbol, number); each pair stays on one line.
  // "3 zł", "2× drewno", "1 Pył", "+1 gold": a number, an optional ×, a gold or resource word.
  const re = /([+−-]?\d+) ?(Ż|A|S|HP|ATK|SPD)(?=[\s.,;:)/]|$)|(?<![\p{L}\d])(Ż|A|S|HP|ATK|SPD) (\d+)|(?<![\p{L}\d])([+−-]?\d+) ?[×x]? ?(Gwiezdn\p{L}* [Pp]ył\p{L}*|Star Dust|zł|złot[ao]|drewn\p{L}*|rud(?:a|y|ę|ą|zie|ami)?|[Pp]ył\p{L}*|gold|wood|ore|Dust)(?![\p{L}\d])/gu;
  const letter = (t: string): StatLetter => ({ HP: 'Ż', ATK: 'A', SPD: 'S' } as Record<string, StatLetter>)[t] ?? (t as StatLetter);
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index));
    out.push(
      <span key={m.index} style={{ whiteSpace: 'nowrap' }}>
        {m[1] ? <>{m[1]}<StatIcon stat={letter(m[2])} /></> : m[3] ? <><StatIcon stat={letter(m[3])} /> {m[4]}</> : <>{m[5]}<ThingIcon word={m[6]} /></>}
      </span>,
    );
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  // One inline box, so flex containers (card descriptions) do not split it into columns.
  return <span>{out}</span>;
}

/** A rule text of the board game's numbers as the game being played reads it, with the stat, gold and resource icons. */
export function RuleText({ text }: { text: string }) {
  return <StatText rule text={text} />;
}
