# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Szerszy plan wydania cyfrowego (fazy, premiera, po premierze): `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`.

Zasada: **jeden aktywny temat naraz.** Nowe pomysły autora trafiają do „Pomysłów na później” i nie przerywają bieżącego tematu. Temat kończy się commitem i wpisem tutaj; wtedy dobra chwila na `/clear`. Na początku sesji Claude mówi, który temat jest „Teraz”.

## 1. Teraz

**Wydanie z nowymi akcjami i zmianami z 12.11.** Backend działa już na silniku 2.4.0 (wdrożony 12.11, nowe akcje i cele przyjmuje). Zmiany Krakena (głowa strzela, Atak 2) i Pegaza (5 Ż, 3 A w wersji cyfrowej) wejdą do następnego wydania silnika; po nim backend znów dostanie nowy pakiet (`make deploy`), bo walki z Krakenem i Pegazem liczy też serwer.

## 2. Nowe uwagi autora i obserwacje

- [ ] **2.1. Prastary Niedźwiedź przegrywa z Krakenem w 0% nawet z dwoma pomocnikami** (`make sim-kraken`, `SIM_GROWN=1`; Złoty Smok 50–85%, Jednorożec 70–95%). Zabija dwie macki z trzech i ginie. Do zbadania: czy to słabość bota (ustawienie, wybór celu) czy zbyt twarde macki dla wolnego, bijącego wręcz bohatera.
- [ ] **2.2. Pegaz i Kraken: sprawdzić w prawdziwej grze** (autor), czy nowe liczby odpowiadają wrażeniom; stare uwagi z 12.11 (partia 236189) zostały zrealizowane.

## 3. Dalej (kolejność)

1. **Poziom 3 „Królestwo”** (osady, złoto, rekrutacja): osobny, duży projekt; wg decyzji 10.11 wchodzi do zakresu premiery razem z poziomami 1–2 (do zaprojektowania).
2. **Zakres premiery** (potwierdzić z autorem): poziomy 1–2 plus poziom 3.
3. **Premiera na Steamie:** strona sklepu, zrzuty, trailer (wideo: Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri, do wyboru), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji.

## 4. Po premierze (w tej kolejności)

1. **Ekonomia** (poziomy 3–4): złoto + osady + rekrutacja, potem drewno, ruda, Gwiezdny Pył, budynki, cykl tygodniowy.
2. **Autopilot warstw** dla dzieci (wymaga ekonomii).
3. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Grafika idzie frakcjami (nowa frakcja = pełen zestaw naraz). Przed startem: próbka jednej jednostki w nowym stylu ze Scenario (trening modelu się skończył) i decyzja autora.
4. **Kampania fabularna** (mapy ręczne już są) i **wyprawa roguelike** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
5. **Poziom 5 „Legenda”:** magia, specjalności bohaterów; poziom 4.
6. Do 8 graczy (dziś 4; patrz `MECHANIKI_I_POZIOMY.md`), mechanika „cios od tyłu / z flanki” dla innych jednostek.

## 5. Pomysły na później (Parking)

- **Obsługa wielu języków** (12.11; na start polski i angielski: interfejs, dane jednostek i zasad, instrukcja, CHANGELOG, serwer).
- **Alternatywne nazwy gry** (12.11): „Strażnicy Kryształowego Drzewa” nie brzmi zbyt chwytliwie; wymyślić kilka krótkich propozycji, dobrze brzmiących także po angielsku. Nazwa wpłynie na sklep, logo i tytuł w grze.
- **Analiza gry botów** (10.11): obejrzeć nagrane partie botów (`make zrzut`, symulacje, zgłoszenia), znaleźć głupie lub nieczytelne decyzje (ruch, wybór celu, rozstawienie, przedmioty, umiejętności, cele mapy), spisać poprawki i wdrażać pojedynczo. Każda zmiana AI przesuwa `golden.test.ts` i tabele balansu, więc osobny commit z `make sim-tabele`.
- **Zmiana wersjonowania** (10.11): dziś 2.4.0, a gra jest przed premierą; rozsądniej, by **1.0 była wersją gotową na premierę**. Do ustalenia: numeracja przed premierą (0.x?), co z tagami i wpisami CHANGELOG.md, `package.json`, „Co nowego”/`skd-last-version`, tagi GitHub Pages i serwera.
- **Pierwsza strona instrukcji planszowej:** imienna wiadomość od autora (pisze autor; decyzja 10.11: na razie się nie przejmujemy).
- **Poziom „Własne” online** (luźne przełączniki zasad są dziś tylko lokalnie): czy potrzebny?
- **Menu główne i podglądy kart:** podglądy kart po najechaniu myszą do przejrzenia; docelowo prawy przycisk może je zastąpić tam, gdzie zasłaniają planszę. Kąt kamery i wielkość figurek 3D do korekty po obejrzeniu na żywo.
- **Osobna grafika zamiast CSS** dla pola elektrycznego Króla Burzy i teleportu (dziś SVG + CSS), jeśli autor woli prawdziwy arkusz klatek ze Scenario.
- **Pożyczone obrazki strażników** dla części zdolności (`BORROWED_ART`, `BORROWED_ABILITY` w `src/ui/common.tsx`): własne ikony.
- **Dźwięki mapy przygody:** krok bohatera, kryształ i Drzewo; ewentualnie więcej wariantów ciosu (`ui/sfx.ts`).
- **Wariant celu „Artefakt” z eskortą** (Przymierze niesie Artefakt z bazy do Drzewa, Horda tylko poluje): pominięty jako mało różny od wyścigu; wrócić po opinii z gry.
- **Wskaźnik trudności walki** pokazać też w oknie potwierdzenia walki (dziś tylko w podpowiedzi pola na mapie); walka bohatera bez pomocników przeciw Krakenowi jest już sprawdzona (`make sim-kraken`).
- **Drzewka umiejętności bohatera** z rozgałęzieniami (dziś wspólna pula 6 umiejętności).

## 6. Do sprawdzenia na żywo (autor)

Wszystko zrobione i przetestowane, ale bez potwierdzenia w prawdziwej grze:
- Klikalność jednostek zasłoniętych przez inne (Pegaz kontra Hydra, partia 114857, akcja 60); poprawka 10.11 (`behind` w `ArenaBoard.tsx`) nie była sprawdzona na tej samej partii.
- Błysk zakrytych kafelków (zgłoszenie 9.11): poprawiony szew animacji mgły `fog-drift`; jeśli błyski wrócą, zrzut lub opis, który kafelek.
- Kursor ataku na wszystkich heksach jednostki (nagrania z 10.11 nie pokazywały kursora).
- Zwłoki: jeśli któreś nadal wydadzą się za małe, `CORPSE_MAX_W` w `sprites.ts`.
- Rzut Cyklopa: przy zabiciu celu animacja śmierci zaczyna się jeszcze przed lądowaniem kamienia.
- Kolejka stanów online (`usePresentation.ts`): sprawdzone testami, do obejrzenia w prawdziwej grze online.
- Rozmiar Czarnego Smoka, figurki Szamana, Nietoperza, Jednorożca; klipy ataku Elfa Druida, Goblina Szamana i Cyklopa (autor 12.11: klipy ok).

## 7. Balans: znane odchylenia

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciel: `scripts/sim/tuneLevels.ts`; tabele: `make sim-tabele`, `make sim-cele` (trzymać poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Stan z 12.11 (po sekcji uwag z tego dnia): Normalny w paśmie niemal wszędzie.
Poza pasmem (decyzja autora 10.11: zostawiamy, wracać tylko przy okazji):
- Kryształy na ręcznych mapach: Cieśnina i Dolina (koop 1 gracz Normalny 25–43%, 40 gier 31% na Dolinie).
- Koop 2 graczy, Normalny, bardzo długa mapa: 75%.
- Artefakt i Boss z rozwojem na wyspach; Boss Trudny (według autora nie ruszamy).
- Dźwignie stroiciela (skarby startowe, bohater Hordy) są za grube dla tych komórek; potrzebna nowa dźwignia (liczba strażników albo kryształów).

Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL` (rundy, fale), `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (pomoc dla dziecka, `data.ts`), liczby artefaktów i obiektów na mapie, liczby jednostek i bossów neutralnych, liczba spotkań na mapie, progi botów, progi wskaźnika trudności (`levelOfFight`).
