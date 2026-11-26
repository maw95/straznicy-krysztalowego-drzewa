# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Plan wydania: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`. Mechaniki według poziomów: `MECHANIKI_I_POZIOMY.md`.

## Jak z tego korzystać (zasady dla Claude'a)

Autor pisze „zrób punkty 1, 2 i 3” (albo „zrób 9–10”, „zrób wszystko z grupy A”), a Claude robi je **sam, bez pytań**, w podanej kolejności, aż skończy. „Zrób wszystko” = po numerach od góry, z pominięciem punktów oznaczonych **kredyty** (patrz niżej) i grupy „Tylko autor”.

**Każdy punkt jest samowystarczalny.** Ma: rozmiar (S ≈ godzina, M ≈ kilka godzin, L ≈ dzień+), zależności, miejsca w kodzie, zakres, **decyzje już podjęte** i warunek ukończenia („Gotowe, gdy”). Numery są stałe (po przeglądzie 16.11.2026 numeracja jest nowa; stare numery z commitów sprzed tej daty już nie obowiązują).

**Co robić, gdy czegoś brakuje w opisie punktu (zamiast pytać):**
1. Zastosuj to, co mówi `NOTATKI_DLA_AGENTA_PLANSZOWKI.md` (rozstrzyga przy sprzecznościach) i sekcja „Decyzje obowiązujące” niżej.
2. Wybierz najprostszą, odwracalną opcję, zrób i dopisz jedną linię do sekcji „Decyzje podjęte przez Claude'a (do akceptacji)” na dole (data, punkt, co wybrałeś, jak to zmienić). Autor przeczyta to przy okazji; nie blokuje to pracy.
3. Pytaj (i zatrzymaj tylko ten punkt, resztę rób dalej) wyłącznie wtedy, gdy: trzeba wydać więcej kredytów niż w budżecie (niżej), trzeba coś wypchnąć (push gry robi tylko autor), akcja jest nieodwracalna (usuwanie danych, serwer autora), albo dwa punkty wzajemnie się wykluczają.

**Punkty z grafiką i dźwiękiem (oznaczone „kredyty”):** zasób to kredyty Scenario (CU). Claude **nie widzi salda**; autor podaje budżet w poleceniu („zrób 17, mam 300 CU”). Bez podanego budżetu Claude wydaje najwyżej **150 CU na jedno polecenie**. Liczy wydatki sam (ceny w sekcji „Kredyty Scenario” niżej), robi punkty w kolejności i kończy to, co zdąży w budżecie; resztę zostawia z adnotacją „zostało: …” w punkcie. Limit na jednostkę: 100 CU; jedna ponowna próba na zasób (zablokowane zadania też kosztują), potem „nie wyszło” w punkcie i następna jednostka.

**Przy każdym punkcie:**
- `make check` przed commitem; jeden commit na zmianę (punkt może mieć kilka commitów); wpis w CHANGELOG.md pod „W przygotowaniu” (po polsku, zrozumiały dla gracza); **bez pushu gry** (backend: commit, push i `make deploy` wolno).
- Zmiana interfejsu: sprawdź w przeglądarce (`make zrzut` albo skrypt `scripts/browser/`, desktop i telefon), nie tylko w testach jsdom.
- Zmiana liczb lub AI przesuwa `tests/golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie; tylko gdy zmiana jest zamierzona.
- Każdy zaakceptowany obraz, animacja, dźwięk lub muzyka trafia do repo w tej samej sesji z wpisem w `assets.json`.
- Po skończeniu: usuń punkt z tego pliku (albo zaznacz, co zostało), zagraj `complete.oga`, krótkie podsumowanie po polsku, uwaga, że to dobry moment na `/clear`.

## Stan (25.11.2026)

Ostatnie wydanie: **2.17.1** (18.11). W `master` czekają niewydane zmiany z „W przygotowaniu” w CHANGELOG.md (m.in. pełna grafika Dzikiego Stada, Żelaznego Klanu i Bractwa Przypływu); push i wydanie robi autor. Backend ma lokalne, niewdrożone commity (punkt 63c).
Drabinka poziomów: 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera (3.0) dopiero po poziomie 6. Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids` = Łatwy, `economy`, `realm`, `empire`) zostają. Typ `Level`: `zero | kids | normal | hard`.

## 1. Kolejka prac (w tej kolejności)

Zrobione punkty są usuwane (numery nie są ponownie używane, więc w kolejce są luki). Wspólna zasada dla zmian liczb lub AI: po zmianie `make sim-raport GAMES=100` (zob. sekcja 5), poprawki strojenia, golden `-u` w **osobnym commicie** z opisem. Serwer (`../straznicy-krysztalowego-drzewa-backend`) dzieli silnik: po zmianie reguł lub akcji zsynchronizować, `make deploy` (backend wolno pushować i wdrażać); gra (push) tylko autor.

### Kolejka z uwag autora (24.11.2026), w kolejności wykonania

Uwagi z oglądania gry po pakiecie Stad, Klanu i Przypływów. Kolejność: tanie poprawki interfejsu (S, bez kredytów, bez wpływu na wyniki bota), potem funkcje, na końcu to, co rusza golden i balans albo kosztuje kredyty. Do rozstrzygnięcia z autorem: Dziennik zdarzeń (przycisk na dole) pokazuje każdemu graczowi przy tym samym urządzeniu publiczne wpisy o bitwach i skarbach przeciwników; czy ukryć je w hot-seat (np. pokazywać tylko wpisy własnej frakcji)? Punkt 75 zmienia wyniki symulacji (generator mapy): golden `-u` w osobnym commicie i przestrojenie poziomów. Każdy punkt: `make check`, weryfikacja w przeglądarce, wpis w CHANGELOG PL i EN, osobny commit.


**75. Generator mapy (zostaje tylko strojenie).** Strojenie poziomów po zmianie mapy (razem ze strojeniem z 51b): szybki pomiar 60 gier (Przymierze–Horda, pvp1) pokazał ruch Normalny średnia 53→37%, Trudny długa 15→25%, szum ±12 pkt, więc potrzebne `tuneLevels.ts` (zob. 51b).
   - **Wynik przebiegu stroiciela 25.11 (15:51–18:59, 81 przebiegów, `.tmp/sim/retune-all.log`, `=== done`; NIE scalony):** 1485 komórek w paśmie (88%), 100 na granicy, 107 poza. Poza pasmem: (1) duże mapy (veryLong/huge/giant), Normalny i Trudny za nisko, dźwignie wyczerpane (np. giant·pvp2·full 19%); najgorzej Kryształy `*-crystals-g1-xl` (8–10 z 12 komórek OUT); (2) Łatwy przeskakuje pasmo (3% → 93–100%): dźwignie `noFactionBonus` / `crystalsNeededDelta` są „wszystko albo nic”; (3) Przetrwanie na Cieśninie i Dolinie g0 (po 5 OUT). Trudny Potyczki g0 i tak pomijany przez `tuneMerge` (ręczna reguła autora).
   - **Plan (26.11, autor akceptuje pracę nad tym):** (a) `tuneMerge` tego przebiegu, `make check`, commit; golden `-u` w osobnym commicie; (b) mocniejsza dźwignia dla dużych map (np. więcej skarbów startowych Przymierza zależnie od rozmiaru), dostroić tylko komórki OUT; (c) stopniowe dźwignie Łatwego (np. połowa premii frakcji) zamiast przełącznika. Kolejność a → b → c.

**88. Animacje Bractwa Przypływu: druga runda poprawek zrobiona 26.11, czeka na akceptację autora (`make podglad F=tides`).** Trafienia 6 jednostek jako klipy (Strażnik, Żaba, Syrena, Żółw, Kapłanka, Albatros z pozy stojącej), atak Strażnika (pchnięcie trójzębem), Lewiatan jako wąż na lądzie. Znane wady: trafienie Albatrosa ma rozmyte pióra w szczycie odrzutu, trafienie Żółwia jest delikatne. Lekcja: `lastFrameImage` równe obrazowi startowemu wymusza powrót do pozy (trafienia i ataki); słowa „blow” i „knocked off balance” blokuje filtr.

**89. Uwagi autora do interfejsu z 26.11 (S–M, bez kredytów).**
   - **Środek mapy:** po usunięciu Drzewa z celów innych niż „Kryształy do Drzewa” środkowy kafelek nadal jest odsłonięty od startu; ma być zakryty jak reszta.
   - **Koszary:** surowce stoją nad przyciskiem wyjścia, mają być obok niego.
   - **Rada osady:** surowce i przycisk wyjścia wewnątrz ramki, nie poza nią; ramka ma zawsze tę samą wysokość (dziś rośnie po kliknięciu siedliska przez wysoką kartę jednostki); usunąć podgląd karty jednostki z tego widoku.
   - **Mapa świata, panel boczny:** usunąć sekcję z opisem zaznaczonego kafelka (pod artefaktami).
   - **Mapa świata, pod imieniem bohatera:** Odłamki jako ikona i „0 / 0 / 5” (szczegóły pod prawym przyciskiem); ikona many nieco większa i przed liczbami („<mana> 4/4”); ruch: romby u góry, pod nimi „Ruch 2/3” (albo ikona ruchu zamiast słowa, jeśli pasująca istnieje).
   - **Zoom mapy świata:** maksymalne przybliżenie nieco większe niż dziś i ono ma być domyślne.

**91. Tylko skończone frakcje do wyboru (S; uwaga autora 26.11).** Skończonych frakcji jest 5: Przymierze, Horda, Dzikie Stado, Żelazny Klan, Bractwo Przypływu. Pozostałych nie widać przy wyborze drużyny (kreator, ekran miejsc, online), więc nie da się ich wybrać; dane i kod zostają. Najlepiej jedna lista „grywalnych” frakcji w silniku, z której czytają ekrany i serwer. Wolna Kompania (grafika w toku) też ukryta, dopóki autor jej nie dopisze.

**92. Walki z pomocnikami wolnych frakcji (M; rusza golden i balans; uwaga autora 26.11).** Dziś walki na mapie (spotkania niesterowane przez gracza) losują tylko z 12 jednostek neutralnych. Pula ma objąć też wszystkich pomocników (nie bohaterów) frakcji, którymi nikt w tej grze nie gra. Przykład: 4 graczy, 2× Przymierze, Horda, Stada → spotkania z neutralnymi, z pomocnikami Bractwa Przypływu i Żelaznego Klanu. Tylko frakcje z punktu 91 (mają grafikę i animacje). **Decyzje autora 26.11:** trudność spotkania bardzo zbliżona do neutralnych (dobierać skład tak, by siła była podobna); nagrody takie same jak za neutralnych; arena zależy od frakcji heksa, na którym toczy się walka; jedna grupa zawsze z jednej frakcji. Potem `make sim-raport`, golden `-u` w osobnym commicie i przestrojenie poziomów.

**90. Mgła wojny jak w Heroesach (M–L; rusza widok w hot-seat i online).** Gracz nie widzi kafelków odsłoniętych przez graczy spoza swojej frakcji (każda frakcja ma własną odkrytą część mapy). Sprawdzić: bot (czy korzysta z wiedzy o całej mapie), online (`redactHidden` / `visibleTo` w serwerze), hot-seat (zasłona przekazania), golden.



**82. Poprawki animacji z przeglądu (M; kredyty wg liczby klipów, ok. 15 CU za klip).** Po obejrzeniu strony podglądu (`make podglad`): Przypływy: Morska Wiedźma (blady wir w ataku), Rafowy Golem (stopa w chodzie), Tryton (martwy leży odwrotnie), Albatros (poza w trafieniu), Kapłanka (biała kula w ataku), Lewiatan (punkt 79); Klan: Mosiężny Pająk (obraca się w chodzie ¾ do kamery), Wartownik (kładzie się szeroko w śmierci). Pełne uwagi agentów: `.tmp/zrodla/*_sprites_*/RAPORT.txt`. Generować tylko to, co autor wskaże.

**86. Animacje i dźwięki Żelaznych Klanów (poprawki wykonane w fbf4848, czekają na przegląd autora na `make podglad F=clans`; poniżej uwagi autora jako lista kontrolna; kredyty wg liczby klipów, tryb `draft` 9 CU; wzorzec: punkt 85 i `docs/PRZEPIS_JEDNOSTKI.md`).** **Reguły ogólne autora (powtarzają się, stosować do każdej jednostki):** atak = wyraźny zamach z rozmachem i uderzenie w cel (nie samo podniesienie broni), agresywny i dynamiczny; śmierć = widoczny upadek/pokonanie (nie siadanie ani kładzenie się), u maszyn i konstruktów widoczne ciężkie zniszczenie, kolos leży nieaktywny; trafienie = cofnięcie od ciosu z PRZODU (nie pochylanie do przodu, nie podskok, nie potknięcie), spokojne i płynne, a po nim powrót do pozy „stoi”. Dźwięki dobierać do postaci (wiek, płeć, charakter), nie do „dziewczynki” czy „taniego”.
  - **Tan Żelazobrody:** atak = uderzenie młotem, ewentualnie z okrzykiem bojowym; dźwięk śmierci brzmi tanio (ma brzmieć jak umierający krasnoludzki wojownik); śmierć wygląda jak siadanie; trafienie bardzo szybkie, jak potknięcie albo przestraszenie się.
  - **Matka Run:** śmierć i trafienie jak u Tana (naprawić tak samo); dźwięki do wymiany wszystkie; atak = dźwięk rzucanego zaklęcia; śmierć nie może brzmieć jak westchnięcie dziewczynki (stara, potężna czarodziejka).
  - **Strażniczka Przełęczy:** atak = dźwięk wystrzału z kuszy, animacja ataku słaba (tak się nie strzela z kuszy); śmierć = ciche westchnięcie i upadek na ziemię (twarda kobieta, ok. 30 lat).
  - **Stary Górmistrz:** atak wygląda jak podniesienie kilofa, ma być zamach i uderzenie.
  - **Kusznik Gór:** śmierć dobra, ale tarcza też ma się przewrócić.
  - **Kapłan Kuźni:** okrzyk ataku bardziej gniewny, jako tło dla dźwięku magicznego efektu; trafienie mniej gwałtowne i bez dziwnego ruchu nogą.
  - **Krasnoludzki Tarczownik:** atak bardziej agresywny; śmierć wygląda jak kładzenie się.
  - **Kret z Brązu:** atak znacznie bardziej agresywny i dynamiczny; śmierć dramatyczna (maszyna mocno uszkodzona); trafienie od przodu (dziś pochyla się jak trafiony od tyłu).
  - **Mosiężny Pająk:** śmierć dużo bardziej dramatyczna, widoczne zniszczenia.
  - **Niedźwiedź w Zbroi:** trafienie bez pochylania do przodu (atak z przodu).
  - **Wartownik z Brązu:** atak dużo bardziej dynamiczny i agresywny; śmierć dramatyczna ze zniszczeniami; trafienie: pomysł dobry, ale animacja poszarpana, jakby zapętlona po odchyleniu do tyłu.
  - **Pogromca Olbrzymów:** dźwięk ataku = groźny, agresywny, męski okrzyk bojowy plus uderzenie włóczni; atak = potężne pchnięcie włócznią z rozmachu; śmierć dramatyczna (dziś kładzenie się); trafienie nienaturalne, jak chęć podskoku.
  - **Skarbnik:** dźwięk śmierci jest pomylony (wymienić).
  - **Gwardia Młota:** atak = potężne uderzenie młotem z zamachu i dźwięk potężnego uderzenia; śmierć wygląda jak kładzenie się.
  - **Armata Klanów:** śmierć bardziej widowiskowa, widoczne zniszczenie armaty; po trafieniu płynny powrót do pozy „stoi”.
  - **Kolos Kuźni:** trafienie spowolnić; śmierć dramatyczna, kolos leży całkiem zniszczony i nieaktywny.
  - **Kowal Bitewny:** dźwięk ataku = uderzenie młota; atak = zamach młotem (dziś tylko podnosi); śmierć i trafienie do poprawy.
  - **Kozioł Taranowy:** atak bardziej dynamiczny i agresywny; trafienie nienaturalne.


**87. Żelazny Klan: reszta uwag z 25.11 (poprawki zrobione, czekają na przegląd autora na `make podglad F=clans`).** **Otwarte:**
  - **Śmierć Pogromcy** kończy się zwinięciem twarzą do ziemi (lepiej niż czworaki z 24.11, ale może nadal wyglądać jak klęczenie).

### Starsze punkty

**51b. Potyczka zamiast Rywalizacji i Kooperacji w wersji cyfrowej: zostaje strojenie (tryb zrobiony; serwer z tą zmianą czeka na wdrożenie z wydaniem gry).**
  - **Do zrobienia: strojenie po wzmocnieniu Hordy.** Kryształy spadły poniżej pasm (pomiar 40 gier na komórkę, Przymierze jako człowiek: Łatwy 40–88, Normalny 30–60, Trudny 13–43; pasma 65–85 / 45–65 / 30–45), a Przetrwanie w PvP nie ma żadnych wpisów strojenia (Przymierze wygrywa tylko 7–30%). Stroiciel: `SIM_TABLES=pvp1,pvp2 node --import tsx scripts/sim/tuneLevels.ts <cel> <rozwój 0|1> 120 8` (dla każdego celu, kształtu mapy i rozwoju; potem `tuneMerge.ts`); dźwignia dla Przymierza to skarby na start (`dawnStartTreasures`). Potem: sprawdzić scenariusze kampanii (były stroione na automacie), przestroić cztery nowe frakcje względem nowej Hordy (G2) i zaktualizować golden w osobnym commicie.

**52. Dzikie Stado (G1, G2, G4, G5 i online zrobione).** Dane, balans (tabele w `docs/frakcje/herds.md`, `docs/DIAGNOZA_FRAKCJI.md`), pełna grafika, muzyka i dźwięki są w repo. Baran Gromowładny na dwóch polach: zrobione. Cel balansu (decyzja 20.11): średnia wygranych przeciw reszcie ok. 45–55%, kontra ok. 60–70%, kontrowana ok. 30–40%, żadna para poza 25–75%; Przymierze–Horda po bonusie Hordy (51b) wynosi ok. 50%; tej pary nie ruszać.

**53. Królestwo Umarłych (L; po 52, te same bramki).**
  - **Status 24.11:** G1 i G2 zrobione; G4 (grafika) nie jest zaplanowana do odnowienia kredytów (decyzja 23.11: najwyżej 5 pełnych frakcji).
  - **Stan 19.11 (G1 zrobiona, bez autora):** paczka `src/engine/factions/undead.ts` (bohaterowie, 3 dowódcy, czwarty bohater, 12 jednostek z układem A/B, legenda), nowe prymitywy w silniku (wskrzeszenie w polu, odporność na statusy, ignorowanie pancerza, tarcza jednorazowa wg typu ciosu, aura osłabiająca, wyczerpanie many), budynki Kurhan Wiecznej Warty (4 poziomy, Wieczna Warta), Ossuarium i Dzwonnica Zaduszna, Iskra (odporność na statusy), bot, angielski w `src/i18n/en/undead.ts`, zastępcza grafika (`make placeholders`), `tests/undead.test.ts`, `scripts/sim/umarli.ts`, `scripts/browser/umarli.ts`; test kontraktowy zielony, golden bez zmian. Karta z decyzjami i listą uproszczeń: `docs/frakcje/undead.md`. Szybki pomiar (100 gier na komórkę, poziom Imperium): Umarli wygrywają z Przymierzem 29% / 40% (Kontrola / Podbój), z Hordą 57% / 47%.
  - **Stan 20.11 (Wolna Kompania: G1 zrobiona na polecenie autora, bez autora):** paczka `src/engine/factions/free.ts` (3 bohaterów, 3 dowódcy: Kuna Rębajło, Żbiczka Bajdurka, Zajęczyca Zielarka, czwarty bohater Wydra Przemytniczka, 12 jednostek z układem A/B, legenda Waran Wieżowy), ukryte pułapki (Sidła: `BattleState.ground`, `redactHidden` w `src/engine/hidden.ts`, bot nie zna pułapek ani ukrytych jednostek wroga), oznaczenie, ukrycie, łup, Furia Ran, Riposta, Ładunek, Tama, Fortel, Okop, Oko Kruka, Szalony Skok, wieżyczka Warana, budynki Warsztat Sideł (4 poziomy), Paserka i Szlaki Przemytnicze, Iskra (+2 pułapki), UI (przycisk Sidła przy ustawianiu, zdolności na polu, przycisk Szlaków), angielski w `src/i18n/en/free.ts`, zastępcza grafika, `tests/free.test.ts`, `scripts/sim/kompanie.ts`, `scripts/browser/kompanie.ts`; golden bez zmian. Karta z decyzjami i uproszczeniami: `docs/frakcje/free.md`. Szybki pomiar (200 gier): z Przymierzem 35%, z Hordą 30-43%, ze Stadami 42-43%, Umarłymi 32-36%, Klanami 38-39%, Szronem 33-34%. **Po odpowiedziach autora (20.11):** Paserka I sprzedaje artefakty z plecaka (`kingdomSellArtifact`, zniżka na rynku zniknęła), hot-seat ma zasłonę „Przekaż urządzenie” przy układaniu Sideł i przycisk „Podejrzyj Sidła” (`src/ui/trapVeil.ts`), backend wywołuje `redactHidden` w `visibleTo` (commit lokalny, bez wdrożenia). **Do zrobienia przy online:** wydać silnik z `hidden.ts` i akcją `kingdomSellArtifact` (backend buduje się z paczki), dopisać akcję do `rooms/actions.ts`, dopiero wtedy Kompanie mogą wejść do gry przez internet.
  - **Stan G2 (19.11):** dostrojone, tabela w `docs/frakcje/undead.md`. **Zostaje:** G3 próbka jednostki (autor) · G4 pełna grafika, arena, kafle, muzyka, ikony zdolności, wybór poległego w Wezwaniu i Ponownym Oddechu, przenikanie Jeźdźca · G5 instrukcja PL i EN.

**54. Żelazny Klan (G1, G2, G4, G5 i online zrobione).** Dane, balans (`docs/frakcje/clans.md`), pełna grafika, muzyka i dźwięki są w repo. Nowe pole walki, tło osady i Rada Osady: zrobione 24.11.

**55. DLC: Wolna Kompania, Dwór Wiecznego Szronu, Pustynne Cesarstwo, Rój Puszczy, Bractwo Przypływu (L każda; po 54).** Pełna macierz balansu (`make sim-matrix`) raz na kilka frakcji, w tle, nocą.
  - **Status 24.11:** Bractwo Przypływu ma G1 i G4 (grafika, muzyka, dźwięki); zostaje Lewiatan (punkt 79). Kompanie, Szron, Piaski i Rój mają tylko G1 i czekają na odnowienie kredytów.

  - **Stan 19.11 (Dwór Wiecznego Szronu: G1 zrobiona na polecenie autora, bez autora):** paczka `src/engine/factions/frost.ts` (3 bohaterów, 3 dowódców, czwarty bohater Stary Gradowy, 12 jednostek z układem A/B, legenda Mamut Wiecznej Zimy; bez wilków i psów), prymityw Szronu (licznik, zamrożenie, kruchy lód, spowolnienie), lodowa ściana, ślad, porwanie, aura, budynki Pałac Szronu (4 poziomy), Kryształowa Grota i Wieża Zamieci (kara ruchu na mapie), Iskra (wrogowie z 1 szronem), bot, angielski w `src/i18n/en/frost.ts`, zastępcza grafika (`make placeholders`), `tests/frost.test.ts`, `scripts/sim/szron.ts`, `scripts/browser/szron.ts`; test kontraktowy zielony, golden bez zmian. Karta z decyzjami i uproszczeniami: `docs/frakcje/frost.md`. Szybki pomiar: z Przymierzem 43-44%, z Hordą 51-59%.
  - **Stan G2 (19.11):** dostrojone, tabela w `docs/frakcje/frost.md`. **Zostaje dla Szronu:** G3 próbka jednostki · G4 pełna grafika (lista w sekcji 2a) · G5 instrukcja PL i EN. Kompanie, Piaski, Rój i Przypływy zostają na później.
  - **Stan G1 Pustynnego Cesarstwa (20.11, w gałęzi `g1-four-factions`):** paczka `src/engine/factions/sands.ts` według karty z 20.11 (Beduin Nomada zamiast Dżina Burzy), miraże z `redactHidden` (atrapy przebrane za swoje jednostki, pomieszane id, bot wroga planuje na widoku swojej strony), zakopana Królowa, Czujność, Czujna Drzemka, Przebudzenie, Rzut Sztyletem i reszta zdolności karty, Iskra (przestawienie 2 jednostek po rozstawieniu), Szlak Karawan, Brama Wydm, bot, angielski `src/i18n/en/sands.ts`, `tests/sands.test.ts`, `scripts/sim/piaski.ts`, `scripts/browser/piaski.ts`. Szczegóły i decyzje: sekcja „Stan G1” w `docs/frakcje/sands.md`. Dalej: G2 (liczby).
  - **Stan G1 Roju Puszczy (20.11, w gałęzi `g1-four-factions`):** paczka `src/engine/factions/swarm.ts` według karty z 20.11, grzybnia (jawne pola areny) z Sercem Grzybni I-IV, Iskra (grzybnia na polach Roju i środku areny), wszystkie zdolności karty (Przepoczwarzenie, Rozsiew, Wielki Chór, Oplot, Śluzowy Szlak i reszta), Ogród Grzybów, Podziemne Korytarze, bot, angielski `src/i18n/en/swarm.ts`, `tests/swarm.test.ts`, `scripts/sim/roj.ts`, `scripts/browser/roj.ts`. Szczegóły i decyzje: sekcja „Stan G1” w `docs/frakcje/swarm.md` i sekcja 18 notatek. Dalej: G2 (liczby).
  - **Stan G1 Bractwa Przypływu (20.11, w gałęzi `g1-four-factions`):** paczka `src/engine/factions/tides.ts` według karty z 20.11, Przypływ (zamiana miejsc przed aktywacją, Świątynia Pływów I-IV), Iskra (perłowa tarcza dla każdej jednostki), wszystkie zdolności karty (pociągnięcia, Ściana Wody, Skorupa, Wir, Odpływ, Wir Głębin, Wylinka i reszta), Perłowe Ławice, Latarnia Morska, bot, angielski `src/i18n/en/tides.ts`, `tests/tides.test.ts`, `scripts/sim/przyplyw.ts`, `scripts/browser/przyplyw.ts`. Szczegóły i decyzje: sekcja „Stan G1” w `docs/frakcje/tides.md` i sekcja 19 notatek. Dalej: G2 (liczby; dziś ok. 32% wygranych).
  - **G0 czterech DLC (20.11):** autor wstępnie zatwierdził Kompanie, Piaski, Rój i Przypływy; karty przeniesione do `docs/frakcje/{free,sands,swarm,tides}.md` (źródło prawdy zamiast sekcji 6, 8, 9, 10 w `FRAKCJE_PROPOZYCJE.md`). Dalej: G1 po poleceniu autora.
  - **G3 próbki grafik (20.11, stan do przejęcia przez inną sesję):** partia 1 (8 portretów legend, tier 6) przyjęta i w repo (`e27119e`, 96 CU). Partia 2 (8 portretów jednostek tieru 1: Satyr Dudziarz, Zjawa Pokutnika, Krasnoludzki Tarczownik, Chochlik Szronu, Wiewiórka Łuczniczka, Mangusta Faraona, Purchawka, Trytoński Harpunnik; 96 CU) przyjęta przez autora 20.11 i wdrożona do repo (portrety 256 px, wpisy w `assets.json`; surowe PNG i prompty w `.tmp/zrodla/g3-probki-t1/`). Razem wydane na G3: 192 CU. Decyzja autora: wszystkie nowe grafiki nieco żywsze (`docs/STYL_JEDNOSTEK.md`). Dalej (G4) dopiero po poleceniu autora.

**56. Rozszerzenie listy utworów i motywów muzycznych (M).** Dziś gra ma 10 plików w `public/assets/music/` (menu, dwie mapy, dwie bitwy, trzy utwory strażników, rytuał Hordy, dwie wygrane; lista w `MUSIC` w `src/ui/CreditsDialog.tsx`), więc motywy szybko się powtarzają. Do zrobienia: (1) rozpisać, czego brakuje (np. osobne motywy frakcji Przymierza i Hordy na mapie i w bitwie, osada i gospodarka od poziomu IV, walka z Bossem, arena, kampania i Ekspedycja, porażka Przymierza, krótkie sygnały: początek tury, zwycięstwo w bitwie); (2) źródło: wolne licencje (OpenGameArt, CC0 lub CC BY, autorzy trafiają do okna „Autorzy”) albo generowanie w Scenario (ElevenLabs Music, ok. 30 CU za utwór, więc budżet z sekcji 8); (3) każdy przyjęty utwór do repo w tej samej sesji (mp3 małe, pętle bez szwu), wpis w `assets.json` i w `MUSIC`, przypisanie do momentów gry w logice odtwarzania; (4) test w przeglądarce, że przejścia między utworami i głośność działają, także na telefonie. Decyzję o liczbie utworów i o tym, które momenty dostają własną muzykę, podejmuje autor.

**57. Blokowanie kombinacji cel × poziom × mapa, które nie mają sensu (M; najpierw analiza i decyzja autora).** Uwaga autora z 18.11: poziomy od IV (Osada) w górę zdają się nie mieć sensu przy celu „Kryształy do Drzewa” na małej i średniej mapie (gospodarka, siedliska i rozbudowa nie zdążą się rozwinąć przed końcem partii; rundy kończą się w kilka). Może takich par jest więcej. Do zrobienia: (1) policzyć macierzą symulacji cel × poziom × kształt × wielkość mapy (`make sim-matrix`, własny skrypt jak `.tmp/relic.ts`), ile rund trwa partia, ile budynków, rekrutów i czarów w niej powstaje i czy ostatnie mechaniki poziomu w ogóle wchodzą w grę (np. Odłamki przy celu innym niż Relikt, Podbój na małej mapie, Boss i Przetrwanie na kształtach bez miejsca na legowisko); (2) zebrać listę „bez sensu” i „ledwo”; (3) zdecydować z autorem, czy kreator ma te kombinacje **blokować** (wyszarzone karty z podpowiedzią, dlaczego), **ostrzegać** albo **podpowiadać** rozsądniejszą wielkość mapy lub cel; (4) wdrożyć w `NewGameWizard.tsx` i w ograniczeniach silnika (`presets`), z testem, że żadna dozwolona para nie daje partii kończącej się przed użyciem mechanik poziomu, oraz wpisem w instrukcji (PL i EN) i w CHANGELOG. Uwaga: blokada nie może zepsuć zapisanych partii i stołów online, które już mają taką parę.


**60. Onboarding nowego gracza: przemyśleć cały proces (M-L; zgłoszone przez autora 21.11, najpierw analiza i rozmowa z autorem).** Gra bywa zbyt skomplikowana dla kogoś, kto uruchamia ją pierwszy raz. Do przejrzenia od pierwszego uruchomienia do końca pierwszej partii:
  - **Konfiguracja gry w menu:** ile decyzji gracz musi podjąć, zanim zacznie grać (tryb, cel, poziom złożoności, trudność, wielkość i kształt mapy, frakcja, bohater, liczba graczy, kto jest botem). Czy da się zacząć jednym kliknięciem z sensownymi ustawieniami domyślnymi (np. „Pierwsza gra”), a resztę ukryć pod „Zaawansowane”?
  - **Pojęcia niezrozumiałe bez wprowadzenia:** m.in. **poziom złożoności** (Spacer…Imperium, co każdy dodaje), **cel** (Kryształy, Podbój, Relikt, Artefakt, Boss, Przetrwanie…), różnica między poziomem złożoności a trudnością, tryby (Potyczka, Ekspedycja, kampania, rodzinny). Nazwy, krótkie opisy przy wyborze, podpowiedzi „dla kogo”, a może polecany wybór na starcie.
  - **Pierwsza partia:** czy jest samouczek lub prowadzone pierwsze minuty (poziom Spacer jako domyślny początek, podpowiedzi kontekstowe, stopniowe odsłanianie mechanik poziomami), co z instrukcją w grze (kiedy i skąd gracz ją otwiera).
  - **Wynik pracy:** krótka lista problemów z propozycją (np. kreator „Szybki start” + „Własna gra”, uproszczone nazwy i opisy, ekran powitalny, odblokowywanie poziomów w miarę grania), zatwierdzona przez autora przed wdrożeniem. Powiązane: punkt 57 (blokowanie bezsensownych kombinacji, odłożony), instrukcja PL i EN, test na telefonach.


**63. Reszta po pakiecie z 23.11 (zebrana z rozmowy; każda pozycja to osobny commit z wpisem w CHANGELOG, PL i EN)..**
  - **63a. Kadry kart: reszta (S).** Ręczne kadry w `MANUAL` (`scripts/assets/card_crops.py`) mają Jeż, Wiwerna Cienia i Srebrny Lis; dziewięć jednostek (`boar, dawnOwl, dawnPhoenix, doomBehemoth, dryadArcher, goblinShaman, hellhound, minotaurChief, ratman`) ma portret równy całej ilustracji, a okno karty jest szersze niż ilustracja, więc kadr 1,0 pokazuje całość i wpis nic by nie zmienił. **Zostaje 10 jednostek (Klan i Przypływy mają już ilustracje kart), których karta nadal ma szarą „ZASTĘPCZĄ GRAFIKĘ”** (`boneDragon, emperorCicada, frostImp, frostMammoth, penitentShade, pharaohMongoose, sandWyrm, sporeling, squirrelArcher, towerMonitor`): kadru nie ma z czego wyznaczyć, dopiero po wygenerowaniu ilustracji karty (sekcja 2a, G4) uruchomić `python3 scripts/assets/card_crops.py` (i w razie potrzeby dopisać do `MANUAL`).
  - **63c. Wdrożenie backendu z wydaniem gry (S).** Lokalne commity backendu (`../straznicy-krysztalowego-drzewa-backend`): `5c086cd` (parsery nowych akcji) i `07365a4` (czwarty bohater frakcji ważny przy każdym stole cyfrowej potyczki; klient `5155a67` już go oferuje online). Backend nie jest wdrożony, bo produkcyjny build bierze silnik z wydanego pakietu 2.17.1: wdrożyć razem z wydaniem gry (`make deploy`), potem sprawdzić stół online z czwartym bohaterem.
  - **63g. Srebrna Wilczyca: wartości bohatera (S).** Wygląd zaakceptowany 23.11. Pomiar 23.11 (bitwy 3 na 3, 100 na parę, ±4 pkt, przeciw 4 bohaterom Hordy): Złoty Smok 70%, Prastary Niedźwiedź 65%, Wilczyca 27%, Król Jednorożców 21%. Wilczyca nie odstaje od Jednorożca, ale oba są dużo słabsze od Smoka i Niedźwiedzia (Ż 8, A 4 i warunkowy +1 A). Decyzja autora: zostawić czy podnieść (np. Ż 9 albo +2 A w Wilczej Rodzinie); zmiana liczb ruszy golden i tabele symulacji i wymaga aktualizacji `docs/frakcje/dawn.md`.
  - **63i. Drobne decyzje do potwierdzenia przez autora (S).** (1) Intro ma własne świetliki (`Intro.tsx`): menu, ustawienia i online już bez nich; czy w intro też usunąć? (2) nick online ma 3–16 znaków (backend `2aa62d9` czeka na wdrożenie z wydaniem, 63c). (3) Opisy frakcji w oknie prawego kliku (`FACTION_BLURBS` w `setupShared.tsx`) napisałem sam z kart `docs/frakcje/`: do przeczytania i poprawy. (4) Losowa frakcja jest domyślna tylko tam, gdzie cel gry dopuszcza wszystkie frakcje (nie w „Kryształach do Drzewa”).


## 2. Tylko autor (Claude tego nie bierze)
- **Premiera na Steamie** (L): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery: **3.0** (potwierdzone 17.11).
- Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam.
- Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- Odsłuch dźwięków (Claude nie ma jak ich odsłuchać): 7 z 15.11 (`catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3`) i 32 z 16.11 (`public/assets/dzwieki/jednostki/<id>_atak|_smierc.mp3` dla 16 jednostek poziomów 5–6); co się nie podoba, Claude wygeneruje od nowa (1 CU za sztukę).
- **Test na telefonach (dawny punkt 47):** skrypt `scripts/browser/telefon.ts` nie wykazał przewijania poziomego ani elementów poza ekranem. Zostaje: ekrany nieprzejrzane skryptem (dalsze strony kreatora, lobby online, `Własne ustawienia`, okno bohatera w bitwie), monit „obróć telefon” w pionie oraz **prawdziwe urządzenia** (Android i iPhone: pasek adresu iOS, wycięcie ekranu, wydajność WebGL; `vite --host`; pełny ekran po instalacji PWA). Usterki zgłasza autor.
- Pierwsza strona instrukcji planszowej (imienna wiadomość autora) i kąt kamery z wielkością figurek 3D: autor, po obejrzeniu na żywo (decyzja 17.11: poza parkingiem, bez terminu).

## 2a. Zastępcza grafika do wygenerowania (lista dla autora; reguła: każda zastępcza grafika ma tu dokładny opis)

Zastępcze pliki powstają skryptem `make placeholders` (`scripts/placeholders.ts` + `.py`), są małe (kilka KB), podpisane nazwą jednostki w kolorze frakcji i wpisane do `assets.json` z `"placeholder": true`. Skrypt nie nadpisuje istniejących plików; po wymianie na grafikę docelową usuń wpis z manifestu.


**Wymiany jednostek z 20.11:** nowe id i nazwy (zastępcze pliki starych id usunięte, nowe wygenerowane): Kulan Stepowy (`kulan`), Łucznik Stepowy (`steppeArcher`), Wół Piżmowy (`muskOx`), Arkar (`arkar`), Łamignat Stepowy (`steppeLamignat`), Orzeł Stepowy Łowca (`eagleHunter`), Płanetnik (`planetnik`), Wampir (`vampire`), Strzyga (`strzyga`), Dziad Mróz (`dziadMroz`), Mosiężny Pająk (`brassSpider`), Kozioł Taranowy (`ramGoat`), Sroka Złodziejka (`magpieThief`), Świstak Petardnik (`marmotPetard`). Opisy wyglądu: `docs/frakcje/<id>.md`. Herby `cards/crests/{herds,clans,free}.png` są zastępcze i nadal mają na obrazku stare nazwy frakcji (Dzikie Stada, Żelazne Klany, Wolne Kompanie): do wygenerowania na nowo razem z docelowymi herbami.


**Królestwo Umarłych (`undead`)** (paleta: kość, popiel, mech, wosk świec, stare srebro, rdza; poświata zielonkawo-żółta lub biała, nie niebieska; prompty bez słów *corpse, blood, kill*, raczej *ancient guardian, spectral, barrow*):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `barrowKing`, `lanternWraith`, `headlessKnight`, `bellKeeper` (4. bohater), `wardCaptain`, `spectralArcher`, `penitentMonk` (dowódcy), `skeletonSpear`, `willOWisp`, `penitentShade`, `skeletonArcher`, `scarecrow`, `hauntedArmor`, `vampire`, `viy`, `strzyga`, `lich`, `kostucha`, `boneDragon`;
- animacje 2D (`public/assets/jednostki/<folder>`, zestaw jak w `PRZEPIS_JEDNOSTKI.md`) dla tych samych 19; do czasu ich powstania w bitwie są żetony z portretami;
- herb `cards/crests/undead.png`: latarnia nad kopcem, stare srebro;
- ramki kart `cards/frames/undead_hero.png`, `undead_support.png` (dziś pożyczone z Przymierza w `UnitCard.tsx`);
- ikony 14 zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `barrowCall`, `dimLight`, `spectralCharge`, `bonesReturn`, `incorporeal`, `armorPierce`, `dread`, `hollow`, `wail`, `viyGaze`, `breathAgain`, `manaReap`, `graveBreath`, `toll` (dziś pożyczone w `ABILITY_ART` w `common.tsx`);
- arena cyfrowa `arena/cyfrowa/undead.webp` (kurhany we mgle, krzywe brzozy) i jej przeszkody: kurhany, brzozy, kamienne latarnie (dziś obrazy Przymierza w innym układzie, `WIDE_OBSTACLES.undead`);
- kafle ziemi Umarłych (wrzosowisko, kurhany, cmentarz), zakryty rewers `tiles/back_undead.jpg`, baza i skarbiec (dziś kafle Przymierza w `undead.ts`, pole `terrain`);
- osada: tło ziemi `osady/land_undead.jpg`, obrazy budynków Kurhan Wiecznej Warty (poziomy 1–4), Ossuarium (1–2), Dzwonnica Zaduszna oraz siedlisk 9 jednostek (dziś zdjęcia osady i budynków Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2–3 utwory: dzwony, chór bez słów, lira korbowa, cichy werbel).

**Dwór Wiecznego Szronu (`frost`)** (paleta: biel, srebro, perłowa szarość, zimne złoto, ciemna zieleń świerków, blady róż zorzy; lód biały i srebrny, bez niebieskiego w figurach; tło do wycinania #0000FF):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `marzanna`, `frostJarl`, `snowLynx`, `oldHailer` (4. bohater), `iceKnight`, `ermineHuntress`, `frostWitch` (dowódcy), `frostImp`, `ermine`, `courtPage`, `blizzardWitch`, `glacierYak`, `iceSentinel`, `frostSprite`, `youngGiant`, `dziadMroz`, `elderGiant`, `auroraSpirit`, `frostMammoth`;
- animacje 2D dla tych samych 19 (do czasu ich powstania żetony z portretami);
- herb `cards/crests/frost.png`: płatek śniegu w koronie; ramki kart `frost_hero.png`, `frost_support.png` (dziś pożyczone z Przymierza);
- ikony 13 zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `iceWall`, `iceBlow`, `blizzardTrail`, `frostSlow`, `crystalArrow`, `thickFur`, `frostArmor`, `bellOfGlass`, `frostGrip`, `beardChill` (Uścisk Mrozu; dawniej abduct), `hailStones`, `coldLight`, `longNight` (dziś pożyczone w `ABILITY_ART`);
- znaczniki szronu na figurach i na polach śladu Zamieci (dziś tylko odznaka statusu w panelu);
- arena cyfrowa `arena/cyfrowa/frost.webp` (zamarznięte jezioro, ośnieżone świerki, lodowe kolce) i jej przeszkody (dziś obrazy Przymierza i Hordy w innym układzie, `WIDE_OBSTACLES.frost`); obraz lodowej ściany (dziś `wall.webp`);
- kafle ziemi Dworu (śnieg, lód, zamarznięte jeziora), rewers `tiles/back_frost.jpg`, baza i skarbiec (dziś kafle Przymierza, pole `terrain`);
- osada: tło `osady/land_frost.jpg`, obrazy budynków Pałac Szronu (1-4), Kryształowa Grota (1-2), Wieża Zamieci (1-2) i siedlisk 9 jednostek (dziś Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2-3 utwory: dzwoneczki, wiolonczela, chór żeński, wiatr).

**Wolna Kompania (`free`)** (barwa frakcji: burgund `#6B1A33` na chorągwiach i proporcach; paleta: rude i brązowe futra, butelkowa zieleń płaszczy, skóra, mosiądz, len; zwierzoludzie w ubraniach, bez niebieskiego w figurach; tło do wycinania #0000FF):
- animacje 2D dla tych samych 19 (do czasu ich powstania żetony z portretami);
- znacznik sideł na polu areny (dziś kreskowany sześciokąt z krzyżykiem w SVG) i znacznik oznaczenia na figurze (dziś odznaka statusu);
- arena cyfrowa `arena/cyfrowa/free.webp` (leśny obóz przy zrujnowanym młynie, płoty, beczki) i jej przeszkody (dziś obrazy Przymierza i Hordy, `WIDE_OBSTACLES.free`);
- kafle ziemi Kompanii, rewers `tiles/back_free.jpg`, baza i skarbiec (dziś kafle Przymierza, pole `terrain`);

**Pustynne Cesarstwo (`sands`)** (paleta: piasek, ochra, terakota, złoto, kość słoniowa, zgaszony karmazyn, zieleń jadeitu zamiast turkusu i lapis lazuli; bez niebieskiego w figurach; tło do wycinania #0000FF; wygląd Bastii: `docs/frakcje/ZWIERZAKI_AUTORA.md`):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `djinnVizier`, `sphinxWarden`, `scorpionQueen`, `camelPrince` (4. bohater, biały wielbłąd, opis na karcie), `bastia`, `caravanArcher`, `desertAstrologer` (dowódcy), `jackalGuard`, `pharaohMongoose` (portret już jest z G3), `duneArcher`, `bedouinNomad` (człowiek pustyni w burnusie z szablą, bez konia), `cobra`, `mirageDancer`, `sandScorpion`, `ushabti`, `oasisCrocodile`, `lamassu`, `roc`, `sandWyrm` (portret już jest z G3);
- animacje 2D dla tych samych 19 (do czasu ich powstania żetony z portretami);
- herb `cards/crests/sands.png`: złote oko nad piramidą (dziś zastępczy, z napisem starej nazwy „Imperium Piasków”); ramki kart `sands_hero.png`, `sands_support.png` (dziś pożyczone z Przymierza);
- ikony 16 nowych zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `sandPortal`, `riddle`, `sandAmbush`, `napWatch`, `jackalWatch`, `venomImmune`, `coverShot`, `daggerThrow`, `hypnosis`, `mirageMake`, `awakening`, `gateWard`, `rocLift`, `wyrmBurrow`, `decoy` (znak mirażu dla właściciela), oraz pożyczone dziś `runOn`, `standShot`, `giftOfLife`, `poisonClaw`, `grab`;
- znacznik mirażu na figurze widoczny tylko dla właściciela (dziś odznaka statusu „Miraż”), efekt rozwiania mirażu, znacznik zakopanej Królowej dla właściciela (dziś odznaka „Ukryty”);
- arena cyfrowa `arena/cyfrowa/sands.webp` (oaza z ruinami kolumn, wydmy, palmy) i jej przeszkody (dziś obrazy Przymierza i Hordy, `WIDE_OBSTACLES.sands`);
- kafle ziemi Cesarstwa (wydmy, oazy, ruiny), rewers `tiles/back_sands.jpg`, baza i skarbiec (dziś kafle Przymierza, pole `terrain`);
- osada: tło `osady/land_sands.jpg`, obrazy budynków Pałac Mirażu (1-4), Szlak Karawan (1-2), Brama Wydm i siedlisk 9 jednostek (dziś Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2-3 utwory: oud, darbuka, ney, chór na jednym tonie).

**Rój Puszczy (`swarm`)** (paleta: brąz, umbra, ochra, mech, kremowe blaszki, czerwień muchomora, bioluminescencja zielonożółta, fiolet tylko ciepły; bez obrzydliwości, chitynowe pancerze jak lakier; tło do wycinania #0000FF):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `mantisQueen`, `elderMycelium`, `goliathBeetle` (dwupolowy), `beeQueen` (4. bohater, lata), `beetleGuard`, `fireflyArcher`, `mushroomSeer` (dowódcy), `sporeling` (karta; portret już jest z G3), `soldierAnt`, `firefly`, `rootCaterpillar`, `dustMoth`, `mushroomGuard`, `bombardier`, `dragonfly`, `mycoMother`, `centipede`, `armoredSnail`, `emperorCicada` (karta; portret już jest z G3); do tego portret i figura **Motyla Korzennego** (gąsienica po przemianie, dziś ta sama figura z odznaką);
- animacje 2D dla tych samych 19 (do czasu ich powstania żetony z portretami);
- herb `cards/crests/swarm.png`: muchomor w kole z chrząszczy (dziś zastępczy); ramki kart `swarm_hero.png`, `swarm_support.png` (dziś pożyczone z Przymierza);
- ikony 12 nowych zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `lastCut`, `sleepSpores`, `chitinWall`, `puffball`, `anthill`, `metamorphosis`, `homeGround`, `airHunt`, `spreadSpores`, `coil`, `slimeTrail`, `greatChorus` (dziś pożyczone ikony innych zdolności, `ABILITY_ART` w `common.tsx`);
- grzybnia na arenie (dziś przerywany sześciokąt w kolorze mchu; docelowo nakładka z grzybnią i kapeluszami, wersja „własna” i „wroga”), efekt Wielkiego Chóru i przemiany w motyla;
- arena cyfrowa `arena/cyfrowa/swarm.webp` (grota pod korzeniami, grzyby wielkości drzew) i jej przeszkody (dziś martwe drzewa, głazy i jeżyny innych aren, `WIDE_OBSTACLES.swarm`);
- kafle ziemi Roju (grzybowe polany, kopce, korzenie), rewers `tiles/back_swarm.jpg`, baza i skarbiec (dziś kafle Przymierza, pole `terrain`);
- osada: tło `osady/land_swarm.jpg`, obrazy budynków Serce Grzybni (1-4), Ogród Grzybów (1-2), Podziemne Korytarze (1-2) i siedlisk 9 jednostek (dziś Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2-3 utwory: niski dron, klekot drewna, marimba, szept chóru).

## Przed premierą (decyzja autora 17.11: wchodzą przed Steamem; po punktach z kolejki)
28. **Nowe frakcje:** przeniesione do kolejki (punkty 51–55, decyzja autora 18.11).
30. **Wiele języków (PL + EN):** gra, instrukcja gracza, historia zmian i komunikaty serwera są po polsku i angielsku. **Decyzja autora 18.11:** wersja PDF/DOCX angielskiej instrukcji **odpuszczona na stałe**; grafiki z napisami: bez terminu; kolejne języki zaparkowane (Parking); na razie wystarczą PL i EN. Nazwy własne bohaterów i osad celowo po polsku.

## 3. Sprawdzenie na żywo
Wyczyszczone 17.11: autor sam sprawdza grę i zgłasza błędy (`make zgloszenia`); nie prowadzimy listy „do sprawdzenia”.

## 4. Parking (pomysły bez terminu)
- **Tajne ziarno dla ukrytych losowań (21.11, pomysł autora):** pomieszanie id miraży (Piaski) i Sideł (Kompanie) losuje się z `state.rng`, który jest w stanie wysyłanym graczom; kto odtworzy RNG z surowych danych, mógłby zgadnąć ukryte rzeczy. Serwer miałby trzymać osobne, tajne ziarno dla takich losowań. Wymaga zmiany serwera i silnika (dotyczy online), więc na razie zostaje jak jest.
- „Cios od tyłu / z flanki” dla innych jednostek.
- **Kolejne języki** poza PL i EN (nowy plik słownika `src/i18n/<kod>/` i test pokrycia): zaparkowane 18.11, na razie nie potrzeba.
- **PWA:** zostaje test na prawdziwych telefonach i, gdy będzie potrzeba, kontrola wersji protokołu z serwerem (service worker, manifest i podpowiedź instalacji są zrobione).
- **Capacitor** (opakowanie gry do Google Play i App Store, natywny push o ruchu w PvP): dopiero po PWA, gdy gra jest stabilna i wyważona, a autor chce dotrzeć do graczy przez sklepy. Koszty: Google Play 25 USD jednorazowo, Apple 99 USD rocznie (do iOS Mac albo build w chmurze), recenzje sklepów (polityka prywatności, usuwanie konta), zgodność starszych klientów ze sklepu z serwerem na Fly.io, testy WebGL w WebView. React Native odrzucony (przepisanie UI).

## 5. Balans: pasma i znane odchylenia

**Raport:** `make sim-raport` (np. `GAMES=100`) buduje `docs/BALANS_TABELE.html`: tabele wygranych Przymierza dla każdego poziomu gry, trudności, trybu i mapy (bez ustawień własnych); komórki poza pasmem mają inny kolor tła (czerwony poniżej, niebieski powyżej). Generuj od nowa po każdej zmianie liczb lub AI.

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciele: `scripts/sim/tuneLevels.ts`, `scripts/sim/tuneKingdom.ts` (Osada); tabele: `make sim-tabele`, `make sim-cele` (poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Do mierzenia gry cyfrowej: `SIM_DIGITAL=1 make sim-tabele` (i `SIM_GROWTH=1`); bez `SIM_DIGITAL` mierzy wydanie planszowe.
- Stan: Łatwy w paśmie w każdej komórce; Normalny w paśmie niemal wszędzie (z rozwojem poniżej pasma: kooperacja 39–44% na średniej, długiej i bardzo długiej, 2 na 2 długa 35%; Trudny w koopie 22–30%: ewentualnie `tuneLevels.ts <cel> 1`). Osada: Normalny 51–67%, Trudny koop 34–45%; cele inne niż „Kryształy” bez strojenia.
- Poza pasmem, zostawiamy (decyzja 10.11): Kryształy na ręcznych mapach (Cieśnina, Dolina), koop 2 graczy Normalny bardzo długa 75%, Artefakt i Boss z rozwojem na wyspach, Boss Trudny. Dźwignie stroiciela (skarby startowe, bohater Hordy) za grube; potrzebna nowa (liczba strażników lub kryształów).
- **Księstwo, cel „Podbój”** (15.11): Normalny 43–65% po strojeniu; poza pasmem kooperacja 1 gracz na bardzo długiej mapie (33–35%, dźwignie skarbów i limitu rund za słabe: potrzebna inna, np. słabsi obrońcy osad Hordy). Łatwy i Trudny dla Podboju niestrojone. Szturmy: garnizon 1–2 jednostek nie zatrzymuje bohatera, 3 jednostki bronią w połowie przypadków (`scripts/sim/siege.ts`).
- **Imperium, cel „Relikt”** (15.11): Normalny 43–72% po strojeniu; powyżej pasma 2 graczy na krótkiej mapie (72%) i bardzo długa mapa 2 graczy (70–72%). Łatwy i Trudny niestrojone.
- **Poziomy 4–6, wszystkie trudności** (16.11, `SIM_ECONOMY|REALM|EMPIRE=1 SIM_LEVEL=kids|normal|hard|veryhard SIM_DAWN_HUMAN=1 scripts/sim/kingdom.ts 60`, cel Kryształy, mapy S/M/L, 4 stoły; przy stołach PvP Przymierze to człowiek, a komputer ma przewagi poziomu; 60 gier na komórkę, błąd ok. ±6 pkt): zakres wygranych Przymierza w komórkach, bez dodatkowego strojenia:

| Poziom gry | Łatwy (65–85) | Normalny (45–65) | Trudny (30–45) | Bardzo trudny (15–30) |
|---|---|---|---|---|
| 4 Księstwo | 58–92 | 38–70 | 27–52 | 13–28 |
| 5 Królestwo | 63–92 | 47–62 | 27–53 | 12–28 |
| 6 Imperium | 58–87 | 47–68 | 27–60 | 15–43 |

  Odstępstwa (zostawione, decyzja 16.11 po limicie godziny na poziom): Normalny Księstwo średnia kooperacja 2 graczy 38%; Trudny powyżej pasma na krótkich mapach (48–60%) i w kooperacji 2 graczy na długiej (50–52%); Łatwy Księstwo/Królestwo poniżej 65% na kilku średnich i długich mapach (58–60%) i powyżej 85% na krótkiej mapie PvP 2 na 2 (92%); Bardzo trudny Imperium krótka koop 2 graczy 43%. Bardzo trudny (przewagi komputera: Życie +20%, dochód ×1,5, skarby +2) mieści się w paśmie 15–30% w większości komórek.
- Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL`, `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (`data.ts`), liczby artefaktów, obiektów, jednostek i bossów neutralnych, spotkań na mapie, progi botów, progi `levelOfFight`.
- Boty, zbadane i bez zmian: „bezczynne tury” w kontroli, przetrwaniu i artefakcie to trzymanie punktu, zgodnie z celem; „bezczynne aktywacje” w bitwie to wybór pozostania.

## 6. Decyzje obowiązujące (archiwum, 12–15.11.2026)

**Zakres:** premiera dopiero po poziomie 6; poziomy 3–6 wchodzą przed pakowaniem na Steam. Nowe frakcje, kampania i Ekspedycja po premierze. Odrzucone: machiny wojenne (poza katapultą), morale i szczęście, neutralni do przekonania, dyplomacja, mgła wojny, tereny, jednostki poziomów 7+, cykl tygodniowy.

**Poziom 3 (osady i złoto):**
- Waluta: tylko złoto, skala mała (najtańsza rzecz 1 zł, dochód osady 1–2 zł na rundę; ceny w całych złotych, stroić liczbą osad i cenami). Osady jednakowe: kopalnia 1, osada 2, osada ze skarbcem 3. Brak utraty złota po porażce.
- Gracze tej samej frakcji (też w rywalizacji) dzielą skarby, złoto i pomocników; kasa per frakcja.
- Osada ma narzuconą frakcję według połowy mapy; kto wejdzie, zostaje właścicielem (budynki i ulepszenia zostają). Właściciel innej frakcji ma dochód, targ i szpital, ale nie rekrutuje.
- Budynki trzeba kupić (koszary, targ, szpital, budynek dochodu). Szpital: ulepszenie = wskrzeszanie za 1/3 ceny jednostki zamiast 1/2.
- Okno osady jak w Heroes III: losowa unikalna nazwa pasująca do frakcji, krajobraz z grafikami budynków, klik w budynek otwiera funkcję.
- Rekrutacja bez kopii: jedna jednostka danego typu w armii (bez przebudowy na instancje). Neutralni nie są rekrutowani. 7 pomocników na frakcję (3 dawni = poziom 1, nowi poziomów 2–5), maks. 5 w drużynie, wspólni dla drużyny. Miejsca: start 2, +1 na 3. poziomie bohatera, +1 na 6., +1 z ulepszonych koszar.
- Cena jednostki z symulacji (użyteczność w walce), bez limitu zakupów na turę.
- Nagrody: złoto tylko z osad, kopalń i skrzyń (w skrzyni wybór: artefakt albo złoto; ilość zależy od poziomu skrzyni); strażnicy i spotkania dają skarby jak na poziomie 2; walka z bohaterem wroga: nic. Kopalnie złota: +1 na rundę (właściciel: patrz decyzje poziomu 4).
- Obrońcy osad: neutralni trochę silniejsi niż strażnicy kryształów. Obrona: tylko stanie na kafelku (wrogi bohater na pustej osadzie przejmuje ją bez walki).
- Liczba osad: 2 / 4 / 4 / 6 (krótka / średnia / długa / bardzo długa), parzyste, po równo na połowę; dobór końcowy symulacjami.
- Cel „Podbój” dopiero na poziomie 4. Automat zła w koopie: posiłki co kilka rund, realnie groźne.
- Strojenie: długie symulacje w tle, do rozmowy tylko skrót. Ruch klient–serwer oszczędny (punkt 3).
- Nowi pomocnicy zaakceptowani 13.11 (Przymierze: Jeżozwierz, Centaur, Alabastrowy Odyniec, Opiekun Drzewa; Horda: Szczurołak, Piekielny Ogar, Salamandra Popiołu, Herszt Minotaurów). Tryb roguelike nazywa się „Ekspedycja”.

**Poziom 4, decyzje z 15.11 (wieczór):**
- Zakres dnia: punkty 1–3 i 4a/4b; bez pushu, bez wdrożenia serwera, bez tagów. Liczby poziomu 4 ustala Claude i stroi symulacjami (maks. ok. godziny na poziom; jeśli dalej poza pasmem, zapis w sekcji 6 i idziemy dalej).
- Surowce (projekt Claude'a do korekty): drewno i ruda płacą za budynki i ulepszenia, złoto za jednostki, Gwiezdny Pył tylko za rzadkie rzeczy (legendarne artefakty na targu, drugi poziom ulepszeń); wspólne na frakcję jak złoto.
- **Kopalnie złota i surowców (zmiana względem poziomu 3):** kto wejdzie, zostaje właścicielem na stałe (jak osady), dopóki ktoś inny nie przejmie; flagi właściciela na mapie. Przejęcie bez walki, chyba że na kafelku kopalni stoi jej aktualny właściciel.
- Chatki: gracz **przynosi złoto, surowce lub artefakt**; nagroda: złoto, surowce, artefakt lub doświadczenie (jedno zadanie na chatkę, raz na grę).
- Grafika: budżet Scenario 566 kredytów na miesiąc, można wykorzystać całość (limit kredytów na polecenie z początku tego pliku nie obowiązywał tego dnia).

**Podział poziomów 4–6 (15.11):** na 4 gospodarka i osady, na 5 bohaterowie i magia, na 6 frakcje i Relikt: wyrównana liczba i złożoność nowości dla gracza.

## 7. Decyzje podjęte przez Claude'a (przejrzane przez autora 17.11)

Autor przejrzał listę 1–29 (17.11). Zaakceptowane bez zmian: 2, 3, 4, 6, 7, 9, 10, 13, 16, 17, 19, 20, 21 (strojenie per komórka musi zostać), 22–27, 29; 5 (z dopisaniem „więcej czarów”, punkt 33); 8 i 11 zmienione (punkty 34 i 37); 1 zmienione (punkt 32); 12 nieaktualne (serwer 0.2.0 jest już wypchnięty i wdrożony); 14 zmienione (punkt 35); 15 zmienione (punkt 36); 18 i 28 zmienione (punkt 38: grafiki ze Scenario).
Nowe wpisy dopisuj na końcu z datą i numerem punktu:
1. **(17.11, Zwój Teleportacji)** Boty używają Zwoju: skok do pola obok sojusznika przyciśniętego przez silniejszego wroga lub przynajmniej dwóch (ratunek), albo, gdy nikogo nie da się uderzyć w tej turze, skok przybliżający o co najmniej 3 pola do wroga. Nie używa go automat kooperacji (trzyma się listy z instrukcji). Wartość w dobieraniu skarbów w arenie: 3. Zmiana przesunęła `golden` (osobny commit z `-u`).
2. **(17.11, Łatwy w wydaniu planszowym)** Zostaje „jak wydrukowany” (94/91/88/79% 1 na 1); dźwignie stroiciela tylko w grze cyfrowej (decyzja autora).
3. **(17.11, garnizony i budynek obronny osady)** Skreślone z parkingu: jeśli przejmowanie będzie za łatwe, autor zgłosi propozycję.
4. **(17.11, punkt 32)** Garnizon bez bohatera: dowodzi gracz-właściciel wg `garrisonCommander` (tura wstecz od bieżącej, człowiek przed botem). Zmiana: funkcja `garrisonCommander` w `game.ts`.
5. **(17.11, punkt 34)** Przekazanie Odłamków: `passArtifact` z `artifactId: 'shards'` przekazuje wszystkie Odłamki bohatera (nie po jednym).
6. **(17.11, punkt 36)** Arena, Bardzo trudny: 5 pkt (3 × 1,5 zaokrąglone w górę); mapy: Trudny × 1,5 z limitem `MAX_POINTS`; serwer liczy z wydanego silnika, więc zmiana dojdzie z wydaniem gry.
7. **(17.11, punkt 35)** Bardzo trudny: bez bonusu Życia (usunięte `computerHp`, `applyComputerHp`). Przewagi komputera: `computerResources` +3 drewna, +3 rudy, +2 Pyłu na starcie, `computerArtifacts` 2 artefakty (rzadkość 1–2) dla głównego bohatera, `computerGold` 1,5, `computerTreasures` 2 (stałe w `COMPUTER_HANDICAP`). Pomiar 40 gier: poziom 4 koop 18–30%, poziom 6 koop 18–38% (pasmo 15–30%, na krótkich mapach lekko powyżej). Arena na razie bez przewagi poza „bez błędów” (jak Trudny): punkt 48.
8. **(17.11, punkt 33)** Podział kręgów: I (5): Magiczny Pocisk, Leczenie, Spowolnienie, Wizja, Przyspieszenie; II (4): Kamienna Skóra, Kula Ognia, Zryw, Wrota; III (4): Grom (5 obr. + 2 na skok), Klątwa (−1 A), Tarcza, Natchnienie (+2 A). Koszt Arcywieży 11 zł + 4 rudy + 4 Pyły, nauka III kręgu 8 zł + 2 Pyły (stałe w `magic.ts`, `economy.ts`).
9. **(17.11, punkt 40)** Własne ustawienia: strona zaraz po karcie, z domyślnymi wartościami poziomu Normalny; zależne od trybu przełączniki na stronie graczy. Dodane pola: warstwa (`layer`), ruch bohatera, limit rund bitwy, posiłki Hordy. Pominięte (do dopisania, jeśli autor zechce): rytuał i jego rundy, skarby startowe obu stron, bonus złota, bonus limitu rund, skala liczb, zasłanianie strzału, przewagi komputera. Online (serwer): nowe pola wymagają wydania gry i aktualizacji silnika w serwerze, więc zmian w backendzie na razie nie ma.

## 8. Kredyty Scenario

**Ceny z faktur:** dźwięk (ElevenLabs SFX) 1 CU; obraz Flare `medium` 3 CU, `high` 14 CU; wideo P-Video 2 po 5 CU za sekundę (klip 3 s = 15 CU); muzyka ok. 30 CU za utwór. Zablokowane i nieudane klipy też kosztują (licz ok. 40% zapasu). Plan pozwala na 10 zadań równolegle; wywołania wymagają jawnych `team_id` i `project_id`. Koszt jednej pełnej frakcji z 19 postaciami: ok. 1 550–2 000 CU.

**Korekta szacunku (23.11.2026, po Dzikim Stadzie):** tabela wyżej liczyła 10 postaci (stary układ); frakcja ma **19 postaci** (4 bohaterów, 3 dowódców, 3 jednostki tieru 1, po 2 jednostki tierów 2–5, legenda). Rzeczywisty koszt Stada: ok. 1 850–2 100 CU (sprite'y 19 jednostek ok. 1 500, osada, arena i kafle ok. 210, herb i ikony ok. 50, muzyka ok. 60, karty 19 × 3 CU), więc **liczyć ok. 2 000 CU na frakcję**. Karta i portret jednostki to jeden obraz Flare `medium` 1008×704 za 3 CU (zob. `scripts/assets/herds_cards.py`); drogie są klipy wideo (P-Video 2).
**Plan 23.11.2026 (autor):** do odnowienia kredytów gra ma najwyżej 5 frakcji z pełną grafiką: Przymierze, Horda, Dzikie Stado + **Żelazny Klan** i **Bractwo Przypływu** (dobrane pod różnorodność klimatu). Saldo przed startem: 5 685 CU. Karty obu nowych frakcji (38 obrazów) wygenerowane 23.11, ok. 120 CU (źródła w `.tmp/zrodla/clans_cards`, `.tmp/zrodla/tides_cards`, identyfikatory zasobów w `.tmp/zrodla/cards_assets.json`); czekają na akceptację autora. Limit Scenario: 10 zadań równolegle (plan cu-max); wywołania wymagają jawnych `team_id` i `project_id`.
**Stan 24.11:** Bractwo Przypływu i Żelazny Klan mają komplet grafik G4, muzykę (2 utwory) i dźwięki jednostek; dźwięki ataku i śmierci ma też Dzikie Stado. Zużycie z faktur Scenario: 13 780 CU w 31 dni; po 23.11 saldo ok. 2 580 CU (szacunek z 5 685 CU na starcie; ok. 1 550 CU na frakcję). Sprawdzone 24.11: areny z przeszkodami obu frakcji w bitwie, Runiczna Kuźnia z nowymi ikonami. Nie sprawdzone przez autora: dźwięki w bitwie, siedliska i budynki unikalne (od poziomu 6). Co zostało do zrobienia (efekty mechanik, poprawki animacji, uwagi autora z 24.11): punkty 64–86 w sekcji 1.

**Wydatki 25.11:** Przypływy (uwagi autora) ok. 334 CU; tło osady Hordy 3 CU; mury i fosa pięciu frakcji 30 CU; śmierć Wojownika Klanu 9 CU; **Wolna Kompania G4 bez animacji 292 CU** (karty i portrety 58, ikony zdolności 39, osada 93, herb 4, muzyka 60, dźwięki jednostek 38). Saldo podane przez autora przed Kompanią: 1 128 CU, po niej ok. 836 CU. **26.11:** poprawki kart Kompanii po uwagach autora (Kruk, Waran, Kocur) 10 CU; trzy próbne tła osady Kompanii (rozlewisko, jar, opactwo; `.tmp/zrodla/free_settlement/land_*.png`, zrzuty `.tmp/osada_free_*.jpg`) 13 CU, czekają na wybór autora; saldo ok. 813 CU. Kompanii zostały: animacje 19 postaci (autor wstrzymał), arena z przeszkodami i kafle mapy (ok. 80 CU), znaczniki sideł i oznaczenia.
**Wydatki 17.11 (nocne zadanie):** ikony 5 czarów kręgu III i Przyspieszenia 7 CU; efekty 5 czarów (obraz 3 + klip 10 CU) 65 CU; medale poziomów Wyprawa, Osada, Księstwo 7 CU. Ozdobniki okien (narożnik ramki, tło Księgi czarów, tło skrzyni; po 2 warianty, jakość medium) 18 CU. Rada Osady (2 frakcje, po 2 warianty) 12 CU. Budynki frakcji poziomu 6 (6 obrazów po 2 warianty) 36 CU. Razem 145 CU.

Wpisy autora z 17.11 (wieczór):
- **(17.11, czary)** Trzy kręgi, ulepszanie Wieży maga otwiera wyższy krąg; docelowo pięć (punkt 33).
- **(17.11, arena i Bardzo trudny)** Bot bez błędów na arenie; arena z elementami nowych poziomów, walka 6 na 6, dźwignie: więcej czarów/many/artefaktów bota albo mniej pomocników gracza (punkt 48).
- **(17.11, budynki)** Nowy budynek „Rada Osady”. Koszary uznane za mało przydatne: dokument `docs/BUDYNKI.md` z obecnymi i proponowanymi budynkami; autor na jego podstawie ustala zależności (punkt 37, zakres 3).
8. **(17.11, punkt 47)** Małe chipy kolejki w bitwie zostają bez zmian (podgląd, opis po dotknięciu); nie przeprojektowuję paska bez testu na prawdziwym telefonie.
9. **(17.11, balans poziomów 4–6)** Trudny, cel Kryształy: wpisy w `tuning.ts` (kingdom, Trudny): krótkie mapy PvP 3 skarby Hordy, krótka koop 2 graczy 4 skarby, średnie i długie PvP 1 skarb. Pomiar 100 gier na komórkę (`.tmp/lv.sh` ze `scripts/sim/kingdom.ts`): Trudny 31–52% (przed: 23–53%, krótkie mapy 48–53%); Łatwy 63–86%, Normalny 42–71% bez zmian. Pozostałe odstępstwa z sekcji 5 zostają (komórki w granicy błędu ±5 pkt).
10. **(17.11, balans Podbój i Relikt)** Normalny: wpisy w `tuning.ts` dla Podboju na bardzo długiej mapie i Reliktu na krótkiej (koop 2 i PvP 2) oraz bardzo długiej (koop 2): Relikt 2 graczy krótka 72→67/59%, bardzo długa 75→65%, Podbój bardzo długa koop 2 69→62%. Dalej poza pasmem: Podbój, koop 1 gracz, bardzo długa mapa (33–34%; dźwignie skarbów i limitu rund nie działają, potrzebna inna, np. słabsi obrońcy osad Hordy).
