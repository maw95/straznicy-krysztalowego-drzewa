import { EXTRA_HEROES, FACTION_HEROES, GUARDIANS, NEUTRAL_BOSSES, NEUTRAL_WEAK } from '../engine/data';
import { FACTION_PACKS, PLAYABLE_IDS } from '../engine/factions';
import { COMMANDERS } from '../engine/realm';

/**
 * The units of "Zasady i karty → Jednostki", divided by faction only: every finished faction (its heroes, the fourth one included, then the
 * commanders, then the supports from the lowest tier to the highest), the neutral units at the very end.
 */
export function ruleUnitSections(): Array<{ id: string; units: string[] }> {
  const factions = PLAYABLE_IDS.map((id) => {
    const p = FACTION_PACKS[id];
    // Tier by tier: the unit of the tier and its alternative stand together; the legend is the highest tier.
    const tiers = p.tierUnits.flatMap((u, i) => [u, p.altUnits[i]]);
    return { id: id as string, units: [...FACTION_HEROES[id], EXTRA_HEROES[id], ...Object.values(COMMANDERS[id]), ...p.supports, ...tiers, p.legend] };
  });
  const neutral = [...NEUTRAL_WEAK, ...GUARDIANS, ...NEUTRAL_BOSSES, 'tentacle'];
  return [...factions, { id: 'neutral', units: neutral }];
}
