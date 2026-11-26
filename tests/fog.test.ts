// The fog of war of the digital edition (backlog 90): every faction uncovers the map for itself, the bots plan on what theirs knows, the log keeps to its readers.

import { describe, expect, it } from 'vitest';
import { applyAction, createGame, legalHeroMoves } from '../src/engine/game';
import { FACTION_HEROES, type TeamId } from '../src/engine/data';
import { assignSlots } from '../src/engine/teams';
import { fogOn, fogView, knowsHex, redactHidden } from '../src/engine/hidden';
import { logVisibleTo } from '../src/engine/log';
import { homeOf, treeOf } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';

function table(seed: number, ruleset: 'digital' | 'classic' = 'digital'): SetupOptions {
  const races = ['dawn', 'horde'] as const;
  const slots = assignSlots([...races]);
  return {
    mode: 'pvp',
    mapSize: 'medium',
    battleMode: 'arena',
    seed,
    ...(ruleset === 'digital' ? { mapShape: 'rectangle' as const } : {}),
    seats: races.map((race, i) => ({ name: race, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][0] })),
    rules: { ...DEFAULT_RULES, ruleset, objective: 'crystals', ...(ruleset === 'digital' ? { heroGrowth: true, kingdom: true, economy: true, realm: true } : {}) },
  };
}

const known = (s: GameState, side: TeamId) => Object.keys(s.tiles).filter((k) => knowsHex(s, k, side));

describe('the fog of war', () => {
  it('at the start each faction knows its own base and the Tree, not the base of the other', () => {
    const s = createGame(table(3));
    expect(fogOn(s)).toBe(true);
    const dawn = homeOf(s, 'dawn');
    const horde = homeOf(s, 'horde');
    expect(knowsHex(s, dawn, 'dawn')).toBe(true);
    expect(knowsHex(s, dawn, 'horde')).toBe(false);
    expect(knowsHex(s, horde, 'dawn')).toBe(false);
    expect(knowsHex(s, treeOf(s), 'dawn') && knowsHex(s, treeOf(s), 'horde')).toBe(true);
    // The view of the Horde: the Covenant's base is covered, its heroes are off the board.
    const view = fogView(s, ['horde']);
    expect(view.tiles[dawn].revealed).toBe(false);
    for (const h of Object.values(view.heroes)) if (h.faction === 'dawn') expect(h.entering).toEqual([]);
    expect(s.tiles[dawn].revealed).toBe(true);
    expect(redactHidden(s, ['horde']).tiles[dawn].revealed).toBe(false);
    // Nobody at the screen (a game of bots): the whole uncovered map.
    expect(fogView(s, null)).toBe(s);
  });

  it('the board edition keeps one shared map', () => {
    const s = createGame(table(3, 'classic'));
    expect(fogOn(s)).toBe(false);
    expect(fogView(s, ['horde'])).toBe(s);
    expect(knowsHex(s, homeOf(s, 'dawn'), 'horde')).toBe(true);
  });

  it('a hero uncovers the hexes only for its faction; a hex seen once stays seen', () => {
    let s = createGame(table(5));
    const hero = s.heroes[s.turnOrder[s.turnIndex]];
    const other = hero.faction === 'dawn' ? 'horde' : 'dawn';
    const before = { mine: known(s, hero.faction).length, theirs: known(s, other).length };
    const move = legalHeroMoves(s).find((m) => m.kind === 'move')!;
    s = applyAction(s, { type: 'moveHero', to: move.to });
    expect(known(s, hero.faction).length).toBeGreaterThan(before.mine);
    expect(known(s, other).length).toBe(before.theirs);
  });

  it('whole bot games: every bot move is legal, the bots never step on a hex their faction does not know, nobody sees a hidden enemy', () => {
    for (const seed of [1, 2, 3]) {
      let s = createGame(table(seed));
      for (let i = 0; i < 8000 && s.phase !== 'over'; i++) {
        const a = chooseAction(s)!;
        if (s.phase === 'adventure' && a.type === 'moveHero') {
          const hero = s.heroes[s.turnOrder[s.turnIndex]];
          if (!hero.entering) expect(knowsHex(s, a.to, hero.faction)).toBe(true);
        }
        s = applyAction(s, a);
        if (s.phase === 'adventure' && i % 25 === 0) {
          const view = fogView(s, ['dawn']);
          for (const h of Object.values(view.heroes)) if (h.faction !== 'dawn' && h.alive && !h.entering) expect(knowsHex(s, h.pos, 'dawn')).toBe(true);
        }
      }
      expect(s.phase).toBe('over');
    }
  });

  it('the log: own lines, the battles fought, and what everybody reads', () => {
    let s = createGame(table(2));
    for (let i = 0; i < 4000 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
    const forDawn = s.log.filter((l) => logVisibleTo(l, ['dawn']));
    const forHorde = s.log.filter((l) => logVisibleTo(l, ['horde']));
    expect(forDawn.length).toBeLessThan(s.log.length);
    expect(forHorde.length).toBeLessThan(s.log.length);
    for (const l of s.log) if (l.kind === 'round' || l.kind === 'victory') expect(l.by).toBeUndefined();
    // A battle between the two is in both logs.
    const fought = s.log.filter((l) => l.kind === 'battle' && l.by?.length === 2);
    for (const l of fought) expect(forDawn.includes(l) && forHorde.includes(l)).toBe(true);
    // A spectator (no viewers) reads everything but the private draws.
    expect(s.log.filter((l) => logVisibleTo(l, null)).length).toBe(s.log.filter((l) => !l.privateTo).length);
  });
});
