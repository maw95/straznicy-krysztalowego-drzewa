"""Iron Clan audio: level the two faction tracks to the rest of the game's music and copy unit/mechanic sounds.
Raw Scenario downloads live in .tmp/zrodla/clans_audio/raw (music1/music2 + <id>_atak/_smierc + mech_*). Run from the repo root."""
import subprocess, shutil, pathlib
RAW = pathlib.Path('.tmp/zrodla/clans_audio/raw')
MUSIC = {'music1': ('clans-anvil-hall', 5.7), 'music2': ('clans-hammer-march', -5.3)}  # gain to mean ~-21 dB
for src, (name, gain) in MUSIC.items():
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW / f'{src}.mp3'),
                    '-af', f'volume={gain}dB,alimiter=limit=0.95,afade=t=in:d=0.3,afade=t=out:st=57.5:d=2.5',
                    '-b:a', '128k', f'public/assets/music/{name}.mp3'], check=True)
units = pathlib.Path('public/assets/dzwieki/jednostki')
mech = pathlib.Path('public/assets/dzwieki')
for f in RAW.glob('*.mp3'):
    if f.name.startswith('music'): continue
    if f.name.startswith('mech_'):
        shutil.copy(f, mech / ('clans_' + f.name[5:]))
    else:
        shutil.copy(f, units / f.name)
