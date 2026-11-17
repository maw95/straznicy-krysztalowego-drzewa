// @vitest-environment jsdom
// Every line of CHANGELOG.md has an English text in the dictionary (the windows "Historia zmian" and "Nowa wersja" show the lines as parsed).

import { describe, expect, it } from 'vitest';
import changelog from '../CHANGELOG.md?raw';
import '../src/i18n/en';
import { longDate, parseChangelog } from '../src/ui/ChangelogDialog';
import { translate } from '../src/i18n/translate';

describe('English changelog', () => {
  it('translates every entry of version 2.0.0 and newer, and of the section in preparation', () => {
    const missing: string[] = [];
    for (const r of parseChangelog(changelog)) {
      if (r.version && r.version.split('.')[0] < '2') continue;
      for (const c of r.changes) {
        const en = translate(c);
        if (en === null || /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(en.replace(/Woźniak|Szestowicka/g, ''))) missing.push(c.slice(0, 80));
      }
    }
    expect(missing).toEqual([]);
  });

  it('writes dates with English month names', () => {
    expect(longDate('2026-11-17', 'en')).toBe('November 17, 2026');
    expect(longDate('2026-11-17')).toBe('17 listopada 2026');
  });
});
