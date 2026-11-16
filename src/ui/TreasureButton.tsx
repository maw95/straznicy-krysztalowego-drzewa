// The treasure icon with the number of treasures the faction holds and a small caption; opens the treasure chest window (map and battle).

import type { ReactNode } from 'react';
import { asset } from './common';

export function TreasureButton({ count, onClick, open = false }: { count: number; onClick: () => void; open?: boolean }) {
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

/** The treasure window: a wooden chest with iron straps and a gold rim, the treasures lie on a parchment inside. */
export function ChestFrame({ title, onClose, children, dataAttr = 'data-treasures' }: { title: string; onClose: () => void; children: ReactNode; dataAttr?: string }) {
  return (
    <div className="chestbox" {...{ [dataAttr]: true }}>
      <div className="chestbox-title">
        <img src={asset('ikony/mapa/treasure.webp')} alt="" width={44} height={44} />
        <span>{title}</span>
      </div>
      <div className="chestbox-inner scroll">{children}</div>
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Zamknij</button>
    </div>
  );
}
