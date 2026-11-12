import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sfxFiles } from '../src/ui/sfx';

describe('sound variants', () => {
  it('every blow variant has its file', () => {
    const files = sfxFiles('sword_hit');
    expect(files.length).toBeGreaterThan(1);
    for (const f of files) expect(existsSync(`public/assets/dzwieki/${f}.mp3`), f).toBe(true);
  });
});
