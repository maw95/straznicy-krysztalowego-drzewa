// The story campaign (src/engine/campaign.ts): complete data, valid maps and story notes, a game that can be created and played to its end for every scenario.

import { describe, expect, it } from 'vitest';
import { CAMPAIGNS, campaignById, nextScenario, scenarioOf, scenarioSetup } from '../src/engine/campaign';
import { CUSTOM_MAPS, readyMaps, validateCustomMap } from '../src/engine/customMaps';
import { createGame } from '../src/engine/game';
import { UNITS } from '../src/engine/data';
import { playOut } from './helpers/engine';
import { describeSave } from '../src/ui/saves';
import { expeditionSetup, newRun } from '../src/engine/expedition';

describe.each(CAMPAIGNS)('campaign $id', (campaign) => {
  it('has a name, scenarios with unique ids and an ending', () => {
    expect(campaign.name.length).toBeGreaterThan(3);
    expect(campaign.scenarios.length).toBeGreaterThanOrEqual(3);
    const ids = campaign.scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(campaign.ending.length).toBeGreaterThan(0);
  });

  describe.each(campaign.scenarios)('scenario $id', (scenario) => {
    it('is told: title, line, intro, a win and a loss', () => {
      for (const t of [scenario.title, scenario.tagline, ...scenario.intro, ...scenario.win, ...scenario.lose]) expect(t.trim().length, t).toBeGreaterThan(10);
      expect(UNITS[scenario.hero]?.kind).toBe('hero');
      expect(UNITS[scenario.hero].side).toBe('dawn');
    });

    it('has a valid map of its own, registered for the engine and kept off the lists of the wizard', () => {
      expect(() => validateCustomMap(scenario.map)).not.toThrow();
      expect(CUSTOM_MAPS[scenario.map.id]).toBe(scenario.map);
      expect(scenario.map.campaign).toBe(true);
      expect(readyMaps().some((m) => m.id === scenario.map.id)).toBe(false);
      expect((scenario.map.story ?? []).length).toBeGreaterThanOrEqual(1);
    });

    it('makes the set-up of an ordinary digital game on its map: the player against the Horde bot, marked with the scenario', () => {
      const setup = scenarioSetup(campaign, scenario, 7);
      expect(setup.mode).toBe('pvp');
      expect(setup.mapShape).toBe('custom');
      expect(setup.customMapId).toBe(scenario.map.id);
      expect(setup.rules.ruleset).toBe('digital');
      expect(setup.seats).toHaveLength(2);
      expect(setup.seats[0]).toMatchObject({ faction: 'dawn', controller: 'human', heroId: scenario.hero });
      expect(setup.seats[1]).toMatchObject({ faction: 'horde', controller: 'bot' });
      expect(setup.campaign).toEqual({ id: campaign.id, scenario: scenario.id });
      expect(scenarioOf(setup)).toEqual({ campaign, scenario });
      if (scenario.objective !== 'crystals') expect(setup.rules.objective).toBe(scenario.objective);
      expect(Boolean(setup.rules.heroGrowth)).toBe(scenario.tier !== 'adventure');
    });

    it('opens its story on the first round and plays to an end with bots on both sides', () => {
      for (const seed of [1, 2, 3]) {
        const s = createGame(scenarioSetup(campaign, scenario, seed));
        expect(s.phase).toBe('adventure');
        const end = playOut(s, 5000);
        expect(end.phase, `seed ${seed}`).toBe('over');
        expect(end.storyFired?.some((id) => scenario.map.story!.some((n) => n.id === id))).toBe(true);
      }
    });
  });
});

describe('the campaign list', () => {
  it('finds a campaign and the next scenario, and ends after the last', () => {
    const c = campaignById('swit')!;
    expect(c).toBeDefined();
    expect(nextScenario(c, c.scenarios[0])).toBe(c.scenarios[1]);
    expect(nextScenario(c, c.scenarios[c.scenarios.length - 1])).toBeNull();
    expect(campaignById('nie-ma')).toBeUndefined();
    expect(scenarioOf({})).toBeNull();
  });
});

describe('labels of saved games', () => {
  it('names the scenario of a campaign save and the stage of an Expedition save', () => {
    const campaign = CAMPAIGNS[0];
    const scenario = campaign.scenarios[0];
    expect(describeSave({ setup: scenarioSetup(campaign, scenario, 5), actions: [] })).toContain(`Kampania: ${scenario.title}`);
    expect(describeSave({ setup: expeditionSetup(newRun(7, 'goldDragon')), actions: [] })).toContain('Ekspedycja: etap 1');
  });
});
