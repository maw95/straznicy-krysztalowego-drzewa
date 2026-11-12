# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Szerszy plan wydania cyfrowego: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`.

**Jak z tego korzystać:** autor pisze „zrób punkty A2, A3, B1”, a Claude pracuje sam, aż skończy (warunek ukończenia stoi przy każdym punkcie). Kolejność, gdy autor każe zrobić „wszystko z listy”: A → B → C.

## Zasady pracy bez nadzoru (decyzje autora, 12.11.2026)
- Jeden punkt = jeden lub kilka commitów, każdy z wpisem w CHANGELOG.md i `make check` przed commitem; bez pushu gry. Zmiana AI albo liczb przesuwa `golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie.
- Grafiki i dźwięki: Claude robi je sam przez Scenario/ElevenLabs, ogląda/odsłuchuje, wybiera najlepsze, wrzuca do repo z wpisem w `assets.json` i commituje. Limit kosztu nie został podany: jeśli jeden punkt wymaga więcej niż ok. 30 generacji, Claude kończy to, co ma, i pyta.
- Gdy trzeba decyzji autora, Claude nie zgaduje: dopisuje pytanie do sekcji „Pytania czekające na autora” (na końcu), robi następny punkt i wraca do tamtego po odpowiedzi.
- Po skończeniu punktów: dźwięk `complete.oga`, krótkie podsumowanie po polsku, uwaga o `/clear`.

## A. Drobne (gotowe do zrobienia sam)


## B. Średnie

- [ ] **B1. Poziom „Własny” online** (decyzja 12.11: wszystkie przełączniki lokalnego Własnego: ułatwienia, utrudnienia, kość, dodatkowy bohater Hordy, tryb bitew arena/pojedynek, rozwój bohatera). Stolik online dostaje te same przyciski; serwer waliduje każdą wartość z listy dozwolonych (nie przyjmuje dowolnych pól zasad); wyniki gier Własnych nie liczą się do rankingu. Zmiany w silniku, w `src/online/`, `OnlineScreen.tsx` i backendzie (backend: commit, push, `make deploy` wolno robić bez pytania, ale dopiero po wydaniu silnika). Gotowe, gdy dwa przeglądarkowe konta zagrają partię Własną online (skrypt przeglądarkowy na osobnym porcie i bazie, nigdy na serwerach autora), a testy backendu to pokrywają.
- [ ] **B2. Szkic projektu poziomu 3 „Królestwo”** (osady, złoto, rekrutacja): Claude pisze `docs/POZIOM_3_KROLESTWO.md` (co nowego względem poziomu 2, złoto i osady, rekrutacja, cel gry, wpływ na boty i online, podział na kroki z szacunkiem pracy) i zatrzymuje się z listą pytań do autora. Kodu nie rusza, dopóki autor nie zaakceptuje szkicu.

## C. Dalej (kolejność; po akceptacji B2)

1. **Poziom 3 „Królestwo”** według zaakceptowanego szkicu (kroki z B2).
2. **Zakres premiery (decyzja 12.11):** poziomy 1–2 plus poziom 3; poziom 3 **przed** pakowaniem na Steam. **Premiera ma numer 3.0**, a numeracja 2.x zostaje bez zmian (zmiana wersjonowania skreślona).
3. **Premiera na Steamie:** strona sklepu, zrzuty, trailer (wideo: Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri, do wyboru), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Wiele języków: przed premierą tylko inwentaryzacja tekstów.

## D. Po premierze (w tej kolejności)

1. **Ekonomia** (poziomy 3–4): złoto + osady + rekrutacja, potem drewno, ruda, Gwiezdny Pył, budynki, cykl tygodniowy.
2. **Autopilot warstw** dla dzieci (wymaga ekonomii).
3. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Grafika idzie frakcjami (nowa frakcja = pełen zestaw naraz). Przed startem: próbka jednej jednostki w nowym stylu ze Scenario (trening modelu się skończył) i decyzja autora.
4. **Kampania fabularna** (mapy ręczne już są) i **wyprawa roguelike** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
5. **Poziom 5 „Legenda”:** magia, specjalności bohaterów; razem z nim **drzewka umiejętności bohatera** z rozgałęzieniami (dziś wspólna pula 6); poziom 4.
6. **Wiele języków** (polski i angielski: interfejs, dane jednostek i zasad, instrukcja, CHANGELOG, serwer) po poziomie 3.
7. Do 8 graczy (dziś 4; patrz `MECHANIKI_I_POZIOMY.md`), mechanika „cios od tyłu / z flanki” dla innych jednostek.

## E. Pomysły na później (Parking)

- **Pierwsza strona instrukcji planszowej:** imienna wiadomość od autora (pisze autor; decyzja 10.11: na razie się nie przejmujemy).
- Kąt kamery i wielkość figurek 3D do korekty po obejrzeniu na żywo (autor).

## Pytania czekające na autora

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
