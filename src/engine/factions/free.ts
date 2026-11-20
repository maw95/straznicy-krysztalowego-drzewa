import type { FactionPack } from './types';

// Wolne Kompanie (docs/frakcje/free.md, docs/FRAKCJE_PROPOZYCJE.md section 6). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Kuna Rębajło, Żbiczka Bajdurka, Zajęczyca Zielarka) are in realm.ts, the fourth hero (Wydra Przemytniczka) is `EXTRA_HEROES` in data.ts.
export const FREE: FactionPack = {
  id: 'free',
  name: 'Wolne Kompanie',
  heroes: ['foxCaptain', 'badgerSapper', 'ravenSeer'],
  supports: ['otterScout', 'martenThief', 'squirrelArcher'],
  tierUnits: ['weaselKnife', 'polecatPoisoner', 'wolverine', 'toadGunner'],
  altUnits: ['beaverEngineer', 'raccoonDogSpy', 'badgerBomber', 'catFencer'],
  legend: 'towerMonitor',
  mechanic: { name: 'Sidła', building: 'trapWorkshop' },
  buildings: ['trapWorkshop', 'fence', 'smugglerTrails'],
  sparkName: 'Skrytka Pierwotnej Iskry',
  short: 'Kompanie',
  genitive: 'Kompanii',
  lead: 'dłużej miały',
  // No forest-camp tiles yet: the Companies borrow the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Lisia Jama', 'Zbójecki Wąwóz', 'Młyn Pod Krukiem', 'Borsucza Górka', 'Wydrza Przystań', 'Kuni Las', 'Przemytnicza Kładka', 'Stara Karczma Pod Sową', 'Zielony Gościniec', 'Spalony Most', 'Sakwa i Łuk', 'Bractwo Trzech Dębów'],
};
