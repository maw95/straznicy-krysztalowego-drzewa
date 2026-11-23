"""Finds where each unit's square portrait (cards/portraits) lies in its card art (cards/art) and writes src/ui/cardCrops.ts, so that the card shows the same
framing as the portrait (backlog 62e). Crop = [cx, cy, side]: centre as shares of the art's width / height, side as a share of the art's height.
Brute-force match of small greyscale copies (no numpy/OpenCV here); portraits that do not match well (blurred bands, heavy colour work) are left out and the card keeps its old framing.
Usage: python3 scripts/assets/card_crops.py"""
import os

from PIL import Image, ImageChops, ImageOps, ImageStat

ART, POR = 'public/assets/cards/art', 'public/assets/cards/portraits'
SMALL = 96  # height of the art copy used for matching
MAX_ERR = 33  # mean abs difference (0-255) above which a match is not trusted (correct matches of re-graded portraits reach ~30)


def prep(im: Image.Image) -> Image.Image:
    return ImageOps.autocontrast(im.convert('L'), cutoff=1)


def match(art: Image.Image, por: Image.Image):
    w, h = art.size
    sh = SMALL
    sw = round(w * sh / h)
    a = prep(art.resize((sw, sh), Image.BILINEAR))
    best = (1e9, None)
    for side in range(round(sh * 0.4), sh + 1, 2):
        sw_ = min(side, sw)
        if side > sw:
            continue
        p = prep(por.resize((side, side), Image.BILINEAR))
        for t in range(0, sh - side + 1, 2):
            for l in range(0, sw - side + 1, 2):
                err = ImageStat.Stat(ImageChops.difference(a.crop((l, t, l + side, t + side)), p)).mean[0]
                if err < best[0]:
                    best = (err, (l, t, side))
    # refine at pixel steps around the best
    err, (l0, t0, s0) = best
    for side in range(max(8, s0 - 3), min(sh, s0 + 3) + 1):
        if side > sw:
            continue
        p = prep(por.resize((side, side), Image.BILINEAR))
        for t in range(max(0, t0 - 2), min(sh - side, t0 + 2) + 1):
            for l in range(max(0, l0 - 2), min(sw - side, l0 + 2) + 1):
                e = ImageStat.Stat(ImageChops.difference(a.crop((l, t, l + side, t + side)), p)).mean[0]
                if e < best[0]:
                    best = (e, (l, t, side))
    err, (l, t, side) = best
    return err, ((l + side / 2) / sw, (t + side / 2) / sh, side / sh)


def main() -> None:
    out, bad = {}, []
    for f in sorted(os.listdir(POR)):
        n = f[:-4]
        if not os.path.exists(f'{ART}/{n}.jpg'):
            continue
        err, (cx, cy, s) = match(Image.open(f'{ART}/{n}.jpg'), Image.open(f'{POR}/{f}'))
        if err > MAX_ERR:
            bad.append((n, round(err, 1)))
            continue
        out[n] = (round(cx, 3), round(cy, 3), round(s, 3))
    lines = ',\n'.join(f"  {n}: [{c[0]}, {c[1]}, {c[2]}]" for n, c in out.items())
    open('src/ui/cardCrops.ts', 'w').write(
        "// Where the square portrait of each unit lies in its card art: [centre x, centre y, side], as shares of the art's width / height / height.\n"
        "// Made by scripts/assets/card_crops.py; the card shows the same framing as the portrait. Units not listed keep the plain framing.\n"
        f"export const CARD_CROPS: Record<string, [number, number, number]> = {{\n{lines},\n}};\n")
    print(len(out), 'matched; not trusted:', bad)


if __name__ == '__main__':
    main()
