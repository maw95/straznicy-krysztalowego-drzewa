// The Free Companies and the Desert Empire at one screen: what stays out of sight while two people share it (the other one may be looking): the traps of the
// Companies, the mirages and the buried Queen of the Empire. Pure, so a test can run it on real games.
import { raceOf } from '../engine/teams';
import { disguiseMirages } from '../engine/hidden';
import type { TeamId } from '../engine/data';
import type { GameState, Player } from '../engine/types';

/** The factions with something hidden that even their own player keeps from the other one at a shared screen. */
const SECRET_RACES = ['free', 'sands'];

/** Two or more people at this screen (not online) and one of them plays the Free Companies or the Desert Empire in a battle: even their own secrets stay hidden until "Podejrzyj". */
export const trapSecrecyOn = (game: GameState | null | undefined, humans: readonly Pick<Player, 'faction'>[], online: boolean): boolean =>
  Boolean(!online && game?.battle && humans.length >= 2 && humans.some((p) => SECRET_RACES.includes(raceOf(game, p.faction))));

/** The deployment of this side is covered by "pass the device" (it lays the Sidła, or places its mirages and the buried Queen). */
export const trapVeilFor = (game: GameState, side: TeamId): boolean => {
  const b = game.battle;
  return Boolean(b && b.stage === 'deploy' && b.needsDeploy[0] === side && SECRET_RACES.includes(raceOf(game, side)));
};

/** The state without the viewer's own hidden traps and with its own mirages dressed as their units (the others' were already hidden by `redactHidden`). */
export function hideOwnTraps(state: GameState, viewer: TeamId): GameState {
  let b = state.battle;
  if (!b) return state;
  if (b.ground?.some((g) => g.hidden && g.owner === viewer)) b = { ...b, ground: b.ground.filter((g) => !(g.hidden && g.owner === viewer)) };
  if (Object.values(b.units).some((u) => u.status.mirage)) b = disguiseMirages(b, [], false);
  return b === state.battle ? state : { ...state, battle: b };
}
