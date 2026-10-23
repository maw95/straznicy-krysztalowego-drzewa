"""Mouse cursors: docs/grafika/kursory/*.png -> public/assets/cursors/<name>.png (32 px) and <name>@2x.png (64 px).

The originals are 1254 px with a lot of empty margin. Each one is cropped to the drawing, centred on a
square, and scaled to the cursor size (32 px; the @2x copy for high-density screens). The script prints
the click point (hotspot) of each cursor at 32 px: the tip of the pointer, the sword and the arrows
(the opaque pixel nearest the top-left corner), the middle for the boot, the wing and the crossed-out shot.
Usage: python3 scripts/assets/cursors.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs/grafika/kursory')
OUT = os.path.join(ROOT, 'public/assets/cursors')
SIZE = 32
TIPPED = {'zwykly_kursor', 'atak', 'strzal'}

os.makedirs(OUT, exist_ok=True)
for name in sorted(n[:-4] for n in os.listdir(SRC) if n.endswith('.png')):
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    side = max(im.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    ox, oy = (side - im.width) // 2, (side - im.height) // 2
    square.paste(im, (ox, oy))
    for scale, suffix in ((1, ''), (2, '@2x')):
        square.resize((SIZE * scale, SIZE * scale), Image.LANCZOS).save(os.path.join(OUT, f'{name}{suffix}.png'), optimize=True)
    if name in TIPPED:
        alpha = square.getchannel('A').load()
        tip = min(((x, y) for y in range(0, side, 4) for x in range(0, side, 4) if alpha[x, y] > 128), key=lambda p: p[0] + p[1])
        hx, hy = round(tip[0] * SIZE / side), round(tip[1] * SIZE / side)
    else:
        hx, hy = SIZE // 2, SIZE // 2
    size = os.path.getsize(os.path.join(OUT, name + '.png'))
    print(f'{name}: hotspot {hx} {hy}, {size} B')
