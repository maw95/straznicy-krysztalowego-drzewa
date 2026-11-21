"""Card art (640x442) and portraits (256x256) of the Wild Herd from the generated 1008x704 pictures (backlog 61g, 21.11.2026).
Source: .tmp/zrodla/herds_cards/<id>.png (Scenario, GPT Image 2.5 Flare, medium). The two portraits approved at gate G3 (Indrik, Satyr Dudziarz) stay as they are.
Portrait = a square crop around the figure's box (BOX) with a small margin.
Usage: python3 scripts/assets/herds_cards.py [outdir=public/assets/cards]"""
import sys
from PIL import Image

SRC = '.tmp/zrodla/herds_cards'
KEEP_PORTRAIT = {'indrik', 'satyrPiper'}
# Figure boxes on the 1008x704 picture as shares (x0, y0, x1, y1), measured by eye; the portrait is a square around the box with MARGIN (no bands).
BOX = {
    'greatAurochs': (.19, .05, .80, .88), 'satyrHornlord': (.25, .05, .73, .90), 'windAntelope': (.20, .04, .72, .84), 'thunderRam': (.19, .05, .83, .84),
    'aurochsScout': (.12, .13, .78, .84), 'eagleHunter': (.07, .05, .83, .56), 'planetnik': (.08, .02, .56, .88), 'youngAurochs': (.27, .15, .84, .79),
    'kulan': (.24, .08, .72, .86), 'steppeArcher': (.30, .04, .66, .87), 'forestBison': (.20, .10, .80, .83), 'steppeLamignat': (.08, .01, .86, .87),
    'warRhino': (.17, .15, .73, .78), 'muskOx': (.17, .13, .69, .83), 'arkar': (.17, .12, .75, .80), 'drumElephant': (.27, .08, .73, .82),
    'bullMoose': (.19, .05, .73, .85), 'indrik': (.2, .1, .8, .9), 'satyrPiper': (.3, .05, .7, .9),
}
MARGIN = 1.10
MIN_SIDE, MAX_SIDE = 0.70, 1.0   # shares of the picture's height
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards'
    for name, (x0, y0, x1, y1) in BOX.items():
        im = Image.open(f'{SRC}/{name}.png').convert('RGB')
        im.resize((640, 442), Image.LANCZOS).save(f'{out}/art/{name}.jpg', quality=88)
        if name in KEEP_PORTRAIT: continue
        w, h = im.size
        side = min(MAX_SIDE, max(MIN_SIDE, max((x1 - x0) * w / h, y1 - y0) * MARGIN))
        sp = round(side * h)
        cx, cy = (x0 + x1) / 2 * w, (y0 + y1) / 2 * h
        left = min(max(round(cx - sp / 2), 0), w - sp)
        top = min(max(round(cy - sp / 2), 0), h - sp)
        im.crop((left, top, left + sp, top + sp)).resize((256, 256), Image.LANCZOS).save(f'{out}/portraits/{name}.jpg', quality=86)
    print('done')
