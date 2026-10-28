// The arena itself: the painted board with its grid and lit cells, the unit tokens and 3D figures,
// and the animations over them.

import { memo } from 'react';
import { unitAt } from '../engine/battle';
import type { HexKey } from '../engine/hex';
import type { BattleUnit, GameState } from '../engine/types';
import { asset, Frame, Portrait, ACTIVE_FIGURE_RING, Ribbon, SIDE_RING } from './common';
import { ART_SIZE, CANVAS_H, CANVAS_W, CELL_POINTS, CELLS, cellCenter, cellPos, hexPoints, TOKEN_H as H, TOKEN_W as W } from './arenaGeometry';
import { DamageDrop, DieFace, LastAttack, Marker, StatText } from './markers';
import { details } from './details';
import { figureFor, FigureLayer, type Piece } from './FigureLayer';
import { statusList, StatusBadge, UnitDetails } from './battleStatus';
import type { ItemTargeting } from './ItemsPanel';
import { WALK_STEP_MS, type BattleAnimations } from './useBattleAnimations';
import type { Deployment } from './useDeployment';

/** The painted boards draw each hex with its own gold rim, and neighbouring rims do not always lie on
 *  each other (doubled, overlapping edges). One even gold grid on top covers them. */
const GoldGrid = memo(function GoldGrid() {
  return (
    <>
      {CELLS.map((k) => (
        <polygon key={`gd${k}`} points={CELL_POINTS.get(k)} fill="none" stroke="rgba(52,34,8,0.85)" strokeWidth="3.4" strokeLinejoin="round" />
      ))}
      {CELLS.map((k) => (
        <polygon key={`gl${k}`} points={CELL_POINTS.get(k)} fill="none" stroke="#E4C16E" strokeWidth="1.6" strokeLinejoin="round" />
      ))}
    </>
  );
});

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
  aimApproach: (u: BattleUnit, pointer: { x: number; y: number; box: DOMRect } | null) => void;
  onCell: (k: HexKey) => void;
  onUnit: (u: BattleUnit) => void;
}

/** Rim of the blocked cells on both arenas (scripts/assets/arenas.py paints the same one). */
const OBSTACLE_RIM = '#A88414';

export function ArenaBoard(p: Props) {
  const { state, view, scale, anim, deploy, targeting, hover, setHover, active, moves, hops, targets, approach } = p;
  const b = state.battle!;
  const { deployable, picked, deploySide, posOf } = deploy;
  const { walk, hitIds, strikes, seals, shards, ghosts, rollPops, floaters, lastStrike } = anim;
  const lastRoll = b.rolls?.[b.rolls.length - 1];
  return (
    <Frame crest className="grow arena-frame" innerClass="" innerStyle={{ background: '#14100A' }}>
      <div ref={p.wrapRef} className="scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex' }}>
        <div style={{ position: 'relative', flex: 'none', margin: 'auto', width: view.w * scale, height: view.h * scale, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, transform: `translate(${-view.x * scale}px, ${-view.y * scale}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {/* The painted board of the half of the map where the fight broke out. */}
          <img src={asset(`arena/${b.arena}.jpg`)} alt="" style={{ position: 'absolute', left: 0, top: 0, width: ART_SIZE.w, height: ART_SIZE.h }} />
          <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <g pointerEvents="none">
              <GoldGrid />
              {/* Obstacles get their own rim: dark yellow on both boards (as painted there). */}
              {b.obstacles.map((k) => (
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
              return (
                <polygon
                  key={k}
                  points={CELL_POINTS.get(k)}
                  fill={fill}
                  stroke={moves.has(k) || hops.includes(k) ? 'rgba(190,240,255,0.75)' : 'none'}
                  strokeWidth="1.5"
                  onClick={() => p.onCell(k)}
                  onMouseEnter={() => setHover(k)}
                  onMouseLeave={() => setHover(null)}
                  className={moves.has(k) || hops.includes(k) ? p.moveCursor : (deployable.has(k) && picked) || teleportTo ? 'cur-pointer' : undefined}
                />
              );
            })}
            {active?.pos && <polygon points={hexPoints(active.pos, 2)} fill="rgba(158,228,255,0.15)" stroke="#9EE4FF" strokeWidth="3" pointerEvents="none" />}
            {approach && <polygon points={hexPoints(approach.cell, 2)} fill="rgba(243,210,122,0.35)" stroke="#F3D27A" strokeWidth="3.5" pointerEvents="none" />}
            {[...deployable].map((k) => (
              <polygon key={`dp${k}`} points={hexPoints(k, 3)} fill="none" stroke="#F3D27A" strokeWidth={hover === k && picked ? 3.5 : 2} strokeDasharray={picked ? undefined : '5 4'} pointerEvents="none" />
            ))}
            {[...p.reach.walk].map((k) => (
              <polygon key={`rw${k}`} points={hexPoints(k, 3)} fill="rgba(158,228,255,0.24)" stroke="rgba(190,240,255,0.8)" strokeWidth="1.5" pointerEvents="none" />
            ))}
            {[...p.reach.hit].map((k) => (
              <polygon key={`rh${k}`} points={hexPoints(k, 3)} fill="rgba(224,60,40,0.3)" stroke="rgba(240,100,80,0.85)" strokeWidth="1.5" strokeDasharray="4 3" pointerEvents="none" />
            ))}
            {targets.map((t) => (
              <polygon key={t.id} points={hexPoints(t.pos!, 2)} fill="rgba(224,80,60,0.16)" stroke="#E0503C" strokeWidth="3" pointerEvents="none" />
            ))}
            {p.breathPreview.map((t) => (
              <polygon key={`b${t!.id}`} points={hexPoints(t!.pos!, 6)} fill="none" stroke="#FF9A3A" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />
            ))}
          </svg>
          {/* Units with a model stand on the arena as 3D figures; their tokens below keep only the HP and markers. */}
          <FigureLayer
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ zIndex: 1 }}
            pieces={p.living
              .filter((u) => figureFor(u.defId) && posOf(u))
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
            const aimed = p.aimedOver(u);
            const statuses = statusList(u);
            const preview = p.previewOf(u);
            return (
              <button
                key={u.id}
                className={`hexbtn token ${walk[u.id] ? 'walking' : ''} ${hitIds.includes(u.id) ? 'hit' : ''} ${lunge ? 'lunge' : ''} ${aimed ? '' : p.unitCursor(u)}`}
                onClick={() => p.onUnit(u)}
                {...details(() => <UnitDetails u={u} />)}
                onMouseEnter={() => setHover(u.pos)}
                onPointerMove={(e) => e.pointerType !== 'touch' && p.aimApproach(u, { x: e.clientX, y: e.clientY, box: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => {
                  setHover(null);
                  if (approach?.targetId === u.id) p.setApproach(null);
                }}
                // A figure is taller than a portrait token: the box covers it, so clicking the figure works.
                style={{ position: 'absolute', left: x + W / 2 - 27, top: y + H / 2 - (figure ? 58 : 38), width: 54, height: figure ? 80 : 60, zIndex: lunge ? 4 : 2, ...(aimed ? { cursor: aimed } : {}), ...(lunge && !figure ? ({ '--lx': `${lunge.dx}px`, '--ly': `${lunge.dy}px` } as React.CSSProperties) : {}) }}
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
