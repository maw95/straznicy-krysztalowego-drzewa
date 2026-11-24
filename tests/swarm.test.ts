// Rój Puszczy (docs/frakcje/swarm.md): the pack, the mycelium of the Serce Grzybni (deploy cells, deaths, attacks, poison, healing), the Spark (Matecznik),
// every ability of the card, the Ogród Grzybów and the Podziemne Korytarze, then whole games of the Swarm against every other faction.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, sparkBonus } from '../src/engine/game';
import { ABILITY, EXTRA_HEROES, FACTION_HEROES, UNITS } from '../src/engine/data';
import {
  arenaCell,
  attackDamage,
  bestSporeCell,
  claimCells,
  deployCells,
  flies,
  makeBattleUnit,
  myceliumAt,
  myceliumOf,
  predictDamage,
  reachableCells,
  scaleOf,
  sporeArea,
  startBattleFight,
} from '../src/engine/battle';
import { assignSlots } from '../src/engine/teams';
import { redactHidden } from '../src/engine/hidden';
import { collectIncome, DWELLING_NAMES, resourceIncomeOf, tunnelMines } from '../src/engine/kingdom';
import { chooseAction } from '../src/engine/ai';
import { FACTION_MECHANICS, SPARK_NAMES } from '../src/engine/empire';
import { COMMANDERS } from '../src/engine/realm';
import { FACTION_PACKS, PACK_IDS } from '../src/engine/factions';
import { distance, parseKey } from '../src/engine/hex';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut } from './helpers/engine';

type U = [id: string, side: 'dawn' | 'horde', col: number, half: number, hp?: number];
type Race = (typeof PACK_IDS)[number];

/** A table of bots, one seat per race, on a rectangle map. */
function table(races: Race[], objective: SetupOptions['rules']['objective'], over: Partial<SetupOptions> = {}): SetupOptions {
  const slots = assignSlots(races);
  return {
    mode: 'pvp',
    mapSize: 'long',
    battleMode: 'arena',
    seed: 5,
    mapShape: 'rectangle',
    seats: races.map((race, i) => ({ name: `${race}${i}`, faction: slots[i], race, controller: 'bot' as const, heroId: FACTION_HEROES[race][i % 3] })),
    rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective },
    ...over,
  };
}

/** A rivalry game of the Swarm (the first side, slot `dawn`) against the Horde with the level 6 rules. */
const swarmGame = (seed = 4): GameState => createGame(table(['swarm', 'horde'], 'conquest', { seed }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle of the Swarm (side `dawn`) against the Horde with the Serce Grzybni at `heart`, no dice, the units of the board game's size. */
function fight(units: U[], heart = 0): GameState {
  const s = swarmGame();
  s.rules.useDice = false;
  s.rules.statScale = 1;
  s.rules.hpScale = 1;
  home(s).buildings.myceliumHeart = heart;
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), { attackerHero: Object.values(s.heroes).find((h) => h.faction === 'dawn')!.id });
}
/** Makes `who` the active unit. */
const turn = (s: GameState, who: string): GameState => {
  const c = structuredClone(s);
  c.battle!.order = [who, ...c.battle!.order.filter((x) => x !== who)];
  c.battle!.index = 0;
  c.battle!.activation = activation(who);
  return c;
};
const strike = (s: GameState, att: string, target: string, useAbility = false): GameState => applyAction(turn(s, att), { type: 'battleAttack', targetId: target, useAbility });
const cast = (s: GameState, who: string, extra: { targetId?: string; cell?: string } = {}): GameState => applyAction(turn(s, who), { type: 'battleAbility', ...extra });
const dmg = (s: GameState, att: string, target: string, useAbility = false) => attackDamage(s, at(s, att), at(s, target), useAbility, 0);

/** A battle of the Swarm just set up and deployed by both sides (the fight has begun). */
function begun(heart: number, spark = false): GameState {
  const s = swarmGame();
  s.rules.useDice = false;
  home(s).buildings.myceliumHeart = heart;
  if (spark) home(s).buildings.spark = 1;
  battleFixture(s, [['mantisQueen', 'dawn', 0, 8], ['soldierAnt', 'dawn', 0, 6], ['ratman', 'horde', 12, 8], ['goblinSlinger', 'horde', 12, 10]].map(([id, side, col, half]) => ({ id: id as string, side: side as 'dawn', col: col as number, half: half as number })));
  s.battle!.activation = null;
  startBattleFight(s);
  return applyAction(applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: {} }), { type: 'deployUnits', faction: 'horde', positions: {} });
}

describe('the pack', () => {
  it('has the heroes, the commanders, the fourth hero and the tiers of the card (20.11)', () => {
    const p = FACTION_PACKS.swarm;
    expect(p.name).toBe('Rój Puszczy');
    expect([p.short, p.genitive]).toEqual(['Rój', 'Roju']);
    expect(p.heroes).toEqual(['mantisQueen', 'elderMycelium', 'goliathBeetle']);
    expect(p.supports).toEqual(['sporeling', 'soldierAnt', 'firefly']);
    expect(p.tierUnits).toEqual(['rootCaterpillar', 'mushroomGuard', 'dragonfly', 'centipede']);
    expect(p.altUnits).toEqual(['dustMoth', 'bombardier', 'mycoMother', 'armoredSnail']);
    expect(p.legend).toBe('emperorCicada');
    expect(p.buildings).toEqual(['myceliumHeart', 'mushroomGarden', 'tunnels']);
    expect(Object.values(COMMANDERS.swarm).map((id) => UNITS[id].name)).toEqual(['Żuk Gwardzista', 'Świetlikowa Łuczniczka', 'Grzybowy Wróżbita']);
    expect(UNITS[EXTRA_HEROES.swarm]).toMatchObject({ name: 'Pszczoła Królowa', movement: 'fly' });
    expect(DWELLING_NAMES.emperorCicada).toBe('Komora Cykady');
    expect(UNITS.goliathBeetle.size).toBe(2);
    expect(UNITS.emperorCicada).toMatchObject({ size: 2, movement: 'fly' });
  });
});

describe('Grzybnia: the mycelium of the Serce Grzybni', () => {
  it('I: the deploy cells of the Swarm are its mycelium when the fight begins; without the building there is none', () => {
    const s = begun(1);
    expect(s.battle!.stage).toBe('fight');
    const own = new Set(myceliumOf(s.battle!, 'dawn'));
    for (const k of deployCells(s.battle!, 'dawn')) expect(own.has(k)).toBe(true);
    expect(myceliumOf(s.battle!, 'horde')).toEqual([]);
    expect(myceliumOf(begun(0).battle!, 'dawn')).toEqual([]);
    // the mycelium is no secret: the enemy sees it
    expect(redactHidden(s, ['horde']).battle!.ground!.filter((g) => g.kind === 'claimed').length).toBe(own.size);
  });

  it('I: a unit of the Swarm on its own mycelium has + A; an enemy on it does not', () => {
    const s = fight([['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]], 1);
    const plain = dmg(s, 'soldierAnt', 'ratman');
    claimCells(s, 'dawn', [at(s, 'soldierAnt').pos!, at(s, 'ratman').pos!]);
    expect(dmg(s, 'soldierAnt', 'ratman')).toBe(plain + FACTION_MECHANICS.myceliumAttack * scaleOf(s));
    const rat = attackDamage(s, at(s, 'ratman'), at(s, 'soldierAnt'), false, 0);
    const bare = fight([['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]], 1);
    expect(rat).toBe(attackDamage(bare, at(bare, 'ratman'), at(bare, 'soldierAnt'), false, 0));
    // without the Serce the mycelium gives no Atak
    const none = fight([['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]], 0);
    claimCells(none, 'dawn', [at(none, 'soldierAnt').pos!]);
    expect(dmg(none, 'soldierAnt', 'ratman')).toBe(plain);
  });

  it('I: the cell where any unit falls becomes mycelium; II: so does the cell a unit of the Swarm attacked from', () => {
    const s = fight([['mantisQueen', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 1], ['goblinSlinger', 'horde', 11, 9, 99]], 1);
    const cell = at(s, 'ratman').pos!;
    const kill = strike(s, 'mantisQueen', 'ratman');
    expect(at(kill, 'ratman').alive).toBe(false);
    expect(myceliumAt(kill.battle!, 'dawn', cell)).toBe(true);
    expect(myceliumAt(kill.battle!, 'dawn', at(kill, 'mantisQueen').pos!)).toBe(false);
    const two = fight([['mantisQueen', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]], 2);
    const hit = strike(two, 'mantisQueen', 'ratman');
    expect(myceliumAt(hit.battle!, 'dawn', at(hit, 'mantisQueen').pos!)).toBe(true);
  });

  it('III: an enemy that ends its move on the mycelium is poisoned; IV: a unit of the Swarm on it regains Życie when its activation begins', () => {
    const s = fight([['soldierAnt', 'dawn', 2, 8, 2], ['ratman', 'horde', 8, 10, 99]], 3);
    claimCells(s, 'dawn', [arenaCell(6, 8)]);
    const walked = applyAction(turn(s, 'ratman'), { type: 'battleMove', to: arenaCell(6, 8) });
    expect(at(walked, 'ratman').status.poisoned).toBe(ABILITY.poisonTicks);
    const two = fight([['soldierAnt', 'dawn', 2, 8, 2], ['ratman', 'horde', 8, 10, 99]], 2);
    claimCells(two, 'dawn', [arenaCell(6, 8)]);
    expect(at(applyAction(turn(two, 'ratman'), { type: 'battleMove', to: arenaCell(6, 8) }), 'ratman').status.poisoned ?? 0).toBe(0);
    // level IV: the ant on its mycelium heals when it is its turn
    const four = fight([['ratman', 'horde', 8, 10, 99], ['soldierAnt', 'dawn', 2, 8, 2]], 4);
    claimCells(four, 'dawn', [at(four, 'soldierAnt').pos!]);
    const next = applyAction(four, { type: 'endActivation' });
    expect(next.battle!.activation!.unitId).toBe('soldierAnt');
    expect(at(next, 'soldierAnt').hp).toBe(2 + FACTION_MECHANICS.myceliumHeal);
  });
});

describe('the Spark: Matecznik Pierwotnej Iskry', () => {
  it('covers the deploy cells of the Swarm and the middle column of the arena from the start, even without the Serce; it gives the units nothing', () => {
    const s = begun(0, true);
    const own = new Set(myceliumOf(s.battle!, 'dawn'));
    for (const k of deployCells(s.battle!, 'dawn')) expect(own.has(k)).toBe(true);
    expect([...own].some((k) => parseKey(k).q === 6)).toBe(true);
    expect(s.log.some((l) => l.text.includes(SPARK_NAMES.swarm))).toBe(true);
    const unit = makeBattleUnit('soldierAnt', 'dawn');
    sparkBonus(s, unit);
    expect([unit.status.battleAttackBonus, unit.status.battleSpeedBonus, unit.hp]).toEqual([0, 0, makeBattleUnit('soldierAnt', 'dawn').hp]);
  });
});

describe('heroes', () => {
  it('Ostatnie Cięcie: the Królowa Modliszek hits harder a target at half its Życie or less', () => {
    const s = fight([['mantisQueen', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 10]]);
    const full = dmg(s, 'mantisQueen', 'ratman');
    at(s, 'ratman').maxHp = 20;
    expect(dmg(s, 'mantisQueen', 'ratman')).toBe(full + ABILITY.lastCutBonus);
  });

  it('Zarodniki Snu: the target and the enemies next to it are slowed and poisoned, once', () => {
    const s = fight([['elderMycelium', 'dawn', 3, 8], ['ratman', 'horde', 7, 9, 99], ['gargoyle', 'horde', 8, 10, 99], ['goblinSlinger', 'horde', 11, 9, 99]]);
    const hit = strike(s, 'elderMycelium', 'ratman', true);
    // (the ratman acts next: its first tick of poison has already bitten)
    for (const id of ['ratman', 'gargoyle']) {
      expect(at(hit, id).status.poisoned ?? 0).toBeGreaterThanOrEqual(ABILITY.poisonTicks - 1);
      expect(at(hit, id).status.poisoned ?? 0).toBeGreaterThan(0);
      expect(at(hit, id).status.slowNext).toBe(ABILITY.sporesSlow);
    }
    expect(at(hit, 'goblinSlinger').status.poisoned ?? 0).toBe(0);
    expect(at(hit, 'elderMycelium').abilityUsed).toBe(true);
  });

  it('Chitynowa Ściana: the Goliat has armour and + A for every ally next to it (at most three)', () => {
    const lone = fight([['goliathBeetle', 'dawn', 6, 8], ['ratman', 'horde', 8, 8, 99]]);
    const crowd = fight([['goliathBeetle', 'dawn', 6, 8], ['ratman', 'horde', 8, 8, 99], ['soldierAnt', 'dawn', 6, 6], ['sporeling', 'dawn', 6, 10]]);
    expect(dmg(crowd, 'goliathBeetle', 'ratman')).toBe(dmg(lone, 'goliathBeetle', 'ratman') + 2 * ABILITY.groupBonus);
    const rat = makeBattleUnit('ratman', 'horde');
    const p = predictDamage(lone, rat, at(lone, 'goliathBeetle'), { useAbility: false, movedDistance: 0 });
    expect(p.damage).toBe(Math.max(1, UNITS.ratman.attack - ABILITY.chitinArmor));
  });

  it('Żądło Królowej: the fourth hero, the Pszczoła Królowa, poisons once', () => {
    const s = fight([['beeQueen', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const hit = strike(s, 'beeQueen', 'ratman', true);
    expect(hit.log.some((l) => l.text.includes('Szczurołak zostaje zatruty'))).toBe(true);
  });
});

describe('units', () => {
  it('Pyłek: the fallen Purchawka poisons everyone next to it, its allies too (20.11), not the units further away', () => {
    const s = fight([['ratman', 'horde', 7, 9, 99], ['sporeling', 'dawn', 6, 8, 1], ['soldierAnt', 'dawn', 6, 10], ['firefly', 'dawn', 2, 8]]);
    const hit = strike(s, 'ratman', 'sporeling');
    expect(at(hit, 'sporeling').alive).toBe(false);
    expect(at(hit, 'ratman').status.poisoned).toBe(ABILITY.poisonTicks);
    expect(at(hit, 'soldierAnt').status.poisoned ?? 0).toBeGreaterThan(0);
    expect(at(hit, 'firefly').status.poisoned ?? 0).toBe(0);
  });

  it('a bot of the Swarm keeps off its own Purchawka that may fall, and a Purchawka in danger keeps off its allies', () => {
    const s = fight([['sporeling', 'dawn', 5, 9, 1], ['soldierAnt', 'dawn', 2, 8], ['ratman', 'horde', 6, 8, 99]]);
    const near = (st: GameState, a: string, b: string) => distance(parseKey(at(st, a).pos!), parseKey(at(st, b).pos!)) === 1;
    const ant = applyAction(turn(s, 'soldierAnt'), chooseAction(turn(s, 'soldierAnt'))!);
    expect(near(ant, 'soldierAnt', 'sporeling')).toBe(false);
    const p = fight([['sporeling', 'dawn', 3, 9, 1], ['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 5, 7, 99]]);
    const puff = applyAction(turn(p, 'sporeling'), chooseAction(turn(p, 'sporeling'))!);
    expect(near(puff, 'soldierAnt', 'sporeling')).toBe(false);
  });

  it('Mrowisko: + A for every ally next to the ant', () => {
    const lone = fight([['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const pair = fight([['soldierAnt', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99], ['sporeling', 'dawn', 5, 9]]);
    expect(dmg(pair, 'soldierAnt', 'ratman')).toBe(dmg(lone, 'soldierAnt', 'ratman') + ABILITY.groupBonus);
  });

  it('Błysk: the Świetlik (a flyer) takes Atak off the one it hits, once', () => {
    const s = fight([['firefly', 'dawn', 3, 8], ['ratman', 'horde', 7, 9, 99]]);
    expect(UNITS.firefly.movement).toBe('fly');
    expect(at(strike(s, 'firefly', 'ratman', true), 'ratman').status.cursedNext).toBe(ABILITY.curseMinus);
  });

  it('Przepoczwarzenie: at half its Życie the caterpillar turns into a butterfly once: Życie back, and it flies', () => {
    const s = fight([['ratman', 'horde', 7, 9, 99], ['rootCaterpillar', 'dawn', 6, 8]]);
    at(s, 'ratman').status.nextAttackBonus = 2;
    const hit = strike(s, 'ratman', 'rootCaterpillar');
    const c = at(hit, 'rootCaterpillar');
    expect(c.status.winged).toBe(true);
    expect(flies(c)).toBe(true);
    expect(c.abilityUsed).toBe(true);
    expect(c.hp).toBe(Math.min(c.maxHp, UNITS.rootCaterpillar.hp - 4 + ABILITY.morphHeal));
    // the butterfly flies over the others: a cell behind a wall of units is in reach
    const walled = fight([['rootCaterpillar', 'dawn', 2, 8], ['ratman', 'horde', 3, 7, 99], ['gargoyle', 'horde', 3, 9, 99], ['goblinSlinger', 'horde', 2, 6, 99], ['caveTroll', 'horde', 2, 10, 99], ['ogre', 'horde', 1, 7, 99], ['wolfRider', 'horde', 1, 9, 99]]);
    const before = reachableCells(walled, at(walled, 'rootCaterpillar')).size;
    at(walled, 'rootCaterpillar').status.winged = true;
    expect(reachableCells(walled, at(walled, 'rootCaterpillar')).size).toBeGreaterThan(before);
  });

  it('Pył ze Skrzydeł: the Ćma poisons the target and its neighbours, once', () => {
    const s = fight([['dustMoth', 'dawn', 3, 8], ['ratman', 'horde', 7, 9, 99], ['gargoyle', 'horde', 8, 10, 99]]);
    const hit = strike(s, 'dustMoth', 'ratman', true);
    expect(hit.log.filter((l) => l.text.includes('zostaje zatruty')).length).toBe(2);
  });

  it('Na Swojej Ziemi: the Muchomor regains Życie on the mycelium when its activation begins (even without the Serce), not off it', () => {
    const s = fight([['ratman', 'horde', 8, 10, 99], ['mushroomGuard', 'dawn', 2, 8, 3]], 0);
    expect(at(applyAction(s, { type: 'endActivation' }), 'mushroomGuard').hp).toBe(3);
    claimCells(s, 'dawn', [at(s, 'mushroomGuard').pos!]);
    expect(at(applyAction(s, { type: 'endActivation' }), 'mushroomGuard').hp).toBe(3 + ABILITY.homeHeal);
  });

  it('Wrzący Strumień: the Bombardier ignores armour (the Goliat of an enemy Swarm, the Tarczownik)', () => {
    const s = fight([['bombardier', 'dawn', 3, 8], ['shieldDwarf', 'horde', 7, 9, 99]]);
    expect(predictDamage(s, at(s, 'bombardier'), at(s, 'shieldDwarf'), { useAbility: false, movedDistance: 0 }).damage).toBe(dmg(s, 'bombardier', 'shieldDwarf'));
  });

  it('Polowanie w Locie: the Ważka hits flyers and shooters harder', () => {
    const s = fight([['dragonfly', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99], ['gargoyle', 'horde', 7, 7, 99], ['goblinSlinger', 'horde', 6, 10, 99]]);
    const walker = dmg(s, 'dragonfly', 'ratman');
    expect(dmg(s, 'dragonfly', 'gargoyle')).toBe(walker + ABILITY.airHuntBonus);
    expect(dmg(s, 'dragonfly', 'goblinSlinger')).toBe(walker + ABILITY.airHuntBonus);
  });

  it('Rozsiew: the Matka covers a chosen cell in her range and its neighbours with mycelium, once; without a cell she takes the best one', () => {
    const s = fight([['mycoMother', 'dawn', 2, 8], ['soldierAnt', 'dawn', 4, 8], ['ratman', 'horde', 10, 8, 99]]);
    const cell = arenaCell(5, 9);
    const done = cast(s, 'mycoMother', { cell });
    const area = sporeArea(s, at(s, 'mycoMother'), cell);
    expect(area).toHaveLength(ABILITY.sporeCells);
    for (const k of area) expect(myceliumAt(done.battle!, 'dawn', k)).toBe(true);
    expect(at(done, 'mycoMother').abilityUsed).toBe(true);
    expect(() => cast(s, 'mycoMother', { cell: arenaCell(12, 8) })).toThrow();
    const best = bestSporeCell(s, at(s, 'mycoMother'))!;
    expect(sporeArea(s, at(s, 'mycoMother'), best)).toContain(at(s, 'soldierAnt').pos);
    expect(myceliumAt(cast(s, 'mycoMother').battle!, 'dawn', at(s, 'soldierAnt').pos!)).toBe(true);
  });

  it('Oplot: every hit of the Skolopendra holds the one hit in place and poisons it', () => {
    const s = fight([['centipede', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const hit = strike(s, 'centipede', 'ratman');
    expect(at(hit, 'ratman').status.rootedNext).toBe(true);
    expect(hit.log.some((l) => l.text.includes('Szczurołak zostaje zatruty (Oplot)'))).toBe(true);
  });

  it('Śluzowy Szlak: the snail has armour and leaves mycelium on the cells it walks through (even without the Serce)', () => {
    const s = fight([['armoredSnail', 'dawn', 2, 8], ['ratman', 'horde', 11, 9, 99]]);
    const to = [...reachableCells(s, at(s, 'armoredSnail')).entries()].sort((x, y) => y[1] - x[1])[0][0];
    const moved = applyAction(turn(s, 'armoredSnail'), { type: 'battleMove', to });
    const own = myceliumOf(moved.battle!, 'dawn');
    expect(own.length).toBeGreaterThanOrEqual(3);
    expect(own).toContain(to);
    const p = predictDamage(s, makeBattleUnit('ratman', 'horde'), at(s, 'armoredSnail'), { useAbility: false, movedDistance: 0 });
    expect(p.damage).toBe(Math.max(1, UNITS.ratman.attack - ABILITY.snailArmor));
  });

  it('Wielki Chór: every enemy within the radius of the Cykada loses its next activation, the farther ones do not', () => {
    const s = fight([['emperorCicada', 'dawn', 5, 8], ['ratman', 'horde', 7, 9, 99], ['goblinSlinger', 'horde', 12, 8, 99]]);
    const sung = cast(s, 'emperorCicada');
    const cic = at(sung, 'emperorCicada');
    const near = (id: string) => Math.min(...[cic.pos!, cic.tail!].filter(Boolean).flatMap((c) => [at(sung, id).pos!].map((k) => distance(parseKey(c), parseKey(k)))));
    expect(near('ratman')).toBeLessThanOrEqual(ABILITY.chorusRadius);
    expect(at(sung, 'ratman').status.stunned).toBe(true);
    expect(at(sung, 'goblinSlinger').status.stunned).toBeUndefined();
  });

  it('the commanders: Chitynowa Tarcza (armour), Świetlny Strzał (+ A standing), Grzybowy Wywar (heal)', () => {
    expect(UNITS.beetleGuard.ability).toBe('bulwark');
    expect(UNITS.fireflyArcher.ability).toBe('standShot');
    const s = fight([['mushroomSeer', 'dawn', 2, 8], ['soldierAnt', 'dawn', 4, 8, 1], ['ratman', 'horde', 11, 9, 99]]);
    expect(at(cast(s, 'mushroomSeer', { targetId: 'soldierAnt' }), 'soldierAnt').hp).toBe(Math.min(UNITS.soldierAnt.hp, 1 + ABILITY.giftOfLifeHeal));
  });
});

describe('Ogród Grzybów and Podziemne Korytarze', () => {
  it('Ogród Grzybów: +1 wood and +1 ore every second round from each settlement with it, every round with level II', () => {
    const s = swarmGame();
    const before = (round: number) => {
      s.round = round;
      return resourceIncomeOf(s, 'dawn');
    };
    const [odd0, even0] = [before(3), before(4)];
    home(s).buildings.mushroomGarden = 1;
    expect(before(3).wood).toBe(odd0.wood);
    expect(before(4).wood).toBe(even0.wood + 1);
    expect(before(4).ore).toBe(even0.ore + 1);
    home(s).buildings.mushroomGarden = 2;
    expect(before(3).wood).toBe(odd0.wood + 1);
  });

  it('Podziemne Korytarze: the free mines within the radius go to the Swarm at the start of a round; a mine of an enemy stays the enemy\'s', () => {
    const s = swarmGame();
    const h = home(s);
    const dist = (k: string) => distance(parseKey(h.at), parseKey(k));
    const mines = Object.keys(s.kingdom!.mines).sort((x, y) => dist(x) - dist(y));
    for (const k of mines) s.kingdom!.mines[k].owner = null;
    const inside = mines.filter((k) => dist(k) <= FACTION_MECHANICS.tunnelRadius[1]);
    expect(inside.length).toBeGreaterThan(0);
    tunnelMines(s, 'dawn');
    expect(inside.every((k) => s.kingdom!.mines[k].owner === null)).toBe(true);
    h.buildings.tunnels = 2;
    s.kingdom!.mines[inside[0]].owner = 'horde';
    collectIncome(s);
    expect(s.kingdom!.mines[inside[0]].owner).toBe('horde');
    for (const k of inside.slice(1)) expect(s.kingdom!.mines[k].owner).toBe('dawn');
    for (const k of mines.filter((x) => dist(x) > FACTION_MECHANICS.tunnelRadius[1])) expect(s.kingdom!.mines[k].owner).toBe(null);
  });
});

describe('games with the Swarm', () => {
  for (const other of PACK_IDS.filter((p) => p !== 'swarm')) {
    it(`the Swarm against ${other}: bots play a conquest to the end`, () => {
      for (const seed of [1, 2]) {
        const races: Race[] = seed === 1 ? ['swarm', other] : [other, 'swarm'];
        const end = playOut(createGame(table(races, 'conquest', { seed })));
        expect(end.phase).toBe('over');
      }
    });
  }

  it('the mycelium and the abilities do fire in the games of the bots', () => {
    const fired = new Set<string>();
    // The healing on the mycelium is rare (the fourth level of the Serce Grzybni or the Na Swojej Ziemi), so many games.
    for (let seed = 1; seed <= 32; seed++) {
      const end = playOut(createGame(table(['swarm', 'horde'], 'conquest', { seed })));
      for (const l of end.log) {
        if (l.text.includes('na grzybni') || l.text.includes('(Grzybnia)') || l.text.includes('grzybnia')) fired.add('grzybnia');
        if (l.text.includes('Pyłek')) fired.add('pyłek');
        if (l.text.includes('Zarodniki Snu') || l.text.includes('Żądło Królowej')) fired.add('trucizna');
      }
    }
    expect(fired.has('grzybnia')).toBe(true);
    expect(fired.has('pyłek')).toBe(true);
  });

  it('a bot of the Swarm uses Rozsiew and the Wielki Chór when it may', () => {
    const s = fight([['mycoMother', 'dawn', 2, 8], ['soldierAnt', 'dawn', 3, 9], ['ratman', 'horde', 9, 9, 99]]);
    expect(chooseAction(turn(s, 'mycoMother'))).toMatchObject({ type: 'battleAbility' });
    const c = fight([['emperorCicada', 'dawn', 5, 8], ['ratman', 'horde', 7, 9, 99], ['gargoyle', 'horde', 7, 7, 99]]);
    expect(chooseAction(turn(c, 'emperorCicada'))).toEqual({ type: 'battleAbility' });
  });

  it('four sides with the Swarm play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'swarm', 'sands', 'frost'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
  });
});
