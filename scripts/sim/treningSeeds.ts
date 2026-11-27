// Seeds that suit a training (src/engine/training.ts `seeds`): the map of the seed must put what the steps lead to near the Przymierze, and a player who follows
// the coach (the bot fights its battles) must finish the steps within a few rounds. Prints the good seeds among the first 300.
// Usage: npx tsx scripts/sim/treningSeeds.ts <training id> [how many = 8]
import { chooseAction } from '../../src/engine/ai';
import { activeHero, applyAction, currentActor } from '../../src/engine/game';
import { createGame } from '../../src/engine/game';
import { trainingById, trainingIndex, trainingSetup } from '../../src/engine/training';

const t = trainingById(process.argv[2] ?? '')!;
const want = Number(process.argv[3] ?? 8);
const plain = { ...t, seeds: undefined };
const good: Array<[number, number]> = [];
for (let seed = 1; seed <= 300 && good.length < want; seed++) {
  let g = createGame(trainingSetup(plain, seed));
  let idx = 0;
  let guidedUntil = 0;
  for (let i = 0; i < 4000 && g.phase !== 'over'; i++) {
    idx = trainingIndex(t, g, idx);
    while (t.steps[idx]?.ack) idx = trainingIndex(t, g, idx + 1);
    // The guided part ends with the last step that has a target of its own until the end ("free" steps keep a target too: stop at the first step done by the end alone).
    if (idx >= t.steps.length - 1 && !guidedUntil) guidedUntil = g.round;
    let a = chooseAction(g)!;
    if (currentActor(g).kind === 'human' && g.phase === 'adventure') {
      const h = activeHero(g)!;
      if (h.offer?.length) a = { type: 'chooseSkill', skill: h.offer[0] };
      else if (!h.treasurePick && !g.kingdom?.chest) {
        const step = t.steps[idx];
        const tg = step?.target?.(g);
        const hint = step?.hint?.(g);
        a = hint ?? (tg && 'hex' in tg ? { type: 'moveHero', to: tg.hex } : step?.target ? { type: 'endTurn' } : a);
      }
    }
    g = applyAction(g, a);
  }
  if (guidedUntil && guidedUntil <= 4 && g.winner === 'dawn' && g.round <= 12) good.push([seed, g.round]);
}
console.log(`${t.id}: ${good.map(([s, r]) => `${s} (koniec w rundzie ${r})`).join(', ')}`);
console.log(`seeds: [${good.map(([s]) => s).join(', ')}]`);
