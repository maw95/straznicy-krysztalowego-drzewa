"""Card art (640x442) and portraits (256x256) of the Free Company from the generated 1008x704 pictures (G4, 25.11.2026).
Source: .tmp/zrodla/free_cards/<id>.png (Scenario, GPT Image 2.5 Flare, medium, 3 CU each; prompts in prompts.json there).
The squirrel archer's portrait approved at gate G3 stays as it is.
Portrait = a square crop given as (centre x, centre y, side) in shares of the picture's width, height and height.
Usage: python3 scripts/assets/free_cards.py [outdir=public/assets/cards]"""
import sys
from PIL import Image

SRC = '.tmp/zrodla/free_cards'
KEEP_PORTRAIT = {'squirrelArcher'}
CROP = {
    'foxCaptain': (.46, .21, .42), 'badgerSapper': (.42, .23, .44), 'ravenSeer': (.53, .30, .55), 'otterSmuggler': (.36, .21, .42),
    'otterScout': (.42, .37, .42), 'magpieThief': (.40, .32, .44), 'squirrelArcher': (.48, .35, .55), 'weaselKnife': (.45, .34, .42),
    'polecatPoisoner': (.38, .31, .42), 'catFencer': (.41, .27, .44), 'wolverine': (.48, .29, .42), 'marmotPetard': (.41, .35, .42),
    'toadGunner': (.37, .29, .44), 'beaverEngineer': (.42, .33, .42), 'raccoonDogSpy': (.42, .38, .42), 'towerMonitor': (.80, .60, .48),
    'martenSlasher': (.45, .30, .44), 'wildcatBajka': (.48, .24, .44), 'hareHerbalist': (.42, .22, .48),
}
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/cards'
    for name, (cx, cy, side) in CROP.items():
        im = Image.open(f'{SRC}/{name}.png').convert('RGB')
        im.resize((640, 442), Image.LANCZOS).save(f'{out}/art/{name}.jpg', quality=88)
        if name in KEEP_PORTRAIT:
            continue
        w, h = im.size
        sp = round(side * h)
        left = min(max(round(cx * w - sp / 2), 0), w - sp)
        top = min(max(round(cy * h - sp / 2), 0), h - sp)
        im.crop((left, top, left + sp, top + sp)).resize((256, 256), Image.LANCZOS).save(f'{out}/portraits/{name}.jpg', quality=86)
    print('done')
