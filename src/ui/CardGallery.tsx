// Dev-only gallery: /?cards shows every unit card (used to check card layout).
// /?cards=cyclops,cyclops:duel,sword&w=1100 shows the listed cards (":duel" = a guardian's duel card) at that width
// (scripts/browser/karty.ts renders the print files from it).
import { ITEMS, UNITS, type ItemKind } from '../engine/data';
import { TreasureCard } from './TreasureCard';
import { CardBack } from './CardBack';
import { UnitCard } from './UnitCard';

export function CardGallery() {
  const params = new URLSearchParams(window.location.search);
  const only = params.get('cards');
  const width = Number(params.get('w')) || (only ? 520 : 270);
  const ids = only ? only.split(',') : [...Object.keys(UNITS), ...Object.keys(ITEMS)];
  return (
    <div className="slate" style={{ minHeight: '100vh', padding: 20, display: 'flex', flexWrap: 'wrap', gap: 18, alignContent: 'flex-start' }}>
      {ids.includes('back') && <CardBack width={width} />}
      {ids.filter((id) => id !== 'back').map((id) => {
        const [unitId, variant] = id.split(':');
        return id in ITEMS ? (
          <TreasureCard key={id} kind={id as ItemKind} width={width} />
        ) : (
          <UnitCard key={id} unitId={unitId} width={width} duel={variant === 'duel'} />
        );
      })}
    </div>
  );
}
