import type { FactionPack } from './types';

// Rój Puszczy (docs/frakcje/swarm.md, docs/FRAKCJE_PROPOZYCJE.md section 9). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
// The tavern commanders (Żuk Gwardzista, Świetlikowa Łuczniczka, Grzybowy Wróżbita) are in realm.ts, the fourth hero (Pszczoła Królowa) is `EXTRA_HEROES` in data.ts.
export const SWARM: FactionPack = {
  id: 'swarm',
  name: 'Rój Puszczy',
  heroes: ['mantisQueen', 'elderMycelium', 'goliathBeetle'],
  supports: ['sporeling', 'soldierAnt', 'firefly'],
  tierUnits: ['rootCaterpillar', 'mushroomGuard', 'dragonfly', 'centipede'],
  altUnits: ['dustMoth', 'bombardier', 'mycoMother', 'armoredSnail'],
  legend: 'emperorCicada',
  mechanic: { name: 'Grzybnia', building: 'myceliumHeart' },
  buildings: ['myceliumHeart', 'mushroomGarden', 'tunnels'],
  sparkName: 'Matecznik Pierwotnej Iskry',
  short: 'Rój',
  genitive: 'Roju',
  lead: 'dłużej miał',
  // No cave tiles yet: the Swarm borrows the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Mroczny Kopiec', 'Grzybowa Grota', 'Korzenny Labirynt', 'Świetlikowa Pieczara', 'Wilgotny Gród', 'Chitynowa Brama', 'Kapeluszowy Las', 'Głęboki Matecznik', 'Szepczące Korytarze', 'Bursztynowa Komora', 'Czerwony Muchomor', 'Pod Starym Dębem'],
};
