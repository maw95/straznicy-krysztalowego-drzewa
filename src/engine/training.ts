// The training (backlog 60): short guided games, one for each level of complexity, that teach a new player what the level adds. Like the campaign it is plain data on top
// of an ordinary game: `trainingSetup` makes the set-up of a game (marked with `setup.training`), and the steps below say what the coach shows and which of the player's
// actions are let through at each moment. The engine knows nothing about it: the steps only read the state, and the screen holds the actions the step does not ask for
// (App.tsx `dispatch`). A step is done when its `done(state)` is true; the steps are done in order and a done step never opens again (`trainingIndex`).

import { registerCustomMap, type CustomMap } from './customMaps';
import { FACTION_HEROES } from './data';
import { createGame, activeHero, currentActor, legalHeroMoves } from './game';
import { mapNeighbors } from './map';
import { heroTileCost, type SiteKind } from './sites';
import { controlHolder } from './objectives';
import { distance, parseKey, type HexKey } from './hex';
import { resolveTier, withRuleset, type Tier } from './presets';
import { levelSettings, type RulesConfig, type Action, type GameState, type Level, type ObjectiveId, type SetupOptions } from './types';

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
  /** Treasures of the Przymierze from the start (the step about treasures needs some to show; the first level has none). Default 2. */
  startTreasures?: number;
  /** Experience of the Przymierze hero from the start (a training of hero growth: the first shrine then brings a level). */
  startXp?: number;
  /** Rules of this training on top of its level's (e.g. a shorter goal). */
  rules?: Partial<RulesConfig>;
  /**
   * Seeds whose maps suit the steps (the sites and points the steps lead to lie near the Przymierze): a training game takes one of them. Missing = any seed.
   * Found by `npx tsx scripts/sim/treningSeeds.ts <id>`.
   */
  seeds?: number[];
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
/** Everything a battle asks of the player, from picking the helpers to the last blow (for the steps in which another battle may break out). */
const anyBattle = (a: Action): boolean => inFight(a) || ['selectSupports', 'deployUnits', 'pickMirages', 'draftPick', 'pickGear', 'pickSpells'].includes(a.type);

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
 * The step of the hero's move on the cheapest way to `goal` (the pulsing hex on the map): Dijkstra over the terrain costs, through hexes the hero has not seen yet
 * as well (the way is read from the whole map, the screen shows only the next hex), around every guardian and group of neutrals but the goal's own. Null when the
 * step cannot be taken now (no points left).
 */
function stepTowards(s: GameState, goal: HexKey | null): CoachTarget | null {
  const hero = mine(s);
  if (!goal || !hero || s.phase !== 'adventure' || hero.pos === goal) return null;
  const guarded = new Set(Object.values(s.crystals).map((c) => c.at));
  const dist = new Map<HexKey, number>([[hero.pos, 0]]);
  const first = new Map<HexKey, HexKey>();
  const queue: HexKey[] = [hero.pos];
  while (queue.length) {
    queue.sort((a, b) => dist.get(a)! - dist.get(b)!);
    const k = queue.shift()!;
    if (k === goal) break;
    for (const n of mapNeighbors(s.tiles, k)) {
      if (n !== goal && guarded.has(n)) continue;
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

const nextStep = (s: GameState): CoachTarget | null => stepTowards(s, goalHex(s));

/** The hex of the first unused site of a kind (a shrine, a chest), or null. */
const siteHex = (s: GameState, kind: SiteKind): HexKey | null => Object.values(s.tiles).find((t) => t.site?.kind === kind && !t.site.used)?.key ?? null;
/** Whether the map had a site of the kind that is used now (or never had one: the step then has nothing to do). */
const siteDone = (s: GameState, kind: SiteKind): boolean => !Object.values(s.tiles).some((t) => t.site?.kind === kind && !t.site.used);
/** The nearest control point the Przymierze does not hold. */
function freePoint(s: GameState): HexKey | null {
  const hero = mine(s);
  if (!hero || !s.control) return null;
  const at = parseKey(hero.pos);
  return [...s.control.points].filter((k) => controlHolder(s, k) !== 'dawn').sort((a, b) => distance(parseKey(a), at) - distance(parseKey(b), at))[0] ?? null;
}

/** The hero's start hex is the one in `homes`; once the hero is elsewhere (or any round passed) the first step is done. */
const leftHome = (s: GameState): boolean => {
  const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn');
  return Boolean(hero && s.homes && hero.pos !== s.homes.dawn) || s.round > 1 || s.phase !== 'adventure';
};

// ------------------------------------------------------------------ the trainings

/** The steps every training of the first levels shares: the walk to the guardian and the walk to the Tree with the crystal. */
const STEP_RUCH: TrainingStep = {
  id: 'ruch',
  title: 'Ruch po mapie',
  text: 'To jest twój bohater. Kliknij podświetlone pole, żeby tam pójść. Każdy krok kosztuje punkty ruchu (po prawej), a nowe pola odkrywają się, gdy staniesz obok.',
  target: nextStep,
  allow: (a) => a.type === 'moveHero',
  done: leftHome,
};
const stepStrazy = (text: string): TrainingStep => ({
  id: 'strazy',
  title: 'Strażnik kryształu',
  text,
  target: nextStep,
  allow: (a) => MAP_ACTIONS.includes(a.type),
  done: (s) => s.phase !== 'adventure' || mine(s)?.crystals.length !== 0,
});
const STEP_DRZEWO: TrainingStep = {
  id: 'drzewo',
  title: 'Do Drzewa',
  text: 'Wygrałeś! Strażnik zostawił kryształ i bohater go niesie. Zanieś go na pole Drzewa pośrodku mapy: idź podświetlonymi polami.',
  target: nextStep,
  // Another guardian on the way may start another battle: it is played freely.
  allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a),
  done: (s) => s.phase === 'over',
};

const VALLEY = ['.........', '.#.....#.', '....#....', 'D...T...H', '....#....', '.#.....#.', '.........'];

const SPACER: Training = {
  id: 'spacer',
  level: 0,
  title: 'Spacer',
  tagline: 'Najprostsza gra, od 5 lat: spacer po krainie, pojedynek ze strażnikiem i kryształ dla Drzewa.',
  learn: ['jak chodzi bohater po mapie', 'jak wygląda pojedynek: „Atakuj” i „Pas”', 'jak zanieść kryształ do Drzewa'],
  startTreasures: 0,
  tier: 'adventure',
  objective: 'crystals',
  difficulty: 'zero',
  hero: 'goldDragon',
  map: { id: 'trening-spacer', name: 'Trening: Spacer', summary: 'Mała dolina na pierwszy spacer.', campaign: true, rows: VALLEY },
  intro: [
    'Witaj w Krainie Kryształowego Drzewa! To najprostsza wersja gry: chodzisz bohaterem po mapie, a gdy spotkasz strażnika, walczycie na zmianę, jeden na jednego.',
    'Gra poprowadzi cię krok po kroku: podświetlone pola i dymki pokażą, co kliknąć.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! Tak wygląda cała gra na poziomie Spacer. Gotowy na więcej? Spróbuj treningu „Przygoda”: tam walczy się już całymi drużynami na arenie.'],
  lose: ['Tym razem się nie udało: strażnik albo Horda okazali się szybsi. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    STEP_RUCH,
    stepStrazy('Kryształu pilnuje strażnik: jego pole zostało dla ciebie odsłonięte. Idź podświetlonymi polami w jego stronę. Gdy skończą ci się punkty ruchu, kliknij „Zakończ turę”. Wejście na pole strażnika zaczyna pojedynek: potwierdź „Do walki!”.'),
    {
      id: 'pojedynek',
      title: 'Pojedynek',
      text: 'Teraz pojedynek: ty i strażnik stajecie naprzeciw siebie i uderzacie na zmianę. Gdy jest twoja kolej, kliknij „Atakuj”. „Pas” oddaje ruch bez ataku. Wygra ten, kto pierwszy pokona przeciwnika.',
      allow: (a) => a.type === 'battleAttack' || a.type === 'endActivation',
      done: (s) => s.phase !== 'battle',
    },
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

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
    rows: VALLEY,
  },
  intro: [
    'Witaj w Krainie Kryształowego Drzewa! W tej krótkiej grze poznasz podstawy: jak chodzić po mapie, jak walczyć i jak zanieść kryształ do Drzewa.',
    'Zajmie to tylko kilka minut. Gra poprowadzi cię krok po kroku: podświetlone pola i dymki pokażą, co kliknąć.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! Tak wygląda cała gra: odkrywasz krainę, pokonujesz strażników i wracasz z łupem. Poznane zasady wystarczą, by zagrać Potyczkę na poziomie Przygoda.'],
  lose: ['Tym razem się nie udało: strażnik albo Horda okazali się szybsi. To tylko trening: spróbuj jeszcze raz, a bitwy pójdą ci lepiej.'],
  steps: [
    STEP_RUCH,
    stepStrazy('Kryształu pilnuje strażnik: jego pole zostało dla ciebie odsłonięte. Idź podświetlonymi polami w jego stronę. Gdy skończą ci się punkty ruchu, kliknij „Zakończ turę”. Wejście na pole strażnika zaczyna bitwę: potwierdź „Do walki!”.'),
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
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

const WYPRAWA: Training = {
  id: 'wyprawa',
  level: 2,
  title: 'Wyprawa',
  tagline: 'Bohater rośnie: doświadczenie, poziomy i umiejętności, artefakty ze skrzyń i nowy cel gry, punkty kontrolne.',
  learn: ['skąd bohater bierze doświadczenie i co daje awans', 'jak działają kapliczki i skrzynie z artefaktami', 'jak wygrać cel „Punkty kontrolne”'],
  needs: 'przygoda',
  tier: 'expedition',
  objective: 'control',
  difficulty: 'kids',
  hero: 'goldDragon',
  startXp: 1,
  // Two rounds in a row with more flags win the training (instead of the usual three or four).
  rules: { controlDawnExtra: -1 },
  seeds: [1, 16, 17, 18, 19, 24, 40, 45],
  map: { id: 'trening-wyprawa', name: 'Trening: Wyprawa', summary: 'Dolina z kapliczką, skrzynią i trzema flagami.', campaign: true, rows: VALLEY },
  intro: [
    'Na poziomie Wyprawa bohater rośnie: za walki i odwiedzone miejsca dostaje punkty doświadczenia (PD), zdobywa poziomy, wybiera umiejętności i zakłada artefakty.',
    'Od tego poziomu wybierasz też cel gry. W tym treningu grasz o punkty kontrolne.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Flagi są twoje! Tak wygląda Wyprawa: bohater rośnie z każdą walką i każdym odwiedzonym miejscem, a cel gry wybierasz sam. W Potyczce na tym poziomie czekają też inne cele: Przetrwanie, Boss i Artefakt.'],
  lose: ['Tym razem Horda utrzymała flagi dłużej. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    {
      id: 'cel',
      title: 'Nowy cel: punkty kontrolne',
      text: 'Na mapie stoją trzy flagi: punkty kontrolne. Wygrywa ten, kto przez kilka rund z rzędu utrzyma ich więcej niż przeciwnik (stan widać po prawej, w „Celach”). Zanim po nie ruszysz, poznaj rozwój bohatera.',
      ack: true,
      allow: () => false,
      done: (s) => s.phase === 'over',
    },
    {
      id: 'kapliczka',
      title: 'Kapliczka',
      text: 'Na mapie są miejsca, które pomagają bohaterowi. Idź podświetlonymi polami do kapliczki: pierwszy bohater, który na niej stanie, dostaje 2 punkty doświadczenia (PD).',
      target: (s) => stepTowards(s, siteHex(s, 'shrine')),
      allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a),
      done: (s) => siteDone(s, 'shrine') || s.phase === 'over',
    },
    {
      id: 'awans',
      title: 'Awans',
      text: 'Masz nowy poziom! Z każdym poziomem wybierasz jedną z trzech umiejętności: kliknij kartę tej, którą chcesz (prawy klik pokaże więcej). Poziom i PD widać pod portretem bohatera.',
      allow: (a) => anyBattle(a),
      done: (s) => {
        const hero = Object.values(s.heroes).find((h) => h.faction === 'dawn');
        return s.phase === 'over' || Boolean(hero && !hero.offer?.length && (hero.level ?? 1) >= 2);
      },
    },
    {
      id: 'skrzynia',
      title: 'Skrzynia',
      text: 'Teraz skrzynia: idź do niej podświetlonymi polami. Pierwszy bohater, który na niej stanie, dostaje artefakt.',
      target: (s) => stepTowards(s, siteHex(s, 'chest')),
      allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a),
      done: (s) => siteDone(s, 'chest') || s.phase === 'over',
    },
    {
      id: 'artefakt',
      title: 'Artefakty',
      text: 'Bohater dostał artefakt: okno obok mówi, co robi i gdzie go nosi. Kliknięcie portretu bohatera (po prawej) otwiera jego kartę, gdzie artefakty zakłada się i zdejmuje.',
      ack: true,
      allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a) || a.type === 'equipArtifact' || a.type === 'unequipArtifact',
      done: (s) => s.phase === 'over',
    },
    {
      id: 'flagi',
      title: 'Na flagi!',
      text: 'Ruszaj po flagi: idź podświetlonymi polami do najbliższej. Flaga jest twoja, dopóki stoi na niej twój bohater.',
      target: (s) => stepTowards(s, freePoint(s)),
      allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a) || a.type === 'equipArtifact' || a.type === 'unequipArtifact',
      done: (s) => Boolean(s.control?.points.some((k) => controlHolder(s, k) === 'dawn')) || s.phase === 'over',
    },
    {
      id: 'utrzymaj',
      title: 'Utrzymaj przewagę',
      text: 'Masz flagę! Środkowa liczy się podwójnie, więc najlepiej stanąć na niej (podświetlone pola prowadzą do niej). Potem zostań na fladze i kończ turę: wygrasz, gdy przez dwie rundy z rzędu będziesz mieć przewagę nad Hordą.',
      target: (s) => (s.control && controlHolder(s, s.control.points[0]) !== 'dawn' ? stepTowards(s, s.control.points[0]) : null),
      allow: (a) => MAP_ACTIONS.includes(a.type) || anyBattle(a) || a.type === 'equipArtifact' || a.type === 'unequipArtifact',
      done: (s) => s.phase === 'over',
    },
  ],
  free: 'Gotowe!',
};

export const TRAININGS: Training[] = [SPACER, PRZYGODA, WYPRAWA];
for (const t of TRAININGS) registerCustomMap(t.map);

export const trainingById = (id: string): Training | undefined => TRAININGS.find((t) => t.id === id);

/** The set-up of a training game: the rules of its level on its own map, one crystal to bring, the Horde as the easiest bot. */
export function trainingSetup(t: Training, pick = 1): SetupOptions {
  const seed = t.seeds ? t.seeds[Math.abs(pick) % t.seeds.length] : pick;
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
    rules: { ...preset.rules, crystalsNeededDelta: -1, dawnStartTreasures: { resurrections: 0, others: 0, random: t.startTreasures ?? 2 }, ...(t.startXp ? { dawnStartXp: t.startXp } : {}), ...t.rules },
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
