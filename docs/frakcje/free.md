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
- Cel: 45–55% wygranych w każdej parze (`make sim-nowe`); wyniki i zmiany liczb po G2.
