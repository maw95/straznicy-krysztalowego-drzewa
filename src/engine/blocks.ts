// The options of the new-game wizard that are not offered (backlog 103, the author's decisions of 27–28.11): a goal on a map size and shape, sometimes only with one
// player a side (or only with two or more), whose games fall far outside the balance band. The rules come from the measurement in docs/balans_blokady.jsonl
// (400 games a cell, docs/BALANS_BLOKADY.md): a combination is blocked when in most of its measured layers the Przymierze's win rate lies more than 10 points
// outside the band even after the measurement's uncertainty (±4.9 points) is taken off. `tests/blocks.test.ts` recomputes the list from the data.
// The ready levels and the online tables block; "Własne ustawienia" only warn. Custom (ready, hand-made) maps are never blocked.

import type { MapSize } from './data';
import { OBJECTIVES } from './objectives';
import type { MapShape, ObjectiveId, SetupOptions } from './types';

/** How the threshold reads the measurement: points outside the band, and the uncertainty taken off first (1.96 · √(0.25/400) · 100). */
export const BLOCK_THRESHOLD = 10;
export const BLOCK_MARGIN = 4.9;

export interface OptionBlock {
  objective: ObjectiveId;
  size: MapSize;
  shape: Exclude<MapShape, 'custom'>;
  /** 1: blocked only with one player a side; 2: only with two or more; missing: always. */
  players?: 1 | 2;
  /** The Przymierze's mean win rate in the measurement (percent), for the note. */
  dawn: number;
}

export const OPTION_BLOCKS: readonly OptionBlock[] = [
  { objective: 'survival', size: 'short', shape: 'triangle', dawn: 78 },
  { objective: 'survival', size: 'medium', shape: 'triangle', dawn: 72 },
  { objective: 'crystals', size: 'huge', shape: 'islands', players: 1, dawn: 31 },
  { objective: 'crystals', size: 'giant', shape: 'islands', players: 1, dawn: 25 },
  { objective: 'crystals', size: 'giant', shape: 'ring', players: 1, dawn: 35 },
  { objective: 'artifact', size: 'short', shape: 'ring', dawn: 27 },
  { objective: 'artifact', size: 'short', shape: 'triangle', players: 1, dawn: 31 },
  { objective: 'artifact', size: 'medium', shape: 'ring', players: 2, dawn: 30 },
  { objective: 'artifact', size: 'medium', shape: 'triangle', players: 2, dawn: 32 },
  { objective: 'conquest', size: 'short', shape: 'triangle', players: 1, dawn: 25 },
  { objective: 'conquest', size: 'short', shape: 'rectangle', players: 1, dawn: 22 },
  { objective: 'conquest', size: 'short', shape: 'ring', players: 1, dawn: 23 },
  { objective: 'conquest', size: 'short', shape: 'islands', players: 1, dawn: 20 },
  { objective: 'conquest', size: 'medium', shape: 'rectangle', players: 1, dawn: 26 },
  { objective: 'conquest', size: 'medium', shape: 'islands', players: 1, dawn: 27 },
  { objective: 'relic', size: 'giant', shape: 'islands', players: 2, dawn: 27 },
];

const SIZE_LOCATIVE: Record<MapSize, string> = { short: 'małej', medium: 'średniej', long: 'dużej', veryLong: 'bardzo dużej', huge: 'ogromnej', giant: 'gigantycznej' };
const SHAPE_LOCATIVE: Record<OptionBlock['shape'], string> = { triangle: 'w kształcie trójkąta', rectangle: 'w kształcie prostokąta', ring: 'w kształcie pierścienia', islands: 'z wyspami' };

/** Players a side of a table: the seats of the smallest side (coop: the Przymierza seats, the Horde gets as many). */
export function playersPerSide(setup: { mode: SetupOptions['mode']; seats: readonly { faction: string }[] }): number {
  if (setup.mode === 'coop') return setup.seats.length;
  const counts = new Map<string, number>();
  for (const s of setup.seats) counts.set(s.faction, (counts.get(s.faction) ?? 0) + 1);
  return counts.size ? Math.min(...counts.values()) : 0;
}

/**
 * The block that holds for a choice, or null. Without `perSide` (the wizard, before the seats are known) only the blocks for any number of players count;
 * `withPlayers: true` returns also the blocks that depend on the players (the wizard's notes).
 */
export function optionBlock(o: { objective: ObjectiveId; size: MapSize; shape: MapShape; perSide?: number }, withPlayers = false): OptionBlock | null {
  return (
    OPTION_BLOCKS.find(
      (b) =>
        b.objective === o.objective &&
        b.size === o.size &&
        b.shape === o.shape &&
        (b.players === undefined || (o.perSide === undefined ? withPlayers : b.players === 1 ? o.perSide === 1 : o.perSide >= 2)),
    ) ?? null
  );
}

/** The game of a set-up may start (the digital edition's random maps; a custom-settings table is checked by its screen, which only warns). */
export function optionAllowed(setup: SetupOptions): boolean {
  if (setup.rules.ruleset !== 'digital' || setup.mode === 'arena' || setup.training) return true;
  const shape = setup.mapShape ?? 'triangle';
  if (shape === 'custom') return true;
  return !optionBlock({ objective: setup.rules.objective ?? 'crystals', size: setup.mapSize, shape, perSide: playersPerSide(setup) });
}

/** The note of a block: what is uneven and how much (two Polish sentences, each shown in its own element so the dictionary translates them: whole sentences with holes). */
export function blockReason(b: OptionBlock): [string, string] {
  const goal = OBJECTIVES[b.objective].name;
  const size = SIZE_LOCATIVE[b.size];
  const shape = SHAPE_LOCATIVE[b.shape];
  const what =
    b.players === 1
      ? `Gra o cel „${goal}” na mapie ${size} ${shape} jest nierówna przy jednym graczu na stronę.`
      : b.players === 2
        ? `Gra o cel „${goal}” na mapie ${size} ${shape} jest nierówna przy dwóch i więcej graczach na stronę.`
        : `Gra o cel „${goal}” na mapie ${size} ${shape} jest nierówna.`;
  return [what, b.dawn >= 50 ? `W pomiarze Przymierze wygrywało ok. ${b.dawn}% gier.` : `W pomiarze Przymierze wygrywało tylko ok. ${b.dawn}% gier.`];
}

/** The short note on a wizard card of a goal blocked only for some tables. */
export const playersNote = (b: OptionBlock): string => (b.players === 1 ? 'od 2 graczy na stronę' : b.players === 2 ? 'tylko 1 gracz na stronę' : 'niedostępny na tej mapie');
