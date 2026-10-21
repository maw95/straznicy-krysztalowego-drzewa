// Round track of the board game (docs/grafika/ikony/tor_rund.png, cut by scripts/assets/roundtrack.py):
// a hexagonal board with the Crystal Tree in the middle and 20 sockets around it. The crystal marker
// stands in the socket of the current round; sockets past this map's round limit are dimmed.

import { asset } from './common';

/** Image aspect (height / width) and socket centres of rounds 1..20, as fractions of the image. */
const ASPECT = 0.9508;
const SOCKETS: Array<[number, number]> = [
  [0.5049, 0.1371], [0.6016, 0.1466], [0.6975, 0.1957], [0.773, 0.256], [0.8328, 0.3681],
  [0.8574, 0.481], [0.8393, 0.5897], [0.7902, 0.6871], [0.7074, 0.7802], [0.6057, 0.8353],
  [0.5049, 0.8552], [0.3967, 0.8293], [0.2918, 0.7776], [0.218, 0.6931], [0.1754, 0.5966],
  [0.1484, 0.481], [0.1811, 0.3724], [0.2246, 0.2681], [0.3082, 0.1957], [0.409, 0.1543],
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
