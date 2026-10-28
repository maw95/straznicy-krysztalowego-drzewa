import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UNITS, type FactionId, type Side } from '../engine/data';
import {
  abilityActive,
  abilityOf,
  ATTACK_ABILITIES,
  predictDamage,
  attackTargets,
  breathSecondTarget,
  hasLineOfSight,
  FREE_ABILITIES,
  hopCells,
  livingUnits,
  movePath,
  reachableCells,
  unitAt,
} from '../engine/battle';
import { distance, parseKey, type HexKey } from '../engine/hex';
import type { Action, BattleUnit, GameState } from '../engine/types';
import { COMPACT_QUERY, useMedia } from './common';
import { CANVAS_H, CANVAS_W, CELLS, cellPos, TOKEN_H as H, TOKEN_W as W } from './arenaGeometry';
import { aimedCursor, preloadAimedCursors, type AimedCursor } from './cursors';
import { ArenaBoard } from './ArenaBoard';
import { ActivationBar, activationHint } from './ActivationBar';
import { SidePanel } from './BattleSidePanel';
import { ItemsPanel, type ItemTargeting } from './ItemsPanel';
import { useBattleAnimations, WALK_STEP_MS } from './useBattleAnimations';
import { useDeployment } from './useDeployment';

export { WALK_STEP_MS };

/** On phones only the cells and a little of the painting round them are shown, so the hexes come out bigger. */
const FULL_VIEW = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
const PHONE_VIEW = { x: 55, y: 40, w: 790, h: CANVAS_H - 40 };

interface Props {
  state: GameState;
  canAct: boolean;
  onAction: (a: Action) => void;
  onShowCard: (unitId: string) => void;
  footer: React.ReactNode;
}

export function BattleView({ state, canAct, onAction, onShowCard, footer }: Props) {
  const view = useMedia(COMPACT_QUERY) ? PHONE_VIEW : FULL_VIEW;
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
    if (!el || !activePos || (el.scrollWidth <= el.clientWidth + 2 && el.scrollHeight <= el.clientHeight + 2)) return;
    const { x, y } = cellPos(activePos);
    el.scrollTo({ left: Math.max(0, (x + W / 2 - view.x) * scale - el.clientWidth / 2), top: Math.max(0, (y + H / 2 - view.y) * scale - el.clientHeight / 2), behavior: 'smooth' });
  }, [b.activation?.unitId, activePos, scale, view]);

  const anim = useBattleAnimations(state);
  // Ctrl held over a unit shows its reach: where it can walk and what it can hit next.
  const [ctrlHeld, setCtrlHeld] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setCtrlHeld(e.ctrlKey);
    const off = () => setCtrlHeld(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', off);
    };
  }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // On phones the whole width always shows; a low screen (held sideways) keeps the hexes finger-sized
    // and scrolls up and down instead of shrinking the arena further.
    const fit = () => {
      const whole = Math.min(el.clientWidth / view.w, el.clientHeight / view.h);
      setScale(view === PHONE_VIEW ? Math.min(el.clientWidth / view.w, Math.max(whole, 0.62)) : whole);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, [view]);

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
  const approachCellsOf = (u: BattleUnit): HexKey[] => {
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
  const unitCursorOf = (u: BattleUnit, approachable: boolean, engaged: boolean): string => {
    if (!active?.pos || !u.pos) return '';
    if (approachable) return 'cur-melee';
    // A ranged unit shoots even at a neighbour (it must, when one stands next to it): always the arrow.
    if (targets.some((t) => t.id === u.id)) return UNITS[active.defId].attackType === 'melee' ? 'cur-melee' : 'cur-ranged';
    const canShoot = myTurn && !act!.attacked && !act!.moveOnly && !act!.hop && !targeting && !freeAbility && UNITS[active.defId].attackType === 'ranged';
    if (!canShoot || u.side === active.side) return '';
    return !engaged && !hasLineOfSight(state, active.pos, u.pos) ? 'cur-blocked' : '';
  };
  /** Approach cells and cursor of every unit, worked out once per change instead of on each use. */
  const unitInfo = useMemo(() => {
    const engaged = Boolean(active?.pos) && livingUnits(b).some((e) => e.side !== active!.side && e.pos && distanceBetween(active!.pos!, e.pos) === 1);
    const out = new Map<string, { approach: HexKey[]; cursor: string }>();
    for (const u of Object.values(b.units)) {
      const approach = approachCellsOf(u);
      out.set(u.id, { approach, cursor: unitCursorOf(u, approach.length > 0, engaged) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, b, myTurn, active, act, moves, targets, targeting, freeAbility]);
  const approachCells = (u: BattleUnit): HexKey[] => unitInfo.get(u.id)?.approach ?? [];
  const unitCursor = (u: BattleUnit): string => unitInfo.get(u.id)?.cursor ?? '';
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

  function reset() {
    setTargeting(null);
    setFreeAbility(false);
  }

  // Battle shortcuts: Space ends the activation, Z ability, S treasures.
  const keyState = useRef({ myTurn, attackAbility, freeAbilityReady, ab });
  keyState.current = { myTurn, attackAbility, freeAbilityReady, ab };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || document.querySelector('.overlay:not(.leaving)')) return;
      const k = e.key.toLowerCase();
      const ks = keyState.current;
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

  /** The reach of the unit under the cursor while Ctrl is held: the cells it can walk to, and the ones it can
   *  hit from there (next to them for melee, any cell in sight for shooters). */
  const reachOf = ctrlHeld && hover ? livingUnits(b).find((u) => u.pos === hover) ?? null : null;
  const reach = useMemo(() => {
    const walk = new Set<HexKey>();
    const hit = new Set<HexKey>();
    if (!reachOf?.pos) return { walk, hit };
    for (const k of reachableCells(state, reachOf).keys()) walk.add(k);
    const stand = [reachOf.pos, ...walk];
    for (const c of CELLS) {
      if (b.obstacles.includes(c) || walk.has(c) || c === reachOf.pos) continue;
      const hits = UNITS[reachOf.defId].attackType === 'ranged' ? stand.some((p) => hasLineOfSight(state, p, c)) : stand.some((p) => distanceBetween(p, c) <= 1);
      if (hits) hit.add(c);
    }
    return { walk, hit };
  }, [reachOf, b, state]);

  /** Predicted result of attacking `t` now (shown on hover). */
  function attackPreview(t: BattleUnit, moved = act?.movedDistance ?? 0): { text: string; lethal: boolean } {
    if (!active) return { text: '', lethal: false };
    // The engine's own reckoning (reactions in its order), so the preview and the blow always agree.
    const p = predictDamage(state, active, t, { useAbility: useAbility && attackAbility, movedDistance: moved });
    if (p.shield) return { text: 'Tarcza zablokuje', lethal: false };
    const note = p.bearGuard === 'ally' ? ` (${UNITS[p.victim.defId].name} przyjmie cios)` : p.bearGuard === 'self' ? ' (Opiekun Gaju)' : p.hardHead !== null ? ' (Twardogłowy)' : '';
    if (p.bearGuard === 'ally') return { text: `−${p.damage}${note}`, lethal: false };
    const left = Math.max(0, t.hp - p.damage);
    return p.lethal ? { text: `−${p.damage} · pokona${note}`, lethal: true } : { text: `−${p.damage} → ${left} Ż${note}`, lethal: false };
  }

  // ---------------------------------------------------------------- deployment
  const deploy = useDeployment(b, canAct, anim.walk);
  const { deploySide, picked, setPicked, posOf, placeAt } = deploy;

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

  const living = livingUnits(b);
  const hoverPreview = hover && active && moves.has(hover) ? hover : null;
  const breathPreview = useAbility && ab === 'fireBreath' && active ? targets.map((t) => breathSecondTarget(state, active, t)).filter(Boolean) : [];

  /** The note over a unit under the pointer: the blow it would take, or why it cannot be shot. */
  const previewOf = (u: BattleUnit): { text: string; lethal: boolean } | null => {
    const approaching = approach?.targetId === u.id && active ? approach.cell : null;
    if (hover !== u.pos && !approaching) return null;
    if (targets.some((t) => t.id === u.id)) return attackPreview(u);
    if (approaching) return attackPreview(u, movePath(state, active!, approaching).length - 1);
    return unitCursor(u) === 'cur-blocked' ? { text: 'Przeszkoda zasłania cel', lethal: false } : null;
  };

  const sides: Side[] = [b.attacker, b.defender];
  return (
    <div className="screen slate screen-enter play">
      <div className="battle-curtain" />
      <div className="main-row battle-row play-row">
        <SidePanel s={sides[0]} state={state} active={active} onUnit={clickUnit} />
        <ArenaBoard
          state={state}
          wrapRef={wrapRef}
          view={view}
          scale={scale}
          anim={anim}
          deploy={deploy}
          targeting={targeting}
          hover={hover}
          setHover={setHover}
          active={active}
          living={living}
          moves={moves}
          hops={hops}
          targets={targets}
          hoverPreview={hoverPreview}
          moveCursor={moveCursor}
          approach={approach}
          setApproach={setApproach}
          reach={reach}
          breathPreview={breathPreview}
          approachCells={approachCells}
          unitCursor={unitCursor}
          aimedOver={aimedOver}
          previewOf={previewOf}
          aimApproach={aimApproach}
          onCell={clickCell}
          onUnit={clickUnit}
        />
        <SidePanel s={sides[1]} state={state} active={active} onUnit={clickUnit} />
      </div>

      <ActivationBar
        state={state}
        active={active}
        hint={activationHint(b, { deploySide, picked, myTurn, moves: moves.size, targets: targets.length })}
        myTurn={myTurn}
        deploySide={deploySide}
        placing={deploy.placing}
        attackAbility={attackAbility}
        useAbility={useAbility}
        setUseAbility={setUseAbility}
        freeAbilityReady={freeAbilityReady}
        freeAbility={freeAbility}
        setFreeAbility={setFreeAbility}
        onAction={onAction}
        reset={reset}
        footer={footer}
      />

      {myTurn && side && (
        <ItemsPanel
          state={state}
          side={side}
          active={active!}
          targeting={targeting}
          setTargeting={setTargeting}
          freeAbility={freeAbility}
          ab={ab}
          showItems={showItems}
          setShowItems={setShowItems}
          onAction={onAction}
          onShowCard={onShowCard}
          reset={reset}
        />
      )}
    </div>
  );
}

const distanceBetween = (a: HexKey, b: HexKey) => distance(parseKey(a), parseKey(b));
