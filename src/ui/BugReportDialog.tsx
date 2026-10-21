// "Zgłoś błąd": the player describes what went wrong; the report is stored with the game
// (setup + actions), so the exact moment can be replayed later (scripts/report.ts).

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { Frame, Ribbon } from './common';
import { sendReport, type BugReport, type SaveFile } from './saves';

interface Props {
  game: GameState;
  /** The game so far, with earlier reports. */
  save: SaveFile;
  onSaved: (report: BugReport) => void;
  onClose: () => void;
}

export function BugReportDialog({ game, save, onSaved, onClose }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    const report: BugReport = {
      createdAt: new Date().toISOString(),
      actionIndex: save.actions.length,
      round: game.round,
      screen: game.phase === 'battle' ? `battle:${game.battle?.stage}` : game.phase,
      text: text.trim(),
      recentLog: game.log.slice(-12).map((l) => `[${l.round}] ${l.text}`),
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      userAgent: navigator.userAgent,
    };
    const full: SaveFile = { ...save, reports: [...(save.reports ?? []), report] };
    setBusy(true);
    onSaved(report);
    const file = await sendReport(full);
    if (file) {
      setDone(`Zapisano w projekcie: ${file}`);
    } else {
      // Hosted game: the report waits in this browser's tester journal ("DLA TESTERÓW").
      setDone('Zgłoszenie zapisało się w tej przeglądarce. Wyślesz je razem z resztą: w menu głównym kliknij „INFO DLA TESTERÓW” i pobierz plik dla twórcy.');
    }
    setBusy(false);
  }

  return (
    <div>
      <Frame crest style={{ width: 'min(600px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17 }}>
        <Ribbon>Zgłoś błąd</Ribbon>
        {done ? (
          <>
            <div>Dziękuję! {done}</div>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>Zgłoszenie zawiera całą partię aż do tej chwili, więc da się dokładnie odtworzyć, co było na ekranie.</div>
            <button className="btn prim" autoFocus style={{ alignSelf: 'center', padding: '6px 26px', fontSize: 19 }} onClick={onClose}>Wróć do gry</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, color: 'var(--muted)' }}>
              Opisz, co się stało i czego się spodziewałeś. Stan gry (runda {game.round}, akcja {save.actions.length}) zapisze się razem z opisem.
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Opis błędu"
              placeholder="Np. kliknąłem pole obok wroga, a jednostka się nie ruszyła…"
              rows={6}
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 17, padding: 10, borderRadius: 6, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn plate parch" style={{ padding: '6px 16px' }} onClick={onClose}>Anuluj</button>
              <button className="btn prim" disabled={!text.trim() || busy} style={{ padding: '6px 20px' }} onClick={submit}>Zapisz zgłoszenie</button>
            </div>
          </>
        )}
      </Frame>
    </div>
  );
}
