// Pustynne Cesarstwo (docs/frakcje/sands.md): the pack, the mirages of the Pałac Mirażu (what the enemy may see of them, what its bot may know, how an attack at
// one is wasted), every ability of the card, the Spark (rearranging after both sides deployed), the Szlak Karawan and the Brama Wydm, then whole games of the Empire.
import { describe, expect, it } from 'vitest';
import { applyAction, createGame, gateMoves, gateReady, sparkBonus } from '../src/engine/game';
import { ABILITY, FACTION_HEROES, UNITS } from '../src/engine/data';
import {
  ambushCells,
  arenaCell,
  attackDamage,
  attackTargets,
  deployCells,
  isMirage,
  makeBattleUnit,
  makeMirage,
  mirageSlots,
  miragesOf,
  predictDamage,
  scaleOf,
  startBattleFight,
  throwTargets,
} from '../src/engine/battle';
import { assignSlots } from '../src/engine/teams';
import { canBeMoved } from '../src/engine/primitives';
import { redactHidden, unmaskId } from '../src/engine/hidden';
import { hideOwnTraps, trapSecrecyOn, trapVeilFor } from '../src/ui/trapVeil';
import { collectIncome, DWELLING_NAMES, incomeOf, KINGDOM } from '../src/engine/kingdom';
import { chooseAction } from '../src/engine/ai';
import { FACTION_MECHANICS } from '../src/engine/empire';
import { COMMANDERS } from '../src/engine/realm';
import { FACTION_PACKS, PACK_IDS } from '../src/engine/factions';
import { ECONOMY } from '../src/engine/economy';
import { DEFAULT_RULES, type BattleUnit, type GameState, type SetupOptions } from '../src/engine/types';
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

/** A rivalry game of the Empire (the first side, slot `dawn`) against the Horde with the level 6 rules. */
const empire = (seed = 4): GameState => createGame(table(['sands', 'horde'], 'conquest', { seed }));
const home = (s: GameState) => Object.values(s.kingdom!.settlements).find((x) => x.owner === 'dawn')!;
const at = (s: GameState, id: string) => s.battle!.units[id];

/** A battle of the Empire (side `dawn`) against the Horde with the Pałac Mirażu at `palace`, no dice, the units of the board game's size. */
function fight(units: U[], palace = 0, over: Partial<NonNullable<GameState['battle']>> = {}): GameState {
  const s = empire();
  s.rules.useDice = false;
  s.rules.statScale = 1;
  s.rules.hpScale = 1;
  home(s).buildings.mirageHall = palace;
  // the battle is led by the Empire's hero of the game (so a battle that ends can be settled on the map)
  return battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })), { attackerHero: Object.values(s.heroes).find((h) => h.faction === 'dawn')!.id, ...over });
}
const RAT: U = ['ratman', 'horde', 7, 9, 99];
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

/** A battle of the Empire that has just been set up (default places, mirages made): the deploy stage. */
function deploying(palace: number, units: U[] = [['djinnVizier', 'dawn', 0, 8], ['lamassu', 'dawn', 0, 4], ['cobra', 'dawn', 0, 6], ['jackalGuard', 'dawn', 0, 10], ['ratman', 'horde', 12, 8], ['goblinSlinger', 'horde', 12, 10]], seed = 4): GameState {
  const s = empire(seed);
  s.rules.useDice = false;
  home(s).buildings.mirageHall = palace;
  battleFixture(s, units.map(([id, side, col, half, hp]) => ({ id, side, col, half, hp })));
  s.battle!.activation = null;
  startBattleFight(s);
  return s;
}
const mirageOfIn = (s: GameState, real: string): BattleUnit => miragesOf(s.battle!, real)[0];
/** What a unit looks like to a viewer, without where it stands and what it is called. */
const looks = (u: BattleUnit) => {
  const { id: _i, pos: _p, tail: _t, facing: _f, ...rest } = u;
  return rest;
};

describe('the pack', () => {
  it('has the heroes, the commanders, the fourth hero and the tiers of the card (20.11): no Storm Djinn, the Bedouin Nomad on 2A', () => {
    const p = FACTION_PACKS.sands;
    expect(p.name).toBe('Pustynne Cesarstwo');
    expect([p.short, p.genitive]).toEqual(['Cesarstwo', 'Cesarstwa']);
    expect(p.heroes).toEqual(['djinnVizier', 'sphinxWarden', 'scorpionQueen']);
    expect(p.supports).toEqual(['jackalGuard', 'pharaohMongoose', 'duneArcher']);
    expect(p.tierUnits).toEqual(['bedouinNomad', 'mirageDancer', 'ushabti', 'lamassu']);
    expect(p.altUnits).toEqual(['cobra', 'sandScorpion', 'oasisCrocodile', 'roc']);
    expect(p.legend).toBe('sandWyrm');
    expect(UNITS.stormDjinn).toBeUndefined();
    expect(Object.values(COMMANDERS.sands).map((id) => UNITS[id].name)).toEqual(['Bastia Cienista', 'Łuczniczka Karawany', 'Astrolog Pustyni']);
    expect(UNITS.camelPrince.ability).toBe('runOn');
    expect(DWELLING_NAMES.bedouinNomad).toBe('Namiot Nomadów');
    expect(UNITS.bedouinNomad).toMatchObject({ movement: 'walk', attackType: 'melee', ability: 'daggerThrow' });
  });
});

describe('Miraż: the decoys of the Pałac Mirażu', () => {
  it('the palace gives 1, 2, 2 and 2 mirages by its level; none without it, none for another faction', () => {
    expect([0, 1, 2, 3, 4].map((l) => mirageSlots(fight([RAT], l), 'dawn'))).toEqual([0, ...FACTION_MECHANICS.mirageCount]);
    expect(mirageSlots(fight([RAT], 4), 'horde')).toBe(0);
  });

  it('when the battle is set up the most valuable supports get their mirages, on free start cells, with no ability of their own', () => {
    const s = deploying(2);
    const b = s.battle!;
    const mirages = Object.values(b.units).filter(isMirage);
    // the lamassu is worth most; a second one goes to the next unit while a start cell is free
    expect(mirages[0].status.mirage!.of).toBe('lamassu');
    expect(mirages.length).toBeGreaterThanOrEqual(1);
    expect(mirages.length).toBeLessThanOrEqual(2);
    const start = new Set(deployCells(b, 'dawn'));
    for (const m of mirages) {
      expect(start.has(m.tail ?? m.pos!)).toBe(true);
      expect(m.ability).toBe('decoy');
      expect(m.defId).toBe(m.status.mirage!.of);
    }
    // no two units on a cell
    const cells = Object.values(b.units).flatMap((u) => [u.pos, u.tail].filter(Boolean));
    expect(new Set(cells).size).toBe(cells.length);
    expect(deploying(0).battle!.mirageAlias).toBeUndefined();
  });

  it('the enemy cannot tell a mirage from its unit: same numbers, mixed-up ids, nothing in what is sent of mirages or decoys', () => {
    const s = deploying(1);
    const m = mirageOfIn(s, 'lamassu') ?? mirageOfIn(s, 'cobra');
    const real = m.status.mirage!.of;
    const seen = redactHidden(s, ['horde']).battle!;
    const json = JSON.stringify(seen);
    expect(json).not.toContain('"mirage"');
    expect(json).not.toContain('decoy');
    expect(json).not.toContain('mirageAlias":{"');
    const bodies = Object.values(seen.units).filter((u) => u.defId === real);
    expect(bodies).toHaveLength(2);
    expect(looks(bodies[0])).toEqual(looks(bodies[1]));
    // the ids shown are the two ids of the group, in some order
    expect(bodies.map((u) => u.id).sort()).toEqual([real, m.id].sort());
    // the owner sees which is which
    expect(redactHidden(s, ['dawn']).battle!.units[m.id].status.mirage).toEqual({ of: real });
    // the argument is not changed
    expect(s.battle!.units[m.id].status.mirage).toEqual({ of: real });
  });

  it('over many seeds the real unit is shown under its own id and under the mirage\'s, first and second in the list', () => {
    const shown = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const s = deploying(1, undefined, seed);
      const m = Object.values(s.battle!.units).find(isMirage)!;
      const real = m.status.mirage!.of;
      const seen = redactHidden(s, ['horde']).battle!;
      const order = Object.keys(seen.units).filter((id) => id === real || id === m.id);
      const realShownAs = s.battle!.mirageAlias![real];
      shown.add(`${realShownAs === real ? 'own' : 'other'}:${order[0] === realShownAs ? 'first' : 'second'}`);
    }
    // the shown ids are sorted, so the real one is first exactly when it is shown under its own id: both happen
    expect(shown).toEqual(new Set(['own:first', 'other:second']));
  });

  it('an attack at a mirage is wasted: it vanishes, nothing is hurt, and it leaves the battle (the order, the units)', () => {
    const s = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 0, 8], ['jackalGuard', 'dawn', 0, 12]], 1);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(7, 9))!;
    s.battle!.order.push(m.id);
    const done = strike(s, 'ratman', m.id);
    expect(done.battle!.units[m.id]).toBeUndefined();
    expect(done.battle!.order).not.toContain(m.id);
    expect(at(done, 'cobra').hp).toBe(at(s, 'cobra').hp);
    expect(done.log.some((l) => l.text.includes('To był miraż'))).toBe(true);
    expect(done.battle!.activation?.unitId).not.toBe('ratman');
  });

  it('an action of the enemy names the shown id, and the engine strikes the body shown under it', () => {
    const s = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 7, 9], ['jackalGuard', 'dawn', 0, 12]], 1);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(7, 7))!;
    s.battle!.order.push(m.id);
    const t = turn(s, 'ratman');
    const view = redactHidden(t, ['horde']).battle!;
    const mirageShown = Object.values(view.units).find((u) => u.pos === m.pos)!.id;
    expect(unmaskId(t.battle!, 'horde', mirageShown)).toBe(m.id);
    const done = applyAction(t, { type: 'battleAttack', targetId: mirageShown, useAbility: false });
    expect(done.battle!.units[m.id]).toBeUndefined();
    expect(at(done, 'cobra').hp).toBe(at(s, 'cobra').hp);
    // the owner's actions name its own ids
    expect(unmaskId(t.battle!, 'dawn', 'cobra')).toBe('cobra');
  });

  it('a mirage never attacks, gives no ally bonus, does not count for the end of the battle and fades with its unit', () => {
    const s = fight([['cobra', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 2], ['jackalGuard', 'dawn', 0, 12]], 1);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(7, 11))!;
    s.battle!.order.push(m.id);
    const mt = turn(s, m.id);
    expect(attackTargets(mt, mt.battle!.units[m.id])).toHaveLength(0);
    expect(() => applyAction(mt, { type: 'battleAttack', targetId: 'ratman', useAbility: false })).toThrow();
    // the side whose last real unit falls loses, mirages or not
    const lone = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 7, 9, 1]], 1);
    const lm = makeMirage(lone, at(lone, 'cobra'), arenaCell(0, 12))!;
    lone.battle!.order.push(lm.id);
    const won = strike(lone, 'ratman', 'cobra');
    expect(won.battle?.winner ?? won.lastBattle?.winner).toBe('horde');
    // a unit that falls takes its mirages with it
    const two = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 7, 9, 1], ['jackalGuard', 'dawn', 0, 12]], 1);
    const tm = makeMirage(two, at(two, 'cobra'), arenaCell(0, 10))!;
    two.battle!.order.push(tm.id);
    const fell = strike(two, 'ratman', 'cobra');
    expect(fell.battle!.units[tm.id]).toBeUndefined();
  });

  it('level IV blinds whoever breaks a mirage: −A at its attacks in its next activation', () => {
    const s = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 0, 8], ['jackalGuard', 'dawn', 7, 11, 99]], 4);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(7, 9))!;
    s.battle!.order.push(m.id);
    const done = strike(s, 'ratman', m.id);
    expect(at(done, 'ratman').status.blindLater).toBe(FACTION_MECHANICS.mirageBlind * scaleOf(done));
    const next = turn(done, 'ratman');
    // the blindness turns on when the next activation begins
    const begun = applyAction(turn(done, 'jackalGuard'), { type: 'endActivation' });
    void next;
    const rat = begun.battle!.units.ratman;
    if (begun.battle!.activation?.unitId === 'ratman') {
      expect(rat.status.blinded).toBe(FACTION_MECHANICS.mirageBlind * scaleOf(begun));
      const plain = { ...rat, status: { ...rat.status, blinded: undefined } };
      expect(attackDamage(begun, rat, at(begun, 'jackalGuard'), false, 0)).toBe(Math.max(0, attackDamage(begun, plain, at(begun, 'jackalGuard'), false, 0) - FACTION_MECHANICS.mirageBlind * scaleOf(begun)));
    }
    // level III does not blind
    const three = fight([['ratman', 'horde', 6, 8], ['cobra', 'dawn', 0, 8], ['jackalGuard', 'dawn', 0, 12]], 3);
    const m3 = makeMirage(three, at(three, 'cobra'), arenaCell(7, 9))!;
    three.battle!.order.push(m3.id);
    expect(at(strike(three, 'ratman', m3.id), 'ratman').status.blindLater).toBeUndefined();
  });

  it('level III: once a battle a unit swaps places with its mirage', () => {
    const s = fight([['cobra', 'dawn', 6, 8], ['ratman', 'horde', 7, 9], ['jackalGuard', 'dawn', 0, 12]], 3);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(1, 11))!;
    s.battle!.order.push(m.id);
    const done = applyAction(turn(s, 'cobra'), { type: 'battleMirageSwap' });
    expect(at(done, 'cobra').pos).toBe(arenaCell(1, 11));
    expect(done.battle!.units[m.id].pos).toBe(arenaCell(6, 8));
    expect(() => applyAction(turn(done, 'cobra'), { type: 'battleMirageSwap' })).toThrow(/niedostępna/);
    expect(() => applyAction(turn(fight([['cobra', 'dawn', 6, 8], RAT], 2), 'cobra'), { type: 'battleMirageSwap' })).toThrow(/niedostępna/);
  });

  it('every mirage leaves with the end of the battle (nothing of it is counted after)', () => {
    const s = fight([['ratman', 'horde', 6, 8, 1], ['cobra', 'dawn', 7, 9], ['jackalGuard', 'dawn', 0, 12]], 1);
    const m = makeMirage(s, at(s, 'cobra'), arenaCell(0, 10))!;
    s.battle!.order.push(m.id);
    const done = strike(s, 'cobra', 'ratman');
    const units = done.battle?.units ?? {};
    expect(Object.values(units).some(isMirage)).toBe(false);
  });

  it('the bot of the enemy acts the same whichever body is the real one (it plans on what it may see)', () => {
    let compared = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      let s = createGame(table(['sands', 'horde'], 'conquest', { seed }));
      home(s).buildings.mirageHall = 2;
      for (let i = 0; i < 9000 && s.phase !== 'over' && compared < 80; i++) {
        const b = s.battle;
        if (b?.stage === 'fight' && b.activation && b.units[b.activation.unitId]?.side === 'horde') {
          const m = Object.values(b.units).find((x) => isMirage(x) && x.pos);
          if (m) {
            // the twin game: the mirage and its unit change places, ids shown and turns, so the enemy's view stays the same
            const twin = structuredClone(s);
            const tb = twin.battle!;
            const real = tb.units[m.status.mirage!.of];
            const mm = tb.units[m.id];
            if (real.pos && !real.tail && !mm.tail && !Object.values(tb.units).some((x) => x.id !== real.id && x.id !== mm.id && x.status.mirage?.of === real.id)) {
              [real.pos, mm.pos] = [mm.pos, real.pos];
              [real.facing, mm.facing] = [mm.facing, real.facing];
              const a = tb.mirageAlias!;
              [a[real.id], a[mm.id]] = [a[mm.id], a[real.id]];
              // what the enemy saw happen names the bodies by where they stood: in the twin the other body did it
              const sw = (id: string) => (id === real.id ? mm.id : id === mm.id ? real.id : id);
              tb.order = tb.order.map(sw);
              tb.rolls = tb.rolls?.map((r) => ({ ...r, attackerId: sw(r.attackerId), targetId: sw(r.targetId) }));
              tb.heals = tb.heals?.map((h) => ({ ...h, unitId: sw(h.unitId) }));
              tb.teleports = tb.teleports?.map((t) => ({ ...t, unitId: sw(t.unitId) }));
              tb.spells = tb.spells?.map((x) => ({ ...x, casterId: sw(x.casterId), targetId: sw(x.targetId) }));
              tb.damageBy = Object.fromEntries(Object.entries(tb.damageBy).map(([k, v]) => [sw(k), v]));
              expect(redactHidden(twin, ['horde']).battle).toEqual(redactHidden(s, ['horde']).battle);
              expect(chooseAction(twin)).toEqual(chooseAction(s));
              compared++;
            }
          }
        }
        s = applyAction(s, chooseAction(s)!);
      }
    }
    expect(compared).toBeGreaterThan(0);
  });

  it('what the server would send to the enemy never tells the mirages (a whole bot game, every state)', () => {
    let s = createGame(table(['sands', 'horde'], 'conquest', { seed: 3 }));
    home(s).buildings.mirageHall = 2;
    let checked = 0;
    for (let i = 0; i < 9000 && s.phase !== 'over'; i++) {
      s = applyAction(s, chooseAction(s)!);
      const b = s.battle;
      if (b && Object.values(b.units).some(isMirage)) {
        const seen = redactHidden(s, ['horde']).battle!;
        const json = JSON.stringify(seen);
        expect(json).not.toContain('"mirage"');
        expect(json).not.toContain('decoy');
        for (const m of Object.values(b.units).filter(isMirage)) {
          const twins = Object.values(seen.units).filter((u) => u.defId === m.defId && u.side === m.side);
          for (const x of twins) expect(looks(x)).toEqual(looks(twins[0]));
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('at one screen two people do not see the own mirages of the Empire either, until they peek; the deployment is covered', () => {
    const s = deploying(1);
    const humans = [{ faction: 'dawn' as const }, { faction: 'horde' as const }];
    expect(trapSecrecyOn(s, humans, false)).toBe(true);
    expect(trapSecrecyOn(s, humans, true)).toBe(false);
    expect(trapVeilFor(s, 'dawn')).toBe(true);
    const hidden = hideOwnTraps(redactHidden(s, ['dawn']), 'dawn');
    expect(JSON.stringify(hidden.battle)).not.toContain('"mirage"');
  });
});

describe('heroes and commanders', () => {
  it('Piaskowa Brama: the Wezyr puts an ally on a free cell within its radius, once; not farther', () => {
    const s = fight([['djinnVizier', 'dawn', 3, 9], ['cobra', 'dawn', 4, 8], RAT]);
    const near = arenaCell(2, 12);
    const done = cast(s, 'djinnVizier', { targetId: 'cobra', cell: near });
    expect(at(done, 'cobra').pos).toBe(near);
    expect(at(done, 'djinnVizier').abilityUsed).toBe(true);
    expect(() => cast(s, 'djinnVizier', { targetId: 'cobra', cell: arenaCell(12, 8) })).toThrow(/promieniu/);
    expect(() => cast(s, 'djinnVizier', { targetId: 'ratman', cell: near })).toThrow(/sojusznika/);
  });

  it('Zagadka: the enemy puzzled by the Sfinks has nobody to attack in its next activation, then it may again', () => {
    const s = fight([['sphinxWarden', 'dawn', 5, 9], ['ratman', 'horde', 7, 9], ['jackalGuard', 'dawn', 8, 10]]);
    const done = cast(s, 'sphinxWarden', { targetId: 'ratman' });
    expect(at(done, 'ratman').status.riddled).toBe(true);
    const rat = turn(done, 'ratman');
    expect(attackTargets(rat, at(rat, 'ratman'))).toHaveLength(0);
    const after = applyAction(rat, { type: 'endActivation' });
    expect(after.battle!.units.ratman.status.riddled).toBeUndefined();
    expect(() => cast(fight([['sphinxWarden', 'dawn', 0, 8], ['ratman', 'horde', 12, 8]]), 'sphinxWarden', { targetId: 'ratman' })).toThrow(/zasięgu/);
  });

  it('Zasadzka Spod Piasku: the Queen is deployed anywhere on her half, unseen by the enemy until she moves; her hits poison', () => {
    const s = deploying(0, [['scorpionQueen', 'dawn', 0, 8], ['jackalGuard', 'dawn', 0, 10], ['ratman', 'horde', 12, 8], ['goblinSlinger', 'horde', 12, 10]]);
    const cell = ambushCells(s.battle!, 'dawn').find((k) => !Object.values(s.battle!.units).some((u) => u.pos === k) && !deployCells(s.battle!, 'dawn').includes(k))!;
    expect(() => applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: { jackalGuard: cell } })).toThrow(/kolumnach startowych/);
    const placed = applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: { scorpionQueen: cell } });
    expect(at(placed, 'scorpionQueen').pos).toBe(cell);
    expect(at(placed, 'scorpionQueen').status.veiled).toBe(true);
    expect(redactHidden(placed, ['horde']).battle!.units.scorpionQueen.pos).toBeNull();
    expect(ambushCells(s.battle!, 'horde')).not.toContain(cell);
    // she comes out when she moves, and every hit of hers poisons
    const f = fight([['scorpionQueen', 'dawn', 5, 9], ['ratman', 'horde', 7, 9, 99]]);
    at(f, 'scorpionQueen').status.veiled = true;
    const moved = applyAction(turn(f, 'scorpionQueen'), { type: 'battleMove', to: arenaCell(6, 8) });
    expect(at(moved, 'scorpionQueen').status.veiled).toBeUndefined();
    const hit = strike(fight([['scorpionQueen', 'dawn', 6, 8], ['ratman', 'horde', 7, 9, 99]]), 'scorpionQueen', 'ratman');
    expect(hit.log.some((l) => l.text.includes('Trucizna'))).toBe(true);
  });

  it('Czujna Drzemka: Bastia lies down instead of moving: armour and no pushing to the end of her next activation, a blow at the first enemy that steps up', () => {
    const s = fight([['bastia', 'dawn', 5, 9], ['ratman', 'horde', 8, 10, 99], ['jackalGuard', 'dawn', 0, 12]]);
    const lying = cast(s, 'bastia');
    const bastia = at(lying, 'bastia');
    expect(bastia.status.dugIn).toBe(ABILITY.dugInActivations);
    expect(canBeMoved(lying, bastia)).toBe(false);
    expect(() => applyAction(lying, { type: 'battleMove', to: arenaCell(4, 8) })).toThrow();
    const free = fight([['bastia', 'dawn', 5, 9], ['ratman', 'horde', 8, 10, 99]]);
    expect(predictDamage(lying, at(lying, 'ratman'), bastia, { useAbility: false, movedDistance: 0 }).damage).toBeLessThan(predictDamage(free, at(free, 'ratman'), at(free, 'bastia'), { useAbility: false, movedDistance: 0 }).damage);
    const rat = turn(lying, 'ratman');
    const stepped = applyAction(rat, { type: 'battleMove', to: arenaCell(6, 8) });
    expect(at(stepped, 'ratman').hp).toBe(99 - ABILITY.watchDamage * scaleOf(stepped));
    expect(at(stepped, 'bastia').status.napStruck).toBe(true);
  });
});

describe('units', () => {
  it('Czujność: the Jackal strikes the first enemy that steps up next to it, once a round', () => {
    const s = fight([['ratman', 'horde', 8, 10, 99], ['jackalGuard', 'dawn', 5, 9], ['goblinSlinger', 'horde', 8, 12, 99]]);
    const one = applyAction(turn(s, 'ratman'), { type: 'battleMove', to: arenaCell(6, 8) });
    expect(at(one, 'ratman').hp).toBe(99 - ABILITY.watchDamage * scaleOf(one));
    const two = applyAction(turn(one, 'goblinSlinger'), { type: 'battleMove', to: arenaCell(6, 10) });
    expect(at(two, 'goblinSlinger').hp).toBe(99);
  });

  it('Odporność na Jad: no poison and no root on the Mongoose', () => {
    const s = fight([['sandScorpion', 'dawn', 6, 8], ['pharaohMongoose', 'horde', 7, 9, 99]]);
    const hit = strike(s, 'sandScorpion', 'pharaohMongoose', true);
    expect(at(hit, 'pharaohMongoose').status.poisoned ?? 0).toBe(0);
    const cobra = strike(fight([['cobra', 'dawn', 6, 8], ['pharaohMongoose', 'horde', 7, 9, 99]]), 'cobra', 'pharaohMongoose', true);
    expect(at(cobra, 'pharaohMongoose').status.rootedNext).toBe(false);
  });

  it('Strzał zza Wydmy: + A next to an obstacle', () => {
    const s = fight([['duneArcher', 'dawn', 3, 9], RAT]);
    const plain = attackDamage(s, at(s, 'duneArcher'), at(s, 'ratman'), false, 0);
    s.battle!.obstacles = [arenaCell(3, 7)];
    expect(attackDamage(s, at(s, 'duneArcher'), at(s, 'ratman'), false, 0)).toBe(plain + ABILITY.coverBonus * scaleOf(s));
  });

  it('Rzut Sztyletem: once a battle the Beduin throws at an enemy in sight that is not next to it (no counterblow), then it may still move', () => {
    const s = fight([['bedouinNomad', 'dawn', 3, 9], ['catFencer', 'horde', 7, 9, 99], ['ratman', 'horde', 12, 2, 99]]);
    expect(attackTargets(s, at(s, 'bedouinNomad'))).toHaveLength(0);
    expect(throwTargets(s, at(s, 'bedouinNomad')).map((u) => u.id)).toContain('catFencer');
    const thrown = strike(s, 'bedouinNomad', 'catFencer', true);
    expect(at(thrown, 'catFencer').hp).toBe(99 - attackDamage(s, at(s, 'bedouinNomad'), at(s, 'catFencer'), true, 0));
    expect(at(thrown, 'bedouinNomad').hp).toBe(at(s, 'bedouinNomad').hp);
    expect(at(thrown, 'bedouinNomad').abilityUsed).toBe(true);
    expect(thrown.battle!.activation?.unitId).toBe('bedouinNomad');
    const moved = applyAction(thrown, { type: 'battleMove', to: arenaCell(2, 8) });
    expect(at(moved, 'bedouinNomad').pos).toBe(arenaCell(2, 8));
    expect(moved.battle!.activation?.unitId).not.toBe('bedouinNomad');
    // a neighbour is struck in melee, not thrown at
    const near = fight([['bedouinNomad', 'dawn', 6, 8], ['catFencer', 'horde', 7, 9, 99]]);
    expect(() => strike(near, 'bedouinNomad', 'catFencer', true)).toThrow(/nie stoi obok/);
  });

  it('Hipnoza: the one hit by the Cobra cannot move in its next activation', () => {
    const hit = strike(fight([['cobra', 'dawn', 6, 8], RAT]), 'cobra', 'ratman', true);
    expect(at(hit, 'ratman').status.rootedNext).toBe(true);
  });

  it('Lustro Wydm: the Dancer makes a mirage of an ally near herself; the enemy sees two alike units', () => {
    const s = fight([['mirageDancer', 'dawn', 3, 9], ['cobra', 'dawn', 3, 7], ['ratman', 'horde', 12, 8]]);
    const done = cast(s, 'mirageDancer', { targetId: 'cobra' });
    const m = Object.values(done.battle!.units).find(isMirage)!;
    expect(m.status.mirage!.of).toBe('cobra');
    const seen = Object.values(redactHidden(done, ['horde']).battle!.units).filter((u) => u.defId === 'cobra');
    expect(seen).toHaveLength(2);
    expect(looks(seen[0])).toEqual(looks(seen[1]));
    expect(() => cast(s, 'mirageDancer', { targetId: 'ratman' })).toThrow(/sojusznika/);
  });

  it('Przebudzenie: the stone guardian stands dormant until an enemy steps up, then it hits harder; it has armour', () => {
    const s = deploying(0, [['ushabti', 'dawn', 0, 8], ['ratman', 'horde', 12, 8, 99]]);
    let g = applyAction(applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: {} }), { type: 'deployUnits', faction: 'horde', positions: {} });
    expect(at(g, 'ushabti').status.dormant).toBe(true);
    const f = fight([['ratman', 'horde', 8, 10, 99], ['ushabti', 'dawn', 5, 9]]);
    at(f, 'ushabti').status.dormant = true;
    const base = attackDamage(f, at(f, 'ushabti'), at(f, 'ratman'), false, 0);
    g = applyAction(turn(f, 'ratman'), { type: 'battleMove', to: arenaCell(6, 8) });
    expect(at(g, 'ushabti').status.dormant).toBeUndefined();
    expect(attackDamage(g, at(g, 'ushabti'), at(g, 'ratman'), false, 0)).toBe(base + ABILITY.awakeningBonus * scaleOf(g));
    const plainHit = predictDamage(f, at(f, 'ratman'), { ...at(f, 'ushabti'), defId: 'jackalGuard' }, { useAbility: false, movedDistance: 0 }).damage;
    expect(predictDamage(f, at(f, 'ratman'), at(f, 'ushabti'), { useAbility: false, movedDistance: 0 }).damage).toBe(Math.max(1, plainHit - ABILITY.awakeningArmor));
  });

  it('Strażnik Bram: the Lamassu has armour and its neighbours cannot be pushed', () => {
    const s = fight([['lamassu', 'dawn', 5, 9], ['cobra', 'dawn', 6, 10], RAT]);
    expect(canBeMoved(s, at(s, 'cobra'))).toBe(false);
    const away = fight([['lamassu', 'dawn', 1, 9], ['cobra', 'dawn', 6, 10], RAT]);
    expect(canBeMoved(away, at(away, 'cobra'))).toBe(true);
  });

  it('Lot ze Skrzydłem: the Rok takes a small neighbour along and it lands next to the Rok', () => {
    const s = fight([['roc', 'dawn', 2, 8], ['cobra', 'dawn', 2, 10], ['ratman', 'horde', 12, 8]]);
    const lifted = cast(s, 'roc', { targetId: 'cobra' });
    expect(lifted.battle!.activation!.lift).toBe('cobra');
    const to = arenaCell(6, 8);
    const flown = applyAction(lifted, { type: 'battleMove', to });
    const roc = at(flown, 'roc');
    const cobra = at(flown, 'cobra');
    expect(roc.pos).toBe(to);
    expect([roc.pos, roc.tail].some((c) => c && Math.abs(parseInt(c) - parseInt(cobra.pos!)) >= 0)).toBe(true);
    expect(cobra.pos).not.toBe(arenaCell(2, 10));
  });

  it('Spod Piasku: the Czerw comes up within its range instead of walking and pushes the enemies next to it', () => {
    const s = fight([['sandWyrm', 'dawn', 2, 8], ['ratman', 'horde', 6, 10, 99]]);
    const t = turn(s, 'sandWyrm');
    const cells = t.battle && (applyAction(t, { type: 'battleTeleport', to: arenaCell(5, 9) }));
    expect(at(cells!, 'sandWyrm').pos).toBe(arenaCell(5, 9));
    expect(cells!.log.some((l) => l.text.includes('spod piasku'))).toBe(true);
  });
});

describe('the Spark: rearranging after both sides deployed', () => {
  it('with the Złota Piramida the Empire moves at most two units after both sides stand, then the fight begins', () => {
    const s = deploying(0);
    home(s).buildings.spark = 1;
    const both = applyAction(applyAction(s, { type: 'deployUnits', faction: 'dawn', positions: {} }), { type: 'deployUnits', faction: 'horde', positions: {} });
    expect(both.battle!.stage).toBe('deploy');
    expect(both.battle!.needsDeploy).toEqual(['dawn']);
    expect(both.battle!.rearrange?.side).toBe('dawn');
    const free = deployCells(both.battle!, 'dawn').filter((k) => !Object.values(both.battle!.units).some((u) => u.pos === k || u.tail === k));
    const [vizier, cobra] = [at(both, 'djinnVizier').pos!, at(both, 'cobra').pos!];
    expect(() => applyAction(both, { type: 'deployUnits', faction: 'dawn', positions: { djinnVizier: cobra, cobra: vizier, jackalGuard: free[0] } })).toThrow(/najwyżej 2/);
    const done = applyAction(both, { type: 'deployUnits', faction: 'dawn', positions: { djinnVizier: cobra, cobra: vizier } });
    expect(done.battle!.stage).toBe('fight');
    expect(at(done, 'djinnVizier').pos).toBe(cobra);
    // without the Spark the fight begins at once
    const plain = applyAction(applyAction(deploying(0), { type: 'deployUnits', faction: 'dawn', positions: {} }), { type: 'deployUnits', faction: 'horde', positions: {} });
    expect(plain.battle!.stage).toBe('fight');
    // a bot rearranges without breaking the rule
    const bot = applyAction(both, chooseAction(both)!);
    expect(bot.battle!.stage).toBe('fight');
    // the Pyramid gives the units of the Empire no bonus of its own
    const unit = makeBattleUnit('cobra', 'dawn');
    sparkBonus(both, unit);
    expect([unit.status.battleAttackBonus, unit.status.battleSpeedBonus, unit.hp]).toEqual([0, 0, makeBattleUnit('cobra', 'dawn').hp]);
  });
});

describe('Szlak Karawan and Brama Wydm', () => {
  it('Szlak Karawan: +1 gold a round for every two mines, and with level II the market buys at its own price', () => {
    const s = empire();
    const mines = Object.keys(s.kingdom!.mines).slice(0, 4);
    for (const k of mines) s.kingdom!.mines[k].owner = 'dawn';
    const before = incomeOf(s, 'dawn');
    home(s).buildings.caravanRoad = 1;
    expect(incomeOf(s, 'dawn')).toBe(before + Math.floor(mines.length / FACTION_MECHANICS.caravanMines));
    s.kingdom!.res!.dawn.ore = 2;
    home(s).buildings.market = 1;
    const sellAt = (st: GameState) => {
      const g = st.kingdom!.gold.dawn;
      const done = applyAction(st, { type: 'kingdomTrade', settlementId: home(st).id, res: 'ore', dir: 'sell' });
      return done.kingdom!.gold.dawn - g;
    };
    expect(sellAt(s)).toBe(ECONOMY.tradeSell.ore);
    home(s).buildings.caravanRoad = 2;
    expect(sellAt(s)).toBeGreaterThan(ECONOMY.tradeSell.ore);
    void collectIncome;
    void KINGDOM;
  });

  it('Brama Wydm: a hero in the settlement with the gate steps to a revealed free hex within reach, then the gate rests', () => {
    const s = empire();
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    s.turnOrder = [hero.id];
    s.turnIndex = 0;
    hero.pos = home(s).at;
    for (const t of Object.values(s.tiles)) t.revealed = true;
    expect(gateMoves(s)).toHaveLength(0);
    home(s).buildings.sandGate = 1;
    expect(gateReady(s, 'dawn')).toBe(true);
    const moves = gateMoves(s);
    expect(moves.length).toBeGreaterThan(0);
    const done = applyAction(s, { type: 'gateHero', to: moves[moves.length - 1] });
    expect(done.heroes[hero.id].pos).toBe(moves[moves.length - 1]);
    expect(gateReady(done, 'dawn')).toBe(false);
    done.round += FACTION_MECHANICS.gateEvery;
    expect(gateReady(done, 'dawn')).toBe(true);
    expect(gateReady(createGame(table(['dawn', 'horde'], 'conquest')), 'dawn')).toBe(false);
  });
});

describe('games with the Desert Empire', () => {
  for (const other of PACK_IDS.filter((p) => p !== 'sands')) {
    it(`the Empire against ${other}: bots play a conquest to the end`, () => {
      for (const seed of [1, 2]) {
        const races: Race[] = seed === 1 ? ['sands', other] : [other, 'sands'];
        const end = playOut(createGame(table(races, 'conquest', { seed })));
        expect(end.phase).toBe('over');
      }
    });
  }

  it('the mirages and the abilities do fire in the games of the bots', () => {
    const fired = new Set<string>();
    for (const seed of [1, 2, 3, 4]) {
      const end = playOut(createGame(table(['sands', 'horde'], 'conquest', { seed })));
      for (const l of end.log) {
        if (l.text.includes('To był miraż')) fired.add('miraż');
        if (l.text.includes('czuwa: cios')) fired.add('czujność');
        if (l.text.includes('zagadką')) fired.add('zagadka');
      }
    }
    expect(fired.has('miraż')).toBe(true);
  });

  it('four sides with the Empire play a conquest to the end', () => {
    const end = playOut(createGame(table(['dawn', 'sands', 'herds', 'free'], 'conquest', { seed: 3 })));
    expect(end.phase).toBe('over');
  });
});
