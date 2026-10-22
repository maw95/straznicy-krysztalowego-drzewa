// Arena: one 3-on-3 battle, supports chosen and two treasures drafted per side from a shared deck.
import { describe, expect, it } from 'vitest';
import { ARENA_DECK, ITEMS, type FactionId } from '../src/engine/data';
import { chooseAction } from '../src/engine/ai';
import { applyAction, createGame, currentActor } from '../src/engine/game';
import { arenaSetup, type GameState, type Level, type SeatSetup } from '../src/engine/types';

const seats = (dawn: SeatSetup['controller'] = 'bot', horde: SeatSetup['controller'] = 'bot'): SeatSetup[] => [
  { name: 'A', faction: 'dawn', controller: dawn, heroId: 'unicornKing' },
  { name: 'B', faction: 'horde', controller: horde, heroId: 'werewolfLord' },
];

/** Plays bot actions until the draft starts. */
function toDraft(seed: number, level: Level = 'normal') {
  let s = createGame(arenaSetup(seats(), seed, level));
  while (s.battle?.stage === 'select') s = applyAction(s, chooseAction(s)!);
  return s;
}

function playOut(s: GameState) {
  for (let i = 0; i < 3000 && s.phase !== 'over'; i++) s = applyAction(s, chooseAction(s)!);
  return s;
}

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
      const s = playOut(createGame(arenaSetup(seats(), seed)));
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
    const useless = ['horn', 'hourglass', 'courage_horn', 'teleport'];
    expect(picks('hard').some((k) => useless.includes(k))).toBe(false);
    expect(picks('kids').some((k) => useless.includes(k))).toBe(true);
  });
});
