import { describe, expect, it } from 'vitest';
import { roundWarning, roundWarningSound } from '../src/ui/roundWarning';

describe('round limit warning', () => {
  it('starts when three rounds are left, the current one included', () => {
    expect(roundWarning(9, 12)).toBeNull();
    expect(roundWarning(10, 12)).toMatchObject({ level: 'soon', text: 'Zostały 3 rundy' });
    expect(roundWarning(11, 12)).toMatchObject({ level: 'soon', text: 'Zostały 2 rundy' });
    expect(roundWarning(12, 12)).toMatchObject({ level: 'last', text: 'Ostatnia runda!' });
  });

  it('sounds with three rounds left and in the last one only', () => {
    expect([9, 10, 11, 12].map((r) => roundWarningSound(r, 12))).toEqual([null, 'clans_stun', null, 'defeat']);
  });
});
