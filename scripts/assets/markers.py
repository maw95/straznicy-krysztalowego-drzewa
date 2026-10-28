"""Cut the board-game markers from docs/grafika/ikony/znaczniki.png (transparent sheet).

Each marker is a separate opaque piece of the sheet; pieces are found on a coarse grid of the alpha
channel and named by their place (rows of 4, 3, 3, 3):
  drops 1 / 2 / 3 / 5 · used ability, web (rooted), roots (slowed) · curse, attack up, speed up ·
  shield, vitality, Kryształ Opieki.
The game gets the status markers in public/assets/markers/ (the damage drop there is the empty one,
znacznik_obrazen_pusty.png, as the game writes the number itself); the rulebook gets all of them in
docs/edytowalny_szablon_instrukcji/assets/znaczniki/.
Newer markers are separate files (SEPARATE), scaled to the same size; one of the same name replaces the sheet's.
Usage: python3 scripts/assets/markers.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'znaczniki.png')
EMPTY_DROP = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'znacznik_obrazen_pusty.png')
OUT = os.path.join(ROOT, 'public', 'assets', 'markers')
MANUAL = os.path.join(ROOT, 'docs', 'edytowalny_szablon_instrukcji', 'assets', 'znaczniki')
SIZE = 160
ROWS = [
    ['damage_1', 'damage_2', 'damage_3', 'damage_5'],
    ['ability_used', 'rooted', 'slowed'],
    ['cursed', 'attack_up', 'speed_up'],
    ['shield', 'vitality', 'crystal'],
]
STATUS = ['ability_used', 'rooted', 'slowed', 'cursed', 'attack_up', 'attack_3', 'speed_up', 'shield', 'vitality']
# name -> file in docs/grafika/ikony/
SEPARATE = {'attack_3': 'znacznik_+3_ataku.png', 'vitality': 'znacznik_+4_zdrowia.png'}
GRID = 4  # pixels per cell when looking for pieces


def pieces(sheet):
    """Bounding boxes of the opaque pieces (4-connected on a coarse grid), largest first."""
    a = sheet.getchannel('A')
    w, h = a.width // GRID, a.height // GRID
    small = a.resize((w, h), Image.BOX).load()
    seen = [[False] * w for _ in range(h)]
    boxes = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or small[x0, y0] < 128:
                continue
            stack, box, n = [(x0, y0)], [x0, y0, x0, y0], 0
            seen[y0][x0] = True
            while stack:
                x, y = stack.pop()
                n += 1
                box = [min(box[0], x), min(box[1], y), max(box[2], x), max(box[3], y)]
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and small[nx, ny] >= 128:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            boxes.append((n, tuple(v * GRID for v in (box[0], box[1], box[2] + 1, box[3] + 1))))
    return [b for n, b in sorted(boxes, reverse=True) if n > 200]


def split(sheet, box):
    """Markers stacked in a column touch each other: cut a tall piece where it is thinnest."""
    x0, y0, x1, y1 = box
    n = round((y1 - y0) / (x1 - x0))
    if n < 2:
        return [box]
    a = sheet.getchannel('A').crop(box).point(lambda v: 1 if v > 128 else 0)
    width = [sum(a.crop((0, y, a.width, y + 1)).getdata()) for y in range(a.height)]
    cuts, step = [0], a.height / n
    for k in range(1, n):
        lo, hi = round(step * (k - 0.25)), round(step * (k + 0.25))
        cuts.append(min(range(lo, hi), key=lambda y: width[y]))
    cuts.append(a.height)
    return [(x0, y0 + cuts[i], x1, y0 + cuts[i + 1]) for i in range(n)]


def named(sheet):
    """Pieces sorted into the sheet's rows (top to bottom), each row left to right."""
    boxes = [b for box in pieces(sheet) for b in split(sheet, box)][: sum(len(r) for r in ROWS)]
    boxes.sort(key=lambda b: b[1])
    out, i = {}, 0
    for row in ROWS:
        for name, box in zip(row, sorted(boxes[i : i + len(row)], key=lambda b: b[0])):
            out[name] = box
        i += len(row)
    return out


def fit(im):
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
    scale = SIZE / max(im.size)
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)


if __name__ == '__main__':
    sheet = Image.open(SRC).convert('RGBA')
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(MANUAL, exist_ok=True)
    for name, box in named(sheet).items():
        # Only the piece itself: a neighbour's edge may reach into the box.
        im = fit(sheet.crop(box))
        im.save(os.path.join(MANUAL, f'{name}.png'), optimize=True)
        if name in STATUS:
            im.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    for name, file in SEPARATE.items():
        im = fit(Image.open(os.path.join(os.path.dirname(SRC), file)).convert('RGBA'))
        im.save(os.path.join(MANUAL, f'{name}.png'), optimize=True)
        im.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    drop = fit(Image.open(EMPTY_DROP).convert('RGBA'))
    drop.save(os.path.join(OUT, 'damage_empty.png'), optimize=True)
    print('ok ->', OUT, '+', MANUAL)
