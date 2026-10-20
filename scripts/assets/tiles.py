"""Cut the hex map tiles from docs/grafika/kafelki_mapy into public/assets/tiles/.

Every tile is cropped to its hexagon, masked (pointy-top) and saved as <name>_<n>.png.
Usage: python3 scripts/assets/tiles.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'kafelki_mapy')
OUT = os.path.join(ROOT, 'public', 'assets', 'tiles')
W, H = 260, 300  # output tile size (pointy-top hex, width : height ≈ 0.866)


def hexes(sheet, min_area=30000):
    """Bounding boxes of hex tiles on a light sheet (labels are too small to count)."""
    im = sheet.convert('RGB')
    w, h = im.size
    small = im.resize((w // 4, h // 4))
    px = small.load()
    sw, sh = small.size
    bg = px[2, 2]
    mask = bytearray(sw * sh)
    for y in range(sh):
        for x in range(sw):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 60:
                mask[y * sw + x] = 1
    seen = bytearray(sw * sh)
    boxes = []
    for y in range(sh):
        for x in range(sw):
            if mask[y * sw + x] and not seen[y * sw + x]:
                stack = [(x, y)]
                seen[y * sw + x] = 1
                x0 = x1 = x
                y0 = y1 = y
                n = 0
                while stack:
                    cx, cy = stack.pop()
                    n += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < sw and 0 <= ny < sh and mask[ny * sw + nx] and not seen[ny * sw + nx]:
                            seen[ny * sw + nx] = 1
                            stack.append((nx, ny))
                if n * 16 >= min_area:
                    boxes.append((x0 * 4, y0 * 4, (x1 + 1) * 4, (y1 + 1) * 4))
    # Reading order: rows top to bottom, then left to right.
    boxes.sort(key=lambda b: (round(b[1] / 150), b[0]))
    return boxes


def hex_mask(w, h, inset=0):
    m = Image.new('L', (w, h), 0)
    i = inset
    ImageDraw.Draw(m).polygon([(w / 2, i), (w - i, h * 0.25 + i / 2), (w - i, h * 0.75 - i / 2), (w / 2, h - i), (i, h * 0.75 - i / 2), (i, h * 0.25 + i / 2)], fill=255)
    return m.filter(ImageFilter.GaussianBlur(1))


def save_tile(img, name):
    # The game clips tiles to a hexagon itself, so a JPEG on a dark ground is enough (and small).
    img = img.convert('RGBA').resize((W, H), Image.LANCZOS)
    ground = Image.new('RGBA', (W, H), (16, 32, 31, 255))
    ground.paste(img, (0, 0), hex_mask(W, H))
    os.makedirs(OUT, exist_ok=True)
    ground.convert('RGB').save(os.path.join(OUT, f'{name}.jpg'), quality=86, optimize=True)


def transparent_sheet(file, names):
    """Sheet on a transparent background with glowing labels: find tiles by opacity, drop the red glow."""
    im = Image.open(os.path.join(SRC, file)).convert('RGBA')
    flat = Image.new('RGB', im.size, (255, 255, 255))
    src, out = im.load(), flat.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = src[x, y]
            if a > 200 and not (r > 150 and g < 90 and b < 90):
                out[x, y] = (0, 0, 0)
    boxes = hexes(flat)
    if len(boxes) != len(names):
        raise SystemExit(f'{file}: found {len(boxes)} tiles, expected {len(names)}')
    for (x0, y0, x1, y1), name in zip(boxes, names):
        # The label hangs under the tile: a pointy-top hexagon is 2/√3 times as tall as it is wide.
        save_tile(im.crop((x0, y0, x1, y0 + round((x1 - x0) * 1.1547))), name)


def sheet(file, names):
    im = Image.open(os.path.join(SRC, file))
    boxes = hexes(im)
    if len(boxes) != len(names):
        raise SystemExit(f'{file}: found {len(boxes)} tiles, expected {len(names)}')
    # A heading line touching a tile widens its box: borrow the x-range of the same column elsewhere.
    widths = sorted(b[2] - b[0] for b in boxes)
    typical = widths[len(widths) // 2]
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        if x1 - x0 > typical * 1.1:
            twin = min((b for b in boxes if b[2] - b[0] <= typical * 1.1), key=lambda b: abs((b[0] + b[2]) - (x0 + x1)) if b[0] < x1 and b[2] > x0 else 1e9)
            boxes[i] = (twin[0], y0, twin[2], y1)
    heights = sorted(b[3] - b[1] for b in boxes)
    tall = heights[len(heights) // 2]
    for (x0, y0, x1, y1), name in zip(boxes, names):
        # An ornament touching a tile stretches its box upward: keep the sheet's usual height from the bottom.
        if y1 - y0 > tall * 1.05:
            y0 = y1 - tall
        save_tile(im.crop((x0, y0, x1, y1)), name)


def single(file, name):
    im = Image.open(os.path.join(SRC, file)).convert('RGBA')
    save_tile(im.crop(im.split()[3].point(lambda v: 255 if v > 128 else 0).getbbox()), name)


def four(prefix):
    return [f'{prefix}_{i}' for i in range(1, 5)]


if __name__ == '__main__':
    sheet('polana_spalona_ziemia.png', four('meadow') + four('scorched'))
    sheet('las_bagno.png', four('forest') + four('swamp'))
    sheet('rzeki_mosty.png', four('river') + four('bridge'))
    sheet('gory_szczeliny.png', four('mountain') + four('chasm'))
    sheet('jaskinie_ruiny.png', four('darkCave') + four('ruins'))
    sheet('martwy_gaszcz_trujace_ciernie.png', four('deadThicket') + four('thorns'))
    transparent_sheet('wzgorza_jalowe_rowniny.png', ['hill_1', 'hill_2', 'barren_1', 'barren_2', 'hill_3', 'hill_4', 'barren_3', 'barren_4'])
    sheet('bazy_i_siedliska_straznikow.png', ['baseDawn_1', 'baseHorde_1', 'lairCyclops_1', 'lairGriffin_1', 'lairHydra_1'])
    sheet('skarby.png', four('treasureDawn') + four('treasureHorde'))
    single('krysztalowe_drzewo.png', 'tree_1')
    single('rewers_kafelka_przymierze.png', 'back_dawn')
    single('rewers_kafelka_horda.png', 'back_horde')
    print('ok ->', OUT)
