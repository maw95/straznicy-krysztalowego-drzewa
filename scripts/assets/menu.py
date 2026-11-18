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
    # The English cover: the same poster with the English logo pasted over the Polish one (same size and place: width 1100 px, centred, 10 px from the top).
    en = Image.open(os.path.join(SRC, 'logo_en.png')).convert('RGBA')
    en = en.resize((1100, round(1100 * en.height / en.width)), Image.LANCZOS)
    cover_en = cover.copy()
    cover_en.paste(en, ((cover.width - 1100) // 2, 10), en)
    cover_en.resize((1240, round(1240 * cover.height / cover.width)), Image.LANCZOS).save(os.path.join(OUT, 'cover_en.jpg'), quality=84, optimize=True)
    for src, dst in (('logo.png', 'logo.png'), ('logo_en.png', 'logo_en.png')):
        logo = Image.open(os.path.join(SRC, src)).convert('RGBA')
        logo = logo.crop(logo.split()[3].point(lambda v: 255 if v > 16 else 0).getbbox())
        logo.resize((720, round(720 * logo.height / logo.width)), Image.LANCZOS).save(os.path.join(OUT, dst), optimize=True)
    print('ok ->', OUT)
