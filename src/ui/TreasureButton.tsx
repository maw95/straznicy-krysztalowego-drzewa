// The treasure icon with the number of treasures the faction holds and a small caption; opens the treasure chest window (map and battle).

import { useEffect, useState, type ReactNode } from 'react';
import { asset } from './common';
import { hoverCard } from './hover';

/** The frames of the chest are fetched and decoded when the treasure button shows up, so the first opening does not stutter. */
let chestPreloaded = false;
function preloadChest() {
  if (chestPreloaded || typeof Image === 'undefined') return;
  chestPreloaded = true;
  const img = new Image();
  img.src = asset('ui/skrzynia_klatki.webp');
  void img.decode?.().catch(() => undefined);
}

export function TreasureButton({ count, onClick, open = false }: { count: number; onClick: () => void; open?: boolean }) {
  useEffect(preloadChest, []);
  return (
    <button className={`treasure-btn ${open ? 'open' : ''}`} onClick={onClick} aria-label={`Skarby: ${count}`} aria-expanded={open} data-treasure-btn>
      <span className="treasure-icon">
        <img src={asset('ikony/mapa/treasure.webp')} alt="" width={60} height={60} />
        {count > 0 && <span className="treasure-badge" data-treasure-count>{count}</span>}
      </span>
      <span className="treasure-cap">Skarby</span>
    </button>
  );
}

/** Esc closes the window (caught before the global handler of the app, which would close something else). */
export function useEscapeClose(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
}

/** The round close button of the chest and the spell book: a gold ring with a gold cross on a dark disc. */
export function CloseSeal({ onClose, label = 'Zamknij' }: { onClose: () => void; label?: string }) {
  return (
    <button className="close-seal" data-enter data-modal-close aria-label={label} title={label} onClick={onClose}>
      <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="url(#mRing)" stroke="#1E1204" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="15.2" fill="#241505" stroke="#1E1204" strokeWidth="1" />
        <path d="M13.5 13.5 L26.5 26.5 M26.5 13.5 L13.5 26.5" stroke="#F3D27A" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M13.5 13.5 L26.5 26.5 M26.5 13.5 L13.5 26.5" stroke="#B88A35" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Splits a list into pages of `per` and gives the current page with the arrows' state; the page stays valid when the list shrinks. */
export function usePaged<T>(items: T[], per: number) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / per));
  const at = Math.min(page, pages - 1);
  return { items: items.slice(at * per, at * per + per), page: at, pages, prev: () => setPage(Math.max(0, at - 1)), next: () => setPage(Math.min(pages - 1, at + 1)) };
}

/** "← 2/3 →"; hidden when everything fits on one page. */
export function PagerBar({ page, pages, prev, next }: { page: number; pages: number; prev: () => void; next: () => void }) {
  if (pages <= 1) return null;
  return (
    <div className="pager" data-pager>
      <button className="pager-btn" aria-label="Poprzednia strona" disabled={page === 0} onClick={prev}>←</button>
      <span data-pager-now>{page + 1}/{pages}</span>
      <button className="pager-btn" aria-label="Następna strona" disabled={page >= pages - 1} onClick={next}>→</button>
    </div>
  );
}

/** Treasures per page of the chest and spells per page of the book. */
export const PER_PAGE = 6;

/** One treasure in the chest: a round icon with the name below; the left click uses it (or shows the card when it cannot be used now), the right click shows the details. */
export function TreasureSlot({ kind, art, name, use, usable, onShowCard, extra }: { kind: string; art: string; name: string; use: () => void; usable: boolean; onShowCard: () => void; extra?: string }) {
  return (
    <button className={`slot ${usable ? '' : 'off'}`} data-item-slot={kind} aria-label={name} onClick={usable ? use : onShowCard} {...hoverCard(`item:${kind}`)}>
      <img src={art} alt="" />
      <span className="slot-name">{name}</span>
      {extra && <span className="slot-extra">{extra}</span>}
    </button>
  );
}

/** The treasure window: a painted chest whose lid lifts (four frames), the treasures lie in the open chest, three to a row and six to a page, a pager when there are more. */
export function ChestFrame({ label, onClose, items, empty = 'Brak skarbów.', dataAttr = 'data-treasures' }: { label: string; onClose: () => void; items: ReactNode[]; empty?: string; dataAttr?: string }) {
  const pg = usePaged(items, PER_PAGE);
  useEscapeClose(onClose);
  return (
    <div className="chestbox" role="dialog" aria-label={label} {...{ [dataAttr]: true }}>
      <div className="chest-art" aria-hidden="true" />
      <CloseSeal onClose={onClose} />
      {items.length === 0 ? <div className="chest-empty">{empty}</div> : <div className="chest-items">{pg.items}</div>}
      <PagerBar {...pg} />
    </div>
  );
}
