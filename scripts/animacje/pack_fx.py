"""Packs a light effect clip (bright on pure black) into a one-row WebP sheet with alpha taken from brightness
(alpha = max(r, g, b), colour un-premultiplied), for effects drawn on top of the arena (docs/POTOK_ANIMACJI.md).

Usage: python3 scripts/animacje/pack_fx.py <ffmpeg exe> <clip.mp4> <out.webp> <frame px> <fps> <first frame> <last frame>
Prints the frame count; the game plays the sheet with CSS steps() (see .fx-sheet in styles.css)."""
import glob
import os
import subprocess
import sys
import tempfile

from PIL import Image


def main() -> None:
    ff, clip, out, size, fps, first, last = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5], int(sys.argv[6]), int(sys.argv[7])
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ff, "-loglevel", "error", "-i", clip, "-vf", f"fps={fps},scale={size}:{size}:flags=lanczos", os.path.join(tmp, "f%03d.png")], check=True)
        files = sorted(glob.glob(os.path.join(tmp, "f*.png")))[first - 1:last]
        sheet = Image.new("RGBA", (size * len(files), size))
        for i, f in enumerate(files):
            rgb = Image.open(f).convert("RGB")
            px = rgb.load()
            rgba = Image.new("RGBA", rgb.size)
            rp = rgba.load()
            for y in range(size):
                for x in range(size):
                    r, g, b = px[x, y]
                    a = max(r, g, b)
                    # a little floor so the black of the video does not leave a faint box
                    a = 0 if a < 10 else a
                    rp[x, y] = (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), a) if a else (0, 0, 0, 0)
            sheet.paste(rgba, (i * size, 0))
    sheet.save(out, quality=75, method=6)
    print(len(files), "frames,", os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
