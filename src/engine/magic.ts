// Level 5 "Królestwo" (rule `realm`): magic. Heroes have mana, learn spells in the mage tower of a settlement (building `magic`) and cast them
// in a battle (the hero's unit, once per activation, on top of its move and attack) or on the map (in the hero's turn). Every number is provisional.
// Spells are the same for both factions; the sage commanders are the better casters. Design: docs/ZASADY_CYFROWE.md ("Poziom 5", "Magia").

import { UNITS, type TeamId } from './data';
import { battleFx, cellsOf, dealDamage, hpScaleOf, livingUnits, scaleOf, unitAttackBase } from './battle';
import { distance, parseKey } from './hex';
import { levelOf } from './growth';
import { log } from './log';
import { revealAround } from './map';
import type { BattleUnit, GameState, HeroState } from './types';
import { specialtyOf, typeMana } from './heroTypes';

export type SpellId = 'bolt' | 'mend' | 'slow' | 'stoneskin' | 'fireball' | 'haste' | 'vision' | 'portal' | 'quicken' | 'thunder' | 'curse' | 'shield' | 'inspire';

/** How many circles of spells there are: the mage tower has this many levels (one circle each). Going up to five later is data only (SPELLS, MAGIC.price, the tower's cost and texts). */
export const SPELL_CIRCLES = 3;

export interface SpellDef {
  id: SpellId;
  name: string;
  /** Circle I spells are in every mage tower, each next circle needs the tower one level higher. */
  circle: 1 | 2 | 3;
  mana: number;
  where: 'battle' | 'map';
  /** Whom a battle spell is cast on. */
  target: 'enemy' | 'ally' | 'none';
  /** Rule text in the board game's numbers (the screen scales "N obrażeń" and "N Ż"). */
  text: string;
}

export const MAGIC = {
  /** Mana a hero holds at most: this much, plus one for each level; the sages hold more. Mana comes back by `regen` at the end of every round. */
  manaBase: 3,
  manaPerLevel: 1,
  sageMana: 3,
  regen: 1,
  /** A hero's spells grow with it: +1 damage or healing for every this many levels (and +1 for a sage). */
  powerLevels: 3,
  /** Price of learning a spell, by circle (gold; circle II also a Gwiezdny Pył). */
  price: [{ gold: 3 }, { gold: 5, dust: 1 }, { gold: 8, dust: 2 }],
  boltDamage: 3,
  mendHeal: 4,
  slowSpeed: 2,
  stoneskin: 1,
  fireballDamage: 2,
  visionRadius: 3,
  /** Przyspieszenie (map): movement points added for this turn. */
  quickenPoints: 2,
  /** Grom: the target's damage, then the damage of the jump to the nearest other enemy. */
  thunderDamage: 5,
  thunderJump: 2,
  /** Klątwa: Atak the enemy loses to the end of the battle (never below 1 point of the board game's scale). */
  curseAttack: 1,
  /** Natchnienie: Atak the ally gains in its next activation. */
  inspireAttack: 2,
};

export const SPELLS: Record<SpellId, SpellDef> = {
  bolt: { id: 'bolt', name: 'Magiczny Pocisk', circle: 1, mana: 2, where: 'battle', target: 'enemy', text: `Wybrany wróg, gdziekolwiek stoi, dostaje ${MAGIC.boltDamage} punktów obrażeń.` },
  mend: { id: 'mend', name: 'Leczenie', circle: 1, mana: 2, where: 'battle', target: 'ally', text: `Wybrany sojusznik odzyskuje ${MAGIC.mendHeal} Ż, do maksimum.` },
  slow: { id: 'slow', name: 'Spowolnienie', circle: 1, mana: 1, where: 'battle', target: 'enemy', text: `Wybrany wróg ma −${MAGIC.slowSpeed} S w swojej następnej aktywacji.` },
  vision: { id: 'vision', name: 'Wizja', circle: 1, mana: 2, where: 'map', target: 'none', text: `Na mapie: odkrywa pola w promieniu ${MAGIC.visionRadius} od bohatera.` },
  stoneskin: { id: 'stoneskin', name: 'Kamienna Skóra', circle: 2, mana: 2, where: 'battle', target: 'ally', text: `Do końca bitwy każdy cios w wybranego sojusznika zadaje o ${MAGIC.stoneskin} mniej obrażeń (ale co najmniej 1).` },
  fireball: { id: 'fireball', name: 'Kula Ognia', circle: 2, mana: 3, where: 'battle', target: 'enemy', text: `Wybrany wróg i wszyscy stojący obok niego (także twoi) dostają po ${MAGIC.fireballDamage} punktów obrażeń.` },
  haste: { id: 'haste', name: 'Zryw', circle: 2, mana: 3, where: 'battle', target: 'ally', text: 'Wybrany sojusznik (nie sam bohater) dostaje zaraz dodatkową aktywację.' },
  quicken: { id: 'quicken', name: 'Przyspieszenie', circle: 1, mana: 2, where: 'map', target: 'none', text: `Na mapie: bohater dostaje +${MAGIC.quickenPoints} punkty ruchu w tej turze.` },
  thunder: { id: 'thunder', name: 'Grom', circle: 3, mana: 4, where: 'battle', target: 'enemy', text: `Wybrany wróg dostaje ${MAGIC.thunderDamage} punktów obrażeń, a piorun przeskakuje na najbliższego innego wroga (${MAGIC.thunderJump} punkty obrażeń).` },
  curse: { id: 'curse', name: 'Klątwa', circle: 3, mana: 3, where: 'battle', target: 'enemy', text: `Wybrany wróg ma −${MAGIC.curseAttack} A do końca bitwy (nie mniej niż 1).` },
  shield: { id: 'shield', name: 'Tarcza', circle: 3, mana: 3, where: 'battle', target: 'ally', text: 'Pierwszy cios w wybranego sojusznika zostaje całkowicie pochłonięty.' },
  inspire: { id: 'inspire', name: 'Natchnienie', circle: 3, mana: 3, where: 'battle', target: 'ally', text: `Wybrany sojusznik ma +${MAGIC.inspireAttack} A w swojej następnej aktywacji.` },
  portal: { id: 'portal', name: 'Wrota', circle: 2, mana: 4, where: 'map', target: 'none', text: 'Na mapie: przenosi bohatera do najbliższej własnej osady. Kończy jego ruch w tej turze.' },
};
export const SPELL_IDS = Object.keys(SPELLS) as SpellId[];
/** The spells a main hero knows from the start of a level 5 game (a commander learns in a tower). */
export const START_SPELLS: SpellId[] = ['bolt'];

/** The commanders of the sage archetype are born casters (in level 5 every sage-type hero also gains mana with its levels, heroTypes.ts). */
const isSage = (heroId: string) => heroId === 'dawnSage' || heroId === 'hordeShadow';

export const maxMana = (hero: HeroState): number => MAGIC.manaBase + MAGIC.manaPerLevel * levelOf(hero) + (isSage(hero.id) ? MAGIC.sageMana : 0) + typeMana(hero) + (hero.manaBonus ?? 0);
export const manaOf = (hero: HeroState): number => hero.mana ?? maxMana(hero);
/** Extra damage and healing of the hero's spells. */
export const spellPower = (hero: HeroState): number => Math.floor(levelOf(hero) / MAGIC.powerLevels) + (hero.kind === 'sage' || isSage(hero.id) ? 1 : 0) + (specialtyOf(hero)?.spellPower ?? 0);

/** 6 on 6 arena: the battle spells of circles I-II a hero may choose from, and how many it takes. */
/** What a spell is worth to a bot choosing for an arena battle (and the computer's bonus spell at "Bardzo trudny"). */
export const SPELL_VALUE: Record<SpellId, number> = { fireball: 6, bolt: 5, haste: 4, stoneskin: 4, mend: 3, slow: 3, thunder: 6, curse: 4, shield: 4, inspire: 4, vision: 0, portal: 0, quicken: 0 };
export const ARENA_SPELL_POOL: SpellId[] = SPELL_IDS.filter((id) => SPELLS[id].where === 'battle' && SPELLS[id].circle <= 2);
export const ARENA_SPELL_PICKS = 2;

/** The spells a mage tower of this level teaches. */
export const towerSpells = (level: number): SpellId[] => SPELL_IDS.filter((id) => SPELLS[id].circle <= level);

/** Spells of one circle, in the order of the book. */
export const circleSpells = (circle: number): SpellId[] => SPELL_IDS.filter((id) => SPELLS[id].circle === circle);

/** The end of a round: every living hero gets some mana back. */
export function regenMana(state: GameState): void {
  if (!state.rules.realm) return;
  for (const h of Object.values(state.heroes)) if (h.alive && h.mana !== undefined) h.mana = Math.min(maxMana(h), h.mana + MAGIC.regen + (specialtyOf(h)?.regen ?? 0));
}

function spend(state: GameState, hero: HeroState, spell: SpellId): SpellDef {
  const def = SPELLS[spell];
  if (!state.rules.realm) throw new Error('Czary są dopiero na poziomie Królestwo.');
  if (!def || !hero.spells?.includes(spell)) throw new Error('Bohater nie zna tego czaru.');
  if (manaOf(hero) < def.mana) throw new Error(`Za mało many (potrzeba ${def.mana}).`);
  hero.mana = manaOf(hero) - def.mana;
  return def;
}

/** What the hero whose unit is active may cast now in the battle (empty: not a hero, no spells, already cast in this activation). */
export function castableInBattle(state: GameState): SpellId[] {
  const b = state.battle;
  if (!state.rules.realm || !b || b.stage !== 'fight' || !b.activation || b.activation.spell) return [];
  const hero = state.heroes[b.activation.unitId];
  if (!hero || b.units[hero.id]?.side !== hero.faction) return [];
  return (hero.spells ?? []).filter((id) => SPELLS[id].where === 'battle' && manaOf(hero) >= SPELLS[id].mana);
}

/** The units a battle spell may be cast on by the active hero. */
export function spellTargets(state: GameState, spell: SpellId): BattleUnit[] {
  const b = state.battle!;
  const caster = b.units[b.activation!.unitId];
  const def = SPELLS[spell];
  if (def.target === 'enemy') return livingUnits(b).filter((u) => u.side !== caster.side && u.pos);
  if (def.target === 'ally') return livingUnits(b, caster.side).filter((u) => u.pos && (spell !== 'haste' || u.id !== caster.id) && (spell !== 'mend' || u.hp < u.maxHp) && (spell !== 'shield' || !u.status.shieldArmed));
  return [];
}

/** The active hero casts a spell in the battle: once per activation, before or after its move and attack. */
export function battleSpell(state: GameState, spell: SpellId, targetId?: string): void {
  const b = state.battle!;
  const act = b.activation!;
  if (!castableInBattle(state).includes(spell)) {
    const hero = state.heroes[act.unitId];
    if (hero && act.spell) throw new Error('W tej aktywacji bohater już czarował.');
    if (hero?.spells?.includes(spell) && SPELLS[spell].where === 'battle') throw new Error(`Za mało many (potrzeba ${SPELLS[spell].mana}).`);
    throw new Error('Tego czaru nie można teraz rzucić.');
  }
  const hero = state.heroes[act.unitId];
  const target = targetId ? b.units[targetId] : undefined;
  if (!target || !spellTargets(state, spell).some((u) => u.id === target.id)) throw new Error('Wybierz właściwy cel czaru.');
  const def = spend(state, hero, spell);
  act.spell = true;
  const who = UNITS[hero.id].name;
  const power = spellPower(hero);
  const name = (u: BattleUnit) => UNITS[u.defId].name;
  log(state, 'ability', `${who} rzuca czar: ${def.name} (${name(target)}).`);
  (b.spells ??= []).push({ spell, casterId: hero.id, targetId: target.id });
  battleFx(state, `czar_${spell}` as 'czar_bolt', target.pos);
  switch (spell) {
    case 'bolt':
      dealDamage(state, target, (MAGIC.boltDamage + power) * scaleOf(state), def.name);
      break;
    case 'mend': {
      const healed = Math.min((MAGIC.mendHeal + power) * hpScaleOf(state), target.maxHp - target.hp);
      target.hp += healed;
      (b.heals ??= []).push({ unitId: target.id, amount: healed });
      log(state, 'ability', `${name(target)} odzyskuje ${healed} Ż.`);
      break;
    }
    case 'slow':
      if (target.gear?.unbound) log(state, 'ability', `${name(target)} nie daje się spowolnić.`);
      else target.status.slowNext += MAGIC.slowSpeed;
      break;
    case 'stoneskin':
      target.status.damageReduction += MAGIC.stoneskin * scaleOf(state);
      break;
    case 'fireball': {
      const centre = cellsOf(target);
      const near = livingUnits(b).filter((u) => u.id !== target.id && u.pos && cellsOf(u).some((c) => centre.some((k) => distance(parseKey(k), parseKey(c)) === 1)));
      for (const u of [target, ...near]) if (u.alive) dealDamage(state, u, (MAGIC.fireballDamage + power) * scaleOf(state), def.name);
      break;
    }
    case 'haste':
      b.extra.unshift({ unitId: target.id, moveOnly: false });
      break;
    case 'thunder': {
      dealDamage(state, target, (MAGIC.thunderDamage + power) * scaleOf(state), def.name);
      const from = cellsOf(target);
      const reach = (u: BattleUnit) => Math.min(...cellsOf(u).flatMap((c) => from.map((x) => distance(parseKey(x), parseKey(c)))));
      const next = livingUnits(b).filter((u) => u.id !== target.id && u.side === target.side && u.pos).sort((x, y) => reach(x) - reach(y) || (x.id < y.id ? -1 : 1))[0];
      if (next) {
        battleFx(state, 'czar_thunder', next.pos);
        dealDamage(state, next, (MAGIC.thunderJump + power) * scaleOf(state), def.name);
      }
      break;
    }
    case 'curse': {
      const cut = Math.min(MAGIC.curseAttack * scaleOf(state), Math.max(0, unitAttackBase(target) - scaleOf(state)));
      target.status.battleAttackBonus -= cut;
      if (!cut) log(state, 'ability', `${name(target)} nie może już słabnąć.`);
      break;
    }
    case 'shield':
      target.status.shieldArmed = true;
      break;
    case 'inspire':
      target.status.nextAttackBonus += MAGIC.inspireAttack * scaleOf(state);
      break;
    default:
      break;
  }
}

/** The active hero casts a map spell in its turn. */
export function mapSpell(state: GameState, hero: HeroState, spell: SpellId): void {
  if (SPELLS[spell]?.where !== 'map') throw new Error('Tego czaru używa się w bitwie.');
  const who = UNITS[hero.id].name;
  if (spell === 'portal') {
    const target = portalTarget(state, hero);
    if (!target) throw new Error('Nie ma wolnej własnej osady, do której prowadzą Wrota.');
    spend(state, hero, spell);
    hero.pos = target;
    state.movePoints = 0;
    revealAround(state, target);
    log(state, 'ability', `${who} rzuca czar Wrota i staje w swojej osadzie.`, undefined, { type: 'fx', kind: 'mapa_portal', hex: target });
    return;
  }
  if (spell === 'quicken') {
    spend(state, hero, spell);
    state.movePoints += MAGIC.quickenPoints;
    log(state, 'ability', `${who} rzuca czar Przyspieszenie (+${MAGIC.quickenPoints} ruchu).`, undefined, { type: 'fx', kind: 'mapa_przyspieszenie', hex: hero.pos });
    return;
  }
  spend(state, hero, spell);
  const revealed = revealAround(state, hero.pos, MAGIC.visionRadius);
  log(state, 'ability', `${who} rzuca czar Wizja (odkryto ${revealed.length}).`, undefined, { type: 'fx', kind: 'mapa_wizja', hex: hero.pos });
}

/** Where Wrota would take the hero: the nearest settlement of its faction with no other hero on it (its base may hold several), not the hex it stands on. */
export function portalTarget(state: GameState, hero: HeroState): string | null {
  const k = state.kingdom;
  if (!k) return null;
  const f: TeamId = hero.faction;
  const taken = (hex: string) => Object.values(state.heroes).some((h) => h.alive && !h.entering && h.id !== hero.id && h.pos === hex && (h.faction !== f || state.tiles[hex].home !== f));
  const at = parseKey(hero.pos);
  const open = Object.values(k.settlements).filter((s) => s.owner === f && s.at !== hero.pos && !taken(s.at));
  return open.sort((a, b) => distance(at, parseKey(a.at)) - distance(at, parseKey(b.at)) || (a.id < b.id ? -1 : 1))[0]?.at ?? null;
}

/** A battle bot's spell for the active hero, if one is worth its mana now. */
export function botSpell(state: GameState): { spell: SpellId; targetId: string } | null {
  const can = castableInBattle(state);
  if (!can.length) return null;
  const b = state.battle!;
  const hero = state.heroes[b.activation!.unitId];
  const me = b.units[hero.id];
  const power = spellPower(hero);
  const k = scaleOf(state);
  const enemies = livingUnits(b).filter((u) => u.side !== me.side && u.pos);
  const own = livingUnits(b, me.side).filter((u) => u.pos);
  const leader = (u: BattleUnit) => (UNITS[u.defId].kind === 'support' ? 0 : 1);
  if (can.includes('fireball')) {
    // Worth it when it burns two enemies or more and no friend.
    const dmg = (MAGIC.fireballDamage + power) * k;
    const best = enemies
      .map((t) => {
        const near = livingUnits(b).filter((u) => u.id !== t.id && u.pos && cellsOf(u).some((c) => cellsOf(t).some((x) => distance(parseKey(x), parseKey(c)) === 1)));
        return { t, foes: 1 + near.filter((u) => u.side !== me.side).length, friends: near.filter((u) => u.side === me.side).length, kills: [t, ...near].filter((u) => u.side !== me.side && u.hp <= dmg).length };
      })
      .filter((x) => x.friends === 0 && x.foes >= 2)
      .sort((x, y) => y.kills - x.kills || y.foes - x.foes || (x.t.id < y.t.id ? -1 : 1))[0];
    if (best) return { spell: 'fireball', targetId: best.t.id };
  }
  if (can.includes('thunder')) {
    // A kill with the jump counted: the best of the two hits (a leader first), else when the first target is wounded enough to matter.
    const dmg = (MAGIC.thunderDamage + power) * k;
    const kill = enemies.filter((u) => u.hp <= dmg).sort((x, y) => leader(y) - leader(x) || y.hp - x.hp || (x.id < y.id ? -1 : 1))[0];
    if (kill) return { spell: 'thunder', targetId: kill.id };
    // Mana to spare: the jump makes it worth it against two enemies or more.
    const t = manaOf(hero) > SPELLS.thunder.mana && enemies.length >= 2 ? enemies.slice().sort((x, y) => leader(y) - leader(x) || x.hp - y.hp || (x.id < y.id ? -1 : 1))[0] : null;
    if (t) return { spell: 'thunder', targetId: t.id };
  }
  if (can.includes('curse') && b.round === 1 && !enemies.some((u) => u.status.battleAttackBonus < 0)) {
    const strong = enemies.filter((u) => u.status.battleAttackBonus >= 0 && unitAttackBase(u) > k).sort((x, y) => leader(y) - leader(x) || unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (strong) return { spell: 'curse', targetId: strong.id };
  }
  if (can.includes('shield') && b.round >= 2 && b.round <= 5) {
    const guarded = own.filter((u) => !u.status.shieldArmed).sort((x, y) => leader(y) - leader(x) || (x.id < y.id ? -1 : 1))[0];
    if (guarded) return { spell: 'shield', targetId: guarded.id };
  }
  if (can.includes('inspire') && enemies.length) {
    const best = own.filter((u) => u.id !== me.id && u.status.nextAttackBonus === 0).sort((x, y) => unitAttackBase(y) - unitAttackBase(x) || (x.id < y.id ? -1 : 1))[0];
    if (best && b.round <= 6) return { spell: 'inspire', targetId: best.id };
  }
  if (can.includes('bolt')) {
    const dmg = (MAGIC.boltDamage + power) * k;
    // A kill first (a leader before a support), else the enemy leader once it is wounded.
    const kill = enemies.filter((u) => u.hp <= dmg).sort((x, y) => leader(y) - leader(x) || y.hp - x.hp || (x.id < y.id ? -1 : 1))[0];
    if (kill) return { spell: 'bolt', targetId: kill.id };
  }
  if (can.includes('mend')) {
    const heal = (MAGIC.mendHeal + power) * hpScaleOf(state);
    const hurt = own.filter((u) => u.maxHp - u.hp >= heal).sort((x, y) => leader(y) - leader(x) || x.hp - y.hp || (x.id < y.id ? -1 : 1))[0];
    if (hurt) return { spell: 'mend', targetId: hurt.id };
  }
  if (can.includes('stoneskin') && b.round === 1 && me.status.damageReduction === 0) return { spell: 'stoneskin', targetId: me.id };
  if (can.includes('bolt') && manaOf(hero) >= SPELLS.bolt.mana + 2) {
    const t = enemies.slice().sort((x, y) => leader(y) - leader(x) || x.hp - y.hp || (x.id < y.id ? -1 : 1))[0];
    if (t) return { spell: 'bolt', targetId: t.id };
  }
  return null;
}
