// Sides and factions. A SIDE (TeamId) is a faction: players who pick the same faction play one side (one team, one purse, one base, one part of the
// map), players who pick another faction play another side. A side owns the game state (gold, treasures, homes, a zone of the map); its faction
// is also the key of the game data and graphics (heroes, units, names, buildings), read with `raceOf`.
//
// A side is a SLOT of the table (dawn, horde, third, fourth); the faction it plays is the `race` of the seats that sit in it (SeatSetup.race, `assignSlots`
// fills the slots: the first two factions at a table take dawn and horde, whatever they are). Seats without a race are the old settings: a side then
// reads the data of its own id ('third' and 'fourth' read Przymierze and Horda). Adding a faction means: its pack in src/engine/factions/ and the
// tables the compiler then asks for; nothing else assumes which faction is on a side.
import { FACTION_NAMES, type FactionId, type Side, type TeamId } from './data';

/** The two sides of a game that has only the first two factions (the default; coop and the arena always have these two). */
export const TEAM_IDS: readonly TeamId[] = ['dawn', 'horde'];

/** Every side a game may have, in turn order (the order of the factions). */
export const ALL_TEAM_IDS: readonly TeamId[] = ['dawn', 'horde', 'third', 'fourth'];

/** The most sides in a game. */
export const MAX_TEAMS = ALL_TEAM_IDS.length;

/** The faction whose data a placeholder side reads when no seat names a race (the old settings: a side is the faction of its own id). */
const DATA_OF: Record<TeamId, FactionId> = { dawn: 'dawn', horde: 'horde', third: 'dawn', fourth: 'horde' };

/** What `raceOf` and `teamsOf` read of a game: its setup. */
type SetupLike = { setup?: { mode?: string; seats: Array<{ faction: TeamId; race?: FactionId }> } } | null | undefined;

/**
 * The faction data of a side: read tables (heroes, units, names, buildings) with this key, state with the side. A seat of the side that names a `race`
 * decides it; without one (old settings, the arena, coop, online) the side reads its own faction's data.
 */
export const raceOf = (state: SetupLike | unknown, team: TeamId): FactionId => {
  const seats = (state as SetupLike)?.setup?.seats;
  if (seats) for (const s of seats) if (s.faction === team && s.race) return s.race;
  return DATA_OF[team];
};

/**
 * Gives the factions at a table their sides: the first two different factions take the slots 'dawn' and 'horde' (whatever they are), the next ones
 * 'third' and 'fourth'; seats of one faction share a side. Returns the slot of every seat, in the order of the seats.
 */
export function assignSlots(races: readonly FactionId[]): TeamId[] {
  const order: FactionId[] = [];
  for (const r of races) if (!order.includes(r)) order.push(r);
  if (order.length > MAX_TEAMS) throw new Error(`Przy stole może być najwyżej ${MAX_TEAMS} frakcji.`);
  return races.map((r) => ALL_TEAM_IDS[order.indexOf(r)]);
}

/** True when the game names the race of its seats (a table made with `assignSlots`) instead of the old slots that are themselves the factions. */
export const hasRaces = (state: { setup: { seats: Array<{ race?: FactionId }> } }): boolean => state.setup.seats.some((s) => s.race !== undefined);

/**
 * The sides playing a game, in turn order. Przymierze and Horda always (coop and the arena have nothing else), then every other faction that has a
 * seat in a rivalry. A table that names the races has exactly the sides its seats use (the first two factions may be any two).
 */
export const teamsOf = (state: { setup: { mode?: string; seats: Array<{ faction: TeamId; race?: FactionId }> } }): readonly TeamId[] => {
  if (state.setup.mode !== 'pvp') return TEAM_IDS;
  if (hasRaces(state)) return ALL_TEAM_IDS.filter((t) => state.setup.seats.some((s) => s.faction === t));
  return ALL_TEAM_IDS.filter((t) => TEAM_IDS.includes(t) || state.setup.seats.some((s) => s.faction === t));
};

/** The name of a side on the screen and in the log: the name of the faction it plays (or the neutrals'). */
export const sideName = (state: unknown, side: Side): string => (side === 'neutral' ? FACTION_NAMES.neutral : FACTION_NAMES[raceOf(state, side)]);

/** The rival of a side (two-sided games only). */
export const rivalOf = (team: TeamId): TeamId => (team === 'dawn' ? 'horde' : 'dawn');

/** A record with an entry for each of the given sides (the type claims all of them: only the playing sides are ever read). */
export function byTeam<T>(teams: readonly TeamId[], make: (team: TeamId) => T): Record<TeamId, T> {
  const out: Partial<Record<TeamId, T>> = {};
  for (const t of teams) out[t] = make(t);
  return out as Record<TeamId, T>;
}

/**
 * A table as the engine wants it, from seats that only name their race: every seat gets the slot of its race (`assignSlots`). When the table is the
 * old one (each race in the slot of its own id) the `race` fields are dropped, so that such a game is stored and sent exactly as before.
 */
export function seatTable<T extends { faction: TeamId; race?: FactionId }>(seats: readonly T[]): T[] {
  if (seats.some((s) => s.race === undefined)) return [...seats];
  const slots = assignSlots(seats.map((s) => s.race!));
  const classic = seats.every((s, i) => DATA_OF[slots[i]] === s.race);
  return seats.map((s, i) => {
    const { race, ...rest } = s;
    return { ...rest, faction: slots[i], ...(classic ? {} : { race }) } as T;
  });
}
