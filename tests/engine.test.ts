import { describe, expect, it } from 'vitest';
import { FACTION_HEROES, FACTION_SUPPORTS, MAP_VARIANTS, UNITS } from '../src/engine/data';
import { distance, key, line, offsetToHex, parseKey, triToHex } from '../src/engine/hex';
import { applyAction, createGame, legalHeroMoves, activeHero } from '../src/engine/game';
import { arenaCell, attackTargets, hasLineOfSight, reachableCells } from '../src/engine/battle';
import { reachableFrom, homeKey, treeKey } from '../src/engine/map';
import { chooseAction } from '../src/engine/ai';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';

const setup = (over: Partial<SetupOptions> = {}): SetupOptions => ({
  mode: 'coop',
  difficulty: 'basic',
  mapSize: 'short',
  battleMode: 'arena',
  seed: 7,
  rules: { ...DEFAULT_RULES },
  seats: [{ name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' }],
  ...over,
});

describe('unit budgets (spec section 2)', () => {
  const typeCost = (id: string) => (UNITS[id].attackType === 'ranged' ? 2 : 0) + (UNITS[id].movement === 'fly' ? 1 : 0);
  it.each([...FACTION_HEROES.dawn, ...FACTION_HEROES.horde])('hero %s spends 18 points', (id) => {
    const u = UNITS[id];
    expect(u.hp + u.attack + u.speed + typeCost(id)).toBe(18);
  });
  it.each([...FACTION_SUPPORTS.dawn, ...FACTION_SUPPORTS.horde])('support %s spends 11 points', (id) => {
    const u = UNITS[id];
    expect(u.hp + u.attack + u.speed + typeCost(id)).toBe(11);
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
  it.each(['short', 'medium', 'long'] as const)('%s map has the right size and reachable objectives', (size) => {
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

  it.each([
    ['short', 1, 1],
    ['medium', 2, 2],
    ['long', 2, 4],
  ] as const)('%s treasure pool has exactly %i Odrodzenia + %i others', (size, res, others) => {
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

describe('battle rules', () => {
  it('keeps start columns free of obstacles', () => {
    const s = battleState();
    for (let row = 0; row < 9; row++) {
      expect(s.battle!.obstacles).not.toContain(arenaCell(row, 0));
      expect(s.battle!.obstacles).not.toContain(arenaCell(row, 10));
    }
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
    b.obstacles = [arenaCell(4, 1)];
    unit.pos = arenaCell(4, 0);
    for (const o of Object.values(b.units)) if (o !== unit) o.pos = null;
    const cells = reachableCells(s, unit);
    const beyond = arenaCell(4, 2);
    if (UNITS[unit.defId].movement === 'fly') expect(cells.get(beyond)).toBe(2);
    else expect(cells.get(beyond) ?? 99).toBeGreaterThanOrEqual(2);
  });

  it('blocks line of sight with obstacles', () => {
    const s = battleState();
    s.battle!.obstacles = [arenaCell(4, 5)];
    expect(hasLineOfSight(s, arenaCell(4, 2), arenaCell(4, 8))).toBe(false);
    expect(hasLineOfSight(s, arenaCell(2, 2), arenaCell(2, 8))).toBe(true);
  });

  it('forces a ranged unit next to an enemy to shoot only that neighbour', () => {
    const s = battleState();
    const b = s.battle!;
    const shooter = { ...Object.values(b.units)[0], id: 'elfDruid', defId: 'elfDruid', side: 'dawn' as const, pos: arenaCell(4, 4), alive: true };
    b.units.elfDruid = shooter;
    const enemies = Object.values(b.units).filter((u) => u.side !== 'dawn' && u.alive);
    enemies[0].pos = arenaCell(4, 5);
    if (enemies[1]) enemies[1].pos = arenaCell(0, 9);
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
