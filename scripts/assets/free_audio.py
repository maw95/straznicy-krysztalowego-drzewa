"""Free Company audio (G4, 25.11.2026; seven sounds replaced on 26.11 after the author's notes, the Marmot's attack being the old fuse followed by the new bang): the two faction tracks levelled to the rest of the game's music (mean about -21 dB) and the 38 unit
attack/death sounds (leading silence cut, mean about -21 dB, limiter, short fade-out, mono 128 kbps).
Raw Scenario downloads live in .tmp/zrodla/free_audio/raw (music1/music2 + <id>_atak/_smierc). Run from the repo root."""
import pathlib, re, subprocess, sys
FF = open('.tmp/ffpath').read().strip() if pathlib.Path('.tmp/ffpath').exists() else 'ffmpeg'
RAW = pathlib.Path('.tmp/zrodla/free_audio/raw')
MUSIC = {'music1': 'free-campfire-lute', 'music2': 'free-outlaw-ballad'}
TARGET = -21.0


def stats(path, af=None):
    cmd = [FF, '-i', str(path)] + (['-af', af + ',volumedetect'] if af else ['-af', 'volumedetect']) + ['-f', 'null', '-']
    r = subprocess.run(cmd, capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', r).group(1)), float(re.search(r'Duration: 00:0(\d):(\d+\.\d+)', r).group(1)) * 60 + float(re.search(r'Duration: 00:0(\d):(\d+\.\d+)', r).group(2))


# With names given (e.g. beaverEngineer_atak) only those unit sounds are made again.
ONLY = set(sys.argv[1:])
for src, name in ({} if ONLY else MUSIC).items():
    f = RAW / f'{src}.mp3'
    mean, dur = stats(f)
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', str(f), '-af',
                    f'volume={TARGET - mean:.1f}dB,alimiter=limit=0.95,afade=t=in:d=0.3,afade=t=out:st={dur - 2.5:.2f}:d=2.5',
                    '-b:a', '128k', f'public/assets/music/{name}.mp3'], check=True)
    print(name, f'{TARGET - mean:+.1f} dB')
TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB'
for f in sorted(RAW.glob('*_*.mp3')):
    if ONLY and f.stem not in ONLY:
        continue
    mean, dur = stats(f, TRIM)
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', str(f), '-af',
                    f'{TRIM},volume={TARGET - mean:.1f}dB,alimiter=limit=0.95,afade=t=out:st={max(0.0, dur - 0.15):.2f}:d=0.15',
                    '-ac', '1', '-b:a', '128k', f'public/assets/dzwieki/jednostki/{f.name}'], check=True)
print('done')
