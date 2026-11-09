// The game log, shared by the adventure and the battle code.

import type { FactionId } from './data';
import type { GameState, LogEvent, LogKind } from './types';

export function log(state: GameState, kind: LogKind, text: string, privateTo?: FactionId, event?: LogEvent) {
  state.log.push({ round: state.round, kind, text, ...(privateTo ? { privateTo } : {}), ...(event ? { event } : {}) });
}
