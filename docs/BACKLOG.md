# Backlog

Uzgodnione pomysły do wdrożenia. Zrobione punkty są usuwane (zostają w historii gita i w CHANGELOG.md):
tryb online z menu i rankingiem, figurki 3D, szczegóły pod prawym przyciskiem, atak jednym kliknięciem,
porządki w kodzie (etapy 0–4 i resztki), wersja mobilna, zgłoszenia z 23.10 i 28.10, nowe materiały od autora z 28.10 (modele, portrety, znaczniki, wymiary).

## 1. Uwagi autora (28.10, druga tura)

Szacunki kosztu to tokeny zużyte przez Claude w jednej sesji. Każdy punkt to osobny commit.

- [ ] **1.1. Bez poświaty wokół figurek.** *Koszt: ok. 15–25 tys.* Usunąć rozmytą poświatę w kolorze strony
  wokół podstawek (`src/ui/FigureLayer.tsx`, `aura`/glow) na mapie i na arenie. Nic w zamian. Sprawdzić, czy
  aktywna jednostka i cel nadal są czytelne (dziś wskazuje je właśnie poświata) — jeśli nie, zapytać autora.
- [ ] **1.2. Przeszkody na arenach nie wychodzą poza swoje pole.** *Koszt: ok. 50–90 tys.* Przykład błędu:
  `/home/maciek/Obrazy/blad_przeszkody.png` — rysunek przeszkody (kamienie, kwiaty) nachodzi na sąsiednie
  sześciokąty. Obie areny, Przymierza i Hordy (`docs/grafika/areny/*_przeszkody.png`, `scripts/assets/arenas.py`,
  `ARENA_OBSTACLES`). Przeszkody można obrócić, wydłużyć, zmniejszyć — byle każda mieściła się w swoim polu.
  Sprawdzić zrzutem całej areny (desktop i telefon).
- [ ] **1.3. Obwódki przeszkód: ciemnożółte na obu arenach.** *Koszt: ok. 10–20 tys.* Dziś ciemnoczerwone
  (Przymierze) i fioletowe (Horda); jeden kolor dla obu. Najlepiej razem z 1.2 (te same zrzuty).
- [ ] **1.4. Wolniejszy obrót figurek i ruch w dwóch fazach.** *Koszt: ok. 30–50 tys.* Tempo przesuwania
  zostaje. Obrót wolniejszy, a najpierw obrót, potem przesuwanie — nigdy oba naraz (`FigureLayer.tsx`: `turnTo`,
  `turnStart`, `moveStart`). Dotyczy też zwrotu do celu przed atakiem. Sprawdzić, czy dłuższa animacja nie
  opóźnia botów ani nie rozjeżdża się z `useBattleAnimations` (kolejne kroki nie mogą się nakładać).
- [ ] **1.5. Wszystkie figurki z nowych modeli, nowy układ figurek w instrukcji.** *Koszt: ok. 60–120 tys.*
  - Stare modele w grze i instrukcji: **Pegaz, Pająk Jaskiniowy, Hydra** (nowe nie upraszczają się poniżej
    11–15 MB, zob. punkt 2) i **Król Jednorożców** (`make modele` dał plik identyczny ze starym — sprawdzić, czy
    `przymierze_jednorozec.glb` to na pewno nowy model). Pozostałe 11 sprawdzić porównaniem z rzutem źródła.
    Spróbować uproszczenia, które ignoruje szwy UV (np. własny skrypt gltf-transform: weld z tolerancją,
    `simplify` z `lockBorder: false`, albo meshoptimizer „sloppy”), byle tekstury się nie rozjechały;
    w ostateczności poprosić autora o eksport ze scalonymi wierzchołkami. Potem `make figurki`.
  - Instrukcja (`scripts/assets/manual_build.py`, strony „Figurki”): w każdej frakcji nagłówek „Bohaterowie”
    i 3 większe figurki, pod nim „Pomocnicy” i 3 mniejsze. Strażnicy bez zmian. Sprawdzić, czy strony mieszczą
    się w ramce (pewnie Przymierze i Horda na osobnych stronach).
- [ ] **1.6. Karty strażników do pojedynku 1 na 1 (błękitny rewers).** *Koszt: ok. 120–200 tys.*
  - Autor dodał rewersy w `docs/grafika/karty/`: `rewers_straznicy_krysztalu.png` (granatowy — zwykli
    strażnicy) i `rewers_straznicy_krysztalu_latwy.png` (błękitny), a także rewersy frakcji i skarbów.
  - W wersji planszowej pojedynek na planszy (bez areny, `battle=board`, np. poziom Łatwy) to **3 osobne karty
    strażników** z błękitnym rewersem: mniej Życia (dziś gra liczy je jako `guardianDuelHpShare` 0,55 Życia,
    np. Hydra 21 → 12) i **inna zdolność**, przydatna w walce 1 na 1. Dzisiejsze zdolności (Miażdżący Głaz —
    odepchnięcie, Łupieżczy Nalot — odlot po ataku, Paszcze Otchłani — dwa cele) działają tylko na arenie.
  - Kroki: zaproponować 3 zdolności pojedynkowe (sprawdzić, jak działa pojedynek: `DuelView.tsx`, silnik),
    pokazać autorowi przed wdrożeniem; wdrożyć w silniku i na kartach w grze (karta pojedynkowa zamiast zwykłej
    w trybie bez areny); symulacje pojedynków (`make sim … BATTLE=board`, wszystkie poziomy) — ani za mocne,
    ani za słabe względem dzisiejszych wyników; zapisać decyzję w `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`.
    Zmiana wyników bitew zmieni test złotych partii — aktualizować świadomie i napisać to w commicie.
  - Instrukcja i szablon: rozdział 1 (karty jednostek: 15 + 3 karty strażników z błękitnym rewersem), opis
    strażników (rozdział 10) i pojedynku (rozdział 9), lista elementów i `WYMIARY_ELEMENTOW.md` (18 kart
    jednostek), rewersy kart w instrukcji, jeśli są pokazane.

## 2. Figurki 3D — drobne

- **Pegaz, Pająk Jaskiniowy i Hydra** (zob. 1.5) — nowe pliki z 26.10 mają tyle szwów UV, że upraszczanie stoi na ok. 14%
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
