"""Cuts the Scenario town pictures (GPT Image 2.5 Flare, 2026-11-13) into game files in public/assets/osady/:
landscapes (land_<faction>.jpg) and buildings on black (<faction>_<building><level>.jpg -> .webp with alpha, black background removed by flood fill from the border).
Usage: python3 scripts/assets/osady.py <folder with the downloaded jpg files>"""
import glob
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = sys.argv[1].rstrip('/')
OUT = 'public/assets/osady'
os.makedirs(OUT, exist_ok=True)
LIM = 20
H = 380  # height of a building picture


def cut(path):
    rgb = Image.open(path).convert('RGB')
    w, h = rgb.size
    mx = ImageChops.lighter(ImageChops.lighter(rgb.getchannel('R'), rgb.getchannel('G')), rgb.getchannel('B'))
    mark = mx.point(lambda v: 255 if v <= LIM else 0)
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    alpha = mark.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(0.8))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out.crop(out.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())


for f in sorted(glob.glob(f'{SRC}/*.jpg')):
    name = os.path.basename(f)[:-4]
    if name.startswith('land_'):
        Image.open(f).convert('RGB').resize((1280, 600), Image.LANCZOS).save(f'{OUT}/{name}.jpg', quality=80)
        continue
    im = cut(f)
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=82)
    print(name, im.size)
