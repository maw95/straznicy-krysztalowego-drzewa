# Karta frakcji: Dzikie Stada (`herds`) — szkic G0 do zatwierdzenia

Stan: 18.11.2026, zsynchronizowane z `FRAKCJE_PROPOZYCJE.md` po uwagach autora z 19.11 (mamut do Szronu, Hipogryf, Łoś, Nosorożec na poziom 5). **Szkic Claude'a na bazie `FRAKCJE_PROPOZYCJE.md` (sekcja 3)**: liczby są propozycją na skali Przymierza i Hordy
i zostaną dostrojone symulacjami przy bramce G2. Do decyzji autora: sekcja „Pytania” na końcu. Szablon: `KARTA_FRAKCJI_SZABLON.md`.

## Tożsamość
- **Nazwa / id:** Dzikie Stada / `herds` (EN: Wild Herds).
- **Klimat:** wędrowne stada stepów i puszcz: tury, żubry, nosorożce i łosie, prowadzone przez satyrów z rogami i dudami. Ich osady to obozowiska
  przy wodopojach i kamiennych kręgach. Walczą rozpędem: kto stoi na drodze stada, ląduje na skale.
- **Rola w grze:** agresja + mobilność (inicjatywa, rozbijanie szyków, szybkie dojście do strzelców).
- **Mechanika wyróżniająca: Tętent.** Rozpędzona jednostka spycha cel; cel, który uderzy w głaz, krawędź areny albo inną jednostkę,
  dostaje dodatkowe obrażenia (zderzenie). Przymierze ma premie za bieg, Stada mają odepchnięcie i zderzenie. Arena Stad ma dużo głazów.
- **Mocne strony / słabości:** mocne: inicjatywa, dojście do strzelców, podbój mapy. Słabe: brak leczenia, słabi strzelcy, mury osad
  (potrzeba Nosorożca), jednostki, których nie da się odepchnąć.
- **Jak gra bot:** ustawia jednostki daleko od wroga (rozpęd), wybiera cele przy głazach i krawędzi, szybcy idą po strzelców. Na mapie podbija kopalnie i
  osady, używa Ostoi do przerzutu. **Nie wolno mu:** stać w miejscu, szturmować murów bez Nosorożca.

## Bohaterowie (3) — propozycja liczb (skala jak Przymierze: Ż 8–11, A 4–5, S 4–8)
| Id | Nazwa | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---:|---:|---:|---|---|---|
| `greatAurochs` | Wielki Tur, Ojciec Stada (2 pola, wojownik) | 11 | 4 | 5 | chód | wręcz | **Rogi Przodków:** raz na bitwę szarża w linii prostej do 4 pól; mali wrogowie na drodze zepchnięci na bok, cel na końcu odepchnięty o 2 (zderzenie rani) |
| `satyrHornlord` | Satyr Rogogłos (mędrzec) | 5 | 2 | 4 | chód | dyst. | **Róg Wędrówki:** raz na bitwę wszyscy sojusznicy +2 S w następnej aktywacji |
| `windAntelope` | Pędziwiatr, Wódz Antylop (łowca) | 7 | 4 | 7 | chód | wręcz | **W Biegu:** raz na bitwę po ataku dokańcza ruch pozostałymi polami |

Specjalności (poziom 5): Wielki Tur: pomocnicy +1 Ż; Satyr Rogogłos: czary +1; Pędziwiatr: +1 ruchu na mapie.
Dowódcy z karczmy: Turzy Zagończyk (wojownik), Faun Oszczepnik (łowca, dyst.), Satyr Wróżbita (mędrzec). Czwarty bohater (7–8 graczy): Baran Gromowładny (wojownik, odepchnięcie po każdym ataku).

## Jednostki rekrutowane w osadzie (ceny jak w grze: poziomy 1–5 = 2/3/5/8/12 zł, legenda 20 zł + 3 Pyły; siedlisko wg poziomu)
| Poziom | Id | Nazwa | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | `satyrPiper` | Satyr Dudziarz | 4 | 1 | 4 | chód | dyst. | Skoczny Rytm: raz na bitwę sojusznik +2 S |
| 1 | `youngAurochs` | Młody Tur | 5 | 2 | 4 | chód | wręcz | Byczy Łeb: po każdym ataku odpycha cel o 1 |
| 1 | `rockGoat` | Kozica Skalna | 5 | 2 | 5 | chód | wręcz | Skok po Turniach: ruch przez przeszkody i jednostki |
| 2A | `faunSlinger` | Faun Procarz | 5 | 2 | 4 | chód | dyst. | Kamień w Kolano: raz na bitwę trafiony −2 S |
| 2B | `tarpan` | Tarpan | 6 | 3 | 6 | chód | wręcz | Rozpęd: +1 A po przebiegnięciu ≥3 pól |
| 3A | `forestBison` | Żubr Puszczański | 9 | 3 | 3 | chód | wręcz | Niewzruszony: pancerz 1, nie da się go odepchnąć |
| 3B | `satyrLancer` | Satyr Kopijnik | 7 | 3 | 5 | chód | wręcz | Przebicie: cios trafia cel i jednostkę za nim |
| 4A | `steppeHippogriff` | Hipogryf Stepowy (2 pola) | 9 | 4 | 7 | lot | wręcz | Lot na Strzelców: +2 A na cel odepchnięty w tej rundzie; jedyny lotnik Stad |
| 4B | `drumElephant` | Słoń z Bębnem (2 pola; zamiast Bawołu, decyzja 19.11) | 12 | 4 | 4 | chód | wręcz | Bęben Wędrówki: sojusznicy w promieniu 2 mają +1 S |
| 5A | `warRhino` | Nosorożec Bojowy (2 pola) | 14 | 5 | 5 | chód | wręcz | Taran: po ≥3 polach odepchnięcie o 2, zderzenie +2; podwójne obrażenia bramom |
| 5B | `bullMoose` | Łoś Rogacz (2 pola) | 15 | 5 | 3 | chód | wręcz | Rykowisko: raz na bitwę wyzywa wroga w zasięgu 3; ten w swojej następnej aktywacji może atakować tylko Łosia |
| 6 | `indrik` | Indrik, Pan Zwierząt (2 pola) | 20 | 7 | 4 | chód | wręcz | Ziemia Drży: raz na bitwę mali wrogowie w promieniu 2 odepchnięci o 1; sam nie do odepchnięcia |

Nowe prymitywy silnika do zrobienia przy G1: odepchnięcie (zbudować na `boulder`), zderzenie, przeskok (Kozica), odporność na przesunięcie, prowokacja (Łoś). Reszta to powtórki istniejących zdolności.

## Osada
- **Budynki:** Kamień Tętentu (mechanika, rodzic: Koszary; I: rozpęd ≥3 pola odpycha o 1, II: zderzenie +1, III: próg 2 pola, IV: zderzony cel −1 S), Wielkie Pastwiska
  (gospodarka, rodzic: Targ; I: tiery 1–3 tańsze o 1 zł, II: wszystkie), Ostoja Wędrówek (mapa, rodzic: Karczma; raz na rundę przeniesienie bohatera do innej własnej osady z Ostoją).
- **Iskra:** Ołtarz Rogów Pierwotnej Iskry: +1 S wszystkim jednostkom Stad w każdej bitwie.
- **Nazwy osad:** Tętniący Bród, Rogaty Kamień, Turza Polana, Kopytnik, Wichrowy Step, Żubrza Ostoja, Pyłowy Szlak, Grzmiący Jar, Słone Lizawisko, Dudniąca Dolina, Wodopój Trzech Rogów, Trawiaste Morze.

## Wygląd i dźwięk
Paleta: płowa sierść, ochra, brąz, kość rogów, zgaszona zieleń, czerwone wstęgi. Herb: dwa skrzyżowane rogi nad odciskiem kopyta. Arena: step z wysoką trawą i głazami, kurz. Muzyka: bębny, róg, dudy, rytm galopu.

## Grafika (po zatwierdzeniu)
10 postaci × ok. 88 CU (3 bohaterów + 7 jednostek; w tabeli powyżej są 12 jednostek, bo tiery mają A/B, patrz „Pytania”), osada z 3 unikalnymi budynkami i siedliskami, arena, kafle, herb, 2–3 utwory muzyki. Szacunek i procedura: `BACKLOG.md` (sekcja 8) i `PRZEPIS_JEDNOSTKI.md`.

## Balans (G2)
Cel 45–55% w każdej parze z Przymierzem i Hordą (`make sim-tabele`).

## Pytania do autora (decyzje potrzebne do G1)
1. Satyrowie, tury i faun: zostają, czy wolisz centaury i minotaury z pomysłu z 3.11 (kolizja z Centaurem Przymierza i Herszta Minotaurów Hordy; propozycje zastępcze w `FRAKCJE_PROPOZYCJE.md`)?
2. Czy każda frakcja ma 7 jednostek rekrutowanych (1 + 4 poziomy po jednej + legenda) w wersji podstawowej, a drugi z pary A/B tylko na poziomie 6, tak jak Przymierze i Horda? (Tak jest w tej tabeli: 2A/3A/4A/5A to wersja podstawowa, B to alternatywa poziomu 6.)
3. Czy 3 jednostki poziomu 1 (Dudziarz, Młody Tur, Kozica) są dobre jako „pomocnicy startowi”?
4. Czy zderzenie ma ranić także własne jednostki, o które uderzy odepchnięty wróg (proponuję: tak, jednostkę w którą uderza)?

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
Odpowiedzi na „Pytania”: 1) satyrowie, tury i faun zostają; 2) A/B jak w Przymierzu i Hordzie: do rekrutacji idzie pierwsza jednostka pary (`tierUnits`), druga (`altUnits`) tylko na poziomie 6; 3) trzy jednostki poziomu 1 są pomocnikami startowymi; 4) zderzenie rani też jednostkę, w którą uderza odepchnięty (swoją i cudzą).
- **Zderzenie:** odepchnięty cel, który zatrzyma krawędź areny, głaz albo jednostka, dostaje 1 obrażenie (skala małych liczb, mnożone przez `scaleOf`; Taran: 2). Cel przyparty do głazu (odepchnięcie o 0 pól) też się zderza. Jednostka dwupolowa, Żubr i Indrik nie są przesuwane i się nie zderzają. Odepchnięcie zaznacza cel jako „odepchnięty w tej rundzie” (Hipogryf).
- **Rogi Przodków (Wielki Tur):** uproszczenie karty: zamiast szarży w linii do 4 pól z zepchnięciem małych wrogów na bok, jest to zdolność ataku raz na bitwę: cios odpycha cel o 2 pola (zderzenie rani). Szarża i spychanie na bok wymagałyby nowej akcji bitwy (UI, bot, serwer); do rozważenia przy G2/G4.
- **Skoczny Rytm, Róg Wędrówki:** +2 S w następnej aktywacji sojusznika (zapisane jako ujemne spowolnienie `slowNext`, więc znosi się z korzeniami). Skoczny Rytm: dowolny sojusznik poza Dudziarzem.
- **W Biegu (Pędziwiatr):** po ataku skok (jak Powietrzny Zryw) o tyle pól, ile zostało z Szybkości po biegu przed atakiem; bez zapasu aktywacja się kończy.
- **Skok po Turniach (Kozica):** przechodzi przez przeszkody i jednostki, nie staje na nich; nie działa w oblężeniu (mury).
- **Przebicie (Satyr Kopijnik):** trafia też wroga stojącego tuż za celem w jednej linii (sojusznika nie rani, inaczej niż Oddech Smoka).
- **Rykowisko (Łoś):** wzywany wróg w swojej następnej aktywacji może atakować tylko Łosia (jeśli nie sięga, nie atakuje wcale i może tylko iść); znika po jego aktywacji.
- **Bęben Wędrówki (Słoń):** aura +1 S liczona na początku rundy i aktywacji (nie sumuje się, nie dotyczy samego Słonia).
- **Taran (Nosorożec):** „podwójne obrażenia bramom” wykonane jako: gdy w armii atakującego żyje Nosorożec, brama oblężonej osady pęka od jednego trafienia katapulty (zwykle dwa).
- **Kamień Tętentu:** poziomy I–IV jak na karcie; działa dla każdej jednostki Stad w walce wręcz (poza własnymi odepchnięciami jednostek), a zderzenie poziomu II dodaje 1 obrażenie każdemu zderzeniu Stad (też Byczemu Łbowi i Taranowi).
- **Wielkie Pastwiska:** poziom I obniża o 1 zł ceny pomocników poziomów 1–3, poziom II poziomów 1–5 (legenda bez zniżki).
- **Ostoja Wędrówek:** nowa akcja `kingdomRefuge` (cel: inna własna osada z Ostoją, raz na rundę na bohatera); przycisk w oknie osady dopiero w G4 (bot z niej korzysta, gracz jeszcze nie ma przycisku).
- **Ziemia (mapa):** zastępczo ziemia Stad wygląda jak łąki Przymierza (te same kafle, baza, skarbiec, ściana „Przepaść”), talia kafli: łąka, jałowa równina, wzgórza, rzeka, most, góry, przepaść. Arena: zastępcza (obrazy Przymierza, inne ułożenie, nowe tło `arena/cyfrowa/herds.webp`).
- **Dowódcy z karczmy:** Turzy Zagończyk (Kark Tura jak Twardogłowy), Faun Oszczepnik (Oszczep w Kolano jak Korzenie), Satyr Wróżbita (Pieśń Stepu jak Skoczny Rytm). Czwarty bohater: Baran Gromowładny (Byczy Łeb).
- **Bot:** wybiera cele, których odepchnięcie kończy się zderzeniem (premia za obrażenia zderzenia), lubi strzelców (jednostki wręcz Stad) i bieg o ≥3 pola; używa Rogu, Rytmu, Rykowiska i Ziemi Drży od razu; na mapie gra jak Horda (podbój), Ostoją przerzuca bohatera bliżej Drzewa. NIE zrobione: ustawianie jednostek daleko od wroga pod rozpęd.
- **Cele i tryby:** nowe frakcje tylko w rywalizacji cyfrowej w celach Kontrola, Podbój, Relikt; koop, arena i gra online ich odrzucają (czytelny błąd; online nie oferuje frakcji). Backlog 51a.
