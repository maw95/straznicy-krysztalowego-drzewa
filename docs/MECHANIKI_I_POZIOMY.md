# Mechaniki wersji cyfrowej według poziomów drabinki

Stan z 10.11.2026. Wszystkie mechaniki (zbudowane i wymyślone) w jednym miejscu, posortowane według poziomu drabinki z `ROZBUDOWA_CYFROWA.md`:
1 Przygoda, 2 Wyprawa, 3 Królestwo, 4 Imperium, 5 Legenda. Przypisanie do poziomów jest **propozycją do dyskusji**, o ile nie napisano „decyzja autora”.
Znaczniki: [x] zbudowane, [ ] do zbudowania. Zakres premiery (decyzja autora): poziomy 1, 2 i 3.

## Poziom 1 — Przygoda (od 5 lat)

- [x] Cel Kryształy / rytuał Hordy, mapa-trójkąt, 4 rozmiary map (w tej chwili: krótka, średnia, długa, bardzo długa).
- [x] Bohater + dwóch pomocników, skarby, strażnicy, poziomy trudności Łatwy / Normalny / Trudny (stroiciel).
- [x] Arena z poziomymi heksami, duże jednostki na 2 heksach, trupy nie zajmują heksa.
- [x] Hotseat, online, tryb rodzinny, boty, mały zestaw liczb (jak w planszówce).
- [ ] Ekran „Autorzy” (wymóg licencji CC BY dla części muzyki; 10.1).
- Strażnicy spotykani pojedynczo, bez rozwoju bohatera (bez zmian).

## Poziom 2 — Wyprawa (decyzja autora: tu wchodzą też poziomy 6–10 i 5 slotów)

**Już zbudowane**
- [x] Cele: punkty kontrolne, przetrwanie, boss, artefakt; kształty map: prostokąt, pierścień, wyspy, Cieśnina, Dolina.
- [x] Rozwój bohatera: PD, poziomy 1–5, 6 umiejętności; artefakty w 3 slotach; kapliczki, obozy najemników, skrzynie.
- [x] Bohaterowie Hordy rozwijają się tak samo jak Przymierza (autor, 10.11); strażnicy nie zdobywają doświadczenia.

**Do zbudowania — bohater (11.8)**
- [ ] Poziomy 6–10, krzywa wykładnicza (propozycja progów: 26, 38, 56, 84, 128 PD); poziom 10 ma być rzadkością.
- [x] Umiejętności w stopniach I–III (10.11, stare 6 umiejętności; nowe pięć dojdzie osobno). Przy awansie, gdy bohater ma umiejętność na I lub II, wśród 3 ofert jest zawsze co najmniej jedno jej rozwinięcie.
- [ ] Nowe umiejętności (decyzje autora):
  - **Strzelec:** +A strzałów.
  - **Taktyk:** rozstawienie o 1 / 2 / 3 heksy dalej (stopnie I / II / III).
  - **Zwiadowca:** odkrywa pola w promieniu 2 / 3 / 4 na starcie tury (stopień I dawałby promień 1, a to już jest, więc zaczynamy od 2).
  - **Łowca skarbów:** po walce ze strażnikiem wybór skarbu: I — 1 z 2, II — 1 z 3, III — 2 z 3 (zamiast losu).
  - **Uczony** (dawniej „Mentor”): dodatkowe PD za każdą wygraną walkę (+1 / +2 / +3; do dostrojenia, żeby poziom 10 został rzadkością).
- [ ] Kamienie milowe na poziomach 3, 6 i 9: ulepszenie własnej zdolności z karty bohatera (decyzje autora, 10.11; stopnie się kumulują, liczby w małej skali, ×3 liczy `statScale`):
  - **Złoty Smok** (Słoneczny Blask, sojusznicy / Smok): start +1 / +3 → poz. 3: +2 / +3 → poz. 6: +2 / +4 → poz. 9: +2 / +5.
  - **Król Jednorożców** (Szarża Światła): +2 → 3 → 4 → 5 A.
  - **Prastary Niedźwiedź** (Opiekun Gaju, ignorowane obrażenia): 3 → 5 → 5 i **dowolny sojusznik** (nie tylko sąsiad) → 7.
  - **Czarny Smok** (Ognisty Oddech): kamienie milowe do ustalenia po sprawdzeniu w praktyce. Osobna decyzja autora: Oddech ma **ranić też sojuszników** w linii (friendly-fire); zmienia boty, golden test i balans Hordy, więc osobny commit z symulacjami, najpierw może tylko wersja cyfrowa.
  - **Władca Wilkołaków** (Zew Krwi): +1 → 2 → 3 → 4 A na rannego wroga.
  - **Ogr Żelazna Pięść** (Twardogłowy): ignoruje 2 → 3 → 4 → 5 obrażeń.
  - **Dzielna Kaczka** (propozycja do akceptacji): po zabiciu wroga leczy się o 1 → 2 → 3 Ż; na poz. 9 dodatkowa aktywacja daje też +1 S.
  - **Pomysł zapamiętany:** zwiększone obrażenia od tyłu / z flanki (Zew Krwi z mechaniką pozycji względem wroga) jako mechanika dla innych jednostek (przyszli neutralni, nowe frakcje), nie dla Władcy Wilkołaków.

**Do zbudowania — artefakty**
- [ ] 5 slotów: hełm u góry, w środku broń–zbroja–tarcza, na dole buty (układ jak w Heroes III i Tibii). Puste sloty z malowanymi ikonami już są.
- [ ] Trzy rzadkości: zwykły, rzadki, legendarny. Efekty różnorodne, nie same „+Ż”; efekt jest taki sam dla każdego nosiciela.
- [ ] Obrona jako liczba (tarcze 1 / 2 / 3 pkt) ma sens dopiero po zwiększeniu statystyk (patrz „Skala statystyk”), z zasadą „minimum 1 obrażenia”.
- [ ] Przykłady efektów: Hełm Olbrzyma (+Ż bohatera, −1 S), Hełm Dowódcy (+Ż pomocników), Korona Zwiadowcy (odkrywa pola w promieniu 2), Kolczuga Cierni (atakujący w zwarciu traci 1 Ż),
  Ostrze Rannych (+A przeciw rannym), tarcza zmniejszająca pierwszy cios w bitwie (nazwa do wymyślenia). Sandały Skoczka do przemyślenia.

- [ ] Decyzje autora (10.11): po wygranej walce bohaterów zwycięzca **przejmuje artefakty pokonanego** (zamiast dzisiejszej losowej „zdobyczy” stopnia 1; `game.ts`, „łup z pokonanego bohatera”);
  przegrany traci wszystkie artefakty, które zwycięzca może przejąć. Ryzyko kuli śnieżnej zaakceptowane (sprawdzić symulacjami).
- [ ] **Plecak** (wariant C): artefakty, które nie pasują do slotu albo są gorsze, trafiają do plecaka bohatera (ograniczona liczba miejsc, do ustalenia). Nowy fragment interfejsu: lista plecaka, zakładanie i zdejmowanie.
- [ ] **Przekazywanie artefaktów między bohaterami**, jeśli stoją na sąsiednich polach (też z plecaka do plecaka).
- [ ] Skarby (karty jednorazowe) rozróżnione od artefaktów (wariant A, decyzja autora): zasada „to, co się nosi, jest artefaktem; to, co się zużywa, jest eliksirem, zwojem, runą albo rogiem”.
  Cztery karty „wyposażenia” dostają w wersji cyfrowej nowe nazwy i grafiki, efekty bez zmian: Miecz Bohatera → Eliksir Mocy (+A), Buty Wiatru → Eliksir Chyżości (+S), Tarcza Strażnika → Zwój Tarczy (neguje cios), Kamień Ochrony → Runa Ochrony (−1 z każdego ciosu). Nazwy robocze. Planszówka bez zmian.

**Do zbudowania — spotkania z neutralnymi (propozycja autora 10.11)**
- [ ] Nowe jednostki neutralne: 6 słabych (po 2 pasujące do każdego z 3 strażników) i 3 potężni bossowie (do walki potrzebny rozwinięty bohater).
- [ ] Spotkania na mapie i nagrody:
  - sam strażnik, albo 2–3 słabe jednostki: zwykły skarb;
  - strażnik + 2 słabe, albo mocna jednostka: rzadki skarb;
  - mocna jednostka + 2 słabe: legendarny skarb.
- [ ] Silniejsze spotkania stoją głębiej na mapie (dalej od bazy). Na poziomie 1 zostają sami strażnicy.
- [ ] Podrasowane statystyki strażników (zależne od poziomu gry lub trudności).

**Do zbudowania — mapy i inne**
- [ ] Skala statystyk A i Ż (decyzja autora w toku; patrz niżej).
- [ ] Rozmiary map: XS, S, M, L (dzisiejsze cztery) oraz nowe XL i XXL; ponowne strojenie po zmianie skali.
- [ ] Boss „wszyscy przeciw Bossowi” bez Hordy, własna grafika Bossa (10.7: robić teraz).
- [ ] Autopilot warstw (rodzic na wyższym poziomie, dziecko na tej samej mapie z automatycznie zarządzanymi warstwami).
- [ ] Kość obrażeń i zasłanianie strzału zostają opcjami „Własnymi”.

## Poziom 3 — Królestwo (decyzja autora: wchodzi do premiery)

- [ ] Osady (startowa + do zdobycia), jedna waluta (złoto), rekrutacja jednostek.
- [ ] Drużyna: bohater prowadzi do N pojedynczych jednostek (N rośnie z poziomem bohatera i budynkami).
- [ ] Zakup artefaktów za złoto w osadzie.
- [ ] Zestawy artefaktów (3 przedmioty = bonus).

## Poziom 4 — Imperium

- [ ] Zasoby: drewno, ruda/kamień, Gwiezdny Pył; kopalnie; budynki, jeden na rundę; cykl tygodniowy (7 rund).
- [ ] Drzewka umiejętności frakcji, mechaniki wyróżniające frakcję.

## Poziom 5 — Legenda

- [ ] Magia (czary), pełne specjalności bohaterów, zaawansowane scenariusze.

## Do przypisania do poziomu

- [ ] **Do 8 graczy** (dziś maks. 4; decyzja autora 10.11). Wymaga przemyślenia: każda frakcja ma 3 bohaterów, więc 8 graczy to więcej bohaterów lub więcej frakcji naraz (stąd związek z nowymi frakcjami), drużyny w trybie rywalizacji, rozmiar mapy (XL / XXL), czas tury przy hotseacie i online.

## Po premierze

- [ ] Nowe frakcje (Żelazne Klany, Dzikie Stada, Królestwo Umarłych, potem DLC); najpierw dokończyć to, co mamy (10.2).
- [ ] Kampania fabularna, wyprawa roguelike (osobny tryb, nie to samo co poziom 2 „Wyprawa”), seed dnia z rankingiem.

## Otwarte pytania (10.11)

0. ~~Przejęte artefakty i skarby~~ — rozstrzygnięte 10.11 (patrz wyżej): plecak, przekazywanie na sąsiednich polach, przemianowanie czterech kart.
1. **Skala statystyk:** cyfrowy atak pomocników to 2 (strzelcy 1 + premia 1), więc przy ×3 mają A 6, a tarcza 1 / 2 / 3 pkt zmniejsza ich cios o 17–50%: działa. Skala tylko od poziomu 2.
2. ~~Nazwy i obrazki artefaktów~~ — decyzja autora: jedna nazwa i jeden obrazek dla wszystkich; zwolnione nazwy i grafiki idą do nowych artefaktów.
3. ~~Sandały Skoczka~~ — decyzja autora: zamiast nich buty ignorujące koszt terenu trudnego na mapie (nazwa: Buty / Trzewiki Trapera).
4. **Spotkania z neutralnymi:** co dokładnie jest „skarbem” (karta skarbu, artefakt, oba)? Jak boty oceniają, czy atakować spotkanie?
