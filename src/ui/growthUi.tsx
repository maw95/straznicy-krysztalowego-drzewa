// Hero growth on the screen (digital ruleset, "Wyprawa"): the level and experience bar, the skills as cards with icons, the five
// gear slots laid out like a hero's sheet (helmet on top, weapon - armour - shield, boots below), the hero sheet itself, and the notices that tell the player what just happened (experience gained, an artifact found).

import { useContext, useState } from 'react';
import { abilityTextFor, FACTION_NAMES, scaleText, UNITS, type FactionId } from '../engine/data';
import { GROWTH, levelOf, MILESTONE_LEVELS, milestoneText, skillRank, skillText, SKILL_NAMES, xpToNext, type SkillId } from '../engine/growth';
import { ARTIFACT_BY_ID, gearOf, packOf, passTargets, RARITY_NAMES, SETS, setCount, type ArtifactDef, type Slot } from '../engine/sites';
import type { Action, GameState, HeroState, LogEvent } from '../engine/types';
import { abilityArt, asset, Ribbon } from './common';
import { DigitalContext, RuleText, useScales } from './statScale';
import { UnitCard } from './UnitCard';

/** The painted icon of a skill (public/assets/ikony/umiejetnosci, made with Scenario). */
export function SkillIcon({ skill, size = 40 }: { skill: SkillId; size?: number }) {
  return <img src={asset(`ikony/umiejetnosci/${skill}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
}

export const SLOT_NAMES: Record<Slot, string> = { helmet: 'Hełm', weapon: 'Broń', armor: 'Zbroja', shield: 'Tarcza', boots: 'Buty' };

/** The painted icon of an artifact (public/assets/ikony/artefakty); the rim tells the rarity: iron common, silver and sapphire rare, gold and purple legendary. */
export function ArtifactMedal({ art, size = 40 }: { art: ArtifactDef; size?: number }) {
  return <img className={`gear-medal r${art.rarity}`} src={asset(`ikony/artefakty/${art.id}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
}

const SLOTS_ORDER: Slot[] = ['helmet', 'weapon', 'armor', 'shield', 'boots'];
const artTitle = (art: ArtifactDef, scale: [number, number]) => `${SLOT_NAMES[art.slot]}: ${art.name} (${RARITY_NAMES[art.rarity]}${art.set ? `, zestaw: ${SETS[art.set].name}` : ''}). ${scaleText(art.text, scale[0], scale[1])}${art.set ? ` ${SETS[art.set].bonusText}` : ''}`;

/** The five gear slots laid out like a hero's sheet: the helmet on top, weapon - armour - shield in the middle, the boots below. */
export function GearDoll({ hero, size = 40, picked, onPick, row = false }: { hero: HeroState; size?: number; picked?: string | null; onPick?: (art: ArtifactDef) => void; row?: boolean }) {
  const scale = useScales();
  const gear = gearOf(hero);
  const cell = (slot: Slot, col: number, rowNo: number) => {
    const art = gear.find((a) => a.slot === slot);
    return art ? (
      <span key={slot} className={`gear-slot ${picked === art.id ? 'picked' : ''} ${onPick ? 'pickable' : ''}`} style={row ? { gridColumn: SLOTS_ORDER.indexOf(slot) + 1, gridRow: 1 } : { gridColumn: col, gridRow: rowNo }} title={artTitle(art, scale)} data-gear={art.id} onClick={onPick ? () => onPick(art) : undefined}>
        <ArtifactMedal art={art} size={size} />
      </span>
    ) : (
      <span key={slot} className="gear-slot gear-empty" style={row ? { gridColumn: SLOTS_ORDER.indexOf(slot) + 1, gridRow: 1 } : { gridColumn: col, gridRow: rowNo }} title={`${SLOT_NAMES[slot]}: puste miejsce. Artefakty leżą w skrzyniach na mapie, wypadają ze strażników i przechodzą na zwycięzcę walki bohaterów.`} data-gear-empty={slot}>
        <img src={asset(`ikony/sloty/${slot}.webp`)} alt="" width={size} height={size} style={{ display: 'block', opacity: 0.9 }} />
      </span>
    );
  };
  // `row`: the five slots in one line (a low phone screen has no room for the figure).
  return (
    <div className="gear-doll" style={row ? { gridTemplateColumns: `repeat(5, ${size}px)`, gridTemplateRows: `${size}px` } : { gridTemplateColumns: `repeat(3, ${size}px)`, gridTemplateRows: `repeat(3, ${size}px)` }} data-gear-doll>
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
export function XpBar({ hero, short = false }: { hero: HeroState; short?: boolean }) {
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
          {next === null ? `Poziom ${level} (maksymalny) · ${xp} PD` : short ? `Poziom ${level} · PD ${xp} / ${next}` : `Poziom ${level} · PD ${xp} / ${next} · do następnego ${Math.max(0, next - xp)}`}
        </div>
      </div>
    </div>
  );
}

/** Experience at which a level starts (the thresholds are cumulative). */
const levelStart = (level: number) => (level <= 1 ? 0 : GROWTH.thresholds[level - 2] ?? 0);

/** A backpack drawn as a small icon (the button that opens the gear and backpack window). */
function BackpackIcon({ size = 40 }: { size?: number }) {
  return <img aria-hidden="true" src={asset('ui/menu/plecak.webp')} alt="" width={size} height={size} style={{ display: 'block' }} />;
}

/** The hero's level and experience, skills (icons) and gear slots (filled or empty) with a hover text each; the backpack icon opens the gear window. */
export function HeroGrowth({ hero, compact = false, onOpenPack }: { hero: HeroState; compact?: boolean; onOpenPack?: () => void }) {
  const scale = useScales();
  const skills = [...new Set(hero.skills ?? [])];
  const packCount = hero.pack?.length ?? 0;
  return (
    <div className="well" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }} data-growth>
      <XpBar hero={hero} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }}>Umiejętności</span>
        {skills.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>brak</span>}
        {skills.map((s) => (
          <span key={s} title={`${SKILL_NAMES[hero.faction][s]} ${ROMAN[skillRank(hero, s)]}: ${scaleText(skillText(s, skillRank(hero, s)), scale[0], scale[1])}`} style={{ position: 'relative' }}>
            <SkillIcon skill={s} size={36} />
            {skillRank(hero, s) > 1 && <span className="skill-rank">{ROMAN[skillRank(hero, s)]}</span>}
          </span>
        ))}
      </div>
      <span className="lbl" title="Artefakty to stałe wyposażenie bohatera, po jednym na miejsce. Skarby to jednorazowe karty frakcji.">Artefakty</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <GearDoll hero={hero} size={compact ? 26 : 40} row={compact} />
        <button className="btn btn-bare backpack-btn" onClick={onOpenPack} title="Wyposażenie i plecak" aria-label="Wyposażenie i plecak" data-hero-sheet-open style={{ position: 'relative' }}>
          <BackpackIcon size={compact ? 36 : 48} />
          {packCount > 0 && <span className="pack-count" data-pack-count title={`W plecaku: ${packOf(hero).map((a) => a.name).join(', ')}`} style={{ position: 'absolute', right: -6, top: -4 }}>{packCount}</span>}
        </button>
      </div>
    </div>
  );
}

/** The gear on a figure-like layout, the backpack, and the buttons for the clicked artifact (put on, take off, hand to an ally). Buttons only with `onAction` (the hero's own turn). */
export function GearPanel({ hero, state, onAction }: { hero: HeroState; state?: GameState; onAction?: (a: Action) => void }) {
  const scale = useScales();
  const [pickedId, setPicked] = useState<string | null>(null);
  const pack = packOf(hero);
  const picked = pickedId ? [...gearOf(hero), ...pack].find((a) => a.id === pickedId) ?? null : null;
  const pickedWorn = Boolean(picked && hero.gear?.[picked.slot] === picked.id);
  const allies = state && onAction ? passTargets(state, hero) : [];
  const act = (a: Action) => {
    onAction?.(a);
    setPicked(null);
  };
  return (
    <div className="hero-sheet-col" style={{ alignItems: 'center' }}>
      <div className="lbl" style={{ color: '#6B4A22' }}>Wyposażenie</div>
      <div className="hero-sheet-doll">
        <GearDoll hero={hero} size={68} picked={pickedId} onPick={onAction ? (a) => setPicked(pickedId === a.id ? null : a.id) : undefined} />
      </div>
      {Object.values(SETS).filter((d) => setCount(hero, d.id) > 0).map((d) => (
        <div key={d.id} data-set-progress={d.id} title={d.bonusText} style={{ fontSize: 14, color: setCount(hero, d.id) >= d.pieces.length ? '#2E7A32' : '#6B4A22', fontWeight: setCount(hero, d.id) >= d.pieces.length ? 700 : 400 }}>
          {setCount(hero, d.id)}/{d.pieces.length} zestawu: {d.name}
        </div>
      ))}
      <div className="lbl" style={{ color: '#6B4A22' }}>Plecak ({pack.length})</div>
      <div className="pack-row" data-pack>
        {(pack.length ? pack : [undefined]).map((a, i) =>
          a ? (
            <span key={i} className={`gear-slot ${pickedId === a.id ? 'picked' : ''} ${onAction ? 'pickable' : ''}`} title={artTitle(a, scale)} data-pack-item={a.id} onClick={onAction ? () => setPicked(pickedId === a.id ? null : a.id) : undefined}>
              <ArtifactMedal art={a} size={46} />
            </span>
          ) : (
            <span key={i} className="pack-empty" />
          ),
        )}
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
  );
}

/** The window the backpack icon opens: only the gear and the backpack. */
export function PackDialog({ hero, state, onAction, onClose }: { hero: HeroState; state?: GameState; onAction?: (a: Action) => void; onClose: () => void }) {
  return (
    <div className="hero-sheet" data-pack-dialog style={{ width: 'min(520px, 94vw)' }}>
      <Ribbon side={hero.faction} style={{ width: 'min(420px, 88vw)', alignSelf: 'center' }}>Wyposażenie i plecak</Ribbon>
      <GearPanel hero={hero} state={state} onAction={onAction} />
      <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20, alignSelf: 'center' }} onClick={onClose}>Zamknij</button>
    </div>
  );
}

/** The special ability and its three upgrades (levels 3, 6, 9): the icon (with a Roman numeral on the upgrades), the text, greyed out until the level is reached. */
function Milestones({ hero }: { hero: HeroState }) {
  const [k, hp] = useScales();
  const digital = useContext(DigitalContext);
  const def = UNITS[hero.id];
  const level = levelOf(hero);
  const steps = [
    { need: 1, tier: 0, label: 'Zdolność' },
    ...MILESTONE_LEVELS.map((need, i) => ({ need: need as number, tier: i + 1, label: ['II', 'III', 'IV'][i] })),
  ];
  return (
    <div data-milestones>
      <div className="lbl" style={{ color: '#6B4A22' }}>Kamienie milowe</div>
      <div className="milestones">
        {steps.map((st, i) => {
          const text = st.tier === 0 ? scaleText(abilityTextFor(hero.id, digital), k, hp) : milestoneText(hero.id, st.tier, k);
          const reached = level >= st.need;
          return (
            <div key={st.tier} className="milestones-item">
              {i > 0 && <span className="milestones-arrow" aria-hidden="true">→</span>}
              <div className={`milestone ${reached ? 'on' : 'off'}`} data-milestone={st.tier} data-reached={reached ? '1' : '0'}>
                <span className="milestone-icon">
                  <img src={asset(`cards/abilities/${abilityArt(def.ability)}_inner.png`)} alt="" width={44} height={44} />
                  {st.tier > 0 && <span className="milestone-num">{st.label}</span>}
                </span>
                <div className="milestone-text"><b>{st.tier === 0 ? def.abilityName : ''}</b> {text}</div>
                <div className="milestone-need">{st.tier === 0 ? 'Od początku' : `Wymagany poziom: ${st.need}`}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: '#6B4A22', lineHeight: 1.3 }}>Kamienie milowe to ulepszenia umiejętności specjalnej, które odblokowują się wraz z doświadczeniem bohatera.</div>
    </div>
  );
}

/** The hero's sheet: level and experience over the hero's card, the gear and backpack, the skills and the milestones of the special ability. */
export function HeroSheet({ hero, state, onAction, onClose }: { hero: HeroState; state?: GameState; onAction?: (a: Action) => void; onClose: () => void }) {
  const skills = [...new Set(hero.skills ?? [])];
  return (
    <div className="hero-sheet hero-sheet-wide" data-hero-sheet>
      <Ribbon side={hero.faction} style={{ width: 'min(420px, 88vw)', alignSelf: 'center' }}>{UNITS[hero.id].name}</Ribbon>
      <div className="hero-sheet-body">
        <div className="hero-sheet-col" style={{ alignItems: 'center' }}>
          <div style={{ width: 300, maxWidth: '86vw' }}><XpBar hero={hero} short /></div>
          <UnitCard unitId={hero.id} width={300} />
        </div>
        <GearPanel hero={hero} state={state} onAction={onAction} />
        <div className="hero-sheet-col" style={{ flex: 1, minWidth: 220, maxWidth: 300 }}>
          <div className="lbl" style={{ color: '#6B4A22' }}>Umiejętności</div>
          {skills.length === 0 && <div style={{ fontSize: 15, color: '#6B4A22' }}>brak</div>}
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
      <Milestones hero={hero} />
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
