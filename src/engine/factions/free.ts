import type { FactionPack } from './types';

// Wolna Kompania (docs/frakcje/free.md, docs/FRAKCJE_PROPOZYCJE.md section 6). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Kuna Rębajło, Żbiczka Bajdurka, Zajęczyca Zielarka) are in realm.ts, the fourth hero (Wydra Przemytniczka) is `EXTRA_HEROES` in data.ts.
export const FREE: FactionPack = {
  id: 'free',
  name: 'Wolna Kompania',
  heroes: ['foxCaptain', 'badgerSapper', 'ravenSeer'],
  supports: ['otterScout', 'magpieThief', 'squirrelArcher'],
  tierUnits: ['weaselKnife', 'polecatPoisoner', 'wolverine', 'toadGunner'],
  altUnits: ['beaverEngineer', 'catFencer', 'marmotPetard', 'raccoonDogSpy'],
  legend: 'towerMonitor',
  mechanic: { name: 'Sidła', building: 'trapWorkshop' },
  buildings: ['trapWorkshop', 'fence', 'smugglerTrails'],
  sparkName: 'Skrytka Pierwotnej Iskry',
  short: 'Kompania',
  genitive: 'Kompanii',
  lead: 'dłużej miała',
  // The glade, the hideout and the treasury have tiles of their own; the other ground (hills, rivers, bridges, mountains, ravines, clearings) is shared with Przymierze (its pictures: FACTION_TILE_ART).
  terrain: { base: 'baseFree', land: 'glade', treasure: 'treasureFree', wall: 'chasm' },
  tiles: ['glade', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Lisia Jama', 'Zbójecki Wąwóz', 'Młyn Pod Krukiem', 'Borsucza Górka', 'Wydrza Przystań', 'Kuni Las', 'Przemytnicza Kładka', 'Stara Karczma Pod Sową', 'Zielony Gościniec', 'Spalony Most', 'Sakwa i Łuk', 'Bractwo Trzech Dębów'],
};
