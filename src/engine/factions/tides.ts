import type { FactionPack } from './types';

// Bractwo Przypływu (docs/frakcje/tides.md, docs/FRAKCJE_PROPOZYCJE.md section 10). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Trytoński Strażnik, Harpunniczka, Sefiran Plamisty) are in realm.ts, the fourth hero (Stary Mors Kapitan) is `EXTRA_HEROES` in data.ts.
export const TIDES: FactionPack = {
  id: 'tides',
  name: 'Bractwo Przypływu',
  heroes: ['tritonKing', 'sirenSinger', 'seaSerpent'],
  supports: ['shellTurtle', 'tritonHarpoon', 'frogLeaper'],
  tierUnits: ['crabShield', 'sharkman', 'lobsterKnight', 'reefGolem'],
  altUnits: ['inkOctopus', 'pearlPriestess', 'albatross', 'seaWitch'],
  legend: 'leviathan',
  mechanic: { name: 'Przypływ', building: 'tideTemple' },
  buildings: ['tideTemple', 'pearlBanks', 'lighthouse'],
  sparkName: 'Perłowa Świątynia Pierwotnej Iskry',
  short: 'Bractwo',
  genitive: 'Bractwa',
  lead: 'dłużej miało',
  // No shore tiles yet: the Brotherhood borrows the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Perłowa Zatoka', 'Koralowa Brama', 'Latarnia Odpływu', 'Słona Przystań', 'Muszlowy Gród', 'Rafa Trytonów', 'Zatopione Schody', 'Mewia Skała', 'Port Siedmiu Fal', 'Bursztynowy Brzeg', 'Lagunowy Dwór', 'Przylądek Syren'],
};
