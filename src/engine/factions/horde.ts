import type { FactionPack } from './types';

export const HORDE: FactionPack = {
  id: 'horde',
  name: 'Mroczna Horda',
  heroes: ['blackDragon', 'werewolfLord', 'ironFistOgre'],
  supports: ['goblinShaman', 'caveSpider', 'shadowBat'],
  tierUnits: ['ratman', 'hellhound', 'salamander', 'minotaurChief'],
  altUnits: ['goblinSlinger', 'gargoyle', 'caveTroll', 'shadowWyvern'],
  legend: 'doomBehemoth',
  mechanic: { name: 'Żądza Krwi', building: 'bloodPit' },
  buildings: ['bloodPit', 'plunder', 'wolfDen'],
  sparkName: 'Czarna Kuźnia Pierwotnej Iskry',
  short: 'Horda',
  genitive: 'Hordy',
  lead: 'dłużej miała',
  terrain: { base: 'baseHorde', land: 'scorched', treasure: 'treasureHorde', wall: 'deadThicket' },
  tiles: ['scorched', 'barren', 'swamp', 'darkCave', 'ruins', 'deadThicket', 'thorns'],
  settlementNames: ['Czarnogrzęd', 'Żelazna Brama', 'Popielisko', 'Krwawy Bród', 'Sadzawa Cieni', 'Kościany Szaniec', 'Węglowisko', 'Gniewogród', 'Smolna Twierdza', 'Ciernisty Gród', 'Ogrza Warownia', 'Czerwony Szaniec', 'Dymiące Wrota', 'Trupia Przełęcz', 'Mglisty Kopiec', 'Wilcza Jama'],
};
