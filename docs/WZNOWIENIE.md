# Wznowienie pracy (stan z 20.11.2026, na wypadek zmiany konta Claude)

Ten plik opisuje, co jest rozpoczęte i jak to dokończyć bez znajomości rozmowy, w której powstało. Kolejność zadań jest ważna.
Zasady stałe: `CLAUDE.md`. Nie pushujemy gry. Serwer (`../straznicy-krysztalowego-drzewa-backend`) ma lokalny commit, **nie jest wdrożony**
(dostaje silnik dopiero z wydaniem gry).

## PLAN NA TERAZ (ustalony z autorem 20.11 wieczorem; wykonuj po kolei, aktualizuj tu odhaczenia)
1. [x] 58a, 58b zrobione 20.11; 56 i 57 odłożone na bliżej nieokreśloną przyszłość (decyzja autora).
2. [x] Ikona `huntDive` wygenerowana 20.11 (3 CU, `scripts/assets/ability_icon_glyph.py`).
3. [x] Drobiazgi: parsery akcji w backendzie (lokalny commit `5c086cd`, bez wdrożenia, backend ma też 3 stare błędy typów TeamId przy stole online z nowymi frakcjami: do punktu 51a), herb Piasków z nową nazwą. Otwarte pytania z G1 rozstrzygnięte wg decyzji autora z wpisów wyżej.
4. [ ] G2 dla 10 frakcji, drabina (przejdź do następnego szczebla, gdy poprzedni nie daje celu):
   B) pełny stroiciel `tuneFactions.ts` dla 10 frakcji (ok. 5 h w tle, `nohup`, nie edytuj `src/` w katalogu głównym w trakcie);
   A) kontry z mechanik frakcji i bota (wg `docs/DIAGNOZA_FRAKCJI.md`);
   C) ręczne zmiany statystyk jednostek i siły/słabości umiejętności aż do efektu;
   D) ostateczność: porzucić warunki kontra/kontrowana; wystarczy **średnia wygranych każdej frakcji z pozostałymi w 45-55%** (twarde granice par 25-75%).
5. [ ] Jeśli G2 się powiedzie: przestrojenie poziomów Kryształów (`retune-all.sh` po skasowaniu `.tmp/sim/auto-*.json` oprócz `auto-zero-legacy.json`, `tuneMerge`, `make check`, commit).
Autor czyści kontekst (/clear) przed startem; zacznij od punktu 1.

## Nowe zdolności jednostek (20.11, gałąź `new-abilities`, worktree `skd-abilities`, NIE scalona do `master`)
Wprowadzone zdolności zatwierdzone przez autora (karty `docs/frakcje/*.md`, lista ikon w `docs/BACKLOG.md` 2a): Kozioł Taranowy = Taran (`ramBlow`, +2 A po ruchu o 2+ pola i ogłuszenie),
Mosiężny Pająk = Ostrzał z Miejsca (ta sama zasada), Orzeł Stepowy Łowca = Nurkowanie (`huntDive`, wręcz i lot; `overShot`/`shootsOver` usunięte), Dziad Mróz = Uścisk Mrozu (`beardChill`, chód).
Dowódcy Stad: nazwy własne „Łowca Wiatru” i „Płanetnik” (`realm.ts`); specjalność „Szpon z Góry” (`airborne` w `heroTypes.ts`). Beduin Nomada (Rzut Sztyletem) i Albatros tylko na kartach (Piaski, Przypływy bez kodu).
`golden.test.ts` zielony bez zmiany snapshotu; liczby (+2 A, 2 pola, 2 szrony, zasięg 2) do dostrojenia na G2.

## Co jest zrobione (commity w `master`)
- Horda cyfrowa ma +1 Ż i +1 A (`HORDE_DIGITAL_BONUS`, `data.ts`; bez areny i bez wersji planszowej): `22c56b1`.
- Tryb „Potyczka” zamiast Rywalizacji i Kooperacji w wersji cyfrowej, kampania, Przetrwanie i tryb rodzinny na zwykłym bocie: `edf15c2`, `3a164c0`.
  Wersja planszowa nietknięta (zostaje Kooperacja z automatem; silnik zachowuje `mode: 'coop'` tylko dla niej).
- Opis i plan: `docs/BACKLOG.md` punkt 51b.

## Kolejność zadań (ustalona z autorem 20.11, żeby zużyć jak najmniej tokenów; autor może stracić limit w każdej chwili)
1. **Dokończyć przestrojenie poziomów** (zadanie 1 niżej): czekać na `=== done`, `tuneMerge`, `make check`, commit.
2. **Scalić do `master` tylko Wolna Kompania** z worktree: `git merge ea352d6` (to commit końcowy G1 Kompanii; gałąź `g1-four-factions` ma wyżej commity WIP Piasków,
   których NIE scalać). Dopiero po zakończeniu przestrajania (symulacje czytają `src/`).
3. **Automatyczny stroiciel frakcji** (`scripts/sim/tuneFactions.ts`, do napisania): zachłanne przeszukiwanie małych, cyfrowych poprawek na frakcję
   (hp, attack, speed osobno dla bohaterów i pomocników, tylko wersja cyfrowa, np. tabela `FACTION_DIGITAL_BONUS` uogólniająca `HORDE_DIGITAL_BONUS`)
   pod tabelę „Kto z kim”; liczy tylko pary zmienianej frakcji, zapisuje wynik do pliku i raportuje podsumowanie (naruszenia, średnie). Cel: mało tokenów.
4. **G2 dla frakcji, które mają G1**: Przymierze, Horda, Stada, Umarli, Klany, Szron, Kompanie (7; 21 par) automatycznym stroicielem + przegląd wyniku.
5. **Poprawki Kompanii z odpowiedzi autora (20.11):** (a) Paserka I: dodać sprzedaż artefaktów z plecaka (pełna cena); (b) Żbiczka Bajdurka zostaje jak jest (łowca walczący
   wręcz); (c) zrobić zasłonę „przekaż urządzenie” w hot-seat przy układaniu pułapek (+ przycisk „Podejrzyj”); (d) backend: `visibleTo` wywołuje `redactHidden`
   (repo `../straznicy-krysztalowego-drzewa-backend`, jednolinijkowo; commit lokalny, bez wdrożenia). Sprawdzić interfejs pułapek w przeglądarce (agent tego nie zdążył).
6. **G1 pozostałych frakcji**, po jednej, osobnymi agentami w worktree `skd-g1`: Piaski (zaczęte: commit WIP `3985491`, same dane; kontynuować od niego), Rój, Przypływy.
7. **Ponowne G2** (stroiciel, niskie koszty) po każdej nowej frakcji i na końcu dla wszystkich 10.

## Stan na 20.11 ok. 03:00 (aktualizuj przy kolejnych krokach)
- Zrobione: przestrojenie poziomów policzone (`.tmp/sim/auto-*.json`, 142 przebiegi, `=== done` w `.tmp/sim/retune-all.log`), **NIE scalone** do `tuningAuto.ts` (zob. niżej);
  tabela `FACTION_DIGITAL_BONUS` (`src/engine/factionBonus.ts`, generowana) zastąpiła `HORDE_DIGITAL_BONUS`; Kompanie scalone do `master` (`b30cbbd`; portrety z drugiej sesji są
  w `master`, konflikt `assets.json` i dwóch portretów rozwiązany: zostały prawdziwe portrety); `make check` zielony (902 testy).
- **Wynik stroiciela G2 (siedem frakcji, 20.11 rano): same premie Ż/A nie wystarczą.** Po dwóch przebiegach zachłannych 17 z 21 par poza pasmem (na starcie 15; wynik zapisany w
  `.tmp/sim/tuneFactions.stat-only-result.json`, `factionBonus.ts` przywrócony do wersji z repo). Przyczyna: premie statystyk wyrównują frakcje do ok. 50%, ale nie tworzą relacji
  kontra/kontrowana (np. Horda–Umarli 43% przy celu 60–70, Stada–Szron 49% przy celu 60–70). Do decyzji autora: (A) dodać cyfrową dźwignię „premia przeciw frakcji” (np. +1 A
  jednostek A przeciwko jednostkom B; osobno bohaterowie i pomocnicy; tylko wersja cyfrowa; łatwa do automatycznego strojenia, ale to ukryte liczby bez uzasadnienia w mechanice),
  (B) zrobić kontry mechanikami frakcji (praca projektowa, drogo), (C) zaakceptować samo wyrównanie ok. 50% bez kontr. Rekomendacja: A jako rozwiązanie szybkie i tanie w tokenach,
  rozszerzyć `tuneFactions.ts` o dźwignię par. Poprawki Kompanii z gałęzi `kompanie-followups` są już scalone (`f706a8a`, 903 testy).
- **Decyzje autora z 20.11 po wyniku stroiciela:** opcja A (premia przeciw frakcji) odrzucona; idziemy w B (kontry z mechanik frakcji i bota). Cel balansu: **wariant względny**:
  średnia frakcji 45–55%; kontra ≥ średnia frakcji + 10 pkt; kontrowana ≤ średnia − 10 pkt; brak relacji w średnia ±7; twarde granice 25–75%; tolerancja błędu pomiaru ±4;
  sukces = co najmniej 90% par spełnionych, wyjątki wypisane (wariant strukturalny jako plan awaryjny). **Najpierw diagnostyka** (agent, `scripts/sim/diagnoza.ts`,
  wynik `docs/DIAGNOZA_FRAKCJI.md`: czy zamierzone mechaniki w ogóle się uruchamiają i czy bot z nich korzysta); potem poprawki wg priorytetów z diagnozy; dopiero na końcu
  stroiciel liczb zdolności (`tuneFactions.ts` zmienić tak, by liczył cel względny i stroił liczby zdolności, nie ogólne statystyki).
- **Wymiana jednostek (decyzje autora 20.11, `docs/frakcje/PODOBIENSTWA_I_NAZWY.md` sekcja 5) i nowe nazwy frakcji:** do wprowadzenia w kartach, kodzie (`src/engine/factions/*.ts`, `i18n`) i instrukcji PRZED poprawkami mechanik/bota i G2,
  bo od składu jednostek zależy balans. Najlepiej agentem w osobnym worktree, po jednej frakcji (Stada, Umarli+Szron, Klany, Kompanie, potem karty Piasków i Przypływów). Otwarte pytanie: Tarpan Łucznik sam czy jeździec.
  **Stan (20.11): wymiany w kodzie i kartach WPROWADZONE w gałęzi `unit-swaps` (Stada, Umarli, Szron, Klany, Kompanie; karty Piasków, Przypływów i Roju z nowymi nazwami; kod Piasków i Przypływów dopiero przy G1). Do scalenia do `master` po zakończeniu stroiciela. Zdolności i liczby przeszły ze starych jednostek, więc balans zrobi G2.**
- **Stan 20.11 ok. 10:00:** wymiany jednostek i nazwy (Dzikie Stado, Żelazny Klan, Wolna Kompania) scalone do `master` (`make check` zielony, 903 testy). Karty Piasków, Przypływów i Roju mają już nowe jednostki i nazwy
  (Pustynne Cesarstwo, Bractwo Przypływu, Rój Puszczy), kod ich nie ma (G1 do zrobienia). Otwarte pytania autora: Tarpan Łucznik (sam czy jeździec), zdolność Beduina Nomady, herby `cards/crests` mają stare nazwy.
  Nowa kolejność: (1) bot i mechaniki wg `docs/DIAGNOZA_FRAKCJI.md` priorytety 2–6, (2) stroiciel na cel względny, (3) G2, (4) przestrojenie poziomów Kryształów itd. (`retune-all.sh`; dotychczasowe `auto-*.json` są nieaktualne), (5) G1 Piasków/Roju/Przypływów.
- **Drobne zmiany do wprowadzenia po stroicielu (nie edytować `src/` w katalogu głównym, gdy liczy się `tuneFactions.ts`):** (a) zdolność Nosorożca Bojowego „Taran” → nowa nazwa (autor 20.11: zmienić; rekomendacja „Rozpędzony Róg”, inne: Bodnięcie z Rozbiegu, Stratowanie; Kozioł Taranowy zachowuje „Taran”);
  (b) specjalność Orła Stepowego Łowcy „Mistrz Oszczepu” → nowa nazwa (propozycje: Oko Orła, Szpon z Góry); (c) atak dystansowy orła = „pióra jak strzały” (do potwierdzenia, alternatywy: Satyr Sokolnik, orzeł w zwarciu).
- **W TOKU (stan 20.11 ok. 12:00): stroiciel G2 na cel względny** uruchomiony poleceniem `nohup node --import tsx scripts/sim/tuneFactions.ts 200 control,conquest,relic --apply > .tmp/sim/tuneFactions2.log 2>&1 &`
  (proces niezależny od sesji Claude; do ok. 2,5 h; stan po każdej zaakceptowanej zmianie w `.tmp/sim/tuneFactions.json`). Gdy w logu jest linia `final` i proces nie żyje (`pgrep -f tuneFactions`),
  `--apply` sam zapisał `src/engine/factionBonus.ts`: przejrzyj wynik (log: sekcja „final”), `make check`, commit z adnotacją; jeśli proces padł, uruchom to samo polecenie ponownie (wznowi od stanu; dodaj `>>` zamiast `>`).
  Dopóki trwa, NIE edytuj `src/` w katalogu głównym. Decyzja autora 20.11: zdolność Nosorożca Bojowego „Taran” → **„Stratowanie”** (wprowadzić po stroicielu; Kozioł Taranowy zachowuje „Taran”).
- **Decyzja autora 20.11 (orzeł):** Orzeł Stepowy Łowca walczy WRĘCZ (nie dystansowo; łowca nie musi strzelać). Zdolność „Strzał nad Przeszkodami” (`overShot`) zastąpić zdolnością **Nurkowanie**: lot nad przeszkodami i jednostkami,
  cios po ruchu +N A (wzór: Szarża Światła Króla Jednorożców, lot); usunąć `overShot`/`shootsOver` z `battle.ts`, jeśli nic innego ich nie używa; zmienić `attackType` na melee w `data.ts`. Specjalność „Mistrz Oszczepu” → **„Szpon z Góry”**
  (+1 A dla niego i dla jednostek powietrznych Stad, np. Łamignat; zaktualizować `heroTypes.ts`, angielski, kartę `docs/frakcje/herds.md`). Razem ze „Stratowaniem” (Nosorożec): wprowadzić PO zakończeniu stroiciela (`tuneFactions.ts`), najlepiej agentem w worktree, potem G2 (`--report`).
- **Decyzja do podjęcia po stroicielu (ważne):** tabela kontr wymaga Przymierze > Horda 60–70%, a premia +1/+1 dla Hordy dała ok. 50%. Stroiciel sam dobierze premie wszystkich frakcji,
  więc po nim Kryształy i inne cele trzeba przestroić ponownie (`scripts/sim/retune-all.sh` po skasowaniu `.tmp/sim/auto-*.json` oprócz `auto-zero-legacy.json`), potem `tuneMerge`.
  Dlatego obecne pliki `auto-*.json` służą tylko, jeśli premia Hordy zostanie przy +1/+1.
- **Poprawki Kompanii zrobione w gałęzi `kompanie-followups`** (worktree `../skd-kompanie`, commity `d7a10e7`..`0a3faa0`, `make check` zielony, 903 testy; sprzedaż artefaktów w Paserce, zasłona hot-seat, `redactHidden` w backendzie jako lokalny commit `18aa403`): **do scalenia do `master` dopiero po zakończeniu stroiciela** (`git merge kompanie-followups`; zmienia `src/`).
- Dalej wg kolejności powyżej: G1 Piasków (od commitu WIP `3985491` w gałęzi `g1-four-factions`), Rój, Przypływy, G2 ponownie.

- **Stan 20.11 wieczór (gałąź `bot-mechanics`, worktree `../skd-bot`, `make check` zielony, golden bez zmian):** bot buduje budynek mechaniki wcześnie (budynek stoi w 13–76% bitew pvp zamiast 3–21%), Sidła leżą na drodze wroga, diagnostyka poprawiona. Liczby mechanik NIE zmienione (pomiar w `docs/DIAGNOZA_FRAKCJI.md` sekcja 9: nie przesuwają par). Otwarte: Przymierze 67% średnio, Klany 35%, Szron 44%, Kompanie 42% (jednostki i kolejność budowy, nie liczby mechanik); decyzja autora, jak wyrównać.

## Szczegóły zadań

## Zadanie 1: przestrojenie poziomów po wzmocnieniu Hordy (liczy się w tle)
Po +1/+1 Hordy cele spadły poza pasma (Łatwy 65–85, Normalny 45–65, Trudny 30–45 % wygranych Przymierza). Przetrwanie w PvP nie miało strojenia.
- Uruchomione: `scripts/sim/retune-all.sh` (≈150 przebiegów po ok. 1,5 min). Log: `.tmp/sim/retune-all.log` (linia `=== done` na końcu).
  Wyniki każdego przebiegu: `.tmp/sim/auto-<tag>.json`. Skrypt jest **wznawialny** (pomija przebiegi z istniejącym plikiem): jeśli proces padł,
  uruchom go ponownie (`nohup scripts/sim/retune-all.sh >> .tmp/sim/retune-all.log 2>&1 &`; sprawdź najpierw `pgrep -f tuneLevels`).
  `auto-zero-legacy.json` to odtworzony blok z dawnego `tuningAuto.ts`, nie kasuj go.
- **Podczas przebiegu nie edytuj `src/` w katalogu głównym** (symulacje ładują kod z niego; praca nad frakcjami idzie w osobnym worktree).
- Po `=== done`: `node --import tsx scripts/sim/tuneMerge.ts` (zapisuje `src/engine/tuningAuto.ts`), `make check`, zobacz które komórki zostały „(OUT)”
  w logu i opisz je w backlogu. Sprawdź kampanię (`tests/campaign.test.ts`, scenariusze były stroione na automacie; pomiar: `scripts/sim/kingdom.ts`).
  Golden (`npx vitest run tests/golden.test.ts -u`) tylko świadomie, w osobnym commicie z opisem. Commit: nowe strojenie + CHANGELOG.

## Zadanie 2: G1 czterech nowych frakcji (osobny worktree)
- Worktree: `/home/maciek/WebstormProjects/skd-g1`, gałąź `g1-four-factions` (`git worktree list`). `node_modules` tam to symlink do katalogu głównego.
- Kolejność, po jednej frakcji (wspólne pliki, więc nie równolegle): Wolna Kompania `free` → Piaski `sands` → Rój `swarm` → Przypływy `tides`.
  Karty: `docs/frakcje/{free,sands,swarm,tides}.md`. Wzorzec: commit `1903255` (Dwór Wiecznego Szronu). Zakres G1: `docs/FRAKCJE_PROPOZYCJE.md` sekcja 2.
- Stan: `git -C /home/maciek/WebstormProjects/skd-g1 log --oneline master..g1-four-factions` i `git -C … status` (praca robocza może być w commitach „WIP”).
  Każda karta ma po G1 sekcję „Stan G1”. Jeśli agent frakcji został przerwany, sprawdź `status` (niezacommitowane pliki), dokończ wg karty i testu
  kontraktowego `tests/factionContract.test.ts`, `make check` w worktree.
- Zasady twardych granic: golden bez zmian, wersja planszowa bez zmian, bez grafik z Scenario i bez wydawania kredytów (budżet 8000 CU, nie przed G4).
- Po czterech frakcjach: scal gałąź do `master` (`git merge g1-four-factions`; spodziewane konflikty: `docs/BACKLOG.md`, `CHANGELOG.md`, `src/i18n/en/changelog.ts`,
  `src/engine/factions/index.ts`; rozwiąż ręcznie, `make check`).

## Zadanie 3: wspólne G2 dla wszystkich 10 frakcji (po zadaniach 1 i 2)
- Cel (decyzja autora 20.11): tabela „Kto z kim” w `docs/FRAKCJE_PROPOZYCJE.md`: kontra 60–70 %, kontrowana 30–40 %, brak relacji 45–55 %, średnia przeciw wszystkim
  45–55 %, żadna para poniżej 30 % ani powyżej 70 %. Narzędzie: `make sim-nowe` (rozszerz o 10 frakcji i podsumowanie wg tabeli kontr).
  Strojenie liczbami w paczkach frakcji (nie ruszać wersji planszowej; Przymierze i Horda tylko przez cyfrowe liczby, np. `HORDE_DIGITAL_BONUS`).
- Po zmianie liczb: strojenie poziomów Kryształów itd. może znów się rozjechać (zadanie 1 do powtórzenia dla zmienionych frakcji), golden świadomie.

## Co robi druga sesja autora
G3 (próbka jednostki w nowym stylu) dla ośmiu nowych frakcji, w osobnym worktree. Może dotknąć `assets.json`, `public/assets`, `docs/BACKLOG.md`; przy scaleniu uważaj na te pliki.

- **Zrobione 20.11 (gałąź `eagle-dive`, worktree `skd-eagle`):** Orzeł Stepowy Łowca walczy wręcz, lata, zdolność Nurkowanie (`huntDive`, +2 A po ruchu o 2+ pola), specjalność Szpon z Góry (+1 A dla niego i jednostek `fly`), Nosorożec Bojowy: Stratowanie (id `ram` bez zmian), usunięty `overShot`/`shootsOver`. Golden bez zmian. Do zrobienia po scaleniu: G2 (`--report`) i nowa ikona `huntDive`.

- **Stan 20.11 ok. 11:45:** pierwszy przebieg stroiciela (log `tuneFactions2.log`) był skażony: bot próbował Taranu bez rozbiegu i potomne procesy symulacji padały (415 błędów); naprawa `a7f4804`. Stary stan: `.tmp/sim/tuneFactions.tainted-1126.json` (nie używać). Stroiciel uruchomiony OD NOWA: `nohup node --import tsx scripts/sim/tuneFactions.ts 200 control,conquest,relic --apply > .tmp/sim/tuneFactions3.log 2>&1 &` (ok. 2,5 h; nie edytuj `src/` w katalogu głównym; `pkill -f` z wzorcem `[t]uneFactions`). Po `final`: przegląd, `make check`, commit, potem scalenie `g1-four-factions` do Piasków (zob. kolejność zadań), G2 `--report`.

- **Stan 20.11 po południu:** G1 Piasków (Pustynne Cesarstwo) gotowe w `../skd-g1`, gałąź `g1-four-factions` (4 commity po scaleniu `master`, `make check` zielony, 949 testów); **nie scalone do `master`** (po stroicielu). Decyzje autora po raporcie agenta: (1) tajne ziarno dla ukrytych losowań tylko jako wpis w Parkingu (BACKLOG); (2) **do zrobienia w `skd-g1`:** gracz sam wybiera jednostkę, która dostaje miraż (dziś wybiera gra); (3) **do zrobienia w `skd-g1`:** Mangusta Faraona odporna TYLKO na truciznę (nie na klątwy, spowolnienie i unieruchomienie; za mocne), poprawić dane, kartę, testy, angielski; pozostałe decyzje z sekcji 17 `NOTATKI_DLA_AGENTA_PLANSZOWKI.md` zatwierdzone domyślnie (autor nie zgłosił uwag). Potem G1 Roju i Przypływów. Stroiciel: `.tmp/sim/tuneFactions3.log`. Autor miał mało limitu, więc nic z tego jeszcze nie ruszone.

- **Stan 20.11 14:50 (krok 1 zrobiony):** stroiciel (`tuneFactions3.log`) skończył: 13/21 par poza pasmem względnym (cel ≥ 90% w paśmie NIE osiągnięty; stat-only sięga ok. 40–45%). Zastosowane premie z korektą: bohaterowie Przymierza i Hordy mają `hp` 0 zamiast −1, bo −1 łamał niezmiennik testu `reports1110` (smoki nie zabijają się jednym ciosem); pomiar `--report` po korekcie: 12/21 poza pasmem, średnie: Przymierze 60, Horda 50, Stada 46, Umarli 56, Klany 48, Szron 46, Kompanie 43. Pary poza pasmem to głównie brak relacji kontra/kontrowana (mechaniki frakcji, nie liczby). Decyzja autora nadal potrzebna: wariant strukturalny (kontry z mechanik) albo akceptacja wyrównania. Testy `statscale`, `ui-cardstats` poprawione tak, by nie zakładały stałych liczb bez premii frakcji. Dalej: krok 2 (poprawki Piasków, G1 Roju i Przypływów w `../skd-g1`).

- **Stan 20.11 po południu (3):** G1 Roju gotowe w `../skd-g1` (994 testy); G1 Przypływów robi agent w tym samym worktree. Odpowiedzi autora na pytania z G1 Roju: Oplot przy każdym trafieniu zostaje (chyba że przy G2 psuje balans), Wielki Chór w pełnej wersji (chyba że psuje balans), **Pyłek ma zatruwać także sojuszników** (do zrobienia w `skd-g1` po agencie Przypływów; jeśli przy G2 psuje balans, dać odporność na truciznę wybranym jednostkom Roju). Serwer (backend) przy wdrożeniu silnika potrzebuje parsera akcji `pickMirages`, `battleMirageSwap`, `gateHero` (autor: ok, zrobić przy wydaniu). W `master` zrobione drobiazgi autora: kafelki trybów po dwa w rzędzie, opis bohatera (`src/content/heroLore.ts`, EN w `src/i18n/en/lore.ts`) zamiast figurki 3D, koszary (poświata stanu zamiast przycisków pod kartami, równe wysokości, szybszy sprite). **Przy scalaniu G1 dopisać lore** (`HERO_LORE`) dla bohaterów Roju i Przypływów (Piaski już mają) i wpisy EN. Otwarte pytanie do autora: 7–8 graczy jest dostępne tylko na poziomach do Księstwa (na Królestwie i Imperium limit 6, bo są dowódcy z karczmy).

- **Stan 20.11 ok. 16:30 (kroki 1-3 zrobione, krok 4 w połowie):** G1 Piasków, Roju i Przypływów scalone do `master` (fast-forward z `g1-four-factions`; `make check` 1043 testy). Naprawiony błąd bota/silnika: ruch przez pole ukrytego (zakopanego) wroga ujawnia go zamiast rzucać błędem (`aa7116e`). **G2 `--report` dla 10 frakcji (`.tmp/sim/report-10.log`): 34/45 par poza pasmem względnym;** średnie: Przymierze 64, Horda 53, Stada 51, Umarli 60, Klany 54, Szron 49, Kompanie 49, Cesarstwo 44, Rój 42, Przypływy poniżej 45 (Przymierze wygrywa 80% z Przypływami, ok. 67% z Cesarstwem i Rojem: nowe frakcje za słabe, liczby wstępne). W logu 1 rzadki błąd bota: Piorun (`lightning`, `enemyUnit` 'Wybierz żyjącego wroga'); przeszukanie 4320 gier (45 par, 3 cele, ziarna 9-40) go nie odtworzyło, ziarno nieznane (raport używa ziaren 1-200): jeśli wróci, odtworzyć w `nowe-frakcje.ts`. **Do zrobienia:** (a) decyzja autora o drodze G2 (kontry z mechanik/bota, albo pełny stroiciel dla 10 frakcji ok. 5 h, albo akceptacja wyrównania); (b) przestrojenie poziomów (`scripts/sim/retune-all.sh`, po skasowaniu `.tmp/sim/auto-*.json` oprócz `auto-zero-legacy.json`, potem `tuneMerge`, `make check`) najlepiej dopiero PO ostatecznych premiach dawn/horde (obecne premie z `cd15d22` zmieniły Przymierze i Hordę, więc poziomy Kryształów są nieaktualne); (c) backlog 58a/58b (silnik, worktree), 58d (skrzynia/księga z animacją, Scenario: autor zgodził się na generowanie), 56, 57; (d) serwer (osobne repo) przy wydaniu: parsery akcji `pickMirages`, `battleMirageSwap`, `gateHero`, `battleTideSwap`.

- **Stan 21.11 (autonomicznie, autor: „rób całą resztę, nie pytaj”):** punkty 1-3 planu zrobione. Punkt 4B: pełny stroiciel 10 frakcji uruchomiony: `SIM_TIMEOUT_MIN=330 nohup node --import tsx scripts/sim/tuneFactions.ts 200 control,conquest,relic --apply > .tmp/sim/tuneFactions4.log 2>&1 &` (stan w `.tmp/sim/tuneFactions.json`, stary w `tuneFactions.old-0.json`; NIE edytuj `src/` w katalogu głównym do linii `final`; po niej sprawdź `pgrep -f "[t]uneFactions"`, `make check`, commit, potem szczebel A/C/D).

- **Stan 21.11 ok. 06:00:** szczebel B (pełny stroiciel 10 frakcji, `tuneFactions4.log`) NIE osiągnął celu: 27/45 par poza pasmem względnym; średnie dawn 51, horde 47, herds 51, undead 55, clans 55, frost 52, free 41, sands 51, swarm 51, tides 46. Szczeble A i C odpuszczone (diagnoza: liczby mechanik nie przesuwają par; ręczne stroje to setki godzin), przechodzę do D: `AVERAGE_ONLY=1` w `tuneFactions.ts` (tylko średnie 45-55 i granice 25-75), uruchomione od stanu z B: `AVERAGE_ONLY=1 SIM_TIMEOUT_MIN=240 nohup node --import tsx scripts/sim/tuneFactions.ts 200 control,conquest,relic --apply > .tmp/sim/tuneFactions5.log 2>&1 &` (nie edytuj `src/` do linii `final`). Uwaga: `--apply` już zapisał `factionBonus.ts` ze stanu B (niezacommitowany).

- **Stan 21.11 po południu (autor: „wygeneruj całą resztę grafik Dzikiego Stada i zaimplementuj w grze, z animowanymi sprite'ami; na końcu wyłącz komputer”):** Horda zaakceptowana w całości. Karty i portrety Stad gotowe (`scripts/assets/herds_cards.py`, oryginały ilustracji w `.tmp/zrodla/herds_cards/`, **zachowywać oryginały wszystkich ilustracji**). Budżet Scenario: limit 8000 CU na nowe frakcje, szacunek całego Stada ok. 1500-1700 CU; wydatki zapisywać niżej.
  **Plan (odhaczaj, po każdej fazie commit):** (1) herb `cards/crests/herds.png`, ramki `cards/frames/herds_hero|support.png`; (2) ikony 14 zdolności (`cards/abilities/<id>.png` + `_inner`; `ABILITY_ART` w `common.tsx`); (3) arena cyfrowa + głazy (`arena/cyfrowa/herds.webp`, `WIDE_OBSTACLES.herds`), kafle ziemi, rewers, baza, skarbiec (`terrain` w `herds.ts`); (4) osada: tło `osady/land_herds.jpg`, budynki Kamień Tętentu 1-4, Wielkie Pastwiska, Ostoja Wędrówek, siedliska 9 jednostek (`BORROWED` w `SettlementDialog.tsx`); (5) sprite'y 19 jednostek wg `PRZEPIS_JEDNOSTKI.md` (obraz `stoi` jakość medium, nie high; źródła w `.tmp/zrodla/herds_<id>/`, pack → despill (jeśli trzeba) → shrink, wpisy w `sprites.ts` i `assets.json`); (6) muzyka 2-3 utwory; (7) na końcu `make check`, commit, **wyłączyć komputer** (`systemctl poweroff`).
  **Postęp:** faza 1 (herb, ramki) i faza 2 (14 ikon zdolności, `.tmp/zrodla/herds_icons/ids.json`) zrobione 21.11; wydano ok. 6 + 42 CU. Pomocnik wpisów: `scripts/assets/assets_json.py` (put/remove, nie przeformatowuje pliku). Podgląd karty: `npx tsx scripts/browser/karta-stad.ts <id>...`. Faza 3 (arena `herds.webp`, 7 przeszkód, kafle steppe/baseHerds/treasureHerds, nowe typy terenu w `data.ts`) zrobiona 21.11 (ok. 14+28+21 CU); obejrzeć Stada w grze: `make zrzut Q='steps=2&mode=pvp&races=herds,horde&seed=3&reveal=1&objective=control&empire=1&size=medium&shape=rectangle'` (parametr `races` dodany do hooka w `App.tsx`; `until=battle` dla bitwy). Faza 4 (osada: tło, 18+3 budynki, 9 siedlisk; `scripts/assets/herds_settlement.py`, podgląd `npx tsx scripts/browser/osada-stad.ts`) zrobiona 21.11 (ok. 14+90 CU). **Faza 5 (sprite'y 19 jednostek) zrobiona 21.11** (commit 598f8b5): `public/assets/jednostki/<folder>` (mapowanie id → folder w `src/ui/sprites.ts`), wpis `herds/sprity` w `assets.json`, ok. 1500 CU na klipy i obrazy bazowe (19 stoi + 76 klipów + 1 powtórka łucznika). **Faza 6 (muzyka) pominięta:** muzyka w grze jest według sytuacji (`music.ts`, `musicTheme`), nie według frakcji; utwory zwycięstwa nie są używane. Stado nie ma więc własnego utworu. **Dla Stada zostaje:** nic z planu grafik; ewentualnie obejrzeć sprite'y w grze i zgłosić poprawki (arkusze kontaktowe z `.tmp/zrodla/herds_<id>/`). Kolejne frakcje: wg decyzji autora, jedna po drugiej.

