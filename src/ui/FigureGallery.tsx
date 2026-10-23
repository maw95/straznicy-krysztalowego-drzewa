// ?figury: every 3D figure from four sides (0°, 90°, 180°, 270°), to check the models
// after `make modele` — the first view must show the figure's front.

import { UNITS } from '../engine/data';
import { FIGURES } from './figures';
import { FigureStill } from './FigurePreview';

export function FigureGallery() {
  return (
    <div className="screen slate" style={{ alignItems: 'flex-start', padding: 16, gap: 10, overflow: 'auto', height: '100vh' }}>
      {[...FIGURES].map((id) => (
        <div key={id} className="well" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6 }}>
          <div style={{ width: 150, fontWeight: 700, color: '#F3D27A' }}>{UNITS[id].name}</div>
          {[0, 90, 180, 270].map((deg) => (
            <FigureStill key={deg} unitId={id} size={150} turn={(deg * Math.PI) / 180} />
          ))}
        </div>
      ))}
    </div>
  );
}
