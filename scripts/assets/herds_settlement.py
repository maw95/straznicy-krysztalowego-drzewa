"""Settlement screen of the Wild Herd from the generated pictures in .tmp/zrodla/herds_settlement (backlog 61g, 21.11.2026).
 - osady/land_herds.jpg: the background, 1280x600 like land_dawn.jpg;
 - osady/herds_<building><level>.webp: building sprites cut to their opaque box and scaled to 380 px high (the size of the existing ones);
 - osady/dwelling_<unit>.webp: the nine dwellings (small pens) of the units that are recruited in a settlement.
Usage: python3 scripts/assets/herds_settlement.py"""
from PIL import Image, ImageFilter

SRC = '.tmp/zrodla/herds_settlement'
OUT = 'public/assets/osady'
H = 380
BUILDINGS = {  # source -> file
    'barracks1': 'herds_barracks1', 'barracks2': 'herds_barracks2', 'council1': 'herds_council1', 'forge1': 'herds_forge1', 'forge2': 'herds_forge2',
    'hospital1': 'herds_hospital1', 'hospital2': 'herds_hospital2', 'magic1': 'herds_magic1', 'magic2': 'herds_magic2', 'market1': 'herds_market1',
    'market2': 'herds_market2', 'spark1': 'herds_spark1', 'tavern1': 'herds_tavern1', 'treasury': 'herds_treasury', 'treasury2': 'herds_treasury2',
    'walls1': 'herds_walls1', 'walls2': 'herds_walls2', 'plot': 'herds_plot', 'hoofStone1': 'herds_hoofStone1', 'pastures1': 'herds_pastures1',
    'refuge1': 'herds_refuge1',
}
DWELLINGS = ['steppeArcher', 'forestBison', 'steppeLamignat', 'warRhino', 'muskOx', 'arkar', 'drumElephant', 'bullMoose', 'indrik']


def cut(im: Image.Image) -> Image.Image:
    a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(3))
    bb = a.getbbox()
    pad = 3
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    return im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS)


if __name__ == '__main__':
    Image.open(f'{SRC}/land.png').convert('RGB').resize((1280, 600), Image.LANCZOS).save(f'{OUT}/land_herds.jpg', quality=86)
    for src, name in BUILDINGS.items():
        cut(Image.open(f'{SRC}/{src}.png').convert('RGBA')).save(f'{OUT}/{name}.webp', quality=85, method=6)
    for u in DWELLINGS:
        cut(Image.open(f'{SRC}/dw_{u}.png').convert('RGBA')).save(f'{OUT}/dwelling_{u}.webp', quality=85, method=6)
    print('done')
