"""More vivid sprite sheets of the Horde supports of levels 2-5 and the legend (backlog 61g, variant A, 0 CU).
The originals are always read from git (`BASE`, the commit before the first boost), so the script can be run again with other numbers without
doubling the effect. Colour x COLOUR and brightness x BRIGHT on the RGB channels only (alpha untouched).
Usage: python3 scripts/assets/horde_sprites_vivid.py [--dry]"""
import io, os, subprocess, sys
from PIL import Image, ImageEnhance

BASE = 'dcd6796^'
COLOUR, BRIGHT = 1.40, 1.10
FOLDERS = ['szczurolak', 'piekielny_ogar', 'salamandra_popiolu', 'herszt_minotaurow', 'goblin_procarz', 'gargulec',
           'troll_jaskiniowy', 'wiwerna_cienia', 'behemot_zaglady']
ROOT = 'public/assets/jednostki'
dry = '--dry' in sys.argv
for f in FOLDERS:
    d = f'{ROOT}/{f}'
    for name in sorted(os.listdir(d)):
        if not name.endswith('.webp'): continue
        src = subprocess.check_output(['git', 'show', f'{BASE}:{d}/{name}'])
        im = Image.open(io.BytesIO(src)).convert('RGBA')
        r, g, b, a = im.split()
        rgb = ImageEnhance.Brightness(ImageEnhance.Color(Image.merge('RGB', (r, g, b))).enhance(COLOUR)).enhance(BRIGHT)
        if not dry: Image.merge('RGBA', (*rgb.split(), a)).save(f'{d}/{name}', 'WEBP', quality=88, alpha_quality=100, method=4)
    if not dry: open(f'{d}/.vivid', 'w').write(f'colour {COLOUR}, brightness {BRIGHT}\n')
    print('done', f)
