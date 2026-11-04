"""Digital arena pictures: compact obstacle sprites and backgrounds with a clean plate under the board.

Usage: python3 scripts/assets/arena_cyfrowa.py <dir with the raw PNGs> <output dir>
  raw: dawn_raw.png, horde_raw.png (1536x1024) and one PNG per obstacle (transparent, 768x768).
The grid sits in the middle of the picture (see src/ui/arenaGeometry.ts); trees and ruins of the frame sometimes reached
under its corners, so the board area is replaced by a mirror-tiled crop of the clean middle of the same picture with a soft edge.
"""
import glob
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

# Board rectangle in the 1000 x 667 canvas of arenaGeometry (13.5 hex widths of 62, 14 hex radii), with a margin.
BOARD = (81, 83, 919, 584)
MARGIN = 6
FEATHER = 36


def clean_plate(im: Image.Image) -> Image.Image:
    w, h = im.size
    k = w / 1000
    x0, y0, x1, y1 = (int(v * k) for v in (BOARD[0] - MARGIN, BOARD[1] - MARGIN, BOARD[2] + MARGIN, BOARD[3] + MARGIN))
    # A clean piece from the middle, mirrored over and over to cover the board.
    cw, ch = int(w * 0.34), int(h * 0.26)
    cx, cy = int(w * 0.33), int(h * 0.38)
    piece = im.crop((cx, cy, cx + cw, cy + ch))
    tile = Image.new("RGB", (cw * 2, ch * 2))
    tile.paste(piece, (0, 0))
    tile.paste(piece.transpose(Image.FLIP_LEFT_RIGHT), (cw, 0))
    tile.paste(piece.transpose(Image.FLIP_TOP_BOTTOM), (0, ch))
    tile.paste(piece.transpose(Image.ROTATE_180), (cw, ch))
    plate = Image.new("RGB", (w, h))
    # Offset so the original middle stays roughly where it was.
    for ty in range(y0 - ch * 2, y1 + ch * 2, ch * 2):
        for tx in range(x0 - cw * 2, x1 + cw * 2, cw * 2):
            plate.paste(tile, (tx, ty))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle((x0 + FEATHER, y0 + FEATHER, x1 - FEATHER, y1 - FEATHER), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(FEATHER / 1.5))
    return Image.composite(plate, im, mask)


def sprite(im: Image.Image, size: int = 320) -> Image.Image:
    a = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).filter(ImageFilter.MinFilter(5))
    bb = a.getbbox()
    pad = 4
    im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    im.thumbnail((size, size), Image.LANCZOS)
    return im


if __name__ == "__main__":
    src, dst = sys.argv[1:3]
    os.makedirs(dst, exist_ok=True)
    for name in ("dawn", "horde"):
        clean_plate(Image.open(os.path.join(src, f"{name}_raw.png")).convert("RGB")).save(os.path.join(dst, f"{name}.webp"), quality=82, method=6)
    for f in sorted(glob.glob(os.path.join(src, "*.png"))):
        name = os.path.basename(f)[:-4]
        if name.endswith("_raw") or name in ("both", "obst", "obst2"):
            continue
        sprite(Image.open(f).convert("RGBA")).save(os.path.join(dst, f"{name}.webp"), quality=85, method=6)
