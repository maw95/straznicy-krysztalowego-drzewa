// The game log, shared by the adventure and the battle code.

import type { TeamId } from './data';
import type { GameState, LogEvent, LogKind } from './types';

export function log(state: GameState, kind: LogKind, text: string, privateTo?: TeamId, event?: LogEvent) {
  state.log.push({ round: state.round, kind, text, ...(privateTo ? { privateTo } : {}), ...(event ? { event } : {}) });
}
