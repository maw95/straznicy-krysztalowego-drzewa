// The coach of a training game: a parchment bubble with the current step (what to do and why), the step counter, and "skip the guidance".
// The pulsing ring of a hex target is drawn by the map (`hintHex`); a bump of `shake` means the player tried something the step does not ask for.
// The bubble sits at the top of the screen; a button moves it to the bottom (and back) when it covers what the player needs to see.

import { useState } from 'react';
import { RIGHT_CLICK_RULE, type Training } from '../engine/training';

export function TrainingCoach({ training, index, shake, onSkip, onNext }: { training: Training; index: number; shake: number; onSkip: () => void; onNext: () => void }) {
  const step = training.steps[index];
  const [low, setLow] = useState(false);
  return (
    <div className={`plate parch training-coach${low ? ' low' : ''}`} data-coach={step?.id ?? 'free'} role="status">
      {/* A new key restarts the shake each time the player is held. */}
      <div key={shake} className="training-coach-body" data-shake={shake > 0 ? 'on' : 'off'}>
        <div className="training-coach-head">
          <b>{step ? step.title : 'Dalej już sam'}</b>
          {step && <span className="training-coach-count">krok {index + 1} z {training.steps.length}</span>}
        </div>
        <div className="training-coach-text">{step ? step.text : training.free}</div>
        <div className="training-coach-rc" data-coach-rc>{RIGHT_CLICK_RULE}</div>
        <div className="training-coach-buttons">
          {step?.ack && <button className="btn prim training-coach-next" data-coach-next onClick={onNext}>Dalej</button>}
          {step && <button className="btn training-coach-skip" data-coach-skip onClick={onSkip}>Wyłącz prowadzenie</button>}
          <button className="btn training-coach-skip training-coach-move" data-coach-move title={low ? 'Przenieś dymek na górę ekranu' : 'Przenieś dymek na dół ekranu'} onClick={() => setLow(!low)}>{low ? '▲' : '▼'}</button>
        </div>
      </div>
    </div>
  );
}
