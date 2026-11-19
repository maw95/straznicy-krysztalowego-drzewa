# Nowe frakcje: macierz mechanik i biblioteka prymitywów (faza 0 planu wdrażania)

Dokument fazy 0 z planu w `BACKLOG.md` (sekcja „Parking”): zanim powstanie pierwsza nowa frakcja, ustalamy **czym każda ma się różnić** i **z jakich klocków silnika się składa**, żeby karta frakcji (`KARTA_FRAKCJI_SZABLON.md`) była składana z gotowych, przetestowanych prymitywów, a nie pisana od zera. Stan: 17.11.2026. Wszystko oznaczone **[propozycja]** czeka na zatwierdzenie autora przy karcie danej frakcji (bramka G0).

## 1. Biblioteka prymitywów

Prymityw to jedna reguła silnika (zdolność, aura, efekt statusu), parametryzowana liczbami z danych jednostki. Kolumna „Dziś” mówi, co już jest w silniku (nazwy z `src/engine/data.ts` i `battle.ts`), „Do zrobienia” to luka.

| Prymityw | Co robi | Dziś (jednostka, plik) | Do zrobienia |
|---|---|---|---|
| **Odpychanie** | po ataku cel cofa się o N pól (nie dotyczy dużych) | Cyklop (`Miażdżący Głaz`), `battle.ts` | parametr siły i kierunku; wersja „zderzenie” (cios +N, gdy cel uderzy w przeszkodę) |
| **Przyciąganie** | cel zbliża się o N pól do atakującego | brak | nowy; potrzebny Przypływom |
| **Zamiana miejsc** | dwie jednostki zamieniają się polami | skarb „Róg Strażników” (wymiana z rezerwą), nie na polu | nowy: zamiana sojusznik–sojusznik i sojusznik–wróg |
| **Spowolnienie** | −N S w następnej aktywacji | Splątane Korzenie, czar Spowolnienie | gotowe, wystarczy parametr |
| **Unieruchomienie** | cel nie rusza się do końca następnej aktywacji | Pajęcze Sidła, Chwyt Szczypca | gotowe |
| **Pułapka** | pole zaminowane, ranią wchodzących | Pole Naładowane (Król Burzy), fosa z kolcami | prymityw „pole z efektem” na dowolnym polu, ukrywany przed wrogiem (Wolne Kompanie) |
| **Trucizna** | −N Ż na początku kolejnych aktywacji | Szczurołak, Zatruty Bełt | gotowe |
| **Aura** | efekt na sąsiadach lub w promieniu, dopóki jednostka żyje | Opiekun Gaju (osłona), Strój Wartownika (aura), Obława | uogólnić: aura wzmocnień i osłabień w promieniu R |
| **Odrodzenie** | po śmierci wstaje z połową Ż, raz na bitwę | Feniks, Odrodzenie z Popiołów | wersja „wskrzesza sojusznika w polu” (Umarli) |
| **Premia za ruch** | +N A po przebiegnięciu co najmniej M pól | Orzeł Skalny, Sowa Świtu | gotowe; wersja „szarża” z odpychaniem (Stada) |
| **Pancerz** | −N obrażeń z każdego ciosu | Herszt Minotaurów, Kamienna Skóra | gotowe |
| **Odbicie** | wróg trafiający w zwarciu traci Ż | Jeżozwierz, Ciernie zbroi | gotowe |
| **Leczenie** | +N Ż sojusznikowi, własne lub z aury | Dar Życia, Zrastanie Ran | gotowe |
| **Premia grupowa** | +N A lub Ż za każdego sąsiedniego sojusznika tego samego rodu | Obława (Ogary) | uogólnić (Rój Głębin) |
| **Przestawienie** | jednostka zmienia pole bez ruchu (teleport, mirage) | Król Burzy (teleport), Podkop | wersja „miraż”: wróg widzi atrapę (Piaski) |
| **Zajęcie terenu** | pole zostaje własnością strony i daje premię | brak | nowy; Rój Głębin |
| **Wyczerpanie** | cel traci manę lub jedną aktywację | czar Spowolnienie (częściowo) | nowy: −N many, „oszołomienie” (Umarli) |
| **Osłona** | cios w sojusznika przyjmuje inna jednostka | Opiekun Gaju | gotowe; uogólnić na osłonę linii |

Zasady budowy: każdy prymityw ma funkcję w `src/engine/` (nowy plik `primitives.ts`), parametry w danych jednostki, **test jednostkowy** (`tests/primitives.test.ts`), tekst zdolności z liczbami przez `scaleText` i wpis w słowniku angielskim. Stare zdolności zostają, dopóki golden się nie zmienia; refaktor ich do prymitywów jest osobnym, mechanicznym krokiem pod siatką `golden.test.ts`.

## 2. Macierz frakcji

Role: **A** agresja, **O** obrona, **K** kontrola pola, **W** wyczerpanie (osłabianie w czasie), **M** mobilność. Prymitywy wymagane = z tabeli wyżej; **nowe** oznacza, że faza 2 musi je dopisać.

| Frakcja (id) | Rola | Mechanika wyróżniająca (jedna) | Prymitywy wymagane | Nowe prymitywy | Uwagi i kolizje |
|---|---|---|---|---|---|
| Przymierze Świtu (`dawn`) | O + wsparcie | Blask Świtu (leczenie) | leczenie, aura, odrodzenie | — | istnieje |
| Mroczna Horda (`horde`) | A | Żądza Krwi | premia grupowa, pancerz | — | istnieje |
| **Dzikie Stada** (`herds`) | A + M | Szarża: premia za ruch przed atakiem i odepchnięcie celu | premia za ruch, odpychanie, pancerz | szarża z odepchnięciem (zderzenie) | pilot procesu; **rozdzielenie z Przypływami:** Stada = odepchnięcie z uderzeniem, Przypływy = osłona i zamiana miejsc |
| **Królestwo Umarłych** (`undead`) | W | Odrodzenia i osłabianie | odrodzenie, trucizna, wyczerpanie | wskrzeszenie w polu, wyczerpanie many | **kolizja ze skarbem „Wskrzeszenie”:** skarb wskrzesza jednostkę *bohatera frakcji*, odrodzenie Umarłych działa *w bitwie i raz na jednostkę*; skarb nie działa na jednostki z odrodzeniem w tej samej bitwie [propozycja] |
| **Żelazne Klany** (`clans`) | O | Pancerz i ulepszanie wyposażenia | pancerz, osłona, odbicie | — | **kolizja z Prastarym Niedźwiedziem:** niedźwiedzie Klanów to jednostki, nie bohater; bez zdolności „przyjmij cios za sąsiada”, dostają pancerz [propozycja] |
| Wolne Kompanie (`free`) | K + M | Pułapki i skarby | pułapka, przestawienie | ukrywanie pola przed wrogiem | DLC |
| Dwór Wiecznego Szronu (`frost`) | K | Spowalnianie i izolowanie | spowolnienie, unieruchomienie, aura | aura osłabiająca w promieniu | DLC |
| Imperium Piasków (`sands`) | M | Miraże, zasadzki, przestawianie | przestawienie, premia za ruch | miraż (atrapa) | DLC |
| Rój Głębin (`swarm`) | W + K | Premia w grupie, zatrucie, zajęcie terenu | premia grupowa, trucizna | zajęcie terenu | DLC |
| Władcy Przypływów (`tides`) | O + K | Przyciąganie, osłona, zamiana miejsc | przyciąganie, zamiana miejsc, osłona | przyciąganie, zamiana miejsc | DLC; zdolności działają też bez wody |

Kolejność ustalona wcześniej: Dzikie Stada → Królestwo Umarłych → Żelazne Klany → DLC. Każda frakcja ma 3 bohaterów, ok. 7 jednostek rekrutowanych (tiery 1–5 plus 2 alternatywy i legenda), 3 budynki unikalne (jak Przymierze i Horda), mechanikę poziomu 6 i profil bota.

## 3. Decyzje do potwierdzenia przy kartach frakcji

1. Kolizje z tabeli (Umarli ↔ „Wskrzeszenie”, Klany ↔ Niedźwiedź, Stada ↔ Przypływy): proponowane rozwiązania są w kolumnie „Uwagi”.
2. Czy prymitywy mają osobny plik `primitives.ts` (propozycja), czy zostają w `battle.ts` jak dziś (jedna zdolność = jeden `case`).
3. Poziom 6 dla nowych frakcji: ta sama struktura (mechanika w budynku 4-poziomowym + 2 budynki) czy uproszczona.
4. Relikt dla nowych frakcji: symetryczny (patrz plan); nazwa i wygląd budynku Iskry na frakcję.

## Notatki techniczne

- **Faza 1 (17.11, bez zmiany zachowania; golden bez zmian):** `TeamId` (drużyna, klucz stanu: złoto, skarby, `homes`, strefa mapy) rozdzielone od `FactionId` (rasa, klucz danych i grafiki); `raceOf(state, team)` i `TEAM_IDS` w `src/engine/teams.ts`, `SetupOptions.races` (brak = rasa o id drużyny). Tabele danych w silniku i UI czytane przez `raceOf`. `map.ts`: `splitZones` dzieli mapę na 1–4 strefy (dla dwóch identycznie jak dawna reguła), `MAX_START_ZONES = 4`. `objectives.ts`: `bestTeam` (wygrywa najlepszy wynik, remis na szczycie = remis) w Kontroli i Reliktcie, Podbój i `progress` po liście drużyn. **Wciąż tylko dwie drużyny:** `generateMap` (typ `TileSide`, pule pól i legowiska strażników po stronie `dawn`/`horde`, bazy `baseDawn`/`baseHorde`, `homes` jako dwa klucze, ścieżka triangla `sideOf`), `Settlement.land`, mapa osad w `kingdom.ts` (`nameBag`, `picked`, pętle `['dawn','horde']`), `game.ts` (pętle startowe, `other`, `rivalOf`), arena (`ARENA_RULES`, losowanie monetą), `isAutomaton` (Horda w koopie), cel Kryształów, Przetrwania, Bossa i Artefaktu, `SeatSetup.faction` (jeszcze rasa = drużyna), UI (`SEAT_TINT`, wybór frakcji w kreatorze). Pozostają też `hero.faction`-owe odczyty danych w `battle.ts`/`growth.ts` przez `raceOf` tylko tam, gdzie był stan pod ręką.
- **Faza 1 domknięta (18.11, backlog 51; strona = frakcja):** `TeamId` ma miejsca `third` i `fourth` na następne frakcje (do czasu ich paczek czytają dane Przymierza i Hordy: `DATA_OF` w `teams.ts`), `teamsOf` daje strony z frakcji przy stole, `generateMap` dzieli prostokątną mapę na N stref i stawia N baz (`MapTeams`), osady, cele (Kontrola, Przetrwanie, Boss, Artefakt, Podbój, Relikt), tury, arena i mechaniki poziomu 6 czytają `raceOf`/`teamsOf`, boty grają „po dobremu” (Przymierze) albo „po hordziemu” według frakcji strony. Kryształy do Drzewa: tylko Przymierze i Horda, dokładnie dwie strony (test). W UI miejsce wybiera frakcję z rejestru. Nowa frakcja to paczka + id w miejsce miejsca; zostaje: kooperacja z dowolnymi frakcjami graczy i komputera, gra przez internet na 3–4 strony, balans N stron (po pierwszej nowej frakcji).
- **Strona = slot, frakcja = rasa miejsca (19.11, backlog 52 G1):** `SeatSetup.race` (opcjonalne); `assignSlots` daje pierwszym dwóm frakcjom przy stole sloty `dawn` i `horde` (dowolne frakcje), kolejnym `third` i `fourth`; `raceOf(state, slot)` czyta rasę miejsca (bez `race` jak dawniej); `teamsOf` przy stole z rasami zwraca użyte sloty; `seatTable` (UI) przydziela sloty i porzuca `race`, gdy stół jest „starym” (zapisy i gra online bez zmian). Paczka ma pola `terrain`, `tiles`, `short`, `genitive`, `lead`. Prymitywy Stad (odepchnięcie ze zderzeniem, odporność, premia za stan celu, prowokacja) w `primitives.ts`, test `tests/herds.test.ts`.
- **Królestwo Umarłych, G1 (19.11, backlog 53):** nowe prymitywy w silniku: wskrzeszenie w polu (`raiseUnit`, `fallenSupports`), odporność na statusy (`resistsStatus`), ignorowanie pancerza, tarcza jednorazowa wg typu ciosu, aura osłabiająca; wyczerpanie many z istniejącego `drainMana`. Opis i uproszczenia: `docs/frakcje/undead.md`.
- **Żelazne Klany, G1 (19.11, backlog 54):** nowe prymitywy w silniku: trwałe runy w stanie frakcji (`FactionState.runes`, akcja `kingdomForgeRune`), formacja i Mur Tarcz (`inFormation`), pancerz z wielu źródeł, premia za brak ruchu, premia przeciw rozmiarowi, ogłuszenie, przestawienie wroga, stawianie muru (`fortifyCells`), przeskok jednorazowy (`goatLeapReady`), nieruchomość przez status. Opis i uproszczenia: `docs/frakcje/clans.md`.
- **Dwór Wiecznego Szronu, G1 (19.11, backlog 55):** nowe prymitywy w silniku: szron jako licznik na jednostce i zamrożenie (`applyFrost`, `freezeUnit`), kruchy lód, premia za stan celu (szron), pancerz na typ ciosu, odbicie szronu, stawianie przeszkody z czasem życia (`iceWallCells`), ślad na polach, przestawienie wroga (`abductCell`), aura osłabiająca, szron globalny (Długa Noc, Iskra), kara ruchu na mapie (Wieża Zamieci). Opis i uproszczenia: `docs/frakcje/frost.md`.
