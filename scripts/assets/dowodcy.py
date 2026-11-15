"""Cuts a Scenario sheet of card illustrations in a grid into card art (451x332) and portraits (256x256).
Usage: python3 scripts/assets/dowodcy.py <sheet.jpg> [<rows>x<cols> <id1,id2,...>]   (default: the six level 5 commanders, 2x3)"""
import sys
from PIL import Image

NAMES = ['dawnKnight', 'dawnHuntress', 'dawnSage', 'hordeWarlord', 'hordeCrossbow', 'hordeShadow']
ROWS, COLS = (int(v) for v in sys.argv[2].split('x')) if len(sys.argv) > 2 else (2, 3)
if len(sys.argv) > 3:
    NAMES = sys.argv[3].split(',')
sheet = Image.open(sys.argv[1]).convert('RGB')
cw, ch = sheet.width // COLS, sheet.height // ROWS
for i, name in enumerate(NAMES):
    r, c = divmod(i, COLS)
    cell = sheet.crop((c * cw + 6, r * ch + 6, (c + 1) * cw - 6, (r + 1) * ch - 6))
    w, h = cell.size
    art_h = round(w * 332 / 451)
    cell.crop((0, 0, w, art_h)).resize((451, 332), Image.LANCZOS).save(f'public/assets/cards/art/{name}.jpg', quality=84)
    side = round(w * (0.62 if COLS == 3 else 0.9))
    left = (w - side) // 2
    cell.crop((left, 4, left + side, 4 + side)).resize((256, 256), Image.LANCZOS).save(f'public/assets/cards/portraits/{name}.jpg', quality=84)
    print(name)
