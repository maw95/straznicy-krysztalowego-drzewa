"""Cuts painted Scenario medallions (GPT Image 2.5 Flare, 1024 px, round picture on black, 2026-11-24) into ability icons for the Wild Herd,
the Iron Clan and the Tide Brotherhood: <id>.png (192 px, the picture in the gold ring of giftOfLife.png) and <id>_inner.png (160 px, picture only, soft round edge).
Usage: python3 scripts/assets/ability_icons_painted.py <folder with <id>.webp|jpg|png files> [id ...]   (all files of the folder when no id is given)"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1].rstrip('/')
OUT = 'public/assets/cards/abilities'
RING = 'giftOfLife'


def source(i: str):
    for ext in ('webp', 'png', 'jpg'):
        p = os.path.join(SRC, f'{i}.{ext}')
        if os.path.exists(p):
            return p
    return None


def disc(im: Image.Image, size: int, shrink: float = 1.0) -> Image.Image:
    # The round picture is the bright part on the black background: its bounding box gives the centre and the radius.
    # A picture with transparency (the webp downloads) has the round picture where the alpha is; the others are bright on black.
    mask = im.getchannel('A').point(lambda v: 255 if v > 128 else 0) if im.mode == 'RGBA' else im.convert('L').point(lambda v: 255 if v > 14 else 0)
    x0, y0, x1, y1 = mask.getbbox()
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, min(x1 - x0, y1 - y0) / 2 * shrink
    piece = im.crop((round(cx - r), round(cy - r), round(cx + r), round(cy + r))).resize((size, size), Image.LANCZOS).convert('RGBA')
    if im.mode == 'RGBA':
        piece = Image.alpha_composite(Image.new('RGBA', piece.size, (0, 0, 0, 255)), piece)
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse((1, 1, size - 2, size - 2), fill=255)
    piece.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)))
    return piece


ids = sys.argv[2:] or sorted({os.path.splitext(f)[0] for f in os.listdir(SRC) if f.endswith(('.webp', '.png', '.jpg'))})
ring = Image.open(f'{OUT}/{RING}.png').convert('RGBA')
S = ring.size[0]
d = round(S * 0.72)
for i in ids:
    p = source(i)
    if not p:
        continue
    im = Image.open(p)
    im = im if im.mode == 'RGBA' else im.convert('RGB')
    full = ring.copy()
    # The blue painting of the template shows through at the edge of a picture that is not perfectly round: paint its inside dark first.
    ImageDraw.Draw(full).ellipse(((S - d) // 2 - 8, (S - d) // 2 - 8, (S + d) // 2 + 7, (S + d) // 2 + 7), fill=(20, 12, 6, 255))
    full.alpha_composite(disc(im, d, 0.99), ((S - d) // 2, (S - d) // 2))
    full.save(f'{OUT}/{i}.png')
    disc(im, 160, 0.99).save(f'{OUT}/{i}_inner.png')
    print(i)
