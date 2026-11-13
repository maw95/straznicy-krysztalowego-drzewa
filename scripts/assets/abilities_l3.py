"""Cuts the Scenario medallions (GPT Image 2.5 Flare, 2026-11-13) of the level 3 recruits' abilities into card icons:
the full medallion (192 px, gold ring) and the inner painting only (160 px), both round with a soft edge, like scripts/assets/extract.py makes them.
Usage: python3 scripts/assets/abilities_l3.py <folder with <ability>.webp files>"""
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = sys.argv[1].rstrip('/')
OUT = 'public/assets/cards/abilities'
IDS = ['quills', 'gallop', 'headlong', 'treeRoots', 'poisonClaw', 'packHunt', 'inferno', 'bloodRage']


def disc(im: Image.Image, cx: float, cy: float, r: float) -> Image.Image:
    box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
    piece = im.crop(box).convert('RGBA')
    m = Image.new('L', piece.size, 0)
    ImageDraw.Draw(m).ellipse((1, 1, piece.size[0] - 2, piece.size[1] - 2), fill=255)
    piece.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)))
    return piece


for ab in IDS:
    im = Image.open(os.path.join(SRC, f'{ab}.webp')).convert('RGB')
    # The medallion is the bright part on the black background: its bounding box gives the centre and radius.
    mask = im.convert('L').point(lambda v: 255 if v > 40 else 0)
    x0, y0, x1, y1 = mask.getbbox()
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, min(x1 - x0, y1 - y0) / 2
    disc(im, cx, cy, r).resize((192, 192), Image.LANCZOS).save(f'{OUT}/{ab}.png')
    disc(im, cx, cy, r * 0.72).resize((160, 160), Image.LANCZOS).save(f'{OUT}/{ab}_inner.png')
    print(ab, round(cx), round(cy), round(r))
