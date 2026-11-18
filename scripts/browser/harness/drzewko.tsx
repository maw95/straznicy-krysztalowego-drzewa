// A harness page for the tree of buildings of any faction: the real BuildingTree on a game state made by the engine (the faction from ?f=dawn|horde). Used by ../drzewko-frakcji.ts.
import { createRoot } from 'react-dom/client';
import '../../../src/ui/styles.css';
import { createGame } from '../../../src/engine/game';
import { buildingsFor, dwellingOf, recruitsOf, DWELLING_COST, DWELLING_NAMES, settlementAt } from '../../../src/engine/kingdom';
import { DEFAULT_RULES, type GameState } from '../../../src/engine/types';
import { BuildingTree, type ExtraNode } from '../../../src/ui/BuildingTree';

const f = (new URLSearchParams(location.search).get('f') ?? 'horde') as 'dawn' | 'horde';
const state: GameState = createGame({
  mode: 'pvp', mapSize: 'medium', battleMode: 'arena', seed: 3,
  seats: [{ name: 'A', faction: 'dawn', controller: 'bot', heroId: 'ancientBear' }, { name: 'B', faction: 'horde', controller: 'bot', heroId: 'werewolfLord' }],
  rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true },
});
const s = settlementAt(state, Object.values(state.tiles).find((t) => t.home === f)!.key)!;
const extras: ExtraNode[] = [2, 3, 4, 5, 6].flatMap((tier) => {
  const options = recruitsOf(state, f).filter((r) => r.tier === tier);
  const parents = tier === 2 ? ['barracks'] : recruitsOf(state, f).filter((r) => r.tier === tier - 1).map((r) => `dwelling-${r.id}`);
  return options.map((r) => ({ id: `dwelling-${r.id}`, parents, name: DWELLING_NAMES[r.id], cost: DWELLING_COST[tier - 2], picture: 'osady/dwelling_hedgehog.webp', state: 'open', ...(options.length > 1 ? { choice: `tier-${tier}` } : {}) } as ExtraNode));
});
void dwellingOf;
createRoot(document.getElementById('root')!).render(
  <div style={{ width: 1500, height: 860, position: 'relative' }}>
    <BuildingTree state={state} s={s} faction={f} order={buildingsFor(state, f)} picture={() => 'osady/dwelling_hedgehog.webp'} selected={null} onSelect={() => {}} council={{ picture: 'osady/dwelling_hedgehog.webp', name: 'Rada Osady' }} extras={extras} />
  </div>,
);
