// Round track of the board game (docs/grafika/ikony/tor_rund.png, cut by scripts/assets/roundtrack.py):
// a hexagonal board with the Crystal Tree in the middle and 24 sockets around it. The crystal marker
// stands in the socket of the current round; sockets past this map's round limit are dimmed. A limit longer than the track goes round it
// again: round 25 stands on socket 1. Near the limit the board and the sockets of the rounds still to play glow (roundWarning).

import { asset } from './common';
import { roundWarning } from './roundWarning';

/** Image aspect (height / width) and socket centres of rounds 1..24, as fractions of the image. */
const ASPECT = 0.9465;
const SOCKETS: Array<[number, number]> = [
  [0.5065, 0.1216], [0.5916, 0.1396], [0.6775, 0.1712], [0.7504, 0.2295], [0.8039, 0.3057],
  [0.8501, 0.387], [0.872, 0.4863], [0.8501, 0.5908], [0.8088, 0.6695], [0.7528, 0.7449],
  [0.6823, 0.8065], [0.5981, 0.8459], [0.5089, 0.8656], [0.4141, 0.8459], [0.329, 0.8065],
  [0.2569, 0.7449], [0.2018, 0.6687], [0.1613, 0.5856], [0.1434, 0.4854], [0.1621, 0.3844],
  [0.2075, 0.3048], [0.2626, 0.2286], [0.3363, 0.1687], [0.423, 0.1396],
];
/** Socket size as a share of the image width. */
const SOCKET = 0.072;

const hexClip = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';
/** The outline of the board itself (flat top and bottom, points to the sides). */
const boardClip = 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)';

export function RoundTrack({ round, limit, ritual, ritualRounds, size = 150 }: { round: number; limit: number; ritual: number; ritualRounds: number; size?: number }) {
  const h = size * ASPECT;
  const socket = size * SOCKET;
  const at = (n: number) => ({ left: SOCKETS[n - 1][0] * size, top: SOCKETS[n - 1][1] * h });
  /** Rounds played on the earlier laps of the track. */
  const before = Math.floor((round - 1) / SOCKETS.length) * SOCKETS.length;
  const warning = roundWarning(round, limit);
  /** Sockets of the rounds still to play, the current one first; they may reach into the next lap. */
  const remaining = warning ? Array.from({ length: Math.max(1, limit - round + 1) }, (_, k) => ((round - 1 + k) % SOCKETS.length) + 1) : [];
  return (
    <div
      role="img"
      aria-label={`Runda ${round} z ${limit}`}
      title={`Runda ${round} z ${limit}${ritual ? ` · rytuał ${ritual}/${ritualRounds}` : ''}`}
      style={{ position: 'relative', width: size, height: h, flex: 'none', pointerEvents: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}
    >
      {warning && (
        <span className="track-warning" data-track-warning={warning.level} style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${size * 0.04}px ${warning.color}) drop-shadow(0 0 ${size * 0.08}px ${warning.color})` }}>
          <span style={{ position: 'absolute', inset: '1%', clipPath: boardClip, background: warning.color }} />
        </span>
      )}
      <img src={asset('ui/round_track.png')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* The board itself takes the pointer (clicks do not reach the map under it); the corners of the picture around the hexagon let it through. */}
      <span data-track-hit style={{ position: 'absolute', inset: 0, clipPath: boardClip, pointerEvents: 'auto' }} />
      {/* Rounds past this map's limit are not played. */}
      {SOCKETS.map((_, i) =>
        before + i + 1 > limit ? (
          <div key={i} style={{ position: 'absolute', ...at(i + 1), width: socket * 1.25, height: socket * 1.25, transform: 'translate(-50%, -50%)', clipPath: hexClip, background: 'rgba(5,8,8,0.62)' }} />
        ) : null,
      )}
      {warning &&
        remaining.map((n) => (
          <span key={n} className="track-warning" data-warn-socket={n} style={{ position: 'absolute', ...at(n), width: socket * 1.25, height: socket * 1.25, transform: 'translate(-50%, -50%)', filter: `drop-shadow(0 0 ${size * 0.025}px ${warning.color})` }}>
            <span style={{ position: 'absolute', inset: 0, clipPath: hexClip, background: warning.color, opacity: 0.65 }} />
          </span>
        ))}
      {/* Ritual of the Horde: red pips under the Tree, one per round held. */}
      {ritual > 0 && (
        <div style={{ position: 'absolute', left: '50%', top: '63%', transform: 'translate(-50%, -50%)', display: 'flex', gap: size * 0.02 }}>
          {Array.from({ length: ritualRounds }, (_, k) => (
            <span key={k} style={{ width: size * 0.045, height: size * 0.045, clipPath: hexClip, background: k < ritual ? '#E0503C' : 'rgba(10,15,15,0.85)', boxShadow: '0 0 6px #E0503C' }} />
          ))}
        </div>
      )}
      <img
        className="track-crystal"
        data-socket={round - before}
        src={asset('ui/round_crystal.png')}
        alt=""
        style={{ position: 'absolute', ...at(round - before), height: socket * 1.4, transform: 'translate(-50%, -54%)' }}
      />
    </div>
  );
}
