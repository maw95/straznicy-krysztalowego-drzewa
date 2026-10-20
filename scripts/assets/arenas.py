"""Battle boards: docs/grafika/areny/arena_walki_<przymierze|horda>.png -> public/assets/arena/<dawn|horde>.jpg.

The game places its cells by a grid measured from these paintings (src/ui/arenaGeometry.ts);
a new painting must keep the same grid (13 columns, start columns of 5 cells) to line up.
Usage: python3 scripts/assets/arenas.py [przymierze] [horda]   (default: both)
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'areny')
OUT = os.path.join(ROOT, 'public', 'assets', 'arena')
NAMES = {'przymierze': 'dawn', 'horda': 'horde'}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for src in sys.argv[1:] or NAMES:
        im = Image.open(os.path.join(SRC, f'arena_walki_{src}.png')).convert('RGB')
        if im.size != (1448, 1086):
            raise SystemExit(f'{src}: expected 1448×1086, got {im.size[0]}×{im.size[1]}')
        im.save(os.path.join(OUT, f'{NAMES[src]}.jpg'), quality=88, optimize=True)
        print('ok ->', os.path.join(OUT, f'{NAMES[src]}.jpg'))
