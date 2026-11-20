// Probe of the Brotherhood of the Tide (gate G1): bots play the Tides against every other faction; prints the results and how often its mechanics fired.
// Usage: npx tsx scripts/sim/przyplyw.ts [games per pair]
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES } from '../../src/engine/data';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { PACK_IDS } from '../../src/engine/factions';
import { assignSlots } from '../../src/engine/teams';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../../src/engine/types';

const games = Number(process.argv[2] ?? 2);
const count = (s: GameState, re: RegExp) => s.log.filter((l) => re.test(l.text)).length;
for (const other of PACK_IDS.filter((p) => p !== 'tides')) {
  let wins = 0;
  const fired: Record<string, number> = {};
  for (let seed = 1; seed <= games; seed++) {
    const races = seed % 2 ? (['tides', other] as const) : ([other, 'tides'] as const);
    const slots = assignSlots([...races]);
    const setup: SetupOptions = {
      mode: 'pvp', mapSize: 'long', battleMode: 'arena', seed, mapShape: 'rectangle',
      seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][seed % 3] })),
      rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective: 'conquest' },
    };
    const s = createGame(setup);
    let n = 0;
    for (; n < 30000 && s.phase !== 'over'; n++) applyActionInPlace(s, chooseAction(s)!);
    const tidesSlot = slots[races.indexOf('tides')];
    if (s.winner === tidesSlot) wins++;
    for (const [k, re] of Object.entries({ przyplyw: /\(Przypływ\)/, przyciaganie: /zostaje przyciągnięty/, perla: /Perłowa tarcza/, skorupa: /chowa się w skorupie do/, wylinka: /zrzuca skórę/, odplyw: /wzywa odpływ/, wir: /kręci wir/, sciana: /Ściana Wody\./, skrzydla: /Uderzenie Skrzydeł\./, latarnia: /Latarnia Morska odkrywa/, swiatynia: /Świątynia Pływów/ })) fired[k] = (fired[k] ?? 0) + count(s, re);
    if (s.phase !== 'over') console.log(`  ${other} seed ${seed}: not over after ${n} actions`);
  }
  console.log(`tides vs ${other}: ${wins}/${games}`, JSON.stringify(fired));
}
