"""Cuts Scenario icons (transparent PNG, 1024 px) into game files: cropped to the visible part, squared, resized, saved as WebP.
Usage: python3 scripts/assets/icons_cut.py <source.png> <output.webp> <size>"""
import sys
from PIL import Image

src, out, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
side = max(im.size)
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
sq.resize((size, size), Image.LANCZOS).save(out, quality=85, method=6)
