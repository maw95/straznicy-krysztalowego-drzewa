// "Dokładne dane": the player's games in this browser per mode, map size and level, with win rates.

import { MAP_SIZE_NAMES } from '../engine/data';
import { Frame, Ribbon } from './common';
import { journalBreakdown, journalStats, LEVEL_NAMES } from './journal';
import { MAX_POINTS } from './scoring';

const MODE_NAMES = { coop: 'Kooperacja', pvp: 'Rywalizacja' } as const;
const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

export function StatsDialog({ onClose }: { onClose: () => void }) {
  const rows = journalBreakdown();
  const total = journalStats();

  return (
    <div>
      <Frame crest style={{ width: 'min(820px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17, maxHeight: '86vh' }}>
        <Ribbon>Twoje partie — dokładne dane</Ribbon>
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Nie rozegrano jeszcze żadnej partii w tej przeglądarce.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="stats-table" aria-label="Dokładne dane">
              <thead>
                <tr>
                  <th>Tryb</th>
                  <th>Mapa</th>
                  <th>Poziom</th>
                  <th className="num">Rozegrane</th>
                  <th className="num">Wygrane</th>
                  <th className="num">Przegrane</th>
                  <th className="num">% zwycięstw</th>
                  <th className="num">Punkty</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.mode}:${r.mapSize}:${r.level}`} className={i > 0 && rows[i - 1].mode !== r.mode ? 'group' : ''}>
                    <td>{i === 0 || rows[i - 1].mode !== r.mode ? MODE_NAMES[r.mode] : ''}</td>
                    <td>{MAP_SIZE_NAMES[r.mapSize]}</td>
                    <td>{LEVEL_NAMES[r.level]}</td>
                    <td className="num">{r.played}</td>
                    <td className="num win">{r.won}</td>
                    <td className="num loss">{r.lost}</td>
                    <td className="num">{pct(r.winRate)}</td>
                    <td className="num">{r.points}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Razem</td>
                  <td className="num">{total.finished}</td>
                  <td className="num win">{total.won}</td>
                  <td className="num loss">{total.lost}</td>
                  <td className="num">{pct(total.winRate)}</td>
                  <td className="num">{total.points}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div style={{ fontSize: 15, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            Liczą się tylko dokończone partie. Wygrane i przegrane to partie przeciwko automatowi albo botom — rywalizacja, w której ludzie grają po obu stronach, liczy się tylko do rozegranych.
          </div>
          <div>
            <b>Punkty</b> dostaje się za każdą wygraną: im dłuższa mapa i im trudniej było wygrać Twoją stroną (według tysięcy partii rozegranych przez komputer, rozdział 13 instrukcji), tym więcej. Najwięcej, {MAX_POINTS}, daje bardzo długa mapa na poziomie Trudnym.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn prim" style={{ padding: '6px 28px', fontSize: 18 }} onClick={onClose}>
            Zamknij
          </button>
        </div>
      </Frame>
    </div>
  );
}
