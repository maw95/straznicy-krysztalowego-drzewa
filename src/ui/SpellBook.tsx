// The "Magia" button next to "Skarby" in a battle and the window with all the hero's battle spells (those the mana does not reach are greyed out).

import { scaleText } from '../engine/data';
import { manaOf, maxMana, SPELLS, type SpellId } from '../engine/magic';
import type { GameState, HeroState } from '../engine/types';
import { asset } from './common';
import { details } from './details';
import { CloseSeal, PagerBar, useEscapeClose, usePaged } from './TreasureButton';

/** The round "Magia" button: the same size, rim and badge as the "Skarby" button beside it, with a painted spell book; the badge shows how many spells can be cast now (the mana is enough and nothing else stops it). */
export function SpellButton({ mana, castable, onClick, open }: { mana: number; castable: number; onClick: () => void; open: boolean }) {
  return (
    <button className={`treasure-btn spell-btn ${open ? 'open' : ''}`} onClick={onClick} aria-label={`Magia: ${castable} czarów do rzucenia, mana ${mana}`} title={`Mana: ${mana}`} aria-expanded={open} data-spell-btn>
      <span className="treasure-icon">
        <img src={asset('ikony/mapa/ksiega.webp')} alt="" width={60} height={60} />
        <span className="treasure-badge" data-castable>{castable}</span>
      </span>
      <span className="treasure-cap">Magia</span>
    </button>
  );
}

/** The details of a spell under the right button: name, cost, text and (when it cannot be cast now) why. */
function SpellDetails({ state, id, why }: { state: GameState; id: SpellId; why?: string }) {
  return (
    <div className="plate parch spell-details" style={{ padding: '8px 12px', maxWidth: 260 }}>
      <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>{SPELLS[id].name}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#5A3A8C' }}>Koszt: {SPELLS[id].mana} many</div>
      <div style={{ fontSize: 14, lineHeight: 1.2 }}>{scaleText(SPELLS[id].text, state.rules.statScale ?? 1, state.rules.hpScale)}</div>
      {why && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#7A2A12' }}>{why}</div>}
    </div>
  );
}

/** Spells on one spread of the book: six on each of the two pages. */
const SPELLS_PER_SPREAD = 12;

/** The mana drop: the same small icon in the corner counter of the book and in the cost of every spell. */
export function ManaIcon() {
  return (
    <svg viewBox="0 0 20 24" aria-hidden="true">
      <path d="M10 1C10 1 2 10 2 15a8 8 0 0 0 16 0C18 10 10 1 10 1z" fill="#7A5CCF" stroke="#2B1650" strokeWidth="1.4" />
      <path d="M6.5 15a3.5 3.5 0 0 0 3 3.4" fill="none" stroke="#D9CCFF" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** The spell book: a tall open book (two A4-like pages) whose cover swings open; every battle spell the hero knows is an icon with its name and "Koszt: n<mana>", six to a page, twelve to a spread, a pager when there are more. The left click casts, the right click shows the details; the ones that cannot be cast now are greyed out. The mana the hero has is one counter at the top of the book. */
export function SpellBookDialog({ state, hero, castable, onPick, onClose }: { state: GameState; hero: HeroState; castable: SpellId[]; onPick: (id: SpellId) => void; onClose: () => void }) {
  const known = (hero.spells ?? []).filter((id) => SPELLS[id].where === 'battle');
  const mana = manaOf(hero);
  const cast = Boolean(state.battle?.activation?.spell);
  const pg = usePaged(known, SPELLS_PER_SPREAD);
  useEscapeClose(onClose);
  const slot = (id: SpellId) => {
    const ok = castable.includes(id);
    const why = ok ? undefined : cast ? 'W tej aktywacji czar już rzucono.' : mana < SPELLS[id].mana ? `Za mało many (potrzeba ${SPELLS[id].mana}).` : 'Teraz nie można go rzucić.';
    return (
      <button key={id} className={`slot spell-slot ${ok ? '' : 'off'}`} data-spell={id} data-spell-row={id} aria-disabled={!ok} aria-label={`${SPELLS[id].name}, koszt ${SPELLS[id].mana} many`} onClick={() => ok && onPick(id)} {...details(() => <SpellDetails state={state} id={id} why={why} />)}>
        <span className="slot-icon-wrap"><img src={asset(`ikony/czary/${id}.webp`)} alt="" /></span>
        <span className="spell-text">
          <span className="slot-name">{SPELLS[id].name}</span>
          <span className="spell-cost" data-spell-cost>Koszt: {SPELLS[id].mana}<ManaIcon /></span>
        </span>
      </button>
    );
  };
  return (
    <div className="spellbook" role="dialog" aria-label="Księga czarów" data-spell-list>
      <div className="book-art" aria-hidden="true" />
      <CloseSeal onClose={onClose} />
      <div className="book-mana" title="Mana" aria-label={`Mana: ${mana} z ${maxMana(hero)}`}>
        <ManaIcon />
        <span><b data-mana-now>{mana}</b>/{maxMana(hero)}</span>
      </div>
      {known.length === 0 && <div className="book-empty">Ten bohater nie zna czarów bitewnych.</div>}
      <div className="book-page left">{pg.items.slice(0, SPELLS_PER_SPREAD / 2).map(slot)}</div>
      <div className="book-page right">{pg.items.slice(SPELLS_PER_SPREAD / 2).map(slot)}</div>
      <PagerBar {...pg} />
    </div>
  );
}
