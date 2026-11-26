// The game log, shared by the adventure and the battle code.

import type { TeamId } from './data';
import { fogOn } from './hidden';
import type { GameState, LogEvent, LogKind } from './types';

/** Lines everybody reads under the fog of war too: the rounds (with the goal's progress told there) and the end of the game. */
const PUBLIC_KINDS: ReadonlySet<LogKind> = new Set(['round', 'victory']);

/** The factions a line is about under the fog of war: the sides of the battle being fought, else the faction whose turn it is. */
function partiesNow(state: GameState): TeamId[] | undefined {
  const b = state.battle;
  if (b) return [...new Set([b.attacker, b.defender].filter((s): s is TeamId => s !== 'neutral'))];
  const id = state.turnOrder[state.turnIndex];
  const hero = id ? state.heroes[id] : null;
  return hero ? [hero.faction] : undefined;
}

function push(state: GameState, kind: LogKind, text: string, privateTo: TeamId | undefined, event: LogEvent | undefined, by: TeamId[] | undefined) {
  state.log.push({ round: state.round, kind, text, ...(privateTo ? { privateTo } : {}), ...(event ? { event } : {}), ...(by?.length ? { by } : {}) });
}

/**
 * A line of the log. Under the fog of war (the digital edition) it belongs to the factions it is about (`LogEntry.by`: the sides of the battle, else the
 * faction whose turn it is), so a player reads its own moves and finds, the battles it fought and what everybody reads (`logPublic`).
 */
export function log(state: GameState, kind: LogKind, text: string, privateTo?: TeamId, event?: LogEvent) {
  push(state, kind, text, privateTo, event, fogOn(state) && !PUBLIC_KINDS.has(kind) ? partiesNow(state) : undefined);
}

/** A line everybody reads under the fog of war too (the goal's progress). */
export function logPublic(state: GameState, kind: LogKind, text: string, event?: LogEvent) {
  push(state, kind, text, undefined, event, undefined);
}

/** A line for the given factions under the fog of war (an attack, before the battle has begun: the attacker and the attacked). */
export function logFor(state: GameState, kind: LogKind, text: string, by: TeamId[]) {
  push(state, kind, text, undefined, undefined, fogOn(state) ? [...new Set(by)].sort() : undefined);
}

/** Whether a line may be shown to the sides in `viewers` (null: a spectator or a game of bots, who read everything but the private draws). */
export function logVisibleTo(entry: { privateTo?: TeamId; by?: TeamId[] }, viewers: readonly TeamId[] | null): boolean {
  if (entry.privateTo && !viewers?.includes(entry.privateTo)) return false;
  return !entry.by || !viewers?.length || entry.by.some((f) => viewers.includes(f));
}
