// Replays bug reports saved by "Zgłoś błąd" and prints the game at the reported moment.
// Usage: npx tsx scripts/report.ts [file.json ...]   (default: every file in bug-reports/)
// A tester's file from "INFO DLA TESTERÓW" holds many games: the ones with bug reports are replayed,
// and its feedback (where testers often describe crashes) is printed; scripts/testers.ts sums up the rest.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNITS } from '../src/engine/data';
import { cellOf } from '../src/engine/battle';
import { applyAction, createGame, currentActor } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import type { BugReport, SaveFile } from '../src/ui/saves';
import type { TesterExport } from '../src/ui/journal';

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

/** The saves in a file: a single game, or the reported games of a tester's export. */
function savesIn(file: string): Array<{ label: string; save: SaveFile }> {
  const data = JSON.parse(readFileSync(file, 'utf8')) as SaveFile | TesterExport;
  if ('kind' in data && data.kind === 'skd-tester-export') {
    console.log(`\n=== ${file} · plik testera ${data.name || data.testerId} · partii ${data.games.length}`);
    if (data.feedback) console.log(`Uwagi testera:\n  ${data.feedback.split('\n').join('\n  ')}`);
    return data.games.filter((g) => g.save.reports?.length).map((g) => ({ label: `${file} · partia ${g.id}`, save: g.save }));
  }
  return [{ label: file, save: data as SaveFile }];
}

for (const { label, save } of files.flatMap(savesIn)) {
  const reports: BugReport[] = save.reports ?? [];
  console.log(`\n=== ${label} · ziarno ${save.setup.seed} · ${save.setup.mode} · ${save.setup.mapSize} · akcji ${save.actions.length} · zgłoszeń ${reports.length}`);
  // One replay for all the reports of a game: the state is described at each reported action.
  const at = new Map<number, { error: string; lines: string[] }>();
  let s = reports.length ? createGame(save.setup) : null;
  let done = 0;
  let error = '';
  for (const index of [...new Set(reports.map((r) => r.actionIndex))].sort((a, b) => a - b)) {
    for (; !error && done < index && done < save.actions.length; done++) {
      const a = save.actions[done];
      try {
        s = applyAction(s!, a);
      } catch (e) {
        error = `odtworzenie przerwane: ${(e as Error).message} przy ${JSON.stringify(a)}`;
      }
    }
    at.set(index, { error, lines: describe(s!) });
  }
  for (const r of reports) {
    const { error, lines } = at.get(r.actionIndex)!;
    console.log(`\n--- ${r.createdAt} · akcja ${r.actionIndex} · ekran ${r.screen} · ${r.viewport}`);
    console.log(`Opis: ${r.text}`);
    if (error) console.log(error);
    console.log(lines.join('\n'));
    console.log('Ostatnie wpisy dziennika (widziane przez gracza):');
    for (const l of r.recentLog) console.log(`  ${l}`);
    const next = save.actions.slice(r.actionIndex, r.actionIndex + 3);
    if (next.length) console.log(`Następne akcje: ${next.map((a) => JSON.stringify(a)).join(' · ')}`);
  }
}
