// Hidden information (the fog of war of the digital edition; the Free Companies: traps, veiled units; the Desert Empire: mirages, the buried Queen): what a viewer may see of the state. The engine always
// works on the full state; whoever shows the game to people (the server for an online table, the screen for hot-seat) shows `redactHidden(state, viewers)` instead,
// and the bots of a side plan on the same view (ai/battleAi.ts). No import from the rest of the engine but types, so the server and the screens can use it freely.

import type { Side, TeamId } from './data';
import type { HexKey } from './hex';
import { isDigital, type BattleState, type BattleUnit, type GameState, type GroundEffect, type HeroState, type Tile } from './types';

/** The fog of war (backlog 90): in the digital edition every faction uncovers the map for itself; the board edition shares one map. */
export const fogOn = (state: Pick<GameState, 'rules' | 'setup'>): boolean => isDigital(state.rules) && state.setup.mode !== 'arena';

/** Whether faction `side` has hex `k` uncovered (without the fog: whether anybody has). */
export function knowsHex(state: Pick<GameState, 'tiles'>, k: HexKey, side: Side): boolean {
  const t = state.tiles[k];
  return Boolean(t?.revealed) && (!t.seenBy || t.seenBy.includes(side as TeamId));
}

/**
 * The map as the sides in `viewers` know it (the fog of war): a hex none of them has uncovered is hidden (`revealed: false`), and a hero of another side
 * standing on such a hex is off the board (`entering: []`, like a reserve still to come), so neither a screen nor a bot learns where it is. A hex once seen
 * stays seen, with whoever stands on it. Without the fog, or with no viewers (a spectator, a game of bots), the state is returned as it is.
 */
export function fogView(state: GameState, viewers: readonly Side[] | null): GameState {
  if (!viewers?.length || !fogOn(state)) return state;
  const knows = (t: Tile) => t.revealed && (!t.seenBy || t.seenBy.some((s) => viewers.includes(s)));
  const hidden = Object.values(state.tiles).filter((t) => t.revealed && !knows(t));
  const strangers = Object.values(state.heroes).filter((h) => h.alive && !h.entering && h.pos && !viewers.includes(h.faction) && !knows(state.tiles[h.pos]));
  if (!hidden.length && !strangers.length) return state;
  const tiles = { ...state.tiles };
  for (const t of hidden) tiles[t.key] = { ...t, revealed: false };
  const heroes: Record<string, HeroState> = { ...state.heroes };
  for (const h of strangers) heroes[h.id] = { ...h, entering: [] };
  return { ...state, tiles, heroes };
}

/** Whether the sides in `viewers` know of the effect: it is not hidden, or it is theirs, or the Oko Kruka has uncovered it for them. */
export const knowsEffect = (g: GroundEffect, viewers: readonly Side[] | null): boolean => !g.hidden || (viewers ?? []).some((v) => v === g.owner || g.seenBy?.includes(v));

const sees = (viewers: readonly Side[] | null, side: Side): boolean => (viewers ?? []).includes(side);

/**
 * The engine id of the unit an action of `actor` names: an action of another side than a mirage's owner names a body of a mirage group by the id it was shown
 * (`BattleState.mirageAlias`), and this turns it back. Any other id is returned as it is.
 */
export function unmaskId(b: BattleState, actor: Side, id: string): string {
  const alias = b.mirageAlias;
  if (!alias) return id;
  for (const [engine, shown] of Object.entries(alias)) if (shown === id && b.units[engine] && b.units[engine].side !== actor) return engine;
  return id;
}

/**
 * The battle with the mirages of the sides not in `viewers` dressed as the units they copy: each shows that unit's Życie, status and ability (the same numbers
 * on the screen), and with `alias` every body of the group gets its mixed-up id (so neither the id nor the order of the units tells the real one). The view is
 * consistent: the order, the activation and the latest rolls name the shown ids too.
 */
export function disguiseMirages(b: BattleState, viewers: readonly Side[] | null, alias: boolean): BattleState {
  const foreign = Object.values(b.units).some((u) => u.status.mirage && !sees(viewers, u.side));
  if (!foreign && !b.mirageAlias) return b;
  const dressed = (m: BattleUnit): BattleUnit => {
    const real = b.units[m.status.mirage!.of];
    if (!real) {
      const { ability: _a, ...rest } = m;
      const { mirage: _m, ...status } = m.status;
      return { ...rest, status };
    }
    const { tail: _t, facing: _f, corpse: _c, corpseTail: _ct, ...looks } = real;
    return { ...looks, status: { ...real.status }, id: m.id, pos: m.pos, alive: m.alive, ...(m.tail ? { tail: m.tail } : {}), ...(m.facing ? { facing: m.facing } : {}) };
  };
  const units: Record<string, BattleUnit> = {};
  for (const u of Object.values(b.units)) units[u.id] = u.status.mirage && !sees(viewers, u.side) ? dressed(u) : u;
  const { mirageAlias: _all, ...rest } = b;
  const own = ownAliases(b, viewers);
  if (!alias || !b.mirageAlias) return { ...rest, units, ...(b.mirageAlias ? { mirageAlias: own } : {}) };
  // The shown id of every body of another side's group; the units in an order the shown ids decide (the engine's order would show the real one first).
  const shownOf = new Map<string, string>();
  for (const [engine, shown] of Object.entries(b.mirageAlias)) if (b.units[engine] && !sees(viewers, b.units[engine].side)) shownOf.set(engine, shown);
  const f = (id: string): string => shownOf.get(id) ?? id;
  const groupOf = (id: string): string | null => (shownOf.has(id) ? (b.units[id].status.mirage?.of ?? id) : null);
  const ordered: Record<string, BattleUnit> = {};
  const done = new Set<string>();
  for (const u of Object.values(units)) {
    const g = groupOf(u.id);
    if (g === null) {
      ordered[u.id] = u;
      continue;
    }
    if (done.has(g)) continue;
    done.add(g);
    const bodies = Object.values(units).filter((x) => groupOf(x.id) === g).map((x) => ({ ...x, id: f(x.id) }));
    for (const x of bodies.sort((p, q) => (p.id < q.id ? -1 : 1))) ordered[x.id] = x;
  }
  return {
    ...rest,
    units: ordered,
    order: b.order.map(f),
    activation: b.activation ? { ...b.activation, unitId: f(b.activation.unitId), ...(b.activation.lift ? { lift: f(b.activation.lift) } : {}) } : null,
    extra: b.extra.map((e) => ({ ...e, unitId: f(e.unitId) })),
    damageBy: Object.fromEntries(Object.entries(b.damageBy).map(([k, v]) => [f(k), v])),
    ...(b.rolls ? { rolls: b.rolls.map((r) => ({ ...r, attackerId: f(r.attackerId), targetId: f(r.targetId) })) } : {}),
    ...(b.heals ? { heals: b.heals.map((h) => ({ ...h, unitId: f(h.unitId) })) } : {}),
    ...(b.teleports ? { teleports: b.teleports.map((t) => ({ ...t, unitId: f(t.unitId) })) } : {}),
    ...(b.spells ? { spells: b.spells.map((s) => ({ ...s, casterId: f(s.casterId), targetId: f(s.targetId) })) } : {}),
    ...(b.rearrange && !sees(viewers, b.rearrange.side) ? { rearrange: { side: b.rearrange.side, from: {} } } : {}),
    mirageAlias: own,
  };
}

/** The part of the mix-up of ids the viewers may know: that of their own groups. */
function ownAliases(b: BattleState, viewers: readonly Side[] | null): Record<string, string> {
  return Object.fromEntries(Object.entries(b.mirageAlias ?? {}).filter(([engine]) => b.units[engine] && sees(viewers, b.units[engine].side)));
}

/**
 * The game as the sides in `viewers` may see it (null: nobody, a spectator or a game of bots): the map under their fog of war (`fogView`), the hidden traps of the others are left out of the battle,
 * a veiled unit of another side has no place on the arena (it is on the list of the units, but nowhere on the board), and the mirages of another side look
 * like the units they copy, under mixed-up ids. The state is returned as it is when there is nothing to hide, so a screen may call this every time. It does not
 * change its argument.
 */
export function redactHidden(full: GameState, viewers: readonly Side[] | null): GameState {
  const state = fogView(full, viewers);
  const b = state.battle;
  if (!b) return state;
  const traps = (b.ground ?? []).filter((g) => !knowsEffect(g, viewers));
  const veiled = Object.values(b.units).filter((u) => u.status.veiled && u.pos !== null && !sees(viewers, u.side));
  const mirages = Boolean(b.mirageAlias) || Object.values(b.units).some((u) => u.status.mirage && !sees(viewers, u.side));
  if (!traps.length && !veiled.length && !mirages) return state;
  let units = b.units;
  if (veiled.length) {
    units = { ...b.units };
    for (const u of veiled) {
      const { tail: _tail, ...rest } = u;
      units[u.id] = { ...rest, pos: null };
    }
  }
  let battle: BattleState = { ...b, ground: (b.ground ?? []).filter((g) => knowsEffect(g, viewers)), units };
  if (mirages) battle = disguiseMirages(battle, viewers, true);
  return { ...state, battle };
}
