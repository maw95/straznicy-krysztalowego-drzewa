# Karta frakcji: Dzikie Stado (`herds`) — szkic G0 do zatwierdzenia

Stan: 18.11.2026, zsynchronizowane z `FRAKCJE_PROPOZYCJE.md` po uwagach autora z 19.11 (mamut do Szronu, Łamignat, Łoś, Nosorożec na poziom 5). **Szkic Claude'a na bazie `FRAKCJE_PROPOZYCJE.md` (sekcja 3)**: liczby są propozycją na skali Przymierza i Hordy
i zostaną dostrojone symulacjami przy bramce G2. Do decyzji autora: sekcja „Pytania” na końcu. Szablon: `KARTA_FRAKCJI_SZABLON.md`.

## Tożsamość
- **Nazwa / id:** Dzikie Stado / `herds` (EN: Wild Herd).
- **Klimat:** wędrowne stada stepów i puszcz: tury, żubry, nosorożce i łosie, prowadzone przez satyrów z rogami i dudami. Ich osady to obozowiska
  przy wodopojach i kamiennych kręgach. Walczą rozpędem: kto stoi na drodze stada, ląduje na skale.
- **Rola w grze:** agresja + mobilność (inicjatywa, rozbijanie szyków, szybkie dojście do strzelców).
- **Mechanika wyróżniająca: Tętent.** Rozpędzona jednostka spycha cel; cel, który uderzy w głaz, krawędź areny albo inną jednostkę,
  dostaje dodatkowe obrażenia (zderzenie). Przymierze ma premie za bieg, Stado ma odepchnięcie i zderzenie. Arena Stada ma dużo głazów.
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
Dowódcy z karczmy: Turzy Zagończyk (wojownik), Orzeł Stepowy Łowca (łowca, wręcz, lot), Płanetnik (mędrzec). Czwarty bohater (7–8 graczy): Baran Gromowładny (wojownik, odepchnięcie po każdym ataku).

## Jednostki rekrutowane w osadzie (ceny jak w grze: poziomy 1–5 = 2/3/5/8/12 zł, legenda 20 zł + 3 Pyły; siedlisko wg poziomu)
| Poziom | Id | Nazwa | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | `satyrPiper` | Satyr Dudziarz | 4 | 1 | 4 | chód | dyst. | Skoczny Rytm: raz na bitwę sojusznik +2 S |
| 1 | `youngAurochs` | Młody Tur | 5 | 2 | 4 | chód | wręcz | Byczy Łeb: po każdym ataku odpycha cel o 1 |
| 1 | `kulan` | Kulan Stepowy | 5 | 2 | 5 | chód | wręcz | Skok po Turniach: ruch przez przeszkody i jednostki |
| 2A | `steppeArcher` | Łucznik Stepowy | 5 | 2 | 4 | chód | dyst. | Strzała w Kolano: raz na bitwę trafiony −2 S |
| 2B | `muskOx` | Wół Piżmowy | 6 | 3 | 6 | chód | wręcz | Rozpęd: +1 A po przebiegnięciu ≥3 pól |
| 3A | `forestBison` | Żubr Puszczański | 9 | 3 | 3 | chód | wręcz | Niewzruszony: pancerz 1, nie da się go odepchnąć |
| 3B | `arkar` | Arkar | 7 | 3 | 5 | chód | wręcz | Przebicie: cios trafia cel i jednostkę za nim |
| 4A | `steppeLamignat` | Łamignat Stepowy (2 pola) | 9 | 4 | 7 | lot | wręcz | Lot na Strzelców: +2 A na cel odepchnięty w tej rundzie; jedyny lotnik Stada |
| 4B | `drumElephant` | Słoń z Bębnem (2 pola; zamiast Bawołu, decyzja 19.11) | 12 | 4 | 4 | chód | wręcz | Bęben Wędrówki: sojusznicy w promieniu 2 mają +1 S |
| 5A | `warRhino` | Nosorożec Bojowy (2 pola) | 14 | 5 | 5 | chód | wręcz | Stratowanie (dawniej Taran): po ≥3 polach odepchnięcie o 2, zderzenie +2; podwójne obrażenia bramom |
| 5B | `bullMoose` | Łoś Rogacz (2 pola) | 15 | 5 | 3 | chód | wręcz | Rykowisko: raz na bitwę wyzywa wroga w zasięgu 3; ten w swojej następnej aktywacji może atakować tylko Łosia |
| 6 | `indrik` | Indrik, Pan Zwierząt (2 pola) | 20 | 7 | 4 | chód | wręcz | Ziemia Drży: raz na bitwę mali wrogowie w promieniu 2 odepchnięci o 1; sam nie do odepchnięcia |

Nowe prymitywy silnika do zrobienia przy G1: odepchnięcie (zbudować na `boulder`), zderzenie, przeskok (Kulan), odporność na przesunięcie, prowokacja (Łoś). Reszta to powtórki istniejących zdolności.

## Osada
- **Budynki:** Kamień Tętentu (mechanika, rodzic: Koszary; I: rozpęd ≥3 pola odpycha o 1, II: zderzenie +1, III: próg 2 pola, IV: zderzony cel −1 S), Wielkie Pastwiska
  (gospodarka, rodzic: Targ; I: tiery 1–3 tańsze o 1 zł, II: wszystkie), Ostoja Wędrówek (mapa, rodzic: Karczma; raz na rundę przeniesienie bohatera do innej własnej osady z Ostoją).
- **Iskra:** Ołtarz Rogów Pierwotnej Iskry: +1 S wszystkim jednostkom Stada w każdej bitwie.
- **Nazwy osad:** Tętniący Bród, Rogaty Kamień, Turza Polana, Kopytnik, Wichrowy Step, Żubrza Ostoja, Pyłowy Szlak, Grzmiący Jar, Słone Lizawisko, Dudniąca Dolina, Wodopój Trzech Rogów, Trawiaste Morze.

## Wygląd i dźwięk
Paleta: płowa sierść, ochra, brąz, kość rogów, zgaszona zieleń, czerwone wstęgi. Herb: dwa skrzyżowane rogi nad odciskiem kopyta. Arena: step z wysoką trawą i głazami, kurz. Muzyka: bębny, róg, dudy, rytm galopu.


**Odróżnienie wyglądu (zatwierdzone przez autora 20.11.2026; wiążące przy G4):**
- **Łamignat Stepowy kontra Gryf (neutralny strażnik, występuje w tych samych bitwach):** tułów konia (maść gniada lub myszata, grzywa, kopyta, koński ogon); z orła tylko głowa, skrzydła i przednie nogi, bez lwiego tułowia i lwiego ogona. Gdyby na małym sprite’ie nadal były zbyt podobne, rozważyć inną jednostkę lotną.
- **Zmiany jednostek z 20.11.2026 (zatwierdzone przez autora):** Kulan Stepowy (T1, zamiast Kozicy Skalnej; stepowy dziki osioł, smukły, piaskowy, z ciemnym pasem na grzbiecie), Łucznik Stepowy (T2A, **satyr z łukiem ujeżdżający tarpana**, decyzja autora 20.11; zamiast Fauna Procarza; zdolność i dystans bez zmian, **otwarte pytanie:** sam tarpan z łukiem czy łucznik na tarpanie), Wół Piżmowy (T2B, zamiast Tarpana; rola i Rozpęd starego Tarpana), Arkar (T3B, zamiast Satyra Kopijnika; wielki dziki baran z zakręconymi rogami, Przebicie), Łamignat Stepowy (T4A, zamiast Hipogryfa; 2 pola, lot, Lot na Strzelców), dowódcy: Orzeł Stepowy Łowca (zamiast Fauna Oszczepnika) i Płanetnik (zamiast Satyra Wróżbity); Turzy Zagończyk bez zmian. Zdolności i liczby starych jednostek przechodzą do nowych; balans zrobi G2. Siedliska: Łucznicze Błonia, Piżmowe Zimowisko, Pasmo Arkarów, Gniazdo na Urwisku.

## Grafika (po zatwierdzeniu)
10 postaci × ok. 88 CU (3 bohaterów + 7 jednostek; w tabeli powyżej są 12 jednostek, bo tiery mają A/B, patrz „Pytania”), osada z 3 unikalnymi budynkami i siedliskami, arena, kafle, herb, 2–3 utwory muzyki. Szacunek i procedura: `BACKLOG.md` (sekcja 8) i `PRZEPIS_JEDNOSTKI.md`.

## Balans (G2)
Cel autora w G2 (19.11): 45–55% w każdej parze (przyjmowane 42–58%). **Zastąpiony 20.11:** frakcje mają się kontrować (średnia 45–55%, kierunek pary wg tabeli „Kto z kim”; zob. BACKLOG punkt 52), więc G2 tych frakcji do powtórzenia w nowym kluczu. Pomiar: `make sim-nowe GAMES=600` (`scripts/sim/nowe-frakcje.ts`): 600 gier na komórkę (±4 pkt), poziom Imperium, mapa długa prostokątna, miejsca na zmianę, cele Kontrola / Podbój / Relikt. Pierwsza liczba to wygrane tej frakcji w %.

Zmierzone 19.11.2026, przed strojeniem i po (Kontrola / Podbój / Relikt):

| Para | Przed | Po |
|---|---|---|
| Stado – Przymierze | 36 / 30 / 33 | 47 / 41 / 40 |
| Stado – Horda | 55 / 50 / 53 | 64 / 59 / 62 |
| Stado – Umarli | 43 / 43 / 43 | 44 / 44 / 45 |
| Stado – Klany | 43 / 38 / 40 | 52 / 48 / 49 |
| Stado – Szron | 37 / 33 / 38 | 51 / 48 / 49 |

**Sufit pomiaru:** Przymierze wygrywa z Hordą 65% (Kontrola 65, Podbój 66, Relikt 65; obu frakcji nie wolno ruszać), więc frakcja, która ma 42–45% z Przymierzem, ma z Hordą ok. 58–62%. Oba końce pasma naraz (≥45% z Przymierzem i ≤55% z Hordą) są przy tej różnicy nieosiągalne; wybrałem środek: ok. 42–46% z Przymierzem i ok. 60% z Hordą (kilka punktów nad pasmem akceptowalnym, nie do usunięcia bez ruszania Hordy).

**Zmienione liczby (w `src/engine/data.ts`; tabele jednostek powyżej to nadal propozycja z karty):**
- Wszyscy bohaterowie i pomocnicy Stada (także dowódcy, wersje B i legenda) mają **+1 Ż** (Wielki Tur 12, Satyr Rogogłos 6, Pędziwiatr 8, Baran 9, Dudziarz 5, Młody Tur 6, Kulan 6, Indrik 21 itd.). Powód: pierwszy pomiar dawał 30–36% z Przymierzem; +1 Ż było najtańszym pokrętłem (+1 A wszystkim dawało już 47/40 z Przymierzem, ale 68/60 z Hordą, czyli za dużo).
- **Młody Tur: A 2→3** (Byczy Łeb, odpychający pomocnik startowy). Najlepszy pojedynczy ruch w skanie: +3–4 pkt z Przymierzem i tożsamość frakcji (rozpęd i odpychanie) bez zmiany mechaniki. Test `tests/herds.test.ts` (obrażenia Byczego Łba) czyta teraz 3 A.

**Obserwacja o botach:** w grach botów liczą się bohaterowie i trzej pomocnicy startowi; zmiana Ż jednostek rekrutowanych (poziomy 2–5) nie zmieniła wyniku ani jednej gry (sprawdzone na Klanach: 4 jednostki naraz, identyczne liczby wygranych; przypuszczalnie nie są rekrutowane w krótkich partiach botów), więc liczby tych jednostek zostają z karty, a strojenie dotyczy bohaterów i pomocników startowych.

**Zostaje do decyzji autora:** Podbój jest u Stada stale 5–6 pkt słabszy od Kontroli (z Przymierzem 41 wobec 47); przyczyny nie badałem (karta zapowiada słabość wobec murów osad bez Nosorożca). Bot nie ustawia jednostek pod rozpęd (G4), więc Tętent działa tylko przy przypadkowych biegach; kolejny zysk tożsamości dałoby dopiero to ustawianie, a nie liczby. Próg rozpędu (`herdsRun` 3→2) nie zmienił wyniku ani o jedną grę: przypuszczalnie dlatego, że Kamień Tętentu w grach botów praktycznie nie powstaje (nie sprawdzałem tego osobno).

## Pytania do autora (decyzje potrzebne do G1)
1. Satyrowie, tury i faun: zostają, czy wolisz centaury i minotaury z pomysłu z 3.11 (kolizja z Centaurem Przymierza i Herszta Minotaurów Hordy; propozycje zastępcze w `FRAKCJE_PROPOZYCJE.md`)?
2. Czy każda frakcja ma 7 jednostek rekrutowanych (1 + 4 poziomy po jednej + legenda) w wersji podstawowej, a drugi z pary A/B tylko na poziomie 6, tak jak Przymierze i Horda? (Tak jest w tej tabeli: 2A/3A/4A/5A to wersja podstawowa, B to alternatywa poziomu 6.)
3. Czy 3 jednostki poziomu 1 (Dudziarz, Młody Tur, Kulan) są dobre jako „pomocnicy startowi”?
4. Czy zderzenie ma ranić także własne jednostki, o które uderzy odepchnięty wróg (proponuję: tak, jednostkę w którą uderza)?

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
Odpowiedzi na „Pytania”: 1) satyrowie, tury i faun zostają; 2) A/B jak w Przymierzu i Hordzie: do rekrutacji idzie pierwsza jednostka pary (`tierUnits`), druga (`altUnits`) tylko na poziomie 6; 3) trzy jednostki poziomu 1 są pomocnikami startowymi; 4) zderzenie rani też jednostkę, w którą uderza odepchnięty (swoją i cudzą).
- **Zderzenie:** odepchnięty cel, który zatrzyma krawędź areny, głaz albo jednostka, dostaje 1 obrażenie (skala małych liczb, mnożone przez `scaleOf`; Taran: 2). Cel przyparty do głazu (odepchnięcie o 0 pól) też się zderza. Jednostka dwupolowa, Żubr i Indrik nie są przesuwane i się nie zderzają. Odepchnięcie zaznacza cel jako „odepchnięty w tej rundzie” (Hipogryf).
- **Rogi Przodków (Wielki Tur):** uproszczenie karty: zamiast szarży w linii do 4 pól z zepchnięciem małych wrogów na bok, jest to zdolność ataku raz na bitwę: cios odpycha cel o 2 pola (zderzenie rani). Szarża i spychanie na bok wymagałyby nowej akcji bitwy (UI, bot, serwer); do rozważenia przy G2/G4.
- **Skoczny Rytm, Róg Wędrówki:** +2 S w następnej aktywacji sojusznika (zapisane jako ujemne spowolnienie `slowNext`, więc znosi się z korzeniami). Skoczny Rytm: dowolny sojusznik poza Dudziarzem.
- **W Biegu (Pędziwiatr):** po ataku skok (jak Powietrzny Zryw) o tyle pól, ile zostało z Szybkości po biegu przed atakiem; bez zapasu aktywacja się kończy.
- **Skok po Turniach (Kulan):** przechodzi przez przeszkody i jednostki, nie staje na nich; nie działa w oblężeniu (mury).
- **Przebicie (Arkar):** trafia też wroga stojącego tuż za celem w jednej linii (sojusznika nie rani, inaczej niż Oddech Smoka).
- **Rykowisko (Łoś):** wzywany wróg w swojej następnej aktywacji może atakować tylko Łosia (jeśli nie sięga, nie atakuje wcale i może tylko iść); znika po jego aktywacji.
- **Bęben Wędrówki (Słoń):** aura +1 S liczona na początku rundy i aktywacji (nie sumuje się, nie dotyczy samego Słonia).
- **Stratowanie (Nosorożec, dawniej Taran; Kozioł Taranowy zachowuje Taran):** „podwójne obrażenia bramom” wykonane jako: gdy w armii atakującego żyje Nosorożec, brama oblężonej osady pęka od jednego trafienia katapulty (zwykle dwa).
- **Kamień Tętentu:** poziomy I–IV jak na karcie; działa dla każdej jednostki Stada w walce wręcz (poza własnymi odepchnięciami jednostek), a zderzenie poziomu II dodaje 1 obrażenie każdemu zderzeniu Stada (też Byczemu Łbowi i Taranowi).
- **Wielkie Pastwiska:** poziom I obniża o 1 zł ceny pomocników poziomów 1–3, poziom II poziomów 1–5 (legenda bez zniżki).
- **Ostoja Wędrówek:** nowa akcja `kingdomRefuge` (cel: inna własna osada z Ostoją, raz na rundę na bohatera); przycisk w oknie osady (kliknięcie budynku Ostoja Wędrówek: lista własnych osad z Ostoją, do których można się przenieść) dodany 19.11 przy Klanach; sprawdzony w przeglądarce tylko do ekranu bez celu (jedna osada na starcie), sama akcja ma test w `tests/herds.test.ts`.
- **Ziemia (mapa):** zastępczo ziemia Stada wygląda jak łąki Przymierza (te same kafle, baza, skarbiec, ściana „Przepaść”), talia kafli: łąka, jałowa równina, wzgórza, rzeka, most, góry, przepaść. Arena: zastępcza (obrazy Przymierza, inne ułożenie, nowe tło `arena/cyfrowa/herds.webp`).
- **Dowódcy z karczmy:** Turzy Zagończyk (Kark Tura jak Twardogłowy), Orzeł Stepowy Łowca (nazwa własna dowódcy: Łowca Wiatru; walczy wręcz i lata (decyzja 20.11); zdolność Nurkowanie (`huntDive`): lot nad przeszkodami i jednostkami, a cios po ruchu o co najmniej 2 pola w tej aktywacji zadaje +2 A (`ABILITY.huntDiveMinMove`, `huntDiveBonus`; wzór: Szarża Światła); zastępuje dawny Strzał nad Przeszkodami; specjalność „Szpon z Góry” (dawniej Mistrz Oszczepu): +1 A dla niego i dla jednostek powietrznych Stad, np. Łamignata, pole `airborne` w `heroTypes.ts`), Płanetnik (nazwa własna: Płanetnik; Pieśń Stepu jak Skoczny Rytm). Czwarty bohater: Baran Gromowładny (Byczy Łeb).
- **Bot:** wybiera cele, których odepchnięcie kończy się zderzeniem (premia za obrażenia zderzenia), lubi strzelców (jednostki wręcz Stada) i bieg o ≥3 pola; używa Rogu, Rytmu, Rykowiska i Ziemi Drży od razu; na mapie gra jak Horda (podbój), Ostoją przerzuca bohatera bliżej Drzewa. NIE zrobione: ustawianie jednostek daleko od wroga pod rozpęd.
- **Cele i tryby:** nowe frakcje tylko w rywalizacji cyfrowej w celach Kontrola, Podbój, Relikt; koop, arena i gra online ich odrzucają (czytelny błąd; online nie oferuje frakcji). Backlog 51a.
