"""Cuts the Scenario sheet of the six level 5 commanders (3x2 card illustrations) into card art (451x332) and portraits (256x256).
Usage: python3 scripts/assets/dowodcy.py <sheet.jpg>"""
import sys
from PIL import Image

NAMES = ['dawnKnight', 'dawnHuntress', 'dawnSage', 'hordeWarlord', 'hordeCrossbow', 'hordeShadow']
sheet = Image.open(sys.argv[1]).convert('RGB')
cw, ch = sheet.width // 3, sheet.height // 2
for i, name in enumerate(NAMES):
    r, c = divmod(i, 3)
    cell = sheet.crop((c * cw + 6, r * ch + 6, (c + 1) * cw - 6, (r + 1) * ch - 6))
    w, h = cell.size
    art_h = round(w * 332 / 451)
    cell.crop((0, 0, w, art_h)).resize((451, 332), Image.LANCZOS).save(f'public/assets/cards/art/{name}.jpg', quality=84)
    side = round(w * 0.62)
    left = (w - side) // 2
    cell.crop((left, 4, left + side, 4 + side)).resize((256, 256), Image.LANCZOS).save(f'public/assets/cards/portraits/{name}.jpg', quality=84)
    print(name)
