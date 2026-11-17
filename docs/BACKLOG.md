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

## Stan (17.11.2026, po wydaniu 2.8.0)

Wydane: **2.8.0** (16.11: poziomy 0, 4, 5 i 6, Łatwy na arenie, bot-kupiec, animacje i efekty; gra na Pages, serwer 0.2.0 na Fly.io, silnik 2.8.0). Wcześniej **2.7.0** (14.11, poziom 3 „Osada”). Wszystko z poniższej listy jest już wydane, nic nie czeka na push.

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids` = Łatwy, `economy`, `realm`, `empire`) i w rankingu online zostają. Typ `Level` w `src/engine/types.ts`: `zero | kids | normal | hard`.

## 1. Kolejka prac (w tej kolejności)

### Grupa A. Zasady i silnik (decyzje autora z 17.11; punkty niezależne, kolejność dowolna)

Wspólne dla 32–36: zmiana liczb lub AI przesuwa `tests/golden.test.ts` i pasma: po zmianie `make sim-raport GAMES=100` (zob. sekcja 5), poprawki strojenia, golden `-u` w **osobnym commicie** z opisem. Serwer (`../straznicy-krysztalowego-drzewa-backend`) dzieli silnik: po zmianie reguł lub akcji zsynchronizować, `make deploy` (backend wolno pushować i wdrażać); gra (push) tylko autor.

**32. Obronę osady steruje właściciel** (M)
- Dziś: gdy osady bez bohatera broni sam garnizon (`BattleState.defenderHero === null`, `startBattle` w `game.ts` ok. l. 782–875), `actorForFaction` (`game.ts` l. 468) nie ma bohatera, więc zwraca `{ kind: 'automaton' }` i jednostkami garnizonu rusza komputer (`chooseBattleAction`). Dotyczy wyboru jednostek (`select`), rozstawienia (`deploy`), draftu i aktywacji (`fight`).
- Zmiana: gdy `b.garrison` jest ustawione, a `defenderHero === null`, aktorem obrony jest **gracz-właściciel**. Kto to jest, gdy frakcja ma kilku graczy (koop 2, PvP 2 na 2)? Reguła robocza: gracz tej frakcji, którego bohater ostatnio był aktywny (jeśli żaden nie żyje, pierwszy z `state.players` tej frakcji); człowiek ma pierwszeństwo przed botem. `Actor` ma wtedy `kind: 'human'|'bot'` z jego `playerId` zamiast `automaton`. Dopisz to do `ZASADY_CYFROWE.md` i do listy decyzji (sekcja 7).
- Dotyka: `game.ts` (`actorForFaction`, `battleHeroOf` albo nowa `garrisonCommander(state, faction)`), `ai/battleAi.ts` (`followsRulebook` zostaje dla neutralnych i automatu kooperacji: sprawdzić, że garnizon bota nie idzie po „zasadach z instrukcji”), `src/online` i serwer (kto może wysłać akcję bitwy: sprawdzenie `playerId` w `src/rooms`), `ui/BattleView`/`App.tsx` (kto widzi przyciski aktywacji, hotseat: przekazanie ekranu właścicielowi), automat kooperacji (Horda w koopie nadal automat, bo to komputer, nie gracz).
- Testy: nowy w `tests/conquest.test.ts` lub `kingdom.test.ts`: szturm osady z garnizonem, właściciel-człowiek dostaje aktywacje (`currentActor.kind === 'human'`); bot-właściciel gra botem; automat Hordy w koopie bez zmian. Zrzut/skrypt `scripts/browser/oblezenie.ts` (klik w jednostkę garnizonu jako obrońca).
- Gotowe, gdy: testy zielone, bitwa o osadę z garnizonem w przeglądarce (człowiek broni), `golden` i pasma Podboju (sekcja 5) przeliczone osobnym commitem.

**33. Więcej czarów** (M; projekt do akceptacji autora)
- Dziś: 8 czarów w `src/engine/magic.ts` (`SpellId`, `SPELLS`, `MAGIC`): krąg I (Magiczny Pocisk, Leczenie, Spowolnienie, Wizja), krąg II (Kamienna Skóra, Kula Ognia, Zryw, Wrota). Mana 3 + poziom, regeneracja 1/rundę, nauka za złoto (krąg I 3 zł, II 5 zł + 1 Pył) w wieży maga (budynek `magic`, poziom budynku = krąg).
- Do zrobienia: zaprojektować nowe (propozycja: po 2 na krąg, razem 12): obrażenia (np. Grom, który bije wroga i jego sąsiada z linii), obrona (Tarcza: pierwszy cios pochłonięty), osłabienie (Klątwa: −1 A wroga do końca bitwy), wsparcie (Natchnienie: +1 A sojusznika na jedną aktywację), mapa (Przyspieszenie: +2 pkt ruchu). Liczby w małej skali (przez `statScale`), koszty many 1–4.
- Dotyka: `magic.ts` (`SpellId`, `SPELLS`, `MAGIC`, funkcja rzucania i `spellPower`), `ai/` (`botSpell` w `magic.ts`: warunki użycia każdego czaru), `ui/SpellBook.tsx` (księga: układ na dwóch stronach, ikony `public/assets/ikony/mapa/` lub czary), `SettlementDialog.tsx` (wieża maga uczy `towerSpells(level)`), efekty graficzne `public/assets/efekty/` (grafiki: Scenario, `kredyty`; do czasu ich powstania ikona zastępcza z wpisem w sekcji 2a placeholderów), dźwięki (1 CU za sztukę), tekst w `ZASADY_CYFROWE.md` („Magia”) i `INSTRUKCJA.md`.
- Testy: `tests/magic.test.ts` (każdy czar: koszt, cel, efekt, brak many), bot używa nowych czarów w grach (licznik jak w skrypcie z punktu Zwoju).
- Gotowe, gdy: czary działają w bitwie i na mapie, bot ich używa, golden i pasma poziomów 5–6 przeliczone.

**34. Relikt: warunek budowy** (S)
- Dziś (`empire.ts`: `mayBuildSpark`, `shardsOf`; `kingdom.ts` l. ~587 akcja `kingdomBuild` z `building: 'spark'`; bot l. ~952 w `adventureAi`/`kingdom.ts`): budynek wymaga, by **suma Odłamków żywych bohaterów frakcji** = `shardTotal`, a budowniczy stał w osadzie (`hero.pos === s.at`), w osadzie którą kontroluje własna frakcja.
- Zmiana: Relikt (budynek Pierwotnej Iskry) może wznieść tylko **ten bohater, który stoi na kafelku osady i sam niesie wszystkie Odłamki** (`hero.shards === shardTotal`). Odłamki rozproszone po kilku bohaterach nie wystarczą (trzeba je zebrać u jednego: dziś **nie ma** akcji przekazania Odłamków, przechodzą tylko przez pokonanie bohatera `loseShards`, więc dodać prostą akcję `passShards` między bohaterami tej samej frakcji stojącymi na tym samym lub sąsiednim polu, w `types.ts` `Action`, `game.ts`, serwer `src/rooms/actions.ts`; bot przekazuje Odłamki bohaterowi najbliższemu własnej osady; dopisać do sekcji 7).
- Dotyka: `empire.ts` (`mayBuildSpark(state, f)` → `mayBuildSpark(state, hero)`; zmienić wszystkie wywołania: `kingdom.ts` x3, `loseShards` komunikaty, `adventureAi`), tekst błędu („Do Pierwotnej Iskry potrzeba wszystkich Odłamków przy jednym bohaterze”), `SettlementDialog.tsx` (przycisk budowy i opis warunku, widok „ma n z N Odłamków”), bot (`kingdomBotAction`: bohater z kompletem wraca do własnej osady; bohaterowie z częścią idą do tego z największą częścią), tekst w `ZASADY_CYFROWE.md` (Relikt) i `INSTRUKCJA.md`; sekcja 7, pozycja 8 (decyzja Claude'a) zastąpiona.
- Testy: `tests/` (relic/empire): dwóch bohaterów z podzielonymi Odłamkami nie zbuduje; jeden z kompletem w osadzie zbuduje; poza osadą nie. Cel „Relikt” w `objectives.ts` bez zmian.
- Gotowe, gdy: testy zielone; sim `SIM_OBJECTIVE=relic` pokazuje, że boty nadal budują Relikt (wygrane w paśmie 45–65%; ewentualnie korekta liczby Odłamków `EMPIRE.shards`).

**35. Bardzo trudny: surowce i artefakty startowe zamiast Życia** (M)
- Decyzja autora: **nie manipulujemy Życiem jednostek**. Dziś Bardzo trudny to `COMPUTER_HANDICAP.veryHard = { gold: 1.5, hp: 0.2, treasures: 2 }` (`types.ts` l. 135), czytane przez `rules.computerGold|computerHp|computerTreasures` (`kingdom.ts` l. 448, `battle.ts` l. 148–150 `applyComputerHp`, `game.ts` l. 149–153 `extra(...)`), arena też (`arenaSetup`, `types.ts` l. 199).
- Zmiana: `hp` → 0 (usunąć pole `computerHp` i `applyComputerHp`, albo zostawić nieużywane; czystsze: usunąć wraz z wywołaniami, testami i polem w `RulesConfig`). Dodać przewagi startowe: `computerResources` (np. +2 drewna, +2 rudy, +1 Pyłu na starcie, mnożone w `initKingdom`, `kingdom.ts` l. ~241–243, tylko gdy `computerFaction`) i `computerArtifacts` (np. 1 artefakt rzadkości 1–2 dla głównego bohatera komputera na starcie: `giveArtifact` w `sites.ts` l. 254, losowanie `drawArtifact` z deterministycznym ziarnem). Zostaje `gold: 1.5` i `treasures: 2`. Liczby robocze do strojenia pasmem 15–30%.
- Dotyka: `types.ts` (`COMPUTER_HANDICAP`, `RulesConfig`, `LEVEL_RULES.veryHard`, `arenaSetup`), `game.ts` (start), `kingdom.ts` (surowce startowe), `battle.ts`, opisy trudności w UI (`src/ui/setupShared.tsx` l. 48, 59 i 79: opisy Bardzo trudnego z „o 20% więcej Życia”, przepisać na nowe przewagi; ten sam opis w `INSTRUKCJA.md`), `ZASADY_CYFROWE.md`, sekcja 7 poz. 14 i 21 w tym pliku, tabele sekcji 5, `scripts/sim/tuneLevels.ts`. Arena: bez surowców, więc tam przewagą zostaje tylko `treasures` (dla Bardzo trudnego Areny rozważyć +1 karta w drafcie albo bot bez błędów: do decyzji, robocza: bez zmian poza zdjęciem Życia).
- Testy: `tests/difficulty.test.ts`/`computer.test.ts` (Bardzo trudny: bez bonusu Życia, z surowcami i artefaktem komputera; ludzie bez przewag).
- Gotowe, gdy: Bardzo trudny mieści się w paśmie 15–30% w większości komórek `make sim-raport` (stroić liczbami startowymi i `computerGold`), golden `-u` osobnym commitem.

**36. Mnożnik punktów rankingu Bardzo trudnego = 1,5** (S)
- Stan faktyczny (poprawka opisu z sekcji 7): w `scoring.ts` Bardzo trudny ma ocenę trudności `veryHard = min(10, hard + 1)` (l. 42), a w arenie `ARENA_POINTS.veryHard = 4` (Trudny 3). Wzór: `pointsFor` = `BOARD_TOP_POINTS × MAP_WEIGHT × difficultyRating × tierPointsFactor / TOP_RATING`, zaokrąglone, w [1, `MAX_POINTS`].
- Zmiana: punkty za wygraną na Bardzo trudnym = punkty tej samej konfiguracji na Trudnym × **1,5** (nowa stała `VERY_HARD_POINTS_FACTOR = 1.5` w `scoring.ts`; w `pointsFor` dla `level === 'veryHard'` liczyć z oceną kolumny `hard ?? normal`, potem × 1,5, zaokrąglić, ograniczyć `MAX_POINTS`: sprawdzić, czy limit nie ucina wyniku; arena: 3 × 1,5 = 4,5 → 5, lub zostawić 4: wybrać zaokrąglenie w górę). Ocena trudności widoczna w UI (`difficultyRating`, 1–10) bez zmian. Spacer (poziom 0) bez wyboru trudności: bez zmian.
- Dotyka: `scoring.ts`, serwer `../straznicy-krysztalowego-drzewa-backend/src/ranking/ranking.ts` (czy liczy własne punkty, czy ufa klientowi: sprawdzić; jeśli liczy, ta sama stała), testy `tests/` (grep `pointsFor`), tekst rankingu/instrukcji (`INSTRUKCJA.md`, tabela punktów), sekcja 7 poz. 15 i 23.
- Gotowe, gdy: test: Bardzo trudny daje 1,5× punktów Trudnego dla każdej mapy i trybu (z limitem), serwer zsynchronizowany i wdrożony (`make deploy`).

### Grupa B. Ekran osady (L)

**37. Osada na pełnym ekranie, wzór Heroes III, z drzewkiem budynków** (L; do rozbicia na 3–4 commity)
Decyzje autora: całą mechanikę i wygląd brać z Heroes III; jedyna różnica to podgląd budynków do wybudowania (drzewko zamiast listy).
- **Dziś:** `src/ui/SettlementDialog.tsx` (377 linii): modal z krajobrazem frakcji (`public/assets/osady/<frakcja>_<budynek><poziom>.webp`, `_plot.webp` dla niewybudowanego), budynki jako klikalne karty rozmieszczone w dwóch rzędach (`spotOf`), pod krajobrazem pas „usługi” wybranego budynku (`data-service`: rekrutacja, targ, szpital, kuźnia, tawerna, wieża maga, mury, skarbiec, Iskra), pas drzewka mechaniki frakcji (`data-tree`, poziom 6). Silnik: `BuildingId = 'barracks' | 'market' | 'hospital' | 'treasury' | 'forge' | 'walls' | 'tavern' | 'magic' | 'spark'` (`kingdom.ts` l. 21), ceny `ECONOMY.cost[b][poziom]` (`economy.ts`), `buildingsOf(state)` (które budynki ma poziom gry), `mayBuildNow` (jeden budynek na rundę), akcja `kingdomBuild`. **Budynki nie mają dziś żadnych wymagań** (każdy można kupić od razu): drzewko wymaga nowego grafu zależności w silniku.
- **Zakres 1: ekran na całą stronę** (S): okno osady nie jest modalem `.plate`, tylko pełnoekranowym widokiem (jak `BattleView`: zastępuje mapę, przycisk „Wróć”/Esc). Krajobraz zajmuje całość (tło), budynki rozmieszczone na nim jak w Heroes III (nie w dwóch równych rzędach: ręczne pozycje per frakcja i budynek, `SPOT` rozszerzone o wszystkie 9, osobno dla `dawn` i `horde` w `osady/` lub nowym `src/ui/settlementLayout.ts`), u góry pasek zasobów (`ResourceStrip`, złoto), u dołu portrety bohaterów i garnizon (patrz Heroes III: garnizon, bohater w osadzie, rekrutacja jednostek). Telefon: `COMPACT_QUERY` (`common.tsx`), poziomo i pionowo; przewijanie dozwolone, ale bez wąskiego modalu.
- **Zakres 2: Rada Osady** (M): nowy budynek `council` (nazwa robocza „Rada Osady”; nazwa do akceptacji autora), **zawsze wybudowany** w każdej osadzie (poziom 1 od początku, poza `buildingsOf`/kosztami; nie kosztuje, nie liczy się do „jeden budynek na rundę”). Widok: klik w Radę zmienia ekran na widok **drzewka budynków do kupienia** (kolejna „strona” tego samego pełnego ekranu; Esc/„Wróć” wraca do krajobrazu). Grafika Rady: `osady/<frakcja>_council1.webp` (nowa, Scenario, `kredyty`, wpis w `assets.json`; do czasu jej powstania `_plot`/istniejący obraz i pozycja w sekcji 2a).
- **Zakres 3: graf zależności + drzewko** (M–L): dodać w silniku `BUILDING_REQUIRES: Record<BuildingId, Array<{ building: BuildingId; level: number }>>` (np. propozycja do akceptacji: `treasury` ← `market 1`; `hospital` ← `barracks 1`; `forge` ← `barracks 1`; `tavern` ← `market 1`; `magic` ← `market 1` (+ `magic 2` ← `forge 1`); `walls` ← `barracks 1`; `spark` ← `treasury 1` + warunek Odłamków; poziomy 2 każdego budynku wymagają poziomu 1 i jednego innego). `kingdomBuild` odrzuca zakup bez spełnionych wymagań (komunikat „Najpierw: <budynek>”), `mayBuildNow`/boty (`kingdomBotAction`, `kingdom.ts` l. ~885, 964) muszą respektować graf (bot buduje w kolejności zależności; **zmiana przesuwa golden i pasma**), `buildingsOf` bez zmian. Widok drzewka: **graf (węzły + linie), nie lista**: węzeł = budynek (ikona, nazwa, poziom, cena `costText`), linie ze strzałkami od wymaganego do zależnego, stan węzła: wybudowany / do kupienia (aktywny) / zablokowany (szary, brakuje X) / za drogi (czerwona cena); klik w węzeł do kupienia otwiera potwierdzenie (cena, efekt `BUILDING_TEXTS`); hover/podgląd pokazuje wymagania zaznaczając linie (bez prawego przycisku, w przeciwieństwie do Heroes III). Układ grafu: kolumny według głębokości zależności (SVG z liniami, węzły w CSS grid); na telefonie przewijany poziomo.
- Dotyka też: wszystkich wywołań `SettlementDialog` (`App.tsx`, `AdventureView.tsx` — otwarcie osady), testów UI (`tests/ui.test.tsx`: okno osady, przyciski `[data-building]`, `[data-service]`; skrypty `scripts/browser/kuznia.ts`, `karczma.ts`, `czary.ts`, `oblezenie.ts`, `relikt.ts`, `chatka.ts` używają selektorów okna: zachować `data-*` lub poprawić skrypty), `ZASADY_CYFROWE.md` (sekcja osady), `INSTRUKCJA.md`, samouczek (`Tutorial.tsx`, jeśli opisuje okno osady).
- Gotowe, gdy: osada otwiera się na cały ekran w trzech widokach (desktop, telefon poziomo i pionowo, sprawdzone zrzutami), klik w Radę pokazuje drzewko z liniami zależności, zakupy działają i respektują graf, wszystkie skrypty `scripts/browser/*` przechodzą, `make check` zielone, golden i pasma przeliczone osobnym commitem.

### Grupa C. Grafika (kredyty Scenario; zasady budżetu na górze)

**38. Nowe ozdobniki ramek i tła okien ze Scenario** (M, kredyty; limit 100 CU na jednostkę)
- **Ozdobniki ramek:** dziś narożniki ramek to SVG (`.gf::after`, `styles.css` l. 58–60: „gold bracket with a crystal”, `.gf.no-corners`); autor: brzydkie. Wygenerować ze Scenario nowe ozdobniki (narożnik złotej ramki w stylu HoMM3, ewentualnie ozdobna listwa środkowa), użyć jako obrazu (`border-image` albo osobne `<img>` w narożnikach, czterokrotnie odbite CSS-em), wpis w `assets.json`, desktop i telefon. Wcześniejsza próba malowanych narożników Scenario nie pasowała do ramki: w prompcie opisać dokładnie kolor (`#B88A35` złoto), grubość i styl, kilka wariantów (`model_run`, `jobs_wait`), wybrać najlepszy.
- **Tła okien „Księga czarów” i skrzynia skarbów:** dziś CSS (`.spellbook`, `.chestbox`, `styles.css` l. 870–893; `SpellBook.tsx`, `ItemsPanel.tsx`): skóra, drewno, pergamin z `ui/parchment.jpg`. Autor: tło bardzo brzydkie. Wygenerować: (1) okładkę/rozkładówkę otwartej księgi czarów (dwie strony pergaminu z grzbietem i ozdobną skórzaną okładką, pusta, jako tło okna `.spellbook`), (2) skrzynię/szkatułę skarbów (wieko otwarte, wnętrze z aksamitem, pusta, jako tło `.chestbox`), (3) ewentualnie tekstury pergaminu pod napisy. Tekst i ikony czarów/skarbów zostają w HTML nad obrazem (obraz tylko tło, układ z `min()`/procentami, czytelność tekstu: przyciemnione pola na pergaminie jeśli trzeba). Rozmiary: WebP, do ok. 150 KB sztuka, sprawdzić `du -sh`.
- Budżet: ok. 6–10 obrazów po 3–14 CU (`medium` 3 CU do prób, `high` 14 CU na wersję końcową) = ok. 60–100 CU; wydatki wpisać do sekcji 8.
- Dotyka: `styles.css`, `SpellBook.tsx`, `ItemsPanel.tsx`, `public/assets/ui/`, `assets.json`; sprawdzenie zrzutem w bitwie i na mapie (okno skarbów jest też na mapie), desktop i telefon poziomo.
- Gotowe, gdy: autor akceptuje nowe ozdobniki i tła na zrzutach, pliki w repo z wpisami w `assets.json`, stare narożniki SVG usunięte z CSS.

## 2. Tylko autor (Claude tego nie bierze)
- **Premiera na Steamie** (L): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery do ustalenia (dawne „3.0” traci sens).
- Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam.
- Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- Odsłuch dźwięków (Claude nie ma jak ich odsłuchać): 7 z 15.11 (`catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3`) i 32 z 16.11 (`public/assets/dzwieki/jednostki/<id>_atak|_smierc.mp3` dla 16 jednostek poziomów 5–6); co się nie podoba, Claude wygeneruje od nowa (1 CU za sztukę).
- Pierwsza strona instrukcji planszowej (imienna wiadomość autora) i kąt kamery z wielkością figurek 3D: autor, po obejrzeniu na żywo (decyzja 17.11: poza parkingiem, bez terminu).

## Przed premierą (decyzja autora 17.11: wchodzą przed Steamem; po punktach z kolejki)
28. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Przed startem: próbka jednej jednostki w nowym stylu i decyzja autora. Koszt grafik i dźwięków jednej frakcji: sekcja „Kredyty Scenario”.
29. **Kampania fabularna** (mapy ręczne są; fabuła przez wyzwalacze) i **Ekspedycja** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
30. **Wiele języków** (PL + EN: interfejs, dane, instrukcja, CHANGELOG, serwer). Spis tekstów i trudności: `TEKSTY_DO_TLUMACZENIA.md` (ok. 1300 napisów i 71 tys. znaków w kodzie, plus instrukcja i serwer). Najlepiej robić ostatnie, gdy teksty się ustalą.
(Nie robić bez wyraźnego polecenia autora: to duże prace.)

## 3. Sprawdzenie na żywo
Wyczyszczone 17.11: autor sam sprawdza grę i zgłasza błędy (`make zgloszenia`); nie prowadzimy listy „do sprawdzenia”.

## 4. Parking (pomysły bez terminu)
- **Więcej niż 6 graczy** (do 8), „cios od tyłu / z flanki” dla innych jednostek.

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
