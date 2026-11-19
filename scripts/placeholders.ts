// Placeholder pictures for the units of every faction pack that has none yet (backlog 52, gate G1). Usage: npx tsx scripts/placeholders.ts   (or: make placeholders)
// For each unit without `cards/art/<id>.jpg` or `cards/portraits/<id>.jpg` it draws a small, labelled picture in the faction's colour (scripts/placeholders.py,
// Pillow), and the same for a crest `cards/crests/<faction>.png` and the arena of a faction without one. Existing files are never overwritten. The game falls back to
// the portrait token where a unit has no 2D sprites, so these pictures are all a new faction needs to be playable. Every file is listed in assets.json as a
// placeholder (ai: false) and in docs/BACKLOG.md section 2a (the list of what the author still has to have made).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { UNITS } from '../src/engine/data';
import { FACTION_PACKS, PACK_IDS } from '../src/engine/factions';
import { artId } from '../src/ui/common';

/** The colour of each faction's placeholders (docs/FRAKCJE_PROPOZYCJE.md, section 1). */
const COLORS: Record<string, [number, number, number]> = {
  dawn: [44, 112, 72],
  horde: [154, 34, 38],
  herds: [176, 136, 48],
  undead: [112, 128, 104],
  clans: [112, 120, 134],
  frost: [176, 204, 198],
};

const jobs: Array<{ kind: 'art' | 'portrait' | 'crest' | 'arena'; id: string; label: string; race: string; color: number[]; out: string }> = [];
for (const race of PACK_IDS) {
  const pack = FACTION_PACKS[race];
  const color = COLORS[race] ?? [120, 120, 120];
  for (const u of [...pack.heroes, ...pack.supports, ...pack.tierUnits, ...pack.altUnits, pack.legend, ...extras(race)]) {
    const label = UNITS[u]?.name ?? u;
    for (const kind of ['art', 'portrait'] as const) {
      const out = `public/assets/cards/${kind === 'art' ? 'art' : 'portraits'}/${artId(u)}.jpg`;
      if (!existsSync(out)) jobs.push({ kind, id: u, label, race, color, out });
    }
  }
  const crest = `public/assets/cards/crests/${race}.png`;
  if (!existsSync(crest)) jobs.push({ kind: 'crest', id: race, label: pack.name, race, color, out: crest });
  const arena = `public/assets/arena/cyfrowa/${race}.webp`;
  if (!existsSync(arena)) jobs.push({ kind: 'arena', id: race, label: pack.name, race, color, out: arena });
}

/** Units of a faction outside the lists of its pack that still need a card: the commanders and the fourth hero. */
function extras(race: string): string[] {
  return Object.values(UNITS).filter((d) => d.side === race && d.kind === 'hero' && !FACTION_PACKS[race as keyof typeof FACTION_PACKS].heroes.includes(d.id)).map((d) => d.id);
}

if (!jobs.length) {
  console.log('Nic do zrobienia: każda jednostka ma grafikę.');
} else {
  const r = spawnSync('python3', ['-I', 'scripts/placeholders.py'], { input: JSON.stringify(jobs), encoding: 'utf8' });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`Wygenerowano ${jobs.length} plików zastępczych.`);
}
