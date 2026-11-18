"""Cuts the Scenario UI pictures of the settlement (GPT Image 2.5 Flare, 2026-11-18) into game files in public/assets/ui/:
the bottom bar (frame on all four sides, built from the frame's two end caps and a mirrored tiled middle), the ribbons in four colours
(wstazka_<g|r|b|p>.webp, cropped) and the exit medallion (wyjscie.webp).
Usage: python3 scripts/assets/osada_ui.py <folder with frameA.png ribbonA.png ribbonRed.png ribbonBlue.png ribbonPurple.png exitA.png>"""
import sys
from PIL import Image, ImageOps

SRC = sys.argv[1].rstrip('/')
OUT = 'public/assets/ui'


def crop(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())


def load(name):
    return crop(Image.open(f'{SRC}/{name}.png').convert('RGBA'))


# Bottom bar: 2560x256, caps of 220 px at both ends (frame corners and sides), the middle tiled with mirrored copies so the seams are invisible.
frame = load('frameA').resize((768, 256), Image.LANCZOS)
CAP = 70
mid = frame.crop((CAP, 0, 768 - CAP, 256))
tile = Image.new('RGBA', (mid.width * 2, 256))
tile.paste(mid, (0, 0))
tile.paste(ImageOps.mirror(mid), (mid.width, 0))
W = 2560
bar = Image.new('RGBA', (W, 256))
bar.paste(frame.crop((0, 0, CAP, 256)), (0, 0))
bar.paste(frame.crop((768 - CAP, 0, 768, 256)), (W - CAP, 0))
x = CAP
while x < W - CAP:
    bar.paste(tile.crop((0, 0, min(tile.width, W - CAP - x), 256)), (x, 0))
    x += tile.width
bar.save(f'{OUT}/pasek_osady.webp', quality=88)

for src, key in (('ribbonA', 'g'), ('ribbonRed', 'r'), ('ribbonBlue', 'b'), ('ribbonPurple', 'p')):
    im = load(src)
    im = im.resize((880, round(im.height * 880 / im.width)), Image.LANCZOS)
    im.save(f'{OUT}/wstazka_{key}.webp', quality=86)
    print('ribbon', key, im.size)

ex = load('exitA').resize((256, 256), Image.LANCZOS)
ex.save(f'{OUT}/wyjscie.webp', quality=90)
print('done')
