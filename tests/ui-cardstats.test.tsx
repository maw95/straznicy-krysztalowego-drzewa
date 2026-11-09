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

describe('UnitCard: shooters in the digital edition', () => {
  const attackShown = (digital: boolean) => [...render(<UnitCard unitId="elfDruid" digital={digital} />).container.querySelectorAll('div')].map((d) => d.textContent);
  it('shows the Elf Druid with Atak 2 (printed 1 plus the shooter bonus), the printed card with 1', () => {
    expect(attackShown(true)).toContain('2');
    expect(attackShown(false)).not.toContain('2');
  });
});
