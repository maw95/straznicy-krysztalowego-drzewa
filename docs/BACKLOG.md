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
- [ ] Braki klipów: śmierć Ogra (sprawdzić, czy po ostatnich poprawkach nadal brak), atak Elfa i Cyklopa, trafienie Wilkołaka i Hydry
  (lista w raporcie nocnym); drobne wady: trupy na plecach głową w prawo, zryw zamiast uderzenia u Pegaza/Jednorożca/Gryfa.
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

1. [ ] Próbka efektów i muzyki z ElevenLabs (najpierw próbka, potem decyzja o planie).
2. [ ] Efekty: ciosy, śmierć, kroki, interfejs; muzyka: menu, mapa, bitwa. Wszystko do `assets.json` z licencją.

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

- [ ] Obrót jednostki: animacja zamiast przeskoku tekstury na lustrzane odbicie; jednostka zawsze zwrócona w stronę ruchu; kolejność ruch → obrót → atak (zgłoszenie: Złoty Smok okrążający wroga leciał tyłem).
- [ ] Hydra obraca się w prawo po otrzymaniu ciosu: obracać tylko w stronę własnego ruchu lub celu własnego ataku.
- [ ] Atak jednej jednostki i kolejny atak (np. hydry po ataku elfa) nie mogą nakładać się w czasie: kolejna akcja startuje po zakończeniu animacji poprzedniej, razem z animacją otrzymania obrażeń i śmierci.
- [ ] Koniec bitwy: ekran wyniku i wyszarzenie dopiero po skończeniu animacji ostatniego ataku i śmierci.
- [ ] Rozmiar Czarnego Smoka zbliżony do Złotego (dziś wyraźnie mniejszy).

### 8.2. Rozwój bohatera: czytelność (do zrobienia)

- [ ] Poziom i PD: czytelniejszy pasek (ile PD ma bohater, ile do następnego poziomu, za co dostał).
- [ ] Wybór umiejętności jako karty z ikonami i ozdobami, jak karty skarbów.
- [ ] Artefakty: opis, czym są i czym różnią się od skarbów; powiadomienie o zdobyciu (z nazwą i źródłem); ikony; widoczna lista na mapie świata.

### 8.3. Balans (z symulacji 9.11)

- Poza pasmem po przestrojeniu: Łatwy w przetrwaniu z rozwojem na długich mapach (ok. 53–63%), kilka komórek Łatwego o 1–3 punkty poniżej 70%, wyspy z rozwojem (Normalny 1 gracz na długich mapach ok. 33–35%), Kryształy na Dolinie w kooperacji (ok. 30%), Boss na Dolinie (ok. 40%).
- Czy przetrwanie ma być jedynym celem bez kryształów? Przy punktach kontrolnych, bossie i artefakcie strażnicy nadal pilnują kryształów, których nikt nie potrzebuje: do decyzji autora.
