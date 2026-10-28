// The game log, shared by the adventure and the battle code.

import type { FactionId } from './data';
import type { GameState, LogKind } from './types';

export function log(state: GameState, kind: LogKind, text: string, privateTo?: FactionId) {
  state.log.push({ round: state.round, kind, text, ...(privateTo ? { privateTo } : {}) });
}
