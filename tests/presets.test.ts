import { describe, expect, it } from 'vitest';
import { resolveTier, TIERS, type Switches } from '../src/engine/presets';

const picks: Switches = { objective: 'boss', shape: 'ring', customMapId: 'dolina', growth: false };

describe('complexity levels', () => {
  it('level 1 fixes the goal, the map and no growth whatever was picked', () => {
    expect(resolveTier('adventure', picks)).toEqual({ objective: 'crystals', shape: 'triangle', growth: false });
  });
  it('level 2 keeps the picked goal and map and switches hero growth on', () => {
    expect(resolveTier('expedition', picks)).toEqual({ ...picks, growth: true });
  });
  it('custom leaves everything to the player', () => {
    expect(resolveTier('custom', picks)).toEqual(picks);
    expect(resolveTier('custom', { ...picks, growth: true }).growth).toBe(true);
  });
  it('every level has a name and a one-line summary', () => {
    for (const t of Object.values(TIERS)) expect(t.name && t.summary).toBeTruthy();
  });
});
