// The treasure icon with the number of treasures the faction holds and a small caption; opens the list (map) or unfolds it (battle).

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
