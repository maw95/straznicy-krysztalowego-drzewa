// The arena itself: the painted board with its grid and lit cells, the unit tokens and 3D figures,
// and the animations over them.

import { memo, useRef } from 'react';
import { cellsOf, deployHeads, movePath, scaleOf, unitAt, unitDistance } from '../engine/battle';
import { ABILITY } from '../engine/data';
import type { HexKey } from '../engine/hex';
import { isDigital, type BattleUnit, type GameState } from '../engine/types';
import { abilityArt, asset, Frame, Portrait, ACTIVE_FIGURE_RING, Ribbon, SIDE_RING } from './common';
import { geometryOf, TOKEN_H as H, TOKEN_W as W } from './arenaGeometry';
import { wideObstacleGroups } from '../engine/battle';
import { DamageDrop, DieFace, LastAttack, Marker, StatText } from './markers';
import { details } from './details';
import { figureFor, FigureLayer, type Piece } from './FigureLayer';
import { SpriteLayer, type SpritePiece } from './SpriteLayer';
import { hasSprites } from './sprites';
import type { AttackNow } from './useImpactHold';
import { statusList, StatusBadge, UnitDetails } from './battleStatus';
import type { ItemTargeting } from './ItemsPanel';
import { WALK_STEP_MS, type BattleAnimations } from './useBattleAnimations';
import type { Deployment } from './useDeployment';

/** The painted boards draw each hex with its own gold rim, and neighbouring rims do not always lie on
 *  each other (doubled, overlapping edges). One even gold grid on top covers them. */
const GoldGrid = memo(function GoldGrid({ cells, points, wide }: { cells: readonly HexKey[]; points: Map<HexKey, string>; wide: boolean }) {
  // The digital arena has no painted grid: a quiet one is drawn over the plain picture.
  const dark = wide ? { stroke: 'rgba(20,14,6,0.45)', width: 2.6 } : { stroke: 'rgba(52,34,8,0.85)', width: 3.4 };
  const light = wide ? { stroke: 'rgba(236,214,150,0.4)', width: 1.1 } : { stroke: '#E4C16E', width: 1.6 };
  return (
    <>
      {cells.map((k) => (
        <polygon key={`gd${k}`} points={points.get(k)} fill="none" stroke={dark.stroke} strokeWidth={dark.width} strokeLinejoin="round" />
      ))}
      {cells.map((k) => (
        <polygon key={`gl${k}`} points={points.get(k)} fill="none" stroke={light.stroke} strokeWidth={light.width} strokeLinejoin="round" />
      ))}
    </>
  );
});

/** Mirror copies of the picture round the board: [columns, rows] away from it (a very wide screen needs two columns each side). */
const MIRRORS: Array<[number, number]> = [-2, -1, 0, 1, 2].flatMap((dx) => [-1, 0, 1].map((dy): [number, number] => [dx, dy])).filter(([dx, dy]) => dx !== 0 || dy !== 0);
/** An obstacle picture is fitted into this box, standing on the lower part of its hex. */
const OBSTACLE_BOX = { w: 76, h: 92, base: 26 };
/** The same for an obstacle that lies on two neighbouring cells of a row. */
const OBSTACLE_BOX_DOUBLE = { w: 144, h: 86, base: 26 };

export interface ArenaView {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  state: GameState;
  wrapRef: React.RefObject<HTMLDivElement>;
  /** The part of the painting shown, and the scale it is shown at. */
  view: ArenaView;
  scale: number;
  anim: BattleAnimations;
  deploy: Deployment;
  targeting: ItemTargeting | null;
  hover: HexKey | null;
  setHover: (k: HexKey | null) => void;
  active: BattleUnit | null;
  living: BattleUnit[];
  moves: Map<HexKey, number>;
  hops: HexKey[];
  targets: BattleUnit[];
  /** The move cell under the pointer. */
  hoverPreview: HexKey | null;
  moveCursor: string;
  approach: { targetId: string; cell: HexKey } | null;
  setApproach: (a: null) => void;
  /** Ctrl-hover reach of the unit under the pointer. */
  reach: { walk: Set<HexKey>; hit: Set<HexKey> };
  breathPreview: Array<BattleUnit | null>;
  approachCells: (u: BattleUnit) => HexKey[];
  unitCursor: (u: BattleUnit) => string;
  aimedOver: (u: BattleUnit) => string | null;
  previewOf: (u: BattleUnit) => { text: string; lethal: boolean } | null;
  aimApproach: (u: BattleUnit, pointer: { x: number; y: number; box: DOMRect } | null, origin?: HexKey) => void;
  onCell: (k: HexKey) => void;
  /** The attack of a unit with sprites being animated (its damage shows when the blow lands). */
  attackNow: AttackNow | null;
  /** Right click on a cell: another tail cell for a large unit about to move there. */
  onCellAlt: (k: HexKey) => void;
  /** Where the tail of the active large unit would lie if it moved to the cell under the pointer. */
  previewTail: HexKey | null;
  /** The tail cell of a large attacker that walks up to its target (next to the lit approach cell). */
  approachTail: HexKey | null;
  onUnit: (u: BattleUnit) => void;
}

/** Rim of the blocked cells on both arenas (scripts/assets/arenas.py paints the same one). */
const OBSTACLE_RIM = '#A88414';
/** How far below the middle of its hex(es) a sprite unit stands (its feet). */
const FEET = 24;

export function ArenaBoard(p: Props) {
  const { state, view, scale, anim, deploy, targeting, hover, setHover, active, moves, hops, targets, approach } = p;
  /**
   * A unit's box reaches over its neighbours' hexes. When the pointer is over the hex of an attackable unit and the box belongs
   * to a unit that is not a target (an ally standing in front), the click and the cursor go to the target under the pointer.
   */
  const behind = (e: { clientX: number; clientY: number }, u: BattleUnit): BattleUnit => {
    if (targets.some((t) => t.id === u.id)) return u;
    const cell = (document.elementsFromPoint?.(e.clientX, e.clientY) ?? []).find((el) => el.hasAttribute('data-cell'))?.getAttribute('data-cell');
    const under = cell ? unitAt(p.state.battle!, cell as HexKey) : undefined;
    return under && targets.some((t) => t.id === under.id) ? under : u;
  };
  const b = state.battle!;
  const geo = geometryOf(b.layout);
  const wide = b.layout === 'wide';
  const { cellCenter, cellPos, hexPoints, cells: CELLS, cellPoints: CELL_POINTS, canvasW: CANVAS_W, canvasH: CANVAS_H, art: ART_SIZE } = geo;
  const { deployable, picked, deploySide, posOf } = deploy;
  const { walk, hitIds, strikes, seals, shards, bursts, ghosts, rollPops, floaters, lastStrike } = anim;
  const lastRoll = b.rolls?.[b.rolls.length - 1];

  // Digital ruleset: units with sprites are drawn by the sprite layer (corpses too), on one hex or two.
  // The way a walker took over the board since the last state (worked out here, from the two states, so the sprite layer gets it
  // together with the new position).
  const prevState = useRef(state);
  const movePaths = useRef<Record<string, HexKey[]>>({});
  if (prevState.current !== state) {
    const before = prevState.current;
    const next: Record<string, HexKey[]> = {};
    if (before.battle && before.battle !== b) {
      for (const u of Object.values(b.units)) {
        const was = before.battle.units[u.id];
        if (was?.pos && u.pos && was.pos !== u.pos && was.alive && u.alive) next[u.id] = movePath(before, was, u.pos);
      }
    }
    movePaths.current = next;
    prevState.current = state;
  }
  const spriteUnits = isDigital(state.rules) ? Object.values(b.units).filter((u) => hasSprites(u.defId) && !u.swappedOut && (u.alive ? u.pos || posOf(u) : u.corpse)) : [];
  const spriteIds = new Set(spriteUnits.filter((u) => u.alive).map((u) => u.id));
  /** The cells a sprite unit lies on: head and (large units) tail. While deploying, the deploy cell is the tail. */
  const footprintOf = (u: BattleUnit): { head: HexKey; tail?: HexKey } | null => {
    if (!u.alive) return u.corpse ? { head: u.corpse, tail: u.corpseTail } : null;
    if (deploySide === u.side) {
      const at = posOf(u);
      if (!at) return null;
      if (!u.tail) return { head: at };
      return { head: u.tail === at ? u.pos! : deployHeads(b, u.side, at)[0] ?? at, tail: at };
    }
    return u.pos ? { head: u.pos, tail: u.tail } : null;
  };
  /** Feet of a sprite unit: the middle of its hex, or between its two hexes. */
  const anchorOf = (fp: { head: HexKey; tail?: HexKey }) => {
    const h = cellCenter(fp.head);
    if (!fp.tail) return { x: h.x, y: h.y + FEET };
    const t = cellCenter(fp.tail);
    return { x: (h.x + t.x) / 2, y: (h.y + t.y) / 2 + FEET };
  };
  const spritePieces: SpritePiece[] = spriteUnits.flatMap((u): SpritePiece[] => {
    const fp = footprintOf(u);
    if (!fp) return [];
    const a = anchorOf(fp);
    // A large unit faces away from its tail; a single-hex one faces the enemies until it moves.
    let flip = false;
    if (fp.tail) flip = cellCenter(fp.tail).x > cellCenter(fp.head).x;
    else {
      let enemies = p.living.filter((e) => e.side !== u.side && e.pos).map((e) => cellCenter(e.pos!).x);
      // Nobody left standing (the end of a battle): it keeps facing the fallen, not turning back to the default side.
      if (!enemies.length) enemies = Object.values(b.units).filter((e) => e.side !== u.side && e.corpse).map((e) => cellCenter(e.corpse!).x);
      if (enemies.length) flip = enemies.reduce((m, x) => m + x, 0) / enemies.length < a.x;
    }
    const way = movePaths.current[u.id];
    const off = way ? { x: a.x - cellCenter(fp.head).x, y: a.y - (cellCenter(fp.head).y + FEET) } : null;
    const path = way && off ? way.map((k) => ({ x: cellCenter(k).x + off.x, y: cellCenter(k).y + FEET + off.y })) : null;
    // In a fight the blue cells already mark the active unit; the ring only shows which unit is picked while deploying.
    const ring = deploySide && picked === u.id ? ACTIVE_FIGURE_RING : null;
    const lastJump = b.teleports?.[b.teleports.length - 1];
    const blink = lastJump?.unitId === u.id && lastJump.to === u.pos && lastJump.kind !== 'burrow';
    return [{ key: u.id, defId: u.defId, x: a.x, y: a.y, flip, dead: !u.alive, blink, ring, attack: p.attackNow && p.attackNow.unitId === u.id ? { key: p.attackNow.key, melee: b.units[p.attackNow.targetId] ? unitDistance(u, b.units[p.attackNow.targetId]) === 1 : false, towardX: cellCenter(b.units[p.attackNow.targetId]?.pos ?? b.units[p.attackNow.targetId]?.corpse ?? fp.head).x, towardY: cellCenter(b.units[p.attackNow.targetId]?.pos ?? b.units[p.attackNow.targetId]?.corpse ?? fp.head).y } : null, hit: hitIds.includes(u.id), snap: b.stage === 'deploy', path }];
  });
  return (
    <Frame crest className="grow arena-frame" innerClass="" innerStyle={{ background: '#14100A' }}>
      {/* On a wide screen the board does not fill the window: the picture goes on past its edges as mirror images of itself
          (the seams match, the frame of trees and rocks simply continues), laid out like the board so they line up with it. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: CANVAS_W, height: CANVAS_H, transformOrigin: '0 0', transform: `translate(${-(view.w * scale) / 2 - view.x * scale}px, ${-(view.h * scale) / 2 - view.y * scale}px) scale(${scale})` }}>
          {MIRRORS.map(([dx, dy]) => (
            <div key={`${dx},${dy}`} style={{ position: 'absolute', left: dx * CANVAS_W, top: dy * CANVAS_H, width: CANVAS_W, height: CANVAS_H, overflow: 'hidden', transform: `scale(${dx % 2 ? -1 : 1}, ${dy % 2 ? -1 : 1})` }}>
              <img src={asset(wide ? `arena/cyfrowa/${b.arena}.webp` : `arena/${b.arena}.jpg`)} alt="" style={{ width: ART_SIZE.w, height: ART_SIZE.h, display: 'block' }} />
            </div>
          ))}
        </div>
      </div>
      <div ref={p.wrapRef} className="scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex' }}>
        <div style={{ position: 'relative', flex: 'none', margin: 'auto', width: view.w * scale, height: view.h * scale, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, transform: `translate(${-view.x * scale}px, ${-view.y * scale}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {/* The painted board of the half of the map where the fight broke out. */}
          <img src={asset(wide ? `arena/cyfrowa/${b.arena}.webp` : `arena/${b.arena}.jpg`)} alt="" style={{ position: 'absolute', left: 0, top: 0, width: ART_SIZE.w, height: ART_SIZE.h }} />
          {/* Digital arena: obstacles are pictures standing on their cells. */}
          {wide &&
            wideObstacleGroups(b.arena).map((g) => {
              const cs = g.cells.map(cellCenter);
              const box = g.cells.length > 1 ? OBSTACLE_BOX_DOUBLE : OBSTACLE_BOX;
              const x = cs.reduce((m, c) => m + c.x, 0) / cs.length;
              const y = cs.reduce((m, c) => m + c.y, 0) / cs.length;
              // A pair on a slant (two rows) leans the same way, a little less than the line between its cells.
              const lean = cs.length > 1 && Math.abs(cs[1].y - cs[0].y) > 10 ? (cs[1].x > cs[0].x) === (cs[1].y > cs[0].y) ? 30 : -30 : 0;
              return (
                <div key={`ob${g.art}`} style={{ position: 'absolute', left: x - box.w / 2, top: y + box.base - box.h, width: box.w, height: box.h, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none', transform: lean ? `rotate(${lean}deg)` : undefined, transformOrigin: '50% 80%' }}>
                  <img src={asset(`arena/cyfrowa/${g.art}.webp`)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', filter: b.arena === 'horde' ? 'brightness(1.55) contrast(1.05)' : undefined }} />
                </div>
              );
            })}
          <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <g pointerEvents="none">
              <GoldGrid cells={CELLS} points={CELL_POINTS} wide={wide} />
              {/* Obstacles get their own rim: dark yellow on both boards (as painted there). */}
              {wide &&
                b.obstacles.map((k) => (
                  <polygon key={`ob${k}`} points={hexPoints(k, 2)} fill="rgba(0,0,0,0.12)" stroke={OBSTACLE_RIM} strokeOpacity="0.75" strokeWidth="2" strokeLinejoin="round" />
                ))}
              {!wide && b.obstacles.map((k) => (
                <polygon key={`ob${k}`} points={hexPoints(k, 1.5)} fill="none" stroke={OBSTACLE_RIM} strokeWidth="3.2" strokeLinejoin="round" />
              ))}
            </g>
            {CELLS.map((k) => {
              const teleportTo = targeting?.kind === 'teleport' && Boolean(targeting.unitId) && !unitAt(b, k) && !b.obstacles.includes(k);
              let fill = 'transparent';
              if (deployable.has(k)) fill = picked ? (hover === k ? 'rgba(243,210,122,0.5)' : 'rgba(243,210,122,0.28)') : 'rgba(243,210,122,0.18)';
              else if (moves.has(k)) fill = p.hoverPreview === k ? 'rgba(158,228,255,0.45)' : 'rgba(158,228,255,0.2)';
              else if (hops.includes(k)) fill = 'rgba(158,228,255,0.28)';
              else if (teleportTo) fill = 'rgba(200,160,255,0.25)';
              // Every hex of a unit carries the cursor and the aim of the attack itself (a large unit's tail has no button; the box of a small one
              // covers only the middle of its hex, so the sword used to show only there: report 216950).
              const owner = unitAt(b, k) ?? undefined;
              return (
                <polygon
                  key={k}
                  points={CELL_POINTS.get(k)}
                  data-cell={k}
                  fill={fill}
                  stroke={moves.has(k) || hops.includes(k) ? 'rgba(190,240,255,0.75)' : 'none'}
                  strokeWidth="1.5"
                  onClick={() => p.onCell(k)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    p.onCellAlt(k);
                  }}
                  onMouseEnter={() => setHover(k)}
                  onPointerMove={owner ? (e) => e.pointerType !== 'touch' && p.aimApproach(owner, { x: e.clientX, y: e.clientY, box: e.currentTarget.getBoundingClientRect() }, k) : undefined}
                  onMouseLeave={() => {
                    setHover(null);
                    if (owner && approach?.targetId === owner.id) p.setApproach(null);
                  }}
                  className={moves.has(k) || hops.includes(k) ? p.moveCursor : (deployable.has(k) && picked) || teleportTo ? 'cur-pointer' : owner ? `${p.aimedOver(owner) ? '' : p.unitCursor(owner)}` : undefined}
                  style={owner && p.aimedOver(owner) ? { cursor: p.aimedOver(owner)! } : undefined}
                />
              );
            })}
            {active &&
              cellsOf(active).map((k) => <polygon key={`ac${k}`} points={hexPoints(k, 2)} fill="rgba(158,228,255,0.15)" stroke="#9EE4FF" strokeWidth="3" pointerEvents="none" />)}
            {(b.fields ?? []).map((f) => {
              // Pole Naładowane (Król Burzy): a bluish glow under the lightning sheet (the .fx-field layer below), not a plain yellow hex.
              return (
                <g key={`cf${f.cell}`} className="charged-field" pointerEvents="none">
                  <polygon points={hexPoints(f.cell, 3)} fill="rgba(70,130,255,0.26)" stroke="#9EE4FF" strokeWidth="2.5" />
                  <polygon points={hexPoints(f.cell, 9)} fill="rgba(190,230,255,0.16)" stroke="none" />
                  <title>{`Pole Naładowane: rani o ${ABILITY.chargedFieldDamage * scaleOf(state)} każdego, kto na nie wejdzie`}</title>
                </g>
              );
            })}
            {p.previewTail && <polygon points={hexPoints(p.previewTail, 3)} fill="rgba(158,228,255,0.2)" stroke="#9EE4FF" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />}
            {approach && <polygon points={hexPoints(approach.cell, 2)} fill="rgba(243,210,122,0.35)" stroke="#F3D27A" strokeWidth="3.5" pointerEvents="none" />}
            {approach && p.approachTail && <polygon points={hexPoints(p.approachTail, 2)} fill="rgba(243,210,122,0.25)" stroke="#F3D27A" strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none" />}
            {[...deployable].map((k) => (
              <polygon key={`dp${k}`} points={hexPoints(k, 3)} fill="none" stroke="#F3D27A" strokeWidth={hover === k && picked ? 3.5 : 2} strokeDasharray={picked ? undefined : '5 4'} pointerEvents="none" />
            ))}
            {[...p.reach.walk].map((k) => (
              <polygon key={`rw${k}`} points={hexPoints(k, 3)} fill="rgba(158,228,255,0.24)" stroke="rgba(190,240,255,0.8)" strokeWidth="1.5" pointerEvents="none" />
            ))}
            {[...p.reach.hit].map((k) => (
              <polygon key={`rh${k}`} points={hexPoints(k, 3)} fill="rgba(224,60,40,0.3)" stroke="rgba(240,100,80,0.85)" strokeWidth="1.5" strokeDasharray="4 3" pointerEvents="none" />
            ))}
            {targets.flatMap((t) =>
              cellsOf(t).map((k) => <polygon key={`${t.id}${k}`} points={hexPoints(k, 2)} fill="rgba(224,80,60,0.16)" stroke="#E0503C" strokeWidth="3" pointerEvents="none" />),
            )}
            {p.breathPreview.map((t) => (
              <polygon key={`b${t!.id}`} points={hexPoints(t!.pos!, 6)} fill="none" stroke="#FF9A3A" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />
            ))}
          </svg>
          {/* Digital ruleset: sprites (and corpses) of the units that have them. */}
          {spritePieces.length > 0 && <SpriteLayer width={CANVAS_W} height={CANVAS_H} scale={scale} style={{ zIndex: 1 }} pieces={spritePieces} />}
          {/* Units with a model stand on the arena as 3D figures; their tokens below keep only the HP and markers. */}
          <FigureLayer
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ zIndex: 1 }}
            pieces={p.living
              .filter((u) => figureFor(u.defId) && posOf(u) && !spriteIds.has(u.id))
              .map((u): Piece => {
                const c = cellCenter(posOf(u)!);
                const melee = lastStrike(u.id, false);
                const shot = lastStrike(u.id, true);
                // Until it moves, a unit faces the enemies (the middle of where they stand).
                const enemies = p.living.filter((e) => e.side !== u.side && e.pos).map((e) => cellCenter(e.pos!));
                const face = enemies.length ? { x: enemies.reduce((s, e) => s + e.x, 0) / enemies.length - c.x, y: enemies.reduce((s, e) => s + e.y, 0) / enemies.length - c.y } : undefined;
                const isActive = deploySide ? picked === u.id : active?.id === u.id;
                return {
                  key: u.id,
                  unitId: u.defId,
                  x: c.x,
                  y: c.y + 8,
                  // A little wider than the hex: figures may lean over the neighbouring cells.
                  size: 70,
                  moveMs: walk[u.id] ? WALK_STEP_MS : 300,
                  ring: isActive ? ACTIVE_FIGURE_RING : null,
                  lungeAt: melee ? { ...cellCenter(melee.to), key: melee.key } : null,
                  lookAt: shot ? cellCenter(shot.to) : null,
                  hit: hitIds.includes(u.id),
                  face,
                };
              })}
          />
          {p.living.map((u) => {
            const sprite = spriteIds.has(u.id);
            const figure = sprite || figureFor(u.defId);
            const fp = sprite ? footprintOf(u) : null;
            const { x, y } = fp ? (() => { const a = anchorOf(fp); return { x: a.x - W / 2, y: a.y - FEET - H / 2 }; })() : cellPos(posOf(u)!);
            const isActive = deploySide ? picked === u.id : active?.id === u.id;
            const isTarget = targets.some((t) => t.id === u.id);
            const strike = lastStrike(u.id, false);
            const lunge = strike ? (() => {
              const a = cellPos(strike.from);
              const t = cellPos(strike.to);
              return { dx: (t.x - a.x) * 0.35, dy: (t.y - a.y) * 0.35 };
            })() : null;
            const aimed = p.aimedOver(u);
            const statuses = statusList(u);
            const preview = p.previewOf(u);
            return (
              <button
                key={u.id}
                className={`hexbtn token ${walk[u.id] ? 'walking' : ''} ${hitIds.includes(u.id) ? 'hit' : ''} ${lunge ? 'lunge' : ''} ${aimed ? '' : p.unitCursor(u)}`}
                data-unit={u.id}
                onClick={(e) => p.onUnit(behind(e, u))}
                {...details(() => <UnitDetails u={u} />, { pin: true })}
                onMouseEnter={() => setHover(u.pos)}
                onPointerMove={(e) => {
                  if (e.pointerType === 'touch') return;
                  // Over the hex of a target hidden behind this box: the cursor and the aim belong to that target.
                  const t = behind(e, u);
                  const own = e.currentTarget;
                  const el = t === u ? own : (document.querySelector<HTMLElement>(`[data-unit="${t.id}"]`) ?? own);
                  // Back over its own hex the box keeps the turned cursor React gave it: clearing the style here left the plain cursor in the middle of the hex.
                  own.style.cursor = t === u ? (aimed ?? '') : getComputedStyle(el).cursor;
                  // The hex of the unit under the pointer (a large unit lies on two): its edges say the side of the attack.
                  const cellEl = (document.elementsFromPoint?.(e.clientX, e.clientY) ?? []).find((x) => x.hasAttribute('data-cell') && cellsOf(t).includes(x.getAttribute('data-cell') as HexKey));
                  p.aimApproach(t, { x: e.clientX, y: e.clientY, box: (cellEl ?? el).getBoundingClientRect() }, cellEl ? (cellEl.getAttribute('data-cell') as HexKey) : undefined);
                }}
                onMouseLeave={() => {
                  setHover(null);
                  if (approach?.targetId === u.id) p.setApproach(null);
                }}
                // A figure is taller than a portrait token: the box covers it, so clicking the figure works. A sprite unit's box stays
                // small (it may lie on two hexes and reach over its neighbours): a click on either of its hexes finds it through the cell.
                style={{ position: 'absolute', left: x + W / 2 - 27, top: y + H / 2 - (sprite ? 50 : figure ? 58 : 38), width: 54, height: sprite ? 64 : figure ? 80 : 60, zIndex: lunge ? 4 : 2, ...(aimed ? { cursor: aimed } : {}), ...(lunge && !figure ? ({ '--lx': `${lunge.dx}px`, '--ly': `${lunge.dy}px` } as React.CSSProperties) : {}) }}
              >
                {!figure && <div style={{ position: 'absolute', left: 4, right: 4, bottom: -4, height: 16, borderRadius: '50%', background: 'rgba(6,10,2,0.55)', pointerEvents: 'none' }} />}
                {!figure && <Portrait
                  unitId={u.defId}
                  size={54}
                  // No card popping up over an enemy you are about to attack: it would hide the lit cell (the card is under the right button).
                  preview={!isTarget && !p.approachCells(u).length}
                  ring={SIDE_RING[u.side]}
                  glow={isActive ? '0 0 0 3px #9EE4FF, 0 0 20px 6px rgba(158,228,255,0.75)' : isTarget ? '0 0 0 3px #E0503C, 0 0 18px 5px rgba(224,80,60,0.7)' : '0 0 0 1.5px #1E1204, 0 8px 12px rgba(0,0,0,0.55)'}
                />}
                {statuses.length > 0 && (
                  <div style={{ position: 'absolute', left: '50%', top: -13, transform: 'translateX(-50%)', pointerEvents: 'none', display: 'flex', gap: 1, zIndex: 3 }}>
                    {statuses.map((st) => (
                      <StatusBadge key={st.label} st={st} size={25} />
                    ))}
                  </div>
                )}
                {u.abilityUsed && (
                  <span style={{ position: 'absolute', left: -12, bottom: -2, pointerEvents: 'none', zIndex: 3 }}>
                    <Marker name="ability_used" size={24} title="Zdolność zużyta" />
                  </span>
                )}
                {isDigital(state.rules) ? (
                  // Digital ruleset: a slim life bar (green → red) with the number inside, instead of the big plate.
                  <div title={`Życie ${u.hp}/${u.maxHp}`} style={{ position: 'absolute', left: '50%', bottom: sprite ? -4 : 2, transform: 'translateX(-50%)', width: 42, height: 9, borderRadius: 5, background: 'rgba(12,8,4,0.78)', border: '1px solid rgba(228,193,110,0.7)', overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ width: `${Math.max(0, Math.min(1, u.hp / u.maxHp)) * 100}%`, height: '100%', background: u.hp / u.maxHp > 0.5 ? '#6FB45A' : u.hp / u.maxHp > 0.25 ? '#D9A93A' : '#C8452E' }} />
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#FFF6DC', textShadow: '0 0 2px #000, 0 0 2px #000' }}>{u.hp}</span>
                  </div>
                ) : (
                <div className="plate parch" style={{ position: 'absolute', right: -16, bottom: 0, height: 22, padding: '0 6px 0 4px', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 800, fontSize: 16, pointerEvents: 'none' }}>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 64 64"><use href="#iHeart" /></svg>
                  {u.hp}
                </div>
                )}
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
                <img className="seal" src={asset(`cards/abilities/${abilityArt(se.ability)}.png`)} alt="" style={{ left: x + W / 2, top: y + H / 2 - 40 }} />
              </div>
            );
          })}
          {(b.fields ?? []).map((f) => {
            const c = cellCenter(f.cell);
            return <span key={`fx${f.cell}`} className="fx-sheet fx-field" style={{ left: c.x, top: c.y }} />;
          })}
          {bursts.map((e) => {
            const { x, y } = cellPos(e.pos);
            return <span key={e.key} className={`fx-sheet fx-teleport ${e.kind} ${e.late ? 'late' : ''}`} style={{ left: x + W / 2, top: y + H / 2 + 4 }} />;
          })}
          {shards.map((sh) => {
            const { x, y } = cellPos(sh.pos);
            return Array.from({ length: sh.gold ? 14 : 8 }, (_, i) => {
              const a = (i / (sh.gold ? 14 : 8)) * Math.PI * 2 + (i % 3) * 0.3;
              const d = 28 + (i % 4) * 10;
              return <span key={`${sh.key}${i}`} className={`shard ${sh.gold ? 'gold' : ''}`} style={{ left: x + W / 2, top: y + H / 2 - 8, ['--hx' as string]: `${Math.cos(a) * d}px`, ['--hy' as string]: `${Math.sin(a) * d}px` } as React.CSSProperties} />;
            });
          })}
          {ghosts.filter((g) => !(isDigital(state.rules) && hasSprites(g.defId))).map((g) => {
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
                  className={st.attacker === 'cyclops' ? 'projectile boulder' : 'projectile'}
                  style={{ left: a.x + W / 2 - 7, top: a.y + H / 2 - 20, ['--px' as string]: `${t.x - a.x}px`, ['--py' as string]: `${t.y - a.y}px` } as React.CSSProperties}
                />
              );
            })}
          {rollPops.map((r) => (
            <div key={r.key} className="roll-pop" style={{ left: r.x, top: r.y }}>
              {r.roll.die !== null && <DieFace value={r.roll.die} size={28} />}
              {r.roll.damage === 0 && <DamageDrop amount={0} size={28} />}
            </div>
          ))}
          {floaters.map((f) => (
            <div key={f.key} className={`dmg ${f.amount > 0 ? 'heal' : ''}`} style={{ left: f.x, top: f.y }}>
              {f.amount > 0 ? `+${f.amount}` : <DamageDrop amount={-f.amount} size={26} />}
            </div>
          ))}
          {lastRoll && b.units[lastRoll.attackerId] && (
            // Along the bottom edge of the painting, clear of the title and the cells.
            <div className="plate parch" style={{ position: 'absolute', left: view.x + 14, top: CANVAS_H - 38, padding: '4px 10px', fontSize: 14, zIndex: 6, pointerEvents: 'none', maxWidth: view.w - 28, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <LastAttack roll={lastRoll} units={b.units} size={20} />
            </div>
          )}
          <div className="hide-mobile" style={{ position: 'absolute', left: '50%', top: 14, transform: 'translateX(-50%)' }}>
            <Ribbon style={{ width: 340 }}>{`${b.kind === 'neutral' ? 'Bitwa o kryształ' : 'Starcie bohaterów'} · ${b.stage === 'deploy' ? 'ustawienie' : `runda ${b.round}`}`}</Ribbon>
          </div>
        </div>
        </div>
      </div>
    </Frame>
  );
}
