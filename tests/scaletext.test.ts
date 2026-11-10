import { describe, expect, it } from 'vitest';
import { scaleText, ITEMS, UNITS } from '../src/engine/data';

describe('scaleText', () => {
  it('multiplies Życie and Atak numbers only', () => {
    expect(scaleText('+2 A do ataku wykonanego po ruchu o co najmniej 4 pola.', 3)).toBe('+6 A do ataku wykonanego po ruchu o co najmniej 4 pola.');
    expect(scaleText('Raz na bitwę: przyjmuje cios i ignoruje 3 obrażenia.', 3)).toBe('Raz na bitwę: przyjmuje cios i ignoruje 9 obrażenia.');
    expect(scaleText('Raz na bitwę: trafiony wróg ma −2 S w swojej następnej aktywacji.', 3)).toContain('−2 S');
    expect(scaleText('+4 maks. Ż jednej jednostce do końca bitwy.', 3)).toBe('+12 maks. Ż jednej jednostce do końca bitwy.');
    expect(scaleText('−1 otrzymanych obrażeń z każdego ataku do końca bitwy.', 3)).toBe('−3 otrzymanych obrażeń z każdego ataku do końca bitwy.');
    expect(scaleText('Każdy cios w Cyklopa zadaje o 1 mniej obrażeń.', 3)).toBe('Każdy cios w Cyklopa zadaje o 3 mniej obrażeń.');
    expect(scaleText('Odkryj 3 wybrane zakryte pola.', 3)).toBe('Odkryj 3 wybrane zakryte pola.');
    expect(scaleText('Po ataku odskok do 3 pól.', 3)).toBe('Po ataku odskok do 3 pól.');
  });
  it('leaves the text alone at scale 1', () => {
    for (const t of [...Object.values(ITEMS).map((i) => i.text), ...Object.values(UNITS).map((u) => u.abilityText)]) expect(scaleText(t, 1)).toBe(t);
  });
});
