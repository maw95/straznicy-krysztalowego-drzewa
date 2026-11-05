// What a game is played for. Each objective is a module with the same hooks, so the adventure code asks the objective instead of
// knowing the rules of one goal: set it up, check for a win, close a round, close the game at the round limit, and describe the
// progress for the screen. 'crystals' is the board game's goal (carry the crystals to the Tree, the Horde's ritual); the
// others belong to the digital ruleset. Result of a game under 'crystals' must never change (tests/golden.test.ts).

import type { FactionId } from './data';
import { finish, ritualFormed } from './game';
import { log } from './log';
import type { GameState, ObjectiveId } from './types';

/** One line of the progress panel: what, how far, and whose it is (for the colour). */
export interface ProgressLine {
  label: string;
  value: string;
  tone?: FactionId | 'warn';
}

export interface Objective {
  id: ObjectiveId;
  /** Name for the setup screen and the rules. */
  name: string;
  /** One sentence for the setup screen tooltip. */
  summary: string;
  /** Called once when the game is created (the map and the crystals are in place). */
  init(state: GameState): void;
  /** Called after every step that could end the game: the objective may finish it. */
  checkVictory(state: GameState): void;
  /** Called when every hero has had its turn of the round. True when the game ended. */
  onRoundEnd(state: GameState): boolean;
  /** Called at the end of the last round instead of starting a new one. */
  onRoundLimit(state: GameState): void;
  /** The state of the goal, for the screen. */
  progress(state: GameState): ProgressLine[];
}

export const objectiveOf = (state: Pick<GameState, 'rules'>): ObjectiveId => state.rules.objective ?? 'crystals';

const crystals: Objective = {
  id: 'crystals',
  name: 'Kryształy do Drzewa',
  summary: 'Cel planszówki: Przymierze zanosi wszystkie kryształy do Kryształowego Drzewa, a Horda przerywa je rytuałem przy Drzewie.',
  init() {},
  checkVictory(state) {
    if (state.factions.dawn.delivered >= state.crystalsNeeded) finish(state, 'dawn', 'Wszystkie kryształy wróciły do Drzewa.');
  },
  onRoundEnd(state) {
    if (ritualFormed(state)) {
      state.ritual += 1;
      log(state, 'round', `Rytuał przy Drzewie trwa (${state.ritual}/${state.rules.ritualRounds}).`);
      if (state.ritual >= state.rules.ritualRounds) {
        finish(state, 'horde', 'Mroczna Horda ukończyła rytuał przy Drzewie.');
        return true;
      }
    } else if (state.ritual) {
      state.ritual = 0;
      log(state, 'round', 'Rytuał został przerwany.');
    }
    return false;
  },
  onRoundLimit(state) {
    finish(state, 'horde', 'Upłynął limit rund.');
  },
  progress(state) {
    const lines: ProgressLine[] = [{ label: 'Kryształy przy Drzewie', value: `${state.factions.dawn.delivered} / ${state.crystalsNeeded}`, tone: 'dawn' }];
    if (state.ritual > 0) lines.push({ label: 'Rytuał przy Drzewie', value: `${state.ritual}/${state.rules.ritualRounds}`, tone: 'horde' });
    return lines;
  },
};

export const OBJECTIVES: Record<ObjectiveId, Objective> = { crystals, control: crystals };
