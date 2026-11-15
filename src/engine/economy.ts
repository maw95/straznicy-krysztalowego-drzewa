// Level 4 "Księstwo" (digital, rule `economy`, built on level 3): wood, ore and Gwiezdny Pył next to gold. Wood and ore pay for buildings and their upgrades,
// gold for units, Gwiezdny Pył only for the rare things (a legendary artifact in the market, the second level of a building). One building a round per faction.
// Every number is provisional: the simulations tune them (docs/ZASADY_CYFROWE.md, "Poziom 4"). Data and pure helpers only; the rules live in kingdom.ts.

export type ResourceId = 'wood' | 'ore' | 'dust';
export type Resources = Record<ResourceId, number>;
/** A price: gold plus any resources. */
export interface Cost {
  gold: number;
  wood?: number;
  ore?: number;
  dust?: number;
}

export const RESOURCE_IDS: ResourceId[] = ['wood', 'ore', 'dust'];
export const RESOURCE_NAMES: Record<ResourceId, string> = { wood: 'drewno', ore: 'ruda', dust: 'Gwiezdny Pył' };
/** Name of the mine of each resource (a gold mine is the level 3 one). */
export const MINE_NAMES: Record<ResourceId | 'gold', string> = { gold: 'Kopalnia złota', wood: 'Tartak', ore: 'Kopalnia rudy', dust: 'Źródło Gwiezdnego Pyłu' };

export const ECONOMY = {
  /** Resources each faction starts with. */
  start: { wood: 3, ore: 0, dust: 0 } as Resources,
  /** Per round: from every settlement held, and from a mine of the resource. */
  incomeSettlement: { wood: 0, ore: 0, dust: 0 } as Resources,
  incomeMine: { wood: 1, ore: 1, dust: 1 } as Resources,
  /** Mines of each resource on the map, by map size (gold mines are KINGDOM.mines). */
  mines: {
    wood: { short: 1, medium: 2, long: 2, veryLong: 3, huge: 4, giant: 4 },
    ore: { short: 1, medium: 2, long: 2, veryLong: 3, huge: 4, giant: 4 },
    dust: { short: 1, medium: 1, long: 1, veryLong: 2, huge: 2, giant: 3 },
  } as Record<ResourceId, Record<string, number>>,
  /** Cost of each level of a building. */
  cost: {
    barracks: [{ gold: 3, wood: 2 }, { gold: 6, wood: 2, ore: 2, dust: 1 }],
    market: [{ gold: 3, wood: 2 }, { gold: 5, ore: 2, dust: 1 }],
    hospital: [{ gold: 3, wood: 2 }, { gold: 5, ore: 2, dust: 1 }],
    treasury: [{ gold: 4, ore: 2 }],
  } as Record<string, Cost[]>,
  /** Gwiezdny Pył a legendary artifact costs on top of its gold in the market. */
  legendaryDust: 1,
};

export const emptyResources = (): Resources => ({ wood: 0, ore: 0, dust: 0 });

/** The resources of a price, without gold (for lists and checks). */
export const resourcesOf = (c: Cost): Array<[ResourceId, number]> => RESOURCE_IDS.filter((r) => (c[r] ?? 0) > 0).map((r) => [r, c[r]!]);

/** Price as text, e.g. "6 zł · 2× drewno · 1× Pył". */
export const costText = (c: Cost): string => [`${c.gold} zł`, ...resourcesOf(c).map(([r, n]) => `${n}× ${{ wood: 'drewno', ore: 'ruda', dust: 'Pył' }[r]}`)].join(' · ');
