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
import { dwellingOf, recruitsOf } from './kingdom';
import { freeCommanders } from './realm';
import { manaOf, maxMana } from './magic';
import { shardsOf, shardTotal, sparkOwner } from './empire';
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
  /** What the step asks for when it is not a walk (a building, a recruit): the action a player following the coach takes (tests, seed search). */
  hint?: (s: GameState) => Action | null;
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
/** What a player does on the map in the free steps: walking, ending the turn, the settlements and the gear. */
const mapPlay = (a: Action): boolean => MAP_ACTIONS.includes(a.type) || a.type.startsWith('kingdom') || a.type === 'equipArtifact' || a.type === 'unequipArtifact';
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
/**
 * The walk to the guardian. With battle steps after it (Spacer, Przygoda) it is done when the battle starts; in the later trainings, which teach no battle, it lasts
 * until the crystal is taken (else the next step, "you won", would show during the fight).
 */
const stepStrazy = (text: string, untilCrystal = false): TrainingStep => ({
  id: 'strazy',
  title: 'Strażnik kryształu',
  text,
  target: nextStep,
  allow: (a) => mapPlay(a) || anyBattle(a),
  done: (s) => s.phase === 'over' || (untilCrystal ? Object.values(s.heroes).some((h) => h.faction === 'dawn' && h.crystals.length > 0) : s.phase !== 'adventure' || mine(s)?.crystals.length !== 0),
});
const STEP_DRZEWO: TrainingStep = {
  id: 'drzewo',
  title: 'Do Drzewa',
  text: 'Wygrałeś! Strażnik zostawił kryształ i bohater go niesie. Zanieś go na pole Drzewa pośrodku mapy: idź podświetlonymi polami.',
  target: nextStep,
  // Another guardian on the way may start another battle: it is played freely.
  allow: (a) => mapPlay(a) || anyBattle(a),
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

/** The Przymierze's capital (its start settlement) in the levels with settlements. */
const capital = (s: GameState) => Object.values(s.kingdom?.settlements ?? {}).find((x) => x.land === 'dawn' && x.id.startsWith('start')) ?? null;
/** The nearest hex of a kind of place (a mine, a settlement) the Przymierze does not own yet. */
function unowned(s: GameState, kind: 'mine' | 'settlement'): HexKey | null {
  const hero = mine(s);
  const k = s.kingdom;
  if (!hero || !k) return null;
  const at = parseKey(hero.pos);
  const hexes = kind === 'mine' ? Object.entries(k.mines).filter(([, m]) => m.owner !== 'dawn').map(([h]) => h) : Object.values(k.settlements).filter((x) => x.owner !== 'dawn').map((x) => x.at);
  return hexes.sort((a, b) => distance(parseKey(a), at) - distance(parseKey(b), at))[0] ?? null;
}
const recruited = (s: GameState) => s.factions.dawn.supportsAlive.some((id) => (recruitsOf(s, 'dawn').find((r) => r.id === id)?.tier ?? 1) >= 2);

const OSADA: Training = {
  id: 'osada',
  level: 3,
  title: 'Osada',
  tagline: 'Złoto, osady i kopalnie: budowa koszar, rekrutacja pomocnika i przejmowanie osad na mapie.',
  learn: ['skąd bierze się złoto', 'jak wejść do osady i postawić budynek', 'jak zrekrutować pomocnika', 'jak przejąć kopalnię i osadę'],
  needs: 'wyprawa',
  tier: 'kingdom',
  objective: 'crystals',
  difficulty: 'kids',
  hero: 'goldDragon',
  rules: { dawnStartGold: 4 },
  seeds: [3, 24, 28, 29, 34, 35, 36, 56],
  map: { id: 'trening-osada', name: 'Trening: Osada', summary: 'Dolina ze stolicą, wolną osadą i kopalniami.', campaign: true, rows: VALLEY },
  intro: [
    'Na poziomie Osada pojawia się złoto. Przynoszą je osady i kopalnie, a wydajesz je w osadach: na budynki i na nowych pomocników do drużyny.',
    'Cel gry jest znany z Przygody: kryształ do Drzewa. Tym razem po drodze zbudujesz swoją pierwszą osadę.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie, a twoja osada rośnie! W Potyczce na poziomie Osada budynków jest więcej: targ z artefaktami, szpital dla poległych pomocników i skarbiec, który zwiększa dochód.'],
  lose: ['Tym razem się nie udało. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    {
      id: 'zloto',
      title: 'Złoto',
      text: 'Masz złoto: jego stan i dochód na rundę widać na dolnym pasku. Co rundę każda twoja osada przynosi +2 zł, a każda kopalnia +1 zł. Na start dostajesz trochę więcej, żeby od razu coś zbudować.',
      ack: true,
      allow: () => false,
      done: (s) => s.phase === 'over',
    },
    {
      id: 'koszary',
      title: 'Budowa koszar',
      text: 'Twój bohater stoi w stolicy. Kliknij „Wejdź do osady” po prawej, potem Radę Osady (budynek pośrodku). W drzewku budynków wybierz Koszary i kliknij „Zbuduj” (3 zł).',
      allow: (a) => a.type.startsWith('kingdom'),
      hint: (s) => (capital(s) ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'barracks' } : null),
      done: (s) => (capital(s)?.buildings.barracks ?? 1) >= 1 || s.phase === 'over',
    },
    {
      id: 'rekrutacja',
      title: 'Rekrutacja',
      text: 'Koszary stoją! Kliknij je w osadzie: zobaczysz karty jednostek. Wybierz jednostkę poziomu 2 i kliknij „Rekrutuj” (3 zł): dołączy do drużyny bohatera. Drużyna może urosnąć do pięciu pomocników.',
      allow: (a) => a.type.startsWith('kingdom'),
      hint: (s) => {
        const r = recruitsOf(s, 'dawn').find((x) => x.tier === 2 && !s.factions.dawn.supportsAlive.includes(x.id));
        return capital(s) && r ? { type: 'kingdomRecruit', settlementId: capital(s)!.id, unitId: r.id } : null;
      },
      done: (s) => recruited(s) || s.phase === 'over',
    },
    {
      id: 'kopalnia',
      title: 'Kopalnia',
      text: 'Zamknij okno osady i idź podświetlonymi polami do kopalni złota. Gdy na niej staniesz, będzie twoja i co rundę przyniesie +1 zł.',
      target: (s) => stepTowards(s, unowned(s, 'mine')),
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => Object.values(s.kingdom?.mines ?? {}).some((m) => m.owner === 'dawn') || s.phase === 'over',
    },
    {
      id: 'przejecie',
      title: 'Wolna osada',
      text: 'Na mapie jest też wolna osada. Pilnują jej neutralni, więc wejście zaczyna bitwę; po wygranej osada przechodzi na twoją stronę i co rundę daje +2 zł. Pilnuj swoich osad: Horda też może je zająć.',
      target: (s) => stepTowards(s, unowned(s, 'settlement')),
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => Object.values(s.kingdom?.settlements ?? {}).filter((x) => x.owner === 'dawn').length >= 2 || s.phase === 'over',
    },
    stepStrazy('Teraz to, co znasz z Przygody: kryształu pilnuje strażnik (jego pole zostało odsłonięte). Idź podświetlonymi polami w jego stronę i pokonaj go, a nowy pomocnik pomoże ci w bitwie.', true),
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

/** The Przymierze's main hero (not a commander from the tavern). */
const mainHero = (s: GameState) => Object.values(s.heroes).find((h) => h.faction === 'dawn' && !h.secondary) ?? null;
/** The nearest mine of wood or ore the Przymierze does not hold. */
function freeResourceMine(s: GameState): HexKey | null {
  const hero = mine(s);
  if (!hero || !s.kingdom) return null;
  const at = parseKey(hero.pos);
  return Object.entries(s.kingdom.mines).filter(([, m]) => (m.res === 'wood' || m.res === 'ore') && m.owner !== 'dawn').map(([h]) => h).sort((a, b) => distance(parseKey(a), at) - distance(parseKey(b), at))[0] ?? null;
}
const resOfDawn = (s: GameState, r: 'wood' | 'ore' | 'dust') => s.kingdom?.res?.dawn[r] ?? 0;
const built = (s: GameState, b: 'treasury' | 'market' | 'tavern' | 'barracks') => (capital(s)?.buildings[b] ?? 0) >= 1;
/** What an explaining step lets the player do in the settlement meanwhile. */
const inSettlement = (a: Action) => a.type.startsWith('kingdom') || a.type === 'endTurn';

const KSIESTWO: Training = {
  id: 'ksiestwo',
  level: 4,
  title: 'Księstwo',
  tagline: 'Drewno, ruda i Gwiezdny Pył: wymiana na targu, budynki za surowce, tartaki i kopalnie, garnizon w osadzie.',
  learn: ['jakie są surowce i skąd się biorą', 'jak kupić surowiec za złoto', 'jak zostawić garnizon, który broni osady', 'jak przejąć tartak albo kopalnię rudy'],
  needs: 'osada',
  tier: 'economy',
  objective: 'crystals',
  difficulty: 'kids',
  hero: 'goldDragon',
  rules: { dawnStartGold: 11 },
  seeds: [1, 3, 4, 5, 6, 7, 8, 9],
  map: { id: 'trening-ksiestwo', name: 'Trening: Księstwo', summary: 'Dolina ze stolicą, tartakiem i kopalniami.', campaign: true, rows: VALLEY },
  intro: [
    'Na poziomie Księstwo obok złota są trzy surowce: drewno, ruda i Gwiezdny Pył. Budynki kosztują teraz także surowce, a osady broni garnizon.',
    'Cel gry jest znany: kryształ do Drzewa. Najpierw jednak zadbasz o stolicę.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! W Potyczce na poziomie Księstwo czekają jeszcze kuźnia, fosa i mury, chatki z zadaniami, młyny i studnie, a także nowy cel gry: Podbój.'],
  lose: ['Tym razem się nie udało. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    {
      id: 'surowce',
      title: 'Surowce',
      text: 'Na dolnym pasku obok złota widać drewno, rudę i Gwiezdny Pył (zapas i dochód na rundę). Drewno i ruda idą na budynki, Pył na rzeczy rzadkie: czary, legendarne artefakty, drogie budynki. Masz 3 drewna i trochę złota.',
      ack: true,
      allow: () => false,
      done: (s) => s.phase === 'over',
    },
    {
      id: 'targ',
      title: 'Targ',
      text: 'Kliknij „Wejdź do osady”, potem Radę Osady (budynek pośrodku). W drzewku budynków wybierz Targ i kliknij „Zbuduj”: tym razem cena to złoto i drewno (3 zł i 2 drewna).',
      allow: (a) => a.type === 'kingdomBuild' && a.building === 'market',
      hint: (s) => (capital(s) ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'market' } : null),
      done: (s) => built(s, 'market') || s.phase === 'over',
    },
    {
      id: 'wymiana',
      title: 'Wymiana surowców',
      text: 'Rudy jeszcze nie masz, ale targ ją sprzeda. Wróć z drzewka do osady (strzałka w prawym dolnym rogu), kliknij Targ i w „Wymianie surowców” kup 2 rudy (po 3 zł).',
      allow: (a) => a.type === 'kingdomTrade' && a.res === 'ore' && a.dir === 'buy',
      hint: (s) => (capital(s) ? { type: 'kingdomTrade', settlementId: capital(s)!.id, res: 'ore', dir: 'buy' } : null),
      done: (s) => resOfDawn(s, 'ore') >= 2 || built(s, 'treasury') || s.phase === 'over',
    },
    {
      id: 'skarbiec',
      title: 'Budynek za surowce',
      text: 'Masz rudę! Zamknij okno targu, wejdź do Rady Osady, wybierz Skarbiec i kliknij „Zbuduj” (4 zł i 2 rudy): co rundę przyniesie +1 zł. Cenę każdego budynku widać w jego przycisku.',
      allow: (a) => a.type === 'kingdomBuild' && a.building === 'treasury',
      hint: (s) => (capital(s) ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'treasury' } : null),
      done: (s) => built(s, 'treasury') || s.phase === 'over',
    },
    {
      id: 'garnizon',
      title: 'Garnizon',
      text: 'Na tym poziomie wróg nie zajmie osady samym wejściem, jeśli zostawisz w niej garnizon: musi go pokonać w bitwie o osadę. Na dolnym pasku osady, przy „Garnizon”, kliknij jednego pomocnika z drużyny, żeby go zostawić.',
      allow: (a) => a.type === 'kingdomGarrison' && a.dir === 'in',
      hint: (s) => {
        const id = s.factions.dawn.supportsAlive[0];
        return capital(s) && id ? { type: 'kingdomGarrison', settlementId: capital(s)!.id, unitId: id, dir: 'in' } : null;
      },
      done: (s) => (capital(s)?.garrison?.length ?? 0) >= 1 || s.phase === 'over',
    },
    {
      id: 'tartak',
      title: 'Tartak i kopalnia rudy',
      text: 'Surowce dają też miejsca na mapie: tartak (+1 drewna na rundę) i kopalnia rudy (+1 rudy). Zamknij okno osady i idź podświetlonymi polami do najbliższego: stanie się twoje, gdy na nim staniesz.',
      target: (s) => stepTowards(s, freeResourceMine(s)),
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => Object.values(s.kingdom?.mines ?? {}).some((m) => (m.res === 'wood' || m.res === 'ore') && m.owner === 'dawn') || s.phase === 'over',
    },
    stepStrazy('Teraz kryształ: jego strażnik czeka na odsłoniętym polu. Idź podświetlonymi polami i pokonaj go. Garnizon zostaje w stolicy, więc w bitwie masz jednego pomocnika mniej.', true),
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

const KROLESTWO: Training = {
  id: 'krolestwo',
  level: 5,
  title: 'Królestwo',
  tagline: 'Drugi bohater z karczmy, typ i specjalność bohatera, mana i czar w bitwie.',
  learn: ['co dają typ i specjalność bohatera', 'jak zbudować karczmę i nająć dowódcę', 'jak rzucić czar w bitwie'],
  needs: 'ksiestwo',
  tier: 'realm',
  objective: 'crystals',
  difficulty: 'kids',
  hero: 'goldDragon',
  rules: { dawnStartGold: 14, dawnStartRes: { wood: 2 } },
  seeds: [1, 3, 4, 5, 6, 7, 8, 9],
  map: { id: 'trening-krolestwo', name: 'Trening: Królestwo', summary: 'Dolina ze stolicą i jednym strażnikiem.', campaign: true, rows: VALLEY },
  intro: [
    'Na poziomie Królestwo możesz mieć drugiego bohatera, dowódcę z karczmy, a bohaterowie mają manę i czary.',
    'Cel gry jest znany: kryształ do Drzewa. Tym razem w bitwie ze strażnikiem użyjesz magii.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! W Potyczce na poziomie Królestwo w wieży maga nauczysz się kolejnych czarów, także na mapie: Wizja odkrywa pola, Przyspieszenie daje punkty ruchu, a Wrota przenoszą do osady.'],
  lose: ['Tym razem się nie udało. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    {
      id: 'typ',
      title: 'Typ i specjalność',
      text: 'Każdy bohater ma typ (wojownik, łowca albo mędrzec), który wzmacnia go przy każdym awansie, i specjalność, czyli własną premię. Kliknij portret bohatera po prawej: zobaczysz je na jego karcie, razem z maną i czarami.',
      ack: true,
      allow: () => false,
      done: (s) => s.phase === 'over',
    },
    {
      id: 'targ',
      title: 'Targ',
      text: 'Dowódcę najmuje się w karczmie, a karczmę stawia się po targu. Kliknij „Wejdź do osady”, potem Radę Osady, wybierz Targ i kliknij „Zbuduj” (3 zł i 2 drewna).',
      allow: (a) => a.type === 'kingdomBuild' && a.building === 'market',
      hint: (s) => (capital(s) ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'market' } : null),
      done: (s) => built(s, 'market') || built(s, 'tavern') || s.phase === 'over',
    },
    {
      id: 'karczma',
      title: 'Karczma',
      text: 'Targ stoi! W drzewku budynków wybierz teraz Karczmę i kliknij „Zbuduj” (5 zł i 3 drewna).',
      allow: (a) => a.type === 'kingdomBuild' && a.building === 'tavern',
      hint: (s) => (capital(s) ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'tavern' } : null),
      done: (s) => built(s, 'tavern') || s.phase === 'over',
    },
    {
      id: 'dowodca',
      title: 'Dowódca',
      text: 'Kliknij karczmę w osadzie. Do wyboru są trzy typy dowódców: wojownik, łucznik i mędrzec. Wybierz jednego i kliknij „Najmij” (8 zł).',
      allow: (a) => a.type === 'kingdomHire',
      hint: (s) => {
        const id = freeCommanders(s, 'dawn')[0];
        return capital(s) && id ? { type: 'kingdomHire', settlementId: capital(s)!.id, unitId: id } : null;
      },
      done: (s) => Object.values(s.heroes).some((h) => h.faction === 'dawn' && h.secondary) || s.phase === 'over',
    },
    {
      id: 'dwoch',
      title: 'Dwóch bohaterów',
      text: 'Dowódca to pełny bohater: ma własny pionek i własną turę, zaraz po bohaterze głównym (od następnej rundy). Zdobywa doświadczenie i nosi artefakty, a do bitwy bierze pomocników ze wspólnej drużyny. Śmierć bohatera głównego jest ostateczna, ale z żywym dowódcą grasz dalej.',
      ack: true,
      allow: (a) => inSettlement(a),
      done: (s) => s.phase === 'over',
    },
    {
      id: 'strazy',
      title: 'Strażnik kryształu',
      text: 'Ruszaj głównym bohaterem po kryształ: jego strażnik czeka na odsłoniętym polu. Idź podświetlonymi polami i zacznij bitwę. Turę dowódcy możesz po prostu zakończyć albo poprowadzić go za sobą.',
      target: nextStep,
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => s.phase !== 'adventure' || mine(s)?.crystals.length !== 0,
    },
    {
      id: 'czar',
      title: 'Czar w bitwie',
      text: 'Bohater zna Magiczny Pocisk. W jego aktywacji kliknij ikonę Magia w rogu areny (obok Skarbów), wybierz Magiczny Pocisk i wskaż wroga. Jeden czar na aktywację, obok ruchu i ataku; mana (pod portretem na mapie) wraca co rundę po 1.',
      allow: (a) => anyBattle(a) || mapPlay(a),
      done: (s) => {
        const h = mainHero(s);
        return s.phase === 'over' || Boolean(h && manaOf(h) < maxMana(h)) || Boolean(h && h.crystals.length > 0);
      },
    },
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

const IMPERIUM: Training = {
  id: 'imperium',
  level: 6,
  title: 'Imperium',
  tagline: 'Siedliska i wybór jednostek, Odłamki Pierwotnej Iskry i budynek, który z nich powstaje.',
  learn: ['jak działa siedlisko i wybór jednej z dwóch jednostek', 'jak zebrać Odłamki Pierwotnej Iskry', 'co daje Sanktuarium'],
  needs: 'krolestwo',
  tier: 'empire',
  objective: 'crystals',
  difficulty: 'kids',
  hero: 'goldDragon',
  rules: { dawnStartGold: 3 },
  seeds: [21, 37, 167, 176],
  map: { id: 'trening-imperium', name: 'Trening: Imperium', summary: 'Dolina ze stolicą i dwoma Odłamkami.', campaign: true, rows: VALLEY },
  intro: [
    'Na poziomie Imperium każdy stopień jednostek ma dwie jednostki do wyboru, a na mapie leżą Odłamki Pierwotnej Iskry. Każda frakcja ma też własne budynki i mechanikę.',
    'Cel gry jest znany: kryształ do Drzewa. Najpierw wybierzesz jednostkę i zbierzesz Odłamki.',
    RIGHT_CLICK_RULE,
  ],
  win: ['Kryształ jest przy Drzewie! W Potyczce na poziomie Imperium czekają jeszcze budynki frakcji (Kapliczka Świtu leczy w bitwie), legendarny Feniks Świtu i nowy cel gry: Relikt. Grając innymi frakcjami poznasz ich własne mechaniki.'],
  lose: ['Tym razem się nie udało. To tylko trening: spróbuj jeszcze raz!'],
  steps: [
    {
      id: 'siedlisko',
      title: 'Siedlisko: wybór jednostki',
      text: 'Na tym poziomie koszary stoją w stolicy od początku. Kliknij „Wejdź do osady”, potem koszary. Na poziomie 2 są dwie jednostki do wyboru, ale zbudujesz siedlisko tylko jednej: druga będzie wykluczona do końca gry. Porównaj je (prawy klik na karcie) i przy wybranej kliknij przycisk z nazwą jej siedliska (2 zł i 1 drewno).',
      allow: (a) => a.type === 'kingdomDwelling',
      hint: (s) => {
        const r = recruitsOf(s, 'dawn').find((x) => x.tier === 2);
        return capital(s) && r ? { type: 'kingdomDwelling', settlementId: capital(s)!.id, unitId: r.id } : null;
      },
      done: (s) => Boolean(dwellingOf(s, 'dawn', 2)) || s.phase === 'over',
    },
    {
      id: 'rekrutacja',
      title: 'Rekrutacja',
      text: 'Siedlisko stoi! Teraz zrekrutuj tę jednostkę: kliknij „Rekrutuj” na jej karcie. Dołączy do drużyny bohatera.',
      allow: (a) => a.type === 'kingdomRecruit',
      hint: (s) => {
        const id = dwellingOf(s, 'dawn', 2);
        return capital(s) && id ? { type: 'kingdomRecruit', settlementId: capital(s)!.id, unitId: id } : null;
      },
      done: (s) => {
        const id = dwellingOf(s, 'dawn', 2);
        return Boolean(id && s.factions.dawn.supportsAlive.includes(id)) || s.phase === 'over';
      },
    },
    {
      id: 'odlamki',
      title: 'Odłamki Pierwotnej Iskry',
      text: 'Na mapie leżą świecące Odłamki. Zamknij okno osady i idź podświetlonymi polami do najbliższego: bohater zabiera Odłamek, wchodząc na jego pole. Licznik pod imieniem bohatera pokazuje, ile już ma. Kto pokona bohatera, zabiera mu wszystkie Odłamki.',
      target: (s) => stepTowards(s, nearestShard(s)),
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => !nearestShard(s) || s.phase === 'over',
    },
    {
      id: 'odlamek-hordy',
      title: 'Odłamek u Hordy',
      text: 'Horda była szybsza i zabrała jeden Odłamek. Odbierzesz go, jeśli pokonasz jej bohatera: zwycięzca zabiera wszystkie Odłamki pokonanego. Pierwotną Iskrę wznosi tylko bohater, który niesie wszystkie Odłamki gry.',
      ack: true,
      allow: (a) => mapPlay(a) || anyBattle(a),
      done: (s) => shardsOf(s, 'horde') === 0 || s.phase === 'over',
    },
    {
      id: 'iskra',
      title: 'Pierwotna Iskra',
      text: 'Masz wszystkie Odłamki! Wróć podświetlonymi polami do stolicy, wejdź do osady i w Radzie Osady wznieś Sanktuarium: ceną są wszystkie Odłamki, a odtąd każda jednostka Przymierza ma więcej Życia w każdej bitwie.',
      target: (s) => (capital(s) ? stepTowards(s, capital(s)!.at) : null),
      allow: (a) => mapPlay(a) || anyBattle(a),
      hint: (s) => (capital(s) && mine(s)?.pos === capital(s)!.at ? { type: 'kingdomBuild', settlementId: capital(s)!.id, building: 'spark' } : null),
      // Done when the Iskra stands, or when the Horde took a shard (then nobody of the Przymierze carries them all and the step has nothing to do).
      done: (s) => Boolean(sparkOwner(s)) || (mainHero(s)?.shards ?? 0) < shardTotal(s) || s.phase === 'over',
    },
    stepStrazy('Teraz kryształ: jego strażnik czeka na odsłoniętym polu. Idź podświetlonymi polami i pokonaj go. Nowa jednostka pomoże ci w bitwie.', true),
    STEP_DRZEWO,
  ],
  free: 'Gotowe!',
};

/** The nearest shard on the map. */
function nearestShard(s: GameState): HexKey | null {
  const hero = mine(s);
  const shards = s.kingdom?.shards;
  if (!hero || !shards) return null;
  const at = parseKey(hero.pos);
  return Object.keys(shards).sort((a, b) => distance(parseKey(a), at) - distance(parseKey(b), at))[0] ?? null;
}

export const TRAININGS: Training[] = [SPACER, PRZYGODA, WYPRAWA, OSADA, KSIESTWO, KROLESTWO, IMPERIUM];
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
  if (a.type === 'chooseTreasure' || a.type === 'chooseSkill' || a.type === 'chestTake') return true;
  const step = t.steps[index];
  return !step || step.allow(a, s);
}

/** For tests and tools: a game of the training, created. */
export const createTrainingGame = (t: Training, seed = 1) => createGame(trainingSetup(t, seed));
