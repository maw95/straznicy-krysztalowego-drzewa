// Editable rulebook: docs/INSTRUKCJA.md -> docs/wersja_planszowa/Instrukcja_Straznicy.docx (opens in Google Docs and Word).
// Headings become real heading styles (Google Docs builds its outline from them), tables stay
// tables, units get their card picture, and "+1 A" / "Ż 9" get the stat symbols of the cards.
// Usage: npm install --no-save docx && node scripts/assets/manual_docx.cjs

const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, LevelFormat, Packer, PageBreak,
  PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType,
} = require('docx');

const ROOT = path.join(__dirname, '..', '..');
const MD = fs.readFileSync(path.join(ROOT, 'docs', 'INSTRUKCJA.md'), 'utf8');
const ART = path.join(ROOT, 'docs', 'wersja_planszowa', 'instrukcja_szablon', 'assets');
const OUT = path.join(ROOT, 'docs', 'wersja_planszowa', 'Instrukcja_Straznicy.docx');

const FONT = 'EB Garamond';
const GREEN = '177147';
const HORDE = '8B2238';
const GOLD = '8F6422';
const INK = '342516';
const PAGE_W = 11906; // A4 in DXA
const MARGIN = 1134; // 2 cm
const TEXT_W = PAGE_W - 2 * MARGIN;

// Prefer the screen-sized copies made by scripts/assets/manual.py (public/assets/manual), so the file stays small.
const SMALL = path.join(ROOT, 'public', 'assets', 'manual', 'assets');
const img = (file) => fs.readFileSync(fs.existsSync(path.join(SMALL, file)) ? path.join(SMALL, file) : path.join(ART, file));
const imageType = (file) => (file.endsWith('.png') ? 'png' : 'jpg');
const picture = (file, w, h) => new ImageRun({ type: imageType(file), data: img(file), transformation: { width: w, height: h } });

// ---------------------------------------------------------------- inline text
const STAT = { Ż: 'hp.png', A: 'attack.png', S: 'speed.png' };
const STAT_RE = /([+−-]?\d+) ?(Ż|A|S)(?=[\s.,;:)/]|$)|(?<![\p{L}\d])(Ż|A|S) (\d+)/gu;

function statRuns(text, style) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(STAT_RE)) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...style }));
    const icon = new ImageRun({ type: 'png', data: img(`staty/${STAT[m[2] ?? m[3]]}`), transformation: { width: 13, height: 13 } });
    if (m[1]) out.push(new TextRun({ text: m[1], ...style }), icon);
    else out.push(icon, new TextRun({ text: ` ${m[4]}`, ...style }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...style }));
  return out;
}

/** **bold**, *italic* and [links](#…) (kept as plain text) into runs. */
function runs(text, base = {}) {
  text = text.replace(/\[([^\]]+)\]\(#[^)]+\)/g, '$1');
  const out = [];
  const re = /\*\*(.+?)\*\*|(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(...statRuns(text.slice(last, m.index), base));
    if (m[1] !== undefined) out.push(...runs(m[1], { ...base, bold: true }));
    else out.push(...runs(m[2], { ...base, italics: true }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...statRuns(text.slice(last), base));
  return out;
}

// ---------------------------------------------------------------- blocks
const body = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 120, line: 288 }, ...opts.para });

function flavor(text) {
  return new Paragraph({
    children: runs(text.replace(/^>\s*/, ''), { italics: true, color: GOLD }),
    spacing: { before: 60, after: 160, line: 288 },
    indent: { left: 360, right: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'C99633', space: 8 } },
  });
}


function table(lines) {
  const rows = lines
    .map((l) => l.trim())
    .filter((l) => !/^\|[\s:|]*-[-\s:|]*\|$/.test(l))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const cols = Math.max(...rows.map((r) => r.length));
  const empty = rows[0].every((c) => !c);
  const data = empty ? rows.slice(1) : rows;
  // The first column holds names: give it a bit more room.
  const wide = cols > 6;
  const first = Math.round(TEXT_W * (wide ? 0.14 : cols > 4 ? 0.2 : 0.3));
  const rest = Math.floor((TEXT_W - first) / (cols - 1));
  const widths = [TEXT_W - rest * (cols - 1), ...Array(cols - 1).fill(rest)];
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'D8B065' };
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: data.map((r, i) => {
      const head = i === 0 && !empty;
      return new TableRow({
        tableHeader: head,
        cantSplit: true,
        children: widths.map((w, j) => new TableCell({
          width: { size: w, type: WidthType.DXA },
          shading: head ? { type: ShadingType.CLEAR, fill: GREEN, color: 'auto' } : i % 2 ? { type: ShadingType.CLEAR, fill: 'FBF3E0', color: 'auto' } : undefined,
          margins: wide ? { top: 50, bottom: 50, left: 50, right: 50 } : { top: 60, bottom: 60, left: 100, right: 100 },
          borders: { top: border, bottom: border, left: border, right: border },
          verticalAlign: VerticalAlign.CENTER,
          // Rows of a table hold together on one page (keep with next row, except the last one).
          children: [new Paragraph({ keepNext: i < data.length - 1, children: runs(r[j] ?? '', head ? { bold: true, color: 'FFFFFF', size: wide ? 15 : 20 } : { size: wide ? 18 : 20 }), alignment: j > 0 && (wide || /^[\d /]+$/.test(r[j] ?? '')) ? AlignmentType.CENTER : AlignmentType.LEFT })],
        })),
      });
    }),
  });
}

const UNIT_CARD = {
  'Złoty Smok': 'goldDragon', 'Król Jednorożców': 'unicornKing', 'Prastary Niedźwiedź': 'ancientBear', 'Elf Druid': 'elfDruid',
  Nimfa: 'nymph', Pegaz: 'pegasus', 'Czarny Smok': 'blackDragon', 'Władca Wilkołaków': 'werewolfLord', 'Ogr Żelazna Pięść': 'ironFistOgre',
  'Goblin Szaman': 'goblinShaman', 'Pająk Jaskiniowy': 'caveSpider', 'Nietoperz Cienia': 'shadowBat', 'Cyklop Błyskotek': 'cyclops',
  'Gryf Złodziej Skarbów': 'griffin', 'Hydra z Zatopionych Ruin': 'hydra',
};

/** A unit: its card on the left, name, numbers, story and ability on the right. */
function unit(head, flavorLine, ability, horde) {
  const m = head.match(/^\*\*(\S+)\s+(.+?)\*\*\s+—\s+(.+)$/);
  const name = m[2];
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cardW = 2300;
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [cardW, TEXT_W - cardW],
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: cardW, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [new Paragraph({ children: [picture(`karty/${UNIT_CARD[name]}.jpg`, 118, 165)] })] }),
      new TableCell({ width: { size: TEXT_W - cardW, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, margins: { left: 120 }, children: [
        new Paragraph({ children: [new TextRun({ text: `${m[1]} ${name}`, bold: true, size: 28, color: horde ? HORDE : GREEN })], spacing: { after: 40 } }),
        new Paragraph({ children: runs(m[3], { size: 20, color: GOLD, bold: true }), spacing: { after: 80 } }),
        new Paragraph({ children: runs(flavorLine, { italics: true }), spacing: { after: 80, line: 276 } }),
        new Paragraph({ children: runs(ability), spacing: { after: 60, line: 276 } }),
      ] }),
    ] })],
  });
}

/** A row (or rows) of pictures with captions, in a borderless table. Items: [file, caption, width, height]. */
function gallery(items, perRow) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const colW = Math.floor(TEXT_W / perRow);
  const rows = [];
  for (let k = 0; k < items.length; k += perRow) {
    const chunk = items.slice(k, k + perRow);
    rows.push(new TableRow({ cantSplit: true, children: Array.from({ length: perRow }, (_, j) => {
      const it = chunk[j];
      return new TableCell({
        width: { size: colW, type: WidthType.DXA },
        borders: { top: none, bottom: none, left: none, right: none },
        verticalAlign: VerticalAlign.BOTTOM,
        children: it
          ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [picture(it[0], it[2], it[3])] }),
             new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: runs(it[1], { size: 17, italics: true, color: GOLD }) })]
          : [new Paragraph({ children: [] })],
      });
    }) }));
  }
  return new Table({
    width: { size: colW * perRow, type: WidthType.DXA },
    columnWidths: Array(perRow).fill(colW),
    alignment: AlignmentType.CENTER,
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows,
  });
}

const TILE = (f, c) => [`kafelki/${f}.png`, c, 76, 88];
const MARK = (f, c) => [`znaczniki/${f}.png`, c, 36, 36];
const CARD = (f, c) => [`karty/${f}.jpg`, c, 104, 145];
/** Pictures placed right after the first line that starts with the given text. */
const AFTER_LINE = [
  ['- **Kość** −1 / 0 / +1', gallery([
    MARK('damage_5', 'kropla „5”'), MARK('damage_3', 'kropla „3”'), MARK('damage_2', 'kropla „2”'), MARK('damage_1', 'kropla „1”'), MARK('ability_used', 'zużyta zdolność'), MARK('attack_up', 'Wzmocnienie Ataku'),
    MARK('vitality', 'Żywotność'), MARK('shield', 'Ochrona'), MARK('rooted', 'Unieruchomienie'), MARK('slowed', 'Spowolnienie'), MARK('cursed', 'Klątwa'), MARK('speed_up', 'Przyspieszenie'), MARK('crystal', 'Kryształ Opieki'),
  ], 6)],
  ['6. Połóżcie **kryształowy znacznik**', gallery([
    ['baza_przymierza.jpg', 'Baza Przymierza', 92, 88], TILE('lairGriffin_1', 'Gniazdo Gryfa'), TILE('tree_1', 'Kryształowe Drzewo'), TILE('lairCyclops_1', 'Jaskinia Cyklopa'), TILE('lairHydra_1', 'Ruiny Hydry'), ['baza_hordy.jpg', 'Baza Hordy', 92, 88],
  ], 6)],
  ['> 🌿 Ziemie Przymierza są łagodniejsze', gallery([
    TILE('meadow_1', 'Polana · łatwy'), TILE('river_1', 'Rzeka · trudny'), TILE('mountain_1', 'Góry · przeszkoda'), TILE('scorched_1', 'Spalona Ziemia · łatwy'), TILE('swamp_1', 'Mroczne Bagno · trudny'), TILE('thorns_1', 'Trujące Ciernie · przeszkoda'),
  ], 6)],
];
/** Pictures placed right after the first table of a chapter. */
const AFTER_TABLE = {
  '11. Skarby': gallery(['resurrection', 'heal', 'seed', 'damage_scroll', 'sword', 'shield', 'vitality', 'boots', 'horn', 'map', 'lightning', 'hourglass', 'courage_horn', 'teleport', 'stone'].map((k) => CARD(k, '')), 5),
};

// Pictures shown after a chapter heading.
const AFTER_HEADING = {
  'Opowieść o Drzewie': ['krysztalowe_drzewo.png', 240, 240, 'Kryształowe Drzewo'],
  '15. Ściągawka': ['krysztalowe_drzewo.png', 150, 150, ''],
  '5. Przygotowanie': ['mapa_przyklad.png', 330, 285, 'Przykładowa mapa średnia'],
  '6. Przebieg rundy': ['round_track.png', 230, 219, ''],
  '6. Przebieg rundy (Horda)': ['round_crystal.png', 30, 40, 'Tor rund i kryształowy znacznik rundy'],
  '8. Bitwa na arenie': ['arena_przymierze.jpg', 470, 352, 'Arena Przymierza — na ziemiach Przymierza'],
  '8. Bitwa na arenie (Horda)': ['arena_horda.jpg', 470, 352, 'Arena Hordy — na ziemiach Hordy. Pola startowe po bokach, 7 przeszkód'],
  // Several pictures: a list of them.
  '2. Kto jest kim — jednostki': [
    ['figurki/przymierze.png', 470, 259, 'Figurki Przymierza Świtu'],
    ['figurki/horda.png', 470, 259, 'Figurki Mrocznej Hordy'],
    ['figurki/straznicy.png', 470, 141, 'Figurki strażników kryształów'],
  ],
};

// ---------------------------------------------------------------- walk the markdown
const children = [];
// Cover.
const cover = path.join(ROOT, 'public', 'assets', 'manual', 'assets', 'okladka_A4_300dpi.jpg');
if (fs.existsSync(cover)) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'jpg', data: fs.readFileSync(cover), transformation: { width: 600, height: 848 } })] }));

const lines = MD.split('\n');
let section = '';
let firstChapter = true;
let tableSeen = false;
const placed = new Set();
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const t = line.trim();
  // Pictures that follow a given line go in before the next content.
  const prev = lines.slice(0, i).reverse().find((l) => l.trim())?.trim() ?? '';
  for (const [start, pic] of AFTER_LINE) {
    if (!placed.has(start) && prev.startsWith(start) && t) {
      placed.add(start);
      children.push(pic, new Paragraph({ children: [], spacing: { after: 120 } }));
    }
  }
  if (!t) continue;
  if (t.startsWith('# ')) {
    children.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: t.slice(2) })], pageBreakBefore: true }));
    continue;
  }
  if (t.startsWith('## ')) {
    section = t.slice(3);
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: section })], pageBreakBefore: !firstChapter }));
    firstChapter = false;
    const pics = [AFTER_HEADING[section], AFTER_HEADING[`${section} (Horda)`]].filter(Boolean).flatMap((p) => (Array.isArray(p[0]) ? p : [p]));
    for (const pic of pics) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [picture(pic[0], pic[1], pic[2])], spacing: { before: 60, after: 40 } }));
      if (pic[3]) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pic[3], italics: true, size: 18, color: GOLD })], spacing: { after: 160 } }));
    }
    tableSeen = false;
    continue;
  }
  if (t.startsWith('### ')) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t.slice(4) })] }));
    continue;
  }
  // Section rules of the markdown: chapters start on a new page anyway.
  if (t === '---') continue;
  if (t.startsWith('>')) {
    children.push(flavor(t));
    continue;
  }
  if (t.startsWith('|')) {
    const block = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) block.push(lines[i++]);
    i--;
    children.push(table(block), new Paragraph({ children: [], spacing: { after: 120 } }));
    if (!tableSeen && AFTER_TABLE[section]) children.push(AFTER_TABLE[section], new Paragraph({ children: [], spacing: { after: 120 } }));
    tableSeen = true;
    continue;
  }
  // Units: name line, story, ability.
  if (/^\*\*\S+ .+?\*\* — /.test(t) && section.startsWith('2.')) {
    const next = (j) => lines.slice(j).find((l) => l.trim()) ?? '';
    let j = i + 1;
    while (!lines[j].trim()) j++;
    const story = lines[j].trim();
    j++;
    while (!lines[j].trim()) j++;
    const ability = lines[j].trim();
    children.push(unit(t, story, ability, lines.slice(0, i).reverse().find((l) => l.startsWith('### '))?.includes('Horda')), new Paragraph({ children: [], spacing: { after: 80 } }));
    void next;
    i = j;
    continue;
  }
  const bullet = line.match(/^(\s*)[-*] (.*)$/);
  if (bullet) {
    children.push(new Paragraph({ children: runs(bullet[2]), numbering: { reference: 'bullets', level: bullet[1].length >= 2 ? 1 : 0 }, spacing: { after: 60, line: 276 } }));
    continue;
  }
  const num = line.match(/^(\s*)(\d+)\. (.*)$/);
  if (num) {
    children.push(new Paragraph({ children: runs(num[3]), numbering: { reference: `n-${section}`, level: 0 }, spacing: { after: 60, line: 276 } }));
    continue;
  }
  // A line introducing a table stays on the page of the table.
  const nextLine = lines.slice(i + 1).find((l) => l.trim()) ?? '';
  children.push(body(t, { para: nextLine.trim().startsWith('|') ? { keepNext: true } : {} }));
}

// One numbering list per chapter, so each numbered list starts from 1.
const sections = [...new Set(MD.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3)))];
const doc = new Document({
  creator: 'Strażnicy Kryształowego Drzewa',
  title: 'Strażnicy Kryształowego Drzewa — instrukcja',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 56, bold: true, color: GREEN }, paragraph: { spacing: { after: 240 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 40, bold: true, color: GREEN }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: GOLD }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } },
      ] },
      ...sections.map((s) => ({ reference: `n-${s}`, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Strażnicy Kryształowego Drzewa · ', size: 18, color: GOLD }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GOLD })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`ok -> ${OUT} (${(buf.length / 1e6).toFixed(1)} MB)`);
});
void PageBreak;
