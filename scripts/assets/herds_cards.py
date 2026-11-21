"""Card art (640x442) and portraits (256x256) of the Wild Herd from the generated 1008x704 pictures (backlog 61g, 21.11.2026).
Source: .tmp/zrodla/herds_cards/<id>.png (Scenario, GPT Image 2.5 Flare, medium). The two portraits approved at gate G3 (Indrik, Satyr Dudziarz) stay as they are.
Portrait = ZOOM of the picture's width centred on cx, filled to a square (see horde_portraits.portrait).
Usage: python3 scripts/assets/herds_cards.py [outdir=public/assets/cards]"""
import sys
import os
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from horde_portraits import portrait  # noqa: E402

SRC = '.tmp/zrodla/herds_cards'
KEEP_PORTRAIT = {'indrik', 'satyrPiper'}
# id: cx (share of the picture's width; the crop is ZOOM of the width, the empty bands above and below are filled as in horde_portraits.py)
ZOOM = 0.88
CX = {
    'greatAurochs': 0.5, 'satyrHornlord': 0.5, 'windAntelope': 0.5, 'thunderRam': 0.52, 'aurochsScout': 0.55, 'eagleHunter': 0.47, 'planetnik': 0.47,
    'youngAurochs': 0.5, 'kulan': 0.55, 'steppeArcher': 0.5, 'forestBison': 0.47, 'steppeLamignat': 0.5, 'warRhino': 0.52, 'muskOx': 0.55,
    'arkar': 0.45, 'drumElephant': 0.47, 'bullMoose': 0.5, 'indrik': 0.5, 'satyrPiper': 0.47,
}
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards'
    for name, cx in CX.items():
        im = Image.open(f'{SRC}/{name}.png').convert('RGB')
        im.resize((640, 442), Image.LANCZOS).save(f'{out}/art/{name}.jpg', quality=88)
        if name in KEEP_PORTRAIT: continue
        portrait(im.resize((640, 442), Image.LANCZOS), ZOOM, cx).save(f'{out}/portraits/{name}.jpg', quality=86)
    print('done')
