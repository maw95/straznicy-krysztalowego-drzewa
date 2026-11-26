// Backlog 92: how hard a group of a free faction's supports is to beat, next to a neutral group of the same tier. Both are fought by the same hero
// teams (bots on both sides). Usage: node --import tsx scripts/sim/straznicy.ts [fights per cell]
import { groupPower, guardTarget, encounterUnits, factionUnits, type EncounterTier } from '../../src/engine/encounters';
import { ENCOUNTER_MOTIFS, type EncounterMotif, type FactionId } from '../../src/engine/data';
import { PLAYABLE_IDS } from '../../src/engine/factions';
import { fightGuards } from '../../tests/helpers/guards';
import { Rng } from '../../src/engine/rng';

const N = Number(process.argv[2] ?? 200);
const motifs = Object.keys(ENCOUNTER_MOTIFS) as EncounterMotif[];

for (const tier of [0, 1, 2] as EncounterTier[]) {
  const totals: Record<string, { won: number; lost: number; n: number; power: number; errors: number }> = {};
  const cell = (key: string) => (totals[key] ??= { won: 0, lost: 0, n: 0, power: 0, errors: 0 });
  for (let i = 0; i < N; i++) {
    const rng = new Rng(1000 * tier + i + 1);
    const hero: FactionId = PLAYABLE_IDS[i % PLAYABLE_IDS.length];
    const others = PLAYABLE_IDS.filter((f) => f !== hero);
    const faction = others[Math.floor(i / PLAYABLE_IDS.length) % others.length];
    const neutral = encounterUnits(tier, motifs[i % motifs.length], rng);
    const guards = factionUnits(faction, tier, guardTarget(faction, tier, groupPower(neutral)), rng);
    for (const [key, units] of [['neutral', neutral], ['faction', guards], [faction, guards]] as const) {
      const r = fightGuards(i + 1, hero, tier, units);
      const c = cell(key);
      c.n += 1;
      c.won += r.won ? 1 : 0;
      c.lost += r.supportsLost;
      c.power += groupPower(units);
    }
  }
  console.log(`tier ${tier}`);
  for (const [k, c] of Object.entries(totals)) console.log(`  ${k.padEnd(8)} hero wins ${((100 * c.won) / c.n).toFixed(0)}%  supports lost ${(c.lost / c.n).toFixed(2)}  power ${(c.power / c.n).toFixed(1)}  (${c.n})`);
}
