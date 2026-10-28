"""Builds docs/wersja_planszowa/instrukcja_szablon/index.html from the rule text (docs/INSTRUKCJA.md, hand-laid into pages).

Some pages take their text from INSTRUKCJA.md (tables, units, edge cases, cheat sheet); others are written
here. After a change run: python3 scripts/assets/manual_build.py && python3 scripts/assets/manual.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'docs/wersja_planszowa/instrukcja_szablon/index.html')
MD = open(os.path.join(ROOT, 'docs/INSTRUKCJA.md'), encoding='utf-8').read()

CORNERS = ''.join(f'<img class="corner {c}" src="assets/narożnik.svg" alt="">' for c in ('tl', 'tr', 'br', 'bl'))
pages = []  # (html, chapter_key or None)
toc = []  # (number, title, key)


def sheet(body, *, cls='', left='', right='', foot='', key=None):
    pages.append((cls, left, right, foot, body, key))


def esc(s):
    return s


# ---------------------------------------------------------------- helpers
def md_inline(s):
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<i>\1</i>', s)
    s = re.sub(r'\[([^\]]+)\]\(#[^)]+\)', r'\1', s)
    return s


def unit_entries(section_title):
    """Unit blocks from the markdown section (name line, flavor line, ability line)."""
    start = MD.index(f'### {section_title}')
    nxt = MD.find('\n### ', start + 5)
    end = MD.find('\n---', start)
    block = MD[start: min(x for x in (nxt, end) if x > 0)]
    lines = [l for l in block.split('\n')[1:] if l.strip() and not l.startswith('>')]
    out = []
    i = 0
    while i < len(lines):
        head = lines[i]
        m = re.match(r'\*\*(\S+)\s+(.+?)\*\*\s+—\s+(.+)$', head)
        if not m:  # a plain paragraph between units (e.g. the note on Horde names)
            i += 1
            continue
        flavor = lines[i + 1]
        ability = lines[i + 2]
        out.append((m.group(2), m.group(3), flavor, ability))
        i += 3
    return out


UNIT_IDS = {
    'Złoty Smok': 'goldDragon', 'Król Jednorożców': 'unicornKing', 'Prastary Niedźwiedź': 'ancientBear', 'Elf Druid': 'elfDruid',
    'Nimfa': 'nymph', 'Pegaz': 'pegasus', 'Czarny Smok': 'blackDragon', 'Władca Wilkołaków': 'werewolfLord', 'Ogr Żelazna Pięść': 'ironFistOgre',
    'Goblin Szaman': 'goblinShaman', 'Pająk Jaskiniowy': 'caveSpider', 'Nietoperz Cienia': 'shadowBat', 'Cyklop Błyskotek': 'cyclops',
    'Gryf Złodziej Skarbów': 'griffin', 'Hydra z Zatopionych Ruin': 'hydra',
}


def units_html(section_title):
    parts = []
    for name, stats, flavor, ability in unit_entries(section_title):
        uid = UNIT_IDS[name]
        parts.append(
            f'<div class="unit"><img src="assets/karty/{uid}.jpg" alt="Karta: {name}"><div>'
            f'<h3>{name}</h3><div class="stats">{md_inline(stats)}</div>'
            f'<p class="flavor">{md_inline(flavor)}</p><div class="ability">{md_inline(ability)}</div></div></div>'
        )
    return '<div class="units">' + ''.join(parts) + '</div>'


def md_table(start_marker):
    """First markdown table after `start_marker` as HTML rows."""
    i = MD.index(start_marker)
    lines = MD[i:].split('\n')
    rows = []
    started = False
    for l in lines[1:]:
        s = l.strip()
        if s.startswith('|'):
            started = True
            if re.match(r'^\|[-:| ]+\|$', s):
                continue
            rows.append([md_inline(c.strip()) for c in s.strip('|').split('|')])
        elif started:
            break
    return rows


def table(rows, cls='table', head=True):
    h = ''
    if head:
        h = '<thead><tr>' + ''.join(f'<th>{c}</th>' for c in rows[0]) + '</tr></thead>'
        rows = rows[1:]
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table class="{cls}">{h}<tbody>{b}</tbody></table>'


def chapter(num, title, key):
    toc.append((num, title, key))


# ---------------------------------------------------------------- pages
# 2: the author's letter to the player. The author writes it by hand on the printed page, or types it over the
# ruled lines (replace the <div class="lines"> with <p> paragraphs in index.html, or here).
sheet('''<div class="eyebrow">Od autora</div><h1>Słowo na drogę</h1>
<div class="letter"><div class="to">Drogi / Droga ……………………………………</div><div class="lines"></div>
<div class="sign">Autor gry</div></div>
''', left='Od autora', right='Dla gracza', foot='Od autora')

# 3: contents
sheet('@@TOC@@', cls='frontispiece', left='Księga zasad', right='Spis treści', foot='Spis treści')

# Story
story = MD[MD.index('## Opowieść o Drzewie'):MD.index('---\n\n## Spis treści')]
paras = [md_inline(p.strip()) for p in story.split('\n\n')[1:] if p.strip()]
chapter('✧', 'Opowieść o Drzewie', 'story')
# The story is found by content, not by position: paragraphs up to the faction ones tell the tale.
fac = next(n for n, p in enumerate(paras) if p.startswith('<b>Przymierze Świtu</b>'))
tale, rest = paras[:fac], paras[fac:]
named = lambda start: next(p for p in rest if p.startswith(start))
# A short paragraph (the name of the night) becomes the quote of the first page.
quote_at = next((n for n, p in enumerate(tale) if len(p) < 90 and n > 0), None)
quote = tale[quote_at] if quote_at is not None else ''
body = [p for n, p in enumerate(tale) if n != quote_at]
first, second = body[:3], body[3:]
sheet(f'''<div class="eyebrow">Zanim zaczniecie</div><h1>Opowieść o Drzewie</h1>
<div class="chap-hero" style="grid-template-columns:minmax(0,50fr) minmax(0,50fr);margin:2mm 0 4mm"><img src="assets/krysztalowe_drzewo.png" alt="Kryształowe Drzewo" style="height:92mm"><div class="story"><p class="first">{first[0]}</p></div></div>
<div class="story">{''.join(f'<p>{p}</p>' for p in first[1:])}</div>
{f'<div class="quote" style="margin-top:4mm">„{re.sub(r"<[^>]+>", "", quote)}”</div>' if quote else ''}
''', cls='neutral', left='Wprowadzenie', right='Opowieść', foot='Opowieść o Drzewie', key='story')
sheet(f'''<div class="story">{''.join(f'<p>{p}</p>' for p in second)}</div>
<div class="cols" style="margin:4mm 0 4mm"><div class="card"><h3>Przymierze Świtu</h3><p>{named('<b>Przymierze Świtu</b>').replace('<b>Przymierze Świtu</b> — ', '')}</p></div>
<div class="card" style="--accent:var(--horde)"><h3>Mroczna Horda</h3><p>{named('<b>Mroczna Horda</b>').replace('<b>Mroczna Horda</b> — ', '')}</p></div></div>
<div class="card" style="--accent:var(--navy)"><h3>Strażnicy</h3><p>{named('Kryształów pilnują').replace('Kryształów pilnują <b>Strażnicy</b> — s', 'S')}</p></div>
<p class="intro" style="text-align:center;margin-top:5mm"><i>{named('Wybierz stronę')}</i></p>
''', cls='neutral', left='Wprowadzenie', right='Opowieść', foot='Opowieść o Drzewie')

# Rules in pictures: the whole game in eight panels, for the first game and for those who skip rulebooks.
chapter('✧', 'Zasady w obrazkach', 'pictures')
pics_md = MD[MD.index('## Zasady w obrazkach'):MD.index('## 1. Co jest w pudełku')]
PIC_TEXT = []
for l in pics_md.split('\n'):
    m = re.match(r'^\d+\. \*\*(.+?)\*\* ?(.*)$', l)
    if m:
        PIC_TEXT.append((md_inline(m.group(1)), md_inline(m.group(2))))
pics_intro = md_inline(re.search(r'\n\*(.+)\*\n', pics_md).group(1))


def img(src, h, extra=''):
    return f'<img src="assets/{src}" alt="" style="height:{h}mm;{extra}">'


def hexes(cells, w=21):
    """Pointy-top tiles at axial (q, r) positions: [(q, r, image, badge, badge class, figure)]."""
    h = w * 300 / 260
    xs = [w * (q + r / 2) for q, r, *_ in cells]
    ys = [0.75 * h * r for _, r, *_ in cells]
    x0, y0 = min(xs), min(ys)
    out, over = [], []
    for (q, r, src, badge, bcls, fig), x, y in zip(cells, xs, ys):
        x, y = x - x0, y - y0
        out.append(f'<img src="assets/kafelki/{src}.png" alt="" style="left:{x:.1f}mm;top:{y:.1f}mm;width:{w}mm">')
    # Figures and badges go over all the tiles, so a neighbouring tile never covers them.
    out, over = [], out
    for (q, r, src, badge, bcls, fig), x, y in zip(cells, xs, ys):
        x, y = x - x0, y - y0
        if fig:
            out.append(f'<img src="assets/{fig}" alt="" style="left:{x + w * 0.15:.1f}mm;top:{y - h * 0.32:.1f}mm;width:{w * 0.7:.1f}mm;height:{h * 1.05:.1f}mm;object-fit:contain;object-position:center bottom">')
        if badge:
            out.append(f'<div class="badge {bcls}" style="left:{x + w / 2 - 4:.1f}mm;top:{y + h - 9.5:.1f}mm">{badge}</div>')
    out = over + out
    width = max(xs) - x0 + w
    height = max(ys) - y0 + h
    return f'<div class="hexes" style="width:{width:.1f}mm;height:{height:.1f}mm">{"".join(out)}</div>'


def panel(n, art):
    say, more = PIC_TEXT[n - 1]
    return (f'<div class="pic-panel"><div class="pic-num">{n}</div><div class="pic-art">{art}</div>'
            f'<div class="pic-say">{say}</div><div class="pic-more">{more}</div></div>')


ARROW = '<span class="pic-arrow">➜</span>'
tile_with = lambda src, badge, cls, label: (f'<div style="text-align:center">{hexes([(0, 0, src, badge, cls, None)], 25)}'
                                            f'<div class="under">{label}</div></div>')
pic_art = {
    1: f'<div>{img("figurki/goldDragon.png", 34)}<div>{img("znaczniki/crystal.png", 9)}{img("znaczniki/crystal.png", 9)}{img("znaczniki/crystal.png", 9)}</div></div>{ARROW}{img("krysztalowe_drzewo.png", 50)}',
    2: f'<div style="text-align:center">{img("round_track.png", 46, "margin:0 auto")}<div class="badge" style="width:auto;display:inline-flex;padding:0 2mm;border-radius:2mm;margin-top:1mm">limit: 8 · 12 · 18 · 24</div></div>',
    3: tile_with('meadow_1', '1', '', 'Polana — łatwy') + tile_with('river_1', '2', '', 'Rzeka — trudny') + tile_with('mountain_1', '✕', 'no', 'Góry — przeszkoda'),
    4: hexes([(0, 0, 'forest_1', '', '', 'figurki/unicornKing.png'), (1, 0, 'meadow_1', '', '', None), (-1, 0, 'river_1', '', '', None),
              (0, -1, 'back_dawn', '?', '', None), (1, -1, 'lairGriffin_1', 'nowy', 'new', 'znaczniki/crystal.png'), (-1, 1, 'back_dawn', '?', '', None), (0, 1, 'hill_1', 'nowy', 'new', None)], 20),
    5: f'{img("figurki/unicornKing.png", 44)}<span class="pic-arrow" style="font-size:30pt">⚔</span>{img("figurki/werewolfLord.png", 44)}',
    6: f'<div><div class="badge" style="margin:0 auto 1mm">1</div>{img("karty/unicornKing.jpg", 46)}<div class="under">Szybkość 8</div></div>'
       f'<div><div class="badge" style="margin:0 auto 1mm">2</div>{img("karty/werewolfLord.jpg", 46)}<div class="under">Szybkość 7</div></div>',
    7: f'<div style="position:relative">{img("karty/werewolfLord.jpg", 58)}{img("znaczniki/damage_5.png", 15, "position:absolute;left:4mm;top:21mm;transform:rotate(-12deg)")}{img("znaczniki/damage_1.png", 12, "position:absolute;left:20mm;top:26mm;transform:rotate(9deg)")}</div>'
       f'<div class="under" style="max-width:24mm;text-align:left">krople 5 + 1<br>= 6 obrażeń.<br>Życie 8 —<br>jeszcze stoi.</div>',
    8: f'{img("figurki/griffin.png", 34)}{ARROW}<div>{img("znaczniki/crystal.png", 15)}<div class="under">kryształ</div></div><div>{img("karty/sword.jpg", 36)}<div class="under">i skarb</div></div>',
}
sheet(f"""<div class="eyebrow">Na pierwszą partię</div><h1>Zasady w obrazkach</h1>
<p class="fine" style="text-align:center;margin:-2mm 0 2mm;line-height:1.2">{pics_intro}</p>
<div class="pics">{''.join(panel(n, pic_art[n]) for n in (1, 2, 3, 4))}</div>
""", cls='neutral', left='Zasady w obrazkach', right='Wyprawa', foot='Zasady w obrazkach', key='pictures')
sheet(f"""<div class="eyebrow">Na pierwszą partię</div><h1>Walka w obrazkach</h1>
<p class="fine" style="text-align:center;margin:-1mm 0 3mm">Na poziomie łatwym walczą tylko dwaj bohaterowie (rozdział 9). Na arenie każda jednostka najpierw się rusza, potem atakuje (rozdział 8).</p>
<div class="pics">{''.join(panel(n, pic_art[n]) for n in (5, 6, 7, 8))}</div>
""", cls='neutral', left='Zasady w obrazkach', right='Walka', foot='Zasady w obrazkach')

# 1. Contents of the box
chapter('1', 'Co jest w pudełku', 'box')
stats_rows = md_table('Każda jednostka ma trzy liczby:')
stats_rows = [r for r in stats_rows if any(c for c in r)]
sheet(f'''<div class="eyebrow">Rozdział 1</div><h1>Co jest w pudełku</h1>
<p class="intro" style="margin-bottom:3mm">Liczby wystarczają na najbardziej wymagającą partię: bardzo długą mapę i bitwę 3 na 3.</p>
{table([['Element', 'Ile', 'Szczegóły'],
 ['<b>Kafelki terenu Przymierza</b> (zielony rewers)', '50', 'po 7 z każdego z 7 rodzajów + 1 dodatkowa Polana'],
 ['<b>Kafelki terenu Hordy</b> (bordowy rewers)', '49', 'po 7 z każdego z 7 rodzajów'],
 ['<b>Kafelki skarbów</b>', '16', '8 z zielonym i 8 z bordowym rewersem; wszystkie kafelki mają 5 cm'],
 ['<b>Siedliska strażników</b>', '3', 'Gryf (zielony rewers), Cyklop i Hydra (bordowy)'],
 ['<b>Drzewo i bazy</b>', '3', 'Kryształowe Drzewo, baza Przymierza, baza Hordy'],
 ['<b>Plansza areny</b> (dwustronna, A3)', '1', 'arena Przymierza i arena Hordy, po 7 przeszkód'],
 ['<b>Karty jednostek</b> (8 × 11,2 cm)', '18', 'Przymierze 6 · Horda 6 · strażnicy 3 + 3 do pojedynku (błękitny rewers)'],
 ['<b>Figurki</b>', '15', 'po jednej na każdą jednostkę, podstawka 3 cm'],
 ['<b>Karty skarbów</b> (6,3 × 8,8 cm)', '20', '6 Eliksirów Odrodzenia + po 1 z 14 pozostałych skarbów'],
 ['<b>Kryształy</b>', '3', 'wys. 1,6 cm'],
 ['<b>Tor rund</b> i <b>znacznik rundy</b>', '1 + 1', 'tablica 15 cm z 24 gniazdami, znacznik wys. 3 cm'],
 ['<b>Kość</b> −1 / 0 / +1', '1', 'tylko do utrudnienia „Rzut kością” (rozdział 13)']], 'table')}
<div class="banner" style="margin-top:4mm">Znaczniki</div>
<p class="fine" style="text-align:center;margin:-2mm 0 2mm">Tyle wystarczy na najbardziej zaciętą bitwę.</p>
<div class="markers seven">
<figure><img src="assets/znaczniki/damage_1.png" alt=""><figcaption>kropla „1” / „2” × 6</figcaption></figure>
<figure><img src="assets/znaczniki/damage_5.png" alt=""><figcaption>kropla „3” / „5” × 10</figcaption></figure>
<figure><img src="assets/znaczniki/ability_used.png" alt=""><figcaption>zużyta zdolność × 6</figcaption></figure>
<figure><img src="assets/znaczniki/attack_up.png" alt=""><figcaption>Wzmocnienie Ataku × 6</figcaption></figure>
<figure><img src="assets/znaczniki/attack_3.png" alt=""><figcaption>+3 Ataku × 1</figcaption></figure>
<figure><img src="assets/znaczniki/vitality.png" alt=""><figcaption>Żywotność × 1</figcaption></figure>
<figure><img src="assets/znaczniki/shield.png" alt=""><figcaption>Ochrona × 1</figcaption></figure>
<figure><img src="assets/znaczniki/rooted.png" alt=""><figcaption>Unieruchomienie × 1</figcaption></figure>
<figure><img src="assets/znaczniki/slowed.png" alt=""><figcaption>Spowolnienie × 1</figcaption></figure>
<figure><img src="assets/znaczniki/cursed.png" alt=""><figcaption>Klątwa × 1</figcaption></figure>
<figure><img src="assets/znaczniki/speed_up.png" alt=""><figcaption>Przyspieszenie × 1</figcaption></figure>
<figure><img src="assets/znaczniki/crystal.png" alt=""><figcaption>Kryształ Opieki × 3</figcaption></figure>
</div>
''', left='Rozdział 1', right='Elementy gry', foot='Co jest w pudełku', key='box')
sheet(f'''<div class="eyebrow">Rozdział 1 · Co jest w pudełku</div><h1>Karty jednostek</h1>
<div class="banner">Trzy liczby każdej jednostki</div>
{table([['Liczba', 'Co znaczy', 'Uwagi']] + stats_rows, 'table')}
<p style="margin-top:4mm">Do tego każda jednostka ma jeden <b>typ</b>: walczy <b>wręcz</b> (miecze), <b>strzela</b> (łuk) albo <b>lata</b> (skrzydło).</p>
<div class="unit-pair" style="margin-top:6mm"><div class="card slim" style="text-align:center"><img src="assets/karty/goldDragon.jpg" alt="Karta Złotego Smoka" style="height:92mm"><div class="fine">Karta bohatera Przymierza</div></div><div class="card slim" style="text-align:center"><img src="assets/karty/blackDragon.jpg" alt="Karta Czarnego Smoka" style="height:92mm"><div class="fine">Karta bohatera Hordy</div></div></div>
''', left='Rozdział 1', right='Elementy gry', foot='Co jest w pudełku')
FIGURE_NAMES = {
    'goldDragon': 'Złoty Smok', 'unicornKing': 'Król Jednorożców', 'ancientBear': 'Prastary Niedźwiedź',
    'elfDruid': 'Elf Druid', 'nymph': 'Nimfa', 'pegasus': 'Pegaz',
    'blackDragon': 'Czarny Smok', 'werewolfLord': 'Władca Wilkołaków', 'ironFistOgre': 'Ogr Żelazna Pięść',
    'goblinShaman': 'Goblin Szaman', 'caveSpider': 'Pająk Jaskiniowy', 'shadowBat': 'Nietoperz Cienia',
    'cyclops': 'Cyklop Błyskotek', 'griffin': 'Gryf Złodziej Skarbów', 'hydra': 'Hydra z Zatopionych Ruin',
}


def figures(ids, height):
    """Rendered figures (make figurki, transparent PNGs) in rows of three, each named below."""
    cells = ''.join(
        f'<figure style="margin:0;text-align:center"><img src="assets/figurki/{i}.png" alt="Figurka: {FIGURE_NAMES[i]}" '
        f'style="height:{height};width:100%;object-fit:contain;object-position:center bottom"><figcaption class="fine">{FIGURE_NAMES[i]}</figcaption></figure>'
        for i in ids)
    return f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1mm 4mm;align-items:end">{cells}</div>'


def faction_figures(heroes, helpers):
    """A faction's figures: the three heroes large, their helpers smaller below."""
    return f'''<h3 style="text-align:center;margin:2mm 0 1mm">Bohaterowie</h3>
{figures(heroes, '72mm')}
<h3 style="text-align:center;margin:5mm 0 1mm">Pomocnicy</h3>
{figures(helpers, '52mm')}'''


sheet(f'''<div class="eyebrow">Rozdział 1 · Co jest w pudełku</div><h1>Figurki</h1>
<p class="intro" style="margin-bottom:2mm">Każda jednostka ma swoją figurkę. Kolor podstawki mówi, po czyjej jest stronie: <b>zielony</b> — Przymierze Świtu, <b>bordowy</b> — Mroczna Horda, <b>niebieski</b> — strażnicy kryształów.</p>
<div class="banner" style="margin:1mm 0 2mm">Przymierze Świtu</div>
{faction_figures(['goldDragon', 'unicornKing', 'ancientBear'], ['elfDruid', 'nymph', 'pegasus'])}
''', left='Rozdział 1', right='Elementy gry', foot='Co jest w pudełku')
sheet(f'''<div class="eyebrow">Rozdział 1 · Co jest w pudełku</div><h1>Figurki Hordy</h1>
<div class="banner" style="margin:1mm 0 2mm">Mroczna Horda</div>
{faction_figures(['blackDragon', 'werewolfLord', 'ironFistOgre'], ['goblinShaman', 'caveSpider', 'shadowBat'])}
''', cls='horde', left='Rozdział 1', right='Elementy gry', foot='Co jest w pudełku')
sheet(f'''<div class="eyebrow">Rozdział 1 · Co jest w pudełku</div><h1>Figurki strażników</h1>
<div style="margin:3mm 0 6mm">{figures(['cyclops', 'griffin', 'hydra'], '52mm')}</div>
<div class="card" style="--accent:var(--navy)"><h3>Jedna figurka na jednym polu</h3><p>Figurki stoją na sześciokątnych podstawkach, które mieszczą się w polu areny i na kafelku mapy. Na jednym polu stoi zawsze tylko jedna figurka — wyjątkiem jest baza frakcji, gdzie może stać kilku jej bohaterów.</p></div>
<div class="card" style="margin-top:4mm"><h3>Figurki z drukarki</h3><p>Figurki są przygotowane do druku na drukarce żywicznej. Jeśli ich nie macie, wystarczą dowolne pionki w trzech kolorach — byle było jasne, kto jest kim.</p></div>
''', cls='neutral', left='Rozdział 1', right='Elementy gry', foot='Co jest w pudełku')

# 2. Units
chapter('2', 'Kto jest kim — jednostki', 'units')
sheet(f'''<div class="eyebrow">Rozdział 2 · Kto jest kim</div><h1>Przymierze Świtu</h1>
<p style="margin-bottom:2mm">Każda frakcja ma <b>trzech bohaterów</b> i <b>trzech pomocników</b>. Każdy gracz prowadzi jednego bohatera. Pomocnicy należą do całej frakcji — przed każdą bitwą bohater zabiera ze sobą dwóch.</p>
<p class="flavor fine" style="text-align:center;margin-bottom:2.5mm">Zielony sztandar ze złotym drzewem. Ci, którzy pamiętają, jak wyglądała kraina, gdy Drzewo świeciło pełnym blaskiem.</p>
{units_html('Przymierze Świtu')}
''', left='Rozdział 2', right='Jednostki', foot='Przymierze Świtu', key='units')
sheet(f'''<div class="eyebrow">Rozdział 2 · Kto jest kim</div><h1>Mroczna Horda</h1>
<p class="flavor" style="text-align:center;margin-bottom:2mm">Bordowy sztandar z rogatym hełmem. Ci, którzy uważają, że światło Drzewa należy się najsilniejszym.</p>
<p class="fine" style="text-align:center;margin-bottom:3mm">Horda nazywa bohaterów <b>wodzami</b>, a pomocników <b>poplecznikami</b> — w zasadach to po prostu bohaterowie i pomocnicy.</p>
{units_html('Mroczna Horda')}
''', cls='horde', left='Rozdział 2', right='Jednostki', foot='Mroczna Horda')
sheet(f'''<div class="eyebrow">Rozdział 2 · Kto jest kim</div><h1>Strażnicy kryształów</h1>
<p class="flavor" style="text-align:center;margin-bottom:4mm">Niebieski herb z kryształem. Ani dobrzy, ani źli — po prostu nie oddają tego, co do nich trafiło.</p>
<div class="units" style="grid-template-columns:1fr">{units_html('Strażnicy kryształów').replace('<div class="units">', '').rsplit('</div>', 1)[0]}</div>
<div class="paper-note" style="margin-top:4mm"><b>Karty do pojedynku.</b> W pojedynku na planszy (rozdział 9) strażnik walczy kartą z <b>błękitnym rewersem</b>: mniej Życia i zdolność do walki jeden na jednego.</div>
<div style="display:flex;justify-content:center;gap:6mm;margin-top:3mm">{''.join(f'<img src="assets/karty/{g}_pojedynek.jpg" alt="Karta do pojedynku: {FIGURE_NAMES[g]}" style="width:34mm">' for g in ('cyclops', 'griffin', 'hydra'))}</div>
''', cls='neutral', left='Rozdział 2', right='Jednostki', foot='Strażnicy kryształów')

# 3 + 4. Winning and levels
chapter('3', 'Jak wygrać', 'win')
chapter('4', 'Poziom gry — zanim zaczniecie', 'levels')
lv = md_table('Wybierzcie jeden z trzech poziomów.')
sheet(f'''<div class="eyebrow">Rozdział 3</div><h1>Jak wygrać</h1>
<div class="wins">
<div class="card"><h3>Przymierze Świtu wygrywa, gdy…</h3><ul class="rules"><li>zaniesie do Kryształowego Drzewa wszystkie potrzebne kryształy: <b>2</b>, gdy Przymierze ma jednego bohatera, <b>3</b> — gdy dwóch.</li></ul><p style="margin-top:2mm">Pokonanie bohaterów Hordy nie wystarczy — liczą się tylko kryształy.</p></div>
<div class="card horde"><h3>Mroczna Horda wygrywa, gdy…</h3><ul class="rules"><li>skończy się ostatnia runda (limit: 8 / 12 / 18 / 24 rund), <b>albo</b></li><li>pokona wszystkich bohaterów Przymierza, <b>albo</b></li><li>odprawi <b>rytuał</b>: na koniec trzech kolejnych rund jeden jej bohater stoi na Drzewie, a pozostali żyjący — tuż obok Drzewa.</li></ul></div>
</div>
<div class="quote" style="margin:4mm 0 1mm;font-size:14pt;padding:3mm 8mm">„Drzewo nie pyta, kto jest silniejszy. Pyta tylko, kto zdąży.”</div>
<p class="see" style="text-align:center">Ostatni bohaterowie obu stron padają w jednej bitwie? Zobacz rozdział 14.</p>
<div class="divider" style="margin:3mm 0">✦</div>
<div class="eyebrow">Rozdział 4</div><h2>Poziom gry — zanim zaczniecie</h2>
<p>Wybierzcie jeden z trzech poziomów. Nic więcej nie trzeba ustawiać.</p>
{table(lv, 'table')}
<p class="fine" style="margin-top:3mm;font-size:11pt">Na żadnym poziomie nie rzuca się kością: cios zadaje tyle obrażeń, ile wynosi Atak. Kość to utrudnienie dla chętnych (rozdział 13).</p>
''', left='Rozdziały 3–4', right='Cel gry i poziomy', foot='Jak wygrać · Poziom gry', key='win')

# 5. Setup
chapter('5', 'Przygotowanie', 'setup')
maps = md_table('2. **Wybierzcie długość mapy:**')
sheet(f'''<div class="eyebrow">Rozdział 5</div><h1>Przygotowanie</h1>
<p class="intro">Rozłożenie gry zajmuje kilka minut. Po kolei:</p>
<div class="steps" style="grid-template-columns:1fr">
<div class="step" style="min-height:0"><div class="number">1</div><h3>Wybierzcie tryb</h3><p><b>Kooperacja</b> (1–2 graczy): wszyscy gracie Przymierzem przeciwko automatowi zła (rozdział 12). <b>Rywalizacja</b> (2–4 graczy): jedni grają Przymierzem, drudzy Hordą; najwyżej 2 graczy na frakcję.</p></div>
<div class="step" style="min-height:0"><div class="number">2</div><h3>Wybierzcie długość mapy</h3><p>Dłuższa mapa to więcej pól do odkrycia, więcej skarbów i dłuższa wyprawa. Na pierwszą partię wybierzcie mapę krótką.</p></div>
</div>
<div style="margin:4mm 0">{table(maps, 'table')}</div>
<div class="step" style="min-height:0"><div class="number">3</div><h3>Ułóżcie mapę</h3><p>Trójkąt: Drzewo na szczycie, baza Przymierza w lewym dolnym rogu, baza Hordy w prawym. Lewą połowę wypełnijcie zakrytymi kafelkami z zielonej talii, prawą — z bordowej. Pola na samym środku należą na zmianę do jednej i drugiej strony (zygzakiem).</p></div>
''', left='Rozdział 5', right='Przygotowanie', foot='Przygotowanie', key='setup')
sheet('''<div class="pic-left" style="grid-template-columns:1fr 92mm;gap:5mm;align-items:start"><div>
<div class="step" style="min-height:0;margin-bottom:4mm"><div class="number">✦</div><h3>Skarby i strażnicy</h3><p>Wmieszajcie między zakryte pola kafelki skarbów i <b>siedliska strażników</b> — tyle, ile kryształów jest na mapie. Gryf mieszka po stronie Przymierza, Cyklop i Hydra po stronie Hordy. Na każdym siedlisku połóżcie kryształ.</p>
<p style="margin-top:1.5mm"><b>Stos skarbów mapy:</b> odłóżcie tyle Eliksirów Odrodzenia i losowych innych skarbów, ile podaje tabela, potasujcie i połóżcie zakryte obok mapy. Kto wejdzie na kafelek skarbu, bierze wierzchnią kartę. Reszta kart to <b>talia skarbów</b> (skarby na start i od strażników).</p></div>
<div class="step" style="min-height:0"><div class="number">4</div><h3>Odkryjcie</h3><p>Drzewo, obie bazy i pola sąsiadujące z bazami.</p></div>
</div><div><img src="assets/mapa_przyklad.png" alt="Przykładowa mapa średnia"><p class="caption">Przykład: mapa średnia (8 rzędów) — tu już cała odkryta. U góry Drzewo, w dolnych rogach bazy.</p></div></div>
<div class="steps" style="margin-top:5mm">
<div class="step" style="min-height:0"><div class="number">5</div><h3>Bohaterowie</h3><p>Każdy gracz wybiera bohatera i stawia go w bazie swojej frakcji. Pomocnicy obu frakcji czekają przy planszy. Na mapie długiej i bardzo długiej Przymierze dobiera skarby na start.</p></div>
<div class="step" style="min-height:0"><div class="number">6</div><h3>Tor rund</h3><p>Połóżcie <b>kryształowy znacznik</b> w gnieździe „1” toru rund. Gniazda 8, 12, 18 i 24 są wyróżnione — to limity rund czterech map.</p></div>
</div>
<div class="terrain-pair" style="grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:6mm">
<div class="tile"><img src="assets/kafelki/lairGriffin_1.png" alt="" style="height:30mm"><div class="name">Gniazdo Gryfa</div><div class="fine">ziemie Przymierza</div></div>
<div class="tile" style="--accent:var(--horde)"><img src="assets/kafelki/lairCyclops_1.png" alt="" style="height:30mm"><div class="name">Jaskinia Cyklopa</div><div class="fine">ziemie Hordy</div></div>
<div class="tile" style="--accent:var(--horde)"><img src="assets/kafelki/lairHydra_1.png" alt="" style="height:30mm"><div class="name">Ruiny Hydry</div><div class="fine">ziemie Hordy</div></div>
</div>
''', left='Rozdział 5', right='Przygotowanie', foot='Przygotowanie')

# 6. Round
chapter('6', 'Przebieg rundy', 'round')
sheet('''<div class="eyebrow">Rozdział 6</div><h1>Przebieg rundy</h1>
<div class="pic-right" style="grid-template-columns:1fr 74mm"><div>
<p class="intro">Gra toczy się w <b>rundach</b>. W każdej rundzie każdy żyjący bohater ma jedną <b>turę</b>:</p>
<ul class="rules"><li><b>w rywalizacji</b> — na zmianę: bohater Przymierza, bohater Hordy, bohater Przymierza…</li><li><b>w kooperacji</b> — najpierw wszyscy gracze, potem bohaterowie automatu.</li></ul>
</div><div><img src="assets/round_track.png" alt="Tor rund"><p class="caption">Tor rund z kryształowym znacznikiem</p></div></div>
<div class="banner">Koniec rundy</div>
<p>Gdy wszyscy skończą swoje tury, sprawdźcie po kolei:</p>
<div class="steps" style="grid-template-columns:repeat(3,1fr)">
<div class="step" style="min-height:0;padding-left:14mm"><div class="number">1</div><h3>Rytuał?</h3><p>Czy jeden bohater Hordy stoi na Drzewie, a pozostali żyjący tuż obok? Jeśli tak — rytuał trwa (rozdział 7).</p></div>
<div class="step" style="min-height:0;padding-left:14mm"><div class="number">2</div><h3>Limit?</h3><p>Czy to była ostatnia runda waszej mapy? Jeśli tak — wygrywa Horda.</p></div>
<div class="step" style="min-height:0;padding-left:14mm"><div class="number">3</div><h3>Znacznik</h3><p>Przesuńcie kryształowy znacznik o jedno gniazdo dalej.</p></div>
</div>
<div class="figure" style="width:20mm;margin:3mm auto 0;padding:1.6mm"><img src="assets/round_crystal.png" alt="Kryształowy znacznik rundy"></div>
<div class="quote" style="margin-top:3mm;font-size:15pt">„Każde gniazdo toru to jeden dzień, w którym blask Drzewa słabnie. Nie marnujcie ich.”</div>
''', left='Rozdział 6', right='Runda', foot='Przebieg rundy', key='round')

# 7. Adventure
chapter('7', 'Wędrówka po krainie', 'adventure')
terr = md_table('W swojej turze bohater ma **3 punkty ruchu**.')
sheet(f'''<div class="eyebrow">Rozdział 7</div><h1>Wędrówka po krainie</h1>
<h2>Ruch</h2>
<p>W swojej turze bohater ma <b>3 punkty ruchu</b>. Niewykorzystane punkty przepadają.</p>
{table(terr, 'table')}
<p class="flavor" style="margin-top:3mm">Ziemie Przymierza są łagodniejsze: po jasnej stronie trudne są tylko 2 rodzaje terenu, po ciemnej aż 3.</p>
<p>Można wchodzić tylko na <b>odkryte</b> pola. Gdy bohater wejdzie na pole, <b>odwróćcie wszystkie zakryte kafelki dookoła niego</b>.</p>
<div class="paper-note"><b>Jeden bohater na polu.</b> Na pole, na którym stoi bohater twojej frakcji, nie można wejść ani przez nie przejść. Wyjątek: <b>we własnej bazie</b> może stać kilku bohaterów (tak zaczynacie grę).</div>
<div class="banner">Co może się wydarzyć</div>
<ul class="rules">
<li><b>Skarb</b> — bohater go podnosi. Skarb trafia do <b>wspólnego ekwipunku frakcji</b> (rozdział 11).</li>
<li><b>Kryształ bez strażnika</b> — bohater Przymierza od razu go podnosi. Może nieść dowolnie wiele kryształów. Horda kryształów nie podnosi.</li>
<li><b>Drzewo</b> — bohater Przymierza, który wejdzie na Drzewo z kryształami, oddaje mu je wszystkie.</li>
<li><b>Strażnik</b> — wejście na jego pole to wyzwanie do walki (rozdział 10). Może to zrobić tylko bohater Przymierza.</li>
<li><b>Wrogi bohater</b> — wejście na jego pole rozpoczyna <b>bitwę</b> (rozdział 8). Zwycięzca zostaje na tym polu.</li>
</ul>
<p class="fine" style="margin-top:1mm">Wejście na pole z walką kosztuje tyle punktów ruchu, ile koszt terenu tego pola — jak każdy krok. Bitwa nie kończy ruchu: jeśli bohater wygra i zostały mu punkty, może iść dalej.</p>
''', left='Rozdział 7', right='Mapa przygody', foot='Wędrówka po krainie', key='adventure')
sheet('''<div class="terrain-pair" style="grid-template-columns:repeat(6,1fr);gap:2.5mm;margin-bottom:4mm">
<div class="tile" style="padding:1.5mm"><img src="assets/kafelki/meadow_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt">Polana</div><div class="fine">łatwy · 1</div></div>
<div class="tile" style="padding:1.5mm"><img src="assets/kafelki/river_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt">Rzeka</div><div class="fine">trudny · 2</div></div>
<div class="tile" style="padding:1.5mm"><img src="assets/kafelki/mountain_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt">Góry</div><div class="fine">przeszkoda</div></div>
<div class="tile" style="padding:1.5mm;--accent:var(--horde)"><img src="assets/kafelki/scorched_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt;color:var(--horde)">Spalona Ziemia</div><div class="fine">łatwy · 1</div></div>
<div class="tile" style="padding:1.5mm"><img src="assets/kafelki/swamp_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt;color:var(--horde)">Mroczne Bagno</div><div class="fine">trudny · 2</div></div>
<div class="tile" style="padding:1.5mm"><img src="assets/kafelki/thorns_1.png" alt="" style="height:22mm"><div class="name" style="font-size:10pt;color:var(--horde)">Trujące Ciernie</div><div class="fine">przeszkoda</div></div></div>
<h2>Śmierć bohatera</h2>
<p>Poległy bohater zostaje na mapie jako martwy, a jego gracz czeka. <b>Kryształy, które niósł, zostają na polu bitwy</b> — Horda może ich pilnować, ale nie może ich zabrać.</p>
<p>Poległego bohatera może wskrzesić <b>żyjący</b> bohater jego frakcji, używając <b>Eliksiru Odrodzenia</b>. Wskrzeszony staje na <b>wybranym wolnym polu obok</b> tego, kto użył eliksiru, i wraca do gry od następnej rundy (jeśli obok nie ma wolnego pola, trzeba najpierw przejść gdzie indziej). Jeśli wszyscy bohaterowie frakcji polegną, frakcja przegrywa — eliksir w ekwipunku już nie pomoże.</p>
<div class="divider">✧</div>
<h2>Rytuał</h2>
<p>Na koniec każdej rundy sprawdźcie: czy <b>jeden bohater Hordy stoi na Drzewie</b>, a <b>wszyscy pozostali żyjący bohaterowie Hordy stoją tuż obok Drzewa</b>? (Gdy Horda ma jednego bohatera, wystarczy, że stoi na Drzewie.) Jeśli tak — rytuał się zaczyna. Jeśli tak będzie na koniec <b>trzech kolejnych</b> rund, Horda wygrywa. Jeśli choć jeden z nich odejdzie albo zginie, rytuał zostaje przerwany.</p>
<div class="quote" style="margin:5mm 0;font-size:15pt">„Mówią, że podczas rytuału kryształowe liście Drzewa ciemnieją jeden po drugim, jak gasnące świece.”</div>
<div class="terrain-pair" style="margin:4mm 0 3mm">
<div class="tile"><img src="assets/baza_przymierza.jpg" alt="Baza Przymierza" style="height:30mm"><div class="name">Baza Przymierza</div><div class="fine">tu zaczynają bohaterowie Świtu</div></div>
<div class="tile"><img src="assets/baza_hordy.jpg" alt="Baza Hordy" style="height:30mm"><div class="name">Baza Hordy</div><div class="fine">tu zaczyna Mroczna Horda</div></div></div>
<p class="see">Atak na bazę pełną bohaterów, kryształ pod stopami, rytuał a wskrzeszeni — szczegóły w rozdziale 14.</p>
''', left='Rozdział 7', right='Mapa przygody', foot='Wędrówka po krainie')

ex_map = MD[MD.index('### Przykład: tura na mapie'):MD.index('## 8. Bitwa na arenie')]
ex_steps = re.findall(r'^\d+\. (.+)$', ex_map, re.M)
ex_fight = md_inline(re.search(r'^\*\*Walka w środku ruchu\.\*\* (.+)$', ex_map, re.M).group(1))
sheet(f"""<div class="eyebrow">Rozdział 7 · Przykład</div><h1>Tura na mapie</h1>
<p class="intro">{md_inline(ex_map.split(chr(10) + chr(10))[1])}</p>
<div style="display:flex;justify-content:center;margin:3mm 0 1mm">
{hexes([(0, 0, 'meadow_1', 'start', 'new', None), (1, 0, 'forest_1', '1', '', None), (2, -1, 'treasureDawn_1', '2', '', 'figurki/unicornKing.png'),
        (2, 0, 'meadow_1', '', '', None), (1, -1, 'hill_1', 'nowy', 'new', None), (2, -2, 'river_1', 'nowy', 'new', None),
        (3, -1, 'mountain_1', '✕', 'no', None), (3, 0, 'back_dawn', '', '', None), (1, -2, 'back_dawn', '', '', None)], 30)}</div>
<p class="caption" style="margin:0 0 3mm">Numery pokazują drogę Jednorożca, „nowy” — kafelki odkryte w tej turze, zielone rewersy — pola wciąż zakryte.</p>
<ol class="rules example">{''.join(f'<li>{md_inline(x)}</li>' for x in ex_steps)}</ol>
<div class="card" style="margin-top:3mm"><h3>Walka w środku ruchu</h3><p>{ex_fight}</p></div>
<div class="paper-note" style="margin-top:4mm"><b>Pamiętaj:</b> punkty ruchu nie przechodzą na następną turę, a kafelki odwraca się po każdym kroku — dopiero wtedy wiadomo, dokąd warto iść dalej.</div>
""", left='Rozdział 7', right='Przykład', foot='Przykład: tura na mapie')

# 8. Arena battle
chapter('8', 'Bitwa na arenie', 'arena')
sheet('''<div class="eyebrow">Rozdział 8 · poziom normalny i trudny</div><h1>Bitwa na arenie</h1>
<p class="intro flavor">Gdy dwie drużyny spotykają się w krainie, ziemia rozstępuje się i przenosi je na starą arenę — zieloną, jeśli walka wybuchła na ziemiach Przymierza, albo ognistą, jeśli na ziemiach Hordy.</p>
<div class="figure" style="margin-top:3mm"><img class="battle-img" src="assets/arena_przymierze.jpg" alt="Arena Przymierza" style="height:96mm"></div>
<p class="caption">Arena Przymierza. Podświetlone skrajne kolumny to pola startowe, kępy kwiatów i ruiny to przeszkody.</p>
<div class="cols" style="margin-top:3mm"><div><h3>Kto walczy</h3><p>Każdy bohater zabiera <b>dwóch żywych pomocników</b> ze wspólnej puli swojej frakcji (jeśli zostało ich mniej — tylu, ilu jest). Walka toczy się <b>3 na 3</b>, a przeciw strażnikowi <b>3 na 1</b>.</p></div>
<div><h3>Ustawienie</h3><p>Każda strona stawia swoje jednostki na dowolnych polach swojej <b>skrajnej kolumny</b>. <b>Atakujący ustawia się pierwszy</b>, broniący widzi jego ustawienie. Strażnik stoi pośrodku swojej kolumny.</p></div></div>
<h3 style="margin-top:2mm">Kolejność</h3>
<p>W każdej rundzie bitwy każda jednostka ma <b>jedną aktywację</b>, od najszybszej do najwolniejszej. <b>Przy równej Szybkości pierwszy działa broniący się.</b></p>
''', left='Rozdział 8', right='Walka', foot='Bitwa na arenie', key='arena')
sheet('''<h2>Aktywacja</h2>
<ol class="rules">
<li><b>Ruch</b> — o tyle pól, ile wynosi Szybkość (można zostać w miejscu). Nie wolno przejść przez pole zajęte przez inną jednostkę (sojusznika ani wroga) ani przez przeszkodę. Jednostki latające przelatują nad wszystkim, ale lądują na wolnym polu.</li>
<li><b>Atak</b> (jeśli chcesz): <b>wręcz</b> — w wroga na sąsiednim polu; <b>strzelec</b> — w dowolnego wroga, którego widać. Przeszkoda na linii zasłania cel, jednostki nie zasłaniają.</li>
</ol>
<div class="cols"><div><h3>Obrażenia</h3><p>Cios zadaje tyle obrażeń, ile wynosi <b>Atak</b>. Połóż na karcie krople obrażeń. <b>Nie ma kontrataków.</b> Gdy obrażenia dorównają Życiu, jednostka pada i schodzi z areny.</p></div>
<div><h3>Zdolności</h3><p>Opisy są na kartach. Zdolności „raz na bitwę” po użyciu oznacz znacznikiem <b>zużytej zdolności</b>. Efekty, które trwają do następnej aktywacji lub ataku, oznacz odpowiednim znacznikiem.</p></div></div>
<div class="horde-panel" style="--accent:var(--horde);grid-template-columns:60% 40%"><img src="assets/arena_horda.jpg" alt="Arena Hordy" style="height:72mm"><div class="copy" style="padding:5mm"><h3 style="color:var(--horde)">Koniec bitwy</h3><p style="font-size:11.4pt">Bitwa trwa, <b>dopóki jedna strona nie straci wszystkich jednostek</b> — nawet jeśli jej bohater padł wcześniej.</p></div></div>
<ul class="rules">
<li>Ocalali <b>odzyskują pełne Życie</b>.</li>
<li>Polegli <b>pomocnicy giną na stałe</b> (chyba że wskrzesi ich Eliksir Odrodzenia).</li>
<li>Poległy <b>bohater</b> zostaje martwy na mapie (rozdział 7).</li>
</ul>
<p class="see">Dokładne działanie zdolności, strzelanie z bliska i bardzo długie bitwy opisuje rozdział 14.</p>
''', left='Rozdział 8', right='Walka', foot='Bitwa na arenie')

ex_b = MD[MD.index('### Przykład: początek bitwy'):MD.index('## 9. Pojedynek')]
MARK = {'Spowolnienia': 'slowed', 'zużytej zdolności': 'ability_used', 'Klątwy': 'cursed'}


def ex_items(title):
    part = ex_b[ex_b.index(f'**{title}**'):]
    part = part[:part.find('\n\n**', 5)] if '\n\n**Runda' in part[5:] else part
    items = [md_inline(l[2:]) for l in part.split('\n') if l.startswith('- ')]
    # The status markers named in the text get their pictures.
    for word, file in MARK.items():
        items = [x.replace(f'znacznik {word}', f'znacznik {word} <img class="mk" src="assets/znaczniki/{file}.png" alt="">') for x in items]
    return '<ul class="rules example">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'


ex_intro = md_inline(ex_b.split('\n\n')[1])
team = lambda ids, cap: ''.join(f'<figure><img src="assets/karty/{i}.jpg" alt=""><figcaption>{FIGURE_NAMES[i]}</figcaption></figure>' for i in ids)
sheet(f"""<div class="eyebrow">Rozdział 8 · Przykład</div><h1>Początek bitwy</h1>
<p style="font-size:11.2pt;line-height:1.25">{ex_intro}</p>
<div class="example-cards">{team(['werewolfLord', 'goblinShaman', 'caveSpider'], '')}<div style="width:6mm"></div>{team(['unicornKing', 'elfDruid', 'nymph'], '')}</div>
<div class="order"><b>Kolejność:</b><span class="d">Jednorożec 8</span>➜<span class="h">Wilkołak 7</span>➜<span class="d">Elf i Nimfa 4</span>➜<span class="h">Goblin i Pająk 3</span></div>
<h3>Runda 1</h3>{ex_items('Runda 1')}
<h3>Runda 2</h3>{ex_items('Runda 2')}
""", left='Rozdział 8', right='Przykład', foot='Przykład: bitwa')

# 9 + 10
chapter('9', 'Pojedynek na planszy', 'duel')
chapter('10', 'Strażnicy kryształów', 'guardians')
sheet('''<div class="eyebrow">Rozdział 9 · poziom łatwy</div><h1>Pojedynek na planszy</h1>
<p class="intro flavor">Najprostsza walka: dwóch bohaterów staje naprzeciw siebie i nikt nie ucieka.</p>
<ul class="rules">
<li>Walczą <b>tylko dwie jednostki</b>: bohater kontra bohater albo bohater kontra strażnik. Bez pomocników, bez areny, <b>bez ruchu</b>.</li>
<li>Pierwszy uderza ten, kto ma większą Szybkość. Przy remisie — ten, kto się broni.</li>
<li>Na zmianę zadajecie sobie ciosy równe Atakowi, aż ktoś padnie.</li>
<li><b>Strażnik walczy kartą z błękitnym rewersem</b> (rozdział 2): mniej Życia i zdolność do walki jeden na jednego. Na poziomie łatwym zdolności nie działają — liczy się tylko Życie z tej karty.</li>
</ul>
<div class="divider">✦</div>
<div class="eyebrow">Rozdział 10</div><h2>Strażnicy kryształów</h2>
<p class="flavor">Strażnicy nie służą nikomu. Pilnują kryształów, bo kryształy są ładne — i bo nikt jeszcze nie zdołał im ich odebrać.</p>
<ul class="rules">
<li>Tylko <b>Przymierze</b> walczy ze strażnikami. Horda nie może wejść na pole strażnika ani przez nie przejść.</li>
<li>Strażnik ma <b>jedną aktywację na rundę</b>, jak każda jednostka. Jego zdolność działa <b>przy każdym ataku</b>, bez limitu.</li>
<li>Strażnik jest twardy: drużyna zwykle wygrywa, ale często traci przy tym pomocnika. Dobrze iść do niego z <b>pełną drużyną</b>.</li>
<li><b>Wygrana:</b> zwycięski bohater zostaje na siedlisku i <b>od razu podnosi kryształ</b>. Do tego <b>strażnik zostawia skarb</b>: Przymierze dobiera z talii jeden losowy skarb bitewny, którego jeszcze nie ma w grze (nie Eliksir Odrodzenia i nie Magiczną Mapę).</li>
<li><b>Przegrana:</b> bohater ginie na polu strażnika, a strażnik zostaje tam z pełnym Życiem.</li>
</ul>
<div class="paper-note"><b>Gryf nazywa się Złodziejem Skarbów nie bez powodu.</b> W jego gnieździe zawsze znajdzie się coś błyszczącego oprócz kryształu.</div>
<p style="margin-top:3mm"><b>Kto kieruje strażnikiem?</b> Strażnik walczy według zasad automatu zła (rozdział 12). W rywalizacji kieruje nim <b>gracz Hordy</b>; w kooperacji i w grze jednoosobowej — ten sam gracz, który walczy, uczciwie według zasad.</p>
''', cls='neutral', left='Rozdziały 9–10', right='Pojedynki i strażnicy', foot='Pojedynek · Strażnicy', key='duel')

# 11. Treasures
chapter('11', 'Skarby', 'treasures')
tre = md_table('| Skarb | Działanie | Kiedy |')
tre = [['Skarb', 'Działanie', 'Kiedy']] + md_table('W bitwie** skarbu')[0:0] if False else None
rows = []
started = False
for l in MD[MD.index('| Skarb | Działanie | Kiedy |'):].split('\n'):
    s = l.strip()
    if not s.startswith('|'):
        break
    if re.match(r'^\|[-:| ]+\|$', s):
        continue
    rows.append([md_inline(c.strip()) for c in s.strip('|').split('|')])
sheet(f'''<div class="eyebrow">Rozdział 11</div><h1>Skarby</h1>
<p>Skarby są <b>wspólne dla całej frakcji</b>. Każdy skarb działa <b>raz</b>, potem wraca do pudełka. Karty skarbów trzymajcie zakryte przed przeciwnikiem — nie musi wiedzieć, co znaleźliście.</p>
<ul class="rules"><li><b>Na mapie</b> skarbu używa bohater w swojej turze.</li><li><b>W bitwie</b> skarbu używa się na początku aktywacji własnej jednostki, zanim się ruszy albo zaatakuje.</li></ul>
{table(rows, 'table compact')}
''', left='Rozdział 11', right='Skarby', foot='Skarby', key='treasures')
ids = ['resurrection', 'heal', 'seed', 'damage_scroll', 'sword', 'shield', 'vitality', 'boots', 'horn', 'map', 'lightning', 'hourglass', 'courage_horn', 'teleport', 'stone']
gal = ''.join(f'<div><img src="assets/karty/{i}.jpg" alt=""></div>' for i in ids)
sheet(f'''<div class="eyebrow">Rozdział 11 · Skarby</div><h1>Karty skarbów</h1>
<p class="flavor" style="margin-bottom:4mm">Kraina pamięta dawne czasy. W ruinach, pod korzeniami i w gniazdach strażników wciąż leżą rzeczy, które komuś kiedyś uratowały życie.</p>
<div class="gallery g5">{gal}</div>
<div class="paper-note" style="margin-top:5mm"><b>Tarcza Strażnika</b> działa jak reakcja: kładziecie ją na jednostce wcześniej (znacznik Ochrony), a zatrzymuje cały następny cios wymierzony w tę jednostkę.</div>
''', left='Rozdział 11', right='Skarby', foot='Karty skarbów')

# 12. Automaton
chapter('12', 'Gra przeciwko automatowi zła', 'coop')
sheet('''<div class="eyebrow">Rozdział 12 · kooperacja</div><h1>Automat zła</h1>
<p class="intro flavor">Horda nie śpi. Nawet gdy nikt nią nie dowodzi, jej bohaterowie idą prosto przed siebie — do najbliższej ofiary albo do Drzewa.</p>
<p>W kooperacji wszyscy gracze prowadzą Przymierze, a Hordę prowadzą proste zasady. <b>Automat ma tylu bohaterów, ilu jest graczy</b> (na poziomie trudnym — o jednego więcej, ale co najmniej trzech, i 2 losowe skarby na start). Losujcie ich przed grą.</p>
<p><b>Posiłki Hordy:</b> gdy polegnie ostatni żyjący bohater automatu, w bazie Hordy od razu staje kolejny — nieużywany bohater Hordy, a gdy takich już nie ma, jeden z poległych (wylosujcie go). Do gry wchodzi od następnej rundy. Jeśli bazę zajmuje bohater Przymierza, nowy staje na najbliższym wolnym polu. Na poziomie trudnym posiłków nie ma.</p>
<div class="banner">Tura bohatera Hordy</div>
<ol class="rules">
<li>Czy Horda ma Eliksir Odrodzenia, a któryś jej bohater nie żyje? → wypij go i wskrześ poległego.</li>
<li>Czy bohater stoi na Drzewie albo obok Drzewa zajętego przez innego bohatera Hordy? → zostaje tam (pilnuje rytuału).</li>
<li>Czy obok niego stoi bohater Przymierza? → <b>atakuje go</b>.</li>
<li>W przeciwnym razie idzie w stronę <b>najbliższego</b> celu: bohatera Przymierza albo Drzewa (gdy Drzewo zajął już inny bohater Hordy — wolnego pola obok). Przy remisie wybiera bohatera. Omija pola strażników i własnych bohaterów. Zakryte pola traktuje tak, jakby kosztowały 1.</li>
</ol>
<div class="paper-note">Automat nie unika złych walk, ale wybita Horda wraca z bazy (poza poziomem trudnym, gdzie od początku ma o jednego bohatera więcej). Jeśli chcecie większego wyzwania, wybierzcie poziom <b>trudny</b>.</div>
''', cls='horde', left='Rozdział 12', right='Kooperacja', foot='Automat zła', key='coop')
sheet('''<div class="eyebrow">Rozdział 12 · kooperacja</div><h1>Automat w bitwie</h1>
<p>Pomocników do bitwy automat dobiera <b>losowo</b> spośród żywych. Ustawia bohatera pośrodku kolumny, pomocników nad i pod nim. Jednostkami automatu kierujcie według prostych zasad:</p>
<ul class="rules">
<li><b>Zdolności</b> używa przy pierwszej okazji.</li>
<li><b>Każda jednostka</b> atakuje wroga, który ma <b>najmniej Życia</b> — spośród tych, których sięga bez ruchu, a jeśli takich nie ma — spośród tych, do których dojdzie w tej aktywacji. Przy remisie wybiera bohatera.</li>
<li><b>Skarby</b> zużywa przy pierwszej okazji, gdy coś dają — według tabeli poniżej. Pozostałych skarbów automat nie używa.</li>
<li>Jeśli jednostka <b>nikogo nie sięga</b>, idzie w stronę najbliższego wroga.</li>
</ul>
<p>Tak samo — jak bohater automatu — walczy <b>strażnik</b> (rozdział 10).</p>
<div class="banner" style="margin-top:4mm">Skarby automatu</div>
<table class="table"><tr><th>Skarb</th><th>Kiedy automat go używa</th></tr>
<tr><td><b>Miecz Bohatera</b>, <b>Eliksir Żywotności</b>, <b>Kamień Ochrony</b></td><td>bohater automatu w swojej pierwszej aktywacji bitwy</td></tr>
<tr><td><b>Tarcza Strażnika</b></td><td>bohater, któremu zostało 5 Życia albo mniej</td></tr>
<tr><td><b>Wielki Eliksir Uzdrowienia</b></td><td>jednostka, która straciła co najmniej połowę Życia (i co najmniej 4)</td></tr>
<tr><td><b>Nasiono Drzewa</b></td><td>gdy co najmniej dwie jego jednostki straciły po 2 Życia albo więcej</td></tr>
<tr><td><b>Zwój Magicznej Strzały</b></td><td>gdy może nim dobić wroga (wróg ma 3 Życia albo mniej)</td></tr>
<tr><td><b>Błyskawica w Butelce</b></td><td>gdy może dobić wroga (2 Życia albo mniej) albo trafić dwóch wrogów</td></tr>
<tr><td><b>Eliksir Odrodzenia</b></td><td>gdy padł jego bohater — w bitwie albo na mapie</td></tr>
</table>
''', cls='horde', left='Rozdział 12', right='Kooperacja', foot='Automat zła')

# 13. Custom settings
chapter('13', 'Własne ustawienia', 'custom')
sheet('''<div class="eyebrow">Rozdział 13</div><h1>Własne ustawienia</h1>
<p class="intro">Gdy znacie już grę, możecie zamiast gotowego poziomu wybrać pojedyncze ustawienia. Ułatwienia i utrudnienia można dowolnie łączyć.</p>
<p><b>Bitwy:</b> na arenie (3 na 3) albo pojedynki na planszy.</p>
<div class="cols">
<div class="card"><h3>Ułatwienia</h3><ul class="rules">
<li><b>Bez zdolności</b> — żadna jednostka, także strażnik, nie używa zdolności.</li>
<li><b>Same Eliksiry Odrodzenia</b> — zamiast talii skarbów na mapie leżą tylko Eliksiry Odrodzenia (1 / 2 / 3 / 4 na mapie krótkiej / średniej / długiej / bardzo długiej). Strażnicy nic nie zostawiają.</li>
<li><b>Rezerwowy bohater po śmierci</b> — gracz, którego bohater padł, bierze innego, nieużywanego bohatera swojej frakcji. Nowy bohater wkracza na <b>najbliższe wolne pole</b> od miejsca, w którym padł poprzednik — bez wrogiego bohatera i bez strzeżonego kryształu. Wejście nie kosztuje ruchu. W kooperacji automat też wprowadza rezerwowego.</li>
</ul></div>
<div class="card" style="--accent:var(--horde)"><h3>Utrudnienia</h3><ul class="rules">
<li><b>Rzut kością</b> — do każdego ciosu rzućcie kością i dodajcie wynik (−1, 0 albo +1). Cios nigdy nie zadaje mniej niż 0 obrażeń: przy Ataku 1 i wyniku −1 chybia.</li>
<li><b>Dodatkowy bohater Hordy</b> (kooperacja) — automat ma o jednego bohatera więcej.</li>
</ul></div>
</div>
<div class="paper-note" style="margin-top:6mm"><b>Uwaga:</b> w rywalizacji jeden na jednego na mapie długiej i bardzo długiej <b>rezerwowy bohater sprzyja Hordzie</b> — samotny bohater Hordy często zdąży odprawić rytuał, zanim Przymierze się pozbiera.</div>
<div class="quote" style="margin-top:7mm;font-size:15pt">„Każda wyprawa jest inna. Kronikarze spisali, która jest łagodna, a która sprawdzi nawet najdzielniejszych.”</div>
''', left='Rozdział 13', right='Ustawienia', foot='Własne ustawienia', key='custom')


def diff_rows(marker):
    rows = []
    for l in MD[MD.index(marker):].split('\n')[2:]:
        s = l.strip()
        if not s.startswith('|'):
            if rows:
                break
            continue
        if re.match(r'^\|[-:| ]+\|$', s):
            continue
        rows.append([md_inline(c.strip()) for c in s.strip('|').split('|')])
    return rows


def diff_table(marker):
    return table(diff_rows(marker), 'table compact center small')


def pvp_table(marker):
    """Rivalry difficulty: a Przymierze column group and a Horda column group, each in its faction's colours."""
    rows = diff_rows(marker)[1:]
    side = lambda f, cells: ''.join(f'<td class="{f}">{c}</td>' for c in cells)
    head = ('<thead><tr><th rowspan="2">Mapa</th><th colspan="2" class="dawn">Przymierze</th><th colspan="2" class="horde">Horda</th></tr>'
            '<tr><th class="dawn">Łatwy</th><th class="dawn">Normalny</th><th class="horde">Łatwy</th><th class="horde">Normalny</th></tr></thead>')
    body = ''.join(f'<tr><td>{r[0]}</td>{side("dawn", r[1:3])}{side("horde", r[3:5])}</tr>' for r in rows)
    return f'<table class="table compact center small sides">{head}<tbody>{body}</tbody></table>'


sheet(f'''<div class="eyebrow">Rozdział 13 · Własne ustawienia</div><h1>Jak trudny jest który wariant</h1>
<p>Skala od <b>1</b> (bardzo łatwo) do <b>10</b> (bardzo trudno); wyrównana partia to 5–6. Liczby pochodzą z tysięcy partii rozegranych przez komputer — ludzie grają inaczej, więc traktujcie je jako wskazówkę.</p>
<h3>Kooperacja — 1 gracz</h3><p class="fine muted">trudność dla graczy Przymierza</p>
{diff_table('**Kooperacja — 1 gracz**')}
<h3 style="margin-top:5mm">Kooperacja — 2 graczy</h3><p class="fine muted">trudność dla graczy Przymierza</p>
{diff_table('**Kooperacja — 2 graczy**')}
''', left='Rozdział 13', right='Trudność', foot='Jak trudny jest wariant')
sheet(f'''<p>W rywalizacji każda strona ma swoją trudność, a poziom Trudny nie istnieje. Trudność <b>Przymierza</b> i <b>Hordy</b> na tym samym poziomie zawsze daje razem 11 — po 5–6 dla obu stron to partia wyrównana.</p>
<h3>Rywalizacja — 1 na 1</h3><p class="fine muted">trudność dla każdej ze stron</p>
{pvp_table('**Rywalizacja — 1 na 1**')}
<h3 style="margin-top:5mm">Rywalizacja — 2 na 2</h3><p class="fine muted">trudność dla każdej ze stron</p>
{pvp_table('**Rywalizacja — 2 na 2**')}
<div class="quote" style="margin-top:7mm;font-size:14pt">„Kronikarze Drzewa rozegrali tysiące partii, żeby sprawdzić, gdzie czeka łatwa wyprawa, a gdzie prawdziwa próba.”</div>
''', cls='rivalry', left='Rozdział 13', right='Trudność', foot='Jak trudny jest wariant')

# Tips for the first games (between chapters 13 and 14)
chapter('✧', 'Rady na pierwsze wyprawy', 'tips')
tips_md = MD[MD.index('## Rady na pierwsze wyprawy'):MD.index('## 14. Przypadki szczególne')]


def tips(title):
    part = tips_md[tips_md.index(f'### {title}'):]
    part = part[:part.find('\n### ', 5)] if '\n### ' in part[5:] else part
    return '<ul class="rules">' + ''.join(f'<li>{md_inline(l[2:])}</li>' for l in part.split('\n') if l.startswith('- ')) + '</ul>'


sheet(f'''<div class="eyebrow">Dla początkujących</div><h1>Rady na pierwsze wyprawy</h1>
<p class="flavor">{md_inline(re.search(r'> 🧭 \*(.+)\*', tips_md).group(1))}</p>
<div class="card" style="margin-top:3mm"><h3>Przymierze Świtu</h3>{tips('Przymierze Świtu')}</div>
<div class="cols" style="margin-top:4mm"><div class="card" style="--accent:var(--horde)"><h3>Mroczna Horda</h3>{tips('Mroczna Horda')}</div>
<div class="card" style="--accent:var(--navy)"><h3>Na arenie</h3>{tips('Na arenie')}</div></div>
''', cls='rivalry', left='Rady', right='Pierwsze wyprawy', foot='Rady na pierwsze wyprawy', key='tips')

# 14. Special cases
chapter('14', 'Przypadki szczególne', 'edge')
edge = MD[MD.index('## 14. Przypadki szczególne'):MD.index('## 15. Arena')]


def edge_section(title):
    i = edge.index(f'### {title}')
    j = edge.find('\n### ', i + 4)
    j = edge.find('\n---', i) if j < 0 else j
    body = edge[i:j].split('\n')[1:]
    items = []
    for l in body:
        if l.startswith('- '):
            items.append([md_inline(l[2:])])
        elif l.startswith('  - ') and items:
            items[-1].append(md_inline(l[4:]))
    html = '<ul class="rules">'
    for it in items:
        sub = ''.join(f'<li>{x}</li>' for x in it[1:])
        html += f'<li>{it[0]}' + (f'<ul class="rules" style="margin-top:1mm">{sub}</ul>' if sub else '') + '</li>'
    return html + '</ul>'


sheet(f'''<div class="eyebrow">Rozdział 14</div><h1>Przypadki szczególne</h1>
<p class="flavor">Kronikarze Drzewa spisali tu wszystko, o co gracze kłócili się przy ognisku. Zajrzyjcie, gdy coś nie jest oczywiste — w zwykłej partii te zasady rzadko są potrzebne.</p>
<div class="edge"><h3>Na mapie</h3>{edge_section('Na mapie')}
<h3>Rezerwowy bohater</h3>{edge_section('Rezerwowy bohater (ustawienie z rozdziału 13)')}</div>
''', left='Rozdział 14', right='Przypadki szczególne', foot='Przypadki szczególne', key='edge')
battle_edge = edge_section('W bitwie')
sheet(f'''<div class="edge"><h3>W bitwie</h3>{battle_edge}</div>''', left='Rozdział 14', right='Przypadki szczególne', foot='Przypadki szczególne')

# 15. Arena
chapter('15', 'Arena — szybka bitwa', 'arenamode')
arena_md = MD[MD.index('## 15. Arena'):MD.index('## 16. Ściągawka')]


def arena_part(title):
    """The paragraphs (or numbered steps) under a bold heading of chapter 15."""
    i = arena_md.index(f'**{title}**') + len(title) + 4
    j = min([k for k in (arena_md.find('\n**', i), arena_md.find('\n---', i)) if k >= 0])
    paras = [p.strip() for p in arena_md[i:j].split('\n\n') if p.strip()]
    steps = [p for p in paras if re.match(r'^\d+\. ', p)]
    if steps:
        items = re.split(r'\n(?=\d+\. )', '\n'.join(steps))
        return '<ol class="rules">' + ''.join(f'<li>{md_inline(re.sub(r"^\d+\. ", "", x))}</li>' for x in items) + '</ol>'
    return ''.join(f'<p>{md_inline(p)}</p>' for p in paras)


arena_intro = [p.strip() for p in arena_md.split('\n\n')[1:] if p.strip() and not p.startswith('**')][:2]
sheet(f'''<div class="eyebrow">Rozdział 15</div><h1>Arena — szybka bitwa</h1>
<p class="flavor">{md_inline(arena_intro[0].lstrip('> ').replace('⚔️', '').strip().strip('*'))}</p>
<p class="intro">{md_inline(arena_intro[1])}</p>
<h3>Przygotowanie</h3>{arena_part('Przygotowanie')}
<h3>Losowanie skarbów</h3>{arena_part('Losowanie skarbów')}
<div class="cols">
<div class="card"><h3>Bitwa</h3>{arena_part('Bitwa')}</div>
<div class="card" style="--accent:var(--horde)"><h3>Koniec</h3>{arena_part('Koniec')}</div>
</div>
''', left='Rozdział 15', right='Arena', foot='Arena — szybka bitwa', key='arenamode')

# 16. Cheat sheet
chapter('16', 'Ściągawka', 'cheat')
cheat = MD[MD.index('## 16. Ściągawka'):]
cps = [md_inline(p.strip()).replace('\n', '<br>') for p in cheat.split('\n\n')[1:] if p.strip() and not p.startswith('---') and not p.startswith('>')]
# The cheat sheet has numbered parts ("**1. Cel gry**"): each becomes a card; parts 1–3, 4–5
# and the rest with the closing words each fill a page.
groups = []
for p in cps:
    m = re.match(r'^<b>(\d+)\. (.+?)</b>$', p)
    if m:
        groups.append((m.group(2), []))
    elif groups:
        groups[-1][1].append(p)
    else:
        groups.append(('', [p]))
card = lambda title, ps: f'<div class="card cheat" style="margin-bottom:3mm"><h3>{title}</h3>' + ''.join(f'<p>{x}</p>' for x in ps) + '</div>'
ending = md_inline(re.search(r'> 🌳 \*(.+)\*', cheat).group(1))
sheet(f'''<div class="eyebrow">Rozdział 16</div><h1>Ściągawka</h1>
{''.join(card(t, ps) for t, ps in groups[:3])}
''', left='Rozdział 16', right='Ściągawka', foot='Ściągawka', key='cheat')
sheet(f'''{''.join(card(t, ps) for t, ps in groups[3:5])}
''', left='Rozdział 16', right='Ściągawka', foot='Ściągawka')
sheet(f'''{''.join(card(t, ps) for t, ps in groups[5:])}
<div class="divider">❧</div>
<div class="pic-left" style="grid-template-columns:62mm 1fr"><img src="assets/krysztalowe_drzewo.png" alt=""><div class="quote" style="font-size:14.5pt">„{ending}”</div></div>
''', left='Rozdział 16', right='Ściągawka', foot='Ściągawka')

# ---------------------------------------------------------------- assemble
first_page = {}
for n, (_, _, _, _, _, key) in enumerate(pages, start=2):
    if key and key not in first_page:
        first_page[key] = n
first_page.setdefault('levels', first_page['win'])
first_page.setdefault('guardians', first_page['duel'])
toc_html = '<div class="banner">Spis treści</div>'
for num, title, key in toc:
    toc_html += f'<div class="toc-item sub"><strong>{num}</strong><span>{title}</span><span class="dots"></span><span>{first_page[key]}</span></div>'
toc_html += '<div class="divider">✦</div><p class="fine muted" style="text-align:center">Gra przygodowa dla 1–4 graczy od 5 lat · partia trwa od kwadransa do godziny<br>Wersja robocza instrukcji — prototyp do testów</p>'

html = ['<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Strażnicy Kryształowego Drzewa — instrukcja</title><link rel="stylesheet" href="style.css"></head><body>',
        '<div class="hint">Instrukcja • Format A4 • Aby zapisać jako PDF: Ctrl+P → Zapisz jako PDF → marginesy „Brak” → włącz „Grafika w tle”</div>',
        '<div id="overflow-report"></div>',
        '<!-- Strony generuje skrypt z treści docs/INSTRUKCJA.md; można je też edytować ręcznie. Każda strona to blok <section class="sheet">. -->',
        '<!-- OKŁADKA -->',
        '<section class="sheet cover"><img src="assets/okladka_A4_300dpi.png" alt="Strażnicy Kryształowego Drzewa — okładka"></section>']
for n, (cls, left, right, foot, body, key) in enumerate(pages, start=2):
    body = body.replace('@@TOC@@', toc_html)
    html.append(f'\n<!-- STRONA {n}: {foot} -->\n<section class="sheet {cls}">{CORNERS}<div class="inside">'
                f'<header class="running"><span>{left}</span><span class="star">✧</span><span>{right}</span></header><div class="hair"></div>\n'
                f'{body.strip()}\n</div><footer class="footer"><span>Strażnicy Kryształowego Drzewa</span><span>{foot}</span><span class="folio">{n}</span></footer></section>')
html.append('''
<script>
// Podgląd roboczy: strona, na której tekst wychodzi poza ramkę, dostaje czerwony obrys (tylko na ekranie, nie w druku).
// ?show=3,4,5 pokazuje tylko wybrane strony obok siebie (do szybkiego przeglądu).
const show = new URLSearchParams(location.search).get('show');
if (show) {
  const keep = show.split(',');
  document.querySelectorAll('.hint, #overflow-report').forEach((e) => (e.style.display = 'none'));
  Object.assign(document.body.style, { display: 'flex', gap: '6mm', alignItems: 'flex-start', padding: '0', width: 'max-content' });
  document.querySelectorAll('.sheet').forEach((s, i) => {
    if (!keep.includes(String(i + 1))) s.style.display = 'none';
    else s.style.margin = '0';
  });
}
addEventListener('load', () => {
  const bad = [];
  document.querySelectorAll('.sheet:not(.cover)').forEach((s, i) => {
    const inside = s.querySelector('.inside');
    const box = inside.getBoundingClientRect();
    // Content must end above the bottom edge of the text area (the footer sits below it).
    const over = [...inside.querySelectorAll('*')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && (r.bottom > box.bottom + 1 || r.right > box.right + 1);
    });
    if (over) {
      s.classList.add('overflow');
      const r = over.getBoundingClientRect();
      bad.push(s.querySelector('.folio')?.textContent + ' (' + over.tagName.toLowerCase() + '.' + over.className + ' o ' + Math.round(Math.max(r.bottom - box.bottom, r.right - box.right)) + ' px)');
    }
  });
  document.getElementById('overflow-report').textContent = bad.length ? 'Przepełnione strony: ' + bad.join(', ') : 'Wszystkie strony mieszczą się w ramkach.';
  document.title = (bad.length ? 'OVERFLOW ' + bad.join(',') : 'OK') + ' — Strażnicy Kryształowego Drzewa';
});
</script>
</body></html>''')
# Stat letters next to numbers ("+1 A", "−2 S", "Ż 9") become the stat symbols of the cards,
# in text only (tags and their attributes are left alone).
STAT_IMG = {'Ż': ('hp', 'Życie'), 'A': ('attack', 'Atak'), 'S': ('speed', 'Szybkość')}
STAT_AFTER = re.compile(r'([+−\-]?\d+) ?(Ż|A|S)(?=[\s.,;:)/<]|$)')
STAT_BEFORE = re.compile(r'(?<![^\W\d_])(?<!\d)(Ż|A|S) (\d+)')


def stat_img(letter):
    file, name = STAT_IMG[letter]
    return f'<img class="stat" src="assets/staty/{file}.png" alt="{name}">'


def stat_icons(text):
    # The number and its symbol stay on one line.
    text = STAT_AFTER.sub(lambda m: f'<span class="statv">{m.group(1)}{stat_img(m.group(2))}</span>', text)
    return STAT_BEFORE.sub(lambda m: f'<span class="statv">{stat_img(m.group(1))} {m.group(2)}</span>', text)


page = '\n'.join(html)
page = ''.join(part if part.startswith('<') else stat_icons(part) for part in re.split(r'(<[^>]+>)', page))
open(OUT, 'w', encoding='utf-8').write(page)
print('pages', len(pages) + 1, first_page)
