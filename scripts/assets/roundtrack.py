"""Round track: docs/grafika/ikony/tor_rund.png -> public/assets/ui/round_track.png + round_crystal.png.

The sheet holds the track and, bottom right, the crystal marker in a gold frame. The track is
cut out on its own; from the marker only the faceted gem is kept (the frame and its dark-blue
backing are masked away by the gem's hexagon). Socket centres used by src/ui/RoundTrack.tsx are
printed as fractions of the track image.
Usage: python3 scripts/assets/roundtrack.py
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'tor_rund.png')
OUT = os.path.join(ROOT, 'public', 'assets', 'ui')

# The marker in the sheet's bottom-right corner, and the gem inside it (pointy-top hexagon).
MARKER = [(1124, 950), (1226, 1014), (1226, 1146), (1124, 1199), (1019, 1146), (1019, 1014)]
GEM = [(1123, 1003), (1177, 1042), (1177, 1111), (1123, 1149), (1069, 1111), (1069, 1042)]
# Socket centres on the sheet, rounds 1..20 (measured on the painting).
SOCKETS = [(627, 172), (745, 183), (862, 240), (954, 310), (1027, 440), (1057, 571), (1035, 697), (975, 810), (874, 918), (750, 982),
           (627, 1005), (495, 975), (367, 915), (277, 817), (225, 705), (192, 571), (232, 445), (285, 324), (387, 240), (510, 192)]
TRACK_SIZE = 560
GEM_SIZE = 160
SS = 4


def gem(sheet):
    mask = Image.new('L', (sheet.width * SS, sheet.height * SS))
    ImageDraw.Draw(mask).polygon([(x * SS, y * SS) for x, y in GEM], fill=255)
    mask = mask.resize(sheet.size, Image.LANCZOS)
    out = sheet.copy()
    out.putalpha(Image.composite(sheet.getchannel('A'), Image.new('L', sheet.size), mask))
    out = out.crop(out.getchannel('A').getbbox())
    k = GEM_SIZE / max(out.size)
    return out.resize((round(out.width * k), round(out.height * k)), Image.LANCZOS)


if __name__ == '__main__':
    sheet = Image.open(SRC).convert('RGBA')
    track = sheet.copy()
    ImageDraw.Draw(track).polygon(MARKER, fill=(0, 0, 0, 0))
    box = track.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    track = track.crop(box)
    w, h = track.size
    track.resize((TRACK_SIZE, round(TRACK_SIZE * h / w)), Image.LANCZOS).save(os.path.join(OUT, 'round_track.png'), optimize=True)
    gem(sheet).save(os.path.join(OUT, 'round_crystal.png'), optimize=True)
    print('track box', box, 'aspect', round(h / w, 4))
    print('sockets', [(round((x - box[0]) / w, 4), round((y - box[1]) / h, 4)) for x, y in SOCKETS])
