"""Free Company mechanic sounds (G4, 26.11.2026): snare, Raven's mark, powder charge, dam and purse; levelled like the unit sounds
(leading silence cut, mean about -21 dB, limiter, short fade-out, mono 128 kbps). Raw downloads: .tmp/zrodla/free_audio/mech. Run from the repo root."""
import pathlib, re, subprocess
FF = open('.tmp/ffpath').read().strip() if pathlib.Path('.tmp/ffpath').exists() else 'ffmpeg'
RAW = pathlib.Path('.tmp/zrodla/free_audio/mech')
TARGET = -21.0
TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB'

for f in sorted(RAW.glob('free_*.mp3')):
    r = subprocess.run([FF, '-i', str(f), '-af', TRIM + ',volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: (-?[\d.]+) dB', r).group(1))
    m = re.search(r'Duration: 00:0(\d):(\d+\.\d+)', r)
    dur = float(m.group(1)) * 60 + float(m.group(2))
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', str(f), '-af',
                    f'{TRIM},volume={TARGET - mean:.1f}dB,alimiter=limit=0.95,afade=t=out:st={max(0.0, dur - 0.15):.2f}:d=0.15',
                    '-ac', '1', '-b:a', '128k', f'public/assets/dzwieki/{f.name}'], check=True)
    print(f.name, f'{TARGET - mean:+.1f} dB')
