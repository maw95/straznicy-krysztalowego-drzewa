import type { FactionPack } from './types';

// Imperium Piasków (docs/frakcje/sands.md, docs/FRAKCJE_PROPOZYCJE.md section 8). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Bastia Cienista, Łuczniczka Karawany, Astrolog Pustyni) are in realm.ts, the fourth hero (Wielbłądzi Książę) is `EXTRA_HEROES` in data.ts.
export const SANDS: FactionPack = {
  id: 'sands',
  name: 'Imperium Piasków',
  heroes: ['djinnVizier', 'sphinxWarden', 'scorpionQueen'],
  supports: ['jackalGuard', 'pharaohMongoose', 'duneArcher'],
  tierUnits: ['sandScorpion', 'mirageDancer', 'lamassu', 'stormDjinn'],
  altUnits: ['cobra', 'ushabti', 'oasisCrocodile', 'roc'],
  legend: 'sandWyrm',
  mechanic: { name: 'Miraż', building: 'mirageHall' },
  buildings: ['mirageHall', 'caravanRoad', 'sandGate'],
  sparkName: 'Złota Piramida Pierwotnej Iskry',
  short: 'Piaski',
  genitive: 'Piasków',
  lead: 'dłużej miało',
  // No desert tiles yet: the Sands borrow the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Złota Oaza', 'Brama Słońca', 'Studnia Siedmiu Palm', 'Miedziany Bazar', 'Grobowiec Królów', 'Szepczące Wydmy', 'Karawanseraj Pod Gwiazdą', 'Kamienny Lew', 'Pałac Wiatru', 'Sucha Rzeka', 'Szafranowy Gród', 'Lustrzana Przystań'],
};
