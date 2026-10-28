"""Battle boards: terrain + hex grid + tinted start columns + obstacles -> public/assets/arena/<dawn|horde>.jpg.

Sources (docs/grafika/areny/):
  arena_walki_<przymierze|horda>.png             terrain only, 1448x1086
  arena_walki_<przymierze|horda>_przeszkody.png  obstacle sprites on a transparent sheet

The grid is the one the game uses (src/ui/arenaGeometry.ts, src/engine/battle.ts), so cells,
obstacles and the board line up. Each sheet holds 7 obstacle sprites, one per obstacle
(the two widest span the 2-cell obstacles, turned along them), fitted over a darkened, outlined base
and cut off at the edges of their own cells, so it is clear which cells are blocked.
Usage: python3 scripts/assets/arenas.py [przymierze] [horda]   (default: both)
"""
import os
import sys
import math
from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'areny')
OUT = os.path.join(ROOT, 'public', 'assets', 'arena')
NAMES = {'przymierze': 'dawn', 'horda': 'horde'}
SS = 2  # supersampling for the grid lines

# --- Geometry, copied from src/ui/arenaGeometry.ts and src/engine/battle.ts ---
HALF_Y = [105, 149, 192, 235, 281.5, 327, 374, 421, 470, 518.5, 569, 619, 671, 722.5, 776, 829, 880, 930]
COLUMN_SPAN = [(4, 12), (3, 13), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 15), (2, 14), (3, 13), (4, 12)]
# 7 obstacles per arena, two of them 2 cells wide (the same cells as ARENA_OBSTACLES in battle.ts).
PIECES = {
    'dawn': [[(3, 3)], [(9, 3)], [(3, 7)], [(6, 8)], [(9, 9), (10, 10)], [(3, 13), (4, 14)], [(9, 13)]],
    'horde': [[(3, 3)], [(9, 3)], [(3, 7), (2, 8)], [(6, 8)], [(9, 9), (10, 10)], [(3, 13)], [(9, 13)]],
}
OBSTACLES = {arena: [c for piece in pieces for c in piece] for arena, pieces in PIECES.items()}
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


BLOCK_FILL = {'dawn': (25, 15, 5, 105), 'horde': (10, 5, 0, 150)}
# Dark yellow on both boards (the game draws the same rim over it, ArenaBoard.tsx).
BLOCK_LINE = (168, 132, 20, 235)


def fit(board, sprite, piece):
    """Puts a sprite on its cells and keeps it inside them: on one hex it fills the cell, on two
    neighbouring hexes it is turned along the line between them and stretched to cover both.
    Whatever still sticks out is cut off at the cells' edges, so no sprite reaches a free cell."""
    centres = [center(*c) for c in piece]
    r = spacing(centres[0][1]) * 2 / 3
    one = HALF_Y[piece[0][1] + 1] - HALF_Y[piece[0][1] - 1]
    cx = sum(x for x, _ in centres) / len(centres)
    cy = sum(y for _, y in centres) / len(centres)
    if len(piece) == 1:
        k = min(2 * r * 0.92 / sprite.width, one * 0.92 / sprite.height)
        s = sprite.resize((round(sprite.width * k), round(sprite.height * k)), Image.LANCZOS)
    else:
        (x0, y0), (x1, y1) = centres
        length = math.hypot(x1 - x0, y1 - y0) + 2 * r * 0.8
        # Stretched lengthwise a little at most (a wider sprite reads as a longer obstacle, not a squashed one).
        k = min(length / sprite.width, one * 0.8 / sprite.height)
        s = sprite.resize((round(min(length, sprite.width * k * 1.25)), round(sprite.height * k)), Image.LANCZOS)
        s = s.rotate(-math.degrees(math.atan2(y1 - y0, x1 - x0)), resample=Image.BICUBIC, expand=True)
    layer = Image.new('RGBA', board.size)
    layer.alpha_composite(s, (round(cx - s.width / 2), round(cy - s.height / 2)))
    mask = Image.new('L', (board.width * SS, board.height * SS))
    draw = ImageDraw.Draw(mask)
    for c in piece:
        draw.polygon([(x * SS, y * SS) for x, y in hexagon(*c)], fill=255)
    mask = mask.resize(board.size, Image.LANCZOS)
    layer.putalpha(ImageChops.multiply(layer.getchannel('A'), mask))
    board.alpha_composite(layer)


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

    # Obstacles: a darkened, outlined base on every blocked cell, then one sprite per obstacle
    # (drawn top to bottom, so lower sprites overlap the ones behind them).
    layer = Image.new('RGBA', (board.width * SS, board.height * SS))
    draw = ImageDraw.Draw(layer)
    for c in OBSTACLES[arena]:
        pts = [(x * SS, y * SS) for x, y in hexagon(*c)]
        draw.polygon(pts, fill=BLOCK_FILL[arena])
        draw.line(pts + [pts[0]], fill=BLOCK_LINE, width=3 * SS, joint='curve')
    board.alpha_composite(layer.resize(board.size, Image.LANCZOS))
    sheet = Image.open(os.path.join(SRC, f'arena_walki_{src}_przeszkody.png')).convert('RGBA')
    # The two widest sprites go on the 2-cell obstacles, the others on single cells.
    sp = sorted(sprites(sheet), key=lambda s: s.width / s.height)
    wide, narrow = sp[-2:], sp[:-2]
    for piece in sorted(PIECES[arena], key=lambda p: (max(h for _, h in p), p[0][0])):
        fit(board, (wide if len(piece) > 1 else narrow).pop(0), piece)

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f'{arena}.jpg')
    board.convert('RGB').save(out, quality=88, optimize=True)
    print('ok ->', out)


if __name__ == '__main__':
    for name in sys.argv[1:] or NAMES:
        build(name)
