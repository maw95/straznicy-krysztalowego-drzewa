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

describe('proper names', () => {
  it('stay as they are inside a translated sentence', () => {
    expect(translate('Osada Rosogród (Przymierze Świtu): należy do Przymierze Świtu')).toBe('Settlement Rosogród (Dawn Covenant): belongs to Dawn Covenant');
  });
});

describe('scaled numbers and lists', () => {
  it('translates a sentence whose numbers the game scaled', () => {
    expect(translate('+5 Ż bohatera w bitwie. Na początku tury odkrywa pola w promieniu 2 od bohatera.')).toBe('+5 hero HP in battle. At the start of the turn it reveals hexes within 2 of the hero.');
    expect(translate('Na początku każdej rundy bitwy bohater odzyskuje 5 Ż.')).toBe('At the start of each battle round the hero regains 5 HP.');
  });

  it('translates a list joined by a dot part by part', () => {
    expect(translate('Centaur: stopień 3, 5 zł · Gargulec: stopień 4, 8 zł')).toBe('Centaur: tier 3, 5 gold · Gargoyle: tier 4, 8 gold');
  });
});

describe('the page', () => {
  it('is translated as it is drawn, follows the language both ways and notices changed text', async () => {
    const { installDomTranslator } = await import('../src/i18n/dom');
    const root = document.createElement('div');
    document.body.appendChild(root);
    installDomTranslator(root);
    const wait = () => new Promise((r) => setTimeout(r, 0));
    root.innerHTML = '<button title="Zamknij">Zasady</button><p>Zupełnie nieznane zdanie.</p>';
    await wait();
    expect(root.querySelector('button')!.textContent).toBe('Zasady');
    setLang('en');
    expect(root.querySelector('button')!.textContent).toBe('Rules');
    expect(root.querySelector('button')!.getAttribute('title')).toBe('Close');
    expect(root.querySelector('p')!.textContent).toBe('Zupełnie nieznane zdanie.');
    // New text drawn while English is on, and a text that changes (as React does when a number moves).
    const p = document.createElement('p');
    p.textContent = 'Opcje';
    root.appendChild(p);
    await wait();
    expect(p.textContent).toBe('Options');
    p.firstChild!.nodeValue = 'Zamknij';
    await wait();
    expect(p.textContent).toBe('Close');
    // Text inside translate="no" (the Polish manual) is left alone, also when it is drawn later.
    const keep = document.createElement('div');
    keep.setAttribute('translate', 'no');
    keep.innerHTML = '<p>Opcje</p>';
    root.appendChild(keep);
    await wait();
    expect(keep.textContent).toBe('Opcje');
    const late = document.createElement('p');
    late.textContent = 'Zamknij';
    keep.appendChild(late);
    await wait();
    expect(late.textContent).toBe('Zamknij');
    setLang('pl');
    expect(root.querySelector('button')!.textContent).toBe('Zasady');
    expect(root.querySelector('button')!.getAttribute('title')).toBe('Zamknij');
    expect(p.textContent).toBe('Zamknij');
  });

});
