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

/** A big ornate gold arrow (no disc around it), pointing `dir`; the one arrow of the chest and of the spell book. */
function PagerArrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <linearGradient id="pgGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0B0" />
          <stop offset="0.5" stopColor="#E3B54A" />
          <stop offset="1" stopColor="#9A6E22" />
        </linearGradient>
      </defs>
      <path d="M6 18 H24 V7 L43 24 L24 41 V30 H6 Z" fill="url(#pgGold)" stroke="#2A1804" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M9 21.5 H27 V14 L37 24" fill="none" stroke="#FFF7D0" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx="9.5" cy="24" r="1.5" fill="#2A1804" />
    </svg>
  );
}

/** "← 2/3 →"; hidden when everything fits on one page. */
export function PagerBar({ page, pages, prev, next }: { page: number; pages: number; prev: () => void; next: () => void }) {
  if (pages <= 1) return null;
  return (
    <div className="pager" data-pager>
      <button className="pager-btn" aria-label="Poprzednia strona" disabled={page === 0} onClick={prev}><PagerArrow dir="left" /></button>
      <span data-pager-now>{page + 1}/{pages}</span>
      <button className="pager-btn" aria-label="Następna strona" disabled={page >= pages - 1} onClick={next}><PagerArrow dir="right" /></button>
    </div>
  );
}

/**
 * Treasures of one kind lie in one icon (with "×3"); the ones that can be used now come first, the greyed ones after them (the order within each part is the
 * order in which the kinds first appeared).
 */
export function groupTreasures<T extends { kind: string }>(list: T[], usable: (kind: string) => boolean): Array<{ kind: string; items: T[]; usable: boolean }> {
  const groups: Array<{ kind: string; items: T[]; usable: boolean }> = [];
  for (const it of list) {
    const g = groups.find((x) => x.kind === it.kind);
    if (g) g.items.push(it);
    else groups.push({ kind: it.kind, items: [it], usable: usable(it.kind) });
  }
  return [...groups.filter((g) => g.usable), ...groups.filter((g) => !g.usable)];
}

/** Treasures per page of the chest and spells per page of the book. */
export const PER_PAGE = 6;

/** One treasure in the chest: a round icon with the name below; the left click uses it (or shows the card when it cannot be used now), the right click shows the details. */
export function TreasureSlot({ kind, art, name, use, usable, onShowCard, extra, count = 1 }: { kind: string; art: string; name: string; use: () => void; usable: boolean; onShowCard: () => void; extra?: string; /** How many of this kind the chest holds: more than one shows "×N" on the icon. */ count?: number }) {
  return (
    <button className={`slot ${usable ? '' : 'off'}`} data-item-slot={kind} aria-label={name} onClick={usable ? use : onShowCard} {...hoverCard(`item:${kind}`)}>
      <span className="slot-pic">
        <img src={art} alt="" />
        {count > 1 && <b className="slot-count" data-item-count>×{count}</b>}
      </span>
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
