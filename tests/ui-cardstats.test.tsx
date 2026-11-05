// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '../src/ui/TreasureCard';
import { UnitCard } from '../src/ui/UnitCard';

describe('UnitCard in the digital edition', () => {
  const texts = (digital: boolean) => [...render(<UnitCard unitId="unicornKing" digital={digital} />).container.querySelectorAll('div')].map((d) => d.textContent);
  it('shows the digital speed of the Unicorn King (10), the printed card the board one (8)', () => {
    expect(texts(true)).toContain('10');
    expect(texts(false)).not.toContain('10');
    expect(texts(false)).toContain('8');
  });
});
