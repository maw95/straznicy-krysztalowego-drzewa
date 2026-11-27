# Karta frakcji: Żelazny Klan (`clans`) — G1 zrobiona, liczby czekają na G2

Stan: 19.11.2026. Karta powstała z `FRAKCJE_PROPOZYCJE.md` (sekcja 5, zatwierdzona przez autora) i z rozstrzygnięć z rozmowy: **Kozioł Taranowy na 3B zamiast Wiropłatu, Kret z Brązu zamiast Górnika, Strażniczka Przełęczy zamiast Mistrza Balisty, Armata Klanów zamiast Tarana, Skarbnik na 4B, Runiczna Kuźnia trwała (zatwierdzona)**.
Szablon: `KARTA_FRAKCJI_SZABLON.md`. Liczby Ż/A/S i koszty są przybliżone (skala Przymierza, Stad i Umarłych; autor kazał się nimi nie przejmować) i zostaną dostrojone przy bramce G2. Czego **nie** robić: `ODRZUCONE_POMYSLY.md` (żadnych nowych wilków ani psów; Wiropłat, Taran, Górnik i Mistrz Balisty poza składem).

## Tożsamość
- **Nazwa / id:** Żelazny Klan / `clans` (EN: Iron Clan).
- **Klimat:** krasnoludy z gór, mechanizmy z brązu, opancerzone niedźwiedzie bojowe i duchy kopalń (Skarbnik). Krasnoludów najwyżej połowa składu (cztery jednostki z dwunastu: Tarczownik, Kowal, Pogromca, Gwardia), reszta to mechanizmy (Mosiężny Pająk, Kret, Wartownik, Armata, Kolos) i stworzenia gór (Niedźwiedź, Kozioł Taranowy, Skarbnik). Czyste, zadbane metale, złote runy (nie niebieskie), bez żaru i rdzy Hordy.
- **Rola w grze:** obrona i oblężenia.
- **Mechanika wyróżniająca: Mur Tarcz** (w bitwie, budynek Sala Tarcz) i **Runiczna Kuźnia** (trwała, jedyna taka frakcja): runy na pomocnikach z puli frakcji.
- **Mocne strony / słabości:** odporność (pancerz z wielu źródeł), obrona osad, Armata, kontra na szarże Stad. Powolni, bez lotników, rozbijają ich kontrola i wyczerpanie.
- **Jak gra bot:** stoi w szyku (premia za pole obok sojuszników, kara za samotny ruch), strzelcy i Armata strzelają z miejsca (Pająk ma bonus za brak ruchu; Armata i tak nie strzela po ruchu), Przysięgę, Hartowanie, Runę Kamienia, Błędne Światło i Fortyfikację używa, gdy wróg jest w zasięgu; na mapie buduje Sztolnię i Runiczną Kuźnię przed Salą Tarcz i na bieżąco kuje runy (najsilniejszy pomocnik pierwszy: strzelcom +1 A, reszcie pancerz).

## Bohaterowie (3 + czwarty + 3 dowódców)
| Id | Nazwa | Typ | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---:|---|---|---|
| `ironThane` | Tan Żelaznobrody | wojownik | 1 | 11 | 4 | 3 | chód | wręcz | **Przysięga Tarczy** (raz na bitwę, bez celu): sąsiedni sojusznicy mają pancerz 1 do końca rundy |
| `runeMatron` | Matka Run | mędrzec | 1 | 5 | 2 | 3 | chód | dyst. | **Runa Kamienia** (raz na bitwę, cel: sojusznik): pancerz 1 do końca bitwy i nie da się go odepchnąć |
| `passWarden` | Strażniczka Przełęczy | łowca | 1 | 5 | 3 | 4 | chód | dyst. | **Bełt Przeszywający** (stała, jak Przebicie Satyra Kopijnika): cios trafia cel i wroga tuż za nim w linii |
| `oldMiner` | Stary Górmistrz (4. bohater, 7–8 graczy) | wojownik | 1 | 9 | 3 | 4 | chód | wręcz | **Podkop** (jak Podkopnik) |
Specjalności (poziom 5): Tan: pomocnicy +1 Ż (Tarcza Rodu); Matka Run: czary +1 (Wiedza Przodków); Strażniczka: strzelcy +1 A (Oko Celownika); Górmistrz: +1 ruchu na mapie.
Dowódcy z karczmy: Wojownik Klanu (`clanWarrior`, wojownik, Twardy Łeb jak Twardogłowy), Kusznik Gór (`mountainCrossbow`, łowca, Salwa z Miejsca), Kapłan Kuźni (`forgePriest`, mędrzec, Żar Kuźni jak Dar Życia).

## Jednostki rekrutowane w osadzie (ceny jak w grze: poziomy 1–5 = 2/3/5/8/12 zł, legenda 20 zł + 3 Pyły; siedlisko wg poziomu). Układ A/B jak w innych frakcjach: do rekrutacji idzie A (`tierUnits`), B (`altUnits`) tylko na poziomie 6
| Poziom | Id | Nazwa | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność | Siedlisko |
|---|---|---|---:|---:|---:|---:|---|---|---|---|
| 1 | `shieldDwarf` | Krasnoludzki Tarczownik | 1 | 5 | 2 | 3 | chód | wręcz | Pawęż: pancerz 1 | — |
| 1 | `bronzeMole` | Kret z Brązu | 1 | 4 | 2 | 4 | chód | wręcz | Podkop: zamiast ruchu wyłania się na dowolnym wolnym polu w zasięgu 4 | — |
| 1 | `brassSpider` | Mosiężny Pająk | 1 | 4 | 2 | 3 | chód | dyst. | Ostrzał z Miejsca: +2 A, gdy w tej aktywacji się nie ruszał (pająk strzela z kusz na odnóżach) | — |
| 2A | `armoredBear` | Niedźwiedź w Zbroi | 1 | 9 | 3 | 4 | chód | wręcz | Kolczuga: pancerz 1 (bez osłaniania, tego nie robi Prastary Niedźwiedź) | Gawra Zbrojna |
| 2B | `battleSmith` | Kowal Bitewny | 1 | 6 | 2 | 3 | chód | wręcz | Hartowanie: raz na bitwę sąsiad +1 A do końca bitwy | Polowa Kuźnia |
| 3A | `bronzeSentinel` | Wartownik z Brązu | 1 | 8 | 3 | 3 | chód | wręcz | Kolce Mechanizmu: atakujący wręcz traci 1 Ż; odporny na truciznę | Warsztat Mechanizmów |
| 3B | `ramGoat` | Kozioł Taranowy | 1 | 7 | 3 | 5 | chód | wręcz | Taran (zatwierdzone 20.11; dawny Skok po Turniach to zdolność jeźdźca, usunięta): raz na bitwę, jeśli w tej aktywacji ruszył się o co najmniej 2 pola, cios wręcz zadaje +2 A, a trafiony traci następną aktywację (ogłuszenie jak Młot Przodków); bez odepchnięcia | Koźla Zagroda |
| 4A | `giantSlayer` | Pogromca Olbrzymów | 1 | 9 | 4 | 3 | chód | wręcz | Na Duże Cele: +2 A przeciw dużym (dwupolowym) | Sala Pogromców |
| 4B | `skarbnik` | Skarbnik | 1 | 7 | 3 | 4 | chód | dyst. | Błędne Światło: raz na bitwę wróg w zasięgu 4 przestawiony o 2 pola od Skarbnika | Stary Szyb |
| 5A | `hammerGuard` | Gwardia Młota | 1 | 12 | 5 | 3 | chód | wręcz | Młot Przodków: raz na bitwę trafiony traci następną aktywację | Sala Gwardii |
| 5B | `dwarfCannon` | Armata Klanów | 2 | 13 | 5 | 2 | chód | dyst. | Ostrzał: strzał trafia cel i jego sąsiadów (wrogów); brama i mur oblężenia pękają od jednego trafienia | Ludwisarnia |
| 6 | `clanColossus` | Kolos Kuźni | 2 | 20 | 7 | 3 | chód | wręcz | Fortyfikacja: raz na bitwę 2 pola muru obok siebie; pancerz 1; nie do odepchnięcia | Wielka Kuźnia Kolosa |

## Osada
- **Sala Tarcz** (mechanika, rodzic: Fosa i Mury = `walls`; koszt jak Kamień Tętentu): I: jednostka Klanów z co najmniej 2 sąsiednimi żyjącymi sojusznikami ma −1 obrażeń z każdego ciosu · II: wystarczy 1 sąsiad · III: jednostki w szyku nie da się odepchnąć ani przyciągnąć · IV: kto atakuje wręcz jednostkę w szyku, traci 1 Ż.
- **Runiczna Kuźnia** (wyposażenie, rodzic: Kuźnia = `forge`; I: 4 zł + 3 rudy, II: 6 zł + 3 rudy + 2 Pyły): raz na rundę (dla całej frakcji) jeden pomocnik z puli dostaje trwałą runę: +1 A, +1 Ż albo pancerz 1; cena runy 1 zł + 1 ruda. Poziom I: jedna runa na jednostkę, poziom II: dwie (różne). Runy stoją w stanie frakcji pod `id` jednostki, zostają po śmierci pomocnika i jego powrocie do puli. Przycisk w oknie osady (panel budynku).
- **Głęboka Sztolnia** (gospodarka, rodzic: Skarbiec): I: +1 rudy na rundę z każdej osady z nią · II: także +1 Pyłu co 3 rundy z każdej osady z drugim poziomem.
- **Iskra:** Kowadło Pierwotnej Iskry: pancerz 1 (−1 obrażeń z każdego ciosu) wszystkim jednostkom Klanów w każdej bitwie.
- **Nazwy osad:** Żelazny Próg, Kowadło Gór, Głęboka Brama, Miedziany Szyb, Sala Siedmiu Młotów, Kamienna Twierdza, Szara Grań, Brązowe Wrota, Dymny Komin, Runiczna Przełęcz, Ojcowski Kamień, Sztolnia Pod Gwiazdą.

## Wygląd i dźwięk
Paleta: polerowana stal, mosiądz, miedź, szary kamień, ciepła skóra, złote runy (nie niebieskie; bez żaru, lawy i rdzy, żeby odróżnić od Hordy). Herb: młot na kowadle w kole z run. Arena: górska przełęcz z posągami przodków i mostem z kamienia. Muzyka: kowadła w rytmie, niski chór męski, rogi. Lista zastępczej grafiki do wymiany: `BACKLOG.md`, sekcja 2a.

## Silnik: prymitywy użyte i dodane (G1)
- **Dodane** (`battle.ts`, `primitives.ts`, `types.ts`): pancerz z wielu źródeł (stała Pawęż/Kolczuga, Przysięga Tarczy do końca rundy, Runa Kamienia, runy kuźni, Iskra, Mur Tarcz; wszystko to samo „−N z każdego ciosu, trafiony cios zadaje co najmniej 1”, ignorowane przez Grot Umarłych); formacja (`inFormation`, `formationAnchored`); premia za brak ruchu (`standShot`); premia przeciw rozmiarowi (`giantBane`); ogłuszenie (`status.stunned`, aktywacja pomijana w `beginActivation`); przestawienie wroga (`misleadLight` przez `pushAway`); stawianie przeszkody (`fortifyCells`, `BattleState.raised`, rysowane w `ArenaBoard`); przeskok jednorazowy (`goatLeapReady`, wspólny z Kozicą Stad wyszukiwacz `walkSearch(…, leaping)`); trwała runa (`FactionState.runes`, `runeBonus` w `game.ts`); nieruchomość przez status (`status.unmovable`, `canBeMoved`); obszar wokół celu (Ostrzał).
- **Powtórki istniejących zdolności:** Podkop (Podkopnik, `burrow`), Kolce (Jeżozwierz, `quills`, plus odporność na truciznę), Bełt Przeszywający (Przebicie, `pierce`), Twardy Łeb (Twardogłowy), Żar Kuźni (Dar Życia), brama oblężenia od jednego trafienia (Taran Nosorożca).

## Balans (G2)
Cel autora w G2 (19.11): 45–55% w każdej parze (przyjmowane 42–58%). **Zastąpiony 20.11:** frakcje mają się kontrować (średnia 45–55%, kierunek pary wg tabeli „Kto z kim”; zob. BACKLOG punkt 52), więc G2 tych frakcji do powtórzenia w nowym kluczu. Pomiar: `make sim-nowe GAMES=600` (`scripts/sim/nowe-frakcje.ts`): 600 gier na komórkę (±4 pkt), poziom Imperium, mapa długa prostokątna, miejsca na zmianę, cele Kontrola / Podbój / Relikt. Pierwsza liczba to wygrane tej frakcji w %.

Zmierzone 19.11.2026, przed strojeniem i po (Kontrola / Podbój / Relikt):

| Para | Przed | Po |
|---|---|---|
| Klan – Przymierze | 49 / 49 / 49 | 46 / 47 / 46 |
| Klan – Horda | 62 / 62 / 64 | 61 / 60 / 62 |
| Klan – Stado | 57 / 62 / 60 | 48 / 52 / 51 |
| Klan – Umarli | 60 / 65 / 64 | 52 / 53 / 57 |
| Klan – Szron | 40 / 41 / 44 | 41 / 42 / 45 |

**Sufit pomiaru:** Przymierze wygrywa z Hordą 65% (Kontrola 65, Podbój 66, Relikt 65; obu frakcji nie wolno ruszać), więc frakcja, która ma 42–45% z Przymierzem, ma z Hordą ok. 58–62%. Oba końce pasma naraz (≥45% z Przymierzem i ≤55% z Hordą) są przy tej różnicy nieosiągalne; wybrałem środek: ok. 42–46% z Przymierzem i ok. 60% z Hordą (kilka punktów nad pasmem akceptowalnym, nie do usunięcia bez ruszania Hordy).

**Zmienione liczby (w `src/engine/data.ts`; tabele jednostek powyżej to nadal propozycja z karty):**
- **27.11 (backlog 63g, wyrównanie bohaterów):** Tan Żelaznobrody A 3 (z premią frakcji 4), Matka Run Ż 6 (`DIGITAL_STATS`); zob. sekcja 25 notatek.
- **Tan Żelaznobrody: Ż 11→10, Matka Run: Ż 5→4.** Klany były na starcie najsilniejsze (49% z Przymierzem, 62% z Hordą) i dominowały nad Stadami i Umarłymi. Najmocniej reaguje Mosiężny Pająk (Ż 4→3 zbijało wynik o 14 pkt, więc go nie ruszałem: to on niesie Ogień z Miejsca), dlatego nerf poszedł w bohaterów.

**Obserwacja o botach:** w grach botów liczą się bohaterowie i trzej pomocnicy startowi; zmiana Ż jednostek rekrutowanych (poziomy 2–5) nie zmieniła wyniku ani jednej gry (sprawdzone na Klanach: 4 jednostki naraz, identyczne liczby wygranych; przypuszczalnie nie są rekrutowane w krótkich partiach botów), więc liczby tych jednostek zostają z karty, a strojenie dotyczy bohaterów i pomocników startowych.

**Zostaje do decyzji autora:** Klany przegrywają ze Szronem (41–45%) i są na pograniczu pasma; Sala Tarcz nadal jest budowana późno (zob. G1), więc „wytrzymałość” Klanów to w botach głównie pancerz i Ogień z Miejsca, a nie szyk. Tańszy lub wcześniejszy dostęp do Sali Tarcz nie był potrzebny do wejścia w pasmo i nie został zmieniony.

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
**Zmiany jednostek z 20.11.2026 (zatwierdzone przez autora):** Kusznik Klanu → Mosiężny Pająk (T1; strzelający konstrukt z brązu, zdolność i rola Kusznika, bez słowa „bełt”: piszemy „strzała” i „kusza”); Jeździec na Koźle → Kozioł Taranowy (T3B; sam kozioł, bez jeźdźca, zdolność jak wcześniej). Nazwa frakcji: Żelazny Klan. Liczby bez zmian do G2.

Rozstrzygnięcia z rozmowy: Kozioł Taranowy na 3B, Kret z Brązu, Strażniczka Przełęczy, Armata zamiast Tarana, Skarbnik na 4B, Runiczna Kuźnia trwała, runa przy `id` jednostki w stanie frakcji, bez wymagania pełnej tożsamości jednostek; 3 jednostki poziomu 1 (Tarczownik, Kret, Kusznik) są pomocnikami startowymi.
- **Runy (stan i zapis):** `FactionState.runes: Record<unitId, Rune[]>` (`'attack' | 'life' | 'armour'`) i `runeRound`; zwykły JSON, więc zapis i wczytanie nic nie zmieniają (test: `JSON.parse(JSON.stringify(...))`). Runa zostaje po śmierci pomocnika i jego powrocie do puli, a poległy też może dostać runę (czeka na powrót). Nie ma sprawdzania „pełnej tożsamości jednostki”, bo jednostka danego rodzaju jest we frakcji tylko jedna (`hasUnit`). Runy działają w każdej bitwie jednostki (`runeBonus` przy tworzeniu pomocnika, razem z Kuźnią i Iskrą): +1 A i pancerz w skali ataku bitwy, +1 Ż w skali Życia.
- **Akcja `kingdomForgeRune`** (`settlementId`, `unitId`, `rune`): w osadzie własnej frakcji z Runiczną Kuźnią (jak zakupy: bohater nie musi stać w tej osadzie), raz na rundę dla frakcji (`runeRound`), cena `FACTION_MECHANICS.runePrice` (1 zł + 1 ruda), jedna runa na jednostkę na poziomie I, dwie różne na II. Przycisk w oknie osady: kliknięcie budynku Runiczna Kuźnia pokazuje pomocników z trzema przyciskami run, wyszarzonymi z podpowiedzią powodu. Bot: `botRune` (najsilniejszy pomocnik pierwszy, strzelcy dostają +1 A, reszta pancerz), kuje przed rekrutacją i budową. Serwer online jej nie zna (online bez nowych frakcji, 51a).
- **Pancerz i „co najmniej 1”:** wszystkie pancerze Klanów stosują tę samą regułę co Żubr i Pusta Zbroja (cios, który trafia, zadaje co najmniej 1), kolejno po sobie; Grot Przez Zbroję Umarłych je ignoruje.
- **Przysięga Tarczy:** pancerz 1 sąsiadom (bez samego Tana) do końca rundy, w której padła (`status.oathRound`); pancerz z Przysięgi sumuje się z Pawężem, runą i szykiem (każde źródło odejmuje swoje 1, nigdy poniżej 1 obrażenia).
- **Runa Kamienia:** pancerz i nieruchomość (`status.unmovable`) do końca bitwy; nie na sam siebie.
- **Mur Tarcz:** „sojusznik” = każda żyjąca jednostka tej strony obok (też bohater i garnizon). Dotyczy jednostek bitwy, nie pojedynków. Poziom III zakazuje odepchnięcia i przyciągnięcia (nowa reguła `canBeMoved`; przestawienie Skarbnika też jest wtedy bez skutku); IV rani atakującego wręcz po trafieniu (1 Ż w skali Życia).
- **Ostrzał z Miejsca (Mosiężny Pająk; Kusznik Gór: Salwa z Miejsca):** +2 A, gdy w aktywacji nie było ruchu (`movedDistance === 0`); w ruleset cyfrowym strzelec i tak nie strzela po ruchu, więc bonus działa dla każdego strzału z miejsca.
- **Taran (Kozioł Taranowy):** zdolność ataku, raz na bitwę (`ramBlow`, gracz włącza ją przy ataku): wymaga ruchu o co najmniej 2 pola w tej aktywacji (`ABILITY.ramBlowMinMove`), daje +2 A (`ramBlowBonus`) i ogłuszenie trafionego (`status.stunned`, jak Młot Przodków). Bez ruchu zdolność jest niedostępna i nie przepada. Nie odpycha (to mechanika Stad); nie myli się z Taranem Nosorożca Bojowego (stała, odepchnięcie).
- **Błędne Światło:** wróg w zasięgu 4 przesuwa się o 2 pola od Skarbnika (jak odepchnięcie, bez zderzenia, kończy na polu z efektem pola); jednostka dwupolowa, nieruchoma (Żubr, Kolos, Runa Kamienia, szyk poziomu III) nie przesuwa się (zdolność jest wtedy zużyta).
- **Młot Przodków:** ogłuszony traci najbliższą własną aktywację (w tej albo następnej rundzie); statusy odporności Umarłych na to nie działają (ogłuszenie nie jest na liście odporności karty Umarłych).
- **Ostrzał (Armata):** trafia wrogów sąsiadujących z celem (nie sojuszników; uproszczenie); bez osobnej reguły „nie strzela po ruchu”, bo w cyfrowej wersji strzelec nie atakuje po ruchu; brama oblężonej osady pęka od jednego trafienia, gdy w armii atakującego żyje Armata albo Nosorożec Stad.
- **Fortyfikacja (Kolos):** dwa sąsiednie wolne pola w promieniu 2 od Kolosa, najbliższe najbliższego wroga (bez blokowania żadnej jednostki, bo tylko wolne pola); mur trwa do końca bitwy, w stanie bitwy jako `obstacles` i `raised` (ten drugi rysuje arena obrazem muru). Poza ręcznym sprawdzeniem w przeglądarce nie weryfikowano wyglądu.
- **Głęboka Sztolnia:** ruda i Pył liczone w `resourceIncomeBreakdown`; Pył raz na 3 rundy, gdy numer rundy dzieli się przez 3.
- **Bot:** w `botPurchase` Klany budują Sztolnię i Runiczną Kuźnię przed Salą Tarcz (rodzic Sali, Fosa i Mury, bot buduje i tak późno); w bitwie premia za pole obok sojuszników, kara za samotny ruch, premia za obrażenia wokół celu Armaty. NIE zrobione: ustawianie jednostek w zwartym szyku przy rozstawieniu (używa wspólnego `rank`), osłona osad specjalnym ruchem.
- **Ziemia (mapa):** zastępczo jak Stada i Umarli: łąki Przymierza. Arena zastępcza (obrazy Przymierza, inne ułożenie, tło `arena/cyfrowa/clans.webp`).
- **Cele i tryby:** tylko rywalizacja cyfrowa (Kontrola, Podbój, Relikt); koop, arena i online odrzucają frakcję (backlog 51a). Przy stole siedzą najwyżej cztery frakcje (test: Przymierze, Klany, Stada, Umarli).
- **Test na ekranie:** `npx tsx scripts/browser/klany.ts` (kreator oferuje frakcję, panel testowy buduje wszystko, w oknie osady klik runy `+1 A` na Mosiężnym Pająku działa i blokuje kolejne w tej rundzie, bez błędów w konsoli).

## Lista uproszczeń (do G4 albo decyzji autora)
1. Ostrzał Armaty nie rani sojuszników (karta nie rozstrzyga).
2. Błędne Światło to odepchnięcie o 2 pola od Skarbnika, bez wyboru pola przez gracza.
3. Taran: liczby (+2 A, 2 pola ruchu) do dostrojenia na G2.
4. Bot w bitwie nie ustawia jednostek w zwartym szyku przy rozstawieniu i nie ma osobnej taktyki obrony osad.
5. Brak grafiki własnej (zastępcza: `make placeholders`; ikony zdolności pożyczone w `ABILITY_ART`), brak arenowych przeszkód i kafli Klanów, brak obrazu muru Fortyfikacji innego niż pożyczony `wall.webp`, brak muzyki.
6. Brak instrukcji gry PL/EN (G5) i koopu/online (51a); serwer nie zna akcji `kingdomForgeRune`.
