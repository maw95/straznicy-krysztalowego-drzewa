# Backlog

Uzgodnione pomysły do wdrożenia. Zrobione punkty są usuwane (zostają w historii gita i w CHANGELOG.md):
tryb online z menu i rankingiem, figurki 3D, szczegóły pod prawym przyciskiem, atak jednym kliknięciem,
porządki w kodzie (etapy 0–4 i resztki), wersja mobilna, zgłoszenia z 23.10 i 28.10, nowe materiały od autora z 28.10 (modele, portrety, znaczniki, wymiary).

## 2. Figurki 3D — drobne

- **Pegaz, Pająk Jaskiniowy i Hydra** — nowe pliki z 26.10 mają tyle szwów UV, że upraszczanie stoi na ok. 14%
  trójkątów (11–15 MB po `make modele`), więc w grze zostały ich poprzednie wersje (1–2,2 MB). Lepiej byłoby
  wyeksportować je ze scalonymi wierzchołkami (jak nowego Goblina, który ma teraz 1 MB). Uwaga: `make modele`
  nadpisuje wszystkie 15 — po nim przywrócić te trzy z gita.
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
