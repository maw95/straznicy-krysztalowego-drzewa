// @vitest-environment jsdom
// Fixes from the author's reports of 10.11.2026 (bug-reports/2026-11-10-*).
import { describe, expect, it } from 'vitest';
import { activeHero, createGame, hordeMayFightGuardian, moveAllowance, moveBreakdown } from '../src/engine/game';
import { ARTIFACT, battleStats, FACTION_HEROES, HP_SCALE, scaleText, STAT_SCALE } from '../src/engine/data';
import { battleAttack, breathSecondTarget, makeBattleUnit } from '../src/engine/battle';
import { battleFixture, setup } from './helpers/engine';
import { render } from '@testing-library/react';
import { CreditsDialog, MUSIC } from '../src/ui/CreditsDialog';
import assets from '../assets.json';

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

  it('the credits name every CC BY track of assets.json with its author', () => {
    const { container } = render(<CreditsDialog onClose={() => {}} />);
    const ccBy = (assets as { assets: Array<{ id: string; zrodlo?: string; licencja?: string }> }).assets.filter((a) => a.id.startsWith('muzyka/') && /CC BY/.test(a.licencja ?? ''));
    expect(ccBy.length).toBeGreaterThan(0);
    for (const a of ccBy) {
      const url = (a.zrodlo ?? '').match(/https:\/\/\S+/)?.[0];
      expect(MUSIC.some((t) => t.url === url), `${a.id}: ${url}`).toBe(true);
    }
    for (const t of MUSIC) expect(container.textContent).toContain(t.author);
  });

  it('Ognisty Oddech burns an ally standing behind the target in the digital ruleset only', () => {
    const line = (rules: Parameters<typeof setup>[1]) =>
      battleFixture(createGame(setup({}, rules)), [{ id: 'blackDragon', side: 'dawn', col: 4, half: 4 }, { id: 'caveSpider', side: 'horde', col: 4, half: 6 }, { id: 'nymph', side: 'dawn', col: 4, half: 8 }]);
    const board = line({});
    const digital = line({ ruleset: 'digital' });
    const b = (s: typeof board) => s.battle!;
    expect(breathSecondTarget(board, b(board).units.blackDragon, b(board).units.caveSpider)).toBeNull();
    expect(breathSecondTarget(digital, b(digital).units.blackDragon, b(digital).units.caveSpider)?.id).toBe('nymph');
    const hp = b(digital).units.nymph.hp;
    battleAttack(digital, 'caveSpider', true);
    expect(b(digital).units.nymph.hp).toBeLessThan(hp);
  });
});
