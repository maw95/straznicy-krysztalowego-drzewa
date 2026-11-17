// The story campaign in the menu: the list of scenarios (done, open, locked), and the story told before the game of a scenario starts.

import { useState } from 'react';
import { CAMPAIGNS, nextScenario, scenarioOf, scenarioSetup, type Campaign, type Scenario } from '../engine/campaign';
import type { GameState, SetupOptions } from '../engine/types';
import { Frame, Modal, Ribbon } from './common';
import { isOpen, readDone, resetProgress } from './campaignProgress';

export function CampaignScreen({ onStart, onBack }: { onStart: (setup: SetupOptions) => void; onBack: () => void }) {
  const [campaign] = useState<Campaign>(CAMPAIGNS[0]);
  const [done, setDone] = useState(() => readDone(campaign.id));
  const [told, setTold] = useState<Scenario | null>(null);
  const finished = campaign.scenarios.every((s) => done.includes(s.id));
  return (
    <div data-campaign>
      <Frame crest style={{ width: 'min(960px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{campaign.name}</Ribbon>
        <div style={{ textAlign: 'center', fontSize: 17, color: 'var(--muted)' }}>{campaign.tagline}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaign.scenarios.map((s, i) => {
            const open = isOpen(campaign, s, done);
            const won = done.includes(s.id);
            return (
              <button key={s.id} className="btn plate parch" data-scenario={s.id} data-state={won ? 'done' : open ? 'open' : 'locked'} disabled={!open} onClick={() => setTold(s)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', textAlign: 'left', opacity: open ? 1 : 0.55 }}>
                <b style={{ fontSize: 30, width: 36, textAlign: 'center', color: won ? '#2E7A32' : '#8A3B12' }}>{won ? '✓' : i + 1}</b>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <b style={{ fontSize: 20 }}>{s.title}</b>
                  <span style={{ fontSize: 15 }}>{s.tagline}</span>
                </span>
                <span style={{ fontSize: 14, color: '#6B4A22', whiteSpace: 'nowrap' }}>{won ? 'Ukończony' : open ? 'Do zagrania' : 'Zablokowany'}</span>
              </button>
            );
          })}
        </div>
        {finished && (
          <div className="plate parch" data-campaign-ending style={{ padding: '12px 16px', fontSize: 16, lineHeight: 1.4 }}>
            <b>Koniec kampanii.</b> {campaign.ending.join(' ')}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch wizard-nav" onClick={onBack}>← Wstecz</button>
          {done.length > 0 && <button className="btn plate parch" data-campaign-reset style={{ padding: '6px 16px' }} onClick={() => { resetProgress(campaign.id); setDone([]); }}>Zacznij kampanię od nowa</button>}
        </div>
      </Frame>
      <Modal open={told !== null} onClose={() => setTold(null)}>
        {told && (
          <Frame crest style={{ width: 'min(720px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Ribbon style={{ width: 'min(480px, 88vw)', alignSelf: 'center' }}>{told.title}</Ribbon>
            <div data-scenario-intro style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 19, lineHeight: 1.45 }}>
              {told.intro.map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button className="btn plate parch" style={{ padding: '6px 20px' }} onClick={() => setTold(null)}>Wróć</button>
              <button className="btn prim btn-big" data-enter data-scenario-start onClick={() => onStart(scenarioSetup(campaign, told, Math.floor(Math.random() * 1e6)))}>Rozpocznij</button>
            </div>
          </Frame>
        )}
      </Modal>
    </div>
  );
}

/** The end of a game of the campaign: the story of the win or the loss, and the way on (the next scenario, again, back to the menu). */
export function CampaignOver({ state, onStart, onMenu }: { state: GameState; onStart: (setup: SetupOptions) => void; onMenu: () => void }) {
  const run = scenarioOf(state.setup)!;
  const won = state.winner === 'dawn';
  const next = won ? nextScenario(run.campaign, run.scenario) : null;
  const again = (s: Scenario) => onStart(scenarioSetup(run.campaign, s, Math.floor(Math.random() * 1e6)));
  return (
    <div data-campaign-over={won ? 'won' : 'lost'}>
      <Frame crest style={{ width: 'min(720px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(480px, 88vw)', alignSelf: 'center' }}>{won ? `${run.scenario.title}: zwycięstwo` : `${run.scenario.title}: porażka`}</Ribbon>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 19, lineHeight: 1.45 }}>
          {(won ? run.scenario.win : run.scenario.lose).map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
          {won && !next && run.campaign.ending.map((p, i) => <p key={`e${i}`} style={{ margin: 0, fontWeight: 700 }}>{p}</p>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch" data-campaign-menu style={{ padding: '6px 20px' }} onClick={onMenu}>Do menu</button>
          <button className="btn plate parch" data-campaign-again style={{ padding: '6px 20px' }} onClick={() => again(run.scenario)}>Zagraj jeszcze raz</button>
          {next && <button className="btn prim btn-big" data-enter data-campaign-next onClick={() => again(next)}>Następny scenariusz →</button>}
        </div>
      </Frame>
    </div>
  );
}
