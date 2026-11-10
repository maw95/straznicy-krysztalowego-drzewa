// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { activeHero, createGame } from '../src/engine/game';
import { awardXp, GROWTH } from '../src/engine/growth';
import { giveArtifact, ARTIFACT_BY_ID } from '../src/engine/sites';
import { ArtifactFound, HeroGrowth, SkillCard, XpBar } from '../src/ui/growthUi';
import { setup } from './helpers/engine';

const grown = () => createGame(setup({}, { ruleset: 'digital', heroGrowth: true }));

describe('hero growth: what the player is told', () => {
  it('a skill card shows its rank and, for a raise, says so', () => {
    const { container } = render(<SkillCard faction="dawn" skill="might" rank={2} raise />);
    expect(container.textContent).toContain('Moc Świtu II');
    expect(container.textContent).toContain('Rozwinięcie: stopień II');
    expect(container.textContent).toContain('+2 A');
    const fresh = render(<SkillCard faction="dawn" skill="might" />);
    expect(fresh.container.textContent).not.toContain('Rozwinięcie');
    expect(fresh.container.textContent).toContain('+1 A');
  });

  it('experience comes with the reason, as a log line and a structured event', () => {
    const s = grown();
    const h = activeHero(s)!;
    awardXp(s, h, 2, 'kapliczka');
    const entry = s.log.find((l) => l.event?.type === 'xp')!;
    expect(entry.text).toContain('+2 PD (kapliczka)');
    expect(entry.event).toEqual({ type: 'xp', heroId: h.id, amount: 2, reason: 'kapliczka' });
    // No reason (the Horde's experience at the end of a round): no line.
    h.offer = undefined;
    const before = s.log.length;
    awardXp(s, h, 1);
    expect(s.log.slice(before).filter((l) => l.event)).toHaveLength(0);
  });

  it('an artifact is announced with its source, and a worse one is told apart', () => {
    const s = grown();
    const h = activeHero(s)!;
    giveArtifact(s, h, ARTIFACT_BY_ID.blade1, 'skrzynia');
    expect(s.log[s.log.length - 1].event).toMatchObject({ type: 'artifact', artifactId: 'blade1', source: 'skrzynia', kept: true });
    giveArtifact(s, h, ARTIFACT_BY_ID.blade1, 'łup po pokonanym strażniku');
    expect(s.log[s.log.length - 1].event).toMatchObject({ type: 'artifact', source: 'łup po pokonanym strażniku', kept: false });
  });

  it('the experience bar shows the points, the level and what is missing', () => {
    const s = grown();
    const h = activeHero(s)!;
    awardXp(s, h, GROWTH.thresholds[0] + 1);
    h.offer = undefined;
    const { container } = render(<XpBar hero={h} />);
    expect(container.textContent).toContain(`Poziom 2 · PD ${GROWTH.thresholds[0] + 1} / ${GROWTH.thresholds[1]}`);
  });

  it('the hero panel lists the three gear slots, empty or filled, and the skills', () => {
    const s = grown();
    const h = activeHero(s)!;
    giveArtifact(s, h, ARTIFACT_BY_ID.mail1, 'skrzynia');
    const { container } = render(<HeroGrowth hero={h} />);
    expect(container.querySelector('[data-gear="mail1"]')).not.toBeNull();
    expect(container.querySelector('[data-gear-empty="weapon"]')).not.toBeNull();
    expect(container.querySelector('[data-gear-empty="boots"]')).not.toBeNull();
    expect(container.textContent).toContain('jeszcze żadnej');
  });

  it('skill cards and the artifact card carry names and effects', () => {
    const card = render(<SkillCard faction="dawn" skill="vigor" onChoose={() => {}} />).container;
    expect(card.textContent).toContain('Hart Gaju');
    expect(card.textContent).toContain('+2 Ż');
    const found = render(<ArtifactFound faction="dawn" event={{ type: 'artifact', heroId: 'goldDragon', artifactId: 'boots2', source: 'skrzynia', kept: true }} />).container;
    expect(found.textContent).toContain('Skrzydlate Sandały');
    expect(found.textContent).toContain('skrzynia');
    expect(found.textContent).toContain('W odróżnieniu od skarbów');
  });
});
