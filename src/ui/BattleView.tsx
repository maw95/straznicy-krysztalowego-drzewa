import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ABILITY, FACTION_NAMES, ITEMS, UNITS, type FactionId, type ItemKind, type Side } from '../engine/data';
import {
  abilityActive,
  abilityOf,
  alliesOf,
  ATTACK_ABILITIES,
  arenaCells,
  attackDamage,
  attackTargets,
  breathSecondTarget,
  hasLineOfSight,
  canUseBattleItem,
  deployCells,
  FREE_ABILITIES,
  hopCells,
  livingUnits,
  movePath,
  reachableCells,
  unitAt,
  unitSpeed,
} from '../engine/battle';
import { distance, parseKey, type HexKey } from '../engine/hex';
import type { Action, AttackRoll, BattleUnit, GameState } from '../engine/types';
import { hoverCard } from './hover';
import { asset, Frame, HpBar, Medal, Portrait, Ribbon, SIDE_RING } from './common';
import { ART_SIZE, CANVAS_H, CANVAS_W, cellCenter, hexPoints } from './arenaGeometry';
import { DamageDrop, DieFace, LastAttack, Marker, StatIcon, StatText, type MarkerName } from './markers';
import { details } from './details';
import { aimedCursor, preloadAimedCursors, type AimedCursor } from './cursors';
import { figureFor, FigureLayer, type Piece } from './FigureLayer';
import { UnitCard } from './UnitCard';

/** Box a unit token is laid out in, centred on its cell. */
const W = 66;
const H = 76;

function cellPos(k: HexKey) {
  const c = cellCenter(k);
  return { x: c.x - W / 2, y: c.y - H / 2 };
}

type ItemTargeting =
  | { kind: 'ownLiving' | 'ownDead' | 'enemy'; itemId: string }
  | { kind: 'lightning'; itemId: string; picks: string[] }
  | { kind: 'courage'; itemId: string; picks: string[] }
  | { kind: 'teleport'; itemId: string; unitId: string | null }
  | { kind: 'horn'; itemId: string; mode: 'swap' | 'extra' | null; unitId: string | null };

const ITEM_TARGET: Partial<Record<ItemKind, ItemTargeting['kind']>> = {
  heal: 'ownLiving',
  sword: 'ownLiving',
  shield: 'ownLiving',
  vitality: 'ownLiving',
  boots: 'ownLiving',
  stone: 'ownLiving',
  hourglass: 'ownLiving',
  resurrection: 'ownDead',
  damage_scroll: 'enemy',
  lightning: 'lightning',
  courage_horn: 'courage',
  teleport: 'teleport',
  horn: 'horn',
};

/** Time per cell when a unit walks along its path (matches .token.walking in styles.css). */
export const WALK_STEP_MS = 170;

interface Props {
  state: GameState;
  canAct: boolean;
  onAction: (a: Action) => void;
  onShowCard: (unitId: string) => void;
  footer: React.ReactNode;
}

export function BattleView({ state, canAct, onAction, onShowCard, footer }: Props) {
  const b = state.battle!;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [useAbility, setUseAbility] = useState(false);
  const [freeAbility, setFreeAbility] = useState(false);
  const [targeting, setTargeting] = useState<ItemTargeting | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [hover, setHover] = useState<HexKey | null>(null);

  // Keep the active unit in view when the arena is scrollable (phones): when it changes or moves, not on every hit.
  const activePos = b.activation ? b.units[b.activation.unitId]?.pos : null;
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !activePos || el.scrollWidth <= el.clientWidth + 2) return;
    const { x } = cellPos(activePos);
    el.scrollTo({ left: Math.max(0, (x + W / 2) * scale - el.clientWidth / 2), behavior: 'smooth' });
  }, [b.activation?.unitId, activePos, scale]);

  // Animation clean-ups run to the end even when the next action comes first (bots act every 120–450 ms);
  // they are dropped only when the arena goes away.
  const timers = useRef(new Set<number>());
  const later = (f: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      f();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Walking: a unit that moved several cells is shown stepping hex by hex along the path it
  // really took (around obstacles and enemies), worked out on the state before the move.
  const prevState = useRef(state);
  const [walk, setWalk] = useState<Record<string, HexKey>>({});
  useLayoutEffect(() => {
    const before = prevState.current;
    prevState.current = state;
    const pb = before.battle;
    if (!pb || pb === b) return;
    for (const u of Object.values(b.units)) {
      const was = pb.units[u.id];
      if (!was?.pos || !u.pos || was.pos === u.pos || !was.alive || !u.alive) continue;
      const path = movePath(before, was, u.pos);
      if (path.length < 3) continue;
      setWalk((w) => ({ ...w, [u.id]: path[0] }));
      // Step by step, then hand the token back to its real position.
      const steps = path.slice(1);
      const timer = (ms: number, f: (w: Record<string, HexKey>) => void) =>
        later(() => setWalk((w) => { const next = { ...w }; f(next); return next; }), ms);
      steps.forEach((k, i) => timer(20 + i * WALK_STEP_MS, (w) => (w[u.id] = k)));
      timer(20 + steps.length * WALK_STEP_MS, (w) => delete w[u.id]);
    }
  }, [b]);

  // Floating damage / healing numbers: diff unit HP between renders.
  // Also drives the attack animations: who struck whom, and fading-out fallen units.
  const lastSeen = useRef<Record<string, { hp: number; pos: HexKey | null; alive: boolean }>>({});
  const prevActive = useRef<string | null>(null);
  const [floaters, setFloaters] = useState<Array<{ key: number; amount: number; x: number; y: number }>>([]);
  const [hitIds, setHitIds] = useState<string[]>([]);
  const [strikes, setStrikes] = useState<Array<{ key: number; from: HexKey; to: HexKey; ranged: boolean; attacker: string }>>([]);
  const [ghosts, setGhosts] = useState<Array<{ key: number; defId: string; side: Side; pos: HexKey }>>([]);
  const [seals, setSeals] = useState<Array<{ key: number; ability: string; pos: HexKey; color: string }>>([]);
  const [shards, setShards] = useState<Array<{ key: number; pos: HexKey; gold: boolean }>>([]);
  const abilitySeen = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const fresh: Array<{ key: number; amount: number; x: number; y: number }> = [];
    const hit: string[] = [];
    const newStrikes: typeof strikes = [];
    const newGhosts: typeof ghosts = [];
    const attacker = prevActive.current ? b.units[prevActive.current] : undefined;
    for (const u of Object.values(b.units)) {
      const prev = lastSeen.current[u.id];
      if (prev && prev.hp !== u.hp) {
        const where = u.pos ?? prev.pos;
        if (where) {
          const { x, y } = cellPos(where);
          fresh.push({ key: Math.random(), amount: u.hp - prev.hp, x: x + W / 2, y: y + H / 2 - 40 });
          if (u.hp < prev.hp && attacker && attacker.id !== u.id && attacker.side !== u.side && attacker.pos) {
            newStrikes.push({ key: Math.random(), from: attacker.pos, to: where, ranged: UNITS[attacker.defId].attackType === 'ranged', attacker: attacker.id });
          }
        }
        if (u.hp < prev.hp) hit.push(u.id);
      }
      if (prev?.alive && !u.alive && !u.swappedOut && prev.pos) newGhosts.push({ key: Math.random(), defId: u.defId, side: u.side, pos: prev.pos });
      lastSeen.current[u.id] = { hp: u.hp, pos: u.pos ?? prev?.pos ?? null, alive: u.alive };
    }
    prevActive.current = b.activation?.unitId ?? null;
    // Ability seals: a unit's ability flag flipped since the last render.
    const newSeals: typeof seals = [];
    for (const u of Object.values(b.units)) {
      if (u.abilityUsed && abilitySeen.current[u.id] === false && (u.pos ?? lastSeen.current[u.id]?.pos)) {
        newSeals.push({ key: Math.random(), ability: UNITS[u.defId].ability, pos: (u.pos ?? lastSeen.current[u.id].pos)!, color: u.side === 'dawn' ? '#9BE88A' : u.side === 'horde' ? '#FF7A5A' : '#9EE4FF' });
      }
      abilitySeen.current[u.id] = u.abilityUsed;
    }
    const newShards = hit.map((id) => {
      const u = b.units[id];
      return { key: Math.random(), pos: (u.pos ?? lastSeen.current[id]?.pos)!, gold: !u.alive };
    }).filter((x) => x.pos);
    if (newSeals.length) {
      setSeals((x) => [...x, ...newSeals]);
      later(() => setSeals((x) => x.filter((s) => !newSeals.includes(s))), 1400);
    }
    if (newShards.length) {
      setShards((x) => [...x, ...newShards]);
      later(() => setShards((x) => x.filter((s) => !newShards.includes(s))), 700);
    }
    if (!fresh.length && !newGhosts.length) return;
    setFloaters((f) => [...f, ...fresh]);
    setHitIds((ids) => [...ids.filter((id) => !hit.includes(id)), ...hit]);
    setStrikes((x) => [...x, ...newStrikes.filter((st, i, all) => all.findIndex((o) => o.attacker === st.attacker) === i || st.ranged)]);
    setGhosts((g) => [...g, ...newGhosts]);
    later(() => {
      setFloaters((f) => f.filter((x) => !fresh.includes(x)));
      setStrikes((x) => x.filter((st) => !newStrikes.includes(st)));
      setGhosts((g) => g.filter((x) => !newGhosts.includes(x)));
      setHitIds((ids) => ids.filter((id) => !hit.includes(id)));
    }, 1150);
  }, [b]);

  /** The newest blow of a unit still being animated (a fast bot may strike again before the last one fades). */
  const lastStrike = (id: string, ranged: boolean) => [...strikes].reverse().find((st) => st.attacker === id && st.ranged === ranged);

  // Die rolls: each new attack shows its die over the unit that took the blow
  // (a blow cut to 0 shows a 0 drop too, since no HP changed).
  const rollSeen = useRef(b.rolls?.[b.rolls.length - 1]?.seq ?? 0);
  const [rollPops, setRollPops] = useState<Array<{ key: number; roll: AttackRoll; x: number; y: number }>>([]);
  useEffect(() => {
    const rolls = b.rolls ?? [];
    const latest = rolls[rolls.length - 1]?.seq ?? 0;
    if (latest < rollSeen.current) rollSeen.current = 0; // a new battle starts counting again
    const fresh = rolls.filter((r) => r.seq > rollSeen.current);
    rollSeen.current = latest;
    const pops = fresh.flatMap((roll) => {
      const where = b.units[roll.targetId].pos ?? lastSeen.current[roll.targetId]?.pos;
      if (!where || (roll.die === null && roll.damage > 0)) return [];
      const { x, y } = cellPos(where);
      return [{ key: Math.random(), roll, x: x + W / 2 - (roll.damage > 0 ? 34 : 0), y: y + H / 2 - 44 }];
    });
    if (!pops.length) return;
    setRollPops((p) => [...p, ...pops]);
    later(() => setRollPops((p) => p.filter((x) => !pops.includes(x))), 2200);
  }, [b]);
  const lastRoll = b.rolls?.[b.rolls.length - 1];
  const [showThreat, setShowThreat] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // On phones keep hexes finger-sized and let the arena scroll instead of shrinking further.
    const fit = () => setScale(Math.max(Math.min(el.clientWidth / CANVAS_W, el.clientHeight / CANVAS_H), el.clientWidth < 600 ? 0.68 : 0));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  const act = b.activation;
  const active = act ? b.units[act.unitId] : null;
  const myTurn = canAct && b.stage === 'fight' && Boolean(active);
  const side: FactionId | undefined = active && active.side !== 'neutral' ? active.side : undefined;
  const moves = useMemo(() => (myTurn && active && !act!.moved && !act!.attacked && !targeting ? reachableCells(state, active) : new Map<HexKey, number>()), [state, myTurn, active, act, targeting]);
  const targets = useMemo(() => (myTurn && active && !act!.attacked && !act!.moveOnly && !act!.hop && !targeting && !freeAbility ? attackTargets(state, active) : []), [state, myTurn, active, act, targeting, freeAbility]);
  const hops = myTurn && active && act!.hop ? hopCells(state, active, act!.hop) : [];

  // ---------------------------------------------------------------- one click: walk up and attack
  /**
   * Where a melee unit can attack an enemy it does not stand next to: the free cells beside the enemy
   * that it can walk to now. Clicking the enemy walks there and attacks, as in Heroes III.
   */
  const approachCells = (u: BattleUnit): HexKey[] => {
    if (!myTurn || !active?.pos || !u.pos || u.side === active.side || act!.moved || act!.attacked || act!.moveOnly || act!.hop || targeting || freeAbility) return [];
    if (UNITS[active.defId].attackType !== 'melee' || targets.some((t) => t.id === u.id)) return [];
    return [...moves.keys()].filter((k) => distanceBetween(k, u.pos!) === 1);
  };
  /** The enemy about to be attacked this way and the cell the attack comes from (lit before the click). */
  const [approach, setApproach] = useState<{ targetId: string; cell: HexKey } | null>(null);
  /**
   * The side to attack from: with a mouse, the cell in the direction the pointer points at from the
   * enemy's centre; without one (touch), the cell nearest to walk to.
   */
  function aimApproach(u: BattleUnit, pointer: { x: number; y: number; box: DOMRect } | null) {
    const cells = approachCells(u);
    if (!cells.length) return setApproach(null);
    let cell: HexKey;
    if (pointer) {
      const aim = Math.atan2(pointer.y - (pointer.box.top + pointer.box.height / 2), pointer.x - (pointer.box.left + pointer.box.width / 2));
      const from = cellPos(u.pos!);
      const off = (k: HexKey) => {
        const p = cellPos(k);
        const a = Math.atan2(p.y - from.y, p.x - from.x);
        return Math.abs(Math.atan2(Math.sin(a - aim), Math.cos(a - aim)));
      };
      cell = cells.reduce((best, k) => (off(k) < off(best) ? k : best));
    } else cell = cells.reduce((best, k) => (moves.get(k)! < moves.get(best)! ? k : best));
    if (approach?.targetId !== u.id || approach.cell !== cell) setApproach({ targetId: u.id, cell });
  }
  /** The attack that follows the approach step, once the unit has walked there. */
  const pendingAttack = useRef<{ targetId: string; useAbility: boolean; at: number } | null>(null);
  useEffect(() => {
    const p = pendingAttack.current;
    if (!p || !myTurn || !act?.moved) return;
    pendingAttack.current = null;
    if (!targets.some((t) => t.id === p.targetId)) return;
    window.setTimeout(() => onAction({ type: 'battleAttack', targetId: p.targetId, useAbility: p.useAbility }), Math.max(0, p.at - Date.now()));
    // The timer is not cleared on purpose: a second run of this effect (React's development mode) must not lose the attack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useEffect(() => setApproach(null), [state]);
  /**
   * The cursor over a unit: a sword for an attack on a neighbour (ranged units fight adjacent enemies too),
   * an arrow for a shot, and a crossed-out arrow when an obstacle hides an enemy from a ranged unit
   * that could otherwise shoot (nobody next to it).
   */
  const unitCursor = (u: BattleUnit): string => {
    if (!active?.pos || !u.pos) return '';
    if (approachCells(u).length) return 'cur-melee';
    // A ranged unit shoots even at a neighbour (it must, when one stands next to it): always the arrow.
    if (targets.some((t) => t.id === u.id)) return UNITS[active.defId].attackType === 'melee' ? 'cur-melee' : 'cur-ranged';
    const canShoot = myTurn && !act!.attacked && !act!.moveOnly && !act!.hop && !targeting && !freeAbility && UNITS[active.defId].attackType === 'ranged';
    if (!canShoot || u.side === active.side) return '';
    const engaged = livingUnits(b).some((e) => e.side !== active.side && e.pos && distanceBetween(active.pos!, e.pos) === 1);
    return !engaged && !hasLineOfSight(state, active.pos, u.pos) ? 'cur-blocked' : '';
  };
  useEffect(preloadAimedCursors, []);
  /** The sword or the arrow over a unit, turned the way the blow or the shot goes; null for an unturned cursor. */
  const aimedOver = (u: BattleUnit): string | null => {
    const kind = ({ 'cur-melee': 'atak', 'cur-ranged': 'strzal', 'cur-blocked': 'strzal_zablokowany' } as Record<string, AimedCursor>)[unitCursor(u)];
    if (!kind || !active?.pos || !u.pos) return null;
    // The sword strikes from the lit approach cell (or from where the attacker stands); shots fly from the shooter.
    const from = kind === 'atak' && approach?.targetId === u.id ? approach.cell : active.pos;
    const a = cellPos(from);
    const t = cellPos(u.pos);
    return aimedCursor(kind, (Math.atan2(t.y - a.y, t.x - a.x) * 180) / Math.PI);
  };
  /** Walking or flying to a cell: the boot or the wing. */
  const moveCursor = active && UNITS[active.defId].movement === 'fly' ? 'cur-fly' : 'cur-move';
  const ab = active ? abilityOf(active) : null;
  const abilityReady = Boolean(active && !active.abilityUsed && abilityActive(state, active));
  const attackAbility = abilityReady && ab !== null && ATTACK_ABILITIES.includes(ab);
  const freeAbilityReady = abilityReady && ab !== null && FREE_ABILITIES.includes(ab);
  const itemsAllowed = myTurn && side ? canUseBattleItem(state, side) : false;

  function reset() {
    setTargeting(null);
    setFreeAbility(false);
  }

  // Battle shortcuts: Space ends the activation, Z ability, S treasures, T enemy reach.
  const keyState = useRef({ myTurn, attackAbility, freeAbilityReady, ab });
  keyState.current = { myTurn, attackAbility, freeAbilityReady, ab };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || document.querySelector('.overlay:not(.leaving)')) return;
      const k = e.key.toLowerCase();
      const ks = keyState.current;
      if (k === 't') setShowThreat((v) => !v);
      if (!ks.myTurn) return;
      if (k === ' ') {
        e.preventDefault();
        reset();
        onAction({ type: 'endActivation' });
      } else if (k === 'z') {
        if (ks.attackAbility) setUseAbility((v) => !v);
        else if (ks.freeAbilityReady) {
          if (ks.ab === 'sunburst') onAction({ type: 'battleAbility' });
          else setFreeAbility((v) => !v);
        }
      } else if (k === 's') setShowItems((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAction]);

  /** Cells enemies of the active unit's side can hit next round (move + melee reach, or line of sight for shooters). */
  const threat = useMemo(() => {
    const out = new Set<HexKey>();
    if (!showThreat || !active) return out;
    const foes = livingUnits(b).filter((u) => u.side !== active.side);
    for (const f of foes) {
      const stand = [f.pos!, ...reachableCells(state, f).keys()];
      if (UNITS[f.defId].attackType === 'ranged') {
        for (const c of arenaCells()) if (!b.obstacles.includes(c) && stand.some((p) => hasLineOfSight(state, p, c))) out.add(c);
      } else {
        for (const p of stand) for (const c of arenaCells()) if (distanceBetween(p, c) <= 1 && !b.obstacles.includes(c)) out.add(c);
      }
    }
    return out;
  }, [showThreat, active, b, state]);

  /** Predicted result of attacking `t` now (shown on hover). */
  function attackPreview(t: BattleUnit, moved = act?.movedDistance ?? 0): { text: string; lethal: boolean } {
    if (!active) return { text: '', lethal: false };
    if (t.status.shieldArmed) return { text: 'Tarcza zablokuje', lethal: false };
    let dmg = attackDamage(state, active, t, useAbility && attackAbility, moved);
    dmg = Math.max(0, dmg - t.status.damageReduction);
    const hard = abilityOf(t) === 'hardHead' && !t.abilityUsed && abilityActive(state, t) && dmg >= 2;
    if (hard) dmg = Math.max(0, dmg - ABILITY.hardHeadIgnore);
    const left = Math.max(0, t.hp - dmg);
    const note = hard ? ' (Twardogłowy)' : '';
    return left === 0 ? { text: `−${dmg} · pokona${note}`, lethal: true } : { text: `−${dmg} → ${left} Ż${note}`, lethal: false };
  }

  // ---------------------------------------------------------------- deployment
  const deploySide: FactionId | null = b.stage === 'deploy' && canAct ? b.needsDeploy[0] ?? null : null;
  const [placing, setPlacing] = useState<Record<string, HexKey>>({});
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    // Start from the current (default) placement each time a faction gets to deploy.
    if (!deploySide) return;
    const init: Record<string, HexKey> = {};
    for (const u of Object.values(b.units)) if (u.side === deploySide && u.pos) init[u.id] = u.pos;
    setPlacing(init);
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploySide, b.needsDeploy.length]);
  const deployable = new Set(deploySide ? deployCells(b, deploySide) : []);
  const posOf = (u: BattleUnit): HexKey | null => (deploySide && u.side === deploySide ? placing[u.id] ?? u.pos : walk[u.id] ?? u.pos);

  function placeAt(k: HexKey) {
    if (!picked || !deployable.has(k)) return;
    const occupant = Object.keys(placing).find((id) => placing[id] === k);
    const next = { ...placing, [picked]: k };
    if (occupant && occupant !== picked) next[occupant] = placing[picked];
    setPlacing(next);
    setPicked(null);
  }

  function clickUnit(u: BattleUnit) {
    if (deploySide) {
      if (u.side === deploySide) setPicked(picked === u.id ? null : u.id);
      else onShowCard(u.defId);
      return;
    }
    if (!myTurn || !active) {
      onShowCard(u.defId);
      return;
    }
    if (targeting) return pickForItem(u);
    if (freeAbility) {
      onAction({ type: 'battleAbility', targetId: u.id });
      reset();
      return;
    }
    if (targets.some((t) => t.id === u.id)) {
      onAction({ type: 'battleAttack', targetId: u.id, useAbility: useAbility && attackAbility });
      setUseAbility(false);
      return;
    }
    if (approach?.targetId === u.id && approachCells(u).includes(approach.cell)) {
      const steps = movePath(state, active, approach.cell).length - 1;
      pendingAttack.current = { targetId: u.id, useAbility: useAbility && attackAbility, at: Date.now() + steps * WALK_STEP_MS };
      setUseAbility(false);
      setApproach(null);
      onAction({ type: 'battleMove', to: approach.cell });
      return;
    }
    // A touch has no pointer to aim with: the first tap shows where the attack would come from, the second attacks.
    if (approachCells(u).length) return aimApproach(u, null);
    onShowCard(u.defId);
  }

  function clickCell(k: HexKey) {
    if (deploySide) {
      const own = Object.values(b.units).find((u) => u.side === deploySide && posOf(u) === k);
      if (own && !picked) setPicked(own.id);
      else placeAt(k);
      return;
    }
    const u = unitAt(b, k);
    if (u) return clickUnit(u);
    if (!myTurn) return;
    if (targeting?.kind === 'teleport' && targeting.unitId) {
      onAction({ type: 'battleItem', itemId: targeting.itemId, targetId: targeting.unitId, to: k });
      reset();
      return;
    }
    if (hops.includes(k)) return onAction({ type: 'battleHop', to: k });
    if (moves.has(k)) onAction({ type: 'battleMove', to: k });
  }

  function pickForItem(u: BattleUnit) {
    const t = targeting!;
    const fire = (extra: Partial<Extract<Action, { type: 'battleItem' }>>) => {
      onAction({ type: 'battleItem', itemId: t.itemId, ...extra });
      reset();
    };
    if (t.kind === 'ownLiving' && u.side === side && u.alive) fire({ targetId: u.id });
    else if (t.kind === 'enemy' && u.side !== side) fire({ targetId: u.id });
    else if (t.kind === 'lightning' && u.side !== side) {
      const picks = t.picks.includes(u.id) ? t.picks : [...t.picks, u.id];
      if (picks.length >= 2) fire({ targetIds: picks });
      else setTargeting({ ...t, picks });
    } else if (t.kind === 'courage' && u.side === side) {
      const picks = [...t.picks, u.id];
      if (picks.length >= 2) fire({ targetIds: picks });
      else setTargeting({ ...t, picks });
    } else if (t.kind === 'teleport' && u.side === side) setTargeting({ ...t, unitId: u.id });
    else if (t.kind === 'horn' && u.side === side && UNITS[u.defId].kind === 'support') {
      if (t.mode === 'extra') fire({ targetId: u.id, hornMode: 'extra' });
      else setTargeting({ ...t, unitId: u.id });
    }
  }

  function startItem(itemId: string) {
    const kind = state.items[itemId].kind;
    const tk = ITEM_TARGET[kind];
    if (!tk) return onAction({ type: 'battleItem', itemId });
    if (tk === 'lightning' || tk === 'courage') setTargeting({ kind: tk, itemId, picks: [] });
    else if (tk === 'teleport') setTargeting({ kind: 'teleport', itemId, unitId: null });
    else if (tk === 'horn') setTargeting({ kind: 'horn', itemId, mode: null, unitId: null });
    else setTargeting({ kind: tk, itemId });
  }

  const sides: Side[] = [b.attacker, b.defender];
  const deadOwn = side ? Object.values(b.units).filter((u) => u.side === side && !u.alive && !u.swappedOut) : [];
  const reserve = side ? state.factions[side].supportsAlive.filter((id) => !b.units[id]) : [];
  // Initiative order of the round (fastest first); units that already acted are dimmed.
  const queue = b.order.map((id, i) => ({ id, done: i < b.index, current: id === act?.unitId })).filter((q) => b.units[q.id]?.alive);
  /** Next round's initiative (living units by Speed). */
  const nextRound = livingUnits(b).sort((x, y) => unitSpeed(y) - unitSpeed(x)).map((u) => u.id);
  const hoverPreview = hover && active && moves.has(hover) ? hover : null;
  const breathPreview = useAbility && ab === 'fireBreath' && active ? targets.map((t) => breathSecondTarget(state, active, t)).filter(Boolean) : [];

  const sidePanel = (s: Side) => {
    const units = Object.values(b.units).filter((u) => u.side === s && !u.swappedOut);
    return (
      <Frame className="side side-battle" innerStyle={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Ribbon side={s}>{FACTION_NAMES[s]}</Ribbon>
        {units.map((u) => {
          const isActive = active?.id === u.id;
          return (
            <button key={u.id} className="btn" onClick={() => clickUnit(u)} {...details(() => <UnitDetails u={u} />)} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', opacity: u.alive ? 1 : 0.5 }}>
              <Portrait unitId={u.defId} size={50} ring={SIDE_RING[s]} dim={!u.alive} glow={isActive ? '0 0 0 2.5px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#F7EDD2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{UNITS[u.defId].name}</div>
                <HpBar hp={u.hp} max={u.maxHp} />
                <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
                  <StatIcon stat="Ż" light /> {u.hp}/{u.maxHp} · <StatIcon stat="A" light /> {UNITS[u.defId].attack + u.status.battleAttackBonus} · <StatIcon stat="S" light /> {unitSpeed(u)}
                  {u.abilityUsed && (
                    <>
                      {' · '}
                      <Marker name="ability_used" size={16} title="Zdolność zużyta" /> zużyta
                    </>
                  )}
                </div>
                <StatusChips u={u} />
              </div>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {s !== 'neutral' && (
          <div style={{ fontSize: 14, color: 'var(--muted)', padding: '0 0 10px 8px' }}>
            Rezerwa: {state.factions[s].supportsAlive.filter((id) => !b.units[id]).map((id) => UNITS[id].name).join(', ') || '—'}
          </div>
        )}
      </Frame>
    );
  };

  return (
    <div className="screen slate screen-enter">
      <div className="battle-curtain" />
      <div className="main-row battle-row">
        {sidePanel(sides[0])}
        <Frame crest className="grow arena-frame" innerClass="" innerStyle={{ background: '#14100A' }}>
          <div ref={wrapRef} className="scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex' }}>
            <div style={{ position: 'relative', flex: 'none', margin: 'auto', width: CANVAS_W * scale, height: CANVAS_H * scale, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
              {/* The painted board of the half of the map where the fight broke out. */}
              <img src={asset(`arena/${b.arena}.jpg`)} alt="" style={{ position: 'absolute', left: 0, top: 0, width: ART_SIZE.w, height: ART_SIZE.h }} />
              <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', left: 0, top: 0 }}>
                {/* The painted boards draw each hex with its own gold rim, and neighbouring rims do not always lie on
                    each other (doubled, overlapping edges). One even gold grid on top covers them. */}
                <g pointerEvents="none">
                  {arenaCells().map((k) => (
                    <polygon key={`gd${k}`} points={hexPoints(k)} fill="none" stroke="rgba(52,34,8,0.85)" strokeWidth="3.4" strokeLinejoin="round" />
                  ))}
                  {arenaCells().map((k) => (
                    <polygon key={`gl${k}`} points={hexPoints(k)} fill="none" stroke="#E4C16E" strokeWidth="1.6" strokeLinejoin="round" />
                  ))}
                </g>
                {arenaCells().map((k) => {
                  const teleportTo = targeting?.kind === 'teleport' && Boolean(targeting.unitId) && !unitAt(b, k) && !b.obstacles.includes(k);
                  let fill = 'transparent';
                  if (deployable.has(k)) fill = picked ? (hover === k ? 'rgba(243,210,122,0.5)' : 'rgba(243,210,122,0.28)') : 'rgba(243,210,122,0.18)';
                  else if (moves.has(k)) fill = hoverPreview === k ? 'rgba(158,228,255,0.45)' : 'rgba(158,228,255,0.2)';
                  else if (hops.includes(k)) fill = 'rgba(158,228,255,0.28)';
                  else if (teleportTo) fill = 'rgba(200,160,255,0.25)';
                  return (
                    <polygon
                      key={k}
                      points={hexPoints(k)}
                      fill={fill}
                      stroke={moves.has(k) || hops.includes(k) ? 'rgba(190,240,255,0.75)' : 'none'}
                      strokeWidth="1.5"
                      onClick={() => clickCell(k)}
                      onMouseEnter={() => setHover(k)}
                      onMouseLeave={() => setHover(null)}
                      className={moves.has(k) || hops.includes(k) ? moveCursor : (deployable.has(k) && picked) || teleportTo ? 'cur-pointer' : undefined}
                    />
                  );
                })}
                {active?.pos && <polygon points={hexPoints(active.pos, 2)} fill="rgba(158,228,255,0.15)" stroke="#9EE4FF" strokeWidth="3" pointerEvents="none" />}
                {approach && <polygon points={hexPoints(approach.cell, 2)} fill="rgba(243,210,122,0.35)" stroke="#F3D27A" strokeWidth="3.5" pointerEvents="none" />}
                {[...deployable].map((k) => (
                  <polygon key={`dp${k}`} points={hexPoints(k, 3)} fill="none" stroke="#F3D27A" strokeWidth={hover === k && picked ? 3.5 : 2} strokeDasharray={picked ? undefined : '5 4'} pointerEvents="none" />
                ))}
                {[...threat].map((k) => (
                  <polygon key={`th${k}`} points={hexPoints(k, 3)} fill="rgba(224,60,40,0.16)" stroke="rgba(224,80,60,0.55)" strokeWidth="1.5" strokeDasharray="4 3" pointerEvents="none" />
                ))}
                {targets.map((t) => (
                  <polygon key={t.id} points={hexPoints(t.pos!, 2)} fill="rgba(224,80,60,0.16)" stroke="#E0503C" strokeWidth="3" pointerEvents="none" />
                ))}
                {breathPreview.map((t) => (
                  <polygon key={`b${t!.id}`} points={hexPoints(t!.pos!, 6)} fill="none" stroke="#FF9A3A" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />
                ))}
              </svg>
              {/* Units with a model stand on the arena as 3D figures; their tokens below keep only the HP and markers. */}
              <FigureLayer
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ zIndex: 1 }}
                pieces={livingUnits(b)
                  .filter((u) => figureFor(u.defId) && posOf(u))
                  .map((u): Piece => {
                    const c = cellCenter(posOf(u)!);
                    const melee = lastStrike(u.id, false);
                    const shot = lastStrike(u.id, true);
                    // Until it moves, a unit faces the enemies (the middle of where they stand).
                    const enemies = livingUnits(b).filter((e) => e.side !== u.side && e.pos).map((e) => cellCenter(e.pos!));
                    const face = enemies.length ? { x: enemies.reduce((s, e) => s + e.x, 0) / enemies.length - c.x, y: enemies.reduce((s, e) => s + e.y, 0) / enemies.length - c.y } : undefined;
                    const isActive = deploySide ? picked === u.id : active?.id === u.id;
                    return {
                      key: u.id,
                      unitId: u.defId,
                      x: c.x,
                      y: c.y + 8,
                      size: 54,
                      moveMs: walk[u.id] ? WALK_STEP_MS : 300,
                      ring: isActive ? '#9EE4FF' : targets.some((t) => t.id === u.id) || approach?.targetId === u.id ? '#E0503C' : SIDE_RING[u.side],
                      lungeAt: melee ? { ...cellCenter(melee.to), key: melee.key } : null,
                      lookAt: shot ? cellCenter(shot.to) : null,
                      hit: hitIds.includes(u.id),
                      face,
                    };
                  })}
              />
              {livingUnits(b).map((u) => {
                const figure = figureFor(u.defId);
                const { x, y } = cellPos(posOf(u)!);
                const isActive = deploySide ? picked === u.id : active?.id === u.id;
                const isTarget = targets.some((t) => t.id === u.id);
                const strike = lastStrike(u.id, false);
                const lunge = strike ? (() => {
                  const a = cellPos(strike.from);
                  const t = cellPos(strike.to);
                  return { dx: (t.x - a.x) * 0.35, dy: (t.y - a.y) * 0.35 };
                })() : null;
                const approaching = approach?.targetId === u.id && active ? approach.cell : null;
                const aimed = aimedOver(u);
                const preview =
                  hover !== u.pos && !approaching
                    ? null
                    : isTarget
                      ? attackPreview(u)
                      : approaching
                        ? attackPreview(u, movePath(state, active!, approaching).length - 1)
                        : unitCursor(u) === 'cur-blocked'
                          ? { text: 'Przeszkoda zasłania cel', lethal: false }
                          : null;
                return (
                  <button
                    key={u.id}
                    className={`hexbtn token ${walk[u.id] ? 'walking' : ''} ${hitIds.includes(u.id) ? 'hit' : ''} ${lunge ? 'lunge' : ''} ${aimed ? '' : unitCursor(u)}`}
                    onClick={() => clickUnit(u)}
                    {...details(() => <UnitDetails u={u} />)}
                    onMouseEnter={() => setHover(u.pos)}
                    onPointerMove={(e) => e.pointerType !== 'touch' && aimApproach(u, { x: e.clientX, y: e.clientY, box: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={() => {
                      setHover(null);
                      if (approach?.targetId === u.id) setApproach(null);
                    }}
                    // A figure is taller than a portrait token: the box covers it, so clicking the figure works.
                    style={{ position: 'absolute', left: x + W / 2 - 27, top: y + H / 2 - (figure ? 58 : 38), width: 54, height: figure ? 80 : 60, zIndex: lunge ? 4 : 2, ...(aimed ? { cursor: aimed } : {}), ...(lunge && !figure ? ({ '--lx': `${lunge.dx}px`, '--ly': `${lunge.dy}px` } as React.CSSProperties) : {}) }}
                  >
                    {!figure && <div style={{ position: 'absolute', left: 4, right: 4, bottom: -4, height: 16, borderRadius: '50%', background: 'rgba(6,10,2,0.55)', pointerEvents: 'none' }} />}
                    {!figure && <Portrait
                      unitId={u.defId}
                      size={54}
                      // No card popping up over an enemy you are about to attack: it would hide the lit cell (the card is under the right button).
                      preview={!isTarget && !approachCells(u).length}
                      ring={SIDE_RING[u.side]}
                      glow={isActive ? '0 0 0 3px #9EE4FF, 0 0 20px 6px rgba(158,228,255,0.75)' : isTarget ? '0 0 0 3px #E0503C, 0 0 18px 5px rgba(224,80,60,0.7)' : '0 0 0 1.5px #1E1204, 0 8px 12px rgba(0,0,0,0.55)'}
                    />}
                    {statusList(u).length > 0 && (
                      <div style={{ position: 'absolute', left: '50%', top: -13, transform: 'translateX(-50%)', pointerEvents: 'none', display: 'flex', gap: 1, zIndex: 3 }}>
                        {statusList(u).map((st) => (
                          <StatusBadge key={st.label} st={st} size={25} />
                        ))}
                      </div>
                    )}
                    {u.abilityUsed && (
                      <span style={{ position: 'absolute', left: -12, bottom: -2, pointerEvents: 'none', zIndex: 3 }}>
                        <Marker name="ability_used" size={24} title="Zdolność zużyta" />
                      </span>
                    )}
                    <div className="plate parch" style={{ position: 'absolute', right: -16, bottom: 0, height: 22, padding: '0 6px 0 4px', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 800, fontSize: 16, pointerEvents: 'none' }}>
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 64 64"><use href="#iHeart" /></svg>
                      {u.hp}
                    </div>
                    {preview && (
                      <div
                        className="plate parch"
                        style={{ position: 'absolute', left: '50%', top: -34, transform: 'translateX(-50%)', padding: '1px 8px', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 15, color: preview.lethal ? '#8A1A1A' : '#2B1D10', boxShadow: preview.lethal ? '0 0 0 2px #E0503C, 0 0 10px rgba(224,80,60,0.6)' : undefined, pointerEvents: 'none', zIndex: 5 }}
                      >
                        <StatText text={preview.text} />
                      </div>
                    )}
                  </button>
                );
              })}
              {seals.map((se) => {
                const { x, y } = cellPos(se.pos);
                return (
                  <div key={se.key}>
                    <div className="ring-wave" style={{ left: x + W / 2, top: y + H / 2 - 8, ['--rc' as string]: se.color } as React.CSSProperties} />
                    <img className="seal" src={asset(`cards/abilities/${se.ability}.png`)} alt="" style={{ left: x + W / 2, top: y + H / 2 - 40 }} />
                  </div>
                );
              })}
              {shards.map((sh) => {
                const { x, y } = cellPos(sh.pos);
                return Array.from({ length: sh.gold ? 14 : 8 }, (_, i) => {
                  const a = (i / (sh.gold ? 14 : 8)) * Math.PI * 2 + (i % 3) * 0.3;
                  const d = 28 + (i % 4) * 10;
                  return <span key={`${sh.key}${i}`} className={`shard ${sh.gold ? 'gold' : ''}`} style={{ left: x + W / 2, top: y + H / 2 - 8, ['--hx' as string]: `${Math.cos(a) * d}px`, ['--hy' as string]: `${Math.sin(a) * d}px` } as React.CSSProperties} />;
                });
              })}
              {ghosts.map((g) => {
                const { x, y } = cellPos(g.pos);
                return (
                  <div key={g.key} className="ghost" style={{ position: 'absolute', left: x + W / 2 - 27, top: y + H / 2 - 38, pointerEvents: 'none', zIndex: 3 }}>
                    <Portrait unitId={g.defId} size={54} ring={SIDE_RING[g.side]} preview={false} />
                  </div>
                );
              })}
              {strikes
                .filter((st) => st.ranged)
                .map((st) => {
                  const a = cellPos(st.from);
                  const t = cellPos(st.to);
                  return (
                    <div
                      key={st.key}
                      className="projectile"
                      style={{ left: a.x + W / 2 - 7, top: a.y + H / 2 - 20, ['--px' as string]: `${t.x - a.x}px`, ['--py' as string]: `${t.y - a.y}px` } as React.CSSProperties}
                    />
                  );
                })}
              {rollPops.map((p) => (
                <div key={p.key} className="roll-pop" style={{ left: p.x, top: p.y }}>
                  {p.roll.die !== null && <DieFace value={p.roll.die} size={28} />}
                  {p.roll.damage === 0 && <DamageDrop amount={0} size={28} />}
                </div>
              ))}
              {floaters.map((f) => (
                <div key={f.key} className={`dmg ${f.amount > 0 ? 'heal' : ''}`} style={{ left: f.x, top: f.y }}>
                  {f.amount > 0 ? `+${f.amount}` : <DamageDrop amount={-f.amount} size={26} />}
                </div>
              ))}
              {lastRoll && b.units[lastRoll.attackerId] && (
                <div className="plate parch" style={{ position: 'absolute', left: 14, top: 18, padding: '4px 10px', fontSize: 14, zIndex: 6, pointerEvents: 'none', maxWidth: '60%' }}>
                  <LastAttack roll={lastRoll} units={b.units} size={20} />
                </div>
              )}
              <button
                className={`btn plate parch ${showThreat ? 'on' : ''}`}
                title="Pokaż, gdzie dosięgną Cię wrogowie (T)"
                onClick={() => setShowThreat((v) => !v)}
                style={{ position: 'absolute', right: 14, top: 18, padding: '4px 10px', fontSize: 14, zIndex: 6 }}
              >
                Zasięg wrogów
              </button>
              <div style={{ position: 'absolute', left: '50%', top: 14, transform: 'translateX(-50%)' }}>
                <Ribbon style={{ width: 340 }}>{`${b.kind === 'neutral' ? 'Bitwa o kryształ' : 'Starcie bohaterów'} · ${b.stage === 'deploy' ? 'ustawienie' : `runda ${b.round}`}`}</Ribbon>
              </div>
            </div>
            </div>
          </div>
        </Frame>
        {sidePanel(sides[1])}
      </div>

      <Frame className="bar sticky-mobile" style={{ height: 112 }} innerStyle={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {active && <span className="hide-mobile"><Portrait unitId={active.defId} size={56} ring={SIDE_RING[active.side]} glow="0 0 0 2.5px #9EE4FF" /></span>}
          <div className="act-info" style={{ width: 170 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#F3D27A', lineHeight: 1.1 }}>{b.stage === 'deploy' ? 'Ustawienie wojsk' : active ? UNITS[active.defId].name : '—'}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              {b.stage === 'deploy'
                ? deploySide
                  ? picked
                    ? 'Wskaż złote pole w swojej kolumnie'
                    : 'Kliknij jednostkę, potem pole'
                  : `${FACTION_NAMES[b.needsDeploy[0]]} ustawia jednostki…`
                : !myTurn
                ? 'Ruch przeciwnika…'
                : act!.hop
                  ? 'Wybierz pole odskoku'
                  : !act!.acted && active!.status.rootedNext
                    ? targets.length
                      ? 'Unieruchomiony — może tylko atakować'
                      : 'Unieruchomiony (Pajęcze Sidła) — zakończ'
                  : !act!.acted && moves.size === 0 && targets.length === 0
                    ? 'Brak ruchu i celu — zakończ'
                    : act!.moveOnly
                      ? 'Dodatkowy ruch'
                      : act!.attacked
                        ? 'Atak wykonany'
                        : act!.moved
                          ? targets.length
                            ? 'Wybierz cel ataku'
                            : 'Brak celu — zakończ'
                          : 'Ruch, potem atak'}
            </div>
          </div>
        </div>
        {deploySide && (
          <button
            className="btn prim"
            style={{ height: 60, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 19 }}
            onClick={() => onAction({ type: 'deployUnits', faction: deploySide, positions: placing })}
          >
            <Medal fill="mRed" glyph="gSwords" size={32} />
            Gotowe — do bitwy
          </button>
        )}
        {myTurn && active && (
          <div style={{ display: 'flex', gap: 8 }}>
            {attackAbility && (
              <button className={`btn plate parch act-btn ${useAbility ? 'on' : ''}`} style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={() => setUseAbility(!useAbility)} title={UNITS[active.defId].abilityText}>
                <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 34, height: 34 }} />
                <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}{useAbility ? ' ✓' : ''}</span>
              </button>
            )}
            {freeAbilityReady && (
              <button
                className={`btn plate parch act-btn ${freeAbility ? 'on' : ''}`}
                style={{ width: 120, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                title={UNITS[active.defId].abilityText}
                onClick={() => (ab === 'sunburst' ? onAction({ type: 'battleAbility' }) : setFreeAbility(!freeAbility))}
              >
                <img src={asset(`cards/abilities/${abilityOf(active)}.png`)} alt="" style={{ width: 34, height: 34 }} />
                <span style={{ fontSize: 13, lineHeight: 1.05, textAlign: 'center' }}>{UNITS[active.defId].abilityName}</span>
              </button>
            )}
            <button className="btn prim act-btn" style={{ width: 96, height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 15 }} onClick={() => { reset(); onAction({ type: 'endActivation' }); }}>
              <Medal fill="mGreen" glyph="gHourglass" size={30} />
              {act!.hop ? 'Pomiń' : 'Koniec'}
            </button>
          </div>
        )}
        <div className="well hide-mobile" style={{ height: 76, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', maxWidth: 520 }}>
          <div className="lbl" style={{ marginRight: 2 }}>Kolejka</div>
          {queue
            .filter((q) => !q.done || q.current)
            .map((q) => (
              <div key={q.id} style={{ position: 'relative', flex: 'none' }} title={UNITS[b.units[q.id].defId].name}>
                <Portrait unitId={b.units[q.id].defId} size={q.current ? 48 : 38} ring={SIDE_RING[b.units[q.id].side]} glow={q.current ? '0 0 0 2.5px #9EE4FF' : undefined} />
                <div className="plate parch" style={{ position: 'absolute', right: -6, bottom: -6, width: 20, height: 18, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{unitSpeed(b.units[q.id])}</div>
              </div>
            ))}
          <div title="Następna runda" style={{ flex: 'none', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 4, margin: '0 2px', color: '#E7CF8F', fontWeight: 800, fontSize: 13 }}>
            <div style={{ width: 2, height: '60%', background: 'linear-gradient(#0000, #B88A35, #0000)' }} />R{b.round + 1}
          </div>
          {nextRound.map((id) => (
            <div key={`n${id}`} style={{ flex: 'none', opacity: 0.6 }} title={`${UNITS[b.units[id].defId].name} — następna runda`}>
              <Portrait unitId={b.units[id].defId} size={30} ring={SIDE_RING[b.units[id].side]} />
            </div>
          ))}
        </div>
        <div className="footer-slot" style={{ flex: 1, minWidth: 0 }}>{footer}</div>
      </Frame>

      {myTurn && side && (
        <div className="items-float" style={{ position: 'absolute', right: 300, bottom: 150, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: 'calc(100vw - 24px)' }}>
          {targeting && (
            <div className="plate parch" style={{ padding: '6px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
              <b>{ITEMS[state.items[targeting.itemId].kind].name}:</b>
              {targeting.kind === 'horn' && !targeting.mode ? (
                <>
                  <button className="btn prim" style={{ padding: '2px 10px' }} onClick={() => setTargeting({ ...targeting, mode: 'swap' })}>Wymiana</button>
                  <button className="btn prim" style={{ padding: '2px 10px' }} onClick={() => setTargeting({ ...targeting, mode: 'extra' })}>Dodatkowa aktywacja</button>
                </>
              ) : targeting.kind === 'horn' && targeting.mode === 'swap' && targeting.unitId ? (
                reserve.map((id) => (
                  <button key={id} className="btn prim" style={{ padding: '2px 10px' }} onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetId: targeting.unitId!, hornMode: 'swap', reserveId: id }); reset(); }}>{UNITS[id].name}</button>
                ))
              ) : targeting.kind === 'ownDead' ? (
                deadOwn.map((u) => (
                  <button key={u.id} className="btn prim" style={{ padding: '2px 10px' }} onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetId: u.id }); reset(); }}>{UNITS[u.defId].name}</button>
                ))
              ) : (
                <span>{targetHint(targeting)}</span>
              )}
              {(targeting.kind === 'lightning' || targeting.kind === 'courage') && targeting.picks.length > 0 && (
                <button className="btn prim" style={{ padding: '2px 10px' }} onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetIds: targeting.picks }); reset(); }}>Gotowe</button>
              )}
              <button className="btn plate parch" style={{ padding: '2px 8px' }} onClick={reset}>Anuluj</button>
            </div>
          )}
          {freeAbility && <div className="plate parch" style={{ padding: '6px 12px', fontSize: 15 }}>{ab === 'giftOfLife' ? 'Wybierz sojusznika do uleczenia.' : 'Wybierz wroga w zasięgu 4 pól.'}</div>}
          <button className="btn plate parch" style={{ padding: '4px 12px', fontSize: 15 }} onClick={() => setShowItems(!showItems)}>
            {showItems ? 'Ukryj skarby' : `Skarby (${state.factions[side].inventory.length})`}
          </button>
          {showItems &&
            state.factions[side].inventory.map((id) => {
              const def = ITEMS[state.items[id].kind];
              const ok = itemsAllowed && def.usableIn.includes('battle') && !(def.kind === 'resurrection' && !deadOwn.length) && !(def.kind === 'horn' && !alliesOf(b, active!).concat(active!).some((x) => UNITS[x.defId].kind === 'support'));
              return (
                <div key={id} className="plate parch" style={{ width: 'min(330px, calc(100vw - 24px))', padding: '5px 9px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn" title="Pokaż kartę skarbu" onClick={() => onShowCard(`item:${def.kind}`)} style={{ background: 'none', border: 0, padding: 0, flex: 'none' }}>
                    <img {...hoverCard(`item:${def.kind}`)} src={asset(`cards/treasures/${def.kind}.jpg`)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px #B88A35, 0 0 0 3px #3A2508' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{def.name}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.15 }}><StatText text={def.text} /></div>
                  </div>
                  <button className="btn prim" disabled={!ok} style={{ padding: '3px 10px', fontSize: 14 }} onClick={() => startItem(id)}>Użyj</button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

interface StatusInfo {
  label: string;
  glyph: string;
  /** Board-game marker for this state, when there is one. */
  marker?: MarkerName;
  buff: boolean;
  /** Small value shown on the badge (e.g. −2, +1). */
  value?: string;
}

/** Visible effects on a unit, so rules like Pajęcze Sidła never look like a frozen turn. */
function statusList(u: BattleUnit): StatusInfo[] {
  const s = u.status;
  const out: StatusInfo[] = [];
  // A marker carries its own number; the badge repeats it only when the value differs.
  if (s.rootedNext) out.push({ label: 'Unieruchomiony w następnej aktywacji (Pajęcze Sidła)', glyph: 'sWeb', marker: 'rooted', buff: false });
  if (s.slowNext) out.push({ label: `−${s.slowNext} S w następnej aktywacji (Splątane Korzenie)`, glyph: 'sRoot', marker: 'slowed', buff: false, value: s.slowNext !== 2 ? `−${s.slowNext}` : undefined });
  if (s.cursedNext) out.push({ label: `−${s.cursedNext} A przy następnym ataku (Złowroga Klątwa)`, glyph: 'sSkull', marker: 'cursed', buff: false, value: s.cursedNext !== 1 ? `−${s.cursedNext}` : undefined });
  if (s.nextAttackBonus) out.push({ label: `+${s.nextAttackBonus} A przy następnym ataku`, glyph: 'sBlade', marker: 'attack_up', buff: true, value: s.nextAttackBonus !== 1 ? `+${s.nextAttackBonus}` : undefined });
  if (s.shieldArmed) out.push({ label: 'Tarcza Strażnika: neguje następny atak', glyph: 'sGuard', marker: 'shield', buff: true });
  if (u.maxHp > UNITS[u.defId].hp) out.push({ label: `+${u.maxHp - UNITS[u.defId].hp} maks. Ż do końca bitwy (Eliksir Żywotności)`, glyph: 'sGuard', marker: 'vitality', buff: true, value: u.maxHp - UNITS[u.defId].hp !== 4 ? `+${u.maxHp - UNITS[u.defId].hp}` : undefined });
  if (s.battleAttackBonus) out.push({ label: `+${s.battleAttackBonus} A do końca bitwy`, glyph: 'sBlade', buff: true, value: `+${s.battleAttackBonus}` });
  if (s.battleSpeedBonus) out.push({ label: `+${s.battleSpeedBonus} S do końca bitwy`, glyph: 'sBoltG', marker: 'speed_up', buff: true, value: s.battleSpeedBonus !== 3 ? `+${s.battleSpeedBonus}` : undefined });
  if (s.damageReduction) out.push({ label: `−${s.damageReduction} otrzymanych obrażeń`, glyph: 'sStone', buff: true, value: `−${s.damageReduction}` });
  return out;
}

/** Small gilded medallion: green for buffs, crimson for debuffs, value on a parchment tab. */
function StatusBadge({ st, size = 22 }: { st: StatusInfo; size?: number }) {
  return (
    <span title={st.label} style={{ position: 'relative', width: size, height: size, flex: 'none', display: 'inline-block', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))', animation: 'pop-in 0.3s ease-out both' }}>
      {st.marker ? (
        <img src={asset(`markers/${st.marker}.png`)} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
      ) : (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="19" fill="url(#mRing)" stroke="#1E1204" strokeWidth="1.4" />
          <circle cx="20" cy="20" r="15.4" fill={st.buff ? 'url(#stBuff)' : 'url(#stDebuff)'} stroke="#1E1204" strokeWidth="1" />
          <use href={`#${st.glyph}`} />
        </svg>
      )}
      {st.value && (
        <span
          className="parch"
          style={{ position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%)', padding: '0 3px', borderRadius: 3, border: '1px solid #B88A35', fontSize: 10, fontWeight: 800, lineHeight: '11px', color: st.buff ? '#1D5233' : '#7A1418', whiteSpace: 'nowrap' }}
        >
          {st.value}
        </span>
      )}
    </span>
  );
}

/** Right button on a unit in battle: its card with the current values, Życie and every effect on it. */
function UnitDetails({ u }: { u: BattleUnit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
      <UnitCard unitId={u.defId} width={280} hp={u.hp} attack={UNITS[u.defId].attack + u.status.battleAttackBonus} speed={unitSpeed(u)} />
      <div className="plate slate" style={{ padding: '8px 12px', borderRadius: 10, boxShadow: '0 0 0 2px #B88A35, 0 8px 18px rgba(0,0,0,0.6)' }}>
        <HpBar hp={u.hp} max={u.maxHp} />
        <div style={{ fontSize: 15, color: '#F7EDD2', marginTop: 6 }}>
          <StatIcon stat="Ż" light /> {u.hp}/{u.maxHp}
          {u.abilityUsed && (
            <>
              {' · '}
              <Marker name="ability_used" size={18} title="Zdolność zużyta" /> zdolność zużyta
            </>
          )}
        </div>
        {statusList(u).length === 0 && !u.abilityUsed && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>Bez dodatkowych efektów.</div>}
        <StatusChips u={u} />
      </div>
    </div>
  );
}

function StatusChips({ u }: { u: BattleUnit }) {
  const list = statusList(u);
  if (!list.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {list.map((x) => (
        <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, lineHeight: 1.15, color: x.buff ? '#BFE6B0' : '#F2B6AA' }}>
          <StatusBadge st={{ ...x, value: undefined }} size={18} />
          <StatText text={x.label} />
        </div>
      ))}
    </div>
  );
}

function targetHint(t: ItemTargeting): string {
  switch (t.kind) {
    case 'ownLiving':
      return 'wybierz własną jednostkę';
    case 'enemy':
      return 'wybierz wroga';
    case 'lightning':
      return `wybierz do 2 wrogów (${t.picks.length}/2)`;
    case 'courage':
      return t.picks.length ? 'wybierz sąsiedniego sojusznika lub „Gotowe”' : 'wybierz jednostkę';
    case 'teleport':
      return t.unitId ? 'wybierz wolne pole obok sojusznika' : 'wybierz jednostkę do teleportu';
    case 'horn':
      return t.mode === 'extra' ? 'wybierz pomocnika' : 'wybierz pomocnika do wymiany';
    default:
      return '';
  }
}

export const distanceBetween = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b));
