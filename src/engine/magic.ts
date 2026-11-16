// Level 5 "Królestwo" (rule `realm`): magic. Heroes have mana, learn spells in the mage tower of a settlement (building `magic`) and cast them
// in a battle (the hero's unit, once per activation, on top of its move and attack) or on the map (in the hero's turn). Every number is provisional.
// Spells are the same for both factions; the sage commanders are the better casters. Design: docs/ZASADY_CYFROWE.md ("Poziom 5", "Magia").

import { UNITS, type FactionId } from './data';
import { battleFx, cellsOf, dealDamage, hpScaleOf, livingUnits, scaleOf } from './battle';
import { distance, parseKey } from './hex';
import { levelOf } from './growth';
import { log } from './log';
import { revealAround } from './map';
import type { BattleUnit, GameState, HeroState } from './types';
import { specialtyOf, typeMana } from './heroTypes';

export type SpellId = 'bolt' | 'mend' | 'slow' | 'stoneskin' | 'fireball' | 'haste' | 'vision' | 'portal';

export interface SpellDef {
  id: SpellId;
  name: string;
  /** Circle I spells are in every mage tower, circle II in an upgraded one. */
  circle: 1 | 2;
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
  price: [{ gold: 3 }, { gold: 5, dust: 1 }],
  boltDamage: 3,
  mendHeal: 4,
  slowSpeed: 2,
  stoneskin: 1,
  fireballDamage: 2,
  visionRadius: 3,
};

export const SPELLS: Record<SpellId, SpellDef> = {
  bolt: { id: 'bolt', name: 'Magiczny Pocisk', circle: 1, mana: 2, where: 'battle', target: 'enemy', text: `Wybrany wróg, gdziekolwiek stoi, dostaje ${MAGIC.boltDamage} punktów obrażeń.` },
  mend: { id: 'mend', name: 'Leczenie', circle: 1, mana: 2, where: 'battle', target: 'ally', text: `Wybrany sojusznik odzyskuje ${MAGIC.mendHeal} Ż, do maksimum.` },
  slow: { id: 'slow', name: 'Spowolnienie', circle: 1, mana: 1, where: 'battle', target: 'enemy', text: `Wybrany wróg ma −${MAGIC.slowSpeed} S w swojej następnej aktywacji.` },
  vision: { id: 'vision', name: 'Wizja', circle: 1, mana: 2, where: 'map', target: 'none', text: `Na mapie: odkrywa pola w promieniu ${MAGIC.visionRadius} od bohatera.` },
  stoneskin: { id: 'stoneskin', name: 'Kamienna Skóra', circle: 2, mana: 2, where: 'battle', target: 'ally', text: `Do końca bitwy każdy cios w wybranego sojusznika zadaje o ${MAGIC.stoneskin} mniej obrażeń (ale co najmniej 1).` },
  fireball: { id: 'fireball', name: 'Kula Ognia', circle: 2, mana: 3, where: 'battle', target: 'enemy', text: `Wybrany wróg i wszyscy stojący obok niego (także twoi) dostają po ${MAGIC.fireballDamage} punktów obrażeń.` },
  haste: { id: 'haste', name: 'Zryw', circle: 2, mana: 3, where: 'battle', target: 'ally', text: 'Wybrany sojusznik (nie sam bohater) dostaje zaraz dodatkową aktywację.' },
  portal: { id: 'portal', name: 'Wrota', circle: 2, mana: 4, where: 'map', target: 'none', text: 'Na mapie: przenosi bohatera do najbliższej własnej osady. Kończy jego ruch w tej turze.' },
};
export const SPELL_IDS = Object.keys(SPELLS) as SpellId[];
/** The spells a main hero knows from the start of a level 5 game (a commander learns in a tower). */
export const START_SPELLS: SpellId[] = ['bolt'];

/** The commanders of the sage archetype are born casters (in level 5 every sage-type hero also gains mana with its levels, heroTypes.ts). */
const isSage = (heroId: string) => heroId === 'dawnSage' || heroId === 'hordeShadow';

export const maxMana = (hero: HeroState): number => MAGIC.manaBase + MAGIC.manaPerLevel * levelOf(hero) + (isSage(hero.id) ? MAGIC.sageMana : 0) + typeMana(hero);
export const manaOf = (hero: HeroState): number => hero.mana ?? maxMana(hero);
/** Extra damage and healing of the hero's spells. */
export const spellPower = (hero: HeroState): number => Math.floor(levelOf(hero) / MAGIC.powerLevels) + (hero.kind === 'sage' || isSage(hero.id) ? 1 : 0) + (specialtyOf(hero)?.spellPower ?? 0);

/** The spells a mage tower of this level teaches. */
export const towerSpells = (level: number): SpellId[] => SPELL_IDS.filter((id) => SPELLS[id].circle <= level);

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
  if (def.target === 'ally') return livingUnits(b, caster.side).filter((u) => u.pos && (spell !== 'haste' || u.id !== caster.id) && (spell !== 'mend' || u.hp < u.maxHp));
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
  spend(state, hero, spell);
  const revealed = revealAround(state, hero.pos, MAGIC.visionRadius);
  log(state, 'ability', `${who} rzuca czar Wizja (odkryto ${revealed.length}).`, undefined, { type: 'fx', kind: 'mapa_wizja', hex: hero.pos });
}

/** Where Wrota would take the hero: the nearest settlement of its faction with no other hero on it (its base may hold several), not the hex it stands on. */
export function portalTarget(state: GameState, hero: HeroState): string | null {
  const k = state.kingdom;
  if (!k) return null;
  const f: FactionId = hero.faction;
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
