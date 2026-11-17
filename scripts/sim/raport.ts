// Balance report: Przymierza's win rate in every game level, difficulty, mode and map, as colour-coded tables (docs/BALANS_TABELE.html).
// Usage: node --import tsx scripts/sim/raport.ts [games per cell = 100]   (make sim-raport; about 5-10 minutes on 16 cores)
// Custom settings are not measured. Cells outside the author's band are coloured: below = red, above = blue, inside = green.
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';

const games = Number(process.argv[2] ?? 100);
type Env = Record<string, string>;
const DIG: Env = { SIM_DIGITAL: '1', SIM_DAWN_HUMAN: '1' };
const LAYERS: Array<{ id: string; name: string; env: Env; levels: string[] }> = [
  { id: 'board', name: 'Wydanie planszowe (liczby i zasady jak w pudełku)', env: {}, levels: ['kids', 'full', 'hard'] },
  { id: 'l1', name: 'Poziom 1 — Przygoda (cyfrowa, bez rozwoju bohatera)', env: DIG, levels: ['kids', 'full', 'hard', 'veryhard'] },
  { id: 'l2', name: 'Poziom 2 — Wyprawa (rozwój bohatera)', env: { ...DIG, SIM_GROWTH: '1' }, levels: ['kids', 'full', 'hard', 'veryhard'] },
  { id: 'l3', name: 'Poziom 3 — Osada (złoto i osady)', env: { ...DIG, SIM_GROWTH: '1', SIM_KINGDOM: '1' }, levels: ['kids', 'full', 'hard', 'veryhard'] },
  { id: 'l4', name: 'Poziom 4 — Księstwo (surowce)', env: { ...DIG, SIM_GROWTH: '1', SIM_ECONOMY: '1' }, levels: ['kids', 'full', 'hard', 'veryhard'] },
  { id: 'l5', name: 'Poziom 5 — Królestwo (magia, bohaterowie)', env: { ...DIG, SIM_GROWTH: '1', SIM_REALM: '1' }, levels: ['kids', 'full', 'hard', 'veryhard'] },
  { id: 'l6', name: 'Poziom 6 — Imperium (frakcje, Relikt)', env: { ...DIG, SIM_GROWTH: '1', SIM_EMPIRE: '1' }, levels: ['kids', 'full', 'hard', 'veryhard'] },
];
const SIZES = [['short', 'Krótka'], ['medium', 'Średnia'], ['long', 'Długa'], ['veryLong', 'Bardzo długa']] as const;
const TABLES = [['coop1', 'Kooperacja, 1 gracz'], ['coop2', 'Kooperacja, 2 graczy'], ['pvp1', 'Rywalizacja 1 na 1'], ['pvp2', 'Rywalizacja 2 na 2']] as const;
const LEVELS: Record<string, [string, number, number]> = { kids: ['Łatwy', 65, 85], full: ['Normalny', 45, 65], hard: ['Trudny', 30, 45], veryhard: ['Bardzo trudny', 15, 30] };

type Job = { layer: string; size: string; table: string; level: string };
const jobs: Job[] = [];
for (const l of LAYERS) for (const [size] of SIZES) for (const [table] of TABLES) for (const level of l.levels) jobs.push({ layer: l.id, size, table, level });
const result = new Map<string, number>();
const key = (j: Job) => [j.layer, j.size, j.table, j.level].join('|');

let next = 0;
let done = 0;
function runOne(): Promise<void> {
  const j = jobs[next++];
  if (!j) return Promise.resolve();
  const env = { ...process.env, ...LAYERS.find((l) => l.id === j.layer)!.env };
  return new Promise((resolve) => {
    execFile('node', ['--import', 'tsx', 'scripts/sim/raportKomorka.ts', String(games), j.size, j.table, j.level], { env, maxBuffer: 1 << 20 }, (err, out) => {
      if (err) console.error('error', key(j), err.message.slice(0, 200));
      else {
        const r = JSON.parse(out) as { wins: number; games: number };
        result.set(key(j), (100 * r.wins) / r.games);
      }
      if (++done % 50 === 0) console.error(`${done}/${jobs.length}`);
      resolve(runOne());
    });
  });
}
await Promise.all(Array.from({ length: cpus().length }, runOne));

mkdirSync('.tmp/sim', { recursive: true });
writeFileSync('.tmp/sim/raport.json', JSON.stringify([...result]));

const cell = (v: number | undefined, level: string) => {
  if (v === undefined) return '<td class="na">—</td>';
  const [, lo, hi] = LEVELS[level];
  const cls = v < lo ? 'low' : v > hi ? 'high' : 'ok';
  return `<td class="${cls}">${v.toFixed(0)}%</td>`;
};
const out: string[] = [];
let outside = 0;
let total = 0;
for (const l of LAYERS) {
  out.push(`<h2>${l.name}</h2><table><thead><tr><th>Tryb</th><th>Mapa</th>${l.levels.map((lv) => `<th>${LEVELS[lv][0]}<br><small>pasmo ${LEVELS[lv][1]}–${LEVELS[lv][2]}%</small></th>`).join('')}</tr></thead><tbody>`);
  for (const [table, tname] of TABLES) {
    SIZES.forEach(([size, sname], i) => {
      out.push(`<tr>${i === 0 ? `<th rowspan="4" class="mode">${tname}</th>` : ''}<th>${sname}</th>${l.levels.map((lv) => {
        const v = result.get([l.id, size, table, lv].join('|'));
        if (v !== undefined) {
          total++;
          if (v < LEVELS[lv][1] || v > LEVELS[lv][2]) outside++;
        }
        return cell(v, lv);
      }).join('')}</tr>`);
    });
  }
  out.push('</tbody></table>');
}
const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Balans: wygrane Przymierza</title><style>
body{font:14px/1.4 Georgia,serif;margin:24px;color:#2a1d0c;max-width:900px}
h1{margin:0 0 6px}h2{margin:28px 0 8px;font-size:18px;break-after:avoid}table{border-collapse:collapse;width:100%;break-inside:avoid}
th,td{border:1px solid #b9a77f;padding:4px 8px;text-align:center}th{background:#efe3c4}th.mode{width:130px}td.ok{background:#bfe3b0}td.low{background:#f19a96}td.high{background:#9cc3ee}td.na{background:#ddd;color:#777}
.legend span{display:inline-block;padding:2px 10px;border:1px solid #b9a77f;margin-right:8px}small{font-weight:normal}
@media print{body{margin:10mm}}
</style></head><body><h1>Balans: wygrane Przymierza Świtu</h1>
<p>${games} partii botów na komórkę (błąd ok. ±${(100 / Math.sqrt(games)).toFixed(0)} pkt), cel „Kryształy”, wszystkie rozmiary map i tryby. Ustawienia własne nie wchodzą do tabel. W rywalizacji Przymierze gra jako człowiek (cyfrowe poziomy), a Horda jako komputer z przewagami poziomu trudności. Wygenerowano ${new Date().toISOString().slice(0, 10)} poleceniem <code>make sim-raport</code>.</p>
<p class="legend"><span style="background:#bfe3b0">w paśmie autora</span><span style="background:#f19a96">poniżej pasma</span><span style="background:#9cc3ee">powyżej pasma</span><span style="background:#ddd">nie dotyczy</span></p>
<p><b>Poza pasmem: ${outside} z ${total} komórek.</b></p>${out.join('\n')}</body></html>`;
writeFileSync('docs/BALANS_TABELE.html', html);
console.error(`done: ${outside}/${total} outside the bands`);
