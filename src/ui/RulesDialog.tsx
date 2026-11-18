// In-game rules reference: summary of the rules, all unit cards, all treasure cards, shortcuts.

import { useContext, useState } from 'react';
import { FACTION_HEROES, FACTION_SUPPORTS, GUARDIANS, ITEMS, NEUTRAL_BOSSES, NEUTRAL_WEAK, UNITS, type ItemKind } from '../engine/data';
import { ARTIFACTS, RARITY_NAMES, SETS, SITE } from '../engine/sites';
import { ALT_UNITS, KINGDOM, LEGENDS, RECRUIT_COSTS, RECRUITS } from '../engine/kingdom';
import { COMMANDERS } from '../engine/realm';
import { MINE_NAMES, OBJECT_NAMES, SIEGE } from '../engine/economy';
import { asset, Frame, Ribbon } from './common';
import { ManualView } from './ManualView';
import { ArtifactMedal, SLOT_NAMES } from './growthUi';
import { DigitalContext, RuleText } from './statScale';
import { savedDigital } from './NewGameWizard';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

type Tab = 'rules' | 'manual' | 'units' | 'treasures' | 'artifacts' | 'places' | 'keys';

const TABS: Array<[Tab, string]> = [
  ['rules', 'Podstawowe zasady'],
  ['manual', 'Instrukcja'],
  ['units', 'Jednostki'],
  ['treasures', 'Skarby'],
  ['artifacts', 'Artefakty'],
  ['places', 'Lokacje na mapie'],
  ['keys', 'Skróty'],
];

const RULES: Array<[string, string[]]> = [
  ['Wersje i poziomy', [
    'Wersja cyfrowa jest domyślna: jednostki w grafice 2D z animacjami, arena z poziomymi heksami, duże jednostki na dwóch polach. Wersja planszowa to wierna planszówka (figurki 3D, zasady bez zmian).',
    'Poziom 1 „Przygoda”: zasady z planszówki. Poziom 2 „Wyprawa”: rozwój bohatera, artefakty, obiekty na mapie, neutralni i wybór celu oraz mapy. Poziom 3 „Osada” (osady, złoto, rekrutacja) i kolejne dopiero się pojawią. „Własne ustawienia” pozwalają przełączać zasady osobno.',
    'Tryby: kooperacja (do 3 graczy przeciw automatowi zła), rywalizacja (2–6 graczy, najwyżej 3 na stronę) i arena (jedna bitwa 3 na 3). Gra lokalna z botami, hot-seat przy jednym ekranie albo online z kontem.',
  ]],
  ['Cel gry', [
    'Kryształy do Drzewa (domyślny): Przymierze Świtu wygrywa, gdy zaniesie do Kryształowego Drzewa wszystkie potrzebne kryształy (2 przy jednym bohaterze, 3 przy dwóch lub trzech). Pokonanie bohaterów Hordy nie wystarczy.',
    'Mroczna Horda wygrywa, gdy minie limit rund (8 / 12 / 18 / 24 i więcej na największych mapach), gdy polegną wszyscy bohaterowie Przymierza albo gdy ukończy rytuał przy Drzewie.',
    'Od poziomu 2 do wyboru: Punkty kontrolne (kto utrzyma więcej punktów przez kilka rund), Przetrwanie (fale Hordy, kooperacja), Boss (legowisko pośrodku mapy, wygrywa zadający ostatni cios) i Artefakt (kto zaniesie go do swojej bazy).',
  ]],
  ['Runda i ruch', [
    'W każdej rundzie każdy żyjący bohater ma jedną turę: 3 punkty ruchu (rozwój, artefakty i umiejętności mogą je zwiększyć). Teren łatwy kosztuje 1, trudny 2; góry, woda, przepaści, martwy gąszcz i ciernie są nieprzejezdne. Niewykorzystane punkty przepadają.',
    'Na jednym polu stoi najwyżej jeden bohater; wyjątek: we własnej bazie może stać kilku. Wejście na pole odkrywa pola sąsiednie. Skarb z pola trafia do wspólnego ekwipunku frakcji.',
    'Na koniec rundy kryształ na torze rund przesuwa się o jedno pole. Na większych mapach Przymierze zaczyna z kilkoma skarbami.',
    'Przytrzymany prawy przycisk myszy (na telefonie przytrzymanie palca) pokazuje szczegóły pola, jednostki albo skarbu; puszczasz i okno znika.',
  ]],
  ['Kryształy, strażnicy i neutralni', [
    'Kryształów pilnują strażnicy (Cyklop, Gryf, Hydra). Wejście na ich pole (tylko Przymierze) rozpoczyna walkę; zwycięzca podnosi kryształ, a strażnik zostawia skarb.',
    'Na mapie wyprawy stoją też grupy neutralnych: słabi (Kruszyniec, Podkopnik, Orzeł Skalny, Harpia, Szczypiec, Bagienny Pełzacz) i bossowie (Kamienny Golem, Król Burzy, Kraken). Im dalej od baz, tym silniejsza grupa i rzadsza nagroda.',
    'Kryształ oddaje się, wchodząc z nim na pole Drzewa. Jeśli stoi tam bohater Hordy, najpierw trzeba go pokonać. Kryształy poległego bohatera zostają na polu bitwy.',
    'Eliksir Odrodzenia wypity na mapie wskrzesza bohatera na wybranym wolnym polu obok pijącego albo przywraca pomocnika.',
  ]],
  ['Rozwój bohatera (poziom 2 „Wyprawa”)', [
    'Punkty doświadczenia (PD): 3 za pokonanego strażnika, 2 za wygraną walkę z bohaterem, 1 za przegraną, którą bohater przeżył, 1 za skarb, 2 za kapliczkę. Horda dostaje dodatkowo 1 PD na koniec każdej rundy.',
    'Progi poziomów to 3, 7, 12, 18, 26, 38, 56, 84 i 128 PD (poziomy 2–10). Na każdym nowym poziomie bohater wybiera jedną z trzech umiejętności; ta sama wybrana ponownie rośnie o stopień (do III).',
    'Kamienie milowe: na poziomach 3, 6 i 9 ulepsza się zdolność specjalna bohatera (cyfra II, III, IV na jej ikonie). Widać je na Karcie bohatera, którą otwiera kliknięcie portretu.',
    'Artefakty to stałe wyposażenie jednego bohatera, po jednym na miejsce: hełm, broń, zbroja, tarcza, buty, w trzech rzadkościach (zakładka „Artefakty”). Rzadszy sam zastępuje pospolitszy, reszta trafia do plecaka bez limitu miejsc. Kto pokona bohatera, zabiera mu artefakty.',
    'Artefakt leży w skrzyni, wypada ze strażnika albo przechodzi na zwycięzcę walki bohaterów. Artefaktem można się dzielić z sojusznikiem na sąsiednim polu (Karta bohatera, okno plecaka).',
  ]],
  ['Bitwa', [
    'Wejście na pole wrogiego bohatera, strażnika albo neutralnych rozpoczyna bitwę. Kosztuje tyle punktów ruchu, ile koszt terenu tego pola, a po wygranej bohater może iść dalej. Na arenie każda strona wystawia bohatera i dwóch pomocników (w poziomie 1 w wersji planszowej to pojedynek 1 na 1).',
    'Najpierw obie strony ustawiają jednostki w swojej skrajnej kolumnie (zaczyna atakujący). Co rundę każda jednostka ma jedną aktywację, od najszybszej (przy remisie pierwszy działa broniący się): ruch o tyle pól, ile wynosi Szybkość, i atak.',
    'Cios zadaje tyle obrażeń, ile wynosi Atak. Nie ma kontrataków. Strzelec strzela przez całą arenę, jeśli przeszkoda nie zasłania celu; gdy wróg stoi tuż obok, może atakować tylko jego. Latający przelatują nad przeszkodami.',
    'Zdolności bohaterów i pomocników działają raz na bitwę (Szarża Światła i Zew Krwi zawsze). Zdolności strażników działają przy każdym ataku. Skarbów używa się przed akcją własnej jednostki (ikona „Skarby” w rogu mapy i na arenie).',
    'Bitwa trwa, aż polegną wszystkie jednostki jednej strony. Ocalali odzyskują pełne Życie, polegli pomocnicy odpadają z gry, a poległego bohatera przywraca tylko Eliksir Odrodzenia.',
  ]],
  ['Automat zła', [
    'W kooperacji automat zła ma tylu bohaterów, ilu jest graczy (na poziomie trudnym o jednego więcej, co najmniej trzech). Gdy polegną wszyscy, w bazie Hordy pojawia się kolejny bohater, poza poziomem trudnym.',
    'Każda jednostka atakuje wroga z najmniejszą liczbą Życia: najpierw spośród tych, których sięga bez ruchu, potem spośród tych, do których dojdzie. Przy remisie wybiera bohatera. Skarby automat zużywa przy pierwszej okazji.',
  ]],
  ['Trudność', [
    'Poziom 0 (w wersji planszowej „Łatwy”): krótkie pojedynki na planszy, bez zdolności i rytuału, poległego bohatera zastępuje rezerwowy. Na poziomach 1–3 wszystkie trudności to pełna gra (arena 3 na 3, zdolności, skarby), a różnią się startem komputera: Łatwy zaczyna słabszy, Normalny jak w zasadach, Trudny (kooperacja) ma o jednego bohatera Hordy więcej i dwa skarby, ale bez posiłków.',
  ]],
  ['Arena', [
    'Jedna bitwa 3 na 3 bez mapy: Przymierze kontra Horda, z komputerem albo z drugim graczem. Każdy wybiera bohatera i 2 z 3 pomocników.',
    'Skarby ze wspólnej talii: na zmianę A, B, B, A wybiera się jeden z pokazanych (Przymierze widzi 3, Horda 4), pozostałe wracają do talii. Każdy ma 2 skarby, ukryte do chwili użycia.',
    'Losowo: kto wybiera pierwszy (A) i na której arenie się walczy. Wygrywa strona, która ostatnia stoi na arenie.',
  ]],
];

/** What can lie on the map: name, picture, level of the game it appears from, what it does. Sorted by level, then in the order of the list. */
const PLACES: Array<[string, string, number, string]> = [
  ['Kryształowe Drzewo', 'ui/ico_drzewo.png', 1, 'Cel Przymierza w grze o kryształy: tu oddaje się zebrane kryształy. Horda odprawia przy nim rytuał.'],
  ['Baza', 'ui/ico_oboz.png', 1, 'Stąd startują bohaterowie frakcji. W bazie może stać kilku bohaterów naraz; w grze o Artefakt trzeba tu zanieść cel.'],
  ['Kryształ ze strażnikiem', 'ui/ico_krysztal.png', 1, 'Kryształu pilnuje strażnik: Cyklop, Gryf albo Hydra. Pokonany zostawia kryształ i skarb.'],
  ['Skarb', 'ikony/mapa/treasure.webp', 1, 'Kto wejdzie na pole, zabiera skarb do wspólnego ekwipunku frakcji. Skarb to jednorazowa karta (zakładka „Skarby”).'],
  ['Punkt kontrolny', 'ikony/mapa/kontrola_none.webp', 1, 'W grze o punkty kontrolne: punkt trzyma ten, czyj bohater stoi na nim na koniec rundy. Środkowy jest wart 2, boczne po 1.'],
  ['Neutralni', 'ui/ico_jama.png', 1, 'Grupa neutralnych jednostek strzeże pola. Walka z nimi daje PD i nagrodę; im dalej od baz, tym silniejsi.'],
  ['Legowisko Bossa', 'ui/ico_gory.png', 1, 'W grze o Bossa: obie strony mogą go wyzywać, a jego rany zostają między walkami.'],
  ['Teren', 'ui/ico_las.png', 1, 'Łatwy teren (polana, las, droga) kosztuje 1 punkt ruchu, trudny (bagno, jama) 2. Góry, woda i ciernie są nieprzejezdne, a przez wodę prowadzą mosty.'],
  ['Kapliczka', 'tiles/obj_shrine.jpg', 2, SITE.texts.shrine],
  ['Obóz najemników', 'tiles/obj_camp.jpg', 2, SITE.texts.camp],
  ['Skrzynia', 'tiles/obj_chest.jpg', 2, SITE.texts.chest],
  ['Osada', 'ikony/mapa/osada_neutral.webp', 3, `Daje ${KINGDOM.incomeSettlement} zł dochodu na rundę, jest bazą rekrutacji i budynków (koszary, targ, szpital, skarbiec; od poziomu 4 kuźnia i mury, od 5 karczma i wieża maga). Neutralną osadę strzeże grupa neutralnych; zdobytą broni garnizon (do ${SIEGE.garrisonMax} jednostek).`],
  [MINE_NAMES.gold, 'tiles/obj_kopalnia.jpg', 3, `Daje ${KINGDOM.incomeMine} zł na rundę temu, kto ją trzyma (stoi na niej jego bohater albo osada obok).`],
  ['Chatka', 'tiles/obj_chatka.jpg', 3, 'Zadanie: przynieś to, o co prosi (złoto, surowce albo artefakt z plecaka), a dostaniesz nagrodę. Każda chatka tylko raz.'],
  [MINE_NAMES.wood, 'tiles/obj_tartak.jpg', 4, 'Daje drewno co rundę temu, kto ją trzyma.'],
  [MINE_NAMES.ore, 'tiles/obj_kopalnia_ruda.jpg', 4, 'Daje rudę co rundę temu, kto ją trzyma.'],
  [MINE_NAMES.dust, 'tiles/obj_zrodlo_pylu.jpg', 4, 'Daje Gwiezdny Pył co rundę temu, kto je trzyma. Pył kosztują legendarne artefakty, nauka czarów i drogie budynki.'],
  [OBJECT_NAMES.mill, 'tiles/obj_mlyn.jpg', 4, 'Płaci złoto raz za razem: bohater, który tu staje, dostaje dochód (nie częściej niż raz na rundę).'],
  [OBJECT_NAMES.well, 'tiles/obj_studnia.jpg', 4, 'Raz na rundę daje bohaterowi dodatkowy ruch.'],
  [OBJECT_NAMES.store, 'tiles/obj_skladnica.jpg', 4, 'Jednorazowy zapas surowców dla tego, kto pierwszy tu stanie.'],
  ['Mur, brama i wieżyczki', 'ikony/frakcje/garnizon.webp', 4, 'W bitwie o osadę z budynkiem „Mury” obrońcę chroni fosa, mur z bramą i dwie wieżyczki; napastnik ma katapultę i burzy bramę.'],
  ['Wieża maga i karczma', 'ikony/mapa/ksiega.webp', 5, 'Budynki osady: wieża maga uczy czarów w trzech kręgach, w karczmie najmuje się drugiego bohatera (dowódcę).'],
  ['Odłamek Pierwotnej Iskry', 'tiles/obj_odlamek.jpg', 6, 'Leży na mapie od początku, widoczny dla obu stron. Bohater, który go podniesie, niesie go; komplet Odłamków przy jednym bohaterze w jego osadzie wznosi Pierwotną Iskrę.'],
].sort((a, b) => (a[2] as number) - (b[2] as number)) as Array<[string, string, number, string]>;

const UNITS_NAME = (id: string): string => UNITS[id]?.name ?? id;

const KEYS: Array<[string, string]> = [
  ['Spacja / E', 'zakończ turę (na mapie)'],
  ['Spacja', 'zakończ aktywację (w bitwie)'],
  ['U lub Ctrl+Z', 'cofnij ostatni krok na mapie'],
  ['F', 'przewiń ruchy botów'],
  ['Z', 'włącz zdolność aktywnej jednostki'],
  ['S', 'pokaż skarby w bitwie'],
  ['Ctrl', 'przytrzymany nad jednostką w bitwie: pokazuje, dokąd dojdzie i kogo dosięgnie'],
  ['D', 'dziennik'],
  ['R', 'zasady i karty'],
  ['O', 'opcje'],
  ['Esc', 'zamknij okno'],
];

export function RulesDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('rules');
  /** Treasure cards in the edition being played (the menu: the edition picked last time). */
  const digitalCards = useContext(DigitalContext) || savedDigital();
  // Three cards fill the width of the dialog (min(1080px, 96vw)); on phones they stay readable and wrap.
  const cardW = Math.max(160, Math.min(320, (Math.min(1080, window.innerWidth * 0.96) - 100) / 3));
  // Cards sit at most three to a row.
  const cardRow = { display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', margin: '0 auto' } as const;
  return (
    <Frame crest className={tab === 'manual' ? 'rules-manual' : undefined} style={{ width: 'min(1080px, 96vw)', height: '86vh' }} innerStyle={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Ribbon style={{ width: 'min(420px, 100%)', alignSelf: 'center' }}>Zasady i karty</Ribbon>
      <div className="rules-tabs" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
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
        {tab === 'manual' && <ManualView />}
        {tab === 'units' &&
          ([
            ['Przymierze Świtu', [...FACTION_HEROES.dawn, ...FACTION_SUPPORTS.dawn]],
            ['Mroczna Horda', [...FACTION_HEROES.horde, ...FACTION_SUPPORTS.horde]],
            ['Poziom 3 i 4: pomocnicy do rekrutacji w osadzie, Przymierze Świtu (stopnie 2–5)', RECRUITS.dawn.filter((r) => r.tier >= 2 && r.tier <= 5 && !r.alt).map((r) => r.id)],
            ['Poziom 3 i 4: pomocnicy do rekrutacji w osadzie, Mroczna Horda (stopnie 2–5)', RECRUITS.horde.filter((r) => r.tier >= 2 && r.tier <= 5 && !r.alt).map((r) => r.id)],
            ['Poziom 5: dowódcy, czyli drudzy bohaterowie najęci w karczmie', [...Object.values(COMMANDERS.dawn), ...Object.values(COMMANDERS.horde)]],
            ['Poziom 6: legendarne jednostki frakcji (koszary drugiego stopnia, 20 zł i 3 Pyły)', [LEGENDS.dawn, LEGENDS.horde]],
            ['Poziom 6: alternatywni pomocnicy (jedno siedlisko na stopień, drugie zamyka się na całą grę)', [...ALT_UNITS.dawn, ...ALT_UNITS.horde]],
            ['Strażnicy kryształów', GUARDIANS],
            ['Neutralni: słabi', NEUTRAL_WEAK],
            ['Neutralni: bossowie', NEUTRAL_BOSSES],
            ['Strażnicy w pojedynku na planszy (karty z błękitnym rewersem)', GUARDIANS, true],
          ] as Array<[string, string[], boolean?]>).map(([title, ids, duel]) => (
            <div key={title} style={{ marginBottom: 18 }}>
              <div className="lbl" style={{ textAlign: 'center', margin: '4px 0 10px' }}>{title}</div>
              {title.startsWith('Poziom 3 i 4') && (
                <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', margin: '-4px 0 8px' }} data-rules-recruit-costs>
                  {ids.map((id) => { const r = RECRUITS[title.includes('Przymierze') ? 'dawn' : 'horde'].find((x) => x.id === id)!; return `${UNITS_NAME(id)}: stopień ${r.tier}, ${RECRUIT_COSTS[r.tier - 1]} zł`; }).join(' · ')}
                </div>
              )}
              <div style={{ ...cardRow, maxWidth: cardW * 3 + 28 }}>
                {ids.map((id) => (
                  <UnitCard key={id} unitId={id} width={cardW} duel={duel} />
                ))}
              </div>
            </div>
          ))}
        {tab === 'treasures' && (
          <DigitalContext.Provider value={digitalCards}>
            <div style={{ ...cardRow, maxWidth: cardW * 3 + 28 }}>
              {(Object.keys(ITEMS) as ItemKind[]).map((k) => (
                <TreasureCard key={k} kind={k} width={cardW} />
              ))}
            </div>
          </DigitalContext.Provider>
        )}
        {tab === 'artifacts' && (
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }} data-rules-artifacts>
            <div style={{ fontSize: 16, textAlign: 'center', color: 'var(--muted)' }}>Stałe wyposażenie bohatera (poziom 2 „Wyprawa”): po jednym na miejsce, w trzech rzadkościach. Rzadszy zastępuje pospolitszy, reszta trafia do plecaka.</div>
            {(['helmet', 'weapon', 'armor', 'shield', 'boots'] as const).map((slot) => (
              <div key={slot} className="plate parch" style={{ padding: '10px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{SLOT_NAMES[slot]}</div>
                {ARTIFACTS.filter((a) => a.slot === slot).sort((a, b) => a.rarity - b.rarity).map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '4px 0' }}>
                    <ArtifactMedal art={a} size={46} />
                    <div style={{ fontSize: 16, lineHeight: 1.3 }}>
                      <b>{a.name}</b> <span className={`rarity r${a.rarity}`}>{RARITY_NAMES[a.rarity]}</span>
                      <div><RuleText text={a.text} /></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab === 'artifacts' && (
          <div style={{ maxWidth: 860, margin: '14px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }} data-rules-sets>
            <div style={{ fontSize: 16, textAlign: 'center', color: 'var(--muted)' }}>Zestawy (od poziomu 3 „Osada”): rzadkie części jednego zestawu dają premię za dwie i za trzy założone (licznik „2/3 zestawu” przy bohaterze). Plecak mieści dowolnie wiele artefaktów; założyć można tylko jeden na miejsce, resztę zmienia się na mapie w karcie bohatera.</div>
            {Object.values(SETS).map((set) => (
              <div key={set.id} className="plate parch" style={{ padding: '10px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{set.name}</div>
                <div style={{ fontSize: 16 }}>Części: {set.pieces.map((id) => ARTIFACTS.find((a) => a.id === id)?.name ?? id).join(', ')}</div>
                <div style={{ fontSize: 16 }}><RuleText text={set.bonusText} /></div>
              </div>
            ))}
            <div style={{ fontSize: 16, textAlign: 'center', color: 'var(--muted)' }}>Skąd się biorą: skrzynie na mapie (artefakt zamiast {KINGDOM.chestGold} zł), kapliczki, chatki z zadaniami, łup z pokonanego bohatera i targ w osadzie (ceny {KINGDOM.artifactPrice.join(' / ')} zł według rzadkości; legendarne od poziomu 4 także za Gwiezdny Pył).</div>
          </div>
        )}
        {tab === 'places' && (
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }} data-rules-places>
            {PLACES.map(([name, img, level, text]) => (
              <div key={name} className="plate parch" style={{ padding: '10px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <img src={asset(img)} alt="" width={56} height={56} style={{ flex: 'none', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{name}{level > 1 && <span style={{ fontWeight: 600, fontSize: 14, marginLeft: 8, color: '#6B4A22' }}>od poziomu {level}</span>}</div>
                  <div style={{ fontSize: 16, lineHeight: 1.35 }}>{text}</div>
                </div>
              </div>
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
      <button className="btn prim" data-enter style={{ alignSelf: 'center', padding: '6px 26px', fontSize: 18 }} onClick={onClose}>
        Zamknij
      </button>
    </Frame>
  );
}
