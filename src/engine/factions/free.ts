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
  // No forest-camp tiles yet: the Companies borrow the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Lisia Jama', 'Zbójecki Wąwóz', 'Młyn Pod Krukiem', 'Borsucza Górka', 'Wydrza Przystań', 'Kuni Las', 'Przemytnicza Kładka', 'Stara Karczma Pod Sową', 'Zielony Gościniec', 'Spalony Most', 'Sakwa i Łuk', 'Bractwo Trzech Dębów'],
};
