// The "Magia" button next to "Skarby" in a battle and the window with all the hero's battle spells (those the mana does not reach are greyed out).

import { scaleText } from '../engine/data';
import { manaOf, SPELLS, type SpellId } from '../engine/magic';
import type { GameState, HeroState } from '../engine/types';
import { asset } from './common';

/** The round "Magia" button: the same size, rim and badge as the "Skarby" button beside it, with a painted spell book (the badge shows the mana). */
export function SpellButton({ mana, onClick, open }: { mana: number; onClick: () => void; open: boolean }) {
  return (
    <button className={`treasure-btn spell-btn ${open ? 'open' : ''}`} onClick={onClick} aria-label={`Magia: mana ${mana}`} aria-expanded={open} data-spell-btn>
      <span className="treasure-icon">
        <img src={asset('ikony/mapa/ksiega.webp')} alt="" width={60} height={60} />
        <span className="treasure-badge" data-mana>{mana}</span>
      </span>
      <span className="treasure-cap">Magia</span>
    </button>
  );
}

/** The spell book: a big leather-bound book with two parchment pages; every battle spell the hero knows shows its icon, name, mana cost and text. The ones that cannot be cast now are greyed out and say why. */
export function SpellBookDialog({ state, hero, castable, onPick, onClose }: { state: GameState; hero: HeroState; castable: SpellId[]; onPick: (id: SpellId) => void; onClose: () => void }) {
  const known = (hero.spells ?? []).filter((id) => SPELLS[id].where === 'battle');
  const mana = manaOf(hero);
  const cast = Boolean(state.battle?.activation?.spell);
  return (
    <div className="spellbook" data-spell-list>
      <div className="spellbook-title">Księga czarów</div>
      <div className="spellbook-sub">Mana: <b data-mana-now>{mana}</b></div>
      <div className="spellbook-pages">
        {known.length === 0 && <div className="spellbook-empty">Ten bohater nie zna czarów bitewnych.</div>}
        {known.map((id) => {
          const ok = castable.includes(id);
          const why = ok ? undefined : cast ? 'W tej aktywacji czar już rzucono.' : mana < SPELLS[id].mana ? `Za mało many (potrzeba ${SPELLS[id].mana}).` : 'Teraz nie można go rzucić.';
          return (
            <div key={id} className={`spell-row ${ok ? '' : 'off'}`} data-spell-row={id}>
              <img src={asset(`ikony/czary/${id}.webp`)} alt="" width={64} height={64} />
              <div className="spell-body">
                <div className="spell-name">{SPELLS[id].name}</div>
                <div className="spell-cost">Koszt: {SPELLS[id].mana} many</div>
                <div className="spell-text">{scaleText(SPELLS[id].text, state.rules.statScale ?? 1, state.rules.hpScale)}</div>
                {why && <div className="spell-why">{why}</div>}
              </div>
              <button className="btn prim" data-spell={id} disabled={!ok} style={{ padding: '4px 14px', fontSize: 16, alignSelf: 'center' }} onClick={() => onPick(id)}>Rzuć</button>
            </div>
          );
        })}
      </div>
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Zamknij</button>
    </div>
  );
}
