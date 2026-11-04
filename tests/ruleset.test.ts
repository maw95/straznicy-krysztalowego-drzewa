import { describe, expect, it } from 'vitest';
import { arenaCell, battleAttack, battleItem, battleMove, dealDamage, reachableCells, unitAt } from '../src/engine/battle';
import { createGame } from '../src/engine/game';
import { distance, parseKey } from '../src/engine/hex';
import { DEFAULT_RULES, isDigital } from '../src/engine/types';
import { battleFixture, setup } from './helpers/engine';

describe('ruleset', () => {
  it('is classic unless the digital ruleset is switched on', () => {
    expect(isDigital(DEFAULT_RULES)).toBe(false);
    expect(isDigital({ ruleset: 'classic' })).toBe(false);
    expect(isDigital({ ruleset: 'digital' })).toBe(true);
  });

  it('is carried into the game state', () => {
    expect(isDigital(createGame(setup()).rules)).toBe(false);
    expect(isDigital(createGame(setup({}, { ruleset: 'digital' })).rules)).toBe(true);
  });

  it('does not change the generated game while no digital rule exists yet', () => {
    const classic = createGame(setup());
    const digital = createGame(setup({}, { ruleset: 'digital' }));
    expect({ ...digital, rules: classic.rules, setup: classic.setup }).toEqual(classic);
  });
});

describe('digital ruleset: corpses', () => {
  const fallLayout = [
    { id: 'goldDragon', side: 'dawn' as const, col: 5, half: 9 },
    { id: 'nymph', side: 'dawn' as const, col: 4, half: 8 },
    { id: 'blackDragon', side: 'horde' as const, col: 7, half: 9 },
  ];
  const kill = (ruleset?: 'digital') => {
    const s = battleFixture(createGame(setup({}, ruleset ? { ruleset } : {})), fallLayout);
    dealDamage(s, s.battle!.units.nymph, 99, 'test');
    return s;
  };
  const elixir = (s: ReturnType<typeof kill>) => {
    s.items.e1 = { id: 'e1', kind: 'resurrection', owner: 'dawn', foundBy: null };
    s.factions.dawn.inventory.push('e1');
  };

  it('classic: the fallen unit leaves no body', () => {
    const u = kill().battle!.units.nymph;
    expect(u.alive).toBe(false);
    expect(u.pos).toBeNull();
    expect(u.corpse).toBeUndefined();
  });

  it('digital: the body lies on the cell where the unit fell, and the cell stays free', () => {
    const s = kill('digital');
    const u = s.battle!.units.nymph;
    expect(u.pos).toBeNull();
    expect(u.corpse).toBe(arenaCell(4, 8));
    expect(unitAt(s.battle!, arenaCell(4, 8))).toBeUndefined();
  });

  it('digital: a unit can walk across a corpse', () => {
    const s = kill('digital');
    expect(reachableCells(s, s.battle!.units.goldDragon).has(arenaCell(4, 8))).toBe(true);
    expect(s.battle!.units.nymph.alive).toBe(false);
  });

  it('digital: Resurrection stands the unit up on its corpse cell', () => {
    const s = kill('digital');
    elixir(s);
    battleItem(s, { itemId: 'e1', targetId: 'nymph' });
    const u = s.battle!.units.nymph;
    expect([u.alive, u.pos, u.corpse, u.hp]).toEqual([true, arenaCell(4, 8), undefined, u.maxHp]);
  });

  it('digital: Resurrection uses the nearest free cell when someone stands on the corpse', () => {
    const s = kill('digital');
    elixir(s);
    s.battle!.units.goldDragon.pos = arenaCell(4, 8);
    battleItem(s, { itemId: 'e1', targetId: 'nymph' });
    const u = s.battle!.units.nymph;
    expect(u.alive).toBe(true);
    expect(u.pos).not.toBe(arenaCell(4, 8));
    expect(distance(parseKey(u.pos!), parseKey(arenaCell(4, 8)))).toBe(1);
  });
});

describe('digital ruleset: moving ends the turn unless an attack follows', () => {
  const play = (ruleset: 'digital' | undefined, mover: string, enemyCol: number) => {
    const s = battleFixture(createGame(setup({}, ruleset ? { ruleset } : {})), [
      { id: mover, side: 'dawn', col: 3, half: 9 },
      { id: 'werewolfLord', side: 'horde', col: enemyCol, half: 9 },
    ]);
    battleMove(s, arenaCell(4, 8));
    return s.battle!;
  };

  it('a shooter that moves has used its turn (the classic shooter still shoots after moving)', () => {
    expect(play('digital', 'elfDruid', 5).activation?.unitId).not.toBe('elfDruid');
    expect(play(undefined, 'elfDruid', 5).activation?.unitId).toBe('elfDruid');
  });

  it('a melee unit that moves next to nobody has used its turn, one that reaches an enemy may still attack it', () => {
    expect(play('digital', 'nymph', 9).activation?.unitId).not.toBe('nymph');
    expect(play('digital', 'nymph', 5).activation?.unitId).toBe('nymph');
  });

  it('shooters hit harder in the digital ruleset', () => {
    const hit = (ruleset?: 'digital') => {
      const s = battleFixture(createGame(setup({}, ruleset ? { ruleset } : {})), [
        { id: 'elfDruid', side: 'dawn', col: 3, half: 9 },
        { id: 'werewolfLord', side: 'horde', col: 5, half: 9 },
      ]);
      battleAttack(s, 'werewolfLord', false);
      return s.battle!.units.werewolfLord.hp;
    };
    expect(hit(undefined) - hit('digital')).toBe(1);
  });
});
