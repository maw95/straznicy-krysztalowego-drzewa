// The difficulty of a fight on the map, in four words (backlog 15.15).
import { describe, expect, it } from 'vitest';
import { fightDifficulty, levelOfFight } from '../src/engine/difficulty';
import { legalHeroMoves } from '../src/engine/game';
import { createGame } from '../src/engine/game';
import { makeBattleUnit } from '../src/engine/battle';
import { withRuleset } from '../src/engine/presets';
import type { BattleState } from '../src/engine/types';
import { playUntil, setup } from './helpers/engine';

/** A finished fight: the Przymierze attacked, `mine` and `theirs` are the Życie left as a share of the maximum. */
function finished(winner: BattleState['winner'], mine: number, theirs: number): BattleState {
  const a = makeBattleUnit('goldDragon', 'dawn');
  const d = makeBattleUnit('werewolfLord', 'horde');
  a.hp = Math.round(a.maxHp * mine);
  d.hp = Math.round(d.maxHp * theirs);
  a.alive = a.hp > 0;
  d.alive = d.hp > 0;
  return { attacker: 'dawn', defender: 'horde', winner, units: { a, d } } as unknown as BattleState;
}

describe('levelOfFight', () => {
  it('a won fight is easy when most of the life is left, else even', () => {
    expect(levelOfFight(finished('dawn', 0.8, 0))).toBe('easy');
    expect(levelOfFight(finished('dawn', 0.2, 0))).toBe('even');
  });

  it('a lost fight: narrow is even, costly is dangerous, hopeless is impossible', () => {
    expect(levelOfFight(finished('horde', 0, 0.2))).toBe('even');
    expect(levelOfFight(finished('horde', 0, 0.5))).toBe('dangerous');
    expect(levelOfFight(finished('horde', 0, 0.9))).toBe('impossible');
  });
});

describe('fightDifficulty', () => {
  it('judges a fight on a copy and leaves the game as it was', () => {
    const start = createGame(withRuleset(setup({ mapSize: 'long', seed: 2 }), true, 'crystals', 'triangle', undefined, true));
    const s = playUntil(start, (x) => x.phase === 'adventure' && legalHeroMoves(x).some((m) => m.kind === 'attackGuardian' || m.kind === 'attackHero'), 4000);
    const move = legalHeroMoves(s).find((m) => m.kind === 'attackGuardian' || m.kind === 'attackHero')!;
    const before = JSON.stringify(s);
    expect(['easy', 'even', 'dangerous', 'impossible']).toContain(fightDifficulty(s, move.to));
    expect(JSON.stringify(s)).toBe(before);
  });

  it('is null where there is nothing to fight', () => {
    const s = createGame(setup());
    expect(fightDifficulty(s, Object.keys(s.tiles)[0])).toBeNull();
  });
});

describe('fightDifficulty without helpers', () => {
  it('a hero with no helpers left is judged no easier than with them', () => {
    const order = ['easy', 'even', 'dangerous', 'impossible'];
    const start = createGame(withRuleset(setup({ mapSize: 'long', seed: 2 }), true, 'crystals', 'triangle', undefined, true));
    const s = playUntil(start, (x) => x.phase === 'adventure' && legalHeroMoves(x).some((m) => m.kind === 'attackGuardian'), 4000);
    const move = legalHeroMoves(s).find((m) => m.kind === 'attackGuardian')!;
    const full = fightDifficulty(s, move.to)!;
    const alone = structuredClone(s);
    for (const f of Object.values(alone.factions)) f.supportsAlive = [];
    const lone = fightDifficulty(alone, move.to);
    expect(lone).not.toBeNull();
    expect(order.indexOf(lone!)).toBeGreaterThanOrEqual(order.indexOf(full));
  });
});
