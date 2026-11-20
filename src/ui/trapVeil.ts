// The Free Companies at one screen: what stays out of sight while two people share it (the other one may be looking). Pure, so a test can run it on real games.
import { raceOf } from '../engine/teams';
import type { TeamId } from '../engine/data';
import type { GameState, Player } from '../engine/types';

/** Two or more people at this screen (not online) and one of them plays the Free Companies in a battle: even their own traps stay hidden until "Podejrzyj Sidła". */
export const trapSecrecyOn = (game: GameState | null | undefined, humans: readonly Pick<Player, 'faction'>[], online: boolean): boolean =>
  Boolean(!online && game?.battle && humans.length >= 2 && humans.some((p) => raceOf(game, p.faction) === 'free'));

/** The deployment of this side is covered by "pass the device" (it lays the Sidła). */
export const trapVeilFor = (game: GameState, side: TeamId): boolean => {
  const b = game.battle;
  return Boolean(b && b.stage === 'deploy' && b.needsDeploy[0] === side && raceOf(game, side) === 'free');
};

/** The state without the viewer's own hidden traps (the others' were already left out by `redactHidden`). */
export function hideOwnTraps(state: GameState, viewer: TeamId): GameState {
  const b = state.battle;
  if (!b?.ground?.some((g) => g.hidden && g.owner === viewer)) return state;
  return { ...state, battle: { ...b, ground: b.ground.filter((g) => !(g.hidden && g.owner === viewer)) } };
}
