// The "Magia" button next to "Skarby" in a battle and the window with all the hero's battle spells (those the mana does not reach are greyed out).

import { scaleText } from '../engine/data';
import { manaOf, SPELLS, type SpellId } from '../engine/magic';
import type { GameState, HeroState } from '../engine/types';
import { asset } from './common';

/** A magic wand with sparks, one colour (takes the colour of the text). */
export function WandIcon({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 54 L40 26 L44 30 L16 58 Z" />
      <path d="M40 26 L46 20 L50 24 L44 30 Z" opacity="0.65" />
      <path d="M50 6 l2.4 6.6 6.6 2.4 -6.6 2.4 -2.4 6.6 -2.4 -6.6 -6.6 -2.4 6.6 -2.4 z" />
      <path d="M22 12 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z" />
      <path d="M56 36 l1.1 2.9 2.9 1.1 -2.9 1.1 -1.1 2.9 -1.1 -2.9 -2.9 -1.1 2.9 -1.1 z" />
    </svg>
  );
}

/** The round button: a wand on a dark plate with the mana in a badge and a caption, like the treasure button beside it. */
export function SpellButton({ mana, onClick, open }: { mana: number; onClick: () => void; open: boolean }) {
  return (
    <button className={`treasure-btn spell-btn ${open ? 'open' : ''}`} onClick={onClick} aria-label={`Magia: mana ${mana}`} aria-expanded={open} data-spell-btn>
      <span className="treasure-icon spell-icon">
        <WandIcon size={36} />
        <span className="treasure-badge" data-mana>{mana}</span>
      </span>
      <span className="treasure-cap">Magia</span>
    </button>
  );
}

/** Every battle spell the hero knows: name, mana cost and text; the ones that cannot be cast now are greyed out and say why. */
export function SpellList({ state, hero, castable, onPick }: { state: GameState; hero: HeroState; castable: SpellId[]; onPick: (id: SpellId) => void }) {
  const known = (hero.spells ?? []).filter((id) => SPELLS[id].where === 'battle');
  const mana = manaOf(hero);
  const cast = Boolean(state.battle?.activation?.spell);
  return (
    <div className="plate parch spell-list" data-spell-list style={{ width: 'min(340px, calc(100vw - 24px))', padding: '6px 9px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <b style={{ fontSize: 15 }}>Magia · mana <span data-mana-now>{mana}</span></b>
      {known.length === 0 && <span style={{ fontSize: 14 }}>Ten bohater nie zna czarów bitewnych.</span>}
      {known.map((id) => {
        const ok = castable.includes(id);
        const why = ok ? undefined : cast ? 'W tej aktywacji czar już rzucono.' : mana < SPELLS[id].mana ? `Za mało many (potrzeba ${SPELLS[id].mana}).` : 'Teraz nie można go rzucić.';
        return (
          <div key={id} className={`spell-row ${ok ? '' : 'off'}`} data-spell-row={id} title={why} style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: ok ? 1 : 0.5, filter: ok ? undefined : 'grayscale(0.9)' }}>
            <img src={asset(`ikony/czary/${id}.webp`)} alt="" width={40} height={40} style={{ flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{SPELLS[id].name} <span style={{ fontWeight: 600, color: '#6B4A22' }}>· mana {SPELLS[id].mana}</span></div>
              <div style={{ fontSize: 13, lineHeight: 1.15 }}>{scaleText(SPELLS[id].text, state.rules.statScale ?? 1, state.rules.hpScale)}</div>
            </div>
            <button className="btn prim" data-spell={id} disabled={!ok} style={{ padding: '3px 10px', fontSize: 14 }} onClick={() => onPick(id)}>Rzuć</button>
          </div>
        );
      })}
    </div>
  );
}
