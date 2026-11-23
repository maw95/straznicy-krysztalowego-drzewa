// Level 4: the faction's wood, ore and Gwiezdny Pył as icons with numbers (bottom bar, settlement window).

import { RESOURCE_IDS, RESOURCE_TITLES, resourcesOf, type Cost, type ResourceId } from '../engine/economy';
import { resOf, resourceIncomeBreakdown, resourceIncomeOf } from '../engine/kingdom';
import type { TeamId } from '../engine/data';
import type { GameState } from '../engine/types';
import { asset } from './common';
import { details } from './details';

export const RESOURCE_ICON: Record<ResourceId, string> = { wood: 'ikony/mapa/drewno.webp', ore: 'ikony/mapa/ruda.webp', dust: 'ikony/mapa/pyl.webp' };

/** Held right button over a resource: where the income of that resource comes from. */
export function ResourceDetails({ state, faction, res }: { state: GameState; faction: TeamId; res: ResourceId }) {
  const rows = resourceIncomeBreakdown(state, faction).filter((r) => r.res === res);
  return (
    <div className="plate parch" style={{ width: 280, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 3 }} data-resource-details={res}>
      <b style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
        {RESOURCE_TITLES[res]}: dochód na rundę +{rows.reduce((s, r) => s + r.amount, 0)}
        <img src={asset(RESOURCE_ICON[res])} alt="" width={22} height={22} />
      </b>
      {rows.length === 0 && <div style={{ fontSize: 15, fontStyle: 'italic' }}>Na razie nic nie przynosi.</div>}
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span>{r.label}</span><b>+{r.amount}</b></div>
      ))}
    </div>
  );
}

/** Icon, stock and income per round of each resource; nothing when the level has no resources. With `bubble` the right button on a resource shows where its income comes from. */
export function ResourceStrip({ state, faction, size = 26, light = false, bubble = false }: { state: GameState; faction: TeamId; size?: number; light?: boolean; bubble?: boolean }) {
  if (!state.kingdom?.res) return null;
  const have = resOf(state, faction);
  const income = resourceIncomeOf(state, faction);
  return (
    <span style={{ display: 'inline-flex', gap: light ? 16 : 10 }}>
      {RESOURCE_IDS.map((r) => (
        <span key={r} data-res={r} {...(bubble ? details(() => <ResourceDetails state={state} faction={faction} res={r} />) : {})} title={`${RESOURCE_TITLES[r]}: ${have[r]} (+${income[r]} na rundę)`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <img src={asset(RESOURCE_ICON[r])} alt={RESOURCE_TITLES[r]} width={size} height={size} style={light ? { filter: 'drop-shadow(0 2px 3px #000)' } : undefined} />
          <b style={{ fontSize: size * 0.75 }}>{have[r]}</b>
          {income[r] > 0 && <span style={{ fontSize: size * 0.55, color: light ? '#E8D5A8' : '#6B4A22' }}>(+{income[r]})</span>}
        </span>
      ))}
    </span>
  );
}

/** A price as numbers and icons ("2 <gold> 1 <wood>"), not words; with `have` the parts the faction lacks turn red. */
export function CostIcons({ cost, have, size = 18, light = false, wrap = false, fontSize }: { cost: Cost; have?: { gold: number; res: Record<ResourceId, number> }; size?: number; light?: boolean; /** A long price may continue on a second line. */ wrap?: boolean; fontSize?: number }) {
  const part = (key: string, icon: string, name: string, n: number, lacks: boolean) => (
    <span key={key} title={name} data-cost-part={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: lacks ? '#B3261E' : undefined, fontWeight: 700 }}>
      {n}<img src={asset(icon)} alt={name} width={size} height={size} style={light ? { filter: 'drop-shadow(0 1px 2px #000)' } : undefined} />
    </span>
  );
  return (
    <span data-cost style={{ display: 'inline-flex', alignItems: 'center', gap: wrap ? '2px 8px' : 6, flexWrap: wrap ? 'wrap' : 'nowrap', whiteSpace: 'nowrap', verticalAlign: 'middle', ...(fontSize ? { fontSize } : {}) }}>
      {part('gold', 'ikony/mapa/zloto.webp', 'Złoto', cost.gold, Boolean(have) && have!.gold < cost.gold)}
      {resourcesOf(cost).map(([r, n]) => part(r, RESOURCE_ICON[r], RESOURCE_TITLES[r], n, Boolean(have) && have!.res[r] < n))}
    </span>
  );
}
