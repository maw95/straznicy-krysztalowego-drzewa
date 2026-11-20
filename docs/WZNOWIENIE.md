# Wznowienie pracy (stan z 20.11.2026, na wypadek zmiany konta Claude)

Ten plik opisuje, co jest rozpoczęte i jak to dokończyć bez znajomości rozmowy, w której powstało. Kolejność zadań jest ważna.
Zasady stałe: `CLAUDE.md`. Nie pushujemy gry. Serwer (`../straznicy-krysztalowego-drzewa-backend`) ma lokalny commit, **nie jest wdrożony**
(dostaje silnik dopiero z wydaniem gry).

## Co jest zrobione (commity w `master`)
- Horda cyfrowa ma +1 Ż i +1 A (`HORDE_DIGITAL_BONUS`, `data.ts`; bez areny i bez wersji planszowej): `22c56b1`.
- Tryb „Potyczka” zamiast Rywalizacji i Kooperacji w wersji cyfrowej, kampania, Przetrwanie i tryb rodzinny na zwykłym bocie: `edf15c2`, `3a164c0`.
  Wersja planszowa nietknięta (zostaje Kooperacja z automatem; silnik zachowuje `mode: 'coop'` tylko dla niej).
- Opis i plan: `docs/BACKLOG.md` punkt 51b.

## Kolejność zadań (ustalona z autorem 20.11, żeby zużyć jak najmniej tokenów; autor może stracić limit w każdej chwili)
1. **Dokończyć przestrojenie poziomów** (zadanie 1 niżej): czekać na `=== done`, `tuneMerge`, `make check`, commit.
2. **Scalić do `master` tylko Wolne Kompanie** z worktree: `git merge ea352d6` (to commit końcowy G1 Kompanii; gałąź `g1-four-factions` ma wyżej commity WIP Piasków,
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
- **Decyzja do podjęcia po stroicielu (ważne):** tabela kontr wymaga Przymierze > Horda 60–70%, a premia +1/+1 dla Hordy dała ok. 50%. Stroiciel sam dobierze premie wszystkich frakcji,
  więc po nim Kryształy i inne cele trzeba przestroić ponownie (`scripts/sim/retune-all.sh` po skasowaniu `.tmp/sim/auto-*.json` oprócz `auto-zero-legacy.json`), potem `tuneMerge`.
  Dlatego obecne pliki `auto-*.json` służą tylko, jeśli premia Hordy zostanie przy +1/+1.
- **Poprawki Kompanii zrobione w gałęzi `kompanie-followups`** (worktree `../skd-kompanie`, commity `d7a10e7`..`0a3faa0`, `make check` zielony, 903 testy; sprzedaż artefaktów w Paserce, zasłona hot-seat, `redactHidden` w backendzie jako lokalny commit `18aa403`): **do scalenia do `master` dopiero po zakończeniu stroiciela** (`git merge kompanie-followups`; zmienia `src/`).
- Dalej wg kolejności powyżej: G1 Piasków (od commitu WIP `3985491` w gałęzi `g1-four-factions`), Rój, Przypływy, G2 ponownie.

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
- Kolejność, po jednej frakcji (wspólne pliki, więc nie równolegle): Wolne Kompanie `free` → Piaski `sands` → Rój `swarm` → Przypływy `tides`.
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
