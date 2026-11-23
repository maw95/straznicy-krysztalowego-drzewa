// @vitest-environment jsdom
// The treasure chest: icons six to a page, a pager when there are more, Esc and the seal close it.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChestFrame, TreasureSlot } from '../src/ui/TreasureButton';

afterEach(cleanup);

const slots = (n: number, use = vi.fn(), show = vi.fn()) =>
  Array.from({ length: n }, (_, i) => <TreasureSlot key={i} kind="horn" art="x.webp" name={`Skarb ${i + 1}`} usable={i % 2 === 0} use={use} onShowCard={show} />);

describe('ChestFrame', () => {
  it('shows six treasures per page and pages with the arrows', () => {
    const { container } = render(<ChestFrame label="Skarby" onClose={() => undefined} items={slots(8)} />);
    expect(container.querySelectorAll('[data-item-slot]')).toHaveLength(6);
    expect(container.querySelector('[data-pager-now]')?.textContent).toBe('1/2');
    fireEvent.click(container.querySelector('[aria-label="Następna strona"]')!);
    expect(container.querySelectorAll('[data-item-slot]')).toHaveLength(2);
    expect(container.querySelector('[data-pager-now]')?.textContent).toBe('2/2');
  });

  it('has no pager for six or fewer', () => {
    const { container } = render(<ChestFrame label="Skarby" onClose={() => undefined} items={slots(6)} />);
    expect(container.querySelector('[data-pager]')).toBeNull();
  });

  it('a left click uses a usable treasure and shows the card of an unusable one', () => {
    const use = vi.fn();
    const show = vi.fn();
    const { container } = render(<ChestFrame label="Skarby" onClose={() => undefined} items={slots(2, use, show)} />);
    const [first, second] = Array.from(container.querySelectorAll('[data-item-slot]'));
    fireEvent.click(first);
    fireEvent.click(second);
    expect(use).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
  });

  it('closes with the seal and with Esc', () => {
    const onClose = vi.fn();
    const { container } = render(<ChestFrame label="Skarby" onClose={onClose} items={[]} />);
    expect(container.textContent).toContain('Brak skarbów.');
    fireEvent.click(container.querySelector('.close-seal')!);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
