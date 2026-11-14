# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Szerszy plan wydania cyfrowego: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`.

**Jak z tego korzystać:** autor pisze „zrób punkty A2, A3, B1”, a Claude pracuje sam, aż skończy (warunek ukończenia stoi przy każdym punkcie). Kolejność, gdy autor każe zrobić „wszystko z listy”: C → D.

## STAN (14.11.2026): poziom 3 „Królestwo” zbudowany, wydanie 2.6.0 przygotowane lokalnie

W nocy 13/14.11 zrobione kroki 1–7 z kolejności prac: porządki w repo i kodzie, wydajność (główna paczka 1089 → 565 kB), silnik poziomu 3 z 8 nowymi pomocnikami i 4 zestawami artefaktów, dochód 1/2/3, cała grafika Scenario (portrety, karty, ikony zdolności i zestawów, animacje jednostek, krajobrazy i budynki osad), widok osady (K8), samouczek, rozdział o ekonomii i autopilot dziecka (K9). `make check` zielone (413 testów), commit `Release 2.6.0` i lokalny tag `2.6.0` gotowe, **nic nie wypchnięte** (45 commitów przed `origin/master`). Zostaje: wydanie (push zależy od autora), strojenie ekonomii, poziomy 4 i 5 przed premierą. Decyzje autora niżej są nadal obowiązujące.

### Decyzje autora do poziomu 3 (13.11.2026, już rozstrzygnięte)
- **Premiera dopiero po poziomie 5** (zmiana względem DECYZJE.md 4.11 i 12.11). Poziom 3 wchodzi przed premierą, tak samo 4 i 5.
- **Waluta:** tylko złoto. Skala mała: najtańsza rzecz kosztuje 1 złota, dochód osady to 1–2 złota na rundę. Ceny w całych złotych (uwaga: gruba skala utrudnia strojenie; stroić liczbą osad, cenami i cenami artefaktów, nie ułamkami).
- **Brak utraty złota po porażce bohatera** (skreślone). Gracze tej samej frakcji (także w rywalizacji) dzielą **skarby, złoto i pomocników**; kasa jest per frakcja.
- **Osada ma narzuconą frakcję** według połowy mapy (heksy Przymierza = osady Przymierza, heksy Hordy = osady Hordy). Kto wejdzie na osadę, staje się jej właścicielem; osada zachowuje budynki i ulepszenia. Właściciel z innej frakcji niż osada: ma jej **dochód, targ i szpital, ale nie rekrutuje** (ani swoich, ani jej jednostek).
- **Budynki trzeba kupić** (koszary, targ, szpital nie stoją od razu). Dochodzi budynek zwiększający dochód złota. Pomysł autora: ulepszenie szpitala (treść → Q6).
- **Okno osady jak w Heroes III:** każda osada ma losową, unikalną nazwę pasującą do frakcji; widok osady to krajobraz z nałożonymi grafikami wybudowanych budynków i ich ulepszeń; klik w budynek otwiera jego funkcję (koszary → rekrutacja itd.).
- **Rekrutacja bez kopii jednostek:** w armii jest tylko jedna jednostka danego typu, więc **odpada przebudowa na instancje** (dawny ryzykowny K3). Neutralni nie są rekrutowani. Każda frakcja ma docelowo **7 pomocników: trzech obecnych = poziom 1, plus nowi poziomów 2, 3, 4, 5** (każdy silniejszy i droższy od poprzedniego). **Maksimum 5 pomocników w drużynie.** Pomocnicy wspólni dla drużyny jak dziś.
- **Cena jednostki z symulacji** (użyteczność w walce), nie z mnożenia statystyk. **Bez limitu zakupów na turę** i bez cyklu tygodniowego: hamulcem jest tylko cena.
- **Cel „Podbój” dopiero na poziomie 4.**
- **Automat zła w koopie:** posiłki co kilka rund, na tyle duże, by realnie zagrażały graczom (do wybalansowania).
- **Ranking:** trudność poziomu 3 mierzymy symulacjami po wdrożeniu całości i z tego ustalamy punkty.
- **Strojenie balansu:** zaplanować tak, żeby zużywać mało tokenów (obciążenie komputera może być duże): długie symulacje w tle, do rozmowy tylko skrót wyników.
- **Ruch klient-serwer ma być oszczędny:** przed K1 zrobić przegląd, co musi iść w każdej wiadomości, a co nie (np. różnice/akcje zamiast pełnego stanu, oferta targu liczona po obu stronach z ziarna).
- **Nagrody (Q1):** złoto **tylko z osad, kopalń i skrzyń**; walki ze strażnikami i spotkaniami dają skarby jak w poziomie 2 (bez złota). W skrzyni gracz **wybiera: artefakt albo złoto**. Walka z bohaterem wroga: nic. Ilość złota ze skrzyni zależy od poziomu skrzyni (do strojenia).
- **Kopalnie złota zostają** (Q2): trzyma ją ten, kto stoi na polu, +1 na rundę.
- **Obrońcy osad (Q3):** neutralni **trochę silniejsi niż strażnicy kryształów**.
- **Obrona osady (Q4):** tylko stanie na kafelku (wrogi bohater wchodzący na pustą osadę przejmuje ją bez walki). Garnizony i budynek obronny: parking, do rozważenia po strojeniu, jeśli przejmowanie okaże się zbyt łatwe.
- **Liczba osad (Q5):** parzyste, po równo na połowę mapy: 2 / 4 / 4 / 6 (krótka / średnia / długa / bardzo długa); dobór końcowy przez symulacje.
- **Szpital (Q6):** ulepszenie = tańsze wskrzeszanie (1/3 ceny jednostki zamiast 1/2).
- **Miejsca w drużynie (Q7):** start 2, +1 na 3. poziomie bohatera, +1 na 6., +1 z ulepszonych koszar; razem maks. 5.
- **Nowe jednostki (Q8):** Claude przygotowuje propozycję 8 jednostek (po 4 na frakcję, poziomy 2–5: nazwa, rola, zdolność, miejsce w krzywej siły), autor akceptuje, dopiero potem grafika.
- **Zakres premiery (Q9):** poziomy 1–5 i dwie obecne frakcje; nowe frakcje, kampania i Ekspedycja po premierze.
- **Nazwy poziomów (Q10):** Przygoda, Wyprawa, Królestwo, Imperium, Legenda; tryb roguelike nazywa się **„Ekspedycja”** (nie „Wyprawa”). Dla ewentualnego poziomu 6 zostaje miejsce (np. „Mit”).

## Zasady pracy bez nadzoru (decyzje autora, 12.11.2026)
- Jeden punkt = jeden lub kilka commitów, każdy z wpisem w CHANGELOG.md i `make check` przed commitem; bez pushu gry. Zmiana AI albo liczb przesuwa `golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie.
- Grafiki i dźwięki: Claude robi je sam przez Scenario/ElevenLabs, ogląda/odsłuchuje, wybiera najlepsze, wrzuca do repo z wpisem w `assets.json` i commituje. Limit kosztu nie został podany: jeśli jeden punkt wymaga więcej niż ok. 30 generacji, Claude kończy to, co ma, i pyta.
- Gdy trzeba decyzji autora, Claude nie zgaduje: dopisuje pytanie do sekcji „Pytania czekające na autora” (na końcu), robi następny punkt i wraca do tamtego po odpowiedzi.
- Po skończeniu punktów: dźwięk `complete.oga`, krótkie podsumowanie po polsku, uwaga o `/clear`.

## C. Dalej

### Wydanie 2.6.0 (jedyny otwarty krok z kolejności prac z 13.11; kroki 1–7 zrobione 14.11)

- [ ] **Wydanie** czeka na autora, bo push publikuje grę: `git push origin master 2.6.0`, `gh release create 2.6.0 --generate-notes`, `make silnik`, w repo serwera `npm install …/2.6.0/straznicy-engine-2.6.0.tgz`, `make deploy`, push serwera. Serwer idzie razem z grą (tier `kingdom`, zapisy online, kompresja, 6 graczy). Autor zgodził się na wydanie 13.11.
- [ ] Przed wydaniem autor może obejrzeć poziom 3 na żywo (sekcja F), bo nic z nocnej pracy nie było sprawdzane przez człowieka.

### Poziom 3 „Królestwo”: co zostało po nocy 13/14.11

Zrobione i usunięte z listy: K5 (8 jednostek w silniku, grafika, animacje), K8 (widok osady), K9 (samouczek, instrukcja, autopilot), zestawy artefaktów (silnik, UI, boty, 12 ikon), dochód 1/2/3, porządki repo i kodu, wydajność. Zostaje:
- [ ] **Strojenie ekonomii** (pomiar 14.11, `make sim-krolestwo GAMES=80`, szczegóły w `POZIOM_3_KROLESTWO.md`): ekonomia prawie nie wpływa na wynik botów, bo rzadko wracają do osady (średnio 1,1 osady, 0–1,8 awansowanego rekruta na grę, na końcu zostaje 8–40 zł, poziomów 4 i 5 nie kupują wcale). Wygrane Przymierza na Normalnym: mapa krótka 56–68%, średnia 34–49%, długa 34–49% (pasmo 45–65%). Ceny jednostek (3/5/8/12) są robocze. Potrzebny **lepszy bot-kupiec** (próba wydłużenia wypraw po zakupy obniżyła wygrane o 5–10 pkt i została cofnięta) albo testy z ludźmi. Dopiero potem: ceny z symulacji, liczba osad i kopalń, siła obrońców osad, posiłki automatu zła w koopie, punkty rankingowe.
- [x] **Poziom Trudny i Normalny dla Królestwa (14.11):** wystrojone (`scripts/sim/tuneKingdom.ts`, wpisy w `tuning.ts`; usterka: stroiciel dotąd nie działał na Królestwie). Zostały kryształowe tylko cele „Kryształy”; inne cele (kontrola, przetrwanie, boss, artefakt) bez strojenia.
- [ ] **Poziom Łatwy dla Królestwa:** rozstrzygnięte 14.11 (sekcja C2: poziom trudności nie zmienia mechanik; dzisiejszy Łatwy staje się poziomem 0). Dawny opis problemu: Łatwy ma pojedynki planszowe, a ekonomia wymaga areny, więc na Łatwym Królestwo dziś nie robi nic. Opcje: (a) Królestwo wymusza arenę także na Łatwym i dostaje strojenie (z areną Przymierze wygrywa tylko 35–67%, trzeba je wzmocnić), (b) Królestwo niedostępne na Łatwym.
- [ ] **Do sprawdzenia na żywo:** patrz sekcja F (dopisane punkty poziomu 3).

1. **Zakres premiery (decyzja 13.11):** premiera dopiero po poziomie 5; poziomy 3, 4 i 5 wchodzą przed pakowaniem na Steam. Do premiery nie wchodzą nowe frakcje, kampania ani Ekspedycja (Q9). Numer wydania premiery do ustalenia przy wydaniu (dawne „3.0” z 12.11 traci sens).
2. **Premiera na Steamie:** strona sklepu, zrzuty, trailer (wideo: Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri, do wyboru), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Wiele języków: przed premierą tylko inwentaryzacja tekstów.

## C2. Uwagi autora po ogrywaniu poziomu 3 (14.11.2026)

Zrobione 14.11 (szczegóły w CHANGELOG.md i historii gita): wejście do osady spoza osady (lista osad w prawym panelu, zakupy z dowolnego miejsca), własne kafelki osad, zoom kółkiem i przeciąganie mapy, widoczniejsze ikony kopalń (nie powtórzyło się w silniku: kopalnie były odkryte, ale ikona była za mała), dolny pasek (złoto „2 (+2)”, dziennik w Opcjach), ozdobny licznik skarbów, nowa ikona plecaka, kreator (bez ramek wokół ikon, wycentrowany wybór kształtu z heksów i rozmiaru z kodami S–3XL, nowe nazwy rozmiarów), 14 nowych ikon menu, zwierzęta poziomów trudności, portrety Centaura i Opiekuna Drzewa, strzała Centaura.

- [ ] **Ozdobne narożniki ramek** nie pasują do reszty ramki (pominięte 14.11: wymaga decyzji o stylu). Do rozważenia: narożniki jako osobne elementy dopasowane do stylu ramki (9-slice / `border-image`), generowane razem z ramką w Scenario, albo prostsze, spójne narożniki w CSS/SVG.
- [ ] **Poziom 0 i poziom trudności jako warunki startowe** (decyzja autora 14.11): plan i koszt w `POZIOM_0_PLAN.md`, czeka na odpowiedzi na dwa pytania z tego dokumentu.
  - Poziom trudności nie zmienia mechanik gry ani ich braku, tylko warunki startowe graczy komputerowych; dzisiejszy „Łatwy” z poziomu 1 staje się poziomem 0 (liczy się do rankingu własną kolumną punktów; cele i mapy jak na poziomie 1: tylko mapa trójkątna i cel „zbieranie kryształów”).

## D. Przed i po premierze (premiera dopiero po poziomie 5, decyzja 13.11)

**Przed premierą (w tej kolejności, po poziomie 3):**
1. **Poziom 4 „Imperium”:** pełna ekonomia: drewno, ruda, Gwiezdny Pył, budynki jeden na rundę, cykl tygodniowy; cel „Podbój”.
2. **Autopilot warstw** dla dzieci (wymaga ekonomii).
3. **Poziom 5 „Legenda”:** magia, specjalności bohaterów; razem z nim **drzewka umiejętności bohatera** z rozgałęzieniami (dziś wspólna pula 6).
4. Inwentaryzacja tekstów pod wiele języków, potem punkt C3 (Steam).

**Po premierze:**
5. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Grafika frakcjami (nowa frakcja = pełen zestaw naraz). Przed startem: próbka jednej jednostki w nowym stylu ze Scenario i decyzja autora.
6. **Kampania fabularna** (mapy ręczne już są; fabuła przez wyzwalacze, B11) i **Ekspedycja** (dawna „wyprawa roguelike”: 8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
7. **Wiele języków** (polski i angielski: interfejs, dane jednostek i zasad, instrukcja, CHANGELOG, serwer).
8. Więcej niż 6 graczy (do 8, patrz `MECHANIKI_I_POZIOMY.md`), mechanika „cios od tyłu / z flanki” dla innych jednostek.

## E. Pomysły na później (Parking)

- **Pierwsza strona instrukcji planszowej:** imienna wiadomość od autora (pisze autor; decyzja 10.11: na razie się nie przejmujemy).
- Kąt kamery i wielkość figurek 3D do korekty po obejrzeniu na żywo (autor).

## Pytania czekające na autora

**Q1–Q18 (13.11.2026) zostały rozstrzygnięte** (decyzje w „STAN” u góry). Nic z nich nie czeka na autora.

- ~~Propozycja 8 nowych pomocników~~: **zaakceptowana 13.11** (Przymierze: Jeżozwierz, Centaur, Alabastrowy Odyniec, Opiekun Drzewa; Horda: Szczurołak, Piekielny Ogar, Salamandra Popiołu, Herszt Minotaurów); grafika dozwolona.
- ~~`druk3d`~~: rozstrzygnięte 13.11 (do `.gitignore`, pliki zostają na dysku).
- ~~Dochód osady startowej~~: rozstrzygnięte 13.11 (osady jednakowe: kopalnia 1, osada 2, osada ze skarbcem 3).

- **Push gry i wydanie 2.6.0:** gotowe lokalnie (tag `2.6.0`), czekam na „wypchnij” od autora (kroki w sekcji C).
- **Łatwy w wydaniu planszowym** (uzupełnienie do dawnego A8): w edycji planszowej Łatwy 1 na 1 daje 94/91/88/79% (powyżej pasma), a 2 na 2 na bardzo długiej mapie 61%. Dźwignie stroiciela działają tylko w grze cyfrowej, żeby plansza została „jak wydrukowana”. Czy stroić też planszową (zmieniałoby to wydrukowane zasady poziomu Łatwy), czy zostawić? Domyślnie: zostawiam.

## F. Do sprawdzenia na żywo (autor)

Wszystko zrobione i przetestowane, ale bez potwierdzenia w prawdziwej grze:
- **Poziom 3 (noc 13/14.11):** widok osady z budynkami na krajobrazie obu frakcji, dźwięki zakupu, animacje i portrety 8 nowych pomocników (sprite'y bez klipu śmierci), ikony zestawów artefaktów i licznik „2/3 zestawu”, samouczek poziomu 3, autopilot dziecka (zakupy za zgodą rodzica), zapisy online (B5), szósty gracz.
- Kraken (głowa strzela, 2 macki, krab i błotny stwór) i Pegaz (5 Ż, 3 A): czy walka z Krakenem jest groźna, ale uczciwa dla każdego bohatera, i czy sześć jednostek wroga mieści się czytelnie na arenie.
- Klikalność jednostek zasłoniętych przez inne (Pegaz kontra Hydra, partia 114857, akcja 60); poprawka 10.11 (`behind` w `ArenaBoard.tsx`) nie była sprawdzona na tej samej partii.
- Błysk zakrytych kafelków (zgłoszenie 9.11): poprawiony szew animacji mgły `fog-drift`; jeśli błyski wrócą, zrzut lub opis, który kafelek.
- Kursor ataku na wszystkich heksach jednostki (nagrania z 10.11 nie pokazywały kursora).
- Zwłoki: jeśli któreś nadal wydadzą się za małe, `CORPSE_MAX_W` w `sprites.ts`.
- Rzut Cyklopa: przy zabiciu celu animacja śmierci zaczyna się jeszcze przed lądowaniem kamienia.
- Kolejka stanów online (`usePresentation.ts`): sprawdzone testami, do obejrzenia w prawdziwej grze online.
- Rozmiar Czarnego Smoka, figurki Szamana, Nietoperza, Jednorożca; klipy ataku Elfa Druida, Goblina Szamana i Cyklopa (autor 12.11: klipy ok).

## G. Balans: znane odchylenia

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciel: `scripts/sim/tuneLevels.ts`; tabele: `make sim-tabele`, `make sim-cele` (trzymać poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Stan z 12.11 (po sekcji uwag z tego dnia): Normalny w paśmie niemal wszędzie.
**Łatwy (12.11, 200 gier na komórkę):** w grze cyfrowej (domyślnej) jest w paśmie 65–85% w każdej komórce: bez rozwoju 70–85%, z rozwojem (`SIM_GROWTH=1`) 67–79%; stroiciel nic nie zmieniał. Liczby 94/91/88/79% i 61% pochodziły z `make sim-tabele` BEZ `SIM_DIGITAL=1`, czyli z wydania planszowego, którego poziomy zostają „jak wydrukowane” (`tuning.ts`: dźwignie dotyczą tylko cyfrowego). Do mierzenia gry używać `SIM_DIGITAL=1 make sim-tabele` (i `SIM_GROWTH=1`). Z rozwojem Normalny jest poniżej pasma w kilku komórkach (kooperacja 39–44% na średniej, długiej i bardzo długiej mapie, 2 na 2 długa 35%) i Trudny w koopie 22–30%: do ewentualnego przestrojenia (`tuneLevels.ts <cel> 1`).
Poza pasmem (decyzja autora 10.11: zostawiamy, wracać tylko przy okazji):
- Kryształy na ręcznych mapach: Cieśnina i Dolina (koop 1 gracz Normalny 25–43%, 40 gier 31% na Dolinie).
- Koop 2 graczy, Normalny, bardzo długa mapa: 75%.
- Artefakt i Boss z rozwojem na wyspach; Boss Trudny (według autora nie ruszamy).
- Dźwignie stroiciela (skarby startowe, bohater Hordy) są za grube dla tych komórek; potrzebna nowa dźwignia (liczba strażników albo kryształów).

**Analiza botów (12.11, 180 partii cyfrowych z rozwojem, cele kryształy/kontrola/Boss, długa mapa; dawne A7):**
- Wdrożone: (1) w celu Boss boty nie wchodziły w legowisko Krakena (ścieżka omijała pola ze spotkaniem), Przymierze miało z nim 0% i gra stała do limitu rund; po poprawce 50–70%, jak przy innych bossach (`make sim-bossy`). (2) Boty nigdy nie używały Rogu Odwagi, Rogu Strażników, Klepsydry Czasu i Butów Wiatru: 194 z ok. 560 zdobytych skarbów szło na marne; teraz użyte 24 z 31 butów, 43 z 56 rogów odwagi, 38 z 40 rogów strażników, 22 z 35 klepsydr; wygrane Przymierza w tabelach wzrosły zwykle o 1–3 pkt (Normalny nadal w paśmie poza dwiema komórkami o 1–2 pkt nad nim: koop 2 graczy długa bez rozwoju 66%, Trudny koop 1 gracz bardzo długa 47%; szum pomiaru ±3).
- Odłożone: Zwój Teleportacji jest nadal nieużywany (35 z 35 zdobytych): bohater rzadko nie dosięga wroga, a teleport ma sens tylko obok sojusznika w zasięgu ciosu; próba bez efektu, usunięta. Wymaga osobnego pomysłu (np. do ratowania strzelca albo skoku za linię wroga).
- Zbadane, bez zmian (to nie błąd): „bezczynne tury” w kontroli (31%), przetrwaniu (24%) i artefakcie (12%) to bohaterowie trzymający punkt kontrolny albo czekający przy Drzewie, tak jak każe cel; „bezczynne aktywacje” w bitwie (Elf Druid, Niedźwiedź) to wybór pozostania na miejscu, a przypadki z celem w zasięgu (Nimfa, Pegaz) to 2–3 na ok. 240.

Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL` (rundy, fale), `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (pomoc dla dziecka, `data.ts`), liczby artefaktów i obiektów na mapie, liczby jednostek i bossów neutralnych, liczba spotkań na mapie, progi botów, progi wskaźnika trudności (`levelOfFight`).

## H. Zmiana nazwy na Gleamroot: co zostało (12.11.2026)

Zrobione: logo w grze (`ui/logo.png`, źródło `docs/grafika/okladka/logo.png`, stare w `logo_stare_straznicy.png`), teksty w grze, instrukcja HTML, opisy techniczne. Zostaje:
- [ ] Okładka do druku (`docs/grafika/okladka/okladka.png`, `ui/cover.jpg` w grze): ma stare logo wypalone u góry; w grze go nie widać (przycięcie), ale na wydruku tak. Trzeba zrobić okładkę z nowym logo (wygenerować bez logo i nałożyć nowe), potem `python3 scripts/assets/menu.py` i `druk.py`.
- [ ] Pliki w `docs/wersja_planszowa/`: `logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx` mają starą nazwę (binarne, do przerobienia po ostatecznym potwierdzeniu nazwy).
- [ ] Domeny i konta (autor), znak towarowy (autor sprawdził: brak wpisów), tytuł w sklepie Steam.
- Nie zmieniamy: nazw technicznych (repozytorium, pakiet, aplikacja na Fly), „Kryształowe Drzewo” jako miejsca w fabule, `docs/zrodla_zasad/*` (źródła historyczne).
