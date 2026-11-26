// Ready scenarios (backlog 98): a hand-made map with its goal, size and level of complexity, picked from a list as in the classic games
// (the new-game wizard's "Gotowy scenariusz"). A scenario only fills in the switches that already exist (tier, goal, shape 'custom' and its
// map, map size); the seats, the factions and the levels of the bots are chosen at the table as in any Potyczka.

import type { MapSize } from './data';
import { CUSTOM_MAPS } from './customMaps';
import type { Tier } from './presets';
import type { ObjectiveId } from './types';

export interface Scenario {
  id: string;
  /** The map (customMaps.ts / scenarioMaps.ts); the scenario takes its name and its rows from it. */
  mapId: string;
  mapSize: MapSize;
  tier: Exclude<Tier, 'adventure' | 'custom'>;
  objective: ObjectiveId;
  /** A few sentences for the scenario's page: the mood and what the map asks for. */
  description: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'krag-kamieni', mapId: 'krag-kamieni', mapSize: 'short', tier: 'expedition', objective: 'control', description: 'Mały krąg, krótka partia: trzy punkty kontrolne tuż obok siebie, więc walka zaczyna się od pierwszej rundy. Dobry na szybką rozgrywkę.' },
  { id: 'ciesnina', mapId: 'ciesnina', mapSize: 'medium', tier: 'expedition', objective: 'crystals', description: 'Klasyczna opowieść o kryształach na mapie z dwiema cieśninami. Mosty są wąskie: Horda może je bronić, Przymierze musi je przejść.' },
  { id: 'brod-trzech-rzek', mapId: 'brod-trzech-rzek', mapSize: 'medium', tier: 'expedition', objective: 'crystals', description: 'Kryształy leżą po obu brzegach rzek. Każdy bród to wąskie gardło, a strażnicy lubią stać tuż przy wodzie.' },
  { id: 'dolina', mapId: 'dolina', mapSize: 'medium', tier: 'expedition', objective: 'control', description: 'Otwarta dolina z dwoma grzbietami: punkty kontrolne trzeba utrzymać, a skały dzielą pole na trzy drogi.' },
  { id: 'klepsydra', mapId: 'klepsydra', mapSize: 'long', tier: 'expedition', objective: 'survival', description: 'Przymierze broni przesmyku przy Drzewie, a fale Hordy napływają z szerokiej krainy po drugiej stronie. Wytrzymaj do końca.' },
  { id: 'przelecz-wichrow', mapId: 'przelecz-wichrow', mapSize: 'long', tier: 'expedition', objective: 'boss', description: 'W sercu przełęczy śpi potwór. Obie strony chcą zadać mu ostatni cios, a skalne przejścia sprzyjają zasadzkom.' },
  { id: 'blizniacze-doliny', mapId: 'blizniacze-doliny', mapSize: 'medium', tier: 'kingdom', objective: 'crystals', description: 'Pierwsze osady i złoto: każda dolina ma swoje kopalnie, a kryształy czekają po obu stronach grzbietów.' },
  { id: 'wyspy-mgiel', mapId: 'wyspy-mgiel', mapSize: 'long', tier: 'kingdom', objective: 'artifact', description: 'Artefakt leży na środkowej wyspie. Mosty nie stoją naprzeciw siebie, więc droga z łupem do domu jest długa i kręta.' },
  { id: 'krete-wawozy', mapId: 'krete-wawozy', mapSize: 'long', tier: 'economy', objective: 'conquest', description: 'Osady ukryte w zakrętach wąwozów: zdobądź je i utrzymaj, zanim wróg zbierze surowce na oblężenie.' },
  { id: 'pierscien-gor', mapId: 'pierscien-gor', mapSize: 'veryLong', tier: 'economy', objective: 'control', description: 'Kotlina w pierścieniu gór i tylko dwie bramy do środka. Kto utrzyma punkty w kotlinie, ten wygra, ale gospodarka toczy się na zewnątrz.' },
  { id: 'lasy-pograniczne', mapId: 'lasy-pograniczne', mapSize: 'veryLong', tier: 'realm', objective: 'crystals', description: 'Wielka puszcza, dwóch bohaterów na stronę i magia: kryształy są rozrzucone daleko, więc liczy się każdy czar i każda droga na skróty.' },
  { id: 'delta', mapId: 'delta', mapSize: 'veryLong', tier: 'realm', objective: 'artifact', description: 'Trzy koryta rzeki i mosty w nieoczywistych miejscach. Artefakt trzeba donieść do domu, a magia przeciwnika może zablokować każdy most.' },
  { id: 'wielki-step', mapId: 'wielki-step', mapSize: 'huge', tier: 'empire', objective: 'relic', description: 'Ogromna równina i Odłamki Pierwotnej Iskry rozsiane po całym stepie. Pełnia mechanik frakcji: zbierz Odłamki i wznieś Relikt.' },
  { id: 'szczyt-swiata', mapId: 'szczyt-swiata', mapSize: 'giant', tier: 'empire', objective: 'conquest', description: 'Największa mapa gry. Osady leżą daleko od siebie, drogi są długie, a każda twierdza jest warta oblężenia. Na długi wieczór.' },
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

/** The name of a scenario: its map's. */
export const scenarioName = (s: Scenario): string => CUSTOM_MAPS[s.mapId]?.name ?? s.id;
