import type { FactionPack } from './types';

// Żelazne Klany (docs/frakcje/clans.md, docs/FRAKCJE_PROPOZYCJE.md section 5). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const CLANS: FactionPack = {
  id: 'clans',
  name: 'Żelazne Klany',
  heroes: ['ironThane', 'runeMatron', 'passWarden'],
  supports: ['shieldDwarf', 'bronzeMole', 'clanCrossbow'],
  tierUnits: ['armoredBear', 'bronzeSentinel', 'giantSlayer', 'hammerGuard'],
  altUnits: ['battleSmith', 'goatRider', 'skarbnik', 'dwarfCannon'],
  legend: 'clanColossus',
  mechanic: { name: 'Mur Tarcz', building: 'shieldHall' },
  buildings: ['shieldHall', 'runeForge', 'deepMine'],
  sparkName: 'Kowadło Pierwotnej Iskry',
  short: 'Klanów',
  genitive: 'Klanów',
  lead: 'dłużej miały',
  // No mountain tiles yet: the Clans borrow the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Żelazny Próg', 'Kowadło Gór', 'Głęboka Brama', 'Miedziany Szyb', 'Sala Siedmiu Młotów', 'Kamienna Twierdza', 'Szara Grań', 'Brązowe Wrota', 'Dymny Komin', 'Runiczna Przełęcz', 'Ojcowski Kamień', 'Sztolnia Pod Gwiazdą'],
};
