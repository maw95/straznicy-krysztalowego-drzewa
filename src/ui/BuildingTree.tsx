// The tree of the settlement's buildings (the Rada Osady view): a node per building, joined by lines that run straight and bend at right angles with
// rounded corners (like Heroes: Olden Era). The graph is the engine's BUILDING_PARENT (docs/BUDYNKI.md 0a); the council is its root and always stands.
// Level 6: both dwellings of a tier stand side by side with a "lub" badge between them (one excludes the other). The colour of a node says its state:
// fully upgraded (beige), has a next level (turquoise, with its name and price; the price turns red where something is missing), can be built now (green),
// only resources missing for a new building (orange), a required building missing (grey stone), shut out for good (red).

import { raceOf } from '../engine/teams';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FACTION_NAMES, type TeamId } from '../engine/data';
import { BUILDING_NAMES, BUILDING_PARENT, buildBlock, buildCost, buildingLevel, canPay, goldOf, resOf, type BuildingId, type Settlement } from '../engine/kingdom';
import { mayBuildSpark, shardsOf, shardTotal } from '../engine/empire';
import type { Cost } from '../engine/economy';
import type { GameState } from '../engine/types';
import { asset } from './common';
import { CostIcons } from './resources';

const NODE_W = 252;
const NODE_H = 120;
const GAP_X = 60;
const GAP_Y = 16;
/** Two nodes of one choice stand further apart: the "lub" badge sits in the gap. */
const GAP_CHOICE = 30;
const RADIUS = 10;
/** The price on a tile: the icons are big, the numbers beside them as well (a price of four things may wrap to a second line). */
const COST_ICON = 32;
const COST_FONT = 20;

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
  // A built house that has a next level is turquoise whether or not the next level can be paid for (the price turns red where something is missing).
  if (level > 0) return 'upgrade';
  return canPay(state, faction, cost) ? 'open' : 'poor';
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
  // The Primal Spark hangs on nothing (it is bought with the Shards, not from a parent building): it stands in the top right corner of the tree, joined by no line.
  const sparkAside = order.includes('spark');
  const nodes: NodeId[] = [COUNCIL, ...order.filter((b) => b !== 'spark'), ...(extras ?? []).map((e) => e.id)];
  const present = (ps: NodeId[]) => ps.filter((p) => nodes.includes(p));
  const depth = Math.max(...nodes.map(depthOf));
  const colX = (d: number) => d * (NODE_W + GAP_X);
  const width = (depth + 1) * NODE_W + depth * GAP_X;

  // Units: a node, or the nodes of one choice ("lub") that stand together. The units form a tree (a unit hangs under the unit of its first parent); the layout
  // puts the children of a unit beside it and the unit in the middle of them, like a family tree, and lets subtrees slip under each other in other columns.
  interface Unit { nodes: NodeId[]; col: number; children: Unit[] }
  const unitOf = new Map<NodeId, Unit>();
  const units: Unit[] = [];
  for (const n of nodes) {
    if (unitOf.has(n)) continue;
    const choice = extraOf(n)?.choice;
    const members = choice ? nodes.filter((m) => extraOf(m)?.choice === choice) : [n];
    const u: Unit = { nodes: members, col: depthOf(n), children: [] };
    units.push(u);
    for (const m of members) unitOf.set(m, u);
  }
  for (const u of units) {
    const parent = present(parentsOf(u.nodes[0])).map((p) => unitOf.get(p)!).find((p) => p !== u);
    if (parent) parent.children.push(u);
  }
  const STEP = NODE_H + GAP_CHOICE;
  const unitH = (u: Unit) => u.nodes.length * NODE_H + (u.nodes.length - 1) * GAP_CHOICE;
  type Contour = Map<number, [number, number]>;
  const layout = (u: Unit): { ys: Map<Unit, number>; con: Contour } => {
    const ys = new Map<Unit, number>();
    const con: Contour = new Map();
    const bottoms = new Map<number, number>();
    const offs: number[] = [];
    u.children.map(layout).forEach((sub, i) => {
      let off = i === 0 ? 0 : -Infinity;
      for (const [c, [top]] of sub.con) if (i > 0 && bottoms.has(c)) off = Math.max(off, bottoms.get(c)! + GAP_Y - top);
      if (off === -Infinity) off = offs[i - 1] ?? 0;
      offs.push(off);
      for (const [c, [top, bottom]] of sub.con) {
        bottoms.set(c, Math.max(bottoms.get(c) ?? -Infinity, bottom + off));
        const had = con.get(c);
        con.set(c, [Math.min(had?.[0] ?? Infinity, top + off), Math.max(had?.[1] ?? -Infinity, bottom + off)]);
      }
      for (const [v, y] of sub.ys) ys.set(v, y + off);
    });
    const mid = offs.length ? (offs[0] + offs[offs.length - 1]) / 2 : 0;
    for (const [v, y] of ys) ys.set(v, y - mid);
    for (const [c, [t, b]] of con) con.set(c, [t - mid, b - mid]);
    ys.set(u, 0);
    con.set(u.col, [-unitH(u) / 2, unitH(u) / 2]);
    return { ys, con };
  };
  const laid = layout(unitOf.get(COUNCIL)!);
  const top = Math.min(...[...laid.con.values()].map(([t]) => t));
  const height = Math.max(...[...laid.con.values()].map(([, b]) => b)) - top;
  const pos = new Map<NodeId, { x: number; y: number }>();
  const badges: Array<{ key: string; x: number; y: number }> = [];
  for (const u of units) {
    const first = laid.ys.get(u)! - unitH(u) / 2 - top;
    u.nodes.forEach((n, i) => {
      pos.set(n, { x: colX(u.col), y: first + i * STEP });
      if (i > 0) badges.push({ key: n, x: colX(u.col) + NODE_W / 2, y: first + i * STEP - GAP_CHOICE / 2 });
    });
  }
  const at = (n: NodeId) => pos.get(n)!;
  const midY = (n: NodeId) => at(n).y + NODE_H / 2;

  // Lines. Nodes with the same parents form a bundle, drawn like in a family tree: the parents' outputs meet in one vertical bar (only where there are several
  // parents), a line runs to the bar before the children, and the children hang on it. A "lub" pair that shares a bar with other children is reached through a
  // small bracket of its own. Every vertical bar gets a lane of the gap between two columns; bars whose spans do not meet may share a lane, so no two bars
  // ever lie on one another.
  type Kind = 'out' | 'in' | 'sub';
  interface Seg { gap: number; y1: number; y2: number; kind: Kind; lane: number; links?: { out?: Seg; in?: Seg } }
  interface Bundle { key: string; parents: NodeId[]; children: NodeId[]; out?: Seg; inn?: Seg; subs: Array<{ seg: Seg; nodes: NodeId[] }>; entries: Array<{ y: number; group?: Seg }>; yFeed: number }
  const bundleMap = new Map<string, { parents: NodeId[]; children: NodeId[] }>();
  for (const n of nodes) {
    if (n === COUNCIL) continue;
    const ps = [...new Set(present(parentsOf(n)))].sort();
    const k = ps.join('|');
    bundleMap.set(k, { parents: ps, children: [...(bundleMap.get(k)?.children ?? []), n] });
  }
  const allSegs: Seg[] = [];
  const mkSeg = (gap: number, ys: number[], kind: Kind): Seg => {
    const s: Seg = { gap, y1: Math.min(...ys), y2: Math.max(...ys), kind, lane: -1 };
    if (s.y2 - s.y1 >= 1) allSegs.push(s);
    return s;
  };
  const bundles: Bundle[] = [...bundleMap].map(([key, b]) => {
    const d = depthOf(b.children[0]);
    const multi = b.parents.length > 1;
    const parentYs = b.parents.map(midY);
    const yFeed = multi ? (Math.min(...parentYs) + Math.max(...parentYs)) / 2 : parentYs[0];
    const choiceOf = (n: NodeId) => extraOf(n)?.choice;
    const groups = new Map<string, NodeId[]>();
    for (const c of b.children) if (choiceOf(c)) groups.set(choiceOf(c)!, [...(groups.get(choiceOf(c)!) ?? []), c]);
    const sole = groups.size === 1 && [...groups.values()][0].length === b.children.length;
    const entries: Bundle['entries'] = [];
    const subs: Bundle['subs'] = [];
    for (const c of b.children) {
      const g = choiceOf(c) && !sole ? groups.get(choiceOf(c)!)! : null;
      if (!g || g.length < 2) entries.push({ y: midY(c) });
      else if (g[0] === c) {
        const seg = mkSeg(d, g.map(midY), 'sub');
        subs.push({ seg, nodes: g });
        entries.push({ y: (Math.min(...g.map(midY)) + Math.max(...g.map(midY))) / 2, group: seg });
      }
    }
    const out = multi ? mkSeg(Math.max(...b.parents.map((p) => depthOf(p))) + 1, parentYs, 'out') : undefined;
    const inn = mkSeg(d, [yFeed, ...entries.map((e) => e.y)], 'in');
    return { key, ...b, out, inn, subs, entries, yFeed };
  });
  // Lanes, gap by gap: first the bars that leave the parents, then those before the children, then the brackets (each one lane further right than its feeder).
  const order3: Kind[] = ['out', 'in', 'sub'];
  for (const g of new Set(allSegs.map((s) => s.gap))) {
    const here = allSegs.filter((s) => s.gap === g);
    for (const kind of order3) {
      for (const s of here.filter((x) => x.kind === kind).sort((a, b) => a.y1 - b.y1)) {
        const owner = bundles.find((b) => b.out === s || b.inn === s || b.subs.some((x) => x.seg === s))!;
        const feeder = kind === 'in' ? owner.out : kind === 'sub' ? owner.inn : undefined;
        let lane = feeder && feeder.gap === g && feeder.lane >= 0 ? feeder.lane + 1 : 0;
        while (here.some((o) => o !== s && o.lane === lane && o.y1 < s.y2 + 8 && s.y1 < o.y2 + 8)) lane++;
        s.lane = lane;
      }
    }
  }
  const lanesIn = (g: number) => Math.max(0, ...allSegs.filter((s) => s.gap === g).map((s) => s.lane + 1));
  const laneX = (s: Seg) => colX(s.gap) - GAP_X + ((s.lane + 1) * GAP_X) / (lanesIn(s.gap) + 1);
  const hasBar = (s?: Seg) => Boolean(s && s.lane >= 0);
  /** One vertical bar with the horizontal lines that meet it (from the left: `l`, to the right: `r`); the corners at the two ends are rounded. */
  const bar = (x: number, y1: number, y2: number, l: Array<{ y: number; x0: number }>, r: Array<{ y: number; x1: number }>): string => {
    // No height: a plain line (nothing at all when its feeder is drawn by the bar before it).
    if (y2 - y1 < 1) return l.length && r.length ? `M ${Math.min(...l.map((a) => a.x0))} ${y1} H ${Math.max(...r.map((a) => a.x1))}` : '';
    const near = (y: number, e: number) => Math.abs(y - e) < 1;
    const parts: string[] = [];
    const corner = (end: number, down: number): { start: string; after: string; used: unknown[] } => {
      const ls = l.filter((a) => near(a.y, end));
      const rs = r.filter((a) => near(a.y, end));
      const room = Math.min(RADIUS, (y2 - y1) / 2);
      if (ls.length === 1 && rs.length === 0) {
        const c = Math.min(room, x - ls[0].x0 - 1);
        return { start: `${ls[0].x0} ${end} H ${x - c} Q ${x} ${end} ${x} ${end + down * c}`, after: `${x - c} ${end}`, used: ls };
      }
      if (rs.length === 1 && ls.length === 0) {
        const c = Math.min(room, rs[0].x1 - x - 1);
        return { start: `${rs[0].x1} ${end} H ${x + c} Q ${x} ${end} ${x} ${end + down * c}`, after: `${x + c} ${end}`, used: rs };
      }
      return { start: `${x} ${end}`, after: '', used: [] };
    };
    const t = corner(y1, 1);
    const b = corner(y2, -1);
    parts.push(`M ${t.start}`);
    if (b.used.length) {
      const c = Math.min(RADIUS, (y2 - y1) / 2);
      // the bottom corner is drawn backwards: up from the end of the bar along the bend to the stub's far end
      parts.push(`V ${y2 - c} Q ${x} ${y2} ${(b.used[0] as { x0?: number; x1?: number }).x0 !== undefined ? x - Math.min(c, x - (b.used[0] as { x0: number }).x0 - 1) : x + Math.min(c, (b.used[0] as { x1: number }).x1 - x - 1)} ${y2} H ${(b.used[0] as { x0?: number; x1?: number }).x0 ?? (b.used[0] as { x1: number }).x1}`);
    } else parts.push(`V ${y2}`);
    for (const a of l) if (!t.used.includes(a) && !b.used.includes(a)) parts.push(`M ${a.x0} ${a.y} H ${x}`);
    for (const a of r) if (!t.used.includes(a) && !b.used.includes(a)) parts.push(`M ${x} ${a.y} H ${a.x1}`);
    return parts.join(' ');
  };
  const lines = bundles.map((b) => {
    const d = depthOf(b.children[0]);
    const xc = colX(d);
    const pr = (p: NodeId) => colX(depthOf(p)) + NODE_W;
    const outX = hasBar(b.out) ? laneX(b.out!) : undefined;
    // What reaches the bar before the children: the single parent, or the middle of the bar that gathers several.
    const feed = b.parents.length > 1 ? { y: b.yFeed, x0: outX ?? Math.max(...b.parents.map(pr)) } : { y: b.yFeed, x0: pr(b.parents[0]) };
    const parts: string[] = [];
    if (b.parents.length > 1 && hasBar(b.out)) parts.push(bar(outX!, b.out!.y1, b.out!.y2, b.parents.map((p) => ({ y: midY(p), x0: pr(p) })), [{ y: b.yFeed, x1: hasBar(b.inn) ? laneX(b.inn!) : xc }]));
    else if (b.parents.length > 1) parts.push(...b.parents.map((p) => `M ${pr(p)} ${midY(p)} H ${xc}`));
    const inX = hasBar(b.inn) ? laneX(b.inn!) : xc;
    const stubs = b.entries.map((e) => ({ y: e.y, x1: e.group ? laneX(e.group) : xc }));
    // The line that reaches this bar is drawn by the bar before it (the parents' bar) when there is one; the bracket of a pair is fed by this bar's own stub.
    parts.push(bar(inX, b.inn!.y1, b.inn!.y2, hasBar(b.out) ? [] : [feed], stubs));
    for (const s of b.subs) parts.push(bar(laneX(s.seg), s.seg.y1, s.seg.y2, [], s.nodes.map((n) => ({ y: midY(n), x1: xc }))));
    return { key: b.key.replace(/\|/g, '+') + '-' + b.children.join('+'), d: parts.join(' '), on: [...b.parents, ...b.children].includes(selected ?? '') };
  });
  const label = (n: NodeId): ReactNode => {
    const have = { gold: goldOf(state, faction), res: resOf(state, faction) };
    if (n === COUNCIL) return <span className="tn-sub">stoi od początku</span>;
    const ex = extraOf(n);
    if (ex) {
      if (ex.state === 'excluded') return <span className="tn-sub">wybrano drugie siedlisko</span>;
      if (ex.state === 'built' || ex.state === 'full') return <span className="tn-sub">{ex.sub ?? 'gotowe'}</span>;
      if (ex.state === 'blocked') return <span className="tn-sub">{ex.sub ?? ''}</span>;
      return ex.cost ? <CostIcons cost={ex.cost} have={have} size={COST_ICON} fontSize={COST_FONT} wrap /> : <span className="tn-sub">{ex.sub}</span>;
    }
    const bid = n as BuildingId;
    const level = buildingLevel(s, bid);
    const st = nodeState(state, s, faction, bid);
    if (bid === 'spark') return level > 0 ? <span className="tn-sub">płonie</span> : <span className="tn-sub" style={st === 'poor' ? { color: '#8A5A12' } : undefined}>Odłamki: {shardsOf(state, faction)}/{shardTotal(state)}</span>;
    const cost = buildCost(state, s, bid);
    if (st === 'blocked') return <span className="tn-sub">{buildBlock(s, bid) ?? 'Tylko w osadzie własnej frakcji.'}</span>;
    if (st === 'full') return <span className="tn-sub">poziom {level}, gotowe</span>;
    if (level > 0) return <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="tn-sub tn-up">▲ {BUILDING_NAMES[bid][level]}</span><CostIcons cost={cost!} have={have} size={COST_ICON} fontSize={COST_FONT} wrap /></span>;
    return <span><CostIcons cost={cost!} have={have} size={COST_ICON} fontSize={COST_FONT} wrap /></span>;
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
          <b style={{ fontSize: 18, lineHeight: 1.1 }}>{name}</b>
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
    const measure = () => setFit(Math.min(1, (el.clientWidth - 28) / width, (el.clientHeight - 70) / height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);
  const legend: Array<[string, string]> = [['built', 'w pełni rozbudowany'], ['upgrade', 'można ulepszyć'], ['open', 'można zbudować'], ['poor', 'brakuje surowców'], ['blocked', 'brakuje budynku'], ['excluded', 'zablokowany']];
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
          <span key={b.key} className="tree-or" data-tree-or style={{ left: b.x, top: b.y }}>lub</span>
        ))}
        {nodes.map((n) => renderNode(n, at(n)))}
        {/* The Primal Spark stands in the free top right corner of the tree (nothing leads to it). */}
        {sparkAside && renderNode('spark', { x: colX(depth), y: 0 })}
      </div>
      </div>
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
