// The training in the menu: the list of the short guided games (one for each level of complexity) and the story told before one starts; the end of a training game.

import { useState } from 'react';
import { RIGHT_CLICK_RULE, TRAININGS, trainingById, trainingOf, trainingSetup, type Training } from '../engine/training';
import type { GameState, SetupOptions } from '../engine/types';
import { asset, Frame, Modal, Ribbon } from './common';
import { readTrained } from './trainingProgress';

/** The marks of the levels as the Skirmish wizard shows them: the Roman number of the level and its picture. */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const LEVEL_ICON = ['krolik', 'przygoda', 'wyprawa', 'osada', 'ksiestwo', 'krolestwo', 'imperium'];

const seed = () => Math.floor(Math.random() * 1e6);

/** The intro of a training and its start button (also used by the welcome window). */
export function TrainingIntro({ training, onStart, onBack }: { training: Training; onStart: (setup: SetupOptions) => void; onBack: () => void }) {
  return (
    <Frame crest style={{ width: 'min(720px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ribbon style={{ width: 'min(480px, 88vw)', alignSelf: 'center' }}>{`Trening: ${training.title}`}</Ribbon>
      <div data-training-intro style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 19, lineHeight: 1.45 }}>
        {training.intro.map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button className="btn plate parch" style={{ padding: '6px 20px' }} onClick={onBack}>Wróć</button>
        <button className="btn prim btn-big" data-enter data-training-start onClick={() => onStart(trainingSetup(training, seed()))}>Rozpocznij</button>
      </div>
    </Frame>
  );
}

export function TrainingScreen({ onStart, onBack }: { onStart: (setup: SetupOptions) => void; onBack: () => void }) {
  const done = readTrained();
  const [told, setTold] = useState<Training | null>(null);
  return (
    <div data-training>
      <Frame crest style={{ width: 'min(960px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(520px, 90vw)', alignSelf: 'center' }}>Trening</Ribbon>
        <div style={{ textAlign: 'center', fontSize: 17, color: 'var(--muted)' }}>Krótkie gry z prowadzeniem krok po kroku: każda uczy tego, co dodaje jeden poziom złożoności. Możesz je powtarzać, ile chcesz.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRAININGS.map((t) => {
            const won = done.includes(t.id);
            const before = t.needs ? trainingById(t.needs) : undefined;
            return (
              <button key={t.id} className="btn plate parch" data-training-card={t.id} data-state={won ? 'done' : 'open'} onClick={() => setTold(t)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', textAlign: 'left' }}>
                <b data-training-badge style={{ fontSize: 26, width: 46, textAlign: 'center', color: won ? '#2E7A32' : '#8A3B12' }}>{won ? '✓' : ROMAN[t.level]}</b>
                <img src={asset(`ui/menu/${LEVEL_ICON[t.level]}.webp`)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flex: 'none', boxShadow: '0 0 0 2px #B88A35' }} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <b style={{ fontSize: 20 }}>{t.title}</b>
                  <span style={{ fontSize: 15 }}>{t.tagline}</span>
                  <span style={{ fontSize: 14, color: '#6B4A22' }}>Nauczysz się: {t.learn.join('; ')}.{before && !done.includes(before.id) ? ` Najpierw trening „${before.title}”.` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn plate parch wizard-nav" onClick={onBack}>← Wstecz</button>
        </div>
      </Frame>
      <Modal open={told !== null} onClose={() => setTold(null)}>
        {told && <TrainingIntro training={told} onStart={onStart} onBack={() => setTold(null)} />}
      </Modal>
    </div>
  );
}

/** The end of a training game: the way on (again, the list, the menu). */
export function TrainingOver({ state, onStart, onMenu, onList }: { state: GameState; onStart: (setup: SetupOptions) => void; onMenu: () => void; onList: () => void }) {
  const t = trainingOf(state.setup)!;
  const won = state.winner === 'dawn';
  const next = won ? TRAININGS[TRAININGS.indexOf(t) + 1] : undefined;
  return (
    <div data-training-over={won ? 'won' : 'lost'}>
      <Frame crest style={{ width: 'min(720px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Ribbon style={{ width: 'min(480px, 88vw)', alignSelf: 'center' }}>{won ? `${t.title}: ukończony` : `${t.title}: spróbuj jeszcze raz`}</Ribbon>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 19, lineHeight: 1.45 }}>
          {(won ? t.win : t.lose).map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn plate parch" data-training-menu style={{ padding: '6px 20px' }} onClick={onMenu}>Do menu</button>
          <button className="btn plate parch" data-training-list style={{ padding: '6px 20px' }} onClick={onList}>Lista treningów</button>
          <button className="btn plate parch" data-training-again style={{ padding: '6px 20px' }} onClick={() => onStart(trainingSetup(t, seed()))}>Zagraj jeszcze raz</button>
          {next && <button className="btn prim btn-big" data-enter data-training-next onClick={() => onStart(trainingSetup(next, seed()))}>Następny trening →</button>}
        </div>
      </Frame>
    </div>
  );
}

/** The window of the first launch: a welcome, the rule of the right button, and the offer of a short training. */
export function WelcomeDialog({ onTraining, onClose }: { onTraining: () => void; onClose: () => void }) {
  return (
    <Frame crest style={{ width: 'min(640px, 94vw)' }} innerStyle={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ribbon style={{ width: 'min(480px, 88vw)', alignSelf: 'center' }}>Witaj, nowy graczu!</Ribbon>
      <div data-welcome style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 19, lineHeight: 1.45 }}>
        <p style={{ margin: 0 }}>Pierwszy raz w Krainie Kryształowego Drzewa? Zagraj krótki trening: kilka minut z podpowiedziami krok po kroku nauczy cię podstaw.</p>
        <p style={{ margin: 0, fontWeight: 700 }}>{RIGHT_CLICK_RULE}</p>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Kolejne treningi, po jednym na każdy poziom złożoności, znajdziesz później w menu: Nowa gra → Trening.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn plate parch" data-welcome-skip style={{ padding: '6px 20px' }} onClick={onClose}>Znam zasady</button>
        <button className="btn prim btn-big" data-enter data-welcome-training onClick={onTraining}>Zagraj trening</button>
      </div>
    </Frame>
  );
}
