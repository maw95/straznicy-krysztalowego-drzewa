# STRAŻNICY KRYSZTAŁOWEGO DRZEWA
## Specyfikacja implementacji wersji komputerowej / prompt dla AI programującej

**Wersja:** 0.9, projekt do testów; **język UI:** polski.  
**Finalne nazwy:** gra **Strażnicy Kryształowego Drzewa**; dobro **Przymierze Świtu**; zło **Mroczna Horda**.

### Cel implementacji
Stwórz **grywalny prototyp lokalnej planszówki turowej 2D**, nie wizualną makietę. Użytkownik chce testować w praktyce balans jednostek, eksplorację, czas gry i liczbę strat. Preferuj deterministyczny silnik zasad niezależny od UI, data-driven konfigurację, zapisy stanu, seed RNG i automatyczne testy/symulacje. Nie zakładaj konkretnej technologii; jeśli nie zostanie wskazana, wybierz przeglądarkową TypeScript + SVG/Canvas, działającą offline.

## 1. Stan ustaleń i zasady interpretacji
Tagi: **POTWIERDZONE** (decyzja użytkownika), **TEST** (szacowany parametr), **DO USTALENIA** (bez decyzji; nie maskuj własnym arbitralnym wyborem). W UI konfiguracja powinna pozwolić zmieniać liczbowe wartości bez rekompilacji.

**POTWIERDZONE**:
- 2–4 graczy, tryb kooperacyjny (wszyscy dobrzy kontra AI) lub rywalizacyjny (dobro kontra zło). Maks. 2 graczy na frakcję.
- Frakcja ma 3 bohaterów głównych i 3 pomocników; gracz kontroluje jednego głównego bohatera. Jedna wspólna pula pomocników na frakcję.
- Bitwy 3 na 3; przeciw neutralnemu strażnikowi 3 na 1. W bitwie 1 główny bohater + 2 wybranych żywych pomocników. Wrogie pomocniki kooperacyjne wybierane losowo spośród żywych.
- Walka do eliminacji wszystkich jednostek po jednej stronie. Śmierć permanentna; ocalałe po walce odzyskują pełne Ż. Gdy główny bohater umrze w trakcie bitwy, jego pomocnicy walczą do końca, potem wracają do wspólnej puli. Gracz czeka na wskrzeszenie przez żyjącego sojuszniczego bohatera. Wariant łatwiejszy: przejęcie innego dostępnego głównego bohatera.
- Bez kontrataków, bez kostki domyślnie. Aktywacja jednostki w walce = ruch do S heksów i opcjonalnie 1 atak; każda jednostka 1 aktywacja/runda, malejąco wg S. Równoważne remisy: opcjonalnie inicjatywa rotacyjna lub pierwszeństwo obrońcy.
- Podstawowy wariant nie używa zdolności unikalnych; zaawansowany używa zdolności. Typ (wręcz/strzelec/latający) działa w obu. Opcjonalna kostka −1, 0, +1 modyfikuje obrażenia z minimum 0.
- Strzelec: nieograniczony zasięg, wymagana widoczność, przeszkody blokują LOS. Przy sąsiadującym przeciwniku może atakować jedynie sąsiadującego wroga, albo najpierw się odsunąć.
- Latanie: można przemieszczać się nad przeszkodami, ale zakończyć ruch tylko na legalnym wolnym heksie.
- Złoty Smok buffuje sojuszników (Słoneczny Blask); Czarny Smok: Ognisty Oddech, atak dwóch jednostek w linii.
- Bitwa 9 × 11, dwie skrajne kolumny startowe, stałe przeszkody na polu bitwy. Neutralny boss 1 aktywacja/runda; powinien stanowić małe lub średnie wyzwanie (ewentualne straty 1–2 pomocników, nie rutynowa zagłada).
- Mapy przygodowe: warianty 21 / 36 / 66 heksów, 2 / 3 / 3 kryształy, 2 / 4 / 6 skarbów. Kształt trójkąta; starty w dolnych narożach, Drzewo u góry. Każdy bohater 2 punkty ruchu na rundę; zwykły teren kosztuje 1, trudny 2, góry niedostępne. Niewykorzystane punkty przepadają.
- Odkryte od początku: starty, Drzewo, pola sąsiadujące ze startami. Po wejściu na już odkryty heks ujawnij jego zakrytych sąsiadów. Brak kosztu odkrywania.
- Mapa: A — stałe góry i losowe kryształy/skarby; B — układ tajny od projektanta mapy (gracza lub osoby trzeciej), z kontrolą osiągalności. Nie ujawniać lokalizacji kryształów.
- Kryształy pilnowane przez neutralnych: Cyklop Błyskotek, Gryf Złodziej Skarbów, Hydra z Zatopionych Ruin. Neutralni nie są stroną polityczną konfliktu.
- Przed startem WYJMIJ z talii wszystkie Eliksiry Odrodzenia. Krótka: dokładnie 1 Odrodzenie + 1 inny losowy skarb. Średnia: 2 Odrodzenia + 2 inne losowe. Długa: 2 Odrodzenia + 4 inne losowe. Pozostałe karty losuj z puli bez Odrodzeń. Ukryj ich położenie.
- Zło nie zdobywa kryształów od neutralnych. Jeśli dobro traci nosiciela, kryształ upada na pole jego śmierci; zło może strzec pole, nie przechowuje kryształu.
- W coop główni bohaterowie zła = początkowej liczbie głównych bohaterów dobra. Zło zmierza ku Drzewu albo najbliższemu bohaterowi dobra: wybiera cel o mniejszej odległości; w remisie wybiera bohatera. Jeśli wróg sąsiaduje, rozpoczyna walkę. Zły przy Drzewie blokuje oddanie kryształu do czasu wygrania z nim walki.
- Warunek zła: limit rund, eliminacja zdolności dobra do dalszej gry albo rytuał przy Drzewie ukończony po przetrwaniu tam do końca następnej rundy przez wszystkich obecnie żyjących głównych bohaterów zła. Martwych nie liczymy do wymaganego składu.
- Jednorazowe przedmioty nie zabierają akcji, zwykle użycie PRZED aktywacją jednostki. Tarcza Strażnika jest wyjątkiem: reakcyjna, neutralizuje całe obrażenia jednego ataku. Róg Strażników: wymiana aktywnego (żywego lub zabitego) pomocnika na żywego rezerwowego LUB jedna dodatkowa aktywacja (ruch i atak) żywego pomocnika.

**TEST — startowe parametry**: limity rund 12/20/30; ok. 10% gór / 30% trudnych / 60% łatwych; ok. 12–15 przeszkód na arenie; szczegóły statystyk, zadań bossów i ilości obrażeń zdolności.

## 2. Statystyki i obciążenie typów
Pula głównego = 18 pkt; pomocnika = 11 pkt. Koszt strzelania = +2 do budżetu, latania = +1, wręcz = 0. Ż+A+S+koszt typu = budżet. Latanie i strzelanie nie są zdolnościami. Nie narzucać minimalnego HP. Najnowsze uzgodnione preferencje: Złoty Smok — ATK; Jednorożec — SPD; Niedźwiedź — HP; Czarny Smok wyższy ATK niż Złoty, niższy HP; Wilkołak niższy SPD niż Jednorożec, wyższy ATK; Ogr niższy SPD niż Niedźwiedź, wyższy ATK.

| Frakcja | Jednostka | Rola | Ż | A | S | Typ | Zdolność (zaawansowana) |
|---|---|---|---:|---:|---:|---|---|
| Świt | Złoty Smok | główna | 9 | 5 | 3 | lot | Słoneczny Blask: 1/bitwę +1 A do następnego ataku każdej żyjącej własnej jednostki, w tym Smoka |
| Świt | Król Jednorożców | główna | 7 | 4 | 7 | wręcz | Szarża Światła: +1 A po ruchu ≥3 heksy (każdy stosowny atak) |
| Świt | Prastary Niedźwiedź | główna | 11 | 4 | 3 | wręcz | Opiekun: 1/bitwę przejmuje atak na sąsiedniego sojusznika |
| Świt | Elf Druid | pomocnik | 3 | 2 | 4 | strzelec | Splątane Korzenie: 1/bitwę po trafieniu −2 S celu w jego następnej aktywacji |
| Świt | Nimfa | pomocnik | 6 | 1 | 4 | wręcz | Dar Życia: 1/bitwę +3 Ż sojusznikowi, do maksimum |
| Świt | Pegaz | pomocnik | 3 | 2 | 5 | lot | Powietrzny Zryw: 1/bitwę po ataku odskok do 3 heksów |
| Horda | Czarny Smok | główna | 8 | 6 | 3 | lot | Ognisty Oddech: 1/bitwę pełne A dwóm wrogom w linii |
| Horda | Władca Wilkołaków | główna | 7 | 5 | 6 | wręcz | Zew Krwi: 1/bitwę +2 A przeciw już rannemu celowi |
| Horda | Ogr Żelazna Pięść | główna | 11 | 5 | 2 | wręcz | Twardogłowy: 1/bitwę ignoruje do 4 pkt obrażeń jednego trafienia |
| Horda | Goblin Szaman | pomocnik | 4 | 2 | 3 | strzelec | Złowroga Klątwa: 1/bitwę −1 A trafionemu celowi na następny atak |
| Horda | Pająk Jaskiniowy | pomocnik | 5 | 2 | 4 | wręcz | Pajęcze Sidła: 1/bitwę w zasięgu 4 unieruchamia na następny ruch |
| Horda | Nietoperz Cienia | pomocnik | 3 | 1 | 6 | lot | Nocna Zasadzka: 1/bitwę +2 obrażenia |

**Ważne:** te konkretne liczby są proponowanym spójnym zestawem TESTOWYM zgodnym z budżetami i relacjami, a nie zatwierdzoną przez fizyczne testy równowagą. Unikaj zamieniania ich w hardcoded constants. Prędkości między frakcjami mogą się powtarzać. Największe ryzyko: wyeliminowanie strzelca jednym ciosem przez silną główną jednostkę.

## 3. Neutralni
| Strażnik | Ż/A/S | Mechanika/charakter |
|---|---|---|
| Cyklop Błyskotek | 13 / 3 / 2 | kolekcjoner błyskotek, mocny powolny; 1/bitwę trafienie dwóch sąsiadujących celów głazem |
| Gryf Złodziej Skarbów | 11 / 3 / 6 | skradziony klejnot w gnieździe, lata; 1/bitwę atak i odlot do 4 pól |
| Hydra z Zatopionych Ruin | 15 / 2 / 3 | strażnik legowiska, 1/bitwę atak dwóch sąsiednich przeciwników |

Bossowie mają jedną aktywację w rundzie. AI wybiera najkorzystniejszy legalny cel; wybór deterministyczny przy jednakowych ocenach. Jednostki poległe w bitwie przeciw neutralnemu również umierają na stałe.

## 4. Katalog skarbów
Każdy przedmiot jest jednorazowy. Efekty bonusów „do końca bitwy” wygasają po niej, ocalali wracają do pełnego bazowego Ż. Skarby nie zabierają akcji.

| ID | Nazwa | Efekt |
|---|---|---|
| resurrection | Eliksir Odrodzenia | wskrześ 1 poległą jednostkę; także poza bitwą |
| heal | Wielki Eliksir Uzdrowienia | +6 Ż jednej żyjącej jednostce, do maksimum |
| seed | Nasiono Drzewa | +2 Ż każdej żyjącej własnej jednostce na arenie |
| damage_scroll | Magiczny Zwój | 3 obrażenia wybranemu celowi |
| sword | Miecz Bohatera | +2 A jednej jednostce do końca bitwy |
| shield | Tarcza Strażnika | zaneguj wszystkie obrażenia z jednego ataku (reakcja) |
| vitality | Eliksir Żywotności | +4 max Ż jednej jednostce do końca bitwy |
| boots | Buty Wiatru | +3 S jednej jednostce do końca bitwy |
| horn | Róg Strażników | wymień uczestniczącego pomocnika (żywego lub poległego) na żywego z rezerwy ALBO dodatkowa pełna aktywacja jednego żywego pomocnika |
| map | Magiczna Mapa | odkryj 3 wybrane zakryte heksy |
| lightning | Błyskawica w Butelce | do dwóch różnych przeciwników otrzymuje po 2 obrażenia |
| hourglass | Klepsydra Czasu | dodatkowy ruch jednostki bez ataku |
| courage_horn | Róg Odwagi | +2 A do następnego ataku jednostki i jednego sąsiedniego sojusznika |
| teleport | Zwój Teleportacji | teleport na wolne pole sąsiadujące z sojusznikiem, bez dodatkowego ataku |
| stone | Kamień Ochrony | −1 otrzymanych obrażeń z każdego ataku, minimum 0, do końca bitwy |

**Wybór puli na partię (bez zamian):** krótka 1 resurrection + 1 losowy nie-resurrection; średnia 2 resurrection + 2 nie-resurrection; długa 2 resurrection + 4 nie-resurrection. Sprawdź, czy fizyczna talia ma tyle kopii. Dla implementacji cyfrowej kopie są konfigurowalne.

## 5. Modele danych
- `GameState`: mode (`coop|pvp`), difficulty (`basic|advanced`), mapSize (`short|medium|long`), round, roundLimit, activePhase (`adventure|battle|game_over`), teams, tileMap, objectives, inventory, RNG seed/state, activeBattle?, victory?.
- `Faction`: id, primaryUnits[3], supports[3], activeHeroIds[0..2], deadIds, inventory[], deliveredCrystalCount.
- `Unit`: id, faction, kind (`hero|support|neutral`), baseStats `{hp,attack,speed}`, currentHp, dead, movementType (`walk|fly`), attackType (`melee|ranged`), uniqueAbilityId, abilityUses, statuses.
- `HexTile`: axial/cube coordinates, terrainCost `1|2|Infinity`, hidden/visible, home team?, tree?, crystalId?, treasureId?. Separate tile visibility from hidden content; secrecy in multiplayer.
- `BattleState`: arena[9x11], obstacleCoords, spawnZones, attackerFaction, defenderFaction/neutral, activeUnits, round, initiativeMode, pendingActions, win/loss.
- `ItemInstance`: unique id, kind, acquiredBy, consumed, effectDuration.
- `Action`: move, attack, activateAbility, useItem, reveal, collectCrystal, deliverCrystal, endTurn, startBattle, deployUnit.
- `EventLog`: append-only sequence describing all actions and RNG decisions, export JSON for replay.

## 6. Mechanika heksów
Zalecane **axial coordinates** `q,r` plus `cubeDistance = (abs(dx)+abs(dy)+abs(dz))/2`. Przeszkody blokują ruch i LOS. Pathfinding: BFS dla bitwy o koszcie ruchu 1, Dijkstra dla mapy przygodowej (koszty 1/2). Przestrzegaj sześciu sąsiadów heksu. Dla LOS zastosuj segment od środka centrum heksa do celu; w niejednoznacznych przypadkach zaokrąglania cube wybierz spójną i testowalną regułę, opisaną w UI.

Mapy trójkątne: liczba pól 21 / 36 / 66 odpowiada odpowiednio 6 / 8 / 11 rzędom. Start dobra i zła w dolnych narożach, Drzewo u góry. Dozwolone miejsca kryształów/skarbu wyłącznie na polach osiągalnych. Map generator w wariancie A powinien znać stałą maskę przeszkód; w B udostępnij „sekretny edytor mapy” wraz z walidacją flood-fill, po czym ukryj mapę graczom. Rejestrować, czy mapa jest możliwa do rozwiązania.

## 7. Automat przeciwnika w coop
Na koniec fazy dobra dla każdego żyjącego złego bohatera:
1. Jeśli sąsiaduje z głównym bohaterem dobra, inicjuje bitwę.
2. W przeciwnym razie znajdź najbliższego osiągalnego bohatera dobra oraz Drzewo.
3. Wybierz bliższy cel; przy remisie wybierz bohatera dobra.
4. Przemieść się najdalej jak można legalnie w ramach 2 pkt ruchu mapy wzdłuż najkrótszej trasy.
5. Jeśli osiągnie Drzewo, blokuje dostarczenie i uczestniczy w rytuale.
6. Śmierć złego bohatera usuwa go z listy wymaganej dla rytuału.

**DO USTALENIA:** jak AI rozstrzyga remisy między wieloma równie bliskimi bohaterami; czy AI widzi zakryte koszty pól i pozycje kryształów (powinna znać tylko jawne kafelki); moment inicjowania bitwy po wejściu na heks przeciwnika; czy AI może zatrzymać rytuał, by ścigać bohatera. Implementuj ostrożne jawne reguły w konfigu.

## 8. Silnik walki
1. Wyznacz atakującego i broniącego się głównego bohatera. Pobierz dwa legalne żywe supporty (AI losowo według seed; człowiek wybiera).
2. Rozstaw po jednej drużynie w każdej skrajnej kolumnie 9x11.
3. Posortuj uczestniczące, żywe jednostki wg S; jeśli remis zastosuj tryb inicjatywy (wybór w konfiguracji). Po aktywacji każdej oznacz ją jako aktywowaną w tej rundzie.
4. Aktywacja: ruch do S wolnych heksów plus opcjonalnie 1 atak. Typ melee = atak sąsiada; ranged = dowolny widoczny cel (przeszkody blokują LOS), lecz gdy sąsiaduje z wrogiem, tylko cel sąsiedni albo wycofanie i strzał. Lot ignoruje przeszkody w trasie, nie przy lądowaniu.
5. Obrażenia = A plus opcjonalne efekty przedmiotów/zdolności/kości; minimum 0. Brak kontrataku. Nie dopuszczaj ataku w już martwe cele.
6. W trybie advanced wolno użyć zdolności zgodnie z jej limitem; nie odejmuje aktywacji. Skarby używaj bez akcji przed własną aktywacją, poza reakcyjną Tarczą Strażnika. Sprawdzaj kolejność i czy nowe buffy wpływają na bieżący atak.
7. Każda bitwa kończy się śmiercią wszystkich uczestników jednej strony, nawet jeśli główny bohater padł wcześniej. Ocalali supporty wracają do puli po walce, ze zresetowanym HP. Zmarli pozostają martwi. Przenoś przedmioty i kryształy według zasad mapy.
8. Róg Strażników: aktywny skład max 3. Wymiana wymaga żywego rezerwowego supporta; dodatkowa pełna aktywacja supporta jest opcją alternatywną; przedmiot znika po użyciu. **TEST** potencjalnej dominacji ataku.

### Nie rozstrzygnięte przypadki brzegowe — testy konieczne
- Co, jeśli obie drużyny zginą w tym samym ataku AoE?
- Co, jeśli pada ostatni główny bohater dobra, ale jego supporty wygrają bitwę i istnieje Eliksir Odrodzenia w ekwipunku?
- Jaki dokładnie jest trigger zdolności Nimfy (przed/po własnym ataku) i Pająka (czy musi widzieć cel)?
- Czy buff +S zmienia kolejność w bieżącej rundzie, czy tylko kolejną, oraz czy ogranicza się do jednej aktywacji?
- Czy gracz może wymienić żywego pomocnika Rogiem po jego aktywacji; czy nowy support w danej rundzie może od razu działać?
- Kto przechowuje skarby — frakcja czy konkretny bohater; co po jego śmierci?
- Czy dostarczenie kryształu wymaga osobnej akcji, czy wystarczy wejście na Drzewo?
- Gdzie ląduje wskrzeszony główny bohater i czy może działać od razu?

## 9. Wymagania UI
- Układ ekranu: centralna heksowa mapa przygodowa albo arena 9x11; po boku karty 15 jednostek, ekwipunek, cele misji, lista aktywacji; osobny ekran przygotowania scenariusza.
- Karta jednostki: ilustracja fantasy, nazwa, ikona typu: miecz dla wręcz / łuk dla strzelca / skrzydło dla lotu. Statystyki wyraźnie odrębne: serce = Ż, skrzyżowane ostrza dla A (nie mylić z pojedynczym mieczem typu wręcz), błyskawica / klepsydra dla S (nie ślady stóp), liczby. Zdolność z tekstem tylko w advanced.
- Hex overlay przy ruchu: dostępne pola, koszty, LOS, bieżąca inicjatywa, podświetlenie ryzykowanych działań.
- Dla testowania: debug inspector, ręczne ustawianie pozycji, wymuszanie RNG seed, przycisk auto-play (heurystyczny AI dla obu stron), log zdarzeń i eksport CSV wyników.
- Widok „tury” i „bitwy” muszą być ściśle zsynchronizowane; przegrane elementy nie wracają do puli.

## 10. Testy automatyczne / symulacje
- Testy budżetu 18/11 i specjalizacji sześciu bohaterów.
- Testy pathfindingu na heksach, blokowania LOS, lotu ponad przeszkodą, zakazu zakończenia ruchu w skale lub na innej jednostce.
- Testy puli: shared supports, permanent death, wskrzeszenie i przegrana przy śmierci wszystkich bohaterów dobra.
- Testy rogów: wymiana, martwa rezerwa, extra activation; brak 4 jednostek równocześnie.
- Testy losowania skarbów: dokładnie 1+1 / 2+2 / 2+4, bez przypadkowego dodatkowego resurrection.
- Testy rytuału Drzewa i blokowania oddania kryształu obecnością zła.
- Symuluj min. 1000 seedów na wariant mapy, podając odsetki wygranych dobra/zła, liczbę walk, strat głównych/pomocników, liczbę tur, wartość zebranych skarbów i przyczynę końca gry. Przy ocenie neutralnych licz odsetek całkowitej zagłady i średnie straty pomocników. Symulacje 3v3 wykonuj z realistycznym ruchiem i LOS na 9x11, nie tylko na jednej osi.
- Koniecznie zbieraj wyniki oddzielnie dla podstawowego i zaawansowanego wariantu. Nie interpretuj heurystycznego AI jako równowagi przy grze ludzi.

## 11. Priorytet realizacji
1. Silnik heksów + reprezentacja stanu + walidator zasad.
2. Arena 9x11, walka podstawowa 3v3 i 3v1, HP/śmierć.
3. Jednostki, zdolności, skarby, system ładowania scenariuszy.
4. Trójkątna mapa, zakrywanie, skarby/kryształy, AI kooperacyjne, rytuał.
5. UI, logi, save/load, debug, autoplayer, statystyki.
6. Opcjonalna grafika wysokiej jakości po uzyskaniu poprawnej grywalności.

## 12. Ważne dla AI implementującej
Nie twierdź, że nieustalone wyjątki są „oficjalne”. Na potrzeby pierwszego uruchomienia zaproponuj rozsądne reguły **jako ustawienia TEST** z czytelnymi komentarzami, a jeśli potrzebujesz decyzji projektowej, zadaj użytkownikowi krótkie pytanie. Wszystkie decyzje powinny być konfigurowalne. W pierwszym uruchomieniu preferowana jest wierna, testowalna gra bez grafiki premium nad atrakcyjnym interfejsem z niepoprawnymi zasadami.
