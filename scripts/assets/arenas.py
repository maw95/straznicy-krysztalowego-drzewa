"""Battle boards: terrain + hex grid + tinted start columns + obstacles -> public/assets/arena/<dawn|horde>.jpg.

Sources (docs/grafika/areny/):
  arena_walki_<przymierze|horda>.png             terrain only, 1448x1086
  arena_walki_<przymierze|horda>_przeszkody.png  obstacle sprites on a transparent sheet

The grid is the one the game uses (src/ui/arenaGeometry.ts, src/engine/battle.ts), so cells,
obstacles and the board line up. Each sheet holds 7 obstacles: the 2 wide ones cover the obstacle
pairs, the 5 single ones the remaining cells.
Usage: python3 scripts/assets/arenas.py [przymierze] [horda]   (default: both)
"""
import os
import sys
from PIL import Image, ImageDraw, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'areny')
OUT = os.path.join(ROOT, 'public', 'assets', 'arena')
NAMES = {'przymierze': 'dawn', 'horda': 'horde'}
SS = 2  # supersampling for the grid lines

# --- Geometry, copied from src/ui/arenaGeometry.ts and src/engine/battle.ts ---
HALF_Y = [105, 149, 192, 235, 281.5, 327, 374, 421, 470, 518.5, 569, 619, 671, 722.5, 776, 829, 880, 930]
COLUMN_SPAN = [(4, 12), (3, 13), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 13), (4, 12)]
OBSTACLES = {
    'dawn': [(3, 3), (9, 3), (3, 7), (6, 8), (9, 9), (10, 10), (3, 13), (4, 14), (9, 13)],
    'horde': [(3, 3), (9, 3), (3, 7), (2, 8), (6, 8), (9, 9), (10, 10), (3, 13), (9, 13)],
}
START_TINT = {'dawn': (205, 245, 190, 120), 'horde': (225, 80, 55, 110)}
LINE = (240, 205, 120, 215)
SHADE = (40, 25, 5, 110)


def spacing(y):
    return 85.2 + 0.01429 * (y - 192)


def center(col, half):
    y = HALF_Y[half]
    return 726 + (col - 6) * spacing(y), y


def hexagon(col, half):
    x, y = center(col, half)
    r = spacing(y) * 2 / 3
    top, bottom = HALF_Y[half - 1], HALF_Y[half + 1]
    return [(x - r, y), (x - r / 2, top), (x + r / 2, top), (x + r, y), (x + r / 2, bottom), (x - r / 2, bottom)]


def cells():
    for col, (a, b) in enumerate(COLUMN_SPAN):
        for half in range(a, b + 1, 2):
            yield col, half


# --- Sprites ---
def sprites(sheet):
    """Obstacle sprites, cut by connected parts of the alpha channel (found on a 1/8 grid)."""
    alpha = sheet.getchannel('A')
    small = alpha.resize((sheet.width // 8, sheet.height // 8)).point(lambda v: 255 if v > 40 else 0)
    w, h = small.size
    px = small.load()
    seen, found = set(), []
    for y in range(h):
        for x in range(w):
            if not px[x, y] or (x, y) in seen:
                continue
            stack, part = [(x, y)], []
            seen.add((x, y))
            while stack:
                p = stack.pop()
                part.append(p)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        q = (p[0] + dx, p[1] + dy)
                        if 0 <= q[0] < w and 0 <= q[1] < h and px[q] and q not in seen:
                            seen.add(q)
                            stack.append(q)
            if len(part) > 20:
                found.append(part)
    out = []
    for part in found:
        mask = Image.new('L', (w, h))
        for p in part:
            mask.putpixel(p, 255)
        mask = mask.resize(sheet.size).point(lambda v: 255 if v else 0)
        im = sheet.copy()
        im.putalpha(Image.composite(alpha, Image.new('L', sheet.size), mask))
        out.append(im.crop(im.getchannel('A').getbbox()))
    return out


def pairs_and_singles(obstacles):
    """Splits obstacle cells into neighbouring pairs and single cells."""
    left, pairs = list(obstacles), []
    for a in obstacles:
        if a not in left:
            continue
        b = next((c for c in left if c != a and abs(c[0] - a[0]) == 1 and abs(c[1] - a[1]) == 1), None)
        if b:
            left.remove(a)
            left.remove(b)
            pairs.append(tuple(sorted([a, b])))
    return pairs, left


def place(board, sprite, x, y, width):
    """Puts a sprite with its base around (x, y): about a third of it rises above the cell."""
    k = width / sprite.width
    s = sprite.resize((round(sprite.width * k), round(sprite.height * k)), Image.LANCZOS)
    board.alpha_composite(s, (round(x - s.width / 2), round(y - s.height * 0.62)))


def build(src):
    arena = NAMES[src]
    board = Image.open(os.path.join(SRC, f'arena_walki_{src}.png')).convert('RGBA')
    if board.size != (1448, 1086):
        raise SystemExit(f'{src}: expected 1448×1086, got {board.size[0]}×{board.size[1]}')

    # Grid and start columns, drawn large and scaled down for smooth lines.
    layer = Image.new('RGBA', (board.width * SS, board.height * SS))
    draw = ImageDraw.Draw(layer)
    for col, half in cells():
        pts = [(x * SS, y * SS) for x, y in hexagon(col, half)]
        if col in (0, len(COLUMN_SPAN) - 1):
            draw.polygon(pts, fill=START_TINT[arena])
    for col, half in cells():
        pts = [(x * SS, y * SS) for x, y in hexagon(col, half)]
        draw.line(pts + [pts[0]], fill=SHADE, width=4 * SS, joint='curve')
    for col, half in cells():
        pts = [(x * SS, y * SS) for x, y in hexagon(col, half)]
        draw.line(pts + [pts[0]], fill=LINE, width=2 * SS, joint='curve')
    if os.environ.get('ARENA_DEBUG'):
        for c in OBSTACLES[arena]:
            pts = [(x * SS, y * SS) for x, y in hexagon(*c)]
            draw.line(pts + [pts[0]], fill=(255, 0, 255, 255), width=4 * SS)
    board.alpha_composite(layer.resize(board.size, Image.LANCZOS))

    # Obstacles: wide sprites (widest first) on pairs, the rest on single cells.
    sheet = Image.open(os.path.join(SRC, f'arena_walki_{src}_przeszkody.png')).convert('RGBA')
    sp = sprites(sheet)
    wide = sorted([s for s in sp if s.width > 1.4 * s.height], key=lambda s: -s.width)
    single = [s for s in sp if s not in wide]
    pairs, singles = pairs_and_singles(OBSTACLES[arena])
    jobs = []
    for i, (a, b) in enumerate(pairs):
        if i < len(wide):
            (xa, ya), (xb, yb) = center(*a), center(*b)
            jobs.append(((xa + xb) / 2, (ya + yb) / 2 + 6, wide[i], 2.15))
        else:
            singles += [a, b]
    for i, c in enumerate(sorted(singles, key=lambda c: (c[1], c[0]))):
        s = single[i % len(single)]
        if i >= len(single):
            s = ImageOps.mirror(s)
        x, y = center(*c)
        jobs.append((x, y + 4, s, 1.15))
    for x, y, s, cells_wide in sorted(jobs, key=lambda j: j[1]):
        place(board, s, x, y, spacing(y) * 4 / 3 * cells_wide)

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f'{arena}.jpg')
    board.convert('RGB').save(out, quality=88, optimize=True)
    print('ok ->', out)


if __name__ == '__main__':
    for name in sys.argv[1:] or NAMES:
        build(name)
