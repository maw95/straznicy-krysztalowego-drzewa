import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * "Zgłoś błąd" in the game posts the save file (setup, actions, reports) here; the dev and
 * preview servers write it to bug-reports/ so it can be replayed with `make report`.
 */
function bugReports(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'POST' || !req.url?.endsWith('/__bug-report')) return next();
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const save = JSON.parse(body);
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const file = join('bug-reports', `${stamp}-ziarno-${Number(save.setup?.seed) || 0}.json`);
        mkdirSync('bug-reports', { recursive: true });
        writeFileSync(file, JSON.stringify(save, null, 1));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ file }));
      } catch {
        res.statusCode = 400;
        res.end('{}');
      }
    });
  };
  return {
    name: 'bug-reports',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
}

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  // The game version (package.json), shown in the main menu.
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), bugReports()],
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // UI tests play whole games click by click.
    testTimeout: 30000,
  },
});
