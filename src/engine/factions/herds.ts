import type { FactionPack } from './types';

// Dzikie Stado (docs/frakcje/herds.md, docs/FRAKCJE_PROPOZYCJE.md section 3). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const HERDS: FactionPack = {
  id: 'herds',
  name: 'Dzikie Stado',
  heroes: ['greatAurochs', 'satyrHornlord', 'windAntelope'],
  supports: ['satyrPiper', 'youngAurochs', 'kulan'],
  tierUnits: ['steppeArcher', 'forestBison', 'steppeLamignat', 'warRhino'],
  altUnits: ['muskOx', 'arkar', 'drumElephant', 'bullMoose'],
  legend: 'indrik',
  mechanic: { name: 'Tętent', building: 'hoofStone' },
  buildings: ['hoofStone', 'pastures', 'refuge'],
  sparkName: 'Ołtarz Rogów Pierwotnej Iskry',
  short: 'Stado',
  genitive: 'Stada',
  lead: 'dłużej miało',
  // The steppe, the camp and the treasury have tiles of their own; the other ground (hills, rivers, bridges, mountains, chasms) is shared with Przymierze.
  terrain: { base: 'baseHerds', land: 'steppe', treasure: 'treasureHerds', wall: 'chasm' },
  tiles: ['steppe', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Tętniący Bród', 'Rogaty Kamień', 'Turza Polana', 'Kopytnik', 'Wichrowy Step', 'Żubrza Ostoja', 'Pyłowy Szlak', 'Grzmiący Jar', 'Słone Lizawisko', 'Dudniąca Dolina', 'Wodopój Trzech Rogów', 'Trawiaste Morze'],
};
