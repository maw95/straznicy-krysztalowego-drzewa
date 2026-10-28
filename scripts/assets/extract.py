"""Cut the sprite sheets in docs/grafika (portrety, ikony, karty) into single files for the game.

Usage: python3 scripts/assets/extract.py   (writes public/assets/cards/...)
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika')
OUT = os.path.join(ROOT, 'public', 'assets', 'cards')


def save(im, *parts, quality=88):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if path.endswith('.jpg'):
        im.convert('RGB').save(path, quality=quality, optimize=True)
    else:
        im.save(path, optimize=True)
    return path


def art_rect(sheet, box):
    """Inside a cell, the tallest band of rows that are almost fully opaque (the picture, not its label)."""
    cell = sheet.crop(box)
    a = cell.split()[3]
    w, h = a.size
    rows = [sum(1 for x in range(0, w, 2) if a.getpixel((x, y)) > 200) / (w / 2) for y in range(h)]
    best, start = (0, 0), None
    for y, f in enumerate(rows + [0]):
        if f > 0.6 and start is None:
            start = y
        elif f <= 0.6 and start is not None:
            if y - start > best[1] - best[0]:
                best = (start, y)
            start = None
    band = cell.crop((0, best[0], w, best[1]))
    bb = band.split()[3].point(lambda v: 255 if v > 250 else 0).getbbox()
    # Trim a few pixels so no soft transparent edge is left.
    return band.crop((bb[0] + 3, bb[1] + 3, bb[2] - 3, bb[3] - 3))


SINGLE_WIDTH = 640


def portraits():
    sheets = {
        'portrety_przymierze_switu.png': [
            ('goldDragon', (0, 100, 496, 456)), ('unicornKing', (496, 100, 952, 456)), ('ancientBear', (952, 100, 1448, 456)),
            ('elfDruid', (0, 500, 496, 860)), ('nymph', (496, 500, 952, 860)), ('pegasus', (952, 500, 1448, 860)),
        ],
        'portrety_straznicy_krysztalu.png': [
            ('cyclops', (40, 30, 700, 500)), ('griffin', (700, 30, 1400, 500)),
        ],
    }
    # Units painted later as one picture each (no sheet, no transparency): the file and where the square token is
    # centred across the picture (0 = left edge, 1 = right edge), so the head stays in it.
    singles = {
        'blackDragon': ('horda_czarny_smok_portret.png', 0.75), 'werewolfLord': ('horda_wilkolak_portret.png', 0.62),
        'ironFistOgre': ('horda_ogr_portret.png', 0.62), 'goblinShaman': ('horda_goblin_portret.png', 0.55),
        'caveSpider': ('horda_pajak_portret.png', 0.45), 'shadowBat': ('horda_nietoperz_portret.png', 0.5),
        'hydra': ('straznik_hydra_portret.png', 0.5),
    }
    arts = []
    for sheet_name, cells in sheets.items():
        sheet = Image.open(os.path.join(SRC, 'portrety', sheet_name)).convert('RGBA')
        arts += [(unit, art_rect(sheet, box), 0.5) for unit, box in cells]
    for unit, (file, cx) in singles.items():
        art = Image.open(os.path.join(SRC, 'portrety', file)).convert('RGB')
        # Scaled down like the other card pictures (the sheets give ~450 px, the guardians ~650 px).
        arts.append((unit, art.resize((SINGLE_WIDTH, round(art.height * SINGLE_WIDTH / art.width)), Image.LANCZOS), cx))
    for unit, art, cx in arts:
        save(art, 'art', f'{unit}.jpg')
        # Square portrait for tokens: a little above the middle, across at cx.
        w, h = art.size
        s = min(w, h)
        x = min(w - s, max(0, int(w * cx - s / 2)))
        y = max(0, int((h - s) * 0.35))
        save(art.crop((x, y, x + s, y + s)).resize((256, 256), Image.LANCZOS), 'portraits', f'{unit}.jpg')


def disc(im, cx, cy, r, feather=1.5):
    """Circular cut-out with a soft edge."""
    box = (cx - r, cy - r, cx + r, cy + r)
    piece = im.crop(box)
    m = Image.new('L', piece.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, 2 * r - 1, 2 * r - 1), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(feather))
    piece.putalpha(Image.composite(piece.split()[3], Image.new('L', piece.size, 0), m))
    return piece


ABILITIES = [
    ['sunburst', 'lightCharge', 'guardian', 'entanglingRoots', 'giftOfLife'],
    ['airDash', 'fireBreath', 'bloodCall', 'hardHead', 'curse'],
    ['web', 'nightAmbush', 'boulder', 'nestLeap', 'manyHeads'],
]


def abilities():
    sheet = Image.open(os.path.join(SRC, 'ikony', 'ikony_umiejetnosci.png')).convert('RGBA')
    xs = [12, 276, 544, 812, 1080]
    ys = [52, 372, 692]
    for r, row in enumerate(ABILITIES):
        for c, ab in enumerate(row):
            x0, y0 = xs[c], ys[r]
            # Full medallion (gold ring) and the inner painting only.
            full = disc(sheet, x0 + 130, y0 + 130, 128)
            inner = disc(sheet, x0 + 130, y0 + 130, 92)
            save(full.resize((192, 192), Image.LANCZOS), 'abilities', f'{ab}.png')
            save(inner.resize((160, 160), Image.LANCZOS), 'abilities', f'{ab}_inner.png')


def glyph_inside_ring(sheet, cx, cy, r=160, keep=136):
    """The gold symbol inside a medallion ring: opaque blobs that stay well inside the ring."""
    piece = sheet.crop((cx - r, cy - r, cx + r, cy + r))
    a = piece.split()[3]
    w, h = a.size
    px = a.load()
    seen = bytearray(w * h)
    keep_mask = Image.new('L', (w, h), 0)
    km = keep_mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] > 40 and not seen[y * w + x]:
                stack, blob, inside = [(x, y)], [], True
                seen[y * w + x] = 1
                while stack:
                    bx, by = stack.pop()
                    blob.append((bx, by))
                    if (bx - r) ** 2 + (by - r) ** 2 > keep ** 2:
                        inside = False
                    for nx, ny in ((bx + 1, by), (bx - 1, by), (bx, by + 1), (bx, by - 1)):
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] > 40 and not seen[ny * w + nx]:
                            seen[ny * w + nx] = 1
                            stack.append((nx, ny))
                if inside and len(blob) > 30:
                    for bx, by in blob:
                        km[bx, by] = 255
    keep_mask = keep_mask.filter(ImageFilter.MaxFilter(3))
    piece.putalpha(Image.composite(a, Image.new('L', (w, h), 0), keep_mask))
    piece = piece.crop(piece.split()[3].getbbox())
    piece.thumbnail((160, 160), Image.LANCZOS)
    return piece


def drop_rim_bits(piece):
    """Remove leftover fragments of the ring: blobs whose centre lies near the disc edge."""
    a = piece.split()[3]
    w, h = a.size
    px = a.load()
    seen = bytearray(w * h)
    keep = Image.new('L', (w, h), 0)
    kp = keep.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] > 30 and not seen[y * w + x]:
                stack, blob = [(x, y)], []
                seen[y * w + x] = 1
                while stack:
                    bx, by = stack.pop()
                    blob.append((bx, by))
                    for nx, ny in ((bx + 1, by), (bx - 1, by), (bx, by + 1), (bx, by - 1)):
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] > 30 and not seen[ny * w + nx]:
                            seen[ny * w + nx] = 1
                            stack.append((nx, ny))
                mx = sum(p[0] for p in blob) / len(blob) - w / 2
                my = sum(p[1] for p in blob) / len(blob) - h / 2
                if (mx * mx + my * my) ** 0.5 < w * 0.36:
                    for bx, by in blob:
                        kp[bx, by] = 255
    piece.putalpha(Image.composite(a, Image.new('L', (w, h), 0), keep.filter(ImageFilter.MaxFilter(3))))
    return piece


def icons():
    sheet = Image.open(os.path.join(SRC, 'ikony', 'ikony_statow_typu_i_frakcji.png')).convert('RGBA')
    for name, box in [('dawn', (168, 40, 640, 470)), ('horde', (676, 40, 1124, 470)), ('neutral', (1156, 40, 1672, 470))]:
        crest = sheet.crop(box)
        crest = crest.crop(crest.split()[3].point(lambda v: 255 if v > 60 else 0).getbbox())
        save(crest, 'crests', f'{name}.png')
    for name, box in [('hp', (100, 660, 500, 1060)), ('attack', (696, 680, 1068, 1036)), ('speed', (1316, 656, 1684, 1064))]:
        icon = sheet.crop(box)
        icon = icon.crop(icon.split()[3].point(lambda v: 255 if v > 60 else 0).getbbox())
        icon.thumbnail((160, 160), Image.LANCZOS)
        save(icon, 'stats', f'{name}.png')
    for name, cx in [('ranged', 406), ('melee', 898), ('fly', 1392)]:
        # The symbol touches its ring in places, so cut a disc just inside the ring.
        glyph = drop_rim_bits(disc(sheet, cx, 1421, 113, feather=1))
        glyph = glyph.crop(glyph.split()[3].point(lambda v: 255 if v > 30 else 0).getbbox())
        glyph.thumbnail((160, 160), Image.LANCZOS)
        save(glyph, 'types', f'{name}.png')


def frames():
    names = {
        'bohater_przymierza': 'dawn_hero', 'pomocnik_przymierza': 'dawn_support',
        'bohater_hordy': 'horde_hero', 'pomocnik_hordy': 'horde_support',
        'neutralny_bohater': 'neutral_hero',
    }
    for src, dst in names.items():
        im = Image.open(os.path.join(SRC, 'karty', f'wzor_karty_{src}_bez_tekstu.png')).convert('RGBA')
        im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        save(im, 'frames', f'{dst}.png')


TREASURES = [
    ['resurrection', 'heal', 'seed', 'damage_scroll', 'sword'],
    ['shield', 'vitality', 'boots', 'horn', 'map'],
    ['lightning', 'hourglass', 'courage_horn', 'teleport', 'stone'],
]

SINGLE_TREASURES = {'damage_scroll': 'portret_skarb_zwoj_magicznej_strzaly.png'}


def treasures():
    sheet = Image.open(os.path.join(SRC, 'portrety', 'portrety_skarby.png')).convert('RGBA')
    rows = [(80, 410), (410, 715), (715, 1010)]
    for r, row in enumerate(TREASURES):
        for c, kind in enumerate(row):
            # A separate portrait (portret_skarb_<name>.png) replaces the one cut from the sheet.
            single = SINGLE_TREASURES.get(kind)
            path = single and os.path.join(SRC, 'portrety', single)
            if path and os.path.exists(path):
                art = Image.open(path).convert('RGBA')
            else:
                art = art_rect(sheet, (c * 290, rows[r][0], (c + 1) * 290 - 2, rows[r][1]))
            save(art.resize((400, 400), Image.LANCZOS), 'treasures', f'{kind}.jpg')
    frame = Image.open(os.path.join(SRC, 'karty', 'wzor_karty_skarbu_bez_tekstu.png')).convert('RGBA')
    frame = frame.crop(frame.split()[3].point(lambda v: 255 if v > 60 else 0).getbbox())
    frame = frame.resize((551, round(frame.height * 551 / frame.width)), Image.LANCZOS)
    save(frame, 'frames', 'treasure.png')


if __name__ == '__main__':
    import sys
    if sys.argv[1:] == ['treasures']:
        treasures()
        sys.exit()
    treasures()
    portraits()
    abilities()
    icons()
    frames()
    print('ok ->', OUT)
