// "INFO DLA TESTERÓW": what testers should know, their game statistics, a feedback box and one
// download with everything (games, bug reports, feedback) to send to the designer.

import { useState } from 'react';
import { MAP_SIZE_NAMES } from '../engine/data';
import { Frame, Ribbon } from './common';
import { buildExport, journalStats, LEVEL_NAMES, readJournal } from './journal';

const DRAFT = 'skd-feedback-draft';

function readDraft(): { name: string; feedback: string } {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? '');
    return { name: String(d.name ?? ''), feedback: String(d.feedback ?? '') };
  } catch {
    return { name: '', feedback: '' };
  }
}

function saveDraft(d: { name: string; feedback: string }) {
  try {
    localStorage.setItem(DRAFT, JSON.stringify(d));
  } catch {
    // the draft is only a convenience
  }
}

export function TesterDialog({ onClose, download }: { onClose: () => void; download: (name: string, text: string) => void }) {
  const [draft, setDraft] = useState(readDraft);
  const [done, setDone] = useState(false);
  const journal = readJournal();
  const stats = journalStats(journal);
  const update = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    saveDraft(next);
  };

  function exportAll() {
    const data = buildExport(draft.name, draft.feedback);
    const who = (draft.name.trim() || 'tester').toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/g, '-').slice(0, 30);
    download(`straznicy-testy-${who}-${data.exportedAt.slice(0, 10)}.json`, JSON.stringify(data));
    setDone(true);
  }

  const recent = [...journal.games].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div>
      <Frame crest style={{ width: 'min(760px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17, maxHeight: '86vh' }}>
        <Ribbon>Dla testerów</Ribbon>
        <div>
          Dziękuję, że testujesz <b>Strażników Kryształowego Drzewa</b>! To wczesna wersja gry planszowej — każda uwaga pomoże.
        </div>
        <ul style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>
            <b>Coś nie działa albo dziwnie wygląda?</b> Od razu kliknij <b>„Zgłoś błąd”</b> na dolnym pasku gry i opisz, co się stało. Zgłoszenie zapamięta dokładny moment partii.
          </li>
          <li>
            <b>Graj normalnie</b> — różne tryby, mapy i poziomy. Gra sama zapisuje Twoje partie i wyniki w tej przeglądarce.
          </li>
          <li>
            <b>Na koniec</b> wpisz poniżej swoje wrażenia i kliknij <b>„Pobierz plik dla twórcy”</b>. Ten jeden plik zawiera wszystkie Twoje partie, zgłoszone błędy i opinię — wyślij go do mnie, jak Ci wygodnie (Messenger, e-mail…).
          </li>
          <li style={{ color: 'var(--muted)', fontSize: 15 }}>
            Wszystko zostaje tylko na Twoim komputerze, dopóki sam nie wyślesz pliku. Graj w tej samej przeglądarce i nie czyść jej danych, żeby nic nie zginęło.
          </li>
        </ul>

        <div className="plate parch" style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 16 }}>
          <span>Rozegrane partie: <b>{stats.played}</b> (ukończone: {stats.finished})</span>
          <span>Kooperacja: <b>{stats.coop.won}</b> wygranych · <b>{stats.coop.lost}</b> przegranych</span>
          <span>Rywalizacja: Przymierze <b>{stats.pvp.dawn}</b> · Horda <b>{stats.pvp.horde}</b></span>
          <span>Zgłoszone błędy: <b>{stats.reports}</b></span>
        </div>
        {recent.length > 0 && (
          <div style={{ fontSize: 15, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recent.map((g) => (
              <div key={g.id}>
                {new Date(g.updatedAt).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} · {g.save.setup.mode === 'coop' ? 'Kooperacja' : 'Rywalizacja'} · {MAP_SIZE_NAMES[g.save.setup.mapSize]} · {LEVEL_NAMES[g.level]} ·{' '}
                {g.result ? (g.result.winner === 'dawn' ? 'wygrywa Przymierze' : 'wygrywa Horda') : 'w trakcie'}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <>
            <div>Plik został pobrany (zwykle trafia do folderu <b>Pobrane</b>). Wyślij go do mnie — dziękuję! 🌳</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn plate parch" style={{ padding: '6px 16px' }} onClick={exportAll}>Pobierz jeszcze raz</button>
              <button className="btn prim" data-enter autoFocus style={{ padding: '6px 26px' }} onClick={onClose}>Zamknij</button>
            </div>
          </>
        ) : (
          <>
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              aria-label="Twoje imię"
              placeholder="Twoje imię (żeby było wiadomo, od kogo jest plik)"
              style={{ fontFamily: 'inherit', fontSize: 17, padding: '8px 10px', borderRadius: 6 }}
            />
            <textarea
              value={draft.feedback}
              onChange={(e) => update({ feedback: e.target.value })}
              aria-label="Twoje uwagi"
              placeholder="Co Ci się podobało, co było niejasne, za łatwe, za trudne, za długie? Każda uwaga się przyda."
              rows={6}
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 17, padding: 10, borderRadius: 6, resize: 'vertical' }}
            />
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>Tekst zapisuje się na bieżąco — możesz wracać i dopisywać po kolejnych partiach.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn plate parch" style={{ padding: '6px 16px' }} onClick={onClose}>Zamknij</button>
              <button className="btn prim" style={{ padding: '6px 22px', fontSize: 18 }} onClick={exportAll}>Pobierz plik dla twórcy</button>
            </div>
          </>
        )}
      </Frame>
    </div>
  );
}
