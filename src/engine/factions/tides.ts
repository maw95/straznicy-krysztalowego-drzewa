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
  // The shore, the harbour and the treasury have tiles of their own; the other ground (dunes, tidal channels, walkways, cliffs, gullies, salt flats) is shared with Przymierze (its pictures: FACTION_TILE_ART).
  terrain: { base: 'baseTides', land: 'shore', treasure: 'treasureTides', wall: 'chasm' },
  tiles: ['shore', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Perłowa Zatoka', 'Koralowa Brama', 'Latarnia Odpływu', 'Słona Przystań', 'Muszlowy Gród', 'Rafa Trytonów', 'Zatopione Schody', 'Mewia Skała', 'Port Siedmiu Fal', 'Bursztynowy Brzeg', 'Lagunowy Dwór', 'Przylądek Syren'],
};
