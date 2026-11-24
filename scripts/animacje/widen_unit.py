"""Widens the common crop box of a finished (shrunk) unit folder so that new clips (e.g. a death clip that ends with a long lying body or a
cloud of dust) fit in the frame. All existing sheets and stills are padded with transparency, anim.json (crop, frame, feet, cx, body) is updated
so the unit keeps its size and anchor on the board. Usage: python3 scripts/animacje/widen_unit.py <ffmpeg exe> <unit folder> <new clip mp4> [...]"""
import glob, json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from clean_frames import clean

ff, folder, *mp4s = sys.argv[1:]
meta = json.load(open(os.path.join(folder, 'anim.json')))
ox0, oy0, ow, oh = meta['crop']; size = meta['source_frame']; sc = meta['scale']; cols = meta['cols']; pad = 6
bx = [ox0, oy0, ox0 + ow, oy0 + oh]
for mp4 in mp4s:
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ff, '-loglevel', 'error', '-i', mp4, '-vf', 'chromakey=0x0000ff:0.18:0.05', os.path.join(tmp, 'f%03d.png')], check=True)
        fs = sorted(glob.glob(os.path.join(tmp, 'f*.png')))
        for f in fs[::2] + [fs[-1]]:
            im = clean(Image.open(f).convert('RGBA')).resize((size, size), Image.LANCZOS)
            b = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MinFilter(7)).getbbox()
            if b: bx = [min(bx[0], b[0] - pad), min(bx[1], b[1] - pad), max(bx[2], b[2] + pad), max(bx[3], b[3] + pad)]
nx0, ny0, nx1, ny1 = max(0, bx[0]), max(0, bx[1]), min(size, bx[2]), min(size, bx[3])
if (nx0, ny0, nx1, ny1) == (ox0, oy0, ox0 + ow, oy0 + oh):
    sys.exit('crop already wide enough')
nw, nh = nx1 - nx0, ny1 - ny0
ofw, ofh = meta['frame']; fw, fh = round(nw * sc), round(nh * sc)
dx, dy = round((ox0 - nx0) * sc), round((oy0 - ny0) * sc)
q = int(os.environ.get('WEBP_Q', '80'))
for name in list(meta['clips']) + ['stoi', 'martwy']:
    p = os.path.join(folder, name + '.webp'); sheet = Image.open(p).convert('RGBA')
    n = meta['clips'].get(name, 1)
    c = cols if n > 1 else 1; rows = math.ceil(n / cols) if n > 1 else 1
    out = Image.new('RGBA', (c * fw, rows * fh), (0, 0, 0, 0))
    for i in range(n):
        fr = sheet.crop(((i % c) * ofw, (i // c) * ofh, (i % c) * ofw + ofw, (i // c) * ofh + ofh))
        out.paste(fr, ((i % c) * fw + dx, (i // c) * fh + dy))
    out.save(p, quality=q, method=6)
meta['feet'] = round((meta['feet'] * oh + oy0 - ny0) / nh, 4)
meta['cx'] = round((meta['cx'] * ow + ox0 - nx0) / nw, 4)
meta['body'] = round(meta['body'] * ow / nw, 4)
meta.update({'crop': [nx0, ny0, nw, nh], 'frame': [fw, fh]})
json.dump(meta, open(os.path.join(folder, 'anim.json'), 'w'), indent=1)
print(folder, 'crop', [ox0, oy0, ow, oh], '->', meta['crop'], 'frame', [ofw, ofh], '->', [fw, fh])
