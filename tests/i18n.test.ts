// @vitest-environment jsdom
// The language layer: the browser's language, the choice that is remembered, the English dictionary (exact texts, patterns with holes, lists of names).

import { afterEach, describe, expect, it } from 'vitest';
import '../src/i18n/en';
import { browserLang, getLang, setLang } from '../src/i18n/lang';
import { dictionarySize, translate } from '../src/i18n/translate';

afterEach(() => {
  setLang('pl');
  localStorage.clear();
});

describe('language of the browser', () => {
  it('is Polish for a Polish browser and English for every other', () => {
    expect(browserLang(['pl-PL', 'en'])).toBe('pl');
    expect(browserLang(['pl'])).toBe('pl');
    expect(browserLang(['en-GB', 'pl'])).toBe('en');
    expect(browserLang(['de-DE'])).toBe('en');
    expect(browserLang([])).toBe('en');
  });

  it('is remembered once the player chooses, and shown on the page', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(localStorage.getItem('skd-lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    setLang('pl');
    expect(document.documentElement.lang).toBe('pl');
  });
});

describe('English dictionary', () => {
  it('has a thousand and more entries', () => {
    expect(dictionarySize()).toBeGreaterThan(1000);
  });

  it('translates exact texts and keeps the whitespace around them', () => {
    expect(translate('Zamknij')).toBe('Close');
    expect(translate(' Zasady i karty\n')).toBe(' Rules and cards\n');
    expect(translate('Złoty Smok')).toBe('Golden Dragon');
  });

  it('fills the holes of a pattern and translates what fills them', () => {
    expect(translate('Runda bitwy 3.')).toBe('Battle round 3.');
    expect(translate('Wybierz pomocników do bitwy (5)')).toBe('Choose supports for the battle (5)');
    expect(translate('Złoty Smok odzyskuje 3 Ż (Blask Świtu).')).toBe('Golden Dragon regains 3 HP (Light of Dawn).');
  });

  it('translates a list of names part by part', () => {
    expect(translate('Magiczny Pocisk, Leczenie')).toBe('Magic Missile, Healing');
  });

  it('leaves a text it does not know alone', () => {
    expect(translate('Zupełnie nieznane zdanie, którego nie ma.')).toBeNull();
    expect(translate('123')).toBeNull();
    expect(translate('')).toBeNull();
  });
});

describe('composed texts', () => {
  it('are translated piece by piece when they are joined by a separator', () => {
    expect(translate('Gracz 1 — Przymierze Świtu')).toBe('Player 1 — Dawn Covenant');
    expect(translate('Wieża maga (do zbudowania)')).toBe('Mage Tower (to be built)');
    expect(translate('3 zł · 2× drewno')).toBe('3 gold · 2× wood');
  });
});
