"""Card art (640x442) and portraits (256x256) of the Wild Herd from the generated 1008x704 pictures (backlog 61g, 21.11.2026).
Source: .tmp/zrodla/herds_cards/<id>.png (Scenario, GPT Image 2.5 Flare, medium). The two portraits approved at gate G3 (Indrik, Satyr Dudziarz) stay as they are.
Portrait = a square crop around the figure's box (BOX) with a small margin.
Usage: python3 scripts/assets/herds_cards.py [outdir=public/assets/cards]"""
import sys
from PIL import Image

SRC = '.tmp/zrodla/herds_cards'
KEEP_PORTRAIT = {'indrik'}  # the approved G3 portrait of Indrik stays; the Satyr Piper now gets a wider one from his new card art
# Figure boxes on the 1008x704 picture as shares (x0, y0, x1, y1), measured by eye; the portrait is a square around the box with MARGIN (no bands).
BOX = {
    'greatAurochs': (.19, .05, .80, .88), 'satyrHornlord': (.25, .05, .73, .90), 'windAntelope': (.20, .04, .72, .84), 'thunderRam': (.19, .05, .83, .84),
    'aurochsScout': (.12, .13, .78, .84), 'eagleHunter': (.07, .05, .83, .56), 'planetnik': (.08, .02, .56, .88), 'youngAurochs': (.27, .15, .84, .79),
    'kulan': (.24, .08, .72, .86), 'steppeArcher': (.30, .04, .66, .87), 'forestBison': (.20, .10, .80, .83), 'steppeLamignat': (.08, .01, .86, .87),
    'warRhino': (.17, .15, .73, .78), 'muskOx': (.17, .13, .69, .83), 'arkar': (.17, .12, .75, .80), 'drumElephant': (.27, .08, .73, .82),
    'bullMoose': (.19, .05, .73, .85), 'indrik': (.2, .1, .8, .9), 'satyrPiper': (.32, .04, .62, .97),
}
MARGIN = 1.10
# Author's corrections of 21.11 on top of the automatic crop: name: (shift of the crop centre as a share of the width, factor of the side: < 1 = closer, shift as a share of the height).
ADJ = {
    'planetnik': (+0.12, 1.0, 0.0),       # more to the right: the whole figure with the whirls of wind
    'youngAurochs': (-0.05, 0.85, 0.0),
    'forestBison': (-0.03, 0.94, 0.0),
    'warRhino': (+0.12, 0.84, 0.0),       # the whole horn
    'muskOx': (+0.06, 0.86, 0.0),
    'bullMoose': (0.0, 0.86, -0.04),      # closer, the antlers in full
    'aurochsScout': (+0.05, 0.88, 0.0),   # a little to the right and closer
}
# Busts (head and torso, like the portrait of Indrik): name: (side as a share of the height, cx, cy as shares of width / height).
BUST = {'satyrHornlord': (0.62, 0.50, 0.30), 'satyrPiper': (0.52, 0.47, 0.27)}
MIN_SIDE, MAX_SIDE = 0.70, 1.0   # shares of the picture's height
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards'
    for name, (x0, y0, x1, y1) in BOX.items():
        im = Image.open(f'{SRC}/{name}.png').convert('RGB')
        im.resize((640, 442), Image.LANCZOS).save(f'{out}/art/{name}.jpg', quality=88)
        if name in KEEP_PORTRAIT: continue
        w, h = im.size
        if name in BUST:
            bs, bx, by = BUST[name]
            sp = round(bs * h)
            left = min(max(round(bx * w - sp / 2), 0), w - sp)
            top = min(max(round(by * h - sp / 2), 0), h - sp)
            im.crop((left, top, left + sp, top + sp)).resize((256, 256), Image.LANCZOS).save(f'{out}/portraits/{name}.jpg', quality=86)
            continue
        side = min(MAX_SIDE, max(MIN_SIDE, max((x1 - x0) * w / h, y1 - y0) * MARGIN))
        dx, k, dy = ADJ.get(name, (0.0, 1.0, 0.0))
        sp = round(side * k * h)
        cx, cy = ((x0 + x1) / 2 + dx) * w, ((y0 + y1) / 2 + dy) * h
        left = min(max(round(cx - sp / 2), 0), w - sp)
        top = min(max(round(cy - sp / 2), 0), h - sp)
        im.crop((left, top, left + sp, top + sp)).resize((256, 256), Image.LANCZOS).save(f'{out}/portraits/{name}.jpg', quality=86)
    print('done')
