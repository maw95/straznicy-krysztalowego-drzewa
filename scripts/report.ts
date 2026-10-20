// Replays bug reports saved by "Zgłoś błąd" and prints the game at the reported moment.
// Usage: npx tsx scripts/report.ts [file.json ...]   (default: every file in bug-reports/)

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNITS } from '../src/engine/data';
import { cellOf } from '../src/engine/battle';
import { applyAction, createGame, currentActor } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import type { BugReport, SaveFile } from '../src/ui/saves';

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync('bug-reports')
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => join('bug-reports', f));

function describe(s: GameState): string[] {
  const out = [`faza: ${s.phase} · runda ${s.round}/${s.roundLimit} · kryształy ${s.factions.dawn.delivered}/${s.crystalsNeeded} · tura: ${JSON.stringify(currentActor(s))}`];
  for (const h of Object.values(s.heroes)) out.push(`  ${UNITS[h.id].name} (${h.faction}) ${h.alive ? `na ${h.pos} [${s.tiles[h.pos]?.terrain}]` : 'poległ(a)'}${h.crystals.length ? ` · niesie ${h.crystals.length} kr.` : ''}`);
  const b = s.battle;
  if (b) {
    out.push(`  bitwa: ${b.kind}, arena ${b.arena}, etap ${b.stage}, runda ${b.round}, aktywna: ${b.activation ? UNITS[b.units[b.activation.unitId].defId].name : '—'}`);
    for (const u of Object.values(b.units)) out.push(`    ${UNITS[u.defId].name} (${u.side}) Ż ${u.hp}/${u.maxHp} ${u.alive && u.pos ? `na polu kolumna ${cellOf(u.pos).col}, półrząd ${cellOf(u.pos).half}` : 'poległ(a)'}${u.abilityUsed ? ' · zdolność zużyta' : ''}`);
  }
  return out;
}

for (const file of files) {
  const save = JSON.parse(readFileSync(file, 'utf8')) as SaveFile;
  const reports: BugReport[] = save.reports ?? [];
  console.log(`\n=== ${file} · ziarno ${save.setup.seed} · ${save.setup.mode} · ${save.setup.mapSize} · akcji ${save.actions.length} · zgłoszeń ${reports.length}`);
  for (const r of reports) {
    let s = createGame(save.setup);
    let error = '';
    for (const a of save.actions.slice(0, r.actionIndex)) {
      try {
        s = applyAction(s, a);
      } catch (e) {
        error = `odtworzenie przerwane: ${(e as Error).message} przy ${JSON.stringify(a)}`;
        break;
      }
    }
    console.log(`\n--- ${r.createdAt} · akcja ${r.actionIndex} · ekran ${r.screen} · ${r.viewport}`);
    console.log(`Opis: ${r.text}`);
    if (error) console.log(error);
    console.log(describe(s).join('\n'));
    console.log('Ostatnie wpisy dziennika (widziane przez gracza):');
    for (const l of r.recentLog) console.log(`  ${l}`);
    const next = save.actions.slice(r.actionIndex, r.actionIndex + 3);
    if (next.length) console.log(`Następne akcje: ${next.map((a) => JSON.stringify(a)).join(' · ')}`);
  }
}
