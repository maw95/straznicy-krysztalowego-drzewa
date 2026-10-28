"""Round track: docs/grafika/ikony/tor_rund.png -> public/assets/ui/round_track.png + round_crystal.png
(and the same two files for the rulebook, docs/wersja_planszowa/instrukcja_szablon/assets/).

The sheet (transparent) holds the hexagonal track with 24 sockets and, bottom right, the faceted
gem that marks the current round. Socket centres used by src/ui/RoundTrack.tsx are printed as
fractions of the cropped track image.
Usage: python3 scripts/assets/roundtrack.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'docs', 'grafika', 'ikony', 'tor_rund.png')
OUTS = [os.path.join(ROOT, 'public', 'assets', 'ui'), os.path.join(ROOT, 'docs', 'wersja_planszowa', 'instrukcja_szablon', 'assets')]

# The round marker: a separate gem in the sheet's bottom-right corner.
GEM_BOX = (1040, 1000, 1240, 1200)
# Socket centres on the sheet, rounds 1..24 clockwise from the top: found by matching one painted
# socket (the two glowing ones, 19 and 24, mirror 7 and 2), then centred on each socket's inside.
SOCKETS = [(630, 153), (735, 174), (841, 211), (931, 279), (997, 368), (1054, 463), (1081, 579), (1054, 701), (1003, 793), (934, 881),
           (847, 953), (743, 999), (633, 1022), (516, 999), (411, 953), (322, 881), (254, 792), (204, 695), (182, 578), (205, 460),
           (261, 367), (329, 278), (420, 208), (527, 174)]
TRACK_SIZE = 560
GEM_SIZE = 160


def trimmed(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())


if __name__ == '__main__':
    sheet = Image.open(SRC).convert('RGBA')
    gem = trimmed(sheet.crop(GEM_BOX))
    gem = gem.resize((round(gem.width * GEM_SIZE / max(gem.size)), round(gem.height * GEM_SIZE / max(gem.size))), Image.LANCZOS)
    track = sheet.copy()
    track.paste((0, 0, 0, 0), GEM_BOX)
    box = track.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    track = track.crop(box)
    w, h = track.size
    for out in OUTS:
        os.makedirs(out, exist_ok=True)
        track.resize((TRACK_SIZE, round(TRACK_SIZE * h / w)), Image.LANCZOS).save(os.path.join(out, 'round_track.png'), optimize=True)
        gem.save(os.path.join(out, 'round_crystal.png'), optimize=True)
    print('track box', box, 'aspect', round(h / w, 4))
    print('sockets', [(round((x - box[0]) / w, 4), round((y - box[1]) / h, 4)) for x, y in SOCKETS])
