// Hero growth on the screen (digital ruleset, "Wyprawa"): the level and experience bar, the skills as cards with icons, the three
// gear slots, and the notices that tell the player what just happened (experience gained, an artifact found).

import { useContext } from 'react';
import { FACTION_NAMES, scaleText, UNITS, type FactionId } from '../engine/data';
import { GROWTH, levelOf, skillRank, skillText, SKILL_NAMES, xpToNext, type SkillId } from '../engine/growth';
import { ARTIFACT_BY_ID, gearOf, type ArtifactDef, type Slot } from '../engine/sites';
import type { HeroState, LogEvent } from '../engine/types';
import { asset } from './common';
import { RuleText, StatScaleContext } from './statScale';

/** The painted icon of a skill (public/assets/ikony/umiejetnosci, made with Scenario). */
// The new skills borrow a neighbour's medal until their own are painted (Scenario, backlog 10.4).
const BORROWED_ICON: Partial<Record<SkillId, SkillId>> = { marksman: 'might', tactician: 'leader', scout: 'pathfinder', treasureHunter: 'fortune', scholar: 'vigor' };

export function SkillIcon({ skill, size = 40 }: { skill: SkillId; size?: number }) {
  return <img src={asset(`ikony/umiejetnosci/${BORROWED_ICON[skill] ?? skill}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
}

export const SLOT_NAMES: Record<Slot, string> = { weapon: 'Broń', armor: 'Zbroja', boots: 'Buty' };
const SLOTS: Slot[] = ['weapon', 'armor', 'boots'];

/** The painted icon of an artifact (public/assets/ikony/artefakty): bronze for the first tier, gold and purple for the second. */
export function ArtifactMedal({ art, size = 40 }: { art: ArtifactDef; size?: number }) {
  return <img src={asset(`ikony/artefakty/${art.id}.webp`)} alt="" width={size} height={size} style={{ flex: 'none', display: 'block' }} />;
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

/** The hero's skills (icons) and the three gear slots (filled or empty), with a hover text for each. */
export function HeroGrowth({ hero }: { hero: HeroState }) {
  const scale = useContext(StatScaleContext);
  const skills = [...new Set(hero.skills ?? [])];
  const gear = gearOf(hero);
  return (
    <div className="well" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }} data-growth>
      <XpBar hero={hero} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }}>Umiejętności</span>
        {skills.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>jeszcze żadnej (pierwsza na poziomie 2)</span>}
        {skills.map((s) => (
          <span key={s} title={`${SKILL_NAMES[hero.faction][s]} ${ROMAN[skillRank(hero, s)]}: ${scaleText(skillText(s, skillRank(hero, s)), scale)}`} style={{ position: 'relative' }}>
            <SkillIcon skill={s} size={36} />
            {skillRank(hero, s) > 1 && <span className="skill-rank">{ROMAN[skillRank(hero, s)]}</span>}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }} title="Artefakty to stałe wyposażenie bohatera, po jednym na miejsce. Skarby to jednorazowe karty frakcji.">Artefakty</span>
        {SLOTS.map((slot) => {
          const art = gear.find((a) => a.slot === slot);
          return art ? (
            <span key={slot} title={`${SLOT_NAMES[slot]}: ${art.names[hero.faction]}. ${scaleText(art.text, scale)}${art.tier === 2 ? ' (wyższy poziom)' : ''}`} data-gear={art.id}>
              <ArtifactMedal art={art} size={40} />
            </span>
          ) : (
            <span key={slot} className="gear-empty" title={`${SLOT_NAMES[slot]}: puste miejsce. Artefakty leżą w skrzyniach na mapie, wypadają ze strażników i z pokonanych bohaterów.`} data-gear-empty={slot}>
              <img src={asset(`ikony/sloty/${slot === 'weapon' ? 'weapon' : slot === 'armor' ? 'armor' : 'boots'}.webp`)} alt="" width={40} height={40} style={{ display: 'block', opacity: 0.9 }} />
            </span>
          );
        })}
      </div>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 'min(460px, 92vw)', textAlign: 'center' }}>
      <div className="skill-card" style={{ width: 240, cursor: 'default' }}>
        <div className="skill-card-art">
          <ArtifactMedal art={art} size={100} />
        </div>
        <div className="skill-card-name">{art.names[faction]}</div>
        <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A5A2E' }}>
          Artefakt · {SLOT_NAMES[art.slot]}
          {art.tier === 2 ? ' · wyższy poziom' : ''}
        </div>
        <div className="skill-card-text"><RuleText text={art.text} /></div>
      </div>
      <div style={{ fontSize: 18 }}>
        <b>{UNITS[event.heroId].name}</b> — {event.source}.
      </div>
      <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.35 }}>
        {event.kept
          ? 'Artefakt zakłada się na stałe, po jednym na miejsce (broń, zbroja, buty). Widać go pod portretem bohatera. W odróżnieniu od skarbów nie zużywa się i należy do jednego bohatera, nie do całej frakcji.'
          : `${FACTION_NAMES[faction]} ma już lepszy artefakt na tym miejscu, więc w zamian frakcja dostała kartę skarbu.`}
      </div>
    </div>
  );
}
