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

## Stan (16.11.2026, po punktach 1–15)

Wydane: **2.7.0** (14.11, poziom 3 „Osada”). Niewydane, zrobione lokalnie w masterze: poziom 0 „Spacer”, Łatwy na arenie, bot-kupiec, Królestwo w rankingu, **poziomy 4, 5 i 6 w całości** (Księstwo: Kuźnia, wymiana surowców, młyn/składnica/studnia, garnizon, fosa i mury z katapultą, cel Podbój, autopilot warstw; Królestwo: drugi bohater, magia, typy i specjalności, rozgałęzienia umiejętności; Imperium: Relikt, mechaniki i drzewka frakcji, jednostki legendarne i alternatywne z siedliskami), dźwięki 16 jednostek poziomów 5–6, animacje Rycerza Świtu i Wodza Hordy. `make check` zielone (490 testów). **Nic nie wypchnięte.** Repo serwera: commit z poziomami 5–6, celami i nowymi akcjami, niewypchnięty i niewdrożony (czeka na wydanie gry).

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids` = Łatwy, `economy`, `realm`, `empire`) i w rankingu online zostają. Typ `Level` w `src/engine/types.ts`: `zero | kids | normal | hard`.

## 1. Kolejka prac (w tej kolejności)

### Grupa D. Grafika i dźwięk (kredyty Scenario; zasady budżetu na górze)
Sesja 16.11: zrobione animacje wszystkich 16 jednostek poziomów 5–6 (z brakami w punkcie 16) i efekty czarów, oblężenia, mapy, Odłamka, Iskry i odrodzenia.
Wspólne dla punktów 16–21: potok i przepis `docs/PRZEPIS_JEDNOSTKI.md` (obraz bazowy z portretu karty, obraz „martwy”, klipy `chod`, `atak`, `trafienie`, `smierc`; pakowanie `scripts/animacje/pack_unit.py` + `shrink_unit.py`; wpis w `assets.json`). Jednostka ma już statyczną figurkę i dźwięki ataku/śmierci (od 16.11): animacja podmienia pliki w `public/assets/jednostki/<folder>/`; wpis w `src/ui/sprites.ts` już istnieje (zwykle nic nie trzeba zmieniać, ewentualnie `speed`). Narzędzie ffmpeg: `pip install --target <scratchpad>/ff imageio-ffmpeg`, ścieżka w `.tmp/ffpath` (po restarcie systemu odtwórz). **Lekcje 16.11 (filtr treści):** zablokowane zostały „swings … down”, „rears up with a mighty roar … swings”, „sinks down … knees”, a ostatnia udana śmierć wyszła bez `lastFrameImage` z opisem „puts down … lies on his side and falls asleep”; broń z krwią na obrazie bazowym zwiększa ryzyko blokady (generuj broń bez śladów krwi); „internal error” bez blokady: ponów raz. Szacunek: ok. 105 CU na jednostkę (latająca +10).

**16. Braki i wady animacji jednostek poziomów 5–6** (M, kredyty ok. 110 CU; zostało po sesji 16.11, w której 16 jednostek dostało animacje)
- Brakujące klipy: `caveTroll` (Troll Jaskiniowy, `troll_jaskiniowy`): **atak** (filtr zablokował trzy podejścia z maczugą: spróbuj opisu bez broni, jak „leans forward and pushes his weight to the right in a lunge”, który przeszedł u Wodza Hordy; 15 CU); `dryadArcher` (`driada_luczniczka`): **trafienie** (klip wyszedł, ale kończy bez łuku: `asset_DR83dyMoT8fkM6nWePxg2Uu8`, do ponowienia z prośbą o łuk w ręce, 10 CU); `dawnPhoenix` (`feniks_switu`): **trafienie** (odrzucony klip w `.tmp/zrodla/_odrzucone_feniks/`, ptak kończy w innej pozie; 10 CU). Bez tych klipów kod używa drgnięcia i błysku.
- Klip `odrodzenie` Feniksa jest spakowany (`feniks_switu/odrodzenie.webp`), ale **kod go nie gra**: odrodzenie dzieje się w silniku bez śmierci jednostki (`battle.ts`, `dealDamage`, `rebirth`), więc `SpriteLayer` nie ma kiedy go uruchomić. Podłącz: zdarzenie `BattleState.fx` z kind `odrodzenie` (już jest) ma odtworzyć klip `odrodzenie` na jednostce (nowy segment kolejki w `SpriteLayer.tsx`, jak `smierc` od tyłu).
- Wady do oceny w grze (z raportów agentów 16.11): Szaman Cieni i Mędrzec mają błysk ataku jaśniejszy/niebieskawy i laska rozmyta; Łowczyni ma rozmyte środkowe klatki trafienia i zajmuje ok. 55% wysokości kadru; Szaman Cieni sięga w kadrze wyżej niż stopy 84% (sprawdź `box` w `sprites.ts`); Driada zajmuje ok. 85% wysokości kadru (sprawdź skalę); Wiwerna ma szeroki `martwy` (możliwe ucięcie przy krawędziach, crop 512 px); Goblin Procarz: kamień z procy słabo widoczny w klipie ataku, dobierz opóźnienie pocisku rysowanego przez kod (`.projectile`, wzór: głaz Cyklopa); Behemot: `stoi` z trzech czwartych i lekka fioletowa obwódka na kolcach; Feniks: fioletowa obwódka w środku `odrodzenie`; Lis: chód jak klus i dryf; Troll: jedna dziwna klatka w śmierci.
- Gotowe, gdy: braki uzupełnione (albo adnotacja „nie wyszło”), odrodzenie Feniksa gra klip, wady z listy ocenione w grze (`make zrzut` bitwy z tymi jednostkami) i poprawione tam, gdzie wystarczy `box`/skala w `sprites.ts`.

**24. Ikony: drzewko frakcji, siedliska, frakcyjne elementy oblężenia** (M, kredyty ok. 100 CU)
- Trzy stopnie drzewka każdej z dwóch frakcji (6 ikon) mają dziś sam tekst w oknie osady; mechaniki mają ikony (`ikony/frakcje/blask_switu.webp`, `zadza_krwi.webp`: wzór stylu). Siedliska jednostek (16 nazw w `DWELLING_NAMES`) mają jedną wspólną ikonę `ikony/frakcje/siedlisko.webp`: zrób 16 ikon (jedna na jednostkę, po jednym wspólnym arkuszu 4×4 jeśli się da, pocięte skryptem `scripts/assets/arkusz.py`). Elementy oblężenia (`public/assets/arena/oblezenie/`) są neutralne (szary kamień): zrób wersje Przymierza i Hordy dla muru, bramy i wieżyczki.
- Decyzja: siedliska nadal nie stoją w krajobrazie osady (tylko ikony na liście koszar; decyzja 11 w sekcji 7).
- Gotowe, gdy: ikony widoczne w oknie osady i na liście koszar, oblężenie frakcyjne w bitwie; wpisy w `assets.json`.

### Grupa E. Prezentacja i druk
**25. Okładka do druku bez starego logo** (S, kredyty ok. 14 CU)
- `docs/grafika/okladka/okladka.png` i `ui/cover.jpg` mają stare logo wypalone u góry (w grze niewidoczne, na wydruku tak). Wygeneruj okładkę bez logo i nałóż aktualne logo (`public/assets/ui/logo.png`), potem `python3 scripts/assets/menu.py` i `druk.py`.
- Gotowe, gdy: nowa okładka w grze i w PDF-ach do druku (`make druk`); wpis w `assets.json`.

**26. Ozdobne narożniki ramek** (S, bez kredytów; niski priorytet)
- Narożniki nie pasują do ramki. Decyzja: proste narożniki rysowane w CSS/SVG (złoto jak ramka, `border-image` 9-slice albo pseudoelementy) zamiast generowania w Scenario.
- Gotowe, gdy: narożniki spójne z ramką na desktopie i telefonie (`make zrzut`).

### Grupa F. Wydanie
**27. Wydanie gry i wdrożenie serwera** (S; **tylko gdy autor napisze „wydaj”**)
- Kolejność: `make check`; CHANGELOG „W przygotowaniu” → numer wersji (decyzja: kolejna wersja minor, tj. **2.8.0**, o ile autor nie poda innego numeru), data; wersja w `package.json`; commit i tag lokalnie. **Push gry robi tylko autor** (publikuje grę). Backend: push i `make deploy` robi Claude **po** wydaniu klienta (repo backendu ma niewdrożone commity z poziomami 5–6, celami i rankingiem; poziom 0 i Łatwy na arenie zmieniają znaczenie `kids`: stary klient dostałby arenę zamiast pojedynków, więc serwer wdrażaj razem z grą).
- Gotowe, gdy: tag lokalny jest, serwer wdrożony i `curl` zdrowia serwera odpowiada, autor dostał polecenie `git push` do wykonania.

## 2. Tylko autor (Claude tego nie bierze)
- **Premiera na Steamie** (L): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery do ustalenia (dawne „3.0” traci sens).
- Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam.
- Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- Odsłuch dźwięków (Claude nie ma jak ich odsłuchać): 7 z 15.11 (`catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3`) i 32 z 16.11 (`public/assets/dzwieki/jednostki/<id>_atak|_smierc.mp3` dla 16 jednostek poziomów 5–6); co się nie podoba, Claude wygeneruje od nowa (1 CU za sztukę).
- Sprawdzenie na żywo (sekcja 3), przegląd decyzji Claude'a (sekcja 9), pierwsza strona instrukcji planszowej (wiadomość autora), kąt kamery i wielkość figurek 3D.

## Po premierze (nie robić bez wyraźnego polecenia)
28. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Przed startem: próbka jednej jednostki w nowym stylu i decyzja autora. Koszt grafik i dźwięków jednej frakcji: sekcja „Kredyty Scenario”.
29. **Kampania fabularna** (mapy ręczne są; fabuła przez wyzwalacze) i **Ekspedycja** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
30. **Wiele języków** (PL + EN: interfejs, dane, instrukcja, CHANGELOG, serwer). Spis tekstów i trudności: `TEKSTY_DO_TLUMACZENIA.md` (ok. 1300 napisów i 71 tys. znaków w kodzie, plus instrukcja i serwer).
31. **Więcej niż 6 graczy** (do 8), „cios od tyłu / z flanki” dla innych jednostek.

## 3. Do sprawdzenia na żywo (autor)
Zrobione i przetestowane, bez potwierdzenia w prawdziwej grze:
- **Poziomy 4–6 (15.11, cała sesja):** sprawdzone testami silnika i skryptami klikającymi w przeglądarce (`scripts/browser/kuznia.ts`, `chatka.ts`, `oblezenie.ts`, `karczma.ts`, `czary.ts`, `relikt.ts`), nie w pełnej partii człowieka. Do ogrania: szturm murów (czy katapulta i fosa są czytelne), garnizon, Podbój, tura dowódcy, pasek czarów w bitwie (na telefonie jest przyklejony nad paskiem aktywacji: nie sprawdzałem w widoku telefonu), okno osady z 9 budynkami i drzewkiem frakcji (przewija się), Relikt, siedliska, statyczne figurki nowych jednostek, nowe dźwięki (nieodsłuchane). Stoły online poziomów 5–6: tylko typy i testy serwera, bez gry na żywo.
- **Poziom 4 (15.11):** surowce w dolnym pasku, ceny z surowcami w oknie osady, ikony tartaku, kopalni rudy, źródła Pyłu i chatki, panel zadania chatki (nie sprawdzony kliknięciem), karta „Księstwo” w kreatorze, samouczek.
- **Poziom 3:** widok osady z budynkami obu frakcji, dźwięki zakupu, animacje i portrety 8 pomocników (sprite'y bez klipu śmierci), ikony zestawów artefaktów i licznik „2/3 zestawu”, samouczek, autopilot dziecka, zapisy online, szósty gracz. Nowe 15.11: poziom 0, Łatwy na arenie, bot-kupiec.
- Kraken (czy groźny, ale uczciwy; czy sześć jednostek mieści się na arenie) i Pegaz.
- Klikalność jednostek zasłoniętych (Pegaz kontra Hydra, partia 114857, akcja 60; poprawka `behind` w `ArenaBoard.tsx`).
- Błysk zakrytych kafelków (`fog-drift`); kursor ataku na wszystkich heksach jednostki; zwłoki (`CORPSE_MAX_W` w `sprites.ts`); rzut Cyklopa (śmierć zaczyna się przed lądowaniem); kolejka stanów online (`usePresentation.ts`).
- Rozmiar Czarnego Smoka, figurki Szamana, Nietoperza, Jednorożca.
- Nowe z 16.11 (punkty 1–15 zrobione): okno „Magia” i wybór celu czaru na arenie (też na telefonie), napisy zdobyczy nad bohaterem, chorągiewki kopalń, prawy klik na obiektach mapy i artefaktach, wymiana surowców na targu, Bardzo trudny we wszystkich trybach (w grze online dopiero po wdrożeniu serwera z wydaniem), nowe ikony poziomów (smok jest najsłabiej narysowany), zasięg dwupolowych jednostek po Ctrl.
- Nowe z 16.11: animacje Rycerza Świtu (chód, atak, trafienie, śmierć) i Wodza Hordy (bez ataku) w prawdziwej bitwie (czy rozmiar i linia stóp pasują do reszty jednostek, czy `speed` w `sprites.ts` nie wymaga korekty); ikona Odrodzenia Feniksa w karcie jednostki.

## 4. Parking (pomysły bez terminu)
- Pierwsza strona instrukcji planszowej: imienna wiadomość autora (pisze autor).
- Kąt kamery i wielkość figurek 3D (autor, po obejrzeniu na żywo).
- Zwój Teleportacji jest nieużywany przez boty (35 z 35): potrzebuje pomysłu (ratowanie strzelca, skok za linię wroga).
- Garnizony i budynek obronny osady do rozważenia po strojeniu (jeśli przejmowanie okaże się za łatwe; częściowo pokrywa 4c).
- Łatwy w wydaniu planszowym (94/91/88/79% 1 na 1): domyślnie zostawiony „jak wydrukowany”; dźwignie stroiciela tylko w grze cyfrowej.

## 5. Balans: pasma i znane odchylenia

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

## 7. Decyzje podjęte przez Claude'a (do akceptacji)

Decyzje podjęte przez Claude'a bez pytania autora (autor prosi o pracę bez pytań); każdą można zmienić w jednym miejscu. Nowe wpisy dopisuj na końcu z datą i numerem punktu:
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
13. **(16.11, punkt 1)** Zasięg jednostki wielopolowej liczony od najbliższego jej heksa, dla obu stron.
14. **(16.11, punkt 12)** Dźwignie komputera: mnożnik złota i surowców ×0,75 / ×1 / ×1,25 / ×1,5; skarby startowe −1 / 0 / +1 / +2; Życie jednostek −15% / 0 / +10% / +20%; błędne decyzje bota 25% na Łatwym; bohater po śmierci: Łatwy nie wraca, Bardzo trudny wraca raz. Pasmo Bardzo trudnego 15–30% wygranych Przymierza. Normalny zachowuje obecne strojenie świata (to nie jest przewaga komputera).
15. **(16.11, punkt 13)** Mnożnik rankingu Bardzo trudnego = mnożnik Trudnego × 1,25 (robocza wartość); Spacer (poziom 0) bez wyboru trudności.
16. **(16.11, punkt 8)** Wymiana surowiec za surowiec = sprzedaż i kupno po cenach `ECONOMY`, jedna akcja, bez nowych liczb.
17. **(16.11, punkty 6, 9)** Dźwięki zdobyczy z istniejących plików, nowych nie generować; ikona „Magia” tylko od poziomu 5 i tylko gdy bohater zna czar.
18. **(16.11, punkt 26)** Narożniki ramek w CSS/SVG, bez Scenario.
19. **(16.11, punkt 27)** Numer najbliższego wydania 2.8.0, o ile autor nie poda innego.
20. **(16.11, ikony poziomów)** Łatwy = królik, Normalny = wilk, Trudny = niedźwiedź, Bardzo trudny = smok (wybór autora).
21. **(16.11, punkt 12)** Poziomy Łatwy, Normalny i Trudny zostają przy strojeniu per komórka (`tuning.ts`, `tuningAuto.ts`), a w jednej liście przewag komputera (`COMPUTER_HANDICAP`, `types.ts`) mają wartości neutralne (1, 0, 0); niezerowe są tylko przewagi Bardzo trudnego (dochód ×1,5, Życie +20%, +2 skarby na start). Powód: przeliczenie wszystkich 2500 wpisów strojenia na nową tabelę rozjechałoby pasma, które autor zatwierdził. Dźwignie „błędne decyzje bota” i „bohater wraca” nie weszły (bot nie ma miejsca na błąd bez psucia zgodności ze „złotymi” partiami).
22. **(16.11, punkt 13)** Trudny w rywalizacji (cyfrowa): komputer (strona złożona z samych botów) dostaje skarby Hordy i brak posiłków jak w kooperacji, ale bez dodatkowego bohatera; w wersji planszowej Trudny w rywalizacji zostaje wyłączony. Bardzo trudny tylko w wersji cyfrowej.
23. **(16.11, punkt 15)** Mnożniki punktów rankingu: Królestwo ×1,45, Imperium ×1,55 (Księstwo 1,35); poziomy 5–6 nie są trudniejsze od 4 (wygrane 55%/54% wobec 57%), ale wymagają więcej gry.
24. **(16.11, punkt 8)** Wymiana surowców to osobna akcja `kingdomSwap` (serwer: dopisana w `src/rooms/actions.ts`, czeka na wydanie).
25. **(16.11, punkty 6, 7)** Zdarzenie dziennika `loot` (złoto/surowce) niesie napis nad bohaterem; chorągiewka właściciela kopalni to medalion kontroli `kontrola_<frakcja>.webp`.

## 8. Kredyty Scenario

**Ile jeszcze potrzeba (stan 16.11.2026, po wydaniu 239 CU; punkty 16–25 z kolejki)**
Ceny z faktur: dźwięk (ElevenLabs SFX) 1 CU; obraz Flare `medium` 3 CU, `high` 14 CU; wideo P-Video 2 po 5 CU za sekundę (klip 3 s = 15 CU, 2 s = 10 CU); muzyka ok. 30 CU za utwór. Zablokowane lub nieudane zadania wideo **też kosztują**: 16.11 padło 6 z 14 klipów (ok. 90 CU), więc do kosztu „czystego” (ok. 72 CU na jednostkę) doliczam ok. 40% zapasu (ok. 105 CU na jednostkę).
| Pozycja | Bez porażek | Z zapasem na porażki |
|---|---:|---:|
| Animacje 14 jednostek (punkty 17–21; Łowczyni, Mędrzec, Kapitan Kuszników, Szaman Cieni, Feniks, Behemot, Lis, Sowa, Driada, Jeleń, Procarz, Gargulec, Troll, Wiwerna; latające dodatkowo klip `wzbicie`, Feniks klip `odrodzenie`) | ok. 1 050 | ok. 1 470 |
| Brakujący atak Wodza Hordy (punkt 16) | 15 | 30 |
| Efekty czarów, oblężenia (punkty 22–23), Odłamka, Iskry i mechanik frakcji (ok. 14 efektów po ok. 13 CU: obraz + krótki klip) i ich dźwięki | ok. 180 | ok. 250 |
| Ikony drzewka frakcji (6), siedliska jednostek (16 ikon), frakcyjne elementy oblężenia (ok. 6 obrazów; punkt 24) | ok. 100 | ok. 130 |
| Dźwięki (własny dźwięk monet, poprawki po odsłuchu autora; okładka z punktu 25 ok. 14 CU) | ok. 20 | ok. 30 |
| **Razem** | **ok. 1 350** | **ok. 1 900** |
Zrobione 16.11 i nie wchodzą już do sumy: 32 dźwięki ataku i śmierci wszystkich 16 jednostek poziomów 5–6, ikona Odrodzenia, animacje Rycerza Świtu i Wodza Hordy (bez ataku). Plan Starter pozwala na 2 równoległe zadania wideo.

**Kredyty Scenario: koszt jednej nowej frakcji (wszystkie grafiki i dźwięki; szacunek)**
Frakcja to ok. 3 bohaterów i 7 jednostek (`DECYZJE.md`): 10 postaci.
| Pozycja | Bez porażek | Z zapasem |
|---|---:|---:|
| 10 postaci: ilustracja karty (obraz `high` 14 CU, portret wycinany lokalnie za 0) + pełny zestaw animacji (obraz bazowy 14, trup 3, klipy chodu, ataku i śmierci 15 + 15 + 15, trafienie 10; latające +10) + dźwięki ataku i śmierci (2 CU) — ok. 88 CU na postać | ok. 880 | ok. 1 230 |
| Dodatkowe klipy: wzbicie i lot dla postaci latających (ok. 3), skrzydła i inne efekty | ok. 60 | ok. 90 |
| Osada: widok, budynki, siedliska 7 + drzewko (3 ikony) + garnizon i wieża maga (ok. 14 obrazów po 3–14 CU) | ok. 100 | ok. 140 |
| Arena frakcji (plansza bitwy, 1–2 duże obrazy), kafle mapy, herb, ikona mechaniki frakcji i jej efekt | ok. 70 | ok. 100 |
| Muzyka frakcji (2–3 utwory po ok. 30 CU) i dźwięki interfejsu frakcji | ok. 90 | ok. 100 |
| **Razem** | **ok. 1 200** | **ok. 1 650** |
Do tego ok. 3–4 h pracy nad pakowaniem, kontrolą i wpisami (`PRZEPIS_JEDNOSTKI.md`). Przy braku limitu jednej jednostki (100 CU) wychodzi ok. 1 000 CU samych postaci. Szacunek do aktualizacji po pierwszej nowej frakcji (Dzikie Stada), kiedy będzie znany koszt rzeczywisty.
