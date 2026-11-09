# Backlog

Wydanie cyfrowe (nowe frakcje, tryby, animacje z AI) ma osobną listę: `MAPA_DROGOWA.md`. Tu zostają drobne rzeczy z rozwoju gry.

Uzgodnione pomysły do wdrożenia. Zrobione punkty są usuwane (zostają w historii gita i w CHANGELOG.md):
tryb online z menu i rankingiem, figurki 3D, szczegóły pod prawym przyciskiem, atak jednym kliknięciem,
porządki w kodzie (etapy 0–4 i resztki), wersja mobilna, zgłoszenia z 23.10 i 28.10, nowe materiały od autora z 28.10 (modele, portrety, znaczniki, wymiary), uwagi autora z 28.10 (druga tura).

## 2. Figurki 3D — drobne

- [x] Menu główne, panel po prawej: karta jednostki na górze, figurka pod nią i większa (300 px zamiast 230).
- Kąt kamery i wielkość figurek — do ewentualnej korekty po obejrzeniu na żywo.

## 3. Szczegóły pod prawym przyciskiem — drobne

- Obecne podglądy kart po najechaniu myszą — do przejrzenia; docelowo prawy przycisk może je zastąpić tam,
  gdzie zasłaniają planszę.

## 4. Do przemyślenia: zasady bitwy

Pytania autora — jeszcze bez decyzji. Zmiana zasad dotyczy też wersji papierowej: instrukcji,
notatek (`docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md`) i balansu, więc przed decyzją warto puścić symulacje
(`make sim-battles`, `make sim-tabele`) z wariantem w `SIM_OVERRIDE` / przełącznikiem zasad.

### 4.1. Czy strzelec może się ruszyć, a potem zaatakować?

**Pytanie:** czy po ruchu strzelec powinien tracić możliwość ataku?

**Dziś:** może i ruszyć się, i strzelić w tej samej aktywacji. Zasięg strzału jest nieograniczony (wystarczy
linia wzroku), a gdy obok stoi wróg, strzelec musi zaatakować sąsiada.

**Uwagi (Claude):**
- „Ruch albo strzał” mocno osłabia strzelców — przy nieograniczonym zasięgu ruch służy im głównie do ucieczki
  od sąsiada albo do wyjścia zza przeszkody. Strzelcy wygrywali kiedyś ok. 62% bitew (notatki, sekcja balansu),
  więc pewne osłabienie może być wskazane, ale ta zasada byłaby dużą zmianą.
- Łagodniejsze warianty: strzał po ruchu z karą (−1 A), albo „ruch o najwyżej 1–2 pola i strzał”, albo zakaz
  strzału tylko po ruchu dłuższym niż połowa Szybkości.
- Prosta do wytłumaczenia na planszy jest wersja „albo ruch, albo strzał”; reszta wymaga liczenia pól.
- Gra ma już podobny wyjątek (aktywacja „tylko ruch” z Rogu Strażników), więc w kodzie to niewielka zmiana:
  przełącznik w `RulesConfig`, jak inne zasady testowe.

### 4.2. Czy inne jednostki zasłaniają strzał?

**Pytanie:** czy strzelec może strzelać przez inne jednostki, czy jednostki działają jak przeszkody terenowe?

**Dziś:** zasłaniają tylko przeszkody. W silniku jest już gotowy przełącznik `unitsBlockSight`
(wyłączony) — po włączeniu jednostki zasłaniają tak jak przeszkody, a kursor pokaże przekreśloną strzałę.

**Uwagi (Claude):**
- Za: więcej taktyki (zasłanianie strzelca własnymi jednostkami, ustawianie się na linii strzału), naturalne
  dla gracza.
- Przeciw: silnie osłabia strzelców w ciasnych bitwach 3 na 3, a na zatłoczonej arenie strzał byłby często
  niemożliwy; trudniej to sprawdzić „na oko” na planszy papierowej.
- Wariant pośredni: zasłaniają tylko **wrogie** jednostki (własne nie), albo tylko jednostki duże (smoki, ogr,
  niedźwiedź, cyklop, hydra).
- Przełącznik już działa, więc najpierw symulacje: jak zmieni się % wygranych strzelców i długość bitew.

Uwaga przy wydaniach: serwer odrzuca nieznane typy akcji, więc wydanie gry z nowym typem akcji wymaga najpierw
wdrożenia serwera z nowym pakietem silnika.

## 5. Wersja planszowa (prośba autora z 28.10)

- [x] **5.1. Instrukcja aktualna i rozszerzona (ok. 40 stron).** Sprawdzić zgodność z zasadami
  (`NOTATKI_DLA_AGENTA_PLANSZOWKI.md`, `src/engine/data.ts`), dopisać m.in. instrukcję obrazkową podstawowych
  zasad „dla bardzo opornych”, przykładową rozgrywkę i bitwę krok po kroku, porady. *Zrobione 28.10: 40 stron.*
- [x] **5.2. Folder `docs/wersja planszowa/`.** Plan krok po kroku (co przygotować, w jakiej kolejności,
  wymiary, co kupić i gdzie — z linkami) oraz wszystkie pliki do druku: instrukcja PDF, karty, kafelki mapy,
  arena, tor rund, znaczniki, etykieta z logo na pudełko. Druk na zwykłej drukarce (papier fotograficzny),
  figurki i żetony z drukarki 3D (zlecone), instrukcja w segregatorze, pudełko z cienkich desek.
  *Zrobione 28.10: `docs/wersja_planszowa/PLAN_KROK_PO_KROKU.md`, PDF-y robi `make druk`.*
- [ ] **5.3. Pierwsza strona instrukcji: imienna wiadomość od autora dla gracza** — pisze autor sam
  (strona jest zostawiona pusta w szablonie).

## 5. Wydanie cyfrowe: uwagi autora z 5.11.2026 (do zrobienia)

Wdrożone tego samego dnia: brak okrągłego cienia pod jednostką, cienki pasek życia zamiast tabliczki, w trybie cyfrowym ruch bez ataku
kończy turę (strzelec nie ma „ruch + strzał”, strzelcy +1 do ataku; patrz `ZASADY_CYFROWE.md`, a strojenie +1 symulacjami zostaje do zrobienia).

- [x] **Obrażenia w momencie uderzenia animacji** (wdrożone 5.11): `SpriteLayer` zgłasza uderzenie w ok. 45% klipu ataku (`impact.ts`), `useImpactHold` (walka) i `useEndHold` (ostatni cios) trzymają stan sprzed ciosu do tego momentu (awaryjnie 6 s); obrażenia, paski, trafienie i śmierć pojawiają się wtedy. W czasie przytrzymania nie da się klikać. Atak bez obrażeń (tarcza) też się animuje (wykrywany po `rolls`).
- [x] **Dwupolowe przeszkody pod skosem** (wdrożone 5.11): na każdej arenie jedna dwupolowa przeszkoda leży na dwóch sąsiednich polach w różnych rzędach (łąka: ściana ruin; pole Hordy: barykada); obraz jest obrócony o ±30°. Test sprawdza sąsiedztwo pól.

## 6. Plan rozbudowy cyfrowej: kolejność prac (6.11.2026)

Zebrane z `MAPA_DROGOWA.md`, `ROZBUDOWA_CYFROWA.md`, `DECYZJE.md` i `RAPORT_NOCNY_5_11_2026.md`. Cel najbliższy: **premiera na poziomach 1–2**
(Przygoda + Wyprawa, hotseat, tryb rodzinny, Przymierze + Horda). Poziomy 3–5 i nowe frakcje to aktualizacje po premierze.
Zasada: każdy krok kończy się grywalną, przetestowaną wersją; `golden.test.ts` (klasyczny) bez zmian; nowe tryby dostają własne golden testy.

### 6.1. Najpierw: domknięcie tego, co rozgrzebane (małe, szybkie)

- [x] Strojenie „strzelcy +1 do ataku” w trybie cyfrowym: zrobione 5.11, wynik w `ZASADY_CYFROWE.md` („Strojenie wersji cyfrowej”); zostaje +1.
- [x] Braki klipów: sprawdzone 9.11, każda z 16 jednostek ma komplet klipów (atak, śmierć, trafienie, ruch).
- [ ] Drobne wady klipów (do obejrzenia przez autora): trupy na plecach głową w prawo, zryw zamiast uderzenia u Pegaza/Jednorożca/Gryfa.
- [x] Złoty Smok „w pełni zintegrowany”: silnik, boty, wybór ogona (najechanie + prawy przycisk) i rozstawienie dużych w UI działają; zostają tylko klipy z poprzedniego punktu.
- [x] Bot wybiera stronę ogona dużej jednostki taktycznie (`tailFor`, 5.11; bez wpływu na wyniki, zostaje).
- [~] Spis licencji obecnej muzyki: 10 utworów wpisanych do `assets.json` (6.11), ale **źródło, narzędzie i licencja są oznaczone „DO USTALENIA PRZEZ AUTORA”** — z plików da się odczytać tylko ślady Logic Pro / FL Studio. Autor musi uzupełnić, skąd pochodzi każdy utwór.
- [x] Decyzje 4.1 / 4.2: 4.1 rozstrzygnięte (ruch zastępuje strzał, strzelcy +1). 4.2: przełącznik `rules.unitsBlockSight` przywrócony i sprawdzony symulacją (6.11):
  arena cyfrowa 48,8% → 50,1% wygranych Przymierza (1620 partii, szum ±2,4) — bez wpływu na balans, więc **jednostki nie zasłaniają strzału** (prościej na planszy), wpis w `ZASADY_CYFROWE.md`.

### 6.2. Cele i mapy (faza C, poziom 2 „Wyprawa”) — główna oś pracy

Kolejność: od najtańszego do najdroższego, każdy cel razem z botami i symulacjami.

1. [x] **Cel „Przetrwanie X rund”** (6.11): `objectives.ts` (`survival`), fale Hordy co 2 rundy, boty, wybór w ekranie startu (tylko kooperacja), testy; wyniki i opis w `ZASADY_CYFROWE.md`. Do dostrojenia w 6.2.6: 2 graczy wygrywa 76–85%.
2. [x] **Generator map: prostokąt i pierścień** (6.11): `generateMap(size, rng, …, shape)`, wybór „Kształt mapy” w `SetupScreen`, `SIM_SHAPE=rectangle|ring` w symulacjach, strojenie skarbami startowymi (opis w `ZASADY_CYFROWE.md`). Poziomy Łatwy/Trudny na nowych kształtach nie były strojone osobno; serwer musi dostać nowy pakiet silnika przed wydaniem (nowe pole `mapShape`).
3. [x] **Cel „Boss”** (6.11): legowisko w środku mapy, rany zostają, wyścig o ostatni cios, boty, testy (opis i wyniki w `ZASADY_CYFROWE.md`). Wariant „kooperacyjny bez Hordy” — patrz „Do akceptacji autora”.
4. [x] **Cel „Artefakt”** (6.11): wyścig o Artefakt w środku mapy, niesiony do własnej bazy; boty, strojenie, testy (`ZASADY_CYFROWE.md`). Wariant „eskorta” zapisany w sekcji 7.
5. [x] **Generator: wyspy** (mosty; latania nie ma, więc skrótów nie ma) i **mapy ręczne z JSON** (`customMaps.ts`, dwie dołączone) — 6.11, opis i wyniki w `ZASADY_CYFROWE.md`. Mapa Dolina w kooperacji: 33% (do strojenia przy 6.2.6).
6. [x] Tabela balansu: Świt vs Horda per cel i kształt (`make sim-cele`, 6.11): w tabeli w `ZASADY_CYFROWE.md`; poza pasmem 45–65%: Kryształy na Dolinie (koop), Boss na Dolinie, Artefakt na wyspach (rywalizacja), Przetrwanie (do 69%).

### 6.3. Rozwój bohatera (poziom 2 „Wyprawa”) — równolegle z końcem 6.2

1. [x] Doświadczenie i poziomy bohaterów, wybór 1 z 3 umiejętności przy awansie (6.11): `growth.ts`, okno wyboru, panel bohatera, boty, testy, symulacje (opis w `ZASADY_CYFROWE.md`). Wspólna pula 6 umiejętności; osobne drzewka z rozgałęzieniami do rozbudowy.
2. [x] Artefakty bohatera (3 sloty × 2 poziomy), nagrody ze skrzyń, strażników i walk (6.11): `sites.ts`, opis i balans w `ZASADY_CYFROWE.md`.
3. [x] Więcej obiektów na mapie: kapliczki, obozy najemników, skrzynie (6.11); strażnicy bez kryształu (zwykli strażnicy z nagrodą) nie dodani, bo strażnicy kryształów już dają nagrodę.
4. [x] Symulacje balansu z rozwojem (6.11): `SIM_GROWTH=1`; wyniki w `ZASADY_CYFROWE.md` (tabela celów × kształtów z rozwojem mieści się w pasmach jak bez niego).

### 6.4. Tryb rodzinny i presety (faza D) — po 6.2 i 6.3, bo preset wymaga gotowych warstw

1. [x] Presety poziomów 1 i 2 jako zestawy przełączników (6.11): `presets.ts` (`resolveTier`), wybór „Poziom gry” w ekranie startu; poziom 1 = Kryształy + trójkąt + bez rozwoju (domyślny), poziom 2 = wybór celu i kształtu + rozwój bohatera, „Własne” = wszystko osobno.
2. [x] Hotseat sprawdzony (6.11): rywalizacja ma ekran przekazania i ukrywa skarby frakcji, kooperacja dzieli ekran bez ukrywania (skarby wspólne); nic do dopisania.
3. [x] Tryb rodzinny (6.11): pole „Dziecko” przy miejscu gracza, pomoc w bitwie i na mapie, przycisk „Podpowiedź” z botem (`ZASADY_CYFROWE.md`). Test z prawdziwymi parami rodzic + dziecko nadal po stronie autora.
4. [ ] (Po premierze, razem z ekonomią) autopilot warstw.

### 6.5. Dźwięk (niezależny, można w każdej chwili) — przed premierą

1. [x] Próbka efektów ze Scenario (ElevenLabs Sound Effects v3 i Music v2.5 przez Scenario), przesłuchana i poprawiona przez autora (9.11); muzyka z próbki odrzucona (obecna jest lepsza).
2. [~] Efekty podpięte (cios, strzał, czar, kroki, klik, skarb, awans, wygrana, przegrana; `ui/sfx.ts`, opcje: suwak „Efekty”). Śmierć jednostki bez dźwięku (decyzja autora). Zostają: dźwięki mapy przygody (krok bohatera), dźwięk kryształu i Drzewa, ewentualnie więcej wariantów ciosu.

### 6.6. Premiera na Steamie (faza E) — gdy 6.1–6.5 gotowe

- [ ] Ostateczne potwierdzenie zakresu premiery (autor).
- [ ] Osiągnięcia, strona sklepu, zrzuty i trailer (wideo: Higgsfield odłożony do tego momentu), ujawnienie użycia AI, przegląd licencji.
- [ ] Opakowanie komputerowe (Electron/Tauri — do wyboru), zapis profilu, chmura Steam.
- [ ] Test z parami rodzic + dziecko i przegląd konkurencji (odłożone przez autora).

### 6.7. Po premierze (aktualizacje, w tej kolejności)

1. [ ] **Etap 2: ekonomia** (poziomy 3–4): najpierw złoto + osady + rekrutacja (poziom 3 „Królestwo”), potem drewno, ruda, Gwiezdny Pył, budynki, cykl tygodniowy.
2. [ ] **Autopilot warstw** dla dzieci (wymaga ekonomii).
3. [ ] **Nowe frakcje**: Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par); potem DLC.
4. [ ] **Kampania fabularna** (wymaga map ręcznych z 6.2) i **wyprawa roguelike** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
5. [ ] **Poziom 5 „Legenda”**: magia, specjalności bohaterów.

### 6.8. Uwagi o kolejności

- Grafika frakcji idzie frakcjami (stare figurki i nowe grafiki nie mieszają się), więc nowa frakcja = pełen zestaw naraz; stąd frakcje dopiero po premierze.
- Trening własnego stylu w Scenario zakończył się (autor, 6.11.2026): model do sprawdzenia próbką (jedna jednostka nowej frakcji w stylu istniejących) i decyzji autora, zanim ruszą nowe frakcje; blokuje tylko je.
- Serwer: wydanie z nowym typem akcji wymaga najpierw wdrożenia backendu z nowym pakietem silnika (nowe cele, awanse i artefakty to nowe akcje).
- Kontrola kosztów balansu: każdy nowy cel i kształt mapy mnoży tabelę symulacji — trzymać symulacje poniżej 3 minut.

## 7. Do akceptacji autora (decyzje podjęte samodzielnie, można zmienić)

Sesja autonomiczna 6.11.2026. Każda pozycja: co wybrałem, dlaczego, gdzie to zmienić.

- **Muzyka — licencje:** w `assets.json` są pola „DO USTALENIA PRZEZ AUTORA” (źródło, narzędzie, licencja 10 utworów). Bez tego nie wydawać na Steamie.
- **Klipy 3D/2D:** braki z `RAPORT_NOCNY_5_11_2026.md` (atak Elfa i Cyklopa, zryw u Pegaza/Jednorożca/Gryfa) zostają: wymagają generowania i oceny na oko.
- **Zasłanianie strzału (4.2):** zostaje wyłączone (symulacja bez różnicy); przełącznik `rules.unitsBlockSight` jest w kodzie.
- **Przetrwanie:** 6/9/14/18 rund, fala co 2 rundy, tylko kooperacja; dla 2 graczy za łatwo (76–85%). Zmiana: `SURVIVAL` w `data.ts`.
- **Kształty mapy:** liczba pól prostokąta i pierścienia (`MAP_SHAPES`), mnożnik limitu rund (`SHAPE_ROUND_FACTOR`) i skarby startowe Przymierza na tych mapach (`DIGITAL_TUNING`, wpisy z `shape`) dobrane symulacjami. Poziomy Łatwy/Trudny nie były strojone osobno.
- **Boss:** Hydra albo Cyklop ze zwiększonym życiem, bez własnej grafiki (potrzebna, jeśli ma być wyróżniony); wariant „wszyscy przeciw Bossowi bez Hordy” nie jest zrobiony, bo obecny wyścig o ostatni cios ma już tryb kooperacyjny z automatem Hordy.
- **Artefakt:** zrobiony jako wyścig w obie strony (kto pierwszy zaniesie do swojej bazy). Wariant „eskorta” (Przymierze niesie Artefakt z bazy do Drzewa, Horda tylko poluje) pominąłem jako mało różny od wyścigu przy tych samych botach; do rozważenia po opinii z gry.
- **Rozwój bohatera:** progi PD, liczby PD, pula 6 umiejętności i ich siła (`growth.ts`) to moje pierwsze strzały; umiejętności nie mają jeszcze ikon ani kart. Rozwój zostaje domyślnie wyłączony do czasu presetów (6.4).
- **Obiekty mapy i artefakty:** medale zamiast grafiki (potrzebne ilustracje kapliczki, obozu, skrzyni oraz ikony 6 artefaktów); liczby artefaktów i liczba obiektów to pierwsze strzały.
- **Tryb rodzinny:** pomoc dla dziecka (+2 Ż w bitwie, +1 ruch) i podpowiedź z bota to pierwsze strzały; wartości w `FAMILY` (`data.ts`). Test z prawdziwymi rodzinami zostaje po Twojej stronie.
- **Serwer:** nowe pola ustawień (`mapShape`) i nowe cele (`survival`, `boss`) wymagają wdrożenia backendu z nowym pakietem silnika przed wydaniem gry.

### Czeka na autora (nie da się zrobić bez Ciebie)

- **Dźwięk (6.5):** ElevenLabs wymaga zalogowania (autoryzacja złącza MCP) i decyzji o planie; po zalogowaniu zrobię próbkę efektów i muzyki.
- **Muzyka:** źródła i licencje 10 utworów w `assets.json` (pola „DO USTALENIA PRZEZ AUTORA”).
- **Model stylu w Scenario:** trening się skończył; sprawdzić próbką (jedna jednostka nowej frakcji) i zdecydować, czy ruszają nowe frakcje po premierze (nie generowałem nic, żeby nie wydawać kredytów bez zgody).
- **Grafika:** klipy z listy braków, ilustracje obiektów mapy (kapliczka, obóz, skrzynia), ikony artefaktów, własny Boss.
- **Premiera na Steamie (6.6):** potwierdzenie zakresu, strona sklepu, osiągnięcia, opakowanie komputerowe; test z parami rodzic + dziecko.
- **Wdrożenie serwera:** przed wydaniem backend musi dostać nowy pakiet silnika (nowe pola `mapShape`, `customMapId`, `child`, nowe akcje `chooseSkill`, cele `survival`/`boss`/`artifact`).

## 8. Zgłoszenia z 9.11.2026 (partie testowe autora)

Zrobione (patrz CHANGELOG): Nocna Zasadzka dodaje +3 (i przestrojony balans), Leśny Tropiciel daje ruch od razu i pasek ruchu pokazuje wszystkie punkty,
karta strzelca pokazuje Atak z premią, wyspy z widoczną wodą, przetrwanie bez kryształów i bez kafelka Drzewa, samouczek zależny od celu.

### 8.1. Animacje bitwy (w toku; kolejność prac)

- [x] Obrót jednostki: zamiast przeskoku tekstury obrót (zwężenie obrazu, 240 ms, w kodzie); jednostka zawsze zwrócona w stronę ruchu i celu ataku; kolejność ruch → obrót → atak. Docelowo można dorobić prawdziwy klip obrotu (AI), kod obsłuży go jak inne klipy.
- [x] Hydra obracała się po ciosie, bo po każdej akcji jednostka wracała do domyślnego zwrotu; teraz zostaje zwrócona tak, jak ostatnio.
- [x] Atak i kolejny atak nakładały się, bo bot działał, gdy ekran jeszcze czekał na cios gracza (`animLock.ts`): akcje botów czekają na koniec animacji poprzedniej (cios, trafienie, śmierć, ruch). Online to samo załatwia kolejka stanów (`usePresentation.ts`): każdy stan od serwera jest pokazywany po kolei (sprawdzone testami; do obejrzenia w prawdziwej grze online).
- [x] Koniec bitwy: okno znalezionego skarbu i podsumowanie czekały tylko częściowo; teraz oba czekają, aż skończy się pokaz ostatniego ciosu i śmierci.
- [x] Rozmiar Czarnego Smoka zbliżony do Złotego (osobne pudełko w `sprites.ts`; do oceny na żywo).

### 8.2. Rozwój bohatera: czytelność (do zrobienia)

- [x] Poziom i PD: pasek pod portretem (poziom, PD, ile brakuje) i notka „+N PD (powód)” po każdym zdobyciu; wpis w dzienniku z powodem.
- [x] Wybór umiejętności jako karty z medalionem-ikoną i ramką (ikony z Scenario, 12 plików w `public/assets/ikony`).
- [x] Artefakty: karta przy zdobyciu (nazwa, miejsce, efekt, źródło, różnica wobec skarbów), ikony (medaliony wg miejsca, fiolet dla wyższego poziomu), trzy sloty widoczne pod portretem, opis w samouczku i w zasadach.

### 8.3. Balans (z symulacji 9.11)

- [x] Pasma autora: Łatwy 65–85%, Normalny 45–65%, Trudny 30–45% (wygrane Przymierza). Stroiciel automatyczny (`scripts/sim/tuneLevels.ts`) przestroił wszystkie kształty map, cele i ustawienia rozwoju. Po weryfikacji na 250 grach poza pasmem zostało 256 z 2400 komórek.
- Poza pasmem najwięcej: Boss (Trudny: według autora nie ruszamy), Kryształy na Cieśninie i Dolinie (10–14 z 40 komórek), Artefakt i Boss z rozwojem na wyspach. Do poprawy drugim przebiegiem stroiciela albo innymi dźwigniami.
- Kryształy strażników zniknęły we wszystkich celach poza „Kryształami” (9.11). Kafelek Drzewa jest zwykłym polem tylko w przetrwaniu.
- Drugi przebieg stroiciela (9.11, 200 gier na komórkę): komórki poza pasmem (OUT) — Dolina Kryształy 14→12 (bez rozwoju) i 12→10 (z rozwojem), Artefakt na wyspach 7→4 i 8→6, Boss na wyspach 6→3 i 7→4; Cieśnina Kryształy bez poprawy (pierwszy wynik zostawiony). Dźwignie stroiciela (skarby startowe, bohater Hordy) są za grube dla Kryształów koop 1 gracza (Normalny 21–42%) i Trudnego koop 2 graczy na najdłuższej mapie; potrzebna nowa dźwignia (np. liczba strażników albo kryształów).

## 9. Zgłoszenia z 9.11.2026, popołudnie (partia z ziarnem 4400)

Wcześniejsze zgłoszenia z tego dnia (rano) są w sekcji 8; zgłoszenie z 28.10 („żarcik astronaucik”) to żart, bez błędu.

- [x] **9.1. Szaman Goblinów: Atak na karcie ≠ Atak na arenie.** Przy wyborze pomocników karta pokazuje 1 A, na arenie jednostka ma 2 A (premia strzelca +1). Poprawka z 9.11 objęła karty w innych widokach (np. Elf Druid), ale nie ekran wyboru pomocników — sprawdzić, które widoki kart nadal biorą wartość wydrukowaną, i ujednolicić.
- [x] **9.2. Klikalność jednostek dwupolowych (błąd, wysoki priorytet — blokuje atak).** Wilkołak nie może zaatakować Złotego Smoka „centralnie od tyłu”: kursor nie zmienia się na miecz. Sprawdzić test trafienia (hit-testing) i wybór celu przy ataku z kierunku ogona dużej jednostki; odtworzyć na `?seed=4400` (partia z zgłoszenia, akcja 28).
- [x] **9.3. Martwy Wilkołak leży na 3 heksach i za wysoko.** Powinien zajmować 2 pola i leżeć niżej (rozmiar/pozycja klipu śmierci w `sprites.ts`, kotwica dla jednostek dużych).
- [ ] **9.4. Figurki 2D (do oceny autora, grafika):** Szaman Goblinów powinien być niski (gobliny są niskie); Nietoperz większy i groźniejszy; pozycja spoczynku Nietoperza wygląda jak lot — **decyzja autora 9.11: ma siedzieć** (potrzebna poza siedząca, grafika/klip).
- [x] **9.5. Zwycięstwo Hordy: dwa dźwięki naraz.** Po wygranej Hordy gra odpala nowy efekt „victory” i jednocześnie starą muzykę `horde-victory-the-fallen` (motyw `hordeVictory` w `music.ts`). Ma grać tylko efekt zwycięstwa (zgłoszenie autora 9.11, po południu). Sprawdzić też zwycięstwo Przymierza (`dawnVictory`) i porażkę.

## 10. Decyzje czekające na autora (stan 9.11.2026)

Osiem rzeczy, bez których nie ruszę dalej reszty backlogu. Kiedy autor zdecyduje, odpowiedź wpisać tu i odhaczyć.

- [ ] **10.1. Muzyka, licencje.** 10 utworów w `assets.json` ma pola „DO USTALENIA PRZEZ AUTORA” (źródło, narzędzie, licencja). Bez tego nie wydawać na Steamie. (Patrz 6.1, sekcja 7.)
- [ ] **10.2. Nowe frakcje po premierze.** Model stylu w Scenario jest wytrenowany. Czy generować próbkę jednej jednostki nowej frakcji (zużywa kredyty)? Od tego zależy 6.7.3.
- [ ] **10.3. Zakres premiery (6.6).** Czy zostajemy przy poziomach 1–2 (Przygoda i Wyprawa, hotseat, tryb rodzinny)?
- [ ] **10.4. Grafiki do zrobienia w Scenario.** Ilustracje kapliczki, obozu i skrzyni na mapie, własny Boss, klipy z listy braków (zryw Pegaza, Jednorożca i Gryfa; atak Elfa i Cyklopa), poza siedząca Nietoperza (9.4). Które i w jakiej kolejności?
- [ ] **10.5. Strojenie Kryształów, 1 gracz w kooperacji** (Normalny 21–42%). Potrzebna nowa dźwignia: liczba strażników, liczba kryształów, czy zostawić.
- [ ] **10.6. Przetrwanie dla 2 graczy** (76–85% wygranych). Zmniejszyć liczbę rund czy wzmocnić falę Hordy (`SURVIVAL` w `data.ts`)?
- [ ] **10.7. Boss.** Wariant „wszyscy przeciw Bossowi” bez Hordy i własna grafika Bossa: robić teraz czy po premierze?
- [ ] **10.8. Wiadomość od autora na pierwszej stronie instrukcji (5.3).** Pisze autor sam.

## 11. Zgłoszenia z 9.11.2026, wieczór (partie z ziarnami 114857 i 281360)

Pliki w `bug-reports/` są kumulatywne (każdy zawiera wszystkie wcześniejsze zgłoszenia partii), więc unikalnych uwag jest 17. Zgłoszenie z 28.10 („żarcik”) to żart.

### Błędy i mechanika
- [x] **11.1. Koniec bitwy: okna wyskakują przed animacją śmierci (zgłoszone dwa razy: 13:57 i 14:07).** Przyczyna: okno wyboru umiejętności (awans po zabiciu strażnika) i dźwięk awansu nie czekały na pokaz ostatniego ciosu, bo silnik jest już na mapie, a arena jeszcze pokazuje cios. Teraz czeka też okno umiejętności, dźwięk awansu i samouczek. Sprawdzone w przeglądarce na partii 114857, akcja 31: najpierw cios i martwy gryf, dopiero potem okna.
- [x] **11.2. Dziennik wyskakuje sam.** Podsumowanie „co się działo” na początku tury nie pokazuje się już w grze z samymi botami (przycisk „Dziennik” zostaje); zostaje w grze, gdzie przeciwnikiem jest drugi człowiek (hotseat/online).
- [x] **11.3. Tryb Boss: ikona kryształu przy legowisku.** Legowisko Bossa trzyma „kryształ” tylko technicznie; ikona i napis „Leży tu kryształ” znikają.
- [ ] **11.4. Błysk na zakrytych kafelkach (zdradza, gdzie leży skarb).** Nie odtworzone: w kodzie `glint` i `twinkle` są tylko dla odkrytych pól, na zrzucie z akcji 42 błyska tylko to, co odkryte. Prośba do autora: zrzut ekranu albo opis, który kafelek błyszczał (może pole świeżo odkryte przed obrotem kafelka).
- [ ] **11.5. Pegaz nie może zaatakować hydry** (partia 114857, akcja 60). Nie odtworzone: silnik daje pole podejścia 5,4, a w przeglądarce kliknięcie głowy hydry wykonuje atak. Hydra jest tam prawie całkiem zasłonięta przez Nimfę i Jednorożca (ogon pod Jednorożcem), więc gracz mógł klikać w zasłoniętą część. Do przemyślenia razem z autorem: klikalność jednostek zasłoniętych przez inne.
- [x] **11.6. Kursor zdolności.** Przy zdolności na sojuszniku (Dar Życia Nimfy itp.) kursor zmienia się na „czar”, tak jak miecz przy ataku, żeby było widać, że można kliknąć.
- [x] **11.7. Pegaz na dwóch heksach.** Wygląda śmiesznie mało obok Jednorożca; w wersji cyfrowej Pegaz ma `size: 2` (jak bohaterowie i strażnicy) i większe pudełko w `sprites.ts`. Wersja planszowa bez zmian. Symulacje (60 gier na komórkę) bez wyjątków, wyniki w pasmach; stroiciel nie ruszany.

### Rozwój i mapa
- [ ] **11.8. Poziomy 6–10 i nowe sloty artefaktów (hełm, zbroja).** Duża zmiana balansu (rozwój, stroiciel, złote partie testowe), do osobnej sesji; potrzebne decyzje autora o krzywej PD i bonusach (patrz 10).
- [ ] **11.9. Ładniejsze okrągłe ikony na kafelkach (gwiazdka, skrzynia, miecze) z Scenario.** Wymaga kredytów i akceptacji autora (10.4).

### Grafika i animacje (do ustalenia, Scenario)
- [ ] **11.10. Poza spoczynku:** Pegaz stoi na ziemi (bez rozłożonych skrzydeł), Czarny Smok stoi (nie leci); brakuje klipu lotu Pegaza.
- [x] **11.11. Animacja obrotu jednorożca jest płaska („kartka papieru”).** Obrót w kodzie: zwężenie tylko do połowy, podskok i przechył (300 ms). Prawdziwy klip obrotu (AI) nadal możliwy, kod obsłuży go jak inne klipy; do oceny autora na żywo.
- [ ] **11.12. Pająk:** animacja ataku wygląda dziwnie (podskok i machanie odnóżami), pająk ma być większy i groźniejszy.
- [ ] **11.13. Rzut Cyklopa:** ma rzucać wielkim kamieniem (nowy klip albo pocisk w kodzie).
