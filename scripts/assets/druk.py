"""Print files of the paper edition: docs/wersja_planszowa/do_druku/*.pdf, A4 at 300 dpi, for a home printer.

Every sheet prints at 100% (never "fit to page"); each has a 50 mm check line in its margin. Pieces have a bleed
past the cut line, so a cut a little off the line shows no white edge. Backs are laid out as the mirror image of
their fronts: glued back to back (or printed on both sides, flipped on the long edge) they meet.

Sources: the cards rendered by the game (scripts/browser/karty.ts -> .tmp/druk/karty/), the tile and arena art
in docs/grafika/ (cut the same way as for the game: scripts/assets/tiles.py, arenas.py, markers.py), the cover and logo.
Sizes follow docs/wersja_planszowa/WYMIARY_ELEMENTOW.md.
Usage: python3 scripts/assets/druk.py [karty] [kafelki] [arena] [znaczniki] [pudelko]   (default: all; or make druk)
"""
import math
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import arenas  # noqa: E402
import markers  # noqa: E402
import tiles  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, 'docs', 'grafika')
CARDS = os.path.join(ROOT, '.tmp', 'druk', 'karty')
OUT = os.path.join(ROOT, 'docs', 'wersja_planszowa', 'do_druku')

DPI = 300
A4 = (2480, 3508)
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
CUT = (120, 120, 120)


def mm(v):
    return round(v * DPI / 25.4)


def font(size_mm, path=SANS):
    return ImageFont.truetype(path, mm(size_mm))


def page(title, n=None, total=None):
    """A white A4 sheet with its name, the sheet number and a 50 mm line to check the print scale."""
    im = Image.new('RGB', A4, 'white')
    d = ImageDraw.Draw(im)
    label = title + (f' · arkusz {n}/{total}' if total and total > 1 else '')
    d.text((mm(8), mm(3)), label, fill=(90, 90, 90), font=font(2.6))
    y = A4[1] - mm(5)
    d.line((mm(8), y, mm(58), y), fill=(0, 0, 0), width=mm(0.3))
    for x in (mm(8), mm(58)):
        d.line((x, y - mm(1.2), x, y + mm(1.2)), fill=(0, 0, 0), width=mm(0.3))
    d.text((mm(61), y - mm(1.6)), 'ten odcinek ma 50 mm — jeśli nie, drukuj w skali 100% („rozmiar rzeczywisty”)',
           fill=(90, 90, 90), font=font(2.4))
    return im


def save(name, sheets):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    sheets[0].save(path, save_all=True, append_images=sheets[1:], resolution=DPI, quality=92)
    print(f'{name}: {len(sheets)} str.')


def edge_colour(im):
    """Average colour of a picture's outer ring: the bleed is filled with it."""
    w, h = im.size
    ring = [im.getpixel((x, y)) for x in range(4, w - 4, 7) for y in (4, h - 5)] + [im.getpixel((x, y)) for y in range(4, h - 4, 7) for x in (4, w - 5)]
    return tuple(sum(c[i] for c in ring) // len(ring) for i in range(3))


def rounded(w, h, r):
    m = Image.new('L', (w * 2, h * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), r * 2, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def trim_marks(d, xs, ys, box, off):
    """Trim marks in the sheet margins, in line with every cut (a ruler laid across the sheet joins a pair)."""
    x0, y0, x1, y1 = box
    L = mm(5)
    for x in xs:
        d.line((x, y0 - off - L, x, y0 - off), fill=CUT, width=3)
        d.line((x, y1 + off, x, y1 + off + L), fill=CUT, width=3)
    for y in ys:
        d.line((x0 - off - L, y, x0 - off, y), fill=CUT, width=3)
        d.line((x1 + off, y, x1 + off + L, y), fill=CUT, width=3)


# ---------------------------------------------------------------- cards
def card_piece(src, w, h, bleed):
    """The card at its cut size, rounded corners filled with its edge colour, plus the bleed all round."""
    im = Image.open(src).convert('RGB').resize((w, h), Image.LANCZOS)
    colour = edge_colour(im)
    out = Image.new('RGB', (w + 2 * bleed, h + 2 * bleed), colour)
    out.paste(im, (bleed, bleed), rounded(w, h, mm(3.2)))
    return out


def back_piece(src, w, h, bleed):
    """A card back cut to the front's proportions (centred), with the bleed taken from the picture itself."""
    im = Image.open(src).convert('RGB')
    W, H = w + 2 * bleed, h + 2 * bleed
    k = max(W / im.width, H / im.height)
    im = im.resize((math.ceil(im.width * k), math.ceil(im.height * k)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def card_sheets(title, faces, backs, size, cols, rows, gap):
    """Fronts and backs (mirrored left to right), `cols` x `rows` cards per sheet."""
    w, h = mm(size[0]), mm(size[1])
    bleed, g = mm(1.5), mm(gap)
    gw, gh = cols * w + (cols - 1) * g, rows * h + (rows - 1) * g
    x0, y0 = (A4[0] - gw) // 2, (A4[1] - gh) // 2
    per = cols * rows
    total = math.ceil(len(faces) / per)
    fronts, rears = [], []
    for n in range(total):
        f = page(f'{title} — awersy (przód)', n + 1, total)
        b = page(f'{title} — rewersy (tył), ułożone w lustrze awersów', n + 1, total)
        xs = [x0 + c * (w + g) + e for c in range(cols) for e in (0, w)]
        ys = [y0 + r * (h + g) + e for r in range(rows) for e in (0, h)]
        for im in (f, b):
            trim_marks(ImageDraw.Draw(im), xs, ys, (x0, y0, x0 + gw, y0 + gh), bleed + mm(1))
        for i, (face, back) in enumerate(zip(faces[n * per:(n + 1) * per], backs[n * per:(n + 1) * per])):
            c, r = i % cols, i // cols
            x, y = x0 + c * (w + g), y0 + r * (h + g)
            f.paste(card_piece(face, w, h, bleed), (x - bleed, y - bleed))
            b.paste(back_piece(back, w, h, bleed), (A4[0] - x - w - bleed, y - bleed))
        fronts.append(f)
        rears.append(b)
    return fronts, rears


def cards():
    if not os.path.exists(os.path.join(CARDS, 'goldDragon.png')):
        raise SystemExit('Brak kart z gry: najpierw npx tsx scripts/browser/karty.ts (make druk robi to sam).')
    back = lambda f: os.path.join(ART, 'karty', f)
    card = lambda i: os.path.join(CARDS, f'{i}.png')
    dawn = ['goldDragon', 'unicornKing', 'ancientBear', 'elfDruid', 'nymph', 'pegasus']
    horde = ['blackDragon', 'werewolfLord', 'ironFistOgre', 'goblinShaman', 'caveSpider', 'shadowBat']
    guards = ['cyclops', 'griffin', 'hydra']
    faces = [card(i) for i in dawn + horde + guards] + [card(f'{g}_pojedynek') for g in guards]
    backs = ([back('rewers_przymierze_switu.png')] * 6 + [back('rewers_mroczna_horda.png')] * 6
             + [back('rewers_straznicy_krysztalu.png')] * 3 + [back('rewers_straznicy_krysztalu_latwy.png')] * 3)
    # The game's unit card keeps the treasure card's proportions (63 : 88): 80 mm wide is 111.7 mm tall.
    f, b = card_sheets('Karty jednostek 80 × 112 mm', faces, backs, (80, 80 * 88 / 63), 2, 2, 7)
    save('02_karty_jednostek_awersy.pdf', f)
    save('03_karty_jednostek_rewersy.pdf', b)
    treasures = ['resurrection'] * 6 + ['heal', 'seed', 'damage_scroll', 'sword', 'shield', 'vitality', 'boots', 'horn', 'map',
                                        'lightning', 'hourglass', 'courage_horn', 'teleport', 'stone']
    f, b = card_sheets('Karty skarbów 63 × 88 mm', [card(t) for t in treasures], [back('rewers_skarby.png')] * len(treasures), (63, 88), 3, 3, 4.5)
    save('04_karty_skarbow_awersy.pdf', f)
    save('05_karty_skarbow_rewersy.pdf', b)


# ---------------------------------------------------------------- map tiles
TILE_W = 50  # mm between the flat sides; pointy-top like the map in the game
TILE_H = TILE_W * 2 / math.sqrt(3)


def tile_art():
    """Every tile picture at the full size of the sheets in docs/grafika/kafelki_mapy (tiles.py, unscaled)."""
    found = {}
    tiles.save_tile = lambda img, name: found.__setitem__(name, img.convert('RGBA'))
    four = tiles.four
    tiles.sheet('polana_spalona_ziemia.png', four('meadow') + four('scorched'))
    tiles.sheet('las_bagno.png', four('forest') + four('swamp'))
    tiles.sheet('rzeki_mosty.png', four('river') + four('bridge'))
    tiles.sheet('gory_szczeliny.png', four('mountain') + four('chasm'))
    tiles.sheet('jaskinie_ruiny.png', four('darkCave') + four('ruins'))
    tiles.sheet('martwy_gaszcz_trujace_ciernie.png', four('deadThicket') + four('thorns'))
    tiles.transparent_sheet('wzgorza_jalowe_rowniny.png', ['hill_1', 'hill_2', 'barren_1', 'barren_2', 'hill_3', 'hill_4', 'barren_3', 'barren_4'])
    tiles.sheet('bazy_i_siedliska_straznikow.png', ['baseDawn_1', 'baseHorde_1', 'lairCyclops_1', 'lairGriffin_1', 'lairHydra_1'])
    tiles.sheet('skarby.png', four('treasureDawn') + four('treasureHorde'))
    tiles.single('krysztalowe_drzewo.png', 'tree_1')
    tiles.single('rewers_kafelka_przymierze.png', 'back_dawn')
    tiles.single('rewers_kafelka_horda.png', 'back_horde')
    return found


def hex_points(cx, cy, w, h):
    return [(cx, cy - h / 2), (cx + w / 2, cy - h / 4), (cx + w / 2, cy + h / 4), (cx, cy + h / 2), (cx - w / 2, cy + h / 4), (cx - w / 2, cy - h / 4)]


def hex_piece(art, grow):
    """The tile picture as a hexagon `grow` times the cut size (the rest is bleed), on a transparent ground."""
    w, h = round(mm(TILE_W) * grow), round(mm(TILE_H) * grow)
    im = art.resize((w, h), Image.LANCZOS)
    mask = Image.new('L', (w * 2, h * 2), 0)
    ImageDraw.Draw(mask).polygon([(x * 2, y * 2) for x, y in hex_points(w / 2, h / 2, w, h)], fill=255)
    im.putalpha(ImageChops.multiply(im.getchannel('A'), mask.resize((w, h), Image.LANCZOS)))
    return im


def tile_slots():
    """Centres of the 15 tiles on a sheet: 5 rows of 3, every other row shifted half a tile (4 mm between tiles)."""
    gap = 4
    px, py = TILE_W + gap, TILE_H * 0.75 + gap * math.sqrt(3) / 2
    gw, gh = 3 * TILE_W + 2 * gap + px / 2, 4 * py + TILE_H
    x0, y0 = (210 - gw) / 2 + TILE_W / 2, (297 - gh) / 2 + TILE_H / 2
    return [(mm(x0 + c * px + (px / 2 if r % 2 else 0)), mm(y0 + r * py)) for r in range(5) for c in range(3)]


def tile_sheets():
    art = tile_art()
    v = lambda t, n: [f'{t}_{i % 4 + 1}' for i in range(n)]
    dawn = (v('meadow', 8) + v('forest', 7) + v('river', 7) + v('bridge', 7) + v('hill', 7) + v('mountain', 7) + v('chasm', 7)
            + v('treasureDawn', 8) + ['lairGriffin_1', 'baseDawn_1'])
    horde = (v('scorched', 7) + v('barren', 7) + v('swamp', 7) + v('darkCave', 7) + v('ruins', 7) + v('deadThicket', 7) + v('thorns', 7)
             + v('treasureHorde', 8) + ['lairCyclops_1', 'lairHydra_1', 'baseHorde_1'])
    assert len(dawn) == 60 and len(horde) == 60
    slots = tile_slots()
    fronts, backs = [], []
    groups = [('zielony rewers (Przymierze)', dawn, 'back_dawn'), ('bordowy rewers (Horda)', horde, 'back_horde'), ('Kryształowe Drzewo', ['tree_1'], None)]
    total = sum(math.ceil(len(g[1]) / 15) for g in groups)
    n = 0
    pieces = {}
    for label, names, back in groups:
        for start in range(0, len(names), 15):
            n += 1
            f = page(f'Kafelki mapy 50 mm — awersy, {label}', n, total)
            df = ImageDraw.Draw(f)
            for (cx, cy), name in zip(slots, names[start:start + 15]):
                if name not in pieces:
                    pieces[name] = hex_piece(art[name], 1.06)
                p = pieces[name]
                f.paste(p, (cx - p.width // 2, cy - p.height // 2), p)
                df.polygon(hex_points(cx, cy, mm(TILE_W), mm(TILE_H)), outline=(255, 255, 255), width=2)
            fronts.append(f)
            if back:
                b = page(f'Kafelki mapy 50 mm — rewersy, {label}, w lustrze awersów', n, total)
                if back not in pieces:
                    pieces[back] = hex_piece(art[back], 1.12)
                p = pieces[back]
                for cx, cy in slots[:len(names[start:start + 15])]:
                    b.paste(p, (A4[0] - cx - p.width // 2, cy - p.height // 2), p)
                backs.append(b)
    save('06_kafelki_mapy_awersy.pdf', fronts)
    save('07_kafelki_mapy_rewersy.pdf', backs)


# ---------------------------------------------------------------- arena
BOARD = (420, 297)
CELL = 34  # mm between the flat sides


def arena_board(src):
    """The A3 board at 300 dpi: the painted terrain with a regular grid of 34 mm cells drawn over it
    (the game's painting has a slight perspective, a printed board must not), start columns, obstacles."""
    arena = arenas.NAMES[src]
    W, H = mm(BOARD[0]), mm(BOARD[1])
    terrain = Image.open(os.path.join(ART, 'areny', f'arena_walki_{src}.png')).convert('RGBA')
    k = max(W / terrain.width, H / terrain.height)
    terrain = terrain.resize((math.ceil(terrain.width * k), math.ceil(terrain.height * k)), Image.LANCZOS)
    board = terrain.crop(((terrain.width - W) // 2, (terrain.height - H) // 2, (terrain.width - W) // 2 + W, (terrain.height - H) // 2 + H))
    R = mm(CELL) / math.sqrt(3)
    half = mm(CELL) / 2
    # Columns 0..12, half-rows 1..16 at the outer edges: the grid is 20 R x 15 half-rows, centred on the board.
    x0 = (W - 20 * R) / 2 + R
    y0 = (H - 15 * half) / 2 - half
    arenas.HALF_Y = [y0 + h * half for h in range(18)]
    arenas.spacing = lambda y: 1.5 * R
    arenas.center = lambda col, h: (x0 + col * 1.5 * R, arenas.HALF_Y[h])
    arenas.SS = 1
    layer = Image.new('RGBA', board.size)
    draw = ImageDraw.Draw(layer)
    cells = list(arenas.cells())
    for col, h in cells:
        if col in (0, len(arenas.COLUMN_SPAN) - 1):
            draw.polygon(arenas.hexagon(col, h), fill=arenas.START_TINT[arena])
    for colour, width in ((arenas.SHADE, 12), (arenas.LINE, 6)):
        for col, h in cells:
            pts = arenas.hexagon(col, h)
            draw.line(pts + [pts[0]], fill=colour, width=width, joint='curve')
    board.alpha_composite(layer)
    layer = Image.new('RGBA', board.size)
    draw = ImageDraw.Draw(layer)
    for c in arenas.OBSTACLES[arena]:
        pts = arenas.hexagon(*c)
        draw.polygon(pts, fill=arenas.BLOCK_FILL[arena])
        draw.line(pts + [pts[0]], fill=arenas.BLOCK_LINE, width=9, joint='curve')
    board.alpha_composite(layer)
    sheet = Image.open(os.path.join(ART, 'areny', f'arena_walki_{src}_przeszkody.png')).convert('RGBA')
    sp = sorted(arenas.sprites(sheet), key=lambda s: s.width / s.height)
    wide, narrow = sp[-2:], sp[:-2]
    for piece in sorted(arenas.PIECES[arena], key=lambda p: (max(h for _, h in p), p[0][0])):
        arenas.fit(board, (wide if len(piece) > 1 else narrow).pop(0), piece)
    return board.convert('RGB')


def arena_sheets():
    """Each side of the board on two A4 sheets. A home printer leaves a few mm white at the sheet's edge, so
    each half reaches 5 mm past the fold, with the cut line printed there; the outer 5 mm of the frame is left out."""
    out = []
    for src, name in (('przymierze', 'Przymierza'), ('horda', 'Hordy')):
        board = arena_board(src)
        for side, x in (('lewa', 5), ('prawa', 205)):
            p = page(f'Plansza areny {name} — {side} połowa (34 mm na pole)')
            part = board.crop((mm(x), 0, mm(x + 210), mm(297)))
            p.paste(part, (0, 0))
            d = ImageDraw.Draw(p)
            cut = mm(210 - x)
            for y in range(0, A4[1], mm(6)):
                d.line((cut, y, cut, y + mm(3)), fill=(255, 255, 255), width=4)
                d.line((cut + 4, y, cut + 4, y + mm(3)), fill=(0, 0, 0), width=4)
            label = 'tnij tu: środek planszy (zagięcie)'
            tx = cut - mm(52) if side == 'lewa' else cut + mm(3)
            d.rectangle((tx - mm(1), mm(10), tx + mm(50), mm(15)), fill=(255, 255, 255))
            d.text((tx, mm(10.6)), label, fill=(0, 0, 0), font=font(2.8))
            out.append(p)
    save('08_arena_A3_na_4_arkuszach_A4.pdf', out)


# ---------------------------------------------------------------- stickers for the 3D-printed markers, die, round track
def marker_art():
    markers.SIZE = 520
    sheet = Image.open(markers.SRC).convert('RGBA')
    found = {name: markers.fit(sheet.crop(box)) for name, box in markers.named(sheet).items()}
    for name, file in markers.SEPARATE.items():
        found[name] = markers.fit(Image.open(os.path.join(os.path.dirname(markers.SRC), file)).convert('RGBA'))
    return found


def sticker_sheets():
    art = marker_art()
    p = page('Naklejki na znaczniki z drukarki 3D — papier samoprzylepny')
    d = ImageDraw.Draw(p)
    title = lambda y, text: d.text((mm(12), mm(y)), text, fill=(40, 40, 40), font=font(3.6, SERIF))
    # Round markers: Ø 23 mm tokens get a 21 mm sticker (no overhang if it lands a bit off centre).
    title(12, 'Znaczniki stanu — naklejki Ø 21 mm na krążki Ø 23 mm (19 szt.)')
    round_ = (['ability_used'] * 6 + ['attack_up'] * 6 + ['attack_3', 'vitality', 'shield', 'rooted', 'slowed', 'cursed', 'speed_up'])
    D = mm(21)
    for i, name in enumerate(round_):
        cx, cy = mm(22) + (i % 7) * mm(26), mm(32) + (i // 7) * mm(26)
        im = art[name]
        k = D * 1.04 / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        p.paste(im, (cx - im.width // 2, cy - im.height // 2), im)
        d.ellipse((cx - D // 2, cy - D // 2, cx + D // 2, cy + D // 2), outline=CUT, width=2)
    # Damage drops: two-sided 15.6 x 20 mm, one sticker per face, a little smaller than the drop.
    title(100, 'Krople obrażeń — naklejki 14 × 18 mm, po jednej na stronę: 6 × „1” + 6 × „2”, 10 × „3” + 10 × „5”')
    drops = ['damage_1'] * 6 + ['damage_2'] * 6 + ['damage_3'] * 10 + ['damage_5'] * 10
    for i, name in enumerate(drops):
        cx, cy = mm(20) + (i % 11) * mm(17), mm(118) + (i // 11) * mm(23)
        im = art[name]
        k = min(mm(14) / im.width, mm(18) / im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        p.paste(im, (cx - im.width // 2, cy - im.height // 2), im)
        d.rectangle((cx - mm(7.5), cy - mm(9.5), cx + mm(7.5), cy + mm(9.5)), outline=(200, 200, 200), width=1)
    # The die: a 16 mm cube, faces -1, -1, 0, 0, +1, +1 (14 mm stickers).
    title(190, 'Kość −1 / 0 / +1 — naklejki 14 × 14 mm na kostkę 16 mm')
    for i, face in enumerate(['−1', '−1', '0', '0', '+1', '+1']):
        x, y = mm(14) + i * mm(19), mm(200)
        d.rounded_rectangle((x, y, x + mm(14), y + mm(14)), mm(1.5), fill=(247, 240, 222), outline=(140, 110, 60), width=4)
        f = font(7, SERIF)
        tw = d.textlength(face, font=f)
        d.text((x + (mm(14) - tw) / 2, y + mm(2.6)), face, fill=(60, 40, 20), font=f)
    # Crystal sockets on the round track are for the 3D print: the picture is only for a track printed in one colour.
    title(222, 'Kryształy (3 szt.) i znacznik rundy drukuje się w 3D w całości — bez naklejek.')
    p2 = page('Tor rund — naklejka na wierzch toru z drukarki 3D (sześciokąt 150 × 144 mm), tylko jeśli tor jest jednokolorowy')
    track = Image.open(os.path.join(ART, 'ikony', 'tor_rund.png')).convert('RGBA')
    track.paste((0, 0, 0, 0), (1040, 1000, 1240, 1200))  # the round marker gem drawn beside the track (roundtrack.py)
    track = track.crop(track.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    k = mm(150) / track.width
    track = track.resize((mm(150), round(track.height * k)), Image.LANCZOS)
    p2.paste(track, ((A4[0] - track.width) // 2, mm(40)), track)
    ImageDraw.Draw(p2).text((mm(30), mm(40) + track.height + mm(8)),
                            'Przed naklejeniem przyłóż wydruk do toru: gniazda muszą trafić w gniazda. Otwory gniazd wytnij nożykiem.',
                            fill=(60, 60, 60), font=font(3))
    save('09_naklejki_znaczniki_kosc_tor_rund.pdf', [p, p2])


# ---------------------------------------------------------------- box and binder
def text_centered(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    tw = d.textlength(text, font=f)
    asc, desc = f.getmetrics()
    d.text((x0 + (x1 - x0 - tw) / 2, y0 + (y1 - y0 - asc - desc) / 2), text, fill=fill, font=f)


def strip(w, h, text, size):
    """A dark label with a gold frame and the game's name (box sides, binder spine)."""
    im = Image.new('RGB', (mm(w), mm(h)), (22, 30, 28))
    d = ImageDraw.Draw(im)
    d.rectangle((mm(1.5), mm(1.5), mm(w - 1.5), mm(h - 1.5)), outline=(201, 150, 51), width=mm(0.6))
    d.rectangle((mm(2.6), mm(2.6), mm(w - 2.6), mm(h - 2.6)), outline=(143, 100, 34), width=mm(0.25))
    text_centered(d, (0, 0, mm(w), mm(h)), text, font(size, SERIF), (244, 222, 143))
    return im


def box_sheets():
    cover = Image.open(os.path.join(ART, 'okladka', 'okladka.png')).convert('RGB').resize(A4, Image.LANCZOS)
    logo = Image.open(os.path.join(ART, 'okladka', 'logo.png')).convert('RGBA')
    logo = logo.crop(logo.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox())
    lp = page('Logo na pokrywę pudełka (wytnij wzdłuż konturu albo zostaw prostokąt)')
    k = mm(190) / logo.width
    big = logo.resize((mm(190), round(logo.height * k)), Image.LANCZOS)
    lp.paste(big, ((A4[0] - big.width) // 2, mm(25)), big)
    # Box sides: one 270 x 26 mm label per wall, turned along the sheet.
    sp = page('Etykiety na boki pudełka (4 szt., 270 × 26 mm)')
    for i in range(4):
        lab = strip(270, 26, 'Strażnicy Kryształowego Drzewa', 11).rotate(90, expand=True)
        sp.paste(lab, (mm(30) + i * mm(40), mm(14)))
    # Binder spines: the common widths of an A4 ring binder (a label 4 mm narrower than the spine).
    bp = page('Etykiety na grzbiet segregatora A4 — wybierz szerokość swojego segregatora')
    x = mm(20)
    for w in (35, 50, 70):
        spine = strip(270, w - 4, 'Strażnicy Kryształowego Drzewa', min(11, (w - 4) * 0.42)).rotate(90, expand=True)
        bp.paste(spine, (x, mm(14)))
        ImageDraw.Draw(bp).text((x, mm(287)), f'grzbiet {w} mm', fill=(90, 90, 90), font=font(2.4))
        x += spine.width + mm(12)
    save('10_okladka_A4_pokrywa_i_segregator.pdf', [cover])
    save('11_logo_etykiety_pudelka_i_grzbiet.pdf', [lp, sp, bp])


if __name__ == '__main__':
    parts = sys.argv[1:] or ['karty', 'kafelki', 'arena', 'znaczniki', 'pudelko']
    if 'karty' in parts:
        cards()
    if 'kafelki' in parts:
        tile_sheets()
    if 'arena' in parts:
        arena_sheets()
    if 'znaczniki' in parts:
        sticker_sheets()
    if 'pudelko' in parts:
        box_sheets()
    print('ok ->', OUT)
