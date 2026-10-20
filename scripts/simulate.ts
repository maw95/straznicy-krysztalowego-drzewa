// Mass simulations: bots play every seat, results go to stdout as CSV + summary.
// Usage: npm run sim -- [games=200] [size=short|medium|long] [mode=coop|pvp] [options=full] [battle=arena|board]
// options: 'full' (default game) or a comma list of simplifications: noabilities,notreasures,nodice,replacement

import { createGame, applyAction } from '../src/engine/game';
import { chooseAction } from '../src/engine/ai';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import type { MapSize } from '../src/engine/data';

const [gamesArg, sizeArg, modeArg, diffArg, battleArg] = process.argv.slice(2);
const games = Number(gamesArg ?? 200);
const size = (sizeArg ?? 'short') as MapSize;
const mode = (modeArg ?? 'coop') as 'coop' | 'pvp';
const options = (diffArg ?? 'full').split(',');
const rules = {
  ...DEFAULT_RULES,
  abilities: !options.includes('noabilities'),
  treasures: !options.includes('notreasures'),
  useDice: !options.includes('nodice'),
  heroReplacement: options.includes('replacement'),
};
const battleMode = (battleArg ?? 'arena') as 'arena' | 'board';

export function setupFor(seed: number): SetupOptions {
  const seats =
    mode === 'coop'
      ? [
          { name: 'Bot 1', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'goldDragon' },
          { name: 'Bot 2', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'unicornKing' },
        ]
      : [
          { name: 'Bot Świt', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'ancientBear' },
          { name: 'Bot Horda', faction: 'horde' as const, controller: 'bot' as const, heroId: 'werewolfLord' },
        ];
  return { mode, mapSize: size, battleMode, seed, seats, rules };
}

export function playOut(seed: number, maxActions = 20000): GameState {
  let s = createGame(setupFor(seed));
  for (let i = 0; i < maxActions && s.phase !== 'over'; i++) {
    const a = chooseAction(s);
    if (!a) break;
    s = applyAction(s, a);
  }
  return s;
}

const rows: string[] = ['seed,winner,reason,rounds,battles,dawnHeroDeaths,hordeHeroDeaths,dawnSupportDeaths,hordeSupportDeaths,neutralBattles,neutralWipes,neutralSupportLosses,delivered,actions'];
const tally: Record<string, number> = {};
let rounds = 0;
let stuck = 0;
for (let g = 1; g <= games; g++) {
  const s = playOut(g);
  if (s.phase !== 'over') stuck++;
  const w = s.winner ?? 'none';
  tally[w] = (tally[w] ?? 0) + 1;
  rounds += s.round;
  const st = s.stats;
  rows.push([g, w, JSON.stringify(s.endReason ?? ''), s.round, st.battles, st.heroDeaths.dawn, st.heroDeaths.horde, st.supportDeaths.dawn, st.supportDeaths.horde, st.neutralBattles, st.neutralWipes, st.neutralSupportLosses, s.factions.dawn.delivered, s.actionCount].join(','));
}
if (process.env.CSV) console.log(rows.join('\n'));
console.log(`\n${games} gier · ${size} · ${mode} · ${options.join(',')} · ${battleMode === 'board' ? 'pojedynki na mapie' : 'arena'}`);
for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: ${((v / games) * 100).toFixed(1)}%`);
console.log(`  średnio rund: ${(rounds / games).toFixed(1)} · niedokończone: ${stuck}`);
const reasons: Record<string, number> = {};
let battles = 0, nb = 0, wipes = 0, nLoss = 0, heroD = 0, supD = 0;
for (const r of rows.slice(1)) {
  const c = r.split(',');
  reasons[c[2]] = (reasons[c[2]] ?? 0) + 1;
  battles += +c[4]; heroD += +c[5]; supD += +c[7]; nb += +c[9]; wipes += +c[10]; nLoss += +c[11];
}
for (const [k, v] of Object.entries(reasons)) console.log(`  ${k}: ${v}`);
console.log(`  bitew/grę: ${(battles / games).toFixed(2)} · poległych bohaterów Świtu/grę: ${(heroD / games).toFixed(2)} · pomocników Świtu/grę: ${(supD / games).toFixed(2)}`);
console.log(`  walki ze strażnikami: ${nb} · całkowite porażki: ${nb ? ((wipes / nb) * 100).toFixed(1) : 0}% · śr. strata pomocników/walkę: ${nb ? (nLoss / nb).toFixed(2) : 0}`);
