// Fixes from the author's reports of 10.11.2026 (bug-reports/2026-11-10-*).
import { describe, expect, it } from 'vitest';
import { activeHero, createGame, hordeMayFightGuardian, moveAllowance, moveBreakdown } from '../src/engine/game';
import { ARTIFACT, battleStats, FACTION_HEROES, HP_SCALE, scaleText, STAT_SCALE } from '../src/engine/data';
import { makeBattleUnit } from '../src/engine/battle';
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

  it('Życie has its own scale: no hero is finished by another hero in one plain blow, and texts are scaled by kind (report 674974)', () => {
    expect(HP_SCALE).toBeGreaterThan(STAT_SCALE);
    const s = createGame(setup({}, { ruleset: 'digital', heroGrowth: true }));
    expect([s.rules.statScale, s.rules.hpScale]).toEqual([STAT_SCALE, HP_SCALE]);
    const heroes = [...FACTION_HEROES.dawn, ...FACTION_HEROES.horde];
    const u = makeBattleUnit('goldDragon', 'dawn', true, STAT_SCALE, HP_SCALE);
    expect(u.hp).toBe(battleStats('goldDragon', true, 1).hp * HP_SCALE);
    expect(battleStats('goldDragon', true, STAT_SCALE, HP_SCALE).attack).toBe(battleStats('goldDragon', true, 1).attack * STAT_SCALE);
    // The strongest blow of the hardest hitter (with a generous ability bonus) still leaves the most brittle hero standing.
    const hits = (a: string, d: string) => Math.ceil(battleStats(d, true, 1).hp * HP_SCALE / ((battleStats(a, true, 1).attack + 3) * STAT_SCALE));
    for (const a of heroes) for (const d of heroes) if (a !== d) expect(hits(a, d)).toBeGreaterThanOrEqual(2);
    expect(scaleText('+2 Ż, +2 A, ignoruje 2 obrażenia, usuwa do 3 punktów obrażeń', 3, 5)).toBe('+10 Ż, +6 A, ignoruje 6 obrażenia, usuwa do 15 punktów obrażeń');
    expect(scaleText('+2 A', 3)).toBe('+6 A');
  });
});
