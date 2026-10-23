"""Ranking trophies: docs/grafika/ikony/puchary/{zloty,srebrny,brazowy}.png -> public/assets/ui/puchar_*.png.

The originals are 1254 px and over 1 MB each; in the ranking table a cup is about 28 px tall,
so the game gets a 96 px square (sharp on high-density screens), cropped to the cup and centred.
Run from the repo root: python3 scripts/assets/trophies.py
"""

from pathlib import Path

from PIL import Image

SRC = Path('docs/grafika/ikony/puchary')
OUT = Path('public/assets/ui')
SIZE = 96

for name in ('zloty', 'srebrny', 'brazowy'):
    im = Image.open(SRC / f'{name}.png').convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    side = max(im.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    square = square.resize((SIZE, SIZE), Image.LANCZOS)
    target = OUT / f'puchar_{name}.png'
    square.save(target, optimize=True)
    print(f'{target}: {target.stat().st_size // 1024} KB')
