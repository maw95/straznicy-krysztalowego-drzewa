// Hero growth on the screen (digital ruleset, "Wyprawa"): the level and experience bar, the skills as cards with icons, the five
// gear slots laid out like a hero's sheet (helmet on top, weapon - armour - shield, boots below), the hero sheet itself, and the notices that tell the player what just happened (experience gained, an artifact found).

import { useState } from 'react';
import { FACTION_NAMES, scaleText, UNITS, type FactionId } from '../engine/data';
import { GROWTH, levelOf, skillRank, skillText, SKILL_NAMES, xpToNext, type SkillId } from '../engine/growth';
import { makeBattleUnit, unitAttackBase, unitSpeed } from '../engine/battle';
import { applyHeroSkills, applyMilestones } from '../engine/growth';
import { applyGear, ARTIFACT_BY_ID, gearOf, packOf, passTargets, RARITY_NAMES, type ArtifactDef, type Slot } from '../engine/sites';
import type { Action, GameState, HeroState, LogEvent } from '../engine/types';
import { asset, Modal, Portrait, Ribbon, SIDE_RING } from './common';
import { RuleText, useScales } from './statScale';

/** The painted icon of a skill (public/assets/ikony/umiejetnosci, made with Scenario). */
export function SkillIcon({ skill, size = 40 }: { skill: SkillId; size?: number }) {
  return <img src={asset(`ikony/umiejetnosci/${skill}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
}

export const SLOT_NAMES: Record<Slot, string> = { helmet: 'Hełm', weapon: 'Broń', armor: 'Zbroja', shield: 'Tarcza', boots: 'Buty' };

/** The painted icon of an artifact (public/assets/ikony/artefakty); the rim tells the rarity: iron common, silver and sapphire rare, gold and purple legendary. */
export function ArtifactMedal({ art, size = 40 }: { art: ArtifactDef; size?: number }) {
  return <img className={`gear-medal r${art.rarity}`} src={asset(`ikony/artefakty/${art.id}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
}

const artTitle = (art: ArtifactDef, scale: [number, number]) => `${SLOT_NAMES[art.slot]}: ${art.name} (${RARITY_NAMES[art.rarity]}). ${scaleText(art.text, scale[0], scale[1])}`;

/** The five gear slots laid out like a hero's sheet: the helmet on top, weapon - armour - shield in the middle, the boots below. */
export function GearDoll({ hero, size = 40, picked, onPick }: { hero: HeroState; size?: number; picked?: string | null; onPick?: (art: ArtifactDef) => void }) {
  const scale = useScales();
  const gear = gearOf(hero);
  const cell = (slot: Slot, col: number, row: number) => {
    const art = gear.find((a) => a.slot === slot);
    return art ? (
      <span key={slot} className={`gear-slot ${picked === art.id ? 'picked' : ''} ${onPick ? 'pickable' : ''}`} style={{ gridColumn: col, gridRow: row }} title={artTitle(art, scale)} data-gear={art.id} onClick={onPick ? () => onPick(art) : undefined}>
        <ArtifactMedal art={art} size={size} />
      </span>
    ) : (
      <span key={slot} className="gear-slot gear-empty" style={{ gridColumn: col, gridRow: row }} title={`${SLOT_NAMES[slot]}: puste miejsce. Artefakty leżą w skrzyniach na mapie, wypadają ze strażników i przechodzą na zwycięzcę walki bohaterów.`} data-gear-empty={slot}>
        <img src={asset(`ikony/sloty/${slot}.webp`)} alt="" width={size} height={size} style={{ display: 'block', opacity: 0.9 }} />
      </span>
    );
  };
  return (
    <div className="gear-doll" style={{ gridTemplateColumns: `repeat(3, ${size}px)`, gridTemplateRows: `repeat(3, ${size}px)` }} data-gear-doll>
      {cell('helmet', 2, 1)}
      {cell('weapon', 1, 2)}
      {cell('armor', 2, 2)}
      {cell('shield', 3, 2)}
      {cell('boots', 2, 3)}
    </div>
  );
}

const ROMAN = ['', 'I', 'II', 'III'];

/** One skill as a card: a big medal, the name (with its rank), what it does. A button when `onChoose` is given. */
export function SkillCard({ faction, skill, rank = 1, raise = false, onChoose, width = 210 }: { faction: FactionId; skill: SkillId; rank?: number; raise?: boolean; onChoose?: (s: SkillId) => void; width?: number }) {
  const body = (
    <>
      <div className="skill-card-art">
        <SkillIcon skill={skill} size={104} />
      </div>
      <div className="skill-card-name">{SKILL_NAMES[faction][skill]} {ROMAN[rank]}</div>
      {raise && <div className="skill-card-raise">Rozwinięcie: stopień {ROMAN[rank]}</div>}
      <div className="skill-card-text"><RuleText text={skillText(skill, rank)} /></div>
      {onChoose && <div className="skill-card-pick">Wybierz</div>}
    </>
  );
  return onChoose ? (
    <button className="skill-card" data-skill={skill} style={{ width }} onClick={() => onChoose(skill)}>
      {body}
    </button>
  ) : (
    <div className="skill-card" style={{ width }}>
      {body}
    </div>
  );
}

/** Level badge and the experience bar: how many points the hero has, how many the next level needs. */
export function XpBar({ hero }: { hero: HeroState }) {
  const level = levelOf(hero);
  const next = xpToNext(hero);
  const xp = hero.xp ?? 0;
  // The bar shows the progress inside the current level, so a point gained is always visible.
  const from = level > 1 ? levelStart(level) : 0;
  const pct = next === null ? 1 : Math.max(0, Math.min(1, (xp - from) / (next - from)));
  return (
    <div className="xpbar" title={next === null ? 'Najwyższy poziom.' : `Do poziomu ${level + 1} brakuje ${Math.max(0, next - xp)} PD. PD dają bitwy, skarby i kapliczki.`}>
      {/* A shield that grows richer with the level: plain iron, bronze, silver, gold with sapphires, winged gold with crystals. */}
      <div className={`xpbar-level lvl${Math.min(level, 5)}`} aria-label={`Poziom ${level}`}>
        <img src={asset(`ikony/poziom/${Math.min(Math.max(level, 1), 5)}.webp`)} alt="" width={56} height={56} />
        <span>{level}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="xpbar-track">
          <div className="xpbar-fill" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="xpbar-text">
          {next === null ? `Poziom ${level} (maksymalny) · ${xp} PD` : `Poziom ${level} · PD ${xp} / ${next} · do następnego ${Math.max(0, next - xp)}`}
        </div>
      </div>
    </div>
  );
}

/** Experience at which a level starts (the thresholds are cumulative). */
const levelStart = (level: number) => (level <= 1 ? 0 : GROWTH.thresholds[level - 2] ?? 0);

/** The hero's skills (icons) and the gear slots (filled or empty), with a hover text for each; a click on the gear opens the hero's sheet. */
export function HeroGrowth({ hero, state, onAction }: { hero: HeroState; state?: GameState; onAction?: (a: Action) => void }) {
  const scale = useScales();
  const [sheet, setSheet] = useState(false);
  const skills = [...new Set(hero.skills ?? [])];
  return (
    <div className="well" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }} data-growth>
      <XpBar hero={hero} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }}>Umiejętności</span>
        {skills.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>jeszcze żadnej (pierwsza na poziomie 2)</span>}
        {skills.map((s) => (
          <span key={s} title={`${SKILL_NAMES[hero.faction][s]} ${ROMAN[skillRank(hero, s)]}: ${scaleText(skillText(s, skillRank(hero, s)), scale[0], scale[1])}`} style={{ position: 'relative' }}>
            <SkillIcon skill={s} size={36} />
            {skillRank(hero, s) > 1 && <span className="skill-rank">{ROMAN[skillRank(hero, s)]}</span>}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 104, flex: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="lbl" title="Artefakty to stałe wyposażenie bohatera, po jednym na miejsce. Skarby to jednorazowe karty frakcji.">Artefakty</span>
          <button className="btn plate parch" style={{ padding: '3px 8px', fontSize: 14 }} onClick={() => setSheet(true)} data-hero-sheet-open>Karta bohatera</button>
        </div>
        <button className="btn btn-bare" onClick={() => setSheet(true)} title="Karta bohatera: wyposażenie, umiejętności i liczby w bitwie" style={{ padding: 0 }}>
          <GearDoll hero={hero} size={40} />
        </button>
        {(hero.pack?.length ?? 0) > 0 && <span className="pack-count" title={`W plecaku: ${packOf(hero).map((a) => a.name).join(', ')}`} data-pack-count>plecak {hero.pack!.length}</span>}
      </div>
      <Modal open={sheet} onClose={() => setSheet(false)}>
        {sheet && <HeroSheet hero={hero} state={state} onAction={onAction} onClose={() => setSheet(false)} />}
      </Modal>
    </div>
  );
}

/** The hero's sheet: portrait, level, the numbers it enters a battle with, the gear on a figure-like layout, and what every artifact and skill does. */
export function HeroSheet({ hero, state, onAction, onClose }: { hero: HeroState; state?: GameState; onAction?: (a: Action) => void; onClose: () => void }) {
  const scale = useScales();
  // The artifact the player has clicked (worn or in the backpack): the buttons below act on it. Only with `onAction` (the hero's own turn).
  const [pickedId, setPicked] = useState<string | null>(null);
  const pack = packOf(hero);
  const picked = pickedId ? [...gearOf(hero), ...pack].find((a) => a.id === pickedId) ?? null : null;
  const pickedWorn = Boolean(picked && hero.gear?.[picked.slot] === picked.id);
  const allies = state && onAction ? passTargets(state, hero) : [];
  const act = (a: Action) => {
    onAction?.(a);
    setPicked(null);
  };
  // The hero's unit as a battle would make it: card numbers plus skills, milestones and gear.
  const plain = makeBattleUnit(hero.id, hero.faction, true, scale[0], scale[1]);
  const unit = makeBattleUnit(hero.id, hero.faction, true, scale[0], scale[1]);
  applyHeroSkills(hero, unit);
  applyMilestones(hero, unit);
  applyGear(hero, unit);
  const stat = (label: string, now: number, base: number) => (
    <div className="sheet-stat" title={now === base ? undefined : `Karta: ${base}, z umiejętnościami i artefaktami: ${now}`}>
      <span>{label}</span>
      <b style={{ color: now > base ? '#2E7A32' : now < base ? '#A03020' : undefined }}>{now}</b>
    </div>
  );
  const gear = gearOf(hero);
  const skills = [...new Set(hero.skills ?? [])];
  return (
    <div className="hero-sheet" data-hero-sheet>
      <Ribbon side={hero.faction} style={{ width: 'min(420px, 88vw)', alignSelf: 'center' }}>{UNITS[hero.id].name}</Ribbon>
      <div className="hero-sheet-body">
        <div className="hero-sheet-col" style={{ alignItems: 'center' }}>
          <Portrait unitId={hero.id} size={112} ring={SIDE_RING[hero.faction]} preview={false} />
          <div style={{ fontSize: 15, color: '#6B4A22' }}>{FACTION_NAMES[hero.faction]}</div>
          <div className="sheet-stats">
            {stat('Życie', unit.maxHp, plain.maxHp)}
            {stat('Atak', unitAttackBase(unit), unitAttackBase(plain))}
            {stat('Szybkość', unitSpeed(unit), unitSpeed(plain))}
            {unit.gear?.defense ? stat('Obrona', unit.gear.defense, 0) : null}
          </div>
        </div>
        <div className="hero-sheet-col" style={{ alignItems: 'center' }}>
          <div className="lbl" style={{ color: '#6B4A22' }}>Wyposażenie</div>
          <div className="hero-sheet-doll">
            <GearDoll hero={hero} size={68} picked={pickedId} onPick={onAction ? (a) => setPicked(pickedId === a.id ? null : a.id) : undefined} />
          </div>
          <div className="lbl" style={{ color: '#6B4A22' }}>Plecak ({pack.length})</div>
          <div className="pack-row" data-pack>
            {(pack.length ? pack : [undefined]).map((a, i) => {
              return a ? (
                <span key={i} className={`gear-slot ${pickedId === a.id ? 'picked' : ''} ${onAction ? 'pickable' : ''}`} title={artTitle(a, scale)} data-pack-item={a.id} onClick={onAction ? () => setPicked(pickedId === a.id ? null : a.id) : undefined}>
                  <ArtifactMedal art={a} size={46} />
                </span>
              ) : (
                <span key={i} className="pack-empty" />
              );
            })}
          </div>
          {picked && onAction ? (
            <div className="sheet-actions" data-sheet-actions>
              <b>{picked.name}</b>
              {pickedWorn ? (
                <button className="btn plate parch" onClick={() => act({ type: 'unequipArtifact', slot: picked.slot })} data-unequip>Zdejmij do plecaka</button>
              ) : (
                <button className="btn plate parch" onClick={() => act({ type: 'equipArtifact', artifactId: picked.id })} data-equip>Załóż{hero.gear?.[picked.slot] ? ` (zamiast: ${ARTIFACT_BY_ID[hero.gear[picked.slot]!]?.name})` : ''}</button>
              )}
              {allies.map((h) => (
                <button key={h.id} className="btn plate parch" onClick={() => act({ type: 'passArtifact', artifactId: picked.id, toHeroId: h.id })} data-pass={h.id}>Przekaż: {UNITS[h.id].name}</button>
              ))}
              {allies.length === 0 && <span style={{ fontSize: 13, color: '#6B4A22' }}>Przekazać artefakt można sojusznikowi na sąsiednim polu.</span>}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6B4A22', maxWidth: 250, textAlign: 'center', lineHeight: 1.3 }}>
              Po jednym artefakcie na miejsce; rzadszy sam zastępuje pospolitszy, reszta trafia do plecaka.{onAction ? ' Kliknij artefakt, żeby go założyć, zdjąć albo przekazać sojusznikowi obok.' : ''}
            </div>
          )}
        </div>
        <div className="hero-sheet-col" style={{ flex: 1, minWidth: 220 }}>
          <div className="lbl" style={{ color: '#6B4A22' }}>Artefakty</div>
          {gear.length === 0 && <div style={{ fontSize: 15, color: '#6B4A22' }}>Jeszcze żadnego. Leżą w skrzyniach, wypadają ze strażników i przechodzą na zwycięzcę walki bohaterów.</div>}
          {gear.map((a) => (
            <div key={a.id} className="sheet-line">
              <ArtifactMedal art={a} size={38} />
              <div>
                <b>{a.name}</b> <span className={`rarity r${a.rarity}`}>{RARITY_NAMES[a.rarity]}</span>
                <div><RuleText text={a.text} /></div>
              </div>
            </div>
          ))}
          <div className="lbl" style={{ color: '#6B4A22', marginTop: 6 }}>Umiejętności</div>
          {skills.length === 0 && <div style={{ fontSize: 15, color: '#6B4A22' }}>Pierwsza na poziomie 2.</div>}
          {skills.map((s) => (
            <div key={s} className="sheet-line">
              <SkillIcon skill={s} size={38} />
              <div>
                <b>{SKILL_NAMES[hero.faction][s]} {ROMAN[skillRank(hero, s)]}</b>
                <div><RuleText text={skillText(s, skillRank(hero, s))} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }}><XpBar hero={hero} /></div>
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Zamknij</button>
    </div>
  );
}

/** What the screen tells the player about an event: one line (experience) or the artifact card (below). */
export function xpNote(ev: Extract<LogEvent, { type: 'xp' }>): string {
  return `${UNITS[ev.heroId].name}: +${ev.amount} PD (${ev.reason})`;
}

/** The dialog shown when a hero finds an artifact: what it is, where it came from, how it differs from treasures. */
export function ArtifactFound({ event, faction }: { event: Extract<LogEvent, { type: 'artifact' }>; faction: FactionId }) {
  const art = ARTIFACT_BY_ID[event.artifactId];
  if (!art) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 'min(460px, 92vw)', textAlign: 'center' }}>
      <div className="skill-card" style={{ width: 240, cursor: 'default' }}>
        <div className="skill-card-art">
          <ArtifactMedal art={art} size={100} />
        </div>
        <div className="skill-card-name">{art.name}</div>
        <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A5A2E' }}>
          Artefakt · {SLOT_NAMES[art.slot]} · <span className={`rarity r${art.rarity}`}>{RARITY_NAMES[art.rarity]}</span>
        </div>
        <div className="skill-card-text"><RuleText text={art.text} /></div>
      </div>
      <div style={{ fontSize: 18 }}>
        <b>{UNITS[event.heroId].name}</b> — {event.source}.
      </div>
      <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.35 }}>
        {event.kept
          ? event.packed
            ? `Bohater nosi już na tym miejscu coś równie dobrego albo lepszego, więc artefakt trafił do plecaka. W karcie bohatera można go założyć albo przekazać sojusznikowi stojącemu obok.`
            : 'Artefakt zakłada się na stałe, po jednym na miejsce (hełm, broń, zbroja, tarcza, buty). Widać go pod portretem bohatera i na karcie bohatera. W odróżnieniu od skarbów nie zużywa się i należy do jednego bohatera, nie do całej frakcji; kto pokona bohatera, zabiera mu artefakty.'
          : `Bohater ma już lepszy artefakt na tym miejscu i pełny plecak, więc w zamian ${FACTION_NAMES[faction]} dostaje kartę skarbu.`}
      </div>
    </div>
  );
}
