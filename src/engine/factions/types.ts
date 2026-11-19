// The pack of a faction: everything the engine and the screens know about it in one place (backlog: new factions, phase 2). A new faction is a new file
// like dawn.ts or horde.ts, added to the registry in index.ts; tests/factionContract.test.ts checks that a pack is complete.
export interface FactionPack {
  id: string;
  /** The name shown to the player. */
  name: string;
  /** The three heroes (ids of UNITS). */
  heroes: string[];
  /** The three supports the faction starts with in the levels without recruiting (tier 1). */
  supports: string[];
  /** Units recruited at tiers 2-5, and the second unit of each of those tiers (level 6: one dwelling per tier shuts the other out). */
  tierUnits: string[];
  altUnits: string[];
  /** The legendary unit of level 6. */
  legend: string;
  /** The faction's mechanic (a name and the building that gives it), and all the buildings only it has (the mechanic's first). */
  mechanic: { name: string; building: string };
  buildings: string[];
  /** The building of the Primal Spark (level 6). */
  sparkName: string;
  /** The name in the logs: short, in the genitive ("on the land of ..."), and the verb of a lead ("... dłużej miało/miała/miały przewagę"). */
  short: string;
  genitive: string;
  lead: string;
  /** The terrain of the faction's land on the map: the base, the ordinary ground (also what a blocked hex is cleared to), the treasure hexes and the wall of the custom maps. */
  terrain: { base: string; land: string; treasure: string; wall: string };
  /** The ordinary and obstacle tiles of the faction's half of the map (the tile deck: 5 ordinary and 2 obstacles, every one equally likely). */
  tiles: string[];
  /** Names of the settlements the faction's land is given (drawn per game). */
  settlementNames: string[];
}
