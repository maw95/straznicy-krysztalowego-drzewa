// In-game rules reference: summary of the rules, all unit cards, all treasure cards, shortcuts.

import { useState } from 'react';
import { FACTION_HEROES, FACTION_SUPPORTS, GUARDIANS, ITEMS, type ItemKind } from '../engine/data';
import { asset, Frame, Ribbon } from './common';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

type Tab = 'rules' | 'manual' | 'units' | 'treasures' | 'keys';

const TABS: Array<[Tab, string]> = [
  ['rules', 'Podstawowe zasady'],
  ['manual', 'Instrukcja'],
  ['units', 'Jednostki'],
  ['treasures', 'Skarby'],
  ['keys', 'Skróty'],
];

const RULES: Array<[string, string[]]> = [
  ['Cel gry', [
    'Przymierze Świtu wygrywa, gdy zaniesie do Kryształowego Drzewa wszystkie potrzebne kryształy (2 na mapie krótkiej, 3 na pozostałych) albo gdy polegną wszyscy bohaterowie Hordy.',
    'Mroczna Horda wygrywa, gdy minie limit rund (8 / 12 / 16 / 20), gdy polegną wszyscy bohaterowie Przymierza albo gdy ukończy rytuał: jeden jej bohater stoi na Drzewie, a pozostali żyjący na polach obok, na koniec dwóch kolejnych rund.',
  ]],
  ['Runda i ruch', [
    'W każdej rundzie każdy żyjący bohater ma jedną turę: 2 punkty ruchu. Teren łatwy kosztuje 1, trudny 2; góry, przepaści, martwy gąszcz i ciernie są nieprzejezdne. Niewykorzystane punkty przepadają.',
    'Na jednym polu stoi najwyżej jeden bohater — na pole sojusznika nie można wejść. Wyjątek: we własnej bazie może stać kilku bohaterów.',
    'Horda nazywa swoich bohaterów wodzami, a pomocników poplecznikami — w zasadach to po prostu bohaterowie i pomocnicy.',
    'Wejście na pole odkrywa pola sąsiednie. Skarb z pola trafia do wspólnego ekwipunku frakcji.',
    'Na koniec rundy kryształ na torze rund przesuwa się o jedno pole.',
  ]],
  ['Kryształy i strażnicy', [
    'Kryształów pilnują strażnicy. Wejście na ich pole (tylko Przymierze) rozpoczyna walkę. Zwycięzca od razu podnosi kryształ, a strażnik zostawia skarb.',
    'Kryształ oddaje się, wchodząc z nim na pole Drzewa. Jeśli stoi tam bohater Hordy, najpierw trzeba go pokonać.',
    'Kryształy poległego bohatera zostają na polu bitwy. Bohater Przymierza, który na nim stanie, od razu je podnosi.',
    'Eliksir Odrodzenia wypity na mapie wskrzesza bohatera na wybranym wolnym polu obok pijącego albo przywraca pomocnika.',
  ]],
  ['Bitwa', [
    'Wejście na pole wrogiego bohatera rozpoczyna bitwę. Na arenie każda strona wystawia bohatera i dwóch pomocników (3 na 3); strażnik walczy sam. W pojedynkach na planszy walczą tylko bohaterowie, bez ruchu, a strażnik ma mniej Życia (liczba w nawiasie na karcie).',
    'Najpierw obie strony ustawiają jednostki w swojej skrajnej kolumnie (zaczyna atakujący). Co rundę każda jednostka ma jedną aktywację, od najszybszej (przy remisie pierwszy działa broniący się): ruch o tyle pól, ile wynosi Szybkość, i jeden atak.',
    'Cios zadaje tyle obrażeń, ile wynosi Atak. Nie ma kontrataków. Strzelec strzela przez całą arenę, jeśli przeszkoda nie zasłania celu; gdy wróg stoi tuż obok, może atakować tylko jego. Latający przelatują nad przeszkodami.',
    'Zdolności bohaterów i pomocników działają raz na bitwę (Szarża Światła zawsze). Zdolności strażników działają przy każdym ataku. Skarbów używa się przed akcją własnej jednostki; Tarcza Strażnika działa sama.',
    'Bitwa trwa, aż polegną wszystkie jednostki jednej strony. Ocalali odzyskują pełne Życie, polegli pomocnicy odpadają z gry, a poległego bohatera przywraca tylko Eliksir Odrodzenia.',
  ]],
  ['Automat zła i strażnicy w bitwie', [
    'Jednostki automatu (w kooperacji) i strażnicy działają według prostych zasad: zdolności używają przy pierwszej okazji; gdy nikogo nie mogą zaatakować, idą do najbliższego wroga.',
    'Bohater i strażnik atakują bohatera, jeśli mają go w zasięgu, a jeśli w zasięgu są tylko pomocnicy — tego z najmniejszą liczbą Życia. Pomocnicy automatu atakują najpierw pomocników (z mniejszą liczbą Życia), a dopiero potem bohatera.',
  ]],
  ['Poziomy gry', [
    'Dla dzieci: pojedynki na planszy, bez zdolności. Normalny: pełna gra (arena 3 na 3, zdolności, skarby). Trudny (kooperacja): automat zła ma o jednego bohatera więcej.',
    'Własny: rodzaj bitew i ułatwienia (bez zdolności, same Eliksiry Odrodzenia, rezerwowy bohater) oraz utrudnienia (rzut kością −1/0/+1 do każdego ciosu, dodatkowy bohater Hordy). Wszystko opisuje zakładka „Instrukcja”.',
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
  // Three cards fill the width of the dialog (min(1080px, 96vw)); on phones they stay readable and wrap.
  const cardW = Math.max(160, Math.min(320, (Math.min(1080, window.innerWidth * 0.96) - 100) / 3));
  // Cards sit at most three to a row.
  const cardRow = { display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', margin: '0 auto' } as const;
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
        {tab === 'manual' && (
          // The printable rulebook (docs/edytowalny_szablon_instrukcji, copied by scripts/assets/manual.py).
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <iframe title="Instrukcja" src={asset('manual/index.html?embed')} style={{ flex: 1, minHeight: 0, width: '100%', border: 0, borderRadius: 6, background: 'transparent' }} />
            <a href={asset('manual/index.html')} target="_blank" rel="noreferrer" style={{ alignSelf: 'center', color: '#F3D27A', fontSize: 15 }}>
              Otwórz instrukcję w nowej karcie (do druku)
            </a>
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
              <div style={{ ...cardRow, maxWidth: cardW * 3 + 28 }}>
                {ids.map((id) => (
                  <UnitCard key={id} unitId={id} width={cardW} />
                ))}
              </div>
            </div>
          ))}
        {tab === 'treasures' && (
          <div style={{ ...cardRow, maxWidth: cardW * 3 + 28 }}>
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
