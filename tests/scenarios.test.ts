// Backlog 98: the ready scenarios start a game on their map with their goal, size and level, and the bots play each one through.

import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/engine/ai';
import { CUSTOM_MAPS, validateCustomMap } from '../src/engine/customMaps';
import { applyActionInPlace, createGame } from '../src/engine/game';
import { resolveTier, withRuleset } from '../src/engine/presets';
import { SCENARIOS, type Scenario } from '../src/engine/scenarios';
import { levelSettings, type SetupOptions } from '../src/engine/types';

export function scenarioSetup(sc: Scenario, seed: number): SetupOptions {
  const base = levelSettings('normal', 'pvp');
  const r = resolveTier(sc.tier, { objective: sc.objective, shape: 'custom', customMapId: sc.mapId, growth: true });
  const setup: SetupOptions = {
    mode: 'pvp',
    mapSize: sc.mapSize,
    battleMode: base.battleMode,
    seed,
    seatLevels: true,
    seats: [
      { name: 'A', faction: 'dawn', controller: 'bot', heroId: 'goldDragon', botLevel: 'normal' },
      { name: 'B', faction: 'horde', controller: 'bot', heroId: 'werewolfLord', botLevel: 'normal' },
    ],
    rules: base.rules,
  };
  return withRuleset(setup, true, r.objective, r.shape, r.customMapId, r.growth, r.kingdom, r.economy, r.realm, r.empire);
}

describe('ready scenarios', () => {
  it('have valid maps of their own, distinct ids and a description', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(12);
    for (const s of SCENARIOS) {
      const map = CUSTOM_MAPS[s.mapId];
      expect(map, s.id).toBeDefined();
      expect(() => validateCustomMap(map)).not.toThrow();
      expect(s.description.length).toBeGreaterThan(40);
    }
  });

  for (const sc of SCENARIOS) {
    it(`${sc.id}: the bots play the game to its end`, () => {
      for (const seed of [1, 2]) {
        const s = createGame(scenarioSetup(sc, seed));
        expect(s.setup.customMapId).toBe(sc.mapId);
        expect(s.rules.objective ?? 'crystals').toBe(sc.objective);
        for (let i = 0; i < 60000 && s.phase !== 'over'; i++) {
          const a = chooseAction(s);
          if (!a) break;
          applyActionInPlace(s, a);
        }
        expect(s.phase, `${sc.id} seed ${seed}`).toBe('over');
      }
    }, 60000);
  }
});
