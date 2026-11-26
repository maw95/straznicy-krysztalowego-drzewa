# Manual of the computer game

Format: `##` is a chapter, `###` is a part of a chapter. A line starting with `@words:` is not shown and adds keywords to the search. Links to other places have the form `[text](#identifier)`; the identifier is the title in lower case with spaces replaced by dashes. This file is the English translation of `instrukcja.pl.md`: keep both in step (same chapters, same order).

## Start here
@words: introduction, first game, how to play, beginning, new player, quick start, about the game

**Gleamroot: Wardens of the Crystal Tree** is a game about crystals that must return to the Tree before its glow goes out. The Dawn Covenant travels across the map, defeats guardians and collects crystals. The Dark Horde tries to stop it. Battles are fought on an arena of hexes, in turns, unit by unit.

This manual describes the **computer version** as it is now: all complexity levels (from Walk to Empire), the modes, goals, the campaign, the Roguelike Run and online play. The earlier printable manual describes the **board version** and stays untouched: you will find it at the bottom of this page (it is in Polish only).

### Your first game in five steps
1. In the main menu click **New game**, choose the **Skirmish** mode and the place **This computer**.
2. Choose the level **Adventure** (the full game without hero development) or **Walk** (very simple duels, from age 5).
3. Choose a small map; on the seats screen leave the player and the computer (the computer leads the Horde, at the level **Normal**). The goal is **Crystals to the Tree**.
4. Choose a hero. On the map click neighbouring tiles to walk and press **Space** to end your turn.
5. Step onto a guardian's tile. A battle on the arena begins: place your units, then click a unit and the tile it should move to or attack.

In your first game a short tutorial with hints appears; you can switch it off with the "Tutorial" field in the settings of the main menu. A very short outline of the story and the rules is also under the **Introduction** button in the main menu.

### How to use this manual
- The **table of contents** on the left (at the top on a phone) leads to every chapter. Click a title and the page scrolls to it.
- The **search** above the contents looks for keywords in the whole manual. Type a few letters of a word (the ending does not matter); the results show in which chapter the word was found and lead there with one click.
- The cards of units, treasures and artifacts, and the descriptions of places on the map, are in the other tabs of the "Rules and cards" window. This manual does not repeat them.

## Main menu
@words: menu, buttons, new game, campaign, roguelike run, load, credits, introduction, for testers, start screen, flag, language

The main menu has two big buttons:
- **New game:** the second page asks for the **mode**: skirmish, arena ([Game modes](#game-modes)), the **Campaign** (the story of the Dawn Covenant in four scenarios, [Campaign](#campaign)) or the **Roguelike Run** (eight arena battles in a row, one life, [Roguelike Run](#roguelike-run)). Skirmish and arena lead on to the game wizard (chapter [New game wizard](#new-game-wizard)); the Campaign and the Roguelike Run have screens of their own.
- **Load a game:** returns to a saved game: the last one (autosave), one saved under a name, or one from a file. A Roguelike Run in progress has an entry there, "Roguelike Run in progress", with a "Resume" button.

At the bottom of the menu there is a small **Board version** link: it follows the same path (mode, place, wizard), but you play the board version ([New game wizard](#new-game-wizard)).

At the top there are three smaller buttons: **Rules and cards** (this window), **Introduction** (a short outline of the story and the rules) and **For testers** (information for testers, statistics of your games and a window for remarks that go to the author). In the top right corner: the **flags** that change the language (Polish and English), full screen and music. In the bottom right corner of the menu you see your statistics from this browser, and in the bottom left the version number: a click opens the history of changes. The **Credits** button shows the creators of the game, the authors of the music with their licences, and a note that the graphics, animations and sounds were made with the help of AI tools.

## New game wizard
@words: wizard, new game, settings, version, level, mode, goal, map, players, difficulty, map shape, map size, bots, bot level, hints

Before the wizard you choose the **mode** (the menu's second page: skirmish or arena) and **where you play**: on this computer (against computer opponents, or several players at one screen) or **online** with friends ([Online play and ranking](#online-play-and-ranking)). The wizard then leads through consecutive pages. The **Back** button returns to the previous one, and some choices (level, goal) move on at once when clicked.

1. **Complexity level** (except in the arena): from Walk to Empire ([Complexity levels](#complexity-levels)), **Ready scenario** (in a skirmish: a list of hand-drawn maps with a goal and a level, as in the classic strategy games; a size filter and a table on the left, the map preview, the story and the victory conditions on the right; after picking a scenario you go straight to the seats) or **Custom settings** ([Custom settings](#custom-settings)).
2. **Goal of the game** (from the Expedition level, [Goals of the game](#goals-of-the-game)).
3. **Map** (except in the arena): on the higher levels the shape of a random map (triangle, rectangle, ring, islands) and the **size**; in Walk, Adventure and the board version only the size ([Adventure map](#adventure-map)).
4. **Players** (on the last screen, "Seats at the table"): there are two seats at first, a person and a computer. The **+ Add player** button adds more (computers) and the small cross beside a player removes one (the first player and the last two seats of a rivalry cannot be removed). You choose the faction and the hero by clicking icons; the **die** (first from the left, selected by default where every faction plays) means a draw when the game starts (a random faction always means a random hero too); a place with a random faction has a blue background. A right click on a faction's icon shows its description and all its supports. For a human player there is a **Child** field ([Family mode](#family-mode)), and for a bot in a skirmish the **bot level** ([Difficulty levels](#difficulty-levels)). In the goals **Crystals to the Tree** and **Survival** the sides have different tasks, so the seats stand in two columns named by the role ("Gather the crystals" and "Guard the Tree", "Hold out" and "Horde waves"): **+ Add player** under a column adds a bot to it, and the **⇄** button moves a player to the other team. In an online game the number of players is set in the wizard.
5. **Difficulty** of the computer: in a skirmish it is chosen at each bot (the point above), on the arena and in the board version in the wizard ([Difficulty levels](#difficulty-levels)).

**Version:** you play the **digital** version by default (units in 2D graphics with animations, a hex arena, all complexity levels). The **board version** (a faithful board game: 3D figures, unchanged rules and four map sizes; no complexity levels and no goal choice) is a link on the menu's first page. The choice of the version holds for that game only.

On every page a tooltip under the cursor (on a phone after a tap) explains what the choice does.

## Complexity levels
@words: level, walk, adventure, run, settlement, principality, kingdom, empire, level I, level II, level III, level IV, level V, level VI, level VII, complexity, ladder

The level chooses **how many mechanics** the game has. Each next level adds new ones to the previous one. Levels II–VII play full battles on the arena; Walk consists of duels on a board.

| Level | Name | What is added |
|---|---|---|
| 0 | **Walk** | For the youngest (from age 5): short duels on a board, without abilities and the Horde's ritual. A fallen hero is replaced by a reserve. |
| 1 | **Adventure** | The rules of the board game: 3 vs 3 battles on the arena, abilities, treasures, crystals to the Tree. |
| 2 | **Run** | Hero development (levels, skills), artifacts, objects on the map, neutrals with rewards, a choice of goal and map. |
| 3 | **Settlement** | Settlements, gold, buildings, recruiting supports. |
| 4 | **Principality** | Wood, ore and Star Dust, the forge, huts with quests, defence of settlements (moat, walls, catapult), the goal Conquest. |
| 5 | **Kingdom** | A second hero (a commander from the tavern), magic and spells, hero types, specialities, skill branches. |
| 6 | **Empire** | Shards of the Primal Spark and the goal Relic, faction mechanics and buildings, a choice of units, a legendary unit. |

The board version has one level, corresponding to Adventure (in the board wizard the easiest level is called "Easy", while in the digital one it is Walk).

From level III the Health and Attack numbers on the cards are **three times larger** than in the board game, so that small bonuses from skills and artifacts make sense. The pace and balance of the game are the same as with small numbers. **Note:** the numbers of Health, Attack and damage in this manual (for example "+1 Attack", "2 damage") are given on the board game's scale; from the level Run on, you will see them multiplied by 3 on the screen (+3 and 6 in these examples). Speed, ranges, movement points and mana are not multiplied.

## Difficulty levels
@words: difficulty, easy, normal, hard, very hard, rabbit, wolf, bear, dragon, points, ranking, computer, handicap

Difficulty belongs to a **bot**, not to the game. In a skirmish every bot has its own level, chosen at its seat on the "Seats at the table" screen (Normal by default), also a bot playing in one team with you. A game of people only has no difficulty and no help for anyone. The rules are the same on every level; what differs is how well the bot plays.

- **Easy** (rabbit): the bot often makes mistakes in particular places: it strays from its way on the map, hits the weaker target, moves in battle without looking at the danger, takes on a stronger enemy, walks past treasures, takes the second-best skill or lets a purchase in a settlement go.
- **Normal** (wolf): the bot plays well, but makes the same mistakes now and then.
- **Hard** (bear): the bot plays as well as it can, without mistakes.
- **Very hard** (dragon): a bot without mistakes, and a side played by bots only has an advantage: 2 more random treasures at the start, income one and a half times larger, and on levels with settlements extra resources at the start (3 wood, 3 ore, 2 Dust) and 2 artifacts for the main hero. The computer's units have the same Health as yours.

In the goals where the sides play alike (control points, Boss, Artifact, Conquest, Relic), the goal itself is fair. In the goals with two roles (Crystals to the Tree, Survival) the game evens out the roles, whoever plays them.

On the arena and in the board version the difficulty is chosen as before, in the wizard; on the arena Very hard is a computer that makes no mistakes in its choices.

For a win you get **ranking points**; the harder, the more. What counts is the highest level of the bots playing against you. On Very hard there are one and a half times as many points as on Hard. Games with custom settings give no points.

## Game modes
@words: mode, skirmish, co-op, rivalry, arena, hot-seat, one screen, bots, computer, 8 players, factions, team

- **Skirmish** (1–8 players): a full game on the map in which you choose the goal, the level, the map, the factions and the players. Some play the Covenant, others the Horde, at most three players per faction; you set who is human and who is the computer at each seat. With one player the computer leads the Horde. So you and your friends can play together against the computer (one side, a shared purse and treasures) or against each other. With seven and eight players each side has a fourth hero (the Silver She-Wolf on the Covenant's side and the Dusk Manticore on the Horde's). The computer player is the same everywhere ([Bots](#evil-automaton-and-bots)).
- **Arena**: one battle without a map ([Arena](#arena)).

The **board edition** keeps the modes of the printed rulebook, including **Co-op** against the evil automaton.

Several players at **one screen** (hot-seat) pass the device around. When opposing sides sit at the table, the hand-over screen hides the faction's treasures; players of one side share their treasures. One person can take several seats and play them in turn. The **Autoplay** option lets bots play for humans as well (useful for watching a game).

## Goals of the game
@words: goal, crystals to the tree, control points, survival, boss, artifact, conquest, relic, win, ritual, round limit, draw

You choose the goal in the wizard; from the level Run on there is a choice, on Adventure only the first one is available.

- **Crystals to the Tree** (the default). The Covenant wins when it brings all the crystals to the Crystal Tree (2 with one hero, 3 with two or three). The Horde wins when the round limit runs out, when all the Covenant's heroes fall, or when it performs the **ritual**: at the end of three consecutive rounds one of its heroes stands on the Tree and all the other living ones next to him. Defeating the Horde's heroes is not enough. The round limit is 8 / 12 / 18 / 24 (small / medium / large / very large map), and more on bigger maps and other shapes.
- **Control points.** Three points lie on the map: the middle one worth 2 and two side ones worth 1 each. The side that has more points at the end of a round (its hero stands on the point) gets the advantage; **several rounds in a row** of advantage give the win (3 rounds on a small and medium map, 4 on a large one, 5 on a very large one, more on the biggest; the Covenant, which moves first, needs one more). After the round limit the side that held the advantage longer wins; a tie is a draw.
- **Survival.** The Covenant wins when a set number of rounds passes (6 / 9 / 14 / 18 on maps S–XL, more on the biggest) and at least one hero is alive. Every two rounds a new hero appears in the Horde's base. There are no crystals and no Tree.
- **Boss.** The Boss's lair lies in the middle of the map. Both sides challenge it, and its wounds stay between fights. The one who deals the last blow wins.
- **Artifact.** An Artifact lies in the middle of the map. Whoever brings it to their **own base** wins. The carrier is 1 movement point slower, and a fallen carrier drops the Artifact, which the next one picks up.
- **Conquest** (from the level Principality). The side that at the end of a round holds **all the settlements on the enemy's land** wins: his capital and the settlements on his half of the map. After the round limit the side holding more than half of the enemy's settlements wins; if neither does or both do, it is a draw.
- **Relic** (the level Empire). Raising the Primal Spark building wins at once; after the round limit the side carrying more Shards wins ([Empire](#empire)).

In goals other than Crystals a draw at the round limit is a draw; in Boss and Artifact "nobody won" is a draw too.

## Adventure map
@words: map, shape, triangle, rectangle, ring, islands, bridge, size, XL, XXL, giant, terrain, movement, movement points, discovering, fog, base, tree, round, turn, round track

### Shapes and sizes
The map is made of hexes. The Crystal Tree stands on the map only in the goal **Crystals to the Tree**; in every other goal its hex is ordinary ground (in Control, Boss and Artifact the middle point, the lair or the Artifact stands there). Without the Tree, the middle hex starts hidden like the rest of the map, unless the goal itself shows it. The shapes:
- **Triangle** (as in the board game): the Tree at the top, the Covenant's base in the bottom left corner, the Horde's in the bottom right.
- **Rectangle:** the bases in the middle of the shorter sides, the Tree in the centre.
- **Ring:** a hoop around a lake, the Tree and both bases on three corners.
- **Islands:** three lands (the Covenant's, the Tree's, the Horde's) separated by water, with a few bridges.
- **Ready-made maps** (the wizard's scenarios, e.g. "Stone Circle", "Isles of Mist", "Roof of the World", and the campaign maps): drawn by hand, each with its own goal, size and level. They have two bases, so at most two factions sit at the table.

Sizes (the digital version has six, the board one four): **S** small, **M** medium, **L** large, **XL** very large, and then huge and giant. The size determines the number of tiles, the round limit, and the number of treasures, settlements and encounters with neutrals.

### Movement
In every round each living hero has one turn. By default a hero has **3 movement points** (skills, artifacts and some places raise this supply). Easy terrain (glade, forest, road) costs 1, hard terrain (swamp, pit) 2. Mountains, water, chasms, dead thicket and thorns are impassable; bridges lead across water. Unused points are lost.

You click a tile and the hero walks along the path whose cost you pay in points. Stepping onto a tile **reveals the neighbouring tiles**. **Fog of war:** every faction uncovers the map for itself. You see only the tiles your faction has uncovered (at the start your own base and the Tree); a tile once uncovered stays visible together with whoever stands on it, and enemies on tiles you do not know are not shown. The bots also know only what their faction has uncovered. At one computer every player sees their own map after the device is handed over. At most one hero stands on a tile; the exception is your own base, where several can stand. A treasure from the tile goes to the faction's shared inventory. **Space** or **E** ends the turn, and **U** (or Ctrl+Z) undoes the last step on the map.

### Round
When everyone has finished their turn, the round ends: the Horde's ritual and the round limit are checked, heroes get back 1 mana point, income from settlements arrives, and the crystal on the **round track** moves by one tile. The order of turns in rivalry alternates; in co-op the players move first, then the evil automaton.

### Tile details
Holding the **right mouse button** (on a phone: holding a finger) shows the details of a tile, unit or treasure; when you let go, the window disappears. The descriptions of all places on the map are in the "Map locations" tab.

## Heroes and development
@words: hero, experience, XP, hero level, skills, hero card, artifacts, backpack, artifact sets, chest, shrine, mercenary camp, mana, elixir of rebirth, hero death

### Heroes
Each faction has three heroes (the Covenant: Golden Dragon, Unicorn King, Ancient Bear; the Horde: Black Dragon, Werewolf Lord and Iron Fist Ogre). A hero walks on the map and fights together with supports. Clicking the portrait opens the **Hero card**: level, skills, artifacts, speciality and backpack.

### Development (from the level Run)
**Experience points (XP)** are given for: a guardian 3, a won fight against a hero 2, a lost one that the hero survived 1, a treasure 1, a shrine 2. The Horde additionally gets 1 XP at the end of a round. The thresholds of levels 2–10: 3, 7, 12, 18, 26, 38, 56, 84 and 128 XP.

At every new level you choose one of three skills; the same one chosen again rises by a rank (up to the third). The skills: **Power** (Attack), **Mettle** (Health), **Lightness** (Speed), **Commander** (supports' Health), **Pathfinder** (movement on the map), **Shooter** (Attack of shooters), **Tactician** (placing further forward), **Scout** (reveals tiles around), **Treasure hunter** (more treasures to choose from after a fight with a guardian), **Scholar** (more XP) and **Luck** (random treasures at once). Each faction names them in its own way.

On levels 3, 6 and 9 the hero's **special ability is upgraded** (the digit II, III, IV on its icon).

### Artifacts
An artifact is permanent equipment of one hero, one per slot: **helmet, weapon, armour, shield, boots**, in three rarities (common, rare, legendary). A rarer one replaces a more common one by itself, and the rest goes to the backpack, which has no limit of places. Artifacts lie in chests, drop from guardians and neutrals, and whoever defeats a hero takes them from them. You can give them to **an ally standing on a neighbouring tile** (Hero card, backpack window). The full list is in the "Artifacts" tab.

On the level Settlement **artifact sets** appear: four sets of three rare items (Forester's Outfit, Dawn Panoply, Sentinel's Plate, Merchant's Outfit). A complete set of three gives a bonus, and the hero card shows "2/3 of the set".

### Places with rewards
From Run on, the map has places used by **the first hero who enters them** (afterwards they are empty): a **shrine** (2 XP), a **mercenary camp** (restores one fallen support of the faction, or gives 1 XP when nobody has fallen) and a **chest** (an artifact, and from the level Settlement a choice of an artifact or 3 gold). The number of such places grows with the size of the map. More of them (mill, well, depot, huts) are there from the level Principality.

### Hero death
A fallen hero is out of the game until the end of the match, unless the **Elixir of Rebirth** (a treasure) brings them back: on the map it resurrects a hero on a free tile next to the drinker, or restores a support. **Each hero rises this way only once per match** (on the map and in battle); the elixir will not raise the same hero a second time. The fallen hero's crystals stay on the battlefield. From the level Kingdom a fallen commander comes back for a fee ([Kingdom](#kingdom)).

## Battle on the arena
@words: battle, arena, fight, unit, activation, speed, attack, health, ability, shooter, flying, large unit, tail, corpse, backstab, obstacles, order, end of battle, movement

### Basic rules
Stepping onto the tile of an enemy hero, a guardian or a group of neutrals starts a battle. A fight costs as many movement points as the terrain cost of the tile, and after a win the hero can walk on. On the arena (without a map) each side fields a **hero and two supports** (six units on the large arena).

The arena is hexes laid out horizontally, 13 columns by 9 rows, with obstacles that block movement and shots (different ones for the Covenant's and the Horde's field). The unit whose turn it is (and, while deploying, the picked unit) has a thin golden outline round its whole silhouette.

### Placement
First both sides place their units in their outermost column; the attacker starts. You click a unit and then a free starting tile; a click on another of your units (or its tile) swaps the two. The Tactician skill lets you stand further forward.

### Order and activation
Every round each unit has **one activation**, from the fastest (on a tie the defender acts first). In an activation a unit **moves as many tiles as its Speed and attacks**. A move without an attack ends the activation at once. A melee unit keeps its activation after a move only if the move brought it to an enemy in reach; a click on an enemy is a move and an attack in one gesture. A **shooter** does not shoot after moving: it shoots standing still.

### Damage
A blow deals as much damage as the Attack. There are no counterattacks and no dice. A shooter shoots across the whole arena if no **obstacle** covers the target (units do not block a shot); when an enemy stands right next to it, it can attack only that one. **Flying** units fly over obstacles. Holding **Ctrl** over a unit shows where it can get to and whom it can reach.

### Large units
Some units (for example dragons) are **large and take two hexes**: the head and the tail. Movement is counted for the head, and the tail follows. When you hover over a movement tile, a dashed frame shows where the tail will lie; the **right mouse button** changes its tile (turns the unit). An attack works from either of the two tiles. During placement you click the tail's tile in the starting column.

### Corpses
A fallen unit stays on the board as a corpse, but **does not occupy the tile**: other units can walk over it. A corpse is not a target. The Elixir of Rebirth raises a unit on the same tile.

### Abilities and treasures
The abilities of heroes and supports work **once per battle** (you switch them on with the **Z** key or the ability button; Charge of Light and Call of Blood always work). The abilities of guardians and neutrals work on every attack. **Treasures** are one-use cards used before the action of your own unit (the "Treasures" button or the **S** key). From the level Kingdom a hero can also cast a **spell** in an activation ([Magic](#magic)).

### Backstab
The target has a "front": the direction of its last move or attack (one standing still looks towards the nearest enemy). A unit with the ability "Flank Strike" (the Harpy) deals +1 damage when attacking from the tile behind the target.

### End of battle
The battle lasts until all units of one side have fallen or the battle's round limit passes. **Survivors regain full Health**, fallen supports drop out of the game, and a fallen hero is restored only by the Elixir of Rebirth. After the last blow the death animation is still visible, then the result window.

## Guardians, neutrals and bosses
@words: guardian, cyclops, griffin, hydra, neutrals, crumbler, burrower, rock eagle, harpy, pincer, swamp crawler, stone golem, storm king, kraken, boss, encounters, lair

The crystals are watched by **guardians**: the Cyclops, the Griffin and the Hydra. Stepping onto their tile (the Covenant only) starts a fight; the winner takes the crystal, and the guardian leaves a treasure.

From the level Run on, the map also has **groups of neutrals**, rewarding experience, a treasure and an artifact. The farther from the bases, the stronger the encounter and the rarer the reward:
- common: a guardian or 2–3 weak ones, near the bases,
- rare: a guardian and 2 weak ones, halfway,
- legendary: a boss and 2 weak ones, deepest.

**Supports of the free factions:** half of these groups (the defenders of neutral settlements too) are not neutrals but supports of a faction nobody plays in this game (one of the five playable ones). A group is always of one faction, about as strong as neutrals of the same rank, and gives the same reward. The faction's legend may lead only the strongest group. The computer controls these guards; they use their abilities, without the faction's mechanic. The arena follows the land of the tile the fight is on.

**Weak neutrals:** Crumbler, Burrower, Rock Eagle, Harpy, Pincer, Swamp Crawler. **Bosses** (two hexes): Stone Golem, Storm King, Kraken (with tentacles). All their abilities are described by the cards in the "Units" tab. The neutrals are controlled by the computer.

## Treasures and the Elixir of Rebirth
@words: treasure, treasures, cards, elixir, elixir of rebirth, deck, inventory, shared treasures, guardians' horn

A **treasure** is a one-use faction card shared by all its players. You get it from treasure tiles, from guardians and neutrals, and from skills and rewards. You use it in battle before a unit's action (the "Treasures" icon, the **S** key) or on the map (the Elixir of Rebirth). On large maps the Covenant starts with a few treasures, and the computer on higher difficulties has more. All the cards are in the "Treasures" tab.

The treasure chest is a painted chest that opens, with the treasure icons lying inside it, 6 to a page (arrows "← 2/3 →" when there are more). A left click on an icon uses the treasure (when it cannot be used now, it shows its card), a right click (a long press on a phone) shows the details. The spell book in battle works the same way: a spell is an icon with its name and mana cost, a left click casts it, a right click shows its text, one counter at the top of the book shows the mana (current and maximum) and the cost stands under the name of every spell. The badge on the "Magic" button shows how many spells you can cast now. You close the window with the gold cross in a ring, with Esc or with Enter.

On the arena treasures are picked from the shared deck in turns: a side picks one of those shown (the Covenant sees 3, the Horde 4), and each side has 2 treasures, hidden until used.

## Settlements and economy
@words: settlement, gold, income, buildings, barracks, market, hospital, treasury, forge, recruiting, supports, team, garrison, moat, walls, catapult, resources, wood, ore, star dust, dust, mine, sawmill, mill, well, depot, hut, settlement council, building tree, exchange

### Gold and settlements (from Settlement)
There is one currency: **gold**, shared by the faction (you start with 2 gold). **Income** arrives at the end of the round: 2 gold per settlement (the starting one too), +1 gold for a treasury in the settlement, 1 gold for a gold mine. Chests also give gold (you choose: an artifact or 3 gold). Fights do not turn treasures into gold, and after a hero's defeat the gold is not lost.

A settlement **belongs to whoever stood on it**: an empty one is passed without a fight, a guarded one requires defeating its defenders. It keeps its buildings. An owner of a different faction than the settlement gets its income, market and hospital, but **cannot recruit**. A mine is held by the one standing on it.

### Buildings
Buildings are bought by a hero standing in a settlement of their own faction; you click a building in the settlement view to use it:
- **Barracks:** recruiting supports; upgraded ones give an extra place in the team and supports of ranks 4 and 5.
- **Market:** artifacts for gold (common 2 gold, rare 5, legendary 10 gold and 1 Dust from the level Principality), 3 on offer (5 after an upgrade), a new offer every 3 rounds. On the level Principality also an exchange of resources.
- **Hospital:** resurrects a fallen support for half the price (a third after an upgrade).
- **Treasury:** +1 gold per round; upgraded (Great Treasury) it brings +2 gold per round.

A settlement opens **full screen**: the faction's landscape is the background and the **built** buildings stand on it (unbuilt ones are not shown). Hover a building to see what it does in the bottom bar; clicking the **barracks** opens their full screen (unit cards by tier, and once you pick a card the animated unit with its numbers and ability; recruit and build dwellings here), clicking any other building a window with its services. The bottom bar shows the garrison, the hero in the settlement, gold and resources. **Building and upgrading is done only in the Settlement Council** (it stands from the start and costs nothing): it opens the **building tree**, where a node is fully upgraded (beige), can be upgraded (turquoise; a red price shows what is missing), buyable (green), too expensive (orange) or locked (grey, the caption says what is missing). Click a node to see its price and effect; Esc returns to the landscape.

### Team and supports
At the start the team has 2 places, then +1 at hero level 3, +1 at level 6 and +1 from upgraded barracks, at most 5 in all. An army has one support of each kind. Each faction has seven supports: three starting ones and one new one on each of ranks 2–5 to recruit in the barracks (3, 5, 8 and 12 gold).

### Resources (from Principality)
Besides gold there are **wood**, **ore** and **Star Dust**, shared by the faction. A faction starts with 3 wood. The map provides resources: a **sawmill** (+1 wood per round), an **ore mine** (+1 ore) and a rare **Star Dust spring** (+1 Dust). A mine is taken by stepping onto the tile. Gold pays for units; wood and ore for buildings; Dust only for rare things (legendary artifacts, spells, expensive buildings). Stocks and income are visible in the bottom bar.

When a resource is missing you can **buy it for gold** in any settlement of your own (the Market tab): wood and ore at 4 gold each, Dust 10 gold. A built **market** lowers the prices and lets you **sell** surpluses: wood and ore for 1 gold, Dust for 3 gold.

In the Principality buildings also cost resources (for example barracks 3 gold and 2 wood). You see the exact price on the build button. Barracks, Market and Treasury come straight from the Settlement Council; the Forge, Moat and Walls, and the Hospital require Barracks; the Mage Tower the Hospital; the Tavern the Market. You can build any number of buildings per round; only the price limits you.

### Forge
The **Forge** arms the supports of the whole faction: they fight with **+1 Attack**, and after an upgrade to the Great Forge also with **+1 Health**. The best forge of the faction counts, and whoever loses a settlement with a forge loses the bonus.

### Huts, mill, depot and well
- **Hut:** a hero who stops in it can do a **quest**: the hut asks for gold, a resource or an artifact from the backpack, and gives more in return (roughly one and a half times as much, in another currency). Each hut works only once per game.
- **Mill:** gives 2 gold, and then grinds for 3 rounds (the icon is dimmed).
- **Forest Depot:** gives out its stock once (3 wood, 3 ore or 1 Dust).
- **Wanderers' Well:** +2 movement points this turn, once per round, for the first who drinks from it.

### Defence and siege of a settlement
A hero standing in a settlement of their own can leave up to **three supports** in it as a **garrison** (the Moat tab in the settlement window) and take them back. The enemy cannot take a settlement with a garrison just by entering it: they must fight a **battle for the settlement**. A garrison without a hero is commanded by the player who owns the settlement.

The **Moat** building and its upgrade **Walls with Turrets** work in the battle for the settlement:
- **Moat with spikes:** whoever enters it ends their turn and takes 2 damage; you cross with dry feet by the bridge in the middle. Flying units fly over the moat.
- **Wall with a gate:** nobody passes through it (flying units do), but shots fly over the wall.
- **Two turrets:** at the start of every round each shoots at the weakest attacker (1 damage).
- **Catapult** (the attacker always has it): once per round it targets a highlighted wall, turret or gate. A wall and a turret fall at once, the gate after two hits.

Remember defence: leave garrisons and build fortifications, especially in the goal Conquest.

## Kingdom
@words: kingdom, level 5, commander, tavern, hire, ransom, second hero, hero type, warrior, hunter, sage, speciality, branches, branching skills

The level Kingdom adds a **commander** and **magic** to the Principality.

### Tavern and commander
In a settlement you can build a **tavern** (5 gold and 3 wood). Each player hires **one commander** in it for 8 gold. There are three types to choose from: **warrior** (tough, fights in melee), **archer** (shoots from afar) and **sage** (hits weaker, but heals or weakens). The commander is a full hero: they have their own pawn and their own turn (right after the main hero), gain experience, choose skills and carry artifacts. In battle they take supports from the shared team.

A fallen commander loses their artifacts (the winner takes them) but keeps their level and skills. From the next round you can **ransom them in the tavern** for 3 gold plus 2 gold per level of theirs, provided your main hero is alive. **The main hero's death is final**, but if the commander is alive you play on.

### Hero type and speciality
Each hero has a **type** that strengthens them on every promotion: **warrior** (+1 Health per level), **hunter** (+1 Attack every two levels), **sage** (+1 mana per level and stronger spells). They also have a **speciality**, one bonus of their own (for example the Unicorn King has +1 movement point, and the Ogre gets 1 gold for every won battle). They are visible on the Hero card.

### Skill branches
Four skills (Power, Mettle, Lightness, Commander) can be finished in two ways. When you have such a skill at rank II and its rank III appears, an extra card lies next to it, a **branch**: instead of the last point for the hero you get something else (a bonus for supports, healing every round or placement further forward). The choice is final.

## Magic
@words: magic, spell, spells, mana, spellbook, mage tower, circle, magic missile, healing, slow, stone skin, fireball, surge, thunder, curse, shield, inspiration, vision, quicken, portal

Every hero has **mana**: 3 plus 1 for each of their levels (sages 3 more). At the end of a round 1 mana point comes back. Main heroes know the **Magic Missile** from the start; further spells are taught by the **mage tower** (a settlement building; each upgrade opens the next **circle**: the Great Mage Tower the second, the Archmage Tower the third). A first-circle spell costs 3 gold, a second-circle one 5 gold and 1 Dust, a third-circle one 8 gold and 2 Dust. The hero whose turn it is learns it.

**In battle** a hero can cast **one spell** in their activation, besides moving and attacking: choose a spell from the "Spells" bar, then point to a target.
- **Magic Missile** (2 mana): 3 damage to any enemy.
- **Healing** (2): an ally regains 4 Health.
- **Slow** (1): an enemy has −2 Speed in its next activation; it also shortens movement abilities (flight, hop, leap, teleport), and a rooted unit does not move at all.
- **Stone Skin** (2, second circle): until the end of the battle blows at the ally are 1 weaker.
- **Fireball** (3, second circle): 2 damage to the target and everyone standing next to it, yours too.
- **Surge** (3, second circle): an ally gets an extra activation at once.
- **Thunder** (4, third circle): 5 damage to a chosen enemy, the lightning jumps to the nearest other one (2 damage).
- **Curse** (3, third circle): an enemy has −1 Attack until the end of the battle.
- **Shield** (3, third circle): the first blow at a chosen ally is absorbed completely.
- **Inspiration** (3, third circle): an ally has +2 Attack in its next activation.

**On the map**, in the hero's turn: **Vision** (2 mana) reveals tiles within a radius of 3, **Quicken** (2) gives +2 movement points this turn, **Portal** (4, second circle) takes the hero to the nearest settlement of their own and ends their move. Spells grow with the hero: every 3 levels they deal and heal 1 more.

## Empire
@words: empire, level VII, shards, primal spark, sanctuary, black forge, relic, faction mechanics, shrine of dawn, blood pit, habitat, legendary unit, phoenix, behemoth, tree nursery, grove circle, plunder house, wolf den

The level Empire adds to the Kingdom the **Shards of the Primal Spark**, faction mechanics and a choice of units.

### Shards and the Primal Spark
On tiles scattered over the map, covered like all the others, lie glowing **Shards** (from 2 on the smallest map to 6 on the biggest). A hero who steps onto the tile takes a Shard; they do not equip it like an artifact, they carry it. The counter under their name shows how many they carry themselves, how many the faction has and how many are in the game. **Whoever defeats a hero takes all their Shards**; a hero who falls in a fight with a guardian drops them on a neighbouring tile.

When **one hero carries all the Shards** and stands in a settlement of their own, they can raise the Primal Spark building: the **Sanctuary** (Covenant, all units +2 Health in every battle) or the **Black Forge** (Horde, all units +1 Attack). The price is all the Shards. Shards scattered among several heroes are not enough: a hero can **pass their Shards** to an ally on the same or a neighbouring tile (a button in the hero panel).

### Faction mechanics and buildings
To have your faction's mechanic you must build the building that gives it (the best level in the faction counts):
- **Shrine of Dawn** (Covenant, requires the Hospital), 4 levels: I **Light of Dawn** (at the start of every battle round the most badly wounded unit regains 1 Health), II heals 2, III two units, IV all the Covenant's units start the battle with +1 Health.
- **Blood Pit** (Horde, requires the Forge), 4 levels: I **Bloodlust** (when an enemy of the Horde dies in battle, all its units get +1 Attack until the end of the battle, once per battle), II twice, III three times, IV with Bloodlust the units also regain 1 Health.

Each faction also has two more buildings: the **Covenant** the Tree Nursery (+1 wood per round per level; requires the Treasury) and the Grove Circle (a hero entering the tile of their own settlement refills all their mana; requires the Mage Tower); the **Horde** the Plunder House (+2 gold after a win against a hero or a guardian; requires the Market) and the Wolf Den (the Horde's heroes have +1 movement point; requires the Moat).

### Two units per rank and habitats
On the level Empire each of the unit ranks 2–5 has **two units to choose from**. Before you recruit such a unit, build its **habitat**. **The habitat of one unit excludes the other unit of that rank until the end of the game**, so choose the one that suits your team. Covenant: Porcupine or Silver Fox, Centaur or Dawn Owl, Alabaster Boar or Dryad Archer, Tree Guardian or White Stag. Horde: Ratman or Goblin Slinger, Hellhound or Gargoyle, Ash Salamander or Cave Troll, Minotaur Chief or Shadow Wyvern.

### Legendary unit
The tier 6 unit has a **dwelling** of its own too (Phoenix Nest, Cavern of Doom; 6 gold, 3 ore and 2 dust, after the tier 5 dwelling), but there is only one, so no choice. Then, in upgraded barracks, for 20 gold and 3 Star Dust, a faction can recruit one legendary unit: the **Phoenix of Dawn** (flies; once per battle after dying it rises with half its Health) or the **Behemoth of Doom** (with every attack it can hit two adjacent enemies).

## Factions: Herds, Clans and Tides
@words: factions, wild herd, iron clan, tide brotherhood, herds, clans, tides, push, collision, stampede, shield wall, rune forge, rune, tide, pearl shield, swap places, water wall, harpoon, shell, whirlpool, stampede stone, shield hall, temple of tides, horns, charge, armor, forge of runes

Besides the Dawn Covenant and the Horde, you can play three more factions in Skirmish. Each has **its own heroes, three tavern commanders, a fourth hero, twelve units** (one or two per level, as in [Empire](#empire)), **its own land, settlement and music**, and one **faction mechanic** granted by the mechanic building. The rules of growth, economy and battle are the same as for the Covenant and the Horde; below is only what differs. You choose factions in the wizard (a random faction is the default wherever the goal allows all of them).

### Wild Herd
Wandering herds of the steppes and forests: aurochs, bison, rhinos and elk led by satyrs with horns and pipes. They fight by **momentum**: whoever stands in the herd's way ends up on the rocks. Strengths: initiative, quick reach to shooters, conquering the map. Weaknesses: no healing, weak shooters, settlement walls (without the Rhino) and units that cannot be pushed.
- **Push and collision (Stampede).** Many Herd blows push the target 1 or 2 hexes. A target stopped by a boulder, the arena edge or another unit takes **collision** damage; the unit it hits is hurt too (friend or foe). Two-hex units, the Bison and the Indrik cannot be pushed.
- **Heroes:** the Great Aurochs (Ancestors' Horns: once per battle the blow pushes the target 2 hexes), the Satyr Hornlord (Horn of the Wanderers: once per battle allies get +2 Speed in their next activation), Windrunner (On the Run: after an attack he finishes his move with the remaining hexes). Commanders: the Aurochs Outrider, the Steppe Eagle Hunter (flies), the Planetnik. Fourth hero: the Thunder Ram.
- **Units:** Satyr Piper, Young Aurochs, Steppe Kulan (level 1, starting helpers); Steppe Archer or Musk Ox (2); Forest Bison or Arkar (3); Steppe Lamignat (flies) or Drum Elephant (4); War Rhino or Bull Moose (5); the legend Indrik, Lord of Beasts. One unit's habitat rules out the other of the pair, as in [Empire](#empire).
- **Settlement:** the **Stampede Stone** (mechanic: a run of at least 3 hexes pushes the target; higher levels add collision damage and lower the run threshold), the **Great Pastures** (level 1–3 helpers cost 1 gold less, on level II higher ones too) and the **Wanderers' Refuge** (once per round moves a hero to another own settlement with a Refuge; a button in the settlement window). Primal Spark: the Altar of Horns (+1 Speed for all Herd units).

### Iron Clan
Mountain dwarfs, bronze machines, armored bears and mine spirits. Role: **defence and sieges**. Strengths: armor from many sources, settlement defence, the Clan Cannon. Weaknesses: slow, no fliers, beaten by control and attrition.
- **Shield Wall.** A Clan unit standing in formation (next to at least two living allies) takes 1 less damage from every blow; higher levels of the Shield Hall lower the requirement to one neighbour, protect the formation from being pushed, and melee attackers lose 1 Health.
- **Rune Forge (permanent).** Once per round the forge strikes a **rune** onto one helper of the faction: +1 Attack, +1 Health or armor 1 (cost: 1 gold and 1 ore; level I gives one rune per unit, level II two different ones). Runes stay after the helper dies. A button in the settlement window, in the building panel.
- **Heroes:** Thane Ironbeard (Shield Oath: neighbours have armor 1 until the end of the round), the Rune Matron (Stone Rune: armor 1 and immunity to pushing), the Pass Warden (the Piercing Bolt also hits the enemy behind the target). Fourth hero: the Old Minemaster. Commanders: the Clan Warrior, the Mountain Crossbowman, the Forge Priest.
- **Units:** Dwarf Shieldbearer, Bronze Mole, Brass Spider (1); Armored Bear or Battle Smith (2); Bronze Sentinel or Ram Goat (3); Giant Slayer or Skarbnik (4); Hammer Guard or Clan Cannon (5); the legend Forge Colossus (can raise a wall with Fortification).
- **Settlement:** the **Shield Hall** (mechanic), the **Rune Forge** (equipment, requires the Forge) and the **Deep Gallery** (+1 ore per round from the settlement). Primal Spark: the Anvil (armor 1 for all Clan units).

### Tide Brotherhood
A people of the reef and the ebb: tritons, sirens, crab-folk and turtles, and sea serpents in the deep. They do not charge, they **rearrange and pull**. Strengths: rotating the wounded, pulling enemy shooters, sturdy turtles. Weakness: low damage. The abilities work on maps without water too.
- **Tide.** A Brotherhood unit may **swap places with an ally** within 2 hexes before its activation (the wounded retreats, the fresh one steps in); the number of swaps and extra bonuses are set by the levels of the Temple of Tides.
- **Pearl shield.** A shield that absorbs a set amount of damage (for example from the Pearl Priestess or the Primal Spark); it disappears when used up.
- **Pulling.** The Harpoon, the Siren's Song, the Coils of the Deep and the Maelstrom pull enemies towards the Brotherhood, and the Whirl and the Ebb swap units.
- **Heroes:** the Triton King (Water Wall: once per battle pushes adjacent enemies, neighbours take 1 less damage until the end of the round), the Siren Singer (Siren's Song: pulls an enemy), the Coral Wyrm (Coils of the Deep: pulls and immobilizes). Fourth hero: Old Walrus Captain. Commanders: the Triton Guard, the Harpooner, Sefiran the Spotted (Molt: sheds statuses and regains Health).
- **Units:** Shell Turtle (Shell: once per battle hides and takes no damage until its next activation), Triton Harpooner, Frog Leaper (1); Crab-folk Shieldbearer or Ink Octopus (2); Sharkman or Pearl Priestess (3); Armored Lobster or Albatross (4); Reef Golem or Sea Witch (5); the legend Leviathan.
- **Settlement:** the **Temple of Tides** (mechanic), the **Pearl Shoals** (+1 gold per round) and the **Lighthouse** (reveals the map to the faction within 3 hexes, 5 on level II, and shows enemy hero movements). Primal Spark: the Pearl Temple (every unit starts the battle with a Pearl Shield).

### Where you can play them
The new factions are available in **Skirmish** in the goals Control, Conquest and Relic, also at an online table (each seat picks its own faction).

## Evil automaton and bots
@words: evil automaton, bot, computer, artificial intelligence, horde, opponent, reinforcements, hint, autoplay

The computer leads the Horde (or any other side without a human) the same way in every game mode: it picks its fights, collects gold, builds up its settlements and hunts heroes.

On the arena the computer plays in a similarly sensible way. In family mode the **hint** button in the bottom bar asks the bot "what would you do" and shows the answer in a sentence at the top of the screen and highlights the target tile.

## Arena
@words: arena, 3 vs 3, 6 vs 6, quick battle, duel, treasures, draw, computer

The arena is **one battle without a map**: the Covenant against the Horde, with the computer or with another player. Each side chooses a hero and supports (in a 3 vs 3 battle two of the three). Who picks first and on which arena you fight is drawn at random. Treasures are chosen from the shared deck (see [Treasures and the Elixir of Rebirth](#treasures-and-the-elixir-of-rebirth)). The side that is last standing wins.

**Arena 6 vs 6** (the option "Battle size" in the wizard) is a bigger battle: six units per side. It has its own online ranking. On the arena you can choose the computer's difficulty, also Very hard (a computer that makes no mistakes in its choices).

## Campaign
@words: campaign, story, scenarios, return of the light, the first valley, griffin's cliff, the sunken ruins, shadow over the tree, history

The **campaign "Return of the Light"** is the story of the Dawn Covenant in **four scenarios** on hand-drawn maps: **The First Valley**, **Griffin's Cliff**, **The Sunken Ruins** and **Shadow over the Tree**. Each scenario has its own rules level, goal, introduction, hints and story notes that open at important moments (after a round, on stepping onto a tile or defeating an opponent; the "Next" button closes the small window).

The scenarios unlock one after another: finishing one opens the next. Progress is saved in this browser. After a win the summary screen offers "Next scenario". You can save a scenario in progress (**Options → Save game**) and load it from "Load a game"; the save is labelled with the scenario's name.

## Roguelike Run
@words: roguelike run, run of the day, roguelike, relics, eight battles, one life, black dragon, ranking of the day, mana crystal, mana spring, spare book, master's chest

The **Roguelike Run** is a roguelike mode of **eight 6 vs 6 arena battles in a row**. You have **one life**: a lost battle ends the run. You choose a hero and go through consecutive stages: Forest Gate, Crossroads, Ashes, Stone Ford, Shadow Marsh, Wolf Pass, Black Moat and Throne of the Horde. Each stage has a different opponent, and the last is a boss, the **Black Dragon**. The computer grows stronger from stage to stage (more mana, spells and artifacts).

After each win you choose one of three **relics** that stay until the end of the run: **Mana Crystal** (+1 mana), **Mana Spring** (+2), **Spare Book** (one extra spell), **Master's Chest** (one extra artifact), **Sage's Satchel** (+1 mana and a spell) and **Wanderer's Kit** (an artifact and +1 mana).

The **Run of the day** is the same run for all players on a given day (the same opponents and offers). The result of logged-in players goes to the **ranking of the day**.

**Saving:** the run saves itself between battles, so closing the tab does not lose it; "Load a game" has a "Roguelike Run in progress" entry with a "Resume" button. There is no manual save in a battle, because a run has one life. Leaving a battle of an ordinary run gives no retry: the battle waits in the same state, and the run page's button becomes "Back to the battle". Leaving a battle of the run of the day ends it, and the stages cleared so far count.

## Online play and ranking
@words: online, internet, account, login, new account, room, room code, invitation, friends, ranking, points, wins, table, saved online games

After choosing the mode in the menu ("where you play"), choose **online**. You create an **account** (a nickname and a password) or log in. Then:
- **Play with friends:** you create a **room** (a table). You give the room code to friends, who choose "Join a game" in the menu, or you invite players from the list next to it. The table's settings are changed by its founder, who also starts the game. You can take several seats and play them in turn at one computer, and the computer fills the free seats.
- **Saved online games:** games saved on the server can be resumed (you cannot change the settings of such a game).
- **Ranking:** points for wins (see [Difficulty levels](#difficulty-levels)) form a table of the best players; there is a separate ranking for Arena 6 vs 6 and for the Run of the day. Games with custom settings give no points.

In the lobby there is a **general chat**, in a room a **room chat** (messages live only as long as the server runs) and a list of online players with an "Invite" button. Online and local play use the same engine, so the rules are identical.

## Family mode
@words: child, parent, family, autopilot, walk, children, young player, help for a child, hint

The game is also prepared for playing with a child (from age 5):
- **Walk** (level I) means short duels on a board without abilities and the ritual, with its own table of points.
- In a skirmish, tick **Child** next to a human player. Their hero has 2 more Health in battle and 1 more movement point on the map, while the parent plays unchanged. The **hint** button suggests a move to the child.
- On levels with settlements the child **walks and fights**, while the parent builds, recruits and trades (gold and resources are shared). If there is no adult, the settlements are handled by the **autopilot** like a computer, and the child's chests open by themselves.

## Custom settings
@words: custom settings, custom, switches, layer, dice, battle round limit, reserve hero, horde reinforcements, initiative tie

**Custom settings** let you switch the rules separately. Five sections: **levels and mechanics** (from "no settlements" to "+ Relic and factions"; requires hero development), **hero** (movement 2–5, a reserve hero), **battle** (arena or board, no abilities, dice, initiative tie), **battle round limit** (20 / 30 / 40 / 60 / 80), **the Horde and the computer** (the Horde's reinforcements, an extra hero in co-op) and **treasures and start** (only Elixirs). The defaults correspond to the Normal level. **Games with custom settings give no ranking points.**

## Controls and shortcuts
@words: shortcuts, keys, keyboard, mouse, phone, touch, right button, ctrl, space, esc, holding, rotating, full screen

| Key | Action |
|---|---|
| Space / E | end the turn (on the map) |
| Space | end the activation (in battle) |
| U or Ctrl+Z | undo the last step on the map |
| F | fast-forward the bots' moves |
| Z | switch on the active unit's ability |
| S | show treasures in battle |
| Ctrl | held over a unit in battle: shows where it can get to and whom it can reach |
| D | event log |
| R | rules and cards |
| O | options |
| Esc | close the window |

**Mouse:** the left button selects and acts, the **right button held** shows details (on large units a right click turns the tail). **Phone:** the game works on a phone **in landscape** (in portrait it asks you to rotate). Tooltip descriptions show after a tap, and details after holding a finger. The buttons of the bottom bar and windows have enlarged touch areas.

## Saves, options and language
@words: save, save game, load, autosave, options, log, language, polish, english, flag, animations, music, full screen, installation, PWA, phone, bug report

- **Save:** the game saves itself (**autosave**) and you can save it under your own name (**Options → Save game**). You load in the main menu ("Load a game"): the last game, a save under a name, or a game from a file. A save is the settings plus a list of moves, so after loading the state is exactly the same.
- **Options** (the **O** key): the speed of animations (faster ones shorten fights), language, the Autoplay mode, the look of portraits (you can go back to round ones on a weaker device), rules and cards, the log, and leaving the game.
- **Log** (the **D** key): a list of the game's events that helps you understand what happened. It shows your faction's entries, the battles you took part in and what everybody shares (the rounds, the goal's progress, the end of the game); other factions' moves and finds are not shown.
- **Language:** Polish and English. The game picks it from the browser's settings, and you can change it with the flags in the top right corner of the menu or in the options; the choice is remembered. The English version has its own logo.
- **Phone and installation:** the game can be installed like an app (the options show an installation hint), and after installation it runs full screen.
- **Bug report:** during the game you can describe a problem; the report gets the last lines of the log and the state of the game. Without a connection to the server the report waits in the browser ("For testers" → "Send to the author").

## Special cases and questions
@words: questions, faq, special cases, draw, I can't, why, what if, problem

**What if the last heroes of both sides fall in the same battle?** In the game of crystals the Horde wins: the Covenant wins only with crystals, so when its last hero falls it loses, even if the Horde's last hero fell too. In the other goals the rule of the goal counts ([Goals of the game](#goals-of-the-game)).

**Why can't I buy a second building?** On the level Principality and above only the price limits you. Check in the building tree what is missing: a locked (grey) node says which building must stand.

**Why can't I recruit in a captured settlement?** A settlement captured by another faction gives income, a market and a hospital, but does not recruit.

**Where are the cards of units and treasures?** In the same "Rules and cards" window, in the tabs "Units", "Treasures", "Artifacts" and "Map locations".

**Where is the printable manual?** At the bottom of this page: the link opens the board game's manual in a new tab (it is in Polish only).
