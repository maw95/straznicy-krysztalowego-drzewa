"""Settlement screen of the Free Company from the generated pictures in .tmp/zrodla/free_settlement (G4, 25.11.2026).
 - osady/land_free.jpg: the background, 1280x600;
 - free_<building><level>.webp and dwelling_<unit>.webp: building sprites cut to their opaque box and scaled to 380 px high, written to
   .tmp/zrodla/osady_oryginaly; settlement_ground_blend.py then blends their ground into the land and writes public/assets/osady;
 - the moat and the wall go to .tmp/zrodla/mury/free_walls<1|2>.png for settlement_walls_widen.py.
Usage: python3 scripts/assets/free_settlement.py && python3 scripts/assets/settlement_walls_widen.py free
       && python3 scripts/assets/settlement_ground_blend.py free && python3 scripts/assets/settlement_ground_blend.py free dwelling_<unit>.webp ..."""
import shutil
from PIL import Image, ImageFilter

SRC = '.tmp/zrodla/free_settlement'
ORIG = '.tmp/zrodla/osady_oryginaly'
H = 380
BUILDINGS = ['barracks1', 'barracks2', 'council1', 'forge1', 'forge2', 'hospital1', 'hospital2', 'magic1', 'magic2', 'market1', 'market2',
             'spark1', 'tavern1', 'treasury', 'treasury2', 'plot', 'trapWorkshop1', 'fence1', 'smugglerTrails1']
DWELLINGS = ['weaselKnife', 'beaverEngineer', 'polecatPoisoner', 'catFencer', 'wolverine', 'marmotPetard', 'toadGunner', 'raccoonDogSpy', 'towerMonitor']
HAZE = {'trapWorkshop1'}  # came with a pale half-transparent glow around it: drop the faint pixels


def cut(im: Image.Image, haze: bool = False) -> Image.Image:
    if haze:
        im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 170 else v))
    a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(3))
    bb = a.getbbox()
    pad = 3
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    return im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS)


if __name__ == '__main__':
    Image.open(f'{SRC}/land.png').convert('RGB').resize((1280, 600), Image.LANCZOS).save('public/assets/osady/land_free.jpg', quality=86)
    for b in BUILDINGS:
        cut(Image.open(f'{SRC}/{b}.png').convert('RGBA'), b in HAZE).save(f'{ORIG}/free_{b}.webp', quality=85, method=6)
    for u in DWELLINGS:
        cut(Image.open(f'{SRC}/dw_{u}.png').convert('RGBA')).save(f'{ORIG}/dwelling_{u}.webp', quality=85, method=6)
    for lvl in '12':
        shutil.copy(f'{SRC}/walls{lvl}.png', f'.tmp/zrodla/mury/free_walls{lvl}.png')
    print('done')
