// The "Magia" button next to "Skarby" in a battle and the window with all the hero's battle spells (those the mana does not reach are greyed out).

import { scaleText } from '../engine/data';
import { Fragment } from 'react';
import { manaOf, maxMana, SPELLS, type SpellId } from '../engine/magic';
import type { GameState, HeroState } from '../engine/types';
import { asset } from './common';
import { details } from './details';
import { CloseSeal, PagerBar, PER_PAGE, useEscapeClose, usePaged } from './TreasureButton';

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

/** The spell book: a big leather-bound book with two parchment pages; every battle spell the hero knows is an icon with its name and mana cost, six per page (three on each page), a pager below when there are more. The left click casts, the right click shows the details; the ones that cannot be cast now are greyed out. */
export function SpellBookDialog({ state, hero, castable, onPick, onClose }: { state: GameState; hero: HeroState; castable: SpellId[]; onPick: (id: SpellId) => void; onClose: () => void }) {
  const known = (hero.spells ?? []).filter((id) => SPELLS[id].where === 'battle');
  const mana = manaOf(hero);
  const cast = Boolean(state.battle?.activation?.spell);
  const pg = usePaged(known, PER_PAGE);
  useEscapeClose(onClose);
  return (
    <div className="spellbook" role="dialog" aria-label="Księga czarów" data-spell-list>
      <div className="closed-lid" aria-hidden="true" />
      <CloseSeal onClose={onClose} />
      <div className="spellbook-mana" title="Mana" aria-label={`Mana: ${mana} z ${maxMana(hero)}`}>
        <svg viewBox="0 0 20 24" width="16" height="19" aria-hidden="true"><path d="M10 1C10 1 2 10 2 15a8 8 0 0 0 16 0C18 10 10 1 10 1z" fill="#7A5CCF" stroke="#2B1650" strokeWidth="1.4" /><path d="M6.5 15a3.5 3.5 0 0 0 3 3.4" fill="none" stroke="#D9CCFF" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <b data-mana-now>{mana}</b>/{maxMana(hero)}
      </div>
      <div className="spellbook-pages">
        {known.length === 0 && <div className="spellbook-empty">Ten bohater nie zna czarów bitewnych.</div>}
        {pg.items.map((id, i) => {
          const ok = castable.includes(id);
          const why = ok ? undefined : cast ? 'W tej aktywacji czar już rzucono.' : mana < SPELLS[id].mana ? `Za mało many (potrzeba ${SPELLS[id].mana}).` : 'Teraz nie można go rzucić.';
          return (
            <Fragment key={id}>
              {i === 3 && <span className="spellbook-spine" aria-hidden="true" />}
              <button className={`slot spell-slot ${ok ? '' : 'off'}`} data-spell={id} data-spell-row={id} aria-disabled={!ok} aria-label={`${SPELLS[id].name}, ${SPELLS[id].mana} many`} onClick={() => ok && onPick(id)} {...details(() => <SpellDetails state={state} id={id} why={why} />)}>
                <span className="slot-icon">
                  <img src={asset(`ikony/czary/${id}.webp`)} alt="" />
                  <span className="slot-cost" data-spell-cost>{SPELLS[id].mana}</span>
                </span>
                <span className="slot-name">{SPELLS[id].name}</span>
              </button>
            </Fragment>
          );
        })}
      </div>
      <PagerBar {...pg} />
    </div>
  );
}
