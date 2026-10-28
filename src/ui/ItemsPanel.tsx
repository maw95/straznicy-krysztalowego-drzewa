// Treasures in battle: the list of the faction's treasures and, while one is being aimed, what to pick next.

import { ITEMS, UNITS, type FactionId, type ItemKind } from '../engine/data';
import { alliesOf, canUseBattleItem } from '../engine/battle';
import type { Action, BattleUnit, GameState } from '../engine/types';
import { hoverCard } from './hover';
import { asset } from './common';
import { StatText } from './markers';
import { reserveOf } from './BattleSidePanel';

export type ItemTargeting =
  | { kind: 'ownLiving' | 'ownDead' | 'enemy'; itemId: string }
  | { kind: 'lightning'; itemId: string; picks: string[] }
  | { kind: 'courage'; itemId: string; picks: string[] }
  | { kind: 'teleport'; itemId: string; unitId: string | null }
  | { kind: 'horn'; itemId: string; mode: 'swap' | 'extra' | null; unitId: string | null };

const ITEM_TARGET: Partial<Record<ItemKind, ItemTargeting['kind']>> = {
  heal: 'ownLiving',
  sword: 'ownLiving',
  shield: 'ownLiving',
  vitality: 'ownLiving',
  boots: 'ownLiving',
  stone: 'ownLiving',
  hourglass: 'ownLiving',
  resurrection: 'ownDead',
  damage_scroll: 'enemy',
  lightning: 'lightning',
  courage_horn: 'courage',
  teleport: 'teleport',
  horn: 'horn',
};

interface Props {
  state: GameState;
  side: FactionId;
  active: BattleUnit;
  targeting: ItemTargeting | null;
  setTargeting: (t: ItemTargeting | null) => void;
  /** The free ability waiting for its target, if any (its hint shows here too). */
  freeAbility: boolean;
  ab: string | null;
  showItems: boolean;
  setShowItems: (v: boolean) => void;
  onAction: (a: Action) => void;
  onShowCard: (unitId: string) => void;
  reset: () => void;
}

export function ItemsPanel({ state, side, active, targeting, setTargeting, freeAbility, ab, showItems, setShowItems, onAction, onShowCard, reset }: Props) {
  const b = state.battle!;
  const deadOwn = Object.values(b.units).filter((u) => u.side === side && !u.alive && !u.swappedOut);
  const reserve = reserveOf(state, side);
  const itemsAllowed = canUseBattleItem(state, side);

  function startItem(itemId: string) {
    const kind = state.items[itemId].kind;
    const tk = ITEM_TARGET[kind];
    if (!tk) return onAction({ type: 'battleItem', itemId });
    if (tk === 'lightning' || tk === 'courage') setTargeting({ kind: tk, itemId, picks: [] });
    else if (tk === 'teleport') setTargeting({ kind: 'teleport', itemId, unitId: null });
    else if (tk === 'horn') setTargeting({ kind: 'horn', itemId, mode: null, unitId: null });
    else setTargeting({ kind: tk, itemId });
  }

  return (
    <div className="items-float" style={{ position: 'absolute', right: 300, bottom: 150, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: 'calc(100vw - 24px)' }}>
      {targeting && (
        <div className="plate parch" style={{ padding: '6px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
          <b>{ITEMS[state.items[targeting.itemId].kind].name}:</b>
          {targeting.kind === 'horn' && !targeting.mode ? (
            <>
              <button className="btn prim btn-tiny" onClick={() => setTargeting({ ...targeting, mode: 'swap' })}>Wymiana</button>
              <button className="btn prim btn-tiny" onClick={() => setTargeting({ ...targeting, mode: 'extra' })}>Dodatkowa aktywacja</button>
            </>
          ) : targeting.kind === 'horn' && targeting.mode === 'swap' && targeting.unitId ? (
            reserve.map((id) => (
              <button key={id} className="btn prim btn-tiny" onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetId: targeting.unitId!, hornMode: 'swap', reserveId: id }); reset(); }}>{UNITS[id].name}</button>
            ))
          ) : targeting.kind === 'ownDead' ? (
            deadOwn.map((u) => (
              <button key={u.id} className="btn prim btn-tiny" onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetId: u.id }); reset(); }}>{UNITS[u.defId].name}</button>
            ))
          ) : (
            <span>{targetHint(targeting)}</span>
          )}
          {(targeting.kind === 'lightning' || targeting.kind === 'courage') && targeting.picks.length > 0 && (
            <button className="btn prim btn-tiny" onClick={() => { onAction({ type: 'battleItem', itemId: targeting.itemId, targetIds: targeting.picks }); reset(); }}>Gotowe</button>
          )}
          <button className="btn plate parch" style={{ padding: '2px 8px' }} onClick={reset}>Anuluj</button>
        </div>
      )}
      {freeAbility && <div className="plate parch" style={{ padding: '6px 12px', fontSize: 15 }}>{ab === 'giftOfLife' ? 'Wybierz sojusznika do uleczenia.' : 'Wybierz wroga w zasięgu 4 pól.'}</div>}
      <button className="btn plate parch btn-small" onClick={() => setShowItems(!showItems)}>
        {showItems ? 'Ukryj skarby' : `Skarby (${state.factions[side].inventory.length})`}
      </button>
      {showItems &&
        state.factions[side].inventory.map((id) => {
          const def = ITEMS[state.items[id].kind];
          const ok = itemsAllowed && def.usableIn.includes('battle') && !(def.kind === 'resurrection' && !deadOwn.length) && !(def.kind === 'horn' && !alliesOf(b, active).concat(active).some((x) => UNITS[x.defId].kind === 'support'));
          return (
            <div key={id} className="plate parch" style={{ width: 'min(330px, calc(100vw - 24px))', padding: '5px 9px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn" title="Pokaż kartę skarbu" onClick={() => onShowCard(`item:${def.kind}`)} style={{ background: 'none', border: 0, padding: 0, flex: 'none' }}>
                <img {...hoverCard(`item:${def.kind}`)} src={asset(`cards/treasures/${def.kind}.jpg`)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px #B88A35, 0 0 0 3px #3A2508' }} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{def.name}</div>
                <div style={{ fontSize: 13, lineHeight: 1.15 }}><StatText text={def.text} /></div>
              </div>
              <button className="btn prim" disabled={!ok} style={{ padding: '3px 10px', fontSize: 14 }} onClick={() => startItem(id)}>Użyj</button>
            </div>
          );
        })}
    </div>
  );
}

function targetHint(t: ItemTargeting): string {
  switch (t.kind) {
    case 'ownLiving':
      return 'wybierz własną jednostkę';
    case 'enemy':
      return 'wybierz wroga';
    case 'lightning':
      return `wybierz do 2 wrogów (${t.picks.length}/2)`;
    case 'courage':
      return t.picks.length ? 'wybierz sąsiedniego sojusznika lub „Gotowe”' : 'wybierz jednostkę';
    case 'teleport':
      return t.unitId ? 'wybierz wolne pole obok sojusznika' : 'wybierz jednostkę do teleportu';
    case 'horn':
      return t.mode === 'extra' ? 'wybierz pomocnika' : 'wybierz pomocnika do wymiany';
    default:
      return '';
  }
}
