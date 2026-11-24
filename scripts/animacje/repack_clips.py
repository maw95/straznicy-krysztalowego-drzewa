"""Replaces single clips of a finished (already shrunk) unit folder without the old sources.
Usage: python3 scripts/animacje/repack_clips.py <ffmpeg exe> <unit folder> <clip>=<mp4> [...] [--martwy]
Each mp4 (blue key) goes through the same steps as pack_unit -> despill_blue -> shrink_unit, but cropped with the crop box already stored in
anim.json, so the frame size stays the same and the other sheets stay valid. --martwy rebuilds martwy.webp from the last frame of the smierc clip."""
import glob, json, math, os, subprocess, sys, tempfile
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from clean_frames import clean
from PIL import ImageChops


def despill(im):  # same as despill_blue.py (importing that file would run it on sys.argv)
    r, g, b, a = im.convert('RGBA').split()
    over_green = ImageChops.subtract(b, g).point(lambda v: 255 if v > 8 else 0)
    near_red = ImageChops.subtract(b.point(lambda v: min(255, v * 3 // 2)), r).point(lambda v: 255 if v > 0 else 0)
    return Image.merge('RGBA', (r, g, b, ImageChops.subtract(a, ImageChops.multiply(over_green, near_red))))



ff, folder, *rest = sys.argv[1:]
martwy = '--martwy' in rest
pairs = [a.split('=', 1) for a in rest if '=' in a]
meta = json.load(open(os.path.join(folder, 'anim.json')))
x0, y0, w, h = meta['crop']; size = meta['source_frame']; cols = meta['cols']; scale = meta['scale']; step = meta['step']
nw, nh = meta['frame']; q = int(os.environ.get('WEBP_Q', '80'))

def frames(mp4):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ff, '-loglevel', 'error', '-i', mp4, '-vf', 'chromakey=0x0000ff:0.18:0.05', os.path.join(tmp, 'f%03d.png')], check=True)
        return [despill(clean(Image.open(f).convert('RGBA')).resize((size, size), Image.LANCZOS).crop((x0, y0, x0 + w, y0 + h)))
                for f in sorted(glob.glob(os.path.join(tmp, 'f*.png')))]

def cut_right(f, cx):
    a = f.getchannel('A').copy(); a.paste(0, (max(0, cx), 0, f.width, f.height))
    return Image.merge('RGBA', (*f.split()[:3], a))

def small(f):
    return f.resize((nw, nh), Image.LANCZOS)

fades = {k: float(v) for k, v in (kv.split('=') for kv in os.environ.get('FADE_RIGHT', '').split(',') if kv)}

def fade(fs, frac):
    band = max(1, int(w * frac)); ramp = Image.new('L', (w, 1), 255)
    for i in range(band): ramp.putpixel((w - band + i, 0), int(255 * (1 - (i + 1) / band) ** 1.3))
    mask = ramp.resize((w, h))
    return [Image.merge('RGBA', (*f.split()[:3], ImageChops.multiply(f.getchannel('A'), mask))) for f in fs]

cuts = {k: int(v) for k, v in (kv.split('=') for kv in os.environ.get('CUT_X', '').split(',') if kv)}  # CUT_X="atak=452": erase everything right of that x (512 px source space), e.g. a prop the video invented

for clip, mp4 in pairs:
    fs = frames(mp4)
    if clip in cuts:
        cx = cuts[clip] - x0
        fs = [cut_right(f, cx) for f in fs]
    if clip in fades: fs = fade(fs, fades[clip])
    n = len(fs); keep = list(range(0, n, step))
    if keep[-1] != n - 1: keep.append(n - 1)
    rows = math.ceil(len(keep) / cols)
    out = Image.new('RGBA', (cols * nw, rows * nh), (0, 0, 0, 0))
    for j, i in enumerate(keep): out.paste(small(fs[i]), ((j % cols) * nw, (j // cols) * nh))
    out.save(os.path.join(folder, clip + '.webp'), quality=q, method=6)
    meta['clips'][clip] = len(keep)
    if clip == 'smierc' and martwy:
        small(fs[-1]).save(os.path.join(folder, 'martwy.webp'), quality=q, method=6)
    print(clip, n, '->', len(keep))
json.dump(meta, open(os.path.join(folder, 'anim.json'), 'w'), indent=1)
