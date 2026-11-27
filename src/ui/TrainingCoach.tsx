// The coach of a training game: a parchment bubble with the current step (what to do and why), the step counter, and "skip the guidance".
// The pulsing ring of a hex target is drawn by the map (`hintHex`); a bump of `shake` means the player tried something the step does not ask for.

import { RIGHT_CLICK_RULE, type Training } from '../engine/training';

export function TrainingCoach({ training, index, shake, onSkip }: { training: Training; index: number; shake: number; onSkip: () => void }) {
  const step = training.steps[index];
  return (
    <div className="plate parch training-coach" data-coach={step?.id ?? 'free'} key={shake} data-shake={shake > 0 ? 'on' : 'off'} role="status">
      <div className="training-coach-head">
        <b>{step ? step.title : 'Dalej już sam'}</b>
        {step && <span className="training-coach-count">krok {index + 1} z {training.steps.length}</span>}
      </div>
      <div className="training-coach-text">{step ? step.text : training.free}</div>
      <div className="training-coach-rc" data-coach-rc>{RIGHT_CLICK_RULE}</div>
      {step && <button className="btn training-coach-skip" data-coach-skip onClick={onSkip}>Wyłącz prowadzenie</button>}
    </div>
  );
}
