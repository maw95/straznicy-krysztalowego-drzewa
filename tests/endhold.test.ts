import { describe, expect, it } from 'vitest';
import { cellsOf } from '../src/engine/battle';
import { chooseAction } from '../src/engine/ai';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { arenaSetup, type GameState } from '../src/engine/types';
import { finalView } from '../src/ui/useEndHold';

describe('finalView (the finished battle held on screen)', () => {
  it('shows the units felled by the last blow as corpses where they fell, the battle over', () => {
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const o = arenaSetup(
        [
          { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon' },
          { name: 'B', faction: 'horde', controller: 'bot', heroId: 'werewolfLord' },
        ],
        seed,
      );
      const s: GameState = createGame({ ...o, rules: { ...o.rules, ruleset: 'digital' } });
      let before = structuredClone(s);
      while (s.phase !== 'over') {
        before = structuredClone(s);
        applyActionInPlace(s, chooseAction(s)!);
      }
      const view = finalView(before, s.lastBattle!);
      const b = view.battle!;
      expect(b.stage).toBe('over');
      expect(b.winner).toBe(s.lastBattle!.winner);
      const dead = Object.values(b.units).filter((u) => !u.alive && !u.swappedOut);
      const report = s.lastBattle!.units.filter((u) => !u.alive);
      expect(dead.length).toBe(report.length);
      for (const u of dead) {
        expect(cellsOf(u)).toEqual([]);
        expect(u.corpse).toBeTruthy();
      }
      // The held view is a copy: the state it came from is untouched.
      expect(before.battle!.stage).toBe('fight');
      checked++;
    }
    expect(checked).toBe(12);
  });
});
