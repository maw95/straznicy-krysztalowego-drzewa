"""Pack unit clips and stills into compact WebP sprite sheets (see docs/POTOK_ANIMACJI.md).

Usage: python3 scripts/animacje/pack_unit.py <ffmpeg exe> <source dir> <output dir> [size=512] [cols=8]
Source dir holds: <name>.mp4 (blue-key clips) and <name>.png (blue-key stills). Output: <name>.webp sheets
(lossy WebP with alpha, row-major, all frames cropped to one common box) and anim.json with frame counts. Needs Pillow.
"""
import glob
import json
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from clean_frames import clean  # noqa: E402


def main() -> None:
    ff, src, dst = sys.argv[1:4]
    size = int(sys.argv[4]) if len(sys.argv) > 4 else 512
    cols = int(sys.argv[5]) if len(sys.argv) > 5 else 8
    os.makedirs(dst, exist_ok=True)
    clips = {}  # name -> list of RGBA frames (size x size)
    for mp4 in sorted(glob.glob(os.path.join(src, "*.mp4"))):
        name = os.path.splitext(os.path.basename(mp4))[0]
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run([ff, "-loglevel", "error", "-i", mp4, "-vf", "chromakey=0x0000ff:0.18:0.05",
                            os.path.join(tmp, "f%03d.png")], check=True)
            clips[name] = [clean(Image.open(f).convert("RGBA")).resize((size, size), Image.LANCZOS)
                           for f in sorted(glob.glob(os.path.join(tmp, "f*.png")))]
    for png in sorted(glob.glob(os.path.join(src, "*.png"))):
        name = os.path.splitext(os.path.basename(png))[0]
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run([ff, "-loglevel", "error", "-i", png, "-vf", "chromakey=0x0000ff:0.18:0.05",
                            os.path.join(tmp, "f%03d.png")], check=True)
            clips[name] = [clean(Image.open(os.path.join(tmp, "f001.png")).convert("RGBA")).resize((size, size), Image.LANCZOS)]
    # One crop box for the whole unit keeps every clip aligned (same anchor point on the board).
    # Erode the mask first so stray pixels (keying noise) do not stretch the box.
    boxes = [f.getchannel("A").point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MinFilter(7)).getbbox()
             for fs in clips.values() for f in fs]
    boxes = [b for b in boxes if b]
    pad = 6
    x0, y0 = max(0, min(b[0] for b in boxes) - pad), max(0, min(b[1] for b in boxes) - pad)
    x1, y1 = min(size, max(b[2] for b in boxes) + pad), min(size, max(b[3] for b in boxes) + pad)
    w, h = x1 - x0, y1 - y0
    meta = {"source_frame": size, "crop": [x0, y0, w, h], "frame": [w, h], "cols": cols, "fps": 24, "clips": {}}
    # Where the unit stands in the cropped frame, from the standing picture: feet line, horizontal middle and body width (fractions).
    if "stoi" in clips:
        sb = clips["stoi"][0].crop((x0, y0, x1, y1)).getchannel("A").point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MinFilter(7)).getbbox()
        if sb:
            meta.update({"feet": round(sb[3] / h, 4), "cx": round((sb[0] + sb[2]) / 2 / w, 4), "body": round((sb[2] - sb[0]) / w, 4)})
    for name, fs in clips.items():
        fs = [f.crop((x0, y0, x1, y1)) for f in fs]
        rows = math.ceil(len(fs) / cols) if len(fs) > 1 else 1
        out = Image.new("RGBA", ((cols if len(fs) > 1 else 1) * w, rows * h), (0, 0, 0, 0))
        for i, f in enumerate(fs):
            out.paste(f, ((i % cols) * w, (i // cols) * h)) if len(fs) > 1 else out.paste(f, (0, 0))
        out.save(os.path.join(dst, name + ".webp"), quality=int(os.environ.get("WEBP_Q", "70")), method=4)
        if len(fs) > 1:
            meta["clips"][name] = len(fs)
    json.dump(meta, open(os.path.join(dst, "anim.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
