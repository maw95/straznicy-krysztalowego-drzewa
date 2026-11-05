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
