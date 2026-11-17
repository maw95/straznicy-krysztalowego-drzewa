// The tree of the settlement's buildings (the Rada Osady view): a node per building, lines from the building a node waits for. The graph is the
// engine's BUILDING_PARENT (docs/BUDYNKI.md 0a); the council is its root and always stands. Clicking a node asks the caller to show its price and effect.

import type { ReactNode } from 'react';
import { FACTION_NAMES, type FactionId } from '../engine/data';
import { BUILDING_NAMES, BUILDING_PARENT, buildBlock, buildCost, buildingLevel, canPay, type BuildingId, type Settlement } from '../engine/kingdom';
import { costText } from '../engine/economy';
import type { GameState } from '../engine/types';
import { asset } from './common';

const NODE_W = 160;
const NODE_H = 84;
const GAP_X = 46;
const GAP_Y = 16;

/** The root of the tree: the council of the settlement. It stands from the start and costs nothing. */
export const COUNCIL = 'council';
type NodeId = string;

/** A node that is not a building of the engine's graph (level 6: the dwellings of the unit tiers), drawn after its parent. */
export interface ExtraNode { id: string; parent: string; name: string; sub: string; picture: string; state: NodeState }

export type NodeState = 'built' | 'open' | 'poor' | 'blocked' | 'full';

/** What a node shows: built (with its level), free to buy now, too dear, blocked by its parent, or fully upgraded. */
export function nodeState(state: GameState, s: Settlement, faction: FactionId, b: BuildingId): NodeState {
  const level = buildingLevel(s, b);
  const cost = buildCost(state, s, b);
  if (cost === null) return 'full';
  if (buildBlock(s, b) || (b === 'barracks' && s.land !== faction)) return 'blocked';
  if (!canPay(state, faction, cost)) return level > 0 ? 'built' : 'poor';
  return level > 0 ? 'built' : 'open';
}

export function BuildingTree({ state, s, faction, order, picture, selected, onSelect, council, extras }: {
  state: GameState;
  s: Settlement;
  faction: FactionId;
  /** The buildings this game has (the Iskra only comes from the shards and is not in the tree). */
  order: BuildingId[];
  picture: (b: BuildingId, level: number) => string;
  selected: NodeId | null;
  onSelect: (b: NodeId) => void;
  /** The council's picture and name. */
  council: { picture: string; name: string };
  extras?: ExtraNode[];
}) {
  const extraOf = (n: NodeId) => (extras ?? []).find((e) => e.id === n);
  const parentOf = (n: NodeId): NodeId | null => (n === COUNCIL ? null : extraOf(n)?.parent ?? BUILDING_PARENT[n as BuildingId] ?? COUNCIL);
  const depthOf = (n: NodeId): number => (n === COUNCIL ? 0 : depthOf(parentOf(n)!) + 1);
  const nodes: NodeId[] = [COUNCIL, ...order.filter((b) => b !== 'spark'), ...(extras ?? []).map((e) => e.id)];
  const columns = new Map<number, NodeId[]>();
  for (const n of nodes) columns.set(depthOf(n), [...(columns.get(depthOf(n)) ?? []), n]);
  const depth = Math.max(...columns.keys());
  const tallest = Math.max(...[...columns.values()].map((c) => c.length));
  const height = tallest * (NODE_H + GAP_Y) - GAP_Y;
  const width = (depth + 1) * NODE_W + depth * GAP_X;
  const at = (n: NodeId) => {
    const col = columns.get(depthOf(n))!;
    const colHeight = col.length * (NODE_H + GAP_Y) - GAP_Y;
    return { x: depthOf(n) * (NODE_W + GAP_X), y: (height - colHeight) / 2 + col.indexOf(n) * (NODE_H + GAP_Y) };
  };
  const lines = nodes.flatMap((n) => {
    const p = parentOf(n);
    if (!p || !nodes.includes(p)) return [];
    const [a, b] = [at(p), at(n)];
    const [x1, y1, x2, y2] = [a.x + NODE_W, a.y + NODE_H / 2, b.x, b.y + NODE_H / 2];
    const mid = (x1 + x2) / 2;
    return [{ key: `${p}-${n}`, d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2 - 6} ${y2}`, on: selected === n || selected === p, arrow: `${x2},${y2}` }];
  });
  const label = (n: NodeId): ReactNode => {
    if (n === COUNCIL) return <span style={{ fontSize: 13, color: '#2E7A32' }}>stoi od początku</span>;
    const ex = extraOf(n);
    if (ex) return <span style={{ fontSize: 13, color: ex.state === 'blocked' || ex.state === 'poor' ? '#8A2A18' : ex.state === 'open' ? '#4A3418' : '#2E7A32' }}>{ex.sub}</span>;
    const bid = n as BuildingId;
    const level = buildingLevel(s, bid);
    const st = nodeState(state, s, faction, bid);
    const cost = buildCost(state, s, bid);
    if (st === 'blocked') return <span style={{ fontSize: 13, color: '#8A2A18' }}>{buildBlock(s, bid) ?? 'Tylko w osadzie własnej frakcji.'}</span>;
    if (st === 'full') return <span style={{ fontSize: 13, color: '#2E7A32' }}>poziom {level}, gotowe</span>;
    return <span style={{ fontSize: 13, color: st === 'poor' ? '#8A2A18' : '#4A3418' }}>{level ? `poziom ${level} · ` : ''}{costText(cost!)}</span>;
  };
  return (
    <div className="building-tree scroll" data-building-tree>
      <div style={{ position: 'relative', width, height, margin: '0 auto', flex: 'none' }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
          <defs>
            <marker id="tree-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#D9B45A" /></marker>
          </defs>
          {lines.map((l) => (
            <path key={l.key} d={l.d} data-tree-line={l.key} fill="none" stroke={l.on ? '#9EE4FF' : '#D9B45A'} strokeWidth={l.on ? 3 : 2} strokeOpacity={l.on ? 1 : 0.75} markerEnd="url(#tree-arrow)" />
          ))}
        </svg>
        {nodes.map((n) => {
          const { x, y } = at(n);
          const ex = extraOf(n);
          const bid = n as BuildingId;
          const st: NodeState = n === COUNCIL ? 'built' : ex ? ex.state : nodeState(state, s, faction, bid);
          const level = n === COUNCIL || ex ? 1 : buildingLevel(s, bid);
          const pic = n === COUNCIL ? council.picture : ex ? ex.picture : picture(bid, level);
          const name = n === COUNCIL ? council.name : ex ? ex.name : level ? BUILDING_NAMES[bid][Math.min(level, BUILDING_NAMES[bid].length) - 1] : BUILDING_NAMES[bid][0];
          return (
            <button key={n} className={`tree-node ${st} ${selected === n ? 'on' : ''}`} data-tree-node={n} data-node-state={st} style={{ left: x, top: y, width: NODE_W, height: NODE_H }} onClick={() => onSelect(n)}>
              <img src={asset(pic)} alt="" width={56} height={56} style={{ flex: 'none', objectFit: 'contain' }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', minWidth: 0 }}>
                <b style={{ fontSize: 15, lineHeight: 1.1 }}>{name}</b>
                {label(n)}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#F6EBD0', textShadow: '0 1px 3px #000', marginTop: 6 }}>
        Osada {FACTION_NAMES[s.land]}: budynek wymaga, by stał ten, od którego prowadzi do niego strzałka. Pierwotna Iskra nie jest w drzewku: wznosi ją bohater z kompletem Odłamków.
      </div>
    </div>
  );
}
