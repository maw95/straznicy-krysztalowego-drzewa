// The in-game manual (src/content/instrukcja.pl.md) as data: the Markdown is cut into chapters (`##`) and parts (`###`), each with plain text for the search.
// Pure functions, no React; the view is ManualView.tsx. Only the Markdown the manual uses is understood: headings, paragraphs, bullet and numbered lists, tables,
// quotes, **bold**, *italic*, `code` and [links](#id) to other places of the manual. A line `@słowa: a, b` adds hidden keywords to the chapter.

export type Inline = { t: 'text'; v: string } | { t: 'b' | 'i' | 'code'; v: string } | { t: 'link'; v: string; to: string };

export type Block =
  | { t: 'p'; inl: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] }
  | { t: 'quote'; inl: Inline[] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] };

export interface Entry {
  /** The anchor: the title without Polish letters, words joined by dashes. */
  id: string;
  title: string;
  level: 2 | 3;
  /** The chapter this part belongs to (its own id for a chapter). */
  chapter: string;
  chapterTitle: string;
  blocks: Block[];
  keywords: string[];
  /** The text of the entry (title, keywords, body) for the search. */
  text: string;
}

export interface ManualDoc {
  entries: Entry[];
  /** The ids that links may point to. */
  ids: Set<string>;
}

const FOLD: Record<string, string> = { ł: 'l', Ł: 'l' };
/** One character without its diacritics, lower case; always one character, so that indexes of a folded text fit the original. */
const foldChar = (c: string): string => FOLD[c] ?? (c.normalize('NFD')[0] ?? c).toLowerCase()[0];
/** Lower case, no diacritics (ą → a, ł → l), same length as the input. */
export const fold = (s: string): string => Array.from(s, foldChar).join('');

export const slugify = (title: string): string =>
  fold(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\(#([^)]+)\)/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'b', v: m[1] });
    else if (m[2] !== undefined) out.push({ t: 'i', v: m[2] });
    else if (m[3] !== undefined) out.push({ t: 'code', v: m[3] });
    else out.push({ t: 'link', v: m[4], to: m[5] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
  return out;
}

const plain = (inl: Inline[]): string => inl.map((i) => i.v).join('');
const cells = (line: string): string[] => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (/^\s*\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      const body = rows.filter((r) => !r.every((c) => /^:?-{3,}:?$/.test(c)));
      blocks.push({ t: 'table', head: body[0].map(parseInline), rows: body.slice(1).map((r) => r.map(parseInline)) });
    } else if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line);
      const items: Inline[][] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\. /.test(lines[i]) : /^\s*[-*] /.test(lines[i]))) {
        items.push(parseInline(lines[i++].replace(ordered ? /^\s*\d+\. / : /^\s*[-*] /, '')));
      }
      blocks.push({ t: ordered ? 'ol' : 'ul', items });
    } else if (/^>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ t: 'quote', inl: parseInline(quote.join(' ')) });
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^\s*(\||[-*] |\d+\. |>)/.test(lines[i])) para.push(lines[i++].trim());
      blocks.push({ t: 'p', inl: parseInline(para.join(' ')) });
    }
  }
  return blocks;
}

function blockText(b: Block): string {
  switch (b.t) {
    case 'p':
    case 'quote':
      return plain(b.inl);
    case 'ul':
    case 'ol':
      return b.items.map(plain).join(' ');
    case 'table':
      return [b.head.map(plain).join(' '), ...b.rows.map((r) => r.map(plain).join(' '))].join(' ');
  }
}

/** Everything before the first `##` (the title and the note about the format) is for the authors and is dropped. */
export function parseManual(md: string): ManualDoc {
  const entries: Entry[] = [];
  let current: { level: 2 | 3; title: string; lines: string[]; keywords: string[] } | null = null;
  let chapter = { id: '', title: '' };
  const flush = () => {
    if (!current) return;
    const id = slugify(current.title);
    if (current.level === 2) chapter = { id, title: current.title };
    const blocks = parseBlocks(current.lines);
    entries.push({
      id,
      title: current.title,
      level: current.level,
      chapter: chapter.id,
      chapterTitle: chapter.title,
      blocks,
      keywords: current.keywords,
      text: [current.title, current.keywords.join(' '), ...blocks.map(blockText)].join(' '),
    });
  };
  for (const raw of md.split('\n')) {
    const h = /^(##|###) (.+)$/.exec(raw);
    if (h) {
      flush();
      current = { level: h[1] === '##' ? 2 : 3, title: h[2].trim(), lines: [], keywords: [] };
    } else if (current) {
      const kw = /^@słowa:\s*(.*)$/.exec(raw);
      if (kw) current.keywords.push(...kw[1].split(',').map((k) => k.trim()).filter(Boolean));
      else current.lines.push(raw);
    }
  }
  flush();
  return { entries, ids: new Set(entries.map((e) => e.id)) };
}

/** The words of a query: at least one letter or digit, folded. */
export const queryTokens = (q: string): string[] => fold(q).split(/[^a-z0-9]+/).filter(Boolean);

/** Polish endings change (mana ~ many ~ manę, kuźnia ~ kuźni): a word matches by its beginning, which is the word without its last two letters (one letter for 4–5 letters, none for 3 or fewer). */
export const stemOf = (token: string): string => (token.length >= 6 ? token.slice(0, token.length - 2) : token.length >= 4 ? token.slice(0, token.length - 1) : token);

const isWordChar = (c: string): boolean => /[a-z0-9]/.test(c);
/** Indexes where `stem` starts a word of the (folded) text. */
function wordStarts(folded: string, stem: string): number[] {
  const at: number[] = [];
  for (let i = folded.indexOf(stem); i >= 0; i = folded.indexOf(stem, i + 1)) if (i === 0 || !isWordChar(folded[i - 1])) at.push(i);
  return at;
}

export interface Hit {
  entry: Entry;
  score: number;
  /** About 170 characters of the entry's text around the first match. */
  snippet: string;
}

/** Entries that contain every word of the query (by prefix of the stem), best first: the title weighs most, then the keywords, then the text. */
export function searchManual(doc: ManualDoc, query: string): Hit[] {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  const stems = tokens.map(stemOf);
  const hits: Hit[] = [];
  for (const entry of doc.entries) {
    const title = fold(entry.title);
    const kw = fold(entry.keywords.join(' '));
    const body = fold(entry.text);
    if (!stems.every((s) => wordStarts(body, s).length)) continue;
    let score = 0;
    for (const s of stems) score += (wordStarts(title, s).length ? 8 : 0) + (wordStarts(kw, s).length ? 4 : 0) + Math.min(wordStarts(body, s).length, 5);
    const bodyOnly = entry.text.slice(entry.title.length + 1 + entry.keywords.join(' ').length);
    const at = Math.max(0, wordStarts(fold(bodyOnly), stems[0])[0] ?? 0);
    const from = Math.max(0, at - 50);
    const snippet = (from > 0 ? '…' : '') + bodyOnly.slice(from, from + 170).trim() + (from + 170 < bodyOnly.length ? '…' : '');
    hits.push({ entry, score: score + (entry.level === 2 ? 1 : 0), snippet });
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** Cuts a text into plain parts and parts that match the query (for `<mark>`). */
export function highlightParts(text: string, query: string): Array<{ v: string; hit: boolean }> {
  const stems = queryTokens(query).map(stemOf);
  if (!stems.length) return [{ v: text, hit: false }];
  const folded = fold(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const s of stems) {
    for (const at of wordStarts(folded, s)) {
      let end = at + s.length;
      while (end < folded.length && isWordChar(folded[end])) end++;
      for (let k = at; k < end; k++) marks[k] = true;
    }
  }
  const parts: Array<{ v: string; hit: boolean }> = [];
  for (let k = 0; k < text.length; k++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[k]) last.v += text[k];
    else parts.push({ v: text[k], hit: marks[k] });
  }
  return parts;
}

/** Links that point nowhere (for the test). */
export function brokenLinks(doc: ManualDoc): string[] {
  const bad: string[] = [];
  const check = (inl: Inline[], where: string) => inl.forEach((i) => i.t === 'link' && !doc.ids.has(i.to) && bad.push(`${where} -> #${i.to}`));
  for (const e of doc.entries) {
    for (const b of e.blocks) {
      if (b.t === 'p' || b.t === 'quote') check(b.inl, e.title);
      else if (b.t === 'ul' || b.t === 'ol') b.items.forEach((it) => check(it, e.title));
      else if (b.t === 'table') {
        b.head.forEach((c) => check(c, e.title));
        b.rows.forEach((r) => r.forEach((c) => check(c, e.title)));
      }
    }
  }
  return bad;
}
