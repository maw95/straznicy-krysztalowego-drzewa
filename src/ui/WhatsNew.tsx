// "Nowa wersja — co nowego": once after each release, the changes since the version the player last saw
// (several releases at once if they skipped some). A brand-new player gets nothing (everything is new);
// someone who played before this window existed sees the newest release.

import { useEffect, useRef } from 'react';
import changelog from '../../CHANGELOG.md?raw';
import { newerThan, newsSince, type Release } from './ChangelogDialog';
import { Frame, Ribbon } from './common';

const KEY = 'skd-last-version';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The releases to show now, or null when there is nothing new for this player. */
export function pendingNews(current: string = __APP_VERSION__): Release[] | null {
  const seen = read(KEY);
  if (seen && !newerThan(current, seen)) return null;
  // No version remembered: a player from before this window (they saw the intro or played), or a new one.
  const playedBefore = read('skd-intro') === 'seen' || read('skd-journal') !== null || read('skd-autosave') !== null;
  if (!seen && !playedBefore) return null;
  const news = newsSince(changelog, seen, current);
  return news.length ? news : null;
}

/** This version's news has been seen (or there was none): the window waits for the next release. */
export function markNewsSeen(current: string = __APP_VERSION__) {
  try {
    localStorage.setItem(KEY, current);
  } catch {
    // No storage: the window may come back next time.
  }
}

export function WhatsNew({ releases, onClose, onHistory }: { releases: Release[]; onClose: () => void; onHistory: () => void }) {
  // Focus on "Do gry!" (Enter closes the window) without scrolling a long list to its end: it opens at the top.
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus({ preventScroll: true }), []);
  return (
    <div>
      <Frame crest style={{ width: 'min(680px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 17, maxHeight: '86vh' }}>
        <Ribbon>Nowa wersja — co nowego</Ribbon>
        {releases.map((r) => (
          <section key={r.version} className="changelog-release" aria-label={`Wersja ${r.version}`}>
            <h3>Wersja {r.version}</h3>
            <ul>
              {r.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        ))}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn plate parch" style={{ padding: '6px 16px', fontSize: 16 }} onClick={onHistory}>
            Pełna historia zmian
          </button>
          <button ref={button} className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 18 }} onClick={onClose}>
            Do gry!
          </button>
        </div>
      </Frame>
    </div>
  );
}
