// Tools for testing the game (the developer panel, ui/DevPanel.tsx): changes of a game state that no rule allows, to look at a screen without playing
// up to it. They live apart from `applyAction` on purpose: a game that never calls them is exactly the game it was (the golden games, the server).
// Every function changes the state it is given (the panel gives it a copy); `fightNeutral` and the scenes return the state to show.

import { FACTION_HEROES, ITEMS, UNITS, type FactionId, type TeamId, type ItemKind } from './data';
import { activeHero, applyAction, giveItem, newItem } from './game';
import { neighborKeys } from './hex';
import { tileCost } from './map';
import { ARTIFACT_BY_ID, giveArtifact } from './sites';
import { SPELL_IDS, type SpellId } from './magic';
import { BUILDING_NAMES, buildingsFor, type BuildingId } from './kingdom';
import { shardTotal } from './empire';
import type { GameState, HeroState } from './types';

const heroOf = (state: GameState, heroId: string): HeroState => {
  const h = state.heroes[heroId];
  if (!h) throw new Error(`Nie ma bohatera: ${heroId}.`);
  return h;
};

/** Gold and resources of a faction (what is missing in `what` stays). */
export function setResources(state: GameState, faction: TeamId, what: { gold?: number; wood?: number; ore?: number; dust?: number }): void {
  const k = state.kingdom;
  if (!k) throw new Error('Złoto i surowce są od poziomu IV.');
  if (what.gold !== undefined) k.gold[faction] = what.gold;
  if (k.res) for (const r of ['wood', 'ore', 'dust'] as const) if (what[r] !== undefined) k.res[faction][r] = what[r]!;
}

/** The hero's level (and the full mana that goes with it). */
export function setHeroLevel(state: GameState, heroId: string, level: number): void {
  const h = heroOf(state, heroId);
  h.level = Math.max(1, Math.min(10, Math.round(level)));
  delete h.mana;
}

/** The hero knows this spell (the mage tower is not needed) and has full mana. */
export function learnSpell(state: GameState, heroId: string, spell: SpellId): void {
  if (!SPELL_IDS.includes(spell)) throw new Error(`Nie ma czaru: ${spell}.`);
  const h = heroOf(state, heroId);
  h.spells = [...new Set([...(h.spells ?? []), spell])];
  delete h.mana;
}

/** The hero gets an artifact, worn when it improves the slot, otherwise in the backpack. */
export function giveArtifactTo(state: GameState, heroId: string, artifactId: string): void {
  const art = ARTIFACT_BY_ID[artifactId];
  if (!art) throw new Error(`Nie ma artefaktu: ${artifactId}.`);
  giveArtifact(state, heroOf(state, heroId), art, 'panel testowy');
}

/** A treasure card for the faction's shared chest. */
export function giveTreasure(state: GameState, faction: TeamId, kind: ItemKind): void {
  if (!ITEMS[kind]) throw new Error(`Nie ma skarbu: ${kind}.`);
  giveItem(state, newItem(state, kind), faction, null);
}

/** A unit joins the faction's pool of supports. */
export function addUnit(state: GameState, faction: TeamId, unitId: string): void {
  if (!UNITS[unitId]) throw new Error(`Nie ma jednostki: ${unitId}.`);
  const fs = state.factions[faction];
  fs.supportsDead = fs.supportsDead.filter((id) => id !== unitId);
  if (!fs.supportsAlive.includes(unitId)) fs.supportsAlive.push(unitId);
}

/** A building stands in the settlement at this level, with no price, no parent and no limit of the round. */
export function buildAnywhere(state: GameState, settlementId: string, building: BuildingId, level: number): void {
  const s = state.kingdom?.settlements[settlementId];
  if (!s) throw new Error('Nie ma takiej osady.');
  s.buildings[building] = Math.max(0, level);
}

/** Every building this game has, at its highest level, in every settlement the faction holds. */
export function buildEverything(state: GameState, faction: TeamId): void {
  if (!state.kingdom) throw new Error('Osady są od poziomu IV.');
  for (const s of Object.values(state.kingdom.settlements)) {
    if (s.owner !== faction) continue;
    for (const b of buildingsFor(state, faction)) if (b !== 'spark') s.buildings[b] = Math.min(BUILDING_NAMES[b].length, b === 'magic' ? 3 : b === 'shrine' || b === 'bloodPit' || b === 'hoofStone' || b === 'barrow' || b === 'shieldHall' || b === 'frostPalace' || b === 'trapWorkshop' || b === 'mirageHall' || b === 'myceliumHeart' ? 4 : 2);
  }
}

export function revealAll(state: GameState): void {
  for (const t of Object.values(state.tiles)) t.revealed = true;
}

/** The hero stands on this hex of the map. */
export function teleportHero(state: GameState, heroId: string, hex: string): void {
  if (!state.tiles[hex]) throw new Error('Nie ma takiego pola.');
  heroOf(state, heroId).pos = hex;
}

/** The hero holds the whole set of shards of the Pierwotna Iskra (level 6). */
export function giveAllShards(state: GameState, heroId: string): void {
  heroOf(state, heroId).shards = shardTotal(state);
}

/** The faction's units are all alive (a battle without losses to start from). */
export function reviveAll(state: GameState, faction: TeamId): void {
  const fs = state.factions[faction];
  fs.supportsAlive.push(...fs.supportsDead);
  fs.supportsDead = [];
}

/**
 * "Fight now": the active hero steps next to the first neutral encounter of this tier (0 common, 1 rare, 2 legendary; a guardian when there is none)
 * and walks into it. Returns the state with the battle begun.
 */
export function fightNeutral(state: GameState, tier: 0 | 1 | 2 = 0): GameState {
  const hero = activeHero(state);
  if (!hero) throw new Error('Teraz nie ma aktywnego bohatera.');
  const enc = Object.values(state.crystals).find((c) => c.encounter && c.tier === tier) ?? Object.values(state.crystals).find((c) => c.guardian);
  if (!enc) throw new Error('Na tej mapie nie ma przeciwnika do walki.');
  const next = neighborKeys(enc.at).find((k) => state.tiles[k] && tileCost(state.tiles[k]) !== null && !state.tiles[k].crystalId);
  if (!next) throw new Error('Przy przeciwniku nie ma wolnego pola.');
  hero.pos = next;
  state.tiles[enc.at].revealed = true;
  state.movePoints = Math.max(state.movePoints, 3);
  return applyAction(state, { type: 'moveHero', to: enc.at });
}

/** The ready scenes of the panel: what each needs (the level of the game it only makes sense on) and what it does to a copy of the state. */
export interface DevScene {
  id: string;
  label: string;
  /** What to do next, shown under the button. */
  hint: string;
  /** Needs this level's rule on (`realm` for the spells, `empire` for the shards...). */
  needs?: 'kingdom' | 'economy' | 'realm' | 'empire';
  run: (state: GameState) => GameState;
}

const mainHero = (state: GameState): HeroState => {
  const h = activeHero(state);
  if (!h) throw new Error('Teraz nie ma aktywnego bohatera.');
  return h;
};

export const DEV_SCENES: DevScene[] = [
  {
    id: 'spellbook',
    label: 'Księga czarów w bitwie',
    hint: 'Bohater zna wszystkie czary bitewne i ma pełną manę; zaczyna się walka z neutralnymi. Wybierz pomocników, a w swojej aktywacji bohatera kliknij „Czary”.',
    needs: 'realm',
    run: (state) => {
      const h = mainHero(state);
      for (const id of SPELL_IDS) learnSpell(state, h.id, id);
      setHeroLevel(state, h.id, 5);
      return fightNeutral(state, 0);
    },
  },
  {
    id: 'settlement',
    label: 'Okno osady z pełnym drzewkiem',
    hint: 'Wszystkie budynki własnych osad stoją na najwyższym poziomie, złota i surowców jest dużo. Wejdź do osady i kliknij Radę Osady.',
    needs: 'kingdom',
    run: (state) => {
      const f = mainHero(state).faction;
      buildEverything(state, f);
      setResources(state, f, { gold: 99, wood: 20, ore: 20, dust: 20 });
      return state;
    },
  },
  {
    id: 'boss',
    label: 'Bitwa z legendarnym neutralnym',
    hint: 'Pełna drużyna, bohater na poziomie 6, walka z najsilniejszą grupą neutralnych.',
    run: (state) => {
      const h = mainHero(state);
      reviveAll(state, h.faction);
      setHeroLevel(state, h.id, 6);
      return fightNeutral(state, 2);
    },
  },
  {
    id: 'shards',
    label: 'Relikt: komplet Odłamków',
    hint: 'Bohater niesie wszystkie Odłamki; w osadzie zbuduj Pierwotną Iskrę.',
    needs: 'empire',
    run: (state) => {
      giveAllShards(state, mainHero(state).id);
      return state;
    },
  },
  {
    id: 'chest',
    label: 'Okno skrzyni',
    hint: 'Otwiera skrzynię z wyborem: artefakt albo złoto.',
    needs: 'kingdom',
    run: (state) => {
      state.kingdom!.chest = { heroId: mainHero(state).id };
      return state;
    },
  },
];

/** The heroes of a faction, for the panel's lists. */
export const heroesOfFaction = (faction: FactionId): string[] => FACTION_HEROES[faction];
