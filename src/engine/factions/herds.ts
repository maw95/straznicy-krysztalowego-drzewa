import type { FactionPack } from './types';

// Dzikie Stada (docs/frakcje/herds.md, docs/FRAKCJE_PROPOZYCJE.md section 3). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const HERDS: FactionPack = {
  id: 'herds',
  name: 'Dzikie Stada',
  heroes: ['greatAurochs', 'satyrHornlord', 'windAntelope'],
  supports: ['satyrPiper', 'youngAurochs', 'rockGoat'],
  tierUnits: ['faunSlinger', 'forestBison', 'steppeHippogriff', 'warRhino'],
  altUnits: ['tarpan', 'satyrLancer', 'drumElephant', 'bullMoose'],
  legend: 'indrik',
  mechanic: { name: 'Tętent', building: 'hoofStone' },
  buildings: ['hoofStone', 'pastures', 'refuge'],
  sparkName: 'Ołtarz Rogów Pierwotnej Iskry',
  short: 'Stada',
  genitive: 'Stad',
  lead: 'dłużej miały',
  // No steppe tiles yet: the Herds borrow the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Tętniący Bród', 'Rogaty Kamień', 'Turza Polana', 'Kopytnik', 'Wichrowy Step', 'Żubrza Ostoja', 'Pyłowy Szlak', 'Grzmiący Jar', 'Słone Lizawisko', 'Dudniąca Dolina', 'Wodopój Trzech Rogów', 'Trawiaste Morze'],
};
