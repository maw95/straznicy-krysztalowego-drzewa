// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillDialog } from '../src/ui/gameDialogs';
import type { HeroState } from '../src/engine/types';

describe('SkillDialog', () => {
  const hero: HeroState = { id: 'goldDragon', faction: 'dawn', playerId: 'p1', pos: '0,0', alive: true, crystals: [], level: 2, offer: ['might', 'vigor', 'swift'] };

  it('shows the three skills of the hero\'s faction and reports the one clicked', () => {
    const onChoose = vi.fn();
    const { container } = render(<SkillDialog hero={hero} onChoose={onChoose} />);
    const buttons = [...container.querySelectorAll('button[data-skill]')];
    expect(buttons.map((b) => b.getAttribute('data-skill'))).toEqual(['might', 'vigor', 'swift']);
    expect(container.textContent).toContain('Moc Świtu');
    fireEvent.click(buttons[1]);
    expect(onChoose).toHaveBeenCalledWith('vigor');
  });

  it('is closed without an offer', () => {
    const { container } = render(<SkillDialog hero={{ ...hero, offer: undefined }} onChoose={() => {}} />);
    expect(container.querySelectorAll('button[data-skill]')).toHaveLength(0);
  });
});
