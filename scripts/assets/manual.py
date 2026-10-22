"""In-game copy of the rulebook: docs/edytowalny_szablon_instrukcji/ -> public/assets/manual/.

Only the files the pages use are copied; big pictures are scaled for the screen (the cover
from 300 dpi down) and opaque PNGs become JPEGs, with the references rewritten.
Rebuild the pages first with scripts/assets/manual_build.py. The game shows public/assets/manual/index.html?embed in "Zasady i karty → Instrukcja".
Usage: python3 scripts/assets/manual.py   (run again after editing the rulebook)
"""
import os
import re
import shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'edytowalny_szablon_instrukcji')
OUT = os.path.join(ROOT, 'public', 'assets', 'manual')
MAX_SIDE = 1600
# Transparent PNGs stay PNG, so they are scaled harder.
MAX_SIDE_ALPHA = 900
BIG = 300_000

html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(SRC, 'style.css'), encoding='utf-8').read()
refs = sorted(set(re.findall(r"assets/[^\"')\s]+", html + css)))

# Files are overwritten in place and only stale ones removed: deleting the whole folder makes a
# running Vite dev server lose track of it and answer with the game's index.html instead.
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
written = {os.path.join(OUT, 'index.html'), os.path.join(OUT, 'style.css')}
renamed = {}
for ref in refs:
    src = os.path.join(SRC, ref)
    if not os.path.exists(src):
        print('brak pliku:', ref)
        continue
    dst = os.path.join(OUT, ref)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if ref.lower().endswith(('.png', '.jpg', '.jpeg')) and os.path.getsize(src) > BIG:
        im = Image.open(src)
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        opaque = im.mode in ('RGB', 'L') or (im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 255)
        if opaque:
            new_ref = re.sub(r'\.png$', '.jpg', ref, flags=re.I)
            im.convert('RGB').save(os.path.join(OUT, new_ref), quality=85, optimize=True)
            written.add(os.path.join(OUT, new_ref))
            renamed[ref] = new_ref
        else:
            im.thumbnail((MAX_SIDE_ALPHA, MAX_SIDE_ALPHA), Image.LANCZOS)
            im.save(dst, optimize=True)
            written.add(dst)
    else:
        shutil.copyfile(src, dst)
        written.add(dst)
for d, _, fs in os.walk(OUT):
    for f in fs:
        if os.path.join(d, f) not in written:
            os.remove(os.path.join(d, f))
# Pictures further down load only when scrolled to.
html = html.replace('<img ', '<img loading="lazy" ')
for old, new in renamed.items():
    html = html.replace(old, new)
    css = css.replace(old, new)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(OUT, 'style.css'), 'w', encoding='utf-8').write(css)
total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
print(f'ok -> {OUT} ({len(refs)} plików, {total / 1e6:.1f} MB)')
