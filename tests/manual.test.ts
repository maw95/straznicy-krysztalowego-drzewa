import { describe, expect, it } from 'vitest';
import mdEn from '../src/content/instrukcja.en.md?raw';
import md from '../src/content/instrukcja.pl.md?raw';
import { brokenLinks, fold, highlightParts, parseManual, searchManual, slugify } from '../src/ui/manualDoc';

const doc = parseManual(md);

describe('manual: structure', () => {
  it('has chapters and parts with unique anchors', () => {
    expect(doc.entries.filter((e) => e.level === 2).length).toBeGreaterThanOrEqual(20);
    expect(doc.ids.size).toBe(doc.entries.length);
  });

  it('every link points at an existing place', () => {
    expect(brokenLinks(doc)).toEqual([]);
  });

  it('has no empty chapter (a chapter without text needs parts)', () => {
    for (const e of doc.entries.filter((x) => x.level === 2)) {
      const parts = doc.entries.filter((x) => x.level === 3 && x.chapter === e.id);
      expect(e.blocks.length + parts.length, e.title).toBeGreaterThan(0);
    }
  });

  it('covers every level of complexity and every goal and mode', () => {
    const all = fold(md);
    for (const w of ['spacer', 'przygoda', 'wyprawa', 'osada', 'ksiestwo', 'krolestwo', 'imperium', 'podboj', 'relikt', 'punkty kontrolne', 'przetrwanie', 'boss', 'artefakt', 'kampania', 'ekspedycja', 'online', 'kooperacja', 'rywalizacja', 'arena 6 na 6', 'wlasne ustawienia']) {
      expect(all, w).toContain(w);
    }
  });
});

describe('manual: slugs and folding', () => {
  it('drops Polish letters', () => {
    expect(slugify('Poziomy złożoności')).toBe('poziomy-zlozonosci');
    expect(fold('Źdźbło Ąę')).toBe('zdzblo ae');
  });
});

describe('manual: search', () => {
  it('finds by a word without diacritics and by a stem', () => {
    expect(searchManual(doc, 'kuznia')[0].entry.text).toMatch(/Kuźnia/);
    expect(searchManual(doc, 'kuźni').length).toBeGreaterThan(0);
  });

  it('puts the matching chapter first', () => {
    expect(searchManual(doc, 'fosa')[0].entry.title).toMatch(/Obrona|Osady/);
    expect(searchManual(doc, 'mana')[0].entry.chapter).toMatch(/magia|krolestwo|menu/);
    expect(searchManual(doc, 'rytual').length).toBeGreaterThan(0);
  });

  it('needs every word of the query', () => {
    const both = searchManual(doc, 'fosa katapulta').length;
    expect(both).toBeGreaterThan(0);
    expect(both).toBeLessThanOrEqual(searchManual(doc, 'fosa').length);
    expect(searchManual(doc, 'qqqzzz')).toEqual([]);
    expect(searchManual(doc, '   ')).toEqual([]);
  });

  it('finds the hidden keywords', () => {
    expect(searchManual(doc, 'hot-seat')[0].entry.chapter).toBe('tryby-gry');
  });

  it('marks matches keeping the original letters', () => {
    const parts = highlightParts('Kuźnia zbroi', 'kuznia');
    expect(parts[0]).toEqual({ v: 'Kuźnia', hit: true });
    expect(parts.map((p) => p.v).join('')).toBe('Kuźnia zbroi');
  });
});

describe('manual: English translation', () => {
  const en = parseManual(mdEn);

  it('has the same chapters and parts in the same order as the Polish one', () => {
    const shape = (d: typeof doc) => d.entries.map((e) => `${e.level}:${e.blocks.map((b) => b.t).join(',')}`);
    expect(shape(en)).toEqual(shape(doc));
  });

  it('has unique anchors, working links and keywords everywhere', () => {
    expect(en.ids.size).toBe(en.entries.length);
    expect(brokenLinks(en)).toEqual([]);
    expect(en.entries.filter((e) => e.level === 2 && !e.keywords.length)).toEqual([]);
  });

  it('keeps every number of the Polish text', () => {
    const nums = (m: string) => (m.replace(/@(słowa|words):.*/g, '').match(/\d+/g) ?? []).sort();
    expect(nums(mdEn)).toEqual(nums(md));
  });

  it('searches in English', () => {
    expect(searchManual(en, 'forge')[0].entry.text).toMatch(/Forge/);
    expect(searchManual(en, 'moat catapult').length).toBeGreaterThan(0);
    expect(searchManual(en, 'hot-seat')[0].entry.chapter).toBe('game-modes');
  });
});
