"""Cuts a Scenario sprite sheet (several objects in a grid on a plain black background) into separate WebP files with alpha.
The black background is removed by a flood fill from the border of each cell (as in osady.py), the object is cropped and scaled to a height.
Usage: python3 scripts/assets/arkusz.py <sheet.jpg> <rows>x<cols> <height px> <out dir> <name1,name2,...> (names row by row; '-' skips a cell)"""
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

src, grid, height, out, names = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5].split(',')
rows, cols = (int(v) for v in grid.split('x'))
LIM = 22
os.makedirs(out, exist_ok=True)


def cut(rgb):
    w, h = rgb.size
    mx = ImageChops.lighter(ImageChops.lighter(rgb.getchannel('R'), rgb.getchannel('G')), rgb.getchannel('B'))
    mark = mx.point(lambda v: 255 if v <= LIM else 0)
    for x in range(0, w, 6):
        for y in (0, h - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    for y in range(0, h, 6):
        for x in (0, w - 1):
            if mark.getpixel((x, y)) == 255:
                ImageDraw.floodfill(mark, (x, y), 128)
    alpha = mark.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(0.8))
    im = rgb.convert('RGBA')
    im.putalpha(alpha)
    # The box of the object itself: a strong erosion drops the crumbs of a neighbour that crossed the cell line, then the box grows back.
    solid = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MinFilter(21))
    x0, y0, x1, y1 = solid.getbbox()
    box = (max(0, x0 - 12), max(0, y0 - 12), min(w, x1 + 12), min(h, y1 + 12))
    return im.crop(box)


sheet = Image.open(src).convert('RGB')
cw, ch = sheet.width // cols, sheet.height // rows
for i, name in enumerate(names):
    if name == '-':
        continue
    r, c = divmod(i, cols)
    im = cut(sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)))
    im = im.resize((max(1, round(im.width * height / im.height)), height), Image.LANCZOS)
    im.save(f'{out}/{name}.webp', quality=82)
    print(name, im.size)
