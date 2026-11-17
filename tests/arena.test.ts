// Arena: one 3-on-3 battle, supports chosen and two treasures drafted per side from a shared deck.
import { describe, expect, it } from 'vitest';
import { ARENA_DECK, ITEMS, type FactionId } from '../src/engine/data';
import { chooseAction } from '../src/engine/ai';
import { applyAction, createGame, currentActor } from '../src/engine/game';
import { ARTIFACT_BY_ID, gearOf, worksInBattle } from '../src/engine/sites';
import { SPELLS } from '../src/engine/magic';
import { arenaSetup, type Level, type SeatSetup } from '../src/engine/types';
import { playOut, playUntil } from './helpers/engine';

const seats = (dawn: SeatSetup['controller'] = 'bot', horde: SeatSetup['controller'] = 'bot'): SeatSetup[] => [
  { name: 'A', faction: 'dawn', controller: dawn, heroId: 'unicornKing' },
  { name: 'B', faction: 'horde', controller: horde, heroId: 'werewolfLord' },
];

/** Plays bot actions until the draft starts. */
const toDraft = (seed: number, level: Level = 'normal') => playUntil(createGame(arenaSetup(seats(), seed, level)), (s) => s.battle?.stage !== 'select');

describe('arena', () => {
  it('starts straight in battle with both sides choosing supports, on a random arena', () => {
    const arenas = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const s = createGame(arenaSetup(seats(), seed));
      expect(s.phase).toBe('battle');
      expect(s.battle!.stage).toBe('select');
      expect([...s.battle!.needsSelection].sort()).toEqual(['dawn', 'horde']);
      expect(s.rules.initiativeTie).toBe('rotating');
      arenas.add(s.battle!.arena);
    }
    expect([...arenas].sort()).toEqual(['dawn', 'horde']);
  });

  it('drafts from a shared deck: two Eliksiry, no Magiczna Mapa, picks A, B, B, A', () => {
    expect(ARENA_DECK.filter((k) => k === 'resurrection')).toHaveLength(2);
    expect(ARENA_DECK).not.toContain('map');
    expect(ARENA_DECK.every((k) => ITEMS[k].usableIn.includes('battle'))).toBe(true);
    let s = toDraft(3);
    expect(s.battle!.stage).toBe('draft');
    const first = s.battle!.attacker as FactionId;
    const second = s.battle!.defender as FactionId;
    expect(s.draft!.order).toEqual([first, second, second, first]);
    const pickers: FactionId[] = [];
    while (s.battle?.stage === 'draft') {
      const d = s.draft!;
      // The Horde is shown 4 cards (an arena-only handicap), Przymierze 3.
      const shown = d.order[0] === 'horde' ? 4 : 3;
      expect(d.offer).toHaveLength(shown);
      expect(new Set(d.offer).size).toBe(shown);
      const before = d.deck.length;
      pickers.push(d.order[0]);
      s = applyAction(s, chooseAction(s)!);
      // Only the picked card leaves the deck: the other two go back.
      if (s.draft) expect(s.draft.deck).toHaveLength(before - 1);
    }
    expect(pickers).toEqual([first, second, second, first]);
    expect(s.battle!.stage).toBe('deploy');
    expect(s.factions.dawn.inventory).toHaveLength(2);
    expect(s.factions.horde.inventory).toHaveLength(2);
  });

  it('refuses a card that is not on offer and a pick out of turn', () => {
    const s = toDraft(4);
    const d = s.draft!;
    const other = d.order[0] === 'dawn' ? 'horde' : 'dawn';
    const missing = ARENA_DECK.find((k) => !d.offer.includes(k))!;
    expect(() => applyAction(s, { type: 'draftPick', faction: d.order[0], kind: missing })).toThrow();
    expect(() => applyAction(s, { type: 'draftPick', faction: other, kind: d.offer[0] })).toThrow();
    expect(currentActor(s)).toMatchObject({ kind: 'bot', faction: d.order[0] });
  });

  it('ends the game with the battle', () => {
    const winners = new Set<string>();
    for (let seed = 1; seed <= 10; seed++) {
      const s = playOut(createGame(arenaSetup(seats(), seed)), 3000);
      expect(s.phase).toBe('over');
      expect(s.lastBattle).not.toBeNull();
      winners.add(String(s.winner));
    }
    expect(winners.size).toBeGreaterThan(1);
  });

  it('the easy bot drafts at random, the hard one the most useful card', () => {
    const picks = (level: Level) => {
      const out: string[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const s = toDraft(seed, level);
        const a = chooseAction(s)!;
        out.push(a.type === 'draftPick' ? a.kind : '');
      }
      return out;
    };
    const useless = ['horn', 'hourglass', 'courage_horn'];
    expect(picks('hard').some((k) => useless.includes(k))).toBe(false);
    expect(picks('kids').some((k) => useless.includes(k))).toBe(true);
  });
});

describe('walking in battle', () => {
  it('never walks through an ally (nor an enemy); flyers still pass over', async () => {
    const { movePath, reachableCells, unitAt } = await import('../src/engine/battle');
    const { UNITS } = await import('../src/engine/data');
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++) {
      let s = createGame(arenaSetup(seats(), seed));
      for (let i = 0; i < 400 && s.phase !== 'over'; i++) {
        const b = s.battle;
        if (b?.stage === 'fight' && b.activation && !b.activation.moved) {
          const u = b.units[b.activation.unitId];
          if (UNITS[u.defId].movement !== 'fly') {
            for (const to of reachableCells(s, u).keys()) {
              const path = movePath(s, u, to);
              for (const k of path.slice(1, -1)) expect(unitAt(b, k)).toBeUndefined();
              checked++;
            }
          }
        }
        s = applyAction(s, chooseAction(s)!);
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe('arena 6 on 6', () => {
  it('offers the fixed pool of eight units, five are chosen, and six stand on each side', () => {
    const s = createGame(arenaSetup(seats(), 4, 'normal', 6));
    expect(s.rules.arenaSize).toBe(6);
    for (const f of ['dawn', 'horde'] as FactionId[]) expect(s.factions[f].supportsAlive).toHaveLength(8);
    const after = playUntil(s, (x) => x.battle?.stage === 'draft' || x.battle?.stage === 'deploy' || x.battle?.stage === 'fight');
    const sides = Object.values(after.battle!.units).reduce((n, u) => ({ ...n, [u.side]: (n[u.side] ?? 0) + 1 }), {} as Record<string, number>);
    expect(sides).toEqual({ dawn: 6, horde: 6 });
  });

  it('refuses a wrong number of supports', () => {
    let s = createGame(arenaSetup(seats('human', 'human'), 4, 'normal', 6));
    while (s.battle!.stage === 'gear') s = applyAction(s, { type: 'pickGear', faction: s.draft!.gear!.order[0], artifactId: s.draft!.gear!.offer[0] });
    const f = s.battle!.needsSelection[0];
    const pool = s.factions[f].supportsAlive;
    expect(() => applyAction(s, { type: 'selectSupports', faction: f, supportIds: pool.slice(0, 2) })).toThrow();
    expect(() => applyAction(s, { type: 'selectSupports', faction: f, supportIds: pool.slice(0, 5) })).not.toThrow();
  });

  it('bot games end with a winner', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = playOut(createGame(arenaSetup(seats(), seed, 'normal', 6)), 4000);
      expect(s.phase).toBe('over');
    }
  });

  it('starts with the choice of one of three artifacts, then both heroes carry it and know two spells of circles I-II', () => {
    let s = createGame(arenaSetup(seats('human', 'human'), 7, 'normal', 6));
    expect(s.battle!.stage).toBe('gear');
    const picked: Record<string, string> = {};
    while (s.battle!.stage === 'gear') {
      const g = s.draft!.gear!;
      expect(g.offer).toHaveLength(3);
      expect(new Set(g.offer.map((id) => ARTIFACT_BY_ID[id].slot)).size).toBe(3);
      expect(() => applyAction(s, { type: 'pickGear', faction: g.order[0] === 'dawn' ? 'horde' : 'dawn', artifactId: g.offer[0] })).toThrow();
      picked[g.order[0]] = g.offer[1];
      s = applyAction(s, { type: 'pickGear', faction: g.order[0], artifactId: g.offer[1] });
    }
    expect(s.battle!.stage).toBe('select');
    expect(s.draft!.gear).toBeUndefined();
    for (const f of ['dawn', 'horde'] as FactionId[]) {
      const hero = Object.values(s.heroes).find((h) => h.faction === f)!;
      expect(gearOf(hero).map((a) => a.id)).toEqual([picked[f]]);
      expect(hero.spells).toHaveLength(2);
      expect(hero.spells!.every((id) => SPELLS[id].where === 'battle' && SPELLS[id].circle <= 2)).toBe(true);
    }
  });

  it('leaves the 3 on 3 arena as it was', () => {
    const s = createGame(arenaSetup(seats(), 4));
    expect(s.rules.arenaSize).toBeUndefined();
    expect(s.factions.dawn.supportsAlive).toHaveLength(3);
  });
});

describe('arena 6 on 6 artifact offers', () => {
  it('never offer an artifact that only works on the map', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = createGame(arenaSetup(seats('human', 'human'), seed, 'normal', 6));
      for (const id of s.draft!.gear!.offer) expect(worksInBattle(ARTIFACT_BY_ID[id])).toBe(true);
    }
  });
});
