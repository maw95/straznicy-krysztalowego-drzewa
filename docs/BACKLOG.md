# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Plan wydania: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`. Mechaniki według poziomów: `MECHANIKI_I_POZIOMY.md`.

**Jak z tego korzystać:** autor pisze „zrób punkty 2, 3, 5”, a Claude pracuje sam, aż skończy. „Zrób wszystko” = idź po numerach od góry. Każdy punkt ma numer (stały, żeby dało się go przywoływać), warunek ukończenia i rozmiar (S ≈ godzina, M ≈ kilka godzin, L ≈ dzień+).

## Stan (15.11.2026, wieczór)

Wydane: **2.7.0** (14.11, poziom 3 „Osada”). Niewydane, zrobione lokalnie w masterze: poziom 0 „Spacer”, Łatwy na arenie, bot-kupiec, Królestwo w rankingu, a 15.11 w jednej sesji **poziomy 4, 5 i 6 w całości** (Księstwo: Kuźnia, wymiana surowców, młyn/składnica/studnia, garnizon, fosa i mury z katapultą, cel Podbój, autopilot warstw; Królestwo: drugi bohater, magia, typy i specjalności, rozgałęzienia umiejętności; Imperium: Relikt, mechaniki i drzewka frakcji, jednostki legendarne i alternatywne z siedliskami). `make check` zielone (490 testów). **Nic nie wypchnięte** (push gry robi tylko autor). Repo serwera: commit z poziomami 5–6, celami i nowymi akcjami, **niewypchnięty i niewdrożony** (czeka na wydanie gry).

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids`, `economy`, `realm`, `empire`) i w rankingu online zostają.

## 1. Kolejka prac (w tej kolejności)

### Etap A. Domknięcie poziomów 0–3 (przed budową poziomu 4)
4. **Wdrożenie serwera przy następnym wydaniu** (S, razem z wydaniem): repo backendu ma niewdrożony commit z rankingiem; poziom 0 i Łatwy na arenie zmieniają znaczenie `kids` (stary klient dostałby arenę zamiast pojedynków).

### Etapy B, C, D. Poziomy 4–6: zbudowane 15.11
Opis zasad: `ZASADY_CYFROWE.md` (sekcje „Poziom 4”, „Poziom 5”, „Poziom 6”) i rozdziały 18–20 instrukcji. Zostaje z nich:
10. **Decyzje autora do poziomów 4–6** (S, autor): lista w sekcji 8.
11. **Strojenie Łatwego i Trudnego dla poziomów 4–6 i celów Podbój i Relikt** (M): dziś strojony tylko Normalny (pasma i odchylenia w sekcji 6); potrzebne przebiegi stroiciela z regułami `economy`, `realm`, `empire`.
12. **Animacje 16 jednostek poziomów 5–6 i efekty czarów, oblężenia i Reliktu** (L, grafika): lista w sekcji 2a.
14. **Ranking dla poziomów 5–6** (S): dziś liczone jak poziom 4 (`ECONOMY_POINTS_FACTOR`); zmierzyć i ewentualnie dodać własne mnożniki.

### Etap E. Przed premierą
18. **Premiera na Steamie** (L, głównie autor): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery do ustalenia (dawne „3.0” traci sens).

### Po premierze
19. Nowe frakcje: Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Przed startem: próbka jednej jednostki w nowym stylu i decyzja autora.
20. Kampania fabularna (mapy ręczne są; fabuła przez wyzwalacze) i Ekspedycja (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
21. Wiele języków (PL + EN: interfejs, dane, instrukcja, CHANGELOG, serwer). Spis tekstów i trudności: `TEKSTY_DO_TLUMACZENIA.md` (ok. 1300 napisów i 71 tys. znaków w kodzie, plus instrukcja i serwer).
22. Więcej niż 6 graczy (do 8), „cios od tyłu / z flanki” dla innych jednostek.

### Dodatkowe prace przed premierą (zgłoszone 16.11.2026, przed punktem 18)
23. **Poziom trudności jako przewaga komputerowych przeciwników, w każdym trybie gry** (M–L, kod + strojenie): w każdym trybie (kooperacja, rywalizacja, pojedynki, arena, każdy poziom i cel) gracz wybiera Łatwy, Normalny, Trudny albo Bardzo trudny (punkt 24), a od wyboru zależy, jakie warunki mają **gracze komputerowi** (Horda w kooperacji, boty w rywalizacji i w pojedynkach):
    - **Łatwy** — komputer ma utrudnienia (np. słabsze statystyki lub mniej jednostek, mniej skarbów i zasobów, wolniejszy rozwój, gorsze decyzje bota);
    - **Normalny** — komputer ma **dokładnie takie same warunki jak żywy gracz** (bez bonusów i kar; to wzorzec odniesienia);
    - **Trudny** — komputer ma ułatwienia (np. więcej skarbów i zasobów, szybszy rozwój, bonus do statystyk, lepsze decyzje bota);
    - **Bardzo trudny** — większe ułatwienia niż Trudny (punkt 24).
    Do ustalenia przy pracy: konkretne dźwignie utrudnień i ułatwień (jedna wspólna lista dla wszystkich trybów zamiast dźwigni per tryb) oraz co dziś robi Łatwy/Trudny w trybach, w których wyboru jeszcze nie ma. Dziś poziomy trudności są strojone osobno dla każdej komórki tabeli (dźwignie w `tuning.ts`, pasma w sekcji 6), a Normalny nie zawsze oznacza równe warunki: ta pozycja ma to ujednolicić. Warunek ukończenia: wybór poziomu w każdym trybie w UI i online, równe warunki na Normalnym potwierdzone testem, `make sim-tabele` w pasmach z sekcji 6, ranking uwzględnia poziom (`golden.test.ts` aktualizować tylko świadomie, z adnotacją w commicie).
24. **Czwarty poziom trudności „Bardzo trudny” i nowe ikony poziomów** (M, kod + grafika; razem z punktem 23, bo to on określa dźwignie):
    - Czwarty poziom ponad Trudnym: nowa wartość poziomu w silniku, tabele strojenia (`tuning.ts`, pasmo do ustalenia przez autora, poniżej 30% wygranych Przymierza), ranking i serwer online.
    - **Ikony jednokolorowe, rysowane jako SVG** (komponent zamiast obrazków `krolik`/`wilk`/`smok` używanych dziś w `NewGameWizard.tsx`, `LEVEL_ANIMAL`): kolor z CSS (`currentColor`), skalują się bez utraty jakości. Smok zarezerwowany dla Bardzo trudnego; króliku i wilkowi zostają Łatwy i Normalny; nowa ikona dla Trudnego pośrednia między wilkiem a smokiem (propozycje do wyboru przez autora).
    - **Układ przycisków poziomu trudności:** ikona w górnym wierszu, nazwa pod nią (jak litery S, M… przy wyborze wielkości mapy), dzięki czemu ikony mogą być większe. Sprawdzić w przeglądarce na telefonie i na desktopie (`make zrzut`).
    - Warunek ukończenia: cztery ikony w kreatorze nowej gry, ekranie online i wszędzie, gdzie dziś widać zwierzę poziomu; instrukcja (`INSTRUKCJA.md`) i CHANGELOG opisują czwarty poziom.

### Zgłoszenia z gry „Zgłoś błąd” (14–16.11.2026; opisy autora, do przeanalizowania przed wzięciem się do pracy)
Pliki: `bug-reports/2026-11-16-*-ziarno-550163.json` i `-ziarno-143502.json`, `2026-11-14-*-serwer-7.json`, `2026-11-14-06-25-08-ziarno-111824.json`. Zgłoszenia o Krakenie i Pegazie z 12.11 są już w sekcji 3.
25. **Mapa przygody: informacje o obiektach i zdobyczach** (M):
    - prawy klik na kafelku z obiektem (np. składnica drewna) ma pokazać, że obiekt tam jest, a nie tylko typ kafelka i koszt ruchu;
    - po zebraniu zasobów bohater pokazuje, co zyskał (napis przy portrecie albo obok niego), z dźwiękiem;
    - kopalnia przejęta przez gracza ma pokazywać właściciela (herb jego frakcji nad ikoną kopalni);
    - „podobno mam 2 kopalnie, ale nie widzę ich na mapie” (14.11, ziarno 111824): sprawdzić, czy to błąd (kopalnia poza widokiem lub pod mgłą, zły licznik), czy brak oznaczenia właściciela z poprzedniej pozycji.
26. **Okno „Wyposażenie i plecak”: prawy klik na artefakcie** otwiera okienko z jego opisem (S).
27. **Targ: wymiana surowców** (M): dziś tylko kupno surowców za złoto; brak sprzedaży za złoto i wymiany surowiec za surowiec. Sprawdzić zgodność z wymianą surowców z poziomu 4 (jest w kodzie) i ustalić, czemu targ jej nie daje; ceny stroić tak, by nie psuły ekonomii.
28. **Arena: czary** (M):
    - ikona „Magia” obok „Skarbów” w prawym dolnym rogu; po kliknięciu okno ze wszystkimi czarami, czary bez wystarczającej many wyszarzone (zastępuje dzisiejszy sposób wyboru czaru);
    - przy wyborze celu czaru nie pokazywać zasięgu aktywnej jednostki, tylko zaznaczyć możliwe cele czaru, a po najechaniu na cel pokazać ikonę różdżki jako kursor.
29. **Arena: zasięg jednostek 2-heksowych jest błędny — błąd** (M): Czarny Smok stanął poza podświetlonym (niebieskim i czerwonym) polem zasięgu Złotego Smoka, a ten mimo to go zaatakował. Odtworzyć w `ziarno-550163` (ostatni plik z 16.11 10:24), sprawdzić, czy to silnik (zasięg liczony od drugiego heksa), czy tylko podświetlenie w `ArenaBoard`/`arenaGeometry.ts`; dopisać test.
30. **Arena: usunąć licznik zasobów z dolnego paska podczas walki** (S, serwer-7, 14.11): licznik jest niepotrzebny w bitwie, a jego ramka wygląda źle; pasek surowców zostaje na mapie przygody.

## 2. Grafika i prezentacja (do wzięcia, gdy autor zdecyduje)
- [ ] **Ozdobne narożniki ramek** nie pasują do ramki: narożniki jako osobne elementy (9-slice / `border-image`), generowane razem z ramką w Scenario, albo prostsze narożniki w CSS/SVG (wymaga decyzji o stylu).
- [ ] **Okładka do druku** (`docs/grafika/okladka/okladka.png`, `ui/cover.jpg`): ma stare logo wypalone u góry (w grze niewidoczne, na wydruku tak). Wygenerować bez logo i nałożyć nowe (`ui/logo.png`), potem `python3 scripts/assets/menu.py` i `druk.py`.
- [ ] Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- [ ] Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam (autor).

## 2a. Grafiki i dźwięki do wygenerowania i podmiany (placeholdery)

Lista rzeczy, które w grze działają na zastępczej grafice albo bez własnej animacji czy dźwięku (stan po 15.11.2026). Po wygenerowaniu podmienić plik i dopisać wpis w `assets.json`. Kredyty Scenario nie skończyły się: lista obejmuje to, co jest za drogie na jeden arkusz (animacje) albo wymaga decyzji autora.

**Animacje jednostek (największa pozycja; potok: `docs/POTOK_ANIMACJI.md`, wpis w `src/ui/sprites.ts`)**
Te jednostki mają ilustrację karty, portret i **statyczną figurkę** (`stoi.webp` i `martwy.webp` w `public/assets/jednostki/<folder>/`, zrobione skryptem `scripts/assets/figurki_statyczne.py`; `anim.json` ma pustą listę klipów i znacznik `"static": true`). Na arenie postać stoi i przesuwa się bez animacji, cios trafia od razu, trafienie to drgnięcie, a po śmierci leży obrócona i przyciemniona kopia figurki. **Do wygenerowania dla każdej:** klipy `chod` (albo `wzbicie` i `lot` dla latających), `atak`, `trafienie`, `smierc`, prawdziwy `martwy.webp`, oraz dźwięki `dzwieki/jednostki/<id>_atak.mp3` i `_smierc.mp3` (po dodaniu wpisać id do `UNIT_SOUNDS` w `src/ui/sfx.ts`):
- poziom 5, dowódcy (6): `dawnKnight` Rycerz Świtu (`rycerz_switu`), `dawnHuntress` Łowczyni Gaju (`lowczyni_gaju`), `dawnSage` Mędrzec Gaju (`medrzec_gaju`), `hordeWarlord` Wódz Hordy (`wodz_hordy`), `hordeCrossbow` Kapitan Kuszników (`kapitan_kusznikow`), `hordeShadow` Szaman Cieni (`szaman_cieni`);
- poziom 6, jednostki legendarne (2): `dawnPhoenix` Feniks Świtu (`feniks_switu`; dodatkowo klip `odrodzenie`), `doomBehemoth` Behemot Zagłady (`behemot_zaglady`);
- poziom 6, jednostki alternatywne (8): `silverFox` Srebrny Lis (`srebrny_lis`), `dawnOwl` Sowa Świtu (`sowa_switu`), `dryadArcher` Driada Łuczniczka (`driada_luczniczka`), `whiteStag` Biały Jeleń (`bialy_jelen`), `goblinSlinger` Goblin Procarz (`goblin_procarz`), `gargoyle` Gargulec (`gargulec`), `caveTroll` Troll Jaskiniowy (`troll_jaskiniowy`), `shadowWyvern` Wiwerna Cienia (`wiwerna_cienia`).
Na mapie przygody dowódcy stoją jako żetony z portretem (figurki 3D mają tylko bohaterowie główni): do decyzji, czy robić modele.

**Efekty na arenie i mapie (dziś widać tylko skutek i wpis w dzienniku)**
- Czary bitewne: pocisk lecący do celu (`czar_bolt`), poświata leczenia (`czar_mend`), łańcuchy spowolnienia (`czar_slow`), kamienna powłoka (`czar_stoneskin`), wybuch na polu celu i sąsiadach (`czar_fireball`), złote smugi (`czar_haste`) w `public/assets/efekty/`; dane do odtworzenia są w `BattleState.spells`. Dźwięk jest (`magic_cast`, `magic_attack`).
- Czary mapy: odkrycie pól przy Wizji i błysk portalu przy Wrotach (dźwięk `portal.mp3` jest).
- Oblężenie: lot kamienia z katapulty i rozsypanie muru, strzała z wieżyczki do celu, ukłucie fosy (dźwięki `catapult.mp3`, `tower_shot.mp3`, `moat.mp3` są).
- Poziom 6: błysk przy podniesieniu Odłamka i wzniesieniu Pierwotnej Iskry (dźwięki `shard_pickup.mp3`, `spark.mp3` są); efekty mechanik frakcji `efekty/blask_switu` i `efekty/zadza_krwi`; efekt odrodzenia Feniksa.

**Ikony i obrazki zastępcze**
- Zdolność Feniksa „Odrodzenie z Popiołów” (`rebirth`) pożycza ikonę Daru Życia (`cards/abilities/giftOfLife.png`, mapowanie `ABILITY_ART` w `src/ui/common.tsx`); potrzebne `cards/abilities/rebirth.png` i `rebirth_inner.png` w ramce ikon zdolności.
- Trzy stopnie drzewka każdej frakcji nie mają ikon (sam tekst w oknie osady); mechaniki mają (`ikony/frakcje/blask_switu.webp`, `zadza_krwi.webp`).
- Siedliska jednostek (16 nazw w `DWELLING_NAMES`) mają jedną wspólną ikonę (`ikony/frakcje/siedlisko.webp`) i nie stoją w krajobrazie osady; do rozważenia osobne budynki.
- Elementy oblężenia (`arena/oblezenie/`) są neutralne (szary kamień) dla obu frakcji; do rozważenia wersje frakcyjne.
- Wymiana surowców i garnizon grają dźwięk monet `coins_buy.mp3` (do zostawienia albo własny).

**Dźwięki wygenerowane 15.11 bez odsłuchu** (Claude nie ma jak ich odsłuchać: autor powinien je przesłuchać i ewentualnie wymienić): `catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3` w `public/assets/dzwieki/`.

## 3. Do sprawdzenia na żywo (autor)
Zrobione i przetestowane, bez potwierdzenia w prawdziwej grze:
- **Poziomy 4–6 (15.11, cała sesja):** sprawdzone testami silnika i skryptami klikającymi w przeglądarce (`scripts/browser/kuznia.ts`, `chatka.ts`, `oblezenie.ts`, `karczma.ts`, `czary.ts`, `relikt.ts`), nie w pełnej partii człowieka. Do ogrania: szturm murów (czy katapulta i fosa są czytelne), garnizon, Podbój, tura dowódcy, pasek czarów w bitwie (na telefonie jest przyklejony nad paskiem aktywacji: nie sprawdzałem w widoku telefonu), okno osady z 9 budynkami i drzewkiem frakcji (przewija się), Relikt, siedliska, statyczne figurki nowych jednostek, nowe dźwięki (nieodsłuchane). Stoły online poziomów 5–6: tylko typy i testy serwera, bez gry na żywo.
- **Poziom 4 (15.11):** surowce w dolnym pasku, ceny z surowcami w oknie osady, ikony tartaku, kopalni rudy, źródła Pyłu i chatki, panel zadania chatki (nie sprawdzony kliknięciem), karta „Księstwo” w kreatorze, samouczek.
- **Poziom 3:** widok osady z budynkami obu frakcji, dźwięki zakupu, animacje i portrety 8 pomocników (sprite'y bez klipu śmierci), ikony zestawów artefaktów i licznik „2/3 zestawu”, samouczek, autopilot dziecka, zapisy online, szósty gracz. Nowe 15.11: poziom 0, Łatwy na arenie, bot-kupiec.
- Kraken (czy groźny, ale uczciwy; czy sześć jednostek mieści się na arenie) i Pegaz.
- Klikalność jednostek zasłoniętych (Pegaz kontra Hydra, partia 114857, akcja 60; poprawka `behind` w `ArenaBoard.tsx`).
- Błysk zakrytych kafelków (`fog-drift`); kursor ataku na wszystkich heksach jednostki; zwłoki (`CORPSE_MAX_W` w `sprites.ts`); rzut Cyklopa (śmierć zaczyna się przed lądowaniem); kolejka stanów online (`usePresentation.ts`).
- Rozmiar Czarnego Smoka, figurki Szamana, Nietoperza, Jednorożca.

## 4. Parking (pomysły bez terminu)
- Pierwsza strona instrukcji planszowej: imienna wiadomość autora (pisze autor).
- Kąt kamery i wielkość figurek 3D (autor, po obejrzeniu na żywo).
- Zwój Teleportacji jest nieużywany przez boty (35 z 35): potrzebuje pomysłu (ratowanie strzelca, skok za linię wroga).
- Garnizony i budynek obronny osady do rozważenia po strojeniu (jeśli przejmowanie okaże się za łatwe; częściowo pokrywa 4c).
- Łatwy w wydaniu planszowym (94/91/88/79% 1 na 1): domyślnie zostawiony „jak wydrukowany”; dźwignie stroiciela tylko w grze cyfrowej.

## 5. Zasady pracy bez nadzoru (decyzje autora, 12.11.2026)
- Jeden punkt = jeden lub kilka commitów, każdy z wpisem w CHANGELOG.md i `make check` przed commitem; bez pushu gry. Zmiana AI albo liczb przesuwa `golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie.
- Grafiki i dźwięki: Claude robi je sam (Scenario/ElevenLabs), ogląda/odsłuchuje, wybiera, wrzuca do repo z wpisem w `assets.json`. Jeśli jeden punkt wymaga więcej niż ok. 30 generacji, kończy to, co ma, i pyta.
- Gdy trzeba decyzji autora, Claude nie zgaduje: dopisuje pytanie do sekcji 8, robi następny punkt i wraca po odpowiedzi.
- Po skończeniu: dźwięk `complete.oga`, krótkie podsumowanie po polsku, uwaga o `/clear`.

## 6. Balans: pasma i znane odchylenia

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciele: `scripts/sim/tuneLevels.ts`, `scripts/sim/tuneKingdom.ts` (Osada); tabele: `make sim-tabele`, `make sim-cele` (poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Do mierzenia gry cyfrowej: `SIM_DIGITAL=1 make sim-tabele` (i `SIM_GROWTH=1`); bez `SIM_DIGITAL` mierzy wydanie planszowe.
- Stan: Łatwy w paśmie w każdej komórce; Normalny w paśmie niemal wszędzie (z rozwojem poniżej pasma: kooperacja 39–44% na średniej, długiej i bardzo długiej, 2 na 2 długa 35%; Trudny w koopie 22–30%: ewentualnie `tuneLevels.ts <cel> 1`). Osada: Normalny 51–67%, Trudny koop 34–45%; cele inne niż „Kryształy” bez strojenia.
- Poza pasmem, zostawiamy (decyzja 10.11): Kryształy na ręcznych mapach (Cieśnina, Dolina), koop 2 graczy Normalny bardzo długa 75%, Artefakt i Boss z rozwojem na wyspach, Boss Trudny. Dźwignie stroiciela (skarby startowe, bohater Hordy) za grube; potrzebna nowa (liczba strażników lub kryształów).
- **Księstwo, cel „Podbój”** (15.11): Normalny 43–65% po strojeniu; poza pasmem kooperacja 1 gracz na bardzo długiej mapie (33–35%, dźwignie skarbów i limitu rund za słabe: potrzebna inna, np. słabsi obrońcy osad Hordy). Łatwy i Trudny dla Podboju niestrojone. Szturmy: garnizon 1–2 jednostek nie zatrzymuje bohatera, 3 jednostki bronią w połowie przypadków (`scripts/sim/siege.ts`).
- **Imperium, cel „Relikt”** (15.11): Normalny 43–72% po strojeniu; powyżej pasma 2 graczy na krótkiej mapie (72%) i bardzo długa mapa 2 graczy (70–72%). Łatwy i Trudny niestrojone.
- Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL`, `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (`data.ts`), liczby artefaktów, obiektów, jednostek i bossów neutralnych, spotkań na mapie, progi botów, progi `levelOfFight`.
- Boty, zbadane i bez zmian: „bezczynne tury” w kontroli, przetrwaniu i artefakcie to trzymanie punktu, zgodnie z celem; „bezczynne aktywacje” w bitwie to wybór pozostania.

## 7. Decyzje obowiązujące (archiwum, 12–15.11.2026)

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
- Grafika: budżet Scenario 566 kredytów na miesiąc, można wykorzystać całość (limit ok. 30 generacji na punkt z sekcji 5 nie obowiązuje tego dnia).

**Podział poziomów 4–6 (15.11):** na 4 gospodarka i osady, na 5 bohaterowie i magia, na 6 frakcje i Relikt: wyrównana liczba i złożoność nowości dla gracza.

## 8. Pytania czekające na autora

Decyzje podjęte przez Claude'a 15.11 (autor prosił o pracę bez pytań); każdą można zmienić w jednym miejscu:
1. **Garnizonem bez bohatera dowodzi komputer** (nie właściciel osady). Alternatywa: właściciel steruje obroną.
2. **Brama wytrzymuje 2 trafienia katapulty, mur i wieżyczka 1**; wieżyczka zadaje 1 obrażenie, fosa 2 (`SIEGE`).
3. **Podbój:** wygrywa się na koniec rundy, trzymając wszystkie osady na ziemi wroga; przy limicie rund liczy się „ponad połowa”, inaczej Horda.
4. **Drugi bohater dzieli pulę pomocników frakcji** z bohaterem głównym (bez osobnej drużyny); wykup 3 zł + 2 zł za poziom; najem 8 zł.
5. **Magia:** lista 8 czarów, mana 3 + poziom, bohaterowie główni znają od początku Magiczny Pocisk; nauka za złoto w wieży maga bez podchodzenia.
6. **Typy bohaterów:** smoki jako mędrcy, Jednorożec i Wilkołak jako łowcy, Niedźwiedź i Ogr jako wojownicy; specjalności według `SPECIALTIES`.
7. **Rozgałęzienia** tylko dla czterech umiejętności (Moc, Hart, Lekkość, Dowódca), jako czwarta karta przy III stopniu.
8. **Relikt:** Odłamki są w każdej grze poziomu 6 (także w innych celach), budynek wymaga wszystkich Odłamków u żywych bohaterów jednej frakcji; premie: Przymierze +2 Ż, Horda +1 A.
9. **Mechaniki frakcji:** Blask Świtu (leczenie co rundę bitwy) i Żądza Krwi (premia Ataku po śmierci wroga); drzewko frakcji liniowe, 3 stopnie.
10. **Skład nowych jednostek** (do akceptacji jak przy poziomie 3): dowódcy (Rycerz Świtu, Łowczyni Gaju, Mędrzec Gaju, Wódz Hordy, Kapitan Kuszników, Szaman Cieni), legendarne (Feniks Świtu, Behemot Zagłady), alternatywne (Srebrny Lis, Sowa Świtu, Driada Łuczniczka, Biały Jeleń, Goblin Procarz, Gargulec, Troll Jaskiniowy, Wiwerna Cienia) oraz ich grafiki.
11. **Siedliska** to pozycje na liście koszar (bez 16 osobnych budynków w krajobrazie osady); liczą się do limitu „jeden budynek na rundę”.
12. **Serwer:** commit z poziomami 5–6 leży lokalnie w repo backendu, bez pushu i wdrożenia (zmienia zestaw akcji i poziomów; idzie razem z wydaniem gry).
