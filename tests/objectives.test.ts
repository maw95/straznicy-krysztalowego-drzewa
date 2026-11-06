import { describe, expect, it } from 'vitest';
import { CONTROL, SURVIVAL } from '../src/engine/data';
import { createGame } from '../src/engine/game';
import { distance, parseKey } from '../src/engine/hex';
import { tileCost, treeKey } from '../src/engine/map';
import { controlCounts, controlRoundsToWin, objectiveOf, OBJECTIVES } from '../src/engine/objectives';
import { playOut, pvpSeats, setup } from './helpers/engine';

describe('objectives', () => {
  it('a game without an objective plays the crystals goal, as before', () => {
    const s = createGame(setup());
    expect(s.rules.objective).toBeUndefined();
    expect(objectiveOf(s)).toBe('crystals');
    expect(s.control).toBeUndefined();
  });

  it('the crystals objective reports the crystals at the Tree and the ritual while it runs', () => {
    const s = createGame(setup());
    expect(OBJECTIVES.crystals.progress(s)).toEqual([{ label: 'Kryształy przy Drzewie', value: `0 / ${s.crystalsNeeded}`, tone: 'dawn' }]);
    s.ritual = 2;
    expect(OBJECTIVES.crystals.progress(s).map((l) => l.label)).toContain('Rytuał przy Drzewie');
  });

  it('the crystals objective finishes the game when all crystals are delivered', () => {
    const s = createGame(setup());
    s.factions.dawn.delivered = s.crystalsNeeded;
    OBJECTIVES.crystals.checkVictory(s);
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('dawn');
  });

  it('bots still play a crystals game to the end', () => {
    expect(playOut(createGame(setup({ seed: 3 }))).phase).toBe('over');
  });
});

describe('objective control (digital ruleset)', () => {
  const control = (over: Parameters<typeof setup>[0] = {}) => createGame(setup(over, { ruleset: 'digital', objective: 'control' }));

  it('is only played in the digital ruleset', () => {
    expect(objectiveOf(createGame(setup({}, { objective: 'control' })))).toBe('crystals');
    expect(createGame(setup({}, { objective: 'control' })).control).toBeUndefined();
    expect(objectiveOf(control())).toBe('control');
  });

  it('puts three passable, revealed points on the map: the middle one on the axis, two mirrored, none on the Tree or a base', () => {
    for (const mapSize of ['short', 'medium', 'long', 'veryLong'] as const) {
      for (let seed = 1; seed <= 6; seed++) {
        const s = control({ seed, mapSize });
        const pts = s.control!.points;
        expect(pts).toHaveLength(CONTROL.points);
        expect(new Set(pts).size).toBe(pts.length);
        for (const k of pts) {
          expect(tileCost(s.tiles[k])).not.toBeNull();
          expect(s.tiles[k].revealed).toBe(true);
          expect(k).not.toBe(treeKey());
          expect(s.tiles[k].home).toBeNull();
          expect(s.tiles[k].crystalId).toBeNull();
        }
        const [mid, a, b] = pts.map((k) => s.tiles[k]);
        expect(mid.col * 2).toBe(mid.row); // on the axis
        expect(a.row).toBe(b.row);
        expect(a.col + b.col).toBe(a.row); // mirrored
        expect(distance(parseKey(pts[0]), parseKey(pts[1]))).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('the same seed gives the same points, and the crystal map is the one the classic game has', () => {
    const a = control({ seed: 5 });
    const b = control({ seed: 5 });
    const c = createGame(setup({ seed: 5 }, { ruleset: 'digital' }));
    expect(a.control!.points).toEqual(b.control!.points);
    expect(Object.keys(a.crystals)).toEqual(Object.keys(c.crystals));
    // Only a point's own hex may differ (a mountain or a lake there is cleared).
    const differs = Object.keys(a.tiles).filter((k) => a.tiles[k].terrain !== c.tiles[k].terrain);
    for (const k of differs) expect(a.control!.points).toContain(k);
  });

  it('a side holds a point by standing on it; the middle one is worth more; the leader of enough rounds in a row wins', () => {
    const s = control();
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    const [mid, side] = s.control!.points;
    hero.pos = side;
    expect(controlCounts(s)).toEqual({ dawn: 1, horde: 0 });
    hero.pos = mid;
    expect(controlCounts(s)).toEqual({ dawn: CONTROL.centreWeight, horde: 0 });
    const need = controlRoundsToWin(s, 'dawn');
    for (let i = 1; i < need; i++) {
      expect(OBJECTIVES.control.onRoundEnd(s)).toBe(false);
      expect(s.control!.streak).toBe(i);
    }
    expect(OBJECTIVES.control.onRoundEnd(s)).toBe(true);
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('dawn');
    expect(OBJECTIVES.control.progress(s).map((l) => l.label)).toContain('Punkty kontrolne');
  });

  it('a level round breaks the streak; at the round limit the side that led longer wins, level goes to the Horde', () => {
    const s = control();
    const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn')!;
    hero.pos = s.control!.points[0];
    OBJECTIVES.control.onRoundEnd(s);
    expect(s.control!.streak).toBe(1);
    hero.pos = treeKey();
    OBJECTIVES.control.onRoundEnd(s);
    expect(s.control!.streak).toBe(0);
    expect(s.control!.lead).toBeNull();
    OBJECTIVES.control.onRoundLimit(s);
    expect(s.winner).toBe('dawn'); // led one round, the Horde none
    const t = control();
    OBJECTIVES.control.onRoundLimit(t);
    expect(t.winner).toBe('horde');
  });

  it('bots play control games to the end in every mode, with a winner', () => {
    for (let seed = 1; seed <= 5; seed++) {
      for (const mapSize of ['short', 'medium', 'long'] as const) {
        const coop = playOut(control({ seed, mapSize }));
        expect(coop.phase, `coop ${seed} ${mapSize}`).toBe('over');
        expect(coop.winner).not.toBeNull();
        const pvp = playOut(createGame(setup({ seed, mapSize, mode: 'pvp', seats: pvpSeats('goldDragon', 'blackDragon') }, { ruleset: 'digital', objective: 'control' })));
        expect(pvp.phase, `pvp ${seed} ${mapSize}`).toBe('over');
      }
    }
  });
});

describe('objective survival (digital ruleset, coop)', () => {
  const survival = (over: Parameters<typeof setup>[0] = {}) => createGame(setup({ mode: 'coop', ...over }, { ruleset: 'digital', objective: 'survival' }));

  it('is only played in the digital ruleset, with the rounds to hold out set by the map', () => {
    expect(objectiveOf(createGame(setup({}, { objective: 'survival' })))).toBe('crystals');
    const s = survival({ mapSize: 'short' });
    expect(objectiveOf(s)).toBe('survival');
    expect(s.survival).toEqual({ rounds: SURVIVAL.rounds.short, waves: 0 });
  });

  it('the Przymierze win after the last round, while a hero lives', () => {
    const s = survival();
    s.round = s.survival!.rounds;
    expect(OBJECTIVES.survival.onRoundEnd(s)).toBe(true);
    expect(s.winner).toBe('dawn');
  });

  it('every second round brings a Horde hero while the automaton fields fewer than the Przymierze plus one', () => {
    const s = survival();
    const hordeAlive = () => Object.values(s.heroes).filter((h) => h.faction === 'horde' && h.alive).length;
    const before = hordeAlive();
    s.round = 1;
    OBJECTIVES.survival.onRoundEnd(s);
    expect(hordeAlive()).toBe(before);
    s.round = 2;
    for (const h of Object.values(s.heroes)) if (h.faction === 'horde' && h.alive && hordeAlive() > 1) h.alive = false;
    const low = hordeAlive();
    OBJECTIVES.survival.onRoundEnd(s);
    expect(hordeAlive()).toBeGreaterThan(low);
    expect(s.survival!.waves).toBe(1);
  });

  it('bots play it to the end, and the report shows the progress', () => {
    const s = playOut(survival({ seed: 4 }));
    expect(s.phase).toBe('over');
    expect(OBJECTIVES.survival.progress(createGame(setup({ mode: 'coop' }, { ruleset: 'digital', objective: 'survival' }))).map((l) => l.label)).toEqual(['Przetrwane rundy', 'Fale Hordy']);
  });
});
