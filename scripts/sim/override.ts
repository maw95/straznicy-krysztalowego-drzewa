// Experiment without editing the game: SIM_OVERRIDE='{"units":{"ironFistOgre":{"hp":10}},"ability":{"hardHeadIgnore":3},"rules":{"ritualRounds":3},"maps":{"short":{"roundLimit":14}}}'
// "digitalStats":{"unicornKing":{"hp":10}} changes the digital ruleset's own numbers (DIGITAL_STATS). Applied once when a simulation process starts (worker processes inherit the variable).

import { ABILITY, ARENA_RULES, CONTROL, DIGITAL_STATS, ITEM_EFFECT, MAP_VARIANTS, UNITS } from '../../src/engine/data';
import { DEFAULT_RULES, LEVEL_RULES, type Level } from '../../src/engine/types';

const raw = process.env.SIM_OVERRIDE;
if (raw) {
  const o = JSON.parse(raw);
  for (const [id, patch] of Object.entries(o.units ?? {})) Object.assign(UNITS[id], patch);
  for (const [id, patch] of Object.entries(o.digitalStats ?? {})) DIGITAL_STATS[id] = { ...DIGITAL_STATS[id], ...(patch as object) };
  Object.assign(ABILITY, { ...o.ability });
  if (o.control) Object.assign(CONTROL, { ...o.control, roundsToWin: { ...CONTROL.roundsToWin, ...o.control.roundsToWin } });
  Object.assign(ITEM_EFFECT, o.items ?? {});
  Object.assign(ARENA_RULES, o.arena ?? {});
  Object.assign(DEFAULT_RULES, o.rules ?? {});
  for (const [level, patch] of Object.entries(o.levels ?? {})) Object.assign(LEVEL_RULES[level as Level].rules, patch);
  for (const [size, patch] of Object.entries(o.maps ?? {})) Object.assign(MAP_VARIANTS[size as keyof typeof MAP_VARIANTS], patch);
}
