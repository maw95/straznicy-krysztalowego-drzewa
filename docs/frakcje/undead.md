# Karta frakcji: Królestwo Umarłych (`undead`) — G1 zrobiona, liczby czekają na G2

Stan: 19.11.2026. Karta powstała z `FRAKCJE_PROPOZYCJE.md` (sekcja 4, zatwierdzona przez autora) i z rozstrzygnięć z rozmowy: **Wij Podziemny na 4A, Lisz (nie Licz) na 5A, Kostucha na 5B, zamiast Kurhanowego Olbrzyma i Jeźdźca na Zmorze**.
Szablon: `KARTA_FRAKCJI_SZABLON.md`. Liczby Ż/A/S i koszty są przybliżone (skala Przymierza i Stad) i zostaną dostrojone przy bramce G2. Czego **nie** robić: `ODRZUCONE_POMYSLY.md` (żadnych nowych wilków ani psów, więc bez Wilkołaka-widma).

## Tożsamość
- **Nazwa / id:** Królestwo Umarłych / `undead` (EN: Barrow Kingdom).
- **Klimat:** baśniowo, nie makabrycznie: kurhany we mgle, latarnie, duchy dawnych strażników, którzy nie odeszli, bo pilnują przysięgi. Szkielety są czyste i dumne, zbroje stoją same, płaczki zawodzą w wieżach. Bliżej „Ballady o Kościeju” niż horroru.
- **Rola w grze:** wyczerpanie (długa bitwa, osłabianie, powroty poległych).
- **Mechanika wyróżniająca: Wieczna Warta.** Polegli **pomocnicy** wracają na arenę (bohaterowie nie wstają). Dźwignią jest budynek Kurhan Wiecznej Warty; do tego Wezwanie z Kurhanu Króla, Kości Wracają Szkieleta i Ponowny Oddech Wróżki.
- **Mocne strony / słabości:** długa bitwa, przewaga liczebna w późnych rundach, odporność na statusy (Iskra, Pusta Zbroja). Wolni, mało obrażeń naraz; Horda i Rój kończą, zanim Warta zadziała.
- **Jak gra bot:** tanie szkielety na pierwszej linii (i tak wstaną), strzelcy i bohaterowie z tyłu (premia za ryzyko jest większa dla bohaterów, bo nie wstają), Lisz i Latarniczka celują w bohatera wroga, zdolności (Wezwanie, Lament, Dzwon, Wij) używane od razu, gdy mają cel; na mapie od razu buduje Szpital (rodzic Kurhanu) i Kurhan.

## Bohaterowie (3 + czwarty + 3 dowódców)
| Id | Nazwa | Typ | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---:|---|---|---|
| `barrowKing` | Król Kurhanu | wojownik | 1 | 10 | 4 | 4 | chód | wręcz | **Wezwanie z Kurhanu** (raz na bitwę, bez celu): najsilniejszy poległy pomocnik wstaje na sąsiednim polu z połową Ż |
| `lanternWraith` | Latarniczka Mgieł | mędrzec | 1 | 5 | 2 | 5 | lot | dyst. | **Zgaszone Światło** (raz na bitwę, w ataku): trafiony −1 A w następnym ataku, bohater wroga traci 2 many |
| `headlessKnight` | Bezgłowy Jeździec | łowca | 2 | 9 | 5 | 6 | chód | wręcz | **Widmowa Szarża** (raz na bitwę, w ataku): +2 A, od tyłu jeszcze +2 A |
| `bellKeeper` | Duch Starego Dzwonnika (4. bohater, 7–8 graczy) | mędrzec | 1 | 5 | 2 | 3 | chód | dyst. | **Dzwon Zaduszny** (raz na bitwę): sąsiedni wrogowie −2 S w następnej aktywacji |
Specjalności (poziom 5): Król: pomocnicy +1 Ż (Pan Warty); Latarniczka: +1 many na rundę (Wieczny Płomyk); Jeździec: +1 ruchu na mapie (Nocny Gościniec); Dzwonnik: czary +1.
Dowódcy z karczmy: Kapitan Warty (`wardCaptain`, wojownik, Czujna Warta jak Twardogłowy), Upiorna Łuczniczka (`spectralArcher`, łowca, Zwodnicza Strzała jak Korzenie), Pokutny Mnich (`penitentMonk`, mędrzec, Pokutny Lament jak Lament Płaczki).

## Jednostki rekrutowane w osadzie (ceny jak w grze: poziomy 1–5 = 2/3/5/8/12 zł, legenda 20 zł + 3 Pyły; siedlisko wg poziomu). Układ A/B jak w Przymierzu, Hordzie i Stadach: do rekrutacji idzie A (`tierUnits`), B (`altUnits`) tylko na poziomie 6
| Poziom | Id | Nazwa | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność | Siedlisko |
|---|---|---|---:|---:|---:|---:|---|---|---|---|
| 1 | `skeletonSpear` | Szkielet Halabardnik | 1 | 4 | 2 | 4 | chód | wręcz | Kości Wracają: raz na bitwę po śmierci składa się na końcu rundy z 1 Ż | — |
| 1 | `willOWisp` | Błędny Ognik | 1 | 3 | 1 | 5 | lot | dyst. | Zwodzenie: raz na bitwę trafiony −2 S (jak Korzenie) | — |
| 1 | `penitentShade` | Zjawa Pokutnika | 1 | 4 | 2 | 4 | chód | wręcz | Bezcielesna: pierwszy cios dystansowy w bitwie zadaje 0 | — |
| 2A | `skeletonArcher` | Szkielet Łucznik | 1 | 5 | 2 | 4 | chód | dyst. | Grot Przez Zbroję: ignoruje pancerz | Zbrojownia Kości |
| 2B | `scarecrow` | Strach Polny | 1 | 6 | 2 | 4 | chód | wręcz | Postrach: sąsiedni wrogowie −1 A | Opuszczone Pole |
| 3A | `hauntedArmor` | Nawiedzona Zbroja | 1 | 8 | 3 | 3 | chód | wręcz | Pusta w Środku: pancerz 1, odporność na statusy | Rycerska Krypta |
| 3B | `banshee` | Płaczka | 1 | 6 | 3 | 5 | lot | dyst. | Lament: raz na bitwę wrogowie w promieniu 2 −1 A w następnym ataku | Wieża Płaczek |
| 4A | `viy` | Wij Podziemny | 2 | 12 | 4 | 3 | chód | wręcz | Podnieście Mi Powieki: raz na bitwę wróg w zasięgu 3 nie ruszy się w następnej aktywacji | Wielki Kurhan |
| 4B | `boneOracle` | Kościana Wróżka | 1 | 7 | 3 | 4 | chód | dyst. | Ponowny Oddech: raz na bitwę poległy pomocnik poziomu ≤3 wstaje obok z połową Ż | Kaplica Wróżb |
| 5A | `lich` | Lisz | 1 | 8 | 5 | 4 | chód | dyst. | Żniwo Many: każde trafienie zabiera bohaterowi wroga 1 many i leczy Lisza o 1 Ż | Biblioteka Umarłych |
| 5B | `kostucha` | Kostucha | 1 | 13 | 5 | 4 | chód | wręcz | Kośba: atak trafia cel i jednego jego sąsiada (jak Paszcze Otchłani) | Kaplica Tańca Śmierci |
| 6 | `boneDragon` | Kościany Smok | 2 | 20 | 7 | 5 | lot | wręcz | Oddech Grobu: raz na bitwę oddech w linii (cel i jednostka za nim, jak Ognisty Oddech), trafieni −1 S | Smocze Cmentarzysko |

## Osada
- **Kurhan Wiecznej Warty** (mechanika, rodzic: Szpital; koszt jak Kamień Tętentu): I: raz na bitwę, na końcu rundy, najtańszy poległy pomocnik wstaje z 1 Ż (na swoim polu albo najbliższym wolnym) · II: z połową Ż · III: dwa razy na bitwę · IV: z pełnym Ż. Bohaterowie nie wstają.
- **Ossuarium** (gospodarka, rodzic: Skarbiec): I: wskrzeszenie w Szpitalu tańsze o 1 zł · II: pomocnicy poziomów 1–2 wracają za darmo.
- **Dzwonnica Zaduszna** (mapa, rodzic: Koszary): po wygranej bitwie z neutralnymi jeden poległy pomocnik poziomu 1–2 wraca do drużyny bez Szpitala (raz na rundę).
- **Iskra:** Krypta Pierwotnej Iskry: jednostki Umarłych odporne na truciznę, klątwy, spowolnienia i unieruchomienie.
- **Nazwy osad:** Mglisty Kurhan, Szare Wrzosowisko, Zadumane Opactwo, Latarniany Gród, Popielne Wzgórze, Zaduszny Dwór, Srebrny Całun, Cmentarne Sady, Siedem Kopców, Stary Dzwon, Wieczna Cisza, Krucza Kaplica.

## Wygląd i dźwięk
Paleta: kość, popiel, mech, wosk świec, stare srebro, rdza; poświata duchów zielonkawo-żółta albo biała, nie niebieska. Herb: latarnia nad kopcem. Arena: kurhany we mgle, krzywe brzozy, kamienne latarnie. Muzyka: dzwony, chór bez słów, lira korbowa, cichy werbel. Prompty: unikać słów *corpse, blood, kill*; pisać *ancient guardian, spectral, barrow*. Lista zastępczej grafiki do wymiany: `BACKLOG.md`, sekcja 2a.

## Silnik: prymitywy użyte i dodane (G1)
- **Dodane** (`src/engine/primitives.ts`, `battle.ts`): wskrzeszenie w polu (`raiseUnit`, `fallenSupports`), odporność na statusy (`resistsStatus`: flaga `immune` z Iskry albo Pusta w Środku; stare Trzewiki z Kory nadal chronią tylko przed korzeniami i spowolnieniem), ignorowanie pancerza (Grot), tarcza jednorazowa wg typu ciosu (Bezcielesna), aura osłabiająca (Postrach, liczona na bieżąco), wyczerpanie many (`drainMana` z istniejącej biblioteki, użyte przez Żniwo i Zgaszone Światło), koniec rundy z podnoszeniem (`risingsAtRoundEnd`).
- **Powtórki istniejących zdolności:** Zwodzenie i Zwodnicza Strzała (Korzenie), Czujna Warta (Twardogłowy), Kośba (Paszcze Otchłani), Oddech Grobu (Ognisty Oddech plus spowolnienie).
- **Nie dublowane:** `slow`, `root`, `poison`, `curse` zostają w silniku; odporność sprawdza się w miejscach, gdzie status jest nakładany.

## Balans (G2)
Cel 45–55% w każdej parze z Przymierzem i Hordą (`make sim-tabele`). Szybki pomiar G1 (`npx tsx scripts/sim/umarli.ts 100`, 100 gier na komórkę, poziom Imperium, mapa długa prostokątna, miejsca na zmianę): Umarli wygrywają z Przymierzem 29% (Kontrola) i 40% (Podbój), z Hordą 57% i 47%. Jak u Stad (34/30 i 55/47): Przymierze na tym poziomie leczy i wygrywa za często, a o wyniku gry decyduje mapa i bohaterowie, nie jednostki. Bez strojenia liczb (decyzja autora). Obserwacja: w grach botów (ok. 10 rund) Kurhan jest budowany rzadko (6–8 gier na 40: koszt w Pyle i Szpital jako rodzic), więc Wieczna Warta w botach działa głównie przez Wezwanie, Kości i Wróżkę; do G2: tańszy Kurhan albo wcześniejsza ścieżka budowy.

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
Rozstrzygnięcia z rozmowy: Wij na 4A, Lisz na 5A, Kostucha na 5B (zamiast Jeźdźca na Zmorze), bez Kurhanowego Olbrzyma i Wilkołaka-widma; 3 jednostki poziomu 1 (Szkielet Halabardnik, Błędny Ognik, Zjawa Pokutnika) są pomocnikami startowymi.
- **Kto wstaje i kiedy:** na końcu rundy (gdy zaczyna się następna) wstają najpierw szkielety z Kości Wracają (na swoim polu z 1 Ż), potem Kurhan podnosi **najtańszego** poległego pomocnika strony (najniższy poziom, potem najmniej Ż); liczba wstań na bitwę i Ż: patrz tabela budynku (`FACTION_MECHANICS.wardRises`, `wardShare`). Bez Kurhanu frakcja nie ma Warty (jak Kamień Tętentu u Stad), ale zdolności jednostek działają zawsze. Bitwa kończy się, gdy jedna strona nie ma żywych jednostek, nawet jeśli poległy szkielet miał wstać.
- **Pole wstania:** w ruleset cyfrowym poległy leży na polu, na którym padł: wstaje tam albo na najbliższym wolnym; w klasycznym (bez zwłok) na wolnym polu startowym strony. Jednostka dwupolowa potrzebuje miejsca na ogon.
- **Wezwanie z Kurhanu / Ponowny Oddech:** zamiast wyboru poległego w oknie (nowy ekran) wstaje automatycznie najsilniejszy poległy pomocnik (najwyższy poziom, potem najwięcej Ż); u Wróżki tylko poziomu ≤3. Pole: najbliższe wolne obok wzywającego. Uproszczenie do G4 (wybór poległego w UI).
- **Skarb Wskrzeszenie:** nie działa w bitwie na jednostkę, która w tej bitwie już wstała (propozycja z karty, wdrożona; flaga `risen`). Bot też o tym wie.
- **Odporność na statusy:** `immune` z Iskry (nadawana jednostkom przy tworzeniu) i Pusta w Środku chronią przed trucizną, klątwą (też Lamentem i Zgaszonym Światłem), spowolnieniem (też czarem i Dzwonem, Oddechem Grobu), korzeniami i unieruchomieniem (Sieć, Wij, Chwyt). Nie chronią przed przesunięciem ani prowokacją.
- **Bezgłowy Jeździec:** uproszczenie karty: zamiast „przenika przez jednostki i atakuje od tyłu” jest ostry cios raz na bitwę (+2 A, od tyłu +2 A), bo przenikanie jednostki dwupolowej wymaga nowego wyszukiwania ścieżki (zostaje do G4; Skok po Turniach Stad działa tylko dla małych).
- **Zgaszone Światło:** karta: „bohater wroga traci N many, trafiony cel −1 A”. Wdrożone jako zdolność ataku: klątwa na trafionym (jak Klątwa Cieni) i utrata 2 many przez bohatera przeciwnej strony (jeśli ma czary; w bitwie bez bohatera z manią nic).
- **Żniwo Many:** każde trafienie leczy Lisza o 1 Ż (nawet gdy bohater wroga nie ma już many) i zabiera 1 many, jeśli jest.
- **Postrach:** aura liczona w momencie ataku (nie na początku aktywacji), nie sumuje się; dotyczy ataku sąsiedniego wroga, nie jego ruchu.
- **Lament:** −1 A w następnym ataku każdego wroga w promieniu 2 (znika po jego ataku; to ten sam licznik co klątwa Szamana Cieni, więc obie sumują się).
- **Podnieście Mi Powieki:** raz na bitwę, zasięg 3, unieruchomienie do następnej aktywacji celu (bez ataku w ruchu i bez możliwości ruchu).
- **Oddech Grobu:** jak Ognisty Oddech (cel i wróg, a w ruleset cyfrowym też sojusznik za celem), plus −1 S w następnej aktywacji trafionych.
- **Dzwon Zaduszny** (czwarty bohater): sąsiedzi −2 S; z kolei Dzwonnica Zaduszna (budynek) zwraca poległego pomocnika poziomu 1–2 po wygranej z neutralnymi, raz na rundę.
- **Ossuarium:** cena wskrzeszenia w Szpitalu −1 zł (min. 1) na poziomie I; na poziomie II pomocnicy poziomów 1–2 za darmo (cena 0). Bonus liczy się z najlepszego Ossuarium frakcji.
- **Ziemia (mapa):** zastępczo jak Stada: łąki Przymierza. Arena zastępcza (obrazy Przymierza, nowe tło `arena/cyfrowa/undead.webp`).
- **Cele i tryby:** tylko rywalizacja cyfrowa (Kontrola, Podbój, Relikt); koop, arena i online odrzucają frakcję (backlog 51a). Przy stole mogą siedzieć cztery frakcje (test: Przymierze, Horda, Stada i Umarli).
- **Test na ekranie:** `npx tsx scripts/browser/umarli.ts` (kreator oferuje frakcję, bitwa botów z jednostkami Umarłych się rysuje, bez błędów w konsoli).

## Lista uproszczeń (do G4 albo decyzji autora)
1. Wezwanie z Kurhanu i Ponowny Oddech podnoszą automatycznie najsilniejszego poległego (brak wyboru w oknie).
2. Widmowa Szarża bez przenikania przez jednostki.
3. Bot na mapie gra jak pozostałe frakcje (wyjątek: od razu buduje Szpital i Kurhan); w bitwie ustawia jednostki według `rank` (tanie z przodu, strzelcy i bohaterowie z tyłu) i nie wysuwa bohaterów. Brak osobnej oceny „czas gra na mnie”.
4. Brak grafiki własnej (zastępcza: `make placeholders`; ikony zdolności pożyczone w `ABILITY_ART`), brak arenowych przeszkód i kafli Umarłych, brak przycisku Dzwonnicy (działa sama), brak muzyki.
5. Brak instrukcji gry PL/EN (G5) i koopu/online (51a).
