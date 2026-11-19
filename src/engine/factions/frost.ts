import type { FactionPack } from './types';

// Dwór Wiecznego Szronu (docs/frakcje/frost.md, docs/FRAKCJE_PROPOZYCJE.md section 7). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const FROST: FactionPack = {
  id: 'frost',
  name: 'Dwór Wiecznego Szronu',
  heroes: ['marzanna', 'frostJarl', 'snowLynx'],
  supports: ['frostImp', 'ermine', 'courtPage'],
  tierUnits: ['blizzardWitch', 'iceSentinel', 'youngGiant', 'elderGiant'],
  altUnits: ['glacierYak', 'frostSprite', 'windStrzyga', 'auroraSpirit'],
  legend: 'frostMammoth',
  mechanic: { name: 'Szron', building: 'frostPalace' },
  buildings: ['frostPalace', 'crystalGrotto', 'blizzardTower'],
  sparkName: 'Lodowy Tron Pierwotnej Iskry',
  short: 'Dwór',
  genitive: 'Dworu',
  lead: 'dłużej miał',
  // No frozen tiles yet: the Court borrows the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Szronowy Dwór', 'Biała Cytadela', 'Zamarzły Bród', 'Sopelkowa Wieża', 'Mroźna Przełęcz', 'Jezioro Ciszy', 'Śnieżna Brama', 'Gradowa Turnia', 'Dwór Marzanny', 'Zimowa Przystań', 'Szklany Las', 'Północne Wrota'],
};
