import type { SkillId } from './growth';
import type { SpellId } from './magic';
import type { HeroType } from './heroTypes';
import type { SiteKind, Slot } from './sites';
import type { HexKey } from './hex';
import type { BuildingId, KingdomState } from './kingdom';
import type { AbilityId, FactionId, ItemKind, MapSize, Side, Terrain, TileSide } from './data';

/** coop and pvp play the adventure map; arena is a single 3-on-3 battle with drafted treasures. */
export type Mode = 'coop' | 'pvp' | 'arena';
export type BattleMode = 'arena' | 'board';
export type Controller = 'human' | 'bot';
export type InitiativeTieMode = 'rotating' | 'defender';
/**
 * `classic` = the board game's rules, frozen (golden.test.ts guards them). `digital` = the extended digital edition
 * (2-hex units, corpses that stay on the board, new maps and goals). Every change of the digital edition must be
 * gated with `isDigital(rules)`; a missing field means classic, so old saves and the online server keep working.
 */
export type Ruleset = 'classic' | 'digital';

/**
 * Rule switches and TEST parameters. Everything here can change without touching engine code.
 * The default game is the full one; switching off abilities or treasures, or switching on
 * hero replacement, are optional simplifications; the damage die and an extra Horde hero
 * are optional difficulties. All of them mix freely.
 */
/** What a game is played for: bring the crystals to the Tree (the board game's goal), or hold control points (digital ruleset). */
/** Shape of the adventure map: the board game's triangle, or (digital ruleset) a rectangle or a ring around a lake. */
export type MapShape = 'triangle' | 'rectangle' | 'ring' | 'islands' | 'custom';

export type ObjectiveId = 'crystals' | 'control' | 'survival' | 'boss' | 'artifact' | 'conquest' | 'relic';

export interface RulesConfig {
  /** Missing = classic. Read it only through `isDigital`. */
  ruleset?: Ruleset;
  /** Digital Expedition and higher: every Życie and Atak, and every bonus that adds or takes them, is this many times the board game's (missing = 1). Read it through `scaleOf`. */
  statScale?: number;
  /** Życie goes by its own scale (missing = the same as `statScale`; the digital Expedition plays with HP_SCALE). */
  hpScale?: number;
  /** Missing = 'crystals'. Read it only through `objectiveOf` (objectives.ts). */
  objective?: ObjectiveId;
  /** Objective 'control', digital tuning: rounds in a row the Przymierza needs on top of the map's number (missing = CONTROL.dawnExtraRounds). */
  controlDawnExtra?: number;
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
  /** Coop, goal 'boss': no Horde heroes at all, every player is on the Przymierze side and the Boss is the only enemy (backlog 10.7). */
  noHorde?: boolean;
  /** Treasures the Horde holds from the start (difficulty): Eliksiry, other kinds, any random card. */
  hordeStartTreasures?: { resurrections: number; others: number; random?: number };
  /** Digital tuning: rounds added to the map's round limit (a game that would stall at the limit gets time to be decided). */
  roundLimitBonus?: number;
  /** Digital tuning: the treasures the Przymierza hold from the start instead of the map's (MapVariant.startTreasures). */
  dawnStartTreasures?: { resurrections: number; others: number; random?: number };
  /** Digital tuning, level 3: extra gold per round for the Przymierza (a start condition of Easy). */
  dawnGoldBonus?: number;
  /** Rounds that all living evil heroes must spend on the Tree to complete the ritual. */
  ritualRounds: number;
  /** The Horde's ritual at the Tree; off on the easy level (the Horde wins by the limit or by beating the heroes). */
  ritual?: boolean;
  /**
   * Safety net, not a design rule: after this many battle rounds the side with
   * more total remaining Ż wins and the other side's units fall.
   */
  battleRoundLimit: number;
  /** Experiment (backlog 4.2): units standing between shooter and target block the shot like obstacles. Off by default. */
  unitsBlockSight?: boolean;
  /** Digital ruleset: heroes earn experience, reach levels and choose skills (growth.ts). Off = as before. */
  heroGrowth?: boolean;
  /** Level 3 "Osada": gold, settlements and recruitment (kingdom.ts); needs hero growth. */
  kingdom?: boolean;
  /** Level 4 "Księstwo": wood, ore and Gwiezdny Pył, one building a round (economy.ts); needs `kingdom`. */
  economy?: boolean;
  /** Level 5 "Królestwo": a second hero hired in a tavern, magic, hero specialities (realm.ts); needs `economy`. */
  realm?: boolean;
  /** Arena only: 6 = the full match, 6 on 6 (the hero and 5 supports picked from the fixed pool of ARENA_POOL; 3 on 3 when missing). */
  arenaSize?: 6;
  /** Level 6 "Imperium": the Relic goal, faction mechanics (empire.ts); needs `realm`. */
  empire?: boolean;
  /** Difficulty "Łatwy" on levels 1-3: no rule differs, the flag only tells the level and selects the digital start-condition levers (tuning.ts). */
  easy?: boolean;
  /** Difficulty "Bardzo trudny": the Hard level with the computer's extra advantages below (COMPUTER_HANDICAP); the flag also tells the level. */
  veryHard?: boolean;
  /** The computer players' advantages (levels above Normal; missing = none, i.e. they play by the same rules as the people): their income is multiplied by `computerGold`, they start with `computerTreasures` more random treasures, `computerResources` more wood, ore and dust (levels with an economy) and `computerArtifacts` artifacts of rarity 1-2 for their main hero (levels with hero growth). Never more Życie: the units are the people's. */
  computerGold?: number;
  computerTreasures?: number;
  computerResources?: { wood?: number; ore?: number; dust?: number };
  computerArtifacts?: number;
  /** 6 on 6 arena at "Bardzo trudny": what the computer's side gets on top (see ARENA_HANDICAP); missing = nothing. */
  arenaHandicap?: ArenaHandicap;
  /** 3 on 3 arena at "Bardzo trudny": the computer drafts `picks` more treasures and is shown `offer` more cards at each pick (see ARENA_DRAFT_HANDICAP). */
  computerDraft?: { picks: number; offer: number };
}

/** The levers of the arena's highest difficulty: extra mana, spells and artifacts for the computer's hero, and fewer supports for the person. */
export interface ArenaHandicap { mana: number; spells: number; gear: number; playerLess: number }

export function isDigital(rules: Pick<RulesConfig, 'ruleset'>): boolean {
  return rules.ruleset === 'digital';
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
export type Level = 'zero' | 'kids' | 'normal' | 'hard' | 'veryHard';

/**
 * What each level changes against DEFAULT_RULES. Level 0 ("zero", the old Easy): few rules to remember (duels on
 * the board, no abilities, no die, no ritual) and a fallen hero's player takes a reserve hero.
 * Easy ("kids"), Normal and Hard are difficulties of levels 1-3: the same rules, only the starting conditions differ (tuning.ts).
 * Hard exists for coop only: the automaton fields one Horde hero more (at least three), starts with two
 * random treasures and gets no reinforcements in its base.
 */
/**
 * One list of what the level changes for the computer's players (the Horde in coop, bots at a PvP table): income multiplier, extra random start
 * treasures, extra start resources and start artifacts for the main hero. Normal gives the computer exactly the people's conditions: the
 * balance of the levels up to Hard lives in the per-cell tuning (tuning.ts, tuningAuto.ts), measured as before, so those rows stay neutral here.
 * Very hard sits on top of the Hard cells. Tuned with `make sim-tabele` toward 15-30 percent wins of the Przymierza.
 */
const NO_RESOURCES = { wood: 0, ore: 0, dust: 0 };
export const COMPUTER_HANDICAP: Record<Level, { gold: number; treasures: number; resources: { wood: number; ore: number; dust: number }; artifacts: number }> = {
  zero: { gold: 1, treasures: 0, resources: NO_RESOURCES, artifacts: 0 },
  kids: { gold: 1, treasures: 0, resources: NO_RESOURCES, artifacts: 0 },
  normal: { gold: 1, treasures: 0, resources: NO_RESOURCES, artifacts: 0 },
  hard: { gold: 1, treasures: 0, resources: NO_RESOURCES, artifacts: 0 },
  veryHard: { gold: 1.5, treasures: 2, resources: { wood: 3, ore: 3, dust: 2 }, artifacts: 2 },
};

/** Tuned with `npx tsx scripts/sim/arena6.ts` to keep the person's wins at 15-30% (the band of the highest difficulty). */
export const ARENA_HANDICAP: ArenaHandicap = { mana: 2, spells: 1, gear: 2, playerLess: 0 };
/** The same for "Trudny" in the 6 on 6 arena (a light touch: its band is 30-45%). */
export const ARENA_HANDICAP_HARD: ArenaHandicap = { mana: 1, spells: 0, gear: 0, playerLess: 0 };
/** And for "Łatwy" (its band is 65-85%): one more artifact for the computer's hero, so that it is not quite a pushover. */
export const ARENA_HANDICAP_EASY: ArenaHandicap = { mana: 0, spells: 0, gear: 1, playerLess: 0 };
/** "Bardzo trudny" in the 3 on 3 arena (no spells or artifacts there): more treasures for the computer. */
export const ARENA_DRAFT_HANDICAP = { picks: 1, offer: 0 };

const HARD_RULES: Partial<RulesConfig> = { extraEvilHero: true, minEvilHeroes: 2, hordeRespawn: false, hordeStartTreasures: { resurrections: 0, others: 0, random: 2 } };

export const LEVEL_RULES: Record<Level, { battleMode: BattleMode; rules: Partial<RulesConfig> }> = {
  zero: { battleMode: 'board', rules: { abilities: false, useDice: false, heroReplacement: true, ritual: false } },
  kids: { battleMode: 'arena', rules: { easy: true } },
  normal: { battleMode: 'arena', rules: {} },
  hard: { battleMode: 'arena', rules: HARD_RULES },
  veryHard: { battleMode: 'arena', rules: { ...HARD_RULES, veryHard: true, computerGold: COMPUTER_HANDICAP.veryHard.gold, computerTreasures: COMPUTER_HANDICAP.veryHard.treasures, computerResources: COMPUTER_HANDICAP.veryHard.resources, computerArtifacts: COMPUTER_HANDICAP.veryHard.artifacts } },
};

/** Whether the computer plays this faction: the Horde in coop (the automaton) or a PvP side whose seats are all bots. */
export function computerFaction(state: { setup: Pick<SetupOptions, 'mode' | 'seats'> }, f: FactionId): boolean {
  if (state.setup.mode === 'coop') return f === 'horde';
  const seats = state.setup.seats.filter((x) => x.faction === f);
  return seats.length > 0 && seats.every((x) => x.controller === 'bot');
}

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
  /** Family mode (coop): the younger player; its hero gets the help of `FAMILY` (data.ts) and the screen offers hints. */
  child?: boolean;
}

export interface SetupOptions {
  mode: Mode;
  /** Shape of the adventure map (digital ruleset): missing = the triangle of the board game. */
  mapShape?: MapShape;
  /** Shape 'custom': the id of a hand-made map (src/engine/customMaps.ts). */
  customMapId?: string;
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
export function arenaSetup(seats: SeatSetup[], seed: number, botLevel: Level = 'normal', size: 3 | 6 = 3): SetupOptions {
  // The arena has no level 0: its easy computer is "kids".
  if (botLevel === 'zero') botLevel = 'kids';
  return { mode: 'arena', mapSize: 'short', battleMode: 'arena', seed, seats, botLevel, rules: { ...DEFAULT_RULES, initiativeTie: 'rotating', ...(botLevel === 'veryHard' ? { veryHard: true } : {}), ...(size === 6 ? { arenaSize: 6 as const, heroGrowth: true, realm: true, ...(botLevel === 'veryHard' ? { arenaHandicap: ARENA_HANDICAP } : botLevel === 'hard' ? { arenaHandicap: ARENA_HANDICAP_HARD } : botLevel === 'kids' ? { arenaHandicap: ARENA_HANDICAP_EASY } : {}) } : botLevel === 'veryHard' ? { computerDraft: ARENA_DRAFT_HANDICAP } : {}) } };
}

/** Arena treasure draft: a shared deck, picks in the order A, B, B, A, three cards offered each time. */
export interface ArenaDraft {
  /** Cards left (Eliksir Odrodzenia twice, every other battle treasure once). */
  deck: ItemKind[];
  /** Who picks next, front first. */
  order: FactionId[];
  /** Distinct kinds shown to the picker now. */
  offer: ItemKind[];
  /** 6 on 6 arena: before the supports each side chooses one of three artifacts for its hero (stage 'gear'); the picker now is `order[0]`. */
  gear?: { order: FactionId[]; offer: string[] };
  /** 6 on 6 arena: after the artifacts each side chooses its hero's spells (stage 'spells'); the picker now is `order[0]`. */
  spells?: { order: FactionId[] };
}

export interface Player {
  id: string;
  name: string;
  faction: FactionId;
  controller: Controller;
  child?: boolean;
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
  /** Hero growth (rule `heroGrowth`): experience, level (missing = 1), the skills chosen and the three on offer now (see growth.ts). */
  xp?: number;
  level?: number;
  skills?: SkillId[];
  offer?: SkillId[];
  /** Łowca skarbów: treasures shown after a guardian fight; the hero keeps `take` of them (growth.ts, `chooseTreasure`). */
  treasurePick?: { kinds: ItemKind[]; take: number };
  /** Artifacts worn, by slot (sites.ts). */
  gear?: Partial<Record<Slot, string>>;
  /** Artifacts carried but not worn (the backpack, at most `PACK_SIZE`; sites.ts). */
  pack?: string[];
  /** Buty Handlarza: the one-off gold for the first place taken has been paid. */
  placeGoldPaid?: true;
  /** Level 5: a commander hired in a tavern (the player's second hero), with its own name; `fallen` is the round it fell in (it can be ransomed later). */
  secondary?: true;
  name?: string;
  fallen?: number;
  /** Level 5: the spells the hero knows and the mana it has left (missing: full, see magic.ts `manaOf`). */
  spells?: SpellId[];
  mana?: number;
  /** 6 on 6 arena, "Bardzo trudny": extra most mana the hero can hold. */
  manaBonus?: number;
  /** Level 6: Odłamki Pierwotnej Iskry the hero carries (empire.ts). */
  shards?: number;
  /** Level 5: the hero's type (heroTypes.ts): it grows by itself with the levels and switches the hero's speciality on. Missing in every other level. */
  kind?: HeroType;
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
  /** A site on the hex (shrine, camp, chest) and whether it has been used (sites.ts); only with hero growth. */
  site?: { kind: SiteKind; used: boolean };
  /** Level 3 "Osada": a settlement or a gold mine stands here (kingdom.ts). */
  place?: { kind: 'settlement' | 'mine' | 'hut' | 'object' | 'shard'; id: string };
}

export interface Crystal {
  id: string;
  guardian: string | null;
  /** Hex key while on the map, 'hero:<id>' when carried, 'tree' when delivered. */
  at: string;
  /** Objective 'survival': only the guardian is real; the beaten guardian leaves no crystal (and none is drawn or counted). */
  decoy?: boolean;
  /** Neutral encounter (encounters.ts): every unit of the group (`guardian` is the lead one, shown on the map). It leaves no crystal; a win gives the reward of its `tier`. */
  encounter?: string[];
  /** Reward and depth of an encounter: 0 common, 1 rare, 2 legendary. */
  tier?: 0 | 1 | 2;
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
  /** Zatruty Pazur: activations left in which the unit loses life at the start. */
  poisoned?: number;
  /** Buty Wartownika: set after an activation without moving; blows are 1 weaker until the unit's next activation. */
  anchored?: boolean;
  /** Tarcza Wartownika: S this unit loses in its next activation (it takes effect when that activation begins). */
  slowLater?: number;
}

/** What the artifacts do for a unit in this battle (sites.ts `applyGear`); numbers are in this battle's scale. */
export interface BattleGear {
  defense?: number;
  thorns?: number;
  vsWounded?: number;
  firstHit?: true;
  /** Regains this much Życie at the start of every round. */
  regen?: number;
  /** Cannot be rooted or slowed. */
  unbound?: true;
  /** The unit's first attack deals this much more (spent with the attack). */
  firstStrike?: number;
  /** A blow also hurts one more enemy next to the target by this much. */
  cleave?: number;
  /** Ranged attacks on the unit are this much weaker. */
  rangedDefense?: number;
  /** Once per battle the unit is left with 1 Życie instead of falling (spent when it fires). */
  lastStand?: true;
  /** An enemy that hits the unit in melee has this much less S in its next activation. */
  slowAttacker?: number;
  /** After an activation without moving the unit takes weaker blows until its next one. */
  anchor?: true;
  /** Supports next to this unit take blows this much weaker (min 1) while it stands. */
  guardAura?: number;
}

export interface BattleUnit {
  id: string;
  defId: string;
  side: Side;
  hp: number;
  maxHp: number;
  /** Fights under the digital ruleset: its own hp, attack and speed (see `battleStats`). */
  digital?: true;
  /** Życie and Atak of this unit are this many times the board game's (missing = 1; see `scaleOf` in battle.ts). */
  scale?: number;
  /** Życie of this unit is this many times the board game's (missing = `scale`). */
  hpScale?: number;
  pos: HexKey | null;
  /** Digital ruleset: the cell where the unit fell. It lies there without occupying it (pos is null); a Resurrection stands it up there. */
  corpse?: HexKey;
  /** Digital ruleset, large unit: the second cell of a corpse. */
  corpseTail?: HexKey;
  /** Digital ruleset, large unit (UnitDef.size 2): the cell behind the head. The head is `pos`. */
  tail?: HexKey;
  alive: boolean;
  abilityUsed: boolean;
  /** Hero milestone reached (0-3, missing = 0): levels 3 / 6 / 9 strengthen the hero's own ability (`ABILITY_TIERS`). */
  tier?: number;
  /** Ognisty Oddech at milestone 3: one more breath left in this battle. */
  abilityExtra?: boolean;
  /** Left the battle through Róg Strażników (returns to the pool unharmed). */
  swappedOut: boolean;
  status: UnitStatus;
  /** What the hero's artifacts do in this battle (sites.ts): blows on it are `defense` weaker (never below 1), a melee attacker loses `thorns` Życie, its attacks on a wounded enemy are `vsWounded` stronger, the first blow on it is halved. */
  gear?: BattleGear;
  /** The ability of the card it fights with, when not its usual one (a guardian's duel card). */
  ability?: AbilityId;
  /** Digital ruleset: the direction (axial vector) the unit last moved or attacked in: its front (Zajście od tyłu). */
  facing?: { q: number; r: number };
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
  /** Level 5: the hero has cast a spell in this activation (one a turn). */
  spell?: boolean;
  /** Siege: the unit was already hurt by the moat in this activation (it is hurt once, on entering or at the end of its turn). */
  moat?: boolean;
}

/** A settlement's defences in a battle fought for it (level 4, wide arena): everything stands in front of the defender's side. */
export interface SiegeState {
  /** Level of the walls building: 1 the moat, 2 the wall as well (the screen draws rubble where a wall stood). */
  level: number;
  /** Wall cells still standing (the towers stand on two of them). Nobody stands on or walks through a wall; shots fly over it. */
  walls: HexKey[];
  /** The gate (a wall segment in the middle row) while it stands, and the catapult hits it still takes. */
  gate: HexKey | null;
  gateHp: number;
  /** Wall cells with an arrow tower still standing: each shoots an attacker at the start of every round. */
  towers: HexKey[];
  /** Moat cells: entering one ends the unit's turn and hurts it; so does ending a turn there. The catapult cannot destroy them. */
  moat: HexKey[];
  /** The battle round of the catapult's last shot (one a round). */
  shot: number;
}

export interface BattleState {
  kind: 'heroes' | 'neutral';
  /** Arena shape: missing = the classic painted arena (flat-topped hexes in columns); 'wide' = the digital one (pointy-topped hexes in rows, 13 × 9). */
  layout?: 'wide';
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
  /** Level 6: how many times the Horde's Żądza Krwi has fired in this battle. */
  bloodlust?: number;
  /** Level 5: the spells cast in this battle, newest last (the screen plays them). */
  spells?: Array<{ spell: SpellId; casterId: string; targetId: string }>;
  /** Level 4: the battle is fought for this settlement (its garrison fights on the defender's side, with or without a hero). */
  garrison?: string;
  /** Level 4: the settlement's defences (moat, walls, gate, towers). */
  siege?: SiegeState;
  /** Króla Burzy's charged fields (digital ruleset): a unit that steps on `cell` takes damage while `round` <= `until`. */
  fields?: Array<{ cell: HexKey; until: number }>;
  /** Arena only: 'draft' (treasures) comes between choosing the supports and deploying. */
  stage: 'gear' | 'spells' | 'select' | 'draft' | 'deploy' | 'fight' | 'over';
  /** Factions still to place their units (attacker first); neutral guardians stay where put. */
  needsDeploy: FactionId[];
  /** Extra columns a side may deploy in (the hero's skill Taktyk). */
  deployDepth?: Partial<Record<Side, number>>;
  needsSelection: FactionId[];
  obstacles: HexKey[];
  units: Record<string, BattleUnit>;
  round: number;
  order: string[];
  index: number;
  activation: Activation | null;
  /** Extra activations queued by items (Róg Strażników, Klepsydra). */
  extra: Array<{ unitId: string; moveOnly: boolean; /** Speed bonus for this activation only (Kacza Furia, milestone 3). */ speedBonus?: number }>;
  winner: Side | 'draw' | null;
  /** Damage dealt per unit id during this battle (treasures count as 'item'). */
  damageBy: Record<string, number>;
  /** The latest resolved attacks (newest last), so the screen can show every die roll. */
  rolls?: AttackRoll[];
  /** Life a unit regained by itself at the start of its activation (Odrastające Głowy, Bagienne Odrastanie), newest last: the screen shows it apart from the blow that came just before. */
  heals?: Array<{ unitId: string; amount: number }>;
  /** Jumps over the board (newest last): the screen plays a teleport instead of a walk. `kind`: Król Burzy, Podkop or the Zwój Teleportacji. */
  /** Light effects the screen plays (spells, the siege, a rebirth): `kind` is a sheet of public/assets/efekty, `cell` where it plays. Newest last. */
  fx?: Array<{ kind: 'czar_bolt' | 'czar_mend' | 'czar_slow' | 'czar_stoneskin' | 'czar_fireball' | 'czar_haste' | 'czar_thunder' | 'czar_curse' | 'czar_shield' | 'czar_inspire' | 'oblezenie_kamien' | 'oblezenie_fosa' | 'odrodzenie'; cell: HexKey }>;
  teleports?: Array<{ unitId: string; from: HexKey; to: HexKey; kind: 'storm' | 'burrow' | 'scroll' }>;
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

/** A structured happening behind a log line, for the screen to announce (experience gained, an artifact found). */
export type LogEvent =
  | { type: 'xp'; heroId: string; amount: number; reason: string }
  /** Gold and resources a hero just took from the map (a mill, a store, a chest, a hut): the screen floats them over the hero. */
  /** A light effect on the adventure map (a map spell, a shard picked up, the Iskra raised): everybody sees it, whatever their side. */
  | { type: 'fx'; kind: 'mapa_wizja' | 'mapa_portal' | 'mapa_przyspieszenie' | 'odlamek' | 'iskra'; hex: HexKey }
  | { type: 'loot'; heroId: string; gold?: number; res?: Partial<Record<'wood' | 'ore' | 'dust', number>> }
  | { type: 'artifact'; heroId: string; artifactId: string; source: string; kept: boolean; packed?: boolean }
  /** A story note of a hand-made map (story.ts). */
  | { type: 'story'; id: string; title?: string; text: string };

export interface LogEntry {
  round: number;
  kind: LogKind;
  text: string;
  /** What this line announces, when the screen should say it louder than the log does. */
  event?: LogEvent;
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
  /** Where the Tree and the two bases lie (missing in old saves = the triangle's corners: read them through treeOf / homeOf). */
  tree?: HexKey;
  homes?: Record<FactionId, HexKey>;
  crystals: Record<string, Crystal>;
  items: Record<string, ItemInstance>;
  turnOrder: string[];
  turnIndex: number;
  movePoints: number;
  /** Set once the active hero fought a battle this turn (a reserve taking over that turn waits for its own). */
  turnBattleDone: boolean;
  battle: BattleState | null;
  ritual: number;
  winner: Side | null;
  endReason: string | null;
  /** Ids of the story notes already shown (story.ts). */
  storyFired?: string[];
  /** Level 3 "Osada": gold, settlements, mines (kingdom.ts); absent in the other levels. */
  kingdom?: KingdomState;
  log: LogEntry[];
  actionCount: number;
  stats: GameStats;
  /** Summary of the most recently finished battle (for the after-battle screen). */
  lastBattle: BattleReport | null;
  /** Arena: the treasure draft while it lasts. */
  draft?: ArenaDraft | null;
  /** Objective 'control': the control points and who has led for how many rounds (see objectives.ts). */
  control?: ControlState;
  /** Objective 'survival': the rounds to hold out and the waves of the Horde that came so far. */
  survival?: { rounds: number; waves: number };
  /** Objective 'boss': the lair in the middle of the map, the Boss's Życie left (it keeps the wounds between fights) and who struck the last blow. */
  /** Objective 'artifact': the artifact is the crystal 'artifact' (free on a hex or in a hero's hands); this counts the times it changed hands. */
  artifact?: { start: HexKey; handovers: number };
  boss?: { at: HexKey; guardian: string; hp: number; maxHp: number; slain: FactionId | null; hits: Record<FactionId, number> };
}

export interface ControlState {
  points: HexKey[];
  /** The side that held more points at the end of the last round(s), and for how many rounds in a row. */
  lead: FactionId | null;
  streak: number;
  /** Rounds each side has led in all (decides when the round limit comes first). */
  led: Record<FactionId, number>;
}

export type Action =
  | { type: 'moveHero'; to: HexKey }
  | { type: 'endTurn' }
  | { type: 'chooseSkill'; skill: SkillId }
  | { type: 'chooseTreasure'; kind: ItemKind }
  /** The active hero's gear: put on an artifact from the backpack, take one off into the backpack, hand one to an ally on a neighbouring hex. */
  | { type: 'equipArtifact'; artifactId: string }
  | { type: 'unequipArtifact'; slot: Slot }
  | { type: 'passArtifact'; artifactId: string; toHeroId: string }
  | { type: 'useMapItem'; itemId: string; targets?: HexKey[]; unitId?: string }
  | { type: 'selectSupports'; faction: FactionId; supportIds: string[] }
  | { type: 'deployUnits'; faction: FactionId; positions: Record<string, HexKey> }
  | { type: 'draftPick'; faction: FactionId; kind: ItemKind }
  | { type: 'pickGear'; faction: FactionId; artifactId: string }
  | { type: 'pickSpells'; faction: FactionId; spells: SpellId[] }
  | { type: 'battleMove'; to: HexKey; tail?: HexKey }
  | { type: 'battleAttack'; targetId: string; secondTargetId?: string; useAbility?: boolean }
  | { type: 'battleAbility'; targetId?: string }
  | { type: 'battleHop'; to: HexKey }
  | { type: 'battleTeleport'; to: HexKey }
  | { type: 'battleItem'; itemId: string; targetId?: string; targetIds?: string[]; to?: HexKey; hornMode?: 'swap' | 'extra'; reserveId?: string }
  | { type: 'endActivation' }
  /** Level 3 "Osada": services of the settlement the active hero stands in. */
  | { type: 'kingdomBuild'; settlementId: string; building: BuildingId }
  | { type: 'kingdomRecruit'; settlementId: string; unitId: string }
  | { type: 'kingdomHeal'; settlementId: string; unitId: string }
  | { type: 'kingdomBuyArtifact'; settlementId: string; artifactId: string }
  /** Level 4: one unit of a resource bought for gold in an own settlement, or sold on its market. */
  | { type: 'kingdomTrade'; settlementId: string; res: 'wood' | 'ore' | 'dust'; dir: 'buy' | 'sell' }
  /** Level 4: one unit of a resource swapped for one of another on the market (sold and bought at the market's prices, one action). */
  | { type: 'kingdomSwap'; settlementId: string; from: 'wood' | 'ore' | 'dust'; to: 'wood' | 'ore' | 'dust' }
  /** Level 6: the next rank of the faction's tree, bought in an own settlement. */
  | { type: 'kingdomTree'; settlementId: string }
  /** Level 6: the dwelling of one of the two units of a tier (it shuts the other out). */
  | { type: 'kingdomDwelling'; settlementId: string; unitId: string }
  /** Level 5: a spell learnt in the mage tower of an own settlement, cast in a battle by the active hero, cast on the map in the hero's turn. */
  | { type: 'kingdomLearn'; settlementId: string; spell: SpellId }
  | { type: 'battleSpell'; spell: SpellId; targetId?: string }
  | { type: 'mapSpell'; spell: SpellId }
  /** Level 5: a commander hired in the tavern of an own settlement, and a fallen commander bought back there. */
  | { type: 'kingdomHire'; settlementId: string; unitId: string }
  | { type: 'kingdomRansom'; settlementId: string; heroId: string }
  /** Level 4: a support left in the settlement the active hero stands in (or taken back into the team). */
  | { type: 'kingdomGarrison'; settlementId: string; unitId: string; dir: 'in' | 'out' }
  /** Siege: the attacker's catapult shoots a wall, the gate or a tower (once a round). */
  | { type: 'battleCatapult'; cell: HexKey }
  | { type: 'hutDeliver' }
  | { type: 'chestTake'; what: 'artifact' | 'gold' };
