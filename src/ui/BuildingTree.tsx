// The tree of the settlement's buildings (the Rada Osady view): a node per building, joined by lines that run straight and bend at right angles with
// rounded corners (like Heroes: Olden Era). The graph is the engine's BUILDING_PARENT (docs/BUDYNKI.md 0a); the council is its root and always stands.
// Level 6: both dwellings of a tier stand side by side with a "lub" badge between them (one excludes the other). The colour of a node says its state:
// built (beige), can be upgraded now (turquoise, with the next level's name and price), can be built now (green), only resources missing (amber), a required building missing (grey stone), shut out for good (red).

import { raceOf } from '../engine/teams';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FACTION_NAMES, type TeamId } from '../engine/data';
import { BUILDING_NAMES, BUILDING_PARENT, buildBlock, buildCost, buildingLevel, canPay, goldOf, resOf, type BuildingId, type Settlement } from '../engine/kingdom';
import { mayBuildSpark, shardsOf, shardTotal } from '../engine/empire';
import type { Cost } from '../engine/economy';
import type { GameState } from '../engine/types';
import { asset } from './common';
import { CostIcons } from './resources';

const NODE_W = 226;
const NODE_H = 92;
const GAP_X = 54;
const GAP_Y = 16;
/** Two nodes of one choice stand further apart: the "lub" badge sits in the gap. */
const GAP_CHOICE = 30;
const RADIUS = 10;

/** The root of the tree: the council of the settlement. It stands from the start and costs nothing. */
export const COUNCIL = 'council';
type NodeId = string;

/** A node that is not a building of the engine's graph (level 6: the dwellings), drawn after its parents. `choice` joins the nodes of one tier (one excludes the other). */
export interface ExtraNode { id: string; parents: string[]; name: string; sub?: string; cost?: Cost; picture: string; state: NodeState; choice?: string }

export type NodeState = 'built' | 'open' | 'upgrade' | 'poor' | 'blocked' | 'full' | 'excluded';

/** What a node shows: built (with its level), free to buy now, only resources missing, a required building missing, or fully upgraded. */
export function nodeState(state: GameState, s: Settlement, faction: TeamId, b: BuildingId): NodeState {
  const level = buildingLevel(s, b);
  if (b === 'spark') {
    if (level > 0) return 'full';
    const buyer = Object.values(state.heroes).find((h) => h.id === state.turnOrder[state.turnIndex] && h.faction === faction);
    return buyer && mayBuildSpark(state, buyer) && buyer.pos === s.at ? 'open' : 'poor';
  }
  const cost = buildCost(state, s, b);
  if (cost === null) return 'full';
  if (buildBlock(s, b) || (b === 'barracks' && s.land !== faction)) return 'blocked';
  if (!canPay(state, faction, cost)) return level > 0 ? 'built' : 'poor';
  return level > 0 ? 'upgrade' : 'open';
}

/** A line from the right edge of a parent to the left edge of a child: straight, bending at right angles with rounded corners (the bend sits in the gap between the columns). */
function elbow(x1: number, y1: number, x2: number, y2: number): string {
  const bx = x2 - GAP_X / 2;
  const dy = y2 - y1;
  if (Math.abs(dy) < 1) return `M ${x1} ${y1} H ${x2}`;
  const r = Math.min(RADIUS, Math.abs(dy) / 2, GAP_X / 2 - 1);
  const s = Math.sign(dy);
  return `M ${x1} ${y1} H ${bx - r} Q ${bx} ${y1} ${bx} ${y1 + s * r} V ${y2 - s * r} Q ${bx} ${y2} ${bx + r} ${y2} H ${x2}`;
}

export function BuildingTree({ state, s, faction, order, picture, selected, onSelect, council, extras }: {
  state: GameState;
  s: Settlement;
  faction: TeamId;
  /** The buildings this game has. */
  order: BuildingId[];
  picture: (b: BuildingId, level: number) => string;
  selected: NodeId | null;
  onSelect: (b: NodeId) => void;
  /** The council's picture and name. */
  council: { picture: string; name: string };
  extras?: ExtraNode[];
}) {
  const extraOf = (n: NodeId) => (extras ?? []).find((e) => e.id === n);
  const parentsOf = (n: NodeId): NodeId[] => (n === COUNCIL ? [] : extraOf(n)?.parents ?? [BUILDING_PARENT[n as BuildingId] ?? COUNCIL]);
  const depthOf = (n: NodeId): number => (n === COUNCIL ? 0 : Math.max(...parentsOf(n).map(depthOf)) + 1);
  // The Primal Spark hangs on nothing (it is bought with the Shards, not from a parent building): it stands aside, in the top right corner, joined by no line.
  const sparkAside = order.includes('spark');
  const nodes: NodeId[] = [COUNCIL, ...order.filter((b) => b !== 'spark'), ...(extras ?? []).map((e) => e.id)];
  const columns = new Map<number, NodeId[]>();
  for (const n of nodes) columns.set(depthOf(n), [...(columns.get(depthOf(n)) ?? []), n]);
  const depth = Math.max(...columns.keys());
  // Vertical layout of a column: nodes of one choice stand apart a little more, for the badge.
  const gapAfter = (col: NodeId[], i: number) => (i < col.length - 1 && extraOf(col[i])?.choice && extraOf(col[i])?.choice === extraOf(col[i + 1])?.choice ? GAP_CHOICE : GAP_Y);
  const colHeightOf = (col: NodeId[]) => col.reduce((h, _, i) => h + NODE_H + (i < col.length - 1 ? gapAfter(col, i) : 0), 0);
  const height = Math.max(...[...columns.values()].map(colHeightOf));
  const width = (depth + 1) * NODE_W + depth * GAP_X;
  const pos = new Map<NodeId, { x: number; y: number }>();
  const badges: Array<{ key: string; x: number; y: number }> = [];
  for (const [d, col] of columns) {
    let y = (height - colHeightOf(col)) / 2;
    col.forEach((n, i) => {
      pos.set(n, { x: d * (NODE_W + GAP_X), y });
      const gap = gapAfter(col, i);
      if (gap === GAP_CHOICE) badges.push({ key: `${n}`, x: d * (NODE_W + GAP_X) + NODE_W / 2, y: y + NODE_H + gap / 2 });
      y += NODE_H + gap;
    });
  }
  const at = (n: NodeId) => pos.get(n)!;
  const lines = nodes.flatMap((n) => parentsOf(n).filter((p) => nodes.includes(p)).map((p) => {
    const [a, b] = [at(p), at(n)];
    return { key: `${p}-${n}`, d: elbow(a.x + NODE_W, a.y + NODE_H / 2, b.x, b.y + NODE_H / 2), on: selected === n || selected === p };
  }));
  const label = (n: NodeId): ReactNode => {
    const have = { gold: goldOf(state, faction), res: resOf(state, faction) };
    if (n === COUNCIL) return <span className="tn-sub">stoi od początku</span>;
    const ex = extraOf(n);
    if (ex) {
      if (ex.state === 'excluded') return <span className="tn-sub">wybrano drugie siedlisko</span>;
      if (ex.state === 'built' || ex.state === 'full') return <span className="tn-sub">{ex.sub ?? 'gotowe'}</span>;
      if (ex.state === 'blocked') return <span className="tn-sub">{ex.sub ?? ''}</span>;
      return ex.cost ? <CostIcons cost={ex.cost} have={have} size={23} /> : <span className="tn-sub">{ex.sub}</span>;
    }
    const bid = n as BuildingId;
    const level = buildingLevel(s, bid);
    const st = nodeState(state, s, faction, bid);
    if (bid === 'spark') return level > 0 ? <span className="tn-sub">płonie</span> : <span className="tn-sub" style={st === 'poor' ? { color: '#8A5A12' } : undefined}>Odłamki: {shardsOf(state, faction)}/{shardTotal(state)}</span>;
    const cost = buildCost(state, s, bid);
    if (st === 'blocked') return <span className="tn-sub">{buildBlock(s, bid) ?? 'Tylko w osadzie własnej frakcji.'}</span>;
    if (st === 'full') return <span className="tn-sub">poziom {level}, gotowe</span>;
    if (level > 0) return <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="tn-sub tn-up">▲ {BUILDING_NAMES[bid][level]}</span><CostIcons cost={cost!} have={have} size={23} /></span>;
    return <span><CostIcons cost={cost!} have={have} size={23} /></span>;
  };
  const renderNode = (n: NodeId, { x, y }: { x: number; y: number }) => {
    const ex = extraOf(n);
    const bid = n as BuildingId;
    const st: NodeState = n === COUNCIL ? 'built' : ex ? ex.state : nodeState(state, s, faction, bid);
    const level = n === COUNCIL || ex ? 1 : buildingLevel(s, bid);
    const pic = n === COUNCIL ? council.picture : ex ? ex.picture : picture(bid, level);
    const name = n === COUNCIL ? council.name : ex ? ex.name : level ? BUILDING_NAMES[bid][Math.min(level, BUILDING_NAMES[bid].length) - 1] : BUILDING_NAMES[bid][0];
    return (
      <button key={n} className={`tree-node ${st} ${selected === n ? 'on' : ''}`} data-tree-node={n} data-node-state={st} style={{ left: x, top: y, width: NODE_W, height: NODE_H }} onClick={() => onSelect(n)}>
        <img src={asset(pic)} alt="" className="tn-pic" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', minWidth: 0 }}>
          <b style={{ fontSize: 15, lineHeight: 1.1 }}>{name}</b>
          {label(n)}
        </span>
      </button>
    );
  };
  // The whole tree is scaled down to fit the field (the screen must not scroll): measured on the outer box, not on the window.
  const outer = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setFit(Math.min(1, (el.clientWidth - 28 - (sparkAside ? NODE_W + 24 : 0)) / width, (el.clientHeight - 70) / height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, sparkAside]);
  const legend: Array<[string, string]> = [['built', 'wybudowany'], ['upgrade', 'można ulepszyć'], ['open', 'można zbudować'], ['poor', 'brakuje surowców'], ['blocked', 'brakuje budynku'], ['excluded', 'zablokowany']];
  return (
    <div className="building-tree" data-building-tree ref={outer}>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: width * fit, height: height * fit, flex: 'none' }}>
      <div style={{ position: 'relative', width, height, transform: `scale(${fit})`, transformOrigin: 'top left' }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} aria-hidden="true">
          <defs>
            <linearGradient id="tree-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
              <stop offset="0" stopColor="#F6DD8A" /><stop offset="0.5" stopColor="#C9983A" /><stop offset="1" stopColor="#8E6420" />
            </linearGradient>
          </defs>
          {lines.map((l) => <path key={`${l.key}-shadow`} d={l.d} fill="none" stroke="#0E0904" strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" />)}
          {lines.map((l) => (
            <path key={l.key} d={l.d} data-tree-line={l.key} fill="none" stroke={l.on ? '#9EE4FF' : 'url(#tree-line)'} strokeWidth={l.on ? 3.5 : 3} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </svg>
        {badges.map((b) => (
          <span key={b.key} className="tree-or" data-tree-or style={{ left: b.x, top: b.y }} title="Jedno albo drugie: zbudowanie jednego wyklucza drugie do końca gry">lub</span>
        ))}
        {nodes.map((n) => renderNode(n, at(n)))}
      </div>
      </div>
      {sparkAside && (
        <div data-tree-aside style={{ width: NODE_W * fit, height: NODE_H * fit, flex: 'none' }}>
          <div style={{ position: 'relative', width: NODE_W, height: NODE_H, transform: `scale(${fit})`, transformOrigin: 'top left' }}>{renderNode('spark', { x: 0, y: 0 })}</div>
        </div>
      )}
      </div>
      <div className="tree-legend" data-tree-legend>
        {legend.map(([st, text]) => <span key={st}><i className={`tree-swatch ${st}`} />{text}</span>)}
      </div>
      <div className="tree-hint" style={{ textAlign: 'center', fontSize: 13, color: '#F6EBD0', textShadow: '0 1px 3px #000', marginTop: 4 }}>
        Osada {FACTION_NAMES[raceOf(state, s.land)]}: budynek wymaga, by stał ten, z którego prowadzi do niego linia.
      </div>
    </div>
  );
}
