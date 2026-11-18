// Teams (playing sides) and races. A TEAM owns the game state (gold, treasures, homes, a zone of the map); a RACE (FactionId) is the
// key of game data and graphics. A game has two to four teams (`setup.teams`, two by default); each team plays a race of its own choice
// (`setup.races`), by default the race of the same id ('third' and 'fourth' default to Przymierze and Horda).
import type { FactionId, TeamId } from './data';

/** The teams of a two-team game, in turn order (the default). */
export const TEAM_IDS: readonly TeamId[] = ['dawn', 'horde'];

/** Every team a game may have, in turn order; a game with n teams uses the first n. */
export const ALL_TEAM_IDS: readonly TeamId[] = ['dawn', 'horde', 'third', 'fourth'];

/** The most teams in a game. */
export const MAX_TEAMS = ALL_TEAM_IDS.length;

/** The race a team plays by default (when the setup names none). */
const DEFAULT_RACE: Record<TeamId, FactionId> = { dawn: 'dawn', horde: 'horde', third: 'dawn', fourth: 'horde' };

/** The race a team plays: read data tables (heroes, units, names, buildings) with this key, state with the team. */
export function raceOf(state: { setup: { races?: Partial<Record<TeamId, FactionId>> } }, team: TeamId): FactionId {
  return state.setup.races?.[team] ?? DEFAULT_RACE[team];
}

/** How many teams a setup has (2 to 4). */
export const teamCount = (setup: { teams?: number }): number => Math.max(2, Math.min(MAX_TEAMS, setup.teams ?? 2));

/** The teams playing this game, in turn order. */
export const teamsOf = (state: { setup: { teams?: number } }): readonly TeamId[] => ALL_TEAM_IDS.slice(0, teamCount(state.setup));

/** The rival of a team (two-team games only). */
export const rivalOf = (team: TeamId): TeamId => (team === 'dawn' ? 'horde' : 'dawn');

/** A record with an entry for each of the given teams (the type claims all four: only the playing teams are ever read). */
export function byTeam<T>(teams: readonly TeamId[], make: (team: TeamId) => T): Record<TeamId, T> {
  const out: Partial<Record<TeamId, T>> = {};
  for (const t of teams) out[t] = make(t);
  return out as Record<TeamId, T>;
}
