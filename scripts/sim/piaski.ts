// Probe of the Desert Empire (gate G1): bots play the Empire against every other faction; prints the results and how often its mechanics fired.
// Usage: npx tsx scripts/sim/piaski.ts [games per pair]
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES } from '../../src/engine/data';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { PACK_IDS } from '../../src/engine/factions';
import { assignSlots } from '../../src/engine/teams';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../../src/engine/types';

const games = Number(process.argv[2] ?? 2);
const count = (s: GameState, re: RegExp) => s.log.filter((l) => re.test(l.text)).length;
for (const other of PACK_IDS.filter((p) => p !== 'sands')) {
  let wins = 0;
  const fired: Record<string, number> = {};
  for (let seed = 1; seed <= games; seed++) {
    const races = seed % 2 ? (['sands', other] as const) : ([other, 'sands'] as const);
    const slots = assignSlots([...races]);
    const setup: SetupOptions = {
      mode: 'pvp', mapSize: 'long', battleMode: 'arena', seed, mapShape: 'rectangle',
      seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][seed % 3] })),
      rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective: 'conquest' },
    };
    const s = createGame(setup);
    let n = 0;
    for (; n < 30000 && s.phase !== 'over'; n++) applyActionInPlace(s, chooseAction(s)!);
    const sandsSlot = slots[races.indexOf('sands')];
    if (s.winner === sandsSlot) wins++;
    for (const [k, re] of Object.entries({ miraz: /To był miraż/, taniec: /jeden z nich to miraż/, czuwa: /czuwa: cios/, budzi: /budzi się/, brama: /Piaskową Bramę/, zagadka: /zagadką/, sztylet: /Rzut Sztyletem/, przestawia: /przestawia jednostki/, wydmy: /Bramę Wydm/, czerw: /spod piasku/, zamiana: /zamienia się miejscami/ })) fired[k] = (fired[k] ?? 0) + count(s, re);
    if (s.phase !== 'over') console.log(`  ${other} seed ${seed}: not over after ${n} actions`);
  }
  console.log(`sands vs ${other}: ${wins}/${games}`, JSON.stringify(fired));
}
