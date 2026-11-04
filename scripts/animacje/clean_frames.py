"""Clean keyed animation frames: remove the colour fringe left by the chroma key.

Usage: python3 scripts/animacje/clean_frames.py <dir with f001.png ...> <output dir>

Frames come from `ffmpeg -vf "chromakey=0x0000ff:0.18:0.05" in.mp4 dir/f%03d.png` (blue key; see docs/POTOK_ANIMACJI.md).
Needs only Pillow. Blue is clamped to green on the edge band only (no change inside the unit); the mask is eroded by 1 px and slightly blurred.
Do NOT use ffmpeg's `despill`: it turns gold red. Keep blue out of the unit's own palette.
"""
import glob
import os
import sys

from PIL import Image, ImageChops, ImageFilter


def clean(im: Image.Image) -> Image.Image:
    """Removes the blue spill on the edge only (a band round the silhouette and the half-transparent pixels), so the colours
    inside the unit stay as painted; then pulls the mask in by a pixel and softens it."""
    r, g, b, a = im.split()
    edge = ImageChops.subtract(a, a.filter(ImageFilter.MinFilter(3)))
    soft = a.point(lambda v: 255 if 0 < v < 250 else 0)
    band = ImageChops.lighter(edge, soft).filter(ImageFilter.MaxFilter(3))
    b2 = Image.composite(ImageChops.darker(b, g), b, band)
    a2 = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    return Image.merge("RGBA", (r, g, b2, a2))


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, "f*.png"))):
        clean(Image.open(f).convert("RGBA")).save(os.path.join(dst, os.path.basename(f)))
