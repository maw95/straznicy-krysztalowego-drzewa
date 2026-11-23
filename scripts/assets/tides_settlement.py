"""Settlement screen of the Brotherhood of the Tide from the generated pictures in .tmp/zrodla/tides_settlement (G4 phase 4).
 - osady/land_tides.jpg: the background, 1280x600 like land_dawn.jpg;
 - osady/tides_<building><level>.webp: building sprites cut to their opaque box and scaled to 380 px high;
 - osady/dwelling_<unit>.webp: the nine dwellings of the units that are recruited in a settlement.
Usage: python3 scripts/assets/tides_settlement.py"""
from PIL import Image, ImageFilter

SRC = '.tmp/zrodla/tides_settlement'
OUT = 'public/assets/osady'
H = 380
BUILDINGS = {  # source -> file
    'barracks1': 'tides_barracks1', 'barracks2': 'tides_barracks2', 'council1': 'tides_council1', 'forge1': 'tides_forge1', 'forge2': 'tides_forge2',
    'hospital1': 'tides_hospital1', 'hospital2': 'tides_hospital2', 'magic1': 'tides_magic1', 'magic2': 'tides_magic2', 'market1': 'tides_market1',
    'market2': 'tides_market2', 'spark1': 'tides_spark1', 'tavern1': 'tides_tavern1', 'treasury': 'tides_treasury', 'treasury2': 'tides_treasury2',
    'walls1': 'tides_walls1', 'walls2': 'tides_walls2', 'plot': 'tides_plot', 'tideTemple1': 'tides_tideTemple1', 'pearlBanks1': 'tides_pearlBanks1',
    'lighthouse1': 'tides_lighthouse1',
}
DWELLINGS = ['crabShield', 'inkOctopus', 'sharkman', 'pearlPriestess', 'lobsterKnight', 'albatross', 'reefGolem', 'seaWitch', 'leviathan']


def cut(im: Image.Image) -> Image.Image:
    a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(3))
    bb = a.getbbox()
    pad = 3
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    return im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS)


if __name__ == '__main__':
    Image.open(f'{SRC}/land.png').convert('RGB').resize((1280, 600), Image.LANCZOS).save(f'{OUT}/land_tides.jpg', quality=86)
    for src, name in BUILDINGS.items():
        cut(Image.open(f'{SRC}/{src}.png').convert('RGBA')).save(f'{OUT}/{name}.webp', quality=85, method=6)
    for u in DWELLINGS:
        cut(Image.open(f'{SRC}/dw_{u}.png').convert('RGBA')).save(f'{OUT}/dwelling_{u}.webp', quality=85, method=6)
    print('done')
