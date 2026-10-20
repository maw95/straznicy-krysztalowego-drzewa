// In-game rules reference: summary of the rules, all unit cards, all treasure cards, shortcuts.

import { useState } from 'react';
import { FACTION_HEROES, FACTION_SUPPORTS, GUARDIANS, ITEMS, type ItemKind } from '../engine/data';
import { Frame, Ribbon } from './common';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

type Tab = 'rules' | 'units' | 'treasures' | 'keys';

const TABS: Array<[Tab, string]> = [
  ['rules', 'Zasady'],
  ['units', 'Jednostki'],
  ['treasures', 'Skarby'],
  ['keys', 'Skróty'],
];

const RULES: Array<[string, string[]]> = [
  ['Cel gry', [
    'Przymierze Świtu wygrywa, gdy dostarczy do Kryształowego Drzewa wszystkie wymagane kryształy.',
    'Mroczna Horda wygrywa, gdy upłynie limit rund, polegną wszyscy bohaterowie Przymierza albo jej żyjący bohaterowie ukończą rytuał przy Drzewie (staną na nim na koniec dwóch kolejnych rund).',
  ]],
  ['Mapa przygody', [
    'Każdy bohater ma 2 punkty ruchu na turę. Teren łatwy kosztuje 1, trudny 2, góry są nieprzechodnie. Niewykorzystane punkty przepadają.',
    'Wejście na pole odkrywa sąsiednie zakryte pola. Skarb trafia do wspólnego ekwipunku frakcji.',
    'Kryształów pilnują neutralni strażnicy — wejście na ich pole rozpoczyna walkę. Wejście na pole wrogiego bohatera rozpoczyna bitwę.',
    'Kryształ oddaje się, wchodząc z nim na pole Drzewa. Jeśli stoi tam zły bohater, najpierw trzeba go pokonać.',
  ]],
  ['Bitwa', [
    'Na arenie każda strona wystawia bohatera i dwóch pomocników (3 na 3); strażnik walczy sam. W wariancie „na planszy głównej” walczą tylko bohaterowie — pojedynek 1 na 1 bez ruchu.',
    'Co rundę każda jednostka ma jedną aktywację, od najwyższej Szybkości: ruch o tyle pól, ile wynosi Szybkość, i opcjonalnie jeden atak.',
    'Atak zadaje obrażenia równe Atakowi. Nie ma kontrataków. Strzelec strzela przez całą arenę, jeśli przeszkoda nie zasłania celu; z wrogiem obok może atakować tylko jego. Latający przelatują nad przeszkodami.',
    'Zdolności (gdy są włączone) działają raz na bitwę. Skarby używa się przed akcją własnej jednostki; Tarcza Strażnika działa jako reakcja.',
    'Bitwa trwa do śmierci wszystkich jednostek jednej strony. Ocalali odzyskują pełne Życie, polegli pomocnicy giną na stałe, a poległego bohatera przywraca tylko Eliksir Odrodzenia.',
  ]],
];

const KEYS: Array<[string, string]> = [
  ['Spacja / E', 'zakończ turę (na mapie)'],
  ['Spacja', 'zakończ aktywację (w bitwie)'],
  ['U lub Ctrl+Z', 'cofnij ostatni krok na mapie'],
  ['F', 'przewiń ruchy botów'],
  ['Z', 'włącz zdolność aktywnej jednostki'],
  ['S', 'pokaż skarby w bitwie'],
  ['T', 'pokaż zasięg wrogów w bitwie'],
  ['D', 'dziennik'],
  ['R', 'zasady i karty'],
  ['O', 'opcje'],
  ['Esc', 'zamknij okno'],
];

export function RulesDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('rules');
  const cardW = Math.min(200, (window.innerWidth - 110) / 2);
  return (
    <Frame crest style={{ width: 'min(1080px, 96vw)', height: '86vh' }} innerStyle={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Ribbon style={{ width: 'min(420px, 100%)', alignSelf: 'center' }}>Zasady i karty</Ribbon>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} className={`btn plate parch ${tab === id ? 'on' : ''}`} style={{ padding: '4px 16px', fontSize: 17 }} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="scroll" style={{ flex: 1, minHeight: 0 }}>
        {tab === 'rules' && (
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RULES.map(([title, lines]) => (
              <div key={title} className="plate parch" style={{ padding: '12px 18px' }}>
                <div style={{ fontWeight: 800, fontSize: 21, marginBottom: 6 }}>{title}</div>
                {lines.map((l) => (
                  <p key={l} style={{ margin: '0 0 6px', fontSize: 17, lineHeight: 1.35 }}>
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab === 'units' &&
          ([
            ['Przymierze Świtu', [...FACTION_HEROES.dawn, ...FACTION_SUPPORTS.dawn]],
            ['Mroczna Horda', [...FACTION_HEROES.horde, ...FACTION_SUPPORTS.horde]],
            ['Strażnicy kryształów', GUARDIANS],
          ] as Array<[string, string[]]>).map(([title, ids]) => (
            <div key={title} style={{ marginBottom: 18 }}>
              <div className="lbl" style={{ textAlign: 'center', margin: '4px 0 10px' }}>{title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                {ids.map((id) => (
                  <UnitCard key={id} unitId={id} width={cardW} />
                ))}
              </div>
            </div>
          ))}
        {tab === 'treasures' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            {(Object.keys(ITEMS) as ItemKind[]).map((k) => (
              <TreasureCard key={k} kind={k} width={cardW} />
            ))}
          </div>
        )}
        {tab === 'keys' && (
          <div className="plate parch" style={{ maxWidth: 520, margin: '0 auto', padding: '12px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 18px', fontSize: 17 }}>
            {KEYS.map(([k, d]) => (
              <div key={k} style={{ display: 'contents' }}>
                <b>{k}</b>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="btn prim" style={{ alignSelf: 'center', padding: '6px 26px', fontSize: 18 }} onClick={onClose}>
        Zamknij
      </button>
    </Frame>
  );
}
