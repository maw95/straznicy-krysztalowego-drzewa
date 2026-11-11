# Zasady wydania cyfrowego (tryb `digital`)

Zasady planszówki (`NOTATKI_DLA_AGENTA_PLANSZOWKI.md`) są zamrożone jako tryb „Klasyczny” (`ruleset: 'classic'`, `golden.test.ts`).
Wszystko poniżej działa tylko przy `ruleset: 'digital'` (w kodzie: `isDigital(rules)`). Brak pola `ruleset` = klasyczny.
Etapy rozbudowy: `ROZBUDOWA_CYFROWA.md`; kolejność prac: `MAPA_DROGOWA.md`; decyzje autora: `DECYZJE.md`.

## Bitwa

### Trupy (4.11.2026)

- Poległa jednostka zostaje na planszy w polu, w którym padła (`BattleUnit.corpse`), ale **nie zajmuje pola** (`pos` jest puste):
  inne jednostki mogą po niej chodzić, stawać na tym polu i atakować stojących na nim (jak w Heroesach).
- Trup nie jest celem ataku ani czaru.
- **Wskrzeszenie** (Eliksir Odrodzenia): jednostka wstaje na polu, na którym leżała. Gdy pole jest zajęte (albo, dla dużej
  jednostki, brakuje drugiego pola), pojawia się na najbliższym wolnym polu (przy remisie pierwsze w kolejności planszy).
  Gracz nadal może wskazać pole sam (jak dotąd). W animacji wskrzeszenie to śmierć odtworzona od tyłu.
- Pomocnik wymieniony Rogiem Strażników nie zostawia trupa (wraca do puli nietknięty).
- Limit rund (strona z mniejszą sumą Ż „pada”) nie zostawia trupów: bitwa i tak się kończy.

### Duże jednostki: 2 heksy (ustalenia 4.11.2026)

Które jednostki są duże, ustalamy **przy każdej frakcji** (przy ich animacjach); w danych to `UnitDef.size: 2`. Na początek tylko
Złoty Smok (wzorzec). W pojedynku na mapie (`duel`) wszystkie jednostki zajmują 1 pole.

- **Układ:** głowa + ogon, poziomo. Głowa (`pos`, przód) leży na jednym polu, ogon (`tail`) na jednym z czterech pól w sąsiednich
  kolumnach (kolumna ±1, półrząd ±1). Strona (lewo/prawo) wynika z położenia ogona; sprite jest odbijany.
- **Ruch:** zasięg liczy się dla głowy (jak dla jednostki 1-polowej, także lot). Głowa może stanąć tylko na polu, przy którym jest
  wolne pole na ogon. Własny ogon nie blokuje; po drodze liczy się tylko głowa (ogon „podąża”, nie zatrzymuje się na przeszkodach).
  Ruch w prawo daje ogon z lewej, ruch w lewo z prawej (jednostka się obraca), ruch w pionie zachowuje stronę. Gracz może wskazać,
  na którym z wolnych pól ma leżeć ogon (`battleMove.tail`); bez wyboru działa pierwsze legalne (ta sama strona, wyższe pole).
- **Atak:** z któregokolwiek z dwóch pól; cel jest trafiony, gdy którekolwiek z jego pól sąsiaduje z którymkolwiek polem napastnika
  (dla dużego celu: dowolne z jego dwóch pól). Linia strzału dla dystansowych liczy się od głowy do dowolnego pola celu.
- **Sąsiedztwo** (Opiekun Gaju, Róg Odwagi, zasięg Pajęczych Sideł, drugi cel Paszcz Otchłani): najmniejsza odległość między polami dwóch jednostek.
- **Odpychanie** (Miażdżący Głaz): duże jednostki są za ciężkie i nie są odpychane.
- **Rozstawienie:** pole w kolumnie startowej zajmuje **ogon**, głowa leży kolumnę dalej w stronę wroga (strona lewa patrzy w prawo, prawa w lewo);
  z dwóch możliwych pól głowy wybierane jest wolne, bliższe środka. Gracz wskazuje (w `deployUnits`) pole ogona w kolumnie startowej.
- **Odskok, teleport, wskrzeszenie, wymiana Rogiem:** głowa na wskazanym wolnym polu, ogon na pierwszym legalnym; jeśli się nie mieści,
  akcja jest odrzucana (wskrzeszenie szuka najbliższego pola, na którym jednostka się zmieści).
- **Trup dużej jednostki** leży na obu polach (`corpse` + `corpseTail`) i nie zajmuje żadnego; wskrzeszenie odtwarza oba pola, jeśli są wolne.
- **Boty** planują po polu głowy (dla pojedynczego smoka to wystarcza); ocena odległości do dużych wrogów liczona od ich głowy.

### Interfejs dużych jednostek

- Najechanie na pole ruchu pokazuje, gdzie ułożyłby się ogon (przerywana ramka); **prawy przycisk myszy** zmienia pole ogona
  (w układzie kolumnowym kolejne z do czterech możliwych, w poziomym druga strona), lewy wykonuje ruch z wybranym ogonem.
- Przy rozstawieniu klika się pole **ogona** w kolumnie startowej (głowa leży kolumnę dalej); ten sam klik wybiera jednostkę.
- Kliknięcie któregokolwiek z dwóch pól jednostki wybiera ją albo ją atakuje (przez pole planszy, bo żeton jest mały).

## Arena cyfrowa: poziome heksy 13 × 9 (5.11.2026)

W trybie `digital` bitwa toczy się na **innej planszy** niż klasyczna (`BattleState.layout: 'wide'`); klasyczna zostaje bez zmian.
- Heksy ułożone jak w Heroes III: **poziome rzędy** (heks „na czubku”), 13 kolumn × 9 rzędów = 117 pól, co drugi rząd przesunięty
  o pół pola w prawo. Środkowy rząd to 4.
- Kolumny startowe: skrajna lewa (atakujący) i skrajna prawa (broniący), po 9 pól; jednostki stają od środkowego rzędu w obie strony.
- Przeszkody: osobne zestawy dla obu aren (Przymierza i Hordy), ok. 10 pól każdy; kolumny 0, 1, 11, 12 zawsze wolne (w kolumnie 1/11
  leży głowa dużej jednostki rozstawionej w kolumnie startowej), a wszystkie wolne pola są osiągalne (test).
- **Duża jednostka leży w jednym rzędzie:** ogon na polu po lewej albo po prawej od głowy. Wybór ogona to wybór strony: pierwsza
  opcja to ta sama strona co dotąd (ruch w prawo ustawia ogon po lewej), druga to obrót jednostki. W rozstawieniu ogon leży na polu
  kolumny startowej, głowa w tym samym rzędzie, kolumnę dalej.
- Pojedynek na mapie (`duel`): dwie jednostki na sąsiednich polach środkowego rzędu.
- Dwupolowa przeszkoda to dwa sąsiednie pola: w jednym rzędzie albo pod skosem w dwóch rzędach (na każdej arenie jedna); wszystkie jej pola blokują ruch i strzał.
- **Oprawa:** tła bez siatki w poważnym, stonowanym stylu (`public/assets/arena/cyfrowa/dawn|horde.webp`), siatkę rysuje kod
  (`src/ui/arenaGeometry.ts`, `geometryOf`); przeszkody to osobne obrazy z przezroczystością (łąka: kłoda, ściana ruin i grań po 2 pola, a głazy, ruina, sosna, ciernie, posąg po 1 polu; pole Hordy: kości, barykada i wóz
  oblężniczy po 2 pola, a skały, martwe drzewo, kryształy, totem po 1 polu; żaden obraz nie powtarza się na jednej arenie, układ jest w `WIDE_OBSTACLES`), wpasowane w dolną część heksa, z delikatnym złotym obrysem pola. Pod planszą tło ma czystą teksturę (drzewa i ruiny ramy nie wchodzą pod heksy, `scripts/assets/arena_cyfrowa.py`); aktywną jednostkę
  pokazują niebieskie pola, bez żółtego kółka (kółko zostaje tylko przy rozstawianiu). Wybór ogona w interfejsie: najechanie pokazuje ogon, prawy przycisk
  myszy obraca jednostkę (druga strona).

### Koniec bitwy (digital)

Ostatni cios kończy bitwę natychmiast, więc interfejs przytrzymuje ostatni stan walki (z poległymi jako trupami, `src/ui/useEndHold.ts`,
`END_HOLD_MS` = 2,8 s), żeby było widać animację śmierci, i dopiero potem pokazuje okno wyniku. Tło areny wypełnia całe okno
(rozmyta, przyciemniona kopia za planszą), więc na szerokich ekranach nie ma czarnych pasów.

### Ruch kończy turę (digital, 5.11.2026)

Jednostka, która ruszyła się bez ataku, kończy aktywację automatycznie (nie ma osobnego „potem wybierz cel albo zakończ”).
- **Strzelec** po ruchu nie strzela: ruch zastępuje strzał (strzela, stojąc w miejscu).
- **Jednostka wręcz** zachowuje aktywację po ruchu tylko wtedy, gdy ruch doprowadził ją do wroga w zasięgu ataku (klik w wroga to ruch i
  atak w jednym geście, jak dotąd); gdy nikogo nie dosięga, tura kończy się sama.
- **Wyrównanie:** strzelcy mają `DIGITAL_RANGED_BONUS` (+1 do ataku, `data.ts`). Wartość tymczasowa do strojenia symulacjami.
- Roboty (`ai/battleAi.ts`) stosują tę samą regułę: strzelec ocenia strzał tylko z miejsca, w którym stoi.

### Zasłanianie strzału jednostkami (6.11.2026)

Jednostki **nie** zasłaniają strzału, tylko przeszkody. Sprawdzone symulacją z `rules.unitsBlockSight` (jednostki między strzelcem a celem blokują strzał, poza polami strzelca
i celu): arena cyfrowa, 20 gier na parę składów, Przymierze 48,8% bez zasłaniania i 50,1% z nim (szum ±2,4 pkt), więc balans się nie zmienia, a reguła byłaby trudniejsza na planszy.
Przełącznik zostaje w kodzie jako eksperyment (`SIM_OVERRIDE='{"rules":{"unitsBlockSight":true}}'`), domyślnie wyłączony.

### Strojenie wersji cyfrowej (5.11.2026)

Symulacje z `SIM_DIGITAL=1` (`scripts/sim/arena.ts`, `matrix.ts`; np. `SIM_DIGITAL=1 node --import tsx scripts/sim/arena.ts 40 normal etykieta`).
- **Ogon dużej jednostki:** komputer układa go po stronie odwróconej od wrogów (`tailFor` w `ai/battleAi.ts`). Na wyniki nie ma wpływu
  (arena: 52,4% → 51,1% wygranych Przymierza przy 3240 partiach, w granicach szumu); zostaje, bo zachowuje się rozsądniej.
- **`DIGITAL_RANGED_BONUS`:** 0 → Przymierze wygrywa 55,0% w arenie, 1 → ok. 52%, 2 → 50,7%. Zostaje 1: różnice mieszczą się w szumie (±1,7 pkt),
  a w przygodzie wersja cyfrowa jest bliska klasycznej (150 partii na wariant: kooperacja 52–81% Przymierza, rywalizacja 44–53%; klasyczna: 61–80% i 44–60%).
- **Do rozważenia:** Król Jednorożców przegrywa w arenie cyfrowej (35–39% wygranych Przymierza przy 50%), a Złoty Smok i Niedźwiedź wygrywają
  ok. 60%. Liczby bohatera są wspólne z klasycznymi zasadami, więc ich zmiana ruszyłaby też planszówkę (i `golden.test.ts`); wymaga decyzji autora
  albo osobnych liczb dla wersji cyfrowej.

## Własne liczby bohaterów w wersji cyfrowej (5.11.2026)

Powód: w arenie cyfrowej Król Jednorożców wygrywał tylko 34% (duży cel na dwóch polach i najmniej życia; szarża działa i daje te same ok. 14 punktów co w planszówce).
Decyzja autora: każdy bohater Przymierza ma jedną cechę, a wersja cyfrowa może mieć inne liczby niż planszowa (`DIGITAL_STATS` w `data.ts`, `battleStats`).

| Bohater | planszowa Ż/A/S | cyfrowa Ż/A/S | cecha |
|---|---|---|---|
| Złoty Smok | 9/5/4 | 7/7/4 | atak |
| Prastary Niedźwiedź | 11/4/4 | 12/4/3 | życie |
| Król Jednorożców | 8/5/8 | 8/5/10 | prędkość |
| Czarny Smok | 7/5/5 | 7/6/5 | wyrównanie Hordy |

Arena, `make sim-arena` z `SIM_DIGITAL=1` (150 gier na parę składów): Przymierze 50,0%; Złoty Smok 50,0%, Jednorożec 52,0%, Niedźwiedź 48,1%, Czarny Smok 48,0%,
Wilkołak 51,4%, Ogr 50,4%. Przygoda (100 gier na wariant): kooperacja Normalny 55–61% na 1 graczu, bez wyraźnej zmiany. Próby: `SIM_OVERRIDE='{"digitalStats":{...}}'`.

## Cel „Punkty kontrolne” (5.11.2026, wersja cyfrowa)

Drugi cel obok klasycznego (kryształy do Drzewa i rytuał Hordy). Interfejs celu: `src/engine/objectives.ts` (`init`, `checkVictory`,
`onRoundEnd`, `onRoundLimit`, `progress`); wybór przez `rules.objective` (`'crystals'` domyślnie, `'control'` tylko w wersji cyfrowej).

- Na mapie leżą **trzy punkty kontrolne**: środkowy (na osi trójkąta, wart **2**) i dwa boczne, odbite lustrzanie (po **1**). Układ liczony z ziarna
  gry osobnym generatorem (mapa się nie zmienia); punkt nie leży na Drzewie, w bazie ani koło niej, ani na polu kryształu. Pole niedostępne
  (góra, jezioro) jest w razie potrzeby oczyszczone na łąkę lub spaloną ziemię. Punkty są odkryte od początku.
- Strona **trzyma** punkt, gdy jej bohater stoi na nim na koniec rundy (na polu jest jeden bohater, więc trzeba pokonać tego, kto stoi).
- Na koniec rundy: kto trzyma więcej punktów (według wartości) ma przewagę. Przewaga przez **K rund z rzędu** wygrywa:
  K = 3 (krótka i średnia mapa), 4 (długa), 5 (bardzo długa); Przymierze potrzebuje o 1 rundę więcej, bo w rundzie rusza pierwsze (`CONTROL` w `data.ts`).
  Remis lub zmiana lidera zeruje serię.
- Limit rund: wygrywa strona, która łącznie dłużej miała przewagę; remis wygrywa Horda (jak limit w grze o kryształy). Polegli wszyscy bohaterowie
  Przymierza = wygrywa Horda (jak zawsze). Kryształy i strażnicy zostają na mapie, ale niczego nie dają; rytuał nie działa.
- Boty (`controlAction` w `adventureAi.ts`, oba obozy i automat): atakują pokonywalnego wroga obok, trzymają punkt, na którym stoją (bocznego puszczają,
  gdy środkowy jest wolny i nikt swój nie jest bliżej), reszta idzie do najbliższego punktu, środkowy liczy się o 3 bliżej; strona, która jest „pod”
  (wróg ma przewagę), atakuje już przy sile 0,7 zamiast 1,1.

Symulacje (`SIM_DIGITAL=1 SIM_OBJECTIVE=control`, 200 partii botów na wariant), wygrane Przymierza, poziom Normalny:
kooperacja 1 gracz 51–60%, 2 graczy 64–81%; rywalizacja 1 na 1 44–59%, 2 na 2 55–74%. Trudny (koop) 21–65%. Łatwy (pojedynki na planszy)
68–92%: tak ma być, to poziom dla dzieci. Przymierze jest mocniejsze w kooperacji na dużych mapach i w 2 na 2 (do ewentualnego strojenia).
Dawne próby: bez wagi środka i bez „wyprzedzenia” botów 1 na 1 kończyło się w 85–93% limitem rund (patowe stanie na bocznych punktach).

## Kształty mapy przygody (6.11.2026, wersja cyfrowa)

Oprócz trójkąta z planszówki (`mapShape` w ustawieniach gry, wybór w ekranie startu: „Kształt mapy”):
- **Prostokąt** (`MAP_SHAPES.rectangle`): 7×4, 9×5, 13×6 i 15×8 pól; bazy pośrodku krótszych boków, Drzewo w środku; połowa bliższa bazie jest ziemią tej frakcji.
- **Pierścień** (`MAP_SHAPES.ring`): obręcz grubości 3 pól wokół jeziora (promień 3 / 4 / 5 / 7), Drzewo i obie bazy na trzech rogach (po 2R od siebie), do każdego dwie drogi. Grubość 2 pola nie wystarczała: jeden bohater zamykał korytarz i Przymierze wygrywało tylko 15%.
- Limit rund mnożony o `SHAPE_ROUND_FACTOR` (prostokąt ×1,25, pierścień ×1,5), bo drogi są dłuższe.
- Stan gry zapisuje `tree` i `homes` tylko dla innych kształtów niż trójkąt (reszta czyta `treeOf` / `homeOf` z domyślnymi rogami trójkąta), więc gry w trójkącie i `golden.test.ts` są bez zmian.
- Planszówka (Klasyczny) zawsze gra na trójkącie; `mapShape` jest ignorowane.
- Punkty kontrolne: środkowy leży na polu równo oddalonym od obu baz (najbliżej Drzewa), boczne to para lustrzana (zamieniona odległość do baz).

Strojenie (`DIGITAL_TUNING`, wpisy z `shape`, 100 gier na wariant, poziom Normalny, cel „Kryształy”): bez strojenia Przymierze wygrywało 38–40% na prostokącie i 16–28% na pierścieniu (Drzewo otwarte z wielu stron).
Prostokąt: Przymierze zaczyna z 3 losowymi skarbami → 49% (kooperacja) i 51% (rywalizacja). Pierścień: 4 skarby i 4 punkty ruchu → 44% i 52%.
Cele „Punkty kontrolne” i „Przetrwanie” nie potrzebowały strojenia (kontrola: prostokąt 58%/56%, pierścień 56%/51%, trójkąt 56%/57%; przetrwanie: 61% i 67% wobec 68% w trójkącie).
Poziomy Łatwy i Trudny dostają te same skarby (nie były strojone osobno).

## Wyspy i mapy ręczne (6.11.2026, wersja cyfrowa)

- **Wyspy** (`mapShape: 'islands'`): trzy lądy obok siebie (Przymierza, Drzewo pośrodku, Horda), między nimi dwie cieśniny wody (pola nieprzejezdne), a w każdej
  `MAP_SHAPES.islands[...].bridges` mostów w tych samych rzędach po obu stronach, więc obie bazy mają tyle samo dróg do Drzewa. Rzędy mostów losuje generator z ziarna.
  Most nie dostaje strażnika ani skarbu (zablokowałby drogę). Latania nie ma: bohaterowie na mapie nie latają (skróty przez wodę odłożone).
- **Mapy ręczne** (`mapShape: 'custom'`, `customMapId`): plik z planem w tekście (`src/engine/customMaps.ts`: `.` ląd, `#` woda lub skała, `=` most, `T` Drzewo, `D` baza Przymierza, `H` baza Hordy;
  nieparzyste rzędy przesunięte o pół pola jak w prostokącie). Mapa może przyjść z JSON-a (`parseCustomMap`, `registerCustomMap`, z walidacją), więc kampania doda własne.
  Dołączone: „Cieśnina” (trzy mosty przez każdą cieśninę) i „Dolina” (otwarta, z dwoma grzbietami skał). Rozmiar mapy z ekranu startu wybiera tylko limit rund i liczbę skarbów.
- Strojenie (`DIGITAL_TUNING`, cel „Kryształy”, 80 gier na wariant, poziom Normalny): bez niego Przymierze wygrywało 12–35% (wąskie drogi, jeden bohater Hordy zamyka most); z 4 punktami ruchu i 4 skarbami na start:
  wyspy 52% (kooperacja) / 59% (rywalizacja), Cieśnina 42% / 62%, Dolina 33% / 54% (w kooperacji do dalszego strojenia, bo automat Hordy jest agresywny). Limit rund ×1,7 (wyspy) i ×2 (ręczne).

## Rozwój bohatera (6.11.2026, wersja cyfrowa, przełącznik `heroGrowth`)

Domyślnie wyłączony (gry bez niego są takie jak dotąd); w ekranie startu „Rozwój bohatera: Włączony”, a presety poziomów (6.4) będą go włączać.
- **Punkty doświadczenia (PD)** dla bohatera, który przeżył bitwę: 3 za wygraną ze strażnikiem, 2 za wygraną z bohaterem wroga, 1 za przegraną; 1 za znaleziony skarb; Horda dodatkowo 1 PD za każdą rundę (rzadko spotyka strażników).
- **Poziomy 1–10** (11.8): progi 3 / 7 / 12 / 18 / 26 / 38 / 56 / 84 / 128 PD łącznie (`GROWTH.thresholds`, robocze). W symulacjach 60 gier (Normalny, DE) poziom 6+ osiąga ok. 1–2 bohaterów na 100; dojdą Uczony i mapy XL/XXL, które to przyspieszą. Przy awansie bohater dostaje **trzy umiejętności do wyboru** (losowane z ziarna gry spośród jeszcze niewziętych) i do wyboru nie rusza się ani nie kończy tury (`chooseSkill`, nowa akcja).
- **Umiejętności** (te same efekty, inne nazwy dla Świtu i Hordy, `SKILL_NAMES`): Moc +1 A bohatera w bitwie; Hart +2 Ż; Lekkość +1 S; Opiekun/Okrzyk: pomocnicy bohatera +1 Ż w bitwie; Tropiciel +1 punkt ruchu na mapie; Dar: od razu losowy skarb dla frakcji.
- **Strzelec, Taktyk, Zwiadowca (10.11):** *Strzelec* +1/+2/+3 A strzelcom bohatera (`SKILL_RANKS.marksman`, też samemu bohaterowi, jeśli strzela); *Taktyk* dodaje 1/2/3 kolumny rozstawienia przed bitwą (`BattleState.deployDepth`, `deployCells`; duża jednostka zostawia pole na głowę); *Zwiadowca* odkrywa pola w promieniu 2/3/4 na starcie tury, przy wyborze umiejętności i przy każdym kroku (`revealAround(state, k, radius)`). Boty biorą je na końcu swojej kolejności (po Tropicielu). Do czasu własnych grafik medale pożyczają ikony Mocy, Opieki i Tropiciela.
- **Łowca skarbów i Uczony (10.11):** po wygranej walce ze strażnikiem (skarb strażnika, nie gdy skarbów brak) *Łowca skarbów* pokazuje bohaterowi 2 / 3 / 3 skarby i pozwala zatrzymać 1 / 1 / 2 z nich (`HeroState.treasurePick`, akcja `chooseTreasure`); do wyboru bohater nie rusza się ani nie kończy tury, a po awansie najpierw wybiera umiejętność. Pozostałe skarby z puli nie powstają. Boty biorą najwyżej ocenione (`DRAFT_VALUE`). *Uczony* dodaje +1 / +2 / +3 PD za każdą wygraną walkę (ze strażnikiem i z bohaterem). Boty biorą je na końcu kolejności. Hak testowy: `?skills=treasureHunter,…&until=treasure`.
- **Kamienie milowe 3 / 6 / 9 (10.11):** poziomy 3, 6 i 9 wzmacniają własną zdolność bohatera (tylko Wyprawa z rozwojem; `ABILITY_TIERS`, `MILESTONE_TIER` w `data.ts`, `BattleUnit.tier`, `abilityNum` w `battle.ts`). Złoty Smok: Blask sojusznicy/Smok +1/+3 → +2/+3 → +2/+4 → +2/+5; Król Jednorożców: Szarża +2 → 3 → 4 → 5; Niedźwiedź: ignoruje 3 → 5 → 5 → 7, od 6. poziomu chroni dowolnego sojusznika; Czarny Smok (propozycja Claude'a, zaakceptowana): Oddech +0 → 1 → 2 → 2 A, na 9. poziomie dwa razy w bitwie; Wilkołak: Zew Krwi +1 → 2 → 3 → 4; Ogr: Twardogłowy 2 → 3 → 4 → 5; Kaczka: po zabiciu leczy 1 → 2 → 3 Ż, na 9. poziomie dodatkowa aktywacja daje +1 S. Wartości liczy się razy skala ×3. Awans na kamień milowy zapisuje wiersz w dzienniku. Karta bohatera w grze z rozwojem dopisuje do opisu zdolności linię „Poziom N: …” (`abilityTextAt`, `HeroLevelsContext`); hak testowy `?level=9`.
- **Strojenie rozwoju (10.11, `SIM_GROWTH=1 SIM_DIGITAL=1`, Normalny, cel Kryształy, 300-500 gier na wariant, szum ok. ±3 pkt): bez zmian liczb.** Przymierze wygrywa z rozwojem wobec gry bez: średnia mapa kooperacja 49,4% / 51,6%, rywalizacja 61,6% / 52,2%; bardzo długa kooperacja 61,4% / 54,6%, rywalizacja 52,0% / 47,4%; długa kooperacja 53% / 57%, rywalizacja 46% / 47% (średnio ok. +2 pkt, ale zależnie od mapy do ±9). Ta różnica istniała przed Strzelcem, Taktykiem, Zwiadowcą, Łowcą, Uczonym i kamieniami milowymi (wersja sprzed nich: 59,8% wobec 51,0%, identyczny wynik po ich wyłączeniu): boty prawie ich nie biorą ani nie dochodzą do poziomów 6+. Win rate bohaterów z rozwojem wobec bez (długa i bardzo długa mapa, ~500-1000 gier każdy): Złoty Smok 54/53%, Niedźwiedź 50/49%, Jednorożec 55/56%, Czarny Smok 49/54%, Wilkołak 50/53%, Ogr 50/51%: żaden kamień milowy się nie wyróżnia (nawet dwa Oddechy Smoka). Sprawdzone i odrzucone: `hordeRoundXp` 2-4 PD za rundę (pomaga na średniej mapie w rywalizacji, ale na długiej obniża Przymierze do 49% w kooperacji i 40% w rywalizacji, bo premia rośnie z długością gry). Poziom 6+ osiąga 1-2 bohaterów na 100 gier; poziom 10 się nie zdarzył. Do ponownego sprawdzenia przy presetach poziomów (6.4) i mapach XL/XXL, kiedy rozwój trafi do gier z tabel `tuneLevels`; wartości Strzelca, Taktyka, Zwiadowcy, Łowcy i Uczonego sprawdzą się dopiero w grze z ludźmi (boty ich nie wybierają).
  **Stopnie I–III (10.11):** wybranie umiejętności, którą bohater już ma, podnosi jej stopień (`SKILL_RANKS`): Moc +1/+2/+3 A, Hart +2/+4/+6 Ż, Lekkość +1/+2/+2 S, Opiekun +1/+2/+3 Ż pomocników, Tropiciel +1/+2/+2 punktu ruchu, Dar: kolejny skarb przy każdym wyborze. Jeśli bohater ma umiejętność poniżej stopnia III, wśród ofert jest zawsze co najmniej jedno rozwinięcie; stopnia III nie oferuje się już wcale. Liczby robocze, do strojenia symulacjami.
  Na razie wspólna pula 6 umiejętności dla obu frakcji (drzewka z rozgałęzieniami później, `BACKLOG` 6.3).
- Boty wybierają w kolejności: Moc, Hart, Opiekun, Lekkość, Tropiciel, Dar (`BOT_SKILL_ORDER`).
- Wpływ na balans (`SIM_GROWTH=1 SIM_DIGITAL=1`, 100 gier na wariant, Normalny, cel Kryształy): Przymierze 62% w kooperacji i 51% w rywalizacji wobec 59% i 50% bez rozwoju; średni poziom na koniec gry: Przymierze 2,7, Horda 1,8 (bez PD za rundy Horda miała 1,1 i Przymierze wygrywało o 5–7 pkt więcej).
- Serwer: nowa akcja `chooseSkill` wymaga wdrożenia backendu z nowym pakietem silnika.

## Tryb rodzinny (6.11.2026, wersja cyfrowa, kooperacja)

Parę rodzic + dziecko w jednej drużynie: w ekranie startu (kooperacja, wersja cyfrowa) przy miejscu gracza-człowieka jest pole „Dziecko” (`SeatSetup.child`).
- **Pomoc dla dziecka** (`FAMILY` w `data.ts`): jego bohater ma w bitwie o 2 Ż więcej i o 1 punkt ruchu więcej na mapie. Rodzic gra bez zmian; to ta sama drużyna, więc nic nie wpływa na balans rywalizacji.
- **Podpowiedź**: przycisk w dolnym pasku (tylko gdy któryś gracz jest dzieckiem) pyta bota „co byś zrobił” (`chooseAction`) i pokazuje to zdaniem u góry ekranu (`ui/hint.ts`), a na mapie podświetla pole docelowe. Znika po następnym ruchu.
- Hotseat: w rywalizacji ekran przekazania urządzenia (`Handoff`) ukrywa skarby frakcji między graczami; w kooperacji ludzie dzielą ekran bez ukrywania (skarby są wspólne).
- Poziom i cele dla rodziny: poziom 1 „Przygoda” (domyślny) bez rozwoju bohatera; „Poziom 2: Wyprawa” dodaje rozwój i inne cele.
- Serwer: pole `child` w miejscu gracza wymaga wdrożenia backendu z nowym pakietem silnika (stary serwer zignoruje je albo odrzuci ustawienia).

## Artefakty bohatera i obiekty na mapie (6.11.2026, część rozwoju bohatera)

Działają razem z `heroGrowth` (`src/engine/sites.ts`).
- **Artefakty** (przebudowane 10.11.2026): pięć miejsc — hełm, broń, zbroja, tarcza, buty (`SLOTS`) — i trzy rzadkości: zwykły, rzadki, legendarny (`rarity` 1–3). Jedna nazwa i jeden obrazek dla obu frakcji, efekt taki sam dla każdego nosiciela. Rzadszy zastępuje pospolitszy; równy lub gorszy trafia do plecaka. Liczby w małej skali (×3 liczy `statScale`), poza Obroną.

  | Miejsce | Zwykły | Rzadki | Legendarny |
  |---|---|---|---|
  | Hełm | Hełm Dowódcy: pomocnicy +1 Ż | Korona Zwiadowcy: +1 Ż, odkrywa pola w promieniu 2 | Hełm Olbrzyma: +6 Ż, −1 S |
  | Broń | Stalowy Miecz: +1 A | Ostrze Łowcy: +1 A, na rannych jeszcze +1 A | Ostrze Zorzy: +2 A, na rannych jeszcze +1 A |
  | Zbroja | Kolczuga: +2 Ż | Kolczuga Cierni: +2 Ż, atakujący w zwarciu traci 1 Ż | Zbroja Strażnika: +4 Ż, atakujący w zwarciu traci 1 Ż |
  | Tarcza | Puklerz: Obrona 1 | Tarcza Czujności: Obrona 2 | Egida Drzewa: Obrona 3, pierwszy cios w bitwie dzielony na pół |
  | Buty | Buty Wędrowca: +1 S | Trzewiki Trapera: każde pole mapy kosztuje 1 ruch | Skrzydlate Sandały: +1 S, +1 punkt ruchu na mapie |

  **Obrona** to punkty dużej skali (Wyprawa, ×3): każdy cios zadany bohaterowi jest o tyle słabszy, ale cios, który trafia, zabiera **co najmniej 1** (`predictDamage`, po Twardogłowym i Kamieniu Ochrony; `defenseOf` przelicza na inne skale). To jedyny efekt, który celowo nie skaluje się liniowo, więc test „×3 = ×1” (`statscale.test.ts`) gra bez tarcz. Ciernie nie działają na strzelców; atakujący może od nich zginąć (kończy wtedy aktywację).
- **Skąd**: skrzynia (szanse zwykły / rzadki / legendarny 60 / 30 / 10), pokonany strażnik (70 / 25 / 5; `ARTIFACT_ODDS`, losowane z ziarna gry) i wygrana walka bohaterów: zwycięzca **przejmuje artefakty pokonanego**, które poprawiają jego wyposażenie (`captureGear`; reszta zostaje u pokonanego), a gdy nie ma czego przejąć, znajduje zwykły artefakt jak dawniej (wyrównanie dla Hordy, która rzadko spotyka strażników).
- **Plecak** (10.11.2026): bohater nosi do 4 artefaktów poza założonymi (`PACK_SIZE`, `HeroState.pack`). Znaleziony artefakt, który nie jest rzadszy od założonego, trafia do plecaka; zastąpiony przez rzadszy też. Dopiero przy pełnym plecaku zamiast artefaktu frakcja dostaje losowy skarb (zastąpiony artefakt przy pełnym plecaku przepada). W swojej turze bohater może w karcie bohatera założyć artefakt z plecaka (dotychczasowy wraca do plecaka) albo zdjąć założony (akcje `equipArtifact`, `unequipArtifact`); nie kosztuje to ruchu. Zmiana butów w trakcie tury nie zmienia punktów ruchu tej tury.
- **Przekazywanie** (akcja `passArtifact`): bohater w swojej turze oddaje artefakt (założony albo z plecaka) żywemu sojusznikowi na tym samym albo sąsiednim polu. Sojusznik zakłada go od razu, jeśli ma to miejsce puste, inaczej chowa do plecaka; bez miejsca przekazanie jest niemożliwe. Roboty plecaka nie przekładają i artefaktów nie przekazują (zakładają rzadsze automatycznie).
- **Zdobycz po walce bohaterów** obejmuje teraz także plecak pokonanego: zwycięzca zakłada to, co poprawia jego wyposażenie, resztę chowa do plecaka, póki ma miejsce.
- **Karta bohatera** (`HeroSheet` w `growthUi.tsx`, przycisk „Karta bohatera” w panelu): portret, Życie / Atak / Szybkość / Obrona z premiami, wyposażenie w układzie postaci (hełm u góry, broń–zbroja–tarcza, buty na dole), plecak, opisy artefaktów i umiejętności. Kliknięcie artefaktu pokazuje przyciski „Załóż”, „Zdejmij do plecaka” i „Przekaż: …”.
- **Skarby a artefakty** (10.11.2026): to, co się nosi, jest artefaktem; to, co się zużywa, jest eliksirem, zwojem, runą albo rogiem. Cztery karty skarbów mają więc w wersji cyfrowej inne nazwy (`DIGITAL_ITEM_NAMES`, `itemDef`), efekty bez zmian, planszówka bez zmian: Miecz Bohatera → **Eliksir Mocy**, Buty Wiatru → **Eliksir Chyżości**, Tarcza Strażnika → **Zwój Tarczy**, Kamień Ochrony → **Runa Ochrony**. Trzy pierwsze mają nowe obrazki (`public/assets/cards/treasures/cyfrowe`), Runa zostaje przy obrazku kamienia z runą.
- **Balans po zmianie** (`SIM_GROWTH=1 make sim-cele GAMES=60`, Normalny, kooperacja / rywalizacja): wszystkie cele i mapy w paśmie 45–65% (49–59%), poza znaną wcześniej Doliną z Kryształami w kooperacji (37%). Stroiciel nie był potrzebny. Po dodaniu plecaka (mniej skarbów „w zamian”) wyniki te same w granicach 1 pkt.
- **Obiekty na mapie** (2 / 3 / 5 / 7 na mapie krótkiej / średniej / długiej / bardzo długiej, rozmieszczane z ziarna na wolnych polach): **kapliczka** (+2 PD), **obóz najemników** (wraca jeden poległy pomocnik frakcji albo +1 PD), **skrzynia** (artefakt). Każdy obiekt użyje pierwszy bohater, który na nim stanie (każda strona). Boty zbierają je jak skarby.
  W interfejsie to medale na polu (fiolet, czerwień, błękit) z opisem w dymku; docelowa grafika to osobna sprawa (`BACKLOG`, sekcja 7).
- **Balans** (`SIM_GROWTH=1`, 100 gier na wariant, Normalny, cel Kryształy): sam rozwój 62% / 51% (kooperacja / rywalizacja); z artefaktami i obiektami Przymierze rosło do 69–73% / 63–69%, bo to ono spotyka strażników. Wyrównane startem Hordy z 2 losowymi skarbami przy włączonym rozwoju
  (`DIGITAL_TUNING`, wpis `growth`): 61% / 51%. Obiekty bez artefaktów ze strażników i walk dają ok. +4 pkt Przymierzu.

## Tabela balansu: cele × kształty (6.11.2026)

`make sim-cele GAMES=40` (około 1,5 minuty): wygrane Przymierza, poziom Normalny, kooperacja / rywalizacja, cztery rozmiary map razem (40 gier na wariant). Cel pasma: 45–65%.

| cel | trójkąt | prostokąt | pierścień | wyspy | Cieśnina | Dolina |
|---|---|---|---|---|---|---|
| Kryształy | 58 / 55 | 48 / 52 | 41 / 46 | 50 / 57 | 44 / 63 | **29** / 57 |
| Punkty kontrolne | 58 / 58 | 60 / 57 | 55 / 51 | 57 / 57 | 64 / 58 | 63 / 57 |
| Przetrwanie | 69 / – | 61 / – | 68 / – | 62 / – | 62 / – | 69 / – |
| Boss | 61 / 57 | 56 / 52 | 57 / 59 | 48 / 50 | 49 / 47 | **41** / 42 |
| Artefakt | 59 / 54 | 52 / 49 | 57 / 44 | 49 / 39 | 59 / 47 | 53 / 41 |

Z włączonym rozwojem bohatera (`SIM_GROWTH=1 make sim-cele GAMES=40`) tabela jest w granicach szumu taka sama (np. trójkąt: Kryształy 59 / 54, Punkty kontrolne 64 / 54, Boss 67 / 59, Artefakt 60 / 52; Dolina Kryształy w kooperacji nadal 29%), więc rozwój nie psuje pasm.

Poza pasmem: Kryształy na Dolinie w kooperacji (ok. 35% po dodaniu skarbów; automat Hordy zamyka otwartą dolinę), Boss na Dolinie (41–42%), rywalizacja Artefaktu na wyspach (39%) i Przetrwanie (do 69%, górna granica).
Liczby 40 gier na komórkę mają szum ±8 pkt, więc to wskazówka, nie wyrok; do dalszego strojenia przed premierą (np. 200 gier w problematycznych komórkach).

## Cel „Boss” (6.11.2026, wersja cyfrowa)

W środku mapy (pole środkowego punktu kontrolnego, w każdym kształcie) leży legowisko Bossa: Hydry albo Cyklopa (losowo z ziarna) ze zwiększonym życiem
(`BOSS.hp`: 54 / 54 / 62 / 92 Ż na mapie krótkiej / średniej / długiej / bardzo długiej, ×1,25 przy dwóch bohaterach Przymierza). Boss to zwykły strażnik, ale:
- wyzywają go **obie strony** (Horda zwykle omija strażników); walka jak ze strażnikiem, bohater plus pomocnicy;
- **rany zostają** między walkami (`state.boss.hp`): przegrany bohater i tak coś zdziera, a kto zada ostatni cios, **wygrywa grę**;
- nie ma kryształu ani skarbu strażnika za Bossa; pozostali strażnicy na mapie działają jak zawsze (dają skarby, więc opłaca się najpierw je zdobyć);
- limit rund wygrywa Horda (jak w innych celach), a gdy polegną wszyscy bohaterowie Przymierza, wygrywa Horda.
Roboty: Horda od razu idzie do legowiska; Przymierze dopiero, gdy jest gotowe (zostaje przynajmniej jeden pomocnik, albo Boss ma ≤ 12 Ż, albo minęła połowa rund), wcześniej gra jak w „Kryształach”.
Symulacja (`SIM_OBJECTIVE=boss SIM_DIGITAL=1`, 100 gier, Normalny): Przymierze 34–68% (kooperacja 57%, rywalizacja 53% łącznie); mapa krótka jest najtrudniejsza (34–56%), bo Przymierze dochodzi do Bossa w 2 rundach. Wariant kooperacyjny „wszyscy przeciw Bossowi bez Hordy” jest do rozważenia (Do akceptacji autora).

## Cel „Artefakt” (6.11.2026, wersja cyfrowa)

Na polu środkowego punktu kontrolnego leży Artefakt (w silniku: kryształ o id `artifact`, `state.artifact`). Podnosi go każdy bohater, który wejdzie na pole (także Horda, która zwykle kryształów nie bierze).
Kto zaniesie go do **własnej bazy**, wygrywa grę; Drzewo go nie przyjmuje. Niosący ma `ARTIFACT.carrierSlow` = 1 punkt ruchu mniej (od początku tury i w chwili podniesienia). Polegli niosący upuszcza go na polu śmierci,
a następny bohater (obojętnie której strony) go podnosi. Limit rund wygrywa Horda; gdy polegną wszyscy bohaterowie Przymierza, też.
Roboty: niosący idzie do swojej bazy (omija wrogów, których nie pokona), pozostali uderzają sąsiada, którego pokonają, i idą po leżący Artefakt albo polują na niosącego wroga.
Symulacja (`SIM_OBJECTIVE=artifact SIM_DIGITAL=1`, 100 gier, Normalny): trójkąt 56% kooperacja / 50% rywalizacja, prostokąt 56% / 48%, pierścień 55% / 43%.
Bez strojenia Przymierze wygrywało 68% (na bardzo długiej mapie 80–90%): rusza pierwsze i pierwsze dochodzi do środka. Spowolnienie niosącego o 2 pkt ruchu było za mocne (poniżej 30%);
na długich mapach Horda startuje z losowymi skarbami (długa 2, bardzo długa 4; `DIGITAL_TUNING`). Wariant „eskorta” (Przymierze niesie Artefakt z własnej bazy do Drzewa) jest w „Do akceptacji autora”.

## Cel „Przetrwanie” (6.11.2026, wersja cyfrowa, tylko kooperacja)

Przymierze wygrywa, gdy minie ustalona liczba rund, a choć jeden ich bohater żyje: 6 / 9 / 14 / 18 rund (mapa krótka / średnia / długa / bardzo długa; `SURVIVAL.rounds`).
Horda wygrywa, gdy polegną wszyscy bohaterowie Przymierza (zwykła zasada). Co dwie rundy (na koniec rundy) w bazie Hordy pojawia się kolejny bohater, dopóki automat ma
mniej bohaterów niż żyje ich po stronie Przymierza plus jeden (`spawnHordeHero`: najpierw nieużyty, potem poległy; dołącza do kolejności od następnej rundy).
Roboty: Horda szuka najbliższego bohatera Przymierza; Przymierze uderza sąsiada, którego pokona, a poza tym zbiera się przy Drzewie (przeszkody i strażników omija).
Symulacja (`SIM_OBJECTIVE=survival SIM_DIGITAL=1`, 100 gier, Normalny): 1 gracz 47–72% wygranych Przymierza, 2 graczy 76–85%; Trudny 37–52% i 53–67% (60 gier).
Dla 2 graczy cel jest łatwiejszy (dwóch bohaterów wzajemnie się wspiera, a limit fal rośnie o 1 na bohatera); do ewentualnego dostrojenia przy tabelach balansu (6.2.6).

Zmiana z 9.11.2026: w przetrwaniu nie ma kryształów ani Drzewa. Strażnicy zostają (walka, skarb, doświadczenie), ale pokonany nic nie zostawia i nie rysuje się przy nim kryształ
(`Crystal.decoy`). Kafelek Drzewa to zwykłe, przechodnie pole (losowy teren bez mostu); Przymierze nadal zbiera się na środku mapy, więc zachowanie botów jest to samo.
Pasek na dole pokazuje przetrwane rundy zamiast kryształów. Po zmianie przestrojono Łatwy i dwóch graczy (wpisy `objective: 'survival'` w `tuning.ts`): Łatwy 1 gracz bez zastępowania
bohatera na krótkiej mapie, Łatwy 2 graczy bez zastępowania (z rozwojem z nim), skarby Hordy dla Normalnego i Trudnego 2 graczy. Poza pasmem zostaje Łatwy z rozwojem na długich mapach (ok. 53–63%).

## Strojenie automatyczne i nowe pasma (9.11.2026)

Pasma wygranych Przymierza (autor, 9.11.2026; zastępują wszystkie wcześniejsze): **Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%**.
Zamiast ręcznego dobierania liczb działa stroiciel `scripts/sim/tuneLevels.ts` (`[SIM_SHAPE=… SIM_MAP=…] node --import tsx scripts/sim/tuneLevels.ts <cel> <rozwój 0|1> [gier] [rund]`, ok. 30 s na cel, kształt mapy i ustawienie rozwoju):
dla każdej komórki (rozmiar mapy × stół × poziom) szuka najmniejszej zmiany dźwigni (losowe skarby startowe Hordy i Przymierza, w trudnym poziomie i w kooperacji dodatkowi bohaterowie Hordy), która wprowadza wynik w pasmo z marginesem 3 punktów.
`scripts/sim/tuneMerge.ts` zbiera wyniki do wygenerowanego `src/engine/tuningAuto.ts` (1346 wpisów: mapy trójkąt, prostokąt, pierścień, wyspy, Cieśnina i Dolina; cele Kryształy, Punkty kontrolne, Przetrwanie, Boss, Artefakt; z rozwojem bohatera i bez), który `DIGITAL_TUNING` dokleja na końcu.
Wpisy `customMapId` rozróżniają dwie ręczne mapy. Strojenie od zera: `"noAuto": true` w `SIM_OVERRIDE` pomija wygenerowane wpisy.
Weryfikacja na 250 grach na komórkę (nie niezależna: te same ziarna co przy strojeniu): z 2400 komórek poza pasmem zostało 256 (11%), w większości o kilka punktów. Najwięcej: Boss (Trudny: dźwignie nie działają, bo bohater dochodzi do Bossa, zanim skarby Hordy mają znaczenie; autor: nie ruszać) oraz Kryształy na Cieśninie i Dolinie (10–14 z 40 komórek: ręczne mapy mają dużo wcześniejszych wpisów i mało miejsca na korektę).

## Strojenie przygody w wersji cyfrowej (5.11.2026)

Cel autora: wygrane Przymierza **Łatwy 70–90%, Normalny 45–65%, Trudny 30–50%** (boty, bez areny) w obu celach. Dźwignie są tylko w wersji cyfrowej:
`src/engine/tuning.ts` (`DIGITAL_TUNING`), stosowane przez `createGame` do reguł gry (ustawienie zostaje takie, jak ustawia poziom: ranking i zapisy go nie widzą).
Strojone są gotowe poziomy; poziom „Własny” nie jest ruszany. Pola reguł: `hordeStartTreasures` / `dawnStartTreasures` (losowe skarby na starcie Hordy / Przymierza),
`roundLimitBonus` (dodatkowe rundy limitu), `controlDawnExtra`, a także istniejące `heroReplacement`, `extraEvilHero`, `heroMovePoints`.

Użyte liczby (reszta komórek bez zmian):
- Kryształy: Łatwy 1 gracz na średniej mapie i Łatwy 1 na 1 na krótkiej i średniej: bez zastępowania polegniętego bohatera; Łatwy 2 na 2 na bardzo długiej: 4 punkty ruchu i +6 rund limitu;
  Normalny 2 graczy: krótka 1 losowy skarb Hordy, bardzo długa 2; Trudny 2 graczy bardzo długa: 4; Normalny 2 na 2 średnia i Normalny 1 na 1 długa: 1 losowy skarb Przymierza.
- Punkty kontrolne: Trudny 1 gracz: bez dodatkowego bohatera Hordy, a na krótkiej i średniej 1 losowy skarb Hordy; Normalny 2 graczy: 1 skarb Hordy (bardzo długa 3);
  Trudny 2 graczy bardzo długa: 4; Normalny 2 na 2: długa 1 skarb Hordy, bardzo długa 2; Normalny 1 na 1 krótka i średnia: 1 skarb Przymierza.
- Dodatkowe rundy Przymierza w serii nie pomagają w rywalizacji (tam zwycięstwa idą z przewagi na limicie), więc zostało `dawnExtraRounds: 1`.
- Poziom Łatwy to pojedynki na planszy, więc skarby Hordy prawie nie mają na niego wpływu; dźwignią jest tam zastępowanie bohatera.

Poprawka z 9.11.2026 (Nocna Zasadzka naprawdę dodaje +3, patrz CHANGELOG) obniżyła wygrane Przymierza o 3–10 punktów, więc wpisy zostały przejrzane na nowo (`make sim-tabele`
z `SIM_DIGITAL=1`, także z `SIM_GROWTH=1`). Z rozwojem bohatera: Łatwy bez losowych skarbów Hordy (dawały jej zbyt dużą przewagę w pojedynkach), Trudny 2 graczy 3 skarby Hordy (bardzo długa 5),
Normalny 2 graczy bardzo długa 3 skarby, Łatwy 1 na 1 bardzo długa i 1 gracz krótka bez zastępowania bohatera; Łatwy 2 na 2 bardzo długa dostaje 3 losowe skarby Przymierza;
Normalny 2 na 2 długa 1 skarb Przymierza. Wszystko w pasmach poza kilkoma komórkami Łatwego o 1–3 punkty poniżej 70% (w granicy szumu).

Wyniki końcowe (300 partii na komórkę, wygrane Przymierza; szum ok. ±3 punkty).

Cel „Kryształy”:

```
Kooperacja — 1 gracz
│ Mapa         │ Łatwy │ Normalny │ Trudny │
│ Krótka       │   96% │      55% │    36% │
│ Średnia      │   67% │      60% │    35% │
│ Długa        │   88% │      58% │    34% │
│ Bardzo długa │   81% │      64% │    43% │
Kooperacja — 2 graczy
│ Mapa         │ Łatwy │ Normalny │ Trudny │
│ Krótka       │   83% │      53% │    43% │
│ Średnia      │   74% │      55% │    37% │
│ Długa        │   70% │      62% │    46% │
│ Bardzo długa │   80% │      58% │    46% │
Rywalizacja — 1 na 1
│ Mapa         │ Łatwy │ Normalny │
│ Krótka       │   79% │      51% │
│ Średnia      │   69% │      48% │
│ Długa        │   89% │      50% │
│ Bardzo długa │   75% │      47% │
Rywalizacja — 2 na 2
│ Mapa         │ Łatwy │ Normalny │
│ Krótka       │   83% │      47% │
│ Średnia      │   73% │      47% │
│ Długa        │   68% │      45% │
│ Bardzo długa │   68% │      50% │
```

Cel „Punkty kontrolne”:

```
Kooperacja — 1 gracz
│ Mapa         │ Łatwy │ Normalny │ Trudny │
│ Krótka       │   89% │      48% │    31% │
│ Średnia      │   82% │      51% │    35% │
│ Długa        │   80% │      58% │    31% │
│ Bardzo długa │   68% │      60% │    34% │
Kooperacja — 2 graczy
│ Mapa         │ Łatwy │ Normalny │ Trudny │
│ Krótka       │   93% │      51% │    40% │
│ Średnia      │   86% │      56% │    40% │
│ Długa        │   84% │      60% │    46% │
│ Bardzo długa │   86% │      60% │    50% │
Rywalizacja — 1 na 1
│ Mapa         │ Łatwy │ Normalny │
│ Krótka       │   90% │      58% │
│ Średnia      │   85% │      59% │
│ Długa        │   81% │      51% │
│ Bardzo długa │   69% │      62% │
Rywalizacja — 2 na 2
│ Mapa         │ Łatwy │ Normalny │
│ Krótka       │   84% │      64% │
│ Średnia      │   77% │      56% │
│ Długa        │   82% │      55% │
│ Bardzo długa │   86% │      63% │
```

Znane odchyłki: Łatwy 1 gracz na krótkiej mapie (kryształy) ok. 96% (dźwignia zastępowania bohatera spada tam za nisko, ok. 62%), Łatwy 1 gracz na średniej mapie ok. 67%,
Łatwy 2 na 2 na długiej i bardzo długiej ok. 68%.

## Ognisty Oddech rani sojuszników (11.11.2026, tylko wersja cyfrowa)

Oddech Czarnego Smoka trafia dwie jednostki w jednej linii. W wersji cyfrowej (`breathSecondTarget` w `battle.ts`) drugą jednostką może być sojusznik stojący za wrogiem: dostaje ten sam pełny cios. Planszówka bez zmian (golden bez zmian).
Boty (`battleAi.ts`, `AI_TUNING.friendlyFire` = 1,2) liczą cios w sojusznika jako stratę i nie używają oddechu w linii z własną jednostką. Symulacje (`SIM_GROWTH=1 make sim-cele GAMES=60`): bez zmian poza szumem. Tekst karty w wersji cyfrowej: `DIGITAL_ABILITY_TEXTS`.

## Osobna skala Życia (11.11.2026)

**Życie ma własną skalę: ×5, przy Ataku ×3** (`HP_SCALE` i `STAT_SCALE` w `data.ts`; reguły `hpScale` i `statScale`; odczyt przez `hpScaleOf` i `scaleOf` w `battle.ts`). Powód (zgłoszenie 10.11): przy wspólnej skali ×3 bohater z mocnym ciosem
(Szarża Światła, Słoneczny Blask) zabijał innego bohatera jednym uderzeniem. Cel autora: bohater ściąga bohatera w 2–4 ciosy.
- **Wybór liczby** (macierz „kto kogo”, 6 bohaterów, cios = Atak + typowa premia zdolności ≈ 0–3, ×3, kontra Życie × skala): przy Życiu ×3 jednym ciosem kończy 33% par (średnio 1,7 ciosu); ×4: 3% par, 97% w 2–4 (średnio 2,4);
  **×5: 0% jednym ciosem, 93% w 2–4 (średnio 2,8)**; ×6: 93% w 2–4 (średnio 3,2); ×7: 33% par w 5+ ciosów. Wybrane ×5: żadna para nie kończy się jednym ciosem, a reszta (7%) to Ogr uderzający Niedźwiedzia.
  Test `tests/reports1110.test.ts` pilnuje, żeby żaden zwykły cios bohatera nie zabijał innego bohatera.
- Na skalę Życia idą: Życie jednostek i strażników, Życie bossa, leczenie (Dar Życia, Eliksir Uzdrowienia, Nasiono, Odrastanie, Szpon Złodzieja, Kacza Furia), Eliksir Żywotności, umiejętności Hart i Opieka nad Drużyną, Życie z artefaktów i pomoc dla dziecka.
  Na skalę Ataku: ciosy, premie do ataku, obrażenia skarbów, ignorowanie obrażeń, Obrona, ciernie.
- Teksty (`scaleText`) mnożą liczby przed „Ż” i „punktów obrażeń” (leczenie) przez skalę Życia, resztę przez skalę Ataku.
- Skutek dla bitew: walki trwają ok. 1,7 raza dłużej (więcej ciosów na jednostkę), a bohaterowie żyją dłużej przy ciosach pomocników i strażników. Balans po zmianie (`SIM_GROWTH=1 make sim-cele GAMES=60`, Normalny): wszystkie cele i mapy nadal 46–61%, jak przed zmianą
  (poza znaną Doliną z Kryształami w kooperacji, 35%). Test „×3 = ×1” (`statscale.test.ts`) gra z jedną skalą (reguła `hpScale` pusta = skala Ataku).

## Skala statystyk (10.11.2026, wersja cyfrowa, od poziomu Wyprawa)

Gdy włączony jest rozwój bohatera (poziom 2 „Wyprawa” i wyżej), **Życie i Atak wszystkich jednostek oraz każdy bonus, który je dodaje lub odejmuje, są pomnożone przez 3** (`STAT_SCALE` w `data.ts`, reguła `statScale`, odczyt przez `scaleOf` w `battle.ts`).
Szybkość, zasięgi, punkty ruchu i liczby (ile pól odkryć, ilu wrogów trafia błyskawica) zostają. Cel: małe premie (np. +1 do Ataku) i obrona liczbowa (tarcze 1 / 2 / 3 pkt) mają sens, nie dublując ani nie wyłączając jednostek. Poziom 1 „Przygoda” i planszówka zostają z małymi liczbami.
- Mnożone: Życie i Atak jednostek (`battleStats(defId, digital, scale)`), premia strzelców, zdolności (Słoneczny Blask, Szarża Światła, Opiekun Gaju, Twardogłowy, Zew Krwi, Klątwa, Dar Życia, Nocna Zasadzka, Złodziejski Szpon, Odrastające Głowy, Kamienna Skóra), efekty skarbów (leczenie, strzała, błyskawica, miecz, eliksir żywotności, róg odwagi, kamień ochrony), umiejętności i artefakty bohatera, dodatkowe Życie trybu rodzinnego, Życie Bossa, kość obrażeń (±1 → ±3), próg Twardogłowego.
- Roboty: progi i wagi oceny uderzeń przeliczane z powrotem na stare liczby, więc **gra przebiega dokładnie tak samo jak przy małych liczbach** (test `tests/statscale.test.ts`: te same ziarna ×1 i ×3 dają ten sam wynik w każdym z pięciu celów). Balans i strojenie (`tuningAuto.ts`) zostają bez zmian.
- Interfejs: karty jednostek, skarby, umiejętności i artefakty pokazują liczby przeliczone (`scaleText`, `StatScaleContext`).
- Nowe zasady, które to umożliwia (do zrobienia): „minimum 1 obrażenia” przy obronie liczbowej, tarcze 1 / 2 / 3, drobne premie umiejętności i artefaktów.

## Mapy XL i XXL (11.11.2026, tylko wersja cyfrowa)

- Klucze `huge` (XL, „ogromna”) i `giant` (XXL, „gigantyczna”) w `MapSize`. Trójkąt: 17 i 20 rzędów (153 i 210 pól), limit rund 30 i 36, 4 / 5 Eliksirów i 6 / 8 innych skarbów, 9 / 11 miejsc (kapliczki, obozy, skrzynie), start Przymierza z 3 i 4 skarbami. Prostokąt 18×10 i 21×12, pierścień o promieniu 8 i 10, wyspy 23×11 i 27×13. Planszówka ma nadal cztery rozmiary (`BOARD_MAP_SIZES`); serwer odrzuca XL i XXL bez wersji cyfrowej.
- Punkty rankingowe: waga mapy 1,15 i 1,3 (Bardzo długa = 1), sufit `MAX_POINTS` = 40; dawne mapy liczą się jak dotąd (wzorzec 30). Trudność bazowa XL i XXL w tabelach `scoring.ts` jest skopiowana z „Bardzo długiej”, do poprawy, gdy będą dane z gier.
- Strojenie: `SIM_SIZES=huge,giant SIM_SHAPE=<kształt> node --import tsx scripts/sim/tuneLevels.ts <cel> 1 120 10` (z rozwojem bohatera, czyli poziom Wyprawa; ok. 1–6 min na kombinację), wyniki w `.tmp/sim/auto-*-xl.json`, scalone przez `tuneMerge.ts` do `tuningAuto.ts`. Przejścia: 4 kształty × 5 celów. Po tuningu część komórek została poza pasmem (około jedna czwarta: najczęściej rywalizacja 1 na 1 i Trudny w kooperacji na XXL, gdzie dźwignie startowych skarbów nie wystarczają). Mapy własne („ciesnina”, „dolina”) i poziom 1 (bez rozwoju) na XL i XXL nie są strojone; poziom 1 przestrojony tylko na trójkącie i kryształach bez rozwoju jednym przebiegiem.
