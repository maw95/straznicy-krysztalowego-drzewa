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
    treasury: [{ gold: 4, ore: 2 }, { gold: 6, ore: 2, dust: 1 }],
    forge: [{ gold: 4, ore: 3 }, { gold: 6, ore: 3, dust: 2 }],
    walls: [{ gold: 4, wood: 3 }, { gold: 6, ore: 4, dust: 1 }],
    tavern: [{ gold: 5, wood: 3 }],
    magic: [{ gold: 5, ore: 2, dust: 1 }, { gold: 8, ore: 3, dust: 3 }, { gold: 11, ore: 4, dust: 4 }],
    // Level 6, the buildings of one faction each (docs/BUDYNKI.md 0). Kapliczka Świtu and Jama Krwi are the mechanics of the factions (four levels).
    shrine: [{ gold: 3, wood: 2, dust: 1 }, { gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
    bloodPit: [{ gold: 3, wood: 2, dust: 1 }, { gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
    nursery: [{ gold: 3, wood: 2 }, { gold: 5, ore: 2, dust: 1 }],
    grove: [{ gold: 5, dust: 2 }],
    plunder: [{ gold: 4, ore: 2 }],
    wolfDen: [{ gold: 4, wood: 3 }],
    hoofStone: [{ gold: 3, wood: 2, dust: 1 }, { gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
    pastures: [{ gold: 4, wood: 2 }, { gold: 6, ore: 2, dust: 1 }],
    refuge: [{ gold: 5, wood: 2, dust: 1 }],
    barrow: [{ gold: 3, wood: 2, dust: 1 }, { gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
    ossuary: [{ gold: 4, wood: 2 }, { gold: 6, ore: 2, dust: 1 }],
    bellTower: [{ gold: 4, ore: 2 }],
    shieldHall: [{ gold: 3, wood: 2, dust: 1 }, { gold: 4, dust: 2 }, { gold: 6, dust: 3 }, { gold: 8, dust: 5 }],
    runeForge: [{ gold: 4, ore: 3 }, { gold: 6, ore: 3, dust: 2 }],
    deepMine: [{ gold: 4, wood: 2 }, { gold: 6, ore: 2, dust: 1 }],
  } as Record<string, Cost[]>,
  /** The forge (Kuźnia): the faction's supports fight with this much more Atak (level 1) and Życie (level 2), in the board game's scale. */
  forgeAttack: 1,
  forgeHp: 1,
  /** Exchange in an own settlement: gold for one unit of a resource, by the level of the market there (none, market, big market). */
  tradeBuy: { wood: [4, 3, 2], ore: [4, 3, 2], dust: [10, 8, 6] } as Record<ResourceId, number[]>,
  /** Gold for one unit of a resource sold (a market is needed). */
  tradeSell: { wood: 1, ore: 1, dust: 3 } as Resources,
  /** Huts with a quest on the map, by map size. */
  huts: { short: 1, medium: 2, long: 3, veryLong: 4, huge: 5, giant: 6 } as Record<string, number>,
  /** What a quest is worth, in gold: a reward is worth this much more than what the hut asks for. */
  hutProfit: 1.5,
  /** Gold value of the things a hut deals in. */
  value: { gold: 1, wood: 1.5, ore: 1.5, dust: 4, xp: 2, artifact: 6 },
  /** Gwiezdny Pył a legendary artifact costs on top of its gold in the market. */
  legendaryDust: 1,
};

/** Level 4: the map's own objects. A mill pays gold again and again, a well gives the hero more movement once a round, a store gives resources once. */
export type ObjectKind = 'mill' | 'well' | 'store';
export interface MapObject {
  kind: ObjectKind;
  /** A store: what it holds. */
  res?: ResourceId;
  amount?: number;
  /** The round it was last used in (a mill, a well). */
  used?: number;
  /** A store already emptied. */
  done?: boolean;
}
export const OBJECT_NAMES: Record<ObjectKind, string> = { mill: 'Młyn', well: 'Studnia Wędrowców', store: 'Leśna składnica' };
export const OBJECTS = {
  /** Objects on the map by map size; the kinds go round in this order. */
  count: { short: 1, medium: 2, long: 3, veryLong: 4, huge: 5, giant: 6 } as Record<string, number>,
  order: ['mill', 'store', 'well'] as ObjectKind[],
  /** The mill pays this much gold to whoever steps in, then grinds for this many rounds. */
  millGold: 2,
  millRounds: 3,
  /** The well gives the hero this many movement points, once a round. */
  wellMove: 2,
  /** What a store holds. */
  store: { wood: 3, ore: 3, dust: 1 } as Resources,
};

/** Whether the object has something to give in this round. */
export const objectReady = (o: MapObject, round: number): boolean =>
  o.kind === 'store' ? !o.done : o.kind === 'mill' ? o.used === undefined || round - o.used >= OBJECTS.millRounds : o.used !== round;

/** Level 4: the defence of a settlement. Columns are those of the wide arena (the defender deploys in the last ones). */
export const SIEGE = {
  /** Supports a settlement's garrison holds at most. */
  garrisonMax: 3,
  moatColumn: 8,
  wallColumn: 9,
  /** Rows of the gate (and of the bridge over the moat) and of the two towers. */
  gateRow: 4,
  towerRows: [1, 7],
  /** Damage of the moat and of one tower's shot, in the board game's scale. */
  moatDamage: 2,
  towerDamage: 1,
  /** Catapult hits the gate takes (a wall segment and a tower fall with one). */
  gateHits: 2,
};

export const emptyResources = (): Resources => ({ wood: 0, ore: 0, dust: 0 });

/** The resources of a price, without gold (for lists and checks). */
export const resourcesOf = (c: Cost): Array<[ResourceId, number]> => RESOURCE_IDS.filter((r) => (c[r] ?? 0) > 0).map((r) => [r, c[r]!]);

/** Price as text, e.g. "6 zł · 2× drewno · 1× Pył". */
export const costText = (c: Cost): string => [`${c.gold} zł`, ...resourcesOf(c).map(([r, n]) => `${n}× ${{ wood: 'drewno', ore: 'ruda', dust: 'Pył' }[r]}`)].join(' · ');

/** What a hut asks for (artifact: any artifact from the hero's backpack) and what it gives; the hut is used up once. */
export interface Hut {
  want: { gold?: number; wood?: number; ore?: number; dust?: number; artifact?: boolean };
  reward: { gold?: number; wood?: number; ore?: number; dust?: number; xp?: number; artifact?: boolean };
  done: boolean;
}

const THING_NAMES = { gold: 'zł', wood: 'drewno', ore: 'ruda', dust: 'Gwiezdny Pył', xp: 'PD', artifact: 'artefakt' } as const;
/** "4 zł, 2× ruda, artefakt" for a want or a reward. */
export const thingsText = (t: Hut['want'] | Hut['reward']): string =>
  (Object.entries(t) as Array<[keyof typeof THING_NAMES, number | boolean]>)
    .filter(([, v]) => v)
    .map(([k, v]) => (k === 'artifact' ? 'artefakt' : k === 'gold' ? `${v} zł` : k === 'xp' ? `${v} PD` : `${v}× ${THING_NAMES[k]}`))
    .join(', ');
