"""The Free Company's colour is burgundy (author's choice, 26.11.2026): turns the bottle-green cloth (banners, pennants, the crest's field)
of a picture into burgundy, keeping its folds and shading. Moss, grass and leaves are lighter and yellower and stay as they are.
Cloth = a dark, saturated green whose green clearly beats its red; pixels next to it with a looser green are taken too, so no green rim
is left round a banner. Used by free_frames.py (crest, card frames) and free_settlement.py (buildings, dwellings, the wall).
Usage (check): python3 scripts/assets/free_burgundy.py in.png out.png"""
import colorsys, sys
from PIL import Image, ImageFilter

TARGET_H = 342 / 360      # burgundy (#6B1A33)
VAL_K = 1.08


def _cloth(r, g, b, loose=False):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if loose:
        return 60 <= h <= 180 and s > 0.3 and g > r
    return 75 <= h <= 175 and s > 0.45 and v < 0.6 and g > r * 1.12


def burgundy(im: Image.Image, val_k: float = VAL_K) -> Image.Image:
    im = im.convert('RGBA')
    w, h = im.size
    px = list(im.getdata())
    core = Image.new('L', (w, h))
    core.putdata([255 if a > 40 and _cloth(r, g, b) else 0 for r, g, b, a in px])
    near = list(core.filter(ImageFilter.MaxFilter(5)).getdata())
    core = list(core.getdata())
    out = []
    for (r, g, b, a), c, n in zip(px, core, near):
        if c or (n and a > 40 and _cloth(r, g, b, loose=True)):
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            r, g, b = (round(x * 255) for x in colorsys.hsv_to_rgb(TARGET_H, s, min(1, v * val_k)))
        out.append((r, g, b, a))
    res = Image.new('RGBA', (w, h))
    res.putdata(out)
    return res


if __name__ == '__main__':
    burgundy(Image.open(sys.argv[1])).save(sys.argv[2])
