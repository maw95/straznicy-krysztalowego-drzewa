// Sides and factions. A SIDE (TeamId) is a faction: players who pick the same faction play one side (one team, one purse, one base, one part of the
// map), players who pick another faction play another side. A side owns the game state (gold, treasures, homes, a zone of the map); its faction
// is also the key of the game data and graphics (heroes, units, names, buildings), read with `raceOf`.
//
// Today two factions exist, 'dawn' (Przymierze) and 'horde' (Horda). 'third' and 'fourth' are PLACEHOLDERS for the next factions: the engine and the
// tests already play games with three and four sides, and until their packs exist they read the data of Przymierze and Horda (nothing offers them
// to players). Adding a faction means: its pack in src/engine/factions/, its id in place of a placeholder (data.ts: FactionId, TeamId), and the
// line below removed; nothing else assumes two sides.
import type { FactionId, TeamId } from './data';

/** The two sides of a game that has only the first two factions (the default; coop and the arena always have these two). */
export const TEAM_IDS: readonly TeamId[] = ['dawn', 'horde'];

/** Every side a game may have, in turn order (the order of the factions). */
export const ALL_TEAM_IDS: readonly TeamId[] = ['dawn', 'horde', 'third', 'fourth'];

/** The most sides in a game. */
export const MAX_TEAMS = ALL_TEAM_IDS.length;

/** The faction whose data a side reads: itself, except for the placeholders of factions that do not exist yet. */
const DATA_OF: Record<TeamId, FactionId> = { dawn: 'dawn', horde: 'horde', third: 'dawn', fourth: 'horde' };

/** The faction data of a side: read tables (heroes, units, names, buildings) with this key, state with the side. */
export const raceOf = (_state: unknown, team: TeamId): FactionId => DATA_OF[team];

/**
 * The sides playing a game, in turn order: Przymierze and Horda always (coop and the arena have nothing else), then every other faction
 * that has a seat in a rivalry.
 */
export const teamsOf = (state: { setup: { mode?: string; seats: Array<{ faction: TeamId }> } }): readonly TeamId[] =>
  state.setup.mode === 'pvp' ? ALL_TEAM_IDS.filter((t) => TEAM_IDS.includes(t) || state.setup.seats.some((s) => s.faction === t)) : TEAM_IDS;

/** The rival of a side (two-sided games only). */
export const rivalOf = (team: TeamId): TeamId => (team === 'dawn' ? 'horde' : 'dawn');

/** A record with an entry for each of the given sides (the type claims all of them: only the playing sides are ever read). */
export function byTeam<T>(teams: readonly TeamId[], make: (team: TeamId) => T): Record<TeamId, T> {
  const out: Partial<Record<TeamId, T>> = {};
  for (const t of teams) out[t] = make(t);
  return out as Record<TeamId, T>;
}
