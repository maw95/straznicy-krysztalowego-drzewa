import type { FactionPack } from './types';

// Pustynne Cesarstwo (docs/frakcje/sands.md, docs/FRAKCJE_PROPOZYCJE.md section 8). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Bastia Cienista, Łuczniczka Karawany, Astrolog Pustyni) are in realm.ts, the fourth hero (Wielbłądzi Książę) is `EXTRA_HEROES` in data.ts.
export const SANDS: FactionPack = {
  id: 'sands',
  name: 'Pustynne Cesarstwo',
  heroes: ['djinnVizier', 'sphinxWarden', 'scorpionQueen'],
  supports: ['jackalGuard', 'pharaohMongoose', 'duneArcher'],
  tierUnits: ['bedouinNomad', 'mirageDancer', 'ushabti', 'lamassu'],
  altUnits: ['cobra', 'sandScorpion', 'oasisCrocodile', 'roc'],
  legend: 'sandWyrm',
  mechanic: { name: 'Miraż', building: 'mirageHall' },
  buildings: ['mirageHall', 'caravanRoad', 'sandGate'],
  sparkName: 'Złota Piramida Pierwotnej Iskry',
  short: 'Cesarstwo',
  genitive: 'Cesarstwa',
  lead: 'dłużej miało',
  // No desert tiles yet: the Empire borrows the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Złota Oaza', 'Brama Słońca', 'Studnia Siedmiu Palm', 'Miedziany Bazar', 'Grobowiec Królów', 'Szepczące Wydmy', 'Karawanseraj Pod Gwiazdą', 'Kamienny Lew', 'Pałac Wiatru', 'Sucha Rzeka', 'Szafranowy Gród', 'Lustrzana Przystań'],
};
