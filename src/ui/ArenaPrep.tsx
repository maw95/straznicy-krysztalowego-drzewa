// Arena before the fight: the two heroes face each other over the painted arena while both sides
// choose their supports and draft treasures, and the draft dialog itself.

import { useState } from 'react';
import { ARENA_PICKS, FACTION_NAMES, ITEMS, UNITS, type FactionId, type ItemKind } from '../engine/data';
import type { GameState } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

const heroOf = (state: GameState, f: FactionId) => Object.values(state.heroes).find((h) => h.faction === f)!.id;

/** Background while the arena match is being set up (and behind the end screen). */
export function ArenaPrep({ state }: { state: GameState }) {
  const b = state.battle;
  const arena = b?.arena ?? 'dawn';
  const status = (() => {
    if (!b) return '';
    if (b.stage === 'select') return `${FACTION_NAMES[b.needsSelection[0]]} wybiera pomocników…`;
    if (b.stage === 'draft' && state.draft) return `${FACTION_NAMES[state.draft.order[0]]} wybiera skarb…`;
    return '';
  })();
  return (
    <div className="screen arena-prep">
      <img className="ken-burns arena-prep-art" src={asset(`arena/${arena}.jpg`)} alt="" />
      <div className="arena-prep-shade" aria-hidden="true" />
      <div className="arena-prep-row">
        {(['dawn', 'horde'] as FactionId[]).map((f, i) => (
          <div key={f} className="arena-prep-side" style={{ order: i * 2 }}>
            <UnitCard unitId={heroOf(state, f)} width={Math.min(260, window.innerWidth / 3.4)} />
            <div className="arena-prep-supports" aria-label={`Pomocnicy: ${FACTION_NAMES[f]}`}>
              {b
                ? Object.values(b.units)
                    .filter((u) => u.side === f && UNITS[u.defId].kind === 'support')
                    .map((u) => <Portrait key={u.id} unitId={u.defId} size={54} ring={SIDE_RING[f]} />)
                : null}
            </div>
            <div className="arena-prep-items">
              Skarby: {state.factions[f].inventory.length} / {ARENA_PICKS}
            </div>
          </div>
        ))}
        <div className="arena-prep-vs" style={{ order: 1 }}>
          kontra
        </div>
      </div>
      {status && <div className="arena-prep-status">{status}</div>}
    </div>
  );
}

/**
 * The picker's three cards. With two people at one screen, the cards stay covered until the
 * picker says the other player is not looking.
 */
export function DraftDialog({ state, faction, covered, onReveal, onPick }: { state: GameState; faction: FactionId; covered: boolean; onReveal: () => void; onPick: (kind: ItemKind) => void }) {
  const d = state.draft!;
  const [chosen, setChosen] = useState<ItemKind | null>(null);
  const mine = state.factions[faction].inventory.map((id) => state.items[id].kind);
  const pickNo = mine.length + 1;
  const width = Math.min(230, (window.innerWidth - 120) / 3);
  if (covered) {
    return (
      <div>
        <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <Ribbon side={faction} style={{ width: 'min(420px, 90vw)' }}>Kolej: {FACTION_NAMES[faction]}</Ribbon>
          <div style={{ fontSize: 19 }}>Skarby są tajne. Przekaż urządzenie graczowi tej strony — drugi gracz niech nie patrzy.</div>
          <button className="btn prim" style={{ height: 50, padding: '0 30px', fontSize: 21 }} onClick={onReveal} autoFocus>
            Pokaż skarby
          </button>
        </Frame>
      </div>
    );
  }
  return (
    <div>
      <Frame crest style={{ width: 'min(820px, 96vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Ribbon side={faction} style={{ width: 'min(460px, 92vw)' }}>
          Wybierz skarb ({pickNo} z {ARENA_PICKS})
        </Ribbon>
        <div style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>Dwa pozostałe wracają do talii. Przeciwnik nie zobaczy Twoich skarbów, dopóki ich nie użyjesz.</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {d.offer.map((k) => (
            <button key={k} className="btn" aria-pressed={chosen === k} aria-label={ITEMS[k].name} onClick={() => setChosen(k)} style={{ background: 'none', border: 0, padding: 4, borderRadius: 12, boxShadow: chosen === k ? '0 0 0 3px #9EE4FF, 0 0 16px 4px rgba(158,228,255,0.6)' : 'none' }}>
              <TreasureCard kind={k} width={width} />
            </button>
          ))}
        </div>
        {mine.length > 0 && <div style={{ fontSize: 16 }}>Masz już: {mine.map((k) => ITEMS[k].name).join(', ')}</div>}
        <button className="btn prim" disabled={!chosen} style={{ height: 50, padding: '0 30px', fontSize: 21 }} onClick={() => chosen && onPick(chosen)}>
          Biorę ten skarb
        </button>
      </Frame>
    </div>
  );
}
