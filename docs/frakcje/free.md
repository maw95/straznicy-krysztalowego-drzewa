# Karta frakcji: Wolne Kompanie (`free`) — G0 zatwierdzona wstępnie (20.11.2026)

Stan: 20.11.2026. Autor wstępnie zatwierdził kartę (skład, dowódcy, mechanika); **liczby Ż/A/S, koszty i zdolności „N” ustali balans przy bramce G2**. Treść przeniesiona z `FRAKCJE_PROPOZYCJE.md` (sekcja 6) po uwagach autora z 19.11 i 20.11; ta karta jest teraz źródłem prawdy. Szablon: `KARTA_FRAKCJI_SZABLON.md`. Odrzucone pomysły: `ODRZUCONE_POMYSLY.md`. Bramki: G1 dane i paczka, G2 balans, G3 próbka jednostki (autor), G4 grafika, G5 instrukcja.


**EN:** Free Companies · **Rola:** kontrola + mobilność · **DLC**

**Klimat.** Bractwo zwierzoludzi z lasów, rzek i obejść: koty, borsuki, kruki, wydry, kuny, ropuchy. Trochę zbójnicy spod
Tatr, trochę najemnicy, zawsze z planem. Każdy jest specjalistą: jeden zastawia sidła, drugi oznacza cel, trzeci wchodzi od tyłu.

**Odróżnienie od Przymierza (decyzja 19.11):** Przymierze to zwierzęta dzikie, magiczne i świetliste, bez ubrań. Kompanie to
**zwierzoludzie**: chodzą na dwóch nogach, noszą ubrania, mają narzędzia, sidła i **proch** (Borsuk Petardnik, Ropuch
z Hakownicą). Bez magii natury. Paleta ciepła i rdzawa, Przymierze srebrno-zielone.

**Mechanika wyróżniająca: Sidła** (ukryte pułapki przed bitwą) i **kombinacje specjalistów** przez *oznaczenie* celu
(Kruk oznacza, reszta bije mocniej). Skarby: Kompanie mają z nich więcej (Paserka).

**Mocne strony:** karzą wolne i zwarte armie (Klany, Rój), zarabiają, omijają walki na mapie.
**Słabości:** krucha pierwsza linia; szybcy (Stada) przeskakują pułapki.

## Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `foxCaptain` | Ruda Atamanka | łowca | 1 | chód | dyst. | **Fortel:** raz na bitwę kładzie dodatkową ukrytą pułapkę albo przenosi jedną własną | Złota Łapa: +1 zł za wygraną (`gold`) |
| `badgerSapper` | Borsuk Saper | wojownik | 1 | chód | wręcz | **Okop:** raz na bitwę do końca następnej aktywacji +N pancerza i nie da się go odepchnąć | Stary Wiarus: pomocnicy +1 Ż (`supportHp`) |
| `ravenSeer` | Kruk Wieszczek | mędrzec | 1 | lot | dyst. | **Oko Kruka:** oznacza wroga (do końca rundy każdy atak w niego +1) i odsłania pułapki oraz miraże w promieniu 2 | Wróżba: +1 PD za wygraną (`xp`) |

**Dowódcy:** Kuna Rębajło (wojownik), **Żbiczka Bajdurka** (`bajka`, łowca; zwierzak autora Bajka: młoda, energiczna, głupiutka, wygląda jak żbik; **Szalony Skok:** raz na bitwę skacze o 3 pola ponad jednostkami, pułapkami i przeszkodami terenowymi i atakuje z +1 A, prymityw: przeskok ze Stad; decyzje 19.11 i 20.11, zamiast Wiewiórki Łuczniczki jako dowódcy), **Zajęczyca Zielarka** (mędrzec; decyzja 20.11, zamiast Ropuchy Zielarki).
**Czwarty bohater:** Wydra Przemytniczka (łowca, odskok).

## Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Wydra Zwiadowczyni (`otterScout`) | wydra w kapturze | 1 | chód | wręcz | Wyślizg: raz na bitwę odskok po ataku | reuse: Powietrzny Zryw | — |
| 1 | Kuna Złodziejka (`martenThief`) | kuna z sakwą | 1 | chód | wręcz | Kieszonkowiec: pierwszy cios w bohatera w bitwie daje frakcji +1 zł | ★ łup w bitwie | — |
| 1 | Wiewiórka Łuczniczka (`squirrelArcher`) | wiewiórka z krótkim łukiem | 1 | chód | dyst. | Strzał z Gałęzi: +1 A przeciw oznaczonemu celowi | ★ oznaczenie | — |
| 2A | Łasica Nożowniczka (`weaselKnife`) | łasica z dwoma nożami | 1 | chód | wręcz | Cios w Plecy: +N, gdy atakuje od tyłu | reuse: Zajście od tyłu | Kryjówka w Żywopłocie |
| 2B | Bóbr Inżynier (`beaverEngineer`) | bóbr z siekierką i planem | 1 | chód | wręcz | Tama: raz na bitwę stawia przeszkodę na sąsiednim polu | ★ stawianie przeszkody | Żeremie |
| 3A | Tchórz Smrodnik (`polecatPoisoner`) | tchórz w fartuchu z flaszami smrodu (decyzja 20.11, zamiast Ropuchy Truciciela; w Kompaniach zostaje jedna ropucha, Hakownik) | 1 | chód | dyst. | Smrodliwa Mikstura: raz na bitwę cel i sąsiedzi zatruci | trucizna (obszar) | Warzelnia |
| 3B | Jenot Szpieg (`raccoonDogSpy`) | jenot w masce i ciemnym płaszczu | 1 | chód | wręcz | Ukryty: zaczyna bitwę niewidoczny dla wroga; pierwszy atak +N | ★ ukrycie | Leśna Czatownia |
| 4A | Rosomak Zabijaka (`wolverine`) | rosomak z blizną | 1 | chód | wręcz | Furia Ran: +1 A za każde N brakujących Ż | ★ premia za rany | Rosomacza Nora |
| 4B | Borsuk Petardnik (`badgerBomber`) | borsuk z beczułką prochu | 1 | chód | wręcz | Ładunek: raz na bitwę zamienia własną pułapkę w wybuch (pole i sąsiedzi) | pułapka + obszar | Prochownia |
| 5A | Ropuch z Hakownicą (`toadGunner`) | wielka ropucha z hakownicą na podpórce | 2 | chód | dyst. | Huk Hakownicy: raz na bitwę trafiony traci następną aktywację (ogłuszony hukiem) | ★ ogłuszenie | Rusznikarnia |
| 5B | Kocur Fechmistrz (`catFencer`) | stary kocur z rapierem | 1 | chód | wręcz | Riposta: oddaje N każdemu, kto zaatakuje go wręcz i przeżyje | ★ kontratak | Fechtownia |
| 6 | Waran Wieżowy (`towerMonitor`) | olbrzymi waran z wieżyczką łuczników na grzbiecie | 2 | chód | wręcz | Ruchoma Twierdza: atakuje wręcz, a raz na rundę dodatkowo strzela wieżyczka | ★ drugi atak (dystansowy) | Wielka Stajnia Kompanii |

## Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Warsztat Sideł** (mechanika) | Targ | I: przed bitwą Kompanie kładą 1 ukrytą pułapkę na swojej połowie (wchodzący dostaje N obrażeń i kończy ruch) · II: 2 pułapki · III: pułapka unieruchamia do końca następnej aktywacji · IV: 3 pułapki |
| **Paserka** (skarby) | Targ | I: artefakty sprzedawane za pełną cenę, skrzynie dają +1 zł · II: raz na 3 rundy losowy skarb |
| **Szlaki Przemytnicze** (mapa) | Karczma | raz na rundę bohater Kompanii może przejść przez pole strażnika albo neutralnych bez walki |

**Iskra:** Skrytka Pierwotnej Iskry — **+2 ukryte pułapki na początku każdej bitwy.**
**Nazwy osad:** Lisia Jama, Zbójecki Wąwóz, Młyn Pod Krukiem, Borsucza Górka, Wydrza Przystań, Kuni Las, Przemytnicza Kładka,
Stara Karczma Pod Sową, Zielony Gościniec, Spalony Most, Sakwa i Łuk, Bractwo Trzech Dębów.

## Wygląd i dźwięk
- **Paleta:** rude i brązowe futra, butelkowa zieleń płaszczy, skóra, mosiądz sprzączek, len.
- **Herb:** lisia głowa na skrzyżowanych strzałach. **Arena:** leśny obóz przy zrujnowanym młynie, płoty, beczki.
- **Muzyka:** lutnia, flet, skrzypki, ballada zbójnicka.

## Bot
Pułapki na drogach do własnych strzelców, oznacza cel Krukiem i skupia na nim ataki, Ryś na bohatera. Na mapie: Szlaki do
omijania strażników, zbiera skrzynie. **Nie wolno mu:** znać pułapek i mirażów przeciwnika.

## Kolizje
- **Srebrny Lis (Przymierze):** duchowy, srebrny lis gaju; lisica Kompanii jest ruda, w płaszczu, z łukiem. Jeśli to za mało,
  Atamanką zostaje kuna, a lis znika z Kompanii.
- **Trzewiki Trapera (artefakt)** ignorują teren na mapie, więc Szlaki Przemytnicze omijają walki, nie teren.
- Ukryta informacja: patrz punkt 2.

## Alternatywy
- **Jednostki:** Sokolnik z Sokołem (zamiast Wiewiórki), Niedźwiadek Bartnik z rojem pszczół
  (zamiast Wozu; uwaga na niedźwiedzie w innych frakcjach).
- **Mechanika:** *Kontrakt* — przed bitwą wybierasz jedną wrogą jednostkę jako cel kontraktu; jej zabicie daje złoto i +A
  wszystkim (bez ukrytej informacji, łatwiej online).
- **Nazwa frakcji:** Zbójnickie Bractwo (bardziej swojsko).

## Rozstrzygnięcia autora (19–20.11)
- Zwierzaki autora jako **dowódcy z karczmy**: **Żbiczka Bajdurka** (łowca, Kompanie, Szalony Skok), **Bastia Cienista** (wojownik, Piaski, Czujna Drzemka), **Sefiran Plamisty** (mędrzec, Przypływy, Wylinka). Odróżnienie Sefirana od Węża Morskiego: mały, szary, w plamy.
- Kompanie: jedna ropucha (Hakownik); Tchórz Smrodnik (3A) i Zajęczyca Zielarka (dowódca). Gronostaj jest w Szronie, więc odpadł.

## Grafika (wypełnia Claude od G4)
- Lista zasobów w `docs/BACKLOG.md`, sekcja 2a, po G1.

## Balans (wypełnia Claude)
- Cel (decyzja autora 20.11): frakcje się kontrują, więc **nie** celujemy w 45–55% w każdej parze. (1) Średnia wygranych przeciw wszystkim pozostałym ok. 45–55%. (2) Kierunek każdej pary zgodny z tabelą „Kto z kim” w `FRAKCJE_PROPOZYCJE.md`: kontra ok. 60–70%, kontrowana ok. 30–40%, brak relacji ok. 45–55% (progi potwierdzone przez autora 20.11). (3) Żadna para poniżej 30% ani powyżej 70%. Narzędzie: `make sim-nowe`; wyniki i zmiany liczb po G2.

## Decyzje implementacyjne (G1, 20.11.2026)
- **Pułapki (Sidła):** `BattleState.ground` (`GroundEffect`, `hidden: true`). Kładzie się je w `deployUnits` (pole `traps`; ile: `trapSlots`: Warsztat Sideł 1/2/2/3 wg poziomu + 2 z Iskry; nieustawione układa `autoTrapCells`) na swojej połowie (`trapZone`: poza kolumnami startowymi i środkową). Wchodzący wróg dostaje 2 obrażenia (`ABILITY.trapDamage`), pułapka znika, a piechur zatrzymuje się na pierwszej pułapce swojej drogi (lot, skok i odskok trafiają tylko w pole lądowania). Poziom III: trafiony nie rusza się w następnej aktywacji (`rootLater`). Własna pułapka nie działa na własnych.
- **Ukryta informacja:** silnik zawsze liczy na pełnym stanie; ekran i serwer pokazują `redactHidden(state, widzowie)` (`src/engine/hidden.ts`): bez cudzych pułapek i bez pozycji cudzej ukrytej jednostki. W aplikacji (`App.tsx`): przy hot-seat widzi to, co wolno aktualnie grającemu; online miejsca tej przeglądarki. Dziennik nie podaje pól pułapek. Bot nie czyta `ground` wroga (test: te same decyzje z pułapkami i bez) ani ukrytych jednostek (`enemiesOf` je pomija).
- **Oznaczenie:** `status.marked {by, round}`: do końca rundy każdy atak strony znakującej +1 A, Strzał z Gałęzi dodatkowo +1. Oko Kruka: cel w zasięgu 5, odsłania pułapki wroga (`seenBy`, tylko dla Kompanii) i ukrytych w promieniu 2 od Kruka.
- **Ukryty (Jenot):** niewidoczny, nie da się go wybrać na cel; atak (+2 A) go odsłania; wejście wroga na jego pole odsłania go i nie przesuwa wchodzącego; strona, której zostali tylko ukryci, odsłania ich (żeby bitwa nie stanęła).
- **Pozostałe:** Kieszonkowiec płaci od razu 1 zł (tylko przy poziomie z osadami); Furia Ran +1 A za każde 2 brakujące Ż (maks. +3); Ładunek rani 3 pole pułapki i sąsiednie, także swoich; Riposta 2 obrażenia w atakującego wręcz, który przeżył (jeśli Kocur też żyje); Waran: wieżyczka strzela na końcu jego aktywacji w najbliższego wroga na linii strzału (2 obrażenia, raz na rundę), cel wybierany automatycznie; Tama: jedno pole obok, stoi do końca bitwy; Okop: pancerz 2 i brak odpychania przez tę i następną aktywację; Szalony Skok: skok o 3 pola (pola, na które nie dochodzi pieszo), +1 A w tej aktywacji. Żbiczka walczy wręcz (skacze i bije); w jej miejsce na slocie „łucznika” karczmy.
- **Paserka:** w grze cyfrowej nie ma sprzedaży artefaktów, więc „pełna cena” = rynkowe artefakty kupuje się o 1 zł taniej (min. 1), skrzynie +1 zł; poziom II: co 3 rundy losowy skarb.
- **Szlaki Przemytnicze:** akcja `sneakHero` (raz na rundę na frakcję) przenosi bohatera na pole strażników bez walki; przycisk w panelu mapy. Bot używa jej tylko, gdy i tak miałby iść na strażnika bez pomocnika.
- **Bot bitwy:** pułapki układa `autoTrapCells` (przed własnymi strzelcami, blisko środka, nie obok siebie); Fortel, Okop, Tama, Ładunek i Oko Kruka w `freeAbility`; skupia ataki na oznaczonym; Szalony Skok tylko do ciosu.
- **Liczby** (Ż/A/S, koszty budynków jak u innych frakcji, N) startowe, do G2. Pomiar G1 (200 gier, rywalizacja): z Przymierzem 35%, z Hordą 30-43%, ze Stadami 42%, Umarłymi 32-36%, Klanami 38%, Szronem 33%: Kompanie są na razie za słabe (zwłaszcza przeciw Klanom, które mają kontrować).

## Uproszczenia (G1)
- Brak zasłony „przekaż urządzenie” w hot-seat: ukryte rzeczy chroni tylko wybór widza po bieżącym graczu; nie ma przycisku „Podejrzyj” (własne pułapki zawsze widać).
- Online: serwer (osobne repo) musi w `visibleTo` wywołać `redactHidden`; do tego czasu Kompanie nie są oferowane online (jak inne nowe frakcje).
- Cele Wieżyczki, Tamy (domyślnie) i pola Fortelu/Ładunku mają wybór gracza w UI (kliknięcie pola, „Najlepsze pole”); cel wieżyczki jest automatyczny.
- Paserka I („pełna cena”) przetłumaczona na zniżkę (patrz wyżej); bot używa Szlaków rzadko.
- Własnej grafiki, ikon zdolności i dźwięków brak (lista w BACKLOG 2a).

## Stan G1 (20.11.2026, praca w toku)
Zrobione: paczka `src/engine/factions/free.ts` w rejestrze; 3 bohaterów, 3 dowódców, Wydra Przemytniczka, 12 jednostek ze zdolnościami; budynki Warsztat Sideł / Paserka / Szlaki Przemytnicze; Skrytka Iskry (+2 pułapki); ukryte pułapki (`GroundEffect` w `BattleState.ground`, `redactHidden` w `src/engine/hidden.ts`), oznaczenie, ukrycie, łup, Furia Ran, Riposta, Ładunek, Tama, Fortel, Okop, Oko Kruka, Szalony Skok, wieżyczka Warana; bot (pułapki układa `autoTrapCells`, nie zna pułapek ani ukrytych jednostek wroga); angielski `src/i18n/en/free.ts`; zastępcza grafika; `tests/free.test.ts` (59 testów); UI: przycisk Sidła przy ustawianiu, pola zdolności na polu, przycisk Szlaków na mapie.
Zostaje: sprawdzenie w przeglądarce (`scripts/browser/kompanie.ts` to szkic: kreator po zmianie na Potyczkę nie dochodzi do wyboru frakcji, trzeba go dopracować i obejrzeć interfejs pułapek), końcowe uwagi autora.
