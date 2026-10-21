// Round track of the board game (docs/grafika/ikony/tor_rund.png, cut by scripts/assets/roundtrack.py):
// a hexagonal board with the Crystal Tree in the middle and 24 sockets around it. The crystal marker
// stands in the socket of the current round; sockets past this map's round limit are dimmed.

import { asset } from './common';

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

export function RoundTrack({ round, limit, ritual, ritualRounds, size = 150 }: { round: number; limit: number; ritual: number; ritualRounds: number; size?: number }) {
  const h = size * ASPECT;
  const socket = size * SOCKET;
  const at = (n: number) => ({ left: SOCKETS[n - 1][0] * size, top: SOCKETS[n - 1][1] * h });
  return (
    <div
      role="img"
      aria-label={`Runda ${round} z ${limit}`}
      title={`Runda ${round} z ${limit}${ritual ? ` · rytuał ${ritual}/${ritualRounds}` : ''}`}
      style={{ position: 'relative', width: size, height: h, flex: 'none', pointerEvents: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}
    >
      <img src={asset('ui/round_track.png')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* Rounds past this map's limit are not played. */}
      {SOCKETS.map((_, i) =>
        i + 1 > limit ? (
          <div key={i} style={{ position: 'absolute', ...at(i + 1), width: socket * 1.25, height: socket * 1.25, transform: 'translate(-50%, -50%)', clipPath: hexClip, background: 'rgba(5,8,8,0.62)' }} />
        ) : null,
      )}
      {/* Ritual of the Horde: red pips under the Tree, one per round held. */}
      {ritual > 0 && (
        <div style={{ position: 'absolute', left: '50%', top: '63%', transform: 'translate(-50%, -50%)', display: 'flex', gap: size * 0.02 }}>
          {Array.from({ length: ritualRounds }, (_, k) => (
            <span key={k} style={{ width: size * 0.045, height: size * 0.045, clipPath: hexClip, background: k < ritual ? '#E0503C' : 'rgba(10,15,15,0.85)', boxShadow: '0 0 6px #E0503C' }} />
          ))}
        </div>
      )}
      {round <= SOCKETS.length && (
        <img
          className="track-crystal"
          src={asset('ui/round_crystal.png')}
          alt=""
          style={{ position: 'absolute', ...at(round), height: socket * 1.4, transform: 'translate(-50%, -54%)' }}
        />
      )}
    </div>
  );
}
