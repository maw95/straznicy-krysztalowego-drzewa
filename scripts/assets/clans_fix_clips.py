"""Replace single clips of an Iron Clan unit without repacking the others (backlog 86).
Usage: python3 scripts/assets/clans_fix_clips.py <unit folder> <clip>=<mp4> [...]      (MARTWY=1: also martwy.webp from the last frame of smierc;
CUT_RIGHT=0.8: erase everything right of 80% of the source frame)
Keys the blue background, cleans the fringe, cuts with the crop box of the existing anim.json (all clips stay aligned), despills,
shrinks by the scale and step of anim.json, writes the sheet and updates the clip frame count. Needs Pillow; ffmpeg path in .tmp/ffpath."""
import glob, json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageChops

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'animacje'))
from clean_frames import clean  # noqa: E402

FF = open('.tmp/ffpath').read().strip()


def despill(im):
    r, g, b, a = im.split()
    over = ImageChops.subtract(b, g).point(lambda v: 255 if v > 8 else 0)
    near = ImageChops.subtract(b.point(lambda v: min(255, v * 3 // 2)), r).point(lambda v: 255 if v > 0 else 0)
    return Image.merge('RGBA', (r, g, b, ImageChops.subtract(a, ImageChops.multiply(over, near))))


def frames(mp4, size, crop):
    x0, y0, w, h = crop
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([FF, '-loglevel', 'error', '-i', mp4, '-vf', 'chromakey=0x0000ff:0.18:0.05', os.path.join(tmp, 'f%03d.png')], check=True)
        return [clean(Image.open(f).convert('RGBA')).resize((size, size), Image.LANCZOS).crop((x0, y0, x0 + w, y0 + h)) for f in sorted(glob.glob(os.path.join(tmp, 'f*.png')))]


folder = sys.argv[1]
meta = json.load(open(os.path.join(folder, 'anim.json')))
nw, nh = meta['frame']; step = meta['step']; scale = meta['scale']; cols = meta['cols']  # frame is already the shrunk size
for spec in sys.argv[2:]:
    name, mp4 = spec.split('=')
    fs = [despill(f) for f in frames(mp4, meta['source_frame'], meta['crop'])]
    cut = float(os.environ.get('CUT_RIGHT', '0'))  # erase everything right of this share of the source frame (a stray figure the model added)
    if cut:
        edge = round(meta['source_frame'] * cut) - meta['crop'][0]
        for f in fs:
            f.paste((0, 0, 0, 0), (max(0, edge), 0, f.width, f.height))
    n = len(fs)
    keep = list(range(0, n, step))
    if keep[-1] != n - 1:
        keep.append(n - 1)
    sheet = Image.new('RGBA', (cols * nw, math.ceil(len(keep) / cols) * nh), (0, 0, 0, 0))
    for j, i in enumerate(keep):
        sheet.paste(fs[i].resize((nw, nh), Image.LANCZOS), ((j % cols) * nw, (j // cols) * nh))
    sheet.save(os.path.join(folder, name + '.webp'), quality=80, method=6)
    meta['clips'][name] = len(keep)
    if name == 'smierc' and os.environ.get('MARTWY'):
        last = fs[-1]
        last.resize((round(last.width * scale), round(last.height * scale)), Image.LANCZOS).save(os.path.join(folder, 'martwy.webp'), quality=80, method=6)
    print(folder, name, n, '->', len(keep))
json.dump(meta, open(os.path.join(folder, 'anim.json'), 'w'), indent=1)
