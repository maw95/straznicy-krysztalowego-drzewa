"""Clean keyed animation frames: remove the colour fringe left by the chroma key.

Usage: python3 scripts/animacje/clean_frames.py <dir with f001.png ...> <output dir>

Frames come from `ffmpeg -vf "chromakey=0x0000ff:0.18:0.05" in.mp4 dir/f%03d.png` (blue key; see docs/POTOK_ANIMACJI.md).
Needs only Pillow. Gold has B < G in every pixel, so clamping blue to green removes the blue/purple spill without
touching the unit; the mask is eroded by 1 px and slightly blurred. Do NOT use ffmpeg's `despill`: it turns gold red.
"""
import glob
import os
import sys

from PIL import Image, ImageChops, ImageFilter


def clean(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()
    b2 = ImageChops.darker(b, g)
    a2 = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    return Image.merge("RGBA", (r, g, b2, a2))


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, "f*.png"))):
        clean(Image.open(f).convert("RGBA")).save(os.path.join(dst, os.path.basename(f)))
