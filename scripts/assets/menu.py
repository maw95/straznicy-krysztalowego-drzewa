"""Main menu art: the cover (background) and the logo, from docs/grafika/okladka into public/assets/ui/.

Usage: python3 scripts/assets/menu.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'okladka')
OUT = os.path.join(ROOT, 'public', 'assets', 'ui')

if __name__ == '__main__':
    cover = Image.open(os.path.join(SRC, 'okladka.png')).convert('RGB')
    cover.resize((1240, round(1240 * cover.height / cover.width)), Image.LANCZOS).save(os.path.join(OUT, 'cover.jpg'), quality=84, optimize=True)
    logo = Image.open(os.path.join(SRC, 'logo.png')).convert('RGBA')
    logo = logo.crop(logo.split()[3].point(lambda v: 255 if v > 16 else 0).getbbox())
    logo.resize((720, round(720 * logo.height / logo.width)), Image.LANCZOS).save(os.path.join(OUT, 'logo.png'), optimize=True)
    print('ok ->', OUT)
