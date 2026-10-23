import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FACTION_NAMES, ITEMS, TERRAIN_COST, TERRAIN_NAMES, UNITS, type FactionId } from '../engine/data';
import { activeHero, heroesAt, legalHeroMoves, reviveSpots } from '../engine/game';
import type { HexKey } from '../engine/hex';
import { mapNeighbors, tileCost } from '../engine/map';
import type { Action, GameState, Tile } from '../engine/types';
import { hoverCard } from './hover';
import { details, useDetailsShown } from './details';
import { aimedCursor } from './cursors';
import { figureFor, FigureLayer, type Piece } from './FigureLayer';
import { StatIcon, StatText } from './markers';
import { RoundTrack } from './RoundTrack';
import { asset, Frame, HpBar, Medal, Pips, Portrait, Ribbon, SIDE_RING, tileImage } from './common';

interface Props {
  state: GameState;
  viewer: FactionId | null;
  canAct: boolean;
  onAction: (a: Action) => void;
  onPath: (steps: HexKey[], hostile: boolean) => void;
  onShowCard: (unitId: string) => void;
  footer: React.ReactNode;
}

/** Cheapest paths the active hero can still walk this turn (revealed hexes only). */
function reachablePaths(state: GameState): Map<HexKey, { cost: number; path: HexKey[]; hostile: boolean }> {
  const hero = activeHero(state);
  const out = new Map<HexKey, { cost: number; path: HexKey[]; hostile: boolean }>();
  if (!hero || state.phase !== 'adventure' || state.turnBattleDone) return out;
  // A reserve hero coming in: any of its entry hexes, one click each.
  if (hero.entering) {
    for (const k of hero.entering) out.set(k, { cost: 0, path: [hero.pos, k], hostile: false });
    return out;
  }
  out.set(hero.pos, { cost: 0, path: [hero.pos], hostile: false });
  const open = [hero.pos];
  while (open.length) {
    open.sort((a, b) => out.get(a)!.cost - out.get(b)!.cost);
    const cur = open.shift()!;
    const base = out.get(cur)!;
    if (base.hostile) continue;
    for (const n of mapNeighbors(state.tiles, cur)) {
      const t = state.tiles[n];
      const c = tileCost(t);
      if (!t.revealed || c === null) continue;
      const foes = heroesAt(state, n).some((h) => h.faction !== hero.faction);
      const guarded = Boolean(t.crystalId && state.crystals[t.crystalId].guardian);
      if (guarded && hero.faction === 'horde') continue;
      const hostile = foes || guarded;
      const cost = hostile ? (base.cost < state.movePoints ? state.movePoints : Infinity) : base.cost + c;
      if (cost > state.movePoints) continue;
      const old = out.get(n);
      if (!old || cost < old.cost) {
        out.set(n, { cost, path: [...base.path, n], hostile });
        if (!open.includes(n)) open.push(n);
      }
    }
  }
  out.delete(hero.pos);
  return out;
}

export function AdventureView({ state, viewer, canAct, onAction, onPath, onShowCard, footer }: Props) {
  const detailsShown = useDetailsShown();
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  const [selected, setSelected] = useState<HexKey | null>(null);
  const [hover, setHover] = useState<HexKey | null>(null);
  const [mapPicks, setMapPicks] = useState<{ itemId: string; picks: HexKey[] } | null>(null);
  const [resPick, setResPick] = useState<string | null>(null);
  /** A fallen hero being revived: the player picks a free hex next to the active hero. */
  const [revive, setRevive] = useState<{ itemId: string; unitId: string } | null>(null);

  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const hero = activeHero(state);
  const rows = state.rows;
  // Path the active hero walked this turn (drawn as a flowing dotted line).
  const trail = useRef<{ turn: string; hexes: HexKey[] }>({ turn: '', hexes: [] });
  if (hero && !hero.entering) {
    const turn = `${state.round}:${state.turnIndex}:${hero.id}`;
    if (trail.current.turn !== turn) trail.current = { turn, hexes: [hero.pos] };
    else if (trail.current.hexes[trail.current.hexes.length - 1] !== hero.pos) trail.current.hexes.push(hero.pos);
  }

  // Only hexes revealed since the previous render turn over (not the whole map on remount).
  const seenRevealed = useRef<Set<HexKey> | null>(null);
  const freshlyRevealed = new Set<HexKey>();
  const nowRevealed = new Set(Object.values(state.tiles).filter((t) => t.revealed).map((t) => t.key));
  if (seenRevealed.current) for (const k of nowRevealed) if (!seenRevealed.current.has(k)) freshlyRevealed.add(k);
  useEffect(() => {
    seenRevealed.current = nowRevealed;
  });
  // Fit the triangle into the frame; on phones keep hexes finger-sized and let the map scroll.
  const fitW = Math.min(118, (box.w - 24) / rows, (box.h - 24) / (1.1547 * (0.75 * (rows - 1) + 1)));
  const W = box.w < 600 ? Math.max(fitW, 46) : fitW;
  const H = W * 1.1547;
  const boardW = rows * W;
  const boardH = H + (rows - 1) * 0.75 * H;
  const reviveAt = useMemo(() => (revive && hero ? reviveSpots(state, hero) : null), [revive, hero, state]);
  const reach = useMemo(() => {
    if (!canAct) return new Map();
    // While placing a revived hero the highlighted hexes are its free spots, not the walk.
    if (reviveAt && hero) return new Map(reviveAt.map((k) => [k, { cost: 0, path: [hero.pos, k], hostile: false }]));
    return reachablePaths(state);
  }, [state, canAct, reviveAt, hero]);
  const legal = useMemo(() => new Set(legalHeroMoves(state).map((m) => m.to)), [state]);
  const preview = hover && reach.get(hover) ? reach.get(hover)!.path : null;
  const tiles = Object.values(state.tiles);
  const pos = (t: Tile) => ({ x: ((rows - 1) / 2 + t.col - t.row / 2) * W, y: t.row * 0.75 * H });
  /** Where a hero stands on its hex: the middle of the base (heroes sharing a hex stand side by side). */
  const heroSpot = (h: (typeof state.heroes)[string]) => {
    const p = pos(state.tiles[h.pos]);
    const stack = Object.values(state.heroes).filter((o) => o.alive && !o.entering && o.pos === h.pos);
    const i = stack.findIndex((o) => o.id === h.id);
    const stacked = stack.length > 1;
    const spread = stacked ? (i - (stack.length - 1) / 2) * W * 0.3 : 0;
    const size = stacked ? W * 0.46 : W * 0.62;
    return { x: p.x + W / 2 + spread, y: p.y + H * 0.66 - (stacked ? (i % 2) * H * 0.12 : 0), size, spread, i, stacked };
  };
  const figurePieces: Piece[] = Object.values(state.heroes)
    .filter((h) => h.alive && !h.entering && figureFor(h.id))
    .map((h): Piece => {
      const { x, y, size } = heroSpot(h);
      return { key: h.id, unitId: h.id, x, y, size, moveMs: 300, ring: hero?.id === h.id ? '#9EE4FF' : SIDE_RING[h.faction] };
    })
    // Guardians stand by the crystals they keep, on revealed hexes, the crystal glowing in front of them.
    .concat(
      Object.values(state.crystals)
        .filter((c) => c.guardian && figureFor(c.guardian) && state.tiles[c.at]?.revealed)
        .map((c): Piece => {
          const p = pos(state.tiles[c.at]);
          return { key: `guard-${c.id}`, unitId: c.guardian!, x: p.x + W / 2, y: p.y + H * 0.6, size: W * 0.58, ring: SIDE_RING.neutral };
        }),
    );
  const sel = selected ? state.tiles[selected] : hero ? state.tiles[hero.pos] : null;
  const faction = hero?.faction ?? 'dawn';
  const inventory = viewer ? state.factions[viewer].inventory.map((id) => state.items[id]) : [];

  /** The cursor over a hex says what a click does: walk there, start a fight, or pick it (map, revival). */
  function hexCursor(k: HexKey): string {
    if (mapPicks) return state.tiles[k].revealed ? 'cur-idle' : 'cur-pointer';
    if (!canAct) return 'cur-idle';
    if (reviveAt) return reviveAt.includes(k) ? 'cur-pointer' : 'cur-idle';
    const r = reach.get(k);
    if (r) return r.hostile ? 'cur-melee' : 'cur-move';
    if (legal.has(k)) return legalHeroMoves(state).find((m) => m.to === k)!.kind === 'move' ? 'cur-move' : 'cur-melee';
    return 'cur-idle';
  }

  /** Over a hex where walking in starts a fight: the sword turned from the hero towards it. */
  function fightCursor(k: HexKey): { cursor?: string } {
    if (!hero || hexCursor(k) !== 'cur-melee') return {};
    const from = pos(state.tiles[hero.pos]);
    const to = pos(state.tiles[k]);
    const cursor = aimedCursor('atak', (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI);
    return cursor ? { cursor } : {};
  }

  function clickTile(k: HexKey) {
    setSelected(k);
    if (mapPicks) {
      if (state.tiles[k].revealed) return;
      const picks = mapPicks.picks.includes(k) ? mapPicks.picks.filter((x) => x !== k) : [...mapPicks.picks, k].slice(0, 3);
      setMapPicks({ ...mapPicks, picks });
      return;
    }
    if (!canAct) return;
    if (revive) {
      if (reviveAt?.includes(k)) onAction({ type: 'useMapItem', itemId: revive.itemId, unitId: revive.unitId, targets: [k] });
      setRevive(null);
      return;
    }
    const r = reach.get(k);
    if (r) onPath(r.path.slice(1), r.hostile);
    else if (legal.has(k)) onPath([k], legalHeroMoves(state).find((m) => m.to === k)!.kind !== 'move');
  }

  const deadUnits = viewer
    ? [
        ...Object.values(state.heroes).filter((h) => h.faction === viewer && !h.alive).map((h) => h.id),
        ...state.factions[viewer].supportsDead,
      ]
    : [];

  return (
    <div className="screen slate screen-enter">
      <div className="main-row">
        <Frame crest className="grow map-frame" innerClass="" innerStyle={{ background: '#0B1416' }}>
          {/* Small source image: a soft blur hides its pixels until a larger painting replaces it. */}
          <img src={asset('ui/landscape.jpg')} alt="" style={{ position: 'absolute', inset: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)', objectFit: 'cover', opacity: 0.42, filter: 'blur(2.5px)' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 140px 50px rgba(4,10,12,0.85)' }} />
          <div style={{ position: 'absolute', left: 18, top: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, zIndex: 2 }}>
            <Ribbon style={{ width: Math.min(330, box.w - 20) }}>Kraina Kryształowego Drzewa</Ribbon>
            <div style={{ marginLeft: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <RoundTrack round={state.round} limit={state.roundLimit} ritual={state.ritual} ritualRounds={state.rules.ritualRounds} size={Math.max(160, Math.min(290, box.w * 0.26, box.h * 0.45))} />
              <div className="plate parch" style={{ padding: '2px 14px', fontWeight: 700, fontSize: 15 }}>
                Runda {state.round} z {state.roundLimit}
              </div>
            </div>
          </div>
          <div ref={boardRef} className="scroll" style={{ position: 'absolute', inset: '60px 6px 6px', overflow: 'auto', display: 'flex' }}>
            <div style={{ position: 'relative', flex: 'none', margin: 'auto', width: boardW, height: boardH }}>
              {tiles.map((t) => {
                const p = pos(t);
                const r = reach.get(t.key);
                const isSel = selected === t.key;
                const onPath = preview?.includes(t.key);
                const crystal = t.revealed ? Object.values(state.crystals).find((c) => c.at === t.key) : undefined;
                const picked = mapPicks?.picks.includes(t.key);
                const rim = picked || isSel ? 'linear-gradient(135deg,#F2FCFF,#9EE4FF 40%,#2A6FB0)' : 'linear-gradient(135deg,#FFF0B0 0%,#E2B04A 30%,#9A6A18 62%,#F0CF78 100%)';
                return (
                  <button
                    key={t.key}
                    type="button"
                    className="hexbtn"
                    aria-label={t.revealed ? TERRAIN_NAMES[t.terrain] : 'Nieodkryte pole'}
                    onClick={() => clickTile(t.key)}
                    {...details(() => <TileDetails state={state} k={t.key} />)}
                    onMouseEnter={() => setHover(t.key)}
                    onMouseLeave={() => setHover(null)}
                    // Only the hexagonal hit area below takes the pointer: rectangular button boxes
                    // overlap the next row, which used to swallow clicks meant for this hex.
                    style={{ position: 'absolute', left: p.x, top: p.y, width: W, height: H, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.6))', pointerEvents: 'none' }}
                  >
                    <div className="hex-clip" style={{ position: 'absolute', inset: 0, background: '#1E1204' }} />
                    <div className="hex-clip" style={{ position: 'absolute', inset: 2, background: rim }} />
                    <div className="hex-clip" style={{ position: 'absolute', inset: W * 0.055, background: '#1E1204' }} />
                    <div key={t.revealed ? 'r' : 'h'} className={`hex-clip ${freshlyRevealed.has(t.key) ? 'flip-in' : ''}`} style={{ position: 'absolute', inset: W * 0.065, overflow: 'hidden', background: '#10201F' }}>
                      <img src={tileImage(t)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scale(1.08)' }} />
                      {!t.revealed && <div className="fog" style={{ opacity: 0.18, animationDelay: `${-((t.row * 7 + t.col * 13) % 60)}s` }} />}
                      {(r || onPath) && <div style={{ position: 'absolute', inset: 0, background: onPath ? 'rgba(158,228,255,0.35)' : 'rgba(158,228,255,0.18)', boxShadow: 'inset 0 0 18px rgba(158,228,255,0.7)' }} />}
                    </div>
                    {t.tree && (
                      <>
                        <div className="tree-glow" style={{ ['--glow' as string]: 0.35 + (0.65 * state.factions.dawn.delivered) / state.crystalsNeeded } as React.CSSProperties} />
                        {Array.from({ length: 4 + state.factions.dawn.delivered * 3 }, (_, i) => (
                          <span key={i} className="spark" style={{ left: `${25 + ((i * 37) % 50)}%`, top: `${45 + ((i * 23) % 30)}%`, ['--sx' as string]: `${((i * 17) % 21) - 10}px`, ['--sd' as string]: `${2.4 + (i % 4) * 0.6}s`, ['--sdl' as string]: `${-(i * 0.7)}s` } as React.CSSProperties} />
                        ))}
                      </>
                    )}
                    {t.revealed && t.treasureId && (
                      <div className="glint" style={{ position: 'absolute', right: W * 0.12, top: H * 0.24 }} title="Skarb">
                        <Medal fill="mBrown" glyph="gChest" size={W * 0.3} />
                      </div>
                    )}
                    {crystal && (
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center' }}>
                        {crystal.guardian && !figureFor(crystal.guardian) && <Portrait unitId={crystal.guardian} size={W * 0.5} ring={SIDE_RING.neutral} title={UNITS[crystal.guardian].name} />}
                        <div className="twinkle" style={{ marginLeft: crystal.guardian && !figureFor(crystal.guardian) ? -W * 0.12 : 0 }} title="Kryształ">
                          <Medal fill="mBlue" glyph="gCrystal" size={W * 0.28} />
                        </div>
                      </div>
                    )}
                    {r && !onPath && (
                      <div className="plate parch" style={{ position: 'absolute', left: W * 0.57, top: H * 0.63, minWidth: W * 0.27, height: H * 0.2, padding: '0 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: W * 0.15, color: r.hostile ? '#8A1A1A' : '#12304E' }}>
                        {r.hostile ? '⚔' : r.cost}
                      </div>
                    )}
                    {(() => {
                      const turned = fightCursor(t.key);
                      return <span className={`hex-clip ${turned.cursor ? '' : hexCursor(t.key)}`} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'auto', ...turned }} />;
                    })()}
                  </button>
                );
              })}
              {trail.current.hexes.length > 1 && (
                <svg aria-hidden="true" width={boardW} height={boardH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 6 }}>
                  <polyline
                    points={trail.current.hexes.map((k) => `${pos(state.tiles[k]).x + W / 2},${pos(state.tiles[k]).y + H / 2}`).join(' ')}
                    fill="none"
                    stroke="#1E1204"
                    strokeWidth={W * 0.08}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                  <polyline
                    className="trail"
                    points={trail.current.hexes.map((k) => `${pos(state.tiles[k]).x + W / 2},${pos(state.tiles[k]).y + H / 2}`).join(' ')}
                    fill="none"
                    stroke="#F3D27A"
                    strokeWidth={W * 0.04}
                    strokeDasharray="2 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {/* Heroes with a model stand on the board as 3D figures, the rest as portrait tokens; both glide between hexes. */}
              <FigureLayer width={boardW} height={boardH} pieces={figurePieces} style={{ zIndex: 7 }} />
              {Object.values(state.heroes)
                .filter((h) => h.alive && !h.entering)
                .map((h) => {
                  const { x, y, size, spread, i, stacked } = heroSpot(h);
                  const isActive = hero?.id === h.id;
                  if (figureFor(h.id)) {
                    // The figure is on the 3D layer: only the crystal it carries shows here, by its base.
                    return h.crystals.length > 0 ? (
                      <div key={h.id} className="token" style={{ position: 'absolute', left: x + size * 0.3, top: y - size * 0.75, zIndex: 8, pointerEvents: 'none' }}>
                        <Medal fill="mBlue" glyph="gCrystal" size={W * 0.24} />
                      </div>
                    ) : null;
                  }
                  const p = pos(state.tiles[h.pos]);
                  const tokenSize = stacked ? W * 0.48 : W * 0.58;
                  return (
                    <div
                      key={h.id}
                      className={`token ${isActive ? 'active-token' : ''}`}
                      style={{ position: 'absolute', left: p.x + W / 2 - tokenSize / 2 + spread, top: p.y + H * 0.45 - tokenSize / 2 - (stacked ? (i % 2) * H * 0.12 : 0), zIndex: isActive ? 8 : 7, pointerEvents: 'none' }}
                    >
                      <Portrait unitId={h.id} size={tokenSize} ring={SIDE_RING[h.faction]} glow={isActive ? '0 0 0 2.5px #9EE4FF, 0 0 14px 4px rgba(158,228,255,0.6)' : '0 0 0 1.5px #1E1204, 0 8px 14px rgba(0,0,0,0.7)'} title={UNITS[h.id].name} />
                      {h.crystals.length > 0 && (
                        <div style={{ position: 'absolute', right: -6, top: -6 }}>
                          <Medal fill="mBlue" glyph="gCrystal" size={W * 0.24} />
                        </div>
                      )}
                    </div>
                  );
                })}
              {hover && !mapPicks && !detailsShown && <HexTooltip state={state} k={hover} reach={reach.get(hover)} heroName={hero ? UNITS[hero.id].name : ''} x={pos(state.tiles[hover]).x} y={pos(state.tiles[hover]).y} W={W} H={H} boardW={boardW} />}
            </div>
          </div>
          {mapPicks && (
            <div className="plate parch" style={{ position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)', padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', zIndex: 4 }}>
              <b>Magiczna Mapa:</b> wybierz do 3 zakrytych pól ({mapPicks.picks.length}/3)
              <button className="btn prim" style={{ padding: '4px 14px', fontSize: 16 }} disabled={!mapPicks.picks.length} onClick={() => { onAction({ type: 'useMapItem', itemId: mapPicks.itemId, targets: mapPicks.picks }); setMapPicks(null); }}>Odkryj</button>
              <button className="btn plate parch" style={{ padding: '4px 10px', fontSize: 16 }} onClick={() => setMapPicks(null)}>Anuluj</button>
            </div>
          )}
        </Frame>

        <Frame className="side side-adv" innerStyle={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Ribbon side={faction}>{hero ? FACTION_NAMES[hero.faction] : 'Koniec gry'}</Ribbon>
          {hero && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn" style={{ background: 'none', border: 0, padding: 0 }} onClick={() => onShowCard(hero.id)} title="Pokaż kartę">
                <Portrait unitId={hero.id} size={64} ring={SIDE_RING[hero.faction]} glow="0 0 0 2.5px #9EE4FF, 0 0 12px 3px rgba(158,228,255,0.5)" />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#F3D27A' }}>{UNITS[hero.id].name}</div>
                <div style={{ fontSize: 15, color: 'var(--muted)' }}>{hero.playerId ? state.players.find((p) => p.id === hero.playerId)?.name : 'Automat zła'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: 15 }}>
                  Ruch <Pips total={state.rules.heroMovePoints} left={state.movePoints} />
                  {hero.crystals.length > 0 && <span style={{ color: '#9EE4FF' }}>· niesie {hero.crystals.length} kryształ(y)</span>}
                </div>
              </div>
            </div>
          )}
          <div className="well" style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.values(state.heroes).map((h) => (
              <button key={h.id} className="btn" style={{ background: 'none', border: 0, padding: 0 }} onClick={() => onShowCard(h.id)} title={`${UNITS[h.id].name}${h.alive ? '' : ' (poległ)'}`}>
                <Portrait unitId={h.id} size={42} ring={SIDE_RING[h.faction]} dim={!h.alive} />
              </button>
            ))}
            <div style={{ width: '100%', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['dawn', 'horde'] as FactionId[]).flatMap((f) =>
                [...state.factions[f].supportsAlive, ...state.factions[f].supportsDead].map((id) => (
                  <button key={id} className="btn" style={{ background: 'none', border: 0, padding: 0 }} onClick={() => onShowCard(id)} title={UNITS[id].name}>
                    <Portrait unitId={id} size={30} ring={SIDE_RING[f]} dim={state.factions[f].supportsDead.includes(id)} />
                  </button>
                )),
              )}
            </div>
          </div>

          {sel && (
            <div className="plate parch" style={{ padding: '9px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img className="hex-clip" src={tileImage(sel)} alt="" style={{ width: 48, height: 55, flex: 'none', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{sel.revealed ? TERRAIN_NAMES[sel.terrain] : `Nieodkryte pole (${sel.side === 'dawn' ? 'kraina Przymierza' : 'kraina Hordy'})`}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>
                  {sel.revealed ? (TERRAIN_COST[sel.terrain] === null ? 'Nieprzechodnie' : `Koszt ruchu: ${TERRAIN_COST[sel.terrain]}`) : 'Teren i zawartość są ukryte.'}
                </div>
                {sel.revealed && sel.treasureId && <div style={{ fontSize: 15, fontStyle: 'italic' }}>Leży tu skarb.</div>}
                {sel.revealed && Object.values(state.crystals).some((c) => c.at === sel.key && c.guardian) && <div style={{ fontSize: 15, fontStyle: 'italic' }}>Kryształ pod strażą.</div>}
              </div>
            </div>
          )}

          <div className="well" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 16 }}>
            <div className="lbl">Cele</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kryształy przy Drzewie</span><b style={{ color: '#F3D27A' }}>{state.factions.dawn.delivered} / {state.crystalsNeeded}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Runda</span><b style={{ color: '#F3D27A' }}>{state.round} / {state.roundLimit}</b></div>
            {state.ritual > 0 && <div style={{ color: '#F08A7A', fontWeight: 700 }}>Rytuał przy Drzewie: {state.ritual}/{state.rules.ritualRounds}</div>}
          </div>

          <div className="lbl" style={{ marginTop: 2 }}>Wspólne skarby frakcji {viewer ? `· ${FACTION_NAMES[viewer]}` : ''}</div>
          <div className="scroll" style={{ flex: 1, minHeight: 60, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inventory.length === 0 && <div style={{ fontSize: 15, color: 'var(--muted)', fontStyle: 'italic' }}>Brak skarbów.</div>}
            {inventory.map((it) => {
              const def = ITEMS[it.kind];
              const usable = canAct && hero?.faction === viewer && def.usableIn.includes('map') && (it.kind !== 'resurrection' || deadUnits.length > 0);
              return (
                <div key={it.id} className="plate parch" style={{ padding: '6px 9px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn" title="Pokaż kartę skarbu" onClick={() => onShowCard(`item:${it.kind}`)} style={{ background: 'none', border: 0, padding: 0, flex: 'none' }}>
                    <img {...hoverCard(`item:${it.kind}`)} src={asset(`cards/treasures/${it.kind}.jpg`)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px #B88A35, 0 0 0 3px #3A2508' }} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>{def.name}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.15 }}><StatText text={def.text} /></div>
                    {it.foundBy && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#6B5233' }}>Znalazł(a): {UNITS[it.foundBy].name}</div>}
                  </div>
                  {usable && (
                    <button className="btn prim" style={{ padding: '3px 10px', fontSize: 14 }} onClick={() => (it.kind === 'map' ? setMapPicks({ itemId: it.id, picks: [] }) : setResPick(it.id))}>
                      Użyj
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {resPick && (
            <div className="plate parch" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b>Kogo wskrzesić?</b>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {deadUnits.map((id) => (
                  <button
                    key={id}
                    className="btn"
                    style={{ background: 'none', border: 0, padding: 0 }}
                    title={UNITS[id].name}
                    onClick={() => {
                      // A hero comes back on a free hex next to the active hero; a support joins at once.
                      if (state.heroes[id]) setRevive({ itemId: resPick, unitId: id });
                      else onAction({ type: 'useMapItem', itemId: resPick, unitId: id });
                      setResPick(null);
                    }}
                  >
                    <Portrait unitId={id} size={44} />
                  </button>
                ))}
                <button className="btn plate parch" style={{ padding: '2px 8px' }} onClick={() => setResPick(null)}>Anuluj</button>
              </div>
            </div>
          )}
          {revive && (
            <div className="plate parch" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b>Gdzie stanie {UNITS[revive.unitId].name}?</b>
              <div style={{ fontSize: 14 }}>{reviveAt?.length ? 'Kliknij podświetlone wolne pole obok swojego bohatera.' : 'Obok nie ma wolnego pola — przejdź gdzie indziej i spróbuj ponownie.'}</div>
              <button className="btn plate parch" style={{ padding: '2px 8px', alignSelf: 'flex-start' }} onClick={() => setRevive(null)}>Anuluj</button>
            </div>
          )}
          <button className="btn prim" disabled={!canAct} style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 21, flex: 'none' }} onClick={() => onAction({ type: 'endTurn' })}>
            <Medal fill="mGreen" glyph="gHourglass" size={32} />
            Zakończ turę
          </button>
        </Frame>
      </div>
      {footer}
    </div>
  );
}

export function heroHpLine(hp: number, max: number) {
  return <HpBar hp={hp} max={max} />;
}

/** Floating details for the hovered hex: terrain, contents, and whether the hero gets there this turn. */
/** Right button on a hex: the terrain, what lies there and who stands there. */
function TileDetails({ state, k }: { state: GameState; k: HexKey }) {
  const t = state.tiles[k];
  const crystal = t.revealed ? Object.values(state.crystals).find((c) => c.at === k) : undefined;
  const heroes = t.revealed ? heroesAt(state, k) : [];
  const cost = t.revealed ? TERRAIN_COST[t.terrain] : undefined;
  const note = (text: string) => <div style={{ fontSize: 15, lineHeight: 1.3 }}>{text}</div>;
  return (
    <div className="plate parch" style={{ width: 300, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img className="hex-clip" src={tileImage(t)} alt="" style={{ width: 70, height: 80, flex: 'none', objectFit: 'cover' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{t.revealed ? TERRAIN_NAMES[t.terrain] : 'Nieodkryte pole'}</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 3 }}>
            {!t.revealed ? (t.side === 'dawn' ? 'Kraina Przymierza' : 'Kraina Hordy') : cost === null ? 'Nieprzechodnie' : `Koszt ruchu: ${cost}${cost === 2 ? ' (teren trudny)' : ''}`}
          </div>
        </div>
      </div>
      {!t.revealed && note('Teren i to, co tu leży, są jeszcze ukryte.')}
      {t.tree && note(`Kryształowe Drzewo: Przymierze oddaje tu kryształy (${state.factions.dawn.delivered}/${state.crystalsNeeded}).`)}
      {crystal && !crystal.guardian && note('Leży tu kryształ.')}
      {crystal?.guardian && (
        <div className="well" style={{ padding: '6px 8px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Portrait unitId={crystal.guardian} size={44} ring={SIDE_RING.neutral} preview={false} />
          <div style={{ fontSize: 15, color: '#F7EDD2' }}>
            <div style={{ fontWeight: 700 }}>Kryształ pod strażą: {UNITS[crystal.guardian].name}</div>
            <div>
              <StatIcon stat="Ż" light /> {UNITS[crystal.guardian].hp} · <StatIcon stat="A" light /> {UNITS[crystal.guardian].attack} · <StatIcon stat="S" light /> {UNITS[crystal.guardian].speed}
            </div>
          </div>
        </div>
      )}
      {t.revealed && t.treasureId && note('Leży tu skarb.')}
      {heroes.map((h) => (
        <div key={h.id} className="well" style={{ padding: '6px 8px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Portrait unitId={h.id} size={44} ring={SIDE_RING[h.faction]} preview={false} />
          <div style={{ fontSize: 15, color: '#F7EDD2' }}>
            <div style={{ fontWeight: 700 }}>{UNITS[h.id].name}</div>
            <div style={{ color: 'var(--muted)' }}>
              {h.playerId ? state.players.find((p) => p.id === h.playerId)?.name : 'Automat zła'} · {FACTION_NAMES[h.faction]}
            </div>
            {h.crystals.length > 0 && <div style={{ color: '#9EE4FF' }}>Niesie {h.crystals.length === 1 ? 'kryształ' : `${h.crystals.length} kryształy`}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function HexTooltip({ state, k, reach, heroName, x, y, W, H, boardW }: { state: GameState; k: HexKey; reach?: { cost: number; hostile: boolean }; heroName: string; x: number; y: number; W: number; H: number; boardW: number }) {
  const t = state.tiles[k];
  const lines: string[] = [];
  if (t.revealed) {
    const cost = TERRAIN_COST[t.terrain];
    lines.push(cost === null ? 'Nieprzechodnie' : `Koszt ruchu: ${cost}${cost === 2 ? ' (teren trudny)' : ''}`);
    const crystal = Object.values(state.crystals).find((c) => c.at === k);
    if (crystal?.guardian) lines.push(`Kryształ pod strażą: ${UNITS[crystal.guardian].name}`);
    else if (crystal) lines.push('Leży tu kryształ');
    if (t.treasureId) lines.push('Leży tu skarb');
    if (t.tree) lines.push(`Oddaj tu kryształy (${state.factions.dawn.delivered}/${state.crystalsNeeded})`);
    for (const h of heroesAt(state, k)) lines.push(`${UNITS[h.id].name}${h.crystals.length ? ' · niesie kryształ' : ''}`);
    if (reach) lines.push(reach.hostile ? `${heroName}: wejście rozpocznie walkę` : `${heroName} dojdzie tu za ${reach.cost} pkt`);
  } else lines.push(t.side === 'dawn' ? 'Kraina Przymierza — teren nieznany' : 'Kraina Hordy — teren nieznany');
  const width = 220;
  const left = Math.max(-40, Math.min(boardW - width + 40, x + W / 2 - width / 2));
  const above = y > 120;
  return (
    <div
      className="plate parch"
      style={{ position: 'absolute', left, top: above ? y - 8 : y + H + 8, transform: above ? 'translateY(-100%)' : undefined, width, padding: '6px 10px', zIndex: 20, pointerEvents: 'none', animation: 'fade-in 0.15s ease-out both' }}
    >
      <div style={{ fontWeight: 800, fontSize: 16 }}>{t.revealed ? TERRAIN_NAMES[t.terrain] : 'Nieodkryte pole'}</div>
      {lines.map((l) => (
        <div key={l} style={{ fontSize: 14, lineHeight: 1.25 }}>
          {l}
        </div>
      ))}
    </div>
  );
}
