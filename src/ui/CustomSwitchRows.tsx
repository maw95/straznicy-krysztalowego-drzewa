// The switches of the digital edition's "Własne ustawienia", shared by the local setup screen and the online room:
// hero growth, the kind of battles, the easings and hardships, and the tie rule.

import type { CustomRules } from '../engine/presets';
import type { BattleMode, Mode } from '../engine/types';
import { chip, Row, Tip, TIPS } from './setupShared';

/** Who strikes first when both units are equally fast: label, mode, explanation. */
const TIE_MODES: Array<[CustomRules['initiativeTie'], string, string]> = [
  ['defender', 'Obrońca pierwszy', 'Przy równej Szybkości pierwsza działa jednostka strony, która została zaatakowana. Tak gra się na każdym poziomie.'],
  ['rotating', 'Na zmianę', 'Przy równej Szybkości strony zaczynają na zmianę: w nieparzystych rundach bitwy atakujący, w parzystych obrońca.'],
];

/** Optional simplifications of the full game: label, whether it is on, how to switch it, what it does. */
const EASES: Array<[string, (r: CustomRules) => boolean, (on: boolean) => Partial<CustomRules>, string]> = [
  ['Bez zdolności', (r) => !r.abilities, (on) => ({ abilities: !on }), 'Nikt nie używa zdolności z kart — także strażnicy kryształów. Mniej zasad do zapamiętania: liczą się tylko Życie, Atak i Szybkość.'],
  ['Same Eliksiry Odrodzenia', (r) => !r.treasures, (on) => ({ treasures: !on }), 'Zamiast talii różnych skarbów na mapie leżą tylko Eliksiry Odrodzenia (1 / 2 / 3 / 4 zależnie od mapy). Jedna prosta karta: wskrzesza poległą jednostkę. Strażnicy nic nie zostawiają.'],
  ['Rezerwowy bohater po śmierci', (r) => r.heroReplacement, (on) => ({ heroReplacement: on }), 'Gdy bohater zginie, gracz bierze nowego, nieużywanego bohatera swojej frakcji. Wkracza on na wolne pole najbliżej miejsca, w którym padł poprzednik — nikt nie odpada z gry.'],
];

interface Props {
  mode: Mode;
  growth: boolean;
  battleMode: BattleMode;
  rules: CustomRules;
  /** Online: only the room's owner changes the table. */
  disabled?: boolean;
  onGrowth: (growth: boolean) => void;
  onBattleMode: (mode: BattleMode) => void;
  onRules: (patch: Partial<CustomRules>) => void;
}

export function CustomSwitchRows({ mode, growth, battleMode, rules, disabled = false, onGrowth, onBattleMode, onRules }: Props) {
  return (
    <>
      <Row label="Rozwój bohatera">
        <Tip text="Bohaterowie zbierają punkty doświadczenia z bitew i skarbów, awansują i wybierają jedną z trzech umiejętności."><button className={chip(growth)} aria-pressed={growth} disabled={disabled} onClick={() => onGrowth(true)}>Włączony</button></Tip>
        <Tip text="Bohaterowie mają stałe liczby przez całą grę."><button className={chip(!growth)} aria-pressed={!growth} disabled={disabled} onClick={() => onGrowth(false)}>Wyłączony</button></Tip>
      </Row>
      <Row label="Bitwy">
        <Tip text={TIPS.arena}><button className={chip(battleMode === 'arena')} aria-pressed={battleMode === 'arena'} disabled={disabled} onClick={() => onBattleMode('arena')}>Osobna arena (3 na 3)</button></Tip>
        <Tip text={TIPS.board}><button className={chip(battleMode === 'board')} aria-pressed={battleMode === 'board'} disabled={disabled} onClick={() => onBattleMode('board')}>Na planszy głównej (pojedynek 1 na 1)</button></Tip>
      </Row>
      <Row label="Ułatwienia">
        {EASES.map(([label, on, patch, tip]) => (
          <Tip key={label} text={tip}>
            <button className={chip(on(rules))} aria-pressed={on(rules)} disabled={disabled} onClick={() => onRules(patch(!on(rules)))}>
              {label}
            </button>
          </Tip>
        ))}
      </Row>
      <Row label="Utrudnienia">
        <Tip text={TIPS.dice}>
          <button className={chip(rules.useDice)} aria-pressed={rules.useDice} disabled={disabled} onClick={() => onRules({ useDice: !rules.useDice })}>
            Rzut kością
          </button>
        </Tip>
        {mode === 'coop' && (
          <Tip text={TIPS.extraHero}>
            <button className={chip(rules.extraEvilHero)} aria-pressed={rules.extraEvilHero} disabled={disabled} onClick={() => onRules({ extraEvilHero: !rules.extraEvilHero })}>
              Dodatkowy bohater Hordy
            </button>
          </Tip>
        )}
      </Row>
      <Row label="Remis inicjatywy">
        {TIE_MODES.map(([m, label, tip]) => (
          <Tip key={m} text={tip}>
            <button className={chip(rules.initiativeTie === m)} aria-pressed={rules.initiativeTie === m} disabled={disabled} onClick={() => onRules({ initiativeTie: m })}>
              {label}
            </button>
          </Tip>
        ))}
      </Row>
      <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>Pełna gra to wszystko wyłączone i obrońca pierwszy. Ułatwienia i utrudnienia można dowolnie łączyć.</div>
    </>
  );
}
