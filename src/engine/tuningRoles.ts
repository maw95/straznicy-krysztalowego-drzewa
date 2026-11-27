// The role balance of the goals with two different tasks (the crystals, survival) at the tables with a level at each bot (backlog 94): levers that
// make the two roles even (about 50 percent for each side when two equal bots play them), whoever plays them. The difficulty is not here: it is
// the bots' own (ai/slips.ts). Measured and written by `npx tsx scripts/sim/tuneRoles.ts` (do not edit the entries by hand; run the tuner again).

import type { MapSize } from './data';
import type { MapShape, RulesConfig, SetupOptions } from './types';
import { ROLE_ENTRIES } from './tuningRolesData';

/** The layers of mechanics above hero growth (a level of complexity from Osada up). */
export type RoleLayer = 'none' | 'kingdom' | 'economy' | 'realm' | 'empire';

export interface RoleTune {
  objective: 'crystals' | 'survival';
  /** Level 0 ("Spacer"): its own rules (duels on the board). */
  zero?: boolean;
  maps: MapSize[];
  /** Przymierza seats (the same count plays the other role). */
  players: number;
  growth: boolean;
  layer: RoleLayer;
  shape: MapShape;
  customMapId?: string;
  /** The tuner's step on its ladder of levers (0 = none; above 0 helps the Przymierze, below the Horde) and what it measured. */
  step: number;
  dawnWins?: number;
  rules: Partial<RulesConfig>;
}

export const ROLE_TUNING: RoleTune[] = ROLE_ENTRIES;

export function roleLayer(rules: Pick<RulesConfig, 'kingdom' | 'economy' | 'realm' | 'empire'>): RoleLayer {
  return rules.empire ? 'empire' : rules.realm ? 'realm' : rules.economy ? 'economy' : rules.kingdom ? 'kingdom' : 'none';
}

/** The key of a table among the entries (the tuner and the lookup share it). */
export function roleKey(t: Pick<RoleTune, 'zero' | 'players' | 'growth' | 'layer' | 'shape' | 'customMapId'> & { objective: string; map: MapSize }): string {
  return [t.objective, t.zero ? 'zero' : 'full', t.map, t.players, t.growth ? 'g' : '-', t.layer, t.shape, t.customMapId ?? ''].join('|');
}

/**
 * The role levers of a setup: the entry of its table (goal, map size, Przymierza seats, growth, layer, map shape); a ready-made map without its own entry
 * takes the random map's of its size, and a table with more players than were measured takes the largest count measured.
 */
export function roleRules(setup: SetupOptions, objective: 'crystals' | 'survival', zero: boolean): Partial<RulesConfig> {
  const r = setup.rules;
  const players = setup.seats.filter((s) => s.faction === 'dawn').length;
  const base = { objective, zero, map: setup.mapSize, growth: Boolean(r.heroGrowth), layer: roleLayer(r) };
  const shape = setup.mapShape ?? 'triangle';
  const index = byKey();
  for (const p of [players, 2, 1]) {
    const hit = index.get(roleKey({ ...base, players: p, shape, customMapId: shape === 'custom' ? setup.customMapId : undefined })) ?? (shape === 'custom' ? index.get(roleKey({ ...base, players: p, shape: 'triangle' })) : undefined);
    if (hit) return hit.rules;
  }
  return {};
}

let cache: { list: RoleTune[]; length: number; map: Map<string, RoleTune> } | null = null;
function byKey(): Map<string, RoleTune> {
  if (cache && cache.list === ROLE_TUNING && cache.length === ROLE_TUNING.length) return cache.map;
  const map = new Map<string, RoleTune>();
  for (const t of ROLE_TUNING) for (const m of t.maps) map.set(roleKey({ ...t, map: m }), t);
  cache = { list: ROLE_TUNING, length: ROLE_TUNING.length, map };
  return map;
}
