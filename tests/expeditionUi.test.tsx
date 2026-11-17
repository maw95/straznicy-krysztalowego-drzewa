// @vitest-environment jsdom
// The end of an Expedition battle: a win offers three relics and goes on to the next stage with the one chosen; a loss ends the run and fills the profile.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expeditionSetup, newRun, STAGES } from '../src/engine/expedition';
import { createGame } from '../src/engine/game';
import { ExpeditionOver } from '../src/ui/ExpeditionScreen';
import { readProfile, readRun, saveRun } from '../src/ui/expeditionRun';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const over = (cleared: number, winner: 'dawn' | 'horde', daily?: string) => ({ ...createGame(expeditionSetup({ ...newRun(11, 'goldDragon', daily), cleared })), phase: 'over' as const, winner });

describe('ExpeditionOver', () => {
  it('after a win offers three relics and starts the next stage with the chosen one', () => {
    const onStart = vi.fn();
    const run = { ...newRun(11, 'goldDragon'), cleared: 1 };
    saveRun(run);
    const { container } = render(<ExpeditionOver state={over(1, 'dawn')} onStart={onStart} onMenu={() => undefined} />);
    expect(container.querySelectorAll('[data-relic]')).toHaveLength(3);
    const next = container.querySelector('[data-expedition-next]') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    const relic = (container.querySelector('[data-relic]') as HTMLElement);
    fireEvent.click(relic);
    fireEvent.click(next);
    const setup = onStart.mock.calls[0][0];
    expect(setup.expedition).toMatchObject({ stage: 2, relics: [relic.getAttribute('data-relic')] });
    expect(readRun()).toMatchObject({ cleared: 2 });
  });

  it('after a loss ends the run once and records it in the profile', () => {
    saveRun({ ...newRun(11, 'goldDragon'), cleared: 3 });
    render(<ExpeditionOver state={over(3, 'horde')} onStart={() => undefined} onMenu={() => undefined} />);
    expect(readRun()).toBeNull();
    expect(readProfile()).toMatchObject({ runs: 1, finished: 0, bestCleared: 3 });
  });

  it('after the last stage is won, the run is complete', () => {
    saveRun({ ...newRun(11, 'goldDragon', '2026-11-17'), cleared: STAGES - 1 });
    const { container } = render(<ExpeditionOver state={over(STAGES - 1, 'dawn', '2026-11-17')} onStart={() => undefined} onMenu={() => undefined} />);
    expect(container.querySelector('[data-expedition-over="complete"]')).not.toBeNull();
    expect(readProfile()).toMatchObject({ runs: 1, finished: 1, bestCleared: STAGES, daily: { '2026-11-17': STAGES } });
  });
});
