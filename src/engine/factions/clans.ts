import type { FactionPack } from './types';

// Żelazny Klan (docs/frakcje/clans.md, docs/FRAKCJE_PROPOZYCJE.md section 5). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const CLANS: FactionPack = {
  id: 'clans',
  name: 'Żelazny Klan',
  heroes: ['ironThane', 'runeMatron', 'passWarden'],
  supports: ['shieldDwarf', 'bronzeMole', 'brassSpider'],
  tierUnits: ['armoredBear', 'bronzeSentinel', 'giantSlayer', 'hammerGuard'],
  altUnits: ['battleSmith', 'ramGoat', 'skarbnik', 'dwarfCannon'],
  legend: 'clanColossus',
  mechanic: { name: 'Mur Tarcz', building: 'shieldHall' },
  buildings: ['shieldHall', 'runeForge', 'deepMine'],
  sparkName: 'Kowadło Pierwotnej Iskry',
  short: 'Klan',
  genitive: 'Klanu',
  lead: 'dłużej miał',
  // The mountain meadow, the stronghold and the treasury have tiles of their own; the other ground (rocks, flooded galleries, stone bridges, slabs) is shared with Przymierze (its pictures: FACTION_TILE_ART).
  terrain: { base: 'baseClans', land: 'highland', treasure: 'treasureClans', wall: 'chasm' },
  tiles: ['highland', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Żelazny Próg', 'Kowadło Gór', 'Głęboka Brama', 'Miedziany Szyb', 'Sala Siedmiu Młotów', 'Kamienna Twierdza', 'Szara Grań', 'Brązowe Wrota', 'Dymny Komin', 'Runiczna Przełęcz', 'Ojcowski Kamień', 'Sztolnia Pod Gwiazdą'],
};
