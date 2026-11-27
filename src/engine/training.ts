// The training (backlog 60): short guided games, one for each level of complexity, that teach a new player what the level adds. Like the campaign it is plain data on top
// of an ordinary game: `trainingSetup` makes the set-up of a game (marked with `setup.training`), and the steps below say what the coach shows and which of the player's
// actions are let through at each moment. The engine knows nothing about it: the steps only read the state, and the screen holds the actions the step does not ask for
// (App.tsx `dispatch`). A step is done when its `done(state)` is true; the steps are done in order and a done step never opens again (`trainingIndex`).

import { registerCustomMap, type CustomMap } from './customMaps';
import { FACTION_HEROES } from './data';
import { createGame, activeHero, currentActor, legalHeroMoves } from './game';
import { mapNeighbors } from './map';
import { heroTileCost } from './sites';
import { distance, parseKey, type HexKey } from './hex';
import { resolveTier, withRuleset, type Tier } from './presets';
import { levelSettings, type Action, type GameState, type Level, type ObjectiveId, type SetupOptions } from './types';

/** What the coach points at: a hex of the map, or an element of the screen (a `data-` attribute of a button, `[data-coach="name"]`). */
export type CoachTarget = { hex: HexKey } | { ui: string };

export interface TrainingStep {
  id: string;
  title: string;
  text: string;
  /** An explaining step: the coach shows "Dalej" and the player goes on when ready (the step lets the game be played meanwhile); it is also done when its `done` is true. */
  ack?: boolean;
  /** Where the ring pulses (the screen draws it); missing = nowhere. */
  target?: (s: GameState) => CoachTarget | null;
  /** The player's actions this step lets through; the rest is held (the coach shakes). */
  allow: (a: Action, s: GameState) => boolean;
  /** True when the step has been done, whatever the state was before: the steps are read in order. */
  done: (s: GameState) => boolean;
}

export interface Training {
  id: string;
  /** Position in the ladder of levels, 0 = Spacer. */
  level: number;
  title: string;
  tagline: string;
  /** "What you will learn", a line each. */
  learn: string[];
  /** The training to take first (advice only, nothing is locked). */
  needs?: string;
  tier: Tier;
  objective: ObjectiveId;
  difficulty: Level;
  hero: string;
  map: CustomMap;
  /** Said before the game, then after a win and after a loss. */
  intro: string[];
  win: string[];
  lose: string[];
  steps: TrainingStep[];
  /** What the coach says when the last step is done and the game goes on by itself. */
  free: string;
}

/** The rule every new player is told first (the author, 27.11): the game explains whatever is clicked with the right button (a long press on a phone). */
export const RIGHT_CLICK_RULE = 'Jeśli czegoś nie rozumiesz, kliknij to prawym przyciskiem myszy (na telefonie przytrzymaj palec): pokaże się wyjaśnienie.';

// ------------------------------------------------------------------ helpers of the steps

const mine = (s: GameState) => activeHero(s);
const inBattle = (s: GameState, stages: string[]) => s.phase === 'battle' && s.battle !== null && stages.includes(s.battle.stage);
const MAP_ACTIONS: Action['type'][] = ['moveHero', 'endTurn'];
/** The player's actions in a fight on the arena (moving, striking, abilities, treasures, ending the move). */
const inFight = (a: Action): boolean => a.type.startsWith('battle') || a.type === 'endActivation';

/** The hex where the player's hero should go next: the Tree when it carries a crystal, else the nearest crystal on the map (with its guardian). */
function goalHex(s: GameState): HexKey | null {
  const hero = mine(s);
  if (!hero) return null;
  if (hero.crystals.length > 0) return Object.values(s.tiles).find((t) => t.tree)?.key ?? null;
  const at = parseKey(hero.pos);
  let best: { key: HexKey; d: number } | null = null;
  for (const c of Object.values(s.crystals)) {
    if (c.decoy || c.at.includes(':') || c.at === 'tree') continue;
    const d = distance(at, parseKey(c.at));
    if (!best || d < best.d) best = { key: c.at, d };
  }
  return best?.key ?? null;
}

/**
 * The step of the hero's move on the cheapest way to `goalHex` (the pulsing hex on the map): Dijkstra over the terrain costs, through hexes the hero has not seen yet
 * as well (the way is read from the whole map, the screen shows only the next hex). Null when the step cannot be taken now (no points left).
 */
function nextStep(s: GameState): CoachTarget | null {
  const goal = goalHex(s);
  const hero = mine(s);
  if (!goal || !hero || s.phase !== 'adventure') return null;
  const dist = new Map<HexKey, number>([[hero.pos, 0]]);
  const first = new Map<HexKey, HexKey>();
  const queue: HexKey[] = [hero.pos];
  while (queue.length) {
    queue.sort((a, b) => dist.get(a)! - dist.get(b)!);
    const k = queue.shift()!;
    if (k === goal) break;
    for (const n of mapNeighbors(s.tiles, k)) {
      const cost = n === goal ? 1 : heroTileCost(hero, s.tiles[n]);
      if (cost === null) continue;
      const d = dist.get(k)! + cost;
      if (d < (dist.get(n) ?? Infinity)) {
        dist.set(n, d);
        first.set(n, k === hero.pos ? n : first.get(k)!);
        queue.push(n);
      }
    }
  }
  const step = first.get(goal);
  return step && legalHeroMoves(s).some((m) => m.to === step) ? { hex: step } : null;
}

/** The hero's start hex is the one in `homes`; once the hero is elsewhere (or any round passed) the first step is done. */
const leftHome = (s: GameState): boolean => {
  const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn');
  return Boolean(hero && s.homes && hero.pos !== s.homes.dawn) || s.round > 1 || s.phase !== 'adventure';
};

// ------------------------------------------------------------------ the trainings

const PRZYGODA: Training = {
  id: 'przygoda',
  level: 1,
  title: 'Przygoda',
  tagline: 'Pierwsza wyprawa po kryształ: ruch po mapie, strażnik, bitwa na arenie i droga do Drzewa.',
  learn: ['jak chodzi bohater po mapie i odsłania pola', 'jak walczy się ze strażnikiem na arenie', 'jak zanieść kryształ do Drzewa'],
  tier: 'adventure',
  objective: 'crystals',
  difficulty: 'kids',
  hero: 'goldDragon',
  map: {
    id: 'trening-przygoda',
    name: 'Trening: Przygoda',
    summary: 'Mała dolina z kilkoma skałami: dobre miejsce na pierwsze kroki.',
    campaign: true,
    rows: ['.........', '.#.....#.', '....#....', 'D...T...H', '....#....', '.#.....#.', '.........'],
  },
  intro: [
    'Witaj w Krainie Kryształowego Drzewa! W tej krótkiej grze poznasz podstawy: jak chodzić po mapie, jak walczyć i jak zanieść kryształ do Drzewa.',
    'Zajmie to tylko kilka minut. Gra poprowadzi cię krok po kroku: podświetlone pola i dymki pokażą, co kliknąć.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! Tak wygląda cała gra: odkrywasz krainę, pokonujesz strażników i wracasz z łupem. Poznane zasady wystarczą, by zagrać Potyczkę na poziomie Przygoda.'],
  lose: ['Tym razem Horda była szybsza. To tylko trening: spróbuj jeszcze raz, a bitwy pójdą ci lepiej.'],
  steps: [
    {
      id: 'ruch',
      title: 'Ruch po mapie',
      text: 'To jest twój bohater. Kliknij podświetlone pole, żeby tam pójść. Każdy krok kosztuje punkty ruchu (u góry), a nowe pola odkrywają się, gdy staniesz obok.',
      target: nextStep,
      allow: (a) => a.type === 'moveHero',
      done: leftHome,
    },
    {
      id: 'strazy',
      title: 'Strażnik kryształu',
      text: 'Kryształu pilnuje strażnik: jego pole zostało dla ciebie odsłonięte. Idź podświetlonymi polami w jego stronę. Gdy skończą ci się punkty ruchu, kliknij „Zakończ turę”. Wejście na pole strażnika zaczyna bitwę: potwierdź „Do walki!”.',
      target: nextStep,
      allow: (a) => MAP_ACTIONS.includes(a.type),
      done: (s) => s.phase !== 'adventure' || mine(s)?.crystals.length !== 0,
    },
    {
      id: 'pomocnicy',
      title: 'Pomocnicy',
      text: 'Zaczyna się bitwa. Wybierz dwóch pomocników: kliknij dwie karty, potem „Do bitwy!”. Każdy ma swój atak, życie i zdolność, a prawy klik na karcie pokaże więcej.',
      allow: (a) => ['selectSupports', 'draftPick', 'pickGear', 'pickSpells'].includes(a.type),
      done: (s) => !inBattle(s, ['gear', 'spells', 'select', 'draft']),
    },
    {
      id: 'ustawienie',
      title: 'Ustawienie wojska',
      text: 'Teraz ustaw wojsko: kliknij jednostkę, a potem złote pole w swojej kolumnie. Gdy będziesz gotowy, kliknij „Gotowe — do bitwy”.',
      allow: (a) => ['deployUnits', 'pickMirages'].includes(a.type),
      done: (s) => !inBattle(s, ['deploy']),
    },
    {
      id: 'walka',
      title: 'Ruch i atak',
      text: 'Jednostki działają po kolei; kolejkę widać na dole. Gdy przychodzi twoja, podświetlone pola pokazują, dokąd może dojść: kliknij takie pole, żeby tam pójść, a potem kliknij wroga w zasięgu, żeby uderzyć. Przycisk „Koniec” kończy ruch jednostki, gdy nie ma już nic do zrobienia.',
      ack: true,
      allow: inFight,
      done: (s) => s.phase !== 'battle',
    },
    {
      id: 'zdolnosci',
      title: 'Zdolności',
      text: 'Wiele jednostek ma zdolność: jej ikona stoi obok przycisku „Koniec” (klawisz Z). Zdolność bohatera i pomocnika działa raz na bitwę, więc wybierz dobry moment. Prawy klik na ikonie opisze, co robi.',
      ack: true,
      allow: inFight,
      done: (s) => s.phase !== 'battle',
    },
    {
      id: 'skarby',
      title: 'Skarby',
      text: 'Skarby to jednorazowe karty twojej frakcji. Ikona „Skarby” w rogu areny (klawisz S) otwiera skrzynię: użyj skarbu przed akcją jednostki. Prawy klik na skarbie pokaże, co robi. Pokonaj teraz strażnika!',
      allow: inFight,
      done: (s) => s.phase !== 'battle',
    },
    {
      id: 'drzewo',
      title: 'Do Drzewa',
      text: 'Wygrałeś! Strażnik zostawił kryształ i bohater go niesie. Zanieś go na pole Drzewa pośrodku mapy: idź podświetlonymi polami.',
      target: nextStep,
      allow: (a) => a.type === 'moveHero' || a.type === 'endTurn',
      done: (s) => s.phase === 'over',
    },
  ],
  free: 'Gotowe!',
};

export const TRAININGS: Training[] = [PRZYGODA];
for (const t of TRAININGS) registerCustomMap(t.map);

export const trainingById = (id: string): Training | undefined => TRAININGS.find((t) => t.id === id);

/** The set-up of a training game: the rules of its level on its own map, one crystal to bring, the Horde as the easiest bot. */
export function trainingSetup(t: Training, seed = 1): SetupOptions {
  const preset = levelSettings(t.difficulty, 'pvp');
  const sw = t.tier === 'adventure' ? { objective: t.objective, growth: false } : resolveTier(t.tier, { objective: t.objective, shape: 'custom', customMapId: t.map.id, growth: true });
  const base: SetupOptions = {
    mode: 'pvp',
    mapSize: 'short',
    battleMode: preset.battleMode,
    seed,
    seats: [
      { name: 'Gracz', faction: 'dawn', controller: 'human', heroId: t.hero },
      { name: 'Horda', faction: 'horde', controller: 'bot', heroId: FACTION_HEROES.horde[seed % FACTION_HEROES.horde.length], botLevel: 'kids' },
    ],
    // Two treasures from the start, so that the step about them has something to show.
    rules: { ...preset.rules, crystalsNeededDelta: -1, dawnStartTreasures: { resurrections: 0, others: 0, random: 2 } },
    seatLevels: true,
  };
  const setup = withRuleset(base, true, sw.objective, 'custom', t.map.id, sw.growth, 'kingdom' in sw && sw.kingdom, 'economy' in sw && sw.economy, 'realm' in sw && sw.realm, 'empire' in sw && sw.empire);
  return { ...setup, training: { id: t.id } };
}

/** The training a set-up belongs to, or null for an ordinary game. */
export const trainingOf = (setup: Pick<SetupOptions, 'training'>): Training | null => (setup.training ? (trainingById(setup.training.id) ?? null) : null);

/** The first step from `from` that is not done yet (the steps open in order; the result is the step count when all are done). */
export function trainingIndex(t: Training, s: GameState, from = 0): number {
  let i = from;
  while (i < t.steps.length && t.steps[i].done(s)) i++;
  return i;
}

/** Does the training let the player do this now? Only the human's own moves are held; with every step done everything goes. */
export function trainingAllows(t: Training, s: GameState, index: number, a: Action): boolean {
  if (currentActor(s).kind !== 'human') return true;
  // The windows that cannot be closed without an answer (a found treasure, a level-up) never get stuck.
  if (a.type === 'chooseTreasure' || a.type === 'chooseSkill') return true;
  const step = t.steps[index];
  return !step || step.allow(a, s);
}

/** For tests and tools: a game of the training, created. */
export const createTrainingGame = (t: Training, seed = 1) => createGame(trainingSetup(t, seed));
