import type { HexKey } from './hex';
import type { FactionId, ItemKind, MapSize, Side, Terrain, TileSide } from './data';

/** coop and pvp play the adventure map; arena is a single 3-on-3 battle with drafted treasures. */
export type Mode = 'coop' | 'pvp' | 'arena';
export type BattleMode = 'arena' | 'board';
export type Controller = 'human' | 'bot';
export type InitiativeTieMode = 'rotating' | 'defender';

/**
 * Rule switches and TEST parameters. Everything here can change without touching engine code.
 * The default game is the full one; switching off abilities or treasures, or switching on
 * hero replacement, are optional simplifications; the damage die and an extra Horde hero
 * are optional difficulties. All of them mix freely.
 */
export interface RulesConfig {
  heroMovePoints: number;
  /** Unit abilities, including the guardians'. */
  abilities: boolean;
  /** All treasures on the map; false = only a few Eliksiry Odrodzenia (MapVariant.onlyResurrections). */
  treasures: boolean;
  /** Damage die −1/0/+1 (a difficulty, off by default). */
  useDice: boolean;
  initiativeTie: InitiativeTieMode;
  /** Harder coop: the automaton fields one Horde hero more than there are Przymierze players. */
  extraEvilHero: boolean;
  /** Simplification: a dead hero's player takes over another unused hero of the faction. */
  heroReplacement: boolean;
  /** Coop: the automaton fields at least this many Horde heroes (more when there are more players). */
  minEvilHeroes: number;
  /** Coop: when the automaton's last living hero falls, another Horde hero appears in the Horde base. */
  hordeRespawn?: boolean;
  /** Treasures the Horde holds from the start (difficulty): Eliksiry, other kinds, any random card. */
  hordeStartTreasures?: { resurrections: number; others: number; random?: number };
  /** Rounds that all living evil heroes must spend on the Tree to complete the ritual. */
  ritualRounds: number;
  /** The Horde's ritual at the Tree; off on the easy level (the Horde wins by the limit or by beating the heroes). */
  ritual?: boolean;
  /**
   * Safety net, not a design rule: after this many battle rounds the side with
   * more total remaining Ż wins and the other side's units fall.
   */
  battleRoundLimit: number;
}

export const DEFAULT_RULES: RulesConfig = {
  heroMovePoints: 3,
  abilities: true,
  treasures: true,
  useDice: false,
  extraEvilHero: false,
  initiativeTie: 'defender',
  heroReplacement: false,
  minEvilHeroes: 1,
  hordeRespawn: true,
  ritualRounds: 3,
  battleRoundLimit: 40,
};

/** Ready-made levels: the setup screen offers these first, single switches only under "Własne". */
export type Level = 'kids' | 'normal' | 'hard';

/**
 * What each level changes against DEFAULT_RULES. Easy ("kids"): few rules to remember (duels on
 * the board, no abilities, no die, no ritual) and a fallen hero's player takes a reserve hero.
 * Hard exists for coop only: the automaton fields one Horde hero more (at least three), starts with two
 * random treasures and gets no reinforcements in its base.
 */
export const LEVEL_RULES: Record<Level, { battleMode: BattleMode; rules: Partial<RulesConfig> }> = {
  kids: { battleMode: 'board', rules: { abilities: false, useDice: false, heroReplacement: true, ritual: false } },
  normal: { battleMode: 'arena', rules: {} },
  hard: { battleMode: 'arena', rules: { extraEvilHero: true, minEvilHeroes: 2, hordeRespawn: false, hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } } },
};

export function levelSettings(level: Level, mode: Mode): { battleMode: BattleMode; rules: RulesConfig } {
  const { battleMode, rules } = LEVEL_RULES[level];
  const out = { ...DEFAULT_RULES, ...rules };
  if (mode !== 'coop') out.extraEvilHero = false;
  return { battleMode, rules: out };
}

export interface SeatSetup {
  name: string;
  faction: FactionId;
  controller: Controller;
  heroId: string;
}

export interface SetupOptions {
  mode: Mode;
  /** Arena: unused (the map is generated but never shown). */
  mapSize: MapSize;
  battleMode: BattleMode;
  seed: number;
  seats: SeatSetup[];
  rules: RulesConfig;
  /** Arena against the computer: how well the bot picks its supports and treasures. */
  botLevel?: Level;
}

/**
 * Arena setup: one Przymierze seat and one Horda seat, the full game's battle rules, and ties of
 * initiative taken in turn (there is no attacker or defender in an arena match).
 */
export function arenaSetup(seats: SeatSetup[], seed: number, botLevel: Level = 'normal'): SetupOptions {
  return { mode: 'arena', mapSize: 'short', battleMode: 'arena', seed, seats, botLevel, rules: { ...DEFAULT_RULES, initiativeTie: 'rotating' } };
}

/** Arena treasure draft: a shared deck, picks in the order A, B, B, A, three cards offered each time. */
export interface ArenaDraft {
  /** Cards left (Eliksir Odrodzenia twice, every other battle treasure once). */
  deck: ItemKind[];
  /** Who picks next, front first. */
  order: FactionId[];
  /** Distinct kinds shown to the picker now. */
  offer: ItemKind[];
}

export interface Player {
  id: string;
  name: string;
  faction: FactionId;
  controller: Controller;
}

export interface HeroState {
  id: string;
  faction: FactionId;
  /** null = controlled by the coop automaton. */
  playerId: string | null;
  pos: HexKey;
  alive: boolean;
  crystals: string[];
  /**
   * A reserve hero not yet on the board: the free hexes nearest to where the fallen hero died.
   * On its first turn the player picks one of them (free move); until then `pos` is not used.
   */
  entering?: HexKey[];
}

export interface FactionState {
  id: FactionId;
  supportsAlive: string[];
  supportsDead: string[];
  inventory: string[];
  delivered: number;
  /** Main heroes not yet used by anyone (for the replacement variant). */
  unusedHeroes: string[];
}

export interface Tile {
  key: HexKey;
  row: number;
  col: number;
  terrain: Terrain;
  /** Which deck the tile comes from (back colour shown while hidden). */
  side: TileSide;
  /** Art variant, 1-based. */
  variant: number;
  revealed: boolean;
  crystalId: string | null;
  treasureId: string | null;
  home: FactionId | null;
  tree: boolean;
}

export interface Crystal {
  id: string;
  guardian: string | null;
  /** Hex key while on the map, 'hero:<id>' when carried, 'tree' when delivered. */
  at: string;
}

export interface ItemInstance {
  id: string;
  kind: ItemKind;
  owner: FactionId | null;
  /** Hero who picked the treasure up (faction inventories are shared). */
  foundBy: string | null;
}

export interface UnitStatus {
  slowNext: number;
  rootedNext: boolean;
  cursedNext: number;
  nextAttackBonus: number;
  battleAttackBonus: number;
  battleSpeedBonus: number;
  damageReduction: number;
  shieldArmed: boolean;
}

export interface BattleUnit {
  id: string;
  defId: string;
  side: Side;
  hp: number;
  maxHp: number;
  pos: HexKey | null;
  alive: boolean;
  abilityUsed: boolean;
  /** Left the battle through Róg Strażników (returns to the pool unharmed). */
  swappedOut: boolean;
  status: UnitStatus;
}

export interface Activation {
  unitId: string;
  moved: boolean;
  movedDistance: number;
  attacked: boolean;
  acted: boolean;
  moveOnly: boolean;
  /** Post-attack hop allowance (Powietrzny Zryw / Łupieżczy Nalot). */
  hop: number;
}

export interface BattleState {
  kind: 'heroes' | 'neutral';
  /**
   * Board variant: a 1-on-1 duel fought on the adventure map. Only the two leaders
   * take part (no supports), they stand next to each other and nobody moves.
   */
  duel: boolean;
  mapHex: HexKey;
  /** Which painted arena is used: the half of the map where the fight broke out. */
  arena: TileSide;
  attacker: Side;
  defender: Side;
  attackerHero: string;
  /** Hex the attacker came from (it steps back there if other enemies still hold the battle hex). */
  attackerFrom: HexKey;
  defenderHero: string | null;
  neutralId: string | null;
  /** Arena only: 'draft' (treasures) comes between choosing the supports and deploying. */
  stage: 'select' | 'draft' | 'deploy' | 'fight' | 'over';
  /** Factions still to place their units (attacker first); neutral guardians stay where put. */
  needsDeploy: FactionId[];
  needsSelection: FactionId[];
  obstacles: HexKey[];
  units: Record<string, BattleUnit>;
  round: number;
  order: string[];
  index: number;
  activation: Activation | null;
  /** Extra activations queued by items (Róg Strażników, Klepsydra). */
  extra: Array<{ unitId: string; moveOnly: boolean }>;
  winner: Side | 'draw' | null;
  /** Damage dealt per unit id during this battle (treasures count as 'item'). */
  damageBy: Record<string, number>;
  /** The latest resolved attacks (newest last), so the screen can show every die roll. */
  rolls?: AttackRoll[];
}

/** One resolved attack: the attack value, the die (null without dice) and the damage that landed. */
export interface AttackRoll {
  /** Grows with every attack in the battle, so the screen can tell new rolls apart. */
  seq: number;
  attackerId: string;
  /** The unit that took the blow (the bear when Opiekun Gaju steps in). */
  targetId: string;
  attack: number;
  die: number | null;
  damage: number;
}

export type LogKind = 'info' | 'move' | 'battle' | 'damage' | 'death' | 'item' | 'crystal' | 'round' | 'victory' | 'ability';

export interface LogEntry {
  round: number;
  kind: LogKind;
  text: string;
  /** Visible only to this faction (private draws). */
  privateTo?: FactionId;
}

export interface BattleReport {
  /** Increments with every finished battle, so the UI can tell reports apart. */
  id: number;
  kind: 'heroes' | 'neutral';
  duel: boolean;
  attacker: Side;
  defender: Side;
  winner: Side | 'draw';
  rounds: number;
  units: Array<{ defId: string; side: Side; hp: number; maxHp: number; alive: boolean; damage: number }>;
}

export interface GameStats {
  battles: number;
  heroDeaths: Record<FactionId, number>;
  supportDeaths: Record<FactionId, number>;
  treasuresCollected: Record<FactionId, number>;
  neutralBattles: number;
  neutralWipes: number;
  neutralSupportLosses: number;
}

export interface GameState {
  version: 1;
  setup: SetupOptions;
  rules: RulesConfig;
  rng: number;
  round: number;
  roundLimit: number;
  crystalsNeeded: number;
  phase: 'adventure' | 'battle' | 'over';
  players: Player[];
  heroes: Record<string, HeroState>;
  factions: Record<FactionId, FactionState>;
  tiles: Record<HexKey, Tile>;
  rows: number;
  crystals: Record<string, Crystal>;
  items: Record<string, ItemInstance>;
  turnOrder: string[];
  turnIndex: number;
  movePoints: number;
  /** Set once the active hero fought a battle this turn: movement is over. */
  turnBattleDone: boolean;
  battle: BattleState | null;
  ritual: number;
  winner: Side | null;
  endReason: string | null;
  log: LogEntry[];
  actionCount: number;
  stats: GameStats;
  /** Summary of the most recently finished battle (for the after-battle screen). */
  lastBattle: BattleReport | null;
  /** Arena: the treasure draft while it lasts. */
  draft?: ArenaDraft | null;
}

export type Action =
  | { type: 'moveHero'; to: HexKey }
  | { type: 'endTurn' }
  | { type: 'useMapItem'; itemId: string; targets?: HexKey[]; unitId?: string }
  | { type: 'selectSupports'; faction: FactionId; supportIds: string[] }
  | { type: 'deployUnits'; faction: FactionId; positions: Record<string, HexKey> }
  | { type: 'draftPick'; faction: FactionId; kind: ItemKind }
  | { type: 'battleMove'; to: HexKey }
  | { type: 'battleAttack'; targetId: string; secondTargetId?: string; useAbility?: boolean }
  | { type: 'battleAbility'; targetId?: string }
  | { type: 'battleHop'; to: HexKey }
  | { type: 'battleItem'; itemId: string; targetId?: string; targetIds?: string[]; to?: HexKey; hornMode?: 'swap' | 'extra'; reserveId?: string }
  | { type: 'endActivation' };
