import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FACTION_NAMES, ITEMS, TERRAIN_COST, TERRAIN_NAMES, UNITS, type FactionId } from '../engine/data';
import { activeHero, heroesAt, legalHeroMoves } from '../engine/game';
import type { HexKey } from '../engine/hex';
import { mapNeighbors, tileCost } from '../engine/map';
import type { Action, GameState, Tile } from '../engine/types';
import { hoverCard } from './hover';
import { asset, Frame, HpBar, Medal, Pips, Portrait, Ribbon, SIDE_RING, terrainIcon, tileImage } from './common';

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
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  const [selected, setSelected] = useState<HexKey | null>(null);
  const [hover, setHover] = useState<HexKey | null>(null);
  const [mapPicks, setMapPicks] = useState<{ itemId: string; picks: HexKey[] } | null>(null);
  const [resPick, setResPick] = useState<string | null>(null);

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
  if (hero) {
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
  const reach = useMemo(() => (canAct ? reachablePaths(state) : new Map()), [state, canAct]);
  const legal = useMemo(() => new Set(legalHeroMoves(state).map((m) => m.to)), [state]);
  const preview = hover && reach.get(hover) ? reach.get(hover)!.path : null;
  const tiles = Object.values(state.tiles);
  const pos = (t: Tile) => ({ x: ((rows - 1) / 2 + t.col - t.row / 2) * W, y: t.row * 0.75 * H });
  const sel = selected ? state.tiles[selected] : hero ? state.tiles[hero.pos] : null;
  const faction = hero?.faction ?? 'dawn';
  const inventory = viewer ? state.factions[viewer].inventory.map((id) => state.items[id]) : [];

  function clickTile(k: HexKey) {
    setSelected(k);
    if (mapPicks) {
      if (state.tiles[k].revealed) return;
      const picks = mapPicks.picks.includes(k) ? mapPicks.picks.filter((x) => x !== k) : [...mapPicks.picks, k].slice(0, 3);
      setMapPicks({ ...mapPicks, picks });
      return;
    }
    if (!canAct) return;
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
          <img src={asset('ui/landscape.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42 }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 140px 50px rgba(4,10,12,0.85)' }} />
          <div style={{ position: 'absolute', left: 18, top: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, zIndex: 2 }}>
            <Ribbon style={{ width: Math.min(330, box.w - 20) }}>Kraina Kryształowego Drzewa</Ribbon>
            <div className="plate parch" style={{ padding: '2px 14px', fontWeight: 700, fontSize: 15, marginLeft: 22 }}>
              Runda {state.round} z {state.roundLimit}
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
                const rim = picked || isSel ? 'linear-gradient(135deg,#F2FCFF,#9EE4FF 40%,#2A6FB0)' : t.revealed ? 'linear-gradient(135deg,#FFF0B0 0%,#E2B04A 30%,#9A6A18 62%,#F0CF78 100%)' : 'linear-gradient(135deg,#7E8A86,#2E3836)';
                return (
                  <button
                    key={t.key}
                    type="button"
                    className="hexbtn"
                    aria-label={t.revealed ? TERRAIN_NAMES[t.terrain] : 'Nieodkryte pole'}
                    onClick={() => clickTile(t.key)}
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
                      {t.revealed ? (
                        <img src={tileImage(t.terrain)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 38%, #2E4C52 0%, #0E1C20 78%)' }}>
                          <div className="fog" style={{ animationDelay: `${-((t.row * 7 + t.col * 13) % 60)}s` }} />
                        </div>
                      )}
                      {(r || onPath) && <div style={{ position: 'absolute', inset: 0, background: onPath ? 'rgba(158,228,255,0.35)' : 'rgba(158,228,255,0.18)', boxShadow: 'inset 0 0 18px rgba(158,228,255,0.7)' }} />}
                    </div>
                    {!t.revealed && <img src={asset('ui/orn_tree.png')} alt="" style={{ position: 'absolute', left: '30%', top: '33%', width: '40%', opacity: 0.3 }} />}
                    {t.tree && (
                      <>
                        <div className="tree-glow" style={{ ['--glow' as string]: 0.35 + (0.65 * state.factions.dawn.delivered) / state.crystalsNeeded } as React.CSSProperties} />
                        {Array.from({ length: 4 + state.factions.dawn.delivered * 3 }, (_, i) => (
                          <span key={i} className="spark" style={{ left: `${25 + ((i * 37) % 50)}%`, top: `${45 + ((i * 23) % 30)}%`, ['--sx' as string]: `${((i * 17) % 21) - 10}px`, ['--sd' as string]: `${2.4 + (i % 4) * 0.6}s`, ['--sdl' as string]: `${-(i * 0.7)}s` } as React.CSSProperties} />
                        ))}
                      </>
                    )}
                    {t.revealed && <img src={terrainIcon(t.terrain)} alt="" style={{ position: 'absolute', left: W * 0.11, top: H * 0.6, width: W * 0.27, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }} />}
                    {t.revealed && t.treasureId && (
                      <div className="glint" style={{ position: 'absolute', right: W * 0.12, top: H * 0.24 }} title="Skarb">
                        <Medal fill="mBrown" glyph="gChest" size={W * 0.3} />
                      </div>
                    )}
                    {crystal && (
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center' }}>
                        {crystal.guardian && <Portrait unitId={crystal.guardian} size={W * 0.5} ring={SIDE_RING.neutral} title={UNITS[crystal.guardian].name} />}
                        <div className="twinkle" style={{ marginLeft: crystal.guardian ? -W * 0.12 : 0 }} title="Kryształ">
                          <Medal fill="mBlue" glyph="gCrystal" size={W * 0.28} />
                        </div>
                      </div>
                    )}
                    {r && !onPath && (
                      <div className="plate parch" style={{ position: 'absolute', left: W * 0.57, top: H * 0.63, minWidth: W * 0.27, height: H * 0.2, padding: '0 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: W * 0.15, color: r.hostile ? '#8A1A1A' : '#12304E' }}>
                        {r.hostile ? '⚔' : r.cost}
                      </div>
                    )}
                    <span className="hex-clip" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'auto', cursor: r || legal.has(t.key) ? 'pointer' : 'default' }} />
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
              {/* Hero tokens live in their own layer so they glide between hexes. */}
              {Object.values(state.heroes)
                .filter((h) => h.alive)
                .map((h) => {
                  const t = state.tiles[h.pos];
                  const p = pos(t);
                  const stack = Object.values(state.heroes).filter((o) => o.alive && o.pos === h.pos);
                  const i = stack.findIndex((o) => o.id === h.id);
                  const spread = stack.length > 1 ? (i - (stack.length - 1) / 2) * W * 0.3 : 0;
                  const size = stack.length > 1 ? W * 0.48 : W * 0.58;
                  const isActive = hero?.id === h.id;
                  return (
                    <div
                      key={h.id}
                      className={`token ${isActive ? 'active-token' : ''}`}
                      style={{ position: 'absolute', left: p.x + W / 2 - size / 2 + spread, top: p.y + H * 0.45 - size / 2 - (stack.length > 1 ? (i % 2) * H * 0.12 : 0), zIndex: isActive ? 8 : 7, pointerEvents: 'none' }}
                    >
                      <Portrait unitId={h.id} size={size} ring={SIDE_RING[h.faction]} glow={isActive ? '0 0 0 2.5px #9EE4FF, 0 0 14px 4px rgba(158,228,255,0.6)' : '0 0 0 1.5px #1E1204, 0 8px 14px rgba(0,0,0,0.7)'} title={UNITS[h.id].name} />
                      {h.crystals.length > 0 && (
                        <div style={{ position: 'absolute', right: -6, top: -6 }}>
                          <Medal fill="mBlue" glyph="gCrystal" size={W * 0.24} />
                        </div>
                      )}
                    </div>
                  );
                })}
              {hover && !mapPicks && <HexTooltip state={state} k={hover} reach={reach.get(hover)} heroName={hero ? UNITS[hero.id].name : ''} x={pos(state.tiles[hover]).x} y={pos(state.tiles[hover]).y} W={W} H={H} boardW={boardW} />}
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
              <img src={sel.revealed ? terrainIcon(sel.terrain) : asset('ui/ico_krysztal.png')} alt="" style={{ width: 44, height: 44, flex: 'none', opacity: sel.revealed ? 1 : 0.35 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{sel.revealed ? TERRAIN_NAMES[sel.terrain] : 'Nieodkryte pole'}</div>
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
                    <div style={{ fontSize: 13, lineHeight: 1.15 }}>{def.text}</div>
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
                  <button key={id} className="btn" style={{ background: 'none', border: 0, padding: 0 }} title={UNITS[id].name} onClick={() => { onAction({ type: 'useMapItem', itemId: resPick, unitId: id }); setResPick(null); }}>
                    <Portrait unitId={id} size={44} />
                  </button>
                ))}
                <button className="btn plate parch" style={{ padding: '2px 8px' }} onClick={() => setResPick(null)}>Anuluj</button>
              </div>
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
  } else lines.push('Teren i zawartość nieznane');
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
