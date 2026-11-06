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
2. [ ] **Generator map: prostokąt** (`generateMap(shape, size, seed)`), potem **pierścień**. Wybór kształtu w `SetupScreen`; boty i symulacje na nowych kształtach.
3. [ ] **Cel „Boss”** (legowisko, wyścig o ostatni cios, potem wariant kooperacyjny).
4. [ ] **Cel „Artefakt / eskorta”**.
5. [ ] **Generator: wyspy** (mosty, latanie daje skróty) i **mapy ręczne z JSON** (potrzebne później kampanii).
6. [ ] Tabela balansu: Świt vs Horda per cel i kształt (`make sim-tabele`), pasma wygranych jak w poprzednim strojeniu.

### 6.3. Rozwój bohatera (poziom 2 „Wyprawa”) — równolegle z końcem 6.2

1. [ ] Doświadczenie i poziomy bohaterów (punkty za bitwy i skarby), wybór 1 z 3 umiejętności przy awansie (drzewka najpierw tylko dla Świtu i Hordy).
2. [ ] Artefakty (ekwipunek bohatera, sloty), nagrody ze skrzyń i strażników.
3. [ ] Więcej obiektów na mapie: kapliczki, obozy najemników, skrzynie, strażnicy.
4. [ ] Symulacje balansu z rozwojem (bohater poziom 1 vs awans), żeby nie zepsuć pasm wygranych.

### 6.4. Tryb rodzinny i presety (faza D) — po 6.2 i 6.3, bo preset wymaga gotowych warstw

1. [ ] Presety poziomów 1 i 2 jako zestawy przełączników w `RulesConfig` („Własne ustawienia” zostają).
2. [ ] Hotseat: sprawdzić, co już jest, dopisać przekazywanie ekranu, ukrywanie informacji między graczami.
3. [ ] Tryb rodzinny: rodzic + dziecko w jednej drużynie, handicapy, podpowiedzi dla młodszego gracza.
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
- Trening własnego stylu w Scenario (Pro) zostaje odłożony, dopóki nie ma 20–25 obrazów treningowych i decyzji o planie; blokuje tylko nowe frakcje.
- Serwer: wydanie z nowym typem akcji wymaga najpierw wdrożenia backendu z nowym pakietem silnika (nowe cele, awanse i artefakty to nowe akcje).
- Kontrola kosztów balansu: każdy nowy cel i kształt mapy mnoży tabelę symulacji — trzymać symulacje poniżej 3 minut.
