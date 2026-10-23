// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { arenaCell, makeBattleUnit } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
import { DEFAULT_RULES, type BattleState, type GameState } from '../src/engine/types';
import { BattleView } from '../src/ui/BattleView';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
});
afterEach(cleanup);

/** An arena fight with the listed units at [col, half] (even columns use even halves); the first one acts. */
function fight(units: Array<[string, 'dawn' | 'horde', number, number]>, obstacles: Array<[number, number]> = []): GameState {
  const s = createGame({
    mode: 'pvp',
    mapSize: 'short',
    battleMode: 'arena',
    seed: 1,
    rules: { ...DEFAULT_RULES },
    seats: [
      { name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'human', heroId: 'blackDragon' },
    ],
  });
  s.phase = 'battle';
  const all: BattleState['units'] = {};
  for (const [id, side, col, half] of units) {
    const u = makeBattleUnit(id, side);
    u.pos = arenaCell(col, half);
    all[id] = u;
  }
  s.battle = {
    kind: 'heroes', duel: false, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: 'horde', defender: 'dawn', attackerHero: 'blackDragon', attackerFrom: Object.keys(s.tiles)[0], defenderHero: 'goldDragon', neutralId: null,
    stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: obstacles.map(([c, h]) => arenaCell(c, h)), units: all, round: 1, order: units.map((u) => u[0]), index: 0,
    activation: { unitId: units[0][0], moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
    extra: [], winner: null, damageBy: {},
  };
  return s;
}

/** The cursor class on each unit token, by the portrait's unit id. */
function cursors(state: GameState): Record<string, string> {
  const { container } = render(<BattleView state={state} canAct onAction={() => {}} onShowCard={() => {}} footer={null} />);
  const out: Record<string, string> = {};
  for (const token of container.querySelectorAll('button.token')) {
    const id = token.querySelector('img')!.getAttribute('src')!.match(/([A-Za-z]+)\.(png|jpg)$/)![1];
    out[id] = token.className.match(/cur-\w+/)?.[0] ?? '';
  }
  return out;
}

describe('cursors over units in battle', () => {
  it('a ranged unit: an arrow over a clear shot, a crossed-out arrow when an obstacle is in the way', () => {
    const c = cursors(fight([['elfDruid', 'dawn', 4, 4], ['goblinShaman', 'horde', 4, 8], ['caveSpider', 'horde', 8, 4]], [[4, 6]]));
    expect(c.goblinShaman).toBe('cur-blocked');
    expect(c.caveSpider).toBe('cur-ranged');
    expect(c.elfDruid).toBe('');
  });

  it('a ranged unit next to an enemy fights it hand to hand (sword); the others are out of reach, not hidden', () => {
    const c = cursors(fight([['elfDruid', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 6], ['goblinShaman', 'horde', 4, 10]]));
    expect(c.caveSpider).toBe('cur-melee');
    expect(c.goblinShaman).toBe('');
  });

  it('a melee unit: a sword over a neighbouring enemy', () => {
    const c = cursors(fight([['goldDragon', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 6]]));
    expect(c.caveSpider).toBe('cur-melee');
  });
});
