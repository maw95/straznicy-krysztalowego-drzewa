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

## Stan (po wydaniu 2.10.0, 17.11.2026)

Wydane: **2.8.0** (16.11: poziomy 0, 4, 5 i 6, Łatwy na arenie, bot-kupiec, animacje i efekty; gra na Pages, serwer 0.2.0 na Fly.io, silnik 2.8.0). Wcześniej **2.7.0** (14.11, poziom 3 „Osada”). Wszystko z poniższej listy jest już wydane, nic nie czeka na push.

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids` = Łatwy, `economy`, `realm`, `empire`) i w rankingu online zostają. Typ `Level` w `src/engine/types.ts`: `zero | kids | normal | hard`.

## 1. Kolejka prac (w tej kolejności)

Punkty 32–49 z przeglądu 17.11 są zrobione; poniżej kolejka z 18.11 (numery od 50). Wspólna zasada dla zmian liczb lub AI: po zmianie `make sim-raport GAMES=100` (zob. sekcja 5), poprawki strojenia, golden `-u` w **osobnym commicie** z opisem. Serwer (`../straznicy-krysztalowego-drzewa-backend`) dzieli silnik: po zmianie reguł lub akcji zsynchronizować, `make deploy` (backend wolno pushować i wdrażać); gra (push) tylko autor.

**51a. Kooperacja i gra online z nowymi frakcjami (M; razem z pierwszą nową frakcją, punkt 52).** (1) Koop: dziś gracze to Przymierze, a komputer Horda (`isAutomaton`, `goodAction`, `crystalsFor` zakładają `dawn`/`horde`); z nowymi frakcjami gracze wybierają dowolną, komputer inną, więc para „gracze kontra komputer” trzeba uogólnić (ustawienie `setup` mówiące, która strona jest komputerem). (2) Online: serwer (`../straznicy-krysztalowego-drzewa-backend`) sprawdza `FACTIONS` i miejsca `dawn`/`horde`: po nowym wydaniu gry aktualizacja pakietu silnika (zob. `docs/INFRASTRUKTURA.md`), `TableConfig`, `src/rooms/table.ts` (frakcja przy miejscu, limity graczy na stronę), ranking i `factionsOf`; klient `OnlineScreen.tsx` z tym samym wyborem frakcji co `SetupScreen`. Test pokoju na 3 i 4 strony.

**52. Dzikie Stada, pilot procesu nowych frakcji (L; czeka na autora).** Bramki z Parkingu: G0 karta `docs/frakcje/<id>.md` (szablon `docs/KARTA_FRAKCJI_SZABLON.md`, autor) → G1 dane i paczka ze zastępczymi grafikami → G2 balans 45–55% → G3 próbka jednej jednostki w nowym stylu (autor) → G4 pełna grafika, osada, arena, muzyka (`PRZEPIS_JEDNOSTKI.md`) → G5 instrukcja PL i EN, CHANGELOG, `assets.json`, zrzut. Zależność: punkt 51 (zrobiony 18.11). Claude startuje od G1 po karcie i próbce; po frakcji aktualizuje szacunek kredytów (sekcja 8). Koszt grafik i dźwięków: ok. 1 200–1 650 CU na frakcję, więc kredyty dopiero od G4 i z budżetem podanym przez autora.
  - **Stan 19.11 (G1 zrobiona, bez autora):** infrastruktura „strona gra dowolną frakcją” (`SeatSetup.race`, `assignSlots`/`seatTable` w `teams.ts`, teren i nazwy z paczki, `tests/slots.test.ts`), paczka `src/engine/factions/herds.ts` z danymi i zdolnościami (odepchnięcie i zderzenie w `primitives.ts`, `tests/herds.test.ts`), budynki osady, Iskra, dowódcy, bot, angielski w `src/i18n/en/herds.ts`, zastępcza grafika (`make placeholders`), test kontraktowy zielony, golden bez zmian. Decyzje: `docs/frakcje/herds.md`, sekcja „Decyzje implementacyjne”. Szybki pomiar (200 gier na parę, cel Kontrola / Podbój, poziom Imperium, mapa duża prostokątna, miejsca na zmianę): Stada wygrywają z Przymierzem 34% / 30%, z Hordą 55% / 47%.
  - **Zostaje:** G2 balans (Przymierze na poziomie Imperium leczy i wygrywa za często; liczby Stad na karcie to propozycja) · G3 próbka jednej jednostki w nowym stylu (autor) · G4 pełna grafika, siedliska/osada, arena, kafle stepu, muzyka, ramki kart, ikony zdolności, przycisk Ostoi w oknie osady, bot z rozpędem w ustawianiu, szarża Rogów Przodków wg karty · G5 instrukcja PL i EN · 51a: koop i online z nowymi frakcjami (serwer osobno), nowe frakcje w kolorze strony na ekranie bitwy (dziś pierścienie wg slotu strony).

**53. Królestwo Umarłych (L; po 52, te same bramki).**
  - **Stan 19.11 (G1 zrobiona, bez autora):** paczka `src/engine/factions/undead.ts` (bohaterowie, 3 dowódcy, czwarty bohater, 12 jednostek z układem A/B, legenda), nowe prymitywy w silniku (wskrzeszenie w polu, odporność na statusy, ignorowanie pancerza, tarcza jednorazowa wg typu ciosu, aura osłabiająca, wyczerpanie many), budynki Kurhan Wiecznej Warty (4 poziomy, Wieczna Warta), Ossuarium i Dzwonnica Zaduszna, Iskra (odporność na statusy), bot, angielski w `src/i18n/en/undead.ts`, zastępcza grafika (`make placeholders`), `tests/undead.test.ts`, `scripts/sim/umarli.ts`, `scripts/browser/umarli.ts`; test kontraktowy zielony, golden bez zmian. Karta z decyzjami i listą uproszczeń: `docs/frakcje/undead.md`. Szybki pomiar (100 gier na komórkę, poziom Imperium): Umarli wygrywają z Przymierzem 29% / 40% (Kontrola / Podbój), z Hordą 57% / 47%.
  - **Zostaje:** G2 balans (jak u Stad; Kurhan w grach botów budowany rzadko) · G3 próbka jednostki (autor) · G4 pełna grafika, arena, kafle, muzyka, ikony zdolności, wybór poległego w Wezwaniu i Ponownym Oddechu, przenikanie Jeźdźca · G5 instrukcja PL i EN · 51a koop i online.

**54. Żelazne Klany (L; po 53, te same bramki).** Symulacje 10 par po trzech frakcjach.
  - **Stan 19.11 (G1 zrobiona, bez autora):** paczka `src/engine/factions/clans.ts` (3 bohaterów, 3 dowódców, czwarty bohater Stary Górmistrz, 12 jednostek z układem A/B, legenda Kolos Kuźni), nowe prymitywy (pancerz z wielu źródeł i Mur Tarcz, premia za brak ruchu i przeciw rozmiarowi, ogłuszenie, przestawienie wroga, stawianie muru, przeskok jednorazowy, trwałe runy w stanie frakcji), budynki Sala Tarcz (4 poziomy), **Runiczna Kuźnia** (akcja `kingdomForgeRune`, przycisk run w oknie osady, bot kuje runy) i Głęboka Sztolnia, Iskra (pancerz 1), bot, angielski w `src/i18n/en/clans.ts`, zastępcza grafika (`make placeholders`), `tests/clans.test.ts`, `scripts/sim/klany.ts`, `scripts/browser/klany.ts`; test kontraktowy zielony, golden bez zmian. Karta z decyzjami i listą uproszczeń: `docs/frakcje/clans.md`. Szybki pomiar (100 gier na komórkę, poziom Imperium): Klany wygrywają z Przymierzem 44% / 50% (Kontrola / Podbój), z Hordą 57% / 53%.
  - **Zostaje:** G2 balans (Sala Tarcz w botach rzadko budowana; liczby karty to propozycja) · G3 próbka jednostki (autor) · G4 pełna grafika, arena, kafle, muzyka, ikony zdolności, obraz muru Fortyfikacji, wybór pola w Błędnym Świetle, zwarty szyk bota przy rozstawieniu · G5 instrukcja PL i EN · 51a koop i online (serwer musi poznać akcję `kingdomForgeRune`) · Symulacje 10 par po trzech frakcjach.

**55. DLC: Wolne Kompanie, Dwór Wiecznego Szronu, Imperium Piasków, Rój Głębin, Władcy Przypływów (L każda; po 54).** Pełna macierz balansu (`make sim-matrix`) raz na kilka frakcji, w tle, nocą.

**56. Rozszerzenie listy utworów i motywów muzycznych (M).** Dziś gra ma 10 plików w `public/assets/music/` (menu, dwie mapy, dwie bitwy, trzy utwory strażników, rytuał Hordy, dwie wygrane; lista w `MUSIC` w `src/ui/CreditsDialog.tsx`), więc motywy szybko się powtarzają. Do zrobienia: (1) rozpisać, czego brakuje (np. osobne motywy frakcji Przymierza i Hordy na mapie i w bitwie, osada i gospodarka od poziomu IV, walka z Bossem, arena, kampania i Ekspedycja, porażka Przymierza, krótkie sygnały: początek tury, zwycięstwo w bitwie); (2) źródło: wolne licencje (OpenGameArt, CC0 lub CC BY, autorzy trafiają do okna „Autorzy”) albo generowanie w Scenario (ElevenLabs Music, ok. 30 CU za utwór, więc budżet z sekcji 8); (3) każdy przyjęty utwór do repo w tej samej sesji (mp3 małe, pętle bez szwu), wpis w `assets.json` i w `MUSIC`, przypisanie do momentów gry w logice odtwarzania; (4) test w przeglądarce, że przejścia między utworami i głośność działają, także na telefonie. Decyzję o liczbie utworów i o tym, które momenty dostają własną muzykę, podejmuje autor.

**57. Blokowanie kombinacji cel × poziom × mapa, które nie mają sensu (M; najpierw analiza i decyzja autora).** Uwaga autora z 18.11: poziomy od IV (Osada) w górę zdają się nie mieć sensu przy celu „Kryształy do Drzewa” na małej i średniej mapie (gospodarka, siedliska i rozbudowa nie zdążą się rozwinąć przed końcem partii; rundy kończą się w kilka). Może takich par jest więcej. Do zrobienia: (1) policzyć macierzą symulacji cel × poziom × kształt × wielkość mapy (`make sim-matrix`, własny skrypt jak `.tmp/relic.ts`), ile rund trwa partia, ile budynków, rekrutów i czarów w niej powstaje i czy ostatnie mechaniki poziomu w ogóle wchodzą w grę (np. Odłamki przy celu innym niż Relikt, Podbój na małej mapie, Boss i Przetrwanie na kształtach bez miejsca na legowisko); (2) zebrać listę „bez sensu” i „ledwo”; (3) zdecydować z autorem, czy kreator ma te kombinacje **blokować** (wyszarzone karty z podpowiedzią, dlaczego), **ostrzegać** albo **podpowiadać** rozsądniejszą wielkość mapy lub cel; (4) wdrożyć w `NewGameWizard.tsx` i w ograniczeniach silnika (`presets`), z testem, że żadna dozwolona para nie daje partii kończącej się przed użyciem mechanik poziomu, oraz wpisem w instrukcji (PL i EN) i w CHANGELOG. Uwaga: blokada nie może zepsuć zapisanych partii i stołów online, które już mają taką parę.



## 2. Tylko autor (Claude tego nie bierze)
- **Premiera na Steamie** (L): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery: **3.0** (potwierdzone 17.11).
- Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam.
- Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- Odsłuch dźwięków (Claude nie ma jak ich odsłuchać): 7 z 15.11 (`catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3`) i 32 z 16.11 (`public/assets/dzwieki/jednostki/<id>_atak|_smierc.mp3` dla 16 jednostek poziomów 5–6); co się nie podoba, Claude wygeneruje od nowa (1 CU za sztukę).
- **Test na telefonach (dawny punkt 47):** skrypt `scripts/browser/telefon.ts` nie wykazał przewijania poziomego ani elementów poza ekranem. Zostaje: ekrany nieprzejrzane skryptem (dalsze strony kreatora, lobby online, `Własne ustawienia`, okno bohatera w bitwie), monit „obróć telefon” w pionie oraz **prawdziwe urządzenia** (Android i iPhone: pasek adresu iOS, wycięcie ekranu, wydajność WebGL; `vite --host`; pełny ekran po instalacji PWA). Usterki zgłasza autor.
- Pierwsza strona instrukcji planszowej (imienna wiadomość autora) i kąt kamery z wielkością figurek 3D: autor, po obejrzeniu na żywo (decyzja 17.11: poza parkingiem, bez terminu).

## 2a. Zastępcza grafika do wygenerowania (lista dla autora; reguła: każda zastępcza grafika ma tu dokładny opis)

Zastępcze pliki powstają skryptem `make placeholders` (`scripts/placeholders.ts` + `.py`), są małe (kilka KB), podpisane nazwą jednostki w kolorze frakcji i wpisane do `assets.json` z `"placeholder": true`. Skrypt nie nadpisuje istniejących plików; po wymianie na grafikę docelową usuń wpis z manifestu.

**Dzikie Stada (`herds`)** (paleta: płowa sierść, ochra, brąz, kość rogów, zgaszona zieleń, czerwone wstęgi; procedura: `PRZEPIS_JEDNOSTKI.md`):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `greatAurochs`, `satyrHornlord`, `windAntelope`, `thunderRam` (4. bohater), `aurochsScout`, `faunJavelin`, `satyrSeer` (dowódcy), `satyrPiper`, `youngAurochs`, `rockGoat`, `faunSlinger`, `forestBison`, `steppeHippogriff`, `warRhino`, `tarpan`, `satyrLancer`, `drumElephant`, `bullMoose`, `indrik`;
- animacje 2D (`public/assets/jednostki/<folder>`, zestaw jak w `PRZEPIS_JEDNOSTKI.md`) dla tych samych 19; do czasu ich powstania w bitwie są żetony z portretami;
- herb `cards/crests/herds.png`: dwa skrzyżowane rogi nad odciskiem kopyta, ochra;
- ramki kart `cards/frames/herds_hero.png`, `herds_support.png` (dziś pożyczone z Przymierza w `UnitCard.tsx`);
- ikony 14 zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `headbutt`, `rhythm`, `mountainLeap`, `momentum`, `unmoved`, `pierce`, `hippoStrike`, `drumBeat`, `ram`, `roar`, `tremor`, `ancestralHorns`, `wanderHorn`, `runOn` (dziś pożyczone w `ABILITY_ART` w `common.tsx`);
- arena cyfrowa `arena/cyfrowa/herds.webp` (step z wysoką trawą, kurz) i jej przeszkody: głazy (dużo, w tym dwupolowe), obecnie obrazy Przymierza w innym układzie (`WIDE_OBSTACLES.herds`);
- kafle ziemi Stad (step, wzgórza, rzeka, kamienne kręgi), zakryty rewers `tiles/back_herds.jpg`, baza i skarbiec Stad (dziś kafle Przymierza w `herds.ts`, pole `terrain`);
- osada: tło ziemi `osady/land_herds.jpg`, obrazy budynków Kamień Tętentu, Wielkie Pastwiska, Ostoja Wędrówek (3 poziomy Kamienia: 1–4) i siedlisk 9 jednostek (dziś zdjęcia osady i budynków Przymierza w `SettlementDialog.tsx`);
- muzyka frakcji (2–3 utwory: bębny, róg, dudy, rytm galopu).

**Królestwo Umarłych (`undead`)** (paleta: kość, popiel, mech, wosk świec, stare srebro, rdza; poświata zielonkawo-żółta lub biała, nie niebieska; prompty bez słów *corpse, blood, kill*, raczej *ancient guardian, spectral, barrow*):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `barrowKing`, `lanternWraith`, `headlessKnight`, `bellKeeper` (4. bohater), `wardCaptain`, `spectralArcher`, `penitentMonk` (dowódcy), `skeletonSpear`, `willOWisp`, `penitentShade`, `skeletonArcher`, `scarecrow`, `hauntedArmor`, `banshee`, `viy`, `boneOracle`, `lich`, `kostucha`, `boneDragon`;
- animacje 2D (`public/assets/jednostki/<folder>`, zestaw jak w `PRZEPIS_JEDNOSTKI.md`) dla tych samych 19; do czasu ich powstania w bitwie są żetony z portretami;
- herb `cards/crests/undead.png`: latarnia nad kopcem, stare srebro;
- ramki kart `cards/frames/undead_hero.png`, `undead_support.png` (dziś pożyczone z Przymierza w `UnitCard.tsx`);
- ikony 14 zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `barrowCall`, `dimLight`, `spectralCharge`, `bonesReturn`, `incorporeal`, `armorPierce`, `dread`, `hollow`, `wail`, `viyGaze`, `breathAgain`, `manaReap`, `graveBreath`, `toll` (dziś pożyczone w `ABILITY_ART` w `common.tsx`);
- arena cyfrowa `arena/cyfrowa/undead.webp` (kurhany we mgle, krzywe brzozy) i jej przeszkody: kurhany, brzozy, kamienne latarnie (dziś obrazy Przymierza w innym układzie, `WIDE_OBSTACLES.undead`);
- kafle ziemi Umarłych (wrzosowisko, kurhany, cmentarz), zakryty rewers `tiles/back_undead.jpg`, baza i skarbiec (dziś kafle Przymierza w `undead.ts`, pole `terrain`);
- osada: tło ziemi `osady/land_undead.jpg`, obrazy budynków Kurhan Wiecznej Warty (poziomy 1–4), Ossuarium (1–2), Dzwonnica Zaduszna oraz siedlisk 9 jednostek (dziś zdjęcia osady i budynków Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2–3 utwory: dzwony, chór bez słów, lira korbowa, cichy werbel).

**Żelazne Klany (`clans`)** (paleta: polerowana stal, mosiądz, miedź, szary kamień, ciepła skóra, złote runy; bez żaru, lawy i rdzy Hordy, runy złote lub pomarańczowe, nie niebieskie):
- karta (`cards/art/<id>.jpg`, 452×314) i portret (`cards/portraits/<id>.jpg`, 256×256) dla 19 jednostek: `ironThane`, `runeMatron`, `passWarden`, `oldMiner` (4. bohater), `clanWarrior`, `mountainCrossbow`, `forgePriest` (dowódcy), `shieldDwarf`, `bronzeMole`, `clanCrossbow`, `armoredBear`, `battleSmith`, `bronzeSentinel`, `goatRider`, `giantSlayer`, `skarbnik`, `hammerGuard`, `dwarfCannon`, `clanColossus`;
- animacje 2D (`public/assets/jednostki/<folder>`, zestaw jak w `PRZEPIS_JEDNOSTKI.md`) dla tych samych 19; do czasu ich powstania w bitwie są żetony z portretami;
- herb `cards/crests/clans.png`: młot na kowadle w kole z run;
- ramki kart `cards/frames/clans_hero.png`, `clans_support.png` (dziś pożyczone z Przymierza w `UnitCard.tsx`);
- ikony 12 zdolności (`cards/abilities/<id>.png` i `<id>_inner.png`): `shieldOath`, `stoneRune`, `bulwark`, `standShot`, `temper`, `bronzeQuills`, `goatLeap`, `giantBane`, `misleadLight`, `stunBlow`, `cannonFire`, `fortify` (dziś pożyczone w `ABILITY_ART` w `common.tsx`);
- ikony run (`+1 A`, `+1 Ż`, pancerz 1) w oknie Runicznej Kuźni (dziś tekst na przyciskach);
- arena cyfrowa `arena/cyfrowa/clans.webp` (górska przełęcz z posągami przodków i kamiennym mostem) i jej przeszkody: posągi, głazy, skalne mury (dziś obrazy Przymierza w innym układzie, `WIDE_OBSTACLES.clans`); obraz muru Fortyfikacji (dziś `wall.webp`);
- kafle ziemi Klanów (skały, sztolnie, kamienne mosty), zakryty rewers `tiles/back_clans.jpg`, baza i skarbiec (dziś kafle Przymierza w `clans.ts`, pole `terrain`);
- osada: tło ziemi `osady/land_clans.jpg`, obrazy budynków Sala Tarcz (poziomy 1–4), Runiczna Kuźnia (1–2), Głęboka Sztolnia (1–2) oraz siedlisk 9 jednostek (dziś zdjęcia osady i budynków Przymierza, `BORROWED` w `SettlementDialog.tsx`);
- muzyka frakcji (2–3 utwory: kowadła w rytmie, niski chór męski, rogi).

## Przed premierą (decyzja autora 17.11: wchodzą przed Steamem; po punktach z kolejki)
28. **Nowe frakcje:** przeniesione do kolejki (punkty 51–55, decyzja autora 18.11).
30. **Wiele języków (PL + EN):** gra, instrukcja gracza, historia zmian i komunikaty serwera są po polsku i angielsku. **Decyzja autora 18.11:** wersja PDF/DOCX angielskiej instrukcji **odpuszczona na stałe**; grafiki z napisami w kolejce (punkt 57); kolejne języki zaparkowane (Parking); na razie wystarczą PL i EN. Nazwy własne bohaterów i osad celowo po polsku.

## 3. Sprawdzenie na żywo
Wyczyszczone 17.11: autor sam sprawdza grę i zgłasza błędy (`make zgloszenia`); nie prowadzimy listy „do sprawdzenia”.

## 4. Parking (pomysły bez terminu)
- „Cios od tyłu / z flanki” dla innych jednostek. (Więcej niż 6 graczy, do 8: zrobione 17.11; własni czwarci bohaterowie: kolejka, punkt 56.)
- **Kolejne języki** poza PL i EN (nowy plik słownika `src/i18n/<kod>/` i test pokrycia): zaparkowane 18.11, na razie nie potrzeba.
- **PWA: zrobione 17.11** (ręczny service worker `public/sw.js`: kod siecią najpierw, zasoby z pamięci; manifest, ikony, podpowiedź instalacji w Opcjach). Zostaje test na prawdziwych telefonach i, gdy będzie potrzeba, kontrola wersji protokołu z serwerem.
- **Capacitor** (opakowanie gry do Google Play i App Store, natywny push o ruchu w PvP): dopiero po PWA, gdy gra jest stabilna i wyważona, a autor chce dotrzeć do graczy przez sklepy. Koszty: Google Play 25 USD jednorazowo, Apple 99 USD rocznie (do iOS Mac albo build w chmurze), recenzje sklepów (polityka prywatności, usuwanie konta), zgodność starszych klientów ze sklepu z serwerem na Fly.io, testy WebGL w WebView. React Native odrzucony (przepisanie UI).
- **Plan wdrażania nowych frakcji (ustalony 17.11; do rozpoczęcia po wydaniu z Przymierzem i Hordą; rozwija punkt 28).**
  - **Decyzje autora:** gracz wybiera **dowolną** frakcję na swoją stronę; do **4 stron**; komputer w koopie może grać dowolną frakcją (dziś zawsze Horda); wersja planszowa bez zmian (tylko Przymierze i Horda); cel **„Kryształy do Drzewa” tylko Przymierze kontra Horda, dwie strony** (cel wymusza parę i blokuje wybór frakcji, komunikat „ta historia jest o Przymierzu i Hordzie”; test: nie startuje bez tej pary). Pozostałe cele dla dowolnych frakcji; Relikt też (patrz niżej).
  - **Problem wyjściowy:** `FactionId = 'dawn' | 'horde'` znaczy naraz rasę, stronę (drużynę, kasę, skarby, połowę mapy, `homes`) i klucz stanu gry: ok. 200 literałów w silniku, 53 w UI, 33 tabele `Record<FactionId, …>`, `map.ts` z dwoma stałymi narożnikami, ok. 420 w testach.
  - **Faza 0 (dokumenty):** macierz różnicowania mechanik 10 frakcji (rola × mechanika × potrzebne prymitywy; rozstrzygnąć kolizje z `ROZBUDOWA_CYFROWA.md`: odpychanie Stad i Przypływów, odrodzenia Umarłych i skarb „Wskrzeszenie”, niedźwiedzie Klanów i Prastary Niedźwiedź) oraz **biblioteka prymitywów** silnika (odpychanie/przyciąganie, zamiana miejsc, spowolnienie, pułapka, trucizna, aura, odrodzenie, premia za ruch przed atakiem), budowana raz, z testami; karta frakcji składa się z gotowych klocków.
  - **Faza 1 (refaktor bez zmiany zachowania):** rozdzielić **stronę** (`Side`: drużyna, kasa, `homes`) od **rasy** (`FactionId`: dane i grafika), `raceOf(state, side)`; dane kluczowane rasą, stan stroną; `map.ts`: do 4 stref startowych i podział mapy na N stref zamiast połowy; do rozwiązania: sojusz 2 na 2 przy dowolnych frakcjach, koop z 4 stronami, podział kasy przez bota. Kod celu „Kryształy” może zostać przy `'dawn'`/`'horde'`. **Siatka bezpieczeństwa: `golden.test.ts` musi zostać bez zmian** dla Przymierza i Hordy. Mechanicznie, w 2–3 commitach, zero zmian dla gracza.
  - **Relikt a nowe frakcje:** nie jest wyjątkiem (symetryczny). Do uogólnienia: `onRoundLimit` (dziś porównuje tylko `dawn` i `horde`; reguła remisu ustalona 17.11: remis w limicie rund to **remis** we wszystkich celach poza Kryształami, już wdrożone dla Kontroli, Podboju i Relikt (`finishDraw`); dla N stron: wygrywa strona z najlepszym wynikiem, a remis na szczycie to remis; Boss i Artefakt (decyzja 17.11): „nikt nie…” w limicie rund to remis w PvP, w koopie wygrywa Horda (gracze przegrywają); wdrożone), `progress` (lista stron), `SPARK_NAMES` i grafika budynku Iskry na każdą frakcję (część paczki frakcji), mechaniki frakcji w `empire.ts` (`FACTION_MECHANICS` ma dziś tylko `dawn` i `horde`).
  - **Faza 2 („paczka frakcji”):** jeden plik `src/engine/factions/<id>.ts` (bohaterowie, pomocnicy, `RECRUITS`, `ALT_UNITS`, siedliska, 3 unikalne budynki, mechanika, nazwy osad, ziemia, profil bota) + rejestr zastępujący `FACTION_HEROES`/`FACTION_SUPPORTS`/`FACTION_NAMES`; **test kontraktowy** `tests/factionContract.test.ts` po całym rejestrze (3 bohaterów, 7 jednostek, teksty zdolności, pliki grafik, wpisy `assets.json`, pełny zestaw budynków); `make frakcja-lista ID=…` wypisuje braki (to samo trafia do sekcji 2a).
  - **Faza 3 (bramki dla każdej frakcji):** G0 karta `docs/frakcje/<id>.md` (autor) → G1 dane + paczka ze zastępczymi grafikami, grywalna, przechodzi test kontraktowy → G2 balans 45–55% → G3 próbka jednej jednostki w nowym stylu (autor) → G4 pełna grafika, osada, arena, muzyka (`PRZEPIS_JEDNOSTKI.md`) → G5 instrukcja, CHANGELOG, `assets.json`, zrzut. Frakcja jest grywalna i zbalansowana **przed** grafiką (grafika to wąskie gardło, ok. 1 200–1 650 CU na frakcję), więc błąd mechaniki nie kosztuje wymiany animacji.
  - **Faza 4 (balans):** nowa frakcja liczona przeciw **panelowi wzorcowemu** (Przymierze, Horda, 1–2 frakcje o różnej roli, ok. 4 pary), pełna macierz (45 par przy 10 frakcjach) raz na kilka frakcji, w tle, nocą (`make sim-matrix`); limit 3 minut dla pojedynczej symulacji; golden dostaje gry z nowymi frakcjami świadomie, z adnotacją w commicie.
  - **Stan 17.11 (wieczór):** **faza 0 zrobiona** (`docs/FRAKCJE_MACIERZ_I_PRYMITYWY.md`: macierz 10 frakcji i biblioteka prymitywów; decyzje do potwierdzenia na końcu dokumentu). **Faza 2 zaczęta:** `src/engine/factions/` (paczka `dawn.ts`, `horde.ts`, rejestr `index.ts`, typ `FactionPack`); tabele `FACTION_HEROES/SUPPORTS/NAMES`, jednostki tierów, budynki, mechaniki i nazwy osad są wyprowadzone z rejestru bez zmiany zachowania (golden bez zmian); test kontraktowy `tests/factionContract.test.ts` biegnie po całym rejestrze. **Zrobione 17.11:** faza 1 w części: `TeamId` (drużyna, klucz stanu) osobno od `FactionId` (rasa, klucz danych), `raceOf`, `splitZones` (mapa na 1–4 strefy, dla 2 stref wynik bez zmian), cele Kontrola, Podbój i Relikt uogólnione na N drużyn (`bestTeam`), `src/engine/primitives.ts` z testami (odpychanie, przyciąganie, zamiana miejsc, premia grupowa, aura, wyczerpanie many, pola z efektem), `make frakcja-lista ID=…`. **Zostaje:** w silniku nadal na dwie drużyny: cele Kryształy, Przetrwanie, Boss i Artefakt, `generateMap` (strony, siedliska, `homes`), osady i `Settlement.land`, arena, `isAutomaton`; w UI wybór frakcji i kolory miejsc (zob. „Notatki techniczne” w `docs/FRAKCJE_MACIERZ_I_PRYMITYWY.md`); potem pierwsza frakcja (Dzikie Stada) po karcie frakcji `docs/frakcje/<id>.md` i próbce grafiki od autora (bramki G0 i G3).
  - **Stan 18.11:** **faza 1 domknięta** (punkt 51, strona = frakcja): silnik, mapa, cele i boty na 2–4 strony, `third` i `fourth` to miejsca na następne frakcje (do czasu ich paczek czytają dane Przymierza i Hordy), Kryształy do Drzewa tylko Przymierze kontra Horda (test), golden bez zmian. Zostaje koop i gra online z nowymi frakcjami (punkt 51a) oraz same frakcje (faza 2, Dzikie Stada).
  - **Kolejność:** faza 0 → 1 → 2 → **Dzikie Stada** (pilot procesu; po nich aktualizacja szacunku kredytów) → Królestwo Umarłych → Żelazne Klany → DLC (Wolne Kompanie, Dwór Wiecznego Szronu, Imperium Piasków, Rój Głębin, Władcy Przypływów).

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

**Wydatki 17.11 (nocne zadanie):** ikony 5 czarów kręgu III i Przyspieszenia 7 CU; efekty 5 czarów (obraz 3 + klip 10 CU) 65 CU; medale poziomów Wyprawa, Osada, Księstwo 7 CU. Ozdobniki okien (narożnik ramki, tło Księgi czarów, tło skrzyni; po 2 warianty, jakość medium) 18 CU. Rada Osady (2 frakcje, po 2 warianty) 12 CU. Budynki frakcji poziomu 6 (6 obrazów po 2 warianty) 36 CU. Razem 145 CU.

Wpisy autora z 17.11 (wieczór):
- **(17.11, czary)** Trzy kręgi, ulepszanie Wieży maga otwiera wyższy krąg; docelowo pięć (punkt 33).
- **(17.11, arena i Bardzo trudny)** Bot bez błędów na arenie; arena z elementami nowych poziomów, walka 6 na 6, dźwignie: więcej czarów/many/artefaktów bota albo mniej pomocników gracza (punkt 48).
- **(17.11, budynki)** Nowy budynek „Rada Osady”. Koszary uznane za mało przydatne: dokument `docs/BUDYNKI.md` z obecnymi i proponowanymi budynkami; autor na jego podstawie ustala zależności (punkt 37, zakres 3).
8. **(17.11, punkt 47)** Małe chipy kolejki w bitwie zostają bez zmian (podgląd, opis po dotknięciu); nie przeprojektowuję paska bez testu na prawdziwym telefonie.
9. **(17.11, balans poziomów 4–6)** Trudny, cel Kryształy: wpisy w `tuning.ts` (kingdom, Trudny): krótkie mapy PvP 3 skarby Hordy, krótka koop 2 graczy 4 skarby, średnie i długie PvP 1 skarb. Pomiar 100 gier na komórkę (`.tmp/lv.sh` ze `scripts/sim/kingdom.ts`): Trudny 31–52% (przed: 23–53%, krótkie mapy 48–53%); Łatwy 63–86%, Normalny 42–71% bez zmian. Pozostałe odstępstwa z sekcji 5 zostają (komórki w granicy błędu ±5 pkt).
10. **(17.11, balans Podbój i Relikt)** Normalny: wpisy w `tuning.ts` dla Podboju na bardzo długiej mapie i Reliktu na krótkiej (koop 2 i PvP 2) oraz bardzo długiej (koop 2): Relikt 2 graczy krótka 72→67/59%, bardzo długa 75→65%, Podbój bardzo długa koop 2 69→62%. Dalej poza pasmem: Podbój, koop 1 gracz, bardzo długa mapa (33–34%; dźwignie skarbów i limitu rund nie działają, potrzebna inna, np. słabsi obrońcy osad Hordy).
