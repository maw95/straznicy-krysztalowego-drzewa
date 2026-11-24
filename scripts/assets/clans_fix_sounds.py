"""Level the replaced Iron Clan unit sounds (backlog 86): raw Scenario mp3 from .tmp/zrodla/klany86_a/raw -> public/assets/dzwieki/jednostki.
Gain brings the mean volume to TARGET dB (quiet sounds such as a sigh get less), a limiter keeps peaks under 0.95, short fade-out. Run from the repo root."""
import pathlib, re, subprocess
FF = open('.tmp/ffpath').read().strip()
RAW = pathlib.Path('.tmp/zrodla/klany86_a/raw'); OUT = pathlib.Path('public/assets/dzwieki/jednostki')
TARGET = {'passWarden_smierc': -27.0, 'passWarden_atak': -22.0}  # default -21
for f in sorted(RAW.glob('*.mp3')):
    r = subprocess.run([FF, '-i', str(f), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: (-?[\d.]+) dB', r).group(1))
    dur = float(re.search(r'Duration: 00:00:(\d+\.\d+)', r).group(1))
    gain = TARGET.get(f.stem, -21.0) - mean
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', str(f), '-af', f'volume={gain:.1f}dB,alimiter=limit=0.95,afade=t=out:st={dur - 0.12:.2f}:d=0.12',
                    '-b:a', '128k', str(OUT / f.name)], check=True)
    print(f.name, f'gain {gain:+.1f} dB', (OUT / f.name).stat().st_size, 'bytes')
