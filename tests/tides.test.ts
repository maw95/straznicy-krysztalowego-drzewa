// Bractwo Przypływu (docs/frakcje/tides.md): the pack, the swap of places of the Świątynia Pływów (once a battle, once a round, the armour and the Życie of its
// upper levels), the Spark (Perłowa Świątynia: a pearl shield for every unit), every ability of the card, the Perłowe Ławice and the Latarnia Morska, the bot,
// then whole games of the Tides against every other faction.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, sparkBonus } from '../src/engine/game';
import { ABILITY, EXTRA_HEROES, FACTION_HEROES, UNITS } from '../src/engine/data';
import { arenaCell, ebbTargets, makeBattleUnit, predictDamage, tideSwapReady, tideTargets } from '../src/engine/battle';
import { assignSlots } from '../src/engine/teams';
import { collectIncome, DWELLING_NAMES, incomeOf, lighthouseReveal, resourceIncomeOf } from '../src/engine/kingdom';
import { chooseAction } from '../src/engine/ai';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { COMMANDERS } from '../src/engine/realm';
import { FACTION_PACKS, PACK_IDS } from '../src/engine/factions';
import { distance, parseKey } from '../src/engine/hex';
import { DEFAULT_RULES, type GameState, type SetupOptions } from '../src/engine/types';
import { activation, battleFixture, playOut, playUntil } from './helpers/engine';

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

/** A rivalry game of the Tides (the first side, slot `dawn`) against the Horde with the level 6 rules. */
const tidesGame = (seed = 4): GameState => createGame(table(['tides', 'horde'], 'conquest', { seed }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle of the Tides (side `dawn`) against the Horde with the Świątynia Pływów at `temple`, no dice, the units of the board game's size. */
function fight(units: U[], temple = 0): GameState {
  const s = tidesGame();
  s.rules.useDice = false;
  s.rules.statScale = 1;
  s.rules.hpScale = 1;
  home(s).buildings.tideTemple = temple;
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
const swap = (s: GameState, who: string, targetId: string): GameState => applyAction(turn(s, who), { type: 'battleTideSwap', targetId });
const blow = (s: GameState, att: string, target: string) => predictDamage(s, at(s, att), at(s, target), { useAbility: false, movedDistance: 0 }).damage;
const gap = (s: GameState, a: string, b: string) => distance(parseKey(at(s, a).pos!), parseKey(at(s, b).pos!));

describe('the pack', () => {
  it('has the heroes, the commanders, the fourth hero and the tiers of the card (20.11)', () => {
    const p = FACTION_PACKS.tides;
    expect(p.name).toBe('Bractwo Przypływu');
    expect([p.short, p.genitive]).toEqual(['Bractwo', 'Bractwa']);
    expect(p.heroes).toEqual(['tritonKing', 'sirenSinger', 'seaSerpent']);
    expect(p.supports).toEqual(['shellTurtle', 'tritonHarpoon', 'frogLeaper']);
    expect(p.tierUnits).toEqual(['crabShield', 'sharkman', 'lobsterKnight', 'reefGolem']);
    expect(p.altUnits).toEqual(['inkOctopus', 'pearlPriestess', 'albatross', 'seaWitch']);
    expect(p.legend).toBe('leviathan');
    expect(p.buildings).toEqual(['tideTemple', 'pearlBanks', 'lighthouse']);
    expect(Object.values(COMMANDERS.tides).map((id) => UNITS[id].name)).toEqual(['Trytoński Strażnik', 'Harpunniczka', 'Sefiran Plamisty']);
    expect(UNITS[EXTRA_HEROES.tides].name).toBe('Stary Mors Kapitan');
    expect(DWELLING_NAMES.leviathan).toBe('Rów Głębinowy');
    expect(UNITS.seaSerpent.size).toBe(2);
    expect(UNITS.albatross).toMatchObject({ size: 2, movement: 'fly' });
  });
});

describe('Przypływ: the swap of places of the Świątynia Pływów', () => {
  const line: U[] = [['crabShield', 'dawn', 4, 8], ['shellTurtle', 'dawn', 3, 7], ['frogLeaper', 'dawn', 3, 9], ['ratman', 'horde', 9, 9, 99]];

  it('I: before it acts, a unit swaps places with an ally within reach, once a battle; then it goes on with its activation', () => {
    const s = fight(line, 1);
    expect(tideSwapReady(turn(s, 'crabShield'), at(s, 'crabShield'))).toBe(true);
    const [a, t] = [at(s, 'crabShield').pos, at(s, 'shellTurtle').pos];
    const done = swap(s, 'crabShield', 'shellTurtle');
    expect([at(done, 'crabShield').pos, at(done, 'shellTurtle').pos]).toEqual([t, a]);
    expect(done.battle!.activation!.unitId).toBe('crabShield');
    expect(done.battle!.activation!.moved).toBe(false);
    // once a battle on the first level: not again, not even in the next round
    expect(tideSwapReady(done, at(done, 'crabShield'))).toBe(false);
    const later = turn(done, 'frogLeaper');
    later.battle!.round = 2;
    expect(() => swap(later, 'frogLeaper', 'shellTurtle')).toThrow(/niedostępny/);
  });

  it('only before the unit moves, only allies within reach, and not without the temple', () => {
    expect(tideSwapReady(turn(fight(line, 0), 'crabShield'), at(fight(line, 0), 'crabShield'))).toBe(false);
    const s = fight([...line, ['sharkman', 'dawn', 0, 8]], 1);
    expect(tideTargets(s, at(s, 'crabShield')).map((x) => x.id).sort()).toEqual(['frogLeaper', 'shellTurtle']);
    expect(() => swap(s, 'crabShield', 'sharkman')).toThrow(/zasięgu/);
    expect(() => swap(s, 'crabShield', 'ratman')).toThrow(/zasięgu/);
    const moved = applyAction(turn(s, 'crabShield'), { type: 'battleMove', to: arenaCell(5, 9) });
    expect(moved.battle!.activation?.unitId === 'crabShield' ? tideSwapReady(moved, at(moved, 'crabShield')) : false).toBe(false);
  });

  it('II: once a round; III: the one that took the place of the wounded has armour to the end of the round; IV: both regain Życie', () => {
    const two = fight(line, 2);
    const first = swap(two, 'crabShield', 'shellTurtle');
    const again = turn(first, 'frogLeaper');
    expect(tideSwapReady(again, at(again, 'frogLeaper'))).toBe(false);
    again.battle!.round = 2;
    expect(tideSwapReady(again, at(again, 'frogLeaper'))).toBe(true);
    // III: the turtle is wounded, the crab takes its place and is shielded this round
    const three = fight([['crabShield', 'dawn', 4, 8], ['shellTurtle', 'dawn', 3, 7, 2], ['ratman', 'horde', 9, 9, 99]], 3);
    const shielded = swap(three, 'crabShield', 'shellTurtle');
    expect(at(shielded, 'crabShield').status.oathRound).toBe(shielded.battle!.round);
    expect(at(shielded, 'shellTurtle').status.oathRound).toBeUndefined();
    // IV: both regain Życie
    const four = fight([['crabShield', 'dawn', 4, 8, 3], ['shellTurtle', 'dawn', 3, 7, 2], ['ratman', 'horde', 9, 9, 99]], 4);
    const healed = swap(four, 'crabShield', 'shellTurtle');
    expect([at(healed, 'crabShield').hp, at(healed, 'shellTurtle').hp]).toEqual([3 + FACTION_MECHANICS.tideHeal, 2 + FACTION_MECHANICS.tideHeal]);
  });

  it('a large unit does not swap', () => {
    const s = fight([['seaSerpent', 'dawn', 4, 8], ['shellTurtle', 'dawn', 3, 7], ['ratman', 'horde', 9, 9, 99]], 4);
    expect(tideSwapReady(turn(s, 'seaSerpent'), at(s, 'seaSerpent'))).toBe(false);
    expect(tideTargets(s, at(s, 'shellTurtle')).map((x) => x.id)).toEqual([]);
  });
});

describe('the Spark: Perłowa Świątynia Pierwotnej Iskry', () => {
  it('gives every unit of the Tides a pearl shield that soaks up the blows, and nothing else', () => {
    const s = fight([['ratman', 'horde', 7, 9, 99], ['crabShield', 'dawn', 6, 8]]);
    const unit = makeBattleUnit('crabShield', 'dawn');
    sparkBonus(s, unit);
    expect(unit.status.pearl).toBe(FACTION_MECHANICS.sparkPearl);
    expect([unit.status.battleAttackBonus, unit.status.battleSpeedBonus]).toEqual([0, 0]);
    const bare = blow(s, 'ratman', 'crabShield');
    at(s, 'crabShield').status.pearl = FACTION_MECHANICS.sparkPearl;
    expect(blow(s, 'ratman', 'crabShield')).toBe(Math.max(0, bare - FACTION_MECHANICS.sparkPearl));
    const hit = strike(s, 'ratman', 'crabShield');
    expect(at(hit, 'crabShield').hp).toBe(UNITS.crabShield.hp - Math.max(0, bare - FACTION_MECHANICS.sparkPearl));
    expect(at(hit, 'crabShield').status.pearl ?? 0).toBe(Math.max(0, FACTION_MECHANICS.sparkPearl - bare));
  });
});

describe('heroes and commanders', () => {
  it('Ściana Wody: the adjacent enemies are pushed 1 away, the adjacent allies have armour to the end of the round', () => {
    const s = fight([['tritonKing', 'dawn', 6, 8], ['shellTurtle', 'dawn', 5, 9], ['ratman', 'horde', 7, 9, 99], ['goblinSlinger', 'horde', 7, 7, 99]]);
    const before = [gap(s, 'tritonKing', 'ratman'), gap(s, 'tritonKing', 'goblinSlinger')];
    const done = cast(s, 'tritonKing');
    expect(before).toEqual([1, 1]);
    expect(gap(done, 'tritonKing', 'ratman')).toBe(2);
    expect(gap(done, 'tritonKing', 'goblinSlinger')).toBe(2);
    expect(at(done, 'shellTurtle').status.oathRound).toBe(done.battle!.round);
    expect(at(done, 'ratman').hp).toBe(99);
  });

  it('Pieśń Syreny: an enemy in range is pulled 2 towards her', () => {
    const s = fight([['sirenSinger', 'dawn', 2, 8], ['goblinSlinger', 'horde', 6, 8, 99]]);
    const done = cast(s, 'sirenSinger', { targetId: 'goblinSlinger' });
    expect(gap(done, 'sirenSinger', 'goblinSlinger')).toBe(gap(s, 'sirenSinger', 'goblinSlinger') - ABILITY.songPull);
    expect(() => cast(fight([['sirenSinger', 'dawn', 0, 8], ['goblinSlinger', 'horde', 12, 8, 99]]), 'sirenSinger', { targetId: 'goblinSlinger' })).toThrow(/zasięgu/);
  });

  it('Oplot Głębin: an enemy close by is pulled 1 and cannot move in its next activation', () => {
    const s = fight([['seaSerpent', 'dawn', 4, 8], ['ratman', 'horde', 6, 8, 99]]);
    const d = Math.min(...[at(s, 'seaSerpent').pos!, at(s, 'seaSerpent').tail].filter(Boolean).map((c) => distance(parseKey(c!), parseKey(at(s, 'ratman').pos!))));
    expect(d).toBeLessThanOrEqual(ABILITY.deepCoilRange);
    const done = cast(s, 'seaSerpent', { targetId: 'ratman' });
    expect(at(done, 'ratman').status.rootedNext).toBe(true);
    expect(at(done, 'ratman').pos).not.toBe(at(s, 'ratman').pos);
  });

  it('Kły Kapitana: the fourth hero pushes the one he hits 1 away, without a collision', () => {
    const s = fight([['walrusCaptain', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const hit = strike(s, 'walrusCaptain', 'ratman');
    expect(gap(hit, 'walrusCaptain', 'ratman')).toBe(2);
    expect(at(hit, 'ratman').hp).toBe(99 - blow(s, 'walrusCaptain', 'ratman'));
  });

  it('Wylinka: the Sefiran sheds every bad state and regains Życie, once', () => {
    const s = fight([['sefiran', 'dawn', 2, 8, 1], ['ratman', 'horde', 9, 9, 99]]);
    Object.assign(at(s, 'sefiran').status, { poisoned: 2, slowNext: 2, cursedNext: 1, frost: 1, marked: { by: 'horde', round: 1 } });
    const done = cast(s, 'sefiran');
    const st = at(done, 'sefiran').status;
    expect([st.poisoned, st.slowNext, st.cursedNext, st.frost, st.marked]).toEqual([undefined, 0, 0, undefined, undefined]);
    expect(at(done, 'sefiran').hp).toBe(1 + ABILITY.moltHeal);
    expect(at(done, 'sefiran').abilityUsed).toBe(true);
  });

  it('the commanders: Muszlowa Tarcza (armour), Harpun na Linie (pull)', () => {
    expect(UNITS.tritonGuard.ability).toBe('bulwark');
    expect(UNITS.harpooneer.ability).toBe('harpoon');
  });
});

describe('units', () => {
  it('Skorupa: the turtle hides: no damage until its next activation, and its activation ends', () => {
    const s = fight([['shellTurtle', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const hidden = cast(s, 'shellTurtle');
    expect(at(hidden, 'shellTurtle').status.shelled).toBe(true);
    expect(hidden.battle!.activation?.unitId).not.toBe('shellTurtle');
    expect(blow(hidden, 'ratman', 'shellTurtle')).toBe(0);
    const hit = strike(hidden, 'ratman', 'shellTurtle');
    expect(at(hit, 'shellTurtle').hp).toBe(UNITS.shellTurtle.hp);
    // the shell opens when the turtle's next activation begins
    const next = applyAction(turn(hit, 'ratman'), { type: 'endActivation' });
    const t = turn(next, 'shellTurtle');
    const open = applyAction(t, { type: 'endActivation' });
    expect(at(open, 'shellTurtle').status.shelled).toBeUndefined();
  });

  it('Harpun: the one hit is pulled 2 towards the shooter, once', () => {
    const s = fight([['tritonHarpoon', 'dawn', 2, 8], ['goblinSlinger', 'horde', 8, 8, 99]]);
    const hit = strike(s, 'tritonHarpoon', 'goblinSlinger', true);
    expect(gap(hit, 'tritonHarpoon', 'goblinSlinger')).toBe(gap(s, 'tritonHarpoon', 'goblinSlinger') - ABILITY.harpoonPull);
    expect(at(hit, 'tritonHarpoon').abilityUsed).toBe(true);
  });

  it('Susem w Tył: the Żabi Skoczek may hop away after its attack', () => {
    expect(UNITS.frogLeaper.ability).toBe('airDash');
    const s = fight([['frogLeaper', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    expect(strike(s, 'frogLeaper', 'ratman').battle!.activation!.hop).toBe(ABILITY.airDashRange);
  });

  it('Twarda Skorupa: the Krabolud has armour', () => {
    const s = fight([['ratman', 'horde', 7, 9, 99], ['crabShield', 'dawn', 6, 8]]);
    expect(blow(s, 'ratman', 'crabShield')).toBe(Math.max(1, UNITS.ratman.attack - ABILITY.bulwarkArmor));
  });

  it('Atrament: the target and the enemies next to it are weaker at their next attack', () => {
    const s = fight([['inkOctopus', 'dawn', 2, 8], ['ratman', 'horde', 7, 9, 99], ['gargoyle', 'horde', 8, 10, 99], ['goblinSlinger', 'horde', 11, 9, 99]]);
    const hit = strike(s, 'inkOctopus', 'ratman', true);
    expect(at(hit, 'ratman').status.cursedNext).toBe(ABILITY.inkMinus);
    expect(at(hit, 'gargoyle').status.cursedNext).toBe(ABILITY.inkMinus);
    expect(at(hit, 'goblinSlinger').status.cursedNext).toBe(0);
  });

  it('Wir: after the blow the Rekinołak swaps places with the target', () => {
    const s = fight([['sharkman', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const [a, t] = [at(s, 'sharkman').pos, at(s, 'ratman').pos];
    const hit = strike(s, 'sharkman', 'ratman', true);
    expect([at(hit, 'sharkman').pos, at(hit, 'ratman').pos]).toEqual([t, a]);
  });

  it('Perłowa Tarcza: an ally gets a shield that soaks up the damage of the blows', () => {
    const s = fight([['pearlPriestess', 'dawn', 2, 8], ['crabShield', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    const done = cast(s, 'pearlPriestess', { targetId: 'crabShield' });
    expect(at(done, 'crabShield').status.pearl).toBe(ABILITY.pearlShield);
    expect(() => cast(s, 'pearlPriestess', { targetId: 'ratman' })).toThrow();
    expect(blow(done, 'ratman', 'crabShield')).toBe(Math.max(0, blow(s, 'ratman', 'crabShield') - ABILITY.pearlShield));
  });

  it('Szczypce: the Homar has armour and every hit holds the one hit in place', () => {
    const s = fight([['lobsterKnight', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]);
    expect(at(strike(s, 'lobsterKnight', 'ratman'), 'ratman').status.rootedNext).toBe(true);
    expect(blow(s, 'ratman', 'lobsterKnight')).toBe(Math.max(1, UNITS.ratman.attack - ABILITY.pincerArmor));
  });

  it('Uderzenie Skrzydeł: the Albatros pushes every adjacent enemy 1 away', () => {
    const s = fight([['albatross', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99], ['goblinSlinger', 'horde', 5, 9, 99]]);
    const near = (x: GameState, id: string) => Math.min(...[at(x, 'albatross').pos!, at(x, 'albatross').tail].filter(Boolean).map((c) => distance(parseKey(c!), parseKey(at(x, id).pos!))));
    const adjacent = ['ratman', 'goblinSlinger'].filter((id) => near(s, id) === 1);
    expect(adjacent.length).toBeGreaterThan(0);
    const done = cast(s, 'albatross');
    for (const id of adjacent) expect(near(done, id)).toBe(2);
  });

  it('Żywa Rafa: the allies next to the Golem have armour, the Golem cannot be pushed', () => {
    const lone = fight([['ratman', 'horde', 7, 9, 99], ['shellTurtle', 'dawn', 6, 8]]);
    const reef = fight([['ratman', 'horde', 7, 9, 99], ['shellTurtle', 'dawn', 6, 8], ['reefGolem', 'dawn', 5, 7]]);
    expect(blow(reef, 'ratman', 'shellTurtle')).toBe(Math.max(1, blow(lone, 'ratman', 'shellTurtle') - ABILITY.reefArmor));
  });

  it('Odpływ: the Wiedźma swaps two units in her range, of any side; without a second one named she takes the farthest one of the other side', () => {
    const s = fight([['seaWitch', 'dawn', 4, 8], ['crabShield', 'dawn', 5, 9], ['goblinSlinger', 'horde', 8, 8, 99], ['ratman', 'horde', 12, 8, 99]]);
    expect(ebbTargets(s, at(s, 'seaWitch')).map((x) => x.id)).not.toContain('ratman');
    const [c, g] = [at(s, 'crabShield').pos!, at(s, 'goblinSlinger').pos!];
    const done = cast(s, 'seaWitch', { targetId: 'crabShield', cell: g });
    expect([at(done, 'crabShield').pos, at(done, 'goblinSlinger').pos]).toEqual([g, c]);
    expect(() => cast(s, 'seaWitch', { targetId: 'crabShield', cell: at(s, 'ratman').pos! })).toThrow();
    const auto = cast(s, 'seaWitch', { targetId: 'crabShield' });
    expect(at(auto, 'crabShield').pos).toBe(g);
  });

  it('Wir Głębin: every enemy within the radius of the Lewiatan is pulled 2 towards it', () => {
    const s = fight([['leviathan', 'dawn', 4, 8], ['goblinSlinger', 'horde', 7, 9, 99], ['ratman', 'horde', 12, 8, 99]]);
    const near = (x: GameState, id: string) => Math.min(...[at(x, 'leviathan').pos!, at(x, 'leviathan').tail].filter(Boolean).map((c) => distance(parseKey(c!), parseKey(at(x, id).pos!))));
    const before = near(s, 'goblinSlinger');
    expect(before).toBeLessThanOrEqual(ABILITY.deepWhirlRadius);
    const done = cast(s, 'leviathan');
    expect(near(done, 'goblinSlinger')).toBe(Math.max(1, before - ABILITY.deepWhirlPull));
    expect(at(done, 'ratman').pos).toBe(at(s, 'ratman').pos);
  });
});

describe('Perłowe Ławice and the Latarnia Morska', () => {
  it('Perłowe Ławice: +1 gold a round from each settlement with them; level II also Pył every fourth round', () => {
    const s = tidesGame();
    const gold = incomeOf(s, 'dawn');
    home(s).buildings.pearlBanks = 1;
    expect(incomeOf(s, 'dawn')).toBe(gold + FACTION_MECHANICS.pearlGold);
    s.round = 4;
    const one = resourceIncomeOf(s, 'dawn').dust;
    home(s).buildings.pearlBanks = 2;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(one + FACTION_MECHANICS.pearlDust);
    s.round = 3;
    expect(resourceIncomeOf(s, 'dawn').dust).toBe(one);
  });

  it('Latarnia Morska: the land within its radius round the settlement is revealed at the start of a round (II: a larger radius)', () => {
    const s = tidesGame();
    const h = home(s);
    const within = (r: number) => Object.keys(s.tiles).filter((k) => distance(parseKey(k), parseKey(h.at)) <= r);
    for (const k of Object.keys(s.tiles)) s.tiles[k].revealed = false;
    expect(lighthouseReveal(s, 'dawn')).toBe(0);
    h.buildings.lighthouse = 1;
    collectIncome(s);
    expect(within(FACTION_MECHANICS.lighthouseRadius[0]).every((k) => s.tiles[k].revealed)).toBe(true);
    expect(within(FACTION_MECHANICS.lighthouseRadius[1]).some((k) => !s.tiles[k].revealed)).toBe(true);
    h.buildings.lighthouse = 2;
    lighthouseReveal(s, 'dawn');
    expect(within(FACTION_MECHANICS.lighthouseRadius[1]).every((k) => s.tiles[k].revealed)).toBe(true);
  });
});

describe('the bot of the Tides', () => {
  it('a badly hurt unit next to the enemy swaps back with a fresh ally; a fresh melee unit takes the place of a wounded one at the front', () => {
    const back = fight([['crabShield', 'dawn', 6, 8, 1], ['lobsterKnight', 'dawn', 4, 8], ['ratman', 'horde', 7, 9, 99]], 1);
    expect(chooseAction(turn(back, 'crabShield'))).toEqual({ type: 'battleTideSwap', targetId: 'lobsterKnight' });
    const front = fight([['lobsterKnight', 'dawn', 4, 8], ['crabShield', 'dawn', 6, 8, 1], ['ratman', 'horde', 7, 9, 99]], 1);
    expect(chooseAction(turn(front, 'lobsterKnight'))).toEqual({ type: 'battleTideSwap', targetId: 'crabShield' });
  });

  it('it does not swap onto a cell next to a trap of the enemy it can see, nor next to the mycelium of the enemy', () => {
    const s = fight([['lobsterKnight', 'dawn', 4, 8], ['crabShield', 'dawn', 6, 8, 1], ['ratman', 'horde', 7, 9, 99]], 1);
    s.battle!.ground = [{ cell: arenaCell(6, 10), owner: 'horde', kind: 'trap', power: 2, hidden: false }];
    expect(chooseAction(turn(s, 'lobsterKnight'))).not.toMatchObject({ type: 'battleTideSwap' });
    s.battle!.ground = [{ cell: arenaCell(6, 10), owner: 'horde', kind: 'trap', power: 2, hidden: true }];
    expect(chooseAction(turn(s, 'lobsterKnight'))).toMatchObject({ type: 'battleTideSwap' });
    s.battle!.ground = [{ cell: arenaCell(6, 10), owner: 'horde', kind: 'claimed', power: 0 }];
    expect(chooseAction(turn(s, 'lobsterKnight'))).not.toMatchObject({ type: 'battleTideSwap' });
  });

  it('uses the song on a shooter, the whirl of the Lewiatan on two enemies and the turtle hides when it would fall', () => {
    const song = fight([['sirenSinger', 'dawn', 2, 8], ['goblinSlinger', 'horde', 6, 8, 99]]);
    expect(chooseAction(turn(song, 'sirenSinger'))).toEqual({ type: 'battleAbility', targetId: 'goblinSlinger' });
    const whirl = fight([['leviathan', 'dawn', 4, 8], ['goblinSlinger', 'horde', 7, 9, 99], ['ratman', 'horde', 7, 7, 99]]);
    expect(chooseAction(turn(whirl, 'leviathan'))).toEqual({ type: 'battleAbility' });
    const shell = fight([['shellTurtle', 'dawn', 6, 8, 2], ['ratman', 'horde', 7, 9, 99]]);
    expect(chooseAction(turn(shell, 'shellTurtle'))).toEqual({ type: 'battleAbility' });
  });
});

describe('games with the Tides', () => {
  for (const other of PACK_IDS.filter((p) => p !== 'tides')) {
    it(`the Tides against ${other}: bots play a conquest to the end`, () => {
      for (const seed of [1, 2]) {
        const races: Race[] = seed === 1 ? ['tides', other] : [other, 'tides'];
        const end = playOut(createGame(table(races, 'conquest', { seed })));
        expect(end.phase).toBe('over');
      }
    });
  }

  it('the pulls do fire in the games of the bots, and the bots swap places in a battle with the temple', () => {
    const fired = new Set<string>();
    for (const other of ['horde', 'dawn', 'frost'] as Race[]) {
      for (const heroId of ['sirenSinger', 'seaSerpent']) {
        const setup = table(['tides', other], 'conquest', { seed: 2 });
        setup.seats[0].heroId = heroId;
        const end = playOut(createGame(setup));
        for (const l of end.log) if (l.text.includes('zostaje przyciągnięty')) fired.add('pull');
      }
    }
    expect(fired.has('pull')).toBe(true);
    const s = fight([['crabShield', 'dawn', 3, 7], ['lobsterKnight', 'dawn', 2, 8], ['shellTurtle', 'dawn', 3, 9], ['sharkman', 'dawn', 1, 7], ['ratman', 'horde', 9, 9], ['caveTroll', 'horde', 10, 8], ['goblinSlinger', 'horde', 11, 9]], 2);
    const end = playUntil(s, (x) => x.phase !== 'battle', 600);
    expect(end.log.some((l) => l.text.includes('(Przypływ)'))).toBe(true);
  });

  it('four sides with the Tides play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'tides', 'swarm', 'sands'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
  });
});
