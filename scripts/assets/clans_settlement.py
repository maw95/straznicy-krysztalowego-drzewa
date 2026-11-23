"""Settlement screen of the Iron Clans from the generated pictures in .tmp/zrodla/clans_settlement (G4 settlement phase).
 - osady/land_clans.jpg: the background, 1280x600;
 - osady/clans_<building><level>.webp: building sprites cut to their opaque box and scaled to 380 px high;
 - osady/dwelling_<unit>.webp: the nine dwellings of the units recruited in a settlement.
Usage: python3 scripts/assets/clans_settlement.py"""
from PIL import Image, ImageFilter

SRC = '.tmp/zrodla/clans_settlement'
OUT = 'public/assets/osady'
H = 380
BUILDINGS = ['barracks1', 'barracks2', 'council1', 'forge1', 'forge2', 'hospital1', 'hospital2', 'magic1', 'magic2', 'market1', 'market2', 'spark1',
             'tavern1', 'treasury', 'treasury2', 'walls1', 'walls2', 'plot', 'shieldHall1', 'runeForge1', 'deepMine1']
DWELLINGS = ['armoredBear', 'battleSmith', 'bronzeSentinel', 'ramGoat', 'giantSlayer', 'skarbnik', 'hammerGuard', 'dwarfCannon', 'clanColossus']


def cut(im: Image.Image) -> Image.Image:
    a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(3))
    bb = a.getbbox()
    pad = 3
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    return im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS)


if __name__ == '__main__':
    Image.open(f'{SRC}/land.png').convert('RGB').resize((1280, 600), Image.LANCZOS).save(f'{OUT}/land_clans.jpg', quality=86)
    for b in BUILDINGS:
        cut(Image.open(f'{SRC}/{b}.png').convert('RGBA')).save(f'{OUT}/clans_{b}.webp', quality=85, method=6)
    for u in DWELLINGS:
        cut(Image.open(f'{SRC}/dw_{u}.png').convert('RGBA')).save(f'{OUT}/dwelling_{u}.webp', quality=85, method=6)
    print('done')
