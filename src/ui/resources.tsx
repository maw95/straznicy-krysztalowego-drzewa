// Level 4: the faction's wood, ore and Gwiezdny Pył as icons with numbers (bottom bar, settlement window).

import { RESOURCE_IDS, RESOURCE_NAMES, resourcesOf, type Cost, type ResourceId } from '../engine/economy';
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
        <span key={r} data-res={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <img src={asset(RESOURCE_ICON[r])} alt={RESOURCE_NAMES[r]} width={size} height={size} style={light ? { filter: 'drop-shadow(0 2px 3px #000)' } : undefined} />
          <b style={{ fontSize: size * 0.75 }}>{have[r]}</b>
          {income[r] > 0 && <span style={{ fontSize: size * 0.55, color: light ? '#E8D5A8' : '#6B4A22' }}>(+{income[r]})</span>}
        </span>
      ))}
    </span>
  );
}

/** A price as numbers and icons ("2 <gold> 1 <wood>"), not words; with `have` the parts the faction lacks turn red. */
export function CostIcons({ cost, have, size = 18, light = false }: { cost: Cost; have?: { gold: number; res: Record<ResourceId, number> }; size?: number; light?: boolean }) {
  const part = (key: string, icon: string, name: string, n: number, lacks: boolean) => (
    <span key={key} data-cost-part={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: lacks ? '#B3261E' : undefined, fontWeight: 700 }}>
      {n}<img src={asset(icon)} alt={name} width={size} height={size} style={light ? { filter: 'drop-shadow(0 1px 2px #000)' } : undefined} />
    </span>
  );
  return (
    <span data-cost style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
      {part('gold', 'ikony/mapa/zloto.webp', 'Złoto', cost.gold, Boolean(have) && have!.gold < cost.gold)}
      {resourcesOf(cost).map(([r, n]) => part(r, RESOURCE_ICON[r], RESOURCE_NAMES[r], n, Boolean(have) && have!.res[r] < n))}
    </span>
  );
}
