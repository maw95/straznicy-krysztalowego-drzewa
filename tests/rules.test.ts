// Rules agreed with the designer in docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md (section "Zasady obowiązujące").
import { describe, expect, it } from 'vitest';
import { RESURRECTION_CARDS, TERRAIN_COST, TILE_POOLS, UNITS } from '../src/engine/data';
import { activeHero, applyAction, createGame, legalHeroMoves, ritualFormed } from '../src/engine/game';
import { abilityActive, arenaCell, arenaObstacles, makeBattleUnit, movePath, reachableCells } from '../src/engine/battle';
import { distance, parseKey } from '../src/engine/hex';
import { homeKey, mapNeighbors, sideOf, treeKey } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import { chooseBattleAction } from '../src/engine/ai/battleAi';
import { DEFAULT_RULES, levelSettings, type BattleState, type GameState, type SetupOptions } from '../src/engine/types';

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
  it('starts as the full game: abilities and treasures, no die, no hero replacement', () => {
    expect(DEFAULT_RULES).toMatchObject({ abilities: true, treasures: true, useDice: false, heroReplacement: false });
  });

  it('puts only a few Eliksiry Odrodzenia on the map in the simple treasure option', () => {
    for (const [size, n] of [['short', 1], ['medium', 2], ['long', 3], ['veryLong', 4]] as const) {
      const s = createGame(setup({ mapSize: size }, { treasures: false }));
      expect(Object.values(s.items).map((i) => i.kind)).toEqual(Array(n).fill('resurrection'));
      expect(Object.values(s.tiles).filter((t) => t.treasureId)).toHaveLength(n);
    }
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

describe('Przymierze hero abilities after balancing', () => {
  /** An arena fight: the listed units at [col, half], the first one to act. */
  function fight(units: Array<[string, 'dawn' | 'horde', number, number]>): GameState {
    const s = createGame(setup({ mode: 'pvp', seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' }] }));
    s.phase = 'battle';
    const all: BattleState['units'] = {};
    for (const [id, side, col, half] of units) {
      const u = makeBattleUnit(id, side);
      u.pos = arenaCell(col, half);
      all[id] = u;
    }
    const first = units[0][0];
    s.battle = {
      kind: 'heroes', duel: false, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: 'horde', defender: 'dawn', attackerHero: 'blackDragon', attackerFrom: Object.keys(s.tiles)[0], defenderHero: 'ancientBear', neutralId: null,
      stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: [], units: all, round: 1, order: units.map((u) => u[0]), index: 0,
      activation: { unitId: first, moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
      extra: [], winner: null, damageBy: {},
    };
    return s;
  }

  it('Opiekun Gaju softens a lethal blow aimed at the bear itself by 3', () => {
    let s = fight([['blackDragon', 'horde', 5, 6], ['ancientBear', 'dawn', 5, 8]]);
    s.battle!.units.ancientBear.hp = 5;
    s = applyAction(s, { type: 'battleAttack', targetId: 'ancientBear' });
    expect(s.battle!.units.ancientBear.hp).toBe(3);
    expect(s.battle!.units.ancientBear.abilityUsed).toBe(true);
  });

  it('Słoneczny Blask gives the dragon +3 A and its allies +1 A', () => {
    let s = fight([['goldDragon', 'dawn', 5, 6], ['nymph', 'dawn', 7, 6], ['blackDragon', 'horde', 5, 8]]);
    s = applyAction(s, { type: 'battleAbility' });
    expect(s.battle!.units.goldDragon.status.nextAttackBonus).toBe(3);
    expect(s.battle!.units.nymph.status.nextAttackBonus).toBe(1);
  });
});

describe('heroes falling', () => {
  function killAll(s: GameState, faction: 'dawn' | 'horde'): GameState {
    for (const h of Object.values(s.heroes)) if (h.faction === faction) h.alive = false;
    return s;
  }

  it('lets the Horde win when every Przymierze hero has fallen, and no elixir drinks itself', () => {
    let s = createGame(setup({ mode: 'pvp', seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' }] }));
    s.items.x = { id: 'x', kind: 'resurrection', owner: 'dawn', foundBy: null };
    s.factions.dawn.inventory.push('x');
    s = killAll(s, 'dawn');
    s.turnIndex = s.turnOrder.findIndex((id) => s.heroes[id].alive);
    for (let i = 0; i < 10 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('horde');
    expect(s.factions.dawn.inventory).toContain('x');
  });

  it('does not give Przymierze the win for beating every Horde hero: the crystals still decide', () => {
    let s = createGame(setup({ mode: 'pvp', seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' }] }));
    s = killAll(s, 'horde');
    s.turnIndex = s.turnOrder.indexOf('goldDragon');
    for (let i = 0; i < 6 && s.phase !== 'over'; i++) s = applyAction(s, { type: 'endTurn' });
    expect(s.phase).not.toBe('over');
    // Once the crystals reach the Tree, Przymierze wins.
    s.factions.dawn.delivered = s.crystalsNeeded;
    s = applyAction(s, { type: 'endTurn' });
    expect(s.winner).toBe('dawn');
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

describe('several heroes in a base', () => {
  it('sends the winner back when other enemies still stand on the battle hex', () => {
    const base = createGame(setup({ mode: 'pvp', seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' },
      { name: 'C', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' },
    ] }));
    // Only a base may hold several heroes of one faction: the Black Dragon attacks the Przymierze base.
    const target = homeKey(base.rows, 'dawn');
    const start = mapNeighbors(base.tiles, target).find((k) => TERRAIN_COST[base.tiles[k].terrain] !== null)!;
    for (let seed = 1; seed <= 60; seed++) {
      let s = structuredClone(base);
      s.rng = seed;
      s.tiles[target].revealed = true;
      s.heroes.goldDragon.pos = target;
      s.heroes.unicornKing.pos = target;
      s.heroes.blackDragon.pos = start;
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

  it('hands a free crystal to the Przymierze hero standing on its hex without any move', () => {
    let s = createGame(setup());
    const crystal = Object.values(s.crystals)[0];
    crystal.guardian = null;
    crystal.at = s.heroes.goldDragon.pos;
    s = applyAction(s, { type: 'endTurn' });
    expect(s.crystals[crystal.id].at).toBe('hero:goldDragon');
    expect(s.heroes.goldDragon.crystals).toEqual([crystal.id]);
  });

  it('lets a Przymierze ally on the same hex pick up the crystal of a fallen hero', () => {
    const base = createGame(setup({ mode: 'pvp', seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' },
      { name: 'C', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' },
    ] }));
    // Only a base may hold several heroes of one faction: the Black Dragon attacks the Przymierze base.
    const target = homeKey(base.rows, 'dawn');
    const start = mapNeighbors(base.tiles, target).find((k) => TERRAIN_COST[base.tiles[k].terrain] !== null)!;
    for (let seed = 1; seed <= 60; seed++) {
      let s = structuredClone(base);
      s.rng = seed;
      s.tiles[target].revealed = true;
      s.heroes.goldDragon.pos = target;
      s.heroes.unicornKing.pos = target;
      s.heroes.blackDragon.pos = start;
      s.turnIndex = s.turnOrder.indexOf('blackDragon');
      s.movePoints = 2;
      s.factions.dawn.supportsDead = s.factions.dawn.supportsAlive;
      s.factions.dawn.supportsAlive = [];
      s = applyAction(s, { type: 'moveHero', to: target });
      // The hero who defends carries the crystal; the other one waits on the hex.
      const carrier = s.battle!.defenderHero!;
      const ally = carrier === 'goldDragon' ? 'unicornKing' : 'goldDragon';
      const crystal = Object.values(s.crystals)[0];
      crystal.guardian = null;
      crystal.at = `hero:${carrier}`;
      s.heroes[carrier].crystals = [crystal.id];
      for (let i = 0; i < 2000 && s.phase === 'battle'; i++) s = applyAction(s, chooseAction(s)!);
      if (s.heroes[carrier].alive) continue;
      expect(s.heroes[ally].crystals).toEqual([crystal.id]);
      expect(s.crystals[crystal.id].at).toBe(`hero:${ally}`);
      return;
    }
    throw new Error('the carrier never fell');
  });
});

describe('reserve hero', () => {
  it('comes in on a free hex nearest to where the fallen hero died, chosen on its first turn', () => {
    const base = createGame(setup({ mode: 'pvp', seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' },
    ] }, { heroReplacement: true }));
    const start = base.heroes.blackDragon.pos;
    const target = mapNeighbors(base.tiles, start).find((k) => TERRAIN_COST[base.tiles[k].terrain] !== null)!;
    for (let seed = 1; seed <= 60; seed++) {
      let s = structuredClone(base);
      s.rng = seed;
      s.tiles[target].revealed = true;
      s.heroes.goldDragon.pos = target;
      s.turnIndex = s.turnOrder.indexOf('blackDragon');
      s.movePoints = 2;
      s.factions.dawn.supportsDead = s.factions.dawn.supportsAlive;
      s.factions.dawn.supportsAlive = [];
      s = applyAction(s, { type: 'moveHero', to: target });
      for (let i = 0; i < 2000 && s.phase === 'battle'; i++) s = applyAction(s, chooseAction(s)!);
      if (s.heroes.goldDragon.alive || s.phase === 'over') continue;
      const reserve = Object.values(s.heroes).find((h) => h.faction === 'dawn' && h.alive)!;
      // The Black Dragon holds the battle hex, so the reserve comes in next to it.
      const spots = reserve.entering ?? [reserve.pos];
      for (const k of spots) {
        expect(mapNeighbors(s.tiles, target)).toContain(k);
        expect(s.heroes.blackDragon.pos === k).toBe(false);
      }
      if (reserve.entering) {
        while (activeHero(s)?.id !== reserve.id) s = applyAction(s, { type: 'endTurn' });
        expect(legalHeroMoves(s).map((m) => m.to).sort()).toEqual([...spots].sort());
        const before = s.movePoints;
        s = applyAction(s, { type: 'moveHero', to: spots[spots.length - 1] });
        expect(s.heroes[reserve.id].pos).toBe(spots[spots.length - 1]);
        expect(s.heroes[reserve.id].entering).toBeUndefined();
        expect(s.movePoints).toBe(before);
      }
      return;
    }
    throw new Error('the Przymierze hero never fell');
  });
});

describe('harder coop', () => {
  it('fields one Horde hero more when the coop option is on', () => {
    const count = (extraEvilHero: boolean, players: number) =>
      Object.values(createGame(setup({ seats: ([{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }, { name: 'B', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' }] as SetupOptions['seats']).slice(0, players) }, { extraEvilHero })).heroes).filter((h) => h.faction === 'horde').length;
    expect([count(false, 1), count(true, 1), count(false, 2), count(true, 2)]).toEqual([2, 3, 2, 3]);
  });
});

describe('one hero per hex', () => {
  const pvp = () => createGame(setup({ mode: 'pvp', seats: [
    { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
    { name: 'B', faction: 'horde', controller: 'bot', heroId: 'blackDragon' },
    { name: 'C', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' },
    { name: 'D', faction: 'horde', controller: 'bot', heroId: 'werewolfLord' },
  ] }));

  it('closes a hex held by an ally, but not the own base', () => {
    const s = pvp();
    const base = homeKey(s.rows, 'dawn');
    const near = mapNeighbors(s.tiles, base).filter((k) => TERRAIN_COST[s.tiles[k].terrain] !== null);
    s.tiles[near[0]].revealed = true;
    s.heroes.unicornKing.pos = near[0];
    s.turnIndex = s.turnOrder.indexOf('goldDragon');
    expect(legalHeroMoves(s).map((m) => m.to)).not.toContain(near[0]);
    // From next door, the ally standing in the base does not close it.
    s.heroes.goldDragon.pos = near[0];
    s.heroes.unicornKing.pos = base;
    expect(legalHeroMoves(s).map((m) => m.to)).toContain(base);
  });

  it('forms the ritual with one Horde hero on the Tree and the others next to it', () => {
    const s = pvp();
    const tree = treeKey();
    const around = mapNeighbors(s.tiles, tree);
    s.heroes.blackDragon.pos = tree;
    s.heroes.werewolfLord.pos = around[0];
    expect(ritualFormed(s)).toBe(true);
    s.heroes.werewolfLord.pos = homeKey(s.rows, 'horde');
    expect(ritualFormed(s)).toBe(false);
  });

  it('puts a revived hero on a free hex next to the one who drinks the elixir', () => {
    let s = pvp();
    s.heroes.unicornKing.alive = false;
    s.items.x = { id: 'x', kind: 'resurrection', owner: 'dawn', foundBy: null };
    s.factions.dawn.inventory.push('x');
    s.turnIndex = s.turnOrder.indexOf('goldDragon');
    const spot = mapNeighbors(s.tiles, s.heroes.goldDragon.pos).find((k) => TERRAIN_COST[s.tiles[k].terrain] !== null)!;
    expect(() => applyAction(s, { type: 'useMapItem', itemId: 'x', unitId: 'unicornKing', targets: [s.heroes.blackDragon.pos] })).toThrow();
    s = applyAction(s, { type: 'useMapItem', itemId: 'x', unitId: 'unicornKing', targets: [spot] });
    expect(s.heroes.unicornKing).toMatchObject({ alive: true, pos: spot });
  });
});

describe('rulebook battle behaviour (coop automaton and guardians)', () => {
  /** A guardian fight with the guardian to act. */
  function guardianTurn(foes: Array<[string, number, number, number?]>): GameState {
    const s = createGame(setup());
    s.phase = 'battle';
    const g = makeBattleUnit('hydra', 'neutral');
    g.pos = arenaCell(6, 8);
    const units: BattleState['units'] = { hydra: g };
    for (const [id, col, half, hp] of foes) {
      const u = makeBattleUnit(id, 'dawn');
      u.pos = arenaCell(col, half);
      if (hp) u.hp = hp;
      units[id] = u;
    }
    s.battle = {
      kind: 'neutral', duel: false, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: 'dawn', defender: 'neutral', attackerHero: foes[0][0], attackerFrom: Object.keys(s.tiles)[0], defenderHero: null, neutralId: 'hydra',
      stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: [], units, round: 1, order: ['hydra', ...foes.map((f) => f[0])], index: 0,
      activation: { unitId: 'hydra', moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
      extra: [], winner: null, damageBy: {},
    };
    return s;
  }

  it('a guardian hits the enemy with the least Życie it can reach', () => {
    const withHero = guardianTurn([['goldDragon', 6, 6], ['nymph', 7, 9, 1]]);
    expect(chooseBattleAction(withHero)).toMatchObject({ type: 'battleAttack', targetId: 'nymph' });
    const supportsOnly = guardianTurn([['goldDragon', 0, 4], ['nymph', 7, 9, 4], ['elfDruid', 5, 9, 2]]);
    expect(chooseBattleAction(supportsOnly)).toMatchObject({ type: 'battleAttack', targetId: 'elfDruid' });
  });

  it('a guardian with nobody in reach walks towards the nearest enemy', () => {
    const s = guardianTurn([['goldDragon', 0, 4]]);
    const a = chooseBattleAction(s);
    expect(a.type).toBe('battleMove');
  });
});

describe('crystals to collect', () => {
  it('puts 2 crystals on the map for one Przymierze hero and 3 for two', () => {
    const one = createGame(setup({ mapSize: 'long' }));
    expect(Object.keys(one.crystals)).toHaveLength(2);
    expect(one.crystalsNeeded).toBe(2);
    const two = createGame(setup({ mapSize: 'short', seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
      { name: 'B', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' },
    ] }));
    expect(Object.keys(two.crystals)).toHaveLength(3);
    expect(two.crystalsNeeded).toBe(3);
  });
});

describe('arena movement path', () => {
  it('walks hex by hex around obstacles and enemies, the shortest way; flyers go straight', () => {
    const s = guardianFight('cyclops', [['ancientBear', 2, 8], ['pegasus', 2, 10]]);
    const b = s.battle!;
    b.obstacles = [arenaCell(3, 7), arenaCell(3, 9)];
    const bear = b.units.ancientBear;
    const reach = reachableCells(s, bear);
    let detours = 0;
    for (const [to, steps] of reach) {
      const path = movePath(s, bear, to);
      expect(path[0]).toBe(bear.pos);
      expect(path[path.length - 1]).toBe(to);
      expect(path.length - 1).toBe(steps);
      for (let i = 1; i < path.length; i++) {
        expect(distance(parseKey(path[i - 1]), parseKey(path[i]))).toBe(1);
        expect(b.obstacles).not.toContain(path[i]);
        expect(path[i]).not.toBe(b.units.cyclops.pos);
      }
      if (steps > distance(parseKey(bear.pos!), parseKey(to))) detours++;
    }
    expect(detours).toBeGreaterThan(0);
    const peg = b.units.pegasus;
    const far = [...reachableCells(s, peg).keys()].find((k) => distance(parseKey(peg.pos!), parseKey(k)) >= 2)!;
    expect(movePath(s, peg, far)).toEqual([peg.pos, far]);
  });
});

describe('difficulty and balance settings', () => {
  it('fields at least rules.minEvilHeroes automaton heroes in coop (2 by default)', () => {
    const count = (s: GameState) => Object.values(s.heroes).filter((h) => h.faction === 'horde').length;
    expect(count(createGame(setup()))).toBe(2);
    expect(count(createGame(setup({}, { minEvilHeroes: 1 })))).toBe(1);
    expect(count(createGame(setup({}, { extraEvilHero: true })))).toBe(3);
  });

  it('hands the Przymierze its starting treasures on the larger maps', () => {
    const held = (s: GameState, f: 'dawn' | 'horde') => s.factions[f].inventory.map((id) => s.items[id].kind);
    expect(held(createGame(setup({ mapSize: 'medium' })), 'dawn')).toEqual([]);
    const long = held(createGame(setup({ mapSize: 'long' })), 'dawn');
    expect(long).toHaveLength(1);
    expect(long).not.toContain('resurrection');
    const veryLong = held(createGame(setup({ mapSize: 'veryLong' })), 'dawn');
    expect(veryLong.filter((k) => k === 'resurrection')).toHaveLength(1);
    expect(veryLong).toHaveLength(2);
    expect(held(createGame(setup({ mapSize: 'veryLong' }, { treasures: false })), 'dawn')).toEqual([]);
  });

  it('gives the Horde two random treasures on the hard level, never more Eliksiry than the box holds', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = createGame({ mode: 'coop', mapSize: 'veryLong', seed, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }], ...levelSettings('hard', 'coop') });
      expect(s.factions.horde.inventory).toHaveLength(2);
      expect(Object.values(s.items).filter((it) => it.kind === 'resurrection').length).toBeLessThanOrEqual(RESURRECTION_CARDS);
      const kinds = Object.values(s.items).map((it) => it.kind).filter((k) => k !== 'resurrection');
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });

  it('plays the easy level without the ritual and with reserve heroes', () => {
    const { rules } = levelSettings('kids', 'coop');
    expect(rules).toMatchObject({ ritual: false, heroReplacement: true, abilities: false });
    const s = createGame(setup({}, rules));
    for (const h of Object.values(s.heroes)) if (h.faction === 'horde') h.pos = treeKey();
    expect(ritualFormed(s)).toBe(false);
  });
});
