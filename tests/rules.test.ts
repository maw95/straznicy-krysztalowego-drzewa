// Rules agreed with the designer in docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md (section "Zasady obowiązujące").
import { describe, expect, it } from 'vitest';
import { TERRAIN_COST, TILE_POOLS, UNITS } from '../src/engine/data';
import { applyAction, createGame } from '../src/engine/game';
import { abilityActive, arenaCell, arenaObstacles, makeBattleUnit } from '../src/engine/battle';
import { mapNeighbors, sideOf } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import { DEFAULT_RULES, type BattleState, type GameState, type SetupOptions } from '../src/engine/types';

const setup = (over: Partial<SetupOptions> = {}, rules: Partial<SetupOptions['rules']> = {}): SetupOptions => ({
  mode: 'coop',
  mapSize: 'short',
  battleMode: 'arena',
  seed: 7,
  seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }],
  ...over,
  rules: { ...DEFAULT_RULES, useDice: false, ...rules },
});

/** A guardian battle with the given guardian alone against the listed Przymierze units, guardian to act. */
function guardianFight(guardian: string, foes: Array<[string, number, number]>, rules: Partial<SetupOptions['rules']> = {}): GameState {
  const s = createGame(setup({}, rules));
  s.phase = 'battle';
  const g = makeBattleUnit(guardian, 'neutral');
  g.pos = arenaCell(4, 8);
  const units: BattleState['units'] = { [guardian]: g };
  for (const [id, col, half] of foes) {
    const u = makeBattleUnit(id, 'dawn');
    u.pos = arenaCell(col, half);
    units[id] = u;
  }
  s.battle = {
    kind: 'neutral', duel: false, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: 'dawn', defender: 'neutral', attackerHero: foes[0][0], attackerFrom: Object.keys(s.tiles)[0], defenderHero: null, neutralId: guardian,
    stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: [], units, round: 1, order: [guardian, ...foes.map((f) => f[0])], index: 0,
    activation: { unitId: guardian, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
    extra: [], winner: null, damageBy: {},
  };
  return s;
}

describe('default game and simplifications', () => {
  it('starts as the full game: abilities, treasures, die, no hero replacement', () => {
    expect(DEFAULT_RULES).toMatchObject({ abilities: true, treasures: true, useDice: true, heroReplacement: false });
  });

  it('puts no treasures on the map when treasures are off', () => {
    const s = createGame(setup({ mapSize: 'medium' }, { treasures: false }));
    expect(Object.keys(s.items)).toHaveLength(0);
    expect(Object.values(s.tiles).some((t) => t.terrain === 'treasureDawn' || t.terrain === 'treasureHorde')).toBe(false);
  });

  it('switches guardian abilities off together with everyone else', () => {
    const s = guardianFight('hydra', [['goldDragon', 5, 9], ['nymph', 4, 10]], { abilities: false });
    expect(abilityActive(s, s.battle!.units.hydra)).toBe(false);
    expect(() => applyAction(s, { type: 'battleAttack', targetId: 'goldDragon', secondTargetId: 'nymph' })).toThrow();
  });
});

describe('map halves and terrain', () => {
  it('splits the map by a fixed border into halves of (almost) equal size', () => {
    for (const rows of [6, 8, 11]) {
      const count = { dawn: 0, horde: 0 };
      for (let row = 1; row < rows; row++) for (let col = 0; col <= row; col++) count[sideOf(row, col)]++;
      expect(Math.abs(count.dawn - count.horde)).toBeLessThanOrEqual(1);
    }
    const a = createGame(setup({ seed: 3, mapSize: 'long' }));
    const b = createGame(setup({ seed: 4, mapSize: 'long' }));
    for (const k of Object.keys(a.tiles)) if (!a.tiles[k].home) expect(a.tiles[k].side).toBe(b.tiles[k].side);
  });

  it('has 5 ordinary types and 2 obstacles per side, 2 difficult types for good and 3 for evil', () => {
    for (const [side, hard] of [['dawn', 2], ['horde', 3]] as const) {
      const pool = TILE_POOLS[side];
      expect(pool.filter((t) => TERRAIN_COST[t] === null)).toHaveLength(2);
      expect(pool.filter((t) => TERRAIN_COST[t] !== null)).toHaveLength(5);
      expect(pool.filter((t) => TERRAIN_COST[t] === 2)).toHaveLength(hard);
    }
  });
});

describe('guardian abilities without a once-per-battle limit', () => {
  it('Cyklop shoots and pushes the target 1 hex away after every attack', () => {
    expect(UNITS.cyclops.attackType).toBe('ranged');
    let s = guardianFight('cyclops', [['goldDragon', 8, 12], ['nymph', 0, 4]]);
    s = applyAction(s, { type: 'battleAttack', targetId: 'goldDragon' });
    expect(s.battle!.units.goldDragon.pos).toBe(arenaCell(9, 13));
    // Next round: it pushes again.
    s.battle!.activation = { unitId: 'cyclops', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
    s = applyAction(s, { type: 'battleAttack', targetId: 'goldDragon' });
    expect(s.battle!.units.goldDragon.pos).toBe(arenaCell(10, 14));
    // Against the arena edge nothing moves.
    s.battle!.activation = { unitId: 'cyclops', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
    s = applyAction(s, { type: 'battleAttack', targetId: 'goldDragon' });
    expect(s.battle!.units.goldDragon.pos ?? arenaCell(10, 14)).toBe(arenaCell(10, 14));
  });

  it('Gryf may fly off after every attack', () => {
    let s = guardianFight('griffin', [['ancientBear', 5, 9], ['nymph', 0, 4]]);
    for (let i = 0; i < 2; i++) {
      s.battle!.activation = { unitId: 'griffin', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
      s.battle!.units.griffin.pos = arenaCell(4, 8);
      s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
      expect(s.battle!.activation?.hop).toBe(4);
      s = applyAction(s, { type: 'battleHop', to: arenaCell(2, 8) });
      expect(s.battle!.units.griffin.pos).toBe(arenaCell(2, 8));
    }
  });

  it('Hydra may hit two adjacent enemies with every attack', () => {
    let s = guardianFight('hydra', [['ancientBear', 5, 9], ['nymph', 4, 10], ['elfDruid', 0, 4]]);
    for (let i = 0; i < 2; i++) {
      s.battle!.activation = { unitId: 'hydra', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
      s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear', secondTargetId: 'nymph' });
    }
    expect(s.battle!.units.ancientBear.hp).toBe(UNITS.ancientBear.hp - 4);
    expect(s.battle!.units.nymph.hp).toBe(UNITS.nymph.hp - 4);
  });
});

describe('heroes falling', () => {
  function killAll(s: GameState, faction: 'dawn' | 'horde'): GameState {
    for (const h of Object.values(s.heroes)) if (h.faction === faction) h.alive = false;
    return s;
  }

  it('ends the game for Przymierze when the Horde has no living hero, and no elixir drinks itself', () => {
    for (const loser of ['horde', 'dawn'] as const) {
      let s = createGame(setup({ mode: 'pvp', seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' }] }));
      s.items.x = { id: 'x', kind: 'resurrection', owner: loser, foundBy: null };
      s.factions[loser].inventory.push('x');
      s = killAll(s, loser);
      // A living hero of the other faction takes the turn (a dead hero never gets one).
      s.turnIndex = s.turnOrder.findIndex((id) => s.heroes[id].alive);
      for (let i = 0; i < 10 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
      expect(s.phase).toBe('over');
      expect(s.winner).toBe(loser === 'horde' ? 'dawn' : 'horde');
      expect(s.factions[loser].inventory).toContain('x');
    }
  });
});

describe('painted arenas', () => {
  it('fights on the arena of the map half where the battle broke out', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40 && seen.size < 2; seed++) {
      let s = createGame(setup({ seed }));
      for (let i = 0; i < 600 && s.phase !== 'over'; i++) {
        if (s.battle && s.battle.stage !== 'select' && !s.battle.duel) {
          expect(s.battle.arena).toBe(s.tiles[s.battle.mapHex].side);
          expect(s.battle.obstacles).toEqual(arenaObstacles(s.battle.arena));
          seen.add(s.battle.arena);
        }
        s = applyAction(s, chooseAction(s)!);
      }
    }
    expect([...seen].sort()).toEqual(['dawn', 'horde']);
  });
});

describe('several heroes on one hex', () => {
  it('sends the winner back when other enemies still stand on the battle hex', () => {
    // Two Przymierze heroes share a hex next to the Black Dragon, which attacks them.
    const base = createGame(setup({ mode: 'pvp', seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' },
      { name: 'C', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' },
    ] }));
    const start = base.heroes.blackDragon.pos;
    const target = mapNeighbors(base.tiles, start).find((k) => TERRAIN_COST[base.tiles[k].terrain] !== null)!;
    for (let seed = 1; seed <= 60; seed++) {
      let s = structuredClone(base);
      s.rng = seed;
      s.tiles[target].revealed = true;
      s.heroes.goldDragon.pos = target;
      s.heroes.unicornKing.pos = target;
      s.turnIndex = s.turnOrder.indexOf('blackDragon');
      s.movePoints = 2;
      // The defenders fight without supports, so the attacker usually wins.
      s.factions.dawn.supportsDead = s.factions.dawn.supportsAlive;
      s.factions.dawn.supportsAlive = [];
      s = applyAction(s, { type: 'moveHero', to: target });
      for (let i = 0; i < 2000 && s.phase === 'battle'; i++) s = applyAction(s, chooseAction(s)!);
      if (!s.heroes.blackDragon.alive) continue;
      expect(s.heroes.blackDragon.pos).toBe(start);
      return;
    }
    throw new Error('no battle won by the attacker');
  });
});

describe('harder coop and duel abilities', () => {
  it('fields one Horde hero more when the coop option is on', () => {
    const count = (extraEvilHero: boolean, players: number) =>
      Object.values(createGame(setup({ seats: ([{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' }] as SetupOptions['seats']).slice(0, players) }, { extraEvilHero })).heroes).filter((h) => h.faction === 'horde').length;
    expect([count(false, 1), count(true, 1), count(false, 2), count(true, 2)]).toEqual([1, 2, 2, 3]);
  });

  /** A duel between two heroes, `first` acting. */
  function duel(first: string, second: string): GameState {
    const s = createGame(setup({ battleMode: 'board' }, { useDice: false }));
    s.phase = 'battle';
    const a = makeBattleUnit(first, UNITS[first].side);
    const d = makeBattleUnit(second, UNITS[second].side);
    a.pos = arenaCell(5, 9);
    d.pos = arenaCell(6, 10);
    s.battle = {
      kind: 'heroes', duel: true, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: a.side, defender: d.side, attackerHero: first, attackerFrom: Object.keys(s.tiles)[0], defenderHero: second, neutralId: null,
      stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: [], units: { [first]: a, [second]: d }, round: 1, order: [first, second], index: 0,
      activation: { unitId: first, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
      extra: [], winner: null, damageBy: {},
    };
    return s;
  }

  it('Szarża Światła adds its bonus to the first attack of a duel only', () => {
    let s = duel('unicornKing', 'cyclops');
    s = applyAction(s, { type: 'battleAttack', targetId: 'cyclops' });
    expect(s.battle!.units.cyclops.hp).toBe(UNITS.cyclops.hp - UNITS.unicornKing.attack - 1);
    s.battle!.activation = { unitId: 'unicornKing', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
    s = applyAction(s, { type: 'battleAttack', targetId: 'cyclops' });
    expect(s.battle!.units.cyclops.hp).toBe(UNITS.cyclops.hp - 2 * UNITS.unicornKing.attack - 1);
  });

  it('Opiekun Gaju blocks 2 damage of one attack in a duel', () => {
    let s = duel('blackDragon', 'ancientBear');
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(s.battle!.units.ancientBear.hp).toBe(UNITS.ancientBear.hp - UNITS.blackDragon.attack + 2);
    s.battle!.activation = { unitId: 'blackDragon', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false };
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(s.battle!.units.ancientBear.hp).toBe(UNITS.ancientBear.hp - 2 * UNITS.blackDragon.attack + 2);
  });
});
