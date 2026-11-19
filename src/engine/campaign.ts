// The story campaign: a list of scenarios, each a game on a hand-drawn map with its own rules, goal, hero and story. It is plain data (see docs/KAMPANIA.md for how
// to add a scenario): the maps and their story notes are registered with the other custom maps (customMaps.ts, story.ts), the texts before and after a scenario live
// here, and `scenarioSetup` turns a scenario into the set-up of an ordinary game, marked with `setup.campaign` so that the screen knows to show the story and keep
// the progress. The engine plays the game exactly as it plays any other: nothing in the rules knows about the campaign.

import { registerCustomMap, type CustomMap } from './customMaps';
import { FACTION_HEROES } from './data';
import { createGame } from './game';
import { levelSettings, type Level, type ObjectiveId, type SetupOptions } from './types';
import { resolveTier, withRuleset, type Tier } from './presets';

export interface Scenario {
  id: string;
  title: string;
  /** One line for the list of scenarios. */
  tagline: string;
  /** What is told before the game, a paragraph at a time. */
  intro: string[];
  /** What is told after a win and after a loss. */
  win: string[];
  lose: string[];
  /** The rules of the game: a level of the ladder and the goal, the computer's difficulty and the hero of the player. */
  tier: Tier;
  objective: ObjectiveId;
  difficulty: Level;
  hero: string;
  /** The map of the scenario (registered in `CUSTOM_MAPS`, flagged `campaign`). */
  map: CustomMap;
}

export interface Campaign {
  id: string;
  name: string;
  tagline: string;
  scenarios: Scenario[];
  /** What is told when the last scenario is won. */
  ending: string[];
}

const dawnNote = (id: string, round: number, title: string, text: string) => ({ id, title, text, when: { round, faction: 'dawn' as const } });

const DAWN_CAMPAIGN: Campaign = {
  id: 'swit',
  name: 'Powrót Światła',
  tagline: 'Czarny Smok uderzył w Kryształowe Drzewo, a Przymierze Świtu rusza po trzy Kryształy Opieki.',
  scenarios: [
    {
      id: 'pierwsza-dolina',
      title: 'Pierwsza dolina',
      tagline: 'Strażnicy stoją na drodze do kryształów. Naucz się chodzić po krainie i walczyć.',
      intro: [
        'Drzewo słabnie, a rzeki mętnieją. Złoty Smok wzbija się nad ziemie Przymierza Świtu i leci po kryształy, które wypadły spomiędzy gałęzi.',
        'Kliknij podświetlone pole, żeby tam pójść. Kryształów pilnują strażnicy: pokonasz ich w bitwie, a zdobyte kryształy trzeba zanieść do Drzewa pośrodku mapy.',
      ],
      win: ['Kryształy wracają na gałęzie, a liście Drzewa na chwilę rozbłyskują. To dopiero początek: nie wszystkie Kryształy Opieki są jeszcze w domu.'],
      lose: ['Horda była szybsza, a światło Drzewa zgasło pod cieniem Czarnego Smoka. Spróbuj jeszcze raz i ruszaj od razu po kryształy.'],
      tier: 'adventure',
      objective: 'crystals',
      difficulty: 'kids',
      hero: 'goldDragon',
      map: {
        id: 'kampania-pierwsza-dolina',
        name: 'Pierwsza dolina',
        summary: 'Szeroka dolina z kilkoma skałami: dobre miejsce na pierwsze kroki.',
        campaign: true,
        rows: ['.........', '.#.....#.', '....#....', 'D...T...H', '....#....', '.#.....#.', '.........'],
        story: [
          dawnNote('s1-start', 1, 'Noc Utraconego Blasku', 'Dawno temu Drzewo rozświetlało całą krainę. Dziś jego liście gasną, a nad doliną krąży cień Czarnego Smoka. Trzeba odnaleźć kryształy, zanim zgaśnie ostatni liść.'),
          dawnNote('s1-wskazowka', 3, 'Wskazówka', 'Horda nie czeka. Jeśli jej bohater stanie przy Drzewie i wytrwa kilka rund, odprawi mroczny rytuał. Zanieś kryształy szybciej, niż ona zdąży.'),
        ],
      },
    },
    {
      id: 'gryfie-urwisko',
      title: 'Gryfie Urwisko',
      tagline: 'Gryf uwił gniazdo wysoko w skałach. Bohater zdobywa doświadczenie i artefakty.',
      intro: [
        'Drugi kryształ porwał Gryf, który uwił z niego gniazdo na urwisku, pełne błyskotek. Droga prowadzi wąskimi półkami skalnymi.',
        'Od teraz bohater zdobywa doświadczenie: po każdym awansie wybierz jedną z trzech umiejętności. W skrzyniach leżą artefakty, które zostają na stałe przy bohaterze.',
      ],
      win: ['Gryf odleciał z pustymi łapami, a kryształ znów lśni w koronie Drzewa. Zostało jeszcze jedno miejsce, w którym ukrywa się ostatni z nich: zatopione ruiny.'],
      lose: ['Skały okazały się zbyt strome, a Horda wyprzedziła cię pod Drzewem. Spróbuj jeszcze raz, tym razem zbierz po drodze artefakty.'],
      tier: 'expedition',
      objective: 'crystals',
      difficulty: 'normal',
      hero: 'unicornKing',
      map: {
        id: 'kampania-gryfie-urwisko',
        name: 'Gryfie Urwisko',
        summary: 'Skalne grzbiety i przełęcze; Drzewo w niecce, bazy po przeciwnych stronach.',
        campaign: true,
        rows: ['.#.......', '.#..###..', '..=......', 'D....T..H', '......=..', '..###..#.', '.......#.'],
        story: [
          dawnNote('s2-start', 1, 'Gryfie Gniazdo', 'Wysoko w skałach błyszczy gniazdo Gryfa, pełne zdobyczy. Gryf jest zły i nie odda kryształu bez walki. Król Jednorożców idzie na urwisko.'),
          dawnNote('s2-rozwoj', 3, 'Doświadczenie', 'Bohater, który wygrywa bitwy, rośnie w siłę. Gdy zdobędzie poziom, wybierz umiejętność: zostaje z nim do końca gry.'),
        ],
      },
    },
    {
      id: 'zatopione-ruiny',
      title: 'Zatopione Ruiny',
      tagline: 'Przez ruiny prowadzą mosty, a wokół stoją punkty kontrolne. Utrzymaj więcej punktów niż Horda.',
      intro: [
        'Trzeci kryształ zatonął w ruinach, które pilnuje wielogłowa Hydra. Woda otacza kamienne wyspy, a przez nie przerzucono kruche mosty.',
        'Tu nie wystarczy znaleźć kryształ: Horda chce zająć ruiny. Na mapie są punkty kontrolne, flagi, które trzyma ten, czyj bohater na nich stoi na koniec rundy. Trzymaj więcej punktów niż przeciwnik przez kilka rund z rzędu.',
      ],
      win: ['Ruiny są twoje, a Hydra wraca do wody. Kryształy leżą bezpiecznie, ale Czarny Smok wie już, gdzie jest Drzewo i zbiera siły na ostatni cios.'],
      lose: ['Horda opanowała mosty i flagi. Ustaw się na punktach wcześniej i nie oddawaj ich, a wygrasz.'],
      tier: 'expedition',
      objective: 'control',
      difficulty: 'normal',
      hero: 'ancientBear',
      map: {
        id: 'kampania-zatopione-ruiny',
        name: 'Zatopione Ruiny',
        summary: 'Kamienne wyspy połączone mostami; punkty kontrolne pośrodku.',
        campaign: true,
        rows: ['....#....', '.##.=.##.', '....#....', 'D.=.T.=.H', '....#....', '.##.=.##.', '....#....'],
        story: [
          dawnNote('s3-start', 1, 'Zatopione Ruiny', 'Dawno temu stało tu miasto, które pochłonęła rzeka. Dziś ruiny strzeże Hydra, a Horda patrzy na nie jak na twierdzę.'),
          dawnNote('s3-flagi', 3, 'Flagi', 'Punkt kontrolny trzyma ten, czyj bohater stoi na nim na koniec rundy. Środkowy jest wart 2, boczne po 1. Nie zostawiaj flag bez bohatera.'),
        ],
      },
    },
    {
      id: 'cien-nad-drzewem',
      title: 'Cień nad Drzewem',
      tagline: 'Ostatnia bitwa: osady, złoto i rekrutacja. Czarny Smok zbiera Hordę przy Drzewie.',
      intro: [
        'Trzy kryształy znów lśnią w koronie, ale Czarny Smok nie odpuszcza. Wokół Drzewa stoją osady, a w nich rekruci i złoto, o które trzeba walczyć.',
        'W osadzie kupisz budynki, wynajmiesz pomocników i artefakty. Dochód z osad i kopalni rośnie co rundę. Wejdź do osady, kliknij Radę Osady i zobacz drzewko budynków. Potem rusz po kryształy i zanieś je do Drzewa.',
      ],
      win: ['Drzewo rozbłyska jak w dniu, w którym rosło na szczycie świata. Czarny Smok odlatuje w ciemność, rzeki znów płyną czyste, a krainę wypełnia światło. Strażnicy mogą odpocząć.'],
      lose: ['Cień sięgnął Drzewa, a Horda ukończyła rytuał. Zbuduj koszary i rekrutuj, zanim ruszysz po kryształy.'],
      tier: 'kingdom',
      objective: 'crystals',
      difficulty: 'normal',
      hero: 'goldDragon',
      map: {
        id: 'kampania-cien-nad-drzewem',
        name: 'Cień nad Drzewem',
        summary: 'Duża kraina z ciemnymi lasami; Drzewo pośrodku, wokół osady do zdobycia.',
        campaign: true,
        rows: ['...........', '.##.....##.', '...#...#...', '...........', 'D...#T#...H', '...........', '...#...#...', '.##.....##.', '...........'],
        story: [
          dawnNote('s4-start', 1, 'Cień nad Drzewem', 'Ostatnia noc przed świtem. Czarny Smok krąży nad Drzewem, a Horda zbiera siły. Złoty Smok prowadzi Przymierze do ostatniej bitwy.'),
          dawnNote('s4-osady', 3, 'Osady', 'Osada daje złoto co rundę i miejsce na budynki. Zajmuj kolejne, rekrutuj pomocników i nie zapominaj o kryształach.'),
        ],
      },
    },
  ],
  ending: [
    'Kryształy wróciły do Drzewa, a Czarny Smok zniknął za horyzontem. Przymierze Świtu wygrało, ale Strażnicy wiedzą, że światło trzeba chronić.',
    'Dziękujemy za grę! Możesz teraz zagrać własną grę na dowolnej mapie i poziomie albo powtórzyć scenariusze z wyższą trudnością.',
  ],
};

/** The campaigns of the game (so far the Przymierze's). */
export const CAMPAIGNS: Campaign[] = [DAWN_CAMPAIGN];
for (const c of CAMPAIGNS) for (const s of c.scenarios) registerCustomMap(s.map);

export const campaignById = (id: string): Campaign | undefined => CAMPAIGNS.find((c) => c.id === id);

/** The set-up of the game of a scenario: the rules of its level of the ladder on its own map, with the hero of the story. */
export function scenarioSetup(campaign: Campaign, scenario: Scenario, seed: number): SetupOptions {
  const preset = levelSettings(scenario.difficulty, 'pvp');
  // The first level of the ladder has no hero growth and a fixed map; the campaign keeps its own map there, so the tier's picks are taken by hand.
  const sw = scenario.tier === 'adventure' ? { objective: scenario.objective, growth: false } : resolveTier(scenario.tier, { objective: scenario.objective, shape: 'custom', customMapId: scenario.map.id, growth: true });
  const base: SetupOptions = {
    mode: 'pvp',
    mapSize: 'short',
    battleMode: preset.battleMode,
    seed,
    // The Horde is the computer: the same bot as at every other table (a hero of the faction by the seed).
    seats: [
      { name: 'Gracz', faction: 'dawn', controller: 'human', heroId: scenario.hero },
      { name: 'Horda', faction: 'horde', controller: 'bot', heroId: FACTION_HEROES.horde[seed % FACTION_HEROES.horde.length] },
    ],
    rules: preset.rules,
  };
  const setup = withRuleset(base, true, sw.objective, 'custom', scenario.map.id, sw.growth, 'kingdom' in sw && sw.kingdom, 'economy' in sw && sw.economy, 'realm' in sw && sw.realm, 'empire' in sw && sw.empire);
  return { ...setup, campaign: { id: campaign.id, scenario: scenario.id } };
}

/** The scenario after this one, or null at the end of the campaign. */
export const nextScenario = (campaign: Campaign, scenario: Scenario): Scenario | null => campaign.scenarios[campaign.scenarios.indexOf(scenario) + 1] ?? null;

/** Where the setup of a game says it came from: the campaign and the scenario, or null for an ordinary game. */
export function scenarioOf(setup: Pick<SetupOptions, 'campaign'>): { campaign: Campaign; scenario: Scenario } | null {
  if (!setup.campaign) return null;
  const campaign = campaignById(setup.campaign.id);
  const scenario = campaign?.scenarios.find((s) => s.id === setup.campaign!.scenario);
  return campaign && scenario ? { campaign, scenario } : null;
}

/** For tests and tools: a game of the scenario, created. */
export const createScenarioGame = (campaign: Campaign, scenario: Scenario, seed = 1) => createGame(scenarioSetup(campaign, scenario, seed));
