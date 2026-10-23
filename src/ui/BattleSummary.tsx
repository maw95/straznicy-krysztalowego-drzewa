import { FACTION_NAMES, UNITS, type Side } from '../engine/data';
import type { BattleReport } from '../engine/types';
import { Frame, HpBar, Portrait, Ribbon, SIDE_RING } from './common';

export function BattleSummary({ report, onClose }: { report: BattleReport; onClose: () => void }) {
  const sides: Side[] = [report.attacker, report.defender];
  const title = report.winner === 'draw' ? 'Remis — obie strony poległy' : `Zwycięstwo: ${FACTION_NAMES[report.winner]}`;
  return (
    <Frame crest style={{ width: 'min(720px, 94vw)' }} innerStyle={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ribbon side={report.winner === 'draw' ? 'neutral' : report.winner} style={{ width: 'min(460px, 100%)', alignSelf: 'center' }}>
        {title}
      </Ribbon>
      <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--muted)' }}>
        {report.kind === 'neutral' ? 'Walka ze strażnikiem kryształu' : 'Starcie bohaterów'}
        {report.duel ? ' · pojedynek' : ''} · rund: {report.rounds}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {sides.map((side) => (
          <div key={side} className="well" style={{ flex: '1 1 280px', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="lbl" style={{ textAlign: 'center' }}>
              {FACTION_NAMES[side]}
              {report.winner === side ? ' · zwycięzca' : ''}
            </div>
            {report.units
              .filter((u) => u.side === side)
              .map((u) => (
                <div key={u.defId} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: u.alive ? 1 : 0.6 }}>
                  <Portrait unitId={u.defId} size={46} ring={SIDE_RING[side]} dim={!u.alive} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#F7EDD2' }}>
                      {UNITS[u.defId].name}
                      <span style={{ fontWeight: 600, fontSize: 14, color: u.alive ? '#9BE88A' : '#F08A7A', marginLeft: 6 }}>{u.alive ? 'przeżył(a)' : 'poległ(a)'}</span>
                    </div>
                    <HpBar hp={u.hp} max={u.maxHp} />
                    <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>
                      Ż {u.hp}/{u.maxHp} · zadane obrażenia: <b style={{ color: '#F3D27A' }}>{u.damage}</b>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>Ocalałe jednostki odzyskują pełne Życie. Polegli pomocnicy nie wracają do puli.</div>
      <button className="btn prim" data-enter autoFocus style={{ alignSelf: 'center', padding: '8px 28px', fontSize: 19 }} onClick={onClose}>
        Dalej
      </button>
    </Frame>
  );
}
