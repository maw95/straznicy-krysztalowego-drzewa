// Hero growth on the screen (digital ruleset, "Wyprawa"): the level and experience bar, the skills as cards with icons, the three
// gear slots, and the notices that tell the player what just happened (experience gained, an artifact found).

import { FACTION_NAMES, UNITS, type FactionId } from '../engine/data';
import { GROWTH, levelOf, SKILL_EFFECT, SKILL_NAMES, xpToNext, type SkillId } from '../engine/growth';
import { ARTIFACT_BY_ID, gearOf, type ArtifactDef, type Slot } from '../engine/sites';
import type { HeroState, LogEvent } from '../engine/types';
import { Medal } from './common';

/** Medal colour and glyph of each skill (the glyphs are in svgDefs.ts). */
export const SKILL_LOOK: Record<SkillId, readonly [string, string]> = {
  might: ['mRed', 'gSword'],
  vigor: ['mGreen', 'gHeartG'],
  swift: ['mBlue', 'gWing'],
  leader: ['mPurple', 'gFlag'],
  pathfinder: ['mBrown', 'gScroll'],
  fortune: ['mPurple', 'gStar'],
};

export const SLOT_NAMES: Record<Slot, string> = { weapon: 'Broń', armor: 'Zbroja', boots: 'Buty' };
const SLOT_GLYPH: Record<Slot, string> = { weapon: 'gSword', armor: 'gShield', boots: 'gBoot' };
const SLOT_FILL: Record<Slot, string> = { weapon: 'mRed', armor: 'mBlue', boots: 'mGreen' };
const SLOTS: Slot[] = ['weapon', 'armor', 'boots'];

/** The medal of an artifact: the colour of its slot, purple for the stronger tier. */
export function ArtifactMedal({ art, size = 40 }: { art: ArtifactDef; size?: number }) {
  return <Medal fill={art.tier === 2 ? 'mPurple' : SLOT_FILL[art.slot]} glyph={SLOT_GLYPH[art.slot]} size={size} />;
}

/** One skill as a card: a big medal, the name, what it does. A button when `onChoose` is given. */
export function SkillCard({ faction, skill, onChoose, width = 210 }: { faction: FactionId; skill: SkillId; onChoose?: (s: SkillId) => void; width?: number }) {
  const [fill, glyph] = SKILL_LOOK[skill];
  const body = (
    <>
      <div className="skill-card-art">
        <Medal fill={fill} glyph={glyph} size={92} />
      </div>
      <div className="skill-card-name">{SKILL_NAMES[faction][skill]}</div>
      <div className="skill-card-text">{SKILL_EFFECT[skill].text}</div>
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
      <div className="xpbar-level" aria-label={`Poziom ${level}`}>
        {level}
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
  const skills = hero.skills ?? [];
  const gear = gearOf(hero);
  return (
    <div className="well" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }} data-growth>
      <XpBar hero={hero} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }}>Umiejętności</span>
        {skills.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>jeszcze żadnej (pierwsza na poziomie 2)</span>}
        {skills.map((s) => (
          <span key={s} title={`${SKILL_NAMES[hero.faction][s]}: ${SKILL_EFFECT[s].text}`}>
            <Medal fill={SKILL_LOOK[s][0]} glyph={SKILL_LOOK[s][1]} size={34} />
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="lbl" style={{ width: 108, flex: 'none' }} title="Artefakty to stałe wyposażenie bohatera, po jednym na miejsce. Skarby to jednorazowe karty frakcji.">Artefakty</span>
        {SLOTS.map((slot) => {
          const art = gear.find((a) => a.slot === slot);
          return art ? (
            <span key={slot} title={`${SLOT_NAMES[slot]}: ${art.names[hero.faction]}. ${art.text}${art.tier === 2 ? ' (wyższy poziom)' : ''}`} data-gear={art.id}>
              <ArtifactMedal art={art} size={38} />
            </span>
          ) : (
            <span key={slot} className="gear-empty" title={`${SLOT_NAMES[slot]}: puste miejsce. Artefakty leżą w skrzyniach na mapie, wypadają ze strażników i z pokonanych bohaterów.`} data-gear-empty={slot}>
              <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="17" fill="none" stroke="#B88A35" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.7" />
                <g opacity="0.35" transform="translate(6 6) scale(0.7)">
                  <use href={`#${SLOT_GLYPH[slot]}`} />
                </g>
              </svg>
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
        <div className="skill-card-text">{art.text}</div>
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
