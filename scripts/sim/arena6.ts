// 6 on 6 arena balance: the person (Przymierze, played like the normal bot) against the computer (Horda) at one level.
// Usage: npx tsx scripts/sim/arena6.ts [games = 200] [level = veryHard] [size = 6]
// ARENA_HANDICAP='{"mana":2,"spells":1,"gear":1,"playerLess":0}' overrides the levers of "Bardzo trudny" (types.ts ARENA_HANDICAP).
// Prints the person's win rate (the band of veryHard is 15-30%).

import { FACTION_HEROES } from '../../src/engine/data';
import { chooseAction } from '../../src/engine/ai';
import { applyActionInPlace, createGame } from '../../src/engine/game';
import { arenaSetup, type Level } from '../../src/engine/types';

const games = Number(process.argv[2] ?? 200);
const level = (process.argv[3] ?? 'veryHard') as Level;
const size = process.argv[4] === '3' ? 3 : 6;
const override = process.env.ARENA_HANDICAP ? JSON.parse(process.env.ARENA_HANDICAP) : null;

let wins = 0;
let draws = 0;
let rounds = 0;
const t0 = Date.now();
for (let g = 0; g < games; g++) {
  const dawnHero = FACTION_HEROES.dawn[g % FACTION_HEROES.dawn.length];
  const hordeHero = FACTION_HEROES.horde[Math.floor(g / FACTION_HEROES.dawn.length) % FACTION_HEROES.horde.length];
  const setup = arenaSetup([{ name: 'P', faction: 'dawn', controller: 'human', heroId: dawnHero }, { name: 'H', faction: 'horde', controller: 'bot', heroId: hordeHero }], 1 + g * 7919, level, size);
  if (override && setup.rules.arenaHandicap) setup.rules.arenaHandicap = { ...setup.rules.arenaHandicap, ...override };
  const s = createGame({ ...setup, rules: { ...setup.rules, ruleset: 'digital' } });
  for (let i = 0; i < 6000 && s.phase !== 'over'; i++) {
    // The person is played like the normal bot; the computer by its level.
    const side = s.battle ? (s.battle.stage === 'gear' ? s.draft?.gear?.order[0] : s.battle.stage === 'select' ? s.battle.needsSelection[0] : s.battle.stage === 'draft' ? s.draft?.order[0] : s.battle.stage === 'deploy' ? s.battle.needsDeploy[0] : s.battle.activation ? s.battle.units[s.battle.activation.unitId]?.side : undefined) : undefined;
    s.setup.botLevel = side === 'dawn' ? 'normal' : level;
    const a = chooseAction(s);
    if (!a) break;
    applyActionInPlace(s, a);
  }
  if (s.winner === 'dawn') wins++;
  else if (!s.winner) draws++;
  rounds += s.lastBattle?.rounds ?? 0;
}
const pct = (n: number) => `${((100 * n) / games).toFixed(1)}%`;
console.log(`Arena ${size} na ${size} · komputer ${level} · ${games} partii · handicap ${JSON.stringify(override ?? 'domyślny')}`);
console.log(`Gracz wygrywa ${pct(wins)} · remisy ${pct(draws)} · śr. rund ${(rounds / games).toFixed(1)} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
