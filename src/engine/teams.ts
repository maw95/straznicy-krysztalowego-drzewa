// Teams (playing sides) and races. A TEAM owns the game state (gold, treasures, homes, a zone of the map); a RACE (FactionId) is the
// key of game data and graphics. Today exactly two teams exist, 'dawn' and 'horde', and each plays the race of the same id.
import type { FactionId, TeamId } from './data';
import type { GameState } from './types';

/** The teams of a game, in turn order. */
export const TEAM_IDS: readonly TeamId[] = ['dawn', 'horde'];

/** The race a team plays: read data tables (heroes, units, names, buildings) with this key, state with the team. */
export function raceOf(state: { setup: { races?: Partial<Record<TeamId, FactionId>> } }, team: TeamId): FactionId {
  return state.setup.races?.[team] ?? team;
}

/** The teams playing this game. */
export const teamsOf = (_state: Pick<GameState, 'setup'>): readonly TeamId[] => TEAM_IDS;

/** The rival of a team (two-team games only). */
export const rivalOf = (team: TeamId): TeamId => (team === 'dawn' ? 'horde' : 'dawn');
