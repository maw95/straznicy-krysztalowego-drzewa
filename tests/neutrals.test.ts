// Digital ruleset: the weak units and bosses of the neutral encounters (docs/ZASADY_CYFROWE.md, "Neutralni").
import { describe, expect, it } from 'vitest';
import { arenaCell, attackTargets, battleAttack, battleMove, battleTeleport, dealDamage, fromBehind, makeBattleUnit, predictDamage, teleportCells, endActivation } from '../src/engine/battle';
import { chooseAction } from '../src/engine/ai';
import { createGame } from '../src/engine/game';
import { neighborKeys } from '../src/engine/hex';
import { ARTIFACT_BY_ID } from '../src/engine/sites';
import type { Side } from '../src/engine/data';
import type { GameState } from '../src/engine/types';
import { applyActionInPlace } from '../src/engine/game';
import { activation, battleFixture, playOut, setup } from './helpers/engine';

interface Spec { id: string; defId: string; side: Side; cell: string; hp?: number }

/** A digital battle with the listed units (ids may repeat a definition); the first one acts. */
function fight(units: Spec[]): GameState {
  const s = battleFixture(createGame(setup({}, { ruleset: 'digital' })), [{ id: 'goldDragon', side: 'dawn', col: 0, half: 0 }]);
  const b = s.battle!;
  b.units = {};
  for (const { id, defId, side, cell, hp } of units) {
    const u = makeBattleUnit(defId, side);
    u.id = id;
    u.pos = cell;
    if (hp) u.hp = hp;
    b.units[id] = u;
  }
  b.order = units.map((x) => x.id);
  b.activation = activation(units[0].id);
  b.attacker = units[0].side;
  b.defender = units[0].side === 'neutral' ? 'dawn' : 'neutral';
  return s;
}

const here = arenaCell(6, 10);
const near = (cell: string, i = 0) => neighborKeys(cell)[i];
const hero = (cell: string): Spec => ({ id: 'goldDragon', defId: 'goldDragon', side: 'dawn', cell });

describe('neutral encounters: abilities', () => {
  it('Rozprysk: a dying Kruszyniec hurts every neighbour, friend or foe', () => {
    const s = fight([
      hero(near(here, 0)),
      { id: 'k', defId: 'shardling', side: 'neutral', cell: here },
      { id: 'p', defId: 'pincer', side: 'neutral', cell: near(here, 3) },
      { id: 'far', defId: 'pincer', side: 'neutral', cell: arenaCell(2, 2) },
    ]);
    const before = { d: s.battle!.units.goldDragon.hp, p: s.battle!.units.p.hp, far: s.battle!.units.far.hp };
    dealDamage(s, s.battle!.units.k, 99, 'test');
    expect(s.battle!.units.goldDragon.hp).toBe(before.d - 1);
    expect(s.battle!.units.p.hp).toBe(before.p - 1);
    expect(s.battle!.units.far.hp).toBe(before.far);
  });

  it('Chwyt: a wounded target cannot move in its next activation', () => {
    const s = fight([{ id: 'c', defId: 'pincer', side: 'neutral', cell: here }, hero(near(here, 0))]);
    battleAttack(s, 'goldDragon', false);
    expect(s.battle!.units.goldDragon.status.rootedNext).toBe(true);
  });

  it('Nurkowanie: +1 only after flying at least 3 hexes', () => {
    const s = fight([{ id: 'e', defId: 'skyEagle', side: 'neutral', cell: here }, hero(arenaCell(10, 10))]);
    const e = s.battle!.units.e;
    const d = s.battle!.units.goldDragon;
    const plain = predictDamage(s, e, d, { useAbility: false, movedDistance: 2 }).base;
    expect(predictDamage(s, e, d, { useAbility: false, movedDistance: 3 }).base).toBe(plain + 1);
  });

  it('Zajście od tyłu: +1 from behind the target, not from its front', () => {
    const s = fight([{ id: 'h', defId: 'harpy', side: 'neutral', cell: near(here, 0) }, hero(here)]);
    const h = s.battle!.units.h;
    const d = s.battle!.units.goldDragon;
    d.facing = { q: 1, r: 0 }; // looks towards the harpy
    expect(fromBehind(s, h, d)).toBe(false);
    const front = predictDamage(s, h, d, { useAbility: false, movedDistance: 0 }).base;
    d.facing = { q: -1, r: 0 }; // looks away
    expect(fromBehind(s, h, d)).toBe(true);
    expect(predictDamage(s, h, d, { useAbility: false, movedDistance: 0 }).base).toBe(front + 1);
  });

  it('Bagienny Pełzacz regains Życie when its activation begins', () => {
    const s = fight([hero(arenaCell(2, 2)), { id: 'b', defId: 'bogCrawler', side: 'neutral', cell: here, hp: 5 }]);
    endActivation(s);
    expect(s.battle!.units.b.hp).toBe(6);
    // The screen shows the regrowth apart from the blow that came just before it (report 805567).
    expect(s.battle!.heals).toEqual([{ unitId: 'b', amount: 1 }]);
  });

  it('Kamienny Golem: Kamienna Skóra −2 (min 1) until half its Życie is gone, then Trzęsienie hurts everyone around', () => {
    const s = fight([{ id: 'g', defId: 'stoneGolem', side: 'neutral', cell: here }, hero(near(here, 0))]);
    const g = s.battle!.units.g;
    const d = s.battle!.units.goldDragon;
    const wolf = makeBattleUnit('werewolfLord', 'dawn');
    wolf.id = 'w';
    wolf.pos = near(here, 3);
    s.battle!.units.w = wolf;
    expect(predictDamage(s, d, g, { useAbility: false, movedDistance: 0 }).damage).toBe(3);
    g.hp = Math.floor(g.maxHp / 2);
    expect(predictDamage(s, d, g, { useAbility: false, movedDistance: 0 }).damage).toBe(5);
    const hp = [d.hp, wolf.hp];
    battleAttack(s, 'goldDragon', false);
    expect(d.hp).toBeLessThan(hp[0] - 1);
    expect(wolf.hp).toBe(hp[1] - 1);
  });

  it('Kraken: the head cannot be attacked while a tentacle lives', () => {
    const s = fight([hero(near(here, 0)), { id: 'k', defId: 'kraken', side: 'neutral', cell: here }, { id: 't', defId: 'tentacle', side: 'neutral', cell: near(here, 5) }]);
    const targets = (x: GameState) => attackTargets(x, x.battle!.units.goldDragon).map((u) => u.id);
    expect(targets(s)).not.toContain('k');
    s.battle!.units.t.alive = false;
    expect(targets(s)).toContain('k');
  });

  it('Podkop: the Podkopnik comes up up to 4 hexes away and its turn ends', () => {
    const s = fight([{ id: 'p', defId: 'burrower', side: 'neutral', cell: here }, hero(arenaCell(12, 10))]);
    const cells = teleportCells(s, s.battle!.units.p);
    expect(cells.length).toBeGreaterThan(0);
    battleTeleport(s, cells[0]);
    expect(s.battle!.units.p.pos).toBe(cells[0]);
    expect(s.battle!.activation?.unitId).not.toBe('p');
  });

  it('Król Burzy: teleport leaves a charged field that hurts whoever steps on it, Wyładowanie shocks close attackers', () => {
    const s = fight([{ id: 'k', defId: 'stormKing', side: 'neutral', cell: here }, hero(arenaCell(12, 10)), { id: 'w', defId: 'werewolfLord', side: 'dawn', cell: arenaCell(2, 2) }]);
    const to = teleportCells(s, s.battle!.units.k)[0];
    battleTeleport(s, to);
    expect(s.battle!.fields).toEqual([{ cell: here, until: s.battle!.round + 1 }]);
    const w = s.battle!.units.w;
    w.pos = near(here, 0);
    s.battle!.activation = activation('w');
    const hp = w.hp;
    battleMove(s, here);
    expect(w.hp).toBe(hp - 1);
    // Wyładowanie
    const king = s.battle!.units.k;
    const d = s.battle!.units.goldDragon;
    king.pos = near(d.pos!, 0);
    s.battle!.activation = activation('goldDragon');
    const dhp = d.hp;
    battleAttack(s, 'k', false);
    expect(d.hp).toBe(dhp - 1);
  });
});

describe('neutral encounters on the map', () => {
  const grown = (over: Parameters<typeof setup>[0] = {}) => createGame(setup(over, { ruleset: 'digital', heroGrowth: true }));
  const encountersOf = (s: GameState) => Object.values(s.crystals).filter((c) => c.encounter);

  it('are placed only with hero growth in the digital ruleset', () => {
    expect(encountersOf(createGame(setup({}, { ruleset: 'digital' })))).toHaveLength(0);
    expect(encountersOf(createGame(setup({}, { heroGrowth: true })))).toHaveLength(0);
    const s = grown({ mapSize: 'long' });
    const list = encountersOf(s);
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect(s.tiles[c.at].crystalId).toBe(c.id);
      expect(c.decoy).toBe(true);
      expect(c.guardian).toBe(c.encounter![0]);
    }
  });

  it('get stronger with depth: 2–3 weak, a guardian + 2 weak, a boss + companions', () => {
    const s = grown({ mapSize: 'giant', seed: 11 });
    const tiers = new Set(encountersOf(s).map((c) => c.tier));
    expect(tiers).toEqual(new Set([0, 1, 2]));
    for (const c of encountersOf(s)) {
      if (c.tier === 0) expect(c.encounter!.length).toBeGreaterThanOrEqual(2);
      if (c.tier === 1) expect(['cyclops', 'griffin', 'hydra']).toContain(c.encounter![0]);
      if (c.tier === 2) expect(['stoneGolem', 'stormKing', 'kraken']).toContain(c.encounter![0]);
    }
  });

  it('a hero who beats one gets a treasure and an artifact of its tier, and the hex is free', () => {
    const s = grown({ mapSize: 'long', seed: 5 });
    const c = encountersOf(s).find((x) => x.tier === 0)!;
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    const from = Object.keys(s.tiles).find((k) => s.tiles[k].crystalId === null && !s.tiles[k].home && neighborKeys(k).includes(c.at))!;
    hero.pos = from;
    s.tiles[c.at].revealed = true;
    s.turnOrder = [hero.id];
    s.turnIndex = 0;
    s.movePoints = 3;
    applyActionInPlace(s, { type: 'moveHero', to: c.at });
    expect(s.battle!.neutralId).toBe(c.guardian);
    expect(Object.values(s.battle!.units).filter((u) => u.side === 'neutral')).toHaveLength(c.encounter!.length);
    expect(new Set(Object.keys(s.battle!.units)).size).toBe(Object.keys(s.battle!.units).length);
    // Bots pick supports and deploy; then the neutral side falls at once and the next action closes the battle.
    for (let i = 0; i < 20 && s.battle!.stage !== 'fight'; i++) applyActionInPlace(s, chooseAction(s)!);
    expect(s.battle!.stage).toBe('fight');
    for (const u of Object.values(s.battle!.units)) if (u.side === 'neutral') dealDamage(s, u, 999, 'test');
    const before = Object.values(hero.gear ?? {}).length + (hero.pack?.length ?? 0);
    applyActionInPlace(s, { type: 'endActivation' });
    expect(s.phase).toBe('adventure');
    expect(s.crystals[c.id]).toBeUndefined();
    expect(s.tiles[c.at].crystalId).toBeNull();
    expect(Object.values(hero.gear ?? {}).length + (hero.pack?.length ?? 0)).toBe(before + 1);
    const art = [...Object.values(hero.gear ?? {}), ...(hero.pack ?? [])].map((id) => ARTIFACT_BY_ID[id]);
    expect(art.some((a) => a.rarity === 1)).toBe(true);
  });

  it('bots play whole games with encounters on the map', () => {
    for (const seed of [1, 2, 3]) {
      const s = playOut(grown({ mapSize: 'medium', seed }));
      expect(s.phase).toBe('over');
    }
  });
});

describe('bots and encounters', () => {
  it('bots fight encounters in some games (and the games still end)', () => {
    let fought = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const s = playOut(createGame(setup({ mapSize: 'medium', seed }, { ruleset: 'digital', heroGrowth: true })));
      expect(s.phase).toBe('over');
      if (Object.values(s.crystals).filter((c) => c.encounter).length < 3) fought += 1;
    }
    expect(fought).toBeGreaterThan(0);
  });
});
