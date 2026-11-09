import { afterEach, describe, expect, it, vi } from 'vitest';
import { animationWait, beginHold, endHold, holdFor, resetAnimLock } from '../src/ui/animLock';

describe('animation lock (machine players wait for what the screen shows)', () => {
  afterEach(() => {
    resetAnimLock();
    vi.useRealTimers();
  });

  it('is free until something holds it, then counts down', () => {
    vi.useFakeTimers();
    expect(animationWait()).toBe(0);
    holdFor(1000);
    expect(animationWait()).toBe(1000);
    vi.advanceTimersByTime(400);
    expect(animationWait()).toBe(600);
    holdFor(100);
    expect(animationWait()).toBe(600);
    vi.advanceTimersByTime(700);
    expect(animationWait()).toBe(0);
  });

  it('a hold blocks for as long as it lasts, and a pause follows it', () => {
    vi.useFakeTimers();
    beginHold();
    expect(animationWait()).toBeGreaterThan(0);
    vi.advanceTimersByTime(5000);
    expect(animationWait()).toBeGreaterThan(0);
    endHold(700);
    expect(animationWait()).toBe(700);
    endHold();
    expect(animationWait()).toBe(700);
  });
});
