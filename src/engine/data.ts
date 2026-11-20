import { byPack, FACTION_PACKS, type PackId } from './factions';
// Game content: units, guardians, treasures and terrain.
// Numbers started from docs/zrodla_zasad/Straznicy_Krysztalowego_Drzewa_Specyfikacja_dla_AI.md
// and were tuned with simulations (docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md, section 7).
// They are TEST values meant to be tuned, so the
// engine never hard-codes them — it always reads from these tables.

/** A RACE: the key of game data and graphics (heroes, units, buildings, names). */
export type FactionId = PackId;
/** A TEAM (playing side): the key of game state (gold, treasures, homes, half of the map). Today exactly two teams, each of the race with the same id (see raceOf in teams.ts). */
export type TeamId = 'dawn' | 'horde' | 'third' | 'fourth';
/** A team or the neutral creatures. */
export type Side = TeamId | 'neutral';
export type UnitKind = 'hero' | 'support' | 'neutral';
export type MovementType = 'walk' | 'fly';
export type AttackType = 'melee' | 'ranged';

export type AbilityId =
  | 'sunburst' // Słoneczny Blask
  | 'lightCharge' // Szarża Światła (passive)
  | 'guardian' // Opiekun Gaju (reaction)
  | 'duckFury' // Kacza Furia (passive; easter egg hero)
  | 'entanglingRoots' // Splątane Korzenie
  | 'giftOfLife' // Dar Życia
  | 'airDash' // Powietrzny Zryw
  | 'fireBreath' // Ognisty Oddech
  | 'bloodCall' // Zew Krwi (passive)
  | 'hardHead' // Twardogłowy (reaction)
  | 'curse' // Złowroga Klątwa
  | 'web' // Pajęcze Sidła
  | 'nightAmbush' // Nocna Zasadzka
  | 'boulder' // Miażdżący Głaz (Cyklop)
  | 'nestLeap' // Łupieżczy Nalot (Gryf)
  | 'manyHeads' // Paszcze Otchłani (Hydra)
  // Guardians' duel cards (the light-blue back): abilities that count in a duel on the board.
  | 'stoneSkin' // Kamienna Skóra (Cyklop)
  | 'thiefClaw' // Złodziejski Szpon (Gryf)
  | 'regrowth' // Odrastające Głowy (Hydra)
  // Neutral encounters (digital ruleset): weak units and bosses of the three motifs (docs/ZASADY_CYFROWE.md, "Neutralni").
  | 'none' // no ability (Kraken's tentacles)
  | 'shardBurst' // Rozprysk (Kruszyniec)
  | 'burrow' // Podkop (Podkopnik)
  | 'dive' // Nurkowanie (Orzeł Skalny)
  | 'backstab' // Zajście od tyłu (Harpia)
  | 'grab' // Chwyt (Szczypiec)
  | 'bogRegrowth' // Bagienne Odrastanie (Bagienny Pełzacz)
  | 'runeGolem' // Kamienna Skóra, Runiczny Rdzeń and Trzęsienie (Kamienny Golem)
  | 'stormKing' // Teleport, Pole Naładowane and Wyładowanie (Król Burzy)
  | 'tentacles' // Macki (Kraken)
  // Level 3 recruits (docs/JEDNOSTKI_POZIOMU_3.md).
  | 'quills' // Kolce (Jeżozwierz, passive)
  | 'gallop' // Strzał i Galop (Centaur, hop after the attack)
  | 'headlong' // Czołowe Natarcie (Alabastrowy Odyniec, passive)
  | 'treeRoots' // Korzenie Drzewa (Opiekun Drzewa)
  | 'poisonClaw' // Zatruty Pazur (Szczurołak)
  | 'packHunt' // Obława (Piekielny Ogar, passive)
  | 'inferno' // Pożoga (Salamandra Popiołu)
  | 'bloodRage' // Bitewny Szał (Herszt Minotaurów, passive)
  | 'rebirth' // Odrodzenie z Popiołów (Feniks Świtu, reaction, level 6)
  // Dzikie Stada (docs/frakcje/herds.md): pushing and colliding, leaping, taunting, an aura.
  | 'headbutt' // Byczy Łeb (Młody Tur, Baran Gromowładny, passive): every attack pushes the target 1 cell
  | 'rhythm' // Skoczny Rytm (Satyr Dudziarz, free action, once): an ally has +S in its next activation
  | 'mountainLeap' // Skok po Turniach (Kozica Skalna, passive): moves through obstacles and units
  | 'momentum' // Rozpęd (Tarpan, passive): +A after a run
  | 'unmoved' // Niewzruszony (Żubr Puszczański, passive): armour, cannot be pushed
  | 'pierce' // Przebicie (Satyr Kopijnik, passive): the blow also hits the enemy behind the target
  | 'hippoStrike' // Lot na Strzelców (Hipogryf Stepowy, passive): +A against a target pushed this round
  | 'drumBeat' // Bęben Wędrówki (Słoń z Bębnem, passive aura): allies nearby have +S
  | 'ram' // Taran (Nosorożec Bojowy, passive): after a run pushes the target 2 cells and the collision hurts more
  | 'roar' // Rykowisko (Łoś Rogacz, free action, once): an enemy may attack only the moose in its next activation
  | 'tremor' // Ziemia Drży (Indrik, free action, once): small enemies nearby are pushed 1 cell; cannot be pushed
  | 'ancestralHorns' // Rogi Przodków (Wielki Tur, attack ability, once): the blow pushes the target 2 cells
  | 'wanderHorn' // Róg Wędrówki (Satyr Rogogłos, free action, once): all allies have +S in their next activation
  | 'runOn' // W Biegu (Pędziwiatr, once): after the attack finishes the move with the remaining cells
  // Królestwo Umarłych (docs/frakcje/undead.md): raising the fallen, armour piercing, auras that weaken, immunity to statuses, draining mana.
  | 'barrowCall' // Wezwanie z Kurhanu (Król Kurhanu, free action, once): a fallen support rises next to the king with half its Życie
  | 'dimLight' // Zgaszone Światło (Latarniczka Mgieł, attack ability, once): the enemy hero loses mana, the target has -A
  | 'spectralCharge' // Widmowa Szarża (Bezgłowy Jeździec, attack ability, once): a blow with a bonus (more from behind)
  | 'bonesReturn' // Kości Wracają (Szkielet Halabardnik, once): after its fall it stands up at the end of the round with 1 Życie
  | 'incorporeal' // Bezcielesna (Zjawa Pokutnika, once): the first ranged blow of the battle does nothing
  | 'armorPierce' // Grot Przez Zbroję (Szkielet Łucznik, passive): ignores armour
  | 'dread' // Postrach (Strach Polny, passive aura): neighbouring enemies have -A
  | 'hollow' // Pusta w Środku (Nawiedzona Zbroja, passive): armour; poison, curses, slows and roots do not work on it
  | 'wail' // Lament (Płaczka, free action, once): enemies nearby have -A in their next attack
  | 'viyGaze' // Podnieście Mi Powieki (Wij Podziemny, free action, once): an enemy in range cannot move in its next activation
  | 'breathAgain' // Ponowny Oddech (Kościana Wróżka, free action, once): a fallen support of tier 1-3 rises next to her with half its Życie
  | 'manaReap' // Żniwo Many (Lisz, passive): every hit takes mana from the enemy hero and heals the lich
  | 'graveBreath' // Oddech Grobu (Kościany Smok, attack ability, once): the breath of fire, and the ones it hits are slowed
  | 'toll' // Dzwon Zaduszny (Duch Starego Dzwonnika, free action, once): the enemies next to it are slowed
  // Żelazne Klany (docs/frakcje/clans.md): armour, formation, standing fire, runes of the forge, stunning, a displaced enemy, a wall put up on the field.
  | 'shieldOath' // Przysięga Tarczy (Tan Żelaznobrody, free action, once): neighbouring allies have armour until the end of the round
  | 'stoneRune' // Runa Kamienia (Matka Run, free action, once): an ally gets armour for the battle and cannot be moved
  | 'bulwark' // Pawęż / Kolczuga (Tarczownik, Niedźwiedź w Zbroi, passive): armour
  | 'standShot' // Salwa z Miejsca (Kusznik Klanu, passive): + A when the unit has not moved in this activation
  | 'temper' // Hartowanie (Kowal Bitewny, free action, once): a neighbouring ally has + A until the end of the battle
  | 'bronzeQuills' // Kolce Mechanizmu (Wartownik z Brązu, passive): whoever hits it in melee loses Życie; poison does not work on it
  | 'goatLeap' // Skok po Turniach (Jeździec na Koźle, once): one move over units and obstacles
  | 'giantBane' // Na Duże Cele (Pogromca Olbrzymów, passive): + A against large units
  | 'misleadLight' // Błędne Światło (Skarbnik, free action, once): an enemy in range is moved 2 cells away
  | 'stunBlow' // Młot Przodków (Gwardia Młota, attack ability, once): the target loses its next activation
  | 'cannonFire' // Ostrzał (Armata Klanów, passive): the shot hits the target and its neighbours; no shot after a move; double damage to walls and gates
  | 'fortify' // Fortyfikacja (Kolos Kuźni, free action, once): puts up 2 cells of wall; armour; cannot be moved
  // Dwór Wiecznego Szronu (docs/frakcje/frost.md): frost that builds up on a unit and freezes it, a bonus for the target's state, a wall of ice, a displaced enemy.
  | 'iceWall' // Lodowa Ściana (Marzanna, free action, once): 3 cells of ice wall in a line for 2 rounds
  | 'iceBlow' // Lodowy Cios (Jarl Szronu, attack ability, once): the target freezes (loses its next activation)
  | 'blizzardTrail' // Ślad Zamieci (Ryś Śnieżny, passive): the cells it has run through slow the enemies that step on them until the end of the round
  | 'frostSlow' // Lodowa Igła (Chochlik Szronu, attack ability, once): the target has -S in its next activation
  | 'crystalArrow' // Kryształowa Strzała (Szronowy Paź, passive): + damage against a target that has frost
  | 'thickFur' // Gęste Futro (Jak Lodowcowy, passive): -1 damage from arrows and bolts
  | 'frostArmor' // Mroźna Zbroja (Rycerz Lodowej Zbroi, passive): whoever hits it in melee gets frost
  | 'bellOfGlass' // Szklany Dzwoneczek (Rusałka Szronu, free action, once): an enemy that has frost freezes
  | 'frostGrip' // Zmrażający Uścisk (Młody Olbrzym Szronu, attack ability, once): the target cannot move in its next activation and gets frost
  | 'abduct' // Porwanie (Strzyga Wichru, free action, once): a small enemy is lifted and put 2-3 cells away, away from its allies
  | 'hailStones' // Grad Głazów (Olbrzym Gradu, Stary Gradowy, passive): the shot hits the target and its neighbours, each gets frost
  | 'coldLight' // Zimne Światło (Duch Zorzy, passive aura): enemies within 2 cells have -1 S
  | 'longNight' // Długa Noc (Mamut Wiecznej Zimy, free action, once): every enemy gets frost; cannot be moved
  // Wolne Kompanie (docs/frakcje/free.md): hidden traps (Sidła), a mark on the target, a veiled unit, loot in battle, a bonus for wounds, a counterblow, an obstacle put up.
  | 'ploy' // Fortel (Ruda Atamanka, free action, once): lays one more hidden trap or moves one of her own
  | 'dugIn' // Okop (Borsuk Saper, free action, once): armour and cannot be moved until the end of its next activation
  | 'ravenEye' // Oko Kruka (Kruk Wieszczek, free action, once): marks an enemy until the end of the round and uncovers traps and veiled units within 2 cells
  | 'pickpocket' // Kieszonkowiec (Kuna Złodziejka, passive): the first blow on a hero in the battle gives the faction gold
  | 'branchShot' // Strzał z Gałęzi (Wiewiórka Łuczniczka, passive): + damage against a marked target
  | 'dam' // Tama (Bóbr Inżynier, free action, once): puts an obstacle on a neighbouring cell
  | 'stinkBomb' // Smrodliwa Mikstura (Tchórz Smrodnik, attack ability, once): the target and its neighbours are poisoned
  | 'veiled' // Ukryty (Jenot Szpieg, passive): starts the battle unseen by the enemy; the first attack hits harder and uncovers it
  | 'woundFury' // Furia Ran (Rosomak Zabijaka, passive): + damage for every few missing Życie
  | 'blast' // Ładunek (Borsuk Petardnik, free action, once): turns one of its own traps into an explosion
  | 'riposte' // Riposta (Kocur Fechmistrz, passive): whoever strikes it in melee and survives takes a counterblow
  | 'towerShot' // Ruchoma Twierdza (Waran Wieżowy, passive): once a round the turret on its back shoots as well
  | 'wildLeap' // Szalony Skok (Żbiczka Bajdurka, passive): once per battle a leap over everything and a harder blow
  // Imperium Piasków (docs/frakcje/sands.md): mirages (decoys), buried units, a reaction to an enemy that steps up, a unit that sleeps until woken, units moved by their own side.
  | 'sandGate' // Piaskowa Brama (Dżin Wezyr, free action, once): moves an ally to any free cell within a radius
  | 'riddle' // Zagadka (Sfinks Strażnik, free action, once): an enemy in range does not attack in its next activation
  | 'sandAmbush' // Zasadzka Spod Piasku (Królowa Skorpionów, passive): starts the battle buried anywhere on her half, unseen until she moves; every hit poisons
  | 'napWatch' // Czujna Drzemka (Bastia Cienista, free action, once): lies down instead of moving: armour, cannot be pushed, and the first enemy to step up is struck at once
  | 'jackalWatch' // Czujność (Szakalogłowy Strażnik, passive): the first enemy to step up next to it in a round is struck at once
  | 'venomImmune' // Odporność na Jad (Mangusta Faraona, passive): poison, curses, slows and roots do not work on it
  | 'coverShot' // Strzał zza Wydmy (Łucznik Wydm, passive): + A while it stands next to an obstacle
  | 'hypnosis' // Hipnoza (Kobra Królewska, attack ability, once): the target cannot move in its next activation
  | 'mirageMake' // Lustro Wydm (Tancerka Fata Morgany, free action, once): a mirage of an ally appears on a free cell near her
  | 'awakening' // Przebudzenie (Kamienny Strażnik Grobowca, passive): armour; stands dormant until an enemy steps up next to it or hits it, then + A for the battle
  | 'gateWard' // Strażnik Bram (Lamassu, passive): armour; the allies next to it cannot be moved or pushed by the enemy
  | 'sandStorm' // Burza Piaskowa (Dżin Burzy Piaskowej, free action, once): enemy shooters have - A until the end of the round
  | 'rocLift' // Lot ze Skrzydłem (Ptak Rok, free action, once): an adjacent ally flies with it to its next move
  | 'wyrmBurrow'; // Spod Piasku (Czerw Pustyni, once per move): buries itself instead of moving and rises on a free cell within a radius, pushing its neighbours away

export interface UnitDef {
  id: string;
  name: string;
  /** The faction the unit belongs to (the key of its data and graphics: not the side that plays it), or 'neutral'. */
  side: FactionId | 'neutral';
  kind: UnitKind;
  hp: number;
  attack: number;
  speed: number;
  movement: MovementType;
  attackType: AttackType;
  ability: AbilityId;
  abilityName: string;
  abilityText: string;
  /** Digital ruleset only: 2 = a large unit lying on two cells (head + tail). Default 1. */
  size?: 1 | 2;
  /** A guardian's second card, for the duel on the board: less Życie and an ability that works one on one. */
  duel?: DuelCard;
}

export interface DuelCard {
  hp: number;
  ability: AbilityId;
  abilityName: string;
  abilityText: string;
}

/**
 * Numbers used by abilities. TEST values like the stats: the engine and the card texts
 * read them from here.
 */
export const ABILITY = {
  sunburstBonus: 1,
  /** Słoneczny Blask: the dragon's own bonus. */
  sunburstSelfBonus: 3,
  lightChargeBonus: 2,
  lightChargeMinMove: 4,
  rootsSlow: 2,
  giftOfLifeHeal: 3,
  airDashRange: 3,
  /** Zew Krwi: bonus to every attack on an enemy that is already wounded. */
  bloodCallBonus: 1,
  hardHeadIgnore: 2,
  /** Opiekun Gaju: damage the bear ignores from the blow it takes over. */
  guardianIgnore: 3,
  curseMinus: 1,
  webRange: 4,
  nightAmbushBonus: 3,
  nestLeapRange: 4,
  /** Kamienna Skóra: damage the Cyclops ignores from every blow in a duel. */
  stoneSkinIgnore: 1,
  /** Złodziejski Szpon: Życie the Griffin takes back with every blow that wounds in a duel. */
  thiefClawHeal: 1,
  /** Odrastające Głowy: Życie the Hydra gets back at the start of each of its activations in a duel. */
  regrowthHeal: 2,
  /** Rozprysk: damage a dying Kruszyniec deals to every neighbouring unit (small scale: multiply by `scaleOf`). */
  shardBurstDamage: 1,
  /** Podkop: how far the Podkopnik may come up from where it dug in. */
  burrowRange: 4,
  /** Nurkowanie: the Eagle must have flown at least this far for the bonus. */
  diveMinMove: 3,
  diveBonus: 1,
  /** Zajście od tyłu: bonus for a blow from behind (small scale). */
  backstabBonus: 1,
  /** Bagienne Odrastanie: Życie regained at the start of each activation (hp scale). */
  bogRegrowthHeal: 1,
  /** Kamienny Golem: damage ignored from every blow while its rune core is covered (small scale), and what the Trzęsienie deals (small scale). */
  runeSkinIgnore: 1,
  quakeDamage: 1,
  /** Król Burzy: teleport range, how many rounds the charged field lasts (this one and the next), field and Wyładowanie damage (small scale). */
  stormTeleportRange: 6,
  chargedFieldRounds: 2,
  chargedFieldDamage: 1,
  dischargeDamage: 1,
  /** Kolce: damage dealt to whoever hits the Jeżozwierz in melee (small scale). */
  quillsDamage: 1,
  /** Strzał i Galop: how far the Centaur may fall back after its shot. */
  gallopRange: 3,
  /** Czołowe Natarcie: bonus for a blow at the target's front (small scale). */
  headlongBonus: 2,
  /** Korzenie Drzewa: Życie each neighbouring ally regains (hp scale). */
  treeRootsHeal: 2,
  /** Zatruty Pazur: Życie lost at the start of each of the next `poisonTicks` activations (small scale). */
  poisonDamage: 1,
  poisonTicks: 2,
  /** Obława: bonus when the target stands next to another ally of the Ogar (small scale). */
  packHuntBonus: 1,
  /** Pożoga: damage to the target's neighbours (small scale; the target takes the blow itself). */
  infernoDamage: 1,
  /** Bitewny Szał: damage ignored from every blow (small scale, a blow that lands takes at least 1) and the bonus after a kill (small scale). */
  bloodRageArmor: 1,
  bloodRageBonus: 2,
  /** Dzikie Stada. Zderzenie: damage a pushed unit takes when it hits an obstacle, the edge of the arena or another unit (small scale; the unit it hits takes it too). */
  collisionDamage: 1,
  /** Byczy Łeb: cells the target is pushed. */
  headbuttPush: 1,
  /** Skoczny Rytm and Róg Wędrówki: S an ally gets in its next activation. */
  rhythmHaste: 2,
  hornHaste: 2,
  /** Rozpęd: bonus after a run of at least `momentumMinMove` cells (small scale). */
  momentumBonus: 1,
  momentumMinMove: 3,
  /** Niewzruszony: damage ignored from every blow (small scale, a blow that lands takes at least 1). */
  unmovedArmor: 1,
  /** Lot na Strzelców: bonus against a target pushed in the same round (small scale). */
  hippoBonus: 2,
  /** Bęben Wędrówki: radius of the aura and S the allies in it have. */
  drumRadius: 2,
  drumHaste: 1,
  /** Taran: the run it needs, cells the target is pushed and the collision damage (small scale). */
  ramMinMove: 3,
  ramPush: 2,
  ramCollisionDamage: 2,
  /** Rykowisko: how far the moose may call out an enemy. */
  roarRange: 3,
  /** Ziemia Drży: radius of the shock (small enemies in it are pushed 1 cell). */
  tremorRadius: 2,
  /** Rogi Przodków: cells the target is pushed. */
  hornsPush: 2,
  /** Królestwo Umarłych. Kości Wracają: Życie a skeleton stands up with (it is multiplied by the Życie scale). */
  bonesHp: 1,
  /** Zgaszone Światło: mana the enemy hero loses. */
  dimLightMana: 2,
  /** Widmowa Szarża: bonus of the blow (small scale), and the extra one from behind. */
  spectralBonus: 2,
  spectralBehind: 2,
  /** Postrach: A the neighbouring enemies lose (small scale; does not add up). */
  dreadMinus: 1,
  /** Pusta w Środku: damage ignored from every blow (small scale, a blow that lands takes at least 1). */
  hollowArmor: 1,
  /** Lament: radius, and A the enemies lose in their next attack (small scale). */
  wailRadius: 2,
  wailMinus: 1,
  /** Podnieście Mi Powieki: how far the Wij looks. */
  gazeRange: 3,
  /** Ponowny Oddech: the highest tier of a support she raises. */
  breathAgainTier: 3,
  /** Żniwo Many: mana taken from the enemy hero by a hit, and Życie the lich regains (it is multiplied by the Życie scale). */
  reapMana: 1,
  reapHeal: 1,
  /** Oddech Grobu: S the ones hit by it lose in their next activation. */
  graveBreathSlow: 1,
  /** Dzwon Zaduszny: S the neighbours lose in their next activation. */
  tollSlow: 2,
  /** Żelazne Klany. Przysięga Tarczy / Runa Kamienia / Pawęż: armour (damage ignored from every blow, small scale; a blow that lands takes at least 1). */
  oathArmor: 1,
  runeStoneArmor: 1,
  bulwarkArmor: 1,
  /** Salwa z Miejsca: A when the unit has not moved, Hartowanie: A for the neighbour, Na Duże Cele: A against large units (small scale). */
  standShotBonus: 2,
  temperBonus: 1,
  giantBonus: 2,
  /** Błędne Światło: how far the Skarbnik looks and how far it moves the enemy. */
  misleadRange: 4,
  misleadSteps: 2,
  /** Fortyfikacja: cells of wall put up. */
  fortifyCells: 2,
  /** Dwór Wiecznego Szronu. Lodowa Ściana: cells of the wall, how many rounds it stands (the round it is raised in and the next) and how far from Marzanna it may be put. */
  iceWallCells: 3,
  iceWallRounds: 2,
  iceWallReach: 3,
  /** Lodowa Igła: S the target loses in its next activation. */
  needleSlow: 2,
  /** Kryształowa Strzała: bonus against a target that has frost (small scale). Gęste Futro: damage ignored from arrows and bolts (small scale, a blow that lands takes at least 1). */
  crystalBonus: 1,
  furArmor: 1,
  /** Szklany Dzwoneczek: how far Rusałka looks. */
  bellRange: 4,
  /** Porwanie: how far the Strzyga reaches for a small enemy, and how far (at least, at most) she puts it from where it stood. */
  abductRange: 2,
  abductMin: 2,
  abductMax: 3,
  /** Zimne Światło: radius of the aura and S the enemies in it lose. */
  chillRadius: 2,
  chillSlow: 1,
  /** Ślad Zamieci: S an enemy that steps on the trail loses in its next activation. */
  trailSlow: 1,
  /** Mroźna Zbroja, Grad Głazów, Długa Noc, Zmrażający Uścisk: frost put on the unit. */
  frostPut: 1,
  /** Wolne Kompanie. Sidła: damage of a trap that goes off (small scale). */
  trapDamage: 2,
  /** Oznaczenie: bonus of every attack of the marker's side on a marked target (small scale), and the extra bonus of Strzał z Gałęzi. */
  markBonus: 1,
  branchBonus: 1,
  /** Oko Kruka: how far the Raven sees an enemy to mark, and the radius in which it uncovers traps and veiled units. */
  ravenRange: 5,
  ravenRadius: 2,
  /** Kieszonkowiec: gold the first blow at a hero gives the faction. */
  pickpocketGold: 1,
  /** Ukryty: bonus of the first attack out of hiding (small scale). */
  veilBonus: 2,
  /** Furia Ran: Życie missing (hp scale) for every +1 A, and the most it adds (small scale). */
  furyStep: 2,
  furyMax: 3,
  /** Ładunek: damage of the explosion on the trap's cell and on every cell next to it (small scale; allies are hurt too). */
  blastDamage: 3,
  /** Riposta: damage returned to a melee attacker (small scale). */
  riposteDamage: 2,
  /** Ruchoma Twierdza: damage of the turret's shot (small scale). */
  towerDamage: 2,
  /** Okop: armour (small scale) and how many activations of the Saper it lasts (the rest of this one and the next). */
  dugInArmor: 2,
  dugInActivations: 2,
  /** Szalony Skok: how far Żbiczka leaps and her bonus Atak after the leap (small scale). */
  wildLeapRange: 3,
  wildLeapBonus: 1,
  /** Imperium Piasków. Piaskowa Brama: radius in which the Wezyr puts an ally down. Zagadka: range. */
  gateRadius: 4,
  riddleRange: 5,
  /** Zasadzka Spod Piasku: Życie lost by the poisoned (same ticks as the other poisons). */
  /** Czujność / Czujna Drzemka: damage of the blow struck at once at an enemy that steps up (small scale). */
  watchDamage: 2,
  /** Strzał zza Wydmy: bonus A next to an obstacle (small scale). */
  coverBonus: 1,
  /** Lustro Wydm: how far from the Dancer a mirage may appear. */
  mirageReach: 2,
  /** Przebudzenie: armour (small scale) of the stone guardian, and the + A it gets on waking. */
  awakeningArmor: 2,
  awakeningBonus: 2,
  /** Strażnik Bram: armour of the Lamassu (small scale). */
  gateWardArmor: 2,
  /** Burza Piaskowa: A the enemy shooters lose until the end of the round (small scale). */
  stormMinus: 2,
  /** Spod Piasku (Czerw): how far it rises from where it buried itself. */
  wyrmRange: 3,
};

/**
 * Hero milestones (digital Expedition, hero growth): the abilities' numbers at the start and after levels 3, 6 and 9 (small scale; the battle scale
 * multiplies them). Index 0 is the base value of `ABILITY`. Provisional: tune with the simulations.
 */
export const ABILITY_TIERS = {
  sunburstBonus: [ABILITY.sunburstBonus, 2, 2, 2],
  sunburstSelfBonus: [ABILITY.sunburstSelfBonus, 3, 4, 5],
  lightChargeBonus: [ABILITY.lightChargeBonus, 3, 4, 5],
  guardianIgnore: [ABILITY.guardianIgnore, 5, 5, 7],
  bloodCallBonus: [ABILITY.bloodCallBonus, 2, 3, 4],
  hardHeadIgnore: [ABILITY.hardHeadIgnore, 3, 4, 5],
  /** Ognisty Oddech: extra Atak against both targets. */
  breathBonus: [0, 1, 2, 2],
  /** Kacza Furia: Życie the duck takes back when its blow kills. */
  duckKillHeal: [0, 1, 2, 3],
} as const;
/** From this milestone on: the bear guards any ally (not only a neighbour), the Black Dragon may breathe twice, the duck's extra activation is faster. */
export const MILESTONE_TIER = { bearAnyAlly: 2, breathTwice: 3, duckHaste: 3 } as const;

const u = (d: UnitDef): UnitDef => d;

/**
 * Digital ruleset: a shooter that moves has used its turn (no move + shot), so shooters hit harder to make up for it.
 * Provisional: tune with `make sim-tabele` once the digital edition has its own balance tables.
 */
export const DIGITAL_RANGED_BONUS = 1;

/**
 * Digital ruleset: every unit of the Horde (heroes and supports) has this much more Życie and Atak than on the board card. Przymierze won about 66% of
 * the bot games of the symmetric goals (control, conquest, relic) on every map; with +1 Ż and +1 A for the Horde it wins about 50% (the board game is untouched).
 * The unit tables (`UNITS`) stay as the board cards print them. Not in the arena (one hero and two supports on a side, tuned to 50% without it).
 */
export const HORDE_DIGITAL_BONUS = { hp: 1, attack: 1 };

/**
 * Digital ruleset: the numbers of a unit's battle stats that differ from the board game's (the rest stay as in UNITS).
 * Each Przymierze hero has one trait: the Gold Dragon hits hardest (7 A, brittle), the Ancient Bear has the most life (12 Ż, slow),
 * the Unicorn King is the fastest (10 S). The Black Dragon gets 6 A so that the Horde keeps up. Tuned with `make sim-arena` (SIM_DIGITAL=1):
 * every hero wins 48–52% of arena games, Przymierze 50.0% overall (150 games per line-up pair).
 */
export const DIGITAL_STATS: Record<string, Partial<Pick<UnitDef, 'hp' | 'attack' | 'speed'>>> = {
  goldDragon: { hp: 7, attack: 7, speed: 4 },
  ancientBear: { hp: 12, attack: 4, speed: 3 },
  unicornKing: { hp: 8, attack: 5, speed: 10 },
  blackDragon: { attack: 6 },
  /** The Pegasus (a two-hex target) lost to the Elf Druid and the Nymph (40% against 54–56%, with growth 34% against 65–83%): 5 Ż and 3 A level it (`make sim-supports`). */
  pegasus: { hp: 5, attack: 3 },
};

/**
 * Objective 'control' (digital ruleset): three control points on the map (one in the middle, worth `centreWeight`, one on each side, mirrored,
 * worth 1). A side holds a point while its hero stands on it at the end of the round; the side that holds more points (by worth) for
 * `roundsToWin` rounds in a row wins. At the round limit the side that led for more rounds wins (level goes to the Horde, as the limit does in the
 * crystals game). Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const CONTROL = {
  points: 3,
  centreWeight: 2,
  /** Extra rounds in a row the Przymierze needs: it moves first in a round, so it reaches the middle first (a side that holds the middle from its first turn would otherwise win too often). */
  dawnExtraRounds: 1,
  roundsToWin: { short: 3, medium: 3, long: 4, veryLong: 5, huge: 6, giant: 7 } as Record<MapSize, number>,
};

/**
 * Objective 'survival' (digital ruleset): the Przymierze win when `rounds` rounds have passed with at least one hero alive;
 * the Horde win when every hero falls. Every `waveEvery` rounds the automaton's reserves arrive (a new hero in the Horde base)
 * while it fields fewer heroes than the Przymierze have alive plus `extra`. Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const SURVIVAL = {
  waveEvery: 2,
  extra: 1,
  rounds: { short: 6, medium: 9, long: 14, veryLong: 18, huge: 22, giant: 26 } as Record<MapSize, number>,
};

/**
 * Map shapes other than the triangle (digital ruleset). Rectangle: `width` × `height` hexes, the bases in the middle of the short sides,
 * the Tree in the middle. Ring: hexes at distance `radius - 2` to `radius` from the centre (the lake inside is no map), the Tree and the bases on
 * three corners of the ring, so the three are equally far from each other. Sizes roughly match the triangle's number of hexes.
 */
export const MAP_SHAPES = {
  rectangle: { short: { width: 7, height: 4 }, medium: { width: 9, height: 5 }, long: { width: 13, height: 6 }, veryLong: { width: 15, height: 8 }, huge: { width: 18, height: 10 }, giant: { width: 21, height: 12 } },
  ring: { short: { radius: 3 }, medium: { radius: 4 }, long: { radius: 5 }, veryLong: { radius: 7 }, huge: { radius: 8 }, giant: { radius: 10 } },
  /** Islands: three land masses (the Przymierza's, the Tree's, the Horda's) between two channels; `bridges` hexes of each channel are bridges. */
  islands: { short: { width: 9, height: 5, bridges: 1 }, medium: { width: 11, height: 6, bridges: 2 }, long: { width: 15, height: 7, bridges: 2 }, veryLong: { width: 19, height: 9, bridges: 3 }, huge: { width: 23, height: 11, bridges: 3 }, giant: { width: 27, height: 13, bridges: 4 } },
} as const;

/** The map's round limit is multiplied by this on a shape other than the triangle (the roads are longer, and the limit goes to the Horde). */
export const SHAPE_ROUND_FACTOR = { triangle: 1, rectangle: 1.25, ring: 1.5, islands: 1.7, custom: 2 } as const;

/**
 * Objective 'boss' (digital ruleset): a guardian (the Hydra or the Cyclops) with `hp` Życie sits in a lair in the middle of the map and is
 * challenged like any guardian, but by both sides; the wounds stay between fights, and whoever strikes the last blow wins the game.
 * At the round limit the Horde win (as in the other goals). Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const BOSS = {
  hp: { short: 54, medium: 54, long: 62, veryLong: 92, huge: 104, giant: 116 } as Record<MapSize, number>,
  /** Life is multiplied by this when two Przymierza heroes play (two heroes strike twice as often). */
  twoHeroesFactor: 1.25,
  /** Without the Horde (rules.noHorde) nobody else wounds the Boss or hunts the heroes, so its Życie is multiplied by this. Tuned with `SIM_NOHORDE=1`. */
  noHordeFactor: 1.2,
  /** The neutral bosses (hero growth) are tougher than the Hydra and the Cyclops: their Życie is the table's times this. Tuned with `SIM_OBJECTIVE=boss`. */
  hpFactor: { stoneGolem: 0.5, stormKing: 0.5, kraken: 0.5 } as Record<string, number>,
};

/**
 * Objective 'artifact' (digital ruleset): the artifact lies in the middle of the map; the hero that carries it to its own base wins. The carrier
 * has `carrierSlow` move points fewer (a heavy load), so the other side can catch up. A fallen carrier drops it where it fell. At the round limit
 * the Horde win. Tuned with simulations (docs/ZASADY_CYFROWE.md).
 */
export const ARTIFACT = {
  carrierSlow: 1,
};

/**
 * Family mode (digital ruleset): the hero of a seat marked as a child is a little stronger, so a parent and a child can play on one team
 * without the child holding the team back: `extraHp` more Życie in battle and `extraMove` more move points on the map.
 */
export const FAMILY = { extraHp: 2, extraMove: 1 };

export const UNITS: Record<string, UnitDef> = Object.fromEntries(
  [
    u({ id: 'goldDragon', name: 'Złoty Smok', side: 'dawn', kind: 'hero', size: 2, hp: 9, attack: 5, speed: 4, movement: 'fly', attackType: 'melee', ability: 'sunburst', abilityName: 'Słoneczny Blask', abilityText: `Raz na bitwę: twoje jednostki +${ABILITY.sunburstBonus} A do następnego ataku, sam Smok +${ABILITY.sunburstSelfBonus} A.` }),
    u({ id: 'unicornKing', name: 'Król Jednorożców', side: 'dawn', kind: 'hero', size: 2, hp: 8, attack: 5, speed: 8, movement: 'walk', attackType: 'melee', ability: 'lightCharge', abilityName: 'Szarża Światła', abilityText: `+${ABILITY.lightChargeBonus} A do ataku wykonanego po ruchu o co najmniej ${ABILITY.lightChargeMinMove} pola.` }),
    u({ id: 'ancientBear', name: 'Prastary Niedźwiedź', side: 'dawn', kind: 'hero', size: 2, hp: 11, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'guardian', abilityName: 'Opiekun Gaju', abilityText: `Raz na bitwę: przyjmuje cios, który zabiłby jego lub sąsiada, i ignoruje ${ABILITY.guardianIgnore} obrażenia.` }),
    // Easter egg hero (not in FACTION_HEROES): fragile, fast and hits hard; every kill gives her another activation.
    u({ id: 'braveDuck', name: 'Dzielna Kaczka', side: 'dawn', kind: 'hero', hp: 3, attack: 6, speed: 10, movement: 'fly', attackType: 'melee', ability: 'duckFury', abilityName: 'Kacza Furia', abilityText: 'Gdy jej atak zabije wroga, Kaczka od razu aktywuje się jeszcze raz (ruch i atak). Bez limitu na bitwę.' }),
    // Fourth heroes of the two sides (rivalry for 7-8 players): they reuse abilities of the game.
    u({ id: 'moonWolf', name: 'Srebrna Wilczyca', side: 'dawn', kind: 'hero', hp: 8, attack: 4, speed: 6, movement: 'walk', attackType: 'melee', ability: 'packHunt', abilityName: 'Wilcza Rodzina', abilityText: `Stała: +${ABILITY.packHuntBonus} A, gdy cel sąsiaduje z innym sojusznikiem Wilczycy.` }),
    u({ id: 'elfDruid', name: 'Elf Druid', side: 'dawn', kind: 'support', hp: 4, attack: 1, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Splątane Korzenie', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'nymph', name: 'Nimfa', side: 'dawn', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'giftOfLife', abilityName: 'Dar Życia', abilityText: `Raz na bitwę: +${ABILITY.giftOfLifeHeal} Ż sojusznikowi, do maksimum.` }),
    u({ id: 'pegasus', name: 'Pegaz', side: 'dawn', kind: 'support', size: 2, hp: 4, attack: 2, speed: 4, movement: 'fly', attackType: 'melee', ability: 'airDash', abilityName: 'Powietrzny Zryw', abilityText: `Raz na bitwę: po ataku odskok do ${ABILITY.airDashRange} pól.` }),
    // Neutral encounters (digital ruleset). Stats are in the small scale, like the guardians'; see docs/ZASADY_CYFROWE.md.
    u({ id: 'shardling', name: 'Kruszyniec', side: 'neutral', kind: 'neutral', hp: 8, attack: 2, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'shardBurst', abilityName: 'Rozprysk', abilityText: `Po śmierci rozpryskuje się i rani o ${ABILITY.shardBurstDamage} wszystkie sąsiednie jednostki (także swoje).` }),
    u({ id: 'burrower', name: 'Podkopnik', side: 'neutral', kind: 'neutral', hp: 9, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'burrow', abilityName: 'Podkop', abilityText: `Zamiast ruchu znika pod ziemią i wyłania się na dowolnym wolnym polu w odległości do ${ABILITY.burrowRange}; w tej aktywacji nie atakuje.` }),
    u({ id: 'skyEagle', name: 'Orzeł Skalny', side: 'neutral', kind: 'neutral', hp: 7, attack: 2, speed: 6, movement: 'fly', attackType: 'melee', ability: 'dive', abilityName: 'Nurkowanie', abilityText: `Jeśli przed atakiem przeleciał co najmniej ${ABILITY.diveMinMove} pola, zadaje +${ABILITY.diveBonus} obrażeń.` }),
    u({ id: 'harpy', name: 'Harpia', side: 'neutral', kind: 'neutral', hp: 8, attack: 2, speed: 5, movement: 'fly', attackType: 'melee', ability: 'backstab', abilityName: 'Zajście od tyłu', abilityText: `+${ABILITY.backstabBonus} obrażeń, gdy atakuje z tyłu celu.` }),
    u({ id: 'pincer', name: 'Szczypiec', side: 'neutral', kind: 'neutral', hp: 12, attack: 2, speed: 2, movement: 'walk', attackType: 'melee', ability: 'grab', abilityName: 'Chwyt', abilityText: 'Trafiony wróg nie może się ruszyć do końca swojej następnej aktywacji.' }),
    u({ id: 'bogCrawler', name: 'Bagienny Pełzacz', side: 'neutral', kind: 'neutral', hp: 10, attack: 2, speed: 2, movement: 'walk', attackType: 'melee', ability: 'bogRegrowth', abilityName: 'Bagienne Odrastanie', abilityText: `Na początku swojej aktywacji odzyskuje ${ABILITY.bogRegrowthHeal} Ż.` }),
    u({ id: 'stoneGolem', name: 'Kamienny Golem', side: 'neutral', kind: 'neutral', size: 2, hp: 40, attack: 4, speed: 2, movement: 'walk', attackType: 'melee', ability: 'runeGolem', abilityName: 'Runiczny Rdzeń', abilityText: `Kamienna Skóra: każdy cios zadaje o ${ABILITY.runeSkinIgnore} mniej obrażeń. Gdy straci połowę Życia, rdzeń się odsłania: skóra znika, a po każdym jego ataku Trzęsienie zadaje ${ABILITY.quakeDamage} obrażenie wszystkim wokół.` }),
    u({ id: 'stormKing', name: 'Król Burzy', side: 'neutral', kind: 'neutral', hp: 30, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'stormKing', abilityName: 'Burza', abilityText: `Zamiast ruchu teleportuje się do ${ABILITY.stormTeleportRange} pól. Pole, które opuścił, przez ${ABILITY.chargedFieldRounds} rundy rani o ${ABILITY.chargedFieldDamage} każdego, kto na nie wejdzie. Kto uderzy go z bliska, dostaje ${ABILITY.dischargeDamage} obrażenie.` }),
    u({ id: 'kraken', name: 'Kraken', side: 'neutral', kind: 'neutral', size: 2, hp: 30, attack: 1, speed: 0, movement: 'walk', attackType: 'ranged', ability: 'tentacles', abilityName: 'Macki', abilityText: 'Dopóki żyje choć jedna macka, głowa jest nietykalna. Głowa strzela strugą wody w dowolnego wroga w zasięgu wzroku.' }),
    u({ id: 'tentacle', name: 'Macka Krakena', side: 'neutral', kind: 'neutral', hp: 6, attack: 2, speed: 0, movement: 'walk', attackType: 'melee', ability: 'none', abilityName: 'Macka', abilityText: 'Bije sąsiadów, nie rusza się.' }),
    u({ id: 'blackDragon', name: 'Czarny Smok', side: 'horde', kind: 'hero', size: 2, hp: 7, attack: 5, speed: 5, movement: 'fly', attackType: 'melee', ability: 'fireBreath', abilityName: 'Ognisty Oddech', abilityText: 'Raz na bitwę: pełny atak w dwóch wrogów stojących w jednej linii.' }),
    u({ id: 'werewolfLord', name: 'Władca Wilkołaków', side: 'horde', kind: 'hero', hp: 8, attack: 5, speed: 7, movement: 'walk', attackType: 'melee', ability: 'bloodCall', abilityName: 'Zew Krwi', abilityText: `+${ABILITY.bloodCallBonus} A do każdego ataku na już rannego wroga.` }),
    u({ id: 'ironFistOgre', name: 'Ogr Żelazna Pięść', side: 'horde', kind: 'hero', size: 2, hp: 10, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Twardogłowy', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'duskManticore', name: 'Mantykora Zmierzchu', side: 'horde', kind: 'hero', hp: 8, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'poisonClaw', abilityName: 'Jadowity Kolec', abilityText: `Raz na bitwę: trafiony wróg traci ${ABILITY.poisonDamage} Ż na początku swoich dwóch następnych aktywacji.` }),
    u({ id: 'goblinShaman', name: 'Goblin Szaman', side: 'horde', kind: 'support', hp: 5, attack: 1, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Złowroga Klątwa', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    u({ id: 'caveSpider', name: 'Pająk Jaskiniowy', side: 'horde', kind: 'support', hp: 6, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'web', abilityName: 'Pajęcze Sidła', abilityText: `Raz na bitwę: wróg do ${ABILITY.webRange} pól nie rusza się w następnej aktywacji.` }),
    u({ id: 'shadowBat', name: 'Nietoperz Cienia', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'fly', attackType: 'melee', ability: 'nightAmbush', abilityName: 'Nocna Zasadzka', abilityText: `Raz na bitwę: atak zadaje +${ABILITY.nightAmbushBonus} obrażenia.` }),
    // Level 3 recruits (tiers 2-5), digital ruleset only: they are not in FACTION_SUPPORTS but in RECRUITS (kingdom.ts).
    u({ id: 'hedgehog', name: 'Jeżozwierz', side: 'dawn', kind: 'support', hp: 8, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'quills', abilityName: 'Kolce', abilityText: `Stała: każdy, kto zaatakuje go wręcz, traci ${ABILITY.quillsDamage} Ż.` }),
    u({ id: 'centaur', name: 'Centaur', side: 'dawn', kind: 'support', hp: 6, attack: 3, speed: 5, movement: 'walk', attackType: 'ranged', ability: 'gallop', abilityName: 'Strzał i Galop', abilityText: `Raz na bitwę: po ataku może się cofnąć o maks. ${ABILITY.gallopRange} pola.` }),
    u({ id: 'boar', name: 'Alabastrowy Odyniec', side: 'dawn', kind: 'support', hp: 12, attack: 5, speed: 5, movement: 'walk', attackType: 'melee', ability: 'headlong', abilityName: 'Czołowe Natarcie', abilityText: `Stała: +${ABILITY.headlongBonus} obrażenia, gdy atakuje cel od przodu.` }),
    u({ id: 'treeGuardian', name: 'Opiekun Drzewa', side: 'dawn', kind: 'support', size: 2, hp: 15, attack: 6, speed: 3, movement: 'walk', attackType: 'melee', ability: 'treeRoots', abilityName: 'Korzenie Drzewa', abilityText: `Raz na bitwę: na początku swojej aktywacji leczy sąsiednich sojuszników o ${ABILITY.treeRootsHeal} Ż.` }),
    u({ id: 'ratman', name: 'Szczurołak', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 5, movement: 'walk', attackType: 'melee', ability: 'poisonClaw', abilityName: 'Zatruty Pazur', abilityText: `Raz na bitwę: trafiony wróg traci ${ABILITY.poisonDamage} Ż na początku swoich dwóch następnych aktywacji.` }),
    u({ id: 'hellhound', name: 'Piekielny Ogar', side: 'horde', kind: 'support', hp: 7, attack: 3, speed: 6, movement: 'walk', attackType: 'melee', ability: 'packHunt', abilityName: 'Obława', abilityText: `Stała: +${ABILITY.packHuntBonus} A, gdy cel sąsiaduje z innym sojusznikiem Ogara.` }),
    u({ id: 'salamander', name: 'Salamandra Popiołu', side: 'horde', kind: 'support', hp: 9, attack: 3, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'inferno', abilityName: 'Pożoga', abilityText: `Raz na bitwę: trafiony cel i jego sąsiedzi dostają ${ABILITY.infernoDamage} obrażenie.` }),
    u({ id: 'minotaurChief', name: 'Herszt Minotaurów', side: 'horde', kind: 'support', size: 2, hp: 15, attack: 5, speed: 4, movement: 'walk', attackType: 'melee', ability: 'bloodRage', abilityName: 'Bitewny Szał', abilityText: `Stała: pancerz (−${ABILITY.bloodRageArmor} obrażeń z każdego ciosu); po zabiciu wroga jego następny cios zadaje +${ABILITY.bloodRageBonus} A.` }),
    // Level 6 alternative recruits of tiers 2-5 (rule `empire`): each tier has two units, and the faction builds the dwelling of one of them (kingdom.ts ALT_UNITS). They reuse abilities of the game.
    u({ id: 'silverFox', name: 'Srebrny Lis', side: 'dawn', kind: 'support', hp: 5, attack: 3, speed: 6, movement: 'walk', attackType: 'melee', ability: 'airDash', abilityName: 'Lisi Uskok', abilityText: `Raz na bitwę: po ataku odskok do ${ABILITY.airDashRange} pól.` }),
    u({ id: 'dawnOwl', name: 'Sowa Świtu', side: 'dawn', kind: 'support', hp: 6, attack: 3, speed: 5, movement: 'fly', attackType: 'melee', ability: 'dive', abilityName: 'Cichy Nalot', abilityText: `Jeśli przed atakiem przeleciała co najmniej ${ABILITY.diveMinMove} pola, zadaje +${ABILITY.diveBonus} obrażeń.` }),
    u({ id: 'dryadArcher', name: 'Driada Łuczniczka', side: 'dawn', kind: 'support', hp: 8, attack: 4, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Strzała z Korzeni', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'whiteStag', name: 'Biały Jeleń', side: 'dawn', kind: 'support', size: 2, hp: 13, attack: 6, speed: 6, movement: 'walk', attackType: 'melee', ability: 'lightCharge', abilityName: 'Szarża Poroża', abilityText: `+${ABILITY.lightChargeBonus} A do ataku wykonanego po ruchu o co najmniej ${ABILITY.lightChargeMinMove} pola.` }),
    u({ id: 'goblinSlinger', name: 'Goblin Procarz', side: 'horde', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Przeklęty Kamień', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    u({ id: 'gargoyle', name: 'Gargulec', side: 'horde', kind: 'support', hp: 7, attack: 3, speed: 5, movement: 'fly', attackType: 'melee', ability: 'quills', abilityName: 'Kamienne Kolce', abilityText: `Stała: każdy, kto zaatakuje go wręcz, traci ${ABILITY.quillsDamage} Ż.` }),
    u({ id: 'caveTroll', name: 'Troll Jaskiniowy', side: 'horde', kind: 'support', hp: 13, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'regrowth', abilityName: 'Zrastanie Ran', abilityText: `Na początku każdej swojej aktywacji odzyskuje ${ABILITY.regrowthHeal} Ż.` }),
    u({ id: 'shadowWyvern', name: 'Wiwerna Cienia', side: 'horde', kind: 'support', size: 2, hp: 12, attack: 6, speed: 5, movement: 'fly', attackType: 'melee', ability: 'poisonClaw', abilityName: 'Jadowity Ogon', abilityText: `Raz na bitwę: trafiony wróg traci ${ABILITY.poisonDamage} Ż na początku swoich dwóch następnych aktywacji.` }),
    // Level 6 legendary recruits (digital ruleset, rule `empire`): one per faction, very expensive (kingdom.ts RECRUITS, tier 6).
    u({ id: 'dawnPhoenix', name: 'Feniks Świtu', side: 'dawn', kind: 'support', size: 2, hp: 14, attack: 6, speed: 6, movement: 'fly', attackType: 'melee', ability: 'rebirth', abilityName: 'Odrodzenie z Popiołów', abilityText: 'Raz na bitwę: gdy zginie, od razu wstaje na tym samym polu z połową Życia.' }),
    u({ id: 'doomBehemoth', name: 'Behemot Zagłady', side: 'horde', kind: 'support', size: 2, hp: 20, attack: 7, speed: 3, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Rozdzierające Szpony', abilityText: 'Każdym atakiem może trafić dwóch sąsiadujących przeciwników.' }),
    // Level 5 commanders (digital ruleset): the second hero a player hires in a tavern, one of three archetypes per faction (realm.ts). They reuse abilities of the game.
    u({ id: 'dawnKnight', name: 'Rycerz Świtu', side: 'dawn', kind: 'hero', hp: 7, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Tarcza Świtu', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'dawnHuntress', name: 'Łowczyni Gaju', side: 'dawn', kind: 'hero', hp: 5, attack: 3, speed: 5, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Strzała z Pnączy', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'dawnSage', name: 'Mędrzec Gaju', side: 'dawn', kind: 'hero', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'giftOfLife', abilityName: 'Dar Gaju', abilityText: `Raz na bitwę: +${ABILITY.giftOfLifeHeal} Ż sojusznikowi, do maksimum.` }),
    u({ id: 'hordeWarlord', name: 'Wódz Hordy', side: 'horde', kind: 'hero', hp: 8, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Żelazny Kark', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'hordeCrossbow', name: 'Kapitan Kuszników', side: 'horde', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'poisonClaw', abilityName: 'Zatruty Bełt', abilityText: `Raz na bitwę: trafiony wróg traci ${ABILITY.poisonDamage} Ż na początku swoich dwóch następnych aktywacji.` }),
    u({ id: 'hordeShadow', name: 'Szaman Cieni', side: 'horde', kind: 'hero', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Klątwa Cieni', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    // Dzikie Stada (`herds`, docs/frakcje/herds.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero.
    u({ id: 'greatAurochs', name: 'Wielki Tur, Ojciec Stada', side: 'herds', kind: 'hero', size: 2, hp: 12, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'ancestralHorns', abilityName: 'Rogi Przodków', abilityText: `Raz na bitwę: cios odpycha cel o ${ABILITY.hornsPush} pola; jeśli cel w coś uderzy, zderzenie rani.` }),
    u({ id: 'satyrHornlord', name: 'Satyr Rogogłos', side: 'herds', kind: 'hero', hp: 6, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'wanderHorn', abilityName: 'Róg Wędrówki', abilityText: `Raz na bitwę: wszyscy sojusznicy mają +${ABILITY.hornHaste} S w swojej następnej aktywacji.` }),
    u({ id: 'windAntelope', name: 'Pędziwiatr, Wódz Antylop', side: 'herds', kind: 'hero', hp: 8, attack: 4, speed: 7, movement: 'walk', attackType: 'melee', ability: 'runOn', abilityName: 'W Biegu', abilityText: 'Raz na bitwę: po ataku dokańcza ruch pozostałymi polami.' }),
    u({ id: 'thunderRam', name: 'Baran Gromowładny', side: 'herds', kind: 'hero', hp: 9, attack: 4, speed: 6, movement: 'walk', attackType: 'melee', ability: 'headbutt', abilityName: 'Grzmiący Łeb', abilityText: `Stała: po każdym ataku odpycha cel o ${ABILITY.headbuttPush} pole; zderzenie rani.` }),
    u({ id: 'satyrPiper', name: 'Satyr Dudziarz', side: 'herds', kind: 'support', hp: 5, attack: 1, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'rhythm', abilityName: 'Skoczny Rytm', abilityText: `Raz na bitwę: sojusznik ma +${ABILITY.rhythmHaste} S w swojej następnej aktywacji.` }),
    u({ id: 'youngAurochs', name: 'Młody Tur', side: 'herds', kind: 'support', hp: 6, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'headbutt', abilityName: 'Byczy Łeb', abilityText: `Stała: po każdym ataku odpycha cel o ${ABILITY.headbuttPush} pole (jednostek dwupolowych nie da się odepchnąć); zderzenie rani.` }),
    u({ id: 'rockGoat', name: 'Kozica Skalna', side: 'herds', kind: 'support', hp: 6, attack: 2, speed: 5, movement: 'walk', attackType: 'melee', ability: 'mountainLeap', abilityName: 'Skok po Turniach', abilityText: 'Stała: porusza się przez przeszkody i jednostki (nie może na nich stanąć).' }),
    u({ id: 'faunSlinger', name: 'Faun Procarz', side: 'herds', kind: 'support', hp: 6, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Kamień w Kolano', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'forestBison', name: 'Żubr Puszczański', side: 'herds', kind: 'support', hp: 10, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'unmoved', abilityName: 'Niewzruszony', abilityText: `Stała: pancerz (−${ABILITY.unmovedArmor} obrażeń z każdego ciosu); nie da się go odepchnąć.` }),
    u({ id: 'steppeHippogriff', name: 'Hipogryf Stepowy', side: 'herds', kind: 'support', size: 2, hp: 10, attack: 4, speed: 7, movement: 'fly', attackType: 'melee', ability: 'hippoStrike', abilityName: 'Lot na Strzelców', abilityText: `Stała: +${ABILITY.hippoBonus} A przeciw celowi odepchniętemu w tej samej rundzie.` }),
    u({ id: 'warRhino', name: 'Nosorożec Bojowy', side: 'herds', kind: 'support', size: 2, hp: 15, attack: 5, speed: 5, movement: 'walk', attackType: 'melee', ability: 'ram', abilityName: 'Taran', abilityText: `Stała: po biegu o co najmniej ${ABILITY.ramMinMove} pola cios odpycha cel o ${ABILITY.ramPush} pola, a zderzenie zadaje ${ABILITY.ramCollisionDamage} obrażenia. Oblężona brama pęka od jednego trafienia katapulty.` }),
    // Level 6 alternatives of the Herds (tiers 2-5).
    u({ id: 'tarpan', name: 'Tarpan', side: 'herds', kind: 'support', hp: 7, attack: 3, speed: 6, movement: 'walk', attackType: 'melee', ability: 'momentum', abilityName: 'Rozpęd', abilityText: `Stała: +${ABILITY.momentumBonus} A do ataku po biegu o co najmniej ${ABILITY.momentumMinMove} pola.` }),
    u({ id: 'satyrLancer', name: 'Satyr Kopijnik', side: 'herds', kind: 'support', hp: 8, attack: 3, speed: 5, movement: 'walk', attackType: 'melee', ability: 'pierce', abilityName: 'Przebicie', abilityText: 'Stała: cios trafia cel i wroga stojącego tuż za nim.' }),
    u({ id: 'drumElephant', name: 'Słoń z Bębnem', side: 'herds', kind: 'support', size: 2, hp: 13, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'drumBeat', abilityName: 'Bęben Wędrówki', abilityText: `Stała: sojusznicy w promieniu ${ABILITY.drumRadius} pól mają +${ABILITY.drumHaste} S.` }),
    u({ id: 'bullMoose', name: 'Łoś Rogacz', side: 'herds', kind: 'support', size: 2, hp: 16, attack: 5, speed: 3, movement: 'walk', attackType: 'melee', ability: 'roar', abilityName: 'Rykowisko', abilityText: `Raz na bitwę: wyzywa wroga w zasięgu ${ABILITY.roarRange} pól; ten w swojej następnej aktywacji może atakować tylko Łosia.` }),
    u({ id: 'indrik', name: 'Indrik, Pan Zwierząt', side: 'herds', kind: 'support', size: 2, hp: 21, attack: 7, speed: 4, movement: 'walk', attackType: 'melee', ability: 'tremor', abilityName: 'Ziemia Drży', abilityText: `Raz na bitwę: mali wrogowie w promieniu ${ABILITY.tremorRadius} pól zostają odepchnięci o 1 pole, zderzenia ranią. Indrika nie da się odepchnąć.` }),
    // Commanders of the Herds.
    u({ id: 'aurochsScout', name: 'Turzy Zagończyk', side: 'herds', kind: 'hero', hp: 9, attack: 4, speed: 5, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Kark Tura', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'faunJavelin', name: 'Faun Oszczepnik', side: 'herds', kind: 'hero', hp: 6, attack: 3, speed: 5, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Oszczep w Kolano', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'satyrSeer', name: 'Satyr Wróżbita', side: 'herds', kind: 'hero', hp: 6, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'rhythm', abilityName: 'Pieśń Stepu', abilityText: `Raz na bitwę: sojusznik ma +${ABILITY.rhythmHaste} S w swojej następnej aktywacji.` }),
    // Królestwo Umarłych (`undead`, docs/frakcje/undead.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero.
    u({ id: 'barrowKing', name: 'Król Kurhanu', side: 'undead', kind: 'hero', hp: 10, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'barrowCall', abilityName: 'Wezwanie z Kurhanu', abilityText: 'Raz na bitwę: poległy pomocnik wstaje na sąsiednim polu z połową Ż.' }),
    u({ id: 'lanternWraith', name: 'Latarniczka Mgieł', side: 'undead', kind: 'hero', hp: 5, attack: 2, speed: 5, movement: 'fly', attackType: 'ranged', ability: 'dimLight', abilityName: 'Zgaszone Światło', abilityText: `Raz na bitwę: trafiony cel ma −${ABILITY.curseMinus} A przy następnym ataku, a bohater wroga traci ${ABILITY.dimLightMana} many.` }),
    u({ id: 'headlessKnight', name: 'Bezgłowy Jeździec', side: 'undead', kind: 'hero', size: 2, hp: 9, attack: 5, speed: 6, movement: 'walk', attackType: 'melee', ability: 'spectralCharge', abilityName: 'Widmowa Szarża', abilityText: `Raz na bitwę: cios z bonusem +${ABILITY.spectralBonus} A, a od tyłu jeszcze +${ABILITY.spectralBehind} A.` }),
    u({ id: 'bellKeeper', name: 'Duch Starego Dzwonnika', side: 'undead', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'toll', abilityName: 'Dzwon Zaduszny', abilityText: `Raz na bitwę: sąsiedni wrogowie mają −${ABILITY.tollSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'skeletonSpear', name: 'Szkielet Halabardnik', side: 'undead', kind: 'support', hp: 4, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'bonesReturn', abilityName: 'Kości Wracają', abilityText: `Raz na bitwę: po śmierci składa się na końcu rundy z ${ABILITY.bonesHp} Ż.` }),
    u({ id: 'willOWisp', name: 'Błędny Ognik', side: 'undead', kind: 'support', hp: 3, attack: 2, speed: 5, movement: 'fly', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Zwodzenie', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'penitentShade', name: 'Zjawa Pokutnika', side: 'undead', kind: 'support', hp: 4, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'incorporeal', abilityName: 'Bezcielesna', abilityText: 'Raz na bitwę: pierwszy cios dystansowy w nią zadaje 0 obrażeń.' }),
    u({ id: 'skeletonArcher', name: 'Szkielet Łucznik', side: 'undead', kind: 'support', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'armorPierce', abilityName: 'Grot Przez Zbroję', abilityText: 'Stała: jego trafienia ignorują pancerz.' }),
    u({ id: 'hauntedArmor', name: 'Nawiedzona Zbroja', side: 'undead', kind: 'support', hp: 8, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'hollow', abilityName: 'Pusta w Środku', abilityText: `Stała: pancerz (−${ABILITY.hollowArmor} obrażeń z każdego ciosu); trucizna, klątwy, spowolnienia i unieruchomienia na nią nie działają.` }),
    u({ id: 'viy', name: 'Wij Podziemny', side: 'undead', kind: 'support', size: 2, hp: 12, attack: 5, speed: 3, movement: 'walk', attackType: 'melee', ability: 'viyGaze', abilityName: 'Podnieście Mi Powieki', abilityText: `Raz na bitwę: wróg w zasięgu ${ABILITY.gazeRange} pól nie ruszy się w swojej następnej aktywacji.` }),
    u({ id: 'lich', name: 'Lisz', side: 'undead', kind: 'support', hp: 8, attack: 6, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'manaReap', abilityName: 'Żniwo Many', abilityText: `Stała: każde trafienie zabiera bohaterowi wroga ${ABILITY.reapMana} many i leczy Lisza o ${ABILITY.reapHeal} Ż.` }),
    // Level 6 alternatives of the Kingdom (tiers 2-5).
    u({ id: 'scarecrow', name: 'Strach Polny', side: 'undead', kind: 'support', hp: 6, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'dread', abilityName: 'Postrach', abilityText: `Stała: sąsiedni wrogowie mają −${ABILITY.dreadMinus} A (nie sumuje się).` }),
    u({ id: 'banshee', name: 'Płaczka', side: 'undead', kind: 'support', hp: 6, attack: 4, speed: 5, movement: 'fly', attackType: 'ranged', ability: 'wail', abilityName: 'Lament', abilityText: `Raz na bitwę: wrogowie w promieniu ${ABILITY.wailRadius} pól mają −${ABILITY.wailMinus} A przy następnym ataku.` }),
    u({ id: 'boneOracle', name: 'Kościana Wróżka', side: 'undead', kind: 'support', hp: 7, attack: 4, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'breathAgain', abilityName: 'Ponowny Oddech', abilityText: `Raz na bitwę: poległy pomocnik poziomu ${ABILITY.breathAgainTier} lub niższego wstaje na sąsiednim polu z połową Ż.` }),
    u({ id: 'kostucha', name: 'Kostucha', side: 'undead', kind: 'support', hp: 13, attack: 6, speed: 4, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Kośba', abilityText: 'Każdym atakiem trafia cel i jednego jego sąsiada (zamach kosą).' }),
    u({ id: 'boneDragon', name: 'Kościany Smok', side: 'undead', kind: 'support', size: 2, hp: 20, attack: 7, speed: 5, movement: 'fly', attackType: 'melee', ability: 'graveBreath', abilityName: 'Oddech Grobu', abilityText: `Raz na bitwę: ognisty oddech w linii (cel i jednostka za nim), a trafieni mają −${ABILITY.graveBreathSlow} S w następnej aktywacji.` }),
    // Commanders of the Kingdom.
    u({ id: 'wardCaptain', name: 'Kapitan Warty', side: 'undead', kind: 'hero', hp: 8, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Czujna Warta', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'spectralArcher', name: 'Upiorna Łuczniczka', side: 'undead', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'entanglingRoots', abilityName: 'Zwodnicza Strzała', abilityText: `Raz na bitwę: trafiony wróg ma −${ABILITY.rootsSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'penitentMonk', name: 'Pokutny Mnich', side: 'undead', kind: 'hero', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'wail', abilityName: 'Pokutny Lament', abilityText: `Raz na bitwę: wrogowie w promieniu ${ABILITY.wailRadius} pól mają −${ABILITY.wailMinus} A przy następnym ataku.` }),
    // Żelazne Klany (`clans`, docs/frakcje/clans.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero.
    u({ id: 'ironThane', name: 'Tan Żelaznobrody', side: 'clans', kind: 'hero', hp: 10, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'shieldOath', abilityName: 'Przysięga Tarczy', abilityText: `Raz na bitwę: sąsiedni sojusznicy mają pancerz ${ABILITY.oathArmor} do końca rundy.` }),
    u({ id: 'runeMatron', name: 'Matka Run', side: 'clans', kind: 'hero', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'stoneRune', abilityName: 'Runa Kamienia', abilityText: `Raz na bitwę: sojusznik dostaje pancerz ${ABILITY.runeStoneArmor} do końca bitwy i nie da się go odepchnąć.` }),
    u({ id: 'passWarden', name: 'Strażniczka Przełęczy', side: 'clans', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'pierce', abilityName: 'Bełt Przeszywający', abilityText: 'Stała: cios trafia cel i wroga stojącego tuż za nim w jednej linii.' }),
    u({ id: 'oldMiner', name: 'Stary Górmistrz', side: 'clans', kind: 'hero', hp: 9, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'burrow', abilityName: 'Podkop', abilityText: `Zamiast ruchu znika pod ziemią i wyłania się na dowolnym wolnym polu w odległości do ${ABILITY.burrowRange}; w tej aktywacji nie atakuje.` }),
    u({ id: 'shieldDwarf', name: 'Krasnoludzki Tarczownik', side: 'clans', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'bulwark', abilityName: 'Pawęż', abilityText: `Stała: pancerz (−${ABILITY.bulwarkArmor} obrażeń z każdego ciosu).` }),
    u({ id: 'bronzeMole', name: 'Kret z Brązu', side: 'clans', kind: 'support', hp: 4, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'burrow', abilityName: 'Podkop', abilityText: `Zamiast ruchu znika pod ziemią i wyłania się na dowolnym wolnym polu w odległości do ${ABILITY.burrowRange}; w tej aktywacji nie atakuje.` }),
    u({ id: 'clanCrossbow', name: 'Kusznik Klanu', side: 'clans', kind: 'support', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'standShot', abilityName: 'Salwa z Miejsca', abilityText: `Stała: +${ABILITY.standShotBonus} A, gdy w tej aktywacji się nie ruszał.` }),
    u({ id: 'armoredBear', name: 'Niedźwiedź w Zbroi', side: 'clans', kind: 'support', hp: 9, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'bulwark', abilityName: 'Kolczuga', abilityText: `Stała: pancerz (−${ABILITY.bulwarkArmor} obrażeń z każdego ciosu).` }),
    u({ id: 'bronzeSentinel', name: 'Wartownik z Brązu', side: 'clans', kind: 'support', hp: 8, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'bronzeQuills', abilityName: 'Kolce Mechanizmu', abilityText: `Stała: każdy, kto zaatakuje go wręcz, traci ${ABILITY.quillsDamage} Ż; trucizna na niego nie działa.` }),
    u({ id: 'giantSlayer', name: 'Pogromca Olbrzymów', side: 'clans', kind: 'support', hp: 9, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'giantBane', abilityName: 'Na Duże Cele', abilityText: `Stała: +${ABILITY.giantBonus} A przeciw dużym jednostkom (dwupolowym).` }),
    u({ id: 'skarbnik', name: 'Skarbnik', side: 'clans', kind: 'support', hp: 7, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'misleadLight', abilityName: 'Błędne Światło', abilityText: `Raz na bitwę: wróg w zasięgu ${ABILITY.misleadRange} pól zostaje przestawiony o ${ABILITY.misleadSteps} pola od Skarbnika.` }),
    u({ id: 'hammerGuard', name: 'Gwardia Młota', side: 'clans', kind: 'support', hp: 12, attack: 5, speed: 3, movement: 'walk', attackType: 'melee', ability: 'stunBlow', abilityName: 'Młot Przodków', abilityText: 'Raz na bitwę: trafiony traci swoją następną aktywację.' }),
    u({ id: 'dwarfCannon', name: 'Armata Klanów', side: 'clans', kind: 'support', size: 2, hp: 13, attack: 5, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'cannonFire', abilityName: 'Ostrzał', abilityText: 'Stała: strzał trafia cel i jego sąsiadów; nie strzela w aktywacji, w której się ruszyła; mury i bramy oblężenia pękają od jednego trafienia.' }),
    u({ id: 'clanColossus', name: 'Kolos Kuźni', side: 'clans', kind: 'support', size: 2, hp: 20, attack: 7, speed: 3, movement: 'walk', attackType: 'melee', ability: 'fortify', abilityName: 'Fortyfikacja', abilityText: `Raz na bitwę stawia ${ABILITY.fortifyCells} pola muru obok siebie. Stała: pancerz ${ABILITY.bulwarkArmor}, nie da się go odepchnąć.` }),
    u({ id: 'battleSmith', name: 'Kowal Bitewny', side: 'clans', kind: 'support', hp: 6, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'temper', abilityName: 'Hartowanie', abilityText: `Raz na bitwę: sąsiedni sojusznik ma +${ABILITY.temperBonus} A do końca bitwy.` }),
    u({ id: 'goatRider', name: 'Jeździec na Koźle', side: 'clans', kind: 'support', hp: 7, attack: 3, speed: 5, movement: 'walk', attackType: 'melee', ability: 'goatLeap', abilityName: 'Skok po Turniach', abilityText: 'Raz na bitwę: jeden ruch przez jednostki i przeszkody (nie staje na nich).' }),
    // Commanders of the Clans.
    u({ id: 'clanWarrior', name: 'Wojownik Klanu', side: 'clans', kind: 'hero', hp: 8, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Twardy Łeb', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'mountainCrossbow', name: 'Kusznik Gór', side: 'clans', kind: 'hero', hp: 5, attack: 3, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'standShot', abilityName: 'Salwa z Miejsca', abilityText: `Stała: +${ABILITY.standShotBonus} A, gdy w tej aktywacji się nie ruszał.` }),
    u({ id: 'forgePriest', name: 'Kapłan Kuźni', side: 'clans', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'giftOfLife', abilityName: 'Żar Kuźni', abilityText: `Raz na bitwę: sojusznik odzyskuje ${ABILITY.giftOfLifeHeal} Ż.` }),
    // Dwór Wiecznego Szronu (`frost`, docs/frakcje/frost.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero.
    u({ id: 'marzanna', name: 'Marzanna, Pani Zimy', side: 'frost', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'iceWall', abilityName: 'Lodowa Ściana', abilityText: `Raz na bitwę: ${ABILITY.iceWallCells} pola muru z lodu w linii na ${ABILITY.iceWallRounds} rundy.` }),
    u({ id: 'frostJarl', name: 'Jarl Szronu', side: 'frost', kind: 'hero', size: 2, hp: 11, attack: 5, speed: 3, movement: 'walk', attackType: 'melee', ability: 'iceBlow', abilityName: 'Lodowy Cios', abilityText: 'Raz na bitwę: trafiony zamarza (traci następną aktywację).' }),
    u({ id: 'snowLynx', name: 'Ryś Śnieżny', side: 'frost', kind: 'hero', hp: 6, attack: 3, speed: 5, movement: 'walk', attackType: 'melee', ability: 'blizzardTrail', abilityName: 'Ślad Zamieci', abilityText: `Stała: wróg, który wejdzie na pole, przez które Ryś przebiegł w tej rundzie, ma −${ABILITY.trailSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'oldHailer', name: 'Stary Gradowy', side: 'frost', kind: 'hero', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'hailStones', abilityName: 'Grad Głazów', abilityText: 'Stała: strzał trafia cel i jego sąsiadów (wrogów); każdy trafiony dostaje szron.' }),
    u({ id: 'frostImp', name: 'Chochlik Szronu', side: 'frost', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'fly', attackType: 'ranged', ability: 'frostSlow', abilityName: 'Lodowa Igła', abilityText: `Raz na bitwę: trafiony ma −${ABILITY.needleSlow} S w swojej następnej aktywacji.` }),
    u({ id: 'ermine', name: 'Gronostaj Dworski', side: 'frost', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'backstab', abilityName: 'Zza Zaspy', abilityText: `Stała: +${ABILITY.backstabBonus} A, gdy atakuje od tyłu.` }),
    u({ id: 'courtPage', name: 'Szronowy Paź', side: 'frost', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'crystalArrow', abilityName: 'Kryształowa Strzała', abilityText: `Stała: +${ABILITY.crystalBonus} obrażeń w cel, który ma szron.` }),
    u({ id: 'blizzardWitch', name: 'Wiedźma Zamieci', side: 'frost', kind: 'support', hp: 7, attack: 3, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'curse', abilityName: 'Klątwa Chłodu', abilityText: `Raz na bitwę: trafiony ma −${ABILITY.curseMinus} A przy następnym ataku.` }),
    u({ id: 'glacierYak', name: 'Jak Lodowcowy', side: 'frost', kind: 'support', hp: 10, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'thickFur', abilityName: 'Gęste Futro', abilityText: `Stała: −${ABILITY.furArmor} obrażeń od strzał (cios, który trafia, zadaje co najmniej 1).` }),
    u({ id: 'iceSentinel', name: 'Rycerz Lodowej Zbroi', side: 'frost', kind: 'support', hp: 9, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'frostArmor', abilityName: 'Mroźna Zbroja', abilityText: `Stała: kto go trafi wręcz, dostaje ${ABILITY.frostPut} szron.` }),
    u({ id: 'frostSprite', name: 'Rusałka Szronu', side: 'frost', kind: 'support', hp: 6, attack: 3, speed: 4, movement: 'fly', attackType: 'ranged', ability: 'bellOfGlass', abilityName: 'Szklany Dzwoneczek', abilityText: `Raz na bitwę: wróg w zasięgu ${ABILITY.bellRange} pól, który ma szron, zamarza (traci następną aktywację).` }),
    u({ id: 'youngGiant', name: 'Młody Olbrzym Szronu', side: 'frost', kind: 'support', size: 2, hp: 13, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'frostGrip', abilityName: 'Zmrażający Uścisk', abilityText: `Raz na bitwę: trafiony nie rusza się w swojej następnej aktywacji i dostaje ${ABILITY.frostPut} szron.` }),
    u({ id: 'windStrzyga', name: 'Strzyga Wichru', side: 'frost', kind: 'support', hp: 7, attack: 4, speed: 5, movement: 'fly', attackType: 'melee', ability: 'abduct', abilityName: 'Porwanie', abilityText: `Raz na bitwę: unosi małego wroga w zasięgu ${ABILITY.abductRange} pól i stawia go ${ABILITY.abductMin}–${ABILITY.abductMax} pola dalej, z dala od jego sojuszników.` }),
    u({ id: 'elderGiant', name: 'Olbrzym Gradu', side: 'frost', kind: 'support', size: 2, hp: 14, attack: 5, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'hailStones', abilityName: 'Grad Głazów', abilityText: 'Stała: strzał trafia cel i jego sąsiadów (wrogów); każdy trafiony dostaje szron.' }),
    u({ id: 'auroraSpirit', name: 'Duch Zorzy', side: 'frost', kind: 'support', hp: 9, attack: 4, speed: 4, movement: 'fly', attackType: 'ranged', ability: 'coldLight', abilityName: 'Zimne Światło', abilityText: `Stała (aura): wrogowie w promieniu ${ABILITY.chillRadius} pól mają −${ABILITY.chillSlow} S.` }),
    u({ id: 'frostMammoth', name: 'Mamut Wiecznej Zimy', side: 'frost', kind: 'support', size: 2, hp: 24, attack: 7, speed: 3, movement: 'walk', attackType: 'melee', ability: 'longNight', abilityName: 'Długa Noc', abilityText: `Raz na bitwę: każdy wróg dostaje ${ABILITY.frostPut} szron. Stała: nie da się go odepchnąć.` }),
    // Commanders of the Court.
    u({ id: 'iceKnight', name: 'Rycerz Lodowej Gwardii', side: 'frost', kind: 'hero', hp: 8, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'hardHead', abilityName: 'Lodowa Gwardia', abilityText: `Raz na bitwę ignoruje do ${ABILITY.hardHeadIgnore} obrażeń z jednego trafienia.` }),
    u({ id: 'ermineHuntress', name: 'Tropicielka Mroźnych Puszcz', side: 'frost', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'crystalArrow', abilityName: 'Strzała z Soplem', abilityText: `Stała: +${ABILITY.crystalBonus} obrażeń w cel, który ma szron.` }),
    u({ id: 'frostWitch', name: 'Szronowa Wiedźma', side: 'frost', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'wail', abilityName: 'Zimowy Lament', abilityText: `Raz na bitwę: wrogowie w promieniu ${ABILITY.wailRadius} pól mają −${ABILITY.wailMinus} A przy następnym ataku.` }),
    // Wolne Kompanie (`free`, docs/frakcje/free.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero (numbers: gate G1, tuned at G2).
    u({ id: 'foxCaptain', name: 'Ruda Atamanka', side: 'free', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'ploy', abilityName: 'Fortel', abilityText: 'Raz na bitwę: kładzie dodatkową ukrytą pułapkę na swojej połowie albo przenosi jedną własną.' }),
    u({ id: 'badgerSapper', name: 'Borsuk Saper', side: 'free', kind: 'hero', hp: 10, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'dugIn', abilityName: 'Okop', abilityText: `Raz na bitwę: do końca swojej następnej aktywacji ma pancerz ${ABILITY.dugInArmor} i nie da się go odepchnąć.` }),
    u({ id: 'ravenSeer', name: 'Kruk Wieszczek', side: 'free', kind: 'hero', hp: 4, attack: 2, speed: 5, movement: 'fly', attackType: 'ranged', ability: 'ravenEye', abilityName: 'Oko Kruka', abilityText: `Raz na bitwę: wróg w zasięgu ${ABILITY.ravenRange} pól jest oznaczony do końca rundy (każdy atak Kompanii w niego ma +${ABILITY.markBonus}), a pułapki i ukryci wrogowie w promieniu ${ABILITY.ravenRadius} pól zostają odsłonięci.` }),
    u({ id: 'otterSmuggler', name: 'Wydra Przemytniczka', side: 'free', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'airDash', abilityName: 'Odskok', abilityText: `Raz na bitwę: po ataku może odskoczyć o maks. ${ABILITY.airDashRange} pola.` }),
    u({ id: 'otterScout', name: 'Wydra Zwiadowczyni', side: 'free', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'airDash', abilityName: 'Wyślizg', abilityText: `Raz na bitwę: po ataku może odskoczyć o maks. ${ABILITY.airDashRange} pola.` }),
    u({ id: 'martenThief', name: 'Kuna Złodziejka', side: 'free', kind: 'support', hp: 4, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'pickpocket', abilityName: 'Kieszonkowiec', abilityText: `Stała: pierwszy cios w bohatera w bitwie daje frakcji +${ABILITY.pickpocketGold} zł.` }),
    u({ id: 'squirrelArcher', name: 'Wiewiórka Łuczniczka', side: 'free', kind: 'support', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'branchShot', abilityName: 'Strzał z Gałęzi', abilityText: `Stała: +${ABILITY.branchBonus} A przeciw oznaczonemu celowi.` }),
    u({ id: 'weaselKnife', name: 'Łasica Nożowniczka', side: 'free', kind: 'support', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'backstab', abilityName: 'Cios w Plecy', abilityText: `Stała: +${ABILITY.backstabBonus} A, gdy atakuje od tyłu.` }),
    u({ id: 'polecatPoisoner', name: 'Tchórz Smrodnik', side: 'free', kind: 'support', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'stinkBomb', abilityName: 'Smrodliwa Mikstura', abilityText: `Raz na bitwę: trafiony i jego sąsiedzi są zatruci (tracą ${ABILITY.poisonDamage} Ż na początku ${ABILITY.poisonTicks} następnych aktywacji).` }),
    u({ id: 'wolverine', name: 'Rosomak Zabijaka', side: 'free', kind: 'support', hp: 9, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'woundFury', abilityName: 'Furia Ran', abilityText: `Stała: +1 A za każde ${ABILITY.furyStep} brakujące Ż (najwyżej +${ABILITY.furyMax}).` }),
    u({ id: 'toadGunner', name: 'Ropuch z Hakownicą', side: 'free', kind: 'support', size: 2, hp: 12, attack: 5, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'stunBlow', abilityName: 'Huk Hakownicy', abilityText: 'Raz na bitwę: trafiony traci następną aktywację (ogłuszony hukiem).' }),
    u({ id: 'beaverEngineer', name: 'Bóbr Inżynier', side: 'free', kind: 'support', hp: 7, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'dam', abilityName: 'Tama', abilityText: 'Raz na bitwę: stawia przeszkodę na sąsiednim wolnym polu (stoi do końca bitwy).' }),
    u({ id: 'raccoonDogSpy', name: 'Jenot Szpieg', side: 'free', kind: 'support', hp: 6, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'veiled', abilityName: 'Ukryty', abilityText: `Stała: zaczyna bitwę niewidoczny dla wroga (nie da się go wybrać na cel); pierwszy atak ma +${ABILITY.veilBonus} A i go odsłania.` }),
    u({ id: 'badgerBomber', name: 'Borsuk Petardnik', side: 'free', kind: 'support', hp: 8, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'blast', abilityName: 'Ładunek', abilityText: `Raz na bitwę: zamienia własną pułapkę w wybuch (${ABILITY.blastDamage} obrażeń na jej polu i na sąsiednich, także swoim).` }),
    u({ id: 'catFencer', name: 'Kocur Fechmistrz', side: 'free', kind: 'support', hp: 10, attack: 4, speed: 4, movement: 'walk', attackType: 'melee', ability: 'riposte', abilityName: 'Riposta', abilityText: `Stała: kto uderzy go wręcz i przeżyje, dostaje ${ABILITY.riposteDamage} obrażeń.` }),
    u({ id: 'towerMonitor', name: 'Waran Wieżowy', side: 'free', kind: 'support', size: 2, hp: 22, attack: 6, speed: 3, movement: 'walk', attackType: 'melee', ability: 'towerShot', abilityName: 'Ruchoma Twierdza', abilityText: `Stała: atakuje wręcz, a raz na rundę dodatkowo strzela wieżyczka na jego grzbiecie (${ABILITY.towerDamage} obrażeń w najbliższego wroga na linii strzału).` }),
    // Commanders of the Free Companies.
    u({ id: 'martenSlasher', name: 'Kuna Rębajło', side: 'free', kind: 'hero', hp: 8, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'bloodCall', abilityName: 'Rąb do Kości', abilityText: `Stała: +${ABILITY.bloodCallBonus} A przeciw rannym.` }),
    u({ id: 'wildcatBajka', name: 'Żbiczka Bajdurka', side: 'free', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'wildLeap', abilityName: 'Szalony Skok', abilityText: `Raz na bitwę: skacze o ${ABILITY.wildLeapRange} pola ponad jednostkami, pułapkami i przeszkodami i atakuje z +${ABILITY.wildLeapBonus} A.` }),
    u({ id: 'hareHerbalist', name: 'Zajęczyca Zielarka', side: 'free', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'giftOfLife', abilityName: 'Zielarska Mikstura', abilityText: `Raz na bitwę: sojusznik odzyskuje ${ABILITY.giftOfLifeHeal} Ż.` }),
    // Imperium Piasków (`sands`, docs/frakcje/sands.md): heroes, supports, recruits of the tiers, the legend, the commanders and the fourth hero (numbers: gate G1, tuned at G2).
    u({ id: 'djinnVizier', name: 'Dżin Wezyr', side: 'sands', kind: 'hero', hp: 5, attack: 2, speed: 4, movement: 'fly', attackType: 'ranged', ability: 'sandGate', abilityName: 'Piaskowa Brama', abilityText: `Raz na bitwę: przenosi sojusznika na dowolne wolne pole w promieniu ${ABILITY.gateRadius} od siebie.` }),
    u({ id: 'sphinxWarden', name: 'Sfinks Strażnik', side: 'sands', kind: 'hero', size: 2, hp: 11, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'riddle', abilityName: 'Zagadka', abilityText: `Raz na bitwę: wybrany wróg w zasięgu ${ABILITY.riddleRange} pól nie atakuje w swojej następnej aktywacji.` }),
    u({ id: 'scorpionQueen', name: 'Królowa Skorpionów', side: 'sands', kind: 'hero', hp: 6, attack: 3, speed: 4, movement: 'walk', attackType: 'melee', ability: 'sandAmbush', abilityName: 'Zasadzka Spod Piasku', abilityText: 'Stała: zaczyna bitwę zakopana na dowolnym polu swojej połowy areny, niewidoczna dla wroga do pierwszego ruchu lub ataku; każde jej trafienie zatruwa.' }),
    u({ id: 'camelPrince', name: 'Wielbłądzi Książę', side: 'sands', kind: 'hero', hp: 6, attack: 3, speed: 5, movement: 'walk', attackType: 'ranged', ability: 'runOn', abilityName: 'Strzał i Galop', abilityText: 'Raz na bitwę: po strzale kończy ruch pozostałymi polami.' }),
    u({ id: 'jackalGuard', name: 'Szakalogłowy Strażnik', side: 'sands', kind: 'support', hp: 5, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'jackalWatch', abilityName: 'Czujność', abilityText: `Stała: pierwszy wróg, który w rundzie stanie obok, dostaje od razu cios (${ABILITY.watchDamage} obrażenia).` }),
    u({ id: 'pharaohMongoose', name: 'Mangusta Faraona', side: 'sands', kind: 'support', hp: 4, attack: 2, speed: 5, movement: 'walk', attackType: 'melee', ability: 'venomImmune', abilityName: 'Odporność na Jad', abilityText: 'Stała: nie działają na nią trucizna, klątwy, spowolnienie ani unieruchomienie.' }),
    u({ id: 'duneArcher', name: 'Łucznik Wydm', side: 'sands', kind: 'support', hp: 4, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'coverShot', abilityName: 'Strzał zza Wydmy', abilityText: `Stała: +${ABILITY.coverBonus} A, gdy stoi obok przeszkody.` }),
    u({ id: 'sandScorpion', name: 'Skorpion Piaskowy', side: 'sands', kind: 'support', hp: 5, attack: 3, speed: 3, movement: 'walk', attackType: 'melee', ability: 'poisonClaw', abilityName: 'Jad', abilityText: `Raz na bitwę: trafiony wróg traci ${ABILITY.poisonDamage} Ż na początku swoich dwóch następnych aktywacji.` }),
    u({ id: 'cobra', name: 'Kobra Królewska', side: 'sands', kind: 'support', hp: 5, attack: 2, speed: 4, movement: 'walk', attackType: 'melee', ability: 'hypnosis', abilityName: 'Hipnoza', abilityText: 'Raz na bitwę: trafiony wróg nie rusza się w swojej następnej aktywacji.' }),
    u({ id: 'mirageDancer', name: 'Tancerka Fata Morgany', side: 'sands', kind: 'support', hp: 4, attack: 2, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'mirageMake', abilityName: 'Lustro Wydm', abilityText: `Raz na bitwę: tworzy miraż wybranego sojusznika (nie bohatera) na wolnym polu w promieniu ${ABILITY.mirageReach} od siebie.` }),
    u({ id: 'ushabti', name: 'Kamienny Strażnik Grobowca', side: 'sands', kind: 'support', hp: 9, attack: 4, speed: 2, movement: 'walk', attackType: 'melee', ability: 'awakening', abilityName: 'Przebudzenie', abilityText: `Stała: pancerz ${ABILITY.awakeningArmor}. Stoi uśpiony, dopóki wróg nie stanie obok albo go nie trafi; wtedy budzi się i do końca bitwy ma +${ABILITY.awakeningBonus} A.` }),
    u({ id: 'lamassu', name: 'Lamassu', side: 'sands', kind: 'support', size: 2, hp: 14, attack: 4, speed: 3, movement: 'fly', attackType: 'melee', ability: 'gateWard', abilityName: 'Strażnik Bram', abilityText: `Stała: pancerz ${ABILITY.gateWardArmor}; sąsiednich sojuszników wróg nie przestawi ani nie odepchnie.` }),
    u({ id: 'oasisCrocodile', name: 'Krokodyl Oazowy', side: 'sands', kind: 'support', size: 2, hp: 14, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'grab', abilityName: 'Chwyt Szczęk', abilityText: 'Stała: trafiony wróg nie rusza się w swojej następnej aktywacji.' }),
    u({ id: 'stormDjinn', name: 'Dżin Burzy Piaskowej', side: 'sands', kind: 'support', hp: 7, attack: 3, speed: 4, movement: 'fly', attackType: 'ranged', ability: 'sandStorm', abilityName: 'Burza Piaskowa', abilityText: `Raz na bitwę: strzelcy wroga mają −${ABILITY.stormMinus} A do końca rundy.` }),
    u({ id: 'roc', name: 'Ptak Rok', side: 'sands', kind: 'support', size: 2, hp: 12, attack: 4, speed: 5, movement: 'fly', attackType: 'melee', ability: 'rocLift', abilityName: 'Lot ze Skrzydłem', abilityText: 'Raz na bitwę: wskazany sąsiedni sojusznik leci z Rokiem do jego następnego ruchu i ląduje obok niego.' }),
    u({ id: 'sandWyrm', name: 'Czerw Pustyni', side: 'sands', kind: 'support', size: 2, hp: 22, attack: 6, speed: 3, movement: 'walk', attackType: 'melee', ability: 'wyrmBurrow', abilityName: 'Spod Piasku', abilityText: `Zamiast ruchu zakopuje się i wynurza na wolnym polu w odległości do ${ABILITY.wyrmRange}, odpychając sąsiednich wrogów o 1 pole.` }),
    // Commanders of the Sands.
    u({ id: 'bastia', name: 'Bastia Cienista', side: 'sands', kind: 'hero', hp: 9, attack: 4, speed: 3, movement: 'walk', attackType: 'melee', ability: 'napWatch', abilityName: 'Czujna Drzemka', abilityText: `Raz na bitwę: zamiast ruchu kładzie się. Do końca swojej następnej aktywacji ma pancerz ${ABILITY.dugInArmor} i nie da się jej odepchnąć, a pierwszy wróg, który stanie obok, dostaje od razu cios (${ABILITY.watchDamage} obrażenia).` }),
    u({ id: 'caravanArcher', name: 'Łuczniczka Karawany', side: 'sands', kind: 'hero', hp: 5, attack: 3, speed: 4, movement: 'walk', attackType: 'ranged', ability: 'standShot', abilityName: 'Celny Strzał z Postoju', abilityText: `Stała: +${ABILITY.standShotBonus} A, gdy w tej aktywacji się nie ruszała.` }),
    u({ id: 'desertAstrologer', name: 'Astrolog Pustyni', side: 'sands', kind: 'hero', hp: 5, attack: 2, speed: 3, movement: 'walk', attackType: 'ranged', ability: 'giftOfLife', abilityName: 'Woda z Oazy', abilityText: `Raz na bitwę: sojusznik odzyskuje ${ABILITY.giftOfLifeHeal} Ż.` }),
    u({ id: 'cyclops', name: 'Cyklop Błyskotek', side: 'neutral', kind: 'neutral', size: 2, hp: 23, attack: 2, speed: 2, movement: 'walk', attackType: 'ranged', ability: 'boulder', abilityName: 'Miażdżący Głaz', abilityText: 'Po każdym ataku odpycha trafionego przeciwnika o 1 pole, jeśli to możliwe (jednostek dwupolowych nie da się odepchnąć).', duel: { hp: 14, ability: 'stoneSkin', abilityName: 'Kamienna Skóra', abilityText: `Każdy cios w Cyklopa zadaje o ${ABILITY.stoneSkinIgnore} mniej obrażeń.` } }),
    u({ id: 'griffin', name: 'Gryf Złodziej Skarbów', side: 'neutral', kind: 'neutral', size: 2, hp: 18, attack: 3, speed: 6, movement: 'fly', attackType: 'melee', ability: 'nestLeap', abilityName: 'Łupieżczy Nalot', abilityText: `Po każdym ataku może odlecieć o maks. ${ABILITY.nestLeapRange} pola.`, duel: { hp: 10, ability: 'thiefClaw', abilityName: 'Złodziejski Szpon', abilityText: `Gdy zada obrażenia, odzyskuje ${ABILITY.thiefClawHeal} Ż.` } }),
    u({ id: 'hydra', name: 'Hydra z Zatopionych Ruin', side: 'neutral', kind: 'neutral', size: 2, hp: 21, attack: 2, speed: 3, movement: 'walk', attackType: 'melee', ability: 'manyHeads', abilityName: 'Paszcze Otchłani', abilityText: 'Każdym atakiem może trafić dwóch sąsiadujących przeciwników.', duel: { hp: 12, ability: 'regrowth', abilityName: 'Odrastające Głowy', abilityText: `Na początku każdej swojej aktywacji odzyskuje ${ABILITY.regrowthHeal} Ż.` } }),
  ].map((d) => [d.id, d]),
);

export const FACTION_HEROES: Record<FactionId, string[]> = byPack((p) => p.heroes);

/** Easter egg heroes: unlocked on the setup screen (click the Dawn crest five times), never drawn by the engine. */
/** Rivalry for 7-8 players: four heroes a side, so each faction has a fourth one of its own (Przymierze: the Silver She-Wolf, Horda: the Dusk Manticore); the Brave Duck stays a secret hero and the Warlord a tavern commander. */
export const EXTRA_HEROES: Record<FactionId, string> = { dawn: 'moonWolf', horde: 'duskManticore', herds: 'thunderRam', undead: 'bellKeeper', clans: 'oldMiner', frost: 'oldHailer', free: 'otterSmuggler', sands: 'camelPrince' };
export const MAX_PVP_PLAYERS = 8;
/** More players than this at a table play with `EXTRA_HEROES` too. */
export const BASE_PVP_PLAYERS = 6;
/** The heroes a seat can pick at a table of `seats` players. */
export const heroPool = (f: FactionId, seats: number): string[] => (seats > BASE_PVP_PLAYERS ? [...FACTION_HEROES[f], EXTRA_HEROES[f]] : FACTION_HEROES[f]);

export const SECRET_HEROES: Record<FactionId, string[]> = { dawn: ['braveDuck'], horde: [], herds: [], undead: [], clans: [], frost: [], free: [], sands: [] };

/** The tier of a faction's support (1 the starting ones, 2-5 the recruits of the tiers and their alternatives, 6 the legend); 0 for anything else. */
export const supportTier = (unitId: string): number => {
  for (const p of Object.values(FACTION_PACKS)) {
    if (p.supports.includes(unitId)) return 1;
    const i = Math.max(p.tierUnits.indexOf(unitId), p.altUnits.indexOf(unitId));
    if (i >= 0) return i + 2;
    if (p.legend === unitId) return 6;
  }
  return 0;
};

export const FACTION_SUPPORTS: Record<FactionId, string[]> = byPack((p) => p.supports);

export const GUARDIANS = ['cyclops', 'griffin', 'hydra'];
/** Weak neutral units of the digital encounters, two per motif (stone, air, water). */
export const NEUTRAL_WEAK = ['shardling', 'burrower', 'skyEagle', 'harpy', 'pincer', 'bogCrawler'];
/** Neutral bosses of the digital encounters, one per motif. */
export const NEUTRAL_BOSSES = ['stoneGolem', 'stormKing', 'kraken'];

/**
 * Neutral encounters on the adventure map (digital Expedition, hero growth): groups of neutral units guard a hex; the deeper from the bases, the
 * stronger the group and the rarer the reward (docs/ZASADY_CYFROWE.md, "Neutralni"). Each motif has its guardian, two weak units and a boss.
 */
export const ENCOUNTER_MOTIFS = {
  stone: { weak: ['shardling', 'burrower'], guardian: 'cyclops', boss: 'stoneGolem' },
  air: { weak: ['skyEagle', 'harpy'], guardian: 'griffin', boss: 'stormKing' },
  water: { weak: ['pincer', 'bogCrawler'], guardian: 'hydra', boss: 'kraken' },
} as const;
export type EncounterMotif = keyof typeof ENCOUNTER_MOTIFS;
export const ENCOUNTERS = {
  /** How many encounters a map holds, by map size. Provisional: tune with the simulations. */
  count: { short: 2, medium: 3, long: 5, veryLong: 7, huge: 9, giant: 11 } as Record<MapSize, number>,
  /** An encounter stands farther than this from a base and from the Tree. */
  minDistance: 2,
  /** Neutral units that stand beside the Kraken (its tentacles). */
  krakenTentacles: 2,
};

/** Supports a hero takes into a battle on the arena (all of them when fewer are alive). */
export const SUPPORTS_PER_BATTLE = 2;

/** A guardian's Życie in a duel on the board (one hero alone): from its duel card. */
export const guardianDuelHp = (id: string) => UNITS[id].duel?.hp ?? UNITS[id].hp;

/** The race a hero belongs to (its skills, name tables and pictures are the race's), whichever team plays it. */
export const raceOfHero = (heroId: string): FactionId => {
  const side = UNITS[heroId]?.side;
  return side && side !== 'neutral' && side in FACTION_HEROES ? (side as FactionId) : 'dawn';
};

const RACE_NAMES = byPack((p) => p.name);
/** The name of a race (and, for the sides, of the race they play by default; read a game's own names through raceOf). */
export const FACTION_NAMES: Record<Side | FactionId, string> = { ...RACE_NAMES, third: RACE_NAMES.dawn, fourth: RACE_NAMES.horde, neutral: 'Neutralni strażnicy' };

export type ItemKind =
  | 'resurrection'
  | 'heal'
  | 'seed'
  | 'damage_scroll'
  | 'sword'
  | 'shield'
  | 'vitality'
  | 'boots'
  | 'horn'
  | 'map'
  | 'lightning'
  | 'hourglass'
  | 'courage_horn'
  | 'teleport'
  | 'stone';

export interface ItemDef {
  kind: ItemKind;
  name: string;
  text: string;
  /** Where the item may be used. */
  usableIn: Array<'map' | 'battle'>;
}

/**
 * Numbers used by treasures. TEST values like the stats: the engine, the bots and the card texts
 * read them from here.
 */
export const ITEM_EFFECT = {
  /** Wielki Eliksir Uzdrowienia: Życie restored, up to the maximum. */
  heal: 6,
  /** Nasiono Drzewa: Życie for every living unit of the side. */
  seedHeal: 2,
  /** Zwój Magicznej Strzały: damage to one target. */
  scrollDamage: 3,
  /** Błyskawica w Butelce: damage to each of up to `lightningTargets` enemies. */
  lightningDamage: 2,
  lightningTargets: 2,
  /** Miecz Bohatera: Atak until the end of the battle. */
  swordAttack: 2,
  /** Eliksir Żywotności: maximum (and current) Życie until the end of the battle. */
  vitalityHp: 4,
  /** Buty Wiatru: Szybkość until the end of the battle. */
  bootsSpeed: 3,
  /** Kamień Ochrony: damage taken off every blow until the end of the battle. */
  stoneReduction: 1,
  /** Róg Odwagi: Atak for the next attack of a unit and one ally next to it. */
  courageAttack: 2,
  /** Magiczna Mapa: hidden hexes revealed. */
  mapReveal: 3,
};

const E = ITEM_EFFECT;

export const ITEMS: Record<ItemKind, ItemDef> = {
  resurrection: { kind: 'resurrection', name: 'Eliksir Odrodzenia', text: 'Wskrzesza 1 poległą jednostkę. Także poza bitwą. Każdy bohater wstaje tak tylko raz.', usableIn: ['map', 'battle'] },
  heal: { kind: 'heal', name: 'Wielki Eliksir Uzdrowienia', text: `Usuwa z wybranej jednostki do ${E.heal} punktów obrażeń.`, usableIn: ['battle'] },
  seed: { kind: 'seed', name: 'Nasiono Drzewa', text: `+${E.seedHeal} Ż każdej żyjącej własnej jednostce na arenie.`, usableIn: ['battle'] },
  damage_scroll: { kind: 'damage_scroll', name: 'Zwój Magicznej Strzały', text: `${E.scrollDamage} obrażenia wybranemu celowi.`, usableIn: ['battle'] },
  sword: { kind: 'sword', name: 'Miecz Bohatera', text: `+${E.swordAttack} A jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  shield: { kind: 'shield', name: 'Tarcza Strażnika', text: 'Neguje wszystkie obrażenia z jednego ataku (reakcja).', usableIn: ['battle'] },
  vitality: { kind: 'vitality', name: 'Eliksir Żywotności', text: `+${E.vitalityHp} maks. Ż jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  boots: { kind: 'boots', name: 'Buty Wiatru', text: `+${E.bootsSpeed} S jednej jednostce do końca bitwy.`, usableIn: ['battle'] },
  horn: { kind: 'horn', name: 'Róg Strażników', text: 'Wymień pomocnika na żywego z rezerwy ALBO daj żywemu pomocnikowi dodatkową aktywację.', usableIn: ['battle'] },
  map: { kind: 'map', name: 'Magiczna Mapa', text: `Odkryj ${E.mapReveal} wybrane zakryte pola.`, usableIn: ['map'] },
  lightning: { kind: 'lightning', name: 'Błyskawica w Butelce', text: `Do ${E.lightningTargets === 2 ? 'dwóch' : E.lightningTargets} różnych przeciwników otrzymuje po ${E.lightningDamage} obrażenia.`, usableIn: ['battle'] },
  hourglass: { kind: 'hourglass', name: 'Klepsydra Czasu', text: 'Wybrana jednostka wykonuje dodatkowy ruch bez ataku.', usableIn: ['battle'] },
  courage_horn: { kind: 'courage_horn', name: 'Róg Odwagi', text: `+${E.courageAttack} A do następnego ataku jednostki i jednego sąsiedniego sojusznika.`, usableIn: ['battle'] },
  teleport: { kind: 'teleport', name: 'Zwój Teleportacji', text: 'Teleport na wolne pole sąsiadujące z sojusznikiem.', usableIn: ['battle'] },
  stone: { kind: 'stone', name: 'Kamień Ochrony', text: `−${E.stoneReduction} otrzymanych obrażeń z każdego ataku do końca bitwy.`, usableIn: ['battle'] },
};

/**
 * Digital ruleset: what is worn is an artifact, what is used up is an elixir, a scroll, a rune or a horn. The four treasure cards named after
 * gear carry other names (and pictures) there; what they do is unchanged, and the board edition keeps the printed names.
 */
export const DIGITAL_ITEM_NAMES: Partial<Record<ItemKind, string>> = { sword: 'Eliksir Mocy', boots: 'Eliksir Chyżości', shield: 'Zwój Tarczy', stone: 'Runa Ochrony' };

/** A treasure card as the ruleset in play names it. */
export function itemDef(kind: ItemKind, digital: boolean): ItemDef {
  const name = digital ? DIGITAL_ITEM_NAMES[kind] : undefined;
  return name ? { ...ITEMS[kind], name } : ITEMS[kind];
}

/** Ability texts that differ in the digital ruleset (the card says what the unit really does there). */
export const DIGITAL_ABILITY_TEXTS: Record<string, string> = {
  blackDragon: 'Raz na bitwę: pełny atak w dwie jednostki stojące w jednej linii, także w sojusznika za wrogiem.',
};
export const abilityTextFor = (defId: string, digital: boolean | undefined): string => (digital ? DIGITAL_ABILITY_TEXTS[defId] : undefined) ?? UNITS[defId].abilityText;

export const NON_RESURRECTION_ITEMS: ItemKind[] = (Object.keys(ITEMS) as ItemKind[]).filter((k) => k !== 'resurrection');

/** Arena: Eliksiry Odrodzenia in the shared draft deck (the user's choice: 2, not the box's 6). */
export const ARENA_RESURRECTIONS = 2;
/** Arena draft deck: every treasure that works in battle once (so no Magiczna Mapa), plus the Eliksiry. */
export const ARENA_DECK: ItemKind[] = [
  ...Array<ItemKind>(ARENA_RESURRECTIONS).fill('resurrection'),
  ...NON_RESURRECTION_ITEMS.filter((k) => ITEMS[k].usableIn.includes('battle')),
];
/** Arena: treasures each side drafts, and cards shown per pick. */
export const ARENA_PICKS = 2;
export const ARENA_OFFER = 3;
/**
 * Arena-only handicaps (they do not touch the adventure game): who picks first ('random' = a coin)
 * and extra treasures a side drafts after the A, B, B, A picks.
 */
export const ARENA_RULES: { firstPicker: 'random' | TeamId; extraPicks: Record<FactionId, number>; extraOffer: Record<FactionId, number> } = {
  firstPicker: 'random',
  extraPicks: { dawn: 0, horde: 0, herds: 0, undead: 0, clans: 0, frost: 0, free: 0, sands: 0 },
  /**
   * More cards shown to that side at each pick (the choice gets better, the number of treasures stays).
   * The Horde sees 4: in the arena Przymierze otherwise wins about 55% (simulations, notes section 9).
   */
  extraOffer: { dawn: 0, horde: 1, herds: 0, undead: 0, clans: 0, frost: 0, free: 0, sands: 0 },
};

// Map tiles. The left half of the triangle is built from Przymierze tiles (green back),
// the right half from Horda tiles (red back). Costs follow the designer's table.
export type Terrain =
  // Przymierze
  | 'meadow'
  | 'forest'
  | 'river'
  | 'bridge'
  | 'hill'
  | 'mountain'
  | 'chasm'
  // Horda
  | 'scorched'
  | 'swamp'
  | 'barren'
  | 'darkCave'
  | 'ruins'
  | 'deadThicket'
  | 'thorns'
  // The channels between the islands (digital ruleset)
  | 'water'
  // Special tiles
  | 'tree'
  | 'baseDawn'
  | 'baseHorde'
  | 'lairCyclops'
  | 'lairGriffin'
  | 'lairHydra'
  | 'treasureDawn'
  | 'treasureHorde';

/** The team whose land a tile is (the zone it lies in). */
export type TileSide = TeamId;

export const TERRAIN_NAMES: Record<Terrain, string> = {
  meadow: 'Polana Przymierza',
  forest: 'Las Przymierza',
  river: 'Rzeka',
  bridge: 'Most',
  hill: 'Wzgórza',
  mountain: 'Góry',
  chasm: 'Przepaść',
  scorched: 'Spalona Ziemia',
  swamp: 'Mroczne Bagno',
  barren: 'Jałowa Równina',
  darkCave: 'Mroczna Jaskinia',
  ruins: 'Ponure Ruiny',
  deadThicket: 'Martwy Gąszcz',
  thorns: 'Trujące Ciernie',
  water: 'Woda',
  tree: 'Kryształowe Drzewo',
  baseDawn: 'Baza Przymierza Świtu',
  baseHorde: 'Baza Mrocznej Hordy',
  lairCyclops: 'Jaskinia Cyklopa',
  lairGriffin: 'Gryfie Gniazdo',
  lairHydra: 'Hydrzy Staw',
  treasureDawn: 'Skarbiec Przymierza',
  treasureHorde: 'Skarbiec Hordy',
};

/** null = impassable. */
export const TERRAIN_COST: Record<Terrain, number | null> = {
  meadow: 1,
  forest: 1,
  bridge: 1,
  scorched: 1,
  barren: 1,
  tree: 1,
  baseDawn: 1,
  baseHorde: 1,
  lairCyclops: 1,
  lairGriffin: 1,
  lairHydra: 1,
  treasureDawn: 1,
  treasureHorde: 1,
  river: 2,
  hill: 2,
  swamp: 2,
  darkCave: 2,
  ruins: 2,
  mountain: null,
  chasm: null,
  deadThicket: null,
  thorns: null,
  water: null,
};

/** Number of art variants per terrain (public/assets/tiles/<terrain>_<n>.jpg). */
export const TERRAIN_VARIANTS: Record<Terrain, number> = {
  meadow: 4, forest: 4, river: 4, bridge: 4, hill: 4, mountain: 4, chasm: 4,
  scorched: 4, swamp: 4, barren: 4, darkCave: 4, ruins: 4, deadThicket: 4, thorns: 4, water: 2,
  tree: 1, baseDawn: 1, baseHorde: 1, lairCyclops: 1, lairGriffin: 1, lairHydra: 1,
  treasureDawn: 4, treasureHorde: 4,
};

/**
 * Tile decks per half of the map: 5 ordinary terrain types and 2 obstacles each, every type
 * equally likely. The share of difficult ground is not fixed — it follows from the types
 * (2 difficult types on the Przymierze side, 3 on the Horda side).
 */
export const TILE_POOLS: Record<FactionId, Terrain[]> = byPack((p) => p.tiles as Terrain[]);

/** Guardian lairs and the half of the map each guardian lives on. */
export const GUARDIAN_LAIRS: Record<string, { terrain: Terrain; side: TileSide }> = {
  cyclops: { terrain: 'lairCyclops', side: 'horde' },
  griffin: { terrain: 'lairGriffin', side: 'dawn' },
  hydra: { terrain: 'lairHydra', side: 'horde' },
};

/** Eliksiry Odrodzenia in the box (one card of every other treasure). */
export const RESURRECTION_CARDS = 6;

export interface MapVariant {
  rows: number;
  resurrections: number;
  otherTreasures: number;
  /** Eliksiry Odrodzenia on the map in the "only Eliksiry Odrodzenia" option (no other treasures). */
  onlyResurrections: number;
  roundLimit: number;
  /** Treasures the Przymierze holds from the start (larger maps). */
  startTreasures?: { resurrections: number; others: number };
}

/** The board game's four sizes, then the digital edition's XL (`huge`) and XXL (`giant`). */
export type MapSize = 'short' | 'medium' | 'long' | 'veryLong' | 'huge' | 'giant';
/** The sizes the board edition has. */
export const BOARD_MAP_SIZES: MapSize[] = ['short', 'medium', 'long', 'veryLong'];

export const MAP_VARIANTS: Record<MapSize, MapVariant> = {
  short: { rows: 6, resurrections: 1, otherTreasures: 1, onlyResurrections: 1, roundLimit: 8 },
  medium: { rows: 8, resurrections: 1, otherTreasures: 3, onlyResurrections: 2, roundLimit: 12 },
  long: { rows: 11, resurrections: 2, otherTreasures: 4, onlyResurrections: 3, roundLimit: 18, startTreasures: { resurrections: 0, others: 1 } },
  veryLong: { rows: 14, resurrections: 3, otherTreasures: 5, onlyResurrections: 4, roundLimit: 24, startTreasures: { resurrections: 1, others: 1 } },
  huge: { rows: 17, resurrections: 4, otherTreasures: 6, onlyResurrections: 5, roundLimit: 30, startTreasures: { resurrections: 1, others: 2 } },
  giant: { rows: 20, resurrections: 5, otherTreasures: 8, onlyResurrections: 6, roundLimit: 36, startTreasures: { resurrections: 2, others: 2 } },
};

export const MAP_SIZE_NAMES: Record<MapSize, string> = { short: 'Mała', medium: 'Średnia', long: 'Duża', veryLong: 'Bardzo duża', huge: 'Ogromna', giant: 'Gigantyczna' };

/** Digital Expedition and higher: Życie and Atak (and every bonus to them) are this many times the board game's, so that small bonuses and defence have room. */
export const STAT_SCALE = 3;
/**
 * The same for Życie: its own scale, larger than Atak's, so that a hero needs two to four blows to bring another hero down (with the same
 * scale a hero with a strong blow took one: report 674974). Chosen on the hero matrix: with ×5 Życie and ×3 Atak no pair of heroes is finished
 * in one blow, 93% of the pairs in two to four (mean 2.8), the rest are the Ogre's blows on the Bear. See docs/ZASADY_CYFROWE.md.
 */
export const HP_SCALE = 5;

/**
 * A rule text of the board game's numbers, with the numbers of Życie and Atak multiplied by `scale` ("+2 A" becomes "+6 A", "ignoruje 3 obrażenia" "ignoruje 9 obrażeń");
 * distances, speed, move points and counts stay. Used wherever a card or a skill is shown in a game with `statScale`.
 */
export function scaleText(text: string, scale: number, hpScale = scale): string {
  if (scale === 1 && hpScale === 1) return text;
  // Życie (and the points a healing restores) go by the Życie scale, Atak and damage by the Atak scale.
  return text.replace(/(\d+)(?= (?:maks\. )?Ż(?![a-ząćęłńóśźż]))|(\d+)(?= punktów obrażeń)|(\d+)(?= A(?![a-ząćęłńóśźż]))|(\d+)(?= (?:mniej |otrzymanych )?(?:obrażeń|obrażenia|obrażenie))|(?<=rani o )(\d+)/g, (_m, hp?: string, heal?: string, atk?: string, dmg?: string, hit?: string) => String(Number((hp ?? heal ?? atk ?? dmg ?? hit)!) * (hp !== undefined || heal !== undefined ? hpScale : scale)));
}

/** The hp, attack and speed of a unit in a battle: the board game's, or the digital ruleset's where they differ; Życie and Atak times `scale` (the digital Expedition plays with 3, see `scaleOf`). */
export function battleStats(defId: string, digital: boolean | undefined, scale = 1, hpScale = scale, arena = false): Pick<UnitDef, 'hp' | 'attack' | 'speed'> {
  const { hp, attack, speed } = { ...UNITS[defId], ...(digital ? DIGITAL_STATS[defId] : undefined) };
  const bonus = digital && !arena && UNITS[defId]?.side === 'horde' ? HORDE_DIGITAL_BONUS : { hp: 0, attack: 0 };
  return { hp: (hp + bonus.hp) * hpScale, attack: (attack + bonus.attack) * scale, speed };
}
