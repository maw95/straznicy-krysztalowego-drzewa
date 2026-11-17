// The English dictionary and the function that turns a Polish text of the game into English. The dictionary is keyed by the Polish text; a text with
// holes ("Kryształy {0}/{1}", from the template literals of the code) is a pattern: the holes are matched, translated themselves (a unit's name, say)
// and put into the English sentence. A text that is not in the dictionary stays Polish (scripts/i18n_extract.py --missing lists them).

export type Dict = Record<string, string>;

const exact = new Map<string, string>();
const patterns: Array<{ re: RegExp; to: string; weight: number }> = [];
/** Exact texts that hold numbers, keyed with the numbers taken out: the game scales its numbers ("+1 Ż" is "+5 Ż" on the big map), the sentence stays the same. */
const numeric = new Map<string, { en: string; count: number }>();
const digits = /\d+/g;
const key = (text: string): string => text.replace(/\s+/g, ' ').trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Adds entries to the dictionary (the files of src/i18n/en call it). */
export function register(dict: Dict): void {
  for (const [pl, en] of Object.entries(dict)) {
    const k = key(pl);
    if (!/\{\d+\}/.test(k)) {
      exact.set(k, en);
      const count = (k.match(digits) ?? []).length;
      if (count > 0 && (en.match(digits) ?? []).length === count) numeric.set(k.replace(digits, '#'), { en, count });
      continue;
    }
    const parts = k.split(/\{\d+\}/);
    const source = '^' + parts.map(escapeRe).join('(.*?)') + '$';
    patterns.push({ re: new RegExp(source, 's'), to: en, weight: parts.join('').length });
  }
  patterns.sort((a, b) => b.weight - a.weight);
}

const SEPARATORS = /( — | · | \/ |, |: |; | \(|\)| → | = )/;

function bySegments(core: string, depth: number): string | null {
  const parts = core.split(SEPARATORS);
  if (parts.length < 3) return null;
  let any = false;
  const out = parts.map((p, i) => {
    if (i % 2 === 1) return p;
    const t = translate(p, depth + 1);
    if (t === null) return p;
    any = true;
    return t;
  });
  return any ? out.join('') : null;
}

/** The English of a Polish text, or null when there is none. Whitespace around the text is kept. */
export function translate(text: string, depth = 0): string | null {
  if (!text || depth > 3) return null;
  const core = key(text);
  if (!core || !/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(core)) return null;
  let out = exact.get(core) ?? null;
  // The same sentence with other numbers.
  if (out === null && digits.test(core)) {
    digits.lastIndex = 0;
    const hit = numeric.get(core.replace(digits, '#'));
    if (hit) {
      const nums = core.match(digits) ?? [];
      let i = 0;
      if (nums.length === hit.count) out = hit.en.replace(digits, () => nums[i++]);
    }
  }
  digits.lastIndex = 0;
  // A list joined by " · ": when every part is known, they are translated one by one (a pattern must not swallow the whole list).
  if (out === null && core.includes(' · ')) {
    const parts = core.split(' · ').map((x) => translate(x, depth + 1));
    if (parts.every((x) => x !== null)) out = parts.join(' · ');
  }
  // A pattern whose holes are all understood wins; one with a hole left in Polish waits until the pieces of the text have been tried.
  let weak: string | null = null;
  if (out === null) {
    for (const p of patterns) {
      const m = p.re.exec(core);
      if (!m) continue;
      let unresolved = false;
      const filled = p.to.replace(/\{(\d+)\}/g, (_, i) => {
        const hole = m[Number(i) + 1] ?? '';
        const t = translate(hole, depth + 1);
        // A single capitalised word that is not in the dictionary is a proper name (a settlement), not Polish left over.
        if (t === null && /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(hole) && !/^[A-ZĄĆĘŁŃÓŚŹŻ][A-Za-ząćęłńóśźż'’-]+$/.test(hole.trim())) unresolved = true;
        return t ?? hole;
      });
      if (!unresolved) {
        out = filled;
        break;
      }
      weak ??= filled;
    }
  }
  // A list of known names ("Magiczny Pocisk, Leczenie"): every part is translated on its own.
  if (out === null && core.includes(', ')) {
    const parts = core.split(', ').map((p) => translate(p, depth + 1));
    if (parts.every((p) => p !== null)) out = parts.join(', ');
  }
  // Pieces joined by a separator ("Gracz 1 — Przymierze Świtu", "Wieża maga (do zbudowania)", "3 zł · 2× drewno"): each piece on its own.
  if (out === null) out = bySegments(core, depth);
  if (out === null) out = weak;
  if (out === null) return null;
  return text.slice(0, text.length - text.trimStart().length) + out + text.slice(text.trimEnd().length);
}

/** Number of entries (for tests). */
export const dictionarySize = (): number => exact.size + patterns.length;
