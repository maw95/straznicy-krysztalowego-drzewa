// The registry of factions: the order is the order of the screens. Everything that was once a table keyed by 'dawn' | 'horde' (heroes, supports, names, the units
// of the tiers, the buildings, the Spark) is read from here.
import { DAWN } from './dawn';
import { HERDS } from './herds';
import { UNDEAD } from './undead';
import { CLANS } from './clans';
import { FROST } from './frost';
import { FREE } from './free';
import { SANDS } from './sands';
import { SWARM } from './swarm';
import { TIDES } from './tides';
import { HORDE } from './horde';
import type { Terrain } from '../data';
import type { FactionPack } from './types';

export type { FactionPack };

export const FACTION_PACKS = { dawn: DAWN, horde: HORDE, herds: HERDS, undead: UNDEAD, clans: CLANS, frost: FROST, free: FREE, sands: SANDS, swarm: SWARM, tides: TIDES } as const;
export type PackId = keyof typeof FACTION_PACKS;
export const PACK_IDS = Object.keys(FACTION_PACKS) as PackId[];

/** A table over the factions, built from the packs: `byPack((p) => p.heroes)`. */
export const byPack = <T>(pick: (p: FactionPack) => T): Record<PackId, T> => Object.fromEntries(PACK_IDS.map((id) => [id, pick(FACTION_PACKS[id])])) as Record<PackId, T>;

/** The terrain of a faction's land on the map (base, ordinary ground, treasure hexes, the wall of custom maps). */
export const terrainOf = (id: PackId): Record<keyof FactionPack['terrain'], Terrain> => FACTION_PACKS[id].terrain as Record<keyof FactionPack['terrain'], Terrain>;
