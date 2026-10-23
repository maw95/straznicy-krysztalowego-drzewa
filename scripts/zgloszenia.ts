// Fetches the new bug reports and tester feedback from the game server and lays them out for the usual
// tools: bug reports ("Zgłoś błąd") as save files in bug-reports/, feedback ("Dla testerów") as tester
// files in tester-reports/. Then it marks them fetched on the server and runs scripts/report.ts and
// scripts/testers.ts on the new files. Access is the logged-in `fly` (fly ssh), no extra password.
// Usage: npx tsx scripts/zgloszenia.ts [--no-ack]   (or: make zgloszenia, make zgloszenia ACK=0)

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = 'straznicy-backend';
const URL = `https://${APP}.fly.dev/health`;
const ack = !process.argv.includes('--no-ack');

interface StoredReport {
  id: number;
  kind: 'bug' | 'feedback';
  createdAt: string;
  nick: string | null;
  gameVersion: string | null;
  roomCode: string | null;
  data: Record<string, unknown>;
}

function onServer(command: string): string {
  return execFileSync('fly', ['ssh', 'console', '--app', APP, '--command', command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// The machine sleeps when nobody plays; a request wakes it before the SSH session.
for (let attempt = 0; attempt < 10; attempt++) {
  if (await fetch(URL).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 2000));
}

const out = onServer('node /app/dist/reports-cli.js export');
const match = out.match(/---BEGIN REPORTS---\n([\s\S]*?)\n---END REPORTS---/);
if (!match) {
  console.error('Serwer nie odpowiedział listą zgłoszeń:\n' + out);
  process.exit(1);
}
const reports = JSON.parse(match[1]) as StoredReport[];
if (!reports.length) {
  console.log('Brak nowych zgłoszeń ani opinii.');
  process.exit(0);
}

mkdirSync('bug-reports', { recursive: true });
mkdirSync('tester-reports', { recursive: true });
const bugFiles: string[] = [];
const testerFiles: string[] = [];
for (const r of reports) {
  const stamp = r.createdAt.replace(/[: ]/g, '-');
  const meta = { id: r.id, createdAt: r.createdAt, nick: r.nick, gameVersion: r.gameVersion, roomCode: r.roomCode };
  if (r.kind === 'bug') {
    const file = join('bug-reports', `${stamp}-serwer-${r.id}.json`);
    writeFileSync(file, JSON.stringify({ ...r.data, server: meta }, null, 1));
    bugFiles.push(file);
  } else {
    const file = join('tester-reports', `${stamp}-serwer-${r.id}.json`);
    writeFileSync(file, JSON.stringify({ ...r.data, server: meta }, null, 1));
    testerFiles.push(file);
  }
  const who = r.nick ?? (r.data.name as string | undefined) ?? 'anonim';
  const what = r.kind === 'bug' ? 'błąd' : 'opinia';
  console.log(`#${r.id} ${r.createdAt} · ${what} · ${who} · wersja ${r.gameVersion ?? '?'}${r.roomCode ? ` · gra online ${r.roomCode}` : ''}`);
}

if (ack) {
  onServer(`node /app/dist/reports-cli.js ack ${reports.map((r) => r.id).join(',')}`);
  console.log(`Oznaczone na serwerze jako pobrane: ${reports.length}.`);
} else console.log('Nie oznaczono na serwerze (--no-ack): następnym razem przyjdą znowu.');

const tsx = (script: string, files: string[]) => files.length && spawnSync('npx', ['tsx', script, ...files], { stdio: 'inherit' });
if (testerFiles.length) {
  console.log('\n=== Opinie testerów ===');
  tsx('scripts/testers.ts', testerFiles);
}
if (bugFiles.length) {
  console.log('\n=== Zgłoszone błędy (stan gry w chwili zgłoszenia) ===');
  tsx('scripts/report.ts', bugFiles);
}
