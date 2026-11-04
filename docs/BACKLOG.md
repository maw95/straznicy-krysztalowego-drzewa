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

- [ ] **Obrażenia w momencie uderzenia animacji.** Dziś znacznik obrażeń, odjęcie życia i trafienie pojawiają się od razu po kliknięciu ataku,
  a smok dopiero potem dolatuje i atakuje. Projekt: (1) `SpriteLayer` wysyła zdarzenie „uderzenie” (np. `skd-impact` z id jednostki) w ok. 45%
  klipu ataku (albo od razu, gdy jednostka nie ma klipu); (2) w `BattleView` hook `useImpactHold(state)` przy ataku jednostki ze sprite'ami
  przytrzymuje poprzedni stan (`before`) do tego zdarzenia (awaryjnie do ok. 6 s) i przekazuje go jako stan do rysowania (obrażenia,
  paski, trup i `useBattleAnimations` liczą się wtedy dopiero po uderzeniu); w czasie przytrzymania `canAct` jest wyłączone;
  (3) sam klip ataku napastnika dostaje klucz z hooka (nie z `lastStrike`), żeby nie odtworzyć go dwa razy; (4) `useEndHold` (ostatni cios)
  też czeka na uderzenie, zanim pokaże stan końcowy z trupami. Pułapki: atak bez obrażeń (tarcza) nie tworzy dziś `strike`; ataki dystansowe;
  kolejne akcje botów w trakcie przytrzymania (zostają w kolejce, rysowanie skacze do najnowszego stanu po zwolnieniu).
- [ ] **Dwupolowe przeszkody pod skosem.** Silnik zna grupy sąsiednich pól (`WIDE_OBSTACLES`); wystarczy dopuścić drugą parę pól w rzędach
  sąsiednich (sąsiad „NE/SE” zamiast tego samego rzędu) i obrócić obraz (CSS `rotate` o ±30° albo osobne sprite'y). Skośna przeszkoda
  lepiej chroni przed strzelcami, bo zasłania linię strzału w poprzek rzędów. Potrzebne: test osiągalności pól i 2–3 skośne sprite'y.
