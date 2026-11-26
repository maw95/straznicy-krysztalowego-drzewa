// The list of ready scenarios (backlog 98), laid out as in the classic games: a size filter and a table of scenarios on the left, the picked one on the
// right (a small map, the story, the goal and the level of complexity). The choice fills in the wizard's draft; the seats come after it.

import { useState } from 'react';
import { MAP_SIZE_NAMES, type MapSize } from '../engine/data';
import { CUSTOM_MAPS } from '../engine/customMaps';
import { OBJECTIVES } from '../engine/objectives';
import { TIERS } from '../engine/presets';
import { SCENARIOS, scenarioName, type Scenario } from '../engine/scenarios';
import { COMPACT_QUERY } from './common';
import { chip, SIZE_CODES } from './setupShared';

const TIER_BADGE: Record<Scenario['tier'], string> = { expedition: 'III', kingdom: 'IV', economy: 'V', realm: 'VI', empire: 'VII' };

/** The scenario's map drawn small: pointy-topped hexes, odd rows shifted half a hex (as the game draws it). */
export function ScenarioMiniMap({ mapId, width = 320 }: { mapId: string; width?: number }) {
  const rows = CUSTOM_MAPS[mapId]?.rows ?? [];
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const w = width / (cols + 0.5);
  const r = w / Math.sqrt(3);
  const height = (rows.length - 1) * 1.5 * r + 2 * r;
  const tree = rows.flatMap((line, row) => [...line].map((ch, col) => (ch === 'T' ? col + (row % 2) / 2 : null))).find((x) => x !== null) ?? cols / 2;
  const hex = (cx: number, cy: number) => [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return `${(cx + r * 0.96 * Math.cos(a)).toFixed(1)},${(cy + r * 0.96 * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height.toFixed(1)}`} width={width} height={height} role="img" aria-label={`Mapa: ${CUSTOM_MAPS[mapId]?.name ?? mapId}`} data-scenario-map={mapId} style={{ maxWidth: '100%', height: 'auto' }}>
      {rows.flatMap((line, row) =>
        [...line].map((ch, col) => {
          if (ch === ' ') return null;
          const x = col + (row % 2) / 2;
          const cx = x * w + w / 2;
          const cy = r + row * 1.5 * r;
          const land = x < tree ? '#4E6B34' : x > tree ? '#6B4A2E' : '#6A6A3A';
          const fill = ch === '#' ? '#3A3F44' : ch === '=' ? '#8A6236' : land;
          return (
            <g key={`${row}-${col}`}>
              <polygon points={hex(cx, cy)} fill={fill} stroke="rgba(0,0,0,0.45)" strokeWidth={0.8} />
              {ch === 'T' && <circle cx={cx} cy={cy} r={r * 0.5} fill="#F3C842" stroke="#5A3A0A" strokeWidth={1} />}
              {ch === 'D' && <circle cx={cx} cy={cy} r={r * 0.5} fill="#5AA9E6" stroke="#0E2A44" strokeWidth={1} />}
              {ch === 'H' && <circle cx={cx} cy={cy} r={r * 0.5} fill="#D9503C" stroke="#3A0E08" strokeWidth={1} />}
            </g>
          );
        }),
      )}
    </svg>
  );
}

export function ScenarioPicker({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const [size, setSize] = useState<MapSize | 'all'>('all');
  const sizes = [...new Set(SCENARIOS.map((s) => s.mapSize))];
  const list = SCENARIOS.filter((s) => size === 'all' || s.mapSize === size);
  const sc = SCENARIOS.find((s) => s.id === selected) ?? null;
  // On a narrow screen the card is under the list: show it after a pick.
  const pick = (id: string) => {
    onSelect(id);
    if (window.matchMedia?.(COMPACT_QUERY).matches) requestAnimationFrame(() => document.querySelector('.scenario-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <div className="scenario-picker" data-wizard-page="scenario">
      <div className="scenario-list">
        <div className="scenario-filter" role="group" aria-label="Wielkość mapy">
          <button className={chip(size === 'all')} aria-pressed={size === 'all'} onClick={() => setSize('all')}>Wszystkie</button>
          {sizes.map((m) => (
            <button key={m} className={chip(size === m)} aria-pressed={size === m} title={MAP_SIZE_NAMES[m]} onClick={() => setSize(m)}>{SIZE_CODES[m]}</button>
          ))}
        </div>
        <table className="scenario-table">
          <thead>
            <tr><th>Mapa</th><th>Nazwa</th><th>Poziom</th><th>Cel</th></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className={s.id === selected ? 'on' : ''} aria-selected={s.id === selected} data-scenario={s.id} onClick={() => pick(s.id)}>
                <td><b className="size-code">{SIZE_CODES[s.mapSize]}</b></td>
                <td>{scenarioName(s)}</td>
                <td title={TIERS[s.tier].name}>{TIER_BADGE[s.tier]}</td>
                <td>{OBJECTIVES[s.objective].name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scenario-card well">
        {sc ? (
          <>
            <div className="scenario-title">{scenarioName(sc)}</div>
            <ScenarioMiniMap mapId={sc.mapId} />
            <p className="scenario-story">{CUSTOM_MAPS[sc.mapId]?.story?.[0]?.text}</p>
            <p>{sc.description}</p>
            <dl className="scenario-facts">
              <dt>Cel</dt><dd><b>{OBJECTIVES[sc.objective].name}.</b> {OBJECTIVES[sc.objective].summary}</dd>
              <dt>Poziom</dt><dd>{TIERS[sc.tier].name}</dd>
              <dt>Mapa</dt><dd>{MAP_SIZE_NAMES[sc.mapSize]} ({SIZE_CODES[sc.mapSize]}) · dwie strony · {CUSTOM_MAPS[sc.mapId]?.summary}</dd>
            </dl>
          </>
        ) : (
          <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Wybierz scenariusz z listy.</p>
        )}
      </div>
    </div>
  );
}
