// Experiment without editing the game: SIM_OVERRIDE='{"units":{"ironFistOgre":{"hp":10}},"ability":{"hardHeadIgnore":3},"rules":{"ritualRounds":3},"maps":{"short":{"roundLimit":14}}}'
// "tuning":[{"objective":"control","level":"hard","players":1,"rules":{"extraEvilHero":false}}] adds digital tuning entries (src/engine/tuning.ts).
// "packDelta":{"herds":{"hp":1,"attack":0,"speed":0,"kind":"support"}} adds to every unit of a faction (kind optional; "herds#2" for a second patch of the same side); "mechanics":{"herdsRun":2} and "empire":{"sparkSpeed":2} patch FACTION_MECHANICS / EMPIRE (G2 balance of the new factions).
// "digitalBonus":{"horde":{"hero":{"hp":1,"attack":1},"support":{"hp":1,"attack":1}}} replaces the per-faction digital bonus (src/engine/factionBonus.ts; scripts/sim/tuneFactions.ts uses it).
// "digitalStats":{"unicornKing":{"hp":10}} changes the digital ruleset's own numbers (DIGITAL_STATS). Applied once when a simulation process starts (worker processes inherit the variable).

import { DIGITAL_TUNING } from '../../src/engine/tuning';
import { AUTO_TUNING } from '../../src/engine/tuningAuto';
import { FACTION_DIGITAL_BONUS } from '../../src/engine/factionBonus';
import { ABILITY, ARENA_RULES, ARTIFACT, BOSS, CONTROL, DIGITAL_STATS, ITEM_EFFECT, MAP_VARIANTS, UNITS } from '../../src/engine/data';
import { DEFAULT_RULES, LEVEL_RULES, type Level } from '../../src/engine/types';
import { EMPIRE, FACTION_MECHANICS } from '../../src/engine/empire';

const raw = process.env.SIM_OVERRIDE;
if (raw) {
  const o = JSON.parse(raw);
  for (const [id, patch] of Object.entries(o.units ?? {})) Object.assign(UNITS[id], patch);
  for (const [id, patch] of Object.entries(o.digitalStats ?? {})) DIGITAL_STATS[id] = { ...DIGITAL_STATS[id], ...(patch as object) };
  for (const [key, d] of Object.entries(o.packDelta ?? {}) as Array<[string, any]>) for (const u of Object.values(UNITS)) if (u.side === key.split("#")[0] && (!d.kind || u.kind === d.kind)) { u.hp += d.hp ?? 0; u.attack += d.attack ?? 0; u.speed += d.speed ?? 0; }
  for (const [race, b] of Object.entries(o.digitalBonus ?? {})) (FACTION_DIGITAL_BONUS as Record<string, unknown>)[race] = b;
  Object.assign(FACTION_MECHANICS, o.mechanics ?? {});
  Object.assign(EMPIRE, o.empire ?? {});
  // "noAuto":true leaves out the generated tuning (scripts/sim/tuneLevels.ts measures against the hand-made entries only).
  if (o.noAuto) for (const e of AUTO_TUNING) DIGITAL_TUNING.splice(DIGITAL_TUNING.indexOf(e), 1);
  DIGITAL_TUNING.push(...(o.tuning ?? []));
  Object.assign(ABILITY, { ...o.ability });
  if (o.control) Object.assign(CONTROL, { ...o.control, roundsToWin: { ...CONTROL.roundsToWin, ...o.control.roundsToWin } });
  Object.assign(ITEM_EFFECT, o.items ?? {});
  if (o.boss) Object.assign(BOSS.hp, o.boss.hp);
  if (o.artifact) Object.assign(ARTIFACT, o.artifact);
  Object.assign(ARENA_RULES, o.arena ?? {});
  Object.assign(DEFAULT_RULES, o.rules ?? {});
  for (const [level, patch] of Object.entries(o.levels ?? {})) Object.assign(LEVEL_RULES[level as Level].rules, patch);
  for (const [size, patch] of Object.entries(o.maps ?? {})) Object.assign(MAP_VARIANTS[size as keyof typeof MAP_VARIANTS], patch);
}
