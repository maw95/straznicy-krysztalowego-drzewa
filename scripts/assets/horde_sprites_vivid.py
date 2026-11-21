"""Slightly more vivid sprite sheets of the Horde supports of levels 2-5 and the legend (backlog 61g, variant A, 0 CU).
Colour x1.12 and brightness x1.06 on the RGB channels only (alpha untouched). Run once per folder: a marker file `.vivid` stops a second pass
(the boost would double). Usage: python3 scripts/assets/horde_sprites_vivid.py [--dry]"""
import sys, os
from PIL import Image, ImageEnhance

FOLDERS = ['szczurolak', 'piekielny_ogar', 'salamandra_popiolu', 'herszt_minotaurow', 'goblin_procarz', 'gargulec',
           'troll_jaskiniowy', 'wiwerna_cienia', 'behemot_zaglady']
ROOT = 'public/assets/jednostki'
dry = '--dry' in sys.argv
for f in FOLDERS:
    d = f'{ROOT}/{f}'
    if os.path.exists(f'{d}/.vivid'):
        print('skip', f, '(done)'); continue
    for name in sorted(os.listdir(d)):
        if not name.endswith('.webp'): continue
        im = Image.open(f'{d}/{name}').convert('RGBA')
        r, g, b, a = im.split()
        rgb = Image.merge('RGB', (r, g, b))
        rgb = ImageEnhance.Brightness(ImageEnhance.Color(rgb).enhance(1.12)).enhance(1.06)
        out = Image.merge('RGBA', (*rgb.split(), a))
        if not dry: out.save(f'{d}/{name}', 'WEBP', quality=88, alpha_quality=100, method=6)
    if not dry: open(f'{d}/.vivid', 'w').write('colour 1.12, brightness 1.06, 21.11.2026\n')
    print('done', f)
