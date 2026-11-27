// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RoundTrack } from '../src/ui/RoundTrack';

const socket = (round: number, limit: number) => {
  const { container } = render(<RoundTrack round={round} limit={limit} ritual={0} ritualRounds={3} />);
  return container.querySelector('.track-crystal')?.getAttribute('data-socket');
};

describe('round track', () => {
  afterEach(cleanup);

  it('goes round again when the limit is longer than the track', () => {
    expect(socket(24, 30)).toBe('24');
    cleanup();
    expect(socket(25, 30)).toBe('1');
    cleanup();
    expect(socket(49, 72)).toBe('1');
  });
});
