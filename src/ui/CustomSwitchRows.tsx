// The switches of the digital edition's "Własne ustawienia", shared by the local setup screen and the online room:
// five sections: the layers of the higher levels, the hero, the battle, the Horde and the computer, treasures and the start.

import { BATTLE_ROUND_LIMITS, CUSTOM_LAYER_NAMES, CUSTOM_LAYERS, HERO_MOVE_POINTS, type CustomLayer, type CustomRules } from '../engine/presets';
import type { BattleMode, Mode } from '../engine/types';
import { chip, Row, Tip, TIPS } from './setupShared';

/** Who strikes first when both units are equally fast: label, mode, explanation. */
const TIE_MODES: Array<[CustomRules['initiativeTie'], string, string]> = [
  ['defender', 'Obrońca pierwszy', 'Przy równej Szybkości pierwsza działa jednostka strony, która została zaatakowana. Tak gra się na każdym poziomie.'],
  ['rotating', 'Na zmianę', 'Przy równej Szybkości strony zaczynają na zmianę: w nieparzystych rundach bitwy atakujący, w parzystych obrońca.'],
];

interface Props {
  /** Unknown while the wizard is still before the mode page: the switches that exist in one mode only then wait for the players page (`CoopSwitchRows`). */
  mode?: Mode;
  growth: boolean;
  layer: CustomLayer;
  battleMode: BattleMode;
  rules: CustomRules;
  /** Online: only the room's owner changes the table. */
  disabled?: boolean;
  onGrowth: (growth: boolean) => void;
  onLayer: (layer: CustomLayer) => void;
  onBattleMode: (mode: BattleMode) => void;
  onRules: (patch: Partial<CustomRules>) => void;
}

const LAYER_TIPS: Record<CustomLayer, string> = {
  none: 'Poziom 2: bohaterowie rosną, ale nie ma osad ani gospodarki.',
  kingdom: 'Poziom 3: osady, złoto, rekrutacja, targ z artefaktami.',
  economy: 'Poziom 4: drewno, ruda i Pył, budynki za surowce, oblężenia osad.',
  realm: 'Poziom 5: drugi bohater najęty w karczmie, czary w bitwie i na mapie.',
  empire: 'Poziom 6: Odłamki i budynek Pierwotnej Iskry, mechaniki frakcji, Relikt.',
};

/** A button with a tip, the same in every section. */
function Choice({ on, disabled, tip, onClick, children }: { on: boolean; disabled: boolean; tip: string; onClick: () => void; children: React.ReactNode }) {
  return <Tip text={tip}><button className={chip(on)} aria-pressed={on} disabled={disabled} onClick={onClick}>{children}</button></Tip>;
}

/** Switches that need the mode (the players page of the wizard, the online room): they live in the section "Horda i komputer". */
export function CoopSwitchRows({ rules, disabled = false, onRules }: { rules: CustomRules; disabled?: boolean; onRules: (patch: Partial<CustomRules>) => void }) {
  return (
    <Row label="Horda i komputer (kooperacja)">
      <Choice on={rules.extraEvilHero} disabled={disabled} tip={TIPS.extraHero} onClick={() => onRules({ extraEvilHero: !rules.extraEvilHero })}>Dodatkowy bohater Hordy</Choice>
    </Row>
  );
}

export function CustomSwitchRows({ mode, growth, layer, battleMode, rules, disabled = false, onGrowth, onLayer, onBattleMode, onRules }: Props) {
  return (
    <>
      <Row label="Poziomy i mechaniki">
        <Choice on={!growth} disabled={disabled} tip="Poziom 1: bohaterowie mają stałe liczby przez całą grę." onClick={() => onGrowth(false)}>Bez rozwoju</Choice>
        {CUSTOM_LAYERS.map((l) => (
          <Choice key={l} on={growth && layer === l} disabled={disabled} tip={LAYER_TIPS[l]} onClick={() => { onGrowth(true); onLayer(l); }}>{CUSTOM_LAYER_NAMES[l]}</Choice>
        ))}
      </Row>
      <Row label="Bohater">
        {HERO_MOVE_POINTS.map((n) => (
          <Choice key={n} on={rules.heroMovePoints === n} disabled={disabled} tip={`Bohater ma ${n} punkty ruchu na turę (zwykle 3).`} onClick={() => onRules({ heroMovePoints: n })}>Ruch {n}</Choice>
        ))}
        <Choice on={rules.heroReplacement} disabled={disabled} tip="Gdy bohater zginie, gracz bierze nowego, nieużywanego bohatera swojej frakcji. Wkracza on na wolne pole najbliżej bazy." onClick={() => onRules({ heroReplacement: !rules.heroReplacement })}>Rezerwowy bohater po śmierci</Choice>
      </Row>
      <Row label="Bitwa">
        <Choice on={battleMode === 'arena'} disabled={disabled} tip={TIPS.arena} onClick={() => onBattleMode('arena')}>Osobna arena (3 na 3)</Choice>
        <Choice on={battleMode === 'board'} disabled={disabled} tip={TIPS.board} onClick={() => onBattleMode('board')}>Na planszy głównej (pojedynek 1 na 1)</Choice>
        <Choice on={!rules.abilities} disabled={disabled} tip="Nikt nie używa zdolności z kart, także strażnicy kryształów. Mniej zasad do zapamiętania." onClick={() => onRules({ abilities: !rules.abilities })}>Bez zdolności</Choice>
        <Choice on={rules.useDice} disabled={disabled} tip={TIPS.dice} onClick={() => onRules({ useDice: !rules.useDice })}>Rzut kością</Choice>
        {TIE_MODES.map(([m, label, tip]) => (
          <Choice key={m} on={rules.initiativeTie === m} disabled={disabled} tip={tip} onClick={() => onRules({ initiativeTie: m })}>Remis: {label}</Choice>
        ))}
      </Row>
      <Row label="Limit rund bitwy">
        {BATTLE_ROUND_LIMITS.map((n) => (
          <Choice key={n} on={rules.battleRoundLimit === n} disabled={disabled} tip={`Po ${n} rundach bitwy wygrywa strona z większą sumą Życia.`} onClick={() => onRules({ battleRoundLimit: n })}>{n}</Choice>
        ))}
      </Row>
      <Row label="Horda i komputer">
        <Choice on={rules.hordeRespawn !== false} disabled={disabled} tip="Kooperacja: gdy padnie ostatni bohater automatu, w bazie Hordy pojawia się kolejny." onClick={() => onRules({ hordeRespawn: rules.hordeRespawn === false })}>Posiłki Hordy</Choice>
        {mode === 'coop' && <Choice on={rules.extraEvilHero} disabled={disabled} tip={TIPS.extraHero} onClick={() => onRules({ extraEvilHero: !rules.extraEvilHero })}>Dodatkowy bohater Hordy</Choice>}
      </Row>
      <Row label="Skarby i start">
        <Choice on={!rules.treasures} disabled={disabled} tip="Zamiast talii różnych skarbów na mapie leżą tylko Eliksiry Odrodzenia. Jedna prosta karta do zapamiętania." onClick={() => onRules({ treasures: !rules.treasures })}>Same Eliksiry Odrodzenia</Choice>
      </Row>
      <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>Pełna gra to wszystko wyłączone i obrońca pierwszy. Gry na własnych ustawieniach nie dają punktów rankingu.</div>
    </>
  );
}
