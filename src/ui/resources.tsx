// Level 4: the faction's wood, ore and Gwiezdny Pył as icons with numbers (bottom bar, settlement window).

import { RESOURCE_IDS, RESOURCE_NAMES, type ResourceId } from '../engine/economy';
import { resOf, resourceIncomeOf } from '../engine/kingdom';
import type { TeamId } from '../engine/data';
import type { GameState } from '../engine/types';
import { asset } from './common';

export const RESOURCE_ICON: Record<ResourceId, string> = { wood: 'ikony/mapa/drewno.webp', ore: 'ikony/mapa/ruda.webp', dust: 'ikony/mapa/pyl.webp' };

/** Icon, stock and income per round of each resource; nothing when the level has no resources. */
export function ResourceStrip({ state, faction, size = 26, light = false }: { state: GameState; faction: TeamId; size?: number; light?: boolean }) {
  if (!state.kingdom?.res) return null;
  const have = resOf(state, faction);
  const income = resourceIncomeOf(state, faction);
  return (
    <span style={{ display: 'inline-flex', gap: light ? 16 : 10 }}>
      {RESOURCE_IDS.map((r) => (
        <span key={r} data-res={r} title={`${RESOURCE_NAMES[r]}: ${have[r]} (+${income[r]} na rundę)`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <img src={asset(RESOURCE_ICON[r])} alt={RESOURCE_NAMES[r]} width={size} height={size} style={light ? { filter: 'drop-shadow(0 2px 3px #000)' } : undefined} />
          <b style={{ fontSize: size * 0.75 }}>{have[r]}</b>
          {income[r] > 0 && <span style={{ fontSize: size * 0.55, color: light ? '#E8D5A8' : '#6B4A22' }}>(+{income[r]})</span>}
        </span>
      ))}
    </span>
  );
}
