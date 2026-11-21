"""Removes the blue-violet fringe that the blue-key leaves on fast-moving frames (fireballs, wing tips) of units whose palette has no blue or violet.
Pixels with blue clearly above green and not far below red become transparent. Works in place on the WebP sheets of a unit folder.
Usage: python3 scripts/animacje/despill_blue.py <unit folder> [...]   (needs Pillow; run once, right after pack_unit.py)"""
import glob
import sys

from PIL import Image, ImageChops


def despill(im: Image.Image) -> Image.Image:
    r, g, b, a = im.convert('RGBA').split()
    over_green = ImageChops.subtract(b, g).point(lambda v: 255 if v > 8 else 0)
    near_red = ImageChops.subtract(b.point(lambda v: min(255, v * 3 // 2)), r).point(lambda v: 255 if v > 0 else 0)
    mask = ImageChops.multiply(over_green, near_red)
    return Image.merge('RGBA', (r, g, b, ImageChops.subtract(a, mask)))


for folder in sys.argv[1:]:
    for f in sorted(glob.glob(f'{folder}/*.webp')):
        despill(Image.open(f)).save(f, 'WEBP', quality=80, alpha_quality=100, method=4)
    print('done', folder)
