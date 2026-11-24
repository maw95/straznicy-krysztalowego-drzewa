"""Packs the light effects of the mechanics (Tides, Herds, Clans; BACKLOG 81) from the clips in .tmp/zrodla/efekty81/<name>.mp4
into public/assets/efekty/<name>.webp (24 frames of 192 px, 12 fps, via scripts/animacje/pack_fx.py).
Usage from the repo root: python3 scripts/assets/mechanics_fx.py herds_push herds_collision ..."""
import subprocess
import sys

FF = open(".tmp/ffpath").read().strip()
for name in sys.argv[1:]:
    subprocess.run(["python3", "scripts/animacje/pack_fx.py", FF, f".tmp/zrodla/efekty81/{name}.mp4", f"public/assets/efekty/{name}.webp", "192", "12", "1", "24"], check=True)
