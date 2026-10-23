// "Historia zmian": the versions from CHANGELOG.md (read at build time), newest first, with their
// dates and changes. Opened by clicking the version number in the main menu.

import changelog from '../../CHANGELOG.md?raw';
import { Frame, Ribbon } from './common';

export interface Release {
  /** null for the changes that are not in any version yet. */
  version: string | null;
  date: string | null;
  changes: string[];
}

const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** Reads `## 1.1.0 — 2026-10-22` sections and their `- …` entries; commit hashes and Markdown marks are dropped. */
export function parseChangelog(text: string): Release[] {
  const out: Release[] = [];
  let current: Release | null = null;
  for (const line of text.split('\n')) {
    const head = line.match(/^##\s+(.+?)\s*$/);
    if (head) {
      const v = head[1].match(/^(\d+\.\d+\.\d+)\s*[—–-]\s*(\d{4}-\d{2}-\d{2})/);
      current = v ? { version: v[1], date: v[2], changes: [] } : { version: null, date: null, changes: [] };
      out.push(current);
      continue;
    }
    const item = line.match(/^-\s+(.+)$/);
    if (item && current) {
      const text = item[1]
        // One commit hash or several: (`abc1234`) or (`abc1234`, `def5678`).
        .replace(/\s*\((?:`[0-9a-f]{7,40}`(?:,\s*)?)+\)/g, '')
        .replace(/\*\*|`/g, '')
        .trim();
      current.changes.push(text);
    }
  }
  return out.filter((r) => r.changes.length);
}

/** 2.0.1 → [2, 0, 1], for comparing versions. */
const parts = (v: string) => v.split('.').map(Number);
export function newerThan(a: string, b: string): boolean {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}

/** Entries written for us, not for players: kept in "Historia zmian", left out of "Co nowego". */
const FOR_DEVELOPERS = /^(Narzędzia|Dokumentacja|Notatki projektowe)\b/;

/** The released versions after `since` up to `upTo` (newest first), with only the changes players notice. */
export function newsSince(text: string, since: string | null, upTo: string): Release[] {
  return parseChangelog(text)
    .filter((r) => r.version && !newerThan(r.version, upTo) && (since === null ? r.version === upTo : newerThan(r.version, since)))
    .map((r) => ({ ...r, changes: r.changes.filter((c) => !FOR_DEVELOPERS.test(c)) }))
    .filter((r) => r.changes.length);
}

export function ChangelogDialog({ onClose }: { onClose: () => void }) {
  const releases = parseChangelog(changelog);
  const latest = releases.find((r) => r.version)?.version;
  return (
    <div>
      <Frame crest style={{ width: 'min(760px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 17, maxHeight: '86vh' }}>
        <Ribbon>Historia zmian</Ribbon>
        {releases.map((r) => (
          <section key={r.version ?? 'next'} className="changelog-release" aria-label={r.version ? `Wersja ${r.version}` : 'W przygotowaniu'}>
            <h3>
              {r.version ? `Wersja ${r.version}` : `Po wersji ${latest ?? __APP_VERSION__} — w przygotowaniu`}
              {r.version === __APP_VERSION__ && <span className="changelog-current">Twoja wersja</span>}
            </h3>
            {r.date && <div className="changelog-date">{longDate(r.date)}</div>}
            <ul>
              {r.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        ))}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 18 }} onClick={onClose}>
            Zamknij
          </button>
        </div>
      </Frame>
    </div>
  );
}
