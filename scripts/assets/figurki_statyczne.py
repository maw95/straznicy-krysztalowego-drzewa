"""Static stand-in sprites for units that have no animation clips yet: from a cut-out (transparent WebP, the unit standing, facing right)
makes public/assets/jednostki/<dir>/stoi.webp, martwy.webp (the same figure lying, darkened) and anim.json with no clips. The sprite layer
then draws the unit as a still figure: it glides when it moves, the blow lands at once and a hit is a shake (src/ui/SpriteLayer.tsx).
Usage: python3 scripts/assets/figurki_statyczne.py <folder with <unitId>.webp cut-outs>"""
import json
import os
import sys
from PIL import Image, ImageEnhance

SRC = sys.argv[1].rstrip('/')
DIRS = {
    'dawnKnight': 'rycerz_switu', 'dawnHuntress': 'lowczyni_gaju', 'dawnSage': 'medrzec_gaju', 'hordeWarlord': 'wodz_hordy', 'hordeCrossbow': 'kapitan_kusznikow', 'hordeShadow': 'szaman_cieni',
    'dawnPhoenix': 'feniks_switu', 'doomBehemoth': 'behemot_zaglady',
    'silverFox': 'srebrny_lis', 'dawnOwl': 'sowa_switu', 'dryadArcher': 'driada_luczniczka', 'whiteStag': 'bialy_jelen',
    'goblinSlinger': 'goblin_procarz', 'gargoyle': 'gargulec', 'caveTroll': 'troll_jaskiniowy', 'shadowWyvern': 'wiwerna_cienia',
}
SIZE = 320  # frame (square), the figure stands on the line at FEET of its height
FEET = 0.95

for unit, folder in DIRS.items():
    cut = Image.open(f'{SRC}/{unit}.webp').convert('RGBA')
    cut = cut.crop(cut.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    fit = min((SIZE - 16) / cut.width, (SIZE * FEET - 8) / cut.height)
    fig = cut.resize((round(cut.width * fit), round(cut.height * fit)), Image.LANCZOS)
    out = f'public/assets/jednostki/{folder}'
    os.makedirs(out, exist_ok=True)
    stand = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    stand.paste(fig, ((SIZE - fig.width) // 2, round(SIZE * FEET) - fig.height), fig)
    stand.save(f'{out}/stoi.webp', quality=86)
    # The fallen unit: the figure on its back (turned a quarter), a little darker and greyer, lying on the feet line.
    lying = fig.rotate(90, expand=True, resample=Image.BICUBIC)
    lying.thumbnail((SIZE - 16, SIZE - 16), Image.LANCZOS)
    rgb = ImageEnhance.Brightness(ImageEnhance.Color(lying.convert('RGB')).enhance(0.55)).enhance(0.75)
    rgb.putalpha(lying.getchannel('A'))
    dead = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    dead.paste(rgb, ((SIZE - rgb.width) // 2, round(SIZE * FEET) - rgb.height), rgb)
    dead.save(f'{out}/martwy.webp', quality=82)
    json.dump({'frame': [SIZE, SIZE], 'cols': 1, 'fps': 12.0, 'clips': {}, 'feet': FEET, 'cx': 0.5, 'body': round(fig.width / SIZE, 4), 'static': True}, open(f'{out}/anim.json', 'w'), indent=1)
    print(unit, folder, fig.size)
