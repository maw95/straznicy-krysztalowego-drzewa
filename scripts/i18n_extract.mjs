// Extracts the Polish texts of src/ for the English dictionary (src/i18n/en/*.ts), with the TypeScript parser: string literals, template literals (each
// expression `${...}` becomes {0}, {1}...; the strings inside an expression are found on their own), and JSX text. Prints {text: file} as JSON;
// with --missing only what the dictionary lacks. Usage: node scripts/i18n_extract.mjs [--missing] > .tmp/i18n.json
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const POLISH = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const WORDY = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}/g;
const COMMON = new Set(['nie', 'jest', 'się', 'gracz', 'runda', 'bohater', 'koniec', 'wybierz', 'zasady', 'opcje', 'poziom', 'atak', 'ruch', 'osada', 'mana', 'czary', 'gra', 'cel', 'rundy', 'dla', 'lub', 'oraz', 'albo', 'tylko', 'jeden', 'dwa', 'wszystkie', 'zakończ', 'kliknij', 'zbuduj']);
const STOP = new Set(['do', 'na', 'ze', 'czy', 'przez', 'tak', 'nie', 'tura', 'turę', 'karty', 'wróć', 'zamknij', 'zapisz', 'wczytaj', 'usuń', 'dalej', 'wstecz', 'graj', 'nowa', 'start', 'gotowe', 'koniec', 'biorę', 'ten', 'ta', 'to', 'te', 'po', 'od', 'za', 'jak', 'co', 'kto', 'gdy', 'jeśli', 'ale', 'też', 'tutaj', 'tu', 'teraz', 'bitwy', 'bitwa', 'walka', 'wróg', 'pole', 'pola', 'drużyna', 'osady', 'osadzie', 'złoto', 'koszt', 'cena', 'cel', 'mapa', 'mapy', 'tryb', 'rywalizacja', 'kooperacja', 'arena', 'zasady', 'opcje', 'czat', 'zaproś', 'dołącz', 'wyślij', 'nick', 'hasło', 'zaloguj', 'załóż', 'konto', 'wskrześ', 'zbuduj', 'rekrutuj', 'kup', 'sprzedaj', 'załóż', 'zdejmij', 'użyj', 'pokaż', 'ukryj', 'wybierz', 'kliknij', 'przytrzymaj', 'dziennik', 'skarby', 'skarb', 'zdolność', 'czar', 'czary', 'mana', 'życie', 'atak', 'szybkość', 'poziom', 'runda', 'rundy', 'rund']);
/** --caps: any capitalised phrase of letters (names such as "Grom" or "Leczenie" have no Polish letter to give them away). */
const capsLike = (t) => /^[A-ZĄĆĘŁŃÓŚŹŻ][A-Za-ząćęłńóśźż0-9 ,.'’!?:;·—–()+−\-{}/%…„”]{3,}$/.test(t) && !/^[A-Z0-9_ ]+$/.test(t);
const polish = (t, wide = false) => POLISH.test(t) || ((t.match(WORDY) ?? []).some((w) => COMMON.has(w.toLowerCase()) || (wide && STOP.has(w.toLowerCase()))) && (t.trim().includes(' ') || wide)) || (wide && /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{3,}[!.?…]?$/.test(t.trim()) && STOP.has(t.trim().replace(/[!.?…]$/, '').toLowerCase()));
const norm = (t) => t.replace(/\s+/g, ' ').trim();

export function extractFile(path, src) {
  const sf = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const visit = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text);
    else if (ts.isTemplateExpression(n)) {
      let s = n.head.text;
      n.templateSpans.forEach((sp, i) => (s += `{${i}}` + sp.literal.text));
      out.push(s);
    } else if (ts.isJsxText(n)) out.push(n.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

export function extractAll(dir = 'src') {
  const texts = {};
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) { if (p !== 'src/i18n') walk(p); continue; }
      if (!/\.tsx?$/.test(name)) continue;
      for (const raw of extractFile(p, readFileSync(p, 'utf8'))) {
        const t = norm(raw);
        if (t.length < 2 || !(polish(t, process.argv.includes('--wide')) || (process.argv.includes('--caps') && capsLike(t))) || /^(\.{1,2}\/|https?:)/.test(t) || /^[a-z][A-Za-z0-9_.\-/]*$/.test(t)) continue;
        texts[t] ??= p.replace('src/', '');
      }
    }
  };
  walk(dir);
  return texts;
}

if (process.argv[1]?.endsWith('i18n_extract.mjs')) {
  let texts = extractAll();
  if (process.argv.includes('--missing')) {
    const have = new Set();
    const dir = 'src/i18n/en';
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const m of src.matchAll(/^\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")\s*:/gm)) have.add(norm((m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"')));
    }
    texts = Object.fromEntries(Object.entries(texts).filter(([k]) => !have.has(k)));
  }
  process.stdout.write(JSON.stringify(texts, null, 0));
  process.stderr.write(`${Object.keys(texts).length} texts, ${Object.keys(texts).join('').length} chars\n`);
}
