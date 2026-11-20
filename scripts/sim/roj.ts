// Probe of the Forest Swarm (gate G1): bots play the Swarm against every other faction; prints the results and how often its mechanics fired.
// Usage: npx tsx scripts/sim/roj.ts [games per pair]
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES } from '../../src/engine/data';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { PACK_IDS } from '../../src/engine/factions';
import { assignSlots } from '../../src/engine/teams';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../../src/engine/types';

const games = Number(process.argv[2] ?? 2);
const count = (s: GameState, re: RegExp) => s.log.filter((l) => re.test(l.text)).length;
for (const other of PACK_IDS.filter((p) => p !== 'swarm')) {
  let wins = 0;
  const fired: Record<string, number> = {};
  for (let seed = 1; seed <= games; seed++) {
    const races = seed % 2 ? (['swarm', other] as const) : ([other, 'swarm'] as const);
    const slots = assignSlots([...races]);
    const setup: SetupOptions = {
      mode: 'pvp', mapSize: 'long', battleMode: 'arena', seed, mapShape: 'rectangle',
      seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][seed % 3] })),
      rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective: 'conquest' },
    };
    const s = createGame(setup);
    let n = 0;
    for (; n < 30000 && s.phase !== 'over'; n++) applyActionInPlace(s, chooseAction(s)!);
    const swarmSlot = slots[races.indexOf('swarm')];
    if (s.winner === swarmSlot) wins++;
    for (const [k, re] of Object.entries({ leczy: /Ż na grzybni/, trucizna: /zatruty \(Grzybnia\)/, pylek: /chmurą pyłku/, zarodniki: /Zarodniki Snu/, motyl: /Motyla Korzennego/, rozsiew: /rozsiewa zarodniki/, chor: /Wielki Chór/, oplot: /oplątany/, korytarze: /Podziemne Korytarze/, iskra: /grzybnia pokrywa/ })) fired[k] = (fired[k] ?? 0) + count(s, re);
    if (s.phase !== 'over') console.log(`  ${other} seed ${seed}: not over after ${n} actions`);
  }
  console.log(`swarm vs ${other}: ${wins}/${games}`, JSON.stringify(fired));
}
