import { describe, expect, it } from 'vitest';
import { FACTION_HEROES, FACTION_SUPPORTS, MAP_VARIANTS, UNITS } from '../src/engine/data';
import { distance, key, line, offsetToHex, parseKey, triToHex } from '../src/engine/hex';
import { applyAction, createGame, legalHeroMoves, activeHero } from '../src/engine/game';
import { ARENA_COLUMNS, ARENA_OBSTACLES, arenaCell, arenaCells, attackTargets, columnCells, hasLineOfSight, reachableCells } from '../src/engine/battle';
import { reachableFrom, homeKey, treeKey } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';

const setup = (over: Partial<SetupOptions> = {}): SetupOptions => ({
  mode: 'coop',
  mapSize: 'short',
  battleMode: 'arena',
  seed: 7,
  rules: { ...DEFAULT_RULES },
  seats: [{ name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' }],
  ...over,
});

describe('unit budgets (spec section 2, loosened by balancing)', () => {
  // The spec budgets (18 for heroes, 11 for supports) are a starting point: balancing moved
  // a few units by up to 2 points (docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md, section 7.11).
  const typeCost = (id: string) => (UNITS[id].attackType === 'ranged' ? 2 : 0) + (UNITS[id].movement === 'fly' ? 1 : 0);
  const budget = (id: string) => UNITS[id].hp + UNITS[id].attack + UNITS[id].speed + typeCost(id);
  it.each([...FACTION_HEROES.dawn, ...FACTION_HEROES.horde])('hero %s spends 18 ± 2 points', (id) => {
    expect(Math.abs(budget(id) - 18)).toBeLessThanOrEqual(2);
  });
  it.each([...FACTION_SUPPORTS.dawn, ...FACTION_SUPPORTS.horde])('support %s spends 11 ± 1 points', (id) => {
    expect(Math.abs(budget(id) - 11)).toBeLessThanOrEqual(1);
  });
});

describe('hex geometry', () => {
  it('measures distance on axial coordinates', () => {
    expect(distance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(distance(triToHex(5, 0), triToHex(0, 0))).toBe(5);
  });
  it('draws a straight line including both ends', () => {
    const l = line(offsetToHex(4, 0), offsetToHex(4, 5));
    expect(l).toHaveLength(6);
    expect(key(l[0])).toBe(key(offsetToHex(4, 0)));
  });
});

describe('map generation', () => {
  it.each(['short', 'medium', 'long', 'veryLong'] as const)('%s map has the right size and reachable objectives', (size) => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createGame(setup({ mapSize: size, seed }));
      const rows = MAP_VARIANTS[size].rows;
      expect(Object.keys(s.tiles)).toHaveLength((rows * (rows + 1)) / 2);
      const reach = reachableFrom(s.tiles, homeKey(rows, 'dawn'));
      expect(reach.has(treeKey())).toBe(true);
      for (const c of Object.values(s.crystals)) expect(reach.has(c.at)).toBe(true);
      expect(Object.values(s.crystals)).toHaveLength(MAP_VARIANTS[size].crystals);
    }
  });

  // Counts come from MAP_VARIANTS (tuned for balance; medium has 1 Odrodzenia + 3 others).
  it.each((['short', 'medium', 'long', 'veryLong'] as const).map((size) => [size, MAP_VARIANTS[size].resurrections, MAP_VARIANTS[size].otherTreasures] as const))('%s treasure pool has exactly %i Odrodzenia + %i others', (size, res, others) => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame(setup({ mapSize: size, seed }));
      const kinds = Object.values(s.items).map((i) => i.kind);
      expect(kinds.filter((k) => k === 'resurrection')).toHaveLength(res);
      expect(kinds.filter((k) => k !== 'resurrection')).toHaveLength(others);
      expect(new Set(kinds.filter((k) => k !== 'resurrection')).size).toBe(others);
    }
  });

  it('reveals only the bases, their neighbours and the Tree at the start', () => {
    const s = createGame(setup());
    const revealed = Object.values(s.tiles).filter((t) => t.revealed);
    expect(revealed.length).toBe(3 + 3 + 1);
  });

  it('coop adds as many evil heroes as good ones', () => {
    const s = createGame(setup({ seats: [
      { name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' },
      { name: 'B', faction: 'dawn', controller: 'human', heroId: 'ancientBear' },
    ] }));
    expect(Object.values(s.heroes).filter((h) => h.faction === 'horde')).toHaveLength(2);
  });
});

describe('adventure movement', () => {
  it('spends move points by terrain cost and never enters hidden hexes', () => {
    const s = createGame(setup());
    for (const m of legalHeroMoves(s)) {
      expect(s.tiles[m.to].revealed).toBe(true);
      expect(m.cost).toBeLessThanOrEqual(s.movePoints);
    }
    const move = legalHeroMoves(s)[0];
    const next = applyAction(s, { type: 'moveHero', to: move.to });
    expect(next.movePoints).toBe(s.movePoints - move.cost);
    expect(activeHero(next)!.pos).toBe(move.to);
  });
});

function battleState(): GameState {
  // Play bot games until a battle starts, then return that state.
  for (let seed = 1; seed < 200; seed++) {
    let s = createGame(setup({ seed, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }] }));
    for (let i = 0; i < 400 && s.phase !== 'over'; i++) {
      if (s.phase === 'battle' && s.battle?.stage === 'fight') return s;
      s = applyAction(s, chooseAction(s)!);
    }
  }
  throw new Error('no battle found');
}

describe('painted arena', () => {
  it('has 85 cells in 13 columns, start columns of 5, and every painted obstacle inside', () => {
    expect(arenaCells()).toHaveLength(85);
    expect(columnCells(0)).toHaveLength(5);
    expect(columnCells(ARENA_COLUMNS - 1)).toHaveLength(5);
    for (const side of ['dawn', 'horde'] as const) {
      for (const [c, h] of ARENA_OBSTACLES[side]) expect(arenaCells()).toContain(arenaCell(c, h));
    }
  });
});

describe('battle rules', () => {
  it('keeps start columns free of obstacles', () => {
    const s = battleState();
    for (const k of [...columnCells(0), ...columnCells(ARENA_COLUMNS - 1)]) expect(s.battle!.obstacles).not.toContain(k);
  });

  it('never lets a unit end its move on an obstacle or another unit', () => {
    const s = battleState();
    const b = s.battle!;
    for (const u of Object.values(b.units).filter((x) => x.alive)) {
      for (const k of reachableCells(s, u).keys()) {
        expect(b.obstacles).not.toContain(k);
        expect(Object.values(b.units).some((o) => o.alive && o.pos === k)).toBe(false);
      }
    }
  });

  it('lets flyers cross obstacles but walkers go around', () => {
    const s = battleState();
    const b = s.battle!;
    const unit = Object.values(b.units).find((u) => u.alive)!;
    b.obstacles = [arenaCell(1, 9)];
    unit.pos = arenaCell(0, 8);
    for (const o of Object.values(b.units)) if (o !== unit) o.pos = null;
    const cells = reachableCells(s, unit);
    const beyond = arenaCell(2, 10);
    if (UNITS[unit.defId].movement === 'fly') expect(cells.get(beyond)).toBe(2);
    else expect(cells.get(beyond) ?? 99).toBeGreaterThanOrEqual(2);
  });

  it('blocks line of sight with obstacles', () => {
    const s = battleState();
    s.battle!.obstacles = [arenaCell(5, 9)];
    expect(hasLineOfSight(s, arenaCell(2, 6), arenaCell(8, 12))).toBe(false);
    expect(hasLineOfSight(s, arenaCell(2, 4), arenaCell(8, 10))).toBe(true);
  });

  it('forces a ranged unit next to an enemy to shoot only that neighbour', () => {
    const s = battleState();
    const b = s.battle!;
    const shooter = { ...Object.values(b.units)[0], id: 'elfDruid', defId: 'elfDruid', side: 'dawn' as const, pos: arenaCell(5, 9), alive: true };
    b.units.elfDruid = shooter;
    const enemies = Object.values(b.units).filter((u) => u.side !== 'dawn' && u.alive);
    enemies[0].pos = arenaCell(6, 10);
    if (enemies[1]) enemies[1].pos = arenaCell(11, 5);
    const targets = attackTargets(s, shooter);
    expect(targets.map((t) => t.id)).toEqual([enemies[0].id]);
  });
});

describe('full games', () => {
  it('bots finish games deterministically from a seed', () => {
    const run = (seed: number) => {
      let s = createGame(setup({ seed, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'unicornKing' }] }));
      for (let i = 0; i < 20000 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
      return s;
    };
    const a = run(3);
    const b = run(3);
    expect(a.phase).toBe('over');
    expect(a.winner).toBe(b.winner);
    expect(a.actionCount).toBe(b.actionCount);
  });

  it('kills fallen supports permanently', () => {
    for (let seed = 1; seed < 40; seed++) {
      let s = createGame(setup({ seed, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'ancientBear' }] }));
      for (let i = 0; i < 20000 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
      const f = s.factions.dawn;
      expect(f.supportsAlive.filter((x) => f.supportsDead.includes(x))).toHaveLength(0);
      expect(f.supportsAlive.length + f.supportsDead.length).toBe(3);
    }
  });
});

describe('player-facing keys', () => {
  it('parses keys back to hexes', () => {
    expect(parseKey(key({ q: -3, r: 5 }))).toEqual({ q: -3, r: 5 });
  });
});

describe('objectives', () => {
  it('completes the ritual after evil heroes hold the Tree for the configured rounds', () => {
    let s = createGame(setup({ seats: [{ name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' }] }));
    const evil = Object.values(s.heroes).find((h) => h.faction === 'horde')!;
    s.heroes[evil.id].pos = treeKey();
    for (let i = 0; i < 20 && s.phase !== 'over'; i++) s = applyAction(s, { type: 'endTurn' });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('horde');
    expect(s.endReason).toContain('rytuał');
    expect(s.round).toBe(DEFAULT_RULES.ritualRounds);
  });

  it('delivers carried crystals on the Tree unless an evil hero stands there', () => {
    const s = createGame(setup());
    const hero = activeHero(s)!;
    const crystal = Object.values(s.crystals)[0];
    crystal.guardian = null;
    crystal.at = `hero:${hero.id}`;
    hero.crystals = [crystal.id];
    const next = Object.keys(s.tiles).find((k) => k !== treeKey() && s.tiles[k].row === 1)!;
    hero.pos = next;
    s.tiles[treeKey()].revealed = true;
    const delivered = applyAction(s, { type: 'moveHero', to: treeKey() });
    expect(delivered.factions.dawn.delivered).toBe(1);

    const blocked = structuredClone(s);
    const evil = Object.values(blocked.heroes).find((h) => h.faction === 'horde')!;
    evil.pos = treeKey();
    const fight = applyAction(blocked, { type: 'moveHero', to: treeKey() });
    expect(fight.phase).toBe('battle');
    expect(fight.factions.dawn.delivered).toBe(0);
  });

  it('ends the game for evil when the round limit passes', () => {
    let s = createGame(setup());
    for (let i = 0; i < 200 && s.phase !== 'over'; i++) s = applyAction(s, { type: 'endTurn' });
    expect(s.winner).toBe('horde');
  });
});

describe('board battles (1-on-1 duels)', () => {
  it('fights leaders only, without moving, until one falls', () => {
    let found = 0;
    for (let seed = 1; seed < 60 && found < 5; seed++) {
      let s = createGame(setup({ seed, battleMode: 'board', seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'ancientBear' }] }));
      for (let i = 0; i < 3000 && s.phase !== 'over'; i++) {
        const b = s.battle;
        if (b && b.stage === 'fight') {
          found++;
          expect(b.duel).toBe(true);
          expect(Object.keys(b.units)).toHaveLength(2);
          expect(b.obstacles).toHaveLength(0);
          for (const u of Object.values(b.units)) if (u.alive) expect(reachableCells(s, u).size).toBe(0);
          const supportsBefore = s.factions.dawn.supportsAlive.length;
          while (s.phase === 'battle') s = applyAction(s, chooseAction(s)!);
          expect(s.factions.dawn.supportsAlive.length).toBe(supportsBefore);
          break;
        }
        s = applyAction(s, chooseAction(s)!);
      }
    }
    expect(found).toBeGreaterThan(0);
  });
});

describe('deployment', () => {
  it('lets the attacker deploy first, only on its edge column', () => {
    for (let seed = 1; seed < 80; seed++) {
      let s = createGame(setup({ seed, seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' }] }));
      for (let i = 0; i < 600 && s.phase !== 'over'; i++) {
        if (s.battle?.stage === 'deploy') {
          const b = s.battle;
          expect(b.needsDeploy[0]).toBe(b.attacker);
          const own = Object.values(b.units).filter((u) => u.side === b.attacker);
          const bad = { ...Object.fromEntries(own.map((u) => [u.id, u.pos!])), [own[0].id]: arenaCell(4, 6) };
          expect(() => applyAction(s, { type: 'deployUnits', faction: b.attacker as 'dawn' | 'horde', positions: bad })).toThrow();
          const swapped = Object.fromEntries(own.map((u, j) => [u.id, own[(j + 1) % own.length].pos!]));
          const next = applyAction(s, { type: 'deployUnits', faction: b.attacker as 'dawn' | 'horde', positions: swapped });
          for (const u of own) expect(next.battle!.units[u.id].pos).toBe(swapped[u.id]);
          return;
        }
        s = applyAction(s, chooseAction(s)!);
      }
    }
    throw new Error('no deployment found');
  });
});

describe('tile halves', () => {
  it('builds the left half from Przymierze tiles and the right from Horda tiles, with guardians on their side', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame(setup({ seed, mapSize: 'medium' }));
      for (const t of Object.values(s.tiles)) {
        const x = t.col - t.row / 2;
        if (x < 0) expect(t.side).toBe('dawn');
        if (x > 0) expect(t.side).toBe('horde');
      }
      for (const c of Object.values(s.crystals)) {
        const side = s.tiles[c.at].side;
        expect(side).toBe(c.guardian === 'griffin' ? 'dawn' : 'horde');
      }
    }
  });
});
