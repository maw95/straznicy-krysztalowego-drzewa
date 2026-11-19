import type { FactionPack } from './types';

// Królestwo Umarłych (docs/frakcje/undead.md, docs/FRAKCJE_PROPOZYCJE.md section 4). Gate G1: data, pack and abilities; the numbers wait for the balance gate (G2).
export const UNDEAD: FactionPack = {
  id: 'undead',
  name: 'Królestwo Umarłych',
  heroes: ['barrowKing', 'lanternWraith', 'headlessKnight'],
  supports: ['skeletonSpear', 'willOWisp', 'penitentShade'],
  tierUnits: ['skeletonArcher', 'hauntedArmor', 'viy', 'lich'],
  altUnits: ['scarecrow', 'banshee', 'boneOracle', 'kostucha'],
  legend: 'boneDragon',
  mechanic: { name: 'Wieczna Warta', building: 'barrow' },
  buildings: ['barrow', 'ossuary', 'bellTower'],
  sparkName: 'Krypta Pierwotnej Iskry',
  short: 'Umarłych',
  genitive: 'Umarłych',
  lead: 'dłużej miało',
  // No barrow tiles yet: the Kingdom borrows the meadow of Przymierze (placeholder, docs/BACKLOG.md 2a).
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'barren', 'hill', 'river', 'bridge', 'mountain', 'chasm'],
  settlementNames: ['Mglisty Kurhan', 'Szare Wrzosowisko', 'Zadumane Opactwo', 'Latarniany Gród', 'Popielne Wzgórze', 'Zaduszny Dwór', 'Srebrny Całun', 'Cmentarne Sady', 'Siedem Kopców', 'Stary Dzwon', 'Wieczna Cisza', 'Krucza Kaplica'],
};
