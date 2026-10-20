// Prints sample situations where bots waste a turn or an activation.
import './override';
import { UNITS } from '../../src/engine/data';
import { activeHero, applyAction, createGame, currentActor, legalHeroMoves } from '../../src/engine/game';
import { attackTargets, reachableCells } from '../../src/engine/battle';
import { chooseAction } from '../../src/engine/ai';
import { cellOf } from '../../src/engine/battle';
import { setupFor, type Variant } from './core';

const v: Variant = JSON.parse(process.argv[2] ?? '{"size":"medium","table":"pvp1","option":"full"}');
let shownTurns = 0;
let shownActs = 0;
const kinds: Record<string, number> = {};
for (let seed = 1; seed <= 200; seed++) {
  let s = createGame(setupFor(v, seed));
  for (let i = 0; i < 20000 && s.phase !== 'over'; i++) {
    const a = chooseAction(s)!;
    if (s.phase === 'adventure' && a.type === 'endTurn' && s.movePoints === s.rules.heroMovePoints && !s.turnBattleDone) {
      const h = activeHero(s)!;
      const moves = legalHeroMoves(s);
      if (!s.tiles[h.pos].tree && moves.length) {
        const k = `${h.faction}:${currentActor(s).kind}`;
        kinds[k] = (kinds[k] ?? 0) + 1;
        if (shownTurns++ < 12) console.log(`IDLE TURN seed ${seed} r${s.round} ${UNITS[h.id].name} at ${h.pos} [${s.tiles[h.pos].terrain}] moves=${JSON.stringify(moves)} crystals=${JSON.stringify(Object.values(s.crystals))} enemies=${Object.values(s.heroes).filter((x) => x.faction !== h.faction && x.alive).map((x) => x.pos)}`);
      }
    }
    if (s.phase === 'battle' && s.battle?.stage === 'fight' && a.type === 'endActivation' && !s.battle.activation!.acted && !s.battle.activation!.hop) {
      const u = s.battle.units[s.battle.activation!.unitId];
      const t = attackTargets(s, u).length;
      const m = reachableCells(s, u).size;
      const k = `act:${u.defId}:${t ? 'couldAttack' : m ? 'couldMove' : 'stuck'}`;
      kinds[k] = (kinds[k] ?? 0) + 1;
      if (t && shownActs++ < 6) console.log(`IDLE ACT seed ${seed} ${UNITS[u.defId].name} at ${JSON.stringify(cellOf(u.pos!))} targets=${t} moves=${m} moveOnly=${s.battle.activation!.moveOnly}`);
    }
    s = applyAction(s, a);
  }
}
console.log(kinds);
