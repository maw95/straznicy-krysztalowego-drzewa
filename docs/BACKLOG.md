# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Szerszy plan wydania cyfrowego: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`.

**Jak z tego korzystać:** autor pisze „zrób punkty A2, A3, B1”, a Claude pracuje sam, aż skończy (warunek ukończenia stoi przy każdym punkcie). Kolejność, gdy autor każe zrobić „wszystko z listy”: A → B → C.

## STAN (13.11.2026): uwagi autora przeanalizowane, odpowiedzi na Q1–Q18 zebrane

Autor przejrzał szkic poziomu 3 (`docs/poziom_3_krolestwo_uwagi.txt`) i zapisał propozycje zmian menu i interfejsu (`docs/menu_i_interfejs_propozycje.txt`). Wszystkie decyzje są niżej. **Kolejność prac (Q11): drobne UI (A) i karta bohatera → przebudowa menu (B4, od razu z ekranem poziomu „Królestwo”) → poziom 3 (K1–K9).** Do zrobienia przed startem poziomu 3: przepisać `POZIOM_3_KROLESTWO.md` według decyzji niżej (zrobione 13.11: nagłówek z decyzjami; pełne przeliczenie kroków K1–K9 i szacunków robi Claude na początku K1). Wydanie 2.6.0 nadal wstrzymane.

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

## A. Drobne (źródło: `docs/menu_i_interfejs_propozycje.txt`; warunek ukończenia: zmiana + test + sprawdzenie w przeglądarce + CHANGELOG)

- [ ] **A1. Prawy przycisk = podgląd tylko przy trzymaniu.** Dziś okno dodatkowych informacji znika dopiero po kliknięciu gdzie indziej; ma znikać po puszczeniu przycisku. Na telefonie odpowiednik: przytrzymanie palca.
- [ ] **A2. Usunąć niepotrzebne podpowiedzi:** najechanie na portret bohatera w grze (kliknięcie lewym otwiera Kartę bohatera, prawym trzymanym pokazuje kartę), podpowiedzi ze statystykami nad portretami w menu wyboru frakcji i bohatera, podpowiedzi na kafelkach mapy świata (info tylko przez trzymanie prawego).
- [ ] **A3. Plecak bez limitu** (dziś 4 miejsca; skasować ograniczenie w silniku i UI, sprawdzić zapisy i serwer).

## B. Średnie


## C. Dalej (kolejność; **po zakończeniu A i B4, zgodnie z Q11**)

1. **Poziom 3 „Królestwo”** według decyzji z 13.11 (sekcja „Decyzje autora do poziomu 3” u góry); kroki K1–K9 z szkicu zostaną przeliczone po odpowiedziach (K3 odpada jako przebudowa na instancje; dochodzi: budynki do kupienia, 4 nowe jednostki na frakcję, widok osady z grafikami, nazwy osad, osady z narzuconą frakcją).
2. **Zakres premiery (decyzja 13.11):** premiera dopiero po poziomie 5; poziomy 3, 4 i 5 wchodzą przed pakowaniem na Steam. Do premiery nie wchodzą nowe frakcje, kampania ani Ekspedycja (Q9). Numer wydania premiery do ustalenia przy wydaniu (dawne „3.0” z 12.11 traci sens).
3. **Premiera na Steamie:** strona sklepu, zrzuty, trailer (wideo: Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri, do wyboru), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Wiele języków: przed premierą tylko inwentaryzacja tekstów.

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

**Q1–Q18 (13.11.2026) zostały rozstrzygnięte** (decyzje w „STAN” u góry). Nic nowego z nich nie czeka na autora oprócz akceptacji propozycji 8 nowych jednostek (przygotuje Claude przy K5).

- **Wydanie 2.6.0 i wdrożenie serwera** (B1; **wstrzymane decyzją autora 12.11: na razie bez release'u**, nie wydawać bez jego polecenia): zmiany są w commitach lokalnie (gra `05cba8e`, serwer `9b07989`); drugie wydanie wymaga zgody autora (tag, push `master`, wydanie na GitHubie, potem `npm install` pakietu silnika w serwerze, `make deploy`, push serwera).
- **Łatwy w wydaniu planszowym** (uzupełnienie do dawnego A8): w edycji planszowej Łatwy 1 na 1 daje 94/91/88/79% (powyżej pasma), a 2 na 2 na bardzo długiej mapie 61%. Dźwignie stroiciela działają tylko w grze cyfrowej, żeby plansza została „jak wydrukowana”. Czy stroić też planszową (zmieniałoby to wydrukowane zasady poziomu Łatwy), czy zostawić? Domyślnie: zostawiam.

## F. Do sprawdzenia na żywo (autor)

Wszystko zrobione i przetestowane, ale bez potwierdzenia w prawdziwej grze:
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
