// Experiment without editing the game: SIM_OVERRIDE='{"units":{"ironFistOgre":{"hp":10}},"ability":{"hardHeadIgnore":3},"rules":{"ritualRounds":3},"maps":{"short":{"roundLimit":14}}}'
// Applied once when a simulation process starts (worker processes inherit the variable).

import { ABILITY, MAP_VARIANTS, UNITS } from '../../src/engine/data';
import { DEFAULT_RULES } from '../../src/engine/types';

const raw = process.env.SIM_OVERRIDE;
if (raw) {
  const o = JSON.parse(raw);
  for (const [id, patch] of Object.entries(o.units ?? {})) Object.assign(UNITS[id], patch);
  Object.assign(ABILITY, o.ability ?? {});
  Object.assign(DEFAULT_RULES, o.rules ?? {});
  for (const [size, patch] of Object.entries(o.maps ?? {})) Object.assign(MAP_VARIANTS[size as keyof typeof MAP_VARIANTS], patch);
}
