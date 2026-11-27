// The warning that the round limit is near: the round track, the round counters and a sound at the start of a player's turn.

/** `soon`: two or three rounds left, the current one included; `last`: this is the last round. */
export type RoundWarning = 'soon' | 'last';

/** How many rounds before the end (the current one included) the warning starts. */
export const WARN_ROUNDS = 3;

export function roundWarning(round: number, limit: number): { level: RoundWarning; text: string; color: string } | null {
  const left = limit - round + 1;
  if (left > WARN_ROUNDS) return null;
  if (left <= 1) return { level: 'last', text: 'Ostatnia runda!', color: '#FF6A55' };
  return { level: 'soon', text: left === 2 ? 'Zostały 2 rundy' : 'Zostały 3 rundy', color: '#FFB43A' };
}

/** The sound that goes with the first turn of a round: a bell when three rounds are left, a sombre horn in the last one. */
export function roundWarningSound(round: number, limit: number): 'clans_stun' | 'defeat' | null {
  const left = limit - round + 1;
  return left === WARN_ROUNDS ? 'clans_stun' : left === 1 ? 'defeat' : null;
}
