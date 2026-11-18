// The two "pills" shown where a fight is announced (hover note, right-click details, confirmation): who is there and how hard the fight is.

import type { CSSProperties } from 'react';
import { fightDifficulty, FIGHT_LEVEL_NAMES, type FightLevel } from '../engine/difficulty';
import { activeHero } from '../engine/game';
import type { HexKey } from '../engine/hex';
import type { GameState } from '../engine/types';

/** The judged difficulty of the fights already worked out (a fight is played through by the bots, a few ms: once per game state, hero and hex). */
const FIGHT_LEVELS = new Map<string, FightLevel | null>();
export function fightLevelAt(state: GameState, k: HexKey): FightLevel | null {
  const hero = activeHero(state);
  if (!hero) return null;
  const key = `${state.setup.seed}|${state.actionCount}|${hero.id}|${k}`;
  if (!FIGHT_LEVELS.has(key)) {
    if (FIGHT_LEVELS.size > 200) FIGHT_LEVELS.clear();
    FIGHT_LEVELS.set(key, fightDifficulty(state, k));
  }
  return FIGHT_LEVELS.get(key) ?? null;
}

const LEVEL_COLORS: Record<FightLevel, { bg: string; border: string; text: string }> = {
  easy: { bg: '#2F7D3A', border: '#8FD69A', text: '#fff' },
  even: { bg: '#E0B018', border: '#FFE58A', text: '#2A2000' },
  dangerous: { bg: '#B52A22', border: '#F29A90', text: '#fff' },
  impossible: { bg: '#141414', border: '#8A8A8A', text: '#fff' },
};

const PILL: CSSProperties = {
  display: 'inline-block',
  padding: '1px 9px',
  borderRadius: 999,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  lineHeight: 1.35,
  border: '2px solid',
  boxShadow: '0 1px 2px rgba(0,0,0,0.45)',
};

const LEVEL_TEXT: Record<FightLevel, string> = { easy: 'Łatwa walka', even: 'Wyrównana walka', dangerous: 'Groźna walka', impossible: 'Niemożliwa walka' };

/** Who the hero would meet (red). */
export function EnemyPill({ name, size = 13 }: { name: string; size?: number }) {
  return <span data-pill="enemy" style={{ ...PILL, fontSize: size, background: '#8E1F1F', borderColor: '#E07A6A', color: '#fff' }}>{name}</span>;
}

/** How the fight would go: green easy, yellow even, red dangerous, black impossible. */
export function FightPill({ level, size = 13 }: { level: FightLevel; size?: number }) {
  const c = LEVEL_COLORS[level];
  return <span data-pill="fight" data-level={level} title={`Trudność walki: ${FIGHT_LEVEL_NAMES[level]}`} style={{ ...PILL, fontSize: size, background: c.bg, borderColor: c.border, color: c.text }}>{LEVEL_TEXT[level]}</span>;
}
