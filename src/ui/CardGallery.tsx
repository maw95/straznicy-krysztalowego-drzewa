// Dev-only gallery: /?cards shows every unit card (used to check card layout).
import { ITEMS, UNITS, type ItemKind } from '../engine/data';
import { TreasureCard } from './TreasureCard';
import { CardBack } from './CardBack';
import { UnitCard } from './UnitCard';

export function CardGallery() {
  const only = new URLSearchParams(window.location.search).get('cards');
  const ids = only ? only.split(',') : [...Object.keys(UNITS), ...Object.keys(ITEMS)];
  return (
    <div className="slate" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexWrap: 'wrap', gap: 18, alignContent: 'flex-start' }}>
      {ids.includes('back') && <CardBack width={only ? 520 : 270} />}
      {ids.filter((id) => id !== 'back').map((id) =>
        id in ITEMS ? <TreasureCard key={id} kind={id as ItemKind} width={only ? 520 : 270} /> : <UnitCard key={id} unitId={id} width={only ? 520 : 270} />,
      )}
    </div>
  );
}
