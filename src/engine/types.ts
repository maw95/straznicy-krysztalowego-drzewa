import type { HexKey } from './hex';
import type { FactionId, ItemKind, MapSize, Side, Terrain } from './data';

export type Mode = 'coop' | 'pvp';
export type Difficulty = 'basic' | 'advanced';
export type BattleMode = 'arena' | 'board';
export type Controller = 'human' | 'bot';
export type InitiativeTieMode = 'rotating' | 'defender';

/** Rule switches and TEST parameters. Everything here can change without touching engine code. */
export interface RulesConfig {
  heroMovePoints: number;
  /** Optional damage die −1/0/+1. */
  useDice: boolean;
  initiativeTie: InitiativeTieMode;
  /** Easier variant: a dead hero's player may take another unused hero of the faction. */
  heroReplacement: boolean;
  /** Evil heroes standing on the Tree stay there instead of chasing (spec 7: DO USTALENIA). */
  ritualHold: boolean;
  /** Rounds that all living evil heroes must spend on the Tree to complete the ritual. */
  ritualRounds: number;
  /** Neutral guardians use their ability also in the basic variant. */
  neutralAbilitiesAlways: boolean;
  /** Walking units may pass through hexes occupied by allies (never through enemies). */
  passThroughAllies: boolean;
  /** Units standing in the way do not block ranged line of sight (only obstacles do). */
  unitsBlockSight: boolean;
  /**
   * Safety net, not a design rule: after this many battle rounds the side with
   * more total remaining Ż wins and the other side's units fall.
   */
  battleRoundLimit: number;
}

export const DEFAULT_RULES: RulesConfig = {
  heroMovePoints: 2,
  useDice: false,
  initiativeTie: 'rotating',
  heroReplacement: false,
  ritualHold: true,
  ritualRounds: 2,
  neutralAbilitiesAlways: true,
  passThroughAllies: true,
  unitsBlockSight: false,
  battleRoundLimit: 40,
};

export interface SeatSetup {
  name: string;
  faction: FactionId;
  controller: Controller;
  heroId: string;
}

export interface SetupOptions {
  mode: Mode;
  difficulty: Difficulty;
  mapSize: MapSize;
  battleMode: BattleMode;
  seed: number;
  seats: SeatSetup[];
  rules: RulesConfig;
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
  /** Ability flags armed for the next attack in this activation. */
  armedAbility: boolean;
}

export interface BattleState {
  kind: 'heroes' | 'neutral';
  /**
   * Board variant: a 1-on-1 duel fought on the adventure map. Only the two leaders
   * take part (no supports), they stand next to each other and nobody moves.
   */
  duel: boolean;
  mapHex: HexKey;
  attacker: Side;
  defender: Side;
  attackerHero: string;
  defenderHero: string | null;
  neutralId: string | null;
  stage: 'select' | 'fight' | 'over';
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

export interface TurnSlot {
  heroId: string;
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
}

export type Action =
  | { type: 'moveHero'; to: HexKey }
  | { type: 'endTurn' }
  | { type: 'useMapItem'; itemId: string; targets?: HexKey[]; unitId?: string }
  | { type: 'selectSupports'; faction: FactionId; supportIds: string[] }
  | { type: 'battleMove'; to: HexKey }
  | { type: 'battleAttack'; targetId: string; secondTargetId?: string; useAbility?: boolean }
  | { type: 'battleAbility'; targetId?: string }
  | { type: 'battleHop'; to: HexKey }
  | { type: 'battleItem'; itemId: string; targetId?: string; targetIds?: string[]; to?: HexKey; hornMode?: 'swap' | 'extra'; reserveId?: string }
  | { type: 'endActivation' };
