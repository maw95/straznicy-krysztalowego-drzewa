// Fixes from the author's reports of 10.11.2026 (bug-reports/2026-11-10-*).
import { describe, expect, it } from 'vitest';
import { activeHero, createGame, hordeMayFightGuardian, moveAllowance, moveBreakdown } from '../src/engine/game';
import { ARTIFACT } from '../src/engine/data';
import { setup } from './helpers/engine';

describe('reports of 10.11.2026', () => {
  it('the Horde may challenge a guardian in every goal but Kryształy (report 674974)', () => {
    const crystals = createGame(setup({}, { ruleset: 'digital' }));
    const control = createGame(setup({}, { ruleset: 'digital', objective: 'control' }));
    const guarded = Object.values(control.crystals).find((c) => c.guardian)!;
    expect(hordeMayFightGuardian(crystals, guarded.id)).toBe(false);
    expect(hordeMayFightGuardian(control, guarded.id)).toBe(true);
  });

  it('the move points of a turn are listed part by part and add up (reports 187493, 891393: a carried Artefakt costs one)', () => {
    const s = createGame(setup({}, { ruleset: 'digital', heroGrowth: true }));
    const hero = activeHero(s)!;
    hero.skills = ['pathfinder'];
    expect(moveBreakdown(s).map((p) => p.label)).toEqual(['podstawa', 'Leśny Tropiciel (umiejętność)']);
    expect(moveAllowance(s)).toBe(s.rules.heroMovePoints + 1);
    hero.crystals.push('artifact');
    expect(moveBreakdown(s).at(-1)).toEqual({ label: 'niesiony Artefakt', points: -ARTIFACT.carrierSlow });
    expect(moveAllowance(s)).toBe(s.rules.heroMovePoints + 1 - ARTIFACT.carrierSlow);
  });
});
