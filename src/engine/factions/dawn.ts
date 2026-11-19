import type { FactionPack } from './types';

export const DAWN: FactionPack = {
  id: 'dawn',
  name: 'Przymierze Świtu',
  heroes: ['goldDragon', 'unicornKing', 'ancientBear'],
  supports: ['elfDruid', 'nymph', 'pegasus'],
  tierUnits: ['hedgehog', 'centaur', 'boar', 'treeGuardian'],
  altUnits: ['silverFox', 'dawnOwl', 'dryadArcher', 'whiteStag'],
  legend: 'dawnPhoenix',
  mechanic: { name: 'Blask Świtu', building: 'shrine' },
  buildings: ['shrine', 'nursery', 'grove'],
  sparkName: 'Sanktuarium Pierwotnej Iskry',
  short: 'Przymierze',
  genitive: 'Przymierza',
  lead: 'dłużej miało',
  terrain: { base: 'baseDawn', land: 'meadow', treasure: 'treasureDawn', wall: 'chasm' },
  tiles: ['meadow', 'forest', 'river', 'bridge', 'hill', 'mountain', 'chasm'],
  settlementNames: ['Świtogaj', 'Srebrzysty Bród', 'Złotolist', 'Jasna Polana', 'Perłowa Wieża', 'Kryształowa Przystań', 'Wiosenny Gród', 'Miodowy Dwór', 'Zorzyca', 'Białe Mosty', 'Rosogród', 'Słonecznik', 'Lazurowa Zatoka', 'Skrzydlata Przystań', 'Malwowa Dolina', 'Wierzbowy Gaj'],
};
