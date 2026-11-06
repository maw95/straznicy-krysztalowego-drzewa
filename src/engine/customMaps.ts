// Hand-made adventure maps (digital ruleset, shape "custom"): plain data, so a map can also come from a JSON file (`parseCustomMap`)
// and the story campaign can ship its own. Rows are drawn like the rectangle: pointy-topped hexes, odd rows shifted half a hex to the right.
//   .  land (the terrain is drawn from the side's tile pool, as everywhere)
//   #  water or rock: impassable
//   =  a bridge (passable)
//   T  the Tree        D  the base of the Przymierza        H  the base of the Horda        (space)  no hex

export interface CustomMap {
  id: string;
  name: string;
  /** One line about the map for the setup screen. */
  summary: string;
  rows: string[];
}

export const CUSTOM_MAPS: Record<string, CustomMap> = {};

/** Registers a map (a campaign adds its own); an invalid one is refused with the reason. */
export function registerCustomMap(map: CustomMap): CustomMap {
  validateCustomMap(map);
  CUSTOM_MAPS[map.id] = map;
  return map;
}

/** A map from JSON text: {"id": ..., "name": ..., "summary": ..., "rows": [...]}. */
export function parseCustomMap(json: string): CustomMap {
  const m = JSON.parse(json) as Partial<CustomMap>;
  if (typeof m.id !== 'string' || typeof m.name !== 'string' || !Array.isArray(m.rows)) throw new Error('Mapa: potrzebne pola id, name i rows.');
  return { id: m.id, name: m.name, summary: m.summary ?? '', rows: m.rows.map(String) };
}

export function validateCustomMap(map: CustomMap): void {
  const count = (ch: string) => map.rows.join('').split(ch).length - 1;
  for (const ch of ['T', 'D', 'H']) if (count(ch) !== 1) throw new Error(`Mapa ${map.id}: znak ${ch} musi wystąpić dokładnie raz.`);
  const bad = map.rows.join('').match(/[^.#=THD ]/);
  if (bad) throw new Error(`Mapa ${map.id}: nieznany znak „${bad[0]}”.`);
  if (map.rows.length < 3) throw new Error(`Mapa ${map.id}: za mało rzędów.`);
}

const bundled: CustomMap[] = [
  {
    id: 'ciesnina',
    name: 'Cieśnina',
    summary: 'Dwie cieśniny oddzielają brzegi od wyspy z Drzewem; przez każdą prowadzą trzy mosty.',
    rows: [
      '..#...#..',
      '..=...=..',
      '..#...#..',
      'D.=.T.=.H',
      '..#...#..',
      '..=...=..',
      '..#...#..',
    ],
  },
  {
    id: 'dolina',
    name: 'Dolina',
    summary: 'Otwarta dolina z dwoma skalnymi grzbietami; Drzewo pośrodku, bazy na brzegach.',
    rows: [
      '.........',
      '..##.##..',
      '.........',
      'D...T...H',
      '.........',
      '..##.##..',
      '.........',
    ],
  },
];
for (const m of bundled) registerCustomMap(m);
