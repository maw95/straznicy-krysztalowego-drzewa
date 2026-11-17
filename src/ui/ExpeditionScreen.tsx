// "Ekspedycja" in the menu: a roguelike run of 6 on 6 arena battles (src/engine/expedition.ts). The home page (profile, new run, the run of the day, the run in
// progress), the page of a run (the stages, the relics held, "Walcz"), and the end of a battle (the choice of a relic, or the end of the run).

import { useEffect, useRef, useState } from 'react';
import { UNITS } from '../engine/data';
import { expeditionSetup, newRun, RELIC_BY_ID, relicOffer, runOf, runScore, STAGES, stageOf, today, dailySeed, type Run } from '../engine/expedition';
import type { GameState, SetupOptions } from '../engine/types';
import { fetchDaily, savedToken, submitDaily } from '../online/api';
import type { RankingRow } from '../online/api';
import { Frame, Portrait, Ribbon } from './common';
import { dailyDone, finishRun, heroesOf, readProfile, readRun, saveRun } from './expeditionRun';

const heroName = (id: string) => UNITS[id]?.name ?? id;
const seedNow = () => Math.floor(Math.random() * 900000) + 1000;

export function ExpeditionScreen({ onStart, onBack }: { onStart: (setup: SetupOptions) => void; onBack: () => void }) {
  const [profile] = useState(readProfile);
  const [run, setRun] = useState<Run | null>(readRun);
  const [hero, setHero] = useState('goldDragon');
  const heroes = heroesOf(profile);
  const day = today();
  const doneToday = dailyDone(profile, day);

  const begin = (r: Run) => {
    saveRun(r);
    setRun(r);
  };
  const fight = (r: Run) => onStart(expeditionSetup(r));

  if (run && !run.lost) return <RunPage run={run} onFight={() => fight(run)} onAbandon={() => { finishRun(run); setRun(null); }} onBack={onBack} />;

  return (
    <div data-expedition>
      <Frame crest style={{ width: 'min(960px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>Ekspedycja</Ribbon>
        <div style={{ textAlign: 'center', fontSize: 17, color: 'var(--muted)' }}>
          Osiem bitew na arenie 6 na 6 pod rząd, jedno życie. Po każdej wygranej wybierasz jedną z trzech relikwii, a komputer z każdą bitwą rośnie w siłę. Ostatnia bitwa to Czarny Smok.
        </div>
        <div className="plate parch" data-expedition-profile style={{ padding: '10px 16px', fontSize: 16, display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>{'Wyprawy:'} <b>{profile.runs}</b></span>
          <span>Ukończone: <b>{profile.finished}</b></span>
          <span>{'Najdalej:'} <b>{profile.bestCleared}/{STAGES}</b> {'etapów'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }} data-expedition-heroes>
          {heroes.map((h) => (
            <button key={h} className="btn plate parch" aria-pressed={hero === h} data-hero={h} onClick={() => setHero(h)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', outline: hero === h ? '3px solid #9EE4FF' : undefined }}>
              <Portrait unitId={h} size={44} preview={false} tip={false} />
              <b>{heroName(h)}</b>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          Kolejni bohaterowie odblokowują się: Odwieczny Niedźwiedź po wyprawie, która przeszła cztery etapy, a Dzielna Kaczka po ukończeniu całej.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch wizard-nav" onClick={onBack}>← Wstecz</button>
          <button className="btn plate parch" data-expedition-daily style={{ padding: '6px 18px' }} onClick={() => begin(newRun(dailySeed(day), hero, day))}>
            {`Wyprawa dnia (${day})${doneToday !== null ? ` · najlepiej: ${doneToday}/${STAGES}` : ''}`}
          </button>
          <button className="btn prim btn-big" data-expedition-new data-enter onClick={() => begin(newRun(seedNow(), hero))}>Nowa wyprawa</button>
        </div>
        <DailyBoard day={day} />
      </Frame>
    </div>
  );
}

function RunPage({ run, onFight, onAbandon, onBack }: { run: Run; onFight: () => void; onAbandon: () => void; onBack: () => void }) {
  const stage = stageOf(run.cleared);
  return (
    <div data-expedition-run>
      <Frame crest style={{ width: 'min(960px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>{run.daily ? `Wyprawa dnia ${run.daily}` : 'Wyprawa'}</Ribbon>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: STAGES }, (_, i) => (
            <span key={i} data-stage={i} data-state={i < run.cleared ? 'done' : i === run.cleared ? 'current' : 'todo'} className="plate parch" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, outline: i === run.cleared ? '3px solid #9EE4FF' : undefined, opacity: i > run.cleared ? 0.55 : 1 }}>
              {i < run.cleared ? '✓' : i + 1}
            </span>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 20 }}>
          {`Etap ${stage.index + 1} z ${STAGES}:`} <b>{stage.name}</b>{stage.boss ? ` ${'(bitwa z bossem)'}` : ''}
        </div>
        <div style={{ textAlign: 'center', fontSize: 16 }}>
          {`${heroName(run.hero)} kontra ${heroName(expeditionSetup(run).seats[1].heroId!)}`}
        </div>
        <div data-expedition-relics style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 16 }}>
          <b>{`Relikwie (${run.relics.length}):`}</b>
          {run.relics.length === 0 ? <span style={{ color: 'var(--muted)' }}>Jeszcze żadnych: pierwsza czeka po pierwszej wygranej.</span> : run.relics.map((id, i) => <span key={i}>• <b>{RELIC_BY_ID[id].name}</b>{': '}{RELIC_BY_ID[id].text}</span>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch wizard-nav" onClick={onBack}>← Do menu</button>
          <button className="btn plate parch" data-expedition-abandon style={{ padding: '6px 18px' }} onClick={onAbandon}>Porzuć wyprawę</button>
          <button className="btn prim btn-big" data-enter data-expedition-fight onClick={onFight}>Walcz</button>
        </div>
      </Frame>
    </div>
  );
}

/** The end of a battle of the run: after a win, the choice of a relic (or the end of the run after the last stage); after a loss, the end of the run. */
export function ExpeditionOver({ state, onStart, onMenu }: { state: GameState; onStart: (setup: SetupOptions) => void; onMenu: () => void }) {
  const run = runOf(state.setup)!;
  const won = state.winner === 'dawn';
  const complete = won && run.cleared + 1 >= STAGES;
  const ended = !won || complete;
  const [picked, setPicked] = useState<string | null>(null);
  const counted = useRef(false);
  const cleared = won ? run.cleared + 1 : run.cleared;
  // The run is over: the profile takes it, and the day's result goes to the ranking (once: the saved run is dropped by finishRun, so a second pass finds none).
  useEffect(() => {
    if (!ended || counted.current) return;
    counted.current = true;
    const saved = readRun();
    if (!saved || saved.seed !== run.seed) return;
    finishRun({ ...run, cleared });
    if (run.daily && savedToken()) submitDaily(run.daily, cleared).catch(() => undefined);
  }, [ended, run, cleared]);
  const offer = won && !complete ? relicOffer(run, run.cleared) : [];
  const next = (relic: string) => {
    const r: Run = { ...run, cleared: run.cleared + 1, relics: [...run.relics, relic] };
    saveRun(r);
    onStart(expeditionSetup(r));
  };
  return (
    <div data-expedition-over={ended ? (won ? 'complete' : 'lost') : 'won'}>
      <Frame crest style={{ width: 'min(760px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(520px, 88vw)', alignSelf: 'center' }}>{complete ? 'Wyprawa ukończona' : won ? `Etap ${run.cleared + 1}: zwycięstwo` : 'Koniec wyprawy'}</Ribbon>
        {ended ? (
          <div style={{ fontSize: 19, lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0 }}>{complete ? 'Czarny Smok padł, a Ekspedycja dobiegła końca. Odblokowałeś kolejnych bohaterów.' : `Wyprawa kończy się na etapie ${run.cleared + 1} z ${STAGES}.`}</p>
            <p style={{ margin: 0 }}>{`Przeszedłeś etapów: ${cleared} · wynik: ${runScore(cleared)} pkt.`}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 18 }}>Wybierz relikwię, która zostanie z Tobą do końca wyprawy:</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} data-relic-offer>
              {offer.map((r) => (
                <button key={r.id} className="btn plate parch" data-relic={r.id} aria-pressed={picked === r.id} onClick={() => setPicked(r.id)} style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', textAlign: 'left', outline: picked === r.id ? '3px solid #9EE4FF' : undefined }}>
                  <b style={{ fontSize: 19 }}>{r.name}</b>
                  <span style={{ fontSize: 15 }}>{r.text}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch" data-expedition-menu style={{ padding: '6px 20px' }} onClick={onMenu}>Do menu</button>
          {!ended && <button className="btn prim btn-big" data-enter data-expedition-next disabled={picked === null} onClick={() => picked && next(picked)}>Następny etap →</button>}
        </div>
      </Frame>
    </div>
  );
}

/** The ranking of the run of the day (online players only). */
function DailyBoard({ day }: { day: string }) {
  const [rows, setRows] = useState<RankingRow[] | null>(null);
  useEffect(() => {
    if (!savedToken()) return;
    let live = true;
    fetchDaily(day).then((d) => live && setRows(d.top)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [day]);
  if (!rows) return <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>Ranking wyprawy dnia widzą zalogowani gracze online.</div>;
  return (
    <div data-daily-board className="well" style={{ padding: '8px 14px', fontSize: 16 }}>
      <b>{`Ranking dnia ${day}`}</b>
      {rows.length === 0 ? <div style={{ color: 'var(--muted)' }}>Nikt jeszcze nie ukończył dziś wyprawy dnia.</div> : rows.map((r) => <div key={r.id}>{`${r.place}. ${r.nick}: ${r.points} pkt (${r.games}/${STAGES} etapów)`}</div>)}
    </div>
  );
}
